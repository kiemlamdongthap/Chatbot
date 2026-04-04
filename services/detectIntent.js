/**
 * detectIntent.js
 * ----------------
 * Nhận diện ý định người dùng
 * Chuẩn MỨC 6 – Production, không lặp, không nhiễu
 */

export function detectIntent(input = "") {
  const text = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!text) return "EMPTY";

  /* ==================================================
     🔹 XÁC NHẬN – ƯU TIÊN CAO NHẤT
     ================================================== */
  if (/^(dung|dung roi|ok|chinh xac)$/.test(text)) {
    return "CONFIRM_YES";
  }

  if (/^(khong|sai|chua dung)$/.test(text)) {
    return "CONFIRM_NO";
  }

  /* ==================================================
     🔹 SYSTEM – GIỚI THIỆU CHATBOT
     ================================================== */
  if (/(ban la ai|ai vay|gioi thieu|chuc nang|lam duoc gi)/.test(text)) {
    return "SYSTEM";
  }

  /* ==================================================
     🔹 XÃ GIAO
     ================================================== */
  if (/^(hi|hello|xin chao|chao|chao ban)$/.test(text)) {
    return "SMALL_TALK";
  }

  /* ==================================================
     🔹 BIỂU MẪU – FORM
     ================================================== */
  if (/(bieu mau|mau don|tai mau|don de nghi|form)/.test(text)) {
    return "ASK_FORM";
  }

  /* ==================================================
     🔹 KIẾN THỨC / PHÁP LUẬT
     ================================================== */
  if (/(la gi|khai niem|dinh nghia)/.test(text)) {
    return "LAW_EXPLAIN";
  }

  /* ==================================================
     🔹 NGHĨA VỤ – BẮT BUỘC
     ================================================== */
  if (/(co bat buoc|co can|co phai)/.test(text)) {
    return "OBLIGATION";
  }

  /* ==================================================
     🔹 HẬU QUẢ – XỬ PHẠT
     ================================================== */
  if (/(khong lam|khong dang ky|bi phat|xu phat|hau qua)/.test(text)) {
    return "CONSEQUENCE";
  }

  /* ==================================================
     🔹 HỎI THEO BƯỚC
     ================================================== */
  if (/buoc\s*1/.test(text)) return "STEP_1";
  if (/buoc\s*2/.test(text)) return "STEP_2";
  if (/buoc\s*3/.test(text)) return "STEP_3";

  /* ==================================================
     🔹 HỎI CHI TIẾT THỦ TỤC
     ================================================== */
  if (/(ho so|giay to|can chuan bi)/.test(text)) {
    return "ASK_DOCUMENTS";
  }

  if (/(bao lau|thoi gian|may ngay)/.test(text)) {
    return "ASK_TIME";
  }

  if (/(le phi|phi thu tuc)/.test(text)) {
    return "ASK_FEE";
  }

  if (/(nop o dau|co quan|dia diem|noi nop)/.test(text)) {
    return "ASK_AUTHORITY";
  }

  if (/(ket qua|nhan duoc gi)/.test(text)) {
    return "ASK_RESULT";
  }

  /* ==================================================
     🔹 ĐỊA BÀN
     ================================================== */
  if (/(phuong|xa|quan|huyen|tinh)/.test(text)) {
    return "LOCATION_INPUT";
  }

  /* ==================================================
     🔹 THỦ TỤC HÀNH CHÍNH (INTENT CHÍNH)
     ================================================== */
  if (
    /(dang ky|cap moi|cap lai|gia han|xuat khau|nhap khau|ma so|cites)/.test(text)
  ) {
    return "PROCEDURE";
  }

  /* ==================================================
     🔹 FALLBACK – AI
     ================================================== */
  return "UNKNOWN";
}
