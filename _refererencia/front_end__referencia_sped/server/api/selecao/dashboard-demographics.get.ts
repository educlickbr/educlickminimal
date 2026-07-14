import { createError, defineEventHandler, getQuery } from 'h3';
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const client = await serverSupabaseClient(event);

  const anoSemestre = query.ano_semestre ? String(query.ano_semestre) : null;
  const area = query.area ? String(query.area) : null;
  const tipoProcesso = query.tipo_processo ? String(query.tipo_processo) : 'seletivo';
  const tipoCandidatura = query.tipo_candidatura ? String(query.tipo_candidatura) : 'estudante';

  if (!anoSemestre) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ano/Semestre obrigatório',
    });
  }

  const { data, error } = await client.rpc(
    'nxt_get_dashboard_demographics',
    {
      p_ano_semestre: anoSemestre,
      p_tipo_processo: tipoProcesso,
      p_tipo_candidatura: tipoCandidatura,
      p_area: area,
    } as any,
  );

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return data;
});
