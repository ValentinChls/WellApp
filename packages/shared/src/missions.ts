/**
 * MOTEUR DE MISSIONS PATIENTS — primitif générique.
 *
 * Une « mission » = un parcours patient rémunéré/tracé. L'entretien Ameli n'est
 * qu'UN type de mission parmi d'autres (AVK, AOD, BPM, observance, vaccination,
 * dépistage, prévention saisonnière, suivi post-délivrance…).
 *
 * STRUCTURE non sensible (partagée serveur + PWA). Seules les RÉPONSES du
 * patient sont des données de santé (chiffrées at-rest côté serveur, domaine
 * `health`). Parcours pensé « 1 question par écran » (complétion + accessibilité).
 */

export type MissionType =
  | 'ENTRETIEN_AVK'
  | 'ENTRETIEN_AOD'
  | 'ENTRETIEN_ASTHME'
  | 'BPM'
  | 'OBSERVANCE'
  | 'VACCINATION'
  | 'DEPISTAGE'
  | 'PREVENTION_SAISON'
  | 'SUIVI_POST_DELIVRANCE'

export type MissionRecurrence = 'ponctuelle' | 'annuelle' | 'saisonniere' | 'evenement'
export type MissionCollaboration = 'patient' | 'mixte' | 'pharmacien'

/** Règle de détection d'un « point d'attention » à signaler au pharmacien. */
export interface AttentionRule {
  /** Valeurs (single/multi) qui déclenchent l'alerte. */
  values?: string[]
  /** Booléen déclencheur. */
  isTrue?: boolean
  /** Seuils numériques / échelle. */
  gte?: number
  lte?: number
  /** Libellé affiché au pharmacien si déclenché. */
  label: string
}

interface StepBase {
  id: string
  prompt: string
  help?: string
  required?: boolean
  attention?: AttentionRule
}

export type MissionStep =
  | (StepBase & { kind: 'info' })
  | (StepBase & { kind: 'single'; options: string[] })
  | (StepBase & { kind: 'multi'; options: string[] })
  | (StepBase & { kind: 'boolean' })
  | (StepBase & { kind: 'scale'; min: number; max: number; minLabel?: string; maxLabel?: string })
  | (StepBase & { kind: 'number'; unit?: string })
  | (StepBase & { kind: 'text'; multiline?: boolean })
  | (StepBase & { kind: 'consent'; statement: string })

export interface MissionTemplate {
  type: MissionType
  /** Code stable = identifiant. */
  code: string
  /** Titre patient (langage simple, rassurant). */
  title: string
  /** Titre court (cartes pharmacien / catalogue). */
  shortTitle: string
  /** Phrase de réassurance sur l'écran d'accueil. */
  pitch: string
  estimatedMin: number
  /** Couleur d'accent (charte). */
  accent: string
  /** Nom d'icône lucide (résolu côté UI). */
  icon: string
  recurrence: MissionRecurrence
  collaboration: MissionCollaboration
  /** Rémunération Ameli indicative (pilotage groupement). */
  remuneration?: { amountEur: number; label: string }
  /** Critères d'éligibilité lisibles (affichage). */
  eligibility: string[]
  /**
   * Règle d'éligibilité MACHINE, évaluée sur les données NON sensibles déjà
   * connues du domaine engagement (âge calculé depuis la date de naissance,
   * sexe). Le ciblage par traitement (AOD/AVK prescrits…) viendra du connecteur
   * LGO et alimentera `requiresTreatment` côté health — non évalué ici.
   */
  eligibilityRule?: {
    ageMin?: number
    ageMax?: number
    sex?: 'MALE' | 'FEMALE'
    /** Le ciblage fin nécessite la donnée traitement du LGO (V2). */
    requiresTreatment?: boolean
  }
  steps: MissionStep[]
  doneTitle: string
  doneBody: string
}

// ── Cycle de vie d'une mission affectée ───────────────────────────────────
export type MissionState =
  | 'ELIGIBLE'
  | 'PROPOSEE'
  | 'OUVERTE'
  | 'EN_COURS'
  | 'COMPLETEE'
  | 'A_VALIDER'
  | 'VALIDEE'
  | 'FACTUREE'
  | 'A_RENOUVELER'
  | 'EXPIREE'
  | 'REFUSEE'
  | 'ANNULEE'

