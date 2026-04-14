import express from "express";
import { semanticSearchProcedure } from "../engine/procedureSemanticSearch.js";
import { getSmartAIResponse } from "../services/aiService.js";
import { loadRegulations } from "../utils/loadRegulations.js";
import { searchXa, searchMultipleXa, getForestStatistics } from "../engine/xaSearch.js";

const regulations = loadRegulations();
const router = express.Router();

/* ============================================================
    🧠 1. BỘ ĐỊNH DẠNG DỮ LIỆU (FORMATTERS)
============================================================ */
const safe = (v, fallback = "—") => 
    v === undefined || v === null || v === "" ? fallback : v;

const normalize = (text = "") => {
    return text.toLowerCase().normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d");
};

const formatDocs = (documents) => {
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
        return "— Không có yêu cầu hồ sơ cụ thể.";
    }
    const BASE_URL = "http://localhost:10000"; 
    return documents.map((d) => {
        const name = typeof d === "string" ? d : (d?.name || "Tài liệu");
        const fileUrl = d?.file || d?.url;
        if (!fileUrl) return "• " + name;
        const fullUrl = fileUrl.startsWith("http") ? fileUrl : BASE_URL + (fileUrl.startsWith('/') ? '' : '/') + fileUrl;
        return `• ${name} [Tải mẫu](${fullUrl})`; 
    }).join("\n");
};

const formatProcedure = (p = {}) => {
    const title = safe(p.title).toUpperCase();
    const docsContent = p.documents ? ("\n" + formatDocs(p.documents)) : "—";
    return `
Tên TTHC: ${title} (Mã TTHC: ${safe(p.code)})

🔄 Trình tự thực hiện: ${safe(p.steps)}
📍 Địa điểm thực hiện: ${Array.isArray(p.location) ? p.location.join("; ") : safe(p.location)}
⚡ Cách thức thực hiện: ${safe(p.method)}
📄 Thành phần hồ sơ: ${docsContent}
⏱ Thời hạn giải quyết: ${safe(p.processingTime)}
👤 Đối tượng thực hiện: ${safe(p.target)}
🏛 Cơ quan giải quyết: ${safe(p.authority)}
✅ Kết quả: ${safe(p.result)}
💰 Lệ phí: ${safe(p.aiFees)}
⚖️ Điều kiện thực hiện: ${safe(p.condition, "Không")}
📜 Căn cứ pháp lý: ${safe(p.legal_basis)}
`.trim();
};

const formatXa = (p = {}) => {
    const d = p.data || {};
    const cuLyRaw = safe(d.Cu_ly_di_chuyen || d["Cu ly di chuyen"]);
    let cuLyFormatted = "—";

    if (cuLyRaw !== "—") {
        cuLyFormatted = cuLyRaw
            .split(/<p>|<\/p>|\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => `    • ${line}`)
            .join("\n");
    }

    const rawCoords = safe(d.Toa_do || d.To_do); 
    let googleMapsLink = "—";
    if (rawCoords !== "—") {
        const cleanCoords = rawCoords.replace(/\s/g, "");
        // Đã sửa lại URL chuẩn để hiện bản đồ
        googleMapsLink = `[Xem bản đồ](https://www.google.com/maps/search/?api=1&query=${cleanCoords})`;
    }

    return `
⚖️ THÔNG TIN VỀ: ${safe(p.title).toUpperCase()}
---
🔹 Xã sáp nhập: ${safe(d.xa_cu)}
🔹 Trụ sở: ${googleMapsLink}
🔹 Diện tích tự nhiên: ${safe(d.dien_tich_tu_nhien)} ha
🔹 Diện tích đất lâm nghiệp: ${safe(d.dien_tich_lam_nghiep)} ha
🔹 Diện tích có rừng: ${safe(d.dien_tich_rung)} ha
🔹 Chủ rừng: ${safe(d.chu_rung)}
🔹 Hạt quản lý: ${safe(d.hat_quan_ly)}
🔹 Cự ly di chuyển đến xã:
${cuLyFormatted}
`.trim();
};

const formatViolation = (v) => {
    const basis = Array.isArray(v.legal_basis) ? v.legal_basis.join("; ") : "Theo quy định hiện hành";
    return `📜 ${safe(v.article)}. ${safe(v.title).toUpperCase()}\n
Căn cứ: ${basis}\nMô tả: ${safe(v.description)}
${(v.punishments || []).map(p => `Khoản ${p.clause}: ${p.fine_range}\n${(p.cases || []).map(c => `- ${c}`).join("\n")}`).join("\n")}
Biện pháp khắc phục: ${safe(v.remedy?.content)}`;
};

