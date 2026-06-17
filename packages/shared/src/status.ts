/** Libellés FR des statuts (demande de conseil & rendez-vous). */

export const ADVICE_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Envoyée',
  IN_PROGRESS: 'Lue',
  ANSWERED: 'Traitée',
  CLOSED: 'Clôturée',
  CANCELLED: 'Annulée',
}

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Confirmé',
  CONFIRMED: 'Confirmé',
  CANCELLED: 'Annulé',
  COMPLETED: 'Effectué',
  NO_SHOW: 'Absent',
}

export function adviceStatusLabel(status: string): string {
  return ADVICE_STATUS_LABELS[status] ?? status
}

export function appointmentStatusLabel(status: string): string {
  return APPOINTMENT_STATUS_LABELS[status] ?? status
}
