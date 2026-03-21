const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ✅ 用 process.cwd()（Render 标准路径）
const ROOT = process.cwd();

// 静态文件
app.use(express.static(ROOT));
app.use("/undercover-online", express.static(path.join(ROOT, "undercover-online")));

// 首页直接跳游戏
app.get("/", (req, res) => {
  res.redirect("/undercover-online/");
});

// 强制返回 index.html
app.get("/undercover-online", (req, res) => {
  res.sendFile(path.join(ROOT, "undercover-online", "index.html"));
});

app.get("/undercover-online/", (req, res) => {
  res.sendFile(path.join(ROOT, "undercover-online", "index.html"));
});

// socket 房间
let rooms = {};

io.on("connection", (socket) => {
  console.log("玩家连接:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    if (!rooms[roomId].includes(socket.id)) {
      rooms[roomId].push(socket.id);
    }

    io.to(roomId).emit("updatePlayers", rooms[roomId]);
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      io.to(roomId).emit("updatePlayers", rooms[roomId]);
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});