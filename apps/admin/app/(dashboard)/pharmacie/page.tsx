import { getStaffRole } from '@/lib/role'
import { PharmacieClient } from './pharmacie-client'

export default async function PharmaciePage() {
  const role = await getStaffRole()
  return <PharmacieClient role={role} />
}
