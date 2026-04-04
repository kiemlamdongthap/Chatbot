import express from "express";
import cors from "cors";
import session from "express-session";
import chatbotRouter from "./routes/chatbot.js";

const app = express();

/* =========================
   🌐 CORS (QUAN TRỌNG)
========================= */
app.use(cors({
  origin: "http://127.0.0.1:5500", // 🔥 đổi theo frontend bạn
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
   🚀 START SERVER
========================= */
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🤖 Server đang chạy tại http://localhost:${PORT}`);
});