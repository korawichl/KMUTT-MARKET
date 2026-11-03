"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  DatabaseState,
  Profile,
  Shop,
  Product,
  Category,
  ShopSchedule,
  MarketEvent,
  MarketStall,
  Review,
  Announcement,
  MarketFeeConfig,
  UserRole,
} from "@/types/database";
import { INITIAL_DATABASE_STATE } from "@/lib/initial-data";
import { slugify } from "@/lib/utils";

export interface ToastItem {
  id: string;
  title: string;
  type: "success" | "error" | "info";
}

interface MarketContextValue {
  db: DatabaseState;
  isLoaded: boolean;
  currentUser: Profile | null;
  favoriteShopIds: string[];
  toasts: ToastItem[];
  isCravingPickerOpen: boolean;
  setIsCravingPickerOpen: (open: boolean) => void;
  showToast: (title: string, type?: ToastItem["type"]) => void;
  dismissToast: (id: string) => void;
  toggleFavorite: (shopId: string) => void;
  switchDemoRole: (role: UserRole | "guest") => void;
  loginWithEmail: (email: string, fullName?: string, role?: UserRole) => void;
  logout: () => void;
  upsertShop: (shop: Partial<Shop> & { name: string; category_id: string }) => Shop;
  deleteShop: (shopId: string) => void;
  upsertProduct: (
    product: Partial<Product> & { shop_id: string; name: string; category_id: string }
  ) => Product;
  deleteProduct: (productId: string) => void;
  upsertCategory: (cat: Partial<Category> & { name: string }) => Category;
  deleteCategory: (categoryId: string) => void;
  updateShopSchedules: (shopId: string, schedules: Omit<ShopSchedule, "id" | "shop_id">[]) => void;
  upsertMarketEvent: (evt: Partial<MarketEvent> & { name: string }) => void;
  deleteMarketEvent: (eventId: string) => void;
  assignShopToStall: (stallId: string, shopId: string | null, verified?: boolean) => void;
  submitOrUpdateReview: (shopId: string, rating: number, comment: string) => { ok: boolean; message: string };
  reportReview: (reviewId: string, reason: string) => void;
  moderateReview: (reviewId: string, status: Review["status"]) => void;
  upsertAnnouncement: (ann: Partial<Announcement> & { title: string; content: string }) => void;
  updateMarketConfig: (cfg: Partial<MarketFeeConfig>) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  resetDemoData: () => Promise<void>;
}

const MarketContext = createContext<MarketContextValue | null>(null);

