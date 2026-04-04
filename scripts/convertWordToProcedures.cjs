import fs from "fs";
import path from "path";
import mammoth from "mammoth";

const INPUT_FILE = "./docs/procedures.docx";
const OUTPUT_DIR = "./data/procedures";

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

async function convert() {
  const result = await mammoth.extractRawText({ path: INPUT_FILE });

  const text = result.value;

  const procedures = text.split(/(?=Thủ tục)/gi);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  procedures.forEach((block) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 3) return;

    const title = lines[0];

    const id = slugify(title);

    const description = lines.slice(1, 3).join(" ");

    const documents = [];
    const legal_basis = [];

    lines.forEach((line) => {
      const lower = line.toLowerCase();

      if (lower.includes("đơn") || lower.includes("hồ sơ")) {
        documents.push(line);
      }

      if (
        line.includes("Luật") ||
        line.includes("Nghị định") ||
        line.includes("Thông tư")
      ) {
        legal_basis.push(line);
      }
    });

    const json = {
      id,
      title,
      description,
      documents,
      legal_basis,
    };

    const filePath = `${OUTPUT_DIR}/${id}.json`;

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf8");

    console.log("Created:", filePath);
  });

  console.log("✅ Done converting procedures.");
}

convert();