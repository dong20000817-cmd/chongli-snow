import { useEffect, useMemo, useState } from 'react'
import { useForecast } from './hooks/useForecast'
import { useHashRoute } from './hooks/useHashRoute'
import { RESORTS, DEFAULT_RESORT_ID } from './data/resorts'
import { currentHour, isStale } from './lib/time'
import { saveResortId } from './lib/storage'
import { ROAD_DATA } from './lib/status'
import { backgroundClass, ErrorScreen, LoadingScreen } from './components/Common'
import { SwitchSheet } from './components/SwitchSheet'
import { WhySheet } from './components/WhySheet'
import { RouteSheet } from './components/RouteSheet'
import { TabBar, type ModuleTab } from './components/TabBar'
import { Home } from './screens/Home'
import { WindDetail } from './screens/WindDetail'
import { Week } from './screens/Week'
import { RoadScreen } from './screens/RoadScreen'
import { SnowScreen } from './screens/SnowScreen'
import { DevPage } from './screens/DevPage'
import { PosterScreen } from './screens/Poster'
import { ToolsSheet } from './components/ToolsSheet'
import { TrailsScreen } from './screens/Trails'
import { TrailPosterScreen } from './screens/TrailPoster'

type Sheet = null | { type: 'switch' } | { type: 'why'; day: number } | { type: 'routes' } | { type: 'tools' }

export default function App() {
  const { route, navigate } = useHashRoute()
  const { snapshot, status, error, offline, refresh } = useForecast()
  const [sheet, setSheet] = useState<Sheet>(null)
  const [routeId, setRouteId] = useState(ROAD_DATA.routes[0].id)

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
    if (resort) {
      document.title = route.screen === 'dev'
        ? '开发者简报 · 滑雪天气通'
        : route.screen === 'poster'
          ? '天气概览图 · 滑雪天气通'
          : route.screen === 'trails'
            ? '雪道情报录入 · 滑雪天气通'
            : route.screen === 'trailposter'
              ? '雪道情报图 · 滑雪天气通'
              : `${resort.short} · 滑雪天气通`
    }
  }, [resort, route.screen])

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
    navigate(route.screen === 'snow' ? 'snow' : 'home', id)
  }

  const activeTab: ModuleTab = route.screen === 'road' ? 'road' : route.screen === 'snow' ? 'snow' : 'weather'
  const onTab = (tab: ModuleTab) => {
    if (tab === 'weather') navigate('home')
    else if (tab === 'road') navigate('road')
    else navigate('snow')
  }
  const onContext = () => {
    if (activeTab === 'road') setSheet({ type: 'routes' })
    else setSheet({ type: 'switch' })
  }

  const bg = route.screen === 'road'
    ? 'bg-cloud'
    : route.screen === 'snow'
      ? 'bg-snow'
      : route.screen === 'dev' || route.screen === 'poster' || route.screen === 'trails' || route.screen === 'trailposter'
        ? 'bg-night'
        : backgroundClass(current)

  return (
    <div className={`app${sheet ? ' behind' : ''}`}>
      <div className={`bg ${bg}`} />
      {route.screen === 'dev' ? (
        <DevPage snapshot={snapshot} resortId={resort.id} onRefresh={refresh} refreshing={status === 'refreshing'} />
      ) : route.screen === 'poster' ? (
        <PosterScreen snapshot={snapshot} resortId={resort.id} onBack={() => navigate('home')} />
      ) : route.screen === 'trails' ? (
        <TrailsScreen snapshot={snapshot} resortId={resort.id} />
      ) : route.screen === 'trailposter' ? (
        <TrailPosterScreen snapshot={snapshot} onBack={() => navigate('trails', resort.id)} />
      ) : route.screen === 'wind' ? (
        <WindDetail resort={resort} snapshot={snapshot} onBack={() => navigate('home')} offline={offline} stale={stale} error={error} />
      ) : route.screen === 'week' ? (
        <Week resort={resort} snapshot={snapshot} onBack={() => navigate('home')} onOpenWhy={day => setSheet({ type: 'why', day })} offline={offline} stale={stale} error={error} />
      ) : route.screen === 'road' ? (
        <RoadScreen routeId={routeId} onSelectRoute={setRouteId} today={snapshot.today} />
      ) : route.screen === 'snow' ? (
        <SnowScreen resort={resort} today={snapshot.today} />
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
          onOpenPoster={() => navigate('poster')}
          onOpenTools={() => setSheet({ type: 'tools' })}
        />
      )}

      {route.screen !== 'dev' && route.screen !== 'poster' && route.screen !== 'trails' && route.screen !== 'trailposter' && (
        <TabBar
          active={activeTab}
          onTab={onTab}
          onContext={onContext}
          contextLabel={activeTab === 'road' ? '切换路线' : '切换雪场'}
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
      {sheet?.type === 'routes' && (
        <RouteSheet
          selectedId={routeId}
          onSelect={id => { setRouteId(id); setSheet(null) }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.type === 'tools' && (
        <ToolsSheet resortId={resort.id} onClose={() => setSheet(null)} />
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