export const MISSION_STATE_LABELS: Record<MissionState, string> = {
  ELIGIBLE: 'Éligible',
  PROPOSEE: 'Proposée',
  OUVERTE: 'À démarrer',
  EN_COURS: 'En cours',
  COMPLETEE: 'Complétée',
  A_VALIDER: 'À valider',
  VALIDEE: 'Validée',
  FACTUREE: 'Facturée',
  A_RENOUVELER: 'À renouveler',
  EXPIREE: 'Expirée',
  REFUSEE: 'Refusée',
  ANNULEE: 'Annulée',
}

/** États où le PATIENT peut agir (réception / parcours). */
export const PATIENT_ACTIONABLE: MissionState[] = ['PROPOSEE', 'OUVERTE', 'EN_COURS', 'A_RENOUVELER']
/** États où le PHARMACIEN doit agir. */
export const PHARMACIEN_TODO: MissionState[] = ['COMPLETEE', 'A_VALIDER']

// ── Catalogue de missions (contenu original, langage patient) ──────────────

const ENTRETIEN_AOD: MissionTemplate = {
  type: 'ENTRETIEN_AOD',
  code: 'ENTRETIEN_AOD',
  title: 'Un point sur votre traitement anticoagulant',
  shortTitle: 'Entretien AOD',
  pitch: 'Quelques questions simples pour faire le point avec votre pharmacien sur votre anticoagulant. Vous pouvez vous arrêter et reprendre quand vous voulez.',
  estimatedMin: 5,
  accent: '#009dc5',
  icon: 'Droplet',
  recurrence: 'annuelle',
  collaboration: 'mixte',
  remuneration: { amountEur: 50, label: 'Forfait année 1 · ASI' },
  eligibility: ['Anticoagulant oral direct prescrit', '≥ 18 ans'],
  eligibilityRule: { ageMin: 18, requiresTreatment: true },
  steps: [
    { id: 'intro', kind: 'info', prompt: 'Votre anticoagulant aide votre sang à mieux circuler. Faisons le point ensemble, simplement.' },
    {
      id: 'connait_medicament', kind: 'single', required: true,
      prompt: 'Savez-vous à quoi sert votre médicament anticoagulant ?',
      options: ['Oui, tout à fait', 'À peu près', 'Pas vraiment'],
      attention: { values: ['Pas vraiment'], label: 'Compréhension du traitement à renforcer' },
    },
    {
      id: 'oublis', kind: 'single', required: true,
      prompt: 'Vous arrive-t-il d’oublier de prendre votre comprimé ?',
      help: 'Personne n’est parfait — répondez en toute honnêteté, c’est utile à votre pharmacien.',
      options: ['Jamais', 'Parfois', 'Souvent'],
      attention: { values: ['Souvent', 'Parfois'], label: 'Oublis de prise signalés' },
    },
    {
      id: 'saignements', kind: 'single', required: true,
      prompt: 'Avez-vous remarqué des saignements inhabituels récemment ?',
      help: 'Par exemple : gencives, nez, bleus qui apparaissent facilement.',
      options: ['Non', 'Un peu', 'Oui, plusieurs fois'],
      attention: { values: ['Un peu', 'Oui, plusieurs fois'], label: '⚠ Saignements signalés — à évaluer' },
    },
    {
      id: 'automedication', kind: 'boolean', required: true,
      prompt: 'Prenez-vous parfois de l’aspirine ou de l’ibuprofène sans avis médical ?',
      help: 'Ces médicaments peuvent augmenter le risque de saignement.',
      attention: { isTrue: true, label: '⚠ Automédication AINS/aspirine — risque d’interaction' },
    },
    {
      id: 'confiance', kind: 'scale', required: true, min: 0, max: 10,
      prompt: 'À combien estimez-vous votre confiance dans la gestion de votre traitement ?',
      minLabel: 'Pas du tout', maxLabel: 'Totalement',
      attention: { lte: 5, label: 'Confiance faible dans la gestion du traitement' },
    },
    {
      id: 'question', kind: 'text', multiline: true,
      prompt: 'Une question pour votre pharmacien ? (facultatif)',
      help: 'Écrivez ce que vous voulez, il en tiendra compte.',
    },
    {
      id: 'consent', kind: 'consent', required: true,
      prompt: 'Partage avec votre pharmacien',
      statement: 'J’accepte que mes réponses soient transmises de façon sécurisée à mon pharmacien pour cet entretien.',
    },
  ],
  doneTitle: 'C’est fait, bravo 👏',
  doneBody: 'Vous venez de prendre soin de votre santé. Votre pharmacien a reçu vos réponses et vous recontactera si besoin.',
}

