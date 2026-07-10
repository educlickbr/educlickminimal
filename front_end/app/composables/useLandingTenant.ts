import { type Component } from "vue";
import type { ComponentName } from "~/components/landing/registry";
import { getLandingComponent } from "~/components/landing/registry";

/**
 * Resolve o tenant da landing page a partir do hostname.
 *
 * Hoje (2026-07-10): retorna sempre "Institucional".
 * Futuro: consulta tabela `landing_tenants` no Supabase para mapear
 * hostname → namespace da pasta de componentes.
 *
 * Exemplo futuro:
 *   "clienteabc.com.br" → "Clienteabc"
 *   "localhost:3000"    → "Institucional" (fallback)
 */
export function useLandingTenant() {
    const tenant = "Institucional";

    function component(name: ComponentName): Component {
        return getLandingComponent(tenant, name);
    }

    return { tenant, component };
}
