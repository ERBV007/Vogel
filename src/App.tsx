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
      return
    }
    if (costs.length !== supplies.length || (costs[0]?.length ?? 0) !== demands.length) {
      setResult(null)
      return
    }
    const r = computeVogelApproximation(supplies, demands, costs)
    setResult(r)
  }

  function onClear() {
    setSupplyText('')
    setDemandText('')
    setCosts([])
    setResult(null)
  }
  return (
    <main className="min-h-screen w-screen bg-slate-100 text-slate-900">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">Método de Aproximación de Vogel</h1>
      </header>

      <section className="px-6 py-6 grid gap-6 max-w-5xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-medium mb-2">Datos del problema</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1">
              <label className="text-sm text-slate-600">Ofertas (Suministros)</label>
              <input
                className="bg-white border border-slate-300 rounded px-3 py-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-300"
                placeholder="Ej: 20, 30, 25"
                value={supplyText}
                onChange={(e) => setSupplyText(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm text-slate-600">Demandas</label>
              <input
                className="bg-white border border-slate-300 rounded px-3 py-2 shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-300"
                placeholder="Ej: 10, 28, 22, 15"
                value={demandText}
                onChange={(e) => setDemandText(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-medium mb-3">Matriz de costos</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50">
                  <th className="sticky left-0 z-10 bg-slate-50 text-left px-3 py-2 border-b border-slate-200">Origen \\ Destino</th>
                  {demands.map((_, j) => (
                    <th key={j} className="px-3 py-2 border-b border-slate-200">{`D${j + 1}`}</th>
                  ))}
                  <th className="px-3 py-2 border-b border-slate-200">Demanda</th>
                </tr>
              </thead>
              <tbody>
                {supplies.map((_, i) => (
                  <tr key={i} className="odd:bg-slate-50/60">
                    <th className="sticky left-0 z-10 bg-white text-left font-medium px-3 py-2 border-b border-slate-200">{`O${i + 1}`}</th>
                    {demands.map((_, j) => (
                      <td key={j} className="px-3 py-2 border-b border-slate-200">
                        <input
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-300"
                          placeholder={`c${i + 1}${j + 1}`}
                          value={Number.isFinite(costs[i]?.[j]) ? costs[i][j] : 0}
                          onChange={(e) => updateCost(i, j, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-2 border-b border-slate-200 text-slate-700">{supplies[i] ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th className="sticky left-0 z-10 bg-white text-left font-medium px-3 py-2 border-t border-slate-200">Oferta</th>
                  {demands.map((d, j) => (
                    <td key={j} className="px-3 py-2 border-t border-slate-200 text-slate-700">{d ?? '—'}</td>
                  ))}
                  <td className="px-3 py-2 border-t border-slate-200 text-slate-700">Total</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onCalculate} className="inline-flex items-center justify-center rounded-lg bg-sky-600 text-white px-5 py-2.5 font-medium hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 transition">
            Calcular
          </button>
          <button onClick={onClear} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 transition">
            Limpiar
          </button>
        </div>

        {result && costs.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-medium mb-3">Asignación (Vogel)</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-separate border-spacing-0">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="sticky left-0 z-10 bg-slate-50 text-left px-3 py-2 border-b border-slate-200">Origen \\ Destino</th>
                    {demands.map((_, j) => (
                      <th key={j} className="px-3 py-2 border-b border-slate-200">{`D${j + 1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {supplies.map((_, i) => (
                    <tr key={i} className="odd:bg-slate-50/60">
                      <th className="sticky left-0 z-10 bg-white text-left font-medium px-3 py-2 border-b border-slate-200">{`O${i + 1}`}</th>
                      {demands.map((_, j) => (
                        <td key={j} className="px-3 py-2 border-b border-slate-200">
                          {result.allocations[i]?.[j] ?? 0}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right font-medium">
              Costo total: {result.totalCost}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
