/**
 * useFormInscricao
 *
 * Composable que orquestra o fluxo de inscrição em processo seletivo:
 * - Verifica se o usuário já possui inscrição (GET)
 * - Finaliza/cria a inscrição (POST)
 * - Fornece feedback via toast e estados reativos
 *
 * Uso:
 *   const { verificando, enviando, inscricaoExistente, verificarInscricao, finalizarInscricao } = useFormInscricao()
 */

import { ref } from "vue";
import { $fetch } from "ofetch";

export interface InscricaoData {
  id: string;
  id_usuario: string;
  id_programa: string;
  id_processo: string;
  status_dados: string;
  status_documentacao: string;
  status_candidatura: string;
  tipo_processo: string;
  tipo_candidatura: string;
  criado_em: string;
}

export function useFormInscricao() {
  const verificando = ref(false);
  const enviando = ref(false);
  const inscricaoExistente = ref<InscricaoData | null>(null);
  const inscricaoCriada = ref<InscricaoData | null>(null);
  const erro = ref<string | null>(null);

  /**
   * Verifica se o usuário já tem inscrição neste processo.
   * Chamar ao entrar na página do formulário para bloqueio precoce.
   */
  async function verificarInscricao(params: {
    id_processo: string;
    tipo_proc: string;
    tipo_cand: string;
  }): Promise<{ existe: boolean; inscricao: InscricaoData | null }> {
    verificando.value = true;
    erro.value = null;

    try {
      const res = (await $fetch("/api/form/inscricao", {
        method: "GET",
        params: {
          id_processo: params.id_processo,
          tipo_proc: params.tipo_proc,
          tipo_cand: params.tipo_cand,
        },
      })) as any;

      if (!res.success) {
        erro.value = res.message || "Erro ao verificar inscrição";
        return { existe: false, inscricao: null };
      }

      inscricaoExistente.value = res.inscricao ?? null;

      return {
        existe: !!res.inscricao,
        inscricao: res.inscricao ?? null,
      };
    } catch (e: any) {
      erro.value = e?.message || "Erro de conexão ao verificar inscrição";
      console.error("useFormInscricao.verificarInscricao:", e);
      return { existe: false, inscricao: null };
    } finally {
      verificando.value = false;
    }
  }

  /**
   * Finaliza a inscrição: cria o registro na tabela aca_processo_seletivo_inscricoes.
   * Retorna o resultado para o componente decidir o que fazer (redirecionar, etc).
   */
  async function finalizarInscricao(params: {
    id_processo: string;
    tipo_proc: string;
    tipo_cand: string;
    toast?: {
      showToast: (
        msg: string,
        opts?: { duration?: number; type?: "info" | "error" | "success" },
      ) => void;
    };
  }): Promise<{
    sucesso: boolean;
    inscricao: InscricaoData | null;
    jaExistia: boolean;
  }> {
    enviando.value = true;
    erro.value = null;

    try {
      const res = (await $fetch("/api/form/inscricao", {
        method: "POST",
        body: {
          id_processo: params.id_processo,
          tipo_proc: params.tipo_proc,
          tipo_cand: params.tipo_cand,
        },
      })) as any;

      if (!res.success) {
        erro.value = res.message || "Erro ao finalizar inscrição";
        params.toast?.showToast?.(erro.value!, { type: "error" });
        return { sucesso: false, inscricao: null, jaExistia: false };
      }

      const inscricao = res.inscricao as InscricaoData | null;

      // Detecta se já existia comparando com o estado anterior
      const jaExistia = !!inscricaoExistente.value;

      inscricaoCriada.value = inscricao;
      inscricaoExistente.value = inscricao;

      const msg = jaExistia
        ? "Você já estava inscrito neste processo."
        : "Inscrição finalizada com sucesso!";

      params.toast?.showToast?.(msg, { type: "success" });

      return { sucesso: true, inscricao, jaExistia };
    } catch (e: any) {
      erro.value = e?.message || "Erro de conexão ao finalizar inscrição";
      console.error("useFormInscricao.finalizarInscricao:", e);
      params.toast?.showToast?.(erro.value!, { type: "error" });
      return { sucesso: false, inscricao: null, jaExistia: false };
    } finally {
      enviando.value = false;
    }
  }

  /** Limpa os estados para uma nova operação */
  function reset() {
    inscricaoExistente.value = null;
    inscricaoCriada.value = null;
    erro.value = null;
    verificando.value = false;
    enviando.value = false;
  }

  return {
    // estados reativos
    verificando,
    enviando,
    inscricaoExistente,
    inscricaoCriada,
    erro,
    // ações
    verificarInscricao,
    finalizarInscricao,
    reset,
  };
}
