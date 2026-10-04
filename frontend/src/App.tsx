import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

type Health = { status: string } | null

function App() {
  const [health, setHealth] = useState<Health>(null)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    setError(null)
    try {
      const res = await fetch('/api/health')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setHealth(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
      setHealth(null)
    }
  }

  useEffect(() => {
    // дымовой запрос статуса при монтировании
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void checkHealth()
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">Календарь звонков</h1>
      <p className="text-muted-foreground">Каркас: Vite + React + TypeScript + shadcn/ui</p>
      <div className="flex items-center gap-3">
        <Button onClick={checkHealth}>Проверить API</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Обновить
        </Button>
      </div>
      <div className="w-full rounded-lg border p-4">
        <p className="text-sm">
          Backend:{' '}
          <code className="font-mono">
            {error ? `error: ${error}` : health ? JSON.stringify(health) : 'loading...'}
          </code>
        </p>
      </div>
    </main>
  )
}

export default App
