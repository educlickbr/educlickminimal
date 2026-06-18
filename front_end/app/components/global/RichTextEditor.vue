<template>
  <div class="flex flex-col gap-1">
    <!-- Toolbar -->
    <div class="flex gap-1 px-3 py-2 border-t border-l border-r border-b-0 rounded-t-lg" style="background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.07);">
      <button 
        type="button"
        @click="editor?.chain().focus().toggleBold().run()" 
        :class="['w-7 h-7 rounded flex items-center justify-center text-xs font-black transition-all', editor?.isActive('bold') ? 'bg-primary text-white' : 'text-secondary hover:bg-div-30']"
        title="Negrito"
      >B</button>
      <button 
        type="button"
        @click="editor?.chain().focus().toggleItalic().run()" 
        :class="['w-7 h-7 rounded flex items-center justify-center text-xs italic font-bold transition-all', editor?.isActive('italic') ? 'bg-primary text-white' : 'text-secondary hover:bg-div-30']"
        title="Itálico"
      >i</button>
      <div class="w-px h-5 bg-secondary/10 mx-1 self-center"></div>
      <button 
        type="button"
        @click="editor?.chain().focus().toggleBulletList().run()" 
        :class="['w-7 h-7 rounded flex items-center justify-center text-xs transition-all', editor?.isActive('bulletList') ? 'bg-primary text-white' : 'text-secondary hover:bg-div-30']"
        title="Lista"
      >≡</button>
      <button 
        type="button"
        @click="editor?.chain().focus().toggleOrderedList().run()" 
        :class="['w-7 h-7 rounded flex items-center justify-center text-xs transition-all', editor?.isActive('orderedList') ? 'bg-primary text-white' : 'text-secondary hover:bg-div-30']"
        title="Lista Numerada"
      >1.</button>
      <div class="w-px h-5 bg-secondary/10 mx-1 self-center"></div>
      <button 
        type="button"
        @click="editor?.chain().focus().toggleHeading({ level: 2}).run()" 
        :class="['w-7 h-7 rounded flex items-center justify-center text-[10px] font-black transition-all', editor?.isActive('heading', { level: 2 }) ? 'bg-primary text-white' : 'text-secondary hover:bg-div-30']"
        title="Título"
      >H2</button>
      <button 
        type="button"
        @click="editor?.chain().focus().toggleHeading({ level: 3}).run()" 
        :class="['w-7 h-7 rounded flex items-center justify-center text-[10px] font-black transition-all', editor?.isActive('heading', { level: 3 }) ? 'bg-primary text-white' : 'text-secondary hover:bg-div-30']"
        title="Subtítulo"
      >H3</button>
      <div class="w-px h-5 bg-secondary/10 mx-1 self-center"></div>
      <button 
        type="button"
        @click="editor?.chain().focus().unsetAllMarks().clearNodes().run()" 
        class="w-7 h-7 rounded flex items-center justify-center text-[9px] font-black text-secondary hover:bg-div-30 transition-all"
        title="Limpar formatação"
      >Tx</button>
    </div>

    <!-- Editor Area -->
    <div 
      class="w-full min-h-[200px] px-4 py-3 rounded-b-lg border text-sm cursor-text overflow-y-auto transition-all"
      style="background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.07); color: rgba(232,230,240,0.88);"
      @click="editor?.commands.focus()"
    >
      <editor-content :editor="editor" class="prose-editor outline-none" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps<{
  modelValue: string | null
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: props.placeholder || 'Escreva aqui...',
    })
  ],
  editorProps: {
    attributes: {
      class: 'prose-editor focus:outline-none min-h-[180px]',
    },
  },
  onUpdate({ editor }) {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => props.modelValue, (val) => {
  if (!editor.value) return
  const current = editor.value.getHTML()
  if (val !== current) {
    editor.value.commands.setContent(val || '')
  }
})

onBeforeUnmount(() => editor.value?.destroy())
</script>

<style>
/* Tiptap editor styles inside the dark theme */
.prose-editor {
  color: var(--color-text);
  outline: none;
}
.prose-editor h2 {
  font-size: 1rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-primary);
  margin: 0.75rem 0 0.25rem;
}
.prose-editor h3 {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--color-text);
  margin: 0.5rem 0 0.25rem;
}
.prose-editor p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  line-height: 1.6;
}
.prose-editor ul, .prose-editor ol {
  padding-left: 1.25rem;
  margin: 0.25rem 0;
}
.prose-editor li {
  font-size: 0.875rem;
  line-height: 1.6;
}
.prose-editor strong {
  font-weight: 800;
  color: var(--color-text);
}
.prose-editor em {
  opacity: 0.85;
}
.prose-editor p.is-editor-empty:first-child::before {
  color: rgba(var(--color-secondary-rgb, 140, 135, 141), 0.3);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
