<script setup lang="ts">
const supabase = useSupabaseClient()
const store = useAppStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const isMigratedUser = ref(false)
const isCheckingEmail = ref(false)

const getRedirectPath = () => {
    const redirect = route.query.redirect
    if (typeof redirect === 'string' && redirect.startsWith('/')) {
        return redirect
    }
    return '/'
}

// Redirect if already logged in
const user = useSupabaseUser()
onMounted(() => {
    if (user.value) {
        router.push(getRedirectPath())
    }
})

// Check email when user leaves the email field
const checkEmail = async () => {
    if (!email.value || isCheckingEmail.value) return
    
    isCheckingEmail.value = true
    errorMsg.value = ''
    
    try {
        const result: any = await $fetch('/api/auth/check-email', {
            params: { email: email.value }
        })
        
        if (result && result.exists_in_user_expandido && !result.exists_in_auth) {
            // Migrated user - show password creation fields
            isMigratedUser.value = true
            errorMsg.value = ''
        } else if (result && !result.exists_in_user_expandido && !result.exists_in_auth) {
            // User doesn't exist
            errorMsg.value = 'Email não encontrado. Entre em contato com a secretaria, ou faça a sua conta no botão Criar Conta logo abaixo'
            isMigratedUser.value = false
        } else {
            // Normal user - show regular login
            isMigratedUser.value = false
        }
    } catch (err: any) {
        console.error('Erro ao verificar email:', err)
    } finally {
        isCheckingEmail.value = false
    }
}

// Handle normal login
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
            router.push(getRedirectPath())
        }
    } catch (err: any) {
        if (err.message && err.message.includes('Invalid login credentials')) {
            errorMsg.value = 'Email ou Senha estão incorretos'
        } else {
            errorMsg.value = err.message || 'Erro ao realizar login'
        }
    } finally {
        loading.value = false
    }
}

// Handle migrated user signup
const handleMigratedUserSignup = async () => {
    loading.value = true
    errorMsg.value = ''
    
    // Validate passwords
    if (password.value !== confirmPassword.value) {
        errorMsg.value = 'As senhas não coincidem'
        loading.value = false
        return
    }
    
    if (password.value.length < 6) {
        errorMsg.value = 'A senha deve ter no mínimo 6 caracteres'
        loading.value = false
        return
    }
    
    try {
        // 1. Create auth account
        const { data, error } = await supabase.auth.signUp({
            email: email.value,
            password: password.value
        })
        
        if (error) throw error
        
        if (!data.user) {
            throw new Error('Erro ao criar conta')
        }
        
        // 2. Link everything via backend (papel_id is now auto-detected from user_expandido)
        await $fetch('/api/auth/link-migrated-user', {
            method: 'POST',
            body: {
                email: email.value,
                auth_user_id: data.user.id
            }
        })
        
        // 3. Initialize session and redirect
        await store.initSession()
        navigateTo(getRedirectPath())
        
    } catch (err: any) {
        console.error('Erro no signup:', err)
        errorMsg.value = err.message || 'Erro ao criar senha. Tente novamente.'
    } finally {
        loading.value = false
    }
}

