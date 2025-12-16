import { inferAdditionalFields, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/vue'

export const authClient = createAuthClient({
  plugins: [
    organizationClient(),
    inferAdditionalFields({
      // Additional fields to be inferred from user object
      user: {
        firstName: {
          type: 'string'
        },
        lastName: {
          type: 'string'
        },
        specialization: {
          type: 'string[]',
          required: false,
          input: false
        },
        licenseNumber: {
          type: 'string',
          required: false,
          input: false
        },
        defaultSessionDuration: {
          type: 'number',
          required: false,
          input: false
        },
        phoneNumbers: {
          type: 'json',
          required: false,
          input: false
        }
      }
    })
  ]
})
