<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const { tipo_proc, tipo_cand, area_id, programa_id } = route.params as { tipo_proc: string, tipo_cand: string, area_id: string, programa_id: string }

// Store e Sessão
import { useAppStore } from '../../../../../../stores/app'
const store = useAppStore()

const loading = ref(true)
const blocos = ref<any[]>([])
const activeTab = ref(0)
const answers = ref<Record<string, any>>({})
const saveStatus = ref<Record<string, string>>({})
const fileNames = ref<Record<string, string>>({})
const fileLinks = ref<Record<string, string>>({})

// Fallback de Entidade (para testes)
const idEntidade = computed(() => (route.query.id_entidade as string) || '00ca60ea-6667-482d-8a96-09b877707b08')

async function loadFormConfig() {
  loading.value = true
  try {
    const configRes = await $fetch('/api/form/config', {
      params: {
        id_entidade: idEntidade.value,
        programa_id: programa_id !== '0' ? programa_id : null,
        area_id: area_id !== '0' ? area_id : null,
        tipo_proc: tipo_proc,
        tipo_cand: tipo_cand
      }
    }) as any

    if (configRes.success) {
      let blocosData = configRes.blocos || []
      
      // Injetar Bloco Base se não houver
      if (blocosData.length === 0) {
        blocosData.push({ bloco: 'Dados Gerais', ordem: 0, perguntas: [] })
      }

      // Injetar perguntas de sistema no topo do primeiro bloco
      const sysQuestions = [
        { pergunta_id: 'sys-nome', label: 'Nome', tipo_pergunta: 'text', largura: '1', obrigatorio: true },
        { pergunta_id: 'sys-sobrenome', label: 'Sobrenome', tipo_pergunta: 'text', largura: '1', obrigatorio: true },
        { pergunta_id: 'sys-email', label: 'E-mail', tipo_pergunta: 'email', largura: '2', obrigatorio: true, disabled: true }
      ]
      
      blocosData[0].perguntas = [...sysQuestions, ...blocosData[0].perguntas]
      blocos.value = blocosData
      
      // Pré-preencher com dados do usuário atual (da store)
      if (store.initialized) {
        answers.value['sys-nome'] = store.nome || ''
        answers.value['sys-sobrenome'] = store.sobrenome || ''
        answers.value['sys-email'] = store.user?.email || ''
      }

      // Coletar todos os IDs de perguntas para buscar respostas (ignorando as de sistema)
      const allPerguntaIds = blocos.value.flatMap(b => b.perguntas.map((p: any) => p.pergunta_id)).filter(id => !id.startsWith('sys-'))
      
      if (store.user_expandido_id && allPerguntaIds.length > 0) {
        await loadUserAnswers(allPerguntaIds)
        
        // Pós-carregamento: buscar metadados e links assinados para arquivos já anexados
        const fileQuestions = blocos.value.flatMap(b => b.perguntas).filter((p: any) => p.tipo_pergunta === 'file')
        for (const q of fileQuestions) {
          const fileId = answers.value[q.pergunta_id]
          if (fileId) {
            fetchFileInfo(q.pergunta_id, fileId)
          }
        }
      }
    }

  } catch (e) {
    console.error('Erro ao carregar form:', e)
  } finally {
    loading.value = false
  }
}

async function fetchFileInfo(perguntaId: string, fileId: string) {
  try {
    const res = await $fetch('/api/r2/sign', { params: { id: fileId } }) as any
    if (res.signedUrl) {
      fileLinks.value[perguntaId] = res.signedUrl
      fileNames.value[perguntaId] = res.nomeOriginal || 'Arquivo anexado'
    }
  } catch(e) {
    console.error('Erro ao buscar info do arquivo', e)
  }
}

async function viewFile(perguntaId: string) {
  const link = fileLinks.value[perguntaId]
  if (link) {
    window.open(link, '_blank')
  } else {
    // Se por algum motivo não carregou no mount, tenta carregar agora
    const fileId = answers.value[perguntaId]
    if (fileId) {
      await fetchFileInfo(perguntaId, fileId)
      if (fileLinks.value[perguntaId]) {
        window.open(fileLinks.value[perguntaId], '_blank')
      }
    }
  }
}

