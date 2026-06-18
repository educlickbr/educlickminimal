/**
 * useFormFiles
 *
 * Composable reutilizável para upload/download/remoção de arquivos
 * em qualquer formulário. Usa R2 como storage.
 *
 * Dependências injetadas:
 * - answers, saveStatus → estado compartilhado do form
 * - saveAnswer → para persistir o fileId como resposta
 * - userExpandidoId → para contexto
 */

import { ref, type Ref } from "vue";

export function useFormFiles(deps: {
  answers: Ref<Record<string, any>>;
  saveStatus: Ref<Record<string, string>>;
  saveAnswer: (perguntaId: string, tipo?: string) => Promise<void>;
  userExpandidoId: () => string | null;
}) {
  const fileNames = ref<Record<string, string>>({});
  const fileLinks = ref<Record<string, string>>({});

  async function fetchFileInfo(perguntaId: string, fileId: string) {
    try {
      const res = (await $fetch("/api/r2/sign", {
        params: { id: fileId },
      })) as any;
      if (res.signedUrl) {
        fileLinks.value[perguntaId] = res.signedUrl;
        fileNames.value[perguntaId] = res.nomeOriginal || "Arquivo anexado";
      }
    } catch (e) {
      console.error("Erro ao buscar info do arquivo", e);
    }
  }

  async function viewFile(perguntaId: string) {
    const link = fileLinks.value[perguntaId];
    if (link) {
      window.open(link, "_blank");
    } else {
      const fileId = deps.answers.value[perguntaId];
      if (fileId) {
        await fetchFileInfo(perguntaId, fileId);
        if (fileLinks.value[perguntaId]) {
          window.open(fileLinks.value[perguntaId], "_blank");
        }
      }
    }
  }

  async function handleFileUpload(event: Event, perguntaId: string) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    deps.saveStatus.value[perguntaId] = "Fazendo upload...";

    const formData = new FormData();
    formData.append("file", file as Blob);
    formData.append("saveToDb", "true");
    formData.append("escopo", "respostas_user");

    try {
      const response = (await $fetch("/api/r2/upload", {
        method: "POST",
        body: formData,
      })) as any;

      if (response.success && response.dbRecord) {
        deps.answers.value[perguntaId] = response.dbRecord.id;
        fileNames.value[perguntaId] = response.originalName;
        fetchFileInfo(perguntaId, response.dbRecord.id);
        await deps.saveAnswer(perguntaId, "file");
      } else {
        deps.saveStatus.value[perguntaId] = "Erro ao processar arquivo";
      }
    } catch (e) {
      deps.saveStatus.value[perguntaId] = "Erro no upload";
      console.error(e);
    }
  }

  async function removeFile(perguntaId: string) {
    const fileId = deps.answers.value[perguntaId];
    if (!fileId) return;

    if (!confirm("Tem certeza que deseja apagar e substituir este arquivo?"))
      return;

    deps.saveStatus.value[perguntaId] = "Removendo...";

    try {
      const response = (await $fetch("/api/r2/delete", {
        method: "POST",
        body: { fileId },
      })) as any;

      if (response.success) {
        deps.answers.value[perguntaId] = null;
        await deps.saveAnswer(perguntaId, "file");
        deps.saveStatus.value[perguntaId] = "Removido com sucesso";
        setTimeout(() => {
          deps.saveStatus.value[perguntaId] = "";
        }, 3000);
      } else {
        deps.saveStatus.value[perguntaId] = "Erro ao apagar arquivo";
      }
    } catch (e) {
      deps.saveStatus.value[perguntaId] = "Erro ao remover";
      console.error(e);
    }
  }

  return {
    fileNames,
    fileLinks,
    fetchFileInfo,
    viewFile,
    handleFileUpload,
    removeFile,
  };
}
