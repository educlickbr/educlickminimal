/**
 * useFormCep
 *
 * Composable reutilizável para campos de CEP e endereço.
 * Gerencia busca de CEP (ViaCEP), máscara, unlock de campos dependentes.
 *
 * Dependências injetadas:
 * - answers, saveStatus → estado compartilhado do form
 * - saveAnswer, saveMultipleAnswers → para persistir dados do endereço
 * - blocos → para mapear perguntas por nome_interno
 */

import { ref, computed, type Ref } from "vue";
import {
  CEP_DEPENDENT_FIELDS,
  VIACEP_FIELD_MAP,
  buscarCEP,
  mascaraCEP,
} from "../../utils/viacep";

export function useFormCep(deps: {
  answers: Ref<Record<string, any>>;
  saveStatus: Ref<Record<string, string>>;
  saveAnswer: (perguntaId: string, tipo?: string) => Promise<void>;
  saveMultipleAnswers: (perguntaIds: string[]) => Promise<void>;
  blocos: () => any[];
}) {
  const enderecoFieldsUnlocked = ref(false);
  const cepLookupLoading = ref(false);

  const perguntasMapByInternalName = computed(() => {
    const blocosVal = deps.blocos();
    return new Map<string, any>(
      blocosVal.flatMap((b: any) =>
        (b.perguntas as any[])
          .filter(
            (p) =>
              typeof p.nome_interno === "string" && p.nome_interno.length > 0,
          )
          .map((p) => [p.nome_interno, p] as [string, any]),
      ),
    );
  });

  const hasCepQuestion = computed(() =>
    perguntasMapByInternalName.value.has("cep"),
  );

  function isCepQuestion(tipo?: string) {
    return tipo === "cep";
  }

  function isEnderecoQuestion(tipo?: string, nomeInterno?: string) {
    return (
      tipo === "endereco" || CEP_DEPENDENT_FIELDS.includes(nomeInterno || "")
    );
  }

  function updateEnderecoFieldsUnlockedState() {
    if (!hasCepQuestion.value) {
      enderecoFieldsUnlocked.value = true;
      return;
    }

    const cepQuestion = perguntasMapByInternalName.value.get("cep");
    const cepValue = cepQuestion
      ? String(deps.answers.value[cepQuestion.pergunta_id] || "")
      : "";
    const hasValidCep = cepValue.replace(/\D/g, "").length === 8;
    const hasAnyDependentAnswer = CEP_DEPENDENT_FIELDS.some((field: string) => {
      const question = perguntasMapByInternalName.value.get(field);
      return question && deps.answers.value[question.pergunta_id];
    });

    enderecoFieldsUnlocked.value = hasValidCep || hasAnyDependentAnswer;
  }

  function isEnderecoFieldDisabled(pergunta: any) {
    if (pergunta.disabled) return true;
    if (!isEnderecoQuestion(pergunta.tipo_pergunta, pergunta.nome_interno))
      return false;
    if (!CEP_DEPENDENT_FIELDS.includes(pergunta.nome_interno)) return false;
    if (!hasCepQuestion.value) return false;
    return !enderecoFieldsUnlocked.value || cepLookupLoading.value;
  }

  function formatCepInput(id: string) {
    const currentValue = deps.answers.value[id];
    if (currentValue === undefined || currentValue === null) return;

    deps.answers.value[id] = mascaraCEP(String(currentValue));

    if (String(deps.answers.value[id]).replace(/\D/g, "").length < 8) {
      enderecoFieldsUnlocked.value = false;
    }
  }

  async function applyCepAddressData(data: Record<string, string>) {
    const perguntaIdsToSave: string[] = [];

    for (const [viaCepField, nomeInterno] of Object.entries(
      VIACEP_FIELD_MAP,
    ) as [string, string][]) {
      const pergunta = perguntasMapByInternalName.value.get(nomeInterno);
      if (!pergunta) continue;

      deps.answers.value[pergunta.pergunta_id] = data[viaCepField] || "";
      perguntaIdsToSave.push(pergunta.pergunta_id);
    }

    enderecoFieldsUnlocked.value = true;

    if (perguntaIdsToSave.length > 0) {
      await deps.saveMultipleAnswers(perguntaIdsToSave);
    }
  }

  async function handleCepBlur(pergunta: any) {
    formatCepInput(pergunta.pergunta_id);

    const value = String(deps.answers.value[pergunta.pergunta_id] || "");
    const cepDigits = value.replace(/\D/g, "");

    if (cepDigits.length === 0) {
      deps.saveStatus.value[pergunta.pergunta_id] = "";
      enderecoFieldsUnlocked.value = false;
      return;
    }

    if (cepDigits.length !== 8) {
      deps.saveStatus.value[pergunta.pergunta_id] = "CEP inválido";
      enderecoFieldsUnlocked.value = false;
      return;
    }

    cepLookupLoading.value = true;
    deps.saveStatus.value[pergunta.pergunta_id] = "Buscando CEP...";

    try {
      const endereco = await buscarCEP(cepDigits);

      if (!endereco) {
        deps.saveStatus.value[pergunta.pergunta_id] = "CEP não encontrado";
        enderecoFieldsUnlocked.value = false;
        return;
      }

      deps.answers.value[pergunta.pergunta_id] = mascaraCEP(
        endereco.cep || cepDigits,
      );
      await deps.saveAnswer(pergunta.pergunta_id, "cep");
      await applyCepAddressData(endereco as unknown as Record<string, string>);
    } catch (e) {
      deps.saveStatus.value[pergunta.pergunta_id] = "Erro ao buscar CEP";
      enderecoFieldsUnlocked.value = false;
      console.error("Erro ao consultar CEP:", e);
    } finally {
      cepLookupLoading.value = false;
    }
  }

  return {
    enderecoFieldsUnlocked,
    cepLookupLoading,
    hasCepQuestion,
    isCepQuestion,
    isEnderecoQuestion,
    isEnderecoFieldDisabled,
    formatCepInput,
    handleCepBlur,
    updateEnderecoFieldsUnlockedState,
  };
}
