import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* =========================
   1. KHỞI TẠO & LOAD DATASET
========================= */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
let dataset = [];

try {
  // Đảm bảo đường dẫn tới file JSON chính xác
  const filePath = path.join(__dirname, "../data/xa_dataset.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  dataset = JSON.parse(raw);
  console.log(`✅ Đã nạp dữ liệu: ${dataset.length} đơn vị hành chính.`);
} catch (e) {
  console.error("❌ Lỗi nạp dataset xã:", e.message);
}

/* =========================
   2. HÀM CHUẨN HÓA (NORMALIZE)
========================= */
function normalize(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Xóa dấu tiếng Việt
    .replace(/đ/g, "d")
    .trim();
}

/* =========================
   3. HÀM TÌM 1 XÃ DUY NHẤT
   Dùng để hiển thị bảng thông số chi tiết (📍 Card info)
========================= */
export function searchXa(query) {
  if (!query) return null;
  const q = normalize(query);
  let best = null;
  let bestScore = 0;

  for (const item of dataset) {
    const textToSearch = normalize(`${item.title} ${item.keywords.join(" ")} ${item.searchText || ""}`);
    
    if (textToSearch.includes(q)) {
      const score = q.length / textToSearch.length;
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }
  }
  return best;
}

/* =========================
   4. HÀM TÌM NHIỀU XÃ (PRO)
   Tự động phân loại: Tra cứu toàn tỉnh hoặc lọc danh sách xã
========================= */
export function searchMultipleXa(query) {
  if (!query) return [];
  const q = normalize(query);
  
  // A. Nhận diện các câu hỏi mang tính tổng quát (Toàn tỉnh, tất cả...)
  const isGlobal = /tat ca|toan bo|trong tinh|tong cong|he thong|toan tinh|tong dien tich/.test(q);
  
  if (isGlobal) {
    // Chỉ lấy Tên + Số liệu để AI tính toán cực nhanh, tránh tràn Token
    return dataset.map(item => ({
      ten: item.title,
      dt_rung: item.data.dien_tich_rung || 0,
      dt_lam_nghiep: item.data.dien_tich_lam_nghiep || 0,
      hat: item.data.hat_quan_ly
    }));
  }

  // B. Tìm kiếm danh sách các xã cụ thể có tên xuất hiện trong câu hỏi
  const results = dataset.filter(item => {
    // Chuẩn hóa tên riêng (bỏ "xã", "phường"...)
    const titleOnly = normalize(item.title).replace(/^(xa|phuong|thi tran)\s+/i, "");
    
    // Khớp nếu tên xã hoặc từ khóa nằm trong câu hỏi
    const matchName = q.includes(titleOnly);
    const matchKeywords = item.keywords.some(kw => q.includes(normalize(kw)));
    
    return matchName || matchKeywords;
  });

  return results;
}

/* =========================
   5. HÀM LẤY TOÀN BỘ DỮ LIỆU
========================= */
export function getAllXaData() {
  return dataset;
}