import express from "express";
import cors from "cors";
import session from "express-session";
import chatbotRouter from "./routes/chatbot.js";

const app = express();

/* =========================
    🌐 CORS (FIX CHO PRODUCTION)
========================= */
app.use(cors({
  // Cho phép cả localhost (để bạn test máy nhà) và GitHub Pages của bạn
  origin: [
    "http://127.0.0.1:5500", 
    "https://kiemlamdongthap.github.io",
    "https://quanlylamsan.github.io"
  ],
  credentials: true
}));

/* =========================
   📦 BODY PARSER
========================= */
app.use(express.json());

/* =========================
   🔐 SESSION (ỔN ĐỊNH HƠN)
========================= */
app.use(session({
  secret: "kiem-lam-secret-key",
  resave: false, // 🔥 FIX: tránh ghi lại liên tục
  saveUninitialized: false, // 🔥 FIX: không tạo session rác
  cookie: {
    secure: false, // localhost
    httpOnly: true,
    sameSite: "lax"
  }
}));

/* =========================
   📁 STATIC FILES
========================= */
app.use("/forms", express.static("public/forms"));
app.use(express.static("public"));

/* =========================
   🧪 HEALTH CHECK
========================= */
app.get("/ping", (req, res) => {
  res.send("pong");
});

/* =========================
   🤖 CHATBOT API
========================= */
app.use("/api/chatbot", chatbotRouter);

/* =========================
   🚫 404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({
    error: "API không tồn tại"
  });
});

/* =========================
   💥 ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({
    error: "Lỗi server"
  });
});

/* =========================
    🚀 START SERVER (FIX CHO RENDER)
========================= */
// Ưu tiên lấy cổng từ Render (process.env.PORT), nếu không có mới dùng 3000
const PORT = process.env.PORT || 10000;

// Render yêu cầu lắng nghe trên '0.0.0.0' thay vì 'localhost'
app.listen(PORT, '0.0.0.0', () => {
  console.log(`----------------------------------------------`);
  console.log(`🤖 Chatbot Kiểm Lâm Đồng Tháp đang hoạt động!`);
  console.log(`📡 Cổng kết nối: ${PORT}`);
  console.log(`----------------------------------------------`);
});