/* ============================================================
    🚀 2. MAIN ROUTER
============================================================ */
router.post("/", async (req, res) => {
    try {
        const { msg, domain } = req.body; 
        if (!msg) return res.json({ reply: "⚠️ Mời Anh/Chị nhập nội dung.", choices: [] });

        if (!req.session.state) {
            req.session.state = { procedure: null, lastXaList: [], lastIntent: null };
        }
        const state = req.session.state;

        // --- LAYER 1: MENU ACTIONS ---
        const menuActions = {
            "📄 Hồ sơ": () => `📄 THÀNH PHẦN HỒ SƠ:\n\n${formatDocs(state.procedure?.documents)}`,
            "💰 Lệ phí": () => `💰 LỆ PHÍ:\n\n${safe(state.procedure?.aiFees)}`,
            "🔎 Thủ tục khác": () => { state.procedure = null; return "Mời Anh/Chị nhập tên thủ tục mới."; }
        };
        if (menuActions[msg]) return res.json({ reply: menuActions[msg](), choices: ["🏠 Menu chính", "🔎 Thủ tục khác"] });

        // --- LAYER 2: HARD SEARCH (Dữ liệu xã & Thống kê) ---
        if (domain === 'all' || domain === 'du_lieu') {
            const stats = getForestStatistics(msg);
            if (stats) {
                let reply = "";
                const choices = ["📊 Tính tổng", "🔎 Xã khác", "🏠 Menu chính"];
                switch (stats.type) {
                    case "list": reply = `📍 **${stats.title}**:\n• ${stats.data.join("\n• ")}`; break;
                    case "total": reply = `📊 **${stats.label}**: **${stats.value}**`; break;
                    case "comparison": reply = `🏆 **${stats.name}** có ${stats.field} ${stats.status} (${stats.value})`; break;
                    case "management": reply = `🏛 **${stats.hat}** quản lý ${stats.count} xã:\n• ${stats.list.join("\n• ")}`; break;
                }
                if (reply) return res.json({ reply, choices });
            }

            let foundXaList = searchMultipleXa(msg);
            if (!foundXaList.length && state.lastXaList.length && /đó|trên|vừa/.test(msg.toLowerCase())) {
                foundXaList = state.lastXaList;
            }

            if (foundXaList.length === 1) {
                state.lastXaList = foundXaList;
                return res.json({ reply: formatXa(foundXaList[0]), choices: ["📊 Tính tổng", "🔎 Xã khác"] });
            }

            if (foundXaList.length > 1) {
                state.lastXaList = foundXaList;
                const names = foundXaList.map(x => x.title).join(", ");
                return res.json({ 
                    reply: `🔍 Tìm thấy ${foundXaList.length} xã liên quan: ${names}. Anh/Chị muốn xem xã nào hay tính tổng?`,
                    choices: ["📊 Tính tổng", "🔎 Tra cứu lại"]
                });
            }
        }

        // --- LAYER 3: AI SMART FALLBACK ---
        const contextData = state.lastXaList.length 
            ? `Đang xem: ${JSON.stringify(state.lastXaList.map(x => ({ten: x.title, dt: x.data?.dien_tich_rung})))}` 
            : "Không có dữ liệu xã.";

        const ai = await getSmartAIResponse(msg, `Chế độ: ${domain}. ${contextData}`);

        if (ai.intent === "hỏi_thủ_tục") {
            const retryProc = semanticSearchProcedure(ai.keywords?.join(" ") || msg);
            if (retryProc) {
                state.procedure = retryProc;
                return res.json({ reply: formatProcedure(retryProc), choices: ["📄 Hồ sơ", "🏛 Nộp ở đâu", "💰 Lệ phí"] });
            }
        }

        return res.json({ 
            reply: ai.reply || "Xin lỗi, tôi chưa tìm thấy dữ liệu khớp.", 
            choices: ["🏠 Menu chính", "📄 Tra cứu thủ tục"] 
        });

    } catch (err) {
        console.error("❌ ERROR:", err);
        if (!res.headersSent) {
            return res.json({ reply: "⚠️ Hệ thống đang bận. Vui lòng thử lại sau." });
        }
    }
});

export default router;