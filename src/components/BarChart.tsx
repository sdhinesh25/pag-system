// Dependency-free horizontal bar chart — rounded bars, subtle grid, value labels.
export interface BarItem {
  label: string
  value: number
  color: string
}

export default function BarChart({ items }: { items: BarItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  const ticks = Array.from({ length: max + 1 }, (_, i) => i)
  const labelW = 152
  const rowH = 26
  const gap = 18
  const chartW = 300
  const top = 6
  const height = items.length * (rowH + gap)
  const vbW = labelW + chartW + 28
  const vbH = height + 30

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${vbW} ${vbH}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* gridlines + tick labels */}
      {ticks.map((t) => {
        const x = labelW + (t / max) * chartW
        return (
          <g key={t}>
            <line x1={x} y1={top} x2={x} y2={top + height - gap} stroke="rgb(var(--line))" strokeWidth={1} strokeOpacity={0.6} />
            <text x={x} y={top + height - gap + 18} textAnchor="middle" fontSize="12" fill="rgb(var(--text-muted))">
              {t}
            </text>
          </g>
        )
      })}
      {/* bars */}
      {items.map((item, i) => {
        const y = top + i * (rowH + gap)
        const w = (item.value / max) * chartW
        return (
          <g key={item.label}>
            <text x={labelW - 12} y={y + rowH / 2} textAnchor="end" dominantBaseline="middle" fontSize="12" fill="rgb(var(--text-muted))">
              {item.label}
            </text>
            <rect x={labelW} y={y} width={Math.max(w, 2)} height={rowH} rx={6} fill={item.color} />
            <text x={labelW + Math.max(w, 2) + 10} y={y + rowH / 2} dominantBaseline="middle" fontSize="12" fontWeight={700} fill="rgb(var(--text-strong))">
              {item.value}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