// Main submit handler
const handleSubmit = async () => {
    if (isMigratedUser.value) {
        await handleMigratedUserSignup()
    } else {
        await handleLogin()
    }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0a0a0c] p-0 md:p-6 font-sans relative overflow-hidden">
    
    <!-- Background Accents (Blurred Patches) -->
    <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[180px] animate-pulse"></div>
        <div class="absolute bottom-[0%] right-[-10%] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[150px]"></div>
        <div class="absolute top-[40%] right-[10%] w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[120px]"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
        
        <!-- Login Card -->
        <div class="bg-transparent md:bg-div-15 md:backdrop-blur-2xl border-none md:border md:border-white/5 rounded-none md:rounded-xl p-6 md:p-12 shadow-none md:shadow-2xl">
            
            <!-- Logo Inside Card -->
            <div class="flex flex-col items-center mb-10">
                <div class="mb-6">
                    <img src="https://spedppull.b-cdn.net/site/logosp.png" alt="Logo SPED" class="h-20 w-auto object-contain" />
                </div>
                <h1 class="text-3xl font-black text-white uppercase tracking-[0.3em] text-center">
                    LOGIN
                </h1>
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-6">
                
                <!-- Email Field -->
                <div class="space-y-2">
                    <label for="email" class="text-[10px] font-black uppercase tracking-widest text-secondary/60 ml-1">E-mail</label>
                    <div class="relative group">
                        <input 
                            v-model="email"
                            type="email" 
                            id="email"
                            required
                            placeholder="seu@email.com"
                            @blur="checkEmail"
                            class="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-white/10 group-hover:border-white/20"
                        />
                        <div class="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary transition-colors">
                            <div v-if="isCheckingEmail" class="w-4 h-4 border-2 border-white/30 border-t-primary rounded-full animate-spin"></div>
                            <svg v-else class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </div>
                    </div>
                </div>

                <!-- Info Message for Migrated Users -->
                <transition name="fade">
                    <div v-if="isMigratedUser" class="bg-blue-500/20 border border-blue-500/30 p-4 rounded-xl text-xs font-bold text-blue-400 text-center">
                        Detectamos que você já está cadastrado. Por favor, crie uma senha para acessar sua conta.
                    </div>
                </transition>

                <!-- Password Field -->
                <div class="space-y-2">
                    <div class="flex items-center justify-between px-1">
                        <label for="password" class="text-[10px] font-black uppercase tracking-widest text-secondary/60">{{ isMigratedUser ? 'Nova Senha' : 'Senha' }}</label>
                        <NuxtLink v-if="!isMigratedUser" to="/recuperar_senha" class="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">Esqueceu?</NuxtLink>
                    </div>
                    <div class="relative group">
                        <input 
                            v-model="password"
                            :type="showPassword ? 'text' : 'password'" 
                            id="password"
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

                <!-- Confirm Password Field (Only for Migrated Users) -->
                <transition name="fade">
                    <div v-if="isMigratedUser" class="space-y-2">
                        <label for="confirmPassword" class="text-[10px] font-black uppercase tracking-widest text-secondary/60 ml-1">Confirmar Senha</label>
                        <div class="relative group">
                            <input 
                                v-model="confirmPassword"
                                :type="showConfirmPassword ? 'text' : 'password'" 
                                id="confirmPassword"
                                required
                                placeholder="••••••••"
                                class="w-full bg-white/5 border border-white/10 rounded-lg px-5 py-4 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-white/10 group-hover:border-white/20"
                            />
                            <button 
                                type="button"
                                @click="showConfirmPassword = !showConfirmPassword"
                                class="absolute right-5 top-1/2 -translate-y-1/2 text-white/10 hover:text-primary transition-colors focus:outline-none"
                            >
                                <svg v-if="!showConfirmPassword" class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                <svg v-else class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                            </button>
                        </div>
                    </div>
                </transition>

                <!-- Error Message -->
                <transition name="fade">
                    <div v-if="errorMsg" class="bg-primary/20 border border-primary/30 p-4 rounded-xl text-xs font-bold text-primary text-center">
                        {{ errorMsg }}
                    </div>
                </transition>

                <!-- Submit Button -->
                <button 
                    type="submit" 
                    :disabled="loading"
                    class="w-full bg-primary text-white font-black py-5 rounded-lg text-sm uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:bg-[#b81151] hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                >
                    <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {{ loading ? 'Sincronizando...' : (isMigratedUser ? 'Criar Senha e Entrar' : 'Entrar') }}
                    <svg v-if="!loading" class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>

            </form>

            <div class="mt-8 text-center space-y-4">
                <p class="text-[10px] font-bold text-secondary/40 uppercase tracking-widest">
                    Ainda não tem uma conta?
                </p>
                <NuxtLink to="/cadastro" class="inline-block text-[10px] font-black uppercase tracking-widest text-white/80 bg-white/5 border border-white/10 px-8 py-4 rounded-lg hover:bg-white/10 hover:text-white transition-all">
                    Criar conta / Inscrever-se
                </NuxtLink>
            </div>

        </div>

        <!-- Footer Info -->
        <p class="mt-12 text-center text-[9px] font-bold text-white/10 uppercase tracking-[0.4em]">
            São Paulo Escola de Dança • {{ new Date().getFullYear() }}
        </p>

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
