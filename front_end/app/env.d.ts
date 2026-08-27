/// <reference types="vite/client" />

/**
 * Declaração de fallback de `import.meta.client` / `import.meta.server`.
 *
 * O Nuxt declara essas propriedades nos types gerados em `.nuxt/`. Quando o
 * `.nuxt` ainda não foi gerado (ou o TS Server não re-indexou), o editor cai
 * no `ImportMeta` genérico e reclama de `Property 'client' does not exist`.
 *
 * Aqui declaramos a mesma assinatura do Nuxt (`readonly client: boolean`).
 * Como TypeScript mescla interfaces globais de mesmo nome, esta declaração
 * não conflita quando o `.nuxt` estiver presente — é apenas um fallback.
 */
interface ImportMeta {
    readonly client: boolean;
    readonly server: boolean;
}
