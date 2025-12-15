import React from 'react';
import Scene from './components/Scene';
import UI from './components/UI';
import HandTracker from './components/HandTracker';

const App: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-black">
      <Scene />
      <UI />
      <HandTracker />
    </div>
  );
};

export default App;
