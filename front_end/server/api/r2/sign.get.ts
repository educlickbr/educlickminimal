import crypto from 'node:crypto';
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  let key = query.key as string;
  const id = query.id as string;
  let nomeOriginal = '';

  if (!key && !id) {
    throw createError({ statusCode: 400, statusMessage: 'A chave (key) ou o id do arquivo é obrigatório' });
  }

  if (id) {
    const supabase = await serverSupabaseClient(event);
    const { data } = await supabase.from('global_arquivos').select('path, nome_original').eq('id', id).single();
    if (data) {
      key = data.path;
      nomeOriginal = data.nome_original || '';
    } else {
      throw createError({ statusCode: 404, statusMessage: 'Arquivo não encontrado no banco de dados' });
    }
  }

  const workerUrl = process.env.WORKER_URL;
  const secret = process.env.WORKER_AUTH_SECRET as string;

  if (!workerUrl || !secret) {
    throw createError({ statusCode: 500, statusMessage: 'Configuração do Worker ausente no .env' });
  }

  // Gera a mesma assinatura HMAC SHA-256 que o Worker espera
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(key);
  const signature = hmac.digest('hex');

  // Garante que não tenha duas barras na URL
  const baseUrl = workerUrl.replace(/\/$/, '');
  
  // Retorna a URL final: https://seu-worker.dev/teste/arquivo.png?token=a1b2c3d4...
  const signedUrl = `${baseUrl}/${key}?token=${signature}`;

  return { signedUrl, nomeOriginal };
});
