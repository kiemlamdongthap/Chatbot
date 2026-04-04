import { normalizeText } from "../utils/text.js";

const PROCEDURE_HINTS = [
  "đăng ký",
  "cấp phép",
  "mã số",
  "trại nuôi",
  "vận chuyển",
  "nguồn gốc",
  "khai thác",
  "nuôi",
  "cites"
];

export function analyzeQuery(question) {

  const text = normalizeText(question);

  const tokens = text.split(/\s+/);

  const keywords = [];

  tokens.forEach(t => {

    if (PROCEDURE_HINTS.includes(t)) {
      keywords.push(t);
    }

  });

  /* detect animals */

  const animals = [
    "ran",
    "ho mang",
    "rua",
    "khi",
    "chim",
    "dong vat"
  ];

  animals.forEach(a => {

    if (text.includes(a)) {
      keywords.push("nuôi động vật rừng");
    }

  });

  return keywords.join(" ");

}