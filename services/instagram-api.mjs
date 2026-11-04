/**
 * Instagram Meta Graph API Client for KMUTT Market
 * Handles official Instagram Business/Creator publishing and simulation mode.
 */

const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Test Instagram connection & fetch account details
 */
export async function testInstagramConnection({ accountId, accessToken }) {
  if (!accountId || !accessToken) {
    return {
      ok: false,
      error: "กรุณาระบุ Instagram Account ID และ Access Token ให้ครบถ้วน",
    };
  }

  try {
    const url = `${GRAPH_BASE_URL}/${accountId}?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${accessToken}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.error) {
      return {
        ok: false,
        error: data.error?.message || "ไม่สามารถเชื่อมต่อ Instagram Graph API ได้",
        metaError: data.error,
      };
    }

    return {
      ok: true,
      account: {
        id: data.id,
        username: data.username,
        name: data.name,
        profilePictureUrl: data.profile_picture_url,
        followersCount: data.followers_count,
        mediaCount: data.media_count,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: `ข้อผิดพลาดในการเชื่อมต่อเครือข่าย: ${err.message}`,
    };
  }
}

/**
 * Publish photo + caption to Instagram Business/Creator Account
 */
export async function publishToInstagram({
  accountId,
  accessToken,
  imageUrl,
  caption,
  isSimulation = false,
}) {
  // If simulation mode or missing keys, perform verified simulation
  if (isSimulation || !accountId || !accessToken) {
    const simulatedId = `sim_ig_${Date.now()}`;
    return {
      ok: true,
      mode: "simulation",
      id: simulatedId,
      permalink: `https://www.instagram.com/p/${simulatedId}/`,
      message: "โพสต์จำลองสำเร็จ (โหมด Simulation/Sandbox บันทึกข้อมูลและพรีวิวเรียบร้อย)",
      publishedAt: new Date().toISOString(),
      imageUrl,
      caption,
    };
  }

  // Validate that image URL is not localhost (Meta requires public HTTPS/HTTP URL)
  if (
    imageUrl.includes("localhost") ||
    imageUrl.includes("127.0.0.1") ||
    imageUrl.startsWith("/")
  ) {
    return {
      ok: false,
      error:
        "Meta Instagram Graph API ต้องใช้ URL รูปภาพที่เข้าถึงได้จากอินเทอร์เน็ตสาธารณะ (Public URL เช่น https://... หรือผ่าน ngrok/Cloudflare Tunnel)\n" +
        "รูปภาพปัจจุบันเป็น URL ภายในเครื่อง: " +
        imageUrl +
        "\n💡 คุณสามารถสลับเป็น 'โหมดจำลอง (Simulation Mode)' หรือใช้ ngrok เชื่อมต่อเพื่อโพสจริงได้ทันที",
    };
  }

  try {
    // Step 1: Create Media Container
    const createContainerUrl = `${GRAPH_BASE_URL}/${accountId}/media`;
    const createRes = await fetch(createContainerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken,
      }),
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData.id) {
      return {
        ok: false,
        error: createData.error?.message || "ไม่สามารถสร้าง Media Container บน Instagram ได้",
        metaError: createData.error,
      };
    }

    const creationId = createData.id;

    // Step 2: Poll Container Status (wait up to 20s for processing)
    let isReady = false;
    let attempts = 0;
    while (!isReady && attempts < 10) {
      await new Promise((r) => setTimeout(r, 2000));
      attempts++;

      const statusRes = await fetch(
        `${GRAPH_BASE_URL}/${creationId}?fields=status_code&access_token=${accessToken}`
      );
      const statusData = await statusRes.json();

      if (statusData.status_code === "FINISHED") {
        isReady = true;
      } else if (statusData.status_code === "ERROR") {
        return {
          ok: false,
          error: "Instagram ประมวลผลรูปภาพล้มเหลว (Status: ERROR)",
          metaError: statusData,
        };
      }
    }

    // Step 3: Publish Media Container
    const publishUrl = `${GRAPH_BASE_URL}/${accountId}/media_publish`;
    const publishRes = await fetch(publishUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    });

    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.id) {
      return {
        ok: false,
        error: publishData.error?.message || "ไม่สามารถเผยแพร่โพสต์บน Instagram ได้",
        metaError: publishData.error,
      };
    }

    const publishedMediaId = publishData.id;

    // Step 4: Fetch published post permalink
    let permalink = `https://www.instagram.com/`;
    try {
      const mediaInfoRes = await fetch(
        `${GRAPH_BASE_URL}/${publishedMediaId}?fields=permalink,timestamp&access_token=${accessToken}`
      );
      if (mediaInfoRes.ok) {
        const mediaInfo = await mediaInfoRes.json();
        if (mediaInfo.permalink) {
          permalink = mediaInfo.permalink;
        }
      }
    } catch {
      // ignore permalink lookup error
    }

    return {
      ok: true,
      mode: "live",
      id: publishedMediaId,
      permalink,
      message: "เผยแพร่โพสต์ไปยัง Instagram สำเร็จเรียบร้อยแล้ว!",
      publishedAt: new Date().toISOString(),
      imageUrl,
      caption,
    };
  } catch (err) {
    return {
      ok: false,
      error: `เกิดข้อผิดพลาดในการเรียกใช้ Instagram API: ${err.message}`,
    };
  }
}
