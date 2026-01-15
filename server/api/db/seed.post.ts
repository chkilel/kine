import type { H3Event } from 'h3'
import { addDays, format } from 'date-fns'
import { eq, and } from 'drizzle-orm'
import {
  patients,
  organizations,
  users,
  treatmentPlans,
  weeklyAvailabilityTemplates,
  availabilityExceptions,
  consultations,
  rooms
} from '~~/server/database/schema'
import { members } from '~~/server/database/schema/organization'
import { hasTimeConflict } from '~~/shared/utils/availability-utils'
import { minutesToTime, timeToMinutes } from '~~/shared/utils/date-utils'
import {
  MINIMUM_CONSULTATION_GAP_MINUTES,
  CONSULTATION_DURATIONS,
  VALID_CONSULTATION_TYPES,
  VALID_CONSULTATION_STATUSES
} from '~~/shared/utils/constants.consultation'
import { VALID_SCHEDULE_DAYS, VALID_SCHEDULE_EXCEPTION_TYPES } from '~~/shared/utils/constants.availability'
import { VALID_CONSULTATION_LOCATIONS } from '~~/shared/utils/constants.location'
import { VALID_PATIENT_STATUSES, VALID_SEX_VALUES, VALID_RELATIONSHIP_TYPES } from '~~/shared/utils/constants.patient'
import { VALID_PHONE_CATEGORIES } from '~~/shared/utils/constants.user'
import { VALID_COVERAGE_STATUSES, VALID_TREATMENT_PLAN_STATUSES } from '~~/shared/utils/constants.treatement-plan'

import { createAuth } from '~~/server/utils/auth'

type DrizzleDB = ReturnType<typeof useDrizzle>

type SeedResults = {
  success: {
    users: number
    organizations: number
    memberships: number
    patients: number
    treatmentPlans: number
    weeklyTemplates: number
    availabilityExceptions: number
    rooms: number
    consultations: number
  }
  errors: Array<{ type: string; message: string; details?: any }>
}

const SEED_CONFIG = {
  users: {
    count: 10,
    password: 'Password123',
    adminEmail: 'admin@seed.local'
  },
  organizations: {
    count: 2,
    names: [
      { name: 'Kine Clinic A', slug: 'kine-clinic-a' },
      { name: 'Kine Clinic B', slug: 'kine-clinic-b' },
      { name: 'Kine Clinic C', slug: 'kine-clinic-c' }
    ],
    userDistribution: [4, 4, 3]
  },
  patients: {
    count: 30,
    distribution: [8, 6, 6]
  },
  availability: {
    templatesPerUser: { min: 3, max: 5 },
    exceptionsPerUser: { min: 2, max: 4 },
    exceptionDaysRange: 90
  },
  treatmentPlans: {
    minPerPatient: 6,
    statuses: VALID_TREATMENT_PLAN_STATUSES
  },
  rooms: {
    countPerOrg: 5
  },
  consultations: {
    minPerPatient: 5,
    maxPerPatient: 30,
    dateRangeDays: 90,
    pastPercentage: 0.6
  }
} as const

