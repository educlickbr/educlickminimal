<script setup lang="ts">
import { useToast } from '../../composables/useToast'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

const props = defineProps<{
    isOpen: boolean
    student: any
}>()

const emit = defineEmits(['close', 'send'])

const { showToast } = useToast()

const subject = ref('')
const isSending = ref(false)

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

// Reset form when modal opens
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        subject.value = ''
        editor.value?.commands.setContent('')
        
        // Auto-focus subject slightly delayed
        setTimeout(() => {
            document.getElementById('email-subject')?.focus()
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

    // cancelled
    if (url === null) {
        return
    }

    // empty
    if (url === '') {
        editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
        return
    }

    // update
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

const handleSend = async () => {
    if (!subject.value.trim()) {
        showToast('Por favor, informe o assunto do email.', { type: 'error' })
        return
    }
    
    const htmlContent = editor.value?.getHTML()
    const textContent = editor.value?.getText()

    if (!textContent?.trim() && !htmlContent?.includes('<img')) { // Basic check
        showToast('Por favor, escreva uma mensagem.', { type: 'error' })
        return
    }

    isSending.value = true
    try {
        const payload = {
            to: props.student.email,
            studentName: `${props.student.nome} ${props.student.sobrenome}`,
            subject: subject.value,
            message: htmlContent // Sending HTML now
        }

        emit('send', payload)
    } catch (e) {
        console.error('Error preparing email:', e)
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
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold text-white">Novo Email</h3>
                                <p class="text-xs text-secondary">Enviar mensagem para aluno</p>
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
                        
                        <!-- To -->
                        <div class="space-y-1">
                            <label class="text-xs font-bold text-secondary uppercase tracking-wider">Para</label>
                            <div class="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 cursor-not-allowed">
                                <div class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                                    {{ student?.nome?.charAt(0) }}
                                </div>
                                <span class="font-medium text-white">{{ student?.nome }} {{ student?.sobrenome }}</span>
                                <span class="text-secondary">&lt;{{ student?.email }}&gt;</span>
                            </div>
                        </div>

                        <!-- Subject -->
                        <div class="space-y-1">
                            <label for="email-subject" class="text-xs font-bold text-secondary uppercase tracking-wider">Assunto <span class="text-primary">*</span></label>
                            <input 
                                id="email-subject"
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
                                Enviar Email
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

/* Tiptap Editor Styles (Ensure height fill) */
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
