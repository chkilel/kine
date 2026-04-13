import { defineRelations } from 'drizzle-orm/relations'

import { users, sessions, accounts, verifications } from './schema/auth'
import { weeklyAvailabilityTemplates, availabilityExceptions } from './schema/availability'
import { appointments } from './schema/appointment'
import { patientDocuments } from './schema/document'
import { organizations, members, invitations, teams, teamMembers } from './schema/organization'
import { patients } from './schema/patient'
import { payments, appointmentPaymentItems } from './schema/payment'
import { rooms } from './schema/rooms'
import { treatmentPlans } from './schema/treatment-plan'

const schema = {
  users,
  sessions,
  accounts,
  verifications,
  weeklyAvailabilityTemplates,
  availabilityExceptions,
  appointments,
  patientDocuments,
  organizations,
  members,
  invitations,
  teams,
  teamMembers,
  patients,
  payments,
  appointmentPaymentItems: appointmentPaymentItems,
  rooms,
  treatmentPlans
}

export const relations = defineRelations(schema, (r) => ({
  weeklyAvailabilityTemplates: {
    organization: r.one.organizations({
      from: r.weeklyAvailabilityTemplates.organizationId,
      to: r.organizations.id
    }),
    user: r.one.users({
      from: r.weeklyAvailabilityTemplates.userId,
      to: r.users.id
    })
  },
  availabilityExceptions: {
    organization: r.one.organizations({
      from: r.availabilityExceptions.organizationId,
      to: r.organizations.id
    }),
    user: r.one.users({
      from: r.availabilityExceptions.userId,
      to: r.users.id
    })
  },
  appointments: {
    patient: r.one.patients({
      from: r.appointments.patientId,
      to: r.patients.id
    }),
    therapist: r.one.users({
      from: r.appointments.therapistId,
      to: r.users.id
    }),
    organization: r.one.organizations({
      from: r.appointments.organizationId,
      to: r.organizations.id
    }),
    treatmentPlan: r.one.treatmentPlans({
      from: r.appointments.treatmentPlanId,
      to: r.treatmentPlans.id
    }),
    room: r.one.rooms({
      from: r.appointments.roomId,
      to: r.rooms.id
    }),
    lockedBy: r.one.users({
      from: r.appointments.lockedById,
      to: r.users.id
    })
  },
  patientDocuments: {
    patient: r.one.patients({
      from: r.patientDocuments.patientId,
      to: r.patients.id
    }),
    organization: r.one.organizations({
      from: r.patientDocuments.organizationId,
      to: r.organizations.id
    }),
    uploadedBy: r.one.users({
      from: r.patientDocuments.uploadedById,
      to: r.users.id
    }),
    treatmentPlan: r.one.treatmentPlans({
      from: r.patientDocuments.treatmentPlanId,
      to: r.treatmentPlans.id
    })
  },
  patients: {
    appointments: r.many.appointments(),
    treatmentPlans: r.many.treatmentPlans(),
    documents: r.many.patientDocuments()
  },
  payments: {
    organization: r.one.organizations({
      from: r.payments.organizationId,
      to: r.organizations.id
    }),
    patient: r.one.patients({
      from: r.payments.patientId,
      to: r.patients.id
    }),
    recordedBy: r.one.users({
      from: r.payments.recordedById,
      to: r.users.id
    }),
    voidedBy: r.one.users({
      from: r.payments.voidedById,
      to: r.users.id
    }),
    sessionItems: r.many.appointmentPaymentItems()
  },
  appointmentPaymentItems: {
    payment: r.one.payments({
      from: r.appointmentPaymentItems.paymentId,
      to: r.payments.id
    }),
    appointment: r.one.appointments({
      from: r.appointmentPaymentItems.appointmentId,
      to: r.appointments.id
    })
  },
  rooms: {
    organization: r.one.organizations({
      from: r.rooms.organizationId,
      to: r.organizations.id
    })
  },
  treatmentPlans: {
    patient: r.one.patients({
      from: r.treatmentPlans.patientId,
      to: r.patients.id
    }),
    organization: r.one.organizations({
      from: r.treatmentPlans.organizationId,
      to: r.organizations.id
    }),
    appointments: r.many.appointments(),
    documents: r.many.patientDocuments()
  }
}))
