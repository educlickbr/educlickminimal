import { defineStore } from "pinia";
import { usePermissionsStore } from "./permissions";

// Role Definitions
export const ROLES = {
    ADMIN: "a29da0f6-ce00-4535-ad9e-22752960b0c3",
    DOCENTE: "8f3d1cd3-75fd-4549-b4ea-2b2e1411c2ec",
    ESTUDANTE: "9a33b6e1-13ae-4029-85f9-ec02fba4b5f2",
    CANDIDATO: "d19ba89e-9a15-4194-929a-db47695fb2be",
    SECRETARIA: "cf96c718-633d-49bb-a448-4b591c3fb9bf",
    PRODUCAO: "5568548e-856c-4a2e-99f3-a2d7fe5a15e9",
    DOCENTE_COLABORADOR: "49c397b5-cbee-4967-ae4f-085644ad9414",
    ANALISTAS: "fbae2a34-8f84-464d-8f04-11e8f65443f9",
    ASSISTENTES: "e4a0f9c0-7612-4cf9-92c7-aa6ab781dabf",
    COORDENADORES: "65aae4d3-f4cd-4b47-ac2d-aaab3a301c78",
    CONVIDADOS: "1ff10e30-3a2b-4a61-ba8c-0d74ba2cde6b",
    CURADORES: "d46726aa-9d99-4073-9463-9b34ad2ae95d",
};

export const useAppStore = defineStore("app", {
    state: () => ({
        user: null as any,
        profile: null as any,
        company: null as any,
        role: null as any,

        // Expanded Profile Data
        user_expandido_id: null as string | null,
        nome: null as string | null,
        sobrenome: null as string | null,
        imagem_user: null as string | null,
        eixo: null as string | null,
        hash_base: null as string | null,

        initialized: false,
        isLoading: false,
        isMenuOpen: false,
        isDark: false,
        statusMessage: {
            title: null as string | null,
            message: null as string | null,
            type: "info" as "success" | "error" | "info" | null,
            actionLabel: null as string | null,
            actionPath: null as string | null,
        },
    }),
    actions: {
        async initSession() {
            // Fetch ALL session data from BFF in a single call
            try {
                const data = await ($fetch as any)("/api/me");

                // Map BFF fields to store state
                this.user = data.user;
                this.profile = data.profile;
                this.company = data.company;
                this.role = data.role;
                this.hash_base = data.hash_base;

                // Expanded Profile Fields
                this.user_expandido_id = data.user_expandido_id;
                this.nome = data.nome;
                this.sobrenome = data.sobrenome;
                this.imagem_user = data.imagem_user;
                this.eixo = data.eixo;
            } catch (err) {
                console.warn(
                    "BFF /api/me call failed, continuing with basic session.",
                );
            }

            this.initialized = true;
        },
        clearProfile() {
            this.user = null;
            this.profile = null;
            this.role = null;
            this.user_expandido_id = null;
            this.nome = null;
            this.sobrenome = null;
            this.imagem_user = null;
            this.eixo = null;
            this.hash_base = null;
        },
        async logout() {
            const supabase = useSupabaseClient();
            await supabase.auth.signOut();

            // Clear session data locally
            this.clearProfile();

            // Clear Permissions
            const permissionsStore = usePermissionsStore();
            permissionsStore.reset();

            // Reset initialization flag without re-fetching
            this.initialized = false;
        },
        hasRole(allowedRoles: string[]) {
            if (!this.role) return false;
            return allowedRoles.includes(this.role.papel_id);
        },
        hasRoleByName(allowedNames: string[]) {
            if (!this.role || !this.role.nome) return false;
            // Normalize to lowercase for comparison
            const roleName = this.role.nome.toLowerCase();
            return allowedNames.some(name => name.toLowerCase() === roleName);
        },
        setLoading(val: boolean) {
            this.isLoading = val;
        },
        toggleMenu() {
            this.isMenuOpen = !this.isMenuOpen;
        },
        toggleTheme() {
            this.isDark = !this.isDark;
            if (import.meta.client) {
                if (this.isDark) {
                    document.documentElement.setAttribute("data-theme", "dark");
                } else document.documentElement.removeAttribute("data-theme");
                localStorage.setItem("theme", this.isDark ? "dark" : "light");
            }
        },
        initTheme() {
            if (import.meta.client) {
                const savedTheme = localStorage.getItem("theme");
                this.isDark = savedTheme === "dark" ||
                    (!savedTheme &&
                        window.matchMedia("(prefers-color-scheme: dark)")
                            .matches);
                if (this.isDark) {
                    document.documentElement.setAttribute("data-theme", "dark");
                } else document.documentElement.removeAttribute("data-theme");
            }
        },
        setStatusMessage(
            payload: {
                title?: string;
                message?: string;
                type?: "success" | "error" | "info";
                actionLabel?: string;
                actionPath?: string;
            },
        ) {
            this.statusMessage = {
                title: payload.title || null,
                message: payload.message || null,
                type: payload.type || "info",
                actionLabel: payload.actionLabel || null,
                actionPath: payload.actionPath || null,
            };
        },
        /**
         * 🔄 Renova APENAS a hash do Bunny.net
         * Útil quando a hash expira (5 min) mas não queremos refazer todo o /api/me
         * Muito mais leve: só 1 chamada (hash_app) vs 2 (hash_app + get_user_expandido)
         */
        async refreshHash() {
            try {
                const data = await ($fetch as any)("/api/refresh-hash");

                if (data.hash_base) {
                    this.hash_base = data.hash_base;
                    console.log("✅ Hash renovada:", data.refreshed_at);
                } else {
                    console.warn("⚠️ Falha ao renovar hash:", data.error);
                }

                return data.hash_base;
            } catch (err) {
                console.error("Erro ao renovar hash:", err);
                return null;
            }
        },
    },
});
