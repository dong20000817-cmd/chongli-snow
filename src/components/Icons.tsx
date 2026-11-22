import type { CSSProperties } from 'react'

const PATHS = {
  pin: '<path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 15-5-5L5 20"/>',
  download: '<path d="M12 3v11m0 0 4-4m-4 4-4-4M5 19h14"/>',
  sparkle: '<path d="M12 2.5c.6 5.1 3.4 7.9 8.5 8.5-5.1.6-7.9 3.4-8.5 8.5-.6-5.1-3.4-7.9-8.5-8.5 5.1-.6 7.9-3.4 8.5-8.5Z"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20.4 14.4A8.5 8.5 0 0 1 9.6 3.6 8.6 8.6 0 1 0 20.4 14.4Z"/>',
  cloud: '<path d="M6.2 18h11.2a3.8 3.8 0 0 0 .4-7.6A5.7 5.7 0 0 0 7 9.3 4.4 4.4 0 0 0 6.2 18Z"/>',
  partly: '<circle cx="8" cy="8" r="3.2"/><path d="M8 2.4v1.4M2.4 8h1.4M4 4l1 1M12.6 4l-1 1M4 12l1-1"/><path d="M9.5 19h9a3 3 0 0 0 .3-6 4.6 4.6 0 0 0-8.5-1.4A3.6 3.6 0 0 0 9.5 19Z"/>',
  snow: '<path d="M6.2 16.5h11.2a3.8 3.8 0 0 0 .4-7.6A5.7 5.7 0 0 0 7 7.8a4.4 4.4 0 0 0-.8 8.7Z"/><path d="M8 19.5v1M12 19.5v1M16 19.5v1M9.5 20.5l-1-.6M14.5 20.5l1-.6M9.5 22l-1 .6M14.5 22l1 .6"/>',
  fog: '<path d="M6.2 15.5h11.2a3.8 3.8 0 0 0 .4-7.6A5.7 5.7 0 0 0 7 6.8a4.4 4.4 0 0 0-.8 8.7Z"/><path d="M5 19h14M8 22h8"/>',
  rain: '<path d="M6.2 15.5h11.2a3.8 3.8 0 0 0 .4-7.6A5.7 5.7 0 0 0 7 6.8a4.4 4.4 0 0 0-.8 8.7Z"/><path d="M8 18.5l-1 2M12 18.5l-1 2M16 18.5l-1 2"/>',
  storm: '<path d="M6.2 15.5h11.2a3.8 3.8 0 0 0 .4-7.6A5.7 5.7 0 0 0 7 6.8a4.4 4.4 0 0 0-.8 8.7Z"/><path d="m12 17-2 4h3l-1 3 4-5h-3l1.5-2Z"/>',
  wind: '<path d="M3 8h11.5a2.5 2.5 0 1 0-2.4-3.2M3 12h15.5a2.5 2.5 0 1 1-2.4 3.2M3 16h8.5a2.2 2.2 0 1 1-2.1 2.8"/>',
  eye: '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/>',
  thermo: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z"/><path d="M12 9v6.5"/>',
  mountain: '<path d="M3 19h18L14 6l-3.5 6.5L8 9l-5 10Z"/><path d="m10.5 12.5 2-2 2 2"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 5.3-5.3 2.2 2.2-5.3 5.3-2.2Z"/>',
  gauge: '<path d="M4.2 17a8.5 8.5 0 1 1 15.6 0"/><path d="m12 13 3.2-3.2"/><circle cx="12" cy="14" r="1.4"/>',
  snowflake: '<path d="M12 2v20M4 6l16 12M20 6 4 18M8 4l4 4 4-4M8 20l4-4 4 4M2 10l4 2-4 2M22 10l-4 2 4 2"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  warning: '<path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5M12 17.2v.2"/>',
  ski: '<path d="M4 19.5 20 17M7 16.5l2.2-6.5 3.2 2 2.4-4 1.4 5.4"/><circle cx="9" cy="6" r="1.8"/><path d="M13 12.5l-3 4M6 21l2-2M18 20l-1-1"/>',
  check: '<path d="m4.5 12.5 5 5 10-11"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.2"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  cable: '<path d="M3 5.5h18M6 5.5 8.5 19M18 5.5 15.5 19M7.2 12h9.6M8 19h8"/><path d="M10 5.5V9h4V5.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  road: '<path d="M6 21 9 3M18 21 15 3M12 5v3M12 11v3M12 17v3"/>',
  trail: '<path d="M3 19h18L14 6l-3.5 6.5L8 9l-5 10Z"/><path d="m10.5 12.5 2-2 2 2"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
  chart: '<path d="M4 20V4M4 20h16"/><rect x="7" y="12" width="3" height="5" rx="1"/><rect x="12" y="8" width="3" height="9" rx="1"/><rect x="17" y="5" width="3" height="12" rx="1"/>',
} as const

export type IconName = keyof typeof PATHS

interface IconProps {
  name: IconName
  size?: number
  className?: string
  style?: CSSProperties
}

export function Icon({ name, size = 16, className = '', style }: IconProps) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  )
}

export function weatherIconName(code: number | null | undefined, isDay: number | null | undefined): IconName {
  const c = Number(code) || 0
  if (c === 0) return isDay ? 'sun' : 'moon'
  if (c === 1) return isDay ? 'partly' : 'moon'
  if (c === 2) return 'partly'
  if (c === 3) return 'cloud'
  if (c === 45 || c === 48) return 'fog'
  if (c >= 51 && c <= 67) return 'rain'
  if (c >= 71 && c <= 77) return 'snow'
  if (c >= 80 && c <= 82) return 'rain'
  if (c >= 85 && c <= 86) return 'snow'
  if (c >= 95) return 'storm'
  return 'cloud'
}

interface WeatherIconProps {
  code: number | null | undefined
  isDay: number | null | undefined
  size?: number
  className?: string
}

export function WeatherIcon({ code, isDay, size = 24, className = '' }: WeatherIconProps) {
  return <Icon name={weatherIconName(code, isDay)} size={size} className={className} />
}
