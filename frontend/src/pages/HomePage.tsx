import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

const FEATURES = [
  {
    title: 'Выбор типа и времени',
    text: 'Владелец публикует доступное время, гость выбирает тип события и удобный слот.',
  },
  {
    title: 'Быстрое бронирование',
    text: 'Запись с подтверждением и дополнительными заметками — за минуту.',
  },
  {
    title: 'Управление встречами',
    text: 'Типы встреч и список предстоящих записей — в админке владельца.',
  },
]

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-10 p-8">
      <section className="flex flex-col items-start gap-4 pt-10">
        <h1 className="text-4xl font-bold">Календарь звонков</h1>
        <p className="text-muted-foreground">
          Сервис бронирования календаря: владелец публикует доступное время, гость выбирает
          свободный слот и записывается на звонок.
        </p>
        <Button asChild>
          <Link to="/booking">Записаться</Link>
        </Button>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">О сервисе</h2>
        <p className="text-muted-foreground">
          Один календарь вместо переписки: типы событий, свободные слоты и подтверждения — в одном
          месте.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Возможности</h2>
        <ul className="grid gap-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="rounded-lg border p-4">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.text}</p>
            </li>
          ))}
        </ul>
        <Button asChild variant="outline">
          <Link to="/booking">Перейти к записи</Link>
        </Button>
      </section>
    </main>
  )
}
