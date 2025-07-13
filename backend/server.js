
const fs = require("fs");
const https = require("https");
const express = require("express");
const { Server } = require("socket.io");
const cors = require("cors");

PORT = 9443; 

const app = express();
app.use(cors(
    {
        origin: ["http:172.31.92.19:5175"],
        methods: ["GET", "POST"],
        credentials: true
    }
));

const server = https.createServer({
  key: fs.readFileSync("./key.pem"),   
  cert: fs.readFileSync("./cert.pem")  
}, app);

const io = new Server(server, {
  cors: {
    origin: "https:172.31.92.19:5173", 
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket']
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
server.listen(PORT, () => {
  console.log(`🚀 HTTPS Signaling server running at https://172.31.92.19:${PORT}`);
});

