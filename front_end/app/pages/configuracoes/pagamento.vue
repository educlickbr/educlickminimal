<template>
    <div class="flex flex-col h-full p-6">
        <!-- Banner de sucesso ao retornar do Stripe -->
        <div
            v-if="conectadoAgora"
            class="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-bold flex items-center gap-2"
        >
            <Icon name="ph:check-circle-bold" class="w-4 h-4 shrink-0" />
            Conta Stripe conectada com sucesso!
        </div>

        <div v-if="isLoading" class="flex-1 flex items-center justify-center">
            <div
                class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
            />
        </div>

        <div v-else class="max-w-lg">
            <p class="text-xs text-secondary/70 mb-6 leading-relaxed">
                Configure o gateway de pagamento para receber pagamentos de
                matrículas e vendas. Atualmente apenas Stripe é suportado.
            </p>

            <ConfigGatewayStatus
                :conectado="stripeConectado"
                :conectando="conectando"
                :ambiente="ambiente"
                :conta-id="contaId"
                @conectar="conectarStripe"
                @reconectar="conectarStripe"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useOfertaCore } from "~/composables/academico_oferta/useOfertaCore";
import { useConfigGateway } from "~/composables/configuracao-gateway/useConfigGateway";
import { useToast } from "~/composables/useToast";
import ConfigGatewayStatus from "~/components/configuracoes/ConfigGatewayStatus.vue";

definePageMeta({ layout: "base" });

const route = useRoute();
const toast = useToast();
const { garantirEntidade } = useOfertaCore();
const conectadoAgora = ref(route.query.stripe === "connected");

const {
    isLoading,
    conectando,
    stripeConectado,
    ambiente,
    contaId,
    fetchConfig,
    conectarStripe,
} = useConfigGateway({ garantirEntidade, toast });

onMounted(() => {
    fetchConfig();
});
</script>

<style scoped>
.pagamento-page {
    display: block;
}
</style>

