import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Fuse from "fuse.js"; // Thư viện tìm kiếm mờ (Fuzzy Search)

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let dataset = [];
let fuse = null;

/* =========================
   1. KHỞI TẠO & INDEXING
========================= */
try {
    const filePath = path.join(__dirname, "../data/xa_dataset.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    dataset = JSON.parse(raw);
    
    // Khởi tạo Fuse.js để tìm kiếm thông minh
    fuse = new Fuse(dataset, {
        keys: ["title", "keywords", "searchText"],
        threshold: 0.3, // Độ khớp (0 là khớp tuyệt đối, 1 là khớp hoàn toàn sai)
        includeScore: true
    });
    
    console.log(`✅ Hệ thống dữ liệu sẵn sàng: ${dataset.length} đơn vị.`);
} catch (e) {
    console.error("❌ Lỗi nạp dataset xã:", e.message);
}

function normalize(text = "") {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
}

/* =========================
   2. TÌM KIẾM CHI TIẾT (📍 Card Info)
   Nâng cấp: Trả về phân loại Exact hoặc Suggestions
	========================= */
	// ===== Utils =====
const clean = (str) =>
    normalize(str)
        .replace(/^(xa|phuong|thi tran)\s+/i, '')
        .trim();

// ===== Main Search =====
export function searchXa(query) {
    if (!query) return null;

    const q = clean(query);

    if (q.length <= 2) return { type: 'too_short' };

    const results = dataset.map(item => {
        const keywords = item.keywords.map(k => clean(k));
        const titleNorm = clean(item.title);

        let score = 0;
        let matchType = null;

        // 🥇 Exact (keywords)
        if (keywords.some(k => k === q)) {
            score = 1000;
            matchType = 'exact';
        }

        // 🥈 Prefix (keywords)
        else if (keywords.some(k => k.startsWith(q))) {
            score = 800;
            matchType = 'prefix';
        }

        // 🥉 Phrase (keywords)
        else if (keywords.some(k => k.includes(q))) {
            score = 600;
            matchType = 'phrase';
        }

        // 🪶 Fuzzy nhẹ (đủ TẤT CẢ từ)
        else {
            const words = q.split(/\s+/);

            const matched = keywords.some(k =>
                words.every(w => k.includes(w))
            );

            if (matched) {
                score = 100;
                matchType = 'fuzzy';
            }
        }

        return {
            ...item,
            score,
            matchType,
            titleNorm
        };
    });

    // 🎯 Lọc
    let matches = results.filter(r => r.score >= 100);

    if (matches.length === 0) return null;

    // ===== ƯU TIÊN =====

    // 🧠 Exact duy nhất
    const exacts = matches.filter(m => m.matchType === 'exact');
    if (exacts.length === 1) {
        return { type: 'exact', data: exacts[0] };
    }

    // 🧠 Prefix
    const prefixMatches = matches.filter(m => m.matchType === 'prefix');
    if (prefixMatches.length > 0) {
        matches = prefixMatches;
    }

    // 🧠 Phrase
    else {
        const phraseMatches = matches.filter(m => m.matchType === 'phrase');
        if (phraseMatches.length > 0) {
            matches = phraseMatches;
        }
    }

    // 🧠 Sort
    matches.sort((a, b) => b.score - a.score);

    // 🎯 Output
    if (matches.length === 1) {
        return {
            type: 'exact',
            data: matches[0]
        };
    }

    return {
        type: 'suggestions',
        data: matches.slice(0, 10)
    };
}

/* =========================
   3. TÌM KIẾM ĐA NHIỆM (PRO)
   Nâng cấp: Phân tích sâu thực thể (Entities) trong câu hỏi
========================= */
export function searchMultipleXa(query) {
  if (!query) return [];
  const q = normalize(query);
  
  // A. Nhận diện các câu hỏi mang tính tổng quát
  const isGlobal = /tat ca|toan bo|trong tinh|tong cong|he thong|toan tinh|tong dien tich/.test(q);
  
  if (isGlobal) {
    return dataset.map(item => ({
      ten: item.title,
      dt_rung: item.data.dien_tich_rung || 0,
      dt_lam_nghiep: item.data.dien_tich_lam_nghiep || 0,
      hat: item.data.hat_quan_ly
    }));
  }

  // B. KIỂM TRA KHỚP TUYỆT ĐỐI TRƯỚC (Để phá vòng lặp khi bấm nút)
  // Nếu người dùng gửi chính xác "Xã Tân Hòa", ta chỉ trả về đúng 1 kết quả đó.
  const exactMatch = dataset.find(item => normalize(item.title) === q);
  if (exactMatch) return [exactMatch];

  // C. Nếu không khớp tuyệt đối, mới dùng thuật toán lọc danh sách
  const results = dataset.filter(item => {
    const titleOnly = normalize(item.title).replace(/^(xa|phuong|thi tran)\s+/i, "");
    
    // Kiểm tra xem tiêu đề xã có nằm trong câu hỏi không
    const matchName = q.includes(titleOnly);
    const matchKeywords = item.keywords.some(kw => q.includes(normalize(kw)));
    
    return matchName || matchKeywords;
  });

  return results;
}

/* =========================
   4. TÍNH TOÁN NHANH (MỚI)
   Giúp AI trả lời ngay các câu hỏi về tổng số
========================= */
export function getQuickStats() {
    return dataset.reduce((acc, curr) => {
        acc.tong_dt_tu_nhien += (curr.data.dien_tich_tu_nhien || 0);
        acc.tong_dt_rung += (curr.data.dien_tich_rung || 0);
        acc.so_don_vi += 1;
        return acc;
    }, { tong_dt_tu_nhien: 0, tong_dt_rung: 0, so_don_vi: 0 });
}
/* =========================
   6. HÀM THỐNG KÊ THÔNG MINH (TỐI ƯU)
========================= */
export function getForestStatistics(query) {
    if (!query) return null;
    const q = normalize(query);
    
    // Thuật toán bóc tách thuộc tính dựa trên từ khóa
    const isForest = /rung/.test(q);
    const field = isForest ? "dien_tich_rung" : "dien_tich_lam_nghiep";
    const label = isForest ? "diện tích rừng" : "diện tích đất lâm nghiệp";

    // 1. Nhận diện câu hỏi "Danh sách/Liệt kê các xã có rừng"
    if (/liet ke|danh sach|tat ca|co bao nhieu xa/.test(q) && !/tong/.test(q)) {
        const list = dataset
            .filter(item => parseFloat(item.data.dien_tich_rung) > 0)
            .map(item => item.title);
        return { type: "list", data: list, title: "Danh sách các xã có rừng" };
    }

    // 2. Nhận diện câu hỏi "Tổng diện tích"
    if (/tong/.test(q)) {
        const total = dataset.reduce((sum, item) => sum + (parseFloat(item.data[field]) || 0), 0);
        return { 
            type: "total", 
            label: `Tổng ${label} toàn tỉnh`, 
            value: total.toLocaleString('vi-VN') + " ha" 
        };
    }

    // 3. Nhận diện câu hỏi so sánh "Nhiều nhất / Ít nhất"
    if (/nhieu nhat|it nhat|cao nhat|thap nhat|lon nhat/.test(q)) {
        const isMax = /nhieu|cao|lon/.test(q);
        
        // Lọc danh sách có dữ liệu để tránh lấy các xã bằng 0 khi tìm "ít nhất"
        const validData = dataset.filter(item => (parseFloat(item.data[field]) || 0) > 0);
        if (validData.length === 0) return null;

        const sorted = [...validData].sort((a, b) => 
            (parseFloat(b.data[field]) || 0) - (parseFloat(a.data[field]) || 0)
        );

        const result = isMax ? sorted[0] : sorted[sorted.length - 1];
        return {
            type: "comparison",
            status: isMax ? "nhiều nhất" : "ít nhất",
            name: result.title,
            field: label,
            value: (result.data[field] || 0) + " ha"
        };
    }

    // 4. Nhận diện câu hỏi theo Hạt Kiểm lâm (I, II, III)
    const hatMatch = q.match(/khu vuc\s+(i{1,3})/); // Regex bắt "khu vuc i/ii/iii"
    if (hatMatch) {
        const khuVuc = hatMatch[1].toUpperCase();
        const filtered = dataset.filter(item => 
            item.data.hat_quan_ly && item.data.hat_quan_ly.toUpperCase().includes(`KHU VUC ${khuVuc}`)
        );
        return {
            type: "management",
            hat: `Hạt Kiểm lâm khu vực ${khuVuc}`,
            count: filtered.length,
            list: filtered.map(i => i.title)
        };
    }

    return null;
}
export function getAllXaData() {
    return dataset;
}