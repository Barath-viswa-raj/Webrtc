// const http = require('http');
// const express = require('express');
// const { Server } = require('socket.io');
// const path = require('path');

// const app = express();
// const PORT = 9000;

// // const sslOptions = {
// //   key: fs.readFileSync(path.join("./certs/key.pem")),
// //   cert: fs.readFileSync(path.join("./certs/cert.pem"))
// // };

// //

// const server = http.createServer();


// const io = new Server(server, {
//   cors: {
//     origin: '*',
//     methods: ['GET', 'POST']
//   }
// });

// io.on('connection', (socket) => {
//   console.log(` Client connected: ${socket.id}`);

//   socket.on('viewer-request', () => {
//     console.log(` Viewer ${socket.id} requested camera stream`);
//     io.emit('viewer-request', socket.id);
//   });

//   socket.on('offer', (offer, viewerId) => {
//     console.log(` Offer from robot → viewer ${viewerId}`);
//     io.to(viewerId).emit('offer', offer, socket.id);
//   });

//   socket.on('answer', (answer, robotId) => {
//     console.log(` Answer from viewer → robot ${robotId}`);
//     io.to(robotId).emit('answer', answer);
//   });

 
//   socket.on('ice-candidate', (candidate, peerId) => {
//     console.log(` ICE candidate from ${socket.id} to peer ${peerId}`);
//     io.to(peerId).emit('ice-candidate', candidate);
//   });

//   socket.on('disconnect-viewer', () => {
//     console.log(` Viewer ${socket.id} disconnected`);
//     io.emit('disconnect-viewer');
//   });

//   socket.on('disconnect', () => {
//     console.log(` Socket disconnected: ${socket.id}`);
//   });
// });


// server.listen(PORT, () => {
//   console.log(`🚀 Signaling server running at http://localhost:${PORT}`);
// });
// const fs = require('fs');
// const https = require('https');
// const express = require('express');
// const { Server } = require('socket.io');
// const cors = require('cors');
// const path = require('path');

// const PORT = 9443; 

// const app = express();

// // CORS setup
// app.use(cors({
//   origin: ['https://172.31.98.103:3000'], 
//   credentials: true
// }));

// // HTTPS credentials
// const privateKey = fs.readFileSync(path.join('./key.pem'));
// const certificate = fs.readFileSync(path.join('./cert.pem'));

// const httpsServer = https.createServer({ key: privateKey, cert: certificate }, app);

// // Socket.IO
// const io = new Server(httpsServer, {
//   cors: {
//     origin: ['https://localhost:3000'],
//     methods: ['GET', 'POST'],
//     credentials: true
//   }
// });
// console.log('✅ Socket.IO server initialized');

// io.on('connection', socket => {
//   console.log('✅ Client connected:', socket.id);
// });

// httpsServer.listen(PORT, () => {
//   console.log(`🚀 HTTPS Signaling server running at https://172.31.98.103:${PORT}`);
// });



//new
const fs = require("fs");
const https = require("https");
const express = require("express");
const { Server } = require("socket.io");
const cors = require("cors");

PORT = 9443; 

const app = express();
app.use(cors());

const server = https.createServer({
  key: fs.readFileSync("./key.pem"),   
  cert: fs.readFileSync("./cert.pem")  
}, app);

const io = new Server(server, {
  cors: {
    origin: "*", 
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
server.listen(PORT, () => {
  console.log(`🚀 HTTPS Signaling server running at Render`);
});

