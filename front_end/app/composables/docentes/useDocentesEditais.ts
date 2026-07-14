import { ref } from "vue";

/**
 * Composable para CRUD de editais de seleção docente.
 */
export function useDocentesEditais(idEntidade: () => string) {
    const loading = ref(false);
    const editais = ref<any[]>([]);

    async function fetchEditais() {
        loading.value = true;
        try {
            const res = (await $fetch("/api/docentes/editais", {
                params: { id_entidade: idEntidade() },
            })) as any;
            if (res?.success) {
                editais.value = res.itens || [];
            }
        } catch (e) {
            console.error("Erro ao carregar editais:", e);
        } finally {
            loading.value = false;
        }
    }

    async function salvarEdital(dados: any): Promise<boolean> {
        try {
            const res = (await $fetch("/api/docentes/editais", {
                method: "POST",
                body: { ...dados, id_entidade: idEntidade() },
            })) as any;
            if (res?.success) {
                await fetchEditais();
                return true;
            }
            return false;
        } catch (e) {
            console.error("Erro ao salvar edital:", e);
            return false;
        }
    }

    async function excluirEdital(id: string): Promise<boolean> {
        try {
            const res = (await $fetch("/api/docentes/editais", {
                method: "DELETE",
                params: { id, id_entidade: idEntidade() },
            })) as any;
            if (res?.success) {
                await fetchEditais();
                return true;
            }
            return false;
        } catch (e) {
            console.error("Erro ao excluir edital:", e);
            return false;
        }
    }

    return {
        loading,
        editais,
        fetchEditais,
        salvarEdital,
        excluirEdital,
    };
}

export type UseDocentesEditaisReturn = ReturnType<typeof useDocentesEditais>;
