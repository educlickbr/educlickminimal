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
export function useTemaEntidade() {
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
     * Busca a entidade pelo host e aplica tema + branding.
     * No retorno: true se aplicou, false se não encontrou.
     */
    async function aplicarTemaDaEntidadePublica(): Promise<boolean> {
        if (!import.meta.client) return false;

        let entidade: any = null;
        try {
            const res = await $fetch<{ success: boolean; tema?: string; branding?: any; nome?: string }>(
                "/api/entidade/dominio",
            );
            if (res?.success) entidade = res;
        } catch (e) {
            console.warn("[useTemaEntidade] falha ao resolver entidade:", e);
        }
        if (!entidade) return false;

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

        return true;
    }

    return { aplicarTemaDaEntidadePublica };
}
