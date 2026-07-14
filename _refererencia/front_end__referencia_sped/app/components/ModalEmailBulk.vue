<script setup lang="ts">
import { useAppStore } from '../stores/app'
import { useToast } from '../../composables/useToast'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { getAnoSemestre } from '../../utils/ano_semestre'
import BaseSelect from './BaseSelect.vue'

const props = defineProps<{
    isOpen: boolean
    availableAreas: any[]
    currentAnoSemestre: string
}>()

const emit = defineEmits(['close', 'send'])

const { showToast } = useToast()
const appStore = useAppStore()

// Form Data
const scope = ref<'area' | 'turma'>('area')
const selectedAnoSemestre = ref(props.currentAnoSemestre)
const selectedArea = ref('')
const selectedTurma = ref('')
const subject = ref('')
const isSending = ref(false)
const isLoadingTurmas = ref(false)
const turmas = ref<any[]>([])

const editor = useEditor({
    content: '',
    extensions: [
        StarterKit,
        Link.configure({
            openOnClick: false,
            HTMLAttributes: {
                class: 'text-primary underline cursor-pointer',
            },
        }),
    ],
    editorProps: {
        attributes: {
            class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] p-4 text-sm text-white',
        },
    },
})

// Options for BaseSelect
const anoSemestreOptions = computed(() => [
    getAnoSemestre(undefined, -1),
    getAnoSemestre(),
    getAnoSemestre(undefined, 1)
])

const areaOptions = computed(() => props.availableAreas.map(a => {
    if (typeof a === 'string') {
        return { id: a, nome: a };
    }
    return { id: a.value, nome: a.label };
}))

const turmaOptions = computed(() => turmas.value.map(t => ({
    id: t.id,
    nome: `${t.nome_curso} - ${t.cod_turma} (${t.turno})`
})))

const fetchTurmas = async () => {
    if (!selectedAnoSemestre.value) return;
    
    isLoadingTurmas.value = true;
    try {
        const data: any = await $fetch('/api/matriculas/turmas', {
            params: {
                ano_semestre: selectedAnoSemestre.value,
                area: selectedArea.value || null
            }
        });
        turmas.value = data.turmas || [];
    } catch (e) {
        console.error('Error fetching turmas for bulk email:', e);
        showToast('Erro ao buscar turmas.', { type: 'error' });
    } finally {
        isLoadingTurmas.value = false;
    }
};

watch([selectedAnoSemestre, selectedArea], () => {
    fetchTurmas();
});

watch(scope, (newVal) => {
   if (newVal === 'turma') {
       fetchTurmas();
   } 
});

// Reset form when modal opens
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        // Reset to match current page context if possible, or defaults
        selectedAnoSemestre.value = props.currentAnoSemestre
        scope.value = 'area'
        selectedArea.value = ''
        selectedTurma.value = ''
        subject.value = ''
        turmas.value = [] 
        editor.value?.commands.setContent('')
        
        setTimeout(() => {
            document.getElementById('email-bulk-subject')?.focus()
        }, 100)
    }
})

// Cleanup
onBeforeUnmount(() => {
    editor.value?.destroy()
})

const setLink = () => {
    const previousUrl = editor.value?.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) return
    if (url === '') {
        editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
        return
    }
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

const handleSend = async () => {
    // Validation
    if (scope.value === 'area' && !selectedArea.value) {
        showToast('Por favor, selecione uma Área.', { type: 'error' })
        return
    }
    if (scope.value === 'turma' && !selectedTurma.value) {
        showToast('Por favor, selecione uma Turma.', { type: 'error' })
        return
    }
    
    if (!subject.value.trim()) {
        showToast('Por favor, informe o assunto do email.', { type: 'error' })
        return
    }
    
    const htmlContent = editor.value?.getHTML()
    const textContent = editor.value?.getText()

    if (!textContent?.trim() && !htmlContent?.includes('<img')) {
        showToast('Por favor, escreva uma mensagem.', { type: 'error' })
        return
    }

    // Get ID User Origem from Store
    if (!appStore.user_expandido_id) {
         showToast('Erro: Usuário não identificado (ID Expandido ausente).', { type: 'error' });
         return;
    }

    isSending.value = true
    try {
        const payload = {
            scope: scope.value,
            filters: {
                ano_semestre: selectedAnoSemestre.value,
                area: selectedArea.value,
                id_turma: scope.value === 'turma' ? selectedTurma.value : null
            },
            subject: subject.value,
            message: htmlContent,
            id_user_origem: appStore.user_expandido_id
        }

        emit('send', payload)
    } catch (e) {
        console.error('Error preparing bulk email:', e)
    } finally {
        isSending.value = false
    }
}
</script>

