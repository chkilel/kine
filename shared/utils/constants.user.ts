import type { SelectMenuItem } from '@nuxt/ui'
import type { PhoneCategory } from '../types/base.types'

// =============================================================================
// Phone Categories Configuration
// =============================================================================

export const PHONE_CATEGORIES_CONFIG = {
  personal: { label: 'Personnel' },
  clinic: { label: 'Cabinet' },
  emergency: { label: 'Urgence' },
  mobile: { label: 'Mobile' },
  whatsapp: { label: 'WhatsApp' }
} as const

export const PHONE_CATEGORIES_OPTIONS = Object.entries(PHONE_CATEGORIES_CONFIG).map(([key, config]) => ({
  label: config.label,
  value: key
}))

export const getPhoneCategoryLabel = (category: PhoneCategory) => PHONE_CATEGORIES_CONFIG[category]?.label || category

// =============================================================================
// Specializations
// =============================================================================

export const SPECIALIZATIONS: SelectMenuItem[] = [
  { type: 'label', label: 'Domaines principaux' },
  { label: 'Généraliste', value: 'general' },
  { label: 'Musculosquelettique / Orthopédique', value: 'musculoskeletal_orthopedic' },
  { label: 'Sport', value: 'sport' },
  { label: 'Neurologique', value: 'neurological' },
  { label: 'Cardio-respiratoire', value: 'cardiorespiratory' },
  { label: 'Pédiatrique', value: 'pediatric' },
  { label: 'Gériatrie', value: 'geriatric' },
  { label: 'Pelvien / Périnatalité', value: 'pelvic_perinatal' },
  { label: 'Rhumatologie', value: 'rheumatology' },
  { label: "Vestibulaire / Troubles de l'équilibre", value: 'vestibular_balance' },
  { label: 'Douleur chronique', value: 'chronic_pain' },
  { type: 'separator' },
  { type: 'label', label: 'Techniques avancées' },
  { label: 'Thérapie manuelle orthopédique (TMO)', value: 'orthopedic_manual_therapy' },
  { label: 'Rééducation fonctionnelle', value: 'functional_rehabilitation' },
  { label: 'Dry Needling', value: 'dry_needling' },
  { label: 'Massage thérapeutique', value: 'therapeutic_massage' },
  { label: 'Cupping / Ventouses', value: 'cupping' },
  { label: 'Kinesio Taping', value: 'kinesio_taping' },
  { label: 'Électrothérapie', value: 'electrotherapy' },
  { label: 'Ultrasons', value: 'ultrasound' },
  { label: 'Ondes de choc', value: 'shockwave' },
  { label: 'Rééducation post-chirurgicale', value: 'post_surgical_rehab' },
  { label: 'Rééducation oncologique', value: 'oncology_rehab' }
]

export const SPECIALIZATIONS_CONFIG = SPECIALIZATIONS.reduce(
  (acc, spec) => {
    if (
      typeof spec === 'object' &&
      spec !== null &&
      'type' in spec &&
      (spec.type === 'label' || spec.type === 'separator')
    ) {
      return acc
    }
    if (typeof spec === 'object' && spec !== null && 'value' in spec && 'label' in spec) {
      return { ...acc, [spec.value]: spec.label }
    }
    return acc
  },
  {} as Record<string, string>
)

export const getSpecializationLabel = (value: string) => SPECIALIZATIONS_CONFIG[value]
