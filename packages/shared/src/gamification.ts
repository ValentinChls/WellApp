/**
 * Gamification & prévention — contenu DÉCLARATIF, non sensible (engagement).
 * Connaissances générales de prévention : aucune donnée de santé personnelle.
 * Partagé seed + PWA (démo) + API.
 */

export type PreventionTheme =
  | 'VACCINATION'
  | 'PREVENTION'
  | 'BON_USAGE'
  | 'NUTRITION'
  | 'URGENCE'

export const PREVENTION_THEME_LABELS: Record<PreventionTheme, string> = {
  VACCINATION: 'Vaccination',
  PREVENTION: 'Prévention',
  BON_USAGE: 'Bon usage du médicament',
  NUTRITION: 'Alimentation',
  URGENCE: 'Gestes qui sauvent',
}

/** Couleur d'accent par thème (utilisée par les cartes de quiz). */
export const PREVENTION_THEME_COLORS: Record<PreventionTheme, string> = {
  VACCINATION: '#009dc5',
  PREVENTION: '#2bad70',
  BON_USAGE: '#7c6cdb',
  NUTRITION: '#e8902b',
  URGENCE: '#d8542f',
}

export interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface Quiz {
  id: string
  title: string
  theme: PreventionTheme
  description: string
  questions: QuizQuestion[]
  ctaLabel?: string
  ctaTo?: string
}

export const POINTS_PER_CORRECT = 10

