import XLSX from "xlsx";
import fs from "fs";

/* =========================
   🔤 NORMALIZE
========================= */
function normalize(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

/* =========================
   🧹 CLEAN TEXT
========================= */
function cleanText(val) {
  if (!val) return null;

  return String(val)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^xã\s*/i, "")
    .replace(/^phường\s*/i, "")
    .trim();
}

/* =========================
   🔢 PARSE NUMBER (FIX CHUẨN)
========================= */
function parseNumber(val) {
  if (!val) return null;

  let str = String(val)
    .replace(/\./g, "") // remove thousands separator
    .replace(",", "."); // convert decimal

  const num = Number(str);
  return isNaN(num) ? null : num;
}

/* =========================
   📥 LOAD EXCEL
========================= */
let rows = [];

try {
  const wb = XLSX.readFile("./data/CAP_XA_MOI_RUNG.xlsx");
  const sheet = wb.Sheets[wb.SheetNames[0]];
  rows = XLSX.utils.sheet_to_json(sheet);
} catch (err) {
  console.error("❌ Lỗi đọc Excel:", err.message);
  process.exit(1);
}

/* =========================
   🧹 CLEAN DATA
========================= */
const cleaned = rows
  .map((r, i) => {
    const xaMoi = cleanText(r["Xã mới"]);

    if (!xaMoi) return null;

    return {
      stt: r["STT"] || i + 1,

      xa_cu: cleanText(r["Xã cũ"]),
      xa_moi: xaMoi,

      chu_rung: cleanText(r["Chủ rừng"]),

      dien_tich_tu_nhien: parseNumber(r["DT tự nhiên"]),
      dien_tich_lam_nghiep: parseNumber(r["DT lâm nghiệp"]),
      dien_tich_rung: parseNumber(r["DT rừng"]),

      hat_quan_ly: cleanText(r["Hạt quản lý"]),

      /* 🔥 thêm field phục vụ search */
      search_key: normalize(xaMoi)
    };
  })
  .filter(Boolean);

/* =========================
   🧠 REMOVE DUPLICATE
========================= */
const uniqueMap = new Map();

for (const item of cleaned) {
  if (!uniqueMap.has(item.search_key)) {
    uniqueMap.set(item.search_key, item);
  }
}

const finalData = Array.from(uniqueMap.values());

/* =========================
   💾 SAVE
========================= */
fs.writeFileSync(
  "./data/cleaned.json",
  JSON.stringify(finalData, null, 2)
);

console.log("✅ Cleaned:", finalData.length);