import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event);
  
  // Lista os últimos 20 arquivos inseridos na tabela global_arquivos
  const { data, error } = await supabase
    .from('global_arquivos')
    .select('id, path, nome_original, tamanho_bytes, criado_at')
    .order('criado_at', { ascending: false })
    .limit(20);

  if (error) {
    throw createError({ statusCode: 500, message: error.message });
  }

  return data;
});
