import { router } from './trpc'
import { authRouter } from './routers/auth'
import { affiliationRouter } from './routers/affiliation'
import { appointmentsRouter } from './routers/appointments'
import { consentRouter } from './routers/consent'
import { engagementRouter } from './routers/engagement'
import { healthRouter } from './routers/health'
import { notificationsRouter } from './routers/notifications'
import { remindersRouter } from './routers/reminders'
import { chatbotRouter } from './routers/chatbot'
import { kpiRouter } from './routers/kpi'
import { campaignsRouter } from './routers/campaigns'
import { promotionsRouter } from './routers/promotions'
import { appointmentTypesRouter } from './routers/appointmentTypes'
import { patientsRouter } from './routers/patients'
import { marronnierRouter } from './routers/marronnier'
import { gamificationRouter } from './routers/gamification'
import { missionsRouter } from './routers/missions'
import { loyaltyRouter } from './routers/loyalty'
import { homeRouter } from './routers/home'

export const appRouter = router({
  auth: authRouter,
  affiliation: affiliationRouter,
  appointments: appointmentsRouter,
  consent: consentRouter,
  engagement: engagementRouter,
  health: healthRouter,
  notifications: notificationsRouter,
  reminders: remindersRouter,
  chatbot: chatbotRouter,
  kpi: kpiRouter,
  campaigns: campaignsRouter,
  promotions: promotionsRouter,
  appointmentTypes: appointmentTypesRouter,
  patients: patientsRouter,
  marronnier: marronnierRouter,
  gamification: gamificationRouter,
  missions: missionsRouter,
  loyalty: loyaltyRouter,
  home: homeRouter,
})

export type AppRouter = typeof appRouter
