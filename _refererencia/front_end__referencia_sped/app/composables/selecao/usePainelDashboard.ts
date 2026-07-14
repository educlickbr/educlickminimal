import { $fetch as ofetch } from "ofetch";
import { getPcdCount, calculateAgeDistribution } from "~/utils/demographics";

// Income Order Mapping (Value -> Priority)
const incomeOrder = [
    "ate_meio",
    "Até meio salário-mínimo",
    "ate_um",
    "Até 1 salário-mínimo",
    "um_dois",
    "De 1 a 2 salários-mínimos",
    "dois_cinco",
    "De 2 a 5 salários-mínimos",
    "cinco_dez",
    "De 5 a 10 salários-mínimos",
    "acima_dez",
    "Acima de 10 salários-mínimos",
];

export function usePainelDashboard() {
    const dashboardData = ref<any>(null);
    const isContentLoading = ref(false);

    const fetchDashboard = async (anoSemestre: string, area: string) => {
        isContentLoading.value = true;
        try {
            const data = await ofetch("/api/selecao/dashboard-demographics", {
                params: {
                    ano_semestre: anoSemestre,
                    tipo_processo: "seletivo",
                    tipo_candidatura: "estudante",
                    area,
                },
            });

            dashboardData.value = data;
        } catch (e) {
            console.error("Error fetching dashboard:", e);
        } finally {
            isContentLoading.value = false;
        }
    };

    // --- Helpers ---

    const getStatusColor = (status: string) => {
        const map: Record<string, string> = {
            Aguardando: "text-yellow-400",
            Matriculado: "text-green-400",
            Aprovado: "text-blue-400",
            Recusado: "text-red-400",
            Suplente: "text-orange-400",
        };
        return map[status] || "text-white";
    };

    const getStatusLabel = (status: string) => {
        return status || "Aguardando";
    };

    const getTotal = (arr: any[]) => {
        if (!arr) return 0;
        return arr.reduce((acc, curr) => acc + (Number(curr.qtd) || 0), 0) || 1;
    };

    const getRealTotal = (arr: any[]) => {
        if (!arr) return 0;
        return arr.reduce((acc, curr) => acc + (Number(curr.qtd) || 0), 0);
    };

    const formatLabel = (txt: string) => {
        if (!txt) return "Não Informado";
        return txt.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    };

    // --- Computed ---

    const sortedIncome = computed(() => {
        if (!dashboardData.value?.demographics?.renda) return [];
        return [...dashboardData.value.demographics.renda].sort((a: any, b: any) => {
            const idxA = incomeOrder.indexOf(a.label);
            const idxB = incomeOrder.indexOf(b.label);
            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        });
    });

    const ageDistribution = computed(() => {
        if (
            dashboardData.value?.demographics?.idade &&
            dashboardData.value.demographics.idade.length > 0
        ) {
            return dashboardData.value.demographics.idade;
        }

        const birthdates = dashboardData.value?.demographics?.nascimentos;
        return calculateAgeDistribution(birthdates);
    });

    const sortedGender = computed(() => {
        if (!dashboardData.value?.demographics?.genero) return [];
        return [...dashboardData.value.demographics.genero].sort(
            (a: any, b: any) => b.qtd - a.qtd,
        );
    });

    const sortedRace = computed(() => {
        if (!dashboardData.value?.demographics?.raca) return [];
        return [...dashboardData.value.demographics.raca].sort(
            (a: any, b: any) => b.qtd - a.qtd,
        );
    });

    return {
        dashboardData,
        isContentLoading,
        fetchDashboard,
        getStatusColor,
        getStatusLabel,
        getTotal,
        getRealTotal,
        formatLabel,
        getPcdCount,
        sortedIncome,
        ageDistribution,
        sortedGender,
        sortedRace,
    };
}
