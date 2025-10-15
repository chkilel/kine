<script lang="ts" setup>
const router = useRouter()
  const {data: session} = await authClient.useSession(useFetch)

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          session.value = null
          router.push('/login') // redirect to login page
        }
      }
    })
  }
</script>

<template>
  <div class="container mx-auto">
    <h1 class="text-center text-3xl font-bold">Hello World</h1>

    <!-- Logout button -->
    <UButton @click="handleSignOut" class="btn btn-error">Se déconnecter</UButton>
  </div>
</template>
