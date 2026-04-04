import { normalizeText } from "../utils/text.js";

export function detectIntent(text) {

  const t = normalizeText(text);

  // 🟢 CHÀO HỎI
  if (
    t.includes("chao") ||
    t.includes("hello") ||
    t.includes("xin chao")
  ) {
    return "SMALL_TALK";
  }

  // 🟢 GIỚI THIỆU HỆ THỐNG
  if (
    t.includes("ban la ai") ||
    t.includes("ban lam gi") ||
    t.includes("chuc nang") ||
    t.includes("ho tro gi")
  ) {
    return "SYSTEM";
  }

  // 🟢 HỎI THỦ TỤC
  if (
    t.includes("thu tuc") ||
    t.includes("cap phep") ||
    t.includes("giay phep") ||
    t.includes("dang ky") ||
    t.includes("xuat khau") ||
    t.includes("nhap khau")
  ) {
    return "PROCEDURE";
  }

  // 🟢 HỒ SƠ
  if (
    t.includes("ho so") ||
    t.includes("giay to") ||
    t.includes("can giay")
  ) {
    return "DOCUMENTS";
  }

  // 🟢 THỜI HẠN
  if (
    t.includes("bao lau") ||
    t.includes("thoi han") ||
    t.includes("may ngay")
  ) {
    return "PROCESS_TIME";
  }

  // 🟢 CƠ QUAN
  if (
    t.includes("co quan") ||
    t.includes("noi nop") ||
    t.includes("nop o dau")
  ) {
    return "AUTHORITY";
  }

  // 🟢 PHÍ
  if (
    t.includes("le phi") ||
    t.includes("phi") ||
    t.includes("bao nhieu tien")
  ) {
    return "FEE";
  }

  // 🟢 GIẢI THÍCH LUẬT
  if (
    t.includes("tai sao") ||
    t.includes("vi sao") ||
    t.includes("ly do") ||
    t.includes("quy dinh")
  ) {
    return "LAW_EXPLAIN";
  }

  // 🟢 BẮT BUỘC
  if (
    t.includes("co bat buoc") ||
    t.includes("bat buoc khong") ||
    t.includes("phai khong")
  ) {
    return "OBLIGATION";
  }

  // 🟢 HẬU QUẢ
  if (
    t.includes("vi pham") ||
    t.includes("khong lam") ||
    t.includes("bi phat")
  ) {
    return "CONSEQUENCE";
  }

  return "UNKNOWN";
}