export const QUIZZES: Quiz[] = [
  {
    id: 'vaccins-grippe',
    title: 'Vaccination grippe',
    theme: 'VACCINATION',
    description: 'Tout sur la vaccination antigrippale saisonnière.',
    ctaLabel: 'Prendre rendez-vous',
    ctaTo: '/rendez-vous',
    questions: [
      {
        id: 'q1',
        prompt: 'À quelle période débute la campagne de vaccination antigrippale ?',
        options: ['Au printemps', 'À l’automne', 'En plein été'],
        correctIndex: 1,
        explanation: 'La campagne démarre à l’automne, avant que le virus ne circule.',
      },
      {
        id: 'q2',
        prompt: 'Le pharmacien peut-il vacciner contre la grippe ?',
        options: ['Oui, s’il est formé', 'Non, jamais'],
        correctIndex: 0,
        explanation: 'Les pharmaciens formés peuvent vacciner directement en officine.',
      },
      {
        id: 'q3',
        prompt: 'Qui est prioritaire pour la vaccination ?',
        options: ['Les sportifs', 'Les 65 ans et plus et personnes fragiles', 'Personne en particulier'],
        correctIndex: 1,
        explanation: 'Les 65 ans et plus et les personnes à risque sont prioritaires.',
      },
      {
        id: 'q4',
        prompt: 'Combien de temps faut-il pour être protégé après l’injection ?',
        options: ['Immédiatement', 'Environ deux semaines', 'Plusieurs mois'],
        correctIndex: 1,
        explanation: 'La protection s’installe en une dizaine à une quinzaine de jours.',
      },
    ],
  },
  {
    id: 'vaccination-generale',
    title: 'Mes vaccins à jour',
    theme: 'VACCINATION',
    description: 'Calendrier vaccinal et rappels tout au long de la vie.',
    questions: [
      {
        id: 'q1',
        prompt: 'Le vaccin contre le tétanos nécessite…',
        options: ['Une seule injection à vie', 'Des rappels réguliers', 'Aucun rappel'],
        correctIndex: 1,
        explanation: 'Des rappels sont prévus à âges fixes tout au long de la vie.',
      },
      {
        id: 'q2',
        prompt: 'Où retrouver l’historique de ses vaccins ?',
        options: ['Carnet de vaccination / espace santé', 'Nulle part', 'Sur l’ordonnance'],
        correctIndex: 0,
        explanation: 'Le carnet (papier ou numérique) centralise vos vaccinations.',
      },
      {
        id: 'q3',
        prompt: 'La vaccination protège…',
        options: ['Soi uniquement', 'Soi et son entourage', 'Personne'],
        correctIndex: 1,
        explanation: 'Se vacciner protège aussi les proches plus fragiles (effet collectif).',
      },
      {
        id: 'q4',
        prompt: 'Un rappel oublié depuis longtemps…',
        options: ['Oblige à tout recommencer', 'Peut être rattrapé sans tout reprendre', 'Est inutile'],
        correctIndex: 1,
        explanation: 'On reprend là où on en était : pas besoin de tout recommencer.',
      },
    ],
  },
  {
    id: 'antibiotiques',
    title: 'Antibiotiques, bon usage',
    theme: 'BON_USAGE',
    description: 'Les antibiotiques, c’est pas automatique.',
    questions: [
      {
        id: 'q1',
        prompt: 'Les antibiotiques agissent contre…',
        options: ['Les virus', 'Les bactéries', 'Les deux'],
        correctIndex: 1,
        explanation: 'Ils agissent sur les bactéries, pas sur les virus (grippe, rhume…).',
      },
      {
        id: 'q2',
        prompt: 'Que faire des antibiotiques non utilisés ?',
        options: ['Les jeter', 'Les rapporter à la pharmacie', 'Les garder pour plus tard'],
        correctIndex: 1,
        explanation: 'On les rapporte en pharmacie (filière Cyclamed) ; jamais de réutilisation seul.',
      },
      {
        id: 'q3',
        prompt: 'Faut-il arrêter dès qu’on se sent mieux ?',
        options: ['Oui', 'Non, suivre la durée prescrite'],
        correctIndex: 1,
        explanation: 'On respecte la durée prescrite pour éviter les résistances.',
      },
      {
        id: 'q4',
        prompt: 'Peut-on prendre l’antibiotique d’un proche ?',
        options: ['Oui si mêmes symptômes', 'Non, jamais'],
        correctIndex: 1,
        explanation: 'Un antibiotique est personnel et adapté à une situation précise.',
      },
    ],
  },
  {
    id: 'bon-usage-medicaments',
    title: 'Mon armoire à pharmacie',
    theme: 'BON_USAGE',
    description: 'Conservation, péremption et automédication.',
    questions: [
      {
        id: 'q1',
        prompt: 'Un médicament périmé…',
        options: ['Se prend sans risque', 'Ne doit pas être utilisé', 'Devient plus efficace'],
        correctIndex: 1,
        explanation: 'Au-delà de la date, l’efficacité et la sécurité ne sont plus garanties.',
      },
      {
        id: 'q2',
        prompt: 'Où conserver la plupart des médicaments ?',
        options: ['Au réfrigérateur', 'À l’abri de la chaleur et de l’humidité', 'Près d’une fenêtre'],
        correctIndex: 1,
        explanation: 'Endroit sec, tempéré et hors de portée des enfants (sauf mention « frigo »).',
      },
      {
        id: 'q3',
        prompt: 'Avant une automédication, le bon réflexe est…',
        options: ['Demander conseil au pharmacien', 'Doubler la dose', 'Mélanger plusieurs produits'],
        correctIndex: 0,
        explanation: 'Le pharmacien vérifie les interactions et la pertinence du produit.',
      },
      {
        id: 'q4',
        prompt: 'Le paracétamol, en cas de doute sur la dose…',
        options: ['On augmente librement', 'On respecte la dose maximale et l’avis du pharmacien'],
        correctIndex: 1,
        explanation: 'Le surdosage est dangereux : on respecte les doses et on demande conseil.',
      },
    ],
  },
  {
    id: 'soleil-peau',
    title: 'Soleil & peau',
    theme: 'PREVENTION',
    description: 'Protéger sa peau toute l’année.',
    questions: [
      {
        id: 'q1',
        prompt: 'Quand appliquer une protection solaire ?',
        options: ['Seulement à la plage', 'Dès une exposition prolongée', 'Jamais'],
        correctIndex: 1,
        explanation: 'Dès une exposition prolongée, même en ville ou en montagne.',
      },
      {
        id: 'q2',
        prompt: 'À quelle fréquence renouveler l’application ?',
        options: ['Une fois suffit', 'Toutes les 2 heures environ', 'Une fois par semaine'],
        correctIndex: 1,
        explanation: 'On renouvelle toutes les 2 heures et après chaque baignade.',
      },
      {
        id: 'q3',
        prompt: 'Les heures les plus à risque sont…',
        options: ['Tôt le matin', 'Entre 12h et 16h', 'En soirée'],
        correctIndex: 1,
        explanation: 'Le rayonnement UV est maximal en milieu de journée.',
      },
      {
        id: 'q4',
        prompt: 'Un grain de beauté qui change d’aspect…',
        options: ['Est sans importance', 'Doit être montré à un professionnel'],
        correctIndex: 1,
        explanation: 'Tout changement (taille, couleur, bords) mérite un avis médical.',
      },
    ],
  },
  {
    id: 'tabac',
    title: 'Arrêter le tabac',
    theme: 'PREVENTION',
    description: 'Idées reçues et leviers d’arrêt.',
    questions: [
      {
        id: 'q1',
        prompt: 'Les bénéfices de l’arrêt commencent…',
        options: ['Après des années', 'Dès les premières heures', 'Jamais'],
        correctIndex: 1,
        explanation: 'Dès 24-48h, le corps commence déjà à récupérer.',
      },
      {
        id: 'q2',
        prompt: 'Le pharmacien peut-il accompagner l’arrêt ?',
        options: ['Oui (substituts, conseils)', 'Non'],
        correctIndex: 0,
        explanation: 'Substituts nicotiniques et suivi sont disponibles en officine.',
      },
      {
        id: 'q3',
        prompt: 'Les substituts nicotiniques…',
        options: ['Sont aussi nocifs que la cigarette', 'Aident à gérer le manque'],
        correctIndex: 1,
        explanation: 'Ils délivrent de la nicotine sans les substances toxiques de la fumée.',
      },
      {
        id: 'q4',
        prompt: 'Une rechute après une tentative d’arrêt…',
        options: ['Signifie un échec définitif', 'Fait partie du parcours, on réessaie'],
        correctIndex: 1,
        explanation: 'Plusieurs tentatives sont souvent nécessaires : on persévère.',
      },
    ],
  },
  {
    id: 'alimentation',
    title: 'Bien manger, bouger',
    theme: 'NUTRITION',
    description: 'Les bases d’une alimentation équilibrée.',
    questions: [
      {
        id: 'q1',
        prompt: 'Combien de fruits et légumes par jour est recommandé ?',
        options: ['Aucun', 'Au moins 5 portions', 'Une seule'],
        correctIndex: 1,
        explanation: 'Au moins 5 portions de fruits et légumes par jour.',
      },
      {
        id: 'q2',
        prompt: 'L’activité physique recommandée chez l’adulte ?',
        options: ['Rien', 'Environ 30 min par jour', 'Seulement le week-end'],
        correctIndex: 1,
        explanation: 'L’équivalent de 30 minutes d’activité modérée par jour.',
      },
      {
        id: 'q3',
        prompt: 'Pour s’hydrater, la meilleure boisson est…',
        options: ['Les sodas', 'L’eau', 'Le café à volonté'],
        correctIndex: 1,
        explanation: 'L’eau est la boisson de référence, sans sucre ajouté.',
      },
      {
        id: 'q4',
        prompt: 'Le sel, il vaut mieux…',
        options: ['En consommer beaucoup', 'En limiter la quantité'],
        correctIndex: 1,
        explanation: 'Un excès de sel favorise l’hypertension : on en limite l’apport.',
      },
    ],
  },
  {
    id: 'gestes-urgence',
    title: 'Les gestes qui sauvent',
    theme: 'URGENCE',
    description: 'Réagir face à une situation d’urgence.',
    questions: [
      {
        id: 'q1',
        prompt: 'Quel numéro pour le SAMU en France ?',
        options: ['15', '12', '112 uniquement'],
        correctIndex: 0,
        explanation: 'Le 15 (SAMU). Le 112 fonctionne aussi partout en Europe.',
      },
      {
        id: 'q2',
        prompt: 'Face à une personne inconsciente qui respire…',
        options: ['On la laisse sur le dos', 'Position latérale de sécurité', 'On la fait asseoir'],
        correctIndex: 1,
        explanation: 'La PLS libère les voies aériennes en attendant les secours.',
      },
      {
        id: 'q3',
        prompt: 'En cas d’arrêt cardiaque, le massage se fait…',
        options: ['Sur le ventre', 'Au centre de la poitrine', 'Sur le bras'],
        correctIndex: 1,
        explanation: 'Compressions fermes au centre du thorax, sans s’arrêter.',
      },
      {
        id: 'q4',
        prompt: 'Un défibrillateur (DAE) peut être utilisé…',
        options: ['Par les secouristes seulement', 'Par tout le monde, il guide la voix'],
        correctIndex: 1,
        explanation: 'Le DAE guide vocalement n’importe quel témoin, pas à pas.',
      },
    ],
  },
]

