import { getStaffRole } from '@/lib/role'
import { CampaignsClient } from './campaigns-client'

export default async function CampagnesPage() {
  const role = await getStaffRole()
  return <CampaignsClient role={role} />
}
