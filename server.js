import express from "express";
import cors from "cors";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import open from "open"; // 1. Import thư viện open
import chatbotRouter from "./routes/chatbot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* =========================
    🌐 CORS (HỖ TRỢ TEST LOCAL)
========================= */
app.use(cors({
  origin: [
    "http://127.0.0.1:5500", 
    "http://localhost:5500",
    "http://127.0.0.1:10000",
    "http://localhost:10000",
    "https://kiemlamdongthap.github.io",
    "https://quanlylamsan.github.io"
  ],
  credentials: true
}));

app.use(express.json());

/* =========================
    🔐 SESSION
========================= */
app.use(session({
  secret: "kiem-lam-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, 
    httpOnly: true,
    sameSite: "lax"
  }
}));

/* =========================
    📁 STATIC FILES & ROUTING
========================= */
app.use(express.static(__dirname)); 
app.use("/forms", express.static(path.join(__dirname, "public/forms")));
app.use("/public", express.static(path.join(__dirname, "public")));

// Route gốc trả về index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/ping", (req, res) => res.send("pong"));
app.use("/api/chatbot", chatbotRouter);

/* =========================
    🚀 START SERVER
========================= */
const PORT = process.env.PORT || 10000;

// 2. Thêm 'async' vào callback của listen
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`----------------------------------------------`);
  console.log(`🤖 Chatbot Kiểm Lâm Đồng Tháp - Backend`);
  console.log(`📡 Chế độ: ${process.env.NODE_ENV || 'Development'}`);
  console.log(`🔗 Truy cập ngay: http://localhost:${PORT}`);
  console.log(`----------------------------------------------`);

  // 3. Tự động mở trình duyệt khi không phải môi trường production
  if (process.env.NODE_ENV !== 'production') {
    try {
      await open(`http://localhost:${PORT}`);
      console.log(`🌐 Đã tự động mở trình duyệt...`);
    } catch (error) {
      console.error("⚠️ Không thể tự động mở trình duyệt:", error);
    }
  }
});

app.use((err, req, res, next) => {
  console.error("❌ Lỗi hệ thống:", err.stack);
  res.status(500).json({ error: "Máy chủ đang bận, vui lòng thử lại sau." });
});