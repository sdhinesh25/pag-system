// Thin React wrapper around Apache ECharts (tree-shaken core + pie + SVG renderer).
import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, TitleComponent, GraphicComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import type { EChartsCoreOption } from 'echarts/core'

echarts.use([PieChart, TooltipComponent, LegendComponent, TitleComponent, GraphicComponent, SVGRenderer])

export default function EChart({
  option,
  height = 250,
}: {
  option: EChartsCoreOption
  height?: number | string
}) {
  const elRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  // Init once; clean up on unmount.
  useEffect(() => {
    if (!elRef.current) return
    const chart = echarts.init(elRef.current, undefined, { renderer: 'svg' })
    chartRef.current = chart
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(elRef.current)
    return () => {
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  // Re-apply whenever the option changes (theme switch, data change).
  useEffect(() => {
    chartRef.current?.setOption(option, true)
  }, [option])

  return <div ref={elRef} style={{ height, width: '100%' }} className="min-h-0" />
}
