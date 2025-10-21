import { useEffect, useState } from 'react'
import Home from './pages/Home'
import Calculator from './pages/Calculator'
function App() {
  const [hash, setHash] = useState<string>(location.hash || '#/')
  useEffect(() => {
    const onHash = () => setHash(location.hash || '#/')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return (
    <main className="min-h-screen w-full bg-[#e8e4dc] text-[#3d4a3e]">
      <header className="bg-[#3d4a3e] border-b-2 border-[#6b7c6e] px-3 sm:px-6 py-3 sm:py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-xl font-semibold tracking-tight text-[#c8cabd]">Método de Aproximación de Vogel</h1>
          <nav className="flex items-center gap-2">
            <a href="#/" className="px-3 py-1.5 text-sm font-medium text-[#c8cabd] hover:underline">Inicio</a>
            <a href="#/calculator" className="px-3 py-1.5 text-sm font-medium text-[#c8cabd] hover:underline">Calculadora</a>
          </nav>
        </div>
      </header>

      {hash === '#/calculator' ? (
        <Calculator />
      ) : (
        <Home />
      )}

      <section className="hidden"></section>
    </main>
  )
}

export default App
