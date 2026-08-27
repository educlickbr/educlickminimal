<template>
    <footer class="py-12 border-t border-white/5 text-center">
        <div class="flex flex-col items-center gap-4">
            <!-- Logo -->
            <img
                src="/educlick_logo.png"
                alt="Educlick"
                class="h-7 w-auto opacity-60 hover:opacity-100 transition-opacity"
            />

            <!-- Zero Tropical -->
            <p class="text-xs text-secondary/60">
                Desenvolvido por
                <a
                    href="https://zerotropical.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-bold text-secondary hover:text-primary transition-colors"
                >
                    0/tropical
                </a>
            </p>

            <a
                href="https://zerotropical.com.br"
                target="_blank"
                rel="noopener noreferrer"
                class="text-[10px] font-bold uppercase tracking-wider text-white/20 hover:text-primary transition-colors"
            >
                Conheça a 0/tropical
                <span class="ml-0.5">→</span>
            </a>
        </div>

        <p class="text-[10px] uppercase tracking-widest text-white/15 font-bold mt-8">
            © {{ new Date().getFullYear() }} Educlick
        </p>
    </footer>
</template>

<style scoped>
/* SFC Style */
</style>