const userData = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@seed.local',
    licenseNumber: 'PHY-ADMIN',
    specialization: ['general'],
    phoneNumbers: [{ number: '+212611111111', category: VALID_PHONE_CATEGORIES[0], id: 'admin-1' }]
  },
  {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@seed.local',
    licenseNumber: 'PHY-001',
    specialization: ['musculoskeletal_orthopedic', 'sport'],
    phoneNumbers: [{ number: '+212612345678', category: VALID_PHONE_CATEGORIES[0], id: '1' }]
  },
  {
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'marie.martin@seed.local',
    licenseNumber: 'PHY-002',
    specialization: ['neurological', 'functional_rehabilitation'],
    phoneNumbers: [{ number: '+212623456789', category: VALID_PHONE_CATEGORIES[0], id: '2' }]
  },
  {
    firstName: 'Pierre',
    lastName: 'Bernard',
    email: 'pierre.bernard@seed.local',
    licenseNumber: 'PHY-003',
    specialization: ['pediatric'],
    phoneNumbers: [{ number: '+212634567890', category: VALID_PHONE_CATEGORIES[0], id: '3' }]
  },
  {
    firstName: 'Sophie',
    lastName: 'Dubois',
    email: 'sophie.dubois@seed.local',
    licenseNumber: 'PHY-004',
    specialization: ['geriatric'],
    phoneNumbers: [{ number: '+212645678901', category: VALID_PHONE_CATEGORIES[0], id: '4' }]
  },
  {
    firstName: 'Luc',
    lastName: 'Petit',
    email: 'luc.petit@seed.local',
    licenseNumber: 'PHY-005',
    specialization: ['cardiorespiratory'],
    phoneNumbers: [{ number: '+212656789012', category: VALID_PHONE_CATEGORIES[0], id: '5' }]
  },
  {
    firstName: 'Claire',
    lastName: 'Robert',
    email: 'claire.robert@seed.local',
    licenseNumber: 'PHY-006',
    specialization: ['sport'],
    phoneNumbers: [{ number: '+212667890123', category: VALID_PHONE_CATEGORIES[0], id: '6' }]
  },
  {
    firstName: 'Michel',
    lastName: 'Richard',
    email: 'michel.richard@seed.local',
    licenseNumber: 'PHY-007',
    specialization: ['neurological', 'pediatric'],
    phoneNumbers: [{ number: '+212678901234', category: VALID_PHONE_CATEGORIES[0], id: '7' }]
  },
  {
    firstName: 'Isabelle',
    lastName: 'Durand',
    email: 'isabelle.durand@seed.local',
    licenseNumber: 'PHY-008',
    specialization: ['orthopedic_manual_therapy'],
    phoneNumbers: [{ number: '+212689012345', category: VALID_PHONE_CATEGORIES[0], id: '8' }]
  },
  {
    firstName: 'Nicolas',
    lastName: 'Lefebvre',
    email: 'nicolas.lefebvre@seed.local',
    licenseNumber: 'PHY-009',
    specialization: ['geriatric', 'functional_rehabilitation'],
    phoneNumbers: [{ number: '+212690123456', category: VALID_PHONE_CATEGORIES[0], id: '9' }]
  },
  {
    firstName: 'Anne',
    lastName: 'Moreau',
    email: 'anne.moreau@seed.local',
    licenseNumber: 'PHY-010',
    specialization: ['cardiorespiratory', 'sport'],
    phoneNumbers: [{ number: '+212601234567', category: VALID_PHONE_CATEGORIES[0], id: '10' }]
  }
]

type UserData = (typeof userData)[number]

