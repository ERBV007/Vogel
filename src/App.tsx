import { useEffect, useMemo, useState } from 'react'

type VogelResult = {
  allocations: number[][]
  totalCost: number
  addedDummyRow: boolean
  addedDummyColumn: boolean
}

function parseCSVNumbers(value: string): number[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v >= 0)
}

function createMatrix(rows: number, cols: number, fill = 0): number[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill))
}

function resizeMatrix(matrix: number[][], rows: number, cols: number, fill = 0): number[][] {
  const next = createMatrix(rows, cols, fill)
  for (let r = 0; r < Math.min(rows, matrix.length); r++) {
    for (let c = 0; c < Math.min(cols, matrix[0]?.length ?? 0); c++) {
      next[r][c] = Number.isFinite(matrix[r][c]) ? matrix[r][c] : fill
    }
  }
  return next
}

function computeVogelApproximation(
  originalSupply: number[],
  originalDemand: number[],
  originalCosts: number[][],
): VogelResult {
  const supplySum = originalSupply.reduce((a, b) => a + b, 0)
  const demandSum = originalDemand.reduce((a, b) => a + b, 0)

  const addedDummyRow = supplySum < demandSum
  const addedDummyColumn = demandSum < supplySum

  const supply = originalSupply.slice()
  const demand = originalDemand.slice()
  let costs = originalCosts.map((row) => row.slice())

  if (addedDummyRow) {
    const diff = demandSum - supplySum
    supply.push(diff)
    costs = [...costs, Array.from({ length: demand.length }, () => 0)]
  } else if (addedDummyColumn) {
    const diff = supplySum - demandSum
    demand.push(diff)
    costs = costs.map((row) => [...row, 0])
  }

  const rows = supply.length
  const cols = demand.length
  const allocations = createMatrix(rows, cols, 0)

  const activeRows = new Set<number>(Array.from({ length: rows }, (_, i) => i))
  const activeCols = new Set<number>(Array.from({ length: cols }, (_, j) => j))

  function computeRowPenalty(r: number): { penalty: number; minCol: number } {
    const availableCosts: { cost: number; col: number }[] = []
    activeCols.forEach((c) => {
      if (demand[c] > 0) availableCosts.push({ cost: costs[r][c], col: c })
    })
    availableCosts.sort((a, b) => a.cost - b.cost)
    if (availableCosts.length === 0) return { penalty: -1, minCol: -1 }
    const minCol = availableCosts[0].col
    const min1 = availableCosts[0].cost
    const min2 = availableCosts[1]?.cost ?? availableCosts[0].cost
    return { penalty: Math.max(0, min2 - min1), minCol }
  }

  function computeColPenalty(c: number): { penalty: number; minRow: number } {
    const availableCosts: { cost: number; row: number }[] = []
    activeRows.forEach((r) => {
      if (supply[r] > 0) availableCosts.push({ cost: costs[r][c], row: r })
    })
    availableCosts.sort((a, b) => a.cost - b.cost)
    if (availableCosts.length === 0) return { penalty: -1, minRow: -1 }
    const minRow = availableCosts[0].row
    const min1 = availableCosts[0].cost
    const min2 = availableCosts[1]?.cost ?? availableCosts[0].cost
    return { penalty: Math.max(0, min2 - min1), minRow }
  }

  while (activeRows.size > 0 && activeCols.size > 0) {
    // Compute penalties
    let best = { isRow: true, index: -1, penalty: -1, tieCost: Number.POSITIVE_INFINITY }

    activeRows.forEach((r) => {
      if (supply[r] <= 0) return
      const { penalty, minCol } = computeRowPenalty(r)
      const minCost = minCol >= 0 ? costs[r][minCol] : Number.POSITIVE_INFINITY
      if (
        penalty > best.penalty ||
        (penalty === best.penalty && minCost < best.tieCost)
      ) {
        best = { isRow: true, index: r, penalty, tieCost: minCost }
      }
    })

    activeCols.forEach((c) => {
      if (demand[c] <= 0) return
      const { penalty, minRow } = computeColPenalty(c)
      const minCost = minRow >= 0 ? costs[minRow][c] : Number.POSITIVE_INFINITY
      if (
        penalty > best.penalty ||
        (penalty === best.penalty && minCost < best.tieCost)
      ) {
        best = { isRow: false, index: c, penalty, tieCost: minCost }
      }
    })

    if (best.index === -1) break

    // Choose the cheapest cell in the selected row/column
    let targetRow = -1
    let targetCol = -1
    let minCost = Number.POSITIVE_INFINITY
    if (best.isRow) {
      const r = best.index
      activeCols.forEach((c) => {
        if (demand[c] > 0 && costs[r][c] < minCost) {
          minCost = costs[r][c]
          targetRow = r
          targetCol = c
        }
      })
    } else {
      const c = best.index
      activeRows.forEach((r) => {
        if (supply[r] > 0 && costs[r][c] < minCost) {
          minCost = costs[r][c]
          targetRow = r
          targetCol = c
        }
      })
    }

    if (targetRow === -1 || targetCol === -1) break

    const allocation = Math.min(supply[targetRow], demand[targetCol])
    allocations[targetRow][targetCol] = allocation
    supply[targetRow] -= allocation
    demand[targetCol] -= allocation

    if (supply[targetRow] === 0) activeRows.delete(targetRow)
    if (demand[targetCol] === 0) activeCols.delete(targetCol)
  }

  // Compute total cost
  let totalCost = 0
  for (let r = 0; r < allocations.length; r++) {
    for (let c = 0; c < allocations[0].length; c++) {
      const cost = costs[r][c]
      const qty = allocations[r][c]
      if (qty > 0) totalCost += qty * cost
    }
  }

  return { allocations, totalCost, addedDummyRow, addedDummyColumn }
}

