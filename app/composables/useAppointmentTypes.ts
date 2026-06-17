import type { OrgAppointmentTypeItem } from '~~/shared/types/org.types'

export function useAppointmentTypes() {
  const { activeOrganization } = useOrganization()

  const orgTypes = computed<OrgAppointmentTypeItem[]>(() => (activeOrganization.value as any)?.appointmentTypes ?? [])

  const resolveTitle = (code: string | null) => getAppointmentTypeTitle(code, orgTypes.value)

  return { orgTypes, resolveTitle }
}