<template>
    <Teleport to="body">
        <Transition name="fade">
            <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>

                <!-- Modal Content -->
                <div class="bg-[#16161E] border border-white/10 w-full max-w-2xl rounded-xl shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
                    
                    <!-- Header -->
                    <div class="flex items-center justify-between p-6 border-b border-white/5 bg-[#16161E] rounded-t-xl">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-white">Email Geral</h3>
                                <p class="text-xs text-secondary">Enviar mensagem em massa</p>
                            </div>
                        </div>
                        <button 
                            @click="$emit('close')" 
                            class="text-secondary hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                        >
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
                        
                        <!-- Scope Selector -->
                        <div class="bg-white/5 border border-white/10 rounded-lg p-3">
                            <label class="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">Enviar Para:</label>
                            <div class="flex items-center gap-4">
                                <label class="flex items-center gap-2 cursor-pointer group">
                                    <div class="relative flex items-center justify-center">
                                        <input type="radio" v-model="scope" value="area" class="peer sr-only" />
                                        <div class="w-4 h-4 border-2 border-secondary rounded-full peer-checked:border-primary peer-checked:bg-primary transition-colors"></div>
                                    </div>
                                    <span class="text-sm text-white group-hover:text-primary transition-colors">Por Área</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer group">
                                    <div class="relative flex items-center justify-center">
                                        <input type="radio" v-model="scope" value="turma" class="peer sr-only" />
                                        <div class="w-4 h-4 border-2 border-secondary rounded-full peer-checked:border-primary peer-checked:bg-primary transition-colors"></div>
                                    </div>
                                    <span class="text-sm text-white group-hover:text-primary transition-colors">Por Turma</span>
                                </label>
                            </div>
                        </div>

                        <!-- Filters -->
                        <div class="grid grid-cols-2 gap-3">
                            <!-- Ano/Semestre -->
                            <div class="space-y-1">
                                <label class="text-xs font-bold text-secondary uppercase tracking-wider">Ano/Semestre</label>
                                <BaseSelect 
                                    v-model="selectedAnoSemestre" 
                                    :options="anoSemestreOptions" 
                                    placeholder="Selecione..." 
                                />
                            </div>

                            <!-- Area -->
                            <div class="space-y-1">
                                <label class="text-xs font-bold text-secondary uppercase tracking-wider">Área</label>
                                <BaseSelect 
                                    v-model="selectedArea" 
                                    :options="areaOptions" 
                                    placeholder="Selecione a Área" 
                                    labelKey="nome"
                                    valueKey="id"
                                />
                            </div>

                            <!-- Turma (Conditional) -->
                            <div v-if="scope === 'turma'" class="col-span-2 space-y-1">
                                <label class="text-xs font-bold text-secondary uppercase tracking-wider">Turma</label>
                                <BaseSelect 
                                    v-model="selectedTurma" 
                                    :options="turmaOptions" 
                                    placeholder="Selecione a Turma"
                                    labelKey="nome"
                                    valueKey="id"
                                />
                            </div>
                        </div>

                        <!-- Subject -->
                        <div class="space-y-1 mt-2">
                            <label for="email-bulk-subject" class="text-xs font-bold text-secondary uppercase tracking-wider">Assunto <span class="text-primary">*</span></label>
                            <input 
                                id="email-bulk-subject"
                                type="text" 
                                v-model="subject"
                                placeholder="Digite o assunto do email..." 
                                class="w-full bg-[#0f0f15] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-primary focus:outline-none placeholder-secondary/50 transition-colors"
                            />
                        </div>

                        <!-- Message Body (Tiptap) -->
                        <div class="space-y-1 flex-1 flex flex-col min-h-[300px]">
                            <label class="text-xs font-bold text-secondary uppercase tracking-wider">Mensagem <span class="text-primary">*</span></label>
                            
                            <div class="flex-1 flex flex-col bg-[#0f0f15] border border-white/10 rounded-lg overflow-hidden focus-within:border-primary transition-colors">
                                <!-- Toolbar -->
                                <div class="flex items-center gap-1 p-2 border-b border-white/5 bg-white/5" v-if="editor">
                                    <button 
                                        @click="editor.chain().focus().toggleBold().run()" 
                                        :class="{ 'bg-primary/20 text-primary': editor.isActive('bold'), 'text-secondary hover:text-white hover:bg-white/5': !editor.isActive('bold') }"
                                        class="p-1.5 rounded transition-colors"
                                        title="Negrito"
                                    >
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z"></path></svg>
                                    </button>
                                    <button 
                                        @click="editor.chain().focus().toggleItalic().run()" 
                                        :class="{ 'bg-primary/20 text-primary': editor.isActive('italic'), 'text-secondary hover:text-white hover:bg-white/5': !editor.isActive('italic') }"
                                        class="p-1.5 rounded transition-colors"
                                        title="Itálico"
                                    >
                                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>
                                    </button>
                                    <button 
                                        @click="setLink" 
                                        :class="{ 'bg-primary/20 text-primary': editor.isActive('link'), 'text-secondary hover:text-white hover:bg-white/5': !editor.isActive('link') }"
                                        class="p-1.5 rounded transition-colors"
                                        title="Inserir Link"
                                    >
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                                    </button>
                                    
                                     <button 
                                        @click="editor.chain().focus().unsetLink().run()" 
                                        :disabled="!editor.isActive('link')"
                                        class="p-1.5 rounded transition-colors text-secondary hover:text-white hover:bg-white/5 disabled:opacity-30"
                                        title="Remover Link"
                                    >
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                                    </button>
                                </div>

                                <!-- Editor Area -->
                                <editor-content :editor="editor" class="flex-1 overflow-y-auto custom-scrollbar" />
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="p-4 border-t border-white/5 bg-[#16161E] rounded-b-xl flex justify-end gap-3">
                        <button 
                            @click="$emit('close')" 
                            class="px-4 py-2 text-xs font-bold text-secondary hover:text-white border border-transparent hover:border-white/10 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            @click="handleSend" 
                            :disabled="isSending"
                            class="px-6 py-2 bg-primary hover:bg-primary-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                        >
                            <svg v-if="isSending" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span v-else class="flex items-center gap-2">
                                Enviar
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                            </span>
                        </button>
                    </div>

                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Tiptap Editor Styles */
:deep(.ProseMirror) {
    min-height: 100%;
    height: 100%;
    outline: none;
}
:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
</style>
