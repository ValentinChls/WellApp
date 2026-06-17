import { z } from 'zod'
import { engagementDb, writeKpi } from '@wellpharma/db'
import {
  distanceKm,
  isOpenNow,
  type OpeningHours,
  type PharmacyView,
  type ServiceCode,
} from '@wellpharma/shared'
import { router, publicProcedure } from '../trpc'

type PharmacyRecord = {
  id: string
  cip: string | null
  name: string
  addressLine: string | null
  postalCode: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  openingHours: unknown
  services: string[]
}

/** Projette un enregistrement Pharmacy en vue UI (distance + ouvert/fermé). */
function toView(p: PharmacyRecord, origin?: { latitude: number; longitude: number }): PharmacyView {
  const openingHours = (p.openingHours ?? {}) as OpeningHours
  return {
    id: p.id,
    cip: p.cip ?? '',
    name: p.name,
    addressLine: p.addressLine ?? '',
    postalCode: p.postalCode ?? '',
    city: p.city ?? '',
    latitude: p.latitude ?? 0,
    longitude: p.longitude ?? 0,
    phone: p.phone ?? '',
    services: (p.services ?? []) as ServiceCode[],
    openingHours,
    distanceKm:
      origin && p.latitude != null && p.longitude != null
        ? distanceKm(origin, { latitude: p.latitude, longitude: p.longitude })
        : null,
    isOpen: isOpenNow(openingHours, new Date()),
  }
}

/** Domaine ENGAGEMENT — contenus non sensibles (consultables publiquement). */
export const engagementRouter = router({
  careEvents: router({
    /** Marronnier / calendrier vaccinal, filtrable par mois. */
    list: publicProcedure
      .input(z.object({ month: z.number().int().min(1).max(12).optional() }).optional())
      .query(({ input }) =>
        engagementDb.careEvent.findMany({
          where: input?.month ? { month: input.month } : undefined,
          orderBy: [{ month: 'asc' }, { title: 'asc' }],
        }),
      ),
  }),

  pharmacies: router({
    /** Recherche d'officine (nom / ville / code postal) + tri par distance si géolocalisé. */
    search: publicProcedure
      .input(
        z
          .object({
            query: z.string().max(80).optional(),
            lat: z.number().min(-90).max(90).optional(),
            lng: z.number().min(-180).max(180).optional(),
          })
          .optional(),
      )
      .query(async ({ input }) => {
        const q = input?.query?.trim()
        const rows = await engagementDb.pharmacy.findMany({
          where: q
            ? {
                OR: [
                  { postalCode: { startsWith: q } },
                  { city: { contains: q, mode: 'insensitive' } },
                  { name: { contains: q, mode: 'insensitive' } },
                ],
              }
            : undefined,
          take: 50,
          orderBy: { name: 'asc' },
        })
        const origin =
          input?.lat != null && input?.lng != null
            ? { latitude: input.lat, longitude: input.lng }
            : undefined
        const views = rows.map((p) => toView(p, origin))
        if (origin) views.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
        // KPI : chaque recherche (agrégé, sans donnée nominative).
        await writeKpi({
          name: 'pharmacy_search',
          properties: { hasQuery: Boolean(q), geo: Boolean(origin), results: views.length },
        })
        return views
      }),

    /** Fiche pharmacie détaillée. */
    getById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
      const p = await engagementDb.pharmacy.findUnique({ where: { id: input.id } })
      return p ? toView(p) : null
    }),
  }),
})
