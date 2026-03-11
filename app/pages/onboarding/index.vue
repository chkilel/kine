<script setup lang="ts">
  import type { StepperItem, Form, FormError } from '@nuxt/ui'

  definePageMeta({
    layout: false
  })

  const { checkSlug } = useOrganization()
  const toast = useToast()

  interface StepperExpose {
    next: () => void
    prev: () => void
    hasNext: Ref<boolean>
    hasPrev: Ref<boolean>
  }

  const stepper = useTemplateRef<StepperExpose>('stepper')
  const form = useTemplateRef<Form<OnboardingData>>('form')

  // ─── Per-step Zod schemas ─────────────────────────────────────────────────────

  const stepIndex = ref(0)

  const isSubmitting = ref(false)
  const isValidatingSlug = ref(false)
  const slugError = ref<string | null>(null)
  const slugValid = ref(false)
  const hasManuallyEditedSlug = ref(false)

  const steps = [
    {
      slot: 'identity' as const,
      title: 'Identité',
      description: 'Nom et identifiant',
      icon: 'i-hugeicons-building-03'
    },
    {
      slot: 'contact' as const,
      title: 'Contact',
      description: 'Email et téléphone',
      icon: 'i-hugeicons-telephone'
    },
    {
      slot: 'address' as const,
      title: 'Adresse',
      description: 'Localisation du cabinet',
      icon: 'i-hugeicons-map-pin'
    },
    {
      slot: 'rates' as const,
      title: 'Tarifs',
      description: 'Tarifs des séances',
      icon: 'i-hugeicons-wallet-01'
    }
  ] satisfies StepperItem[]

  const onboardingData = ref<OnboardingData>({
    name: '',
    slug: '',
    contact: {
      email: '',
      phones: [{ id: crypto.randomUUID(), number: '', category: 'clinic' }]
    },
    address: {
      street: '',
      postalCode: '',
      city: '',
      country: 'Maroc'
    },
    sessionRates: {
      clinic: 150,
      home: 300,
      telehealth: 120
    }
  })

  const { ignoreUpdates } = watchIgnorable(
    () => onboardingData.value.slug,
    () => {
      hasManuallyEditedSlug.value = true
    }
  )

  watch(
    () => onboardingData.value.name,
    (newName) => {
      if (!hasManuallyEditedSlug.value) {
        ignoreUpdates(() => {
          onboardingData.value.slug = generateSlug(newName)
        })
      }
    }
  )

  const validateSlug = useDebounceFn(async (slug: string) => {
    isValidatingSlug.value = true
    slugError.value = null
    slugValid.value = false

    try {
      const result = await checkSlug({ slug })
      if (result.error) {
        slugError.value = 'Ce slug est déjà utilisé'
      } else {
        slugValid.value = true
      }
    } catch {
      slugError.value = 'Erreur lors de la validation'
    } finally {
      isValidatingSlug.value = false
    }
  }, 500)

  watch(
    () => onboardingData.value.slug,
    (newSlug) => {
      slugValid.value = false
      if (!newSlug || newSlug.length < 5) return
      validateSlug(newSlug)
    }
  )

  const isLastStep = computed(() => stepIndex.value === steps.length - 1)

  const handleNext = async () => {
    const schema = stepSchemas[stepIndex.value]
    if (!schema) return

    const result = schema.safeParse(onboardingData.value)

    if (!result.success) {
      const errors: FormError[] = result.error.issues.map((issue) => ({
        name: issue.path.join('.'),
        message: issue.message
      }))
      form.value?.setErrors(errors)
      return
    }

    // On step 0, also block if slug availability is pending or failed
    if (stepIndex.value === 0 && (isValidatingSlug.value || slugError.value)) {
      if (slugError.value) {
        form.value?.setErrors([{ name: 'slug', message: slugError.value }])
      }
      return
    }

    stepper.value?.next()
    stepIndex.value++
  }

  const handlePrev = () => {
    stepper.value?.prev()
    stepIndex.value--
  }

  const handleSubmit = async () => {
    isSubmitting.value = true
    slugError.value = null

    try {
      const validationResult = onboardingSchema.safeParse(onboardingData.value)

      if (!validationResult.success) {
        const errors = validationResult.error.issues.map((e) => e.message).join(', ')
        throw new Error(errors)
      }

      const requestFetch = useRequestFetch()
      const org = await requestFetch<Organization>('/api/organizations', {
        method: 'POST',
        body: onboardingData.value
      })

      if (org) {
        await authClient.organization.setActive({ organizationId: org.id })
        await authClient.getSession()

        toast.add({
          title: 'Organisation créée',
          description: 'Bienvenue dans votre espace cabinet !',
          color: 'success'
        })

        await navigateTo('/')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
      toast.add({ title: 'Erreur', description: errorMessage, color: 'error' })
      throw error
    } finally {
      isSubmitting.value = false
    }
  }
</script>

<template>
  <div class="bg-muted relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-6 md:p-10">
    <!-- Background decoration -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="bg-primary/10 absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl" />
      <div class="bg-primary/5 absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-3xl" />
    </div>

    <div class="relative flex w-full max-w-2xl flex-col gap-6">
      <!-- Header -->
      <div class="space-y-1 text-center">
        <div class="bg-primary/10 mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl">
          <UIcon name="i-hugeicons-stethoscope" class="text-primary h-6 w-6" />
        </div>
        <h1 class="text-3xl font-bold tracking-tight">Créer votre cabinet</h1>
        <p class="text-muted-foreground text-sm">Quelques informations pour démarrer</p>
      </div>
      <UPageCard>
        <UForm ref="form" :state="onboardingData" :schema="onboardingSchema" class="space-y-0" @submit="handleSubmit">
          <UStepper ref="stepper" :items="steps" :disabled="true" class="w-full">
            <!-- Step 1: Identité -->
            <template #identity>
              <div class="space-y-5 pt-2">
                <div class="space-y-1">
                  <h2 class="text-lg font-semibold">Identité du cabinet</h2>
                  <p class="text-muted-foreground text-sm">Comment souhaitez-vous nommer votre structure ?</p>
                </div>

                <UFormField label="Nom de l'organisation" name="name" required>
                  <UInput
                    v-model="onboardingData.name"
                    placeholder="Cabinet Kiné Maroc"
                    size="lg"
                    class="w-full"
                    autofocus
                  />
                </UFormField>

                <UFormField label="Identifiant unique (slug)" name="slug" required class="w-full">
                  <template #description>
                    <span v-if="slugError" class="text-error flex items-center gap-1 text-xs">
                      <UIcon name="i-hugeicons-alert-circle" class="h-3 w-3" />
                      {{ slugError }}
                    </span>
                    <span v-else-if="slugValid" class="text-success flex items-center gap-1 text-xs">
                      <UIcon name="i-hugeicons-task-done-01" class="h-3 w-3" />
                      Disponible
                    </span>
                    <span v-else class="text-muted-foreground text-xs">
                      Auto-généré · utilisé dans l'URL de votre cabinet
                    </span>
                  </template>
                  <UFieldGroup class="w-full">
                    <UBadge color="neutral" variant="outline" size="lg" label="kinedesk.com/" />

                    <UInput
                      v-model="onboardingData.slug"
                      placeholder="cabinet-kine-maroc"
                      size="lg"
                      :color="slugError ? 'error' : slugValid ? 'success' : undefined"
                      :loading="isValidatingSlug"
                      class="w-full"
                    />
                  </UFieldGroup>
                </UFormField>
              </div>
            </template>

            <!-- Step 2: Contact -->
            <template #contact>
              <div class="space-y-5 pt-2">
                <div class="space-y-1">
                  <h2 class="text-lg font-semibold">Informations de contact</h2>
                  <p class="text-muted-foreground text-sm">Comment vos patients peuvent-ils vous joindre ?</p>
                </div>

                <UFormField label="Adresse email" name="contact.email" required>
                  <UInput
                    v-model="onboardingData.contact.email"
                    type="email"
                    placeholder="contact@cabinet.ma"
                    size="lg"
                    leading-icon="i-hugeicons-mail-01"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Numéro de téléphone" name="contact.phones.0.number" required>
                  <UInput
                    v-model="onboardingData.contact.phones[0]!.number"
                    type="tel"
                    placeholder="+212 600 000 000"
                    size="lg"
                    leading-icon="i-hugeicons-call-02"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </template>

            <!-- Step 3: Adresse -->
            <template #address>
              <div class="space-y-5 pt-2">
                <div class="space-y-1">
                  <h2 class="text-lg font-semibold">Adresse du cabinet</h2>
                  <p class="text-muted-foreground text-sm">Où est situé votre cabinet principal ?</p>
                </div>

                <UFormField label="Adresse complète" name="address.street" required>
                  <UTextarea
                    v-model="onboardingData.address.street"
                    :rows="3"
                    placeholder="12, Rue des Orangers, Agdal"
                    class="w-full"
                  />
                </UFormField>

                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Code postal" name="address.postalCode">
                    <UInput v-model="onboardingData.address.postalCode" placeholder="10000" class="w-full" />
                  </UFormField>
                  <UFormField label="Ville" name="address.city" required>
                    <UInput v-model="onboardingData.address.city" placeholder="Rabat" class="w-full" />
                  </UFormField>
                </div>

                <UFormField label="Pays" name="address.country">
                  <UInput v-model="onboardingData.address.country" disabled class="w-full opacity-60" />
                </UFormField>
              </div>
            </template>

            <!-- Step 4: Tarifs -->
            <template #rates>
              <div class="space-y-5 pt-2">
                <div class="space-y-1">
                  <h2 class="text-lg font-semibold">Tarifs des séances</h2>
                  <p class="text-muted-foreground text-sm">Définissez vos tarifs de base en dirhams (DH)</p>
                </div>

                <div class="grid grid-cols-1 gap-3">
                  <div
                    v-for="location in LOCATION_OPTIONS"
                    :key="location.value"
                    class="border-border/60 bg-muted/30 hover:bg-muted/60 flex items-center gap-4 rounded-xl border p-4 transition-colors"
                  >
                    <div class="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                      <UIcon :name="location.icon" class="text-primary h-5 w-5" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium">{{ location.label }}</p>
                      <p class="text-muted-foreground text-xs">{{ location.desc }}</p>
                    </div>
                    <UFormField :name="`sessionRates.${location.value}`" class="w-28 shrink-0">
                      <UInput
                        v-model.number="(onboardingData.sessionRates as any)[location.value]"
                        type="number"
                        size="md"
                        class="w-full"
                      >
                        <template #trailing>
                          <span class="text-muted-foreground/60 pl-1 text-sm select-none">DH</span>
                        </template>
                      </UInput>
                    </UFormField>
                  </div>
                </div>
              </div>
            </template>
          </UStepper>

          <!-- Navigation controls -->
          <div class="border-default mt-6 flex items-center justify-between border-t pt-6">
            <UButton
              type="button"
              variant="ghost"
              leading-icon="i-hugeicons-arrow-left-01"
              :disabled="stepIndex === 0"
              @click="handlePrev"
            >
              Retour
            </UButton>

            <UButton v-if="!isLastStep" type="button" trailing-icon="i-hugeicons-arrow-right-01" @click="handleNext">
              Suivant
            </UButton>

            <UButton v-else type="submit" :loading="isSubmitting" leading-icon="i-hugeicons-task-done-01">
              Créer le cabinet
            </UButton>
          </div>
        </UForm>
      </UPageCard>

      <p class="text-muted-foreground/60 text-center text-xs">
        Vous pourrez modifier ces informations dans les paramètres
      </p>
    </div>
  </div>
</template>
