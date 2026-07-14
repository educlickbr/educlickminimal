import { ref, computed } from "vue";
import { getSemestresParaDrop } from "~/utils/anoSemestre";

/**
 * Composable de dados da página /matriculas.
 * Padrão baseado em useProcessos.ts, adaptado para a tabela aca_matricula.
 */
export function useMatriculas(idEntidade: () => string) {
    // ── Estado ──────────────────────────────────────────────
    const loading = ref(false);
    const matriculas = ref<any[]>([]);
    const fotos = ref<Record<string, string>>({});

    // ── Filtros ─────────────────────────────────────────────
    const filtroAnoSemestre = ref<string>("");
    const filtroTurma = ref<string>("");
    const filtroBusca = ref("");
    const filtroStatus = ref<string>(""); // '' = todos, 'ativa', 'inativa'

    // ── Paginação ──────────────────────────────────────────
    const pagina = ref(1);
    const total = ref(0);
    const limite = 20;
    const totalPaginas = computed(() => Math.ceil(total.value / limite) || 1);

    // ── Opções dos drops ───────────────────────────────────
    const opcoesAnoSemestre = computed(() => getSemestresParaDrop(3));

    // Turmas: extraídas dos resultados carregados (client-side)
    const opcoesTurmas = computed(() => {
        const vistos = new Set<string>();
        return matriculas.value
            .filter((m) => {
                const t = m.turma;
                if (!t || !t.id_turma || !t.nome_turma) return false;
                const key = String(t.id_turma);
                if (vistos.has(key)) return false;
                vistos.add(key);
                return true;
            })
            .map((m) => ({
                id: String(m.turma.id_turma),
                nome: String(m.turma.nome_turma),
                ano_semestre: m.turma.ano_semestre || "",
            }));
    });

    // Programas: extraídos dos resultados (client-side, igual processos)
    const opcoesProgramas = computed(() => {
        const vistos = new Set<string>();
        return matriculas.value
            .filter((m) => {
                if (!m.id_programa || !m.programa_descricao) return false;
                const key = String(m.id_programa);
                if (vistos.has(key)) return false;
                vistos.add(key);
                return true;
            })
            .map((m) => ({
                id: String(m.id_programa),
                nome: String(m.programa_descricao),
            }));
    });

    // ── Filtro client-side: turma ──────────────────────────
    const matriculasVisiveis = computed(() => {
        const lista = matriculas.value;
        if (!filtroTurma.value) return lista;
        return lista.filter(
            (m) => m.turma && String(m.turma.id_turma) === filtroTurma.value,
        );
    });

    // ── Fetch ───────────────────────────────────────────────
    async function fetchMatriculas(idArea?: string | null) {
        loading.value = true;
        try {
            const params: Record<string, string> = {
                id_entidade: idEntidade(),
                pagina: String(pagina.value),
                limite: String(limite),
            };
            if (idArea && idArea !== "todas") params.id_area = idArea;
            if (filtroAnoSemestre.value)
                params.ano_semestre = filtroAnoSemestre.value;
            if (filtroBusca.value) params.busca = filtroBusca.value;
            if (filtroStatus.value) params.status = filtroStatus.value;

            const res = (await $fetch("/api/matriculas/lista", {
                params,
            })) as any;

            if (res?.success && Array.isArray(res.itens)) {
                matriculas.value = res.itens;
                total.value = res.total || 0;
                await fetchFotos(res.itens);
            }
        } catch (e) {
            console.error("Erro ao carregar matrículas:", e);
        } finally {
            loading.value = false;
        }
    }

    function irParaPagina(p: number) {
        pagina.value = p;
    }

    // ── Fotos ───────────────────────────────────────────────
    async function fetchFotos(itens: any[]) {
        const idsComFoto = itens
            .filter((i) => i.id_foto)
            .map((i) => ({ id_matricula: i.id, id_foto: i.id_foto }));

        if (idsComFoto.length === 0) return;

        const promessas = idsComFoto.map(
            async ({ id_matricula, id_foto }) => {
                try {
                    const signRes = (await $fetch("/api/r2/sign", {
                        params: { id: id_foto },
                    })) as any;
                    if (signRes.signedUrl) {
                        fotos.value[id_matricula] = signRes.signedUrl;
                    }
                } catch {
                    // sem foto → avatar padrão
                }
            },
        );
        await Promise.all(promessas);
    }

    // ── Atualização in-place (para reatividade após inativar) ─
    function atualizarStatusInPlace(id: string, novoStatus: string) {
        const item = matriculas.value.find((m) => m.id === id);
        if (item) {
            item.status = novoStatus;
        }
    }

    // ── Reset ───────────────────────────────────────────────
    function resetFiltros() {
        filtroAnoSemestre.value = "";
        filtroTurma.value = "";
        filtroBusca.value = "";
        filtroStatus.value = "";
    }

    return {
        loading,
        matriculas,
        fotos,
        filtroAnoSemestre,
        filtroTurma,
        filtroBusca,
        filtroStatus,
        opcoesAnoSemestre,
        opcoesTurmas,
        opcoesProgramas,
        matriculasVisiveis,
        pagina,
        total,
        totalPaginas,
        fetchMatriculas,
        irParaPagina,
        atualizarStatusInPlace,
        resetFiltros,
    };
}