export function getQuiz(id: string): Quiz | undefined {
  return QUIZZES.find((q) => q.id === id)
}

export function quizMaxPoints(quiz: Quiz): number {
  return quiz.questions.length * POINTS_PER_CORRECT
}

/**
 * Valide une grille de réponses : une réponse par question, chaque index dans
 * les bornes des options. Utilisé côté API ET côté démo (parité).
 */
export function answersAreValid(quiz: Quiz, answers: number[]): boolean {
  if (answers.length !== quiz.questions.length) return false
  return quiz.questions.every((q, i) => {
    const a = answers[i]
    return a !== undefined && a >= 0 && a < q.options.length
  })
}

/** Score déterministe d'une tentative (answers = index choisi par question). */
export function scoreQuiz(
  quiz: Quiz,
  answers: number[],
): { correct: number; total: number; points: number } {
  let correct = 0
  quiz.questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) correct++
  })
  return { correct, total: quiz.questions.length, points: correct * POINTS_PER_CORRECT }
}

// ─────────────────────────────── Niveaux

export interface Level {
  index: number
  label: string
  min: number
}

export const LEVELS: Level[] = [
  { index: 1, label: 'Débutant', min: 0 },
  { index: 2, label: 'Curieux', min: 40 },
  { index: 3, label: 'Averti', min: 100 },
  { index: 4, label: 'Confirmé', min: 180 },
  { index: 5, label: 'Expert', min: 260 },
  { index: 6, label: 'Ambassadeur santé', min: 330 },
]

