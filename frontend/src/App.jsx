// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Robot from './components/robot';
import Viewer from './components/viewer';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/robot" element={<Robot />} />
      <Route path="/viewer" element={<Viewer />} />
    </Routes>
  );
}

export default App;
