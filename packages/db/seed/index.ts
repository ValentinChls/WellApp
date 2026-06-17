/* eslint-disable no-console */
import {
  DEMO_PHARMACIES,
  MARRONNIER_EVENTS,
  computeAttentionPoints,
  getMissionTemplate,
} from '@wellpharma/shared'
import { engagementDb, healthDb, seal, Engagement } from '../src'

const { Role, Sex, ConsentType, ConsentSource, CareEventCategory, TargetSex } = Engagement

const DEMO_PASSWORD = 'Wellpharma2026!'

/**
 * Provisionne un utilisateur Supabase Auth si les clés sont présentes,
 * sinon retourne un authId placeholder (seed exécutable hors-ligne).
 */
async function provisionAuthUser(email: string, role: string): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.warn(`  ⚠️  Supabase non configuré → authId placeholder pour ${email}`)
    return `demo-${role.toLowerCase()}`
  }
  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  const created = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { role },
  })
  if (created.data.user) return created.data.user.id

  // Existe déjà : on le retrouve via la liste.
  const list = await admin.auth.admin.listUsers()
  const found = list.data.users.find((u) => u.email === email)
  if (!found) throw new Error(`Impossible de provisionner ${email}: ${created.error?.message}`)
  return found.id
}

async function main() {
  console.log('🌱 Seed Wellpharma…')

  // 1) Groupement
  const groupement = await engagementDb.groupement.upsert({
    where: { slug: 'wellpharma' },
    update: {},
    create: { name: 'Groupement Wellpharma', slug: 'wellpharma' },
  })

  // 2) Pharmacies (15 officines fictives du groupement — @wellpharma/shared)
  const pharmacies = []
  for (const p of DEMO_PHARMACIES) {
    const data = {
      name: p.name,
      addressLine: p.addressLine,
      postalCode: p.postalCode,
      city: p.city,
      latitude: p.latitude,
      longitude: p.longitude,
      phone: p.phone,
      services: p.services,
      openingHours: p.openingHours as Engagement.Prisma.InputJsonValue,
    }
    pharmacies.push(
      await engagementDb.pharmacy.upsert({
        where: { cip: p.cip },
        update: data,
        create: { cip: p.cip, country: 'FR', groupementId: groupement.id, ...data },
      }),
    )
  }
  const refPharmacy = pharmacies[0]!

  // 2b) Types d'actes + créneaux (config RDV — domaine engagement)
  const SLOT_HOURS = [9, 10, 11, 14, 15, 16]
  const ACTS = [
    { code: 'VACCINATION', label: 'Vaccination', durationMin: 15 },
    { code: 'ENTRETIEN', label: 'Entretien pharmaceutique', durationMin: 30 },
    { code: 'BPM', label: 'Bilan partagé de médication', durationMin: 45 },
    { code: 'TROD', label: 'TROD (test rapide)', durationMin: 15 },
  ]
  for (const pharmacy of pharmacies) {
    for (const act of ACTS) {
      const type = await engagementDb.appointmentType.upsert({
        where: { pharmacyId_code: { pharmacyId: pharmacy.id, code: act.code } },
        update: { label: act.label, durationMin: act.durationMin },
        create: {
          pharmacyId: pharmacy.id,
          code: act.code,
          label: act.label,
          durationMin: act.durationMin,
        },
      })
      const slotCount = await engagementDb.appointmentSlot.count({
        where: { appointmentTypeId: type.id },
      })
      if (slotCount === 0) {
        const data: Array<{ pharmacyId: string; appointmentTypeId: string; startsAt: Date }> = []
        const now = new Date()
        for (let d = 1; d <= 7; d += 1) {
          const day = new Date(now)
          day.setDate(day.getDate() + d)
          if (day.getDay() === 0) continue
          for (const h of SLOT_HOURS) {
            const startsAt = new Date(day)
            startsAt.setHours(h, 0, 0, 0)
            data.push({ pharmacyId: pharmacy.id, appointmentTypeId: type.id, startsAt })
          }
        }
        await engagementDb.appointmentSlot.createMany({ data })
      }
    }
  }

  // 3) Comptes démo (3 rôles)
  async function ensureUser(email: string, role: keyof typeof Role, extra: Record<string, unknown>) {
    const existing = await engagementDb.user.findUnique({ where: { email } })
    if (existing) return existing
    const authId = await provisionAuthUser(email, role)
    return engagementDb.user.create({ data: { email, authId, role: Role[role], ...extra } })
  }

  await ensureUser('valentin.charles@equasens.com', 'SUPER_ADMIN_GROUPEMENT', {
    fullName: 'Valentin Charles',
  })
  await ensureUser('admin.pharmacie@wellpharma.test', 'ADMIN_PHARMACIE', {
    fullName: 'Admin Officine',
    pharmacyId: refPharmacy.id,
  })

  // Patient (profil + affiliation + consentements)
  const existingPatientUser = await engagementDb.user.findUnique({
    where: { email: 'patient.demo@wellpharma.test' },
  })
  if (!existingPatientUser) {
    const patient = await engagementDb.patient.create({
      data: {
        firstName: 'Camille',
        lastName: 'Martin',
        sex: Sex.FEMALE,
        affiliations: { create: { pharmacyId: refPharmacy.id, type: 'REFERENCE' } },
        consents: {
          create: [
            {
              type: ConsentType.HEALTH_DATA,
              granted: true,
              policyVersion: 'v1.0',
              source: ConsentSource.APP_PATIENT,
              grantedAt: new Date('2026-01-15T10:00:00Z'),
            },
            {
              type: ConsentType.MARKETING,
              granted: false,
              policyVersion: 'v1.0',
              source: ConsentSource.APP_PATIENT,
            },
            {
              type: ConsentType.PUSH_NOTIFICATIONS,
              granted: true,
              policyVersion: 'v1.0',
              source: ConsentSource.APP_PATIENT,
              grantedAt: new Date('2026-01-15T10:00:00Z'),
            },
          ],
        },
      },
    })
    const authId = await provisionAuthUser('patient.demo@wellpharma.test', 'PATIENT')
    await engagementDb.user.create({
      data: {
        email: 'patient.demo@wellpharma.test',
        authId,
        role: Role.PATIENT,
        fullName: 'Camille Martin',
        patientId: patient.id,
      },
    })
  }

  // 3b) Cohorte de patients de référence (sans compte) — alimente le moteur
  //     d'éligibilité côté pharmacien (ciblage par âge/sexe, données engagement).
  const REFERENCE_PATIENTS: Array<{
    firstName: string
    lastName: string
    sex: keyof typeof Sex
    birthDate: string
  }> = [
    { firstName: 'Jean', lastName: 'Dupont', sex: 'MALE', birthDate: '1952-03-12' }, // 74
    { firstName: 'Marie', lastName: 'Lefèvre', sex: 'FEMALE', birthDate: '1948-09-30' }, // 77
    { firstName: 'Ahmed', lastName: 'Benali', sex: 'MALE', birthDate: '1958-01-22' }, // 68
    { firstName: 'Sophie', lastName: 'Roy', sex: 'FEMALE', birthDate: '1972-06-05' }, // 53
    { firstName: 'Lucas', lastName: 'Moreau', sex: 'MALE', birthDate: '1995-11-18' }, // 30
    { firstName: 'Fatima', lastName: 'Zahra', sex: 'FEMALE', birthDate: '1960-04-08' }, // 66
  ]
  for (const rp of REFERENCE_PATIENTS) {
    const existing = await engagementDb.patient.findFirst({
      where: { firstName: rp.firstName, lastName: rp.lastName },
      select: { id: true },
    })
    if (existing) continue
    await engagementDb.patient.create({
      data: {
        firstName: rp.firstName,
        lastName: rp.lastName,
        sex: Sex[rp.sex],
        birthDate: new Date(rp.birthDate),
        affiliations: { create: { pharmacyId: refPharmacy.id, type: 'REFERENCE' } },
        consents: {
          create: {
            type: ConsentType.HEALTH_DATA,
            granted: true,
            policyVersion: 'v1.0',
            source: ConsentSource.ADMIN_PHARMACIE,
            grantedAt: new Date('2026-01-10T09:00:00Z'),
          },
        },
      },
    })
  }

  // 4) Marronnier — calendrier des campagnes de santé (source: doc fourni)
  const events = MARRONNIER_EVENTS

  for (const e of events) {
    await engagementDb.careEvent.upsert({
      where: { slug: e.slug },
      update: {},
      create: {
        slug: e.slug,
        title: e.title,
        description: e.description,
        category: CareEventCategory[e.category],
        month: e.month,
        targetAgeMin: e.targetAgeMin,
        targetAgeMax: e.targetAgeMax,
        targetSex: e.targetSex ? TargetSex[e.targetSex] : TargetSex.ALL,
        riskFactors: e.riskFactors ?? [],
        source: 'Marronnier Wellpharma',
      },
    })
  }

  // 5) Missions — activations groupement + 1 affectation « à valider » (pilotage démo)
  const ACTIVE_MISSIONS = ['ENTRETIEN_AOD', 'VACCINATION_GRIPPE', 'OBSERVANCE', 'BPM']
  for (const code of ACTIVE_MISSIONS) {
    await engagementDb.missionActivation.upsert({
      where: { groupementId_missionCode: { groupementId: groupement.id, missionCode: code } },
      update: { active: true },
      create: { groupementId: groupement.id, missionCode: code, active: true },
    })
  }

  const patientUser = await engagementDb.user.findUnique({
    where: { email: 'patient.demo@wellpharma.test' },
    select: { patientId: true },
  })
  if (patientUser?.patientId) {
    const existingAssign = await engagementDb.missionAssignment.findFirst({
      where: { patientId: patientUser.patientId, missionCode: 'ENTRETIEN_AOD' },
    })
    if (!existingAssign) {
      const assignment = await engagementDb.missionAssignment.create({
        data: {
          missionCode: 'ENTRETIEN_AOD',
          pharmacyId: refPharmacy.id,
          patientId: patientUser.patientId,
          state: 'A_VALIDER',
          channel: 'PUSH',
          completedAt: new Date(),
        },
      })
      const tpl = getMissionTemplate('ENTRETIEN_AOD')
      const answers = {
        connait_medicament: 'À peu près',
        oublis: 'Parfois',
        saignements: 'Un peu',
        automedication: true,
        confiance: 4,
        question: 'Est-ce grave si j’oublie une prise de temps en temps ?',
        consent: true,
      }
      await healthDb.missionResponse.create({
        data: {
          assignmentId: assignment.id,
          patientId: patientUser.patientId,
          pharmacyId: refPharmacy.id,
          missionCode: 'ENTRETIEN_AOD',
          answersEncrypted: new Uint8Array(seal(JSON.stringify(answers))),
          attentionPoints: tpl ? computeAttentionPoints(tpl, answers) : [],
          submittedAt: new Date(),
        },
      })
    }
  }

  // 6) Carte de fidélité Wellpharma (démo — Camille)
  if (patientUser?.patientId) {
    const account = await engagementDb.loyaltyAccount.upsert({
      where: { patientId: patientUser.patientId },
      update: {},
      create: {
        patientId: patientUser.patientId,
        cardNumber: 'WP-2026-004821',
        points: 340,
        tier: 'Fidèle',
      },
      include: { transactions: true },
    })
    if (account.transactions.length === 0) {
      await engagementDb.loyaltyTransaction.createMany({
        data: [
          { accountId: account.id, label: 'Adhésion programme fidélité', points: 340 },
          { accountId: account.id, label: 'Bon de réduction utilisé', points: -100 },
          { accountId: account.id, label: 'Vaccination grippe', points: 20 },
          { accountId: account.id, label: 'Achat parapharmacie', points: 30 },
          { accountId: account.id, label: 'Entretien pharmaceutique réalisé', points: 50 },
        ],
      })
    }
  }

  // 7) Carrousel d'accueil app patient (bannières pilotées par le groupement)
  const bannerCount = await engagementDb.homeBanner.count()
  if (bannerCount === 0) {
    const gradient = (c1: string, c2: string) =>
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='1200' height='675' fill='url(#g)'/></svg>`,
      )
    await engagementDb.homeBanner.createMany({
      data: [
        {
          groupementId: groupement.id,
          title: 'Faire équipe pour votre santé',
          subtitle: 'Vaccination, entretiens, prévention : votre pharmacien vous accompagne.',
          imageDataUrl: gradient('#009dc5', '#1d243f'),
          linkUrl: '/prevention',
          sortOrder: 1,
          active: true,
        },
        {
          groupementId: groupement.id,
          title: 'Votre programme de fidélité',
          subtitle: 'Cumulez des points à chaque visite et profitez d’avantages.',
          imageDataUrl: gradient('#2bad70', '#009dc5'),
          linkUrl: '/fidelite',
          sortOrder: 2,
          active: true,
        },
      ],
    })
  }

  console.log(
    `✅ Seed terminé : 1 groupement, ${pharmacies.length} pharmacies, 3 comptes démo, ${events.length} campagnes marronnier, ${ACTIVE_MISSIONS.length} missions activées.`,
  )
}

main()
  .then(async () => {
    await engagementDb.$disconnect()
    await healthDb.$disconnect()
  })
  .catch(async (err) => {
    console.error(err)
    await engagementDb.$disconnect()
    await healthDb.$disconnect()
    process.exit(1)
  })
