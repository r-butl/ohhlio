import { useState } from 'react'
import Renderer from './components/portfolio-renderer/Renderer'
import './App.css'

function App() {
  const [isViewMode, setIsViewMode] = useState(false)

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Portfolio Builder</h1>
        <button 
          className="mode-toggle"
          onClick={() => setIsViewMode(!isViewMode)}
        >
          {isViewMode ? 'Switch to Edit Mode' : 'Switch to View Mode'}
        </button>
      </div>
      <div className="renderer-container">
        <Renderer 
          isDraggable={!isViewMode}
          isResizable={!isViewMode}
          items={5}
          onLayoutChange={(newLayout) => {
            console.log('Layout changed:', newLayout);
          }}
        />
      </div>
    </div>
  )
}

export default App