const OBSERVANCE: MissionTemplate = {
  type: 'OBSERVANCE',
  code: 'OBSERVANCE',
  title: 'Comment se passe votre traitement au quotidien ?',
  shortTitle: 'Observance',
  pitch: 'Cinq questions courtes pour aider votre pharmacien à faciliter la prise de vos médicaments.',
  estimatedMin: 3,
  accent: '#2bad70',
  icon: 'CalendarCheck',
  recurrence: 'ponctuelle',
  collaboration: 'patient',
  eligibility: ['Traitement chronique'],
  eligibilityRule: { requiresTreatment: true },
  steps: [
    { id: 'intro', kind: 'info', prompt: 'Prendre un traitement tous les jours n’est pas toujours simple. Vos réponses aident votre pharmacien à vous accompagner.' },
    {
      id: 'oubli_hier', kind: 'boolean', required: true,
      prompt: 'Vous est-il arrivé d’oublier une prise hier ou avant-hier ?',
      attention: { isTrue: true, label: 'Oubli récent de prise' },
    },
    {
      id: 'arret_volontaire', kind: 'single', required: true,
      prompt: 'Vous est-il déjà arrivé d’arrêter un médicament parce que vous vous sentiez mieux ?',
      options: ['Jamais', 'Une fois', 'Plusieurs fois'],
      attention: { values: ['Plusieurs fois'], label: 'Arrêts volontaires répétés' },
    },
    {
      id: 'effets', kind: 'boolean', required: true,
      prompt: 'Un médicament vous gêne-t-il (effet désagréable) ?',
      attention: { isTrue: true, label: 'Effet indésirable ressenti' },
    },
    {
      id: 'organisation', kind: 'single', required: true,
      prompt: 'Comment vous organisez-vous pour ne pas oublier ?',
      options: ['Pilulier', 'Alarme / téléphone', 'De mémoire', 'Je n’ai pas de méthode'],
      attention: { values: ['De mémoire', 'Je n’ai pas de méthode'], label: 'Aide à l’organisation des prises à proposer' },
    },
  ],
  doneTitle: 'Merci 🙏',
  doneBody: 'Votre pharmacien va regarder vos réponses et pourra vous proposer des astuces simples.',
}

const VACCINATION: MissionTemplate = {
  type: 'VACCINATION',
  code: 'VACCINATION_GRIPPE',
  title: 'Êtes-vous protégé contre la grippe cette année ?',
  shortTitle: 'Vaccination grippe',
  pitch: 'Deux minutes pour faire le point sur votre vaccination. Votre pharmacien peut vous vacciner sur place.',
  estimatedMin: 2,
  accent: '#e8902b',
  icon: 'Syringe',
  recurrence: 'saisonniere',
  collaboration: 'patient',
  remuneration: { amountEur: 9.6, label: 'Acte de vaccination' },
  eligibility: ['Public éligible (65+, pathologies chroniques, entourage…)'],
  eligibilityRule: { ageMin: 65 },
  steps: [
    { id: 'intro', kind: 'info', prompt: 'La grippe peut être sérieuse. Le vaccin est gratuit pour de nombreuses personnes, et votre pharmacien peut le faire.' },
    {
      id: 'deja_vaccine', kind: 'single', required: true,
      prompt: 'Êtes-vous déjà vacciné contre la grippe cette saison ?',
      options: ['Oui', 'Non', 'Je ne sais pas'],
    },
    {
      id: 'frein', kind: 'single', required: true,
      prompt: 'Qu’est-ce qui vous retient le plus ?',
      options: ['Rien, je veux le faire', 'J’oublie / pas le temps', 'J’hésite', 'Je ne pense pas en avoir besoin'],
      attention: { values: ['J’hésite', 'Je ne pense pas en avoir besoin'], label: 'Hésitation vaccinale — information à apporter' },
    },
    {
      id: 'rdv', kind: 'single', required: true,
      prompt: 'Souhaitez-vous être vacciné par votre pharmacien ?',
      options: ['Oui, prenons rendez-vous', 'Oui, je passerai en officine', 'Pas pour le moment'],
      attention: { values: ['Oui, prenons rendez-vous'], label: 'Demande de RDV vaccination' },
    },
  ],
  doneTitle: 'Parfait 💙',
  doneBody: 'Votre pharmacien a vos réponses. Si vous le souhaitez, il vous proposera un créneau pour la vaccination.',
}

