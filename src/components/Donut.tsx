// Premium rounded-segment doughnut (Apache ECharts), theme-aware.
// Legend lives in the parent ChartPanel; this just draws the ring + labels.
import type { EChartsCoreOption } from 'echarts/core'
import { useMemo } from 'react'
import { useTheme } from '../theme/ThemeProvider'
import EChart from './EChart'

export interface DonutSegment {
  label: string
  value: number
  color: string
}

// Explicit per-theme colors so the chart updates deterministically on toggle.
const PALETTE = {
  light: { surface: '#ffffff', strong: '#0f172a', label: '#94a3b8', pct: '#475569', line: '#cbd5e1' },
  dark: { surface: '#0B1220', strong: '#ffffff', label: '#94A3B8', pct: '#CBD5E1', line: '#CBD5E1' },
}

export default function Donut({
  segments,
  centerValue,
  centerLabel,
  height = '100%',
  showLabels = true,
}: {
  segments: DonutSegment[]
  centerValue: string
  centerLabel: string
  height?: number | string
  showLabels?: boolean
}) {
  const { theme } = useTheme()

  const option = useMemo<EChartsCoreOption>(() => {
    const c = PALETTE[theme]
    // Scale the center value to its width so long values (e.g. "61.11%") clear the ring.
    const centerSize = centerValue.length <= 3 ? 32 : centerValue.length <= 4 ? 30 : 26
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: c.surface,
        borderWidth: 0,
        textStyle: { color: c.strong, fontSize: 12 },
        extraCssText: 'box-shadow:0 8px 24px rgba(0,0,0,0.25);border-radius:8px;',
      },
      // Center text via a single graphic anchored to the pie center — stays
      // perfectly centered regardless of outside-label width (title drifts).
      graphic: {
        type: 'text',
        left: 'center',
        top: 'center',
        style: {
          text: `{val|${centerValue}}\n{sub|${centerLabel}}`,
          textAlign: 'center',
          textVerticalAlign: 'middle',
          rich: {
            val: { fill: c.strong, fontSize: centerSize, fontWeight: 700, lineHeight: centerSize + 6, align: 'center' },
            sub: { fill: c.label, fontSize: 13, fontWeight: 400, lineHeight: 20, align: 'center' },
          },
        },
      },
      series: [
        {
          type: 'pie',
          // Large ring (~19px band) with a wide hole and room for outside labels.
          radius: ['68%', '84%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          startAngle: 90,
          itemStyle: {
            borderRadius: 7,
            borderColor: c.surface,
            borderWidth: 3,
          },
          // Outside % labels with thin connector lines.
          label: {
            show: showLabels,
            position: 'outside',
            formatter: '{d}%',
            color: c.pct,
            fontSize: 11,
            overflow: 'none',
            minMargin: 4,
          },
          labelLine: {
            show: true,
            length: 8,
            length2: 10,
            lineStyle: { color: c.line, width: 1, opacity: 0.45 },
          },
          emphasis: {
            scale: true,
            scaleSize: 5,
            itemStyle: { shadowBlur: 14, shadowColor: 'rgba(0,0,0,0.25)' },
          },
          data: segments.map((s) => ({ value: s.value, name: s.label, itemStyle: { color: s.color } })),
        },
      ],
    }
  }, [segments, centerValue, centerLabel, theme, showLabels])

  return <EChart option={option} height={height} />
}
