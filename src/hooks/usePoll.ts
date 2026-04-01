import { useState, useEffect, useRef, useCallback } from 'react'
import { apiFetch } from '../lib/api'

interface PollState<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export function usePoll<T>(url: string, intervalMs: number): PollState<T> {
  const [state, setState] = useState<PollState<T>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
  })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    // Abort any previous in-flight request to prevent stale responses
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await apiFetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: T = await res.json()
      setState({ data, loading: false, error: null, lastUpdated: new Date() })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }))
    }
  }, [url])

  useEffect(() => {
    fetchData()
    timerRef.current = setInterval(fetchData, intervalMs)
    return () => {
      abortRef.current?.abort()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [fetchData, intervalMs])

  return state
}