const LOCAL_FAV_KEY = "kmutt_market_favorites_v1";
const LOCAL_USER_KEY = "kmutt_market_current_user_v1";
const LOCAL_DB_CACHE_KEY = "kmutt_market_db_cache_v1";

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DatabaseState>(INITIAL_DATABASE_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [favoriteShopIds, setFavoriteShopIds] = useState<string[]>([
    "shop-s11-01",
    "shop-s14-03",
  ]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isCravingPickerOpen, setIsCravingPickerOpen] = useState(false);

  const showToast = useCallback(
    (title: string, type: ToastItem["type"] = "success") => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load initial state from API + localStorage
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem(LOCAL_FAV_KEY);
      if (savedFavs) {
        setFavoriteShopIds(JSON.parse(savedFavs));
      }
      const savedUser = localStorage.getItem(LOCAL_USER_KEY);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
      const cachedDb = localStorage.getItem(LOCAL_DB_CACHE_KEY);
      if (cachedDb) {
        const parsed = JSON.parse(cachedDb) as DatabaseState;
        if (parsed?.shops?.length) {
          setDb(parsed);
        }
      }
    } catch {
      // ignore storage errors
    }

    fetch("/api/market-data")
      .then((res) => res.json())
      .then((serverData: DatabaseState) => {
        if (serverData?.shops?.length) {
          setDb(serverData);
          try {
            localStorage.setItem(LOCAL_DB_CACHE_KEY, JSON.stringify(serverData));
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // Fallback already loaded
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  const persistState = useCallback((updater: (prev: DatabaseState) => DatabaseState) => {
    setDb((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(LOCAL_DB_CACHE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      fetch("/api/market-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: next }),
      }).catch(() => {});
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(
    (shopId: string) => {
      const shop = db.shops.find((s) => s.id === shopId);
      setFavoriteShopIds((prev) => {
        const exists = prev.includes(shopId);
        const next = exists ? prev.filter((id) => id !== shopId) : [...prev, shopId];
        try {
          localStorage.setItem(LOCAL_FAV_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        showToast(
          exists
            ? `นำ "${shop?.name || "ร้านค้า"}" ออกจากร้านโปรดแล้ว`
            : `บันทึก "${shop?.name || "ร้านค้า"}" ลงในร้านโปรดแล้ว`,
          exists ? "info" : "success"
        );
        return next;
      });
    },
    [db.shops, showToast]
  );

  const switchDemoRole = useCallback(
    (role: UserRole | "guest") => {
      if (role === "guest") {
        setCurrentUser(null);
        try {
          localStorage.removeItem(LOCAL_USER_KEY);
        } catch {}
        showToast("สลับเป็นโหมดผู้เยี่ยมชมทั่วไป (ไม่ต้องล็อกอิน)", "info");
        return;
      }

      const targetProfile =
        db.profiles.find((p) => p.role === role) ||
        INITIAL_DATABASE_STATE.profiles.find((p) => p.role === role) ||
        null;

      if (targetProfile) {
        setCurrentUser(targetProfile);
        try {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(targetProfile));
        } catch {}
        const roleName =
          role === "admin"
            ? "ผู้ดูแลระบบ (Admin)"
            : role === "vendor"
            ? "เจ้าของร้านค้า (Vendor)"
            : "นักศึกษา (Student)";
        showToast(`เข้าสู่ระบบในฐานะ: ${targetProfile.full_name} [${roleName}]`, "success");
      }
    },
    [db.profiles, showToast]
  );

  const loginWithEmail = useCallback(
    (email: string, fullName?: string, role: UserRole = "student") => {
      const cleanEmail = email.trim().toLowerCase();
      const existing = db.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
      if (existing) {
        setCurrentUser(existing);
        try {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(existing));
        } catch {}
        showToast(`ยินดีต้อนรับกลับมา คุณ ${existing.full_name}`, "success");
        return;
      }

      const newUser: Profile = {
        id: `user-${Date.now()}`,
        full_name: fullName?.trim() || cleanEmail.split("@")[0],
        email: cleanEmail,
        avatar_url: null,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      persistState((prev) => ({
        ...prev,
        profiles: [...prev.profiles, newUser],
        activity_logs: [
          {
            id: `log-${Date.now()}`,
            user_id: newUser.id,
            user_name: newUser.full_name,
            action: "USER_REGISTER",
            entity_type: "profile",
            entity_id: newUser.id,
            details: { email: newUser.email, role: newUser.role },
            created_at: new Date().toISOString(),
          },
          ...prev.activity_logs,
        ],
      }));

      setCurrentUser(newUser);
      try {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));
      } catch {}
      showToast(`สมัครสมาชิกและเข้าสู่ระบบสำเร็จ: ${newUser.full_name}`, "success");
    },
    [db.profiles, persistState, showToast]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(LOCAL_USER_KEY);
    } catch {}
    showToast("ออกจากระบบเรียบร้อยแล้ว", "info");
  }, [showToast]);

  const upsertShop = useCallback(
    (shopInput: Partial<Shop> & { name: string; category_id: string }): Shop => {
      const now = new Date().toISOString();
      const isEditing = Boolean(shopInput.id);
      const id = shopInput.id || `shop-${Date.now()}`;
      const slug =
        shopInput.slug || `${slugify(shopInput.name)}-${id.slice(-4)}`;

      let savedShop!: Shop;

      persistState((prev) => {
        const existing = prev.shops.find((s) => s.id === id);
        savedShop = {
          id,
          name: shopInput.name,
          slug,
          description: shopInput.description ?? existing?.description ?? "",
          logo_url:
            shopInput.logo_url ||
            existing?.logo_url ||
            "https://bpuu.kmutt.ac.th/wp-content/uploads/2024/03/371126.jpg",
          cover_image_url:
            shopInput.cover_image_url ||
            existing?.cover_image_url ||
            "https://bpuu.kmutt.ac.th/wp-content/uploads/2024/03/371126.jpg",
          category_id: shopInput.category_id,
          shop_type: shopInput.shop_type ?? existing?.shop_type ?? "market_stall",
          market_type: shopInput.market_type ?? existing?.market_type ?? "all_market_days",
          building_name:
            shopInput.building_name ??
            existing?.building_name ??
            "ลานตลาดนัด มจธ. (ชั้น 1 อาคารจอดรถ S2)",
          location_description:
            shopInput.location_description ??
            existing?.location_description ??
            "ลานชั้น 1 อาคารจอดรถ S2",
          stall_number: shopInput.stall_number ?? existing?.stall_number ?? null,
          latitude: shopInput.latitude ?? existing?.latitude ?? 13.65048,
          longitude: shopInput.longitude ?? existing?.longitude ?? 100.49565,
          contact_phone: shopInput.contact_phone ?? existing?.contact_phone ?? null,
          social_url: shopInput.social_url ?? existing?.social_url ?? null,
          status: shopInput.status ?? existing?.status ?? "active",
          verification_status:
            shopInput.verification_status ?? existing?.verification_status ?? "verified",
          owner_id: shopInput.owner_id ?? existing?.owner_id ?? currentUser?.id ?? null,
          tags: shopInput.tags ?? existing?.tags ?? ["ร้านค้าใน มจธ."],
          price_range: shopInput.price_range ?? existing?.price_range ?? "฿",
          is_recommended: shopInput.is_recommended ?? existing?.is_recommended ?? false,
          location_verified:
            shopInput.location_verified ?? existing?.location_verified ?? false,
          created_at: existing?.created_at || now,
          updated_at: now,
        };

        const nextShops = existing
          ? prev.shops.map((s) => (s.id === id ? savedShop : s))
          : [savedShop, ...prev.shops];

        const nextSchedules = existing
          ? prev.shop_schedules
          : [
              ...prev.shop_schedules,
              ...[2, 3, 4].map((day) => ({
                id: `sched-${id}-${day}`,
                shop_id: id,
                day_of_week: day,
                open_time: "07:00",
                close_time: "17:00",
                is_open: true,
              })),
            ];

        return {
          ...prev,
          shops: nextShops,
          shop_schedules: nextSchedules,
          activity_logs: [
            {
              id: `log-${Date.now()}`,
              user_id: currentUser?.id || "system",
              user_name: currentUser?.full_name || "ผู้ใช้งานระบบ",
              action: isEditing ? "UPDATE_SHOP" : "CREATE_SHOP",
              entity_type: "shop",
              entity_id: id,
              details: { name: savedShop.name, status: savedShop.status },
              created_at: now,
            },
            ...prev.activity_logs,
          ],
        };
      });

      showToast(
        isEditing
          ? `บันทึกข้อมูลร้าน "${shopInput.name}" เรียบร้อยแล้ว`
          : `เพิ่มร้านค้าใหม่ "${shopInput.name}" เรียบร้อยแล้ว`,
        "success"
      );
      return savedShop;
    },
    [currentUser, persistState, showToast]
  );

  const deleteShop = useCallback(
    (shopId: string) => {
      const target = db.shops.find((s) => s.id === shopId);
      persistState((prev) => ({
        ...prev,
        shops: prev.shops.filter((s) => s.id !== shopId),
        products: prev.products.filter((p) => p.shop_id !== shopId),
        shop_schedules: prev.shop_schedules.filter((s) => s.shop_id !== shopId),
        activity_logs: [
          {
            id: `log-${Date.now()}`,
            user_id: currentUser?.id || "system",
            user_name: currentUser?.full_name || "ผู้ดูแลระบบ",
            action: "DELETE_SHOP",
            entity_type: "shop",
            entity_id: shopId,
            details: { name: target?.name },
            created_at: new Date().toISOString(),
          },
          ...prev.activity_logs,
        ],
      }));
      showToast(`ลบร้านค้า "${target?.name || shopId}" เรียบร้อยแล้ว`, "info");
    },
    [currentUser, db.shops, persistState, showToast]
  );

  const upsertProduct = useCallback(
    (
      prodInput: Partial<Product> & {
        shop_id: string;
        name: string;
        category_id: string;
      }
    ): Product => {
      const now = new Date().toISOString();
      const isEditing = Boolean(prodInput.id);
      const id = prodInput.id || `prod-${Date.now()}`;
      const slug =
        prodInput.slug || `${slugify(prodInput.name)}-${id.slice(-4)}`;

      let savedProduct!: Product;

      persistState((prev) => {
        const existing = prev.products.find((p) => p.id === id);
        savedProduct = {
          id,
          shop_id: prodInput.shop_id,
          category_id: prodInput.category_id,
          name: prodInput.name,
          slug,
          description: prodInput.description ?? existing?.description ?? "",
          image_url:
            prodInput.image_url ||
            existing?.image_url ||
            "https://bpuu.kmutt.ac.th/wp-content/uploads/2023/09/DSC_4440.jpg",
          price:
            prodInput.price === undefined
              ? existing?.price ?? null
              : prodInput.price,
          is_available: prodInput.is_available ?? existing?.is_available ?? true,
          is_recommended:
            prodInput.is_recommended ?? existing?.is_recommended ?? false,
          tags: prodInput.tags ?? existing?.tags ?? [],
          created_at: existing?.created_at || now,
          updated_at: now,
        };

        const nextProducts = existing
          ? prev.products.map((p) => (p.id === id ? savedProduct : p))
          : [savedProduct, ...prev.products];

        return {
          ...prev,
          products: nextProducts,
          activity_logs: [
            {
              id: `log-${Date.now()}`,
              user_id: currentUser?.id || "system",
              user_name: currentUser?.full_name || "เจ้าของร้าน/แอดมิน",
              action: isEditing ? "UPDATE_PRODUCT" : "CREATE_PRODUCT",
              entity_type: "product",
              entity_id: id,
              details: { name: savedProduct.name, price: savedProduct.price },
              created_at: now,
            },
            ...prev.activity_logs,
          ],
        };
      });

      showToast(
        isEditing
          ? `อัปเดตเมนู "${prodInput.name}" เรียบร้อยแล้ว`
          : `เพิ่มเมนูใหม่ "${prodInput.name}" เรียบร้อยแล้ว`,
        "success"
      );
      return savedProduct;
    },
    [currentUser, persistState, showToast]
  );

  const deleteProduct = useCallback(
    (productId: string) => {
      const target = db.products.find((p) => p.id === productId);
      persistState((prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.id !== productId),
        activity_logs: [
          {
            id: `log-${Date.now()}`,
            user_id: currentUser?.id || "system",
            user_name: currentUser?.full_name || "ผู้ดูแลระบบ",
            action: "DELETE_PRODUCT",
            entity_type: "product",
            entity_id: productId,
            details: { name: target?.name },
            created_at: new Date().toISOString(),
          },
          ...prev.activity_logs,
        ],
      }));
      showToast(`ลบเมนู "${target?.name || productId}" เรียบร้อยแล้ว`, "info");
    },
    [currentUser, db.products, persistState, showToast]
  );

  const upsertCategory = useCallback(
    (catInput: Partial<Category> & { name: string }): Category => {
      const id = catInput.id || `cat-${Date.now()}`;
      let savedCat!: Category;
      persistState((prev) => {
        const existing = prev.categories.find((c) => c.id === id);
        savedCat = {
          id,
          name: catInput.name,
          slug: catInput.slug || existing?.slug || slugify(catInput.name),
          description: catInput.description ?? existing?.description ?? "",
          icon: catInput.icon ?? existing?.icon ?? "Utensils",
          image_url:
            catInput.image_url ||
            existing?.image_url ||
            "https://bpuu.kmutt.ac.th/wp-content/uploads/2019/07/DSC_4676.jpg",
          sort_order:
            catInput.sort_order ?? existing?.sort_order ?? prev.categories.length + 1,
          is_active: catInput.is_active ?? existing?.is_active ?? true,
        };
        const nextCats = existing
          ? prev.categories.map((c) => (c.id === id ? savedCat : c))
          : [...prev.categories, savedCat];
        return { ...prev, categories: nextCats };
      });
      showToast(`บันทึกหมวดหมู่ "${catInput.name}" เรียบร้อยแล้ว`, "success");
      return savedCat;
    },
    [persistState, showToast]
  );

  const deleteCategory = useCallback(
    (categoryId: string) => {
      persistState((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== categoryId),
      }));
      showToast("ลบหมวดหมู่เรียบร้อยแล้ว", "info");
    },
    [persistState, showToast]
  );

  const updateShopSchedules = useCallback(
    (shopId: string, schedules: Omit<ShopSchedule, "id" | "shop_id">[]) => {
      persistState((prev) => {
        const others = prev.shop_schedules.filter((s) => s.shop_id !== shopId);
        const added: ShopSchedule[] = schedules.map((s) => ({
          id: `sched-${shopId}-${s.day_of_week}`,
          shop_id: shopId,
          day_of_week: s.day_of_week,
          open_time: s.open_time,
          close_time: s.close_time,
          is_open: s.is_open,
        }));
        return {
          ...prev,
          shop_schedules: [...others, ...added],
          activity_logs: [
            {
              id: `log-${Date.now()}`,
              user_id: currentUser?.id || "system",
              user_name: currentUser?.full_name || "เจ้าของร้าน",
              action: "UPDATE_SHOP_SCHEDULE",
              entity_type: "shop_schedule",
              entity_id: shopId,
              details: { daysUpdated: added.filter((a) => a.is_open).length },
              created_at: new Date().toISOString(),
            },
            ...prev.activity_logs,
          ],
        };
      });
      showToast("บันทึกตารางเวลาเปิด-ปิดร้านเรียบร้อยแล้ว", "success");
    },
    [currentUser, persistState, showToast]
  );

  const upsertMarketEvent = useCallback(
    (evtInput: Partial<MarketEvent> & { name: string }) => {
      const id = evtInput.id || `mkt-evt-${Date.now()}`;
      persistState((prev) => {
        const existing = prev.market_events.find((e) => e.id === id);
        const saved: MarketEvent = {
          id,
          name: evtInput.name,
          market_type: evtInput.market_type ?? existing?.market_type ?? "special",
          day_of_week: evtInput.day_of_week ?? existing?.day_of_week ?? null,
          event_date: evtInput.event_date ?? existing?.event_date ?? null,
          start_time: evtInput.start_time ?? existing?.start_time ?? "07:00",
          end_time: evtInput.end_time ?? existing?.end_time ?? "17:00",
          setup_time: evtInput.setup_time ?? existing?.setup_time ?? "05:30",
          location:
            evtInput.location ??
            existing?.location ??
            "ลานชั้น 1 อาคารจอดรถ 14 ชั้น (S2) มจธ. บางมด",
          description: evtInput.description ?? existing?.description ?? "",
          status: evtInput.status ?? existing?.status ?? "active",
        };
        const nextEvents = existing
          ? prev.market_events.map((e) => (e.id === id ? saved : e))
          : [...prev.market_events, saved];
        return { ...prev, market_events: nextEvents };
      });
      showToast(`อัปเดตตารางตลาดนัด "${evtInput.name}" เรียบร้อยแล้ว`, "success");
    },
    [persistState, showToast]
  );

  const deleteMarketEvent = useCallback(
    (eventId: string) => {
      persistState((prev) => ({
        ...prev,
        market_events: prev.market_events.filter((e) => e.id !== eventId),
      }));
      showToast("ลบรายการตลาดนัดเรียบร้อยแล้ว", "info");
    },
    [persistState, showToast]
  );

  const assignShopToStall = useCallback(
    (stallId: string, shopId: string | null, verified = false) => {
      persistState((prev) => {
        const targetStall = prev.market_stalls.find((st) => st.id === stallId);
        const nextStalls = prev.market_stalls.map((st) =>
          st.id === stallId
            ? { ...st, shop_id: shopId, location_verified: verified }
            : st
        );
        const nextShops = prev.shops.map((sh) =>
          sh.id === shopId && targetStall
            ? {
                ...sh,
                stall_number: targetStall.stall_number,
                location_verified: verified,
              }
            : sh
        );
        return {
          ...prev,
          market_stalls: nextStalls,
          shops: nextShops,
        };
      });
      showToast("อัปเดตผังล็อกตลาดนัดเรียบร้อยแล้ว", "success");
    },
    [persistState, showToast]
  );

  const submitOrUpdateReview = useCallback(
    (shopId: string, rating: number, comment: string) => {
      if (!currentUser) {
        showToast("กรุณาเข้าสู่ระบบก่อนเขียนรีวิวร้านค้า", "error");
        return { ok: false, message: "กรุณาเข้าสู่ระบบก่อนเขียนรีวิว" };
      }

      const now = new Date().toISOString();
      const existing = db.reviews.find(
        (r) => r.shop_id === shopId && r.user_id === currentUser.id
      );

      persistState((prev) => {
        const reviewObj: Review = {
          id: existing?.id || `rev-${Date.now()}`,
          user_id: currentUser.id,
          user_name: currentUser.full_name,
          user_role_badge: currentUser.email.endsWith("kmutt.ac.th")
            ? "ยืนยันตัวตน มจธ."
            : "สมาชิก KMUTT Market",
          shop_id: shopId,
          rating: Math.min(5, Math.max(1, rating)),
          comment: comment.trim(),
          status: "published",
          report_reason: null,
          created_at: existing?.created_at || now,
          updated_at: now,
        };

        const nextReviews = existing
          ? prev.reviews.map((r) => (r.id === existing.id ? reviewObj : r))
          : [reviewObj, ...prev.reviews];

        return {
          ...prev,
          reviews: nextReviews,
          activity_logs: [
            {
              id: `log-${Date.now()}`,
              user_id: currentUser.id,
              user_name: currentUser.full_name,
              action: existing ? "EDIT_REVIEW" : "SUBMIT_REVIEW",
              entity_type: "review",
              entity_id: reviewObj.id,
              details: { shopId, rating },
              created_at: now,
            },
            ...prev.activity_logs,
          ],
        };
      });

      const msg = existing
        ? "แก้ไขรีวิวเดิมของคุณเรียบร้อยแล้ว (1 บัญชีต่อ 1 รีวิวร้านค้า)"
        : "ส่งรีวิวร้านค้าเรียบร้อยแล้ว ขอบคุณที่ร่วมแบ่งปันความอร่อย!";
      showToast(msg, "success");
      return { ok: true, message: msg };
    },
    [currentUser, db.reviews, persistState, showToast]
  );

  const reportReview = useCallback(
    (reviewId: string, reason: string) => {
      persistState((prev) => ({
        ...prev,
        reviews: prev.reviews.map((r) =>
          r.id === reviewId ? { ...r, status: "reported", report_reason: reason } : r
        ),
      }));
      showToast("ส่งรายงานรีวิวให้ผู้ดูแลระบบตรวจสอบแล้ว", "info");
    },
    [persistState, showToast]
  );

  const moderateReview = useCallback(
    (reviewId: string, status: Review["status"]) => {
      persistState((prev) => ({
        ...prev,
        reviews: prev.reviews.map((r) =>
          r.id === reviewId ? { ...r, status } : r
        ),
      }));
      showToast("อัปเดตสถานะการตรวจสอบรีวิวเรียบร้อยแล้ว", "success");
    },
    [persistState, showToast]
  );

  const upsertAnnouncement = useCallback(
    (annInput: Partial<Announcement> & { title: string; content: string }) => {
      const id = annInput.id || `ann-${Date.now()}`;
      persistState((prev) => {
        const existing = prev.announcements.find((a) => a.id === id);
        const saved: Announcement = {
          id,
          title: annInput.title,
          content: annInput.content,
          image_url: annInput.image_url ?? existing?.image_url ?? null,
          publish_at: annInput.publish_at ?? existing?.publish_at ?? new Date().toISOString(),
          expires_at: annInput.expires_at ?? existing?.expires_at ?? null,
          is_published: annInput.is_published ?? existing?.is_published ?? true,
        };
        const nextAnns = existing
          ? prev.announcements.map((a) => (a.id === id ? saved : a))
          : [saved, ...prev.announcements];
        return { ...prev, announcements: nextAnns };
      });
      showToast("บันทึกประกาศประชาสัมพันธ์เรียบร้อยแล้ว", "success");
    },
    [persistState, showToast]
  );

  const updateMarketConfig = useCallback(
    (cfg: Partial<MarketFeeConfig>) => {
      persistState((prev) => ({
        ...prev,
        market_config: { ...prev.market_config, ...cfg },
      }));
      showToast("บันทึกการตั้งค่าตลาดนัดและอัตราค่าพื้นที่เรียบร้อยแล้ว", "success");
    },
    [persistState, showToast]
  );

  const updateUserRole = useCallback(
    (userId: string, role: UserRole) => {
      persistState((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) =>
          p.id === userId ? { ...p, role, updated_at: new Date().toISOString() } : p
        ),
      }));
      showToast("อัปเดตสิทธิ์ผู้ใช้งานเรียบร้อยแล้ว", "success");
    },
    [persistState, showToast]
  );

  const resetDemoData = useCallback(async () => {
    await fetch("/api/market-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "RESET_DEMO_DATA" }),
    });
    setDb(INITIAL_DATABASE_STATE);
    try {
      localStorage.setItem(
        LOCAL_DB_CACHE_KEY,
        JSON.stringify(INITIAL_DATABASE_STATE)
      );
    } catch {}
    showToast("รีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้นทางการ BPUU เรียบร้อยแล้ว", "info");
  }, [showToast]);

  return (
    <MarketContext.Provider
      value={{
        db,
        isLoaded,
        currentUser,
        favoriteShopIds,
        toasts,
        isCravingPickerOpen,
        setIsCravingPickerOpen,
        showToast,
        dismissToast,
        toggleFavorite,
        switchDemoRole,
        loginWithEmail,
        logout,
        upsertShop,
        deleteShop,
        upsertProduct,
        deleteProduct,
        upsertCategory,
        deleteCategory,
        updateShopSchedules,
        upsertMarketEvent,
        deleteMarketEvent,
        assignShopToStall,
        submitOrUpdateReview,
        reportReview,
        moderateReview,
        upsertAnnouncement,
        updateMarketConfig,
        updateUserRole,
        resetDemoData,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) {
    throw new Error("useMarket must be used within a MarketProvider");
  }
  return ctx;
}
