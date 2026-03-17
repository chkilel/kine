import { describe, it, expect } from 'vitest'
import { calculateInheritedPrice } from './pricing'
import type { Appointment } from '~~/shared/types/appointment.type'
import type { Organization } from '~~/shared/types/org.types'
import type { TreatmentPlan } from '~~/shared/types/treatment-plan'

describe('calculateInheritedPrice', () => {
  const mockOrganization: Organization = {
    id: 'org-1',
    name: 'Test Org',
    slug: 'test-org',
    pricing: {
      sessionRates: {
        clinic: 5000,
        home: 6500,
        telehealth: 4000
      },
      packages: []
    }
  } as any as Organization

  const mockAppointmentClinic: Appointment = {
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
  }

  const mockTreatmentPlan: TreatmentPlan = {
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
      clinic: 5500,
      home: 7000,
      telehealth: 4500
    },
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }

  it('should return plan pricing when treatment plan exists and has pricing for location', () => {
    const result = calculateInheritedPrice({
      appointment: mockAppointmentClinic,
      treatmentPlan: mockTreatmentPlan,
      organization: mockOrganization
    })

    expect(result).toBe(5500)
  })

  it('should fallback to organization pricing when treatment plan does not exist', () => {
    const result = calculateInheritedPrice({
      appointment: mockAppointmentClinic,
      treatmentPlan: null,
      organization: mockOrganization
    })

    expect(result).toBe(5000)
  })

  it('should return correct price for home location', () => {
    const appointmentHome: Appointment = {
      ...mockAppointmentClinic,
      location: 'home'
    }

    const result = calculateInheritedPrice({
      appointment: appointmentHome,
      treatmentPlan: mockTreatmentPlan,
      organization: mockOrganization
    })

    expect(result).toBe(7000)
  })

  it('should return correct price for telehealth location', () => {
    const appointmentTelehealth: Appointment = {
      ...mockAppointmentClinic,
      location: 'telehealth'
    }

    const result = calculateInheritedPrice({
      appointment: appointmentTelehealth,
      treatmentPlan: mockTreatmentPlan,
      organization: mockOrganization
    })

    expect(result).toBe(4500)
  })

  it('should fallback to organization pricing when treatment plan has no pricing for location', () => {
    const planWithMissingPricing: TreatmentPlan = {
      ...mockTreatmentPlan,
      pricing: {
        clinic: 5500,
        home: 7000,
        telehealth: 0
      }
    }

    const result = calculateInheritedPrice({
      appointment: mockAppointmentClinic,
      treatmentPlan: planWithMissingPricing,
      organization: mockOrganization
    })

    expect(result).toBe(5500)
  })

  it('should return null when organization has no pricing', () => {
    const orgWithoutPricing: Organization = {
      ...mockOrganization,
      pricing: null as any
    }

    const result = calculateInheritedPrice({
      appointment: mockAppointmentClinic,
      treatmentPlan: mockTreatmentPlan,
      organization: orgWithoutPricing
    })

    expect(result).toBeNull()
  })

  it('should return null when organization pricing has no sessionRates', () => {
    const orgWithoutSessionRates: Organization = {
      ...mockOrganization,
      pricing: {
        sessionRates: undefined as any,
        packages: []
      }
    }

    const result = calculateInheritedPrice({
      appointment: mockAppointmentClinic,
      treatmentPlan: mockTreatmentPlan,
      organization: orgWithoutSessionRates
    })

    expect(result).toBeNull()
  })
})
