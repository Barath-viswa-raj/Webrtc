import { useEffect, useState } from 'react';
import { WebRTCService } from '../services/webrtcService';

function CameraSender() {
  const [status, setStatus] = useState('📡 Waiting for viewer request...');

  const webRTC = new WebRTCService(); 

  useEffect(() => {
    webRTC.startCamera((msg) => setStatus(msg));
    return () => webRTC.disconnect();
  }, []);

  return <div style={{ padding: '20px' }}><p>{status}</p></div>;
}

export default CameraSender;
