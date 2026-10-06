import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

// TODO: заменить заглушку на форму выбора типа события, слота и создания записи
export default function BookingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold">Запись на звонок</h1>
      <p className="text-muted-foreground">
        Здесь будет выбор типа события, слота и форма бронирования с подтверждением.
      </p>
      <Button asChild variant="outline">
        <Link to="/">На главную</Link>
      </Button>
    </main>
  )
}
