import { inferAdditionalFields, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient({
  plugins: [
    organizationClient(),
    inferAdditionalFields({
      // Additional fields to be inferred from the user object
      user: {
        firstName: {
          type: 'string'
        },
        lastName: {
          type: 'string'
        }
      }
    })
  ]
})