const patientData = [
  {
    firstName: 'Ahmed',
    lastName: 'Alami',
    gender: VALID_SEX_VALUES[0],
    dateOfBirth: '1985-03-15',
    phone: '+212651234567',
    email: 'ahmed.alami@email.com',
    city: 'Casablanca'
  },
  {
    firstName: 'Fatima',
    lastName: 'Benali',
    gender: VALID_SEX_VALUES[1],
    dateOfBirth: '1990-07-22',
    phone: '+212662345678',
    email: 'fatima.benali@email.com',
    city: 'Rabat'
  },
  {
    firstName: 'Mohammed',
    lastName: 'Chaoui',
    gender: VALID_SEX_VALUES[0],
    dateOfBirth: '1978-11-08',
    phone: '+212673456789',
    email: 'mohammed.chaoui@email.com',
    city: 'Marrakech'
  },
  {
    firstName: 'Amina',
    lastName: 'Idrissi',
    gender: VALID_SEX_VALUES[1],
    dateOfBirth: '1995-01-30',
    phone: '+212684567890',
    email: 'amina.idrissi@email.com',
    city: 'Fes'
  },
  {
    firstName: 'Youssef',
    lastName: 'Jaziri',
    gender: VALID_SEX_VALUES[0],
    dateOfBirth: '1982-09-12',
    phone: '+212695678901',
    email: 'youssef.jaziri@email.com',
    city: 'Tangier'
  },
  {
    firstName: 'Nour',
    lastName: 'Kaddouri',
    gender: VALID_SEX_VALUES[1],
    dateOfBirth: '1988-05-25',
    phone: '+212606789012',
    email: 'nour.kaddouri@email.com',
    city: 'Agadir'
  },
  {
    firstName: 'Karim',
    lastName: 'Mansouri',
    gender: VALID_SEX_VALUES[0],
    dateOfBirth: '1975-12-03',
    phone: '+212617890123',
    email: 'karim.mansouri@email.com',
    city: 'Meknes'
  },
  {
    firstName: 'Laila',
    lastName: 'Ouazzani',
    gender: VALID_SEX_VALUES[1],
    dateOfBirth: '1992-04-18',
    phone: '+212628901234',
    email: 'laila.ouazzani@email.com',
    city: 'Oujda'
  },
  {
    firstName: 'Omar',
    lastName: 'Berrada',
    gender: VALID_SEX_VALUES[0],
    dateOfBirth: '1980-08-07',
    phone: '+212639012345',
    email: 'omar.berrada@email.com',
    city: 'Kenitra'
  },
  {
    firstName: 'Salma',
    lastName: 'Chraibi',
    gender: VALID_SEX_VALUES[1],
    dateOfBirth: '1993-06-28',
    phone: '+212640123456',
    email: 'salma.chraibi@email.com',
    city: 'Tetouan'
  },
  {
    firstName: 'Hassan',
    lastName: 'Filali',
    gender: VALID_SEX_VALUES[0],
    dateOfBirth: '1976-02-14',
    phone: '+212651234567',
    email: 'hassan.filali@email.com',
    city: 'Safi'
  },
  {
    firstName: 'Khadija',
    lastName: 'Ghoufrani',
    gender: VALID_SEX_VALUES[1],
    dateOfBirth: '1987-10-20',
    phone: '+212662345678',
    email: 'khadija.ghoufrani@email.com',
    city: 'El Jadida'
  },
  {
    firstName: 'Brahim',
    lastName: 'Hilali',
    gender: VALID_SEX_VALUES[0],
    dateOfBirth: '1983-07-05',
    phone: '+212673456789',
    email: 'brahim.hilali@email.com',
    city: 'Beni Mellal'
  },
  {
    firstName: 'Samira',
    lastName: 'Ibrahimi',
    gender: VALID_SEX_VALUES[1],
    dateOfBirth: '1991-03-11',
    phone: '+212684567890',
    email: 'samira.ibrahimi@email.com',
    city: 'Nador'
  },
  {
    firstName: 'Abdelkrim',
    lastName: 'Joundi',
    gender: VALID_SEX_VALUES[0],
    dateOfBirth: '1979-11-29',
    phone: '+212695678901',
    email: 'abdelkrim.joundi@email.com',
    city: 'Khouribga'
  },
  {
    firstName: 'Meryem',
    lastName: 'Laghzali',
    gender: VALID_SEX_VALUES[1],
    dateOfBirth: '1994-09-16',
    phone: '+212606789012',
    email: 'meryem.laghzali@email.com',
    city: 'Settat'
  },
  {
    firstName: 'Nabil',
    lastName: 'Maaroufi',
    gender: VALID_SEX_VALUES[0],
    dateOfBirth: '1981-05-02',
    phone: '+212617890123',
    email: 'nabil.maaroufi@email.com',
    city: 'Larache'
  },
  {
    firstName: 'Rajae',
    lastName: 'Najdi',
    gender: VALID_SEX_VALUES[1],
    dateOfBirth: '1989-01-24',
    phone: '+212628901234',
    email: 'rajae.najdi@email.com',
    city: 'Guelmim'
  },
  {
    firstName: 'Tariq',
    lastName: 'Ouahmane',
    gender: VALID_SEX_VALUES[0],
    dateOfBirth: '1977-08-19',
    phone: '+212639012345',
    email: 'tariq.ouahmane@email.com',
    city: 'Taza'
  },
  {
    firstName: 'Asma',
    lastName: 'Rifai',
    gender: VALID_SEX_VALUES[1],
    dateOfBirth: '1996-04-08',
    phone: '+212640123456',
    email: 'asma.rifai@email.com',
    city: 'Al Hoceima'
  }
]

const medicalConditions = [
  'Hypertension',
  'Diabetes Type 2',
  'Osteoarthritis',
  'Lower Back Pain',
  'Sciatica',
  'Tennis Elbow',
  'Rotator Cuff Injury',
  'Knee Meniscus Tear',
  'Ankle Sprain',
  'Neck Pain'
]
const surgeries = [
  'Knee Surgery - 2018',
  'Appendectomy - 2010',
  'Hip Replacement - 2015',
  'Shoulder Surgery - 2019',
  'Spinal Fusion - 2016'
]
const allergies = ['Penicillin', 'Pollen', 'Dust Mites', 'Latex', 'Aspirin']
const medications = ['Metformin', 'Ibuprofen', 'Lisinopril', 'Atorvastatin', 'Omeprazole']
const locations = VALID_CONSULTATION_LOCATIONS
const exceptionReasons = VALID_SCHEDULE_EXCEPTION_TYPES

const roomEquipment = [
  'Table électrique',
  'Tapis de course',
  'Haltères',
  'Ballon de rééducation',
  'Banc incliné',
  'Élastiques de résistance',
  'Barres parallèles',
  "Table d'étirement"
]

const roomNames = [
  'Salle de traitement 1',
  'Salle de traitement 2',
  'Salle de kinésithérapie',
  'Salle de rééducation',
  'Salle de musculation'
]

