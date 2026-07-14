import { ref, computed } from "vue";

/**
 * Composable para propostas/currículos recebidos (aba Currículos).
 */
export function useDocentesCurriculos(idEntidade: () => string) {
    // ── Estado ──────────────────────────────────────────────
    const loading = ref(false);
    const propostas = ref<any[]>([]);

    // ── Filtros ─────────────────────────────────────────────
    const filtro = ref<string>("todas"); // 'todas', 'nao_vistas', 'vistas', 'consideradas'

    // ── Paginação ──────────────────────────────────────────
    const pagina = ref(1);
    const total = ref(0);
    const limite = 20;
    const totalPaginas = computed(() => Math.ceil(total.value / limite) || 1);

    // ── Fetch ───────────────────────────────────────────────
    async function fetchPropostas() {
        loading.value = true;
        try {
            const res = (await $fetch("/api/docentes/curriculos", {
                params: {
                    id_entidade: idEntidade(),
                    filtro: filtro.value,
                    pagina: String(pagina.value),
                    limite: String(limite),
                },
            })) as any;
            if (res?.success) {
                propostas.value = res.itens || [];
                total.value = res.total || 0;
            }
        } catch (e) {
            console.error("Erro ao carregar propostas:", e);
        } finally {
            loading.value = false;
        }
    }

    // ── Ações ───────────────────────────────────────────────
    async function marcarVisto(id: string): Promise<boolean> {
        try {
            const res = (await $fetch("/api/docentes/curriculos", {
                method: "POST",
                body: { id, acao: "visto" },
            })) as any;
            if (res?.success) {
                const item = propostas.value.find((p) => p.id === id);
                if (item) item.visto = true;
                return true;
            }
            return false;
        } catch (e) {
            console.error("Erro ao marcar como visto:", e);
            return false;
        }
    }

    async function considerar(
        id: string,
        considerado: boolean,
    ): Promise<boolean> {
        try {
            const res = (await $fetch("/api/docentes/curriculos", {
                method: "POST",
                body: {
                    id,
                    acao: considerado ? "considerar" : "dispensar",
                },
            })) as any;
            if (res?.success) {
                const item = propostas.value.find((p) => p.id === id);
                if (item) item.considerado = considerado ? true : false;
                return true;
            }
            return false;
        } catch (e) {
            console.error("Erro ao considerar proposta:", e);
            return false;
        }
    }

    async function excluirProposta(id: string): Promise<boolean> {
        try {
            const res = (await $fetch("/api/docentes/curriculos", {
                method: "DELETE",
                params: { id },
            })) as any;
            if (res?.success) {
                await fetchPropostas();
                return true;
            }
            return false;
        } catch (e) {
            console.error("Erro ao excluir proposta:", e);
            return false;
        }
    }

    // ── Paginação ───────────────────────────────────────────
    function irParaPagina(p: number) {
        pagina.value = p;
    }

    return {
        loading,
        propostas,
        filtro,
        pagina,
        total,
        totalPaginas,
        fetchPropostas,
        marcarVisto,
        considerar,
        excluirProposta,
        irParaPagina,
    };
}

export type UseDocentesCurriculosReturn = ReturnType<typeof useDocentesCurriculos>;
