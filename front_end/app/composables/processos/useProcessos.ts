import { ref, computed } from "vue";
import { getSemestresParaDrop } from "~/utils/anoSemestre";

export function useProcessos(idEntidade: () => string) {
  // ── Estado ──────────────────────────────────────────────
  const loading = ref(false);
  const inscricoes = ref<any[]>([]);
  const fotos = ref<Record<string, string>>({});
  const filtroAnoSemestre = ref<string>("");
  const filtroPrograma = ref<string>("");
  const filtroBusca = ref("");

  // ── Paginação ──────────────────────────────────────────
  const pagina = ref(1);
  const total = ref(0);
  const limite = 20;
  const totalPaginas = computed(() => Math.ceil(total.value / limite) || 1);

  // ── Opções dos drops ───────────────────────────────────
  const opcoesAnoSemestre = computed(() => getSemestresParaDrop(3));

  const opcoesProgramas = computed(() => {
    const vistos = new Set<string>();
    return inscricoes.value
      .filter((i) => {
        if (!i.id_programa || !i.nome_display) return false;
        const key = String(i.id_programa);
        if (vistos.has(key)) return false;
        vistos.add(key);
        return true;
      })
      .map((i) => ({
        id: String(i.id_programa),
        nome: String(i.nome_display),
      }));
  });

  // ── Fetch ───────────────────────────────────────────────
  async function fetchInscricoes(idArea?: string | null) {
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

      const res = (await $fetch("/api/processos/inscricoes", {
        params,
      })) as any;
      if (res?.success && Array.isArray(res.itens)) {
        inscricoes.value = res.itens;
        total.value = res.total || 0;
        await fetchFotos(res.itens);
      }
    } catch (e) {
      console.error("Erro ao carregar inscrições:", e);
    } finally {
      loading.value = false;
    }
  }

  function irParaPagina(p: number) {
    pagina.value = p;
    // O watch na página vai disparar fetchInscricoes
  }

  // ── Fotos ───────────────────────────────────────────────
  async function fetchFotos(itens: any[]) {
    const idsComFoto = itens
      .filter((i) => i.id_foto)
      .map((i) => ({ id_inscricao: i.id, id_foto: i.id_foto }));

    if (idsComFoto.length === 0) return;

    const promessas = idsComFoto.map(async ({ id_inscricao, id_foto }) => {
      try {
        const signRes = (await $fetch("/api/r2/sign", {
          params: { id: id_foto },
        })) as any;
        if (signRes.signedUrl) {
          fotos.value[id_inscricao] = signRes.signedUrl;
        }
      } catch {
        // sem foto → avatar padrão
      }
    });
    await Promise.all(promessas);
  }

  // ── Reset ───────────────────────────────────────────────
  function resetFiltros() {
    filtroAnoSemestre.value = "";
    filtroPrograma.value = "";
    filtroBusca.value = "";
  }

  return {
    loading,
    inscricoes,
    fotos,
    filtroAnoSemestre,
    filtroPrograma,
    filtroBusca,
    opcoesAnoSemestre,
    opcoesProgramas,
    pagina,
    total,
    totalPaginas,
    fetchInscricoes,
    irParaPagina,
    resetFiltros,
  };
}
