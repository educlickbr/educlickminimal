export default defineNuxtConfig({
  // 1. Registro de Módulos (A tríade sagrada)
  app: {
    head: {
      link: [
        { rel: "icon", type: "image/png", href: "/favicon_educlick.png" },
      ],
      style: [
        {
          innerHTML:
            "html, body { background-color: #0a0a0c !important; color: white; margin: 0; padding: 0; }",
        },
      ],
    },
  },
  modules: [
    "@nuxtjs/tailwindcss",
    "@pinia/nuxt",
    "@nuxtjs/supabase",
    "@nuxt/icon",
  ],

  // CSS Global (Variáveis CSS, Reset, Fontes)
  css: ["~/assets/css/style.css"],

  // 2. Configuração do Supabase (Segurança JWT)
  supabase: {
    redirectOptions: {
      login: "/auth/login",
      callback: "/confirm",
      exclude: [
        "/",
        "/teste-layout",
        "/oferta",
        "/trabalhe-conosco",
        "/cadastro-docente/**",
        "/test",
        "/form/**",
        "/auth/**",
      ],
    },
  },

  // 3. Pinia Auto-imports
  pinia: {
    storesDirs: ["./stores/**"],
  },

  devtools: { enabled: true },

  // 4. Runtime config (variáveis de ambiente expostas ao servidor)
  runtimeConfig: {
    powerAutomateLinkWebhook:
      process.env.POWER_AUTOMATE_LINK || "",
    powerAutomateTokenCadastro:
      process.env.POWER_AUTOMATE_TOKEN_CADASTRO || "",
  },

  // 5. Vite - permitir hosts externos (ngrok)
  vite: {
    server: {
      allowedHosts: true,
    },
  },
});
