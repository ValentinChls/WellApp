/**
 * Carrousel d'accueil — bannières pilotées par le groupement.
 * Mode démo : bannières locales. Mode réel : tRPC `home.list`.
 */
import { isDemoEnabled } from '../lib/demo'
import { trpc } from '../lib/trpcVanilla'

export interface HomeBanner {
  id: string
  title: string
  subtitle: string | null
  imageDataUrl: string
  linkUrl: string | null
}

const gradient = (c1: string, c2: string) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='1200' height='675' fill='url(#g)'/></svg>`,
  )

const DEMO_BANNERS: HomeBanner[] = [
  {
    id: 'b1',
    title: 'Faire équipe pour votre santé',
    subtitle: 'Vaccination, entretiens, prévention : votre pharmacien vous accompagne.',
    imageDataUrl: gradient('#009dc5', '#1d243f'),
    linkUrl: '/prevention',
  },
  {
    id: 'b2',
    title: 'Votre programme de fidélité',
    subtitle: 'Cumulez des points à chaque visite et profitez d’avantages.',
    imageDataUrl: gradient('#2bad70', '#009dc5'),
    linkUrl: '/fidelite',
  },
]

export async function getHomeBanners(): Promise<HomeBanner[]> {
  if (isDemoEnabled()) return DEMO_BANNERS
  return (await trpc.home.list.query()) as HomeBanner[]
}