async function loadUserAnswers(perguntaIds: string[]) {
  try {
    const respRes = await $fetch('/api/form/respostas', {
      params: {
        user_expandido_id: store.user_expandido_id,
        pergunta_ids: perguntaIds
      }
    }) as any

    if (respRes.success) {
      // Mapear respostas para o objeto reativo
      Object.keys(respRes.respostas).forEach(id => {
        answers.value[id] = respRes.respostas[id].resposta
        saveStatus.value[id] = `Carregado (${formatTime(respRes.respostas[id].modificado_em)})`
      })
    }
  } catch (e) {
    console.error('Erro ao carregar respostas:', e)
  }
}

async function saveAnswer(perguntaId: string, tipo_pergunta?: string) {
  const value = answers.value[perguntaId]
  if (value === undefined || value === '') return

  if (tipo_pergunta === 'cpf' && !validarCPF(value)) {
    saveStatus.value[perguntaId] = 'CPF Inválido'
    return
  }

  saveStatus.value[perguntaId] = 'Salvando...'
  
  try {
    const res = await $fetch('/api/form/save', {
      method: 'POST',
      body: {
        id_entidade: idEntidade.value,
        id_user_expandido: store.user_expandido_id,
        id_pergunta: perguntaId,
        resposta: value
      }
    }) as any

    if (res.success) {
      saveStatus.value[perguntaId] = `Salvo às ${res.salvo_em}`
    } else {
      saveStatus.value[perguntaId] = 'Erro ao salvar'
      console.error('Erro detalhado do backend:', res)
    }
  } catch (e) {
    saveStatus.value[perguntaId] = 'Erro de conexão'
    console.error('Erro de conexão:', e)
  }
}

function formatTime(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatCpfInput(id: string) {
  if (answers.value[id]) {
    answers.value[id] = formatarCPF(answers.value[id])
  }
}

async function handleFileUpload(event: Event, perguntaId: string) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  
  const file = input.files[0]
  saveStatus.value[perguntaId] = 'Fazendo upload...'

  const formData = new FormData()
  formData.append('file', file as Blob)
  formData.append('saveToDb', 'true')
  formData.append('escopo', 'respostas_user')

  try {
    const response = await $fetch('/api/r2/upload', {
      method: 'POST',
      body: formData
    }) as any

    if (response.success && response.dbRecord) {
      // Salva o UUID do registro no global_arquivos como resposta para o form
      answers.value[perguntaId] = response.dbRecord.id
      fileNames.value[perguntaId] = response.originalName
      // Carrega a url assinada em background para visualização rápida
      fetchFileInfo(perguntaId, response.dbRecord.id)
      await saveAnswer(perguntaId, 'file')
    } else {
      saveStatus.value[perguntaId] = 'Erro ao processar arquivo'
    }
  } catch(e) {
    saveStatus.value[perguntaId] = 'Erro no upload'
    console.error(e)
  }
}

async function removeFile(perguntaId: string) {
  const fileId = answers.value[perguntaId]
  if (!fileId) return
  
  if (!confirm('Tem certeza que deseja apagar e substituir este arquivo?')) return

  saveStatus.value[perguntaId] = 'Removendo...'

  try {
    const response = await $fetch('/api/r2/delete', {
      method: 'POST',
      body: { fileId }
    }) as any

    if (response.success) {
      answers.value[perguntaId] = null
      await saveAnswer(perguntaId, 'file') // Isso vai atualizar a resposta no banco para nulo
      saveStatus.value[perguntaId] = 'Removido com sucesso'
      setTimeout(() => { saveStatus.value[perguntaId] = '' }, 3000)
    } else {
      saveStatus.value[perguntaId] = 'Erro ao apagar arquivo'
    }
  } catch (e) {
    saveStatus.value[perguntaId] = 'Erro ao remover'
    console.error(e)
  }
}

