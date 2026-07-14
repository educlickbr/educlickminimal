<script setup lang="ts">
// @ts-nocheck
type ValidacaoResponse = {
    ok: boolean;
    public_url: string | null;
    message?: string;
};

const route = useRoute();
const token = computed(() => String(route.params.token || ""));
const nomeExibicao = computed(() =>
    typeof route.query.nome === "string" ? route.query.nome : "registro",
);

definePageMeta({
    layout: false,
});

useHead({
    title: "Preparando Validação | SPED Digital",
    htmlAttrs: {
        translate: "no",
        class: "notranslate",
    },
    bodyAttrs: {
        class: "notranslate",
    },
});

const { data, pending, error } = await useFetch<any>(
    `/api/avaliacao-publica/validacao/${token.value}?nome=${encodeURIComponent(nomeExibicao.value)}`,
);

watchEffect(() => {
    if (import.meta.client && data.value?.ok && data.value.public_url) {
        window.location.replace(data.value.public_url);
    }
});
</script>

<template>
    <div
        translate="no"
        class="notranslate min-h-screen bg-[#f4f6f8] flex items-center justify-center p-4"
    >
        <div
            class="w-full max-w-lg bg-white border border-[#d9dee5] shadow-sm rounded-2xl p-8 text-center"
        >
            <div v-if="pending" class="space-y-4">
                <svg
                    class="animate-spin h-8 w-8 text-primary mx-auto"
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
                    />
                    <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                </svg>
                <div>
                    <h1 class="text-xl font-black text-[#1a1f2b]">
                        Preparando validação
                    </h1>
                    <p class="text-sm text-[#4b5563] mt-2">
                        Gerando um link seguro e temporário para consulta desta
                        avaliação.
                    </p>
                </div>
            </div>

            <div v-else-if="error || !data?.ok" class="space-y-3">
                <h1 class="text-xl font-black text-red-700">
                    Validação indisponível
                </h1>
                <p class="text-sm text-red-600">
                    {{
                        data?.message ||
                        "Não foi possível abrir esta validação no momento."
                    }}
                </p>
            </div>
        </div>
    </div>
</template>
