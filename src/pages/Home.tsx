 

// -------------------------------------------------------------
// Home: Página de introducción y contexto teórico
// -------------------------------------------------------------
// Presenta un resumen del propósito de la app y una explicación breve del
// método de Aproximación de Vogel para que el usuario entienda qué hace la
// calculadora.
function Home() {
  return (
    <section className="px-3 sm:px-6 py-6 sm:py-10 max-w-5xl mx-auto">
      <div className="bg-[#f5f3ed] border-2 border-[#a8aa9e] p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-2">Introducción</h2>
        <p className="text-sm sm:text-base leading-relaxed text-[#4a594c]">
          Esta aplicación es un proyecto universitario para el curso de Investigación de Operaciones
          de la Universidad Mariano Gálvez de Guatemala. Implementa el método de Aproximación de Vogel para el problema de
          transporte y está pensada como una herramienta educativa.
        </p>
      </div>
      <div className="mt-4 bg-[#f5f3ed] border-2 border-[#a8aa9e] p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-2">¿Qué es el método de Vogel (VAM)?</h2>
        <p className="text-sm sm:text-base leading-relaxed text-[#4a594c]">
          El método de Aproximación de Vogel es una heurística para construir una solución inicial
          del problema de transporte minimizando el costo total de envío desde varios orígenes (ofertas)
          hacia varios destinos (demandas). En cada iteración calcula una <span className="font-semibold"> penalización</span>
          <strong> por fila y por columna </strong> (diferencia entre los dos costos más bajos disponibles) y asigna
          unidades en la celda con mayor penalización, favoreciendo las rutas más baratas y evitando
          decisiones miopes.
        </p>
        <h3 className="mt-3 font-semibold">¿Para qué sirve?</h3>
        <ul className="mt-1 list-disc pl-5 text-sm sm:text-base text-[#4a594c] space-y-1">
          <li>Encontrar rápidamente una solución factible y de bajo costo para problemas balanceados.</li>
          <li>Servir como punto de partida para métodos de mejora (p. ej., MODI o stepping-stone).</li>
          <li>Analizar y enseñar la lógica de asignación en logística y cadenas de suministro.</li>
        </ul>
        <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#4a594c]">
          Nota: esta calculadora admite <span className="font-semibold">casos balanceados</span> (suma de ofertas igual a suma de demandas).
        </p>
      </div>
    </section>
  )
}

export default Home


