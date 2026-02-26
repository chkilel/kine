import { inferAdditionalFields, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/vue'

import { additionalFields, organizationAdditionalFields } from '~~/server/utils/auth'

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      schema: {
        member: {
          additionalFields
        },
        organization: {
          additionalFields: organizationAdditionalFields
        }
      }
    }),
    inferAdditionalFields({
      // Additional fields to be inferred from user object
      user: additionalFields
    })
  ]
})
