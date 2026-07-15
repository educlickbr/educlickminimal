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
const confirmarSenha = ref('')
const criandoConta = ref(false)
const codigoError = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

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
        const res = await $fetch("/api/auth/criar-conta", {
            method: "POST",
            body: {
                id_user_expandido: onboarding.value!.id_user_expandido,
                email: email.value.trim(),
                codigo: codigoInput.value,
                senha: novaSenha.value,
            },
        }) as any

        if (res?.success) {
            // Login automático
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: email.value,
                password: novaSenha.value,
            })
            if (loginError) throw loginError

            await store.initSession()
            const redirectTo = route.query.redirectTo as string
            router.push(redirectTo || '/')
        } else {
            codigoError.value = res?.message || "Erro ao criar conta."
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
            router.push(redirectTo || '/')
        }
    } catch (err: any) {
        errorMsg.value = err.message || 'Erro ao realizar login'
    } finally {
        loading.value = false
    }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0a0a0c] p-6 font-sans relative overflow-hidden">
    
    <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[180px] animate-pulse"></div>
        <div class="absolute bottom-[0%] right-[-10%] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[150px]"></div>
        <div class="absolute top-[40%] right-[10%] w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[120px]"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
        
        <div class="bg-div-15 backdrop-blur-2xl border border-white/5 rounded-xl p-8 md:p-12 shadow-2xl">
            
            <div class="flex flex-col items-center mb-10">
                <h1 class="text-3xl font-black text-white uppercase tracking-[0.3em] text-center">
                    LOGIN
                </h1>
                <p v-if="route.query.redirectTo" class="text-[10px] font-bold text-primary uppercase tracking-widest mt-4">
                    Faça login para continuar sua inscrição
                </p>
            </div>

            <!-- ── ONBOARDING: Criar senha ── -->
            <div v-if="showCriarSenha" class="space-y-5">
                <div class="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <Icon name="ph:user-light" class="w-8 h-8 text-primary" />
                    <div>
                        <p class="text-sm font-bold text-text">Olá, {{ onboarding?.nome || "..." }}!</p>
                        <p class="text-[10px] text-secondary/60">Você ainda não tem senha. Crie sua conta agora.</p>
                    </div>
                </div>

                <!-- Enviar código -->
                <div v-if="!codigoEnviado" class="text-center">
                    <button
                        @click="enviarCodigo"
                        class="w-full py-4 rounded-lg bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        <Icon name="ph:envelope-bold" class="w-4 h-4" />
                        Enviar Código para meu Email
                    </button>
                </div>

                <!-- Código + Senha -->
                <div v-else class="space-y-4">
                    <div>
                        <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">Código de verificação</label>
                        <input
                            v-model="codigoInput"
                            type="text"
                            maxlength="6"
                            placeholder="000000"
                            class="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-lg font-black text-white text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                            style="font-family: monospace;"
                        />
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">Nova senha</label>
                        <input
                            v-model="novaSenha"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            class="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                        />
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">Confirmar senha</label>
                        <input
                            v-model="confirmarSenha"
                            type="password"
                            placeholder="Repita a senha"
                            class="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                        />
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

                    <button @click="showCriarSenha = false; codigoEnviado = false" class="w-full text-[10px] font-bold text-secondary/40 hover:text-white transition-colors">
                        Voltar
                    </button>
                </div>
            </div>

            <!-- ── LOGIN NORMAL ── -->
            <form v-else @submit.prevent="handleLogin" class="space-y-6">
                
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
                            class="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-white/10 group-hover:border-white/20"
                        />
                        <div class="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary transition-colors">
                            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </div>
                    </div>
                </div>

                <!-- Onboarding banner -->
                <transition name="fade">
                    <div v-if="onboarding" class="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl cursor-pointer hover:bg-primary/15 transition-all" @click="showCriarSenha = true">
                        <Icon name="ph:magic-wand-bold" class="w-6 h-6 text-primary shrink-0" />
                        <div>
                            <p class="text-xs font-bold text-text">Olá, {{ onboarding.nome }}!</p>
                            <p class="text-[10px] text-primary/70">Clique aqui para criar sua senha e ativar sua conta.</p>
                        </div>
                    </div>
                </transition>

                <!-- Password -->
                <div class="space-y-2">
                    <div class="flex items-center justify-between px-1">
                        <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">Senha</label>
                        <NuxtLink to="/auth/recuperar_senha" class="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">Esqueceu?</NuxtLink>
                    </div>
                    <div class="relative group">
                        <input 
                            v-model="password"
                            :type="showPassword ? 'text' : 'password'" 
                            required
                            placeholder="••••••••"
                            class="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-white/10 group-hover:border-white/20"
                        />
                        <button 
                            type="button"
                            @click="showPassword = !showPassword"
                            class="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 hover:text-primary transition-colors focus:outline-none"
                        >
                            <svg v-if="!showPassword" class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            <svg v-else class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        </button>
                    </div>
                </div>

                <!-- Error -->
                <transition name="fade">
                    <div v-if="errorMsg" class="bg-primary/20 border border-primary/30 p-4 rounded-xl text-xs font-bold text-primary text-center">
                        {{ errorMsg }}
                    </div>
                </transition>

                <!-- Submit -->
                <button 
                    type="submit" 
                    :disabled="loading"
                    class="w-full bg-primary text-white font-black py-5 rounded-lg text-sm uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:bg-primary-dark hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                >
                    <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {{ loading ? 'Sincronizando...' : 'Entrar' }}
                    <svg v-if="!loading" class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>

            </form>

            <div v-if="!showCriarSenha" class="mt-8 text-center space-y-4">
                <p class="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">
                    Ainda não tem uma conta?
                </p>
                <NuxtLink to="/auth/cadastro" class="inline-block text-[10px] font-black uppercase tracking-widest text-white/80 bg-white/5 border border-white/10 px-8 py-4 rounded-lg hover:bg-white/10 hover:text-white transition-all">
                    Criar conta / Inscrever-se
                </NuxtLink>
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
