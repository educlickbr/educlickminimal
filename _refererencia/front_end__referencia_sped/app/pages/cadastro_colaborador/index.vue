<script setup lang="ts">
definePageMeta({
    layout: false,
    auth: false // Public page
})

const route = useRoute()
const router = useRouter()
import { useToast } from '../../../composables/useToast'
import { generateUuidFileName, fileToBase64, validateFile } from '../../../utils/file'
import { useAppStore } from '../../stores/app'
const { showToast } = useToast()
const supabase = useSupabaseClient()
const appStore = useAppStore()

// URL Query Parameters
// Expecting: ?email=...&processo=...&tipo=...
const queryEmail = route.query.email as string

// Helper for input types
const { data: formData, pending, error } = await useFetch<any>('/api/cadastro/form', {
    query: {
        email: queryEmail,
        processo: route.query.processo,
        tipo: route.query.tipo
    }
})

// State
const activeTab = ref<string>('')
const answers = ref<Record<string, any>>({})
const isSubmitting = ref(false)
const isSuccess = ref(false)
const requiredMissing = ref<Record<string, boolean>>({})
const lockedFields = ref<Record<string, boolean>>({})
const fileNames = ref<Record<string, string>>({})
const showPasswordStates = ref<Record<string, boolean>>({})
const passwordError = computed(() => {
    const passQ = formData.value?.perguntas?.find((q: any) => q.pergunta === 'senha')
    const confQ = formData.value?.perguntas?.find((q: any) => q.pergunta === 'confirmar_senha')
    if (!passQ || !confQ) return null
    
    const pass = answers.value[passQ.id_pergunta]
    const conf = answers.value[confQ.id_pergunta]
    
    if (pass && conf && pass !== conf) {
        return {
            confId: confQ.id_pergunta,
            message: 'As senhas não conferem'
        }
    }
    return null
})

const errorMessage = computed(() => {
    if (error.value) return 'Erro ao carregar formulário.'
    if (formData.value?.error) return formData.value.error
    if (!formData.value) return null
    return null
})

// Helpers
const getInputType = (tipo: string) => {
    switch(tipo) {
        case 'texto': return 'text'
        case 'senha': return 'password'
        case 'email': return 'email'
        case 'número':
        case 'numero': return 'number'
        case 'data': return 'date'
        case 'telefone': return 'tel'
        case 'arquivo':
        case 'foto': return 'file'
        default: return 'text'
    }
}

const getOptions = (question: any) => {
    if (question.opcoes && Array.isArray(question.opcoes) && question.opcoes.length > 0) return question.opcoes
    
    // Fallbacks
    switch(question.pergunta) {
        case 'cor_raca': return ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena']
        case 'identidade_genero': return ['Cisgênero', 'Transgênero', 'Não-binário', 'Outro', 'Prefiro não informar']
        case 'nacionalidade': return ['Brasileira', 'Estrangeira']
        case 'pcd': return ['Sim', 'Não']
        default: return ['Sim', 'Não']
    }
}

const triggerFileUpload = (questionId: string) => {
    const el = document.getElementById(questionId)
    if (el) el.click()
}

const handleFileUpload = async (event: Event, questionId: string) => {
    const target = event.target as HTMLInputElement
    const files = target.files
    if (files && files.length > 0) {
        const file = files[0]
        if (file) {
            // Validation (optional but good)
            const { valid, error } = validateFile(file)
            if (!valid) {
                showToast(error || 'Arquivo inválido', { type: 'error' })
                target.value = ''
                return
            }

            fileNames.value[questionId] = file.name
            
            // Convert to base64 to send via JSON in submit
            try {
                const base64 = await fileToBase64(file)
                answers.value[questionId] = {
                    id_pergunta: questionId,
                    resposta: base64,
                    nome_arquivo_original: file.name
                }
            } catch (e) {
                console.error('File conversion error:', e)
                showToast('Erro ao processar arquivo.', { type: 'error' })
            }
        }
    }
}
// Helper Interface
interface Pergunta {
    id_pergunta: string
    pergunta: string
    label: string
    tipo: string
    bloco: string
    ordem: number
    obrigatorio: boolean
    largura: number
    altura: number
    depende: boolean
    resposta: any
    // ... other fields if needed
    readonly?: boolean
}

