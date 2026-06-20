import { Routes, Route } from 'react-router-dom'
import AppInitializer from './components/AppInitializer'
import CustomCursor from './components/ui/CustomCursor'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'

function App() {
  return (
    <AppInitializer>
      <CustomCursor />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
      </Routes>
    </AppInitializer>
  )
}

export default App
