import fs from "fs";
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

function extractField(lines, keywords) {
  const results = [];
  lines.forEach((line) => {
    keywords.forEach((k) => {
      if (line.toLowerCase().includes(k)) {
        results.push(line);
      }
    });
  });
  return results;
}

async function convert() {
  console.log("📄 Reading Word file...");

  const result = await mammoth.extractRawText({ path: INPUT_FILE });
  const text = result.value;

  const procedures = text.split(/(?=Thủ tục)/gi);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let count = 0;

  procedures.forEach((block) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 5) return;

    const title = lines[0];
    const id = slugify(title);

    const description = lines.slice(1, 4).join(" ");

    const documents = extractField(lines, [
      "đơn",
      "hồ sơ",
      "bản sao",
      "giấy tờ",
      "bảng kê"
    ]);

    const legal_basis = extractField(lines, [
      "luật",
      "nghị định",
      "thông tư",
      "quyết định"
    ]);

    const processing_time = lines.find((l) =>
      l.toLowerCase().includes("thời hạn")
    ) || "";

    const authority = lines.find((l) =>
      l.toLowerCase().includes("cơ quan")
    ) || "";

    const result_field = lines.find((l) =>
      l.toLowerCase().includes("kết quả")
    ) || "";

    const json = {
      id,
      title,
      description,
      documents,
      legal_basis,
      processing_time,
      authority,
      result: result_field
    };

    const filePath = `${OUTPUT_DIR}/${id}.json`;

    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf8");

    console.log("✅ Created:", filePath);

    count++;
  });

  console.log("🎉 Total procedures:", count);
}

convert();