const SUIVI_POST_DELIVRANCE: MissionTemplate = {
  type: 'SUIVI_POST_DELIVRANCE',
  code: 'SUIVI_POST_DELIVRANCE',
  title: 'Comment se passe votre nouveau traitement ?',
  shortTitle: 'Suivi nouveau traitement',
  pitch: 'Vous avez commencé un nouveau médicament récemment. Quelques questions pour vérifier que tout va bien.',
  estimatedMin: 3,
  accent: '#37bac9',
  icon: 'PackageCheck',
  recurrence: 'evenement',
  collaboration: 'patient',
  eligibility: ['Nouvelle délivrance (primo-prescription)'],
  eligibilityRule: { requiresTreatment: true },
  steps: [
    { id: 'intro', kind: 'info', prompt: 'Les premiers jours d’un nouveau traitement sont importants. Dites-nous comment ça se passe.' },
    {
      id: 'commence', kind: 'boolean', required: true,
      prompt: 'Avez-vous bien commencé le traitement ?',
      attention: { isTrue: false, label: 'Traitement non démarré' },
    },
    {
      id: 'posologie_claire', kind: 'single', required: true,
      prompt: 'La façon de prendre le médicament est-elle claire pour vous ?',
      options: ['Très claire', 'À peu près', 'Pas claire'],
      attention: { values: ['Pas claire'], label: 'Posologie mal comprise' },
    },
    {
      id: 'effet_ressenti', kind: 'single', required: true,
      prompt: 'Avez-vous ressenti un effet désagréable depuis le début ?',
      options: ['Non, tout va bien', 'Un petit peu', 'Oui, ça me gêne'],
      attention: { values: ['Oui, ça me gêne'], label: '⚠ Effet indésirable précoce signalé' },
    },
    {
      id: 'question', kind: 'text', multiline: true,
      prompt: 'Une question sur ce traitement ? (facultatif)',
    },
  ],
  doneTitle: 'Merci d’avoir pris le temps 🙌',
  doneBody: 'Votre pharmacien suit votre nouveau traitement. Il reviendra vers vous si un point mérite attention.',
}

// Variantes / cas d'usage complémentaires (jouables, contenu allégé).
const ENTRETIEN_AVK: MissionTemplate = {
  ...ENTRETIEN_AOD,
  type: 'ENTRETIEN_AVK',
  code: 'ENTRETIEN_AVK',
  title: 'Un point sur votre traitement par AVK',
  shortTitle: 'Entretien AVK',
  icon: 'Droplets',
  eligibility: ['Antivitamine K prescrit', '≥ 18 ans'],
  eligibilityRule: { ageMin: 18, requiresTreatment: true },
  steps: [
    { id: 'intro', kind: 'info', prompt: 'Votre traitement AVK demande un suivi régulier (INR). Faisons le point simplement.' },
    {
      id: 'inr', kind: 'single', required: true,
      prompt: 'Faites-vous vos prises de sang (INR) comme prévu ?',
      options: ['Toujours', 'Parfois j’oublie', 'Rarement'],
      attention: { values: ['Parfois j’oublie', 'Rarement'], label: 'Suivi INR irrégulier' },
    },
    {
      id: 'oublis', kind: 'single', required: true,
      prompt: 'Vous arrive-t-il d’oublier une prise ?',
      options: ['Jamais', 'Parfois', 'Souvent'],
      attention: { values: ['Souvent', 'Parfois'], label: 'Oublis de prise signalés' },
    },
    {
      id: 'saignements', kind: 'single', required: true,
      prompt: 'Avez-vous remarqué des saignements inhabituels ?',
      options: ['Non', 'Un peu', 'Oui, plusieurs fois'],
      attention: { values: ['Un peu', 'Oui, plusieurs fois'], label: '⚠ Saignements signalés — à évaluer' },
    },
    {
      id: 'consent', kind: 'consent', required: true,
      prompt: 'Partage avec votre pharmacien',
      statement: 'J’accepte que mes réponses soient transmises de façon sécurisée à mon pharmacien.',
    },
  ],
}

