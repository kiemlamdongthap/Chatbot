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
   Nâng cấp: Ưu tiên khớp tuyệt đối trước, nếu không có mới tìm kiếm mờ
========================= */
export function searchXa(query) {
    if (!query) return null;
    const q = normalize(query);

    // Bước 1: Thử tìm khớp chính xác tiêu đề trước
    const exactMatch = dataset.find(item => normalize(item.title) === q || normalize(item.title).includes(q));
    if (exactMatch) return exactMatch;

    // Bước 2: Nếu không khớp chính xác, dùng Fuzzy Search
    const fuzzyResults = fuse.search(query);
    return fuzzyResults.length > 0 ? fuzzyResults[0].item : null;
}

/* =========================
   3. TÌM KIẾM ĐA NHIỆM (PRO)
   Nâng cấp: Phân tích sâu thực thể (Entities) trong câu hỏi
========================= */
export function searchMultipleXa(query) {
    if (!query) return [];
    const q = normalize(query);

    // A. Nhận diện các câu hỏi tổng hợp bằng Regex nâng cao
    const globalPatterns = {
        isGlobal: /tat ca|toan bo|trong tinh|tong cong|he thong|toan tinh|danh sach/.test(q),
        isForestry: /dien tich rung|lam nghiep|do che phu|tru luong/.test(q),
        isAdministrative: /hat|chi cuc|kiem lam vien|sdt|dien thoai/.test(q)
    };

    if (globalPatterns.isGlobal) {
        return dataset.map(item => ({
            ten: item.title,
            // Trả về dữ liệu tùy biến theo nhu cầu câu hỏi (giảm tải dung lượng)
            ...(globalPatterns.isForestry && { 
                dt_rung: item.data.dien_tich_rung || 0,
                dt_lam_nghiep: item.data.dien_tich_lam_nghiep || 0 
            }),
            ...(globalPatterns.isAdministrative && { 
                hat: item.data.hat_quan_ly,
                sdt: item.data["So dien thoai"]
            }),
            type: item.type
        }));
    }

    // B. Thuật toán "Sliding Window" để tìm nhiều xã trong 1 câu
    // Ví dụ: "Diện tích rừng xã An Hòa và Đốc Binh Kiều" -> Trả ra 2 Object xã
    const foundResults = [];
    dataset.forEach(item => {
        const titleOnly = normalize(item.title).replace(/^(xa|phuong|thi tran)\s+/i, "");
        // Nếu câu hỏi chứa tên xã hoặc bất kỳ từ khóa nào của xã đó
        if (q.includes(titleOnly) || item.keywords.some(kw => q.includes(normalize(kw)))) {
            foundResults.push(item);
        }
    });

    return foundResults;
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