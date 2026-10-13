/**
 * Единый источник констант приложения (docs/spec.md §3, §4):
 * профиль Владельца живёт здесь, а не в БД; горизонт слотов, границы
 * длительности Типа события и примечания, таймзона показа.
 */
const SLOT_HORIZON_DAYS = 14

export const config = {
  owner: {
    name: process.env.OWNER_NAME ?? 'Владелец',
    contact: process.env.OWNER_CONTACT ?? 'owner@example.com',
  },
  displayTimeZone: process.env.DISPLAY_TIME_ZONE ?? 'Europe/Moscow',
  slotHorizonDays: SLOT_HORIZON_DAYS,
  slotHorizonMs: SLOT_HORIZON_DAYS * 24 * 60 * 60 * 1000,
  eventDurationMinutes: { min: 15, max: 480 },
  noteMaxLength: 500,
  databasePath: process.env.DATABASE_PATH ?? './data/booking.db',
} as const
