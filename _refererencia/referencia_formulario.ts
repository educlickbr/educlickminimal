<template>
    <div class="site">
        <header class="topbar">
            <div class="container topbar-inner">
                <a class="brand" href="#">0/tropical</a>
                <nav class="menu">
                    <a href="#caos">Caos</a>
                    <a href="#solucao">Solução</a>
                    <a href="#mistura">Mistura</a>
                    <a href="#contato">Contato</a>
                    <a href="/blog">Blog</a>
                </nav>
                <a
                    href="#contato"
                    class="pill-btn topbar-cta"
                    style="
                        background: var(--brand-tertiary);
                        color: var(--brand-neutral);
                        box-shadow: var(--shadow-black);
                    "
                >
                    Descomplicar
                </a>
                <button
                    class="hamburger"
                    :class="{ 'is-open': isMenuOpen }"
                    aria-label="Abrir menu"
                    @click="isMenuOpen = !isMenuOpen"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
            <div class="mobile-menu" :class="{ 'is-open': isMenuOpen }">
                <nav class="mobile-menu-nav">
                    <a href="#caos" @click="isMenuOpen = false">Caos</a>
                    <a href="#solucao" @click="isMenuOpen = false">Solução</a>
                    <a href="#mistura" @click="isMenuOpen = false">Mistura</a>
                    <a href="#contato" @click="isMenuOpen = false">Contato</a>
                    <a href="/blog" @click="isMenuOpen = false">Blog</a>
                    <a
                        href="#contato"
                        class="pill-btn mobile-menu-cta"
                        style="
                            background: var(--brand-tertiary);
                            color: var(--brand-neutral);
                            box-shadow: var(--shadow-black);
                        "
                        @click="isMenuOpen = false"
                    >
                        Descomplicar
                    </a>
                </nav>
            </div>
        </header>

        <main>
            <section class="hero">
                <div class="container hero-content">
                    <h1>
                        Tecnologia sob medida para
                        <span>eliminar o caos.</span>
                    </h1>
                    <p>
                        Devolvemos o tempo estratégico para sua equipe gerar
                        valor real, descomplicando processos internos com
                        agilidade e proximidade.
                    </p>
                    <div class="hero-actions">
                        <a
                            href="#contato"
                            class="pill-btn"
                            style="
                                background: var(--brand-secondary);
                                color: var(--brand-neutral);
                                box-shadow: var(--shadow-black);
                            "
                        >
                            Quero descomplicar meu negócio
                        </a>
                    </div>
                    <div class="hero-visual">
                        <img
                            class="hero-logo"
                            src="/manifesto.png"
                            alt="Logo tropical da 0/tropical"
                        />
                        <div class="hero-badge">// MANIFESTO</div>
                    </div>
                </div>
            </section>

            <section id="caos" class="section caos">
                <div class="container caos-grid">
                    <div>
                        <h2>O Caos</h2>
                        <article class="caos-card">
                            <p><strong>Burocracia afoga a inovação.</strong></p>
                            <p>
                                Planilhas intermináveis, processos manuais e
                                tarefas repetitivas drenam energia da equipe e
                                atrasam decisões estratégicas.
                            </p>
                            <div class="tags">
                                <span class="tag">PROCESSOS LENTOS</span>
                                <span class="tag">TRABALHO MANUAL</span>
                            </div>
                        </article>
                    </div>
                    <div class="caos-art" aria-hidden="true">
                        <span class="caos-line caos-line-top"></span>
                        <span class="caos-line caos-line-bottom"></span>
                        <span class="caos-ball"></span>
                    </div>
                </div>
            </section>

            <section id="solucao" class="section solucao">
                <div class="container">
                    <div class="solucao-title">
                        <h2>A Proposta</h2>
                    </div>
                    <div class="cards">
                        <article class="card card-primary">
                            <h3>Desenvolvimento sob medida</h3>
                            <p>
                                Software feito sob medida para a rotina do seu
                                negócio. Do jeito certo, sem soluções
                                improvisadas.
                            </p>
                        </article>
                        <article class="card card-secondary">
                            <h3>Olho no olho</h3>
                            <p>
                                Comunicação direta com quem entende o problema e
                                constrói junto.
                            </p>
                        </article>
                        <article class="card card-success">
                            <h3>Agilidade</h3>
                            <p>
                                Entregas iterativas para gerar valor real desde
                                a primeira semana.
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            <section id="mistura" class="section mistura">
                <div class="container mistura-wrap">
                    <div class="mistura-copy">
                        <div class="mistura-title-block">
                            <h2>Mistura</h2>
                            <h2 class="mistura-highlight">Tropical</h2>
                        </div>
                        <p>
                            O mercado corporativo se acostumou com a frieza da
                            tecnologia. Nós escolhemos o humano antes. Criamos
                            soluções através do acolhimento e da troca de ideias
                            com quem vive a operação todo dia.
                        </p>
                    </div>
                    <div class="mistura-art" aria-hidden="true">
                        <div class="mistura-shape"></div>
                        <div class="mistura-badge">MARCO.ZERO</div>
                        <div class="mistura-target"></div>
                    </div>
                </div>
            </section>

            <section id="blog-home" class="section blog-home">
                <div class="container">
                    <div class="blog-home-header">
                        <h2>Blog</h2>
                        <p class="blog-home-desc">
                            Desafios práticos, tecnologia e bastidores de
                            desenvolvimento direto do dia a dia.
                        </p>
                    </div>
                    <article class="blog-featured">
                        <div class="blog-featured-content">
                            <span class="blog-featured-date">07 jul 2026</span>
                            <h3>
                                <a
                                    href="/blog/2026/07/07/por-que-trocamos-a-microsoft-pelo-nuxt"
                                    >Por que trocamos a Microsoft Power Platform
                                    pelo Nuxt</a
                                >
                            </h3>
                            <p class="blog-featured-excerpt">
                                Cansados do custo proibitivo do Power Pages em
                                dólar e buscando independência de big techs,
                                migramos nossa arquitetura — eis os motivos
                                técnicos e financeiros da mudança.
                            </p>
                            <div class="blog-featured-tags">
                                <span class="tag">TECNOLOGIA</span>
                                <span class="tag">NUXT</span>
                                <span class="tag">MICROSOFT</span>
                            </div>
                        </div>
                        <div class="blog-featured-art" aria-hidden="true">
                            <span class="blog-featured-icon">#</span>
                        </div>
                    </article>
                    <div class="blog-home-actions">
                        <a
                            href="/blog"
                            class="pill-btn"
                            style="
                                background: var(--brand-primary);
                                color: var(--brand-neutral);
                                box-shadow: var(--shadow-black);
                            "
                        >
                            Todos os posts
                        </a>
                    </div>
                </div>
            </section>

            <section id="contato" class="section contato">
                <div class="container contact-box">
                    <h2>Inicie o Contato</h2>
                    <form class="form-grid" @submit.prevent="submitLead">
                        <label for="personName">Seu nome</label>
                        <input
                            id="personName"
                            v-model.trim="form.personName"
                            class="input"
                            type="text"
                            placeholder="Ex: Maria Silva"
                            required
                        />

                        <label for="companyName">Nome da empresa</label>
                        <input
                            id="companyName"
                            v-model.trim="form.companyName"
                            class="input"
                            type="text"
                            placeholder="Ex: Empresa XYZ"
                            required
                        />

                        <label for="email">E-mail para retorno</label>
                        <input
                            id="email"
                            v-model.trim="form.email"
                            class="input"
                            type="email"
                            placeholder="maria@empresaxyz.com"
                            required
                        />

                        <label for="message">Qual o caos atual?</label>
                        <textarea
                            id="message"
                            v-model.trim="form.message"
                            class="input"
                            rows="4"
                            placeholder="Descreva brevemente o processo que precisa ser descomplicado..."
                            required
                        />

                        <p
                            v-if="feedback.message"
                            :class="[
                                'form-status',
                                feedback.type === 'success'
                                    ? 'form-status-success'
                                    : 'form-status-error',
                            ]"
                        >
                            {{ feedback.message }}
                        </p>

                        <button
                            type="submit"
                            class="pill-btn"
                            :disabled="isSubmitting"
                            style="
                                background: var(--brand-tertiary);
                                color: var(--brand-neutral);
                                box-shadow: var(--shadow-secondary);
                            "
                        >
                            {{
                                isSubmitting
                                    ? "Enviando sinal..."
                                    : "Enviar sinal"
                            }}
                        </button>
                    </form>
                </div>
            </section>
        </main>

        <footer class="footer">
            <div class="container footer-inner">
                <div class="brand">0/tropical</div>
                <div>© 2026 0/tropical. Tecnologia Sob Medida.</div>
                <div class="footer-links">
                    <a
                        href="https://www.instagram.com/zerotropical/"
                        target="_blank"
                        rel="noopener noreferrer"
                        >Instagram</a
                    >
                    <a
                        href="https://www.youtube.com/@zerotropical"
                        target="_blank"
                        rel="noopener noreferrer"
                        >YouTube</a
                    >
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
const isMenuOpen = ref(false);

const form = reactive({
    personName: "",
    companyName: "",
    email: "",
    message: "",
});

const isSubmitting = ref(false);
const feedback = reactive<{ type: "success" | "error"; message: string }>({
    type: "success",
    message: "",
});

const submitLead = async () => {
    if (isSubmitting.value) return;

    feedback.message = "";
    isSubmitting.value = true;

    try {
        await $fetch("/api/odoo-lead", {
            method: "POST",
            body: {
                personName: form.personName,
                companyName: form.companyName,
                email: form.email,
                message: form.message,
            },
        });

        feedback.type = "success";
        feedback.message =
            "Recebido! Seu contato foi enviado para nosso CRM com sucesso.";

        form.personName = "";
        form.companyName = "";
        form.email = "";
        form.message = "";
    } catch (error) {
        const defaultMessage =
            "Não foi possível enviar agora. Tente novamente em instantes.";
        const message =
            (error as { data?: { message?: string } })?.data?.message ??
            defaultMessage;

        feedback.type = "error";
        feedback.message = message;
    } finally {
        isSubmitting.value = false;
    }
};
</script>
