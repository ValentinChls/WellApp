/** Marronnier — calendrier des campagnes de santé. Partagé seed + PWA (non sensible). */

export type CareEventCategory = 'VACCINATION' | 'DEPISTAGE' | 'PREVENTION' | 'SENSIBILISATION'
export type CareEventTargetSex = 'ALL' | 'MALE' | 'FEMALE'

export interface CareEventSeed {
  slug: string
  title: string
  category: CareEventCategory
  month: number
  description?: string
  targetAgeMin?: number
  targetAgeMax?: number
  targetSex?: CareEventTargetSex
  riskFactors?: string[]
}

export const CARE_EVENT_CATEGORY_LABELS: Record<CareEventCategory, string> = {
  VACCINATION: 'Vaccination',
  DEPISTAGE: 'Dépistage',
  PREVENTION: 'Prévention',
  SENSIBILISATION: 'Sensibilisation',
}

export const MONTH_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

export const MARRONNIER_EVENTS: CareEventSeed[] = [
  { slug: 'cancer-mondial', title: 'Journée mondiale du cancer', category: 'DEPISTAGE', month: 2, description: '3 dépistages organisés : colorectal, col de l’utérus, sein.' },
  { slug: 'endometriose', title: 'Semaine européenne de prévention de l’endométriose', category: 'PREVENTION', month: 3, targetAgeMin: 15, targetAgeMax: 40, targetSex: 'FEMALE', riskFactors: ['gynécologie'] },
  { slug: 'mars-bleu', title: 'Mars bleu — cancer colorectal', category: 'DEPISTAGE', month: 3, targetAgeMin: 50, targetAgeMax: 74 },
  { slug: 'allergie', title: 'Journée Française de l’Allergie', category: 'SENSIBILISATION', month: 3 },
  { slug: 'semaine-rein', title: 'Semaine du rein', category: 'PREVENTION', month: 3, riskFactors: ['âge', 'diabète', 'HTA'] },
  { slug: 'parkinson', title: 'Journée mondiale de la maladie de Parkinson', category: 'SENSIBILISATION', month: 4, riskFactors: ['âge', 'génétique', 'pesticides'] },
  { slug: 'hpv', title: 'Vaccination papillomavirus (HPV)', category: 'VACCINATION', month: 4, targetAgeMin: 11, targetAgeMax: 19, description: '11-14 ans (2 doses) ; rattrapage 15-19 ans.' },
  { slug: 'asthme', title: 'Journée mondiale de l’asthme', category: 'SENSIBILISATION', month: 5 },
  { slug: 'hypertension', title: 'Journée mondiale de l’hypertension', category: 'PREVENTION', month: 5, riskFactors: ['âge', 'surpoids', 'sédentarité', 'diabète de type 2', 'stress', 'tabac'] },
  { slug: 'juin-vert', title: 'Juin Vert — cancer du col de l’utérus', category: 'DEPISTAGE', month: 6, targetAgeMin: 25, targetAgeMax: 65, targetSex: 'FEMALE' },
  { slug: 'diabete-type2', title: 'Semaine de prévention du diabète de type 2', category: 'PREVENTION', month: 6, targetAgeMin: 40, riskFactors: ['HTA', 'surpoids', 'sédentarité'] },
  { slug: 'cancer-peau', title: 'Sensibilisation au cancer de la peau', category: 'SENSIBILISATION', month: 7 },
  { slug: 'arthrose', title: 'Journée mondiale de l’arthrose', category: 'SENSIBILISATION', month: 9, riskFactors: ['âge'] },
  { slug: 'octobre-rose', title: 'Octobre Rose — cancer du sein', category: 'DEPISTAGE', month: 10, targetAgeMin: 50, targetAgeMax: 74, targetSex: 'FEMALE' },
  { slug: 'depression', title: 'Journée européenne de la dépression', category: 'SENSIBILISATION', month: 10 },
  { slug: 'vaccins-hiver', title: 'Vaccinations hivernales (Grippe, Covid-19, VRS)', category: 'VACCINATION', month: 10, targetAgeMin: 60, riskFactors: ['60 ans et plus', 'forme grave'] },
  { slug: 'movember', title: 'Movember — santé masculine', category: 'SENSIBILISATION', month: 11, targetSex: 'MALE', riskFactors: ['cancer de la prostate', 'cancer des testicules', 'santé mentale'] },
  { slug: 'mois-sans-tabac', title: 'Mois sans tabac', category: 'PREVENTION', month: 11, riskFactors: ['tabac'] },
  { slug: 'sida', title: 'Journée mondiale du sida', category: 'SENSIBILISATION', month: 12 },
]
