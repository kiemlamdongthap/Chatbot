import express from "express";
import { semanticSearchProcedure } from "../engine/procedureSemanticSearch.js";
import { searchXa, searchMultipleXa } from "../engine/xaSearch.js"; 
import { getSmartAIResponse } from "../services/aiService.js";
import { loadRegulations } from "../utils/loadRegulations.js";


const regulations = loadRegulations();
const router = express.Router();

/* ============================================================
   🧠 SAFE FORMATTERS (ANTI-CRASH)
============================================================ */

const safe = (v, fallback = "—") => (v === undefined || v === null || v === "") ? fallback : v;

const formatProcedure = (p = {}) => `
🌲 **THỦ TỤC: ${safe(p.title, "Chưa có tên").toUpperCase()}**
🔹 **Mã số:** ${safe(p.code, "Đang cập nhật")}
📌 **Mô tả:** ${safe(p.description)}

💡 **Hướng dẫn nhanh:**  
${safe(p.aiAnswer)}

⏱ **Thời gian:** ${safe(p.processingTime, "Theo quy định")}
💰 **Lệ phí:** ${safe(p.aiFees, "Theo quy định hiện hành")}
`;

const formatDocs = (docs = []) => {
  if (!docs.length) return "⚠️ Chưa có danh mục hồ sơ.";

  return `📝 **HỒ SƠ CẦN CHUẨN BỊ:**\n\n` +
    docs
      .map((d, i) => {
        const name = typeof d === "string" ? d : d?.name;
        if (!name) return null;
        return `${i + 1}. ${name}${d?.file ? ` [📥 Tải mẫu](${d.file})` : ""}`;
      })
      .filter(Boolean)
      .join("\n");
};

const formatLocation = (loc) => {
  if (!loc) return "🏛 Nộp tại cơ quan Kiểm lâm hoặc Một cửa.";
  const list = Array.isArray(loc) ? loc : [loc];
  return `🏛 **NƠI NỘP HỒ SƠ:**\n\n${list.map(i => `• ${i}`).join("\n")}`;
};

const formatXa = (p = {}) => {
  const d = p.data || {};
  return `
📍 **DỮ LIỆU XÃ: ${safe(p.title).toUpperCase()}**

🏘️ Xã cũ: ${safe(d.xa_cu)}
🆕 Xã mới: ${safe(d.xa_moi)}
🌲 Chủ rừng: ${safe(d.chu_rung)}

📊 Diện tích tự nhiên: ${safe(d.dien_tich_tu_nhien)} ha
🌳 Diện tích lâm nghiệp: ${safe(d.dien_tich_lam_nghiep)} ha
🌲 Diện tích rừng: **${safe(d.dien_tich_rung)} ha**

🏢 Quản lý: ${safe(d.hat_quan_ly)}
`;
};

/* ============================================================
   🧠 INTENT HELPER
============================================================ */

const detectQuickIntent = (msg) => {
  const m = msg.toLowerCase();

  if (/tổng|cộng|bao nhiêu|diện tích/.test(m)) return "calc";
  if (/xã|ấp|thôn/.test(m)) return "xa";
  if (/thủ tục|cấp|mã số|cites/.test(m)) return "procedure";

  return "unknown";
};
/* ============================================================
   ⚖️ LEGAL ENGINE (TRA CỨU LUẬT CHÍNH XÁC)
============================================================ */

const findViolation = (msg) => {
  const m = msg.toLowerCase();

  // ❌ Không xử lý nếu là hỏi xã
  if (/xã|ấp|thôn/.test(m)) return null;

  let best = null;
  let maxScore = 0;

  for (const v of regulations) {
    let score = 0;

    const keywords = [...(v.keywords || []), ...(v.aliases || [])];

    for (const k of keywords) {
      if (m.includes(k)) score += 3;
      else if (k.includes(m)) score += 1;
    }

    if (score > maxScore) {
      maxScore = score;
      best = v;
    }
  }

  return maxScore >= 3 ? best : null;
};

const formatViolation = (v) => {
  return `
📜 **${v.article}. ${v.title.toUpperCase()}**

📌 ${v.description || ""}

${(v.punishments || []).map(p => `
🔹 **Khoản ${p.clause}:**
${p.fine_range}

${(p.cases || []).map(c => `• ${c}`).join("\n")}
`).join("\n")}

⚠️ **Biện pháp khắc phục:**
${v.remedy?.content || "Theo quy định"}
`;
};
/* ============================================================
   🧠 MAIN ROUTER PRO MAX
============================================================ */

