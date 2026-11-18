import { useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { HourPoint } from '../lib/types'
import { dirText, levelColor, windLevel } from '../lib/wind'
import { fmtTime, round } from '../lib/format'

interface WindChartProps {
  hourly: HourPoint[]
  startIndex: number
  count: number
  currentIndex: number
  labelsEvery?: number
}

const W = 360
const H = 222
const L = 27
const R = 7
const T = 18
const B = 25
const PW = W - L - R
const PH = H - T - B
const MAX = 10

function yFor(level: number): number {
  return T + PH - (Math.max(0, Math.min(MAX, level)) / MAX) * PH
}

export function WindChart({ hourly, startIndex, count, currentIndex, labelsEvery }: WindChartProps) {
  const uid = useId().replace(/:/g, '')
  const wrapRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)
  const hours = useMemo(() => hourly.slice(startIndex, startIndex + count), [hourly, startIndex, count])
  const cur = currentIndex - startIndex
  const step = labelsEvery ?? (hours.length > 30 ? 6 : 3)
  const gradientId = `gust-${uid}`

  useEffect(() => {
    setActive(null)
  }, [startIndex, count])

  if (!hours.length) return null
  const xFor = (i: number) => L + (i + 0.5) * (PW / hours.length)
  const barW = Math.max(2.4, Math.min(10, (PW / hours.length) * 0.54))

  const onPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    if (!rect.width) return
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    const idx = Math.min(hours.length - 1, Math.floor((x / rect.width) * hours.length))
    setActive(idx)
  }

  const activeHour = active != null ? hours[active] : null
  const tooltipLeft = active != null ? Math.min(84, Math.max(16, ((active + 0.5) / hours.length) * 100)) : 0

  return (
    <div
      className="chart-wrap"
      ref={wrapRef}
      onPointerMove={onPointer}
      onPointerDown={onPointer}
      onPointerLeave={() => setActive(null)}
      onPointerCancel={() => setActive(null)}
    >
      <svg
        className="chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`未来 ${hours.length} 小时风力图，当前 ${windLevel(hours[Math.max(0, Math.min(cur, hours.length - 1))].peak.wind)} 级`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".85" />
            <stop offset="1" stopColor="#fff" stopOpacity=".35" />
          </linearGradient>
        </defs>

        {hours.map((h, i) => {
          const hh = Number(h.time.slice(11, 13))
          if (hh < 8 || hh > 16) return null
          return <rect key={`day-${h.time}`} x={xFor(i) - PW / hours.length / 2} y={T} width={PW / hours.length} height={PH} fill="rgba(255,255,255,.035)" />
        })}

        <rect x={L} y={yFor(10)} width={PW} height={yFor(8) - yFor(10)} fill="rgba(255,69,58,.10)" />
        <rect x={L} y={yFor(8)} width={PW} height={yFor(6) - yFor(8)} fill="rgba(255,159,10,.075)" />
        <rect x={L} y={yFor(6)} width={PW} height={yFor(4) - yFor(6)} fill="rgba(255,214,10,.045)" />

        {[0, 2, 4, 6, 8, 10].map(level => (
          <g key={`grid-${level}`}>
            <line x1={L} y1={yFor(level)} x2={W - R} y2={yFor(level)} stroke={`rgba(255,255,255,${level === 0 ? 0.18 : 0.09})`} strokeWidth="1" />
            <text x={L - 6} y={yFor(level) + 3} textAnchor="end" fontSize="8" fill="rgba(255,255,255,.46)">{level}</text>
          </g>
        ))}

        {[{ lvl: 6, label: '缆车降速', color: 'rgba(255,159,10,.7)', text: '#FFD8A8' }, { lvl: 8, label: '可能停运', color: 'rgba(255,69,58,.8)', text: '#FFB3AD' }].map(t => (
          <g key={`threshold-${t.lvl}`}>
            <line x1={L} y1={yFor(t.lvl)} x2={W - R} y2={yFor(t.lvl)} stroke={t.color} strokeWidth="1" strokeDasharray="3 3" />
            <text x={W - R - 1} y={yFor(t.lvl) - 3} textAnchor="end" fontSize="7.2" fill={t.text}>{t.lvl}级 {t.label}</text>
          </g>
        ))}

        {hours.map((h, i) => {
          const level = windLevel(h.peak.wind)
          const y = yFor(level)
          return (
            <rect
              key={`bar-${h.time}`}
              x={xFor(i) - barW / 2}
              y={y}
              width={barW}
              height={Math.max(2, yFor(0) - y)}
              rx={Math.min(3, barW / 2)}
              fill={levelColor(level)}
              opacity={active === i ? 1 : level >= 6 ? 0.95 : 0.78}
            />
          )
        })}

        <polyline
          points={hours.map((h, i) => `${xFor(i)},${yFor(windLevel(h.peak.gust))}`).join(' ')}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.8"
          strokeDasharray="3 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {hours.map((h, i) => {
          if (i % step !== 0) return null
          const deg = Number(h.peak.dir) || 0
          return (
            <text
              key={`dir-${h.time}`}
              x={xFor(i)}
              y="11"
              textAnchor="middle"
              fontSize="9"
              fill="rgba(255,255,255,.55)"
              transform={`rotate(${deg + 180} ${xFor(i)} 8)`}
            >↑</text>
          )
        })}

        {cur >= 0 && cur < hours.length && (
          <g>
            <line x1={xFor(cur)} y1={T - 1} x2={xFor(cur)} y2={T + PH} stroke="rgba(255,255,255,.55)" strokeWidth="1" strokeDasharray="2 3" />
            <circle cx={xFor(cur)} cy={yFor(windLevel(hours[cur].peak.wind))} r="2.9" fill="#fff" stroke="#0B1725" strokeWidth="1.5" />
          </g>
        )}

        {hours.map((h, i) => {
          if (i % step !== 0) return null
          return <text key={`x-${h.time}`} x={xFor(i)} y={H - 4} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,.48)">{fmtTime(h.time)}</text>
        })}
      </svg>

      {activeHour && (
        <div className="chart-tooltip" style={{ left: `${tooltipLeft}%` }}>
          <b>{fmtTime(activeHour.time)} · {windLevel(activeHour.peak.wind)}级</b>
          <span>{dirText(activeHour.peak.dir)}</span>
          <div className="tt-row"><span>持续风</span><b>{round(activeHour.peak.wind)} km/h</b></div>
          <div className="tt-row"><span>阵风</span><b>{round(activeHour.peak.gust)} km/h</b></div>
        </div>
      )}
    </div>
  )
}
