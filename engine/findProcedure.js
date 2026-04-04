import fs from "fs";
import path from "path";
import { normalize } from "./normalize.js";

let procedures = [];

try {
  const dataPath = path.resolve("data/procedures.json");
  const raw = fs.readFileSync(dataPath, "utf8");
  procedures = JSON.parse(raw);
} catch (err) {
  console.error("❌ Lỗi load procedures.json:", err.message);
}

export function findProcedureByKeyword(keyword = "") {
  const key = normalize(keyword);

  return procedures.filter(p =>
    Array.isArray(p.keywords) &&
    p.keywords.some(k => normalize(k).includes(key))
  );
}