router.post("/", async (req, res) => {
  try {
    const { msg } = req.body;
    if (!msg) {
      return res.json({ 
        reply: "⚠️ Mời nhập nội dung.",
        choices: []
      });
    }

    // 🧠 INIT STATE
    if (!req.session.state) {
      req.session.state = {
        procedure: null,
        lastXaList: [],
        lastIntent: null
      };
    }

    const state = req.session.state;

    /* ========================================================
       🎯 MENU ACTION (NHANH NHƯ CHỚP)
    ======================================================== */
    const menuActions = {
      "📄 Hồ sơ": () => formatDocs(state.procedure?.documents),
      "🏛 Nộp ở đâu": () => formatLocation(state.procedure?.location),
      "💰 Lệ phí": () => `💰 ${safe(state.procedure?.aiFees)}`,
      "🔎 Thủ tục khác": () => {
        state.procedure = null;
        return "Mời nhập thủ tục khác.";
      }
    };

    if (menuActions[msg]) {
      return res.json({
        reply: menuActions[msg](),
        choices: ["📄 Hồ sơ", "🏛 Nộp ở đâu", "💰 Lệ phí", "🔎 Thủ tục khác"]
      });
    }
/* ========================================================
   ⚖️ TRA CỨU LUẬT ƯU TIÊN CAO
======================================================== */

const violation = findViolation(msg);

if (violation) {
  state.lastIntent = "violation";
  state.procedure = null;

  return res.json({
    reply: formatViolation(violation),
    choices: [
      "📖 Xem tóm tắt",
      "🔎 Hành vi khác",
      "📄 Thủ tục liên quan"
    ]
  });
}
    /* ========================================================
       ⚡ HARD SEARCH PROCEDURE
    ======================================================== */
    const quickProc = semanticSearchProcedure(msg);

    if (quickProc && quickProc.title) {
      state.procedure = quickProc;
      state.lastIntent = "procedure";

      return res.json({
        reply: formatProcedure(quickProc),
        choices: ["📄 Hồ sơ", "🏛 Nộp ở đâu", "💰 Lệ phí", "🔎 Thủ tục khác"]
      });
    }

    /* ========================================================
       📍 SEARCH XÃ
    ======================================================== */
    let foundXaList = searchMultipleXa(msg);

    // 🧠 HIỂU "cái đó", "xã đó"
    if (!foundXaList.length && state.lastXaList.length) {
      if (/đó|trên|vừa|hồi nãy/.test(msg.toLowerCase())) {
        foundXaList = state.lastXaList;
      }
    }

    if (foundXaList.length === 1 && detectQuickIntent(msg) !== "calc") {
      state.lastXaList = foundXaList;
      state.lastIntent = "xa";

      return res.json({
        reply: formatXa(foundXaList[0]),
        choices: ["📊 Tính tổng", "🔎 Xã khác"]
      });
    }

    /* ========================================================
       📊 AUTO CALC (PRO MAX FEATURE)
    ======================================================== */
    if (
      detectQuickIntent(msg) === "calc" &&
      (foundXaList.length > 0 || state.lastXaList.length > 0)
    ) {
      const list = foundXaList.length ? foundXaList : state.lastXaList;

      const total = list.reduce(
        (sum, x) => sum + (parseFloat(x.data?.dien_tich_rung) || 0),
        0
      );

      return res.json({
        reply: `📊 Tổng diện tích rừng: **${total.toLocaleString()} ha**`,
        choices: ["🔎 Xã khác"]
      });
    }

    /* ========================================================
       🤖 AI FALLBACK
    ======================================================== */
    const contextData = (foundXaList.length || state.lastXaList.length)
      ? JSON.stringify((foundXaList.length ? foundXaList : state.lastXaList).map(x => ({
          ten: x.title,
          dt: x.data?.dien_tich_rung
        })))
      : "";

    const ai = await getSmartAIResponse(msg, contextData);

    console.log("🧠 AI DEBUG:", {
      msg,
      intent: ai.intent,
      keywords: ai.keywords
    });

    // 🎯 AI → PROCEDURE
    if (ai.intent === "hỏi_thủ_tục") {
      const proc = semanticSearchProcedure(ai.keywords?.join(" ") || msg);

      if (proc) {
        state.procedure = proc;
        return res.json({
          reply: formatProcedure(proc),
          choices: ["📄 Hồ sơ", "🏛 Nộp ở đâu", "💰 Lệ phí"]
        });
      }
    }

    /* ========================================================
       ❓ FALLBACK CUỐI
    ======================================================== */
    return res.json({
      reply: ai.reply || "⚠️ Không tìm thấy dữ liệu phù hợp.",
      choices: [
        "📄 Thủ tục cấp mã số",
        "📍 Xã bất kỳ",
        "📊 Tổng diện tích rừng"
      ]
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    return res.json({
      reply: "⚠️ Hệ thống đang nâng cấp. Vui lòng thử lại."
    });
  }
});

export default router;