<script setup lang="ts">
/**
 * LandingFooter.vue - Rodapé oficial da landing page ENSI
 *
 * Exibe o logo_aberto da entidade no rodapé (sem o texto ENSI ao lado).
 */
const props = defineProps<{
    logo?: string | null;
}>();

const currentYear = new Date().getFullYear();
const localLogo = ref<string | null>(null);

onMounted(async () => {
    if (!props.logo) {
        const { aplicarTemaDaEntidadePublica } = useTemaEntidade();
        const res = await aplicarTemaDaEntidadePublica();
        if (res.success && res.entidade?.branding) {
            localLogo.value = res.entidade.branding.logo_aberto || res.entidade.branding.logo_fechado || null;
        }
    }
});

const currentLogo = computed(() => props.logo || localLogo.value);

const scrollTo = (id: string) => {
    if (!import.meta.client) return;
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: "smooth" });
    }
};
</script>

<template>
    <footer class="bg-background border-t border-divider py-16 px-5 md:px-16 text-text">
        <div class="max-w-6xl mx-auto space-y-12">
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                
                <!-- Coluna 1: Logo Aberto & Resumo -->
                <div class="space-y-4 md:col-span-1">
                    <a href="#" class="inline-block">
                        <img
                            v-if="currentLogo"
                            :src="currentLogo"
                            alt="ENSI Logo"
                            class="h-10 w-auto object-contain"
                        />
                        <div
                            v-else
                            class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg tracking-tighter"
                        >
                            E
                        </div>
                    </a>
                    <p class="text-xs font-bold text-secondary/70 leading-relaxed">
                        Escola Nacional de Saúde Integrada. Formando profissionais de excelência em saúde.
                    </p>
                </div>

                <!-- Coluna 2: Navegação -->
                <div class="space-y-3">
                    <p class="text-[10px] font-black uppercase tracking-widest text-primary">Navegação</p>
                    <ul class="space-y-2 text-xs font-bold text-secondary">
                        <li>
                            <button @click="scrollTo('sobre')" class="hover:text-primary transition-colors cursor-pointer">
                                Sobre a ENSI
                            </button>
                        </li>
                        <li>
                            <button @click="scrollTo('cursos')" class="hover:text-primary transition-colors cursor-pointer">
                                Cursos & Soluções
                            </button>
                        </li>
                        <li>
                            <button @click="scrollTo('diferenciais')" class="hover:text-primary transition-colors cursor-pointer">
                                Diferenciais
                            </button>
                        </li>
                        <li>
                            <button @click="scrollTo('duvidas')" class="hover:text-primary transition-colors cursor-pointer">
                                Dúvidas Frequentes
                            </button>
                        </li>
                    </ul>
                </div>

                <!-- Coluna 3: Alunos & Portal -->
                <div class="space-y-3">
                    <p class="text-[10px] font-black uppercase tracking-widest text-primary">Área do Aluno</p>
                    <ul class="space-y-2 text-xs font-bold text-secondary">
                        <li>
                            <NuxtLink to="/auth/login" class="hover:text-primary transition-colors flex items-center gap-1.5">
                                <Icon name="ph:sign-in-bold" class="w-3.5 h-3.5 text-primary" />
                                <span>Acessar Ambiente Virtual</span>
                            </NuxtLink>
                        </li>
                        <li>
                            <NuxtLink to="/auth/recuperar_senha" class="hover:text-primary transition-colors">
                                Recuperar Senha
                            </NuxtLink>
                        </li>
                        <li>
                            <NuxtLink to="/auth/cadastro" class="hover:text-primary transition-colors">
                                Novo Cadastro
                            </NuxtLink>
                        </li>
                    </ul>
                </div>

                <!-- Coluna 4: Redes & Contato -->
                <div class="space-y-3">
                    <p class="text-[10px] font-black uppercase tracking-widest text-primary">Conecte-se</p>
                    <!-- PLACEHOLDER: O usuário poderá adicionar links de redes sociais oficiais -->
                    <div class="flex items-center gap-3 pt-1">
                        <a href="#" class="w-9 h-9 rounded-xl bg-div-15 border border-divider flex items-center justify-center text-secondary hover:text-primary hover:border-primary/40 transition-all">
                            <Icon name="ph:linkedin-logo-bold" class="w-4 h-4" />
                        </a>
                        <a href="#" class="w-9 h-9 rounded-xl bg-div-15 border border-divider flex items-center justify-center text-secondary hover:text-primary hover:border-primary/40 transition-all">
                            <Icon name="ph:instagram-logo-bold" class="w-4 h-4" />
                        </a>
                        <a href="#" class="w-9 h-9 rounded-xl bg-div-15 border border-divider flex items-center justify-center text-secondary hover:text-primary hover:border-primary/40 transition-all">
                            <Icon name="ph:youtube-logo-bold" class="w-4 h-4" />
                        </a>
                    </div>
                </div>

            </div>

            <!-- Divisor e Copyright -->
            <div class="pt-8 border-t border-divider flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold text-secondary/60">
                <p>© {{ currentYear }} ENSI — Escola Nacional de Saúde Integrada. Todos os direitos reservados.</p>
                <p class="flex items-center gap-1">
                    <span>Powered by EduClick White Label</span>
                </p>
            </div>

        </div>
    </footer>
</template>

<style scoped>
/* SFC Style - Footer ENSI */
</style>
