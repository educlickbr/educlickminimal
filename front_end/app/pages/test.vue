<template>
  <div class="p-8 max-w-2xl mx-auto space-y-8 text-white">
    <h1 class="text-2xl font-bold">Teste R2 Upload & Download</h1>

    <!-- Seção de Upload -->
    <div class="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
      <h2 class="text-lg font-semibold">1. Fazer Upload</h2>
      <input 
        type="file" 
        @change="onFileSelected" 
        class="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80 transition-colors cursor-pointer" 
      />
      
      <div class="flex gap-4">
        <button 
          @click="uploadFile(false)" 
          :disabled="!selectedFile || isUploading"
          class="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-lg shadow-green-500/20"
        >
          {{ isUploading && !isUploadingDb ? 'Enviando...' : 'Só Enviar pro R2' }}
        </button>

        <button 
          @click="uploadFile(true)" 
          :disabled="!selectedFile || isUploading"
          class="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20"
        >
          {{ isUploading && isUploadingDb ? 'Gravando...' : 'Enviar + Salvar no DB' }}
        </button>
      </div>

      <p v-if="uploadSuccess" class="text-green-400 text-sm font-medium">✅ Sucesso! Arquivo: {{ uploadedKey }}</p>
    </div>

    <!-- Seção do DB -->
    <div class="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold">2. Tabela `global_arquivos`</h2>
        <button @click="fetchArquivos" class="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg">Atualizar Lista</button>
      </div>

      <div v-if="arquivos.length === 0" class="text-sm text-gray-500 italic">
        Nenhum arquivo gravado no banco ainda.
      </div>
      
      <div v-else class="grid gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        <div v-for="arq in arquivos" :key="arq.id" class="p-3 bg-black/40 border border-white/5 rounded-lg flex justify-between items-center group">
          <div class="overflow-hidden pr-2">
            <p class="font-bold text-sm text-white truncate" :title="arq.nome_original">{{ arq.nome_original }}</p>
            <p class="text-[10px] text-gray-500 truncate" :title="arq.path">{{ arq.path }}</p>
          </div>
          <button 
            @click="viewFromDb(arq.path)" 
            class="shrink-0 px-3 py-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition-all"
          >
            Ver Arquivo
          </button>
        </div>
      </div>
    </div>

    <!-- Seção de Download / Visualização -->
    <div class="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
      <h2 class="text-lg font-semibold">3. Visualizador (Worker Seguro)</h2>
      <div class="flex gap-4">
        <input 
          v-model="fileToView" 
          placeholder="Ex: teste/foto.png" 
          class="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
        <button 
          @click="getFileUrl" 
          :disabled="!fileToView || isFetching"
          class="px-6 py-2 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
        >
          {{ isFetching ? 'Gerando...' : 'Gerar Link' }}
        </button>
      </div>

      <div v-if="signedWorkerUrl" class="p-4 bg-black/30 rounded-xl border border-white/5 break-all flex flex-col gap-2">
        <p class="text-xs font-bold text-secondary uppercase tracking-widest opacity-60">Link Assinado</p>
        <a :href="signedWorkerUrl" target="_blank" class="text-blue-400 hover:text-blue-300 hover:underline text-sm font-mono">
          {{ signedWorkerUrl }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const selectedFile = ref(null)
const isUploading = ref(false)
const isUploadingDb = ref(false)
const uploadSuccess = ref(false)
const uploadedKey = ref('')

const arquivos = ref([])

const fileToView = ref('')
const isFetching = ref(false)
const signedWorkerUrl = ref('')

onMounted(() => {
  fetchArquivos()
})

function onFileSelected(event) {
  selectedFile.value = event.target.files[0]
  uploadSuccess.value = false
}

async function uploadFile(saveToDb) {
  if (!selectedFile.value) return
  isUploading.value = true
  isUploadingDb.value = saveToDb
  uploadSuccess.value = false

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    
    // Passa a flag se quisermos salvar no DB
    if (saveToDb) {
      formData.append('saveToDb', 'true')
      formData.append('escopo', 'teste')
    }

    const response = await $fetch('/api/r2/upload', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      uploadSuccess.value = true
      uploadedKey.value = response.key
      fileToView.value = response.key
      signedWorkerUrl.value = '' 
      
      // Se gravou no banco, atualiza a lista
      if (saveToDb) {
        await fetchArquivos()
      }
    }
  } catch (error) {
    console.error('Erro no upload', error)
    alert(error?.data?.message || 'Erro no processo de upload.')
  } finally {
    isUploading.value = false
    isUploadingDb.value = false
  }
}

async function fetchArquivos() {
  try {
    const data = await $fetch('/api/r2/arquivos')
    arquivos.value = data || []
  } catch (err) {
    console.error('Erro ao buscar arquivos do banco', err)
  }
}

async function viewFromDb(path) {
  fileToView.value = path
  
  // Como agora abre automático, podemos dar um pequeno feedback no botão se quisermos
  try {
    const { signedUrl } = await $fetch('/api/r2/sign', {
      params: { key: path }
    })
    
    signedWorkerUrl.value = signedUrl // Só pra mostrar na caixinha de baixo também
    
    // Abre a nova aba magicamente
    window.open(signedUrl, '_blank')
  } catch (error) {
    console.error('Erro ao assinar URL e abrir', error)
    alert('Erro ao abrir o arquivo.')
  }
}

async function getFileUrl() {
  if (!fileToView.value) return
  isFetching.value = true
  signedWorkerUrl.value = ''

  try {
    const { signedUrl } = await $fetch('/api/r2/sign', {
      params: { key: fileToView.value }
    })
    
    signedWorkerUrl.value = signedUrl
  } catch (error) {
    console.error('Erro ao assinar URL', error)
    alert('Erro ao gerar URL segura.')
  } finally {
    isFetching.value = false
  }
}
</script>

<style scoped>
/* Scrollbar mais elegante para a lista de arquivos */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