/** Niveau courant, niveau suivant et progression (0..1) vers le suivant. */
export function levelForPoints(points: number): {
  current: Level
  next: Level | null
  progress: number
} {
  let current = LEVELS[0]!
  for (const l of LEVELS) if (points >= l.min) current = l
  const next = LEVELS.find((l) => l.min > current.min) ?? null
  const progress = next ? Math.min(1, (points - current.min) / (next.min - current.min)) : 1
  return { current, next, progress }
}

// ─────────────────────────────── Badges (critères enrichis)

export interface Badge {
  id: string
  label: string
  emoji: string
  hint: string
}

export const BADGES: Badge[] = [
  { id: 'premier-pas', label: 'Premier pas', emoji: '🌱', hint: 'Terminer un premier quiz' },
  { id: 'curieux', label: 'Curieux', emoji: '🔎', hint: 'Atteindre 60 points' },
  { id: 'sans-faute', label: 'Sans faute', emoji: '🎯', hint: 'Réussir un quiz à 100 %' },
  { id: 'pro-vaccins', label: 'Pro des vaccins', emoji: '💉', hint: 'Terminer tous les quiz vaccination' },
  { id: 'assidu', label: 'Assidu', emoji: '🔥', hint: 'Terminer 4 quiz' },
  { id: 'averti', label: 'Averti', emoji: '🛡️', hint: 'Atteindre 150 points' },
  { id: 'ambassadeur', label: 'Ambassadeur', emoji: '⭐', hint: 'Atteindre 280 points' },
]

export const BADGE_BY_ID = new Map(BADGES.map((b) => [b.id, b]))

/** Une tentative aboutie (meilleur score conservé par quiz). */
export interface QuizRecord {
  quizId: string
  score: number
  total: number
}

/** Badges débloqués à partir des points totaux et des meilleurs résultats par quiz. */
export function earnedBadges(points: number, records: QuizRecord[]): string[] {
  const ids: string[] = []
  const done = new Set(records.map((r) => r.quizId))
  const vaccinIds = QUIZZES.filter((q) => q.theme === 'VACCINATION').map((q) => q.id)

  if (records.length >= 1) ids.push('premier-pas')
  if (points >= 60) ids.push('curieux')
  if (records.some((r) => r.total > 0 && r.score === r.total)) ids.push('sans-faute')
  if (vaccinIds.length > 0 && vaccinIds.every((id) => done.has(id))) ids.push('pro-vaccins')
  if (records.length >= 4) ids.push('assidu')
  if (points >= 150) ids.push('averti')
  if (points >= 280) ids.push('ambassadeur')
  return ids
}

// ─────────────────────────────── Conseils prévention

export interface PreventionTip {
  id: string
  title: string
  body: string
  theme: PreventionTheme
  ctaLabel?: string
  ctaTo?: string
}

export const PREVENTION_TIPS: PreventionTip[] = [
  {
    id: 'tip-vaccins-hiver',
    title: 'Vaccins de l’hiver',
    body: 'Grippe, Covid-19, VRS : faites le point avec votre pharmacien avant la saison froide.',
    theme: 'VACCINATION',
    ctaLabel: 'Prendre rendez-vous',
    ctaTo: '/rendez-vous',
  },
  {
    id: 'tip-armoire',
    title: 'Armoire à pharmacie',
    body: 'Vérifiez les dates de péremption et rapportez vos médicaments non utilisés à l’officine.',
    theme: 'BON_USAGE',
  },
  {
    id: 'tip-bouger',
    title: 'Bouger chaque jour',
    body: '30 minutes d’activité par jour : marche, vélo, escaliers… chaque pas compte.',
    theme: 'NUTRITION',
  },
  {
    id: 'tip-tension',
    title: 'Tension artérielle',
    body: 'Un suivi régulier aide à prévenir les risques cardiovasculaires. Parlez-en en pharmacie.',
    theme: 'PREVENTION',
    ctaLabel: 'Demander un conseil',
    ctaTo: '/conseil',
  },
]
