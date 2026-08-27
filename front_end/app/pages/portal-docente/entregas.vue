<script setup lang="ts">
import { useProgAtividadesCore } from "~/composables/programacao_atividades/useProgAtividadesCore";
import { useDocenteEntregas } from "~/composables/programacao_atividades/useDocenteEntregas";
import { useToast } from "~/composables/useToast";
import DocenteEntregasPage from "~/components/programacao_atividades/DocenteEntregasPage.vue";
import DocenteEntregasSidebar from "~/components/programacao_atividades/DocenteEntregasSidebar.vue";

const core = useProgAtividadesCore();
const toast = useToast();

const ctx = useDocenteEntregas({
    getEntidadeAtivaId: () => core.getEntidadeAtivaId(),
    garantirEntidade: () => core.garantirEntidade(),
    toast,
});
</script>

<template>
    <NuxtLayout name="base">
        <!-- Quadrante direito reservado no layout base -->
        <template #sidebar>
            <DocenteEntregasSidebar :ctx="ctx" />
        </template>

        <div class="page-wrap">
            <DocenteEntregasPage :ctx="ctx" />
        </div>
    </NuxtLayout>
</template>

<style scoped>
.page-wrap {
    padding: 1.5rem 1.75rem;
    min-height: 100vh;
}
</style>