function App() {
  const [supplyText, setSupplyText] = useState('20, 30, 25')
  const [demandText, setDemandText] = useState('10, 28, 22, 15')
  const supplies = useMemo(() => parseCSVNumbers(supplyText), [supplyText])
  const demands = useMemo(() => parseCSVNumbers(demandText), [demandText])

  const [costs, setCosts] = useState<number[][]>(createMatrix(3, 3, 0))
  const [result, setResult] = useState<VogelResult | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const nextRows = supplies.length
    const nextCols = demands.length
    if (nextRows === 0 || nextCols === 0) {
      setCosts([])
      return
    }
    setCosts((prev) => resizeMatrix(prev, nextRows, nextCols, 0))
  }, [supplies.length, demands.length])

  function updateCost(r: number, c: number, value: string) {
    const n = Number(value)
    setCosts((prev) => {
      const next = prev.map((row) => row.slice())
      next[r][c] = Number.isFinite(n) && n >= 0 ? n : 0
      return next
    })
  }

  function onCalculate() {
    if (supplies.length === 0 || demands.length === 0) {
      setResult(null)
      setError('')
      return
    }
    if (costs.length !== supplies.length || (costs[0]?.length ?? 0) !== demands.length) {
      setResult(null)
      setError('')
      return
    }
    const supplySum = supplies.reduce((a, b) => a + b, 0)
    const demandSum = demands.reduce((a, b) => a + b, 0)
    if (supplySum !== demandSum) {
      setResult(null)
      setError(
        `La suma de la oferta (${supplySum}) y la demanda (${demandSum}) no coincide. Esta calculadora solo admite casos balanceados.`,
      )
      return
    }
    setError('')
    const r = computeVogelApproximation(supplies, demands, costs)
    setResult(r)
  }

  function onClear() {
    setSupplyText('')
    setDemandText('')
    setCosts([])
    setResult(null)
    setError('')
  }
  return (
    <main className="min-h-screen w-full bg-[#e8e4dc] text-[#3d4a3e]">
      <header className="bg-[#3d4a3e] border-b-2 border-[#6b7c6e] px-3 sm:px-6 py-3 sm:py-4">
        <h1 className="text-base sm:text-xl font-semibold tracking-tight text-[#c8cabd]">Método de Aproximación de Vogel</h1>
      </header>

      <section className="px-3 sm:px-6 py-4 sm:py-6 grid gap-4 sm:gap-6 max-w-5xl mx-auto">
        <div className="bg-[#f5f3ed] border-2 border-[#a8aa9e] p-3 sm:p-4 shadow-sm">
          <h2 className="text-base sm:text-lg font-medium mb-2 text-[#3d4a3e]">Datos del problema</h2>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-xs sm:text-sm text-[#6b7c6e] font-medium">Ofertas (Suministros)</label>
              <input
                className="bg-white border-2 border-[#c8cabd] px-2 sm:px-3 py-2 text-sm sm:text-base text-[#3d4a3e] focus:outline-none focus:border-[#6b7c6e] transition-colors"
                placeholder="Ej: 20, 30, 25"
                value={supplyText}
                onChange={(e) => setSupplyText(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs sm:text-sm text-[#6b7c6e] font-medium">Demandas</label>
              <input
                className="bg-white border-2 border-[#c8cabd] px-2 sm:px-3 py-2 text-sm sm:text-base text-[#3d4a3e] focus:outline-none focus:border-[#6b7c6e] transition-colors"
                placeholder="Ej: 10, 28, 22, 15"
                value={demandText}
                onChange={(e) => setDemandText(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-[#f5f3ed] border-2 border-[#a8aa9e] p-3 sm:p-4 shadow-sm">
          <h2 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 text-[#3d4a3e]">Matriz de costos</h2>
          <div className="overflow-x-auto">
            <div className="flex justify-center">
              <table className="border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#3d4a3e]">
                    <th className="bg-[#3d4a3e] text-left px-1.5 sm:px-3 py-1.5 sm:py-2 border-b-2 border-[#6b7c6e] text-[#c8cabd] text-[10px] sm:text-sm font-semibold">O\\D</th>
                    {demands.map((_, j) => (
                      <th key={j} className="px-1.5 sm:px-3 py-1.5 sm:py-2 border-b-2 border-[#6b7c6e] text-[#c8cabd] text-[10px] sm:text-sm font-semibold whitespace-nowrap">D{j + 1}</th>
                    ))}
                    <th className="px-1.5 sm:px-3 py-1.5 sm:py-2 border-b-2 border-[#6b7c6e] text-[#c8cabd] text-[10px] sm:text-sm font-semibold whitespace-nowrap">Oferta</th>
                  </tr>
                </thead>
                <tbody>
                  {supplies.map((_, i) => (
                    <tr key={i} className="odd:bg-[#e8e4dc]/40">
                      <th className="bg-[#f5f3ed] text-left font-medium px-1.5 sm:px-3 py-1.5 sm:py-2 border-b border-[#c8cabd] text-[#3d4a3e] text-[10px] sm:text-sm whitespace-nowrap">O{i + 1}</th>
                      {demands.map((_, j) => (
                        <td key={j} className="px-0.5 sm:px-2 py-1 sm:py-1.5 border-b border-[#c8cabd]">
                          <input
                            className="w-10 sm:w-16 md:w-20 text-center bg-white border border-[#c8cabd] px-1 sm:px-2 py-1 text-[10px] sm:text-sm text-[#3d4a3e] focus:outline-none focus:border-[#6b7c6e] transition-colors"
                            placeholder="0"
                            value={Number.isFinite(costs[i]?.[j]) ? costs[i][j] : 0}
                            onChange={(e) => updateCost(i, j, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="px-1.5 sm:px-3 py-1.5 sm:py-2 border-b border-[#c8cabd] text-[#6b7c6e] text-[10px] sm:text-sm font-medium text-center">{supplies[i] ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th className="bg-[#f5f3ed] text-left font-medium px-1.5 sm:px-3 py-1.5 sm:py-2 border-t-2 border-[#a8aa9e] text-[#3d4a3e] text-[10px] sm:text-sm">Dem.</th>
                    {demands.map((d, j) => (
                      <td key={j} className="px-1.5 sm:px-3 py-1.5 sm:py-2 border-t-2 border-[#a8aa9e] text-[#6b7c6e] text-[10px] sm:text-sm font-medium text-center">{d ?? '—'}</td>
                    ))}
                    <td className="px-1.5 sm:px-3 py-1.5 sm:py-2 border-t-2 border-[#a8aa9e] text-[#6b7c6e] text-[10px] sm:text-sm font-medium text-center">Total</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
        {error && (
          <div className="bg-[#f5f3ed] border-2 border-[#8b7355] text-[#5c4a3a] p-2.5 sm:p-3 text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
          <button onClick={onCalculate} className="inline-flex items-center justify-center bg-[#6b7c6e] text-[#e8e4dc] px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium hover:bg-[#3d4a3e] focus:outline-none transition-colors">
            Calcular
          </button>
          <button onClick={onClear} className="inline-flex items-center justify-center border-2 border-[#a8aa9e] bg-[#f5f3ed] px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-[#3d4a3e] hover:bg-[#e8e4dc] focus:outline-none transition-colors">
            Limpiar
          </button>
        </div>

        {result && costs.length > 0 && (
          <div className="bg-[#f5f3ed] border-2 border-[#6b7c6e] p-3 sm:p-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3">
              <h2 className="text-base sm:text-lg font-semibold text-[#3d4a3e]">Asignación (Vogel)</h2>
              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1.5 sm:gap-2">
                  <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 border-2 border-[#6b7c6e] bg-[#7d9b87]"></span>
                  <span className="text-[#3d4a3e] font-medium">Asignado</span>
                </span>
                <span className="inline-flex items-center gap-1.5 sm:gap-2">
                  <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 border-2 border-[#a8aa9e] bg-[#c8cabd]"></span>
                  <span className="text-[#6b7c6e] font-medium">No asignado</span>
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="flex justify-center">
                <div className="border-2 border-[#a8aa9e]">
                  <table className="border-collapse">
                    <thead>
                      <tr className="bg-[#3d4a3e]">
                        <th className="bg-[#3d4a3e] text-left px-1.5 sm:px-4 py-1.5 sm:py-2 border-b-2 border-[#6b7c6e] text-[#c8cabd] text-[10px] sm:text-sm font-semibold">O\\D</th>
                        {demands.map((_, j) => (
                          <th key={j} className="px-1.5 sm:px-4 py-1.5 sm:py-2 border-b-2 border-[#6b7c6e] text-left text-[#c8cabd] text-[10px] sm:text-sm font-semibold whitespace-nowrap">D{j + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {supplies.map((_, i) => (
                        <tr key={i} className="odd:bg-[#e8e4dc]/40">
                          <th className="bg-[#f5f3ed] text-left font-medium px-1.5 sm:px-4 py-1.5 sm:py-2 border-t border-[#c8cabd] text-[#3d4a3e] text-[10px] sm:text-sm whitespace-nowrap">O{i + 1}</th>
                          {demands.map((_, j) => {
                            const val = result.allocations[i]?.[j] ?? 0
                            const isChosen = val > 0
                            const cellClass = isChosen
                              ? 'bg-[#7d9b87] text-white'
                              : 'bg-[#c8cabd] text-[#6b7c6e]'
                            const textWeight = isChosen ? 'font-semibold' : 'font-medium'
                            return (
                              <td
                                key={j}
                                className={`px-2 sm:px-4 py-1.5 sm:py-2 text-center border-t border-[#c8cabd] text-[10px] sm:text-sm ${cellClass} ${textWeight}`}
                              >
                                {val}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex justify-center sm:justify-end">
              <span className="inline-block bg-[#3d4a3e] text-[#c8cabd] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base font-semibold">Costo total: {result.totalCost}</span>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
