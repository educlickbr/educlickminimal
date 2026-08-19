<script setup lang="ts">
import { useProgAtividadesCore } from "~/composables/programacao_atividades/useProgAtividadesCore";
import { useMinhasAtividades } from "~/composables/programacao_atividades/useMinhasAtividades";
import { useToast } from "~/composables/useToast";
import MinhasAtividadesPage from "~/components/minhas_atividades/MinhasAtividadesPage.vue";
import MinhasAtividadesSidebar from "~/components/minhas_atividades/MinhasAtividadesSidebar.vue";

const core = useProgAtividadesCore();
const toast = useToast();

const ctx = useMinhasAtividades({
    getEntidadeAtivaId: () => core.getEntidadeAtivaId(),
    garantirEntidade: () => core.garantirEntidade(),
    toast,
});
</script>

<template>
    <NuxtLayout name="base">
        <!-- Quadrante direito reservado no layout base -->
        <template #sidebar>
            <MinhasAtividadesSidebar :ctx="ctx" />
        </template>

        <div class="page-wrap">
            <MinhasAtividadesPage :ctx="ctx" :get-entidade-id="core.getEntidadeAtivaId" />
        </div>
    </NuxtLayout>
</template>

<style scoped>
.page-wrap {
    padding: 1.5rem 1.75rem;
    min-height: 100vh;
}
</style>
