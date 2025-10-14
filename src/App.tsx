function App() {
  return (
    <main className="min-h-screen w-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center px-6">
      <div className="max-w-2xl text-center space-y-6">
        <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-300 px-3 py-1 text-xs font-medium ring-1 ring-inset ring-emerald-500/30">
          Tailwind activo
        </span>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Proyecto nuevo
        </h1>

        <p className="text-slate-300">
          Esta es la pantalla principal. Si ves los colores y el estilo, Tailwind
          está funcionando correctamente.
        </p>

        <div className="flex items-center justify-center gap-3">
          <a
            href="#"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 text-white px-5 py-2.5 font-medium shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition"
          >
            Comenzar
          </a>
          <a
            href="#"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-white/5 px-5 py-2.5 font-medium text-slate-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition"
          >
            Ver docs
          </a>
        </div>
      </div>
    </main>
  )
}

export default App
