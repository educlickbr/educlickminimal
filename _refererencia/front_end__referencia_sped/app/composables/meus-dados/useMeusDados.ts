import { $fetch as ofetch } from "ofetch";
import { useAppStore } from "~/stores/app";
import { generateUuidFileName, fileToBase64 } from "../../../utils/file";

export function useMeusDados() {
  const store = useAppStore();

  // --- State: Turmas ---
  const minhasTurmas = ref<any[]>([]);
  const loadingTurmas = ref(false);

  // --- State: Form ---
  const formData = ref<any>(null); // { curso, area, semestre, perguntas, ... }
  const loadingForm = ref(false);
  const errorForm = ref<string | null>(null);

  // --- State: Answers ---
  const answers = ref<Record<string, any>>({});
  const isSaving = ref<Record<string, boolean>>({});
  const lastSaved = ref<Record<string, string>>({});
  const saveTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

  // --- State: Turma selecionada ---
  const selectedTurmaId = ref<string | null>(null);

  // --- Actions: Turmas ---
  const fetchMinhasTurmas = async () => {
    if (!store.user_expandido_id) return;
    loadingTurmas.value = true;
    try {
      const data = await ofetch("/api/matriculas/minhas-turmas", {
        params: { id_user_expandido: store.user_expandido_id },
      });
      minhasTurmas.value = data || [];
    } catch (e) {
      console.error("Erro ao buscar turmas:", e);
    } finally {
      loadingTurmas.value = false;
    }
  };

  // --- Actions: Form ---
  const fetchFormData = async (turmaId: string) => {
    loadingForm.value = true;
    errorForm.value = null;
    formData.value = null;
    answers.value = {};

    try {
      const data = await ofetch("/api/inscricao/form", {
        query: {
          id: turmaId,
          tipo: "estudante",
          processo: "matricula", // bypass do guard de bloqueio de regulares
        },
      });

      formData.value = data;

      // Inicializa answers com as respostas já existentes
      if (data?.perguntas) {
        const initial: Record<string, any> = {};
        data.perguntas.forEach((q: any) => {
          if (q.resposta !== undefined && q.resposta !== null) {
            if (q.tipo === "boolean") {
              initial[q.id_pergunta] =
                q.resposta === true || String(q.resposta) === "true";
            } else if (q.tipo === "data" && typeof q.resposta === "string") {
              initial[q.id_pergunta] = q.resposta.split("T")[0];
            } else {
              initial[q.id_pergunta] = q.resposta;
            }
          } else if (q.artificial) {
            if (q.pergunta === "nome") initial[q.id_pergunta] = store.nome;
            if (q.pergunta === "sobrenome")
              initial[q.id_pergunta] = store.sobrenome;
            if (q.pergunta === "email")
              initial[q.id_pergunta] = store.user?.email;
          }
        });
        answers.value = initial;
      }
    } catch (e: any) {
      console.error("Erro ao buscar dados do formulário:", e);
      errorForm.value = e.message || "Erro ao carregar dados.";
    } finally {
      loadingForm.value = false;
    }
  };

  // --- Actions: Save ---
  const saveAnswer = async (
    perguntaId: string,
    value: any,
    turmaId: string,
  ) => {
    if (value === undefined || value === null || String(value).trim() === "")
      return;

    isSaving.value[perguntaId] = true;

    // Debounce: cancela timeout pendente para esta pergunta
    if (saveTimeouts[perguntaId]) {
      clearTimeout(saveTimeouts[perguntaId]);
    }

    saveTimeouts[perguntaId] = setTimeout(async () => {
      try {
        const res: any = await ofetch("/api/common/respostas/save", {
          method: "POST",
          body: {
            p_id_turma: turmaId,
            p_id_pergunta: perguntaId,
            p_resposta: String(value),
            p_user_expandido_id: store.user_expandido_id,
          },
        });

        const savedOk =
          res && (res.success === true || res.data?.sucesso === true);

        if (!savedOk) {
          console.error("Erro ao salvar resposta:", res);
        } else {
          lastSaved.value[perguntaId] = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      } catch (e) {
        console.error("Erro ao salvar resposta:", e);
      } finally {
        isSaving.value[perguntaId] = false;
        delete saveTimeouts[perguntaId];
      }
    }, 500);
  };

  // --- Actions: Upload ---
  const uploadFile = async (
    perguntaId: string,
    file: File,
    turmaId: string,
  ) => {
    try {
      const uuidName = generateUuidFileName(file.name);
      const base64 = await fileToBase64(file);

      await ofetch("/api/inscricao/upload", {
        method: "POST",
        body: {
          id_turma: turmaId,
          id_pergunta: perguntaId,
          fileName: uuidName,
          originalName: file.name,
          fileBase64: base64,
        },
      });

      return { ok: true, uuidName };
    } catch (e: any) {
      console.error("Erro ao fazer upload:", e);
      return { ok: false, error: e };
    }
  };

  // --- Actions: Delete File ---
  const deleteFile = async (
    perguntaId: string,
    fileName: string,
    turmaId: string,
  ) => {
    try {
      await ofetch("/api/inscricao/delete-file", {
        method: "POST",
        body: {
          id_turma: turmaId,
          id_pergunta: perguntaId,
          fileName,
        },
      });
      return { ok: true };
    } catch (e: any) {
      console.error("Erro ao deletar arquivo:", e);
      return { ok: false, error: e };
    }
  };

  return {
    // State: Turmas
    minhasTurmas,
    loadingTurmas,
    // State: Form
    formData,
    loadingForm,
    errorForm,
    // State: Answers
    answers,
    isSaving,
    lastSaved,
    // State: Turma selecionada
    selectedTurmaId,
    // Actions: Turmas
    fetchMinhasTurmas,
    // Actions: Form
    fetchFormData,
    // Actions: Save
    saveAnswer,
    // Actions: Upload
    uploadFile,
    // Actions: Delete File
    deleteFile,
  };
}
