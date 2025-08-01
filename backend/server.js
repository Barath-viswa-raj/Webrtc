const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors({
  origin: "https://incredible-rugelach-0de508.netlify.app", // Netlify frontend origin
  methods: ["GET", "POST"]
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://incredible-rugelach-0de508.netlify.app", // WebSocket CORS
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`⚡ New WebSocket client connected: ${socket.id}`);

  socket.on('viewer-request', () => {
    socket.broadcast.emit('viewer-request', socket.id);
  });

  socket.on('offer', (offer, viewerId) => {
    io.to(viewerId).emit('offer', offer, socket.id);
  });

  socket.on('answer', (answer, robotId) => {
    io.to(robotId).emit('answer', answer);
  });

  socket.on('ice-candidate', (candidate, toId) => {
    io.to(toId).emit('ice-candidate', candidate);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

  socket.on('disconnect-viewer', () => {
    console.log(`👋 Viewer ${socket.id} disconnected`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
});