// Process Blocks
const processedBlocks = computed(() => {
    const p = formData.value?.perguntas
    if (!p) return {}
    
    const blocks: Record<string, Pergunta[]> = {}
    p.forEach((q: Pergunta) => {
        // UI Enhancement: Bio and Social Media should be textareas (taller)
        if (['mini_bio', 'midias_sociais', 'bio'].includes(q.pergunta)) {
            q.altura = 120
            q.largura = 2 // Full width for better UX
        }

        if (!blocks[q.bloco]) blocks[q.bloco] = []
        blocks[q.bloco]!.push(q)
    })
    
    // Sort
    Object.keys(blocks).forEach(key => {
        blocks[key]!.sort((a: Pergunta, b: Pergunta) => a.ordem - b.ordem)
    })
    
    return blocks
})

const activeBlocks = computed<string[]>(() => {
    if (!formData.value?.perguntas) return []
    // Extract unique blocks in order of first appearance
    const blocks = new Set<string>()
    if (formData.value?.perguntas) {
        // Create a copy to sort to avoid mutating prop if it was one
        const sorted = [...formData.value.perguntas].sort((a: any, b: any) => a.ordem - b.ordem)
        sorted.forEach((q: any) => blocks.add(q.bloco))
    }
    return Array.from(blocks)
})

// Initialize
watch(formData, (newData) => {
    if (newData?.perguntas) {
        newData.perguntas.forEach((q: Pergunta) => {
            // Prefill info
            if (q.resposta) {
                 answers.value[q.id_pergunta] = q.resposta
            }
            // Lock fields marked as readonly (like email)
            if (q.readonly) {
                lockedFields.value[q.id_pergunta] = true
            }
        })
        
        // Select first tab
        if (activeBlocks.value.length > 0 && !activeTab.value) {
            const first = activeBlocks.value[0]
            if (first) activeTab.value = first
        }
    }
}, { immediate: true })

const BLOCO_LABELS: Record<string, string> = {
    dados_pessoais:        'Dados Pessoais',
    responsavel_legal:     'Responsável Legal',
    dados_socio_economicos:'Dados Socioeconômicos',
    pcd:                   'PCD',
    endereco:              'Endereço',
    documentos:            'Documentos',
    aceite:                'Aceite',
    sobre_curso:           'Sobre o Curso',
    prontidao:             'Prontidão',
    contratacao:           'Contratação',
    ficha_medica:          'Ficha Médica',
}
const formatBlockName = (name: string) => {
    return BLOCO_LABELS[name] ?? name
}

const validateBlock = (blockKey: string) => {
    const block = processedBlocks.value[blockKey]
    if (!block) return true

    let hasMissing = false
    block.forEach((q) => {
        if (q.obrigatorio) {
            const val = answers.value[q.id_pergunta]
            if (val === undefined || val === null || String(val).trim() === '') {
                requiredMissing.value[q.id_pergunta] = true
                hasMissing = true
            } else {
                requiredMissing.value[q.id_pergunta] = false
            }
        }
    })
    return !hasMissing
}

const goToTab = (blockKey: string) => {
    // allow navigation freely or enforce validation?
    // Let's enforce validation for previous steps
    activeTab.value = blockKey
}

