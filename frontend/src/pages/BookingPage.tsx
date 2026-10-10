import { PrototypeSwitcher, useVariant } from '@/booking-prototype/PrototypeSwitcher'
import VariantA from '@/booking-prototype/VariantA'
import VariantB from '@/booking-prototype/VariantB'
import VariantC from '@/booking-prototype/VariantC'

// ПРОТОТИП (#9): три варианта гостевого сценария, переключаются ?variant=A|B|C.
export default function BookingPage() {
  const variant = useVariant()
  return (
    <>
      {variant === 'A' && <VariantA />}
      {variant === 'B' && <VariantB />}
      {variant === 'C' && <VariantC />}
      <PrototypeSwitcher />
    </>
  )
}
