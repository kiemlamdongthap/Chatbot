import { GoogleGenerativeAI } from "@google/generative-ai";
import { cacheManager } from "../utils/cacheManager.js";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Sử dụng nhiệt độ thấp để giữ tính logic và responseMimeType để đảm bảo JSON sạch
const model = genAI.getGenerativeModel({
  model: "models/gemini-2.5-flash",
  generationConfig: {
    temperature: 0.1,
    topP: 0.95,
    responseMimeType: "application/json",
  }
});

/**
 * 🚀 AI SERVICE PRO: Xử lý đa luồng dữ liệu & Thống kê
 */
export async function getSmartAIResponse(userInput, context = "") {
  
  // 1. Quản lý Cache
  const cacheKey = Buffer.from(`${userInput}_${context}`).toString('base64');
  const existingCache = cacheManager.getRawData();
  if (existingCache[cacheKey]) return existingCache[cacheKey].data;

  // 2. Prompt Kỹ thuật (Hợp nhất Logic phân tích)
  const systemPrompt = `
BẠN LÀ CHUYÊN GIA DỮ LIỆU CỦA LỰC LƯỢNG KIỂM LÂM.
DỮ LIỆU HỆ THỐNG CUNG CẤP (JSON):
----------------------
${context || "TRỐNG - Không có dữ liệu xã/diện tích rừng cho yêu cầu này."}
----------------------

NHIỆM VỤ CHIẾN LƯỢC:
1. PHÂN LOẠI Ý ĐỊNH (INTENT):
   - "tra_cuu_thong_ke": Khi hỏi về diện tích rừng, đất lâm nghiệp, tổng ha, so sánh các xã.
   - "hỏi_thủ_tục": Khi hỏi về mã số, CITES, gây nuôi, vận chuyển, khai thác, hồ sơ.
   - "chào_hỏi": Khi là câu giao tiếp thông thường.

2. LOGIC TÍNH TOÁN DIỆN TÍCH:
   - Nếu Intent là "tra_cuu_thong_ke":
     * Bạn PHẢI quét toàn bộ mảng JSON được cung cấp.
     * TỰ ĐỘNG CỘNG TỔNG các trường 'dien_tich_rung' (hoặc 'dt_rung') và 'dien_tich_lam_nghiep'.
     * Nếu context TRỐNG: Tuyệt đối không bịa số. Trả lời: "Hệ thống chưa ghi nhận số liệu rừng cho khu vực này."
     * Nếu có dữ liệu: Trả lời kèm con số tổng cụ thể (Ví dụ: "Tổng diện tích có rừng là 1.234,5 ha").

3. LOGIC THỦ TỤC:
   - Nếu Intent là "hỏi_thủ_tục": 
     * Trích xuất các từ khóa hành chính quan trọng vào mảng 'keywords' (Ví dụ: ["mã số gây nuôi", "cites"]).

TRẢ VỀ JSON THEO ĐỊNH DẠNG:
{
  "intent": "tra_cuu_thong_ke" | "hỏi_thủ_tục" | "chào_hỏi",
  "reply": "Nội dung câu trả lời (Viết lịch sự, chuyên nghiệp)",
  "keywords": ["tên đơn vị hành chính hoặc từ khóa thủ tục"],
  "debug_info": "Giải thích ngắn gọn phép tính bạn đã làm"
}
`;

  try {
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `YÊU CẦU NGƯỜI DÙNG: "${userInput}"` }
    ]);

    const responseText = result.response.text();
    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI trả về định dạng không hợp lệ");
    
    const parsedData = JSON.parse(match[0]);

    // 4. Lưu Cache và Trả về
    cacheManager.save(cacheKey, parsedData);
    return parsedData;

  } catch (err) {
    console.error("❌ AI Error:", err.message);
    return { 
      intent: "khác", 
      reply: "Tôi có thể hỗ trợ Anh/Chị tra cứu diện tích rừng hoặc hướng dẫn các thủ tục gây nuôi, khai thác lâm sản. Anh/Chị cần thông tin gì ạ?",
      keywords: [] 
    };
  }
}