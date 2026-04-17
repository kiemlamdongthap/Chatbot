import fs from "fs";
import path from "path";

const PROCEDURE_DIR = path.resolve("./data/procedures");
let proceduresCache = null;

// Giữ nguyên hàm normalizeText của Phúc
export function normalizeText(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

// Giữ nguyên hàm getSimilarity (Dice's Coefficient)
function getSimilarity(s1, s2) {
  const n1 = normalizeText(s1);
  const n2 = normalizeText(s2);
  if (n1 === n2) return 1.0;
  if (n1.length < 2 || n2.length < 2) return 0.0;
  const bigrams1 = new Set();
  for (let i = 0; i < n1.length - 1; i++) bigrams1.add(n1.substring(i, i + 2));
  let intersect = 0;
  for (let i = 0; i < n2.length - 1; i++) {
    if (bigrams1.has(n2.substring(i, i + 2))) intersect++;
  }
  return (2.0 * intersect) / (bigrams1.size + (n2.length - 1));
}

function loadProcedures() {
  if (proceduresCache) return proceduresCache;
  try {
    if (!fs.existsSync(PROCEDURE_DIR)) return [];
    const files = fs.readdirSync(PROCEDURE_DIR);
    proceduresCache = files.flatMap(file => {
      if (!file.endsWith(".json")) return [];
      const content = fs.readFileSync(path.join(PROCEDURE_DIR, file), "utf-8");
      return JSON.parse(content);
    });
    return proceduresCache;
  } catch (err) {
    console.error("❌ Lỗi load procedures:", err.message);
    return [];
  }
}

/**
 * NÂNG CẤP: Tìm danh sách các thủ tục tiềm năng với logic TRỌNG SỐ & ÁP ĐẢO
 */
export const searchMultipleProcedures = (query) => {
    const all = loadProcedures();
    const queryNorm = normalizeText(query);
    // Nếu từ khóa chỉ có 1 hoặc 2 ký tự, không tìm kiếm để tránh kết quả rác
    if (queryNorm.length <= 2) {
        return []; 
    }
    // Tách từ và bỏ qua các từ cực ngắn (1 ký tự) để tránh nhiễu
    const queryWords = queryNorm.split(/\s+/).filter(w => w.length > 1); 

    if (queryNorm.length < 2) return [];

    const results = all.map(proc => {
        let score = 0;
        const titleNorm = normalizeText(proc.title || proc.ten_thu_tuc);
        const keyNorm = proc.keywords ? normalizeText(proc.keywords.join(" ")) : "";

        // 1. KHỚP TUYỆT ĐỐI (Điểm tối đa - Chống vòng lặp)
        if (titleNorm === queryNorm) score += 1000;

        // 2. KHỚP CỤM TỪ TRONG TIÊU ĐỀ
        if (titleNorm.includes(queryNorm)) score += 300; 

       // 3. KHỚP TỪNG TỪ ĐƠN LẺ (Nâng cấp)
		let wordsFound = 0;
		queryWords.forEach(word => {
    // Tạo Regex kiểm tra từ đứng độc lập, không phân biệt hoa thường
    // Cách này giúp "An" không bao giờ dính vào "Phương án" hay "Bản kê"
		const regex = new RegExp(`(^|\\s)${word}($|\\s)`, 'g');
    
    if (titleNorm.match(regex)) {
        score += 100; // Tăng điểm mạnh vì khớp nguyên từ chuẩn
        wordsFound++;
    } else {
        // Chỉ cộng điểm "khớp một phần" nếu từ đó đủ dài (tránh nhiễu từ 1-2 ký tự)
        if (word.length > 2 && titleNorm.includes(word)) {
            score += 20; 
        }
    }
});

        // Bonus nếu khớp tất cả các từ trong query
        if (wordsFound === queryWords.length && queryWords.length > 0) score += 200;

        // 4. Dice's Coefficient (Độ tương đồng mờ)
        score += getSimilarity(query, proc.title || proc.ten_thu_tuc) * 100;

        // 5. Khớp trong keywords bổ sung
        if (keyNorm.includes(queryNorm)) score += 150;

        return { ...proc, score };
    });

    // Sắp xếp giảm dần theo điểm
    return results
        .filter(r => r.score > 150) 
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
};

/**
 * Hàm lọc ÁP ĐẢO: Quyết định xem có nên hiện thẳng nội dung hay không
 */
export function getConfidentResult(results, query) {
    if (!results || results.length === 0) return null;

    const top1 = results[0];
    const top2 = results[1];
    const queryNorm = normalizeText(query);

    // Điều kiện 1: Khớp 100% tiêu đề -> Trả về ngay
    if (normalizeText(top1.title || top1.ten_thu_tuc) === queryNorm) return top1;

    // Điều kiện 2: Điểm áp đảo (Top 1 gấp đôi Top 2 hoặc chỉ có 1 kết quả cực rõ ràng)
    const isOverwhelming = top2 
        ? (top1.score >= top2.score * 2) 
        : (top1.score > 500);

    if (isOverwhelming) return top1;

    return null; // Không đủ tự tin, cần đưa ra danh sách gợi ý
}