import { ref } from "vue";

/**
 * Core da página /matriculas — áreas, tabs e identidade da entidade.
 * Padrão idêntico ao useProcessosCore.ts.
 */
export function useMatriculasCore() {
    const route = useRoute();
    const router = useRouter();

    const fallbackId = "00ca60ea-6667-482d-8a96-09b877707b08";
    const idEntidade = () =>
        (route.query.id_entidade as string) || fallbackId;

    const loadingAreas = ref(true);
    const areas = ref<any[]>([]);

    async function fetchAreas() {
        loadingAreas.value = true;
        try {
            const res = (await $fetch("/api/matriculas", {
                params: { id_entidade: idEntidade() },
            })) as any;
            if (res?.success && Array.isArray(res.itens)) {
                areas.value = res.itens;
            }
        } catch (e) {
            console.error("Erro ao carregar áreas:", e);
        } finally {
            loadingAreas.value = false;
        }
    }

    const activeTab = ref<string>("todas");

    function setActiveTab(k: string) {
        activeTab.value = k;
        router.replace({ query: { ...route.query, tab: k } });
    }

    return {
        idEntidade,
        loadingAreas,
        areas,
        activeTab,
        setActiveTab,
        fetchAreas,
    };
}