onMounted(async () => {
  if (!store.initialized) await store.initSession()
  await loadFormConfig()
})
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0c] text-white font-sans">
    <!-- Header Simples -->
    <header class="bg-[#0f0f17] border-b border-white/5 px-6 py-4">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Icon name="ph:form-bold" class="w-6 h-6 text-primary" />
          <h1 class="text-sm font-black uppercase tracking-widest">Formulário de Inscrição</h1>
        </div>
        <button @click="$router.back()" class="text-[10px] font-bold uppercase tracking-widest text-secondary hover:text-white transition-colors">
          Voltar
        </button>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-12">
      
      <div v-if="loading" class="space-y-8">
        <div class="h-10 w-48 bg-white/5 animate-pulse rounded-lg"></div>
        <div class="grid grid-cols-2 gap-6">
          <div v-for="i in 4" :key="i" class="h-20 bg-white/5 animate-pulse rounded-xl"></div>
        </div>
      </div>

      <div v-else-if="blocos.length === 0" class="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
        <Icon name="ph:seal-warning-light" class="w-16 h-16 text-secondary/20 mb-4 mx-auto" />
        <p class="text-secondary font-bold">Nenhuma pergunta configurada para este programa.</p>
      </div>

      <div v-else>
        <!-- Tabs de Blocos -->
        <div v-if="blocos.length > 1" class="flex gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            v-for="(bloco, idx) in blocos" 
            :key="bloco.bloco"
            @click="activeTab = idx"
            class="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border"
            :class="activeTab === idx ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-white/5 border-white/5 text-secondary hover:text-white'"
          >
            {{ bloco.bloco }}
          </button>
        </div>

        <!-- Conteúdo do Bloco Ativo -->
        <div class="bg-[#0f0f17] border border-white/5 rounded-2xl p-8 md:p-12 shadow-2xl">
          <h2 class="text-2xl font-black mb-8 tracking-tight">{{ blocos[activeTab].bloco }}</h2>
          
          <div class="grid grid-cols-2 gap-x-8 gap-y-10">
            <div 
              v-for="pergunta in blocos[activeTab].perguntas" 
              :key="pergunta.pergunta_id"
              :class="pergunta.largura == '2' ? 'col-span-2' : 'col-span-2 md:col-span-1'"
              class="flex flex-col gap-2"
            >
              <div class="flex items-center justify-between">
                <label class="text-[10px] font-black uppercase tracking-widest text-secondary/60">
                  {{ pergunta.label }}
                  <span v-if="pergunta.obrigatorio" class="text-primary ml-1">*</span>
                </label>
                <span v-if="saveStatus[pergunta.pergunta_id]" class="text-[8px] font-bold text-primary/60 uppercase tracking-tighter">
                  {{ saveStatus[pergunta.pergunta_id] }}
                </span>
              </div>

              <!-- Input de Texto / Number / Email -->
              <input 
                v-if="['text', 'number', 'email', 'tel'].includes(pergunta.tipo_pergunta)"
                :type="pergunta.tipo_pergunta"
                v-model="answers[pergunta.pergunta_id]"
                @blur="saveAnswer(pergunta.pergunta_id)"
                :placeholder="pergunta.placeholder"
                :disabled="pergunta.disabled"
                class="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                :style="{ height: pergunta.altura ? pergunta.altura + 'px' : 'auto' }"
              />

              <!-- CPF -->
              <input 
                v-else-if="pergunta.tipo_pergunta === 'cpf'"
                type="text"
                v-model="answers[pergunta.pergunta_id]"
                @input="formatCpfInput(pergunta.pergunta_id)"
                @blur="saveAnswer(pergunta.pergunta_id, pergunta.tipo_pergunta)"
                :placeholder="pergunta.placeholder || '000.000.000-00'"
                :disabled="pergunta.disabled"
                maxlength="14"
                class="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                :class="answers[pergunta.pergunta_id] && !validarCPF(answers[pergunta.pergunta_id]) ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50 text-red-400' : ''"
                :style="{ height: pergunta.altura ? pergunta.altura + 'px' : 'auto' }"
              />

              <!-- Select -->
              <select 
                v-else-if="pergunta.tipo_pergunta === 'select'"
                v-model="answers[pergunta.pergunta_id]"
                @change="saveAnswer(pergunta.pergunta_id)"
                class="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all appearance-none"
                :style="{ height: pergunta.altura ? pergunta.altura + 'px' : 'auto' }"
              >
                <option value="" disabled selected>{{ pergunta.placeholder || 'Selecione uma opção' }}</option>
                <option v-for="opt in pergunta.opcoes" :key="opt" :value="opt">{{ opt }}</option>
              </select>

              <!-- Date -->
              <input 
                v-else-if="pergunta.tipo_pergunta === 'date'"
                type="date"
                v-model="answers[pergunta.pergunta_id]"
                @blur="saveAnswer(pergunta.pergunta_id)"
                class="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                :style="{ height: pergunta.altura ? pergunta.altura + 'px' : 'auto' }"
              />

              <!-- File / Upload -->
              <div v-else-if="pergunta.tipo_pergunta === 'file'" class="flex flex-col gap-2">
                <input 
                  v-if="!answers[pergunta.pergunta_id]"
                  type="file"
                  @change="handleFileUpload($event, pergunta.pergunta_id)"
                  :disabled="pergunta.disabled || saveStatus[pergunta.pergunta_id] === 'Fazendo upload...'"
                  class="block w-full text-xs text-secondary file:mr-3 file:py-1 file:px-4 file:h-[30px] file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-primary file:text-white hover:file:bg-primary/90 transition-all cursor-pointer bg-white/[0.03] border border-white/10 rounded-xl px-1 py-1 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:border-primary/50"
                  :style="{ height: pergunta.altura ? pergunta.altura + 'px' : '36px' }"
                />
                
                <!-- Feedback Visual do Arquivo (Mostra se já existe resposta salva) -->
                <div v-else class="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2" :style="{ height: pergunta.altura ? pergunta.altura + 'px' : '36px' }">
                  <div class="flex items-center gap-3 overflow-hidden">
                    <button 
                      @click="viewFile(pergunta.pergunta_id)"
                      class="text-[11px] font-bold text-primary hover:text-white flex items-center gap-1.5 transition-colors shrink-0"
                      title="Visualizar arquivo em nova aba"
                    >
                      <Icon name="ph:arrow-square-out-bold" class="w-4 h-4" /> 
                      Ver Arquivo
                    </button>
                    <span class="text-[10px] text-gray-500 truncate" :title="fileNames[pergunta.pergunta_id]">
                      {{ fileNames[pergunta.pergunta_id] || 'Carregando info...' }}
                    </span>
                  </div>
                  <button 
                    @click="removeFile(pergunta.pergunta_id)"
                    class="p-1 hover:bg-white/5 rounded text-secondary hover:text-red-400 transition-colors flex items-center justify-center shrink-0"
                    title="Apagar e enviar outro arquivo"
                  >
                    <Icon name="ph:trash-light" class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Textarea -->
              <textarea 
                v-else-if="pergunta.tipo_pergunta === 'textarea'"
                v-model="answers[pergunta.pergunta_id]"
                @blur="saveAnswer(pergunta.pergunta_id)"
                :placeholder="pergunta.placeholder"
                class="bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all resize-none"
                :style="{ height: '100px' }"
              ></textarea>

              <div v-else class="p-4 bg-white/5 rounded-xl border border-dashed border-white/10 text-[10px] text-secondary text-center">
                Tipo [{{ pergunta.tipo_pergunta }}] em desenvolvimento
              </div>
            </div>
          </div>

          <div class="mt-16 pt-8 border-t border-white/5 flex items-center justify-between">
            <button 
              v-if="activeTab > 0"
              @click="activeTab--"
              class="px-8 py-3 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all"
            >
              Anterior
            </button>
            <div v-else></div>

            <button 
              v-if="activeTab < blocos.length - 1"
              @click="activeTab++"
              class="px-8 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
            >
              Próximo Passo
            </button>
            <button 
              v-else
              class="px-8 py-3 rounded-xl bg-green-500 text-white text-xs font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
            >
              Finalizar Inscrição
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
select {
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238b5cf6' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") !important;
  background-position: right 1.2rem center !important;
  background-repeat: no-repeat !important;
  background-size: 1.2em 1.2em !important;
  padding-right: 3rem !important;
}
</style>
