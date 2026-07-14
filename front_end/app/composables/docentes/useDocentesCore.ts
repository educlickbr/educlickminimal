import { ref } from "vue";

/**
 * Core da página /docentes — abas fixas e identidade da entidade.
 */
export function useDocentesCore() {
    const route = useRoute();
    const router = useRouter();

    const fallbackId = "00ca60ea-6667-482d-8a96-09b877707b08";
    const idEntidade = () =>
        (route.query.id_entidade as string) || fallbackId;

    // ── Abas fixas ──────────────────────────────────────────
    const TABS = [
        { id: "editais", label: "Editais" },
        { id: "selecao", label: "Seleção" },
        { id: "docentes", label: "Docentes" },
        { id: "curriculos", label: "Currículos" },
    ];

    const initialTab = (route.query.tab as string) || "editais";
    const activeTab = ref<string>(initialTab);

    function setActiveTab(k: string) {
        activeTab.value = k;
        router.replace({ query: { ...route.query, tab: k } });
    }

    return {
        idEntidade,
        TABS,
        activeTab,
        setActiveTab,
    };
}
