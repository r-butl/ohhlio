import { useState, useRef } from 'react'
import Renderer from './components/portfolio-renderer/Renderer'
import './App.css'

function App() {
  const [isViewMode, setIsViewMode] = useState(false)
  const [columnCount, setColumnCount] = useState(3)
  const rendererRef = useRef<any>(null);

  const checkBreakpoint = () => {
    if (rendererRef.current) {
      const currentBreakpoint = rendererRef.current.getCurrentBreakpoint();
      console.log('Current breakpoint:', currentBreakpoint);
    }
  };
  
  return (
    <div className="app-container">
      <div className="content-wrapper">
        <div className="app-header">
          <h1>Portfolio Builder</h1>
          <div className="controls">
            {!isViewMode && (
              <div className="column-selector">
                <label>Columns:</label>
                <select 
                  value={columnCount} 
                  onChange={(e) => setColumnCount(Number(e.target.value))}
                >
                  <option value={2}>2 Columns</option>
                  <option value={3}>3 Columns</option>
                  <option value={4}>4 Columns</option>
                </select>
              </div>
            )}
            <button 
              className="mode-toggle"
              onClick={() => setIsViewMode(!isViewMode)}
            >
              {isViewMode ? 'Switch to Edit Mode' : 'Switch to View Mode'}
            </button>
          </div>
        </div>
        <div className="renderer-container">
          <Renderer 
            ref={rendererRef}
            isDraggable={!isViewMode}
            isResizable={!isViewMode}
            items={5}
            columnCount={columnCount}
            onLayoutChange={(newLayout) => {
              console.log('Layout changed:', newLayout);
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default App
