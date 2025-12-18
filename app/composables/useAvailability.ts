import { useAvailabilityTemplates } from './useAvailabilityTemplates'
import { useAvailabilityExceptions } from './useAvailabilityExceptions'

export function useAvailability() {
  const templatesComposable = useAvailabilityTemplates()
  const exceptionsComposable = useAvailabilityExceptions()

  const refreshAll = async () => {
    await Promise.all([templatesComposable.fetchTemplates(), exceptionsComposable.fetchExceptions()])
  }

  return {
    ...templatesComposable,
    ...exceptionsComposable,
    refreshAll
  }
}
