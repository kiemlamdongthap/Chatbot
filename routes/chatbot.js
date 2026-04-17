import express from "express";
import fs from "fs";
import path from "path";
import { renderSection } from "../services/renderSection.js";

import { searchXa, searchMultipleXa, getForestStatistics } from "../engine/xaSearch.js";
import { searchMultipleProcedures, normalizeText } from "../engine/procedureSemanticSearch.js";
import { getSmartAIResponse } from "../services/aiService.js";
import { normalize } from "../utils/text.js";
import { searchRegulation } from "../services/regulationService.js";
import * as xaData from "../engine/xaSearch.js";

const router = express.Router();
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyA4ZAH0MiKjKeWx5kIwUhbZegeY-GBnDfi_SYqwxgPkpwKlljHfKvvcAopJp6z-EyZ/exec";

	// --- HÀM TRỢ GIÚP (Helper) ---
	const readJSON = (filePath) => {
    try {
        const fullPath = path.resolve(filePath);
        return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    } catch (e) {
        console.error(`❌ Không thể đọc file: ${filePath}`, e.message);
        return [];
    }
};
	

const chuRungDataset = readJSON("./data/churung.json");
const pcccrDataset = readJSON("./data/pcccr.json");
	// Hàm lưu Google Sheets
	async function saveToGoogleSheets(feedbackData) {
    try {
        await fetch(GOOGLE_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackData)
        });
    } catch (error) {
        console.error("❌ Lỗi lưu Sheets:", error);
    }
}
			// --- ROUTE CHÍNH LƯU ĐÁNH GIÁ---
	router.post("/", async (req, res) => {
    try {
        const { msg, domain } = req.body;
		const queryNorm = msg ? normalize(msg) : "";
        const state = req.session.state ||= { isWaitingForFeedback: false };

        // 1. NẾU BẤM NÚT ĐÁNH GIÁ (domain=extra_4) HOẶC ĐANG TRONG CHẾ ĐỘ CHỜ
if (domain === "extra_4" || state.isWaitingForFeedback) {

    // --- NHÁNH 1: XỬ LÝ NÚT BẤM XÁC NHẬN ---
    if (msg === "✅ Xác nhận gửi") {
        if (state.tempFeedback) {
            saveToGoogleSheets(state.tempFeedback).catch(e => console.error(e));
            state.tempFeedback = null; 
            state.isWaitingForFeedback = false;
            return res.json({ 
                reply: "🚀 Trân trọng cảm ơn! Ý kiến của Anh/Chị đã được gửi đến Quản trị."
            });
        } else {
            return res.json({ reply: "⚠️ Yêu cầu này đã được xử lý hoặc đã hết hạn."});
        }
    }

    // --- NHÁNH 2: XỬ LÝ NÚT BẤM HỦY ---
    if (msg === "🗑️ Hủy" || msg === "🔍 Quay lại") {
        state.tempFeedback = null;
        state.isWaitingForFeedback = false;
        return res.json({ reply: "❌ Đã hủy đánh giá. Nội dung chưa được gửi đi." });
    }

    // --- NHÁNH 3: HỨNG NỘI DUNG VÀ HỎI XÁC NHẬN ---
    // (Lưu ý: msg không được trùng với các nút điều hướng bên trên)
    if (msg && msg !== "⭐ Đánh giá") {
        state.tempFeedback = {
            thoi_gian: new Date().toLocaleString('vi-VN'),
            noi_dung: msg
        };
        state.isWaitingForFeedback = true; 

        return res.json({ 
            reply: `📝 <b>Nội dung đánh giá:</b><br>"<i>${msg}</i>"<br><br>Anh/Chị có chắc chắn muốn gửi nội dung này không?`,
            choices: ["✅ Xác nhận gửi", "🗑️ Hủy"] 
        });
     
}
			// 2. Nếu người dùng nhấn "🗑️ Hủy"
	if (msg === "🗑️ Hủy") {
    // --- XÓA LOG NGAY TẠI ĐÂY ---
    state.tempFeedback = null; 
    state.isWaitingForFeedback = false;

    return res.json({ 
        reply: "❌ Đã hủy đánh giá. Nội dung chưa được gửi đi.", 
        
    });
}
    }
        
        // 1. Hotline
        if (domain === "hotline") {
            const found = pcccrDataset.find(item => 
                normalize(item.chu_rung).includes(queryNorm) || 
                item.keywords?.some(k => normalize(k).includes(queryNorm))
            );
            return res.json({
                reply: found ? renderSection.hotline(found) : "🔥 Anh/Chị muốn tìm Hotline báo cháy của đơn vị nào?",
                choices: ["Vườn quốc gia Tràm Chim", "Gáo Giồng", "Khu bảo tồn sinh thái Đồng Tháp Mười"]
            });
        }

        // 2. Thủ tục hành chính
	if (domain === "thu_tuc") {

    // --- MỚI: Xử lý nút "🔍 Thủ tục khác" ---
    if (msg === "🔍 Thủ tục khác") {
        state.procedure = null;         // Xóa dữ liệu thủ tục đang lưu trong phiên chat
        state.waiting_location = false; // Đảm bảo tắt trạng thái chờ liên hệ
        return res.json({ 
            reply: "Để tiếp tục hỗ trợ, Anh/Chị vui lòng nhập <b>tên thủ tục mới</b> cần tìm (Ví dụ: Xác nhận bảng kê, Đăng ký gây nuôi...)" 
             
        });
    }

    // TRƯỜNG HỢP A: Người dùng nhấn nút Liên hệ
    if (msg === "📞 Liên hệ Kiểm lâm") {
        state.waiting_location = true; 
        return res.json({ 
            reply: "Để hỗ trợ chính xác nhất, Anh/Chị vui lòng cho biết bạn đang ở <b>Xã, Phường</b> nào?", 
            choices: ["🏠 Hủy yêu cầu"] 
        });
    }

    // TRƯỜNG HỢP B: Xử lý khi người dùng nhập địa bàn
    if (state.waiting_location) {
        if (msg === "🏠 Hủy yêu cầu") {
            state.waiting_location = false;
            return res.json({ reply: "Đã hủy yêu cầu liên hệ. Tôi có thể giúp gì khác cho bạn?", choices: ["🔍 Thủ tục khác"] });
        }

        const result = searchXa(msg); 
        
        // 1. Nếu khớp chính xác (hoặc bấm từ nút gợi ý)
        if (result && result.type === 'exact') {
            state.waiting_location = false; 
            const d = result.data.data; 

            return res.json({
                reply: `<b>Thông tin cơ quan Kiểm lâm phụ trách ${result.data.title}:</b><br>` +
                       `🏢 <b>Đơn vị:</b> ${d.hat_quan_ly}<br>` +
                       `👤 <b>Cán bộ phụ trách:</b> ${d.Kiem_lam_vien || "Đang cập nhật"}<br>` +
                       `📞 <b>Số điện thoại:</b> <a href="tel:${d.So_dien_thoai}" style="color:var(--current-color); font-weight:bold;">${d.So_dien_thoai}</a>`,
                choices: ["📄 Hồ sơ", "💰 Lệ phí", "🔍 Thủ tục khác"]
            });
        } 
        
        // 2. Nếu có nhiều xã trùng tên (ví dụ gõ "Tân")
        else if (result && result.type === 'suggestions') {
            const suggestionChoices = result.data.map(x => x.title);
            suggestionChoices.push("🏠 Hủy yêu cầu");

            return res.json({
                reply: `Tôi tìm thấy <b>${result.data.length} địa bàn</b> liên quan đến "<b>${msg}</b>". Anh/Chị vui lòng chọn chính xác Xã/Phường:`,
                choices: suggestionChoices
            });
        } 
        
        // 3. Không tìm thấy
        else {
            return res.json({
                reply: `Tôi chưa tìm thấy địa bàn "<b>${msg}</b>". Anh/Chị vui lòng nhập lại tên Xã/Phường chính xác.`,
                choices: ["🏠 Hủy yêu cầu"]
            });
        }
    }

    // 1. Logic trả lời Hồ sơ (Đã có)
    if (msg === "📄 Hồ sơ") {
        if (!state.procedure) {
            return res.json({ reply: "Vui lòng nhập tên thủ tục trước khi xem hồ sơ.", choices: ["🔍 Thủ tục khác"] });
        }
        return res.json({ reply: renderSection.hồ_sơ(state.procedure), choices: ["💰 Lệ phí", "⏱ Thời gian thực hiện", "📞 Liên hệ Kiểm lâm", "🔍 Thủ tục khác"] });
    }

    // 2. Logic trả lời Lệ phí (Mới)
    if (msg === "💰 Lệ phí") {
        if (!state.procedure) return res.json({ reply: "Vui lòng nhập tên thủ tục để xem lệ phí.", choices: ["🔍 Thủ tục khác"] });
        
        return res.json({ 
            reply: renderSection.le_phi(state.procedure), 
            choices: ["📄 Hồ sơ", "⏱ Thời gian thực hiện", "📞 Liên hệ Kiểm lâm", "🔍 Thủ tục khác"] 
        });
    }

    // 3. Logic trả lời Thời gian thực hiện (Mới)
    if (msg === "⏱ Thời gian thực hiện") {
        if (!state.procedure) return res.json({ reply: "Vui lòng nhập tên thủ tục để xem thời gian xử lý.", choices: ["🔍 Thủ tục khác"] });
        
        return res.json({ 
            reply: renderSection.thoi_gian(state.procedure), 
            choices: ["📄 Hồ sơ", "💰 Lệ phí", "📞 Liên hệ Kiểm lâm", "🔍 Thủ tục khác"] 
        });
    }

  // --- LOGIC TÌM KIẾM NÂNG CẤP: TRÁNH VÒNG LẶP & TỰ ĐỘNG CHỌN ÁP ĐẢO ---

    // Bước 1: Lấy danh sách kết quả tiềm năng
    const results = searchMultipleProcedures(msg); 
	
	// Xử lý từ khóa quá ngắn hoặc không có kết quả
    if (msg.length <= 2 || results.length === 0) {
        return res.json({
            reply: `Từ khóa "<b>${msg}</b>" quá ngắn hoặc chưa rõ ràng. Anh/Chị vui lòng nhập tên thủ tục đầy đủ hơn (Ví dụ: <i>Xác nhận bảng kê, Cấp mã số...</i>)`,
            choices: ["🔍 Thủ tục khác"]
        });
    }
	
    if (results.length > 0) {
        const top1 = results[0];
        const top2 = results[1]; // Có thể undefined nếu chỉ có 1 kết quả

        // Bước 2: KIỂM TRA ĐỘ TỰ TIN (CONFIDENCE CHECK)
        
        // Điều kiện A: Khớp tuyệt đối 100% (thường là do bấm nút gợi ý)
        const isExact = normalizeText(top1.title || top1.ten_thu_tuc) === normalizeText(msg);

        // Điều kiện B: Điểm số áp đảo (Vị trí 1 có điểm gấp đôi vị trí 2)
        // Hoặc chỉ có duy nhất 1 kết quả và điểm của nó rất cao (> 500)
        const isOverwhelming = top2 
            ? (top1.score >= top2.score * 2) 
            : (top1.score > 500);

        // Bước 3: NẾU ĐỦ TỰ TIN -> HIỂN THỊ NỘI DUNG LUÔN
        if (isExact || isOverwhelming) {
            state.procedure = top1;
            state.waiting_location = false; 

            // Nếu là áp đảo (không phải khớp 100%), thêm một dòng nhỏ thông báo
            const prefix = isExact ? "" : `<i>Tôi đã tìm thấy thủ tục phù hợp nhất:</i><br><br>`;

            return res.json({ 
                reply: prefix + renderSection.thu_tuc(top1), 
                choices: ["📄 Hồ sơ", "💰 Lệ phí", "⏱ Thời gian thực hiện", "📞 Liên hệ Kiểm lâm", "🔍 Thủ tục khác"] 
            });
        }

        // Bước 4: NẾU KHÔNG ĐỦ TỰ TIN (Điểm các kết quả gần nhau) -> HIỂN THỊ GỢI Ý
        const suggestionChoices = results.map(p => p.title || p.ten_thu_tuc);
        suggestionChoices.push("🔍 Thủ tục khác");

        return res.json({
            reply: `Hệ thống tìm thấy <b>${results.length} thủ tục</b> liên quan đến "<b>${msg}</b>". Anh/Chị vui lòng chọn chính xác tên thủ tục cần xem:`,
            choices: suggestionChoices
        });
    }

    // Bước 5: KHÔNG TÌM THẤY KẾT QUẢ
    return res.json({
        reply: "Tôi chưa tìm thấy thủ tục nào khớp. Anh/Chị vui lòng nhập từ khóa khác (Ví dụ: 'bảng kê', 'gỗ', 'gây nuôi').",
        choices: ["🔍 Thủ tục khác"]
    });
} // Kết thúc domain "thu_tuc"

      // 3. Dữ liệu xã & Thống kê (Nâng cấp)
if (domain === "du_lieu") {
    const queryNorm = normalize(msg);

    // --- 🚫 CHẶN NGÔN NGỮ KHÔNG PHÙ HỢP ---
    const sensitiveWords = ["con cac", "vcl", "dm"];
    if (sensitiveWords.some(word => queryNorm.includes(word))) {
        return res.json({
            reply: "Chào bạn. Vui lòng sử dụng ngôn ngữ phù hợp để hệ thống hỗ trợ tốt hơn.",
            choices: ["🔎 Tìm xã khác"]
        });
    }

    // --- A. THỐNG KÊ ---
    const stats = getForestStatistics(msg);
    if (stats) {
        let reply = "";
        const choices = ["🔎 Xã khác"];

        switch (stats.type) {
            case "list":
                reply = `📍 **${stats.title}**:\n• ${stats.data.join("\n• ")}`;
                break;
            case "total":
                reply = `📊 **${stats.label}**: **${stats.value}**`;
                break;
            case "comparison":
                reply = `🏆 **${stats.name}** có ${stats.field} ${stats.status} với **${stats.value}**.`;
                break;
            case "management":
                reply = `🏛 **${stats.hat}** quản lý ${stats.count} đơn vị:\n• ${stats.list.join("\n• ")}`;
                break;
        }

        if (reply) return res.json({ reply, choices });
    }

    // --- B. SEARCH XÃ ---
    const result = searchXa(msg);

if (!result) {
    return res.json({
        reply: `Không tìm thấy địa bàn "<b>${msg}</b>"`,
        choices: ["🔎 Xã khác"]
    });
}

if (result.type === "too_short") {
    return res.json({
        reply: `Tên địa bàn "<b>${msg}</b>" quá ngắn hoặc chưa rõ ràng.`,
        choices: ["🔎 Xã khác"]
    });
}

if (result.type === "exact") {
    state.lastXaList = [result.data];
    return res.json({
        reply: renderSection.xa(result.data),
        choices: ["🔎 Xã khác"]
    });
}

if (result.type === "suggestions") {
    state.lastXaList = result.data;

    const suggestionChoices = result.data
        .slice(0, 8)
        .map(x => x.title);

    suggestionChoices.push("🔎 Xã khác");

    return res.json({
        reply: `🔍 Tìm thấy <b>${result.data.length} địa bàn</b>. Vui lòng chọn:`,
        choices: suggestionChoices
    });
}

    // 🚫 Query quá ngắn
    if (queryNorm.length <= 2) {
        return res.json({
            reply: `Tên địa bàn "<b>${msg}</b>" quá ngắn hoặc chưa rõ ràng.`,
            choices: ["🔎 Xã khác"]
        });
    }

    // 🧠 CLEAN TEXT
    const clean = (str) =>
        normalize(str).replace(/^(xa|phuong|thi tran)\s+/, '');

    const queryClean = clean(msg);

    if (!xaList || xaList.length === 0) {
        return res.json({
            reply: `Không tìm thấy địa bàn "<b>${msg}</b>"`,
            choices: ["🔎 Xã khác"]
        });
    }

    // --- 🎯 1. EXACT (KEYWORDS) ---
    const exactMatches = xaList.filter(x =>
        x.keywords?.some(k => clean(k) === queryClean)
    );

    if (exactMatches.length === 1) {
        state.lastXaList = exactMatches;
        return res.json({
            reply: renderSection.xa(exactMatches[0]),
            choices: ["🔎 Xã khác"]
        });
    }

    // --- 🎯 2. PREFIX (KEYWORDS) ---
    const prefixMatches = xaList.filter(x =>
        x.keywords?.some(k => clean(k).startsWith(queryClean))
    );

    if (prefixMatches.length > 0) {
        xaList = prefixMatches;
    } else {
        // --- 🎯 3. PHRASE (KEYWORDS) ---
        const phraseMatches = xaList.filter(x =>
            x.keywords?.some(k => clean(k).includes(queryClean))
        );

        if (phraseMatches.length > 0) {
            xaList = phraseMatches;
        }
    }

    // --- 🎯 4. SUGGESTIONS ---
    if (xaList.length > 1) {
        state.lastXaList = xaList;

        const suggestionChoices = xaList
            .slice(0, 8)
            .map(x => x.title);

        suggestionChoices.push("🔎 Xã khác");

        return res.json({
            reply: `🔍 Tìm thấy <b>${xaList.length} địa bàn</b> liên quan đến "<b>${msg}</b>". Vui lòng chọn:`,
            choices: suggestionChoices
        });
    }

    // --- 🎯 5. 1 KẾT QUẢ ---
    if (xaList.length === 1) {
        state.lastXaList = xaList;

        return res.json({
            reply: `<i>Địa bàn phù hợp nhất:</i><br><br>` + renderSection.xa(xaList[0]),
            choices: ["🔎 Xã khác"]
        });
    }

    // --- ❌ KHÔNG TÌM THẤY ---
    return res.json({
        reply: `Không tìm thấy địa bàn "<b>${msg}</b>"`,
        choices: ["🔎 Xã khác"]
    });
}

        // 4. Chủ rừng
        if (domain === "chu_rung") {
            const cr = chuRungDataset.find(i => normalize(i.title).includes(queryNorm));
            if (cr) {
                return res.json({ reply: renderSection.chu_rung(cr), choices: ["📊 Số liệu", "🔎 Chủ rừng khác"] });
            }
        }
      

// 5. Xử phạt (Xử lý tương tác thông minh)
if (domain === "xu_phat") {
    const currentData = state.lastItem;

    // --- BƯỚC A: KIỂM TRA TƯƠNG TÁC NÚT BẤM ---
    const selectedOption = currentData?.interactive_steps?.[0]?.options?.find(
        opt => opt.text === msg || opt.value === msg
    );
    
    const isBotLogicAction = (msg && (msg.startsWith('check_') || msg.startsWith('finish_'))) || selectedOption;

    if (isBotLogicAction && currentData) {
        const actionValue = selectedOption ? selectedOption.value : msg;
        const nextStep = renderSection.handleBotLogic(actionValue, currentData);
        
        if (nextStep) {
            return res.json({
                reply: nextStep.text,
                choices: nextStep.choices.map(c => ({ text: c.text, value: c.value }))
            });
        }
    }

    // --- BƯỚC B: TRA CỨU ĐIỀU LUẬT MỚI ---
    // ✅ QUAN TRỌNG: Đảm bảo queryNorm đã được định nghĩa ở đầu router.post
    const regulation = searchRegulation(queryNorm); 

    if (regulation) {
        state.lastItem = regulation; 
        const result = renderSection.vi_pham(regulation);
        
        return res.json({
            reply: result.html,
            choices: result.choices.length > 0 
                ? result.choices.map(c => ({ 
                    text: c.text, 
                    value: c.value 
                  }))
                : ["⚖️ Hành vi khác"]
        });
    }

    // --- BƯỚC C: THÔNG BÁO KHÔNG TÌM THẤY ---
    return res.json({ 
        reply: `⚠️ <b>Hệ thống chưa tìm thấy quy định cụ thể cho từ khóa này.</b><br><br>` +
              `Nếu cần hỗ trợ pháp lý chính xác, vui lòng liên hệ bộ phận chuyên môn của Chi cục.`,
        choices: ["⚖️ Tra cứu lại"] 
    });
}
		
        // 6. LAYER CUỐI: AI FALLBACK (Bản nâng cấp)

// Bước A: Định nghĩa chỉ dẫn riêng cho từng chuyên mục
const domainInstructions = {
    "hotline": "Bạn là nhân viên trực tổng đài PCCC Rừng Đồng Tháp. Nếu khách chào hoặc hỏi chung chung, hãy chào lại và nhắc họ có thể báo cháy rừng hoặc yêu cầu hỗ trợ khẩn cấp.",
    "xu_phat": "Bạn là chuyên gia pháp lý của Kiểm lâm Đồng Tháp. Nhiệm vụ của bạn là giải đáp mức xử phạt vi phạm hành chính trong lĩnh vực Lâm nghiệp. Hãy trả lời nghiêm túc, chính xác và nhắc người dùng rằng đây là thông tin tham khảo.",
	"chu_rung": "Bạn là chuyên viên quản lý chủ rừng. Hãy chào và hướng dẫn khách tra cứu danh sách chủ rừng hoặc diện tích theo đơn vị.",
    "thu_tuc": "Bạn là cán bộ hướng dẫn thủ tục hành chính Kiểm lâm. Hãy chào và hỏi khách cần làm thủ tục gì (vận chuyển, khai thác, gây nuôi...).",
    "du_lieu": "Bạn là chuyên viên thống kê rừng. Hãy chào và mời khách tra cứu diện tích rừng các xã.",
    "default": "Bạn là Trợ lý ảo Kiểm lâm Đồng Tháp. Hãy chào và tóm tắt các nhiệm vụ bạn có thể hỗ trợ."
};

const instruction = domainInstructions[domain] || domainInstructions.default;

// Bước B: Gọi AI với Prompt đã cá nhân hóa theo Tab
const aiFallback = await getSmartAIResponse(msg, instruction);

// Bước C: Disclaimer (Chỉ hiện khi thực sự gọi AI)
const disclaimer = `<br><br><small style="color: #888; display: block; border-top: 1px solid #eee; padding-top: 8px;">` +
                   `⚠️ <i>Trợ lý trả lời dựa trên chuyên mục <b>${domain || 'Tổng hợp'}</b>. Thông tin mang tính tham khảo.</i></small>`;

        return res.json({ 
            reply: aiFallback.reply + disclaimer, 
            choices: ["🔍 Thủ tục khác"] 
        });

    } catch (err) {
        console.error("❌ ERROR:", err);
        res.json({ reply: "⚠️ Hệ thống đang bận. Vui lòng thử lại sau." });
    }
});

export default router;