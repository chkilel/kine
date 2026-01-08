<script setup lang="ts">
  // Component for patient billing/invoicing tab
</script>

<template>
  <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
    <div class="flex flex-col gap-6 lg:col-span-2">
      <!-- Recent Invoices -->
      <AppCard title="Factures récentes" class="overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead class="bg-muted text-toned text-xs uppercase">
              <tr>
                <th scope="col" class="px-6 py-3">Date</th>
                <th scope="col" class="px-6 py-3">Montant</th>
                <th scope="col" class="px-6 py-3">Statut</th>
                <th scope="col" class="px-6 py-3"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr class="bg-default hover:bg-muted dark:border-muted border-b">
                <td class="text-default px-6 py-4 font-medium whitespace-nowrap">08 Oct. 2024</td>
                <td class="text-toned px-6 py-4">50,00 €</td>
                <td class="px-6 py-4">
                  <UBadge color="success" variant="subtle" size="xs">Payé</UBadge>
                </td>
                <td class="px-6 py-4 text-right">
                  <UButton variant="ghost" color="primary" size="sm" class="inline-flex items-center gap-1.5">
                    <UIcon name="i-lucide-download" />
                    <span>Télécharger</span>
                  </UButton>
                </td>
              </tr>
              <tr class="bg-default hover:bg-muted dark:border-muted border-b">
                <td class="text-default px-6 py-4 font-medium whitespace-nowrap">01 Oct. 2024</td>
                <td class="text-toned px-6 py-4">50,00 €</td>
                <td class="px-6 py-4">
                  <UBadge color="warning" variant="subtle" size="xs">En attente</UBadge>
                </td>
                <td class="px-6 py-4 text-right">
                  <UButton variant="ghost" color="primary" size="sm" class="inline-flex items-center gap-1.5">
                    <UIcon name="i-lucide-download" />
                    <span>Télécharger</span>
                  </UButton>
                </td>
              </tr>
              <tr class="bg-default hover:bg-muted">
                <td class="text-default px-6 py-4 font-medium whitespace-nowrap">17 Sept. 2024</td>
                <td class="text-toned px-6 py-4">75,00 €</td>
                <td class="px-6 py-4">
                  <UBadge color="error" variant="subtle" size="xs">Impayé</UBadge>
                </td>
                <td class="px-6 py-4 text-right">
                  <UButton variant="ghost" color="primary" size="sm" class="inline-flex items-center gap-1.5">
                    <UIcon name="i-lucide-receipt" />
                    <span>Générer</span>
                  </UButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>

      <!-- Payments Received -->
      <AppCard variant="outline">
        <template #header>
          <h2 class="text-default text-lg font-bold">Paiements reçus</h2>
        </template>

        <ul class="space-y-3">
          <li class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-3">
              <div class="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full">
                <UIcon name="i-lucide-credit-card" class="text-lg" />
              </div>
              <div>
                <p class="text-default font-medium">Carte Bancaire</p>
                <p class="text-muted">08 Oct. 2024</p>
              </div>
            </div>
            <span class="text-default font-semibold">50,00 €</span>
          </li>
          <li class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-3">
              <div class="bg-success/10 text-success flex size-8 items-center justify-center rounded-full">
                <UIcon name="i-lucide-banknote" class="text-lg" />
              </div>
              <div>
                <p class="text-default font-medium">Espèces</p>
                <p class="text-muted">24 Sept. 2024</p>
              </div>
            </div>
            <span class="text-default font-semibold">50,00 €</span>
          </li>
          <li class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-3">
              <div class="bg-info/10 text-info flex size-8 items-center justify-center rounded-full">
                <UIcon name="i-lucide-hospital" class="text-lg" />
              </div>
              <div>
                <p class="text-default font-medium">Tiers payant (Mutuelle ABC)</p>
                <p class="text-muted">01 Oct. 2024</p>
              </div>
            </div>
            <span class="text-default font-semibold">En attente de remboursement</span>
          </li>
        </ul>
      </AppCard>
    </div>

    <!-- Sidebar -->
    <div class="flex flex-col gap-6 lg:col-span-1">
      <AppCard variant="outline">
        <template #header>
          <h2 class="text-default text-lg font-bold">À facturer / En attente</h2>
        </template>

        <div class="space-y-4">
          <div class="bg-error/10 flex items-center justify-between rounded-lg p-3">
            <div>
              <p class="text-error font-semibold">2 séances non facturées</p>
              <p class="text-error/70 text-sm">Montant total: 125,00 €</p>
            </div>
            <UIcon name="i-lucide-alert-circle" class="text-error" />
          </div>
          <div class="bg-warning/10 flex items-center justify-between rounded-lg p-3">
            <div>
              <p class="text-warning font-semibold">1 paiement en attente</p>
              <p class="text-warning/70 text-sm">Tiers payant: 50,00 €</p>
            </div>
            <UIcon name="i-lucide-clock" class="text-warning" />
          </div>
        </div>

        <div class="border-default border-t pt-4">
          <UButton color="primary" size="lg" class="flex w-full items-center justify-center gap-2">
            <UIcon name="i-lucide-plus-circle" />
            <span>Créer une nouvelle facture</span>
          </UButton>
        </div>
      </AppCard>
    </div>
  </div>
</template>
