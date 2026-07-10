/**
 * Resolve o favicon baseado no tenant.
 *
 * Hoje: retorna sempre o logo padrão do Educlick.
 * Futuro: mapeia hostname → favicon do cliente.
 */
export function useFavicon() {
    // Futuro: resolver tenant a partir do hostname
    const tenant = "Institucional";

    const favicons: Record<string, string> = {
        Institucional: "/favicon_educlick.png",
        // Exemplo futuro:
        // Clienteabc: "/clienteabc_favicon.png",
    };

    return favicons[tenant] ?? favicons["Institucional"];
}
