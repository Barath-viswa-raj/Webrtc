import { io } from 'socket.io-client';
import { SIGNALING_SERVER_URL } from '../config';

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
    this.socket.connect();
  }

  disconnect() {
    this.socket.emit('disconnect-viewer');
    this.socket.disconnect();
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    if (this.pc) this.pc.close();
  }

  async startCamera(onStatus, onOfferSent) {
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        this.pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('Camera stream:', this.stream);
        this.stream.getTracks().forEach((track) => this.pc.addTrack(track, this.stream));

        this.pc.onicecandidate = ({ candidate }) => {
          if (candidate && this.currentViewer) {
            console.log('Sending ICE candidate to:', this.currentViewer);
            this.socket.emit('ice-candidate', candidate, this.currentViewer);
          }
        };

        this.socket.on('viewer-request', async (viewerId) => {
          this.currentViewer = viewerId;
          onStatus && onStatus(`📹 Viewer ${viewerId} requested stream`);
          const offer = await this.pc.createOffer();
          await this.pc.setLocalDescription(offer);
          console.log('Sending offer to:', viewerId);
          this.socket.emit('offer', offer, viewerId);
          onOfferSent && onOfferSent(offer, viewerId);
        });

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

        this.socket.connect();
      } catch (err) {
        console.error('Camera access failed:', err);
      }
    } else {
      console.error('Browser does not support getUserMedia.');
    }
  }

  async requestStream(onStream) {
    this.pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

    const pendingCandidates = [];

    this.pc.ontrack = (event) => {
      if (event.streams[0] && onStream) {
        console.log('📽️ Viewer received stream');
        onStream(event.streams[0]);
      }
    };

    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.socket.emit('ice-candidate', candidate, this.socket.id);
      }
    };

    this.socket.on('offer', async (offer, robotId) => {
      try {
        await this.pc.setRemoteDescription(offer);

        if (this.pc.signalingState !== 'have-remote-offer') {
          console.warn('⚠️ Expected have-remote-offer but got:', this.pc.signalingState);
          return;
        }

        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this.socket.emit('answer', answer, robotId);

        for (const c of pendingCandidates) {
          await this.pc.addIceCandidate(c);
        }
      } catch (err) {
        console.error();
      }
    });

    this.socket.on('ice-candidate', (candidate) => {
      if (this.pc.remoteDescription) {
        this.pc.addIceCandidate(candidate);
      } else {
        pendingCandidates.push(candidate);
      }
    });

    this.connect();
    this.socket.emit('viewer-request');
  }

  stopStream() {
    console.log('❌ Camera Disconnected');

    if (this.pc) {
      this.pc.getSenders().forEach(sender => {
        if (sender.track) sender.track.stop();
      });
      this.pc.close();
      this.pc = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
}
