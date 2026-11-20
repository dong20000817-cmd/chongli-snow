import { useCallback, useEffect, useState } from 'react'
import { RESORTS, DEFAULT_RESORT_ID } from '../data/resorts'

export type Screen = 'home' | 'wind' | 'week' | 'road' | 'snow' | 'dev' | 'poster'

export interface Route {
  screen: Screen
  resortId: string
}

const SCREENS: Screen[] = ['home', 'wind', 'week', 'road', 'snow', 'dev', 'poster']
const IDS = new Set(RESORTS.map(r => r.id))

export function parseHash(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [screenRaw, resortRaw] = raw.split('/')
  const screen = (SCREENS.includes(screenRaw as Screen) ? screenRaw : 'home') as Screen
  const resortId = resortRaw && IDS.has(resortRaw) ? resortRaw : DEFAULT_RESORT_ID
  return { screen, resortId }
}

export function useHashRoute(): { route: Route; navigate: (screen: Screen, resortId?: string) => void } {
  const [route, setRoute] = useState<Route>(() => parseHash())

  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    if (!window.location.hash) {
      window.history.replaceState(null, '', `#/${route.screen}/${route.resortId}`)
    }
    return () => window.removeEventListener('hashchange', onChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const navigate = useCallback((screen: Screen, resortId = route.resortId) => {
    const next = `#/${screen}/${resortId}`
    if (window.location.hash === next) {
      setRoute({ screen, resortId })
    } else {
      window.location.hash = next
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [route.resortId])

  return { route, navigate }
}
