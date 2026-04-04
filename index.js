import "dotenv/config";
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";

import chatbotRouter from "./routes/chatbot.js";

const app = express();
const PORT = 3000;

// 🔹 Fix __dirname cho ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔹 SESSION (RẤT QUAN TRỌNG)
app.use(
  session({
    name: "lam-san-chatbot",
    secret: "lam-san-chatbot-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 30 * 60 * 1000 // 30 phút
    }
  })
);

// 🔹 Public frontend (index.html)
app.use(express.static(path.join(__dirname, "public")));

// 🔹 API chatbot
app.use("/api/chatbot", chatbotRouter);
// 🔹 Tai bieu mau
app.use("/forms", express.static(path.join(__dirname, "forms")));


// 🔹 Test session
app.get("/test-session", (req, res) => {
  if (!req.session.count) {
    req.session.count = 1;
  } else {
    req.session.count++;
  }
  res.json({ count: req.session.count });
});

// 🔹 Start server
app.listen(PORT, () => {
  console.log(`🤖 Chatbot đang chạy tại http://localhost:${PORT}`);
});
