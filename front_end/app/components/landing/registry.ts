/**
 * Registro estático de componentes de landing page por tenant.
 *
 * Cada tenant é uma pasta em components/landing/<tenant>/
 * com os mesmos nomes de componente (LandingHeader, LandingHero, etc).
 *
 * Para adicionar um novo cliente:
 * 1. Crie a pasta components/landing/<nome>/
 * 2. Copie os componentes e customize
 * 3. Adicione a entrada neste registry
 * 4. Mapeie o hostname → tenant no useLandingTenant
 */
import { defineAsyncComponent, type Component } from "vue";

type TenantName = "Institucional";
type ComponentName =
    | "LandingHeader"
    | "LandingHero"
    | "LandingDor"
    | "LandingCore"
    | "LandingFuncionalidades"
    | "LandingDiferencial"
    | "LandingFormulario"
    | "LandingFooter";

const registry: Record<TenantName, Record<ComponentName, Component>> = {
    Institutional: {
        LandingHeader: defineAsyncComponent(
            () =>
                import(
                    "~/components/landing/institucional/LandingHeader.vue"
                ),
        ),
        LandingHero: defineAsyncComponent(
            () =>
                import(
                    "~/components/landing/institucional/LandingHero.vue"
                ),
        ),
        LandingDor: defineAsyncComponent(
            () =>
                import(
                    "~/components/landing/institucional/LandingDor.vue"
                ),
        ),
        LandingCore: defineAsyncComponent(
            () =>
                import(
                    "~/components/landing/institucional/LandingCore.vue"
                ),
        ),
        LandingFuncionalidades: defineAsyncComponent(
            () =>
                import(
                    "~/components/landing/institucional/LandingFuncionalidades.vue"
                ),
        ),
        LandingDiferencial: defineAsyncComponent(
            () =>
                import(
                    "~/components/landing/institucional/LandingDiferencial.vue"
                ),
        ),
        LandingFormulario: defineAsyncComponent(
            () =>
                import(
                    "~/components/landing/institucional/LandingFormulario.vue"
                ),
        ),
        LandingFooter: defineAsyncComponent(
            () =>
                import(
                    "~/components/landing/institucional/LandingFooter.vue"
                ),
        ),
    },
};

/** Retorna o componente registrado para o tenant atual, ou fallback */
export function getLandingComponent(
    tenant: string,
    name: ComponentName,
): Component {
    const tenantEntry = registry[tenant as TenantName];
    if (tenantEntry && tenantEntry[name]) {
        return tenantEntry[name];
    }

    // Fallback para institucional
    return registry["Institucional"][name];
}
