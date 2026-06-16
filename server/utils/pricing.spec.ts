import { describe, it, expect } from 'vitest'
import { resolveAppointmentPrice, toPriceItemSnapshot } from './pricing'
import type { Appointment } from '~~/shared/types/appointment.type'
import type { Organization } from '~~/shared/types/org.types'
import type { TreatmentPlan } from '~~/shared/types/treatment-plan'

describe('resolveAppointmentPrice', () => {
  const mockOrganization: Organization = {
    id: 'org-1',
    name: 'Test Org',
    slug: 'test-org',
    pricing: {
      priceItems: [
        {
          id: 'item-1',
          code: 'DEFAULT',
          description: 'Tarif de séance',
          rateCent: {
            clinic: 5000,
            home: 6500,
            telehealth: 4000
          },
          isDefault: true
        },
        {
          id: 'item-2',
          code: 'MASSAGE',
          description: 'Massage 30min',
          rateCent: {
            clinic: 3000,
            home: 4500,
            telehealth: 2000
          },
          isDefault: false
        }
      ],
      packages: []
    }
  } as any as Organization

  const mockAppointmentClinic = {
    id: 'apt-1',
    organizationId: 'org-1',
    patientId: 'patient-1',
    therapistId: 'therapist-1',
    treatmentPlanId: null,
    roomId: null,
    date: '2024-01-15',
    startTime: '09:00:00',
    endTime: '09:30:00',
    duration: 30,
    type: null,
    location: 'clinic',
    status: 'scheduled',
    confirmedAt: null,
    cancelledAt: null,
    noShowReason: null,
    createdAt: new Date(),
    updatedAt: new Date()
  } as any as Appointment

  it('should inherit priceItem from treatment plan when plan has a priceItem snapshot', () => {
    const planWithPriceItem: TreatmentPlan = {
      id: 'plan-1',
      organizationId: 'org-1',
      patientId: 'patient-1',
      therapistId: 'therapist-1',
      title: 'Test Plan',
      diagnosis: 'Test diagnosis',
      objective: null,
      startDate: '2024-01-01',
      endDate: null,
      numberOfSessions: null,
      sessionFrequency: null,
      status: 'planned',
      prescribingDoctor: null,
      prescriptionDate: '2024-01-01',
      coverageStatus: null,
      insuranceInfo: null,
      pricing: {
        clinic: 8000,
        home: 10000,
        telehealth: 6000
      },
      priceItem: {
        code: 'SUIVI',
        description: 'Suivi post-op',
        rateCent: {
          clinic: 8000,
          home: 10000,
          telehealth: 6000
        }
      },
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = resolveAppointmentPrice({
      appointment: mockAppointmentClinic,
      treatmentPlan: planWithPriceItem,
      organization: mockOrganization
    })

    expect(result.priceCents).toBe(8000)
    expect(result.priceItem).toEqual({
      code: 'SUIVI',
      description: 'Suivi post-op',
      rateCent: { clinic: 8000, home: 10000, telehealth: 6000 }
    })
  })

  it('should derive priceCents from location for plan priceItem', () => {
    const appointmentHome: Appointment = {
      ...mockAppointmentClinic,
      location: 'home'
    } as any as Appointment

    const planWithPriceItem: TreatmentPlan = {
      id: 'plan-1',
      organizationId: 'org-1',
      patientId: 'patient-1',
      therapistId: 'therapist-1',
      title: 'Test Plan',
      diagnosis: 'Test diagnosis',
      objective: null,
      startDate: '2024-01-01',
      endDate: null,
      numberOfSessions: null,
      sessionFrequency: null,
      status: 'planned',
      prescribingDoctor: null,
      prescriptionDate: '2024-01-01',
      coverageStatus: null,
      insuranceInfo: null,
      pricing: {
        clinic: 8000,
        home: 10000,
        telehealth: 6000
      },
      priceItem: {
        code: 'SUIVI',
        description: 'Suivi post-op',
        rateCent: { clinic: 8000, home: 10000, telehealth: 6000 }
      },
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = resolveAppointmentPrice({
      appointment: appointmentHome,
      treatmentPlan: planWithPriceItem,
      organization: mockOrganization
    })

    expect(result.priceCents).toBe(10000)
  })

  it('should fallback to org default price item when no treatment plan', () => {
    const result = resolveAppointmentPrice({
      appointment: mockAppointmentClinic,
      treatmentPlan: null,
      organization: mockOrganization
    })

    expect(result.priceCents).toBe(5000)
    expect(result.priceItem).toEqual({
      code: 'DEFAULT',
      description: 'Tarif de séance',
      rateCent: { clinic: 5000, home: 6500, telehealth: 4000 }
    })
  })

  it('should fallback to first price item when no default is set', () => {
    const orgWithoutDefault: Organization = {
      ...mockOrganization,
      pricing: {
        ...mockOrganization.pricing!,
        priceItems: mockOrganization.pricing!.priceItems.map((item) => ({ ...item, isDefault: false }))
      }
    } as any as Organization

    const result = resolveAppointmentPrice({
      appointment: mockAppointmentClinic,
      treatmentPlan: null,
      organization: orgWithoutDefault
    })

    expect(result.priceCents).toBe(5000)
    expect(result.priceItem?.code).toBe('DEFAULT')
  })

  it('should return null priceItem and 0 priceCents when no pricing data', () => {
    const orgWithoutPricing: Organization = {
      ...mockOrganization,
      pricing: null as any
    } as any as Organization

    const result = resolveAppointmentPrice({
      appointment: mockAppointmentClinic,
      treatmentPlan: null,
      organization: orgWithoutPricing
    })

    expect(result.priceCents).toBe(0)
    expect(result.priceItem).toBeNull()
  })

  it('should select location-based rate for org default', () => {
    const appointmentHome: Appointment = {
      ...mockAppointmentClinic,
      location: 'home'
    } as any as Appointment

    const result = resolveAppointmentPrice({
      appointment: appointmentHome,
      treatmentPlan: null,
      organization: mockOrganization
    })

    expect(result.priceCents).toBe(6500)
  })
})

describe('toPriceItemSnapshot', () => {
  it('should strip id and isDefault from a PriceItem', () => {
    const snapshot = toPriceItemSnapshot({
      id: 'item-1',
      code: 'DEFAULT',
      description: 'Tarif de séance',
      rateCent: { clinic: 5000, home: 6500, telehealth: 4000 },
      isDefault: true
    })

    expect(snapshot).toEqual({
      code: 'DEFAULT',
      description: 'Tarif de séance',
      rateCent: { clinic: 5000, home: 6500, telehealth: 4000 }
    })
    expect((snapshot as any).id).toBeUndefined()
    expect((snapshot as any).isDefault).toBeUndefined()
  })
})
