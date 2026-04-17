import express from "express";
import fs from "fs";
import { semanticSearchProcedure } from "../engine/procedureSemanticSearch.js";
import { getSmartAIResponse } from "../services/aiService.js";
import { loadRegulations } from "../utils/loadRegulations.js";
import { searchXa, searchMultipleXa, getForestStatistics } from "../engine/xaSearch.js";

// --- KHỞI TẠO DỮ LIỆU ---
const regulations = loadRegulations();
const readJSON = (path) => {
    try {
        return JSON.parse(fs.readFileSync(path, "utf-8"));
    } catch (e) {
        console.error(`❌ Lỗi đọc file ${path}:`, e.message);
        return [];
    }
};

const chuRungDataset = readJSON("./data/churung.json");
const pcccrDataset = readJSON("./data/pcccr.json");

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

// Định dạng PCCCR (Mới cập nhật)
const formatPCCCRCard = (item) => {
    const main = item.contacts?.find(c => c.main) || item.contacts?.[0];
    const others = item.contacts?.filter(c => c !== main)
        .map(c => `• ${c.name} (${c.pos}): ${c.phone}`).join("\n");

    return `
🚨 **HỆ THỐNG BÁO CHÁY RỪNG KHẨN CẤP**
---
🏛️ **Đơn vị:** ${item.chu_rung.toUpperCase()}

🔥 **HOTLINE BÁO CHÁY: ${main?.phone || "—"}**
👤 **Người phụ trách:** ${main?.name || "—"} (${main?.pos || "—"})

📞 **Các số liên hệ phối hợp khác:**
${others || "—"}
`.trim();
};

// Định dạng Chủ rừng (Mới cập nhật)
const formatChuRungCard = (item) => {
    const d = item.data || {};
    const history = (item.history?.length > 0) 
        ? `\n📖 Lịch sử hình thành:\n${item.history.map(line => `• ${line}`).join("\n")}` 
    : "";

    return `
📜 CẨM NANG: ${item.title.toUpperCase()}
---
👤 Đại diện: ${safe(item.nguoi_dai_dien)} | 🎖️ ${safe(item.chuc_vu)} | 📞 ${safe(item.so_dien_thoai)}
📑 Mục đích sử dụng: ${safe(item.type)}
📐 Đất lâm nghiệp: ${safe(d.dien_tich_lam_nghiep)} ha
🌳 Diện tích có rừng: ${safe(d.dien_tich_rung)} ha
🏛 Hạt quản lý: ${safe(d.hat_quan_ly)}
${history}
`.trim();
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
        googleMapsLink = `[Xem bản đồ](https://www.google.com/maps?q=${cleanCoords})`;
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

/* ============================================================
    🚀 2. MAIN ROUTER
============================================================ */
router.post("/", async (req, res) => {
    try {
        const { msg, domain } = req.body; 
        if (!msg) return res.json({ reply: "⚠️ Mời Anh/Chị nhập nội dung.", choices: [] });

        const state = req.session.state ||= { procedure: null, lastXaList: [], lastItem: null };
        const queryNorm = normalize(msg);
        const lowerMsg = msg.toLowerCase();

        // --- LAYER 1: MENU ACTIONS ---
        const menuActions = {
            "📄 Hồ sơ": () => `📄 THÀNH PHẦN HỒ SƠ:\n\n${formatDocs(state.procedure?.documents)}`,
            "💰 Lệ phí": () => `💰 LỆ PHÍ:\n\n${safe(state.procedure?.aiFees)}`,
            "🔎 Thủ tục khác": () => { state.procedure = null; return "Mời Anh/Chị nhập tên thủ tục mới."; }
        };
        if (menuActions[msg]) return res.json({ reply: menuActions[msg](), choices: ["🏠 Menu chính", "🔎 Thủ tục khác"] });

        // --- LAYER 2: PCCCR (Ưu tiên cao nhất) ---
        const isFireQuery = /chay|bao chay|hotline|cap cuu|khan cap/.test(lowerMsg);
        if (domain === "pcccr" || isFireQuery) {
            const foundPCCCR = pcccrDataset.find(item => 
                normalize(item.chu_rung).includes(queryNorm) || 
                item.keywords?.some(k => normalize(k).includes(queryNorm)) ||
                item.contacts?.some(c => normalize(c.name).includes(queryNorm))
            );

            if (foundPCCCR) {
                return res.json({ reply: formatPCCCRCard(foundPCCCR), choices: ["🔥 Báo cháy đơn vị khác", "🏠 Menu chính"] });
            }
            if (isFireQuery) {
                return res.json({ 
                    reply: "🔥 Anh/Chị muốn tìm Hotline báo cháy của đơn vị nào?", 
                    choices: ["Vườn QG Tràm Chim", "Gáo Giồng", "Hùng Cá", "🏠 Menu chính"] 
                });
            }
        }

        // --- LAYER 3: CHỦ RỪNG ---
        if (domain === "chu_rung" || /chu rung|cam nang/.test(lowerMsg)) {
            const foundCR = chuRungDataset.filter(i => 
                normalize(i.title).includes(queryNorm) || 
                i.keywords?.some(k => queryNorm.includes(normalize(k))) ||
                normalize(i.nguoi_dai_dien || "").includes(queryNorm)
            );

            if (foundCR.length === 1) {
                state.lastItem = foundCR[0];
                return res.json({ reply: formatChuRungCard(foundCR[0]), choices: ["📊 Số liệu", "🔎 Chủ rừng khác", "🏠 Menu chính"] });
            }
            if (foundCR.length > 1) {
                return res.json({ 
                    reply: `🔍 Tìm thấy ${foundCR.length} đơn vị chủ rừng. Anh/Chị muốn xem cẩm nang của đơn vị nào?`, 
                    choices: [...foundCR.map(r => r.title), "🏠 Menu chính"] 
                });
            }
        }

        // --- LAYER 4: DỮ LIỆU XÃ & THỐNG KÊ ---
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
            if (!foundXaList.length && state.lastXaList.length && /đó|trên|vừa/.test(lowerMsg)) {
                foundXaList = state.lastXaList;
            }

            if (foundXaList.length === 1) {
                state.lastXaList = foundXaList;
                return res.json({ reply: formatXa(foundXaList[0]), choices: ["📊 Tính tổng", "🔎 Xã khác"] });
            }

            if (foundXaList.length > 1) {
                state.lastXaList = foundXaList;
                return res.json({ 
                    reply: `🔍 Tìm thấy ${foundXaList.length} địa điểm liên quan. Vui lòng chọn xã cụ thể bên dưới:`,
                    choices: [...foundXaList.map(x => x.title), "📊 Tính tổng"]
                });
            }
        }

        // --- LAYER 5: AI SMART FALLBACK ---
        try {
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
        } catch (aiErr) {
            return res.json({ 
                reply: "🤖 AI đang bận xử lý. Anh/Chị vui lòng thử lại sau giây lát hoặc tra cứu theo từ khóa cụ thể hơn.", 
                choices: ["🏠 Menu chính"] 
            });
        }

    } catch (err) {
        console.error("❌ ERROR:", err);
        if (!res.headersSent) {
            return res.json({ reply: "⚠️ Hệ thống đang bận. Vui lòng thử lại sau." });
        }
    }
});

export default router;