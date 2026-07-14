export default defineNuxtConfig({
  // 1. Registro de Módulos (A tríade sagrada)
  app: {
    head: {
      htmlAttrs: {
        lang: "pt-BR",
        translate: "no",
        class: "notranslate",
      },
      bodyAttrs: {
        class: "notranslate",
      },
      link: [
        {
          rel: "icon",
          type: "image/png",
          href: "/logosp_sem_fundo.png",
        },
      ],
      meta: [
        {
          name: "google",
          content: "notranslate",
        },
      ],
      style: [
        {
          innerHTML:
            "html, body { background-color: #0a0a0c !important; color: white; margin: 0; padding: 0; } #__nuxt { display: none; }",
        },
      ],
    },
  },
  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt", "@nuxtjs/supabase"],

  // CSS Global (Variáveis CSS, Reset, Fontes)
  css: ["./app/assets/css/style.css"],

  // 2. Configuração do Supabase (Segurança JWT)
  supabase: {
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      exclude: [
        "/",
        "/teste-tailwind",
        "/processo_seletivo",
        "/processo_seletivo/*",
        "/avaliacao/publica",
        "/avaliacao/publica/*",
        "/avaliacao/validar",
        "/avaliacao/validar/*",
        "/declaracao/publica",
        "/declaracao/publica/*",
        "/declaracao/validar",
        "/declaracao/validar/*",
        "/certificado/publica",
        "/certificado/publica/*",
        "/certificado/validar",
        "/certificado/validar/*",
        "/recuperar_senha",
        "/trocar_senha",
        "/cadastro",
        "/cadastro_colaborador",
        "/mensagem",
        "/access-denied",
      ],
    },
  },
  runtimeConfig: {
    powerAutomateJustificativaWebhook:
      process.env.POWER_AUTOMATE_JUSTIFICATIVA_WEBHOOK,
    public: {
      appBaseUrl: "",
      powerAutomateAvisoCandidatosInsc:
        process.env.POWER_AUTOMATE_AVISO_CANDIDATOS_INSC,
    },
  },

  // 3. Pinia Auto-imports (Para você não precisar importar 'defineStore' toda vez)
  pinia: {
    storesDirs: ["./stores/**"],
  },

  devtools: { enabled: true },
  build: {
    transpile: [
      "@tiptap/vue-3",
      "@tiptap/starter-kit",
      "@tiptap/extension-link",
    ],
  },
});
