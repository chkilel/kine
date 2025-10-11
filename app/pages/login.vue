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
  const { error } = await authClient.signIn.email({
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
        <h1 class="text-xl font-semibold">Login</h1>
      </template>

      <UForm :state="{ email, password }" @submit="onSubmit">
        <UFormGroup label="Email" name="email">
          <UInput v-model="email" type="email" placeholder="you@example.com" />
        </UFormGroup>
        <UFormGroup label="Password" name="password" class="mt-4">
          <UInput v-model="password" type="password" placeholder="••••••••" />
        </UFormGroup>

        <div class="mt-6 flex items-center gap-3">
          <UButton type="submit" :loading="isSubmitting">Sign In</UButton>
          <NuxtLink to="/register" class="text-sm text-primary">Create an account</NuxtLink>
        </div>

        <UAlert v-if="errorMessage" color="red" variant="soft" class="mt-4">{{ errorMessage }}</UAlert>
      </UForm>
    </UCard>
  </UContainer>
</template>