const roomDescriptions = [
  'Pour les soins manuels et thérapie physique',
  'Équipement de rééducation fonctionnelle',
  'Espace dédié aux exercices de mobilisation',
  'Salle équipée pour le renforcement musculaire',
  'Zone de rééducation cardiovasculaire'
]

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function generateTime(startHour: number, endHour: number): string {
  const startMinutes = startHour * 60
  const endMinutes = endHour * 60

  const availableSlots: number[] = []
  for (let mins = startMinutes; mins <= endMinutes; mins += 30) {
    availableSlots.push(mins)
  }

  if (availableSlots.length === 0) {
    return '00:00:00'
  }

  const slotStart = randomItem(availableSlots)
  return minutesToTime(slotStart)
}

function generateTimeRange(startHour: number, endHour: number): { startTime: string; endTime: string } {
  const startMinutes = startHour * 60
  const endMinutes = endHour * 60

  const availableSlots: number[] = []
  for (let mins = startMinutes; mins <= endMinutes; mins += 30) {
    availableSlots.push(mins)
  }

  if (availableSlots.length < 2) {
    return {
      startTime: '09:00:00',
      endTime: '10:00:00'
    }
  }

  const startSlotIndex = randomInt(0, Math.max(0, availableSlots.length - 2))
  const slotStart = availableSlots[startSlotIndex]

  const endSlotIndex = randomInt(Math.min(startSlotIndex + 1, availableSlots.length - 1), availableSlots.length - 1)
  const slotEnd = availableSlots[endSlotIndex]

  return {
    startTime: minutesToTime(slotStart),
    endTime: minutesToTime(slotEnd)
  }
}

async function resetDatabase(db: DrizzleDB): Promise<void> {
  await db.delete(consultations)
  await db.delete(rooms)
  await db.delete(treatmentPlans)
  await db.delete(patients)
  await db.delete(availabilityExceptions)
  await db.delete(weeklyAvailabilityTemplates)
  await db.delete(members)
  await db.delete(users)
  await db.delete(organizations)
}

async function createOrganization(event: H3Event, name: string, slug: string, userId: string): Promise<string | null> {
  try {
    const db = useDrizzle(event)
    const existing = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1)

    if (existing.length > 0) {
      return existing[0].id
    }

    const orgRecord = await db
      .insert(organizations)
      .values({
        name,
        slug,
        metadata: {}
      })
      .returning()
      .then((rows) => rows[0])

    if (orgRecord && orgRecord.id) {
      console.log('Created organization:', orgRecord.id, orgRecord.name)
      return orgRecord.id
    }

    console.error('Failed to create organization - no record returned')
    return null
  } catch (error) {
    console.error('Error creating organization:', error)
    return null
  }
}

async function createUser(event: H3Event, user: UserData, password: string): Promise<string | null> {
  try {
    const db = useDrizzle(event)
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, user.email)).limit(1)

    if (existing.length > 0) {
      return existing[0].id
    }

    const auth = createAuth(event)
    const result = await auth.api.signUpEmail({
      body: {
        email: user.email,
        password,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        licenseNumber: user.licenseNumber,
        specialization: user.specialization,
        phoneNumbers: user.phoneNumbers
      }
    })

    return (result as any)?.user?.id || null
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

async function createMembership(
  event: H3Event,
  userId: string,
  organizationId: string,
  role: string = 'member'
): Promise<void> {
  try {
    const db = useDrizzle(event)
    const existing = await db
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.userId, userId), eq(members.organizationId, organizationId)))
      .limit(1)

    if (existing.length > 0) {
      return
    }

    await db.insert(members).values({
      userId,
      organizationId,
      role
    })

    console.log(`Created membership: user=${userId}, org=${organizationId}, role=${role}`)
  } catch (error) {
    console.error('Error creating membership:', error)
    throw error
  }
}

function validateTemplateConflict(existingTemplates: any[], newTemplate: any): boolean {
  for (const existing of existingTemplates) {
    if (existing.dayOfWeek === newTemplate.dayOfWeek) {
      if (
        hasTimeConflict(
          existing.startTime,
          existing.endTime,
          newTemplate.startTime,
          newTemplate.endTime,
          MINIMUM_CONSULTATION_GAP_MINUTES
        )
      ) {
        return false
      }
    }
  }
  return true
}

function generateWeeklyTemplates(userId: string, organizationId: string): any[] {
  const count = randomInt(SEED_CONFIG.availability.templatesPerUser.min, SEED_CONFIG.availability.templatesPerUser.max)
  const templates: any[] = []
  const usedDays = new Set<string>()
  const days = VALID_SCHEDULE_DAYS

  let attempts = 0
  while (templates.length < count && attempts < 20) {
    attempts++
    const day = randomItem(days)
    if (usedDays.has(day)) continue
    usedDays.add(day)

    const timeRange = generateTimeRange(9, 17)
    const template: any = {
      userId,
      organizationId,
      dayOfWeek: day,
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
      location: randomItem(locations)
    }

    if (validateTemplateConflict(templates, template)) {
      templates.push(template)
    }
  }

  return templates
}

