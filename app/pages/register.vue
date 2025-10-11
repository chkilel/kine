<script setup lang="ts">
import { ref } from 'vue'
import { authClient } from '~/app/lib/auth-client'

const email = ref('')
const password = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

async function onSubmit() {
  errorMessage.value = null
  isSubmitting.value = true
  const { error } = await authClient.signUp.email({
    email: email.value,
    password: password.value,
    callbackURL: '/settings'
  }, {
    onError(ctx) {
      errorMessage.value = ctx.error.message
    }
  })
  isSubmitting.value = false
}
</script>

<template>
  <UContainer class="py-10">
    <UCard>
      <template #header>
        <h1 class="text-xl font-semibold">Create Account</h1>
      </template>

      <UForm :state="{ email, password }" @submit="onSubmit">
        <UFormGroup label="Email" name="email">
          <UInput v-model="email" type="email" placeholder="you@example.com" />
        </UFormGroup>
        <UFormGroup label="Password" name="password" class="mt-4">
          <UInput v-model="password" type="password" placeholder="••••••••" />
        </UFormGroup>

        <div class="mt-6 flex items-center gap-3">
          <UButton type="submit" :loading="isSubmitting">Sign Up</UButton>
          <NuxtLink to="/login" class="text-sm text-primary">Sign in</NuxtLink>
        </div>

        <UAlert v-if="errorMessage" color="red" variant="soft" class="mt-4">{{ errorMessage }}</UAlert>
      </UForm>
    </UCard>
  </UContainer>
</template>