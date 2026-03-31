import { useState, useEffect, useRef, useCallback } from 'react'

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

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: T = await res.json()
      setState({ data, loading: false, error: null, lastUpdated: new Date() })
    } catch (err) {
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
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [fetchData, intervalMs])

  return state
}
