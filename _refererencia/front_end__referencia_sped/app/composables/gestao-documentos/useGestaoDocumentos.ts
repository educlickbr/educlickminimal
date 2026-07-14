import { $fetch as ofetch } from "ofetch";
import { ref } from "vue";
import { useToast } from "../../../composables/useToast";
import {
  generateUuidFileName,
  fileToBase64,
  validateFile,
} from "../../../utils/file";

export function useGestaoDocumentos() {
  const { showToast } = useToast();

  // ── Constantes ────────────────────────────────────────────────
  const areaOptions = [
    { label: "Todas as Áreas", value: null },
    { label: "Regulares", value: "regulares" },
    { label: "Extensão", value: "extensao" },
    { label: "Cursos Livres", value: "cursos_livres" },
    { label: "Especialização", value: "especializacao" },
    { label: "Eventos / Editais", value: "eventos_editais" },
    { label: "Jornadas", value: "jornadas" },
    { label: "Colaboradores", value: "colaboradores" },
  ];

  const escopoOptions = [
    { label: "Geral", value: "geral" },
    { label: "Área", value: "area" },
    { label: "Turma", value: "turma" },
  ];

  const publicadoOptions = [
    { label: "Todos", value: null },
    { label: "Publicado", value: "true" },
    { label: "Não publicado", value: "false" },
  ];

  const areaLabel = (area: string | null) =>
    areaOptions.find((o) => o.value === area)?.label ?? area ?? "—";

  const areaBadgeClass = (area: string | null) => {
    const map: Record<string, string> = {
      regulares: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      extensao: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      cursos_livres: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      especializacao: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      eventos_editais: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      jornadas: "bg-pink-500/10 text-pink-400 border-pink-500/20",
      colaboradores: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
    return map[area ?? ""] ?? "bg-white/5 text-secondary border-white/10";
  };

  // ── State ─────────────────────────────────────────────────────
  const isLoading = ref(false);
  const isSaving = ref(false);
  const isDeleting = ref(false);

  const documentos = ref<any[]>([]);
  const pagination = ref({ pagina_atual: 1, qtd_paginas: 1, total: 0 });
  const LIMITE = 15;

  const hashBaseLocal = ref<string | null>(null);

  // Modal state
  const showModal = ref(false);
  const showConfirmDelete = ref(false);
  const selectedDoc = ref<any | null>(null);

  // File Upload State
  const fileInput = ref<HTMLInputElement | null>(null);
  const file = ref<File | null>(null);
  const dragging = ref(false);
  const uploading = ref(false);
  const errorMsg = ref<string | null>(null);

  // Form
  const form = ref({
    id: null as string | null,
    nome_documento: "",
    descricao: "",
    arquivo: "",
    escopo: "geral" as "geral" | "area" | "turma",
    area: null as string | null,
    id_turma: null as string | null,
    publicado: false,
    vigencia_ini: "",
    vigencia_fim: "",
  });

  // Filters
  const filters = ref({
    area: null as string | null,
    publicado: null as string | null,
    vigencia_ini: "",
    vigencia_fim: "",
  });

  // ── Hash Base ─────────────────────────────────────────────────
  const fetchHashBase = async () => {
    try {
      const res = (await ofetch("/api/refresh-hash-documentos-cursos")) as {
        hash_base?: string;
      };
      const hashBase = res?.hash_base;
      if (hashBase) hashBaseLocal.value = hashBase;
    } catch (e) {
      console.error("Erro ao buscar hash_base", e);
    }
  };

  // ── Fetch ─────────────────────────────────────────────────────
  const fetchDocumentos = async (pagina = 1) => {
    isLoading.value = true;
    try {
      const data: any = await ofetch("/api/gestao-documentos", {
        params: {
          area: filters.value.area || null,
          publicado: filters.value.publicado || null,
          vigencia_ini: filters.value.vigencia_ini || null,
          vigencia_fim: filters.value.vigencia_fim || null,
          pagina,
          limite: LIMITE,
        },
      });
      documentos.value = data.itens ?? [];
      pagination.value = {
        pagina_atual: data.pagina ?? pagina,
        qtd_paginas: data.qtd_paginas ?? 1,
        total: data.total ?? 0,
      };
    } catch {
      showToast("Erro ao buscar documentos", { type: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  // ── Modal Helpers ─────────────────────────────────────────────
  const isoToDateInput = (iso: string) =>
    new Date(iso).toISOString().substring(0, 10);

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
  };

  const openCreate = () => {
    form.value = {
      id: null,
      nome_documento: "",
      descricao: "",
      arquivo: "",
      escopo: "geral",
      area: null,
      id_turma: null,
      publicado: false,
      vigencia_ini: "",
      vigencia_fim: "",
    };
    file.value = null;
    errorMsg.value = null;
    uploading.value = false;
    dragging.value = false;
    showModal.value = true;
  };

  const openEdit = (doc: any) => {
    form.value = {
      id: doc.id,
      nome_documento: doc.nome_documento,
      descricao: doc.descricao ?? "",
      arquivo: doc.arquivo ?? "",
      escopo: doc.escopo,
      area: doc.area ?? null,
      id_turma: doc.id_turma ?? null,
      publicado: doc.publicado ?? false,
      vigencia_ini: doc.vigencia_ini ? isoToDateInput(doc.vigencia_ini) : "",
      vigencia_fim: doc.vigencia_fim ? isoToDateInput(doc.vigencia_fim) : "",
    };
    file.value = null;
    errorMsg.value = null;
    uploading.value = false;
    dragging.value = false;
    showModal.value = true;
  };

  const openDelete = (doc: any) => {
    selectedDoc.value = doc;
    showConfirmDelete.value = true;
  };

  // ── File Upload Helpers ───────────────────────────────────────
  const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const f = target.files[0];
      if (f) processFile(f);
    }
  };

  const handleDrop = (event: DragEvent) => {
    dragging.value = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const f = event.dataTransfer.files[0];
      if (f) processFile(f);
    }
  };

  const processFile = (selectedFile: File) => {
    errorMsg.value = null;
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    const { valid, error } = validateFile(selectedFile, allowedTypes);
    if (!valid) {
      errorMsg.value = error || "Arquivo inválido.";
      return;
    }
    file.value = selectedFile;
  };

  const removeFile = () => {
    file.value = null;
  };

  // ── Save (Upsert) ─────────────────────────────────────────────
  const save = async () => {
    if (!form.value.nome_documento.trim()) {
      showToast("Nome do documento é obrigatório", { type: "error" });
      return;
    }
    if (form.value.escopo === "area" && !form.value.area) {
      showToast("Área é obrigatória para documentos por área", {
        type: "error",
      });
      return;
    }
    if (form.value.escopo === "turma" && !form.value.id_turma?.trim()) {
      showToast("ID da turma é obrigatório para documentos por turma", {
        type: "error",
      });
      return;
    }

    isSaving.value = true;
    errorMsg.value = null;
    try {
      let uploadedUrl = form.value.arquivo;

      if (file.value) {
        uploading.value = true;
        const f = file.value as File;
        const base64 = await fileToBase64(f);
        const uuidName = generateUuidFileName(f.name);

        const uploadRes = (await ofetch("/api/gestao-documentos/upload", {
          method: "POST",
          body: { fileBase64: base64, fileName: uuidName },
        })) as { path: string; fileName: string };

        uploadedUrl = uploadRes.fileName;
        uploading.value = false;
      }

      await ofetch("/api/gestao-documentos", {
        method: "POST",
        body: {
          ...form.value,
          arquivo: uploadedUrl,
          vigencia_ini: form.value.vigencia_ini || null,
          vigencia_fim: form.value.vigencia_fim || null,
          area: form.value.escopo === "area" ? form.value.area : null,
          id_turma: form.value.escopo === "turma" ? form.value.id_turma : null,
        },
      });
      showToast(form.value.id ? "Documento atualizado!" : "Documento criado!", {
        type: "success",
      });
      showModal.value = false;
      fetchDocumentos(pagination.value.pagina_atual);
    } catch (e: any) {
      showToast(e?.data?.message ?? "Erro ao salvar documento", {
        type: "error",
      });
    } finally {
      isSaving.value = false;
      uploading.value = false;
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!selectedDoc.value) return;
    isDeleting.value = true;
    try {
      await ofetch(`/api/gestao-documentos/${selectedDoc.value.id}`, {
        method: "DELETE",
      });
      showToast("Documento removido", { type: "success" });
      showConfirmDelete.value = false;
      selectedDoc.value = null;
      fetchDocumentos(pagination.value.pagina_atual);
    } catch (e: any) {
      showToast(e?.data?.message ?? "Erro ao remover documento", {
        type: "error",
      });
    } finally {
      isDeleting.value = false;
    }
  };

  return {
    // Constantes
    areaOptions,
    escopoOptions,
    publicadoOptions,
    areaLabel,
    areaBadgeClass,
    // State
    isLoading,
    isSaving,
    isDeleting,
    documentos,
    pagination,
    LIMITE,
    hashBaseLocal,
    showModal,
    showConfirmDelete,
    selectedDoc,
    fileInput,
    file,
    dragging,
    uploading,
    errorMsg,
    form,
    filters,
    // Actions
    fetchHashBase,
    fetchDocumentos,
    openCreate,
    openEdit,
    openDelete,
    isoToDateInput,
    formatDate,
    handleFileChange,
    handleDrop,
    processFile,
    removeFile,
    save,
    confirmDelete,
  };
}
