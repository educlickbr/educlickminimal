// @ts-nocheck - ofetch type inference excessivamente profunda para 26 chamadas de API
import { $fetch as ofetch } from "ofetch";
import { useToast } from "../../../composables/useToast";
import { getAnoSemestre } from "../../../utils/ano_semestre";
import {
  generateUuidFileName,
  fileToBase64,
  validateFile,
} from "../../../utils/file";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type JnptaTempo = "primeiro_tempo" | "segundo_tempo";

export type OpcaoPergunta = {
  id?: string;
  label: string;
  ordem: number;
  ativo?: boolean;
};

export type TipoResposta =
  | "texto_curto"
  | "texto_longo"
  | "sim_nao"
  | "multipla_escolha";

export type PerguntaAtividade = {
  id?: string;
  pergunta: string;
  tipo_resposta: TipoResposta;
  obrigatoria: boolean;
  ordem: number;
  ativo?: boolean;
  opcoes?: OpcaoPergunta[];
  opcoesLoaded?: boolean;
};

export type AtividadeEdital = {
  id: string;
  atividade_nome: string;
  duracao_minutos: number | null;
  descricao: string | null;
  tem_perguntas: boolean;
  ativo?: boolean;
  ordem: number;
  perguntas?: PerguntaAtividade[];
  perguntasLoaded?: boolean;
  expanded?: boolean;
  perguntasExpanded?: boolean;
};

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useJnptaEditais() {
  const { showToast } = useToast();

  // --- Editais ---
  const editais = ref<any[]>([]);
  const isLoading = ref(true);
  const isCreatingEdital = ref(false);
  const uploading = ref(false);
  const showCreateEditalModal = ref(false);
  const anoSemestre = ref<string>("todos");

  const novoEdital = reactive({
    edital_titulo: "",
    edital_descricao: "",
    arquivo_edital: "",
    ano_semestre: getAnoSemestre(),
    qual_tempo: "primeiro_tempo" as "primeiro_tempo" | "segundo_tempo",
    dt_inicio: "",
    dt_fim: "",
    publicado: false,
  });

  const file = ref<File | null>(null);
  const fileInput = ref<HTMLInputElement | null>(null);
  const dragging = ref(false);
  const errorMsg = ref<string | null>(null);

  // --- Edição/exclusão de edital ---
  const showEditEditalModal = ref(false);
  const isUpdatingEdital = ref(false);
  const isDeletingEdital = ref<string | null>(null);
  const editandoEditalId = ref<string | null>(null);

  const editandoEdital = reactive({
    edital_titulo: "",
    edital_descricao: "",
    arquivo_edital: "",
    ano_semestre: getAnoSemestre(),
    qual_tempo: "primeiro_tempo" as JnptaTempo,
    dt_inicio: "",
    dt_fim: "",
    publicado: false,
  });

  const editFile = ref<File | null>(null);
  const editFileInput = ref<HTMLInputElement | null>(null);
  const editDragging = ref(false);
  const editErrorMsg = ref<string | null>(null);

  // --- Atividades ---
  const loadingAtividades = ref(false);
  const savingAtividadeId = ref<string | null>(null);
  const deletingAtividadeId = ref<string | null>(null);
  const savingPerguntaId = ref<string | null>(null);
  const deletingPerguntaId = ref<string | null>(null);
  const savingOpcaoId = ref<string | null>(null);
  const deletingOpcaoId = ref<string | null>(null);
  const criandoAtividade = ref(false);
  const atividadesEdital = ref<AtividadeEdital[]>([]);

  const novaAtividade = reactive({
    atividade_nome: "",
    duracao_minutos: null as number | null,
    descricao: "",
    ordem: 0,
    tem_perguntas: false,
  });
  const showNovaAtividadeForm = ref(false);

  const novaPerguntaPorAtividade = ref<Record<string, PerguntaAtividade>>({});
  const showNovaPerguntaFormPorAtividade = ref<Record<string, boolean>>({});
  const novaOpcaoPorPergunta = ref<Record<string, OpcaoPergunta>>({});
  const showNovaOpcaoFormPorPergunta = ref<Record<string, boolean>>({});

  // =======================================================================
  // Utilitários
  // =======================================================================

  const toDatetimeLocal = (iso: string) => (iso ? iso.slice(0, 16) : "");

  const createEmptyPergunta = (): PerguntaAtividade => ({
    pergunta: "",
    tipo_resposta: "texto_curto",
    obrigatoria: false,
    ordem: 0,
    ativo: true,
    opcoes: [],
    opcoesLoaded: false,
  });

  const createEmptyOpcao = (): OpcaoPergunta => ({
    label: "",
    ordem: 0,
    ativo: true,
  });

  const normalizeOpcao = (opcao: any): OpcaoPergunta => ({
    id: opcao?.id,
    label: opcao?.label || "",
    ordem: Number(opcao?.ordem || 0),
    ativo: opcao?.ativo ?? true,
  });

  const normalizeAtividade = (atividade: any): AtividadeEdital => ({
    id: atividade.id,
    atividade_nome: atividade.atividade_nome || "",
    duracao_minutos: atividade.duracao_minutos ?? null,
    descricao: atividade.descricao || "",
    tem_perguntas: !!atividade.tem_perguntas,
    ativo: atividade.ativo ?? true,
    ordem: Number(atividade.ordem || 0),
    perguntas: [],
    perguntasLoaded: false,
    expanded: false,
    perguntasExpanded: true,
  });

  const normalizePergunta = (pergunta: any): PerguntaAtividade => ({
    id: pergunta?.id,
    pergunta: pergunta?.pergunta || "",
    tipo_resposta: (pergunta?.tipo_resposta || "texto_curto") as TipoResposta,
    obrigatoria: !!pergunta?.obrigatoria,
    ordem: Number(pergunta?.ordem || 0),
    ativo: pergunta?.ativo ?? true,
    opcoes: Array.isArray(pergunta?.opcoes)
      ? pergunta.opcoes.map(normalizeOpcao)
      : [],
    opcoesLoaded: Array.isArray(pergunta?.opcoes),
  });

  // =======================================================================
  // Helpers de estado
  // =======================================================================

  const resetAtividadesState = () => {
    atividadesEdital.value = [];
    novaAtividade.atividade_nome = "";
    novaAtividade.duracao_minutos = null;
    novaAtividade.descricao = "";
    novaAtividade.ordem = 0;
    novaAtividade.tem_perguntas = false;
    showNovaAtividadeForm.value = false;
    novaPerguntaPorAtividade.value = {};
    showNovaPerguntaFormPorAtividade.value = {};
    loadingAtividades.value = false;
    criandoAtividade.value = false;
  };

  const ensureNovaPergunta = (atividadeId: string) => {
    if (!novaPerguntaPorAtividade.value[atividadeId]) {
      novaPerguntaPorAtividade.value[atividadeId] = createEmptyPergunta();
    }
    return novaPerguntaPorAtividade.value[atividadeId];
  };

  const ensureNovaOpcao = (perguntaId: string): OpcaoPergunta => {
    if (!novaOpcaoPorPergunta.value[perguntaId]) {
      novaOpcaoPorPergunta.value[perguntaId] = createEmptyOpcao();
    }
    return novaOpcaoPorPergunta.value[perguntaId];
  };

  const toggleNovaPerguntaForm = (atividadeId: string) => {
    const isVisible = !!showNovaPerguntaFormPorAtividade.value[atividadeId];
    showNovaPerguntaFormPorAtividade.value[atividadeId] = !isVisible;
    if (!isVisible) {
      ensureNovaPergunta(atividadeId);
    }
  };

  // =======================================================================
  // Editais – CRUD
  // =======================================================================

  const fetchEditais = async () => {
    isLoading.value = true;
    try {
      const filtroAnoSemestre =
        anoSemestre.value === "todos" ? undefined : anoSemestre.value;
      // @ts-ignore
      const result: any = await ofetch("/api/jnpta/editais", {
        query: { ano_semestre: filtroAnoSemestre },
      });
      editais.value = result?.editais || [];
    } catch (e: any) {
      console.error("Error loading editais:", e);
      showToast("Erro ao carregar editais", { type: "error" });
    } finally {
      isLoading.value = false;
    }
  };

  // ---- File handling (criação) ----

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
    errorMsg.value = null;
  };

  // ---- File handling (edição) ----

  const handleEditFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const f = target.files[0];
      if (f) processEditFile(f);
    }
  };

  const handleEditDrop = (event: DragEvent) => {
    editDragging.value = false;
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const f = event.dataTransfer.files[0];
      if (f) processEditFile(f);
    }
  };

  const processEditFile = (selectedFile: File) => {
    editErrorMsg.value = null;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    const { valid, error } = validateFile(selectedFile, allowedTypes);

    if (!valid) {
      editErrorMsg.value = error || "Arquivo inválido.";
      return;
    }

    editFile.value = selectedFile;
  };

  const removeEditFile = () => {
    editFile.value = null;
    editErrorMsg.value = null;
  };

  // ---- Create ----

  const handleCreateEdital = async () => {
    if (
      !novoEdital.edital_titulo ||
      !novoEdital.ano_semestre ||
      !novoEdital.dt_inicio ||
      !novoEdital.dt_fim
    ) {
      showToast("Título, ano/semestre, início e fim são obrigatórios", {
        type: "error",
      });
      return;
    }

    isCreatingEdital.value = true;
    errorMsg.value = null;

    try {
      let uploadedUrl = novoEdital.arquivo_edital;

      // Upload file if selected
      if (file.value) {
        uploading.value = true;
        const f = file.value as File;
        const base64 = await fileToBase64(f);
        const uuidName = generateUuidFileName(f.name);

        // @ts-ignore
        const uploadRes: any = await ofetch("/api/jnpta/editais/upload", {
          method: "POST",
          body: {
            fileBase64: base64,
            fileName: uuidName,
          },
        });

        uploadedUrl = uploadRes.fileName;
        uploading.value = false;
      }

      // @ts-ignore
      const result: any = await ofetch("/api/jnpta/editais", {
        method: "POST",
        body: {
          edital_titulo: novoEdital.edital_titulo,
          edital_descricao: novoEdital.edital_descricao,
          arquivo_edital: uploadedUrl,
          ano_semestre: novoEdital.ano_semestre,
          qual_tempo: novoEdital.qual_tempo || null,
          dt_inicio: new Date(novoEdital.dt_inicio).toISOString(),
          dt_fim: new Date(novoEdital.dt_fim).toISOString(),
          publicado: !!novoEdital.publicado,
        },
      });

      if (!result?.ok) throw new Error(result?.erro || "Falha ao criar edital");

      showToast("Edital criado com sucesso", { type: "success" });

      novoEdital.edital_titulo = "";
      novoEdital.edital_descricao = "";
      novoEdital.arquivo_edital = "";
      novoEdital.ano_semestre = getAnoSemestre();
      novoEdital.qual_tempo = "primeiro_tempo";
      novoEdital.dt_inicio = "";
      novoEdital.dt_fim = "";
      novoEdital.publicado = false;
      file.value = null;
      errorMsg.value = null;
      showCreateEditalModal.value = false;

      await fetchEditais();
    } catch (e: any) {
      console.error("Error creating edital:", e);
      showToast(e?.message || "Erro ao criar edital", { type: "error" });
    } finally {
      isCreatingEdital.value = false;
      uploading.value = false;
    }
  };

  // ---- Edit modal ----

  const handleOpenEditModal = async (edital: any) => {
    editandoEditalId.value = edital.id;
    editandoEdital.edital_titulo = edital.edital_titulo || "";
    editandoEdital.edital_descricao = edital.edital_descricao || "";
    editandoEdital.arquivo_edital = edital.arquivo_edital || "";
    editandoEdital.ano_semestre = edital.ano_semestre || getAnoSemestre();
    editandoEdital.qual_tempo = edital.qual_tempo || "primeiro_tempo";
    editandoEdital.dt_inicio = toDatetimeLocal(edital.dt_inicio);
    editandoEdital.dt_fim = toDatetimeLocal(edital.dt_fim);
    editandoEdital.publicado = !!edital.publicado;
    editFile.value = null;
    editErrorMsg.value = null;
    showEditEditalModal.value = true;
    await fetchAtividadesEdital(
      edital.id,
      (edital.qual_tempo || "primeiro_tempo") as JnptaTempo,
    );
  };

  // ---- Update ----

  const handleUpdateEdital = async () => {
    if (!editandoEditalId.value) return;
    if (
      !editandoEdital.edital_titulo ||
      !editandoEdital.ano_semestre ||
      !editandoEdital.dt_inicio ||
      !editandoEdital.dt_fim
    ) {
      showToast("Título, ano/semestre, início e fim são obrigatórios", {
        type: "error",
      });
      return;
    }
    isUpdatingEdital.value = true;
    try {
      let uploadedUrl = editandoEdital.arquivo_edital || null;

      if (editFile.value) {
        const f = editFile.value as File;
        const base64 = await fileToBase64(f);
        const uuidName = generateUuidFileName(f.name);

        // @ts-ignore
        const uploadRes: any = await ofetch("/api/jnpta/editais/upload", {
          method: "POST",
          body: {
            fileBase64: base64,
            fileName: uuidName,
          },
        });

        uploadedUrl = uploadRes.fileName;
      }

      // @ts-ignore
      const result: any = await ofetch(
        `/api/jnpta/editais/${editandoEditalId.value}`,
        {
          method: "PATCH",
          body: {
            edital_titulo: editandoEdital.edital_titulo,
            edital_descricao: editandoEdital.edital_descricao,
            arquivo_edital: uploadedUrl,
            ano_semestre: editandoEdital.ano_semestre,
            qual_tempo: editandoEdital.qual_tempo,
            dt_inicio: new Date(editandoEdital.dt_inicio).toISOString(),
            dt_fim: new Date(editandoEdital.dt_fim).toISOString(),
            publicado: !!editandoEdital.publicado,
          },
        },
      );
      if (!result?.ok)
        throw new Error(result?.erro || "Falha ao atualizar edital");

      if (editandoEdital.qual_tempo === "primeiro_tempo") {
        await salvarTudoPrimeiroTempo();
        await recarregarAtividadesMantendoContexto(editandoEdital.qual_tempo);
      }

      editandoEdital.arquivo_edital = uploadedUrl || "";
      showToast("Edital atualizado com sucesso", { type: "success" });
      editFile.value = null;
      editErrorMsg.value = null;
      await fetchEditais();
    } catch (e: any) {
      showToast(e?.message || "Erro ao atualizar edital", {
        type: "error",
      });
    } finally {
      isUpdatingEdital.value = false;
    }
  };

  // ---- Delete ----

  const handleDeleteEdital = async (edital: any) => {
    if (
      !confirm(
        `Excluir o edital "${edital.edital_titulo}"? Esta ação não pode ser desfeita.`,
      )
    )
      return;
    isDeletingEdital.value = edital.id;
    try {
      // @ts-ignore
      const result: any = await ofetch(`/api/jnpta/editais/${edital.id}`, {
        method: "DELETE",
      });
      if (!result?.ok)
        throw new Error(result?.erro || "Falha ao excluir edital");
      showToast("Edital excluído com sucesso", { type: "success" });
      await fetchEditais();
    } catch (e: any) {
      showToast(e?.message || "Erro ao excluir edital", { type: "error" });
    } finally {
      isDeletingEdital.value = null;
    }
  };

  // =======================================================================
  // Atividades
  // =======================================================================

  const fetchAtividadesEdital = async (
    idEdital: string,
    qualTempo: JnptaTempo,
  ) => {
    resetAtividadesState();

    if (qualTempo !== "primeiro_tempo") {
      return;
    }

    loadingAtividades.value = true;
    try {
      // @ts-ignore
      const result: any = await ofetch("/api/jnpta/atividades", {
        query: { id_edital: idEdital },
      });
      atividadesEdital.value = (result?.atividades || []).map((item: any) =>
        normalizeAtividade(item),
      );
    } catch (e: any) {
      showToast(e?.message || "Erro ao carregar atividades do edital", {
        type: "error",
      });
    } finally {
      loadingAtividades.value = false;
    }
  };

  const toggleAtividade = async (atividadeId: string) => {
    const atividade = atividadesEdital.value.find(
      (item) => item.id === atividadeId,
    );
    if (!atividade) return;

    atividade.expanded = !atividade.expanded;
    if (
      atividade.expanded &&
      atividade.tem_perguntas &&
      !atividade.perguntasLoaded
    ) {
      await fetchPerguntasAtividade(atividadeId);
    }
  };

  const fetchPerguntasAtividade = async (atividadeId: string) => {
    const atividade = atividadesEdital.value.find(
      (item) => item.id === atividadeId,
    );
    if (!atividade) return;

    try {
      // @ts-ignore
      const result: any = await ofetch("/api/jnpta/atividades/perguntas", {
        query: { id_atividade: atividadeId },
      });
      atividade.perguntas = (result?.perguntas || []).map((item: any) =>
        normalizePergunta(item),
      );
      atividade.perguntasLoaded = true;
      ensureNovaPergunta(atividadeId);
    } catch (e: any) {
      showToast(e?.message || "Erro ao carregar perguntas da atividade", {
        type: "error",
      });
    }
  };

  const togglePerguntasAtividade = async (atividadeId: string) => {
    const atividade = atividadesEdital.value.find(
      (item) => item.id === atividadeId,
    );
    if (!atividade || !atividade.tem_perguntas) return;

    atividade.perguntasExpanded = !atividade.perguntasExpanded;

    if (!atividade.perguntasExpanded) {
      showNovaPerguntaFormPorAtividade.value[atividadeId] = false;
      return;
    }

    if (!atividade.perguntasLoaded) {
      await fetchPerguntasAtividade(atividadeId);
    }
  };

  // ---- CRUD Atividades ----

  const handleCriarAtividade = async () => {
    if (!editandoEditalId.value) return;
    if (editandoEdital.qual_tempo !== "primeiro_tempo") return;
    if (!novaAtividade.atividade_nome.trim()) {
      showToast("Informe o nome da atividade", { type: "error" });
      return;
    }

    criandoAtividade.value = true;
    try {
      // @ts-ignore
      const result: any = await ofetch("/api/jnpta/atividades", {
        method: "POST",
        body: {
          id_edital: editandoEditalId.value,
          atividade_nome: novaAtividade.atividade_nome.trim(),
          duracao_minutos: novaAtividade.duracao_minutos,
          descricao: novaAtividade.descricao?.trim() || null,
          ordem: novaAtividade.ordem || 0,
          tem_perguntas: !!novaAtividade.tem_perguntas,
        },
      });

      if (!result?.ok || !result?.atividade) {
        throw new Error(result?.erro || "Falha ao criar atividade");
      }

      const atividade = normalizeAtividade(result.atividade);
      atividade.expanded = false;
      atividadesEdital.value.push(atividade);

      novaAtividade.atividade_nome = "";
      novaAtividade.duracao_minutos = null;
      novaAtividade.descricao = "";
      novaAtividade.ordem = 0;
      novaAtividade.tem_perguntas = false;
      showNovaAtividadeForm.value = false;
      showToast("Atividade criada com sucesso", { type: "success" });
    } catch (e: any) {
      showToast(e?.message || "Erro ao criar atividade", {
        type: "error",
      });
    } finally {
      criandoAtividade.value = false;
    }
  };

  const handleSalvarAtividade = async (atividade: AtividadeEdital) => {
    savingAtividadeId.value = atividade.id;
    try {
      // @ts-ignore
      const result: any = await ofetch(
        `/api/jnpta/atividades/${atividade.id}`,
        {
          method: "PATCH",
          body: {
            id_atividade: atividade.id,
            atividade_nome: atividade.atividade_nome?.trim(),
            duracao_minutos: atividade.duracao_minutos,
            descricao: atividade.descricao?.trim() || null,
            ativo: atividade.ativo ?? true,
            ordem: atividade.ordem,
            tem_perguntas: !!atividade.tem_perguntas,
          },
        },
      );

      if (!result?.ok) {
        throw new Error(result?.erro || "Falha ao salvar atividade");
      }

      showToast("Atividade atualizada", { type: "success" });
    } catch (e: any) {
      showToast(e?.message || "Erro ao salvar atividade", {
        type: "error",
      });
    } finally {
      savingAtividadeId.value = null;
    }
  };

  const handleExcluirAtividade = async (atividade: AtividadeEdital) => {
    if (!confirm(`Excluir a atividade "${atividade.atividade_nome}"?`)) return;
    deletingAtividadeId.value = atividade.id;
    try {
      // @ts-ignore
      const result: any = await ofetch(
        `/api/jnpta/atividades/${atividade.id}`,
        {
          method: "DELETE",
        },
      );

      if (!result?.ok) {
        throw new Error(result?.erro || "Falha ao excluir atividade");
      }

      atividadesEdital.value = atividadesEdital.value.filter(
        (item) => item.id !== atividade.id,
      );
      delete novaPerguntaPorAtividade.value[atividade.id];
      delete showNovaPerguntaFormPorAtividade.value[atividade.id];
      showToast("Atividade excluída", { type: "success" });
    } catch (e: any) {
      showToast(e?.message || "Erro ao excluir atividade", {
        type: "error",
      });
    } finally {
      deletingAtividadeId.value = null;
    }
  };

  // ---- CRUD Perguntas ----

  const handleCriarPerguntaAtividade = async (atividade: AtividadeEdital) => {
    const novaPergunta = ensureNovaPergunta(atividade.id);

    if (!novaPergunta.pergunta.trim()) {
      showToast("Informe o texto da pergunta", { type: "error" });
      return;
    }

    savingPerguntaId.value = `new-${atividade.id}`;
    try {
      // @ts-ignore
      const result: any = await ofetch("/api/jnpta/atividades/criar-pergunta", {
        method: "POST",
        body: {
          id_atividade: atividade.id,
          pergunta: novaPergunta.pergunta.trim(),
          tipo_resposta: novaPergunta.tipo_resposta,
          obrigatoria: !!novaPergunta.obrigatoria,
          ordem: novaPergunta.ordem || 0,
        },
      });

      if (!result?.ok || !result?.pergunta) {
        throw new Error(result?.erro || "Falha ao criar pergunta da atividade");
      }

      atividade.perguntas = [
        ...(atividade.perguntas || []),
        normalizePergunta(result.pergunta),
      ].sort((a, b) => a.ordem - b.ordem);
      novaPerguntaPorAtividade.value[atividade.id] = createEmptyPergunta();
      showNovaPerguntaFormPorAtividade.value[atividade.id] = false;
      showToast("Pergunta criada com sucesso", { type: "success" });
    } catch (e: any) {
      showToast(e?.message || "Erro ao criar pergunta da atividade", {
        type: "error",
      });
    } finally {
      savingPerguntaId.value = null;
    }
  };

  const handleSalvarPerguntaAtividade = async (pergunta: PerguntaAtividade) => {
    if (!pergunta.id) return;
    savingPerguntaId.value = pergunta.id;
    try {
      // @ts-ignore
      const result: any = await ofetch(
        `/api/jnpta/atividades/perguntas/${pergunta.id}`,
        {
          method: "PATCH",
          body: {
            pergunta: pergunta.pergunta?.trim(),
            tipo_resposta: pergunta.tipo_resposta,
            obrigatoria: !!pergunta.obrigatoria,
            ordem: pergunta.ordem,
            ativo: pergunta.ativo ?? true,
          },
        },
      );

      if (!result?.ok) {
        throw new Error(
          result?.erro || "Falha ao salvar pergunta da atividade",
        );
      }

      showToast("Pergunta atualizada", { type: "success" });
    } catch (e: any) {
      showToast(e?.message || "Erro ao salvar pergunta da atividade", {
        type: "error",
      });
    } finally {
      savingPerguntaId.value = null;
    }
  };

  const handleExcluirPerguntaAtividade = async (
    atividade: AtividadeEdital,
    pergunta: PerguntaAtividade,
  ) => {
    if (!pergunta.id) return;
    if (!confirm("Excluir esta pergunta da atividade?")) return;

    deletingPerguntaId.value = pergunta.id;
    try {
      // @ts-ignore
      const result: any = await ofetch(
        `/api/jnpta/atividades/perguntas/${pergunta.id}`,
        {
          method: "DELETE",
        },
      );

      if (!result?.ok) {
        throw new Error(
          result?.erro || "Falha ao excluir pergunta da atividade",
        );
      }

      atividade.perguntas = (atividade.perguntas || []).filter(
        (item) => item.id !== pergunta.id,
      );
      showToast("Pergunta excluída", { type: "success" });
    } catch (e: any) {
      showToast(e?.message || "Erro ao excluir pergunta da atividade", {
        type: "error",
      });
    } finally {
      deletingPerguntaId.value = null;
    }
  };

  // ---- CRUD Opções ----

  const handleCriarOpcaoPergunta = async (pergunta: PerguntaAtividade) => {
    if (!pergunta.id) return;
    const novaOpcao = ensureNovaOpcao(pergunta.id);

    if (!novaOpcao.label.trim()) {
      showToast("Informe o texto da opção", { type: "error" });
      return;
    }

    savingOpcaoId.value = `new-${pergunta.id}`;
    try {
      // @ts-ignore
      const result: any = await ofetch(
        "/api/jnpta/atividades/perguntas/criar-opcao",
        {
          method: "POST",
          body: {
            id_pergunta: pergunta.id,
            label: novaOpcao.label.trim(),
            ordem: novaOpcao.ordem || 0,
          },
        },
      );

      if (!result?.ok || !result?.opcao) {
        throw new Error(result?.erro || "Falha ao criar opção");
      }

      pergunta.opcoes = [
        ...(pergunta.opcoes || []),
        normalizeOpcao(result.opcao),
      ].sort((a, b) => a.ordem - b.ordem);
      novaOpcaoPorPergunta.value[pergunta.id] = createEmptyOpcao();
      showNovaOpcaoFormPorPergunta.value[pergunta.id] = false;
      showToast("Opção criada", { type: "success" });
    } catch (e: any) {
      showToast(e?.message || "Erro ao criar opção", { type: "error" });
    } finally {
      savingOpcaoId.value = null;
    }
  };

  const handleSalvarOpcaoPergunta = async (opcao: OpcaoPergunta) => {
    if (!opcao.id) return;
    savingOpcaoId.value = opcao.id;
    try {
      // @ts-ignore
      const result: any = await ofetch(
        `/api/jnpta/atividades/perguntas/opcoes/${opcao.id}`,
        {
          method: "PATCH",
          body: {
            label: opcao.label.trim(),
            ordem: opcao.ordem,
            ativo: opcao.ativo ?? true,
          },
        },
      );

      if (!result?.ok) {
        throw new Error(result?.erro || "Falha ao salvar opção");
      }

      showToast("Opção atualizada", { type: "success" });
    } catch (e: any) {
      showToast(e?.message || "Erro ao salvar opção", {
        type: "error",
      });
    } finally {
      savingOpcaoId.value = null;
    }
  };

  const handleExcluirOpcaoPergunta = async (
    pergunta: PerguntaAtividade,
    opcao: OpcaoPergunta,
  ) => {
    if (!opcao.id || !pergunta.id) return;
    if (!confirm("Excluir esta opção?")) return;

    deletingOpcaoId.value = opcao.id;
    try {
      // @ts-ignore
      const result: any = await ofetch(
        `/api/jnpta/atividades/perguntas/opcoes/${opcao.id}`,
        {
          method: "DELETE",
        },
      );

      if (!result?.ok) {
        throw new Error(result?.erro || "Falha ao excluir opção");
      }

      pergunta.opcoes = (pergunta.opcoes || []).filter(
        (o) => o.id !== opcao.id,
      );
      showToast("Opção excluída", { type: "success" });
    } catch (e: any) {
      showToast(e?.message || "Erro ao excluir opção", {
        type: "error",
      });
    } finally {
      deletingOpcaoId.value = null;
    }
  };

  // =======================================================================
  // Operações em lote (primeiro tempo)
  // =======================================================================

  const salvarTudoPrimeiroTempo = async () => {
    for (const atividade of atividadesEdital.value) {
      // @ts-ignore
      const atividadeResult: any = await ofetch(
        `/api/jnpta/atividades/${atividade.id}`,
        {
          method: "PATCH",
          body: {
            id_atividade: atividade.id,
            atividade_nome: atividade.atividade_nome?.trim(),
            duracao_minutos: atividade.duracao_minutos,
            descricao: atividade.descricao?.trim() || null,
            ativo: atividade.ativo ?? true,
            ordem: atividade.ordem,
            tem_perguntas: !!atividade.tem_perguntas,
          },
        },
      );

      if (!atividadeResult?.ok) {
        throw new Error(
          atividadeResult?.erro ||
            `Falha ao salvar atividade: ${atividade.atividade_nome}`,
        );
      }

      if (!atividade.tem_perguntas) {
        continue;
      }

      if (!atividade.perguntasLoaded) {
        await fetchPerguntasAtividade(atividade.id);
        if (!atividade.perguntasLoaded) {
          throw new Error(
            `Não foi possível carregar perguntas da atividade: ${atividade.atividade_nome}`,
          );
        }
      }

      for (const pergunta of atividade.perguntas || []) {
        if (!pergunta.id) continue;

        // @ts-ignore
        const perguntaResult: any = await ofetch(
          `/api/jnpta/atividades/perguntas/${pergunta.id}`,
          {
            method: "PATCH",
            body: {
              pergunta: pergunta.pergunta?.trim(),
              tipo_resposta: pergunta.tipo_resposta,
              obrigatoria: !!pergunta.obrigatoria,
              ordem: pergunta.ordem,
              ativo: pergunta.ativo ?? true,
            },
          },
        );

        if (!perguntaResult?.ok) {
          throw new Error(
            perguntaResult?.erro ||
              `Falha ao salvar pergunta: ${pergunta.pergunta}`,
          );
        }

        if (pergunta.tipo_resposta !== "multipla_escolha") {
          continue;
        }

        for (const opcao of pergunta.opcoes || []) {
          if (!opcao.id) continue;

          // @ts-ignore
          const opcaoResult: any = await ofetch(
            `/api/jnpta/atividades/perguntas/opcoes/${opcao.id}`,
            {
              method: "PATCH",
              body: {
                label: opcao.label.trim(),
                ordem: opcao.ordem,
                ativo: opcao.ativo ?? true,
              },
            },
          );

          if (!opcaoResult?.ok) {
            throw new Error(
              opcaoResult?.erro || `Falha ao salvar opção: ${opcao.label}`,
            );
          }
        }
      }
    }
  };

  const recarregarAtividadesMantendoContexto = async (
    qualTempo: JnptaTempo,
  ) => {
    if (!editandoEditalId.value) return;

    const atividadesExpandidas = atividadesEdital.value
      .filter((atividade) => atividade.expanded)
      .map((atividade) => atividade.id);

    await fetchAtividadesEdital(editandoEditalId.value, qualTempo);

    for (const atividadeId of atividadesExpandidas) {
      const atividade = atividadesEdital.value.find(
        (item) => item.id === atividadeId,
      );
      if (!atividade) continue;

      atividade.expanded = true;

      if (atividade.tem_perguntas) {
        await fetchPerguntasAtividade(atividadeId);
      }
    }
  };

  // =======================================================================
  // Retorno
  // =======================================================================

  return {
    // Tipos (exportados para uso externo via typeof)
    // (os tipos são exportados no módulo, não na runtime)

    // Editais – estado
    editais,
    isLoading,
    isCreatingEdital,
    uploading,
    showCreateEditalModal,
    anoSemestre,
    novoEdital,
    file,
    fileInput,
    dragging,
    errorMsg,

    // Edição – estado
    showEditEditalModal,
    isUpdatingEdital,
    isDeletingEdital,
    editandoEditalId,
    editandoEdital,
    editFile,
    editFileInput,
    editDragging,
    editErrorMsg,

    // Atividades – estado
    loadingAtividades,
    savingAtividadeId,
    deletingAtividadeId,
    savingPerguntaId,
    deletingPerguntaId,
    savingOpcaoId,
    deletingOpcaoId,
    criandoAtividade,
    atividadesEdital,
    novaAtividade,
    showNovaAtividadeForm,
    novaPerguntaPorAtividade,
    showNovaPerguntaFormPorAtividade,
    novaOpcaoPorPergunta,
    showNovaOpcaoFormPorPergunta,

    // Utilitários
    toDatetimeLocal,
    createEmptyPergunta,
    createEmptyOpcao,
    normalizeOpcao,
    normalizeAtividade,
    normalizePergunta,

    // Helpers de estado
    resetAtividadesState,
    ensureNovaPergunta,
    ensureNovaOpcao,
    toggleNovaPerguntaForm,

    // Editais CRUD
    fetchEditais,
    handleFileChange,
    handleDrop,
    processFile,
    removeFile,
    handleEditFileChange,
    handleEditDrop,
    processEditFile,
    removeEditFile,
    handleCreateEdital,
    handleOpenEditModal,
    handleUpdateEdital,
    handleDeleteEdital,

    // Atividades
    fetchAtividadesEdital,
    toggleAtividade,
    fetchPerguntasAtividade,
    togglePerguntasAtividade,
    handleCriarAtividade,
    handleSalvarAtividade,
    handleExcluirAtividade,

    // Perguntas
    handleCriarPerguntaAtividade,
    handleSalvarPerguntaAtividade,
    handleExcluirPerguntaAtividade,

    // Opções
    handleCriarOpcaoPergunta,
    handleSalvarOpcaoPergunta,
    handleExcluirOpcaoPergunta,

    // Lote
    salvarTudoPrimeiroTempo,
    recarregarAtividadesMantendoContexto,
  };
}
