<script setup lang="ts">
import { ref } from 'vue'

const config = useRuntimeConfig()
const isLoading = ref(false)
const responseMessage = ref('')
const responseData = ref<any>(null)

const handleTestButtonClick = async () => {
  isLoading.value = true
  responseMessage.value = ''
  responseData.value = null

  try {
    const powerAutomateUrl = config.public.powerAutomateAvisoCandidatosInsc
    
    console.log('URL:', powerAutomateUrl)
    
    if (!powerAutomateUrl) {
      throw new Error('URL do Power Automate não configurada')
    }

    const payload = {
      email: 'candidato@example.com',
      ano_semestre: '2026.1',
      turma: 'Turma A',
      turno: 'Matutino',
      area: 'Tecnologia'
    }

    console.log('Payload:', payload)

    const response = await fetch(powerAutomateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    console.log('Status:', response.status)
    console.log('Headers:', response.headers)

    let responseBody: any = null
    const contentType = response.headers.get('content-type')

    if (contentType && contentType.includes('application/json')) {
      const text = await response.text()
      if (text) {
        responseBody = JSON.parse(text)
      }
    } else {
      responseBody = await response.text()
    }

    console.log('Response Body:', responseBody)

    if (!response.ok) {
      throw new Error(`Status ${response.status}: ${responseBody || 'Sem resposta'}`)
    }

    responseMessage.value = 'Sucesso! Aviso enviado para Power Automate.'
    responseData.value = {
      status: response.status,
      statusText: response.statusText,
      body: responseBody || '(resposta vazia - esperado para Power Automate)'
    }
  } catch (error: any) {
    console.error('Erro:', error)
    responseMessage.value = `Erro: ${error.message || 'Falha ao chamar o endpoint'}`
    responseData.value = error
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-2xl mx-auto px-4">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Página de Testes</h1>

      <div class="bg-white rounded-lg shadow p-6">
        <button
          @click="handleTestButtonClick"
          :disabled="isLoading"
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
        >
          {{ isLoading ? 'Enviando...' : 'Chamar Endpoint de Teste' }}
        </button>

        <!-- Response Message -->
        <div v-if="responseMessage" class="mt-6">
          <p class="text-sm font-medium" :class="responseMessage.includes('Erro') ? 'text-red-600' : 'text-green-600'">
            {{ responseMessage }}
          </p>
        </div>

        <!-- Response Data -->
        <div v-if="responseData" class="mt-4 bg-gray-100 rounded p-4">
          <p class="text-sm font-medium text-gray-700 mb-2">Dados da Resposta:</p>
          <pre class="text-xs text-gray-800 overflow-auto max-h-64">{{ JSON.stringify(responseData, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
