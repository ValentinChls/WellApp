/**
 * Couche d'accès « chatbot non-santé ».
 * DÉMO : garde-fous + réponse déterministe locale (sur la pharmacie de référence).
 * RÉEL : tRPC (pré-filtre santé + LLM verrouillé côté serveur).
 */
import {
  CHATBOT_DISCLAIMER,
  CHATBOT_NO_PHARMACY,
  CHATBOT_REDIRECTION,
  isHealthQuestion,
  localChatbotAnswer,
  type ChatbotPharmacy,
} from '@wellpharma/shared'
import { isDemoEnabled } from '../lib/demo'
import { trpc } from '../lib/trpcVanilla'
import { getPharmacy, listAffiliations } from './pharmacyService'

export interface ChatbotReply {
  kind: 'answer' | 'redirect'
  text: string
  disclaimer: string
}

async function referencePharmacyId(): Promise<string | undefined> {
  const affs = await listAffiliations()
  return affs.find((a) => a.type === 'REFERENCE')?.pharmacyId
}

export async function askChatbot(message: string): Promise<ChatbotReply> {
  if (isDemoEnabled()) {
    if (isHealthQuestion(message)) {
      return { kind: 'redirect', text: CHATBOT_REDIRECTION, disclaimer: CHATBOT_DISCLAIMER }
    }
    const refId = await referencePharmacyId()
    const pharmacy = refId ? await getPharmacy(refId) : null
    if (!pharmacy) {
      return { kind: 'answer', text: CHATBOT_NO_PHARMACY, disclaimer: CHATBOT_DISCLAIMER }
    }
    const kb: ChatbotPharmacy = {
      name: pharmacy.name,
      city: pharmacy.city,
      addressLine: pharmacy.addressLine,
      postalCode: pharmacy.postalCode,
      phone: pharmacy.phone,
      services: pharmacy.services,
      openingHours: pharmacy.openingHours,
    }
    return {
      kind: 'answer',
      text: localChatbotAnswer(message, kb, new Date()),
      disclaimer: CHATBOT_DISCLAIMER,
    }
  }

  const refId = await referencePharmacyId()
  return trpc.chatbot.ask.mutate({ message, pharmacyId: refId })
}
