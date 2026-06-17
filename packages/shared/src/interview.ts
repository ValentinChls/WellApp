/**
 * Schéma CONFIGURABLE des entretiens pharmaceutiques (formulaires structurés).
 * Partagé serveur + PWA. La STRUCTURE est non sensible ; seules les RÉPONSES
 * du patient sont des données de santé (chiffrées at-rest côté serveur).
 */

export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'radio'

export interface TemplateField {
  id: string
  label: string
  type: FieldType
  options?: string[]
  required?: boolean
  help?: string
}

export interface TemplateSection {
  title: string
  fields: TemplateField[]
}

export interface InterviewTemplate {
  /** Code stable (sert d'identifiant + mappe le type Prisma). */
  code: string
  label: string
  description?: string
  /** Type Prisma (health.InterviewType). */
  prismaType: 'ASTHME' | 'AVK' | 'AOD' | 'ONCOLOGIE' | 'AUTRE'
  sections: TemplateSection[]
}

const GENERIC: InterviewTemplate = {
  code: 'GENERIQUE',
  label: 'Entretien générique',
  description: 'Entretien d’accompagnement standard.',
  prismaType: 'AUTRE',
  sections: [
    {
      title: 'Contexte',
      fields: [
        { id: 'motif', label: 'Motif de l’entretien', type: 'textarea', required: true },
        { id: 'traitement_en_cours', label: 'Traitement(s) en cours', type: 'textarea' },
      ],
    },
    {
      title: 'Observance',
      fields: [
        {
          id: 'observance',
          label: 'Niveau d’observance ressenti',
          type: 'radio',
          options: ['Bonne', 'Variable', 'Difficile'],
          required: true,
        },
        { id: 'effets_indesirables', label: 'Effets indésirables signalés', type: 'textarea' },
        { id: 'difficultes', label: 'Difficultés rencontrées', type: 'textarea' },
      ],
    },
    {
      title: 'Synthèse',
      fields: [
        { id: 'conseils', label: 'Conseils donnés', type: 'textarea' },
        { id: 'suivi', label: 'Suivi à prévoir', type: 'text' },
      ],
    },
  ],
}

const ASTHME: InterviewTemplate = {
  code: 'ASTHME',
  label: 'Entretien asthme',
  description: 'Suivi du contrôle de l’asthme et de la technique d’inhalation.',
  prismaType: 'ASTHME',
  sections: [
    {
      title: 'Contrôle de l’asthme (4 dernières semaines)',
      fields: [
        {
          id: 'symptomes_jour',
          label: 'Symptômes en journée',
          type: 'radio',
          options: ['Jamais', '1-2 / semaine', 'Plusieurs / semaine', 'Quotidiens'],
          required: true,
        },
        {
          id: 'reveils_nocturnes',
          label: 'Réveils nocturnes liés à l’asthme',
          type: 'radio',
          options: ['Jamais', 'Parfois', 'Souvent'],
          required: true,
        },
        {
          id: 'recours_secours',
          label: 'Recours au traitement de secours (bouffées / semaine)',
          type: 'number',
        },
      ],
    },
    {
      title: 'Technique d’inhalation',
      fields: [
        { id: 'dispositif', label: 'Dispositif utilisé', type: 'text' },
        {
          id: 'technique_ok',
          label: 'Technique d’inhalation correcte',
          type: 'boolean',
        },
        { id: 'points_corriges', label: 'Points corrigés', type: 'textarea' },
      ],
    },
    {
      title: 'Plan d’action',
      fields: [
        { id: 'facteurs_declenchants', label: 'Facteurs déclenchants identifiés', type: 'textarea' },
        { id: 'plan_action', label: 'Plan d’action personnalisé remis', type: 'boolean' },
        { id: 'orientation', label: 'Orientation médecin si besoin', type: 'text' },
      ],
    },
  ],
}

export const INTERVIEW_TEMPLATES: InterviewTemplate[] = [GENERIC, ASTHME]

export function getInterviewTemplate(code: string): InterviewTemplate | undefined {
  return INTERVIEW_TEMPLATES.find((t) => t.code === code)
}
