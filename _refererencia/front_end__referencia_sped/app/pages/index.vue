<script setup lang="ts">
import { useAppStore } from '~/stores/app';
const user = useSupabaseUser()
const redirectCookie = useCookie<any>('redirect_after_login')
const client = useSupabaseClient()
const normalizeAnoSemestre = (value: unknown) => String(value ?? '').trim().toLowerCase()

// Role ID for Candidato
const CANDIDATO_ROLE_ID = 'd19ba89e-9a15-4194-929a-db47695fb2be';

onMounted(async () => {
  // Add a small delay for better UX (optional, but helps avoid layout shift flickering)
  await new Promise(resolve => setTimeout(resolve, 500))

  if (user.value) {
    // Logged In Logic
    if (redirectCookie.value && redirectCookie.value.procedencia_form) {
      // User came from "Inscrever-se" flow
      console.log('User logged in with pending form. Redirecting...')
      const target = redirectCookie.value

      // Clear flag/cookie to avoid loop (or just clear procedencia_form)
      redirectCookie.value = null

      const targetArea = String(target?.meta?.category || target?.query?.area || '').trim().toLowerCase()
      const targetAnoSemestre = String(target?.meta?.anoSemestre || '').trim()

      if (targetArea === 'regulares' && targetAnoSemestre) {
        try {
          const data = await $fetch<any>('/api/inscricao/elegibilidade-regulares')
          const blockedPeriods = Array.isArray(data?.anos_semestres_bloqueados)
            ? data.anos_semestres_bloqueados
            : []

          const isBlocked = blockedPeriods
            .map((period: unknown) => normalizeAnoSemestre(period))
            .includes(normalizeAnoSemestre(targetAnoSemestre))

          if (isBlocked) {
            return navigateTo({
              path: '/processo_seletivo',
              query: {
                bloqueio_regulares: targetAnoSemestre
              }
            })
          }
        } catch (error) {
          console.error('Erro ao validar redirect de Regulares após login:', error)
          return navigateTo('/processo_seletivo')
        }
      }

      navigateTo({
        path: target.path,
        query: target.query
      })
    } else {
    // Check User Role Logic using App Store (populated via /api/me)
      const appStore = useAppStore();
      
      // Ensure session is initialized
      if (!appStore.initialized) {
        await appStore.initSession();
      }

      if (appStore.role && appStore.role.papel_id === CANDIDATO_ROLE_ID) {
          // Is Candidato -> Processo Seletivo
          navigateTo('/processo_seletivo');
      } else {
          // Others -> Inicio (FullPageMenu) or fallback if no role yet
          navigateTo('/inicio');
      }
    }
  } else {
    // Not Logged In -> Processo Seletivo
    navigateTo('/processo_seletivo')
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-background text-text">
     <!-- While deciding, we show nothing or just the overlay which is global -->
     <LoadingOverlay :show="true" />
  </div>
</template>
