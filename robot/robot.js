const wrtc = require('wrtc');
const { io } = require('socket.io-client');
const { spawn } = require('child_process');

const socket = io('https://192.168.1.19`:9000', {
  secure: true,
  rejectUnauthorized: false,
});

let pc = null;
let stream = null;
let videoTrack = null;
let mediaStream = null;

socket.on('connect', () => {
  console.log(' Robot connected to signaling server:', socket.id);
});

socket.on('viewer-request', async (viewerId) => {
  console.log(` Viewer ${viewerId} requested stream`);

  pc = new wrtc.RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  
  const ffmpeg = spawn('ffmpeg', [
    '-re',
    '-f', 'lavfi',
    '-i', 'testsrc=size=640x480:rate=30',
    '-f', 'rawvideo',
    '-pix_fmt', 'yuv420p',
    '-an', '-sn',
    '-s', '640x480',
    '-r', '30',
    '-'
  ]);

  const { MediaStreamTrack } = wrtc;

  videoTrack = new MediaStreamTrack({
    kind: 'video',
    async pull() {
      const chunk = ffmpeg.stdout.read();
      if (chunk) return chunk;
    }
  });

  mediaStream = new wrtc.MediaStream([videoTrack]);
  mediaStream.getTracks().forEach((track) => pc.addTrack(track, mediaStream));

  pc.onicecandidate = ({ candidate }) => {
    if (candidate) {
      socket.emit('ice-candidate', candidate, viewerId);
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit('offer', offer, viewerId);
});

socket.on('answer', async (answer) => {
  if (pc) {
    await pc.setRemoteDescription(new wrtc.RTCSessionDescription(answer));
    console.log(' Answer set on robot peer connection');
  }
});

socket.on('ice-candidate', async (candidate) => {
  if (pc) {
    await pc.addIceCandidate(new wrtc.RTCIceCandidate(candidate));
  }
});

socket.on('disconnect-viewer', () => {
  console.log(' Viewer disconnected, stopping stream');
  if (videoTrack) videoTrack.stop();
  if (pc) pc.close();
  pc = null;
});
