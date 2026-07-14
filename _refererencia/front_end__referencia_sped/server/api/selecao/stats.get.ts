import { createError, defineEventHandler, getQuery } from 'h3';
import { serverSupabaseClient } from '#supabase/server';

const PAGE_LIMIT = 500;

const toLabel = (value: unknown) => {
  const label = String(value ?? '').trim();
  return label || 'Não informado';
};

const countByLabel = (items: any[], field: 'pcd' | 'genero' | 'raca' | 'renda') => {
  const acc: Record<string, number> = {};

  for (const item of items) {
    const label = toLabel(item?.[field]);
    acc[label] = (acc[label] || 0) + 1;
  }

  return acc;
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const client = await serverSupabaseClient(event);

  const idTurma = query.id_turma ? String(query.id_turma) : null;

  if (!idTurma) {
    return {
      total: 0,
      pcd: {},
      genero: {},
      raca: {},
      renda: {}
    };
  }

  const fetchPage = async (page: number) => {
    const { data, error } = await (client.rpc as any)('nxt_get_candidatos_processo_turma_v3', {
      p_id_turma: idTurma,
      p_pagina: page,
      p_limite: PAGE_LIMIT,
      p_tipo_candidatura: query.tipo_candidatura || null,
      p_busca: query.busca || null,
      p_filtros: query.filtros ? JSON.parse(String(query.filtros)) : [],
      p_pcd: query.pcd || null,
      p_laudo: query.laudo === 'true' ? true : (query.laudo === 'false' ? false : null),
      p_data_inscricao_inicio: query.data_inscricao_inicio ? String(query.data_inscricao_inicio) : null,
      p_data_inscricao_fim: query.data_inscricao_fim ? String(query.data_inscricao_fim) : null,
      p_ordenar_por: 'nome_completo',
      p_ordenar_como: 'ASC'
    });

    if (error) {
      throw error;
    }

    return data as any;
  };

  try {
    const firstPage = await fetchPage(1);

    const totalPages = Math.max(Number(firstPage?.qtd_paginas || 0), 0);
    const allItems = [...(firstPage?.itens || [])];

    for (let page = 2; page <= totalPages; page += 1) {
      const pageData = await fetchPage(page);
      if (Array.isArray(pageData?.itens) && pageData.itens.length) {
        allItems.push(...pageData.itens);
      }
    }

    return {
      total: Number(firstPage?.qtd_total || 0),
      pcd: countByLabel(allItems, 'pcd'),
      genero: countByLabel(allItems, 'genero'),
      raca: countByLabel(allItems, 'raca'),
      renda: countByLabel(allItems, 'renda')
    };
  } catch (error: any) {
    console.error('Erro ao buscar stats de seleção:', error);
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.statusMessage || error?.message || 'Erro interno ao buscar stats de seleção.'
    });
  }
});
