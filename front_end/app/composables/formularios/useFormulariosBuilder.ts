/**
 * useFormulariosBuilder
 *
 * Composable do form builder: estado, drag-and-drop, blocos, save/load config.
 * Extraído do formularios.vue original. ~300 linhas de lógica DnD preservadas.
 */

import { ref, computed, type Ref } from "vue";
import { CEP_DEPENDENT_FIELDS } from "~/utils/viacep";
import type { Pergunta } from "./useFormulariosPerguntas";
import { labelTipoProc, labelTipoCand } from "./useFormulariosLista";

interface BuilderItem extends Pergunta {
  pergunta_id: string;
  largura: string;
  bloco_nome: string;
  obrigatorio: boolean;
}

export function useFormulariosBuilder(deps: {
  getEntidadeAtivaId: () => string | null;
  garantirEntidade: () => Promise<string>;
  perguntas: Ref<Pergunta[]>;
  toast: {
    showToast: (
      msg: string,
      opts?: { duration?: number; type?: "info" | "error" | "success" },
    ) => void;
  };
  fetchFormulariosSalvos: () => Promise<void>;
}) {
  // ── Builder State ──────────────────────────────────────
  const builderItems = ref<BuilderItem[]>([]);
  const loadingBuilder = ref(false);
  const savingBuilder = ref(false);
  const builderBlocos = ref<string[]>(["Dados Gerais"]);
  const activeBuilderBlocoIndex = ref(0);
  const currentBloco = computed(
    () => builderBlocos.value[activeBuilderBlocoIndex.value] || "Dados Gerais",
  );
  const currentBlocoItems = computed(() =>
    builderItems.value.filter((b) => b.bloco_nome === currentBloco.value),
  );

  // ── Context ────────────────────────────────────────────
  const contextType = ref<"area" | "programa">("area");
  const selectedContextId = ref("");
  const selectedTipoProc = ref("matricula");
  const selectedTipoCand = ref("estudante");

  // ── Bloco modal ────────────────────────────────────────
  const showModalBloco = ref(false);
  const novoBlocoNome = ref("");

  // ═══════════════════════════════════════════════════════
  // Drag-and-Drop State
  // ═══════════════════════════════════════════════════════
  const dragSource = ref<
    | { type: "sidebar"; perguntaId: string }
    | { type: "canvas"; index: number }
    | null
  >(null);
  const dragOverCanvasIndex = ref<number | null>(null);
  const dragOverCanvasSide = ref<"left" | "right" | null>(null);
  const dragOverSlotIdx = ref<number | null>(null);
  const dragOverZone = ref<
    "top" | "bottom" | "split-left" | "split-right" | "over" | null
  >(null);

  function resetDragState() {
    dragSource.value = null;
    dragOverCanvasIndex.value = null;
    dragOverCanvasSide.value = null;
    dragOverSlotIdx.value = null;
  }

  function isOrphaned(idx: number): boolean {
    const item = currentBlocoItems.value[idx];
    if (!item || String(item.largura) !== "1") return false;
    let colPos = 0;
    for (let i = 0; i < idx; i++) {
      colPos += String(currentBlocoItems.value[i]?.largura) === "2" ? 2 : 1;
    }
    const startCol = colPos % 2;
    if (startCol === 0) {
      const next = currentBlocoItems.value[idx + 1];
      if (next && String(next.largura) === "1") return false;
      return true;
    }
    return false;
  }

  // ─── Sidebar Drag ───
  function onDragStart(event: DragEvent, pId: string) {
    dragSource.value = { type: "sidebar", perguntaId: pId };
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "copyMove";
      event.dataTransfer.setData("text/plain", pId);
    }
  }

  // ─── Canvas Item Drag ───
  function onCanvasDragStart(event: DragEvent, itemIndexInGrid: number) {
    const realItem = currentBlocoItems.value[itemIndexInGrid];
    if (!realItem) return;
    const realIndex = builderItems.value.indexOf(realItem);
    dragSource.value = { type: "canvas", index: realIndex };
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(realIndex));
    }
  }

  // ─── Drop no grid vazio ───
  function onDrop(event: DragEvent) {
    event.preventDefault();
    const src = dragSource.value;
    resetDragState();
    if (!src) return;
    const target = event.target as HTMLElement;
    if (target.closest(".canvas-item") || target.closest(".drop-slot")) return;
    if (src.type === "sidebar") {
      addPerguntaToEnd(src.perguntaId);
    } else if (src.type === "canvas") {
      const items = [...builderItems.value];
      const [moved] = items.splice(src.index, 1);
      if (moved) {
        moved.bloco_nome = currentBloco.value;
        items.push(moved);
        builderItems.value = items;
      }
    }
  }

  function addPerguntaToEnd(pId: string) {
    const pergunta = deps.perguntas.value.find((p: any) => p.id === pId);
    if (!pergunta) return;
    if (builderItems.value.some((x) => x.pergunta_id === pId)) {
      deps.toast.showToast("Esta pergunta já está no formulário.", {
        type: "error",
      });
      return;
    }
    builderItems.value.push({
      ...pergunta,
      pergunta_id: pergunta.id,
      largura: "2",
      bloco_nome: currentBloco.value,
      obrigatorio: false,
    } as any);
    if ((pergunta as any).nome_interno === "cep") {
      let adicionados = 0;
      for (const nomeInterno of CEP_DEPENDENT_FIELDS) {
        const dep = deps.perguntas.value.find(
          (p: any) => p.nome_interno === nomeInterno,
        );
        if (dep && !builderItems.value.some((x) => x.pergunta_id === dep.id)) {
          builderItems.value.push({
            ...dep,
            pergunta_id: dep.id,
            largura:
              nomeInterno === "numero" || nomeInterno === "complemento"
                ? "1"
                : "2",
            bloco_nome: currentBloco.value,
            obrigatorio: false,
          } as any);
          adicionados++;
        }
      }
      if (adicionados > 0)
        deps.toast.showToast(
          `CEP adicionado! ${adicionados} campos de endereço incluídos.`,
          { type: "success" },
        );
    }
  }

  // ─── Canvas Drag Over ───
  function onCanvasDragOver(event: DragEvent, itemIndexInGrid: number) {
    event.preventDefault();
    event.stopPropagation();
    dragOverCanvasIndex.value = itemIndexInGrid;
    dragOverSlotIdx.value = null;
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const relY = event.clientY - rect.top;
    const pct = relY / rect.height;
    const realTargetItem = currentBlocoItems.value[itemIndexInGrid];
    const isTargetFull = realTargetItem
      ? String(realTargetItem.largura) === "2"
      : false;
    const relX = event.clientX - rect.left;
    const side: "left" | "right" = relX < rect.width / 2 ? "left" : "right";
    if (pct < 0.25) dragOverZone.value = "top";
    else if (pct > 0.75) dragOverZone.value = "bottom";
    else if (isTargetFull)
      dragOverZone.value = side === "left" ? "split-left" : "split-right";
    else dragOverZone.value = "over";
  }

  function onCanvasDragLeave() {
    dragOverCanvasIndex.value = null;
    dragOverSlotIdx.value = null;
  }

  // ─── Canvas Item Drop ───
  function onCanvasItemDrop(event: DragEvent, itemIndexInGrid: number) {
    event.preventDefault();
    event.stopPropagation();
    const src = dragSource.value;
    const zone = dragOverZone.value;
    resetDragState();
    if (!src || !zone) return;
    const realTargetItem = currentBlocoItems.value[itemIndexInGrid];
    if (!realTargetItem) return;
    const targetIndex = builderItems.value.indexOf(realTargetItem);
    const isTargetFull = String(realTargetItem.largura) === "2";
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const pctX = (event.clientX - rect.left) / rect.width;
    const side: "left" | "right" = pctX < 0.5 ? "left" : "right";

    if (zone === "top" || zone === "bottom") {
      const insertAt = zone === "top" ? targetIndex : targetIndex + 1;
      if (src.type === "sidebar") {
        const pergunta = deps.perguntas.value.find(
          (p: any) => p.id === src.perguntaId,
        );
        if (!pergunta) return;
        if (builderItems.value.some((x) => x.pergunta_id === src.perguntaId)) {
          deps.toast.showToast("Esta pergunta já está no formulário.", {
            type: "error",
          });
          return;
        }
        const items = [...builderItems.value];
        items.splice(insertAt, 0, {
          ...pergunta,
          pergunta_id: pergunta.id,
          largura: "2",
          bloco_nome: currentBloco.value,
          obrigatorio: false,
        } as any);
        builderItems.value = items;
      } else if (src.type === "canvas") {
        if (src.index === targetIndex) return;
        const items = [...builderItems.value];
        const [moved] = items.splice(src.index, 1);
        if (!moved) return;
        moved.bloco_nome = currentBloco.value;
        items.splice(src.index < insertAt ? insertAt - 1 : insertAt, 0, moved);
        builderItems.value = items;
      }
      return;
    }

    if (src.type === "canvas") {
      if (src.index === targetIndex) return;
      const items = [...builderItems.value];
      const [moved] = items.splice(src.index, 1);
      if (!moved) return;
      moved.bloco_nome = currentBloco.value;
      const adj = src.index < targetIndex ? targetIndex - 1 : targetIndex;
      if (isTargetFull) {
        items[adj] = { ...items[adj]!, largura: "1" };
        side === "right"
          ? items.splice(adj + 1, 0, { ...moved, largura: "1" })
          : items.splice(adj, 0, { ...moved, largura: "1" });
      } else {
        items.splice(adj, 0, moved);
      }
      builderItems.value = items;
    } else {
      const pergunta = deps.perguntas.value.find(
        (p: any) => p.id === src.perguntaId,
      );
      if (!pergunta) return;
      if (builderItems.value.some((x) => x.pergunta_id === src.perguntaId)) {
        deps.toast.showToast("Esta pergunta já está no formulário.", {
          type: "error",
        });
        return;
      }
      const newItem = {
        ...pergunta,
        pergunta_id: pergunta.id,
        largura: "1",
        bloco_nome: currentBloco.value,
        obrigatorio: false,
      } as BuilderItem;
      const items = [...builderItems.value];
      if (isTargetFull) {
        items[targetIndex] = { ...realTargetItem, largura: "1" };
        side === "right"
          ? items.splice(targetIndex + 1, 0, newItem)
          : items.splice(targetIndex, 0, newItem);
      } else {
        items.splice(targetIndex, 0, newItem);
      }
      builderItems.value = items;
    }
  }

  // ─── Ghost slot ───
  function onSlotDragOver(event: DragEvent, afterIdx: number) {
    event.preventDefault();
    event.stopPropagation();
    dragOverSlotIdx.value = afterIdx;
    dragOverCanvasIndex.value = null;
  }
  function onSlotDragLeave() {
    dragOverSlotIdx.value = null;
  }

  function onSlotDrop(event: DragEvent, afterIdxInGrid: number) {
    event.preventDefault();
    event.stopPropagation();
    const src = dragSource.value;
    resetDragState();
    if (!src) return;
    const realTargetItem = currentBlocoItems.value[afterIdxInGrid];
    if (!realTargetItem) return;
    const targetIndex = builderItems.value.indexOf(realTargetItem);
    if (src.type === "canvas") {
      const items = [...builderItems.value];
      const [moved] = items.splice(src.index, 1);
      if (!moved) return;
      moved.bloco_nome = currentBloco.value;
      items.splice(
        src.index <= targetIndex ? targetIndex : targetIndex + 1,
        0,
        { ...moved, largura: "1" },
      );
      builderItems.value = items;
    } else {
      const pergunta = deps.perguntas.value.find(
        (p: any) => p.id === src.perguntaId,
      );
      if (!pergunta) return;
      if (builderItems.value.some((x) => x.pergunta_id === src.perguntaId)) {
        deps.toast.showToast("Esta pergunta já está no formulário.", {
          type: "error",
        });
        return;
      }
      const items = [...builderItems.value];
      items.splice(targetIndex + 1, 0, {
        ...pergunta,
        pergunta_id: pergunta.id,
        largura: "1",
        bloco_nome: currentBloco.value,
        obrigatorio: false,
      } as BuilderItem);
      builderItems.value = items;
    }
  }

  // ─── Canvas item actions ───
  function toggleLargura(indexInGrid: number) {
    const realItem = currentBlocoItems.value[indexInGrid];
    if (!realItem) return;
    const targetIndex = builderItems.value.indexOf(realItem);
    const item = builderItems.value[targetIndex];
    if (item)
      builderItems.value[targetIndex] = {
        ...item,
        largura: String(item.largura) === "1" ? "2" : "1",
      };
  }

  function toggleObrigatorio(indexInGrid: number) {
    const realItem = currentBlocoItems.value[indexInGrid];
    if (!realItem) return;
    const targetIndex = builderItems.value.indexOf(realItem);
    const item = builderItems.value[targetIndex];
    if (item)
      builderItems.value[targetIndex] = {
        ...item,
        obrigatorio: !item.obrigatorio,
      };
  }

  function removeBuilderItem(indexInGrid: number) {
    const realItem = currentBlocoItems.value[indexInGrid];
    if (!realItem) return;
    const targetIndex = builderItems.value.indexOf(realItem);
    if (targetIndex >= 0) builderItems.value.splice(targetIndex, 1);
  }

  function mudarBlocoItem(indexInGrid: number, event: Event) {
    const realItem = currentBlocoItems.value[indexInGrid];
    if (!realItem) return;
    const targetIndex = builderItems.value.indexOf(realItem);
    if (targetIndex >= 0) {
      const novoBloco = (event.target as HTMLSelectElement).value;
      if (novoBloco && builderItems.value[targetIndex]) {
        builderItems.value[targetIndex]!.bloco_nome = novoBloco;
      }
      (event.target as HTMLSelectElement).value = "";
    }
  }

  // ─── Bloco management ───
  function abrirModalNovoBloco() {
    novoBlocoNome.value = "";
    showModalBloco.value = true;
  }
  function confirmarNovoBloco() {
    const nome = novoBlocoNome.value.trim();
    if (!nome) return;
    if (builderBlocos.value.includes(nome)) {
      deps.toast.showToast("Já existe um bloco com este nome.", {
        type: "error",
      });
      return;
    }
    builderBlocos.value.push(nome);
    activeBuilderBlocoIndex.value = builderBlocos.value.length - 1;
    showModalBloco.value = false;
  }
  function removerBlocoAtual() {
    if (builderBlocos.value.length <= 1) return;
    if (
      !confirm(
        "Tem certeza? Todas as perguntas deste bloco voltarão para o banco.",
      )
    )
      return;
    const blocoARemover = currentBloco.value;
    builderItems.value = builderItems.value.filter(
      (b) => b.bloco_nome !== blocoARemover,
    );
    builderBlocos.value.splice(activeBuilderBlocoIndex.value, 1);
    activeBuilderBlocoIndex.value = Math.max(
      0,
      activeBuilderBlocoIndex.value - 1,
    );
  }

  // ─── Save / Load ───
  async function fetchFormConfig() {
    if (!selectedContextId.value) {
      builderItems.value = [];
      builderBlocos.value = ["Dados Gerais"];
      activeBuilderBlocoIndex.value = 0;
      return;
    }
    loadingBuilder.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const res = (await $fetch("/api/formularios/form_config", {
        method: "GET",
        params: {
          id_entidade,
          area_id:
            contextType.value === "area" ? selectedContextId.value : undefined,
          programa_id:
            contextType.value === "programa"
              ? selectedContextId.value
              : undefined,
          tipo_proc: selectedTipoProc.value,
          tipo_cand: selectedTipoCand.value,
        },
      })) as any;
      if (res?.success && Array.isArray(res?.data)) {
        const uniqueBlocos = new Set<string>();
        res.data.forEach((r: any) => {
          if (r.bloco_nome) uniqueBlocos.add(r.bloco_nome);
        });
        builderBlocos.value =
          uniqueBlocos.size > 0 ? Array.from(uniqueBlocos) : ["Dados Gerais"];
        activeBuilderBlocoIndex.value = 0;
        builderItems.value = res.data.map((r: any) => ({
          ...r.cmct_pergunta_form,
          pergunta_id: r.pergunta_id,
          largura: r.largura,
          bloco_nome: r.bloco_nome || "Dados Gerais",
          obrigatorio: !!r.obrigatorio,
        }));
      } else {
        builderItems.value = [];
        builderBlocos.value = ["Dados Gerais"];
        activeBuilderBlocoIndex.value = 0;
      }
    } catch {
      builderItems.value = [];
      builderBlocos.value = ["Dados Gerais"];
      activeBuilderBlocoIndex.value = 0;
    } finally {
      loadingBuilder.value = false;
    }
  }

  async function saveFormConfig() {
    if (!selectedContextId.value) {
      deps.toast.showToast("Selecione uma área ou programa primeiro.", {
        type: "error",
      });
      return;
    }
    savingBuilder.value = true;
    try {
      const id_entidade = await deps.garantirEntidade();
      const itemsToSave = builderItems.value.map((b, index) => {
        let bOrdem = builderBlocos.value.indexOf(b.bloco_nome) + 1;
        if (bOrdem <= 0) bOrdem = 1;
        return {
          pergunta_id: b.pergunta_id,
          bloco_nome: b.bloco_nome || "Dados Gerais",
          bloco_ordem: bOrdem,
          pergunta_ordem: index + 1,
          largura: b.largura,
          obrigatorio: !!b.obrigatorio,
        };
      });
      console.log(
        "SAVE items com obrigatorio:",
        itemsToSave.map((i: any) => ({
          label: i.bloco_nome,
          obrigatorio: i.obrigatorio,
        })),
      );
      const res = (await $fetch("/api/formularios/form_config", {
        method: "POST",
        body: {
          id_entidade,
          area_id:
            contextType.value === "area" ? selectedContextId.value : null,
          programa_id:
            contextType.value === "programa" ? selectedContextId.value : null,
          tipo_proc: selectedTipoProc.value,
          tipo_cand: selectedTipoCand.value,
          items: itemsToSave,
        },
      })) as any;
      if (res?.success) {
        deps.toast.showToast("Configuração salva com sucesso!", {
          type: "success",
        });
        await deps.fetchFormulariosSalvos();
      } else
        deps.toast.showToast(res?.message || "Erro ao salvar layout.", {
          type: "error",
        });
    } catch (e: any) {
      deps.toast.showToast(e.message || "Erro no servidor", { type: "error" });
    } finally {
      savingBuilder.value = false;
    }
  }

  // ─── Abrir / Novo / Voltar ───
  function abrirFormulario(f: any, areas: any[], programas: any[]) {
    contextType.value = f.contexto_tipo === "area" ? "area" : "programa";
    selectedContextId.value = (f.area_id || f.programa_id) as string;
    selectedTipoProc.value = f.tipo_proc || "matricula";
    selectedTipoCand.value = f.tipo_cand || "estudante";
    void fetchFormConfig();
  }

  function novoFormulario() {
    selectedContextId.value = "";
    selectedTipoProc.value = "matricula";
    selectedTipoCand.value = "estudante";
    builderItems.value = [];
    builderBlocos.value = ["Dados Gerais"];
    activeBuilderBlocoIndex.value = 0;
  }

  return {
    builderItems,
    loadingBuilder,
    savingBuilder,
    builderBlocos,
    activeBuilderBlocoIndex,
    currentBloco,
    currentBlocoItems,
    contextType,
    selectedContextId,
    selectedTipoProc,
    selectedTipoCand,
    showModalBloco,
    novoBlocoNome,
    // drag state
    dragSource,
    dragOverCanvasIndex,
    dragOverCanvasSide,
    dragOverSlotIdx,
    dragOverZone,
    // actions
    resetDragState,
    isOrphaned,
    onDragStart,
    onCanvasDragStart,
    onDrop,
    addPerguntaToEnd,
    onCanvasDragOver,
    onCanvasDragLeave,
    onCanvasItemDrop,
    onSlotDragOver,
    onSlotDragLeave,
    onSlotDrop,
    toggleLargura,
    toggleObrigatorio,
    removeBuilderItem,
    mudarBlocoItem,
    abrirModalNovoBloco,
    confirmarNovoBloco,
    removerBlocoAtual,
    fetchFormConfig,
    saveFormConfig,
    abrirFormulario,
    novoFormulario,
  };
}
