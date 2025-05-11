import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Renderer from './components/portfolio-renderer/Renderer'
import layoutSchema from './components/portfolio-renderer/test-layout.json'; // Path to the JSON file
import './App.css'

function App() {
  const [count, setCount] = useState<number>(0)

  return (
    <>
      <Renderer jsonString={JSON.stringify(layoutSchema)} />
    </>
  )
}

export default App
