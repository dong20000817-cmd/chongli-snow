import { useCallback, useEffect, useRef, useState } from 'react'
import type { Snapshot } from '../lib/types'
import { fetchSnapshot } from '../lib/api'
import { loadSnapshot, saveSnapshot } from '../lib/storage'

export type ForecastStatus = 'loading' | 'refreshing' | 'ready' | 'error'

export interface ForecastState {
  snapshot: Snapshot | null
  status: ForecastStatus
  error: string | null
  offline: boolean
  refresh: () => void
}

const REFRESH_MS = 15 * 60 * 1000

export function useForecast(): ForecastState {
  const initial = useRef<Snapshot | null>(loadSnapshot()).current
  const [snapshot, setSnapshot] = useState<Snapshot | null>(initial)
  const [status, setStatus] = useState<ForecastStatus>(initial ? 'refreshing' : 'loading')
  const [error, setError] = useState<string | null>(null)
  const [fetchOffline, setFetchOffline] = useState(false)
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const snapshotRef = useRef<Snapshot | null>(snapshot)
  const inFlight = useRef<AbortController | null>(null)
  const requestSeq = useRef(0)

  const refresh = useCallback(() => {
    inFlight.current?.abort()
    const controller = new AbortController()
    const seq = ++requestSeq.current
    inFlight.current = controller
    const timeout = window.setTimeout(() => controller.abort(), 12000)
    setStatus(snapshotRef.current ? 'refreshing' : 'loading')
    setError(null)

    fetchSnapshot(controller.signal)
      .then(next => {
        if (seq !== requestSeq.current) return
        snapshotRef.current = next
        setSnapshot(next)
        saveSnapshot(next)
        setFetchOffline(false)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (seq !== requestSeq.current) return
        if (controller.signal.aborted && !snapshotRef.current) {
          setError('请求超时，请检查网络后重试')
          setStatus('error')
          return
        }
        const message = err instanceof Error ? err.message : '网络异常'
        if (snapshotRef.current) {
          setFetchOffline(true)
          setStatus('ready')
          setError(message)
        } else {
          setError(message)
          setStatus('error')
        }
      })
      .finally(() => {
        window.clearTimeout(timeout)
        if (inFlight.current === controller) inFlight.current = null
      })
  }, [])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, REFRESH_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    const onOnline = () => { setOnline(true); refresh() }
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      inFlight.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { snapshot, status, error, offline: !online || fetchOffline, refresh }
}