const ENTRETIEN_ASTHME: MissionTemplate = {
  type: 'ENTRETIEN_ASTHME',
  code: 'ENTRETIEN_ASTHME',
  title: 'Votre asthme est-il bien contrôlé ?',
  shortTitle: 'Entretien asthme',
  pitch: 'Quelques questions sur votre respiration et vos inhalateurs des 4 dernières semaines.',
  estimatedMin: 4,
  accent: '#0bb3b0',
  icon: 'Wind',
  recurrence: 'annuelle',
  collaboration: 'mixte',
  remuneration: { amountEur: 50, label: 'Forfait année 1 · ASI' },
  eligibility: ['Corticoïde inhalé prescrit'],
  eligibilityRule: { requiresTreatment: true },
  steps: [
    { id: 'intro', kind: 'info', prompt: 'Bien utiliser ses inhalateurs change tout. Faisons le point sur ces 4 dernières semaines.' },
    {
      id: 'symptomes_jour', kind: 'single', required: true,
      prompt: 'Avez-vous été gêné pour respirer en journée ?',
      options: ['Jamais', '1-2 fois / semaine', 'Plusieurs fois / semaine', 'Tous les jours'],
      attention: { values: ['Plusieurs fois / semaine', 'Tous les jours'], label: 'Asthme insuffisamment contrôlé (jour)' },
    },
    {
      id: 'reveils', kind: 'single', required: true,
      prompt: 'Vous êtes-vous réveillé la nuit à cause de votre asthme ?',
      options: ['Jamais', 'Parfois', 'Souvent'],
      attention: { values: ['Souvent'], label: 'Réveils nocturnes fréquents' },
    },
    {
      id: 'secours', kind: 'single', required: true,
      prompt: 'À quelle fréquence utilisez-vous votre inhalateur de secours (bleu) ?',
      options: ['Jamais', 'Moins d’une fois / semaine', 'Plusieurs fois / semaine', 'Tous les jours'],
      attention: { values: ['Plusieurs fois / semaine', 'Tous les jours'], label: 'Recours fréquent au traitement de secours' },
    },
    {
      id: 'technique', kind: 'boolean', required: true,
      prompt: 'Êtes-vous sûr de bien utiliser votre inhalateur ?',
      attention: { isTrue: false, label: 'Technique d’inhalation à revoir' },
    },
  ],
  doneTitle: 'Merci 💨',
  doneBody: 'Votre pharmacien va regarder vos réponses et pourra revoir avec vous la technique d’inhalation si besoin.',
}

const BPM: MissionTemplate = {
  type: 'BPM',
  code: 'BPM',
  title: 'Le point sur l’ensemble de vos médicaments',
  shortTitle: 'Bilan de médication',
  pitch: 'Vous prenez plusieurs médicaments. Ce bilan aide votre pharmacien à tout coordonner pour vous simplifier la vie.',
  estimatedMin: 6,
  accent: '#7c6cdb',
  icon: 'ClipboardList',
  recurrence: 'annuelle',
  collaboration: 'mixte',
  remuneration: { amountEur: 65, label: 'Forfait année 1 · BMI' },
  eligibility: ['≥ 65 ans', '≥ 5 médicaments chroniques'],
  eligibilityRule: { ageMin: 65, requiresTreatment: true },
  steps: [
    { id: 'intro', kind: 'info', prompt: 'Quand on prend beaucoup de médicaments, il est normal de s’y perdre. Ce bilan est là pour vous aider.' },
    {
      id: 'nombre', kind: 'number', unit: 'médicaments', required: true,
      prompt: 'Combien de médicaments différents prenez-vous chaque jour, environ ?',
      attention: { gte: 8, label: 'Polymédication importante (≥8)' },
    },
    {
      id: 'difficulte', kind: 'single', required: true,
      prompt: 'Avez-vous parfois du mal à suivre tous vos médicaments ?',
      options: ['Non, ça va', 'Un peu', 'Oui, souvent'],
      attention: { values: ['Oui, souvent'], label: 'Difficulté de gestion de la polymédication' },
    },
    {
      id: 'chutes', kind: 'boolean', required: true,
      prompt: 'Avez-vous fait une chute ou eu des vertiges ces derniers mois ?',
      attention: { isTrue: true, label: '⚠ Chutes/vertiges — revoir les traitements à risque' },
    },
    {
      id: 'auto_arret', kind: 'boolean', required: true,
      prompt: 'Avez-vous arrêté un médicament de vous-même récemment ?',
      attention: { isTrue: true, label: 'Arrêt volontaire de traitement' },
    },
  ],
  doneTitle: 'Merci beaucoup 🙏',
  doneBody: 'Votre pharmacien préparera votre bilan et vous proposera un moment d’échange pour tout revoir ensemble.',
}