const confirmAndSubmit = async () => {
    // Validate all blocks
    let valid = true
    activeBlocks.value.forEach(block => {
        if (!validateBlock(block)) valid = false
    })

    if (!valid) {
        showToast('Preencha os campos obrigatórios.', { type: 'error' })
        return
    }

    // Password match check (frontend side)
    const passQ = formData.value.perguntas.find((q: any) => q.pergunta === 'senha')
    const confQ = formData.value.perguntas.find((q: any) => q.pergunta === 'confirmar_senha')
    
    if (passQ && confQ) {
        const pass = answers.value[passQ.id_pergunta]
        const conf = answers.value[confQ.id_pergunta]
        if (!pass || !conf || pass !== conf) {
            showToast('As senhas não conferem.', { type: 'error' })
            // Highlight both fields as missing/error
            requiredMissing.value[passQ.id_pergunta] = true
            requiredMissing.value[confQ.id_pergunta] = true
            return
        }
    }

    isSubmitting.value = true
    try {
        // Extract Credentials (Artificial Fields)
        const credentials: any = {}
        const realAnswers: any[] = []

        formData.value.perguntas.forEach((q: any) => {
            const val = answers.value[q.id_pergunta]
            
            if (q.artificial) {
                // Map artificial fields by their 'pergunta' key (e.g. 'email', 'senha')
                if (val !== undefined) {
                     credentials[q.pergunta] = val
                }
            } else {
                // Real answers
                if (val !== undefined && val !== null && val !== '') {
                    if (typeof val === 'object' && val.resposta) {
                        // It's a file object already formatted (base64)
                        realAnswers.push(val)
                    } else {
                        realAnswers.push({
                            id_pergunta: q.id_pergunta,
                            resposta: val,
                            nome_arquivo_original: fileNames.value[q.id_pergunta] || ''
                        })
                    }
                }
            }
        })

        // 1. Auth Sign Up (New Strategy to avoid Edge Function 401)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: credentials.email,
            password: credentials.senha,
            options: {
                data: {
                    nome: credentials.nome,
                    sobrenome: credentials.sobrenome
                }
            }
        })

        if (authError) throw authError
        if (!authData.user) throw new Error('Falha ao criar conta de autenticação.')

        // 2. BFF Submit (Pass the newly created authUserId)
        const result: any = await $fetch('/api/cadastro/submit', {
            method: 'POST',
            body: {
                authUserId: authData.user.id,
                credentials,
                answers: realAnswers,
                papel_id: formData.value.papel_id,
                queryParams: {
                    email: queryEmail,
                    papel: route.query.papel
                }
            }
        })

        if (result.success) {
            isSuccess.value = true
            showToast('Cadastro realizado com sucesso!', { type: 'success' })
            
            // Wait 5 seconds to allow DB triggers to finish
            setTimeout(async () => {
                // Initialize session to sync roles/permissions
                await appStore.initSession()
                // Redirect to Home instead of Login
                router.push('/')
            }, 5000)
        }
    } catch (e: any) {
        console.error('Submit Error:', e)
        showToast(e.statusMessage || e.message || 'Erro ao realizar cadastro.', { type: 'error' })
    } finally {
        isSubmitting.value = false
    }
}

// Watch answers to clear error state
watch(answers, (newA) => {
    Object.keys(newA).forEach((k) => {
        if (requiredMissing.value[k] && newA[k]) {
            requiredMissing.value[k] = false
        }
    })
}, { deep: true })

// CEP Logic
const loadingCep = ref(false)
const handleCepBlur = async (question: any) => {
    const cepValue = answers.value[question.id_pergunta]
    if (!cepValue) return

    const sanitizedCep = String(cepValue).replace(/\D/g, '')
    if (sanitizedCep.length !== 8) return

    loadingCep.value = true
    try {
        const data = await $fetch<any>(`https://viacep.com.br/ws/${sanitizedCep}/json/`)
        if (!data || data.erro) {
            showToast('CEP não encontrado.', { type: 'error' })
            return
        }

        // Map fields
        const fieldMap: Record<string, string> = {
            'endereco': data.logradouro,
            'bairro': data.bairro,
            'cidade': data.localidade,
            'estado': data.uf,
            'complemento': data.complemento // Optional
        }

        // Update answers and lock fields
        formData.value.perguntas.forEach((q: any) => {
            if (fieldMap[q.pergunta]) {
                answers.value[q.id_pergunta] = fieldMap[q.pergunta]
                lockedFields.value[q.id_pergunta] = true
                // Clear error if any
                requiredMissing.value[q.id_pergunta] = false
            }
        })
    } catch (e) {
        console.error('CEP Error:', e)
        showToast('Erro ao buscar CEP.', { type: 'error' })
    } finally {
        loadingCep.value = false
    }
}

</script>

