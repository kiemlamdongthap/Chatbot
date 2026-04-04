import { normalize } from "./normalize.js";

export function detectIntent(input = "") {
  const text = normalize(input);
  if (!text) return "EMPTY";

  if (/^(hi|hello|xin chao|chao)$/.test(text)) return "SMALL_TALK";
  if (/ban la ai|ai vay|gioi thieu/.test(text)) return "SYSTEM";
  if (/ai tao ra ban|ai lam ra ban/.test(text)) return "CREATOR";
  if (/^cites$|cites la gi/.test(text)) return "CITES_EXPLAIN";

  if (/^(dung|ok|chinh xac)$/.test(text)) return "CONFIRM_YES";
  if (/^(khong|sai|chua dung)$/.test(text)) return "CONFIRM_NO";

  if (/bieu mau|tai mau|form|mau don/.test(text)) return "ASK_FORM";
  if (/ho so|giay to/.test(text)) return "ASK_DOCUMENTS";
  if (/thoi gian|bao lau/.test(text)) return "ASK_TIME";
  if (/le phi|phi/.test(text)) return "ASK_FEE";
  if (/ket qua/.test(text)) return "ASK_RESULT";
  if (/nop o dau|co quan/.test(text)) return "ASK_AUTHORITY";

  if (/phuong|xa|huyen|quan|tinh/.test(text)) return "LOCATION_INPUT";

  if (/dang ky|cap moi|cap lai|ma so|co so nuoi|cites/.test(text))
    return "PROCEDURE";

  return "UNKNOWN";
}
