import React, { useRef, useState } from 'react';
import { WebRTCService } from '../services/webrtcService';

const webrtc = new WebRTCService();

function Viewer() {
  const videoRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const handleStart = () => {
    webrtc.requestStream((incomingStream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = incomingStream;
        console.log('📽️ Viewer received stream');
      }
    });
    setConnected(true);
  };

  const handleStop = () => {
    webrtc.stopStream();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setConnected(false);
  };

  return (
    <div>
      <h2>Viewer</h2>
      {!connected ? (
        <button onClick={handleStart}>Start</button>
      ) : (
        <button onClick={handleStop}>Stop</button>
      )}
      <div style={{ marginTop: '1rem' }}>
        <video ref={videoRef} autoPlay playsInline width="600" />
      </div>
    </div>
  );
}

export default Viewer;
