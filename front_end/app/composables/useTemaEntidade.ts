/**
 * useTemaEntidade — aplica o tema + branding da entidade em páginas
 * DESLOGADAS (auth, landings) resolvendo a entidade pelo domínio via BFF.
 *
 * - Chama `server/api/entidade/dominio.get.ts` (BFF → RPC SECURITY DEFINER).
 * - Aplica `--color-*` do branding e `data-theme` da entidade.
 * - Respeita a preferência manual do usuário: se `localStorage.theme`
 *   existir, ele prevalece sobre o tema da entidade (mesma regra do
 *   `aplicarTemaDaEntidade` do store/app).
 *
 * Uso:
 *   const { aplicarTemaDaEntidadePublica } = useTemaEntidade();
 *   onMounted(async () => { await aplicarTemaDaEntidadePublica(); });
 */
export interface EntidadePublicaInfo {
    id: string;
    nome: string;
    tema: string;
    branding: any;
    url?: string;
}

export interface AplicarTemaPublicoResult {
    success: boolean;
    entidade?: EntidadePublicaInfo;
}

export function useTemaEntidade() {
    // Estado reativo da entidade resolvida (ex.: p/ acessar logo_aberto/fechado na UI)
    const entidadePublica = ref<EntidadePublicaInfo | null>(null);
    // Reativo ao tema atual aplicado no <html> (para o logo alternar automaticamente)
    const isDark = ref(false);
    let observerInstalled = false;

    function readDataTheme() {
        if (!import.meta.client) return;
        const t = document.documentElement.getAttribute("data-theme");
        isDark.value = t === "dark";
    }

    /** Observa data-theme no <html> para que mudanças de tema re-renderizem a UI (logo). */
    function installTemaObserver() {
        if (!import.meta.client || observerInstalled) return;
        observerInstalled = true;
        readDataTheme();
        const mo = new MutationObserver(() => readDataTheme());
        mo.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });
    }

    /**
     * Converte "#RRGGBB" em "R, G, B" para o token --color-primary-rgb.
     */
    function hexToRgbString(hex: string): string | null {
        const m = /^#?([0-9a-fA-F]{6})$/.exec((hex || "").trim());
        if (!m) return null;
        const digits = m[1] ?? "";
        const n = parseInt(digits, 16);
        return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
    }

    /**
     * Busca a entidade e aplica tema + branding.
     * - `id?`: passa `?id=` ao BFF (quando a página já sabe a entidade, ex.: oferta).
     * - Sem `id`: resolve pelo domínio (white label).
     * No retorno: { success: true, entidade } se aplicou, { success: false } se não encontrou.
     */
    async function aplicarTemaDaEntidadePublica(id?: string): Promise<AplicarTemaPublicoResult> {
        if (!import.meta.client) return { success: false };

        installTemaObserver();

        let entidade: any = null;
        try {
            const res = await $fetch<{ success: boolean; id?: string; tema?: string; branding?: any; nome?: string; url?: string }>(
                `/api/entidade/dominio${id ? `?id=${encodeURIComponent(id)}` : ""}`,
            );
            if (res?.success) entidade = res;
        } catch (e) {
            console.warn("[useTemaEntidade] falha ao resolver entidade:", e);
        }
        if (!entidade) return { success: false };

        const doc = document.documentElement;

        // Branding: cores da marca da entidade
        const b = entidade.branding;
        const apply = (name: string, value: string | null | undefined) => {
            if (value) doc.style.setProperty(name, value);
        };
        apply("--color-primary", b?.cor_principal);
        apply("--color-primary-hover", b?.cor_principal_hover);
        apply("--color-secondary", b?.cor_secundaria);
        apply("--color-secondary-hover", b?.cor_secundaria_hover);
        const cor = b?.cor_principal;
        if (cor) {
            const rgb = hexToRgbString(cor);
            if (rgb) apply("--color-primary-rgb", rgb);
        }

        // Tema: só aplica se o usuário NÃO escolheu manualmente
        if (!localStorage.getItem("theme")) {
            const t = entidade.tema === "light" ? "light" : "dark";
            doc.setAttribute("data-theme", t);
        }
        readDataTheme();

        entidadePublica.value = {
            id: entidade.id,
            nome: entidade.nome,
            tema: entidade.tema,
            branding: entidade.branding,
            url: entidade.url,
        };

        return {
            success: true,
            entidade: entidadePublica.value,
        };
    }

    return { aplicarTemaDaEntidadePublica, entidadePublica, isDark };
}
