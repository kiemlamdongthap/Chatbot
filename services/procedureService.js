import fs from "fs";
import path from "path";

const PROCEDURE_DIR = "./data/procedures";

export function loadProcedures() {

  const files = fs.readdirSync(PROCEDURE_DIR);

  const procedures = files.map(file => {
    const content = fs.readFileSync(
      path.join(PROCEDURE_DIR, file),
      "utf8"
    );
    return JSON.parse(content);
  });

  return procedures;
}

export function findProcedureByKeyword(keyword) {

  const procedures = loadProcedures();

  keyword = keyword.toLowerCase();

  return procedures.filter(p =>
    p.title.toLowerCase().includes(keyword) ||
    p.description.toLowerCase().includes(keyword)
  );
}