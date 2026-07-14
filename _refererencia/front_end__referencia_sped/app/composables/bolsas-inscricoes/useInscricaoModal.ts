import { ref, computed } from "vue";
import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";
import { useAppStore } from "~/stores/app";

export function useInscricaoModal() {
  const { showToast } = useToast();
  const store = useAppStore();

  const showModal = ref(false);
  const selectedEdital = ref<any>(null);
  const file = ref<File | null>(null);
  const aceite = ref(false);
  const cpf = ref("");
  const banco = ref("");
  const agencia = ref("");
  const tipoConta = ref("");
  const conta = ref("");
  const chavePix = ref("");
  const isSubmitting = ref(false);
  const statusText = ref("Confirmar Inscrição");

  const isFormValid = computed(() => {
    return (
      !!file.value &&
      aceite.value &&
      cpf.value.trim() !== "" &&
      banco.value.trim() !== "" &&
      agencia.value.trim() !== "" &&
      tipoConta.value !== "" &&
      conta.value.trim() !== "" &&
      chavePix.value.trim() !== ""
    );
  });

  const handleInscrever = (edital: any) => {
    selectedEdital.value = edital;
    showModal.value = true;
    file.value = null;
    aceite.value = false;
    cpf.value = "";
    banco.value = "";
    agencia.value = "";
    tipoConta.value = "";
    conta.value = "";
    chavePix.value = "";
  };

  const closeModal = () => {
    showModal.value = false;
  };

  const handleFileUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      file.value = files.item(0);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const b64 = result.split(",")[1];
        if (b64) resolve(b64);
        else reject(new Error("Falha ao ler arquivo"));
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const submitInscricao = async (onSuccess?: () => void) => {
    if (!selectedEdital.value || !file.value) {
      showToast("Atenção: Por favor, anexe o comprovante (CadUnico).", {
        type: "info",
      });
      return false;
    }

    if (!aceite.value) {
      showToast("Atenção: É necessário aceitar os termos do edital.", {
        type: "error",
      });
      return false;
    }

    if (!store.user_expandido_id) {
      showToast(
        "Erro: ID do aluno (Expandido) não identificado. Recarregue a página.",
        { type: "error" },
      );
      return false;
    }

    isSubmitting.value = true;
    try {
      // 1. Upload File
      statusText.value = "Enviando arquivo...";
      const fileExt = file.value.name.split(".").pop();
      const editalId = selectedEdital.value.id;
      const fileName = `${editalId}_${Date.now()}.${fileExt}`;
      const base64 = await fileToBase64(file.value);

      const uploadData: any = await ofetch("/api/bolsas/inscricao/upload", {
        method: "POST",
        body: { fileName, fileBase64: base64 },
      });

      if (!uploadData || !uploadData.success) {
        throw new Error("Falha no upload do arquivo.");
      }

      // 2. Create Submission
      statusText.value = "Salvando inscrição...";
      await ofetch("/api/bolsas/inscricao", {
        method: "POST",
        body: {
          id_edital: editalId,
          id_aluno: store.user_expandido_id,
          aceite: aceite.value,
          arquivo_cad_unico: uploadData.fileName,
          cpf: cpf.value || null,
          banco: banco.value || null,
          agencia: agencia.value || null,
          tipo_conta: tipoConta.value || null,
          conta: conta.value || null,
          chave_pix: chavePix.value || null,
        },
      });

      showToast("Sucesso: Inscrição realizada com sucesso!", {
        type: "success",
      });
      showModal.value = false;
      onSuccess?.();
      return true;
    } catch (error: any) {
      console.error(error);
      showToast(
        `Erro: ${error.statusMessage || error.message || "Erro ao realizar inscrição."}`,
        { type: "error" },
      );
      return false;
    } finally {
      isSubmitting.value = false;
      statusText.value = "Confirmar Inscrição";
    }
  };

  return {
    showModal,
    selectedEdital,
    file,
    aceite,
    cpf,
    banco,
    agencia,
    tipoConta,
    conta,
    chavePix,
    isFormValid,
    isSubmitting,
    statusText,
    handleInscrever,
    closeModal,
    handleFileUpload,
    submitInscricao,
  };
}
