import fs from "fs";
import slugify from "slugify";

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

const raw = JSON.parse(fs.readFileSync("./data/cleaned.json"));

const result = raw.map(r => {
  const slug = slugify(r.xa_moi, { lower: true });

  const keywords = [
    r.xa_moi,
    `xã ${r.xa_moi}`,
    `phường ${r.xa_moi}`,
    normalize(r.xa_moi)
  ];

  return {
    id: slug,
    type: "xa_lam_nghiep",
    title: `Xã ${r.xa_moi}`,

    keywords,

    searchText: keywords.join(" "),

    data: r,

    aiQuestions: [
      `${r.xa_moi} ở đâu`,
      `diện tích rừng ${r.xa_moi}`,
      `chủ rừng ${r.xa_moi}`
    ]
  };
});

fs.writeFileSync("./data/xa_dataset.json", JSON.stringify(result, null, 2));

console.log("✅ Dataset ready:", result.length);