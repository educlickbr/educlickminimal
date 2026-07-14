<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
    isOpen: boolean;
    loading: boolean;
    detalhesCandidatura: any;
    detalheTab: string;
    hashBaseDocumentos: string | null;
    openingDocumento: Record<string, boolean>;
    getStatusLabel: (status: string) => string;
    getTempoLabel: (qualTempo?: string | null) => string;
    getNomeExibicaoCandidatura: (item: any) => string;
    getSubtituloCandidatura: (item: any) => string;
}>();

const emit = defineEmits<{
    close: [];
    "update:detalheTab": [tab: string];
    openDocumento: [doc: any, indexKey: string];
}>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeTabKey(value: string) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, "_");
}

function formatBlocoLabel(value: string) {
    return value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getDocumentoNomeExibicao(doc: any) {
    return doc?.label || doc?.nome_original || doc?.slug || "Documento";
}

function getDocumentoArquivoNomeExibicao(doc: any) {
    const nomeOriginal = String(doc?.nome_original || "").trim();
    if (nomeOriginal) return nomeOriginal;
    return "Arquivo anexado";
}

function getDocumentoArquivoHash(doc: any) {
    const nomeArquivo =
        doc?.nome_arquivo || doc?.resposta || doc?.fileName || "";
    return String(nomeArquivo || "");
}

function getDocumentoUrl(doc: any) {
    const hashBase = props.hashBaseDocumentos;
    const arquivo = getDocumentoArquivoHash(doc);
    if (!hashBase || !arquivo) return null;
    return `${hashBase}${arquivo}`;
}

function getDocumentosDaAba(tabKey: string) {
    if (tabKey === "documentos_empresa")
        return documentosPorCategoria.value.empresa;
    if (tabKey === "documentos_projeto")
        return documentosPorCategoria.value.projeto;
    if (tabKey === "documentos_candidato")
        return documentosPorCategoria.value.candidato;
    return [];
}

function getTituloAbaDocumentos(tabKey: string) {
    if (tabKey === "documentos_empresa") return "Documentos da Empresa";
    if (tabKey === "documentos_projeto") return "Documentos do Projeto";
    return "Documentos do Candidato";
}

function formatCampoResposta(valor: unknown) {
    const texto = String(valor ?? "")
        .trim()
        .toLowerCase();
    if (texto === "true") return "Sim";
    if (texto === "false") return "Não";
    return String(valor ?? "");
}

function formatLoopIndex(index: string | number) {
    if (typeof index === "number") return index + 1;
    const parsed = Number.parseInt(index, 10);
    return Number.isNaN(parsed) ? 1 : parsed + 1;
}

function pickFirstFilled(...values: any[]) {
    for (const value of values) {
        if (value == null) continue;
        const text = String(value).trim();
        if (text) return value;
    }
    return null;
}

function getResumoValue(slugs: string[], grupoKeys: string[] = []) {
    const grupo = props.detalhesCandidatura?.grupo || {};
    const fromGrupo = grupoKeys.map((key) => grupo?.[key]);
    const fromRespostas = slugs.map((slug) => respostasPorSlug.value.get(slug));
    return pickFirstFilled(...fromRespostas, ...fromGrupo);
}

// ---------------------------------------------------------------------------
// Computeds
// ---------------------------------------------------------------------------

const respostasPorSlug = computed(() => {
    const map = new Map<string, any>();
    const blocos = Array.isArray(props.detalhesCandidatura?.blocos)
        ? props.detalhesCandidatura.blocos
        : [];

    for (const bloco of blocos) {
        const perguntas = Array.isArray(bloco?.perguntas)
            ? bloco.perguntas
            : [];
        for (const pergunta of perguntas) {
            const slug = String(pergunta?.slug || "").trim();
            if (!slug) continue;
            const valor = pergunta?.resposta;
            if (valor == null) continue;
            const texto = String(valor).trim();
            if (!texto) continue;
            if (!map.has(slug)) map.set(slug, valor);
        }
    }

    return map;
});

const documentosPorCategoria = computed(() => {
    const docs = Array.isArray(props.detalhesCandidatura?.documentos)
        ? props.detalhesCandidatura.documentos
        : [];

    const projeto: any[] = [];
    const empresa: any[] = [];
    const candidato: any[] = [];
    const outros: any[] = [];

    for (const doc of docs) {
        const bloco = normalizeTabKey(String(doc?.bloco || ""));
        if (bloco.includes("documentos_projeto") || bloco.includes("projeto")) {
            projeto.push(doc);
            continue;
        }
        if (bloco.includes("documentos_empresa") || bloco.includes("empresa")) {
            empresa.push(doc);
            continue;
        }
        if (bloco === "documentos" || bloco.includes("documentos_candidato")) {
            candidato.push(doc);
            continue;
        }
        outros.push(doc);
    }

    return { projeto, empresa, candidato, outros };
});

const documentosProponente = computed(() => {
    return documentosPorCategoria.value.outros;
});

const detalhesTabs = computed(() => {
    const tabs: Array<{ key: string; label: string }> = [
        { key: "resumo", label: "Resumo" },
    ];
    const qualTempo = props.detalhesCandidatura?.candidatura?.qual_tempo;
    const isPrimeiroTempo = qualTempo === "primeiro_tempo";
    const blocos = Array.isArray(props.detalhesCandidatura?.blocos)
        ? props.detalhesCandidatura.blocos
        : [];
    const blocosNormalizados = new Set(
        blocos.map((b: any) => normalizeTabKey(b?.bloco || "")),
    );

    if (isPrimeiroTempo) {
        tabs.push({ key: "atividades", label: "Atividades" });
    }

    if (!isPrimeiroTempo && props.detalhesCandidatura?.grupo) {
        tabs.push({ key: "direcao_artistica", label: "Direção Artística" });
    }

    if (
        !isPrimeiroTempo &&
        (blocosNormalizados.has("documentos_empresa") ||
            documentosPorCategoria.value.empresa.length > 0)
    ) {
        tabs.push({ key: "documentos_empresa", label: "Documentos Empresa" });
    }

    if (
        !isPrimeiroTempo &&
        (blocosNormalizados.has("documentos_projeto") ||
            documentosPorCategoria.value.projeto.length > 0)
    ) {
        tabs.push({ key: "documentos_projeto", label: "Documentos Projeto" });
    }

    if (
        isPrimeiroTempo &&
        (blocosNormalizados.has("documentos") ||
            documentosPorCategoria.value.candidato.length > 0)
    ) {
        tabs.push({
            key: "documentos_candidato",
            label: "Documentos Candidato",
        });
    }

    const blocosExcluidos = new Set([
        "direcao_artistica",
        "integrantes",
        "documentos",
        "documentos_candidato",
        "documentos_empresa",
        "documentos_projeto",
    ]);

    for (const bloco of blocos) {
        const blocoKey = String(bloco?.bloco || "");
        const normalized = normalizeTabKey(blocoKey);
        if (!blocoKey || blocosExcluidos.has(normalized)) continue;
        tabs.push({ key: blocoKey, label: formatBlocoLabel(blocoKey) });
    }

    if (!isPrimeiroTempo) {
        tabs.push({ key: "integrantes", label: "Integrantes" });
    }

    return tabs;
});

const respostasDirecaoArtisticaTexto = computed(() => {
    const blocos = Array.isArray(props.detalhesCandidatura?.blocos)
        ? props.detalhesCandidatura.blocos
        : [];
    const blocoDirecao = blocos.find(
        (b: any) => normalizeTabKey(b?.bloco || "") === "direcao_artistica",
    );
    const perguntas = Array.isArray(blocoDirecao?.perguntas)
        ? blocoDirecao.perguntas
        : [];

    return perguntas.filter((pergunta: any) => {
        const resposta = String(pergunta?.resposta || "").trim();
        const tipo = String(pergunta?.tipo || "").toLowerCase();
        return resposta && tipo !== "arquivo";
    });
});

const resumoGrupo = computed(() => {
    return {
        nome_grupo: getResumoValue(
            ["nome_do_grupo", "nome_grupo"],
            ["nome_grupo"],
        ),
        razao_social: getResumoValue(
            ["razao_social", "nome_da_empresa", "nome_empresa"],
            ["razao_social", "nome_empresa"],
        ),
        cnpj: getResumoValue(["cnpj_empresa", "cnpj"], ["cnpj"]),
        email_contato: getResumoValue(["email_contato"], ["email_contato"]),
        telefone_fixo: getResumoValue(["telefone_fixo"], ["telefone_fixo"]),
        telefone_celular: getResumoValue(
            ["telefone_celular_contato", "telefone_celular"],
            ["telefone_celular"],
        ),
        redes_sociais: getResumoValue(
            ["redes_sociais_grupo", "redes_sociais"],
            ["redes_sociais"],
        ),
        cep: getResumoValue(["endereco_cep", "cep"], ["cep"]),
        cidade: getResumoValue(["endereco_cidade", "cidade"], ["cidade"]),
        regiao_administrativa: getResumoValue(
            ["regiao_administrativa"],
            ["regiao_administrativa"],
        ),
        endereco: getResumoValue(
            ["endereco_logradouro", "endereco"],
            ["endereco"],
        ),
        numero: getResumoValue(["endereco_numero", "numero"], ["numero"]),
        complemento: getResumoValue(
            ["endereco_complemento", "complemento"],
            ["complemento"],
        ),
        banco: getResumoValue(["banco_nome", "banco"], ["banco"]),
        agencia: getResumoValue(["agencia_num", "agencia"], ["agencia"]),
        conta_corrente: getResumoValue(
            ["conta_corrente_num", "conta_corrente"],
            ["conta_corrente"],
        ),
        pix: getResumoValue(["pix_chave", "pix"], ["pix"]),
    };
});

const resumoIntegrantes = computed(() => {
    const lista = Array.isArray(props.detalhesCandidatura?.integrantes)
        ? props.detalhesCandidatura.integrantes
        : [];
    return lista.map((integrante: any) => {
        const nome = [integrante?.nome, integrante?.sobrenome]
            .filter(Boolean)
            .join(" ")
            .trim();
        return {
            nome: nome || "Integrante sem nome",
            funcao: integrante?.funcao || "-",
        };
    });
});

// ---------------------------------------------------------------------------
// Local helpers used only in this component (not exposed as props)
// ---------------------------------------------------------------------------

function getIntegrantePrincipalNome(item: any) {
    const primeiro =
        Array.isArray(item?.integrantes) && item.integrantes.length > 0
            ? item.integrantes[0]
            : null;
    if (!primeiro) return null;
    const nome = [primeiro.nome, primeiro.sobrenome]
        .filter(Boolean)
        .join(" ")
        .trim();
    return nome || null;
}
</script>

<template>
    <Teleport to="body">
        <div
            v-if="isOpen"
            class="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-sm"
            @click.self="emit('close')"
        >
            <div
                class="bg-[#1A1A24] border-none md:border md:border-white/10 rounded-none md:rounded-lg w-full md:max-w-5xl overflow-hidden shadow-none md:shadow-2xl transform transition-all h-full md:h-auto max-h-full md:max-h-[85vh] flex flex-col"
            >
                <div
                    class="p-4 md:p-6 border-b border-white/5 flex items-center justify-between shrink-0"
                >
                    <div class="flex flex-col gap-1">
                        <span
                            class="text-[10px] uppercase font-bold tracking-wider text-primary"
                            >Jornada Paulista</span
                        >
                        <h2 class="text-xl font-bold text-white">
                            Detalhes da Candidatura
                        </h2>
                    </div>
                    <button
                        @click="emit('close')"
                        class="text-secondary hover:text-white transition-colors"
                    >
                        <svg
                            class="w-6 h-6"
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

                <div class="p-4 md:p-6 overflow-y-auto custom-scrollbar grow">
                    <div v-if="loading" class="flex justify-center py-10">
                        <div
                            class="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"
                        ></div>
                    </div>

                    <template v-else-if="detalhesCandidatura">
                        <div
                            class="flex flex-wrap gap-2 border-b border-secondary/10 pb-3 mb-4"
                        >
                            <button
                                v-for="tab in detalhesTabs"
                                :key="tab.key"
                                type="button"
                                @click="emit('update:detalheTab', tab.key)"
                                class="text-xs font-bold py-1.5 px-3 rounded-md border transition-colors"
                                :class="
                                    detalheTab === tab.key
                                        ? 'bg-primary/10 border-primary/30 text-primary'
                                        : 'bg-background border-secondary/10 text-secondary hover:text-white'
                                "
                            >
                                {{ tab.label }}
                            </button>
                        </div>

                        <div v-if="detalheTab === 'resumo'" class="space-y-6">
                            <div class="bg-white/5 rounded-lg p-4">
                                <h4
                                    class="text-sm font-bold text-white mb-3 border-b border-white/10 pb-2"
                                >
                                    Dados da Candidatura
                                </h4>
                                <div
                                    class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm"
                                >
                                    <div>
                                        <span class="text-secondary"
                                            >ID Candidatura:</span
                                        >
                                        <span class="text-white">{{
                                            detalhesCandidatura.candidatura
                                                ?.id_candidatura || "-"
                                        }}</span>
                                    </div>
                                    <div>
                                        <span class="text-secondary"
                                            >Status:</span
                                        >
                                        <span class="text-white font-medium">{{
                                            getStatusLabel(
                                                detalhesCandidatura.candidatura
                                                    ?.status || "",
                                            )
                                        }}</span>
                                    </div>
                                    <div>
                                        <span class="text-secondary"
                                            >Tempo:</span
                                        >
                                        <span class="text-white">{{
                                            getTempoLabel(
                                                detalhesCandidatura.candidatura
                                                    ?.qual_tempo,
                                            )
                                        }}</span>
                                    </div>
                                    <div>
                                        <span class="text-secondary"
                                            >Data de Envio:</span
                                        >
                                        <span class="text-white">{{
                                            detalhesCandidatura.candidatura
                                                ?.data_envio
                                                ? new Date(
                                                      detalhesCandidatura
                                                          .candidatura
                                                          .data_envio,
                                                  ).toLocaleString("pt-BR")
                                                : "-"
                                        }}</span>
                                    </div>
                                    <div class="md:col-span-2">
                                        <span class="text-secondary"
                                            >Aceite de Termos:</span
                                        >
                                        <span
                                            class="text-white font-medium"
                                            :class="
                                                detalhesCandidatura.candidatura
                                                    ?.aceite_termos
                                                    ? 'text-green-400'
                                                    : 'text-yellow-400'
                                            "
                                            >{{
                                                detalhesCandidatura.candidatura
                                                    ?.aceite_termos
                                                    ? "✓ Aceito"
                                                    : "⚠ Pendente"
                                            }}</span
                                        >
                                    </div>
                                </div>
                            </div>

                            <div
                                v-if="
                                    detalhesCandidatura.candidatura
                                        ?.qual_tempo === 'primeiro_tempo'
                                "
                                class="bg-primary/5 border border-primary/20 rounded-lg p-4"
                            >
                                <p
                                    class="text-xs text-primary font-bold uppercase tracking-wider"
                                >
                                    Primeiro Tempo
                                </p>
                                <p class="text-sm text-white mt-2">
                                    Candidatura individual: a avaliação
                                    considera os blocos do formulário e as
                                    respostas de atividades.
                                </p>
                            </div>

                            <template
                                v-if="
                                    detalhesCandidatura.candidatura
                                        ?.qual_tempo !== 'primeiro_tempo'
                                "
                            >
                                <!-- Dados da Empresa/Grupo -->
                                <div
                                    v-if="detalhesCandidatura.grupo"
                                    class="bg-white/5 rounded-lg p-4"
                                >
                                    <h4
                                        class="text-sm font-bold text-white mb-3 border-b border-white/10 pb-2"
                                    >
                                        Dados da Empresa/Grupo
                                    </h4>
                                    <div
                                        class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm"
                                    >
                                        <div>
                                            <span class="text-secondary text-xs"
                                                >Inscrição:</span
                                            >
                                            <span
                                                class="text-white font-medium text-xs"
                                                >{{
                                                    resumoGrupo.nome_grupo ||
                                                    "-"
                                                }}</span
                                            >
                                        </div>
                                        <div>
                                            <span class="text-secondary"
                                                >Razão Social:</span
                                            >
                                            <span class="text-white">{{
                                                resumoGrupo.razao_social || "-"
                                            }}</span>
                                        </div>
                                        <div>
                                            <span class="text-secondary"
                                                >CNPJ:</span
                                            >
                                            <span
                                                class="text-white font-mono"
                                                >{{
                                                    resumoGrupo.cnpj || "-"
                                                }}</span
                                            >
                                        </div>
                                        <div>
                                            <span class="text-secondary"
                                                >Email de Contato:</span
                                            >
                                            <span class="text-white">{{
                                                resumoGrupo.email_contato || "-"
                                            }}</span>
                                        </div>
                                        <div>
                                            <span class="text-secondary"
                                                >Telefone Fixo:</span
                                            >
                                            <span class="text-white">{{
                                                resumoGrupo.telefone_fixo || "-"
                                            }}</span>
                                        </div>
                                        <div>
                                            <span class="text-secondary"
                                                >Telefone Celular:</span
                                            >
                                            <span class="text-white">{{
                                                resumoGrupo.telefone_celular ||
                                                "-"
                                            }}</span>
                                        </div>
                                        <div class="md:col-span-2">
                                            <span class="text-secondary"
                                                >Redes Sociais:</span
                                            >
                                            <span class="text-white">{{
                                                resumoGrupo.redes_sociais || "-"
                                            }}</span>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    v-if="detalhesCandidatura.grupo"
                                    class="bg-white/5 rounded-lg p-4"
                                >
                                    <h4
                                        class="text-sm font-bold text-white mb-3 border-b border-white/10 pb-2"
                                    >
                                        Endereço da Empresa
                                    </h4>
                                    <div
                                        class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm"
                                    >
                                        <div>
                                            <span class="text-secondary"
                                                >CEP:</span
                                            >
                                            <span
                                                class="text-white font-mono"
                                                >{{
                                                    resumoGrupo.cep || "-"
                                                }}</span
                                            >
                                        </div>
                                        <div>
                                            <span class="text-secondary"
                                                >Cidade:</span
                                            >
                                            <span class="text-white">{{
                                                resumoGrupo.cidade || "-"
                                            }}</span>
                                        </div>
                                        <div>
                                            <span class="text-secondary"
                                                >Região:</span
                                            >
                                            <span class="text-white">{{
                                                resumoGrupo.regiao_administrativa ||
                                                "-"
                                            }}</span>
                                        </div>
                                        <div class="md:col-span-2">
                                            <span class="text-secondary"
                                                >Endereço:</span
                                            >
                                            <span class="text-white">{{
                                                resumoGrupo.endereco || "-"
                                            }}</span>
                                        </div>
                                        <div>
                                            <span class="text-secondary"
                                                >Número:</span
                                            >
                                            <span class="text-white">{{
                                                resumoGrupo.numero || "-"
                                            }}</span>
                                        </div>
                                        <div class="md:col-span-3">
                                            <span class="text-secondary"
                                                >Complemento:</span
                                            >
                                            <span class="text-white">{{
                                                resumoGrupo.complemento || "-"
                                            }}</span>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    v-if="resumoGrupo.banco || resumoGrupo.pix"
                                    class="bg-white/5 rounded-lg p-4"
                                >
                                    <h4
                                        class="text-sm font-bold text-white mb-3 border-b border-white/10 pb-2"
                                    >
                                        Dados Bancários
                                    </h4>
                                    <div
                                        class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm"
                                    >
                                        <div>
                                            <span class="text-secondary"
                                                >Banco:</span
                                            >
                                            <span class="text-white">{{
                                                resumoGrupo.banco || "-"
                                            }}</span>
                                        </div>
                                        <div>
                                            <span class="text-secondary"
                                                >Agência:</span
                                            >
                                            <span
                                                class="text-white font-mono"
                                                >{{
                                                    resumoGrupo.agencia || "-"
                                                }}</span
                                            >
                                        </div>
                                        <div>
                                            <span class="text-secondary"
                                                >Conta Corrente:</span
                                            >
                                            <span
                                                class="text-white font-mono"
                                                >{{
                                                    resumoGrupo.conta_corrente ||
                                                    "-"
                                                }}</span
                                            >
                                        </div>
                                        <div class="md:col-span-3">
                                            <span class="text-secondary"
                                                >PIX:</span
                                            >
                                            <span
                                                class="text-white font-mono"
                                                >{{
                                                    resumoGrupo.pix || "-"
                                                }}</span
                                            >
                                        </div>
                                    </div>
                                </div>

                                <div class="bg-white/5 rounded-lg p-4">
                                    <h4
                                        class="text-sm font-bold text-white mb-3 border-b border-white/10 pb-2"
                                    >
                                        Integrantes
                                    </h4>
                                    <div
                                        v-if="resumoIntegrantes.length === 0"
                                        class="text-sm text-secondary"
                                    >
                                        Sem integrantes cadastrados
                                    </div>
                                    <div v-else class="space-y-2">
                                        <div
                                            class="text-xs text-primary font-bold uppercase tracking-wider"
                                        >
                                            Total:
                                            {{ resumoIntegrantes.length }}
                                        </div>
                                        <div
                                            class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm"
                                        >
                                            <div
                                                v-for="(
                                                    integrante, index
                                                ) in resumoIntegrantes.slice(
                                                    0,
                                                    6,
                                                )"
                                                :key="`resumo-int-${index}`"
                                                class="text-white/90"
                                            >
                                                <span class="text-secondary"
                                                    >{{
                                                        formatLoopIndex(index)
                                                    }}.</span
                                                >
                                                {{ integrante.nome }}
                                                <span class="text-secondary"
                                                    >({{
                                                        integrante.funcao
                                                    }})</span
                                                >
                                            </div>
                                        </div>
                                        <div
                                            v-if="resumoIntegrantes.length > 6"
                                            class="text-xs text-secondary"
                                        >
                                            +
                                            {{ resumoIntegrantes.length - 6 }}
                                            integrante(s) na aba Integrantes
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>

                        <div
                            v-else-if="detalheTab === 'atividades'"
                            class="space-y-4"
                        >
                            <div
                                v-if="
                                    !detalhesCandidatura.atividades ||
                                    detalhesCandidatura.atividades.length === 0
                                "
                                class="bg-white/5 rounded-lg p-6 text-center"
                            >
                                <p class="text-sm text-secondary">
                                    Sem respostas de atividades para esta
                                    candidatura.
                                </p>
                            </div>
                            <div v-else class="space-y-4">
                                <div
                                    v-for="atividade in detalhesCandidatura.atividades"
                                    :key="atividade.id"
                                    class="bg-white/5 border border-white/10 rounded-lg p-4"
                                >
                                    <h5 class="text-sm font-bold text-white">
                                        {{
                                            atividade.atividade_nome ||
                                            "Atividade"
                                        }}
                                    </h5>
                                    <p
                                        v-if="atividade.descricao"
                                        class="text-xs text-secondary mt-1"
                                    >
                                        {{ atividade.descricao }}
                                    </p>

                                    <div class="space-y-2 mt-3">
                                        <div
                                            v-for="pergunta in atividade.perguntas ||
                                            []"
                                            :key="pergunta.id"
                                            class="border border-secondary/10 rounded-md p-3"
                                        >
                                            <p
                                                class="text-xs font-bold text-secondary uppercase tracking-wider"
                                            >
                                                {{
                                                    pergunta.pergunta ||
                                                    "Pergunta"
                                                }}
                                            </p>
                                            <p
                                                class="text-sm text-text mt-1 whitespace-pre-wrap break-words"
                                            >
                                                {{
                                                    pergunta.resposta_exibicao ||
                                                    pergunta.resposta_texto ||
                                                    "-"
                                                }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            v-else-if="detalheTab === 'integrantes'"
                            class="space-y-4"
                        >
                            <div
                                v-if="
                                    !detalhesCandidatura.integrantes ||
                                    detalhesCandidatura.integrantes.length === 0
                                "
                                class="bg-white/5 rounded-lg p-6 text-center"
                            >
                                <div
                                    class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3"
                                >
                                    <svg
                                        class="w-6 h-6 text-secondary"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    </svg>
                                </div>
                                <p class="text-sm text-secondary">
                                    Sem integrantes cadastrados
                                </p>
                            </div>
                            <div v-else>
                                <div class="bg-primary/10 rounded-lg p-3 mb-4">
                                    <p
                                        class="text-xs text-primary font-bold uppercase tracking-wider"
                                    >
                                        Total de Integrantes:
                                        {{
                                            detalhesCandidatura.integrantes
                                                .length
                                        }}
                                    </p>
                                </div>
                                <div class="space-y-3">
                                    <div
                                        v-for="(
                                            integrante, index
                                        ) in detalhesCandidatura.integrantes"
                                        :key="integrante.id || index"
                                        class="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors shadow-sm"
                                    >
                                        <div
                                            class="flex items-start justify-between"
                                        >
                                            <div class="flex-1">
                                                <div
                                                    class="flex items-center gap-2 mb-2"
                                                >
                                                    <span
                                                        class="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                                                        >#{{
                                                            formatLoopIndex(
                                                                index,
                                                            )
                                                        }}</span
                                                    >
                                                    <h5
                                                        class="text-sm font-bold text-white"
                                                    >
                                                        {{
                                                            [
                                                                integrante.nome,
                                                                integrante.sobrenome,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(" ") ||
                                                            "Nome não informado"
                                                        }}
                                                    </h5>
                                                </div>
                                                <div
                                                    class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs"
                                                >
                                                    <div>
                                                        <span
                                                            class="text-secondary"
                                                            >Função:</span
                                                        >
                                                        <span
                                                            class="text-white font-medium"
                                                            >{{
                                                                integrante.funcao ||
                                                                "-"
                                                            }}</span
                                                        >
                                                    </div>
                                                    <div>
                                                        <span
                                                            class="text-secondary"
                                                            >Email:</span
                                                        >
                                                        <span
                                                            class="text-white"
                                                            >{{
                                                                integrante.email ||
                                                                "-"
                                                            }}</span
                                                        >
                                                    </div>
                                                </div>

                                                <div
                                                    class="mt-3 pt-3 border-t border-white/10"
                                                >
                                                    <p
                                                        class="text-[10px] uppercase tracking-wider font-bold text-primary mb-2"
                                                    >
                                                        Respostas do Integrante
                                                    </p>
                                                    <div
                                                        v-if="
                                                            Array.isArray(
                                                                integrante.respostas_detalhes,
                                                            ) &&
                                                            integrante
                                                                .respostas_detalhes
                                                                .length > 0
                                                        "
                                                        class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs"
                                                    >
                                                        <div
                                                            v-for="(
                                                                campo,
                                                                campoIndex
                                                            ) in integrante.respostas_detalhes"
                                                            :key="`campo-${index}-${campoIndex}`"
                                                        >
                                                            <span
                                                                class="text-secondary"
                                                                >{{
                                                                    campo.label
                                                                }}:</span
                                                            >
                                                            <span
                                                                class="text-white"
                                                            >
                                                                {{
                                                                    formatCampoResposta(
                                                                        campo.valor,
                                                                    )
                                                                }}</span
                                                            >
                                                        </div>
                                                    </div>
                                                    <p
                                                        v-else
                                                        class="text-xs text-secondary"
                                                    >
                                                        Sem respostas adicionais
                                                        visíveis.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            v-else-if="detalheTab === 'direcao_artistica'"
                            class="space-y-4"
                        >
                            <div class="bg-white/5 rounded-lg p-4">
                                <h4
                                    class="text-sm font-bold text-white mb-3 border-b border-white/10 pb-2"
                                >
                                    Dados do Responsável - Direção Artística
                                </h4>
                                <div
                                    class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm"
                                >
                                    <div>
                                        <span class="text-secondary"
                                            >Nome:</span
                                        >
                                        <span class="text-white font-medium">{{
                                            detalhesCandidatura.candidatura
                                                ?.nome_direcao_artistica || "-"
                                        }}</span>
                                    </div>
                                    <div>
                                        <span class="text-secondary"
                                            >Email:</span
                                        >
                                        <span class="text-white">{{
                                            detalhesCandidatura.candidatura
                                                ?.email_direcao_artistica || "-"
                                        }}</span>
                                    </div>

                                    <template
                                        v-for="pergunta in respostasDirecaoArtisticaTexto"
                                        :key="pergunta.id_pergunta"
                                    >
                                        <div class="md:col-span-1">
                                            <span class="text-secondary"
                                                >{{
                                                    pergunta.label ||
                                                    pergunta.slug
                                                }}:</span
                                            >
                                            <span class="text-white">{{
                                                pergunta.resposta
                                            }}</span>
                                        </div>
                                    </template>
                                </div>
                            </div>

                            <div
                                v-if="documentosProponente.length > 0"
                                class="space-y-2"
                            >
                                <h5
                                    class="text-xs font-bold uppercase tracking-wider text-primary"
                                >
                                    Documentos do Proponente
                                </h5>
                                <div
                                    class="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    <div
                                        v-for="(
                                            doc, index
                                        ) in documentosProponente"
                                        :key="`proponente-${index}`"
                                        class="space-y-2"
                                    >
                                        <label
                                            class="text-xs font-bold text-secondary uppercase tracking-wider"
                                            >{{
                                                getDocumentoNomeExibicao(doc)
                                            }}</label
                                        >
                                        <div
                                            class="relative border-2 border-dashed border-white/10 rounded-xl p-6 transition-all hover:border-primary/40 hover:bg-primary/5 group text-center"
                                        >
                                            <div
                                                class="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2"
                                            >
                                                <svg
                                                    class="w-6 h-6 text-green-500"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                >
                                                    <path
                                                        d="M20 6L9 17l-5-5"
                                                    ></path>
                                                </svg>
                                            </div>
                                            <p
                                                class="text-sm font-bold text-white truncate px-2"
                                            >
                                                {{
                                                    getDocumentoArquivoNomeExibicao(
                                                        doc,
                                                    )
                                                }}
                                            </p>
                                            <button
                                                type="button"
                                                class="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:underline disabled:opacity-60 disabled:cursor-wait"
                                                :disabled="
                                                    openingDocumento[
                                                        `proponente-${index}`
                                                    ]
                                                "
                                                @click="
                                                    emit(
                                                        'openDocumento',
                                                        doc,
                                                        `proponente-${index}`,
                                                    )
                                                "
                                            >
                                                <svg
                                                    v-if="
                                                        openingDocumento[
                                                            `proponente-${index}`
                                                        ]
                                                    "
                                                    class="w-3 h-3 animate-spin"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        class="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        stroke-width="4"
                                                    ></circle>
                                                    <path
                                                        class="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                    ></path>
                                                </svg>
                                                <svg
                                                    v-else
                                                    class="w-3 h-3"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                    ></path>
                                                </svg>
                                                {{
                                                    openingDocumento[
                                                        `proponente-${index}`
                                                    ]
                                                        ? "Abrindo..."
                                                        : "Abrir Arquivo"
                                                }}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            v-else-if="
                                [
                                    'documentos_empresa',
                                    'documentos_projeto',
                                    'documentos_candidato',
                                ].includes(detalheTab)
                            "
                            class="space-y-4"
                        >
                            <div
                                v-if="
                                    getDocumentosDaAba(detalheTab).length === 0
                                "
                                class="bg-white/5 rounded-lg p-6 text-center"
                            >
                                <div
                                    class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3"
                                >
                                    <svg
                                        class="w-6 h-6 text-secondary"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                </div>
                                <p class="text-sm text-secondary">
                                    Nenhum documento enviado nesta candidatura.
                                </p>
                            </div>
                            <div v-else class="space-y-2">
                                <h5
                                    class="text-xs font-bold uppercase tracking-wider text-primary"
                                >
                                    {{ getTituloAbaDocumentos(detalheTab) }}
                                </h5>
                                <div
                                    class="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    <div
                                        v-for="(
                                            doc, index
                                        ) in getDocumentosDaAba(detalheTab)"
                                        :key="`${detalheTab}-${index}`"
                                        class="space-y-2"
                                    >
                                        <label
                                            class="text-xs font-bold text-secondary uppercase tracking-wider"
                                            >{{
                                                getDocumentoNomeExibicao(doc)
                                            }}</label
                                        >
                                        <div
                                            class="relative border-2 border-dashed border-white/10 rounded-xl p-6 transition-all hover:border-primary/40 hover:bg-primary/5 group text-center"
                                        >
                                            <div
                                                class="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2"
                                            >
                                                <svg
                                                    class="w-6 h-6 text-green-500"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                >
                                                    <path
                                                        d="M20 6L9 17l-5-5"
                                                    ></path>
                                                </svg>
                                            </div>
                                            <p
                                                class="text-sm font-bold text-white truncate px-2"
                                            >
                                                {{
                                                    getDocumentoArquivoNomeExibicao(
                                                        doc,
                                                    )
                                                }}
                                            </p>
                                            <button
                                                type="button"
                                                class="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:underline disabled:opacity-60 disabled:cursor-wait"
                                                :disabled="
                                                    openingDocumento[
                                                        `${detalheTab}-${index}`
                                                    ]
                                                "
                                                @click="
                                                    emit(
                                                        'openDocumento',
                                                        doc,
                                                        `${detalheTab}-${index}`,
                                                    )
                                                "
                                            >
                                                <svg
                                                    v-if="
                                                        openingDocumento[
                                                            `${detalheTab}-${index}`
                                                        ]
                                                    "
                                                    class="w-3 h-3 animate-spin"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        class="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        stroke-width="4"
                                                    ></circle>
                                                    <path
                                                        class="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                    ></path>
                                                </svg>
                                                <svg
                                                    v-else
                                                    class="w-3 h-3"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                    ></path>
                                                </svg>
                                                {{
                                                    openingDocumento[
                                                        `${detalheTab}-${index}`
                                                    ]
                                                        ? "Abrindo..."
                                                        : "Abrir Arquivo"
                                                }}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <p
                                    v-if="!hashBaseDocumentos"
                                    class="text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 rounded-md p-2"
                                >
                                    Não foi possível renovar a hash de acesso
                                    agora. Clique no ícone novamente para tentar
                                    abrir.
                                </p>
                            </div>
                        </div>

                        <div v-else class="space-y-3">
                            <div
                                v-for="bloco in (
                                    detalhesCandidatura.blocos || []
                                ).filter(
                                    (item: any) => item.bloco === detalheTab,
                                )"
                                :key="bloco.bloco"
                                class="space-y-2"
                            >
                                <div
                                    v-for="pergunta in bloco.perguntas"
                                    :key="pergunta.id_pergunta"
                                    class="border border-secondary/10 rounded-md p-3"
                                >
                                    <p
                                        class="text-xs font-bold text-secondary uppercase tracking-wider"
                                    >
                                        {{
                                            pergunta.label ||
                                            pergunta.slug ||
                                            "Pergunta"
                                        }}
                                    </p>
                                    <p
                                        class="text-sm text-text mt-1 whitespace-pre-wrap break-words"
                                    >
                                        {{ pergunta.resposta ?? "-" }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
    display: none;
}
.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