function validateExceptionConflict(existingExceptions: any[], newException: any): boolean {
  for (const existing of existingExceptions) {
    if (existing.date === newException.date) {
      if (existing.startTime === null || newException.startTime === null) {
        return false
      }
      if (
        hasTimeConflict(
          existing.startTime || '00:00:00',
          existing.endTime || '23:59:00',
          newException.startTime || '00:00:00',
          newException.endTime || '23:59:00',
          MINIMUM_CONSULTATION_GAP_MINUTES
        )
      ) {
        return false
      }
    }
  }
  return true
}

function generateAvailabilityExceptions(userId: string, organizationId: string): any[] {
  const count = randomInt(
    SEED_CONFIG.availability.exceptionsPerUser.min,
    SEED_CONFIG.availability.exceptionsPerUser.max
  )
  const exceptions: any[] = []
  const usedDates = new Set<string>()

  let attempts = 0
  while (exceptions.length < count && attempts < 30) {
    attempts++
    const daysOffset = randomInt(1, SEED_CONFIG.availability.exceptionDaysRange)
    const date = format(addDays(new Date(), daysOffset), 'yyyy-MM-dd')

    if (usedDates.has(date)) continue
    usedDates.add(date)

    const isFullDay = Math.random() > 0.6
    const timeRange = generateTimeRange(9, 17)
    const exception: any = {
      userId,
      organizationId,
      date,
      startTime: isFullDay ? null : timeRange.startTime,
      endTime: isFullDay ? null : timeRange.endTime,
      isAvailable: Math.random() > 0.4,
      reason: randomItem(exceptionReasons),
      notes: Math.random() > 0.7 ? 'Auto-generated exception' : null
    }

    if (validateExceptionConflict(exceptions, exception)) {
      exceptions.push(exception)
    }
  }

  return exceptions
}

function generateTreatmentPlans(patientId: string, organizationId: string, therapistId: string): any[] {
  const count = SEED_CONFIG.treatmentPlans.minPerPatient
  const shuffled = shuffleArray([...SEED_CONFIG.treatmentPlans.statuses])
  const selectedStatuses = shuffled.slice(0, count)

  if (!selectedStatuses.includes('ongoing')) {
    selectedStatuses[0] = 'ongoing'
  }

  return selectedStatuses.map((status, index) => {
    const startDate = format(addDays(new Date(), -randomInt(30, 180)), 'yyyy-MM-dd')
    const endDate = status === 'completed' ? format(addDays(new Date(), -randomInt(1, 30)), 'yyyy-MM-dd') : null

    return {
      patientId,
      organizationId,
      therapistId,
      title: `Treatment Plan ${index + 1}`,
      diagnosis: randomItem(medicalConditions),
      objective: 'Restore function and reduce pain',
      startDate,
      endDate,
      numberOfSessions: randomInt(5, 20),
      sessionFrequency: 1,
      status,
      prescribingDoctor: 'Dr. Smith',
      prescriptionDate: startDate,
      painLevel: randomInt(0, 10),
      coverageStatus: randomItem([VALID_COVERAGE_STATUSES[4], VALID_COVERAGE_STATUSES[1], VALID_COVERAGE_STATUSES[2]]),
      insuranceInfo: 'Insurance Co. Ltd.',
      notes: []
    }
  })
}

function generateRooms(organizationId: string): any[] {
  const roomsData: any[] = []

  for (let i = 0; i < SEED_CONFIG.rooms.countPerOrg; i++) {
    const equipmentCount = randomInt(0, 3)
    const selectedEquipment = shuffleArray(roomEquipment).slice(0, equipmentCount)

    roomsData.push({
      organizationId,
      name: roomNames[i] || `Salle ${i + 1}`,
      description: roomDescriptions[i] || `Salle de traitement`,
      equipment: selectedEquipment,
      capacity: randomInt(1, 3),
      area: randomInt(15, 50),
      prm: Math.random() > 0.5 ? 1 : 0
    })
  }

  return roomsData
}

function getConsultationStatus(isPastDate: boolean, isToday: boolean): string {
  if (isToday) {
    return Math.random() > 0.7 ? 'in_progress' : 'scheduled'
  }

  if (isPastDate) {
    const rand = Math.random()
    if (rand < 0.7) return 'completed'
    if (rand < 0.85) return 'cancelled'
    if (rand < 0.95) return 'no_show'
    return 'completed'
  }

  return Math.random() > 0.3 ? 'confirmed' : 'scheduled'
}

