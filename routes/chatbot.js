import express from "express";
import { semanticSearchProcedure } from "../engine/procedureSemanticSearch.js";
import { searchXa, searchMultipleXa } from "../engine/xaSearch.js"; 
import { getSmartAIResponse } from "../services/aiService.js";
import { loadRegulations } from "../utils/loadRegulations.js";

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

/**
 * 📄 Hàm bổ trợ định dạng danh sách hồ sơ (Dùng chung cho cả Procedure và Menu Action)
 */
// Tìm đến hàm formatDocs trong chatbot.js và cập nhật:
const formatDocs = (documents) => {
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
        return "— Không có yêu cầu hồ sơ cụ thể.";
    }

    const BASE_URL = "http://localhost:3000"; 

    return documents.map((d) => {
        const name = typeof d === "string" ? d : (d?.name || "Tài liệu");
        const fileUrl = d?.file || d?.url;

        if (!fileUrl) return `• ${name}`;

        // Đảm bảo đường dẫn chuẩn
        const fullUrl = fileUrl.startsWith("http") 
            ? fileUrl 
            : `${BASE_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;

        // Trả về định dạng Markdown cho frontend xử lý
        return `• ${name}[Tải mẫu](${fullUrl})`; 
    }).join("\n");
};

/**
 * 🚀 FORMATTER HIỂN THỊ ĐỦ 14 NỘI DUNG TTHC
 */
const formatProcedure = (p = {}) => {
    const title = safe(p.title).toUpperCase();
    const code = safe(p.code);
    const steps = safe(p.steps);
    const location = Array.isArray(p.location) ? p.location.join("; ") : safe(p.location);
    const method = safe(p.method);
    const time = safe(p.processingTime);
    const target = safe(p.target);
    const authority = safe(p.authority);
    const result = safe(p.result);
    const fees = safe(p.aiFees);
    const forms = safe(p.forms_info);
    const condition = safe(p.condition, "Không");
    const legal = safe(p.legal_basis);
    const digitalDocs = safe(p.digital_docs);
    const digitalResult = safe(p.digital_result);

    // Sử dụng hàm formatDocs để đồng nhất hiển thị hồ sơ có link tải
    const docsContent = p.documents ? ("\n" + formatDocs(p.documents)) : "—";

    return `
Tên TTHC: ${title} (Mã TTHC: ${code})

🔄 Trình tự thực hiện: ${steps}

📍 Địa điểm thực hiện: ${location}

⚡ Cách thức thực hiện: ${method}

📄 Thành phần, số lượng hồ sơ: ${docsContent}

⏱ Thời hạn giải quyết: ${time}

👤 Đối tượng thực hiện thủ tục hành chính: ${target}

🏛 Cơ quan giải quyết thủ tục hành chính: ${authority}

✅ Kết quả thực hiện thủ tục hành chính: ${result}

💰 Lệ phí, phí (nếu có): ${fees}

📑 Tên mẫu đơn, mẫu tờ khai: ${forms}

⚖️ Yêu cầu, điều kiện thực hiện thủ tục hành chính (nếu có): ${condition}

📜 Căn cứ pháp lý của thủ tục hành chính: ${legal}

💻 Thành phần hồ sơ cần phải số hoá: ${digitalDocs}

📤 Kết quả giải quyết TTHC cần phải số hoá: ${digitalResult}
`.trim();
};


const formatXa = (p = {}) => {
    const d = p.data || {};
    return `📍 DỮ LIỆU XÃ: ${safe(p.title).toUpperCase()}\n
Xã cũ: ${safe(d.xa_cu)} | Xã mới: ${safe(d.xa_moi)}
Chủ rừng: ${safe(d.chu_rung)}
Diện tích tự nhiên: ${safe(d.dien_tich_tu_nhien)} ha
Diện tích lâm nghiệp: ${safe(d.dien_tich_lam_nghiep)} ha
Diện tích rừng: ${safe(d.dien_tich_rung)} ha
Quản lý: ${safe(d.hat_quan_ly)}`;
};

const formatViolation = (v) => {
    const basis = Array.isArray(v.legal_basis) ? v.legal_basis.join("; ") : "Theo quy định hiện hành";
    return `📜 ${safe(v.article)}. ${safe(v.title).toUpperCase()}\n
Căn cứ: ${basis}\nMô tả: ${safe(v.description)}
${(v.punishments || []).map(p => `Khoản ${p.clause}: ${p.fine_range}\n${(p.cases || []).map(c => `- ${c}`).join("\n")}`).join("\n")}
Biện pháp khắc phục: ${safe(v.remedy?.content)}`;
};

/* ============================================================
   ⚖️ 2. CÔNG CỤ PHÂN TÍCH Ý ĐỊNH (INTENT ENGINES)
============================================================ */
const detectQuickIntent = (msg) => {
    const m = msg.toLowerCase();
    if (/tổng|cộng|bao nhiêu|diện tích/.test(m)) return "calc";
    if (/xã|ấp|thôn/.test(m)) return "xa";
    return "unknown";
};

const findViolation = (msg) => {
    const m = normalize(msg);
    if (/xa|ap|thon/.test(m)) return null;
    let best = null, maxScore = 0;
    for (const v of regulations) {
        let score = 0;
        const keywords = [...(v.keywords || []), ...(v.aliases || [])];
        for (const k of keywords) {
            const kNorm = normalize(k);
            if (m.includes(kNorm)) score += 3;
            else if (kNorm.includes(m)) score += 1;
        }
        if (score > maxScore) { maxScore = score; best = v; }
    }
    return maxScore >= 3 ? best : null;
};

/* ============================================================
   🚀 3. MAIN ROUTER
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
            "📄 Hồ sơ": () => {
                const docs = state.procedure?.documents;
                return `📄 THÀNH PHẦN HỒ SƠ CHI TIẾT:\n\n${formatDocs(docs)}`;
            },
            "🏛 Nộp ở đâu": () => {
                const place = state.procedure?.location || state.procedure?.authority;
                if (!place) return "🏛 Nộp tại cơ quan Kiểm lâm sở tại hoặc cổng Dịch vụ công.";
                const list = Array.isArray(place) ? place : [place];
                return `🏛 NƠI NỘP HỒ SƠ:\n\n${list.map(i => `• ${i}`).join("\n")}`;
            },
            "💰 Lệ phí": () => `💰 LỆ PHÍ, PHÍ:\n\n${safe(state.procedure?.aiFees, "Theo quy định hiện hành")}`,
            "🔎 Thủ tục khác": () => { state.procedure = null; return "Mời Anh/Chị nhập tên thủ tục mới."; }
        };

        if (menuActions[msg]) {
            return res.json({ 
                reply: menuActions[msg](), 
                choices: ["📄 Hồ sơ", "🏛 Nộp ở đâu", "💰 Lệ phí", "🔎 Thủ tục khác"] 
            });
        }

        // --- LAYER 2: HARD SEARCH ---
        if (domain === 'all' || domain === 'xu_phat') {
            const violation = findViolation(msg);
            if (violation) {
                state.procedure = null;
                return res.json({ reply: formatViolation(violation), choices: ["🔎 Hành vi khác", "📄 Thủ tục liên quan"] });
            }
        }

        if (domain === 'all' || domain === 'du_lieu') {
            let foundXaList = searchMultipleXa(msg);
            if (!foundXaList.length && state.lastXaList.length && /đó|trên|vừa/.test(msg)) {
                foundXaList = state.lastXaList;
            }

            if (foundXaList.length === 1 && detectQuickIntent(msg) !== "calc") {
                state.lastXaList = foundXaList;
                return res.json({ reply: formatXa(foundXaList[0]), choices: ["📊 Tính tổng", "🔎 Xã khác"] });
            }

            if (detectQuickIntent(msg) === "calc" && (foundXaList.length > 0 || state.lastXaList.length > 0)) {
                const list = foundXaList.length ? foundXaList : state.lastXaList;
                const total = list.reduce((sum, x) => sum + (parseFloat(x.data?.dien_tich_rung) || 0), 0);
                return res.json({ reply: `📊 Tổng diện tích rừng: ${total.toLocaleString()} ha`, choices: ["🔎 Xã khác"] });
            }
        }

        const quickProc = semanticSearchProcedure(msg);
        if (quickProc && quickProc.title) {
            state.procedure = quickProc;
            return res.json({ 
                reply: formatProcedure(quickProc), 
                choices: ["📄 Hồ sơ", "🏛 Nộp ở đâu", "💰 Lệ phí", "🔎 Thủ tục khác"] 
            });
        }

        // --- LAYER 3: AI SMART FALLBACK ---
        const contextData = (state.lastXaList.length) 
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
        return res.json({ reply: "⚠️ Hệ thống đang bận. Vui lòng thử lại sau." });
    }
});

export default router;