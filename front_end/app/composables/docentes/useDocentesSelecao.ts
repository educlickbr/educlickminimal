import { ref, computed } from "vue";

/**
 * Composable para inscrições em editais e avaliação de candidatos.
 */
export function useDocentesSelecao(idEntidade: () => string) {
    // ── Estado ──────────────────────────────────────────────
    const loading = ref(false);
    const inscricoes = ref<any[]>([]);

    // ── Filtros ─────────────────────────────────────────────
    const editaisDisponiveis = ref<any[]>([]);
    const editalSelecionado = ref<string>("");

    // ── Paginação ──────────────────────────────────────────
    const pagina = ref(1);
    const total = ref(0);
    const limite = 20;
    const totalPaginas = computed(() => Math.ceil(total.value / limite) || 1);

    // ── Fetch editais para dropdown ─────────────────────────
    async function fetchEditaisDropdown() {
        try {
            const res = (await $fetch("/api/docentes/editais-dropdown", {
                params: { id_entidade: idEntidade() },
            })) as any;
            if (res?.success) {
                editaisDisponiveis.value = res.itens || [];
                if (res.itens?.length > 0 && !editalSelecionado.value) {
                    editalSelecionado.value = res.itens[0].id;
                }
            }
        } catch (e) {
            console.error("Erro ao carregar editais (dropdown):", e);
        }
    }

    // ── Fetch inscrições ────────────────────────────────────
    async function fetchInscricoes() {
        if (!editalSelecionado.value) {
            inscricoes.value = [];
            total.value = 0;
            return;
        }
        loading.value = true;
        try {
            const res = (await $fetch("/api/docentes/inscricoes", {
                params: {
                    id_edital: editalSelecionado.value,
                    pagina: String(pagina.value),
                    limite: String(limite),
                },
            })) as any;
            if (res?.success) {
                inscricoes.value = res.itens || [];
                total.value = res.total || 0;
            }
        } catch (e) {
            console.error("Erro ao carregar inscrições:", e);
        } finally {
            loading.value = false;
        }
    }

    // ── Avaliar inscrição ───────────────────────────────────
    async function avaliarInscricao(
        id: string,
        status: string,
    ): Promise<boolean> {
        try {
            const res = (await $fetch("/api/docentes/inscricoes", {
                method: "POST",
                body: { id, status },
            })) as any;
            if (res?.success) {
                // Atualiza in-place
                const item = inscricoes.value.find((i) => i.id === id);
                if (item) item.status = status;
                return true;
            }
            return false;
        } catch (e) {
            console.error("Erro ao avaliar inscrição:", e);
            return false;
        }
    }

    // ── Paginação ───────────────────────────────────────────
    function irParaPagina(p: number) {
        pagina.value = p;
    }

    return {
        loading,
        inscricoes,
        editaisDisponiveis,
        editalSelecionado,
        pagina,
        total,
        totalPaginas,
        fetchEditaisDropdown,
        fetchInscricoes,
        avaliarInscricao,
        irParaPagina,
    };
}

export type UseDocentesSelecaoReturn = ReturnType<typeof useDocentesSelecao>;
