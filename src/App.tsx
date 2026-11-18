import { useEffect, useMemo, useState } from 'react'
import { useForecast } from './hooks/useForecast'
import { useHashRoute } from './hooks/useHashRoute'
import { RESORTS, DEFAULT_RESORT_ID } from './data/resorts'
import { currentHour, isStale } from './lib/time'
import { saveResortId } from './lib/storage'
import { backgroundClass, ErrorScreen, LoadingScreen } from './components/Common'
import { SwitchSheet } from './components/SwitchSheet'
import { WhySheet } from './components/WhySheet'
import { Home } from './screens/Home'
import { WindDetail } from './screens/WindDetail'
import { Week } from './screens/Week'

type Sheet = null | { type: 'switch' } | { type: 'why'; day: number }

export default function App() {
  const { route, navigate } = useHashRoute()
  const { snapshot, status, error, offline, refresh } = useForecast()
  const [sheet, setSheet] = useState<Sheet>(null)

  const resort = useMemo(() => {
    if (!snapshot) return null
    return snapshot.resorts[route.resortId]
      ?? snapshot.resorts[DEFAULT_RESORT_ID]
      ?? Object.values(snapshot.resorts)[0]
      ?? null
  }, [snapshot, route.resortId])

  const resorts = useMemo(() => {
    if (!snapshot) return []
    return RESORTS.map(meta => snapshot.resorts[meta.id]).filter(Boolean)
  }, [snapshot])

  useEffect(() => {
    if (resort) document.title = `${resort.short} · 滑雪天气通`
  }, [resort])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route.screen, route.resortId])

  if (!snapshot || !resort) {
    if (status === 'error') return <ErrorScreen message={error} onRetry={refresh} />
    return <LoadingScreen />
  }

  const current = currentHour(resort, snapshot)
  const stale = isStale(snapshot) && !offline

  const selectResort = (id: string) => {
    saveResortId(id)
    setSheet(null)
    navigate('home', id)
  }

  return (
    <div className={`app${sheet ? ' behind' : ''}`}>
      <div className={`bg ${backgroundClass(current)}`} />
      {route.screen === 'wind' ? (
        <WindDetail resort={resort} snapshot={snapshot} onBack={() => navigate('home')} offline={offline} stale={stale} error={error} />
      ) : route.screen === 'week' ? (
        <Week resort={resort} snapshot={snapshot} onBack={() => navigate('home')} onOpenWhy={day => setSheet({ type: 'why', day })} offline={offline} stale={stale} error={error} />
      ) : (
        <Home
          resort={resort}
          snapshot={snapshot}
          refreshing={status === 'refreshing'}
          offline={offline}
          stale={stale}
          error={error}
          onRefresh={refresh}
          onOpenWhy={day => setSheet({ type: 'why', day: day ?? 0 })}
          onOpenWind={() => navigate('wind')}
          onOpenWeek={() => navigate('week')}
          onOpenSwitch={() => setSheet({ type: 'switch' })}
        />
      )}

      {sheet?.type === 'switch' && (
        <SwitchSheet
          resorts={resorts}
          snapshot={snapshot}
          selectedId={resort.id}
          onSelect={selectResort}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.type === 'why' && (
        <WhySheet
          resort={resort}
          snapshot={snapshot}
          dayIndex={sheet.day}
          onClose={() => setSheet(null)}
          onOpenWind={() => { setSheet(null); navigate('wind') }}
        />
      )}
    </div>
  )
}
