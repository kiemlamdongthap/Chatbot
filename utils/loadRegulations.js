import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* ============================================================
   🔧 FIX __dirname cho ES Module
============================================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ============================================================
   📜 LOAD REGULATIONS
============================================================ */
export const loadRegulations = () => {
  const dir = path.join(__dirname, "../data/regulations");

  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".json"))
    .map(f => {
      try {
        const raw = fs.readFileSync(path.join(dir, f), "utf-8");
        const data = JSON.parse(raw);

        return {
          ...data,
          legal_basis: data.legal_basis || [
            "Nghị định số 35/2019/NĐ-CP;",
            "Nghị định số 07/2022/NĐ-CP"
          ]
        };

      } catch (e) {
        console.error("❌ JSON lỗi:", f, e.message);
        return null;
      }
    })
    .filter(Boolean);
};