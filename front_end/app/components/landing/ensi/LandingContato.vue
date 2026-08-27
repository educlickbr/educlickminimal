<script setup lang="ts">
/**
 * LandingContato.vue - Canais Oficiais de Atendimento da ENSI
 *
 * Exibe os contatos reais extraídos do atendimento oficial da ENSI.
 */
</script>

<template>
    <section id="contato" class="py-20 md:py-28 px-5 md:px-16 bg-background relative border-t border-divider">
        <div class="max-w-4xl mx-auto text-center space-y-12">
            
            <!-- Cabeçalho de Contato -->
            <div class="space-y-4 max-w-2xl mx-auto">
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-md">
                    Fale Conosco
                </span>
                <h2 class="text-3xl md:text-4xl font-black text-text tracking-tight">
                    Canais Oficiais de Atendimento
                </h2>
                <p class="text-sm font-bold text-secondary/80 leading-relaxed">
                    Estamos à disposição para atender você. Entre em contato pelos nossos canais oficiais:
                </p>
            </div>

            <!-- Cards de Contatos Reais -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                
                <!-- Card 1: Telefone / WhatsApp -->
                <a
                    href="https://wa.me/5511944998004"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="bg-div-15 border border-divider rounded-2xl p-6 hover:border-primary/40 transition-all group flex flex-col justify-between space-y-4 cursor-pointer"
                >
                    <div class="space-y-3">
                        <div class="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Icon name="ph:phone-bold" class="w-6 h-6" />
                        </div>
                        <p class="text-[10px] font-black uppercase tracking-wider text-primary">Telefone / WhatsApp</p>
                        <p class="text-base font-black text-text group-hover:text-primary transition-colors">(11) 94499-8004</p>
                        <p class="text-xs font-bold text-secondary/70">Atendimento direto com nossa equipe.</p>
                    </div>
                </a>

                <!-- Card 2: E-mail -->
                <a
                    href="mailto:contato@ensi.com.br"
                    class="bg-div-15 border border-divider rounded-2xl p-6 hover:border-primary/40 transition-all group flex flex-col justify-between space-y-4 cursor-pointer"
                >
                    <div class="space-y-3">
                        <div class="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Icon name="ph:envelope-simple-bold" class="w-6 h-6" />
                        </div>
                        <p class="text-[10px] font-black uppercase tracking-wider text-primary">E-mail de Atendimento</p>
                        <p class="text-base font-black text-text group-hover:text-primary transition-colors">contato@ensi.com.br</p>
                        <p class="text-xs font-bold text-secondary/70">Dúvidas acadêmicas e institucionais.</p>
                    </div>
                </a>

                <!-- Card 3: Endereço Oficial -->
                <div class="bg-div-15 border border-divider rounded-2xl p-6 hover:border-primary/40 transition-all group flex flex-col justify-between space-y-4">
                    <div class="space-y-3">
                        <div class="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center">
                            <Icon name="ph:map-pin-bold" class="w-6 h-6" />
                        </div>
                        <p class="text-[10px] font-black uppercase tracking-wider text-primary">Endereço</p>
                        <div class="text-xs font-bold text-text space-y-1">
                            <p class="font-black text-sm">Rua Pascoal da Ribeira, 152</p>
                            <p class="text-secondary/90">Acesso pela Rua Tomás Vila Real</p>
                            <p class="text-secondary/70">Jardim Consórcio, São Paulo - SP</p>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    </section>
</template>

<style scoped>
/* SFC Style - Contato ENSI */
</style>
