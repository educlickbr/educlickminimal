<script setup lang="ts">
import { useMatriculasModalListaAlunos } from "~/composables/matriculas/useMatriculasModalListaAlunos";

const { fetchAlunos } = useMatriculasModalListaAlunos();

const props = defineProps<{
    isOpen: boolean;
    anoSemestre: string;
    hashBase: string;
    filters: {
        turno?: string;
        area?: string;
        curso?: string;
        busca?: string;
        status?: string;
    };
}>();

const emit = defineEmits(["close"]);

// --- Field toggles ---
const fields = reactive({
    nomeSocial: true,
    cursoTurno: true,
    email: true,
    ra: true,
    foto: true,
});

const selectAll = computed({
    get: () => Object.values(fields).every(Boolean),
    set: (val: boolean) => {
        (Object.keys(fields) as Array<keyof typeof fields>).forEach((k) => {
            fields[k] = val;
        });
    },
});

const isLoading = ref(false);

const composeProtectedFileUrl = (baseHash: string, filePath: string) => {
    const cleanPath = String(filePath || "")
        .replace(/^secretaria\//, "")
        .replace(/^\//, "");
    if (!baseHash || !cleanPath) return null;

    if (baseHash.includes("?")) {
        const queryIndex = baseHash.indexOf("?");
        const baseUrl =
            queryIndex >= 0 ? baseHash.slice(0, queryIndex) : baseHash;
        const queryParams =
            queryIndex >= 0 ? baseHash.slice(queryIndex + 1) : "";
        const separator = baseUrl.endsWith("/") ? "" : "/";
        return `${baseUrl}${separator}${cleanPath}?${queryParams}`;
    }

    const separator = baseHash.endsWith("/") ? "" : "/";
    return `${baseHash}${separator}${cleanPath}`;
};

// --- Generate list ---
const gerarLista = async () => {
    isLoading.value = true;
    try {
        const data: any = await fetchAlunos({
            ano_semestre: props.anoSemestre,
            id_turma: props.filters.curso || null,
            area: !props.filters.curso ? props.filters.area || null : null,
            turno: !props.filters.curso ? props.filters.turno || null : null,
            busca: props.filters.busca || null,
            status: props.filters.status || "Ativa",
            page: 1,
            limit: 9999,
        });

        const alunos: any[] = data.alunos || [];
        const html = gerarHTML(alunos);
        const win = window.open("", "_blank");
        if (win) {
            win.document.write(html);
            win.document.close();
            setTimeout(() => win.print(), 800);
        }
    } catch (e) {
        console.error("Erro ao gerar lista:", e);
    } finally {
        isLoading.value = false;
    }
};

const gerarHTML = (alunos: any[]) => {
    const titulo = `Lista de Alunos Matriculados — ${props.anoSemestre}`;

    const filtroDesc = props.filters.curso
        ? "Turma específica"
        : props.filters.area
          ? props.filters.area
          : "Todas as turmas";

    const subtituloExtra = props.filters.turno
        ? ` • ${props.filters.turno}`
        : "";

    const rowsHTML = alunos
        .map((aluno) => {
            const officialName =
                aluno.nome_aluno ||
                [aluno.nome, aluno.sobrenome].filter(Boolean).join(" ") ||
                "Aluno";
            const socialName: string | null =
                typeof aluno.nome_social === "string" &&
                aluno.nome_social.trim()
                    ? aluno.nome_social.trim()
                    : null;

            const temFoto =
                fields.foto && aluno.foto_resposta && props.hashBase;
            const fotoUrl = temFoto
                ? composeProtectedFileUrl(props.hashBase, aluno.foto_resposta)
                : null;
            const cursoTexto = [aluno.nome_curso, aluno.turno]
                .filter(Boolean)
                .join(" — ");
            const raValue = aluno.ra || aluno.ra_legado || null;

            const detailParts: string[] = [];
            if (fields.email && aluno.email) detailParts.push(aluno.email);
            if (fields.ra && raValue) detailParts.push(`RA: ${raValue}`);

            return `
<div class="row">
        <div class="foto ${fotoUrl ? "" : "foto-placeholder"}">
            ${fotoUrl ? `<img src="${fotoUrl}" alt="${officialName}" loading="eager" />` : '<span class="placeholder-icon">IMG</span><span class="placeholder-text">Sem foto</span>'}
        </div>
  <div class="info">
    <p class="nome">${officialName}</p>
    ${fields.nomeSocial && socialName ? `<p class="social">Nome Social: ${socialName}</p>` : ""}
    ${fields.cursoTurno && cursoTexto ? `<p class="curso">${cursoTexto}</p>` : ""}
    ${detailParts.length ? `<p class="details">${detailParts.join(" &nbsp;·&nbsp; ")}</p>` : ""}
  </div>
</div>`;
        })
        .join("\n");

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${titulo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 28px 32px; }
    h1 { font-size: 15px; font-weight: 700; letter-spacing: 0.01em; margin-bottom: 2px; }
    .sub { font-size: 11px; color: #777; margin-bottom: 18px; border-bottom: 2px solid #111; padding-bottom: 10px; }
    .row {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 9px 0;
      border-bottom: 1px solid #e5e7eb;
      page-break-inside: avoid;
    }
    .row:last-child { border-bottom: none; }
    .info { flex: 1; }
    .nome { font-size: 13px; font-weight: 700; color: #111; line-height: 1.3; }
    .social { font-size: 11px; color: #555; margin-top: 2px; }
    .curso { font-size: 11px; color: #333; margin-top: 3px; }
    .details { font-size: 10px; color: #666; margin-top: 3px; }
        .foto {
            flex-shrink: 0;
            width: 52px;
            height: 52px;
            border-radius: 4px;
            border: 1px solid #ddd;
            overflow: hidden;
            background: #f3f4f6;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
        }
    .foto img { width: 52px; height: 52px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; display: block; }
        .foto-placeholder { color: #6b7280; }
        .placeholder-icon {
            width: 24px;
            height: 18px;
            border: 1px solid #9ca3af;
            border-radius: 3px;
            font-size: 8px;
            line-height: 16px;
            text-align: center;
            font-weight: 700;
            background: #ffffff;
        }
        .placeholder-text {
            font-size: 8px;
            line-height: 1;
            font-weight: 600;
            text-transform: uppercase;
        }
    @media print {
            body { padding: 0; }
            @page { size: A4; margin: 18mm 14mm 12mm 14mm; }
    }
  </style>
</head>
<body>
  <h1>${titulo}</h1>
  <p class="sub">${filtroDesc}${subtituloExtra} &nbsp;·&nbsp; ${alunos.length} aluno${alunos.length !== 1 ? "s" : ""}</p>
  ${rowsHTML}
</body>
</html>`;
};
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="isOpen"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                @click.self="emit('close')"
            >
                <div
                    class="bg-[#16161E] border border-white/10 rounded-xl w-full max-w-sm shadow-2xl"
                >
                    <!-- Header -->
                    <div
                        class="flex items-center justify-between px-5 py-4 border-b border-white/10"
                    >
                        <div>
                            <h2 class="text-sm font-bold text-white">
                                Lista de Alunos
                            </h2>
                            <p class="text-[10px] text-secondary mt-0.5">
                                Escolha os campos a exibir na lista impressa
                            </p>
                        </div>
                        <button
                            @click="emit('close')"
                            class="text-secondary hover:text-white transition-colors p-1 rounded"
                        >
                            <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="px-5 py-4 space-y-3">
                        <!-- Select All toggle -->
                        <label
                            class="flex items-center justify-between cursor-pointer bg-white/5 px-3 py-2.5 rounded-lg border border-white/10"
                        >
                            <span class="text-xs font-semibold text-white"
                                >Selecionar todos</span
                            >
                            <button
                                type="button"
                                @click="selectAll = !selectAll"
                                :class="[
                                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                                    selectAll ? 'bg-primary' : 'bg-white/20',
                                ]"
                            >
                                <span
                                    :class="[
                                        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform',
                                        selectAll
                                            ? 'translate-x-4'
                                            : 'translate-x-1',
                                    ]"
                                />
                            </button>
                        </label>

                        <div class="h-px bg-white/5" />

                        <!-- Nome — compulsório -->
                        <div
                            class="flex items-center justify-between px-3 py-2 rounded-lg opacity-60"
                        >
                            <div>
                                <p class="text-xs font-medium text-white">
                                    Nome
                                </p>
                                <p class="text-[10px] text-secondary">
                                    Obrigatório
                                </p>
                            </div>
                            <span
                                class="text-[10px] text-secondary border border-white/10 rounded px-2 py-0.5"
                                >Sempre</span
                            >
                        </div>

                        <!-- Nome Social -->
                        <label
                            class="flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <p class="text-xs font-medium text-white">
                                Nome Social
                            </p>
                            <button
                                type="button"
                                @click="fields.nomeSocial = !fields.nomeSocial"
                                :class="[
                                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                                    fields.nomeSocial
                                        ? 'bg-primary'
                                        : 'bg-white/20',
                                ]"
                            >
                                <span
                                    :class="[
                                        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform',
                                        fields.nomeSocial
                                            ? 'translate-x-4'
                                            : 'translate-x-1',
                                    ]"
                                />
                            </button>
                        </label>

                        <!-- Curso e Turno -->
                        <label
                            class="flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <p class="text-xs font-medium text-white">
                                Curso e Turno
                            </p>
                            <button
                                type="button"
                                @click="fields.cursoTurno = !fields.cursoTurno"
                                :class="[
                                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                                    fields.cursoTurno
                                        ? 'bg-primary'
                                        : 'bg-white/20',
                                ]"
                            >
                                <span
                                    :class="[
                                        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform',
                                        fields.cursoTurno
                                            ? 'translate-x-4'
                                            : 'translate-x-1',
                                    ]"
                                />
                            </button>
                        </label>

                        <!-- Email -->
                        <label
                            class="flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <p class="text-xs font-medium text-white">Email</p>
                            <button
                                type="button"
                                @click="fields.email = !fields.email"
                                :class="[
                                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                                    fields.email ? 'bg-primary' : 'bg-white/20',
                                ]"
                            >
                                <span
                                    :class="[
                                        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform',
                                        fields.email
                                            ? 'translate-x-4'
                                            : 'translate-x-1',
                                    ]"
                                />
                            </button>
                        </label>

                        <!-- RA -->
                        <label
                            class="flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <p class="text-xs font-medium text-white">RA</p>
                            <button
                                type="button"
                                @click="fields.ra = !fields.ra"
                                :class="[
                                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                                    fields.ra ? 'bg-primary' : 'bg-white/20',
                                ]"
                            >
                                <span
                                    :class="[
                                        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform',
                                        fields.ra
                                            ? 'translate-x-4'
                                            : 'translate-x-1',
                                    ]"
                                />
                            </button>
                        </label>

                        <!-- Foto -->
                        <label
                            class="flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <div>
                                <p class="text-xs font-medium text-white">
                                    Foto
                                </p>
                                <p class="text-[10px] text-secondary">
                                    Quando disponível
                                </p>
                            </div>
                            <button
                                type="button"
                                @click="fields.foto = !fields.foto"
                                :class="[
                                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                                    fields.foto ? 'bg-primary' : 'bg-white/20',
                                ]"
                            >
                                <span
                                    :class="[
                                        'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform',
                                        fields.foto
                                            ? 'translate-x-4'
                                            : 'translate-x-1',
                                    ]"
                                />
                            </button>
                        </label>
                    </div>

                    <!-- Footer -->
                    <div class="px-5 pb-5 flex gap-3">
                        <button
                            @click="emit('close')"
                            class="flex-1 py-2.5 text-xs font-semibold text-secondary border border-white/10 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            @click="gerarLista"
                            :disabled="isLoading"
                            class="flex-1 py-2.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div
                                v-if="isLoading"
                                class="animate-spin h-3.5 w-3.5 border-t-2 border-white rounded-full"
                            />
                            <svg
                                v-else
                                class="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                />
                            </svg>
                            {{ isLoading ? "Gerando..." : "Imprimir Lista" }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
