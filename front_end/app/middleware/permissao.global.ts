import { useAppStore } from "../../stores/app";
import { recursoDaRota } from "../utils/catalogoPermissoes";

/**
 * Middleware global de sessão + permissão de rota (Fase C).
 *
 * Regras:
 *  - Login: deixado para o @nuxtjs/supabase (redirectOptions). Aqui só garantimos
 *    que o store esteja inicializado.
 *  - Permissão de rota: apenas rotas catalogadas em `catalogoPermissoes` são
 *    protegidas. Rota sem recurso no catálogo passa (proteção fina por fase).
 *  - Roda só no client (SSR reentrega sem cookies de forma confiável; o supabase
 *    cuida do login no server). Evita quebrar o callback /confirm e o SSR.
 */
export default defineNuxtRouteMiddleware(async (to) => {
    if (import.meta.server) return;

    const store = useAppStore();

    // Garante sessão carregada (login é tratado pelo supabase).
    if (!store.initialized) {
        try {
            await store.initSession();
        } catch (e) {
            console.warn("[middleware] initSession falhou:", e);
        }
    }

    // Usuário não logado -> supabase cuida do redirect. Saímos para não conflitar.
    if (!store.user) return;

    // Proteção de rota catalogada
    const recurso = recursoDaRota(to.path);
    if (recurso && !store.temPermissao(recurso.ilha, recurso.botao)) {
        return navigateTo(store.rota_inicial || "/");
    }
});
