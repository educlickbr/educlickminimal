<template>
    <div class="flex flex-col h-full p-6">
        <!-- Top bar: apenas contador, sem título redundante -->
        <div class="flex items-center justify-between mb-4">
            <span class="text-[10px] font-black text-secondary/60 uppercase tracking-widest">
                {{
                    core.isLoadingProgramas.value
                        ? "Carregando..."
                        : core.programas.value.length + " programa(s) comercial(ais)"
                }}
            </span>
        </div>

        <div
            v-if="core.isLoadingProgramas.value"
            class="flex-1 flex items-center justify-center"
        >
            <div
                class="w-6 h-6 border-2 border-secondary/10 border-t-primary rounded-full animate-spin"
            />
        </div>

        <div
            v-else-if="core.programas.value.length === 0"
            class="flex-1 flex flex-col items-center justify-center gap-3 empty-state"
        >
            <Icon name="ph:package-bold" class="w-8 h-8 text-secondary/30" />
            <p class="text-sm font-bold text-text/80">
                Nenhum programa cadastrado
            </p>
            <p class="text-[10px] font-bold text-secondary/50 uppercase tracking-widest">
                Crie programas no módulo acadêmico primeiro
            </p>
        </div>

        <ProdutosTabLista
            v-else
            :programas="core.programasComProdutos.value"
            :ofertas-por-produto="core.ofertasPorProduto.value"
            :carregando-ofertas="core.carregandoOfertas.value"
            @expandir="core.fetchProdutosPorPrograma($event)"
            @expandir-oferta="core.fetchOfertasPorProduto($event)"
            @editar-produto="actions.handleEdit($event)"
            @novo-produto="actions.handleNewForPrograma($event)"
            @nova-oferta="abrirModalOferta($event)"
            @editar-oferta="abrirModalEditarOferta"
        />
    </div>

    <ModalProduto
        v-if="actions.isModalOpen.value"
        :produto="actions.selectedItem.value"
        :programas="core.programas.value"
        :programa-filtro="actions.filtroPrograma.value"
        :on-save="actions.handleSave"
        @close="actions.closeModal()"
    />

    <ModalOferta
        v-if="ofertaModalProdutoId"
        :produto-id="ofertaModalProdutoId"
        :oferta="ofertaEditData"
        :on-save="handleSaveOferta"
        @close="
            ofertaModalProdutoId = null;
            ofertaEditData = null;
        "
    />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAppStore } from "~~/stores/app";
import { useOfertaCore } from "~/composables/academico_oferta/useOfertaCore";
import { useProdutosCore } from "~/composables/produtos/useProdutosCore";
import { useProdutosActions } from "~/composables/produtos/useProdutosActions";
import { useToast } from "~/composables/useToast";
import ProdutosTabLista from "~/components/produtos/ProdutosTabLista.vue";
import ModalProduto from "~/components/produtos/ModalProduto.vue";
import ModalOferta from "~/components/produtos/ModalOferta.vue";

definePageMeta({ layout: "base" });

const store = useAppStore();
const toast = useToast();
const { getEntidadeAtivaId, garantirEntidade } = useOfertaCore();

const core = useProdutosCore({ getEntidadeAtivaId, garantirEntidade, toast });
const actions = useProdutosActions({
    garantirEntidade,
    toast,
    refresh: core.fetchProgramas,
});

const ofertaModalProdutoId = ref<string | null>(null);
const ofertaEditData = ref<any>(null);

function abrirModalOferta(produtoId: string) {
    ofertaModalProdutoId.value = produtoId;
    ofertaEditData.value = null;
}

function abrirModalEditarOferta(ofertaData: any, produtoId: string) {
    ofertaModalProdutoId.value = produtoId;
    ofertaEditData.value = ofertaData;
}

async function handleSaveOferta(data: any): Promise<boolean> {
    try {
        const id_entidade = await garantirEntidade();
        const res = (await $fetch("/api/comercial/ofertas", {
            method: "POST",
            body: { ...data, id_entidade, usuario_id: store.user_expandido_id },
        })) as any;
        if (res?.success) {
            toast.showToast(
                data.id ? "Oferta atualizada!" : "Oferta criada com sucesso!",
                { type: "success" },
            );
            core.upsertOfertaLocal(data.id_produto, {
                ...data,
                id: res.id || data.id,
            });
            ofertaModalProdutoId.value = null;
            ofertaEditData.value = null;
            return true;
        }
        throw new Error(res?.message || "Erro ao salvar oferta");
    } catch (e: any) {
        toast.showToast(e?.message || "Erro ao salvar oferta", {
            type: "error",
        });
        return false;
    }
}

onMounted(async () => {
    await core.fetchProgramas();
});
</script>

<style scoped>
.empty-state {
    background: var(--color-secondary-surface);
    border-radius: 14px;
    border: 1px dashed var(--color-divider);
}
</style>
