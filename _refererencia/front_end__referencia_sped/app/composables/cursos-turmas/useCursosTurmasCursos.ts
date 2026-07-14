import { $fetch as ofetch } from "ofetch";
import { ref } from "vue";

export function useCursosTurmasCursos() {
    const items = ref<any[]>([]);
    const isLoading = ref(false);
    const pagination = ref({
        pagina_atual: 1,
        qtd_paginas: 1,
        qtd_total: 0,
    });

    const fetchCursos = async (params: {
        area: string | null;
        search: string | null;
        page: number;
    }) => {
        isLoading.value = true;
        try {
            const data: any = await ofetch("/api/cursos-turmas", {
                params: {
                    area: params.area,
                    nome: params.search || null,
                    pagina: params.page,
                    limite: 12,
                },
            });

            if (data && data.itens) {
                items.value = data.itens;
                pagination.value = {
                    pagina_atual: data.pagina_atual,
                    qtd_paginas: data.qtd_paginas,
                    qtd_total: data.qtd_total,
                };
            } else {
                items.value = [];
            }
        } catch (e: any) {
            console.error("Error fetching cursos:", e);
            throw e;
        } finally {
            isLoading.value = false;
        }
    };

    return {
        items,
        isLoading,
        pagination,
        fetchCursos,
    };
}
