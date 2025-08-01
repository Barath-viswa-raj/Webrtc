import React, { useRef, useState, useEffect } from 'react';
import { WebRTCService } from '../services/webrtcService';

const webrtc = new WebRTCService();

function Viewer() {
  const robotVideoRef = useRef(null);
  const myCamRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    return () => {
      webrtc.stopAll(); 
    };
  }, []);

  const handleStart = async () => {
    console.log("🔍 Starting stream request from viewer...");

    // Start viewer's own camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      myCamRef.current.srcObject = stream;
      myCamRef.current.play();
      webrtc.viewerCamStream = stream;
      console.log("📷 Viewer camera accessed");
    } catch (err) {
      console.error("❌ Viewer camera access failed", err);
    }

    // Connect to robot's stream
    webrtc.requestStream((robotStream) => {
      if (robotVideoRef.current) {
        console.log("🎥 Setting robot stream to video element");
        robotVideoRef.current.srcObject = robotStream;
        robotVideoRef.current.play();
      } else {
        console.warn("⚠️ robotVideoRef is null");
      }
    });

    setConnected(true);
  };

  const handleStop = () => {
    console.log("🛑 Stopping stream on viewer...");
    webrtc.stopAll();

    if (robotVideoRef.current) robotVideoRef.current.srcObject = null;
    if (myCamRef.current) myCamRef.current.srcObject = null;

    setConnected(false);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>🎥 Viewer Page</h2>

      {!connected ? (
        <button onClick={handleStart}>Start</button>
      ) : (
        <button onClick={handleStop}>Stop</button>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
        <div style={{ marginRight: '1rem' }}>
          <h4>🤖 Robot Camera</h4>
          <video
            ref={robotVideoRef}
            autoPlay
            playsInline
            muted
            width="400"
            style={{ border: '2px solid green' }}
          />
        </div>
        <div>
          <h4>🙋‍♂️ My Camera</h4>
          <video
            ref={myCamRef}
            autoPlay
            playsInline
            muted
            width="400"
            style={{ border: '2px solid blue' }}
          />
        </div>
      </div>
    </div>
  );
}

export default Viewer;