<template>
    <div class="min-h-screen bg-background overflow-y-auto w-full p-4 md:p-8 flex flex-col items-center">
        <div class="flex flex-col gap-8 pb-10 max-w-4xl mx-auto w-full">
            
            <!-- Header Section -->
            <div class="bg-div-15 rounded-lg p-4 md:p-8 border border-secondary/10 shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                
                <div v-if="formData && !errorMessage" class="relative z-10">
                    <div class="mb-1.5 md:mb-2 text-start">
                        <span class="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                            {{ formData.area || 'Institucional' }}
                        </span>
                    </div>
                    <h1 class="text-xl md:text-3xl font-black text-text mb-2 md:mb-4 leading-tight text-start">{{ formData.curso || 'Cadastro de Colaborador' }}</h1>
                    <p class="text-secondary text-sm font-bold text-start">Complete seus dados para criar sua conta.</p>
                </div>

                <div v-if="pending" class="flex flex-col items-center justify-center min-h-[400px]">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p class="mt-4 text-text-muted">Carregando formulário...</p>
    </div>

    <!-- Success State -->
    <div v-else-if="isSuccess" class="flex flex-col items-center justify-center min-h-[400px] text-center p-6 animate-in fade-in zoom-in duration-500">
        <div class="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6">
            <svg class="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        </div>
        <h2 class="text-2xl font-bold text-text mb-2">Cadastro concluído com sucesso!</h2>
        <p class="text-text-muted mb-6 max-w-md mx-auto">
            Aguarde um momento enquanto preparamos seu painel de acesso. 
            Isso levará apenas alguns segundos...
        </p>
        <div class="w-full max-w-xs bg-div-15 h-1.5 rounded-full overflow-hidden">
            <div class="bg-primary h-full animate-progress-fast"></div>
        </div>
    </div>

    <div v-else-if="errorMessage" class="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
                    <div class="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-start">
                        <svg class="w-8 h-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">Acesso Negado</h3>
                    <p class="text-secondary text-sm max-w-md">{{ errorMessage }}</p>
                </div>

                <!-- Skeleton for Header while loading -->
                <div v-else class="relative z-10 animate-pulse">
                    <div class="h-4 w-20 bg-primary/10 rounded mb-4"></div>
                    <div class="h-10 w-3/4 bg-div-30 rounded mb-6"></div>
                    <div class="h-4 w-1/3 bg-div-30 rounded"></div>
                </div>
            </div>

            <div v-if="!errorMessage && !pending" class="space-y-6">
                <!-- Tabs Navigation (Visible only if multiple blocks) -->
                <div v-if="activeBlocks.length > 1" class="flex items-center gap-4 overflow-x-auto pb-4 mb-4 custom-scrollbar-x border-b border-secondary/10">
                    <button 
                        v-for="blockKey in activeBlocks" 
                        :key="blockKey"
                        @click="goToTab(blockKey)"
                        class="whitespace-nowrap px-4 py-2 rounded-md text-sm font-bold transition-all duration-300 border"
                        :class="activeTab === blockKey 
                            ? 'bg-primary text-white border-primary shadow-md' 
                            : 'bg-background text-secondary border-secondary/10 hover:bg-div-15'"
                    >
                        {{ formatBlockName(blockKey) }}
                    </button>
                </div>

                <!-- Form Body -->
                <div 
                    v-if="processedBlocks[activeTab]" 
                    class="bg-transparent md:bg-background border-none md:border md:border-secondary/10 rounded-none md:rounded-lg p-0 md:p-8 shadow-none md:shadow-sm transition-all duration-300"
                >
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <template v-for="question in processedBlocks[activeTab]" :key="question.id_pergunta">
                            <div 
                                class="flex flex-col gap-2"
                                :class="[
                                    question.largura === 2 ? 'md:col-span-2' : 'md:col-span-1'
                                ]"
                            >
                                <label :for="question.id_pergunta" class="text-sm font-bold text-secondary">
                                    {{ question.label }}
                                    <span v-if="question.obrigatorio" class="text-primary">*</span>
                                </label>

                                <!-- 1. Textarea (Height >= 120) -->
                                <div v-if="question.tipo === 'texto' && question.altura >= 120" class="group/field relative">
                                    <textarea 
                                        :id="question.id_pergunta"
                                        v-model="answers[question.id_pergunta]"
                                        :placeholder="question.label"
                                        :readonly="question.readonly || question.leitura || lockedFields[question.id_pergunta]"
                                        :style="{ height: question.altura + 'px' }"
                                        class="w-full bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30 resize-none"
                                        :class="{
                                            'border-red-500/50 focus:ring-red-500/20': requiredMissing[question.id_pergunta],
                                            'opacity-60 cursor-not-allowed': question.readonly || question.leitura || lockedFields[question.id_pergunta]
                                        }"
                                    ></textarea>
                                    <p v-if="requiredMissing[question.id_pergunta]" class="text-xs text-red-500 font-bold mt-1">Resposta obrigatória</p>
                                </div>

                                <!-- 2. Radio Buttons -->
                                <div v-else-if="question.tipo === 'radio'">
                                    <div class="flex flex-col gap-2 mt-1">
                                        <label 
                                            v-for="(option, idx) in getOptions(question)" 
                                            :key="idx"
                                            class="flex items-center gap-3 p-3 rounded-md border border-secondary/10 bg-div-15 cursor-pointer hover:bg-div-30 transition-colors group"
                                        >
                                            <input 
                                                type="radio" 
                                                :name="question.id_pergunta" 
                                                :value="typeof option === 'object' ? (option.label || option.value) : option"
                                                v-model="answers[question.id_pergunta]"
                                                :disabled="question.readonly || question.leitura || lockedFields[question.id_pergunta]"
                                                class="w-4 h-4 text-primary border-secondary/30 focus:ring-primary bg-background"
                                            />
                                            <span class="text-sm font-bold text-secondary group-hover:text-text transition-colors">
                                                {{ typeof option === 'object' ? (option.label || option.value) : option }}
                                            </span>
                                        </label>
                                    </div>
                                    <p v-if="requiredMissing[question.id_pergunta]" class="text-xs text-red-500 font-bold mt-1">Resposta obrigatória</p>
                                </div>

                                <!-- 3. File Input (Premium Style) -->
                                <div v-else-if="getInputType(question.tipo) === 'file'">
                                    <div 
                                        class="relative border-2 border-dashed border-secondary/20 rounded-lg p-6 transition-all hover:border-primary/40 hover:bg-primary/5 group text-center cursor-pointer"
                                        @click="triggerFileUpload(question.id_pergunta)"
                                    >
                                        <input 
                                            :id="question.id_pergunta"
                                            type="file" 
                                            class="hidden"
                                            @change="(e) => handleFileUpload(e, question.id_pergunta)"
                                            :accept="question.tipo === 'foto' ? 'image/*' : '*/*'"
                                            :disabled="question.readonly || question.leitura || lockedFields[question.id_pergunta]"
                                        />
                                        
                                        <div v-if="!fileNames[question.id_pergunta]" class="flex flex-col items-center gap-2">
                                            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                                                <svg class="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                            </div>
                                            <p class="text-xs font-bold text-secondary tracking-tight">Clique para selecionar arquivo...</p>
                                        </div>

                                        <div v-else class="flex flex-col items-center gap-2 py-2 w-full text-start">
                                            <div class="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-1">
                                                <svg class="w-6 h-6 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
                                            </div>
                                            <p class="text-xs font-bold text-text truncate max-w-full px-4">{{ fileNames[question.id_pergunta] }}</p>
                                        </div>
                                    </div>
                                    <p v-if="requiredMissing[question.id_pergunta]" class="text-xs text-red-500 font-bold mt-1">Resposta obrigatória</p>
                                </div>

                                <!-- 4. Boolean Toggle -->
                                <div v-else-if="question.tipo === 'boolean'" class="group/field relative">
                                    <div class="flex items-center gap-3">
                                        <label :for="'bool-' + question.id_pergunta" class="inline-flex items-center cursor-pointer">
                                            <input
                                                :id="'bool-' + question.id_pergunta"
                                                type="checkbox"
                                                class="sr-only"
                                                v-model="answers[question.id_pergunta]"
                                                :disabled="question.readonly || question.leitura || lockedFields[question.id_pergunta]"
                                            />
                                            <div :class="answers[question.id_pergunta] ? 'bg-primary' : 'bg-div-15'" class="w-12 h-6 rounded-full relative transition-colors border border-secondary/10">
                                                <span :class="answers[question.id_pergunta] ? 'translate-x-6' : 'translate-x-0'" class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform"></span>
                                            </div>
                                        </label>
                                        <span class="text-sm font-bold text-secondary">{{ answers[question.id_pergunta] ? 'Sim' : 'Não' }}</span>
                                    </div>
                                    <p v-if="requiredMissing[question.id_pergunta]" class="text-xs text-red-500 font-bold mt-1">Resposta obrigatória</p>
                                </div>

                                <!-- 5. Generic Input (Fallback) -->
                                <div v-else class="relative group/field">
                                    <div class="relative">
                                        <input 
                                            :id="question.id_pergunta"
                                            :type="question.tipo === 'senha' ? (showPasswordStates[question.id_pergunta] ? 'text' : 'password') : getInputType(question.tipo)" 
                                            v-model="answers[question.id_pergunta]"
                                            :placeholder="question.label"
                                            class="w-full bg-div-15 border border-secondary/10 rounded-md px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-secondary/30 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                                            :class="{
                                                'border-red-500/50 focus:ring-red-500/20': requiredMissing[question.id_pergunta] || (passwordError?.confId === question.id_pergunta),
                                                'pr-10': (question.readonly || question.leitura || lockedFields[question.id_pergunta]) || question.tipo === 'data' || question.pergunta === 'cep' || question.tipo === 'senha'
                                            }"
                                            :style="[
                                                question.tipo === 'data' ? { 
                                                    colorScheme: 'dark', 
                                                    accentColor: '#d60956'
                                                } : {}
                                            ]"
                                            :disabled="question.readonly || question.leitura || lockedFields[question.id_pergunta]"
                                            @blur="question.pergunta === 'cep' ? handleCepBlur(question) : null"
                                        />

                                        <!-- Custom Calendar Icon -->
                                        <div v-if="question.tipo === 'data'" class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                        </div>
                                        
                                        <!-- CEP Loading Indicator -->
                                        <div v-if="question.pergunta === 'cep' && loadingCep" class="absolute right-3 top-1/2 -translate-y-1/2">
                                            <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        </div>

                                        <!-- Lock Icon for readonly -->
                                        <div v-if="question.readonly || question.leitura || lockedFields[question.id_pergunta]" class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40">
                                            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                        </div>

                                        <!-- Password Toggle Icon -->
                                        <button 
                                            v-if="question.tipo === 'senha' && !(question.readonly || question.leitura || lockedFields[question.id_pergunta])" 
                                            type="button"
                                            @click="showPasswordStates[question.id_pergunta] = !showPasswordStates[question.id_pergunta]"
                                            class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/60 hover:text-primary transition-colors focus:outline-none"
                                        >
                                            <svg v-if="showPasswordStates[question.id_pergunta]" class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                            <svg v-else class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                        </button>
                                    </div>
                                    <p v-if="requiredMissing[question.id_pergunta]" class="text-xs text-red-500 font-bold mt-1">Resposta obrigatória</p>
                                    <p v-else-if="passwordError?.confId === question.id_pergunta" class="text-xs text-red-500 font-bold mt-1">
                                        {{ passwordError.message }}
                                    </p>
                                </div>
                            </div>
                        </template>
                    </div>

                    <!-- Actions -->
                    <div class="mt-8 pt-6 border-t border-secondary/10 flex justify-end">
                        <button 
                            @click="confirmAndSubmit" 
                            :disabled="isSubmitting"
                            class="px-8 py-3 bg-primary hover:bg-primary-600 text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <svg v-if="isSubmitting" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>{{ isSubmitting ? 'Criando Conta...' : 'Criar Conta' }}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div v-else-if="pending" class="flex justify-center p-12">
                <svg class="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
        </div>
        
        <footer class="py-6 text-center text-[9px] uppercase tracking-widest text-secondary/30 font-bold border-t border-secondary/5 mt-auto w-full">
            © {{ new Date().getFullYear() }} São Paulo Escola de Dança
        </footer>
    </div>
</template>

<style scoped>
.animate-progress-fast {
    animation: progress 5s linear forwards;
}

@keyframes progress {
    0% { width: 0%; }
    100% { width: 100%; }
}
</style>
