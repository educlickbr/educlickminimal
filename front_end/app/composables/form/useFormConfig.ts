/**
 * useFormConfig
 *
 * Composable que carrega a configuração do formulário (blocos e perguntas)
 * via BFF, mesclando perguntas de sistema (sys-*) no primeiro bloco.
 *
 * Dependências injetadas:
 * - idEntidade, programa_id, area_id, tipo_proc, tipo_cand → para o fetch
 */

import { ref, computed } from "vue";

export function useFormConfig(deps: {
  idEntidade: () => string;
  programa_id: string;
  area_id: string;
  tipo_proc: string;
  tipo_cand: string;
}) {
  const loading = ref(true);
  const blocos = ref<any[]>([]);

  /** IDs de todas as perguntas (exceto sys-*), para carregar respostas */
  const allPerguntaIds = computed(() =>
    blocos.value
      .flatMap((b) => b.perguntas.map((p: any) => p.pergunta_id))
      .filter((id: string) => !id.startsWith("sys-")),
  );

  async function loadFormConfig() {
    loading.value = true;
    try {
      const configRes = (await $fetch("/api/form/config", {
        params: {
          id_entidade: deps.idEntidade(),
          programa_id: deps.programa_id !== "0" ? deps.programa_id : null,
          area_id: deps.area_id !== "0" ? deps.area_id : null,
          tipo_proc: deps.tipo_proc,
          tipo_cand: deps.tipo_cand,
        },
      })) as any;

      if (configRes.success) {
        let blocosData = configRes.blocos || [];

        if (blocosData.length === 0) {
          blocosData.push({
            bloco: "Dados Gerais",
            ordem: 0,
            perguntas: [],
          });
        }

        const sysQuestions = [
          {
            pergunta_id: "sys-nome",
            label: "Nome",
            tipo_pergunta: "text",
            largura: "1",
            obrigatorio: true,
          },
          {
            pergunta_id: "sys-sobrenome",
            label: "Sobrenome",
            tipo_pergunta: "text",
            largura: "1",
            obrigatorio: true,
          },
          {
            pergunta_id: "sys-email",
            label: "E-mail",
            tipo_pergunta: "email",
            largura: "2",
            obrigatorio: true,
            disabled: true,
          },
        ];

        blocosData[0].perguntas = [...sysQuestions, ...blocosData[0].perguntas];
        blocos.value = blocosData;
      }
    } catch (e) {
      console.error("Erro ao carregar form:", e);
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    blocos,
    allPerguntaIds,
    loadFormConfig,
  };
}
