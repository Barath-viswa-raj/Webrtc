// src/pages/Home.js
import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1>🤖 WebRTC Streaming App</h1>
      <p>Select your role:</p>
      <div style={{ marginTop: '2rem' }}>
        <Link to="/robot">
          <button style={{ marginRight: '1rem', padding: '10px 20px' }}>Robot</button>
        </Link>
        <Link to="/viewer">
          <button style={{ padding: '10px 20px' }}>Viewer</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;
