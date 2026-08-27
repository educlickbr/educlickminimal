<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '~~/stores/app'
import { useAtribuicao } from '~/composables/atribuicao/useAtribuicao'
import AtribuicaoPage from '~/components/atribuicao/AtribuicaoPage.vue'

definePageMeta({ layout: 'base' })

const store = useAppStore()
const route = useRoute()

const fallbackId = '00ca60ea-6667-482d-8a96-09b877707b08'
const idEntidade = () => (route.query.id_entidade as string) || fallbackId

const ctx = useAtribuicao(idEntidade)

onMounted(async () => {
  if (!store.initialized) await store.initSession()
  await ctx.fetchDadosIniciais()
})
</script>

<template>
  <AtribuicaoPage :ctx="ctx" :idEntidade="idEntidade()" />
</template>

<style scoped>
/* SFC Style */
</style>
