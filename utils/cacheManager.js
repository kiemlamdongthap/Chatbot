import fs from "fs";
import path from "path";

// Đường dẫn file cache.json nằm trong thư mục data của dự án
const CACHE_FILE = path.resolve("./data/ai_cache.json");

// Tự động tạo thư mục data nếu chưa có
if (!fs.existsSync("./data")) {
  fs.mkdirSync("./data", { recursive: true });
}

export const cacheManager = {
  /**
   * Đọc toàn bộ dữ liệu từ file JSON
   */
  getRawData() {
    try {
      if (fs.existsSync(CACHE_FILE)) {
        const data = fs.readFileSync(CACHE_FILE, "utf-8");
        return JSON.parse(data || "{}");
      }
    } catch (err) {
      console.error("❌ Lỗi đọc file cache:", err.message);
    }
    return {};
  },

  /**
   * Lưu một cặp Key-Value mới vào file
   */
  save(key, value) {
    try {
      const allCache = this.getRawData();
      allCache[key] = {
        data: value,
        createdAt: new Date().toISOString()
      };
      fs.writeFileSync(CACHE_FILE, JSON.stringify(allCache, null, 2), "utf-8");
      console.log(`💾 Đã lưu cache mới cho key: ${key.substring(0, 10)}...`);
    } catch (err) {
      console.error("❌ Lỗi ghi file cache:", err.message);
    }
  }
};