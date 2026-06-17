import { MARRONNIER_EVENTS } from '@wellpharma/shared'
import { engagementDb } from '@wellpharma/db'
import { router, groupementProcedure } from '../trpc'

/**
 * Administration du calendrier marronnier (CareEvent, engagement).
 * `reseed` (ré)applique le jeu canonique partagé `@wellpharma/shared` par upsert
 * (slug = clé). C'est l'« import marronnier » côté groupement (report Phase 4) ;
 * une variante d'upload CSV pourra s'y greffer plus tard.
 */
export const marronnierRouter = router({
  count: groupementProcedure.query(async () => {
    return { events: await engagementDb.careEvent.count() }
  }),

  reseed: groupementProcedure.mutation(async () => {
    let upserted = 0
    for (const e of MARRONNIER_EVENTS) {
      await engagementDb.careEvent.upsert({
        where: { slug: e.slug },
        update: {
          title: e.title,
          category: e.category,
          month: e.month,
          description: e.description ?? null,
          targetAgeMin: e.targetAgeMin ?? null,
          targetAgeMax: e.targetAgeMax ?? null,
          targetSex: e.targetSex ?? 'ALL',
          riskFactors: e.riskFactors ?? [],
        },
        create: {
          slug: e.slug,
          title: e.title,
          category: e.category,
          month: e.month,
          description: e.description ?? null,
          targetAgeMin: e.targetAgeMin ?? null,
          targetAgeMax: e.targetAgeMax ?? null,
          targetSex: e.targetSex ?? 'ALL',
          riskFactors: e.riskFactors ?? [],
          source: 'Marronnier Wellpharma',
        },
      })
      upserted++
    }
    return { upserted }
  }),
})