const DEPISTAGE: MissionTemplate = {
  type: 'DEPISTAGE',
  code: 'DEPISTAGE_CCR',
  title: 'Et si on parlait dépistage ?',
  shortTitle: 'Dépistage',
  pitch: 'Un dépistage simple peut sauver des vies. Voyons si cela vous concerne.',
  estimatedMin: 2,
  accent: '#afca0b',
  icon: 'ScanLine',
  recurrence: 'ponctuelle',
  collaboration: 'patient',
  eligibility: ['Tranche d’âge cible du dépistage'],
  eligibilityRule: { ageMin: 50, ageMax: 74 },
  steps: [
    { id: 'intro', kind: 'info', prompt: 'Le dépistage permet de détecter tôt, quand on peut mieux soigner. Trois questions suffisent.' },
    {
      id: 'concerne', kind: 'single', required: true,
      prompt: 'Avez-vous déjà réalisé un dépistage récemment ?',
      options: ['Oui, récemment', 'Il y a longtemps', 'Jamais'],
      attention: { values: ['Il y a longtemps', 'Jamais'], label: 'Dépistage à proposer' },
    },
    {
      id: 'info', kind: 'single', required: true,
      prompt: 'Souhaitez-vous en savoir plus auprès de votre pharmacien ?',
      options: ['Oui', 'Peut-être plus tard', 'Non merci'],
      attention: { values: ['Oui'], label: 'Demande d’information dépistage' },
    },
  ],
  doneTitle: 'Merci 💙',
  doneBody: 'Votre pharmacien pourra vous orienter et vous remettre le nécessaire si cela vous concerne.',
}

const PREVENTION_SAISON: MissionTemplate = {
  type: 'PREVENTION_SAISON',
  code: 'PREVENTION_SAISON',
  title: 'Préparez la saison en forme',
  shortTitle: 'Prévention saisonnière',
  pitch: 'Un petit point de prévention adapté à la saison. Rapide et utile.',
  estimatedMin: 2,
  accent: '#37bac9',
  icon: 'Leaf',
  recurrence: 'saisonniere',
  collaboration: 'patient',
  eligibility: ['Tout patient (selon marronnier)'],
  steps: [
    { id: 'intro', kind: 'info', prompt: 'Chaque saison a ses petits réflexes santé. Voyons ensemble ce qui peut vous aider.' },
    {
      id: 'theme', kind: 'multi', required: true,
      prompt: 'Quels sujets vous intéressent en ce moment ?',
      options: ['Sommeil', 'Allergies', 'Soleil & peau', 'Fatigue', 'Alimentation'],
    },
    {
      id: 'conseil', kind: 'single', required: true,
      prompt: 'Souhaitez-vous un conseil personnalisé de votre pharmacien ?',
      options: ['Oui, volontiers', 'Non merci'],
      attention: { values: ['Oui, volontiers'], label: 'Demande de conseil prévention' },
    },
  ],
  doneTitle: 'À très vite 🌿',
  doneBody: 'Votre pharmacien a vos centres d’intérêt et pourra vous donner des conseils adaptés.',
}

export const MISSION_TEMPLATES: MissionTemplate[] = [
  ENTRETIEN_AOD,
  ENTRETIEN_AVK,
  ENTRETIEN_ASTHME,
  BPM,
  OBSERVANCE,
  VACCINATION,
  DEPISTAGE,
  PREVENTION_SAISON,
  SUIVI_POST_DELIVRANCE,
]

export function getMissionTemplate(code: string): MissionTemplate | undefined {
  return MISSION_TEMPLATES.find((t) => t.code === code)
}

/** Étapes nécessitant une réponse patient (hors info). */
export function missionInputSteps(t: MissionTemplate): MissionStep[] {
  return t.steps.filter((s) => s.kind !== 'info')
}

