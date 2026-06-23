/**
 * useMeusProcessos
 *
 * Composable para a página Meus Processos — visão do aluno.
 * Busca inscrições do próprio usuário com paginação.
 */
import { ref, computed } from "vue";

const ROMANO_POR_EXTENSO: Record<string, string> = {
  Is: "1º Semestre",
  IIs: "2º Semestre",
};

export function useMeusProcessos() {
  const inscricoes = ref<any[]>([]);
  const isLoading = ref(false);
  const pagina = ref(1);
  const total = ref(0);
  const LIMITE = 20;

  const totalPaginas = computed(() => Math.ceil(total.value / LIMITE));

  async function fetchInscricoes(p?: number) {
    if (p !== undefined) pagina.value = p;
    isLoading.value = true;
    try {
      const res = (await $fetch("/api/meus-processos", {
        params: { pagina: pagina.value, limite: LIMITE },
      })) as any;
      if (res?.success) {
        inscricoes.value = res.itens || [];
        total.value = res.total || 0;
      }
    } catch (e: any) {
      console.error("Erro ao buscar inscrições:", e);
    } finally {
      isLoading.value = false;
    }
  }

  function irParaPagina(p: number) {
    if (p < 1 || p > totalPaginas.value) return;
    pagina.value = p;
    fetchInscricoes(p);
  }

  /** "26Is" → "2026 · 1º Semestre" */
  function formatarAnoSemestre(raw: string | null): string {
    if (!raw) return "";
    const match = raw.match(/^(\d+)(I+s)$/);
    if (!match) return raw;
    const ano = `20${match[1]}`;
    const sem = ROMANO_POR_EXTENSO[match[2]!] || match[2]!;
    return `${ano} · ${sem}`;
  }

  /** Formata data ISO → dd/mm/aaaa */
  function formatarData(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR");
  }

  return {
    inscricoes,
    isLoading,
    pagina,
    total,
    totalPaginas,
    fetchInscricoes,
    irParaPagina,
    formatarAnoSemestre,
    formatarData,
  };
}
