import { defineStore } from "pinia";
import { useSupabaseClient } from "#imports";
import { $fetch } from "ofetch";
import { recursoDaRota, CATALOGO_PERMISSOES } from "../app/utils/catalogoPermissoes";

// Role Definitions (legado — pendurou-se por nome de papel dinâmico; mantidos para compat)
export const ROLES = {
    ADMIN: "admin",
    PROFESSOR: "aca_docente",
    ALUNO: "aca_estudante",
};

interface Permissao {
    ilha: string;
    botao: string | null;
    escopo: string;
    rota: string | null;
}

/** Converte um hex "#RRGGBB" em "R, G, B" (para usar em rgba(var(--color-primary-rgb), x)). */
function hexToRgbString(hex: string): string | null {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
    if (!m) return null;
    const digits = m[1] ?? "";
    const n = parseInt(digits, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `${r}, ${g}, ${b}`;
}

export const useAppStore = defineStore("app", {
    state: () => ({
        user: null as any,
        profile: null as any,
        company: null as any,
        entidades: [] as any[],
        role: null as any,

        // Multientidade / permissões
        entidade_ativa: null as any,
        papeis: [] as any[],
        permissoes: [] as Permissao[],
        is_admin: false,
        rota_inicial: "/" as string,
        branding: null as any,
        sem_acesso: false,

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
    getters: {
        /** Conjunto de chaves de permissão: 'ilha' e 'ilha:botao'. */
        chavesPermissao(state): Set<string> {
            const set = new Set<string>();
            for (const p of state.permissoes) {
                if (p.escopo === "rota" && p.rota) {
                    set.add(`rota:${p.rota}`);
                    continue;
                }
                if (p.botao) set.add(`${p.ilha}:${p.botao}`);
                else set.add(p.ilha);
            }
            return set;
        },
    },
    actions: {
        async initSession() {
            // Fetch ALL session data from BFF in a single call
            try {
                const data = await $fetch("/api/me") as any;

                // Map BFF fields to store state
                this.user = data.user || data.usuario || null;
                this.profile = data.profile || null;
                this.entidades = data.entidades || [];
                this.company = data.company ||
                    this.entidades.find((ent: any) => ent.tipo === "empresa") ||
                    this.entidades[0] || null;
                this.hash_base = data.hash_base;

                // Multientidade / permissões (Fase B)
                this.entidade_ativa = data.entidade_ativa || null;
                this.papeis = data.papeis || [];
                this.permissoes = data.permissoes || [];
                this.is_admin = data.is_admin || false;
                this.rota_inicial = data.rota_inicial || "/";
                this.branding = data.entidade_ativa?.branding || null;

                // Gate de produto (Fase F): sem acesso ao produto da frente
                this.sem_acesso = data.sem_acesso === true;

                // Expedir/entidade ativa: campo de conveniência (aliases de branding)
                // Mantém compat com código antigo que acessa store.entidade_ativa.nome_entidade
                if (this.entidade_ativa && !this.entidade_ativa.nome_entidade) {
                    this.entidade_ativa.nome_entidade = this.entidade_ativa.nome;
                }

                // Papel por entidade ativa (corrige o bug do store.role)
                const primeiroPapel = this.papeis[0] || null;
                this.role = primeiroPapel
                    ? { papel_id: primeiroPapel.id, nome: primeiroPapel.nome }
                    : null;

                // Expanded Profile Fields
                this.user_expandido_id = data.user_expandido_id;
                this.nome = data.nome;
                this.sobrenome = data.sobrenome;
                this.imagem_user = data.imagem_user;
                this.eixo = data.eixo;

                // Aplica branding dinâmico (cores da entidade ativa)
                this.aplicarBranding();

                // Tema claro/escuro definido pela entidade (item 2)
                // Aplica como padrão apenas se o usuário ainda não escolheu manualmente
                this.aplicarTemaDaEntidade(data.tema || this.entidade_ativa?.tema || null);
            } catch (err) {
                console.warn(
                    "BFF /api/me call failed, continuing with basic session.",
                );
            }

            this.initialized = true;
        },

        /**
         * Aplica o branding da entidade ativa via variáveis CSS.
         * Tailwind consome var(--color-*), então a troca é instantânea.
         */
        aplicarBranding() {
            if (!import.meta.client) return;
            const b = this.branding;
            const set = (name: string, value: string | null | undefined) => {
                if (value) {
                    document.documentElement.style.setProperty(name, value);
                }
            };
            set("--color-primary", b?.cor_principal);
            set("--color-primary-hover", b?.cor_principal_hover);
            set("--color-secondary", b?.cor_secundaria);
            set("--color-secondary-hover", b?.cor_secundaria_hover);
            // Glow seguem a cor: converte o hex da cor principal em "R, G, B"
            // (o CSS usa rgba(var(--color-primary-rgb), <opacidade>)).
            const corPrincipal = b?.cor_principal;
            if (corPrincipal) {
                const rgb = hexToRgbString(corPrincipal);
                if (rgb) set("--color-primary-rgb", rgb);
            }
        },

        /** Remove o branding dinâmico (volta aos tokens default do :root). */
        resetBranding() {
            if (!import.meta.client) return;
            for (const name of [
                "--color-primary",
                "--color-primary-hover",
                "--color-primary-rgb",
                "--color-secondary",
                "--color-secondary-hover",
            ]) {
                document.documentElement.style.removeProperty(name);
            }
        },

        /**
         * Aplica o tema definido pela entidade (claro/escuro) como padrão,
         * mas respeita a escolha manual do usuário (localStorage.theme) se ele
         * já alternou com o toggle do header.
         */
        aplicarTemaDaEntidade(tema: string | null | undefined) {
            if (!import.meta.client) return;
            // usuário já escolheu manualmente? respeita
            if (localStorage.getItem("theme")) return;
            const t = tema === "light" ? "light" : "dark";
            this.isDark = t === "dark";
            document.documentElement.setAttribute("data-theme", t);
        },

        /**
         * Checa permissão. Escopos:
         *  - temPermissao('academico')                     -> ilha inteira
         *  - temPermissao('academico', 'avaliacoes')       -> botão específico
         *  - temPermissao(undefined, undefined, '/rota')   -> rota protegida
         */
        temPermissao(
            ilha?: string,
            botao?: string,
            rota?: string,
        ): boolean {
            if (this.is_admin) return true;
            const keys = this.chavesPermissao;

            // por rota
            if (rota) {
                if (keys.has(`rota:${rota}`)) return true;
                // rota pode pertencer a um recurso catalogado; cascata para ilha/botao
                const recurso = recursoDaRota(rota);
                if (recurso) {
                    return this.temPermissao(recurso.ilha, recurso.botao);
                }
                return false;
            }

            if (!ilha) return false;
            // botão específico
            if (botao) {
                // ilha inteira ou o botão específico
                return keys.has(ilha) || keys.has(`${ilha}:${botao}`);
            }
            // ilha inteira
            return keys.has(ilha);
        },

        /**
         * True se a ilha deve aparecer no menu: usuario tem a ilha inteira
         * OU qualquer botão da ilha (ex.: docente tem só 3 botões do academico).
         */
        temIlha(ilha: string): boolean {
            if (this.is_admin) return true;
            const keys = this.chavesPermissao;
            if (keys.has(ilha)) return true;
            return CATALOGO_PERMISSOES.some(
                (r) => r.ilha === ilha && keys.has(`${ilha}:${r.botao}`),
            );
        },

        /***
         * Atalho para checar permissão de rota (cascata por catálogo). */
        temPermissaoRota(rota: string): boolean {
            return this.temPermissao(undefined, undefined, rota);
        },

        /** Resolve a primeira rota permitida (fallback pós-login / redirecionamento). */
        primeiraRotaPermitida(): string {
            if (this.is_admin) return this.rota_inicial || "/";
            return this.rota_inicial || "/";
        },

        clearProfile() {
            this.user = null;
            this.profile = null;
            this.company = null;
            this.entidades = [];
            this.role = null;
            this.user_expandido_id = null;
            this.nome = null;
            this.sobrenome = null;
            this.imagem_user = null;
            this.eixo = null;
            this.hash_base = null;

            // multientidade
            this.entidade_ativa = null;
            this.papeis = [];
            this.permissoes = [];
            this.is_admin = false;
            this.rota_inicial = "/";
            this.branding = null;
            this.sem_acesso = false;
            this.resetBranding();
        },
        async logout() {
            const supabase = useSupabaseClient();
            await supabase.auth.signOut();

            // Clear session data locally
            this.clearProfile();

            // Re-fetch to normalize state
            await this.initSession();
        },
        hasRole(allowedRoles: string[]) {
            if (!this.role?.nome) return false;
            return allowedRoles.includes(this.role.nome);
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
                document.documentElement.setAttribute(
                    "data-theme",
                    this.isDark ? "dark" : "light",
                );
                localStorage.setItem(
                    "theme",
                    this.isDark ? "dark" : "light",
                );
            }
        },
        initTheme() {
            if (import.meta.client) {
                const savedTheme = localStorage.getItem("theme");
                // se o usuário já escolheu um tema (toggle), respeita;
                // senão, default escuro (o initSession pode sobrescrever pelo tema da entidade)
                this.isDark = savedTheme !== "light";
                document.documentElement.setAttribute(
                    "data-theme",
                    this.isDark ? "dark" : "light",
                );
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
                const data = await $fetch("/api/refresh-hash") as any;

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