function generateConsultations(
  patientId: string,
  organizationId: string,
  therapistId: string,
  treatmentPlansMeta: { id: string; startDate: string; endDate: string | null }[],
  availableRoomIds: string[],
  roomBookings: Map<string, string>
): any[] {
  const count = randomInt(SEED_CONFIG.consultations.minPerPatient, SEED_CONFIG.consultations.maxPerPatient)
  const consultationsData: any[] = []

  const indices = Array.from({ length: count }, (_, index) => index)
  const linkedIndices = new Set<number>()
  const today = format(new Date(), 'yyyy-MM-dd')

  if (treatmentPlansMeta.length > 0) {
    const desiredLinkedCount = Math.max(1, Math.floor(count * 0.6))
    const shuffledIndices = shuffleArray(indices)

    for (let i = 0; i < desiredLinkedCount && i < shuffledIndices.length; i++) {
      linkedIndices.add(shuffledIndices[i])
    }

    if (count > 1 && linkedIndices.size === count) {
      linkedIndices.delete(shuffledIndices[0])
    }
  }

  for (let i = 0; i < count; i++) {
    let date: string
    let treatmentPlanId: string | null = null

    if (linkedIndices.has(i) && treatmentPlansMeta.length > 0) {
      const selectedPlan = randomItem(treatmentPlansMeta)
      treatmentPlanId = selectedPlan.id

      const planStart = new Date(selectedPlan.startDate)
      const planEnd = selectedPlan.endDate ? new Date(selectedPlan.endDate) : null

      if (!isNaN(planStart.getTime())) {
        if (planEnd && !isNaN(planEnd.getTime()) && planEnd.getTime() >= planStart.getTime()) {
          const totalDays = Math.floor((planEnd.getTime() - planStart.getTime()) / (1000 * 60 * 60 * 24))
          const offset = totalDays > 0 ? randomInt(0, totalDays) : 0
          date = format(addDays(planStart, offset), 'yyyy-MM-dd')
        } else {
          const offset = randomInt(0, SEED_CONFIG.consultations.dateRangeDays)
          date = format(addDays(planStart, offset), 'yyyy-MM-dd')
        }
      } else {
        const daysOffset = randomInt(-SEED_CONFIG.consultations.dateRangeDays, SEED_CONFIG.consultations.dateRangeDays)
        date = format(addDays(new Date(), daysOffset), 'yyyy-MM-dd')
      }
    } else {
      const daysOffset = randomInt(-SEED_CONFIG.consultations.dateRangeDays, SEED_CONFIG.consultations.dateRangeDays)
      date = format(addDays(new Date(), daysOffset), 'yyyy-MM-dd')
    }

    const isPast = date < today
    const isToday = date === today
    const status = getConsultationStatus(isPast, isToday)

    const timeRange = generateTimeRange(9, 16)
    const duration = randomItem(CONSULTATION_DURATIONS)
    const location = randomItem(VALID_CONSULTATION_LOCATIONS)

    let roomId: string | null = null
    if (location === 'clinic' && availableRoomIds.length > 0 && Math.random() > 0.3) {
      const shuffledRooms = shuffleArray(availableRoomIds)
      for (const rId of shuffledRooms) {
        const bookingKey = `${rId}_${date}_${timeRange.startTime}`
        if (!roomBookings.has(bookingKey)) {
          roomId = rId
          roomBookings.set(bookingKey, patientId)
          break
        }
      }
    }

    const startTime = timeRange.startTime
    const endTime = minutesToTime(timeToMinutes(startTime) + duration)

    const consultation: any = {
      organizationId,
      patientId,
      therapistId,
      treatmentPlanId,
      roomId,
      date,
      startTime,
      endTime,
      duration,
      type: randomItem(VALID_CONSULTATION_TYPES),
      status,
      location,
      billed: isPast && status === 'completed' ? date : null,
      insuranceClaimed: isPast && status === 'completed' ? 1 : 0,
      cost: duration * 50,
      chiefComplaint: randomItem(medicalConditions),
      notes: status === 'completed' ? 'Session terminée avec succès' : null,
      treatmentSummary:
        status === 'completed'
          ? randomItem([
              'Thérapie manuelle et étirements',
              'Exercices de renforcement',
              'Mobilisation articulaire',
              'Rééducation fonctionnelle'
            ])
          : null
    }

    if (status === 'completed') {
      const painBefore = randomInt(3, 8)
      consultation.painLevelBefore = painBefore
      consultation.painLevelAfter = randomInt(0, Math.min(painBefore - 1, 5))
      consultation.observations = randomItem([
        'Bonne réponse au traitement',
        'Amélioration de la mobilité',
        'Patient motivé',
        'Progrès significatifs'
      ])
    }

    consultationsData.push(consultation)
  }

  consultationsData.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.startTime.localeCompare(b.startTime)
  })

  return consultationsData
}

