import fs from "node:fs";
import path from "node:path";

const appJsPath = path.resolve(process.cwd(), "public", "app.js");
let content = fs.readFileSync(appJsPath, "utf-8");

// 1. Update state.igStudio default values
content = content.replace(
  'themeKey: "kmutt-orange",\n    tone: "student",\n    customHeadline: "ร้านเด็ด มจธ. แนะนำวันนี้",',
  'themeKey: "punpro",\n    tone: "punpro",\n    customHeadline: "ชี้เป้าของอร่อย มจธ. บางมด!",'
);

// 2. Update theme grid in renderIgStudioTab
const oldThemeGrid = `<div class="ig-theme-grid" style="margin-bottom:1.25rem;">
            <div class="ig-theme-option \${ig.themeKey === "kmutt-orange" ? "active" : ""}" onclick="window.igSelectTheme('kmutt-orange')">
              <span style="width:20px; height:20px; border-radius:50%; background:#FA4616; display:inline-block; flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-main);">KMUTT Bold Orange</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">สีส้ม-ขาว เอกลักษณ์ มจธ.</div>
              </div>
            </div>

            <div class="ig-theme-option \${ig.themeKey === "street-neon" ? "active" : ""}" onclick="window.igSelectTheme('street-neon')">
              <span style="width:20px; height:20px; border-radius:50%; background:#0F172A; border:2px solid #F59E0B; display:inline-block; flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-main);">Midnight Street Food</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">ดาร์กโหมดนีออน ชวนหิว</div>
              </div>
            </div>

            <div class="ig-theme-option \${ig.themeKey === "cafe-pastel" ? "active" : ""}" onclick="window.igSelectTheme('cafe-pastel')">
              <span style="width:20px; height:20px; border-radius:50%; background:#EA580C; border:2px solid #FDE047; display:inline-block; flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-main);">Warm Cafe & Bakery</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">โทนครีม-คาราเมล อบอุ่น</div>
              </div>
            </div>

            <div class="ig-theme-option \${ig.themeKey === "market-fest" ? "active" : ""}" onclick="window.igSelectTheme('market-fest')">
              <span style="width:20px; height:20px; border-radius:50%; background:#047857; border:2px solid #10B981; display:inline-block; flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-main);">Market Day Festival</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">เทศกาลตลาดนัด สีสดใส</div>
              </div>
            </div>
          </div>`;

const newThemeGrid = `<div class="ig-theme-grid" style="margin-bottom:1.25rem;">
            <!-- Recommended Punpromotion Style -->
            <div class="ig-theme-option \${ig.themeKey === "punpro" ? "active" : ""}" style="grid-column: 1 / -1; border: 2.5px solid #FFDE00; background: #FFFDE7;" onclick="window.igSelectTheme('punpro')">
              <span style="width:24px; height:24px; border-radius:50%; background:#FFDE00; border:2.5px solid #18181B; display:flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0;">📢</span>
              <div style="flex:1;">
                <div style="font-weight:800; font-size:0.95rem; color:#0F172A; display:flex; align-items:center; gap:0.4rem;">
                  <span>ปันโปรชวนชิม (Punpro Lifestyle)</span>
                  <span style="font-size:0.7rem; background:#E11D48; color:#FFFFFF; padding:1px 6px; border-radius:4px; font-weight:700;">สไตล์คนทำจริง</span>
                </div>
                <div style="font-size:0.78rem; color:#713F12;">ภาพอาหารจริงเต็มจอ + สติกเกอร์ชี้เป้าสีเหลือง + ป้ายราคาเอียง เหมือนโพสต์เพจปันโปร</div>
              </div>
            </div>

            <div class="ig-theme-option \${ig.themeKey === "kmutt-orange" ? "active" : ""}" onclick="window.igSelectTheme('kmutt-orange')">
              <span style="width:20px; height:20px; border-radius:50%; background:#FA4616; display:inline-block; flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-main);">KMUTT Bold Orange</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">ส้ม-ขาว ทางการ มจธ.</div>
              </div>
            </div>

            <div class="ig-theme-option \${ig.themeKey === "street-neon" ? "active" : ""}" onclick="window.igSelectTheme('street-neon')">
              <span style="width:20px; height:20px; border-radius:50%; background:#0F172A; border:2px solid #F59E0B; display:inline-block; flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-main);">Midnight Street Food</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">ดาร์กโหมดนีออน ชวนหิว</div>
              </div>
            </div>

            <div class="ig-theme-option \${ig.themeKey === "cafe-pastel" ? "active" : ""}" onclick="window.igSelectTheme('cafe-pastel')">
              <span style="width:20px; height:20px; border-radius:50%; background:#EA580C; border:2px solid #FDE047; display:inline-block; flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-main);">Warm Cafe & Bakery</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">โทนครีม-คาราเมล อบอุ่น</div>
              </div>
            </div>

            <div class="ig-theme-option \${ig.themeKey === "market-fest" ? "active" : ""}" onclick="window.igSelectTheme('market-fest')">
              <span style="width:20px; height:20px; border-radius:50%; background:#047857; border:2px solid #10B981; display:inline-block; flex-shrink:0;"></span>
              <div>
                <div style="font-weight:700; font-size:0.88rem; color:var(--text-main);">Market Day Festival</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">เทศกาลตลาดนัด S2</div>
              </div>
            </div>
          </div>`;

content = content.replace(oldThemeGrid, newThemeGrid);

// 3. Update tone chips
const oldToneChips = `<div class="ig-tone-chips">
              <div class="ig-tone-chip \${ig.tone === "student" ? "active" : ""}" onclick="window.igSelectTone('student')">
                🎒 เด็กบางมด (เป็นกันเอง)
              </div>
              <div class="ig-tone-chip \${ig.tone === "foodie" ? "active" : ""}" onclick="window.igSelectTone('foodie')">
                🤤 สายกินชวนหิว (เน้นความอร่อย)
              </div>
              <div class="ig-tone-chip \${ig.tone === "official" ? "active" : ""}" onclick="window.igSelectTone('official')">
                📢 ประชาสัมพันธ์ BPUU (ทางการ)
              </div>
            </div>`;

const newToneChips = `<div class="ig-tone-chips">
              <div class="ig-tone-chip \${ig.tone === "punpro" ? "active" : ""}" style="background:\${ig.tone === "punpro" ? "#FFE500" : "#FFFDE7"}; color:#18181B; border-color:#FFDE00; font-weight:800;" onclick="window.igSelectTone('punpro')">
                📣 สไตล์ปันโปร (ชี้เป้าโปรโมชั่น)
              </div>
              <div class="ig-tone-chip \${ig.tone === "student" ? "active" : ""}" onclick="window.igSelectTone('student')">
                🎒 เด็กบางมด (เป็นกันเอง)
              </div>
              <div class="ig-tone-chip \${ig.tone === "foodie" ? "active" : ""}" onclick="window.igSelectTone('foodie')">
                🤤 สายกินชวนหิว (เน้นความอร่อย)
              </div>
              <div class="ig-tone-chip \${ig.tone === "official" ? "active" : ""}" onclick="window.igSelectTone('official')">
                📢 ประชาสัมพันธ์ BPUU (ทางการ)
              </div>
            </div>`;

content = content.replace(oldToneChips, newToneChips);

fs.writeFileSync(appJsPath, content, "utf-8");
console.log("Successfully updated public/app.js with Punpromotion style options!");
