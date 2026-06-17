/**
 * Chatbot STRICTEMENT non-santé — garde-fous EN DUR (pas optionnels).
 * Ce module est pur (aucune dépendance) : il sert côté serveur (pré-filtre +
 * repli déterministe) ET côté PWA (mode démo). Le LLM ne fait qu'enrichir une
 * réponse dont le périmètre est déjà borné ici.
 */
import {
  PHARMACY_SERVICES,
  WEEKDAYS,
  WEEKDAY_LABELS,
  type OpeningHours,
  type ServiceCode,
} from './pharmacy'
import { formatDayHours, isOpenNow } from './hours'

/** Disclaimer affiché en permanence dans l'interface du chatbot. */
export const CHATBOT_DISCLAIMER = 'Pour toute question de santé, contactez votre pharmacien.'

/** Réponse de redirection : toute question santé renvoie vers conseil / RDV. */
export const CHATBOT_REDIRECTION =
  'Je ne peux pas répondre aux questions de santé (symptômes, médicaments, traitements…). ' +
  'Pour un avis personnalisé, demandez un conseil à votre pharmacien ou prenez rendez-vous — ' +
  'je m’occupe seulement des informations pratiques (horaires, services, accès, contact).'

/** Affiché quand aucune pharmacie de référence n'est connue (partagé démo ↔ réel). */
export const CHATBOT_NO_PHARMACY =
  'Choisissez d’abord votre pharmacie de référence pour que je puisse vous renseigner.'

/** Données pharmacie servant de base de connaissance (non sensibles). */
export interface ChatbotPharmacy {
  name: string
  city: string
  addressLine?: string
  postalCode?: string
  phone?: string
  services: ServiceCode[]
  openingHours: OpeningHours
}

