// src/services/webrtcService.js
import { io } from 'socket.io-client';
import { SIGNALING_SERVER_URL } from "../config";

export class WebRTCService {
  constructor() {
    this.socket = io(SIGNALING_SERVER_URL, {
      autoConnect: false,
      secure: true,
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to signaling server:', this.socket.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Disconnected from signaling server:', reason);
    });
  }

  connect() {
    console.log('🔗 Connecting to signaling server...');
    this.socket.connect();
    console.log('🔗 Attempting to connect to signaling server...');
  }

  disconnect() {
    this.socket.emit('disconnect-viewer');
    this.socket.disconnect();
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    if (this.robotPc) this.robotPc.close();
  }

  async startCamera(onStatus, onOfferSent) {
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('Camera stream:', this.stream);

        this.socket.on('viewer-request', async (viewerId) => {
          console.log('📹 Viewer requested stream:', viewerId);

          this.pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

          this.stream.getTracks().forEach((track) => this.pc.addTrack(track, this.stream));

          this.pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
              console.log('Sending ICE candidate to:', viewerId);
              this.socket.emit('ice-candidate', candidate, viewerId);
            }
          };

          this.pc.oniceconnectionstatechange = () => {
            console.log('🌐 ICE connection state (robot):', this.pc.iceConnectionState);
          };

          this.currentViewer = viewerId;
          onStatus && onStatus(`📹 Viewer ${viewerId} requested stream`);

          const offer = await this.pc.createOffer();
          await this.pc.setLocalDescription(offer);
          console.log('Sending offer to:', viewerId);
          this.socket.emit('offer', offer, viewerId);
          onOfferSent && onOfferSent(offer, viewerId);

          this.socket.on('answer', async (answer) => {
            try {
              if (this.pc.signalingState === 'have-local-offer') {
                await this.pc.setRemoteDescription(answer);
              } else {
                console.warn('⚠️ Skipping setRemoteDescription, invalid state:', this.pc.signalingState);
              }
            } catch (e) {
              console.error('❌ Error setting remote description on robot:', e);
            }
          });
        });

        this.socket.connect();
      } catch (err) {
        console.error('Camera access failed:', err);
      }
    } else {
      console.error('Browser does not support getUserMedia.');
    }
  }

  async requestStream(onStream) {
    this.robotPc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

    const pendingCandidates = [];

    this.robotPc.ontrack = (event) => {
      if (event.streams[0] && onStream) {
        console.log('📽️ Viewer received stream');
        onStream(event.streams[0]);
      }
    };

    this.robotPc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.socket.emit('ice-candidate', candidate, this.socket.id);
      }
    };

    this.robotPc.oniceconnectionstatechange = () => {
      console.log('🌐 ICE connection state (viewer):', this.robotPc.iceConnectionState);
    };

    this.socket.on('offer', async (offer, robotId) => {
      try {
        await this.robotPc.setRemoteDescription(offer);
        const answer = await this.robotPc.createAnswer();
        await this.robotPc.setLocalDescription(answer);
        this.socket.emit('answer', answer, robotId);

        for (const c of pendingCandidates) {
          await this.robotPc.addIceCandidate(c);
        }
      } catch (err) {
        console.error('❌ Error handling offer/answer exchange:', err);
      }
    });

    this.socket.on('ice-candidate', (candidate) => {
      if (this.robotPc.remoteDescription) {
        this.robotPc.addIceCandidate(candidate);
      } else {
        pendingCandidates.push(candidate);
      }
    });

    this.connect();
    this.socket.emit('viewer-request');
  }

  stopAll() {
    console.log('🛑 Stopping all streams...');

    if (this.robotPc) {
      this.robotPc.getSenders().forEach(sender => sender.track?.stop());
      this.robotPc.close();
      this.robotPc = null;
    }

    if (this.viewerCamStream) {
      this.viewerCamStream.getTracks().forEach(track => track.stop());
      this.viewerCamStream = null;
    }

    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
