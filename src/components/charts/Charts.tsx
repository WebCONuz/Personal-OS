import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'

/**
 * Small, consistent chart wrappers. Single-series charts use the primary hue; the only two-series
 * pairing (chart-1 / chart-2) was validated for CVD separation. Every chart includes a hover tooltip
 * and a visually hidden data table for screen readers. The SVG itself is aria-hidden and not focusable
 * (accessibilityLayer off), so keyboard / screen-reader users get the table instead.
 */

const AXIS = { fontSize: 12, fill: 'var(--muted-foreground)' }

export interface SeriesDef {
  key: string
  label: string
  color: string
}

type Row = Record<string, string | number>

function ChartTooltip({
  active,
  payload,
  label,
  format,
}: Pick<Partial<TooltipContentProps<number, string>>, 'active' | 'payload' | 'label'> & { format: (v: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden="true" />
          {p.name}: <span className="tabular font-medium text-foreground">{format(Number(p.value))}</span>
        </p>
      ))}
    </div>
  )
}

function DataTable({ caption, data, xKey, series, formatter }: { caption: string; data: Row[]; xKey: string; series: SeriesDef[]; formatter: (v: number) => string }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{xKey}</th>
          {series.map((s) => (
            <th key={s.key} scope="col">
              {s.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            <th scope="row">{row[xKey]}</th>
            {series.map((s) => (
              <td key={s.key}>{formatter(Number(row[s.key] ?? 0))}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function Legend({ series }: { series: SeriesDef[] }) {
  return (
    <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
          {s.label}
        </li>
      ))}
    </ul>
  )
}

interface BarsProps {
  data: Row[]
  xKey: string
  series: SeriesDef[]
  caption: string
  height?: number
  formatter?: (v: number) => string
  /** Horizontal bars suit category labels (life areas, expense categories). */
  layout?: 'vertical' | 'horizontal'
}

export function Bars({ data, xKey, series, caption, height = 220, formatter = String, layout = 'horizontal' }: BarsProps) {
  const horizontalBars = layout === 'vertical'
  return (
    <figure className="flex flex-col gap-2">
      {series.length > 1 && <Legend series={series} />}
      <div style={{ height }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart accessibilityLayer={false} data={data} layout={layout} margin={{ top: 4, right: 8, bottom: 0, left: horizontalBars ? 8 : -12 }} barGap={2}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="0" vertical={horizontalBars} horizontal={!horizontalBars} />
            {horizontalBars ? (
              <>
                <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={formatter} />
                <YAxis type="category" dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} width={96} />
              </>
            ) : (
              <>
                <XAxis dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={formatter} width={56} />
              </>
            )}
            <Tooltip cursor={{ fill: 'var(--muted)' }} content={(p) => <ChartTooltip active={p.active} payload={p.payload} label={p.label} format={formatter} />} />
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color}
                radius={horizontalBars ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                maxBarSize={horizontalBars ? 18 : 28}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable caption={caption} data={data} xKey={xKey} series={series} formatter={formatter} />
    </figure>
  )
}

export function TrendLine({ data, xKey, series, caption, height = 200, formatter = String }: Omit<BarsProps, 'layout'>) {
  return (
    <figure className="flex flex-col gap-2">
      {series.length > 1 && <Legend series={series} />}
      <div style={{ height }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart accessibilityLayer={false} data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={formatter} width={56} />
            <Tooltip cursor={{ stroke: 'var(--border)' }} content={(p) => <ChartTooltip active={p.active} payload={p.payload} label={p.label} format={formatter} />} />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                // Dense series read better as a line; markers only when points are few enough to hover individually.
                dot={data.length > 14 ? false : { r: 4, strokeWidth: 2, stroke: 'var(--card)', fill: s.color }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <DataTable caption={caption} data={data} xKey={xKey} series={series} formatter={formatter} />
    </figure>
  )
}

export const CHART_COLORS = {
  primary: 'var(--chart-1)',
  secondary: 'var(--chart-2)',
}
