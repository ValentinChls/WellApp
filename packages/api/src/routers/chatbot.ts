import { z } from 'zod'
import { engagementDb } from '@wellpharma/db'
import {
  CHATBOT_DISCLAIMER,
  CHATBOT_NO_PHARMACY,
  CHATBOT_REDIRECTION,
  classifyChatbotIntent,
  isHealthQuestion,
  localChatbotAnswer,
  type ChatbotPharmacy,
  type OpeningHours,
  type ServiceCode,
} from '@wellpharma/shared'
import { router, patientProcedure } from '../trpc'
import { chatbotLlmAnswer, isChatbotLlmConfigured } from '../lib/chatbot'

/** Base de connaissance : pharmacie de référence du patient (ou fournie). */
async function loadPharmacy(
  patientId: string | null,
  pharmacyId?: string,
): Promise<{ id: string; kb: ChatbotPharmacy } | null> {
  let id = pharmacyId
  if (!id && patientId) {
    const aff = await engagementDb.affiliation.findFirst({
      where: { patientId, type: 'REFERENCE' },
      select: { pharmacyId: true },
    })
    id = aff?.pharmacyId
  }
  if (!id) return null
  const p = await engagementDb.pharmacy.findUnique({ where: { id } })
  if (!p) return null
  return {
    id: p.id,
    kb: {
      name: p.name,
      city: p.city ?? '',
      addressLine: p.addressLine ?? undefined,
      postalCode: p.postalCode ?? undefined,
      phone: p.phone ?? undefined,
      services: (p.services as ServiceCode[]) ?? [],
      openingHours: (p.openingHours as OpeningHours | null) ?? {},
    },
  }
}

/**
 * Chatbot patient STRICTEMENT non-santé.
 * Garde-fous en dur : (a) question santé → redirection avant tout LLM ;
 * (b) filtre de SORTIE déterministe — si la réponse LLM paraît médicale, on
 * redirige ; (c) journal d'audit MÉTADONNÉES UNIQUEMENT (jamais le texte libre).
 */
export const chatbotRouter = router({
  ask: patientProcedure
    .input(z.object({ message: z.string().min(1).max(500), pharmacyId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const message = input.message.trim()
      const resolved = await loadPharmacy(ctx.user.patientId ?? null, input.pharmacyId)
      const pharmacyIdForLog = resolved?.id ?? input.pharmacyId ?? null

      const log = (redirected: boolean) =>
        engagementDb.chatLog.create({
          data: {
            userId: ctx.user.id,
            pharmacyId: pharmacyIdForLog,
            redirected,
            // métadonnée non sensible uniquement ; rien sur le chemin redirigé
            intent: redirected ? null : classifyChatbotIntent(message),
          },
        })

      // (a) Garde-fou entrée : santé → redirection, aucun appel LLM.
      if (isHealthQuestion(message)) {
        await log(true)
        return { kind: 'redirect' as const, text: CHATBOT_REDIRECTION, disclaimer: CHATBOT_DISCLAIMER }
      }

      const now = new Date()
      let text: string
      let redirected = false

      if (!resolved) {
        text = CHATBOT_NO_PHARMACY
      } else if (isChatbotLlmConfigured()) {
        try {
          const llm = await chatbotLlmAnswer(message, resolved.kb, now)
          // (b) Filtre de sortie déterministe : repli sur redirection si la
          // réponse contient des marqueurs santé (défense en profondeur).
          if (isHealthQuestion(llm)) {
            text = CHATBOT_REDIRECTION
            redirected = true
          } else {
            text = llm
          }
        } catch (err) {
          console.error('[chatbot] échec LLM, repli local', err)
          text = localChatbotAnswer(message, resolved.kb, now)
        }
      } else {
        text = localChatbotAnswer(message, resolved.kb, now)
      }

      await log(redirected)
      return {
        kind: redirected ? ('redirect' as const) : ('answer' as const),
        text,
        disclaimer: CHATBOT_DISCLAIMER,
      }
    }),
})
