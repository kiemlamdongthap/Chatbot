import fs from "fs";
import path from "path";

const PROCEDURE_DIR = path.resolve("./data/procedures");
let proceduresCache = null;

/**
 * Chuẩn hóa văn bản: bỏ dấu, viết thường, bỏ ký tự đặc biệt
 */
function normalizeText(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

/**
 * Thuật toán tính độ tương đồng chuỗi (Dice's Coefficient)
 */
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

export function semanticSearchProcedure(query) {
  const all = loadProcedures();
  const queryNorm = normalizeText(query);
  let bestMatch = null;
  let highestScore = 0;

  for (const proc of all) {
    let score = 0;
    const titleNorm = normalizeText(proc.title);

    // Ưu tiên 1: Khớp từ khóa trong tiêu đề
    if (titleNorm.includes(queryNorm) || queryNorm.includes(titleNorm)) score += 100;

    // Ưu tiên 2: Độ tương đồng mờ
    score += getSimilarity(query, proc.title) * 80;

    // Ưu tiên 3: Khớp trong mảng keywords bổ sung
    if (proc.keywords?.some(kw => normalizeText(kw).includes(queryNorm))) score += 50;

    if (score > highestScore) {
      highestScore = score;
      bestMatch = proc;
    }
  }

  return highestScore > 40 ? bestMatch : null;
}