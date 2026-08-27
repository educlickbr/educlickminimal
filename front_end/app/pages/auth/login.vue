<script setup lang="ts">
const supabase = useSupabaseClient()
import { useAppStore } from '~~/stores/app'
const store = useAppStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

// ── Onboarding inline ──────────────────────────────────────
const onboarding = ref<{
    pode_criar_conta: boolean
    nome: string
    id_user_expandido: string
} | null>(null)

const showCriarSenha = ref(false)
const codigoEnviado = ref(false)
const codigoInput = ref('')
const novaSenha = ref('')
const showNovaSenha = ref(false)
const confirmarSenha = ref('')
const showConfirmarSenha = ref(false)
const criandoConta = ref(false)
const codigoError = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Aplica o tema/branding da entidade (via BFF) quando deslogado;
// se não houver entidade resolvida, respeita a preferência manual.
onMounted(async () => {
    const { aplicarTemaDaEntidadePublica } = useTemaEntidade();
    const aplicouEntidade = await aplicarTemaDaEntidadePublica();
    if (!aplicouEntidade?.success) store.initTheme();
})

async function verificarEmail() {
    onboarding.value = null
    showCriarSenha.value = false
    codigoEnviado.value = false
    if (!email.value.trim()) return

    try {
        const res = await $fetch("/api/auth/verificar-email", {
            params: { email: email.value.trim() },
        }) as any
        if (res?.pode_criar_conta) {
            onboarding.value = res
        }
    } catch {
        // silent
    }
}

function onEmailInput() {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(verificarEmail, 500)
}

async function enviarCodigo() {
    if (!onboarding.value) return
    codigoError.value = ""
    try {
        const res = await $fetch("/api/auth/enviar-codigo", {
            method: "POST",
            body: {
                id_user_expandido: onboarding.value.id_user_expandido,
                email: email.value.trim(),
                nome: onboarding.value.nome,
            },
        }) as any
        if (res?.success) {
            codigoEnviado.value = true
        } else {
            codigoError.value = res?.message || "Erro ao enviar código."
        }
    } catch (e: any) {
        codigoError.value = e?.message || "Erro ao enviar código."
    }
}

async function criarConta() {
    codigoError.value = ""
    if (!codigoInput.value || codigoInput.value.length < 6) {
        codigoError.value = "Digite o código de 6 dígitos."
        return
    }
    if (!novaSenha.value || novaSenha.value.length < 6) {
        codigoError.value = "Senha deve ter no mínimo 6 caracteres."
        return
    }
    if (novaSenha.value !== confirmarSenha.value) {
        codigoError.value = "Senhas não conferem."
        return
    }

    criandoConta.value = true
    try {
        // 1. Verifica código via BFF
        const res = await $fetch("/api/auth/criar-conta", {
            method: "POST",
            body: {
                id_user_expandido: onboarding.value!.id_user_expandido,
                email: email.value.trim(),
                codigo: codigoInput.value,
                senha: novaSenha.value,
            },
        }) as any

        if (!res?.success) {
            codigoError.value = res?.message || "Erro ao verificar código."
            return
        }

        // 2. Cria auth user (client-side, não precisa de service role)
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: email.value.trim(),
            password: novaSenha.value,
        })

        if (signUpError || !authData?.user) {
            codigoError.value = signUpError?.message || "Erro ao criar conta."
            return
        }

        // 3. Vincula auth user ao user_expandido + papel
        const vinculo = await $fetch("/api/auth/vincular-conta", {
            method: "POST",
            body: {
                id_user_expandido: onboarding.value!.id_user_expandido,
                id_user: authData.user.id,
                email: email.value.trim(),
            },
        }) as any

        if (vinculo?.success) {
            // Login automático (signUp já logou, mas vamos garantir)
            await store.initSession()
            const redirectTo = route.query.redirectTo as string
            router.push(redirectTo || store.rota_inicial || '/')
        } else {
            codigoError.value = vinculo?.message || "Erro ao vincular conta."
        }
    } catch (e: any) {
        codigoError.value = e?.message || "Erro ao criar conta."
    } finally {
        criandoConta.value = false
    }
}

// ── Login normal ──────────────────────────────────────────
const handleLogin = async () => {
    loading.value = true
    errorMsg.value = ''
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.value,
            password: password.value
        })

        if (error) throw error

        if (data.user) {
            await store.initSession()
            const redirectTo = route.query.redirectTo as string
            router.push(redirectTo || store.rota_inicial || '/')
        }
    } catch (err: any) {
        errorMsg.value = err.message || 'Erro ao realizar login'
    } finally {
        loading.value = false
    }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-6 font-sans relative overflow-hidden">
    
    <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[180px] animate-pulse"></div>
        <div class="absolute bottom-[0%] right-[-10%] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[150px]"></div>
        <div class="absolute top-[40%] right-[10%] w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[120px]"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
        
        <div class="bg-div-15 backdrop-blur-2xl border border-divider rounded-xl p-8 md:p-12 shadow-2xl">
            
            <div class="flex flex-col items-center mb-10">
                <h1 class="text-3xl font-black text-text uppercase tracking-[0.3em] text-center">
                    LOGIN
                </h1>
                <p v-if="route.query.redirectTo" class="text-[10px] font-bold text-primary uppercase tracking-widest mt-4">
                    Faça login para continuar sua inscrição
                </p>
            </div>

            <!-- ── Fluxo 1: Login normal ── -->
            <div v-if="!showCriarSenha">
                <form @submit.prevent="handleLogin" class="space-y-6">
                    
                    <!-- Email -->
                    <div class="space-y-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60 ml-1">E-mail</label>
                        <div class="relative group">
                            <input 
                                v-model="email"
                                type="email" 
                                required
                                placeholder="seu@email.com"
                                @input="onEmailInput"
                                @blur="verificarEmail"
                                class="w-full bg-field border border-field-border rounded-lg px-5 py-4 text-sm font-bold text-field-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:field-placeholder group-hover:border-field-border"
                            />
                        </div>
                    </div>

                    <!-- Onboarding banner -->
                    <button
                        v-if="onboarding"
                        type="button"
                        class="w-full flex items-center gap-4 p-5 bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/25 rounded-xl cursor-pointer hover:from-primary/25 hover:to-primary/10 transition-all text-left"
                        @click="showCriarSenha = true"
                    >
                        <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <Icon name="ph:magic-wand-bold" class="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p class="text-sm font-black text-text">Olá, <span class="text-primary">{{ onboarding.nome }}</span>!</p>
                            <p class="text-xs text-secondary/70 mt-0.5">Você ainda não tem senha. Clique aqui para criar sua conta.</p>
                        </div>
                    </button>

                    <!-- Password (só aparece se NÃO está no onboarding) -->
                    <template v-if="!onboarding">
                        <div class="space-y-2">
                            <div class="flex items-center justify-between px-1">
                                <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">Senha</label>
                                <NuxtLink to="/auth/recuperar_senha" class="text-[10px] font-black uppercase tracking-widest text-primary hover:text-text transition-colors">Esqueceu?</NuxtLink>
                            </div>
                            <div class="relative group">
                                <input 
                                    v-model="password"
                                    :type="showPassword ? 'text' : 'password'" 
                                    required
                                    placeholder="••••••••"
                                    class="w-full bg-field border border-field-border rounded-lg px-5 py-4 text-sm font-bold text-field-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:field-placeholder group-hover:border-field-border"
                                />
                            </div>
                        </div>

                        <!-- Error -->
                        <div v-if="errorMsg" class="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-[10px] font-bold text-red-400 text-center">
                            {{ errorMsg }}
                        </div>

                        <!-- Submit -->
                        <button 
                            type="submit" 
                            :disabled="loading"
                            class="w-full bg-primary text-white font-black py-5 rounded-lg text-sm uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:bg-primary-dark hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            {{ loading ? 'Sincronizando...' : 'Entrar' }}
                        </button>
                    </template>

                </form>

                <div v-if="!onboarding" class="mt-8 text-center space-y-4">
                    <p class="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">
                        Ainda não tem uma conta?
                    </p>
                    <NuxtLink to="/auth/cadastro" class="inline-block text-[10px] font-black uppercase tracking-widest text-text/80 bg-div-30 border border-divider px-8 py-4 rounded-lg hover:bg-div-15 hover:text-text transition-all">
                        Criar conta / Inscrever-se
                    </NuxtLink>
                </div>
            </div>

            <!-- ── Fluxo 2: Criar senha (onboarding) ── -->
            <div v-else class="space-y-6">
                <!-- Header -->
                <div class="text-center">
                    <div class="w-14 h-14 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-4">
                        <Icon name="ph:user-light" class="w-7 h-7 text-primary" />
                    </div>
                    <h2 class="text-lg font-black text-text">Bem-vindo, {{ onboarding?.nome || "..." }}!</h2>
                    <p class="text-xs text-secondary/60 mt-1">Você está pré-cadastrado. Crie sua senha para ativar sua conta.</p>
                </div>

                <!-- Passo 1: Enviar código -->
                <div v-if="!codigoEnviado" class="space-y-4">
                    <p class="text-sm text-secondary/60 text-center leading-relaxed">
                        Vamos enviar um código de verificação para:
                        <strong class="text-text block mt-1">{{ email }}</strong>
                    </p>
                    <button
                        @click="enviarCodigo"
                        class="w-full py-4 rounded-xl bg-primary text-white text-sm font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                    >
                        <Icon name="ph:envelope-bold" class="w-5 h-5" />
                        Enviar Código
                    </button>
                    <button @click="showCriarSenha = false" class="w-full text-[10px] font-bold text-secondary/40 hover:text-text transition-colors">
                        Voltar
                    </button>
                </div>

                <!-- Passo 2: Código + Senha -->
                <div v-else class="space-y-4">
                    <div class="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
                        <p class="text-xs text-emerald-400 font-bold text-center">
                            ✓ Código enviado! Verifique seu email.
                        </p>
                    </div>

                    <div>
                        <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">Código de verificação</label>
                        <input
                            v-model="codigoInput"
                            type="text"
                            maxlength="6"
                            placeholder="000000"
                            class="w-full mt-1 bg-field border border-field-border rounded-lg px-5 py-4 text-lg font-black text-field-text text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                            style="font-family: monospace;"
                        />
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">Nova senha</label>
                        <div class="relative mt-1">
                            <input
                                v-model="novaSenha"
                                :type="showNovaSenha ? 'text' : 'password'"
                                placeholder="Mínimo 6 caracteres"
                                class="w-full bg-field border border-field-border rounded-lg px-5 py-4 pr-12 text-sm font-bold text-field-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                            />
                            <button type="button" @click="showNovaSenha = !showNovaSenha" class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-text transition-colors">
                                <Icon :name="showNovaSenha ? 'ph:eye-closed-light' : 'ph:eye-light'" class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">Confirmar senha</label>
                        <div class="relative mt-1">
                            <input
                                v-model="confirmarSenha"
                                :type="showConfirmarSenha ? 'text' : 'password'"
                                placeholder="Repita a senha"
                                class="w-full bg-field border border-field-border rounded-lg px-5 py-4 pr-12 text-sm font-bold text-field-text focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                            />
                            <button type="button" @click="showConfirmarSenha = !showConfirmarSenha" class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-text transition-colors">
                                <Icon :name="showConfirmarSenha ? 'ph:eye-closed-light' : 'ph:eye-light'" class="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div v-if="codigoError" class="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-[10px] font-bold text-red-400 text-center">
                        {{ codigoError }}
                    </div>

                    <button
                        @click="criarConta"
                        :disabled="criandoConta"
                        class="w-full py-4 rounded-lg bg-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <div v-if="criandoConta" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Criar Conta e Entrar</span>
                    </button>

                    <button @click="codigoEnviado = false" class="w-full text-[10px] font-bold text-secondary/40 hover:text-text transition-colors">
                        Reenviar Código
                    </button>
                </div>
            </div>

        </div>

    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
