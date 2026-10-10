import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { cn } from '@/lib/utils'

const VARIANTS = [
  { key: 'A', name: 'Мастер по шагам' },
  { key: 'B', name: 'Всё на одной странице' },
  { key: 'C', name: 'Календарь-сетка' },
] as const

export type VariantKey = (typeof VARIANTS)[number]['key']

export function useVariant(): VariantKey {
  const [params] = useSearchParams()
  const raw = params.get('variant')?.toUpperCase()
  return (VARIANTS.find((v) => v.key === raw)?.key ?? 'B') satisfies VariantKey
}

export function PrototypeSwitcher() {
  const [params, setParams] = useSearchParams()
  const current = useVariant()
  const index = VARIANTS.findIndex((v) => v.key === current)

  const go = (delta: number) => {
    const next = VARIANTS[(index + delta + VARIANTS.length) % VARIANTS.length]
    const nextParams = new URLSearchParams(params)
    nextParams.set('variant', next.key)
    setParams(nextParams, { replace: true })
  }

  useEffect(() => {
    if (import.meta.env.PROD) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (import.meta.env.PROD) return null

  const currentVariant = VARIANTS[index]
  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3',
        'rounded-full border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg',
      )}
    >
      <button
        type="button"
        aria-label="Предыдущий вариант"
        className="rounded-full px-2 py-1 hover:bg-zinc-700"
        onClick={() => go(-1)}
      >
        ←
      </button>
      <span className="min-w-48 text-center">
        <strong>{currentVariant.key}</strong> · {currentVariant.name}
      </span>
      <button
        type="button"
        aria-label="Следующий вариант"
        className="rounded-full px-2 py-1 hover:bg-zinc-700"
        onClick={() => go(1)}
      >
        →
      </button>
    </div>
  )
}
