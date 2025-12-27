import { inferAdditionalFields, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/vue'

import { additionalFields } from '~~/server/utils/auth'

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      schema: {
        member: {
          additionalFields
        }
      }
    }),
    inferAdditionalFields({
      // Additional fields to be inferred from user object
      user: additionalFields
    })
  ]
})
