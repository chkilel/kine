import { describe, it, expect } from 'vitest'
import { priceItemSchema, RESERVED_PRICE_ITEM_CODE } from './base.types'
import { orgPricingSchema } from './org.types'

describe('priceItemSchema', () => {
  const validItem = {
    id: 'item-1',
    code: 'MASSAGE_30',
    description: 'Massage 30min',
    rateCent: { clinic: 3000, home: 4000, telehealth: 2000 },
    isDefault: false
  }

  it('should validate a valid price item', () => {
    expect(priceItemSchema.safeParse(validItem).success).toBe(true)
  })

  it('should validate a DEFAULT code item', () => {
    const defaultItem = { ...validItem, code: RESERVED_PRICE_ITEM_CODE, isDefault: true }
    expect(priceItemSchema.safeParse(defaultItem).success).toBe(true)
  })
})

describe('orgPricingSchema', () => {
  it('should validate with at least one priceItem', () => {
    const result = orgPricingSchema.safeParse({
      priceItems: [
        {
          id: 'item-1',
          code: 'DEFAULT',
          description: 'Tarif de séance',
          rateCent: { clinic: 5000, home: 6500, telehealth: 4000 },
          isDefault: true
        }
      ]
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty priceItems', () => {
    const result = orgPricingSchema.safeParse({ priceItems: [] })
    expect(result.success).toBe(false)
  })

  it('should reject missing priceItems', () => {
    const result = orgPricingSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
