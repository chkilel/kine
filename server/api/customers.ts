import type { User } from '~/types'

// Mock customers data - in a real implementation, this would come from a database table
// with organizationId column for proper multi-tenancy
const allCustomers: User[] = [
  {
    id: 1,
    name: 'Alex Smith',
    email: 'alex.smith@example.com',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=1'
    },
    status: 'subscribed',
    location: 'New York, USA',
    organizationId: 'org-1' // Mock organization association
  },
  {
    id: 2,
    name: 'Jordan Brown',
    email: 'jordan.brown@example.com',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=2'
    },
    status: 'unsubscribed',
    location: 'London, UK',
    organizationId: 'org-1'
  },
  {
    id: 3,
    name: 'Taylor Green',
    email: 'taylor.green@example.com',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=3'
    },
    status: 'bounced',
    location: 'Paris, France',
    organizationId: 'org-2'
  },
  {
    id: 4,
    name: 'Morgan White',
    email: 'morgan.white@example.com',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=4'
    },
    status: 'subscribed',
    location: 'Berlin, Germany',
    organizationId: 'org-2'
  },
  {
    id: 5,
    name: 'Casey Gray',
    email: 'casey.gray@example.com',
    avatar: {
      src: 'https://i.pravatar.cc/128?u=5'
    },
    status: 'subscribed',
    location: 'Tokyo, Japan',
    organizationId: 'org-1'
  }
]

export default defineEventHandler(async () => {
  // TODO: Get current organization from Better Auth session
  // For now, we'll return all customers
  // In a real implementation, you would:
  // 1. Get active organization from session
  // 2. Filter customers by organizationId

  return allCustomers
})
