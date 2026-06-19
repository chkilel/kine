// =============================================================================
// Moroccan Insurer Catalog
// =============================================================================
// Static reference data sourced from the official FMA (Fédération Marocaine
// des Assurances, formerly FMSAR) and ACAPS registries.
//
// This is compile-time reference data — not user-generated, rarely changes,
// same for every deployment. Do NOT add a database table for this.
//
// Curated to kinésithérapie-relevant operators (public social security,
// private health insurers, professional mutuelles). Specialized operators
// (assistance, reinsurance, export credit, takaful) are excluded.
//
// To handle deregistration: set `isActive: false` instead of removing the
// entry. This preserves historical references in org convention configs.

export interface InsurerEntry {
  /** Full legal name */
  name: string
  /** Short display name (falls back to `name` if absent) */
  shortName?: string
  /** Principal phone number */
  phone: string
  /** Street address (without city) */
  address: string
  /** City */
  city: string
  /** Official website, if available */
  website?: string
  /** false for deregistered/inactive operators (keeps entry for historical refs) */
  isActive: boolean
}

export const INSURERS_CONFIG = {
  // ---- Public / Mandatory Social Security ----
  cnss: {
    name: 'Caisse Nationale de Sécurité Sociale',
    shortName: 'CNSS',
    phone: '0522 54 70 54',
    address: '649, Bd Mohamed V',
    city: 'Casablanca',
    website: 'https://www.cnss.ma/',
    isActive: true
  },
  cnops: {
    name: 'Caisse Nationale des Organismes de Prévoyance Sociale',
    shortName: 'CNOPS',
    phone: '0537 70 57 23',
    address: '4, Rue Al Khalil, B.P. 209',
    city: 'Rabat',
    website: 'http://www.cnops.org.ma/',
    isActive: true
  },

  // ---- Private / Commercial Insurance ----
  'wafa-assurance': {
    name: 'Wafa Assurance',
    phone: '0522 54 55 55',
    address: '1, Bd Abdelmoumen',
    city: 'Casablanca',
    website: 'https://www.wafaassurance.ma/fr',
    isActive: true
  },
  rma: {
    name: 'RMA Assurance',
    shortName: 'RMA',
    phone: '0522 54 63 33',
    address: '83, Av de l’Armée Royale',
    city: 'Casablanca',
    website: 'https://www.rmaassurance.com/fr',
    isActive: true
  },
  'sanlam-maroc': {
    name: 'Sanlam Maroc',
    phone: '0522 47 40 40',
    address: '216, Bd Zerktouni',
    city: 'Casablanca',
    website: 'https://sanlam.ma/',
    isActive: true
  },
  'axa-maroc': {
    name: 'AXA Assurance Maroc',
    shortName: 'AXA',
    phone: '0522 88 91 91',
    address: '120-122, Bd Abdelmoumen',
    city: 'Casablanca',
    isActive: true
  },
  atlantasanad: {
    name: 'AtlantaSanad',
    phone: '0522 95 76 76',
    address: '181, Bd d’Anfa',
    city: 'Casablanca',
    website: 'https://www.atlantasanad.ma/',
    isActive: true
  },
  'allianz-maroc': {
    name: 'Allianz Maroc',
    shortName: 'Allianz',
    phone: '0801 00 18 18',
    address: '166, Bd Mohamed V',
    city: 'Casablanca',
    website: 'https://allianz.ma/',
    isActive: true
  },
  'la-marocaine-vie': {
    name: 'La Marocaine Vie',
    phone: '0522 43 83 00',
    address: '162, Bd d’Anfa',
    city: 'Casablanca',
    isActive: true
  },

  // ---- Professional Mutuelles ----
  mamda: {
    name: 'Mutuelle Agricole Marocaine d’Assurance',
    shortName: 'MAMDA',
    phone: '0537 27 50 50',
    address: '2, Rue Moulay Slimane',
    city: 'Rabat',
    website: 'https://www.mamda-mcma.ma/',
    isActive: true
  },
  mcma: {
    name: 'Mutuelle des Cadres et Militaires du Maroc',
    shortName: 'MCMA',
    phone: '0537 27 50 50',
    address: '2, Rue Moulay Slimane',
    city: 'Rabat',
    isActive: true
  }
} satisfies Record<string, InsurerEntry>

export type InsurerSlug = keyof typeof INSURERS_CONFIG

// =============================================================================
// Derived Collections
// =============================================================================

export const INSURER_OPTIONS = (Object.entries(INSURERS_CONFIG) as [InsurerSlug, InsurerEntry][])
  .filter(([, insurer]) => insurer.isActive)
  .map(([slug, insurer]) => ({
    slug,
    label: insurer.shortName ?? insurer.name,
    ...insurer
  }))

export const INSURER_SLUGS = Object.keys(INSURERS_CONFIG) as InsurerSlug[]

// =============================================================================
// Helpers
// =============================================================================

export function getInsurer(slug: string): InsurerEntry | null {
  const entry: InsurerEntry | undefined = INSURERS_CONFIG[slug as InsurerSlug]
  return entry ?? null
}

export function getInsurerLabel(slug: InsurerSlug): string {
  const insurer: InsurerEntry = INSURERS_CONFIG[slug]
  return insurer.shortName ?? insurer.name
}

export function isInsurerSlug(value: string): value is InsurerSlug {
  return value in INSURERS_CONFIG
}
