import React, { useState } from 'react';
import Graphs from './components/Graph';
import NIR from './components/NIR';

const App = () => {
  const [path, setPath] = useState('NIR');

  return (
    <>
      <div
        style={{
          position: 'absolute', top: 0, right: 0, zIndex: 2,
        }}
      >
        <button
          type="button"
          style={{ background: path === 'NIR' ? 'lightgreen' : '' }}
          onClick={() => setPath('NIR')}
        >
          NIR
        </button>

        <button
          type="button"
          style={{ background: path === 'Graphs' ? 'lightgreen' : '' }}
          onClick={() => setPath('Graphs')}
        >
          Comparisons
        </button>
      </div>
      {
        path === 'NIR' ? <NIR /> : <Graphs />
      }
    </>
  );
};

export default App;