function deburr(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/**
 * Termes déclenchant une redirection santé (avis médical). Volontairement large
 * et conservateur : en cas de doute, on redirige. « vaccin » n'y figure pas — la
 * vaccination est un service de l'officine (réponse pratique, pas un avis).
 */
const HEALTH_TERMS = [
  'medicament',
  'posologie',
  'dose',
  'dosage',
  'symptom',
  'douleur',
  'fievre',
  'malad',
  'traitement',
  'comprime',
  'gelule',
  'cachet',
  'effet secondaire',
  'effet indesirable',
  'diagnostic',
  'ordonnance',
  'grossesse',
  'enceinte',
  'allergi',
  'infection',
  'antibiotique',
  'tension arterielle',
  'diabete',
  'je dois prendre',
  'puis-je prendre',
  'est-ce grave',
  'est-ce dangereux',
  'mal de',
  'mal a ',
  'mal au',
  'mal aux',
  // symptômes courants
  'toux',
  'tousse',
  'vomi',
  'nausee',
  'vertige',
  'migraine',
  'insomnie',
  'dors pas',
  'dormir',
  'diarrhee',
  'constip',
  'eruption',
  'bouton',
  'demange',
  'brulure',
  'brule',
  'palpitation',
  'essouffl',
  'saigne',
  'plaie',
  'cicatris',
  'tension monte',
  'fatigue',
  'coeur',
  // posologie / usage du médicament
  'renouvel',
  'interaction',
  'interagit',
  'combien de fois',
  'combien par jour',
  'avant le repas',
  'apres le repas',
  'a jeun',
  'goutte',
  ' mg',
  ' ml',
  // contexte pédiatrique (souvent porteur d'une question santé)
  'mon enfant',
  'mon bebe',
  'mon fils',
  'ma fille',
]

/**
 * Vrai si le message relève de la santé → doit être redirigé, jamais traité.
 * BEST-EFFORT (denylist) : c'est un filtre d'UX, PAS une frontière de conformité.
 * La garantie RGPD vient de la NON-rétention du contenu libre (cf. ChatLog).
 */
export function isHealthQuestion(message: string): boolean {
  const m = deburr(message)
  return HEALTH_TERMS.some((t) => m.includes(t))
}

/** Catégorie d'intention pratique — métadonnée NON sensible pour l'audit (jamais le texte). */
export type ChatbotIntent = 'horaires' | 'services' | 'adresse' | 'contact' | 'autre'

export function classifyChatbotIntent(message: string): ChatbotIntent {
  const m = deburr(message)
  const has = (...terms: string[]) => terms.some((t) => m.includes(t))
  if (has('horaire', 'ouvert', 'ferme', 'ouvre', 'heure', 'quand')) return 'horaires'
  if (has('service', 'vaccin', 'trod', 'test', 'entretien', 'bilan', 'orthopedie', 'materiel'))
    return 'services'
  if (has('adresse', 'ou se', 'ou est', 'situe', 'rue', 'acces', 'venir', 'trouver')) return 'adresse'
  if (has('telephone', 'numero', 'appeler', 'joindre', 'contact', 'tel ')) return 'contact'
  return 'autre'
}

/** Base de connaissance texte (RAG) : uniquement des données pharmacie validées. */
export function buildChatbotKnowledge(p: ChatbotPharmacy, now: Date): string {
  const lines: string[] = []
  lines.push(`Pharmacie : ${p.name}`)
  const addr = [p.addressLine, [p.postalCode, p.city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')
  if (addr) lines.push(`Adresse : ${addr}`)
  if (p.phone) lines.push(`Téléphone : ${p.phone}`)
  lines.push(`Statut maintenant : ${isOpenNow(p.openingHours, now) ? 'ouverte' : 'fermée'}`)
  lines.push('Horaires :')
  for (const day of WEEKDAYS) {
    lines.push(`- ${WEEKDAY_LABELS[day]} : ${formatDayHours(p.openingHours, day)}`)
  }
  const services = p.services.map((s) => PHARMACY_SERVICES[s]).filter(Boolean)
  lines.push(`Services proposés : ${services.length ? services.join(', ') : 'non renseignés'}`)
  return lines.join('\n')
}

/**
 * Repli déterministe sans LLM (mode démo + secours serveur si l'API est absente).
 * Répond uniquement dans le périmètre pratique à partir de la base de connaissance.
 */
export function localChatbotAnswer(message: string, p: ChatbotPharmacy, now: Date): string {
  const m = deburr(message)
  const has = (...terms: string[]) => terms.some((t) => m.includes(t))

  if (has('horaire', 'ouvert', 'ferme', 'ouvre', 'heure', 'quand')) {
    const open = isOpenNow(p.openingHours, now)
    const days = WEEKDAYS.map((d) => `${WEEKDAY_LABELS[d]} : ${formatDayHours(p.openingHours, d)}`)
    return (
      `${p.name} est actuellement ${open ? 'ouverte' : 'fermée'}.\n` +
      `Horaires de la semaine :\n${days.join('\n')}`
    )
  }
  if (has('service', 'vaccin', 'trod', 'test', 'entretien', 'bilan', 'orthopedie', 'materiel')) {
    const services = p.services.map((s) => PHARMACY_SERVICES[s]).filter(Boolean)
    return services.length
      ? `${p.name} propose : ${services.join(', ')}.`
      : `Les services de ${p.name} ne sont pas renseignés pour le moment.`
  }
  if (has('adresse', 'ou se', 'ou est', 'situe', 'rue', 'acces', 'venir', 'trouver')) {
    const addr = [p.addressLine, [p.postalCode, p.city].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(', ')
    return addr ? `${p.name} se situe : ${addr}.` : `L’adresse de ${p.name} n’est pas renseignée.`
  }
  if (has('telephone', 'numero', 'appeler', 'joindre', 'contact', 'tel ')) {
    return p.phone
      ? `Vous pouvez joindre ${p.name} au ${p.phone}.`
      : `Le numéro de ${p.name} n’est pas renseigné.`
  }
  return (
    `Je peux vous renseigner sur ${p.name} : horaires et ouverture, services proposés, ` +
    `adresse et accès, coordonnées. Que souhaitez-vous savoir ?`
  )
}