/** Une réponse est-elle « remplie » ? */
export function isAnswered(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  return true
}

/** Nombre d'étapes répondues (pour la barre de progression). */
export function answeredCount(t: MissionTemplate, answers: Record<string, unknown>): number {
  return missionInputSteps(t).filter((s) => isAnswered(answers[s.id])).length
}

/** Toutes les étapes requises sont-elles remplies ? */
export function isMissionComplete(t: MissionTemplate, answers: Record<string, unknown>): boolean {
  return t.steps
    .filter((s) => s.kind !== 'info' && s.required)
    .every((s) => isAnswered(answers[s.id]))
}

/**
 * Moteur de « points d'attention » : règles déterministes qui surlignent au
 * pharmacien ce qui mérite discussion (préfigure l'IA copilote en V3).
 */
export function computeAttentionPoints(
  t: MissionTemplate,
  answers: Record<string, unknown>,
): string[] {
  const out: string[] = []
  for (const step of t.steps) {
    const rule = (step as StepBase).attention
    if (!rule) continue
    const v = answers[step.id]
    let hit = false
    if (rule.values && typeof v === 'string') hit = rule.values.includes(v)
    if (rule.values && Array.isArray(v)) hit = v.some((x) => rule.values!.includes(String(x)))
    if (rule.isTrue !== undefined && typeof v === 'boolean') hit = v === rule.isTrue
    if (typeof v === 'number') {
      if (rule.gte !== undefined && v >= rule.gte) hit = true
      if (rule.lte !== undefined && v <= rule.lte) hit = true
    }
    if (hit) out.push(rule.label)
  }
  return out
}

/**
 * Personnalisation d'une mission par le groupement (stockée dans
 * MissionActivation.config — non sensible). Pilote le message patient, la
 * cadence de relance et le canal par défaut, sans toucher au code.
 */
export interface MissionConfig {
  /** Message affiché/poussé au patient à la proposition (sinon défaut générique). */
  patientMessage?: string
  /** Délai conseillé avant relance (jours). */
  relanceDays?: number
  /** Canal par défaut : PUSH | SMS | QR | TABLET. */
  channel?: string
}

// ── Moteur d'éligibilité (données NON sensibles : âge, sexe) ───────────────

/** Âge en années révolues à `now`, ou null si date de naissance inconnue. */
export function computeAge(birthDate: Date | string | null | undefined, now: Date): number | null {
  if (!birthDate) return null
  const b = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  if (Number.isNaN(b.getTime())) return null
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1
  return age
}

export interface EligibilityContext {
  age: number | null
  sex: string | null
}

/**
 * Résultat d'évaluation : `eligible` = match sur les critères calculables ;
 * `needsLgo` = un critère traitement reste à confirmer côté LGO (le patient est
 * un candidat « probable », à valider par le pharmacien).
 */
export interface EligibilityVerdict {
  eligible: boolean
  needsLgo: boolean
  reasons: string[]
}

/** Évalue la règle machine d'un template sur un contexte patient. */
export function evaluateEligibility(
  t: MissionTemplate,
  ctx: EligibilityContext,
): EligibilityVerdict {
  const rule = t.eligibilityRule
  // Pas de règle = mission ouverte à tous (ex. prévention saisonnière).
  if (!rule) return { eligible: true, needsLgo: false, reasons: ['Tout patient'] }

  const reasons: string[] = []
  let eligible = true

  if (rule.ageMin !== undefined || rule.ageMax !== undefined) {
    if (ctx.age === null) {
      // Âge inconnu → on ne peut pas confirmer, on n'exclut pas brutalement.
      eligible = false
      reasons.push('Âge inconnu')
    } else {
      if (rule.ageMin !== undefined && ctx.age < rule.ageMin) {
        eligible = false
        reasons.push(`Âge < ${rule.ageMin} ans`)
      }
      if (rule.ageMax !== undefined && ctx.age > rule.ageMax) {
        eligible = false
        reasons.push(`Âge > ${rule.ageMax} ans`)
      }
      if (eligible) reasons.push(`${ctx.age} ans`)
    }
  }

  if (rule.sex && ctx.sex && rule.sex !== ctx.sex) {
    eligible = false
    reasons.push('Sexe non ciblé')
  }

  return { eligible, needsLgo: Boolean(rule.requiresTreatment), reasons }
}