export default defineEventHandler(async (event: H3Event) => {
  const config = useRuntimeConfig()
  const isDevelopment = config.env === 'development' || process.env.NODE_ENV === 'development'

  if (!isDevelopment) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Seeding is only allowed in development environment'
    })
  }

  const results: SeedResults = {
    success: {
      users: 0,
      organizations: 0,
      memberships: 0,
      patients: 0,
      treatmentPlans: 0,
      weeklyTemplates: 0,
      availabilityExceptions: 0,
      rooms: 0,
      consultations: 0
    },
    errors: []
  }

  try {
    await resetDatabase(useDrizzle(event))
  } catch (error) {
    results.errors.push({
      type: 'database_reset',
      message: 'Failed to reset database',
      details: error instanceof Error ? error.message : String(error)
    })
    return results
  }

  const userIds: string[] = []

  for (const user of userData) {
    try {
      const userId = await createUser(event, user, SEED_CONFIG.users.password)

      if (userId) {
        userIds.push(userId)
        results.success.users++
      } else {
        results.errors.push({
          type: 'user',
          message: `Failed to create user: ${user.email}`
        })
      }
    } catch (error) {
      results.errors.push({
        type: 'user',
        message: `Failed to create user: ${user.email}`,
        details: error instanceof Error ? error.message : String(error)
      })
    }
  }

  const organizationIds: string[] = []

  const adminUserId = userIds[0]

  for (const org of SEED_CONFIG.organizations.names) {
    try {
      const orgId = await createOrganization(event, org.name, org.slug, adminUserId)

      if (orgId) {
        organizationIds.push(orgId)
        results.success.organizations++
      } else {
        results.errors.push({
          type: 'organization',
          message: `Failed to create organization: ${org.name}`
        })
      }
    } catch (error) {
      results.errors.push({
        type: 'organization',
        message: `Failed to create organization: ${org.name}`,
        details: error instanceof Error ? error.message : String(error)
      })
    }
  }

  let userIndex = 0
  for (let orgIndex = 0; orgIndex < SEED_CONFIG.organizations.userDistribution.length; orgIndex++) {
    const usersInOrg = SEED_CONFIG.organizations.userDistribution[orgIndex]
    const orgId = organizationIds[orgIndex]

    for (let i = 0; i < usersInOrg && userIndex < userIds.length; i++, userIndex++) {
      const userId = userIds[userIndex]
      try {
        await createMembership(event, userId, orgId, 'member')
        results.success.memberships++
      } catch (error) {
        results.errors.push({
          type: 'membership',
          message: `Failed to create membership for user ${userId} in org ${orgId}`,
          details: error instanceof Error ? error.message : String(error)
        })
      }
    }
  }

  const db = useDrizzle(event)

  const orgRoomIds: Record<string, string[]> = {}
  for (const orgId of organizationIds) {
    try {
      const roomsData = generateRooms(orgId)
      if (roomsData.length > 0) {
        await db.insert(rooms).values(roomsData)
        orgRoomIds[orgId] = roomsData.map((r) => r.id)
        results.success.rooms += roomsData.length
      }
    } catch (error) {
      results.errors.push({
        type: 'room',
        message: `Failed to create rooms for org ${orgId}`,
        details: error instanceof Error ? error.message : String(error)
      })
    }
  }

  for (const userId of userIds) {
    const userOrgMemberships = await db
      .select({ organizationId: members.organizationId })
      .from(members)
      .where(eq(members.userId, userId))

    if (userOrgMemberships.length > 0) {
      const organizationId = userOrgMemberships[0].organizationId

      try {
        const templates = generateWeeklyTemplates(userId, organizationId)
        if (templates.length > 0) {
          await db.insert(weeklyAvailabilityTemplates).values(templates as any)
          results.success.weeklyTemplates += templates.length
        }
      } catch (error) {
        results.errors.push({
          type: 'weekly_template',
          message: `Failed to create weekly templates for user ${userId}`,
          details: error instanceof Error ? error.message : String(error)
        })
      }

      try {
        const exceptions = generateAvailabilityExceptions(userId, organizationId)
        if (exceptions.length > 0) {
          await db.insert(availabilityExceptions).values(exceptions as any)
          results.success.availabilityExceptions += exceptions.length
        }
      } catch (error) {
        results.errors.push({
          type: 'availability_exception',
          message: `Failed to create availability exceptions for user ${userId}`,
          details: error instanceof Error ? error.message : String(error)
        })
      }
    }
  }

  let patientIndex = 0
  for (let orgIndex = 0; orgIndex < SEED_CONFIG.patients.distribution.length; orgIndex++) {
    const patientsInOrg = SEED_CONFIG.patients.distribution[orgIndex]
    const orgId = organizationIds[orgIndex]

    for (let i = 0; i < patientsInOrg && patientIndex < patientData.length; i++, patientIndex++) {
      const patient = patientData[patientIndex]
      const therapistsInOrg = await db
        .select({ userId: members.userId })
        .from(members)
        .where(eq(members.organizationId, orgId))

      const therapistId = therapistsInOrg.length > 0 ? randomItem(therapistsInOrg).userId : null

      try {
        const patientRecord = await db
          .insert(patients)
          .values({
            organizationId: orgId,
            firstName: patient.firstName,
            lastName: patient.lastName,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            email: patient.email,
            phone: patient.phone,
            address: '123 Main Street',
            city: patient.city,
            postalCode: '10000',
            country: 'Morocco',
            emergencyContacts: [{ number: patient.phone, relationship: VALID_RELATIONSHIP_TYPES[22] }],
            medicalConditions: [randomItem(medicalConditions)],
            surgeries: Math.random() > 0.7 ? [randomItem(surgeries)] : [],
            allergies: Math.random() > 0.8 ? [randomItem(allergies)] : [],
            medications: Math.random() > 0.6 ? [randomItem(medications)] : [],
            insuranceProvider: 'AXA Assurance',
            insuranceNumber: `INS-${randomInt(100000, 999999)}`,
            referralSource: 'Online',
            status: VALID_PATIENT_STATUSES[0],
            notes: []
          })
          .returning()
          .then((rows) => rows[0])

        if (patientRecord && therapistId) {
          const treatmentPlansData = generateTreatmentPlans(patientRecord.id, orgId, therapistId)
          await db.insert(treatmentPlans).values(treatmentPlansData)
          results.success.treatmentPlans += treatmentPlansData.length
        }

        results.success.patients++
      } catch (error) {
        results.errors.push({
          type: 'patient',
          message: `Failed to create patient: ${patient.firstName} ${patient.lastName}`,
          details: error instanceof Error ? error.message : String(error)
        })
      }
    }
  }

  const roomBookings = new Map<string, string>()
  for (const patient of patientData) {
    const patientRecords = await db.select().from(patients).where(eq(patients.email, patient.email)).limit(1)
    if (patientRecords.length === 0) continue

    const patientRecord = patientRecords[0]
    const patientOrgId = patientRecord.organizationId
    const therapistsInOrg = await db
      .select({ userId: members.userId })
      .from(members)
      .where(eq(members.organizationId, patientOrgId))

    if (therapistsInOrg.length === 0) continue

    const therapistId = randomItem(therapistsInOrg).userId
    const availableRoomIds = orgRoomIds[patientOrgId] || []

    const patientTreatmentPlans = await db
      .select({ id: treatmentPlans.id, startDate: treatmentPlans.startDate, endDate: treatmentPlans.endDate })
      .from(treatmentPlans)
      .where(eq(treatmentPlans.patientId, patientRecord.id))

    try {
      const consultationsData = generateConsultations(
        patientRecord.id,
        patientOrgId,
        therapistId,
        patientTreatmentPlans,
        availableRoomIds,
        roomBookings
      )
      if (consultationsData.length > 0) {
        for (const consultation of consultationsData) {
          try {
            await db.insert(consultations).values(consultation)
            results.success.consultations++
          } catch (err) {
            results.errors.push({
              type: 'consultation',
              message: `Failed to create consultation for patient ${patient.firstName} ${patient.lastName}`,
              details: {
                error: err instanceof Error ? err.message : String(err),
                consultation: {
                  id: consultation.id,
                  date: consultation.date,
                  startTime: consultation.startTime,
                  endTime: consultation.endTime,
                  duration: consultation.duration,
                  status: consultation.status,
                  location: consultation.location,
                  roomId: consultation.roomId
                }
              }
            })
          }
        }
      }
    } catch (error) {
      results.errors.push({
        type: 'consultation',
        message: `Failed to generate consultations for patient ${patient.firstName} ${patient.lastName}`,
        details: error instanceof Error ? error.message : String(error)
      })
    }
  }

  return results
})
