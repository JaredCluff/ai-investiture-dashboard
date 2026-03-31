const API_KEY = import.meta.env.VITE_API_KEY ?? ''

export function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    'X-API-Key': API_KEY,
    ...(init?.headers as Record<string, string> ?? {}),
  }
  return fetch(url, { ...init, headers })
}
