import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const { id } = event.context.params as { id: string };
    const client = await serverSupabaseClient(event);

    const { data: curso, error: cursoError } = await client
        .from('curso')
        .select('id, nome_curso, area, modalidade, cod_curso, descricao, padrao_encontros, qtd_modulos, qtd_aulas_modulo, qtd_periodos, qtd_minutos_periodo, qtd_minutos_aula, qtd_minutos_modulo, qtd_minutos_total')
        .eq('id', id)
        .single() as { data: any; error: any };

    if (cursoError) {
        throw createError({
            statusCode: 500,
            statusMessage: cursoError.message,
        });
    }

    const { data: encontros, error: encontrosError } = await client
        .from('curso_encontros')
        .select('numero_encontro, duracao_minutos')
        .eq('id_curso', id)
        .order('numero_encontro', { ascending: true }) as { data: any[] | null; error: any };

    if (encontrosError) {
        throw createError({
            statusCode: 500,
            statusMessage: encontrosError.message,
        });
    }

    const data = {
        id: curso.id,
        nome: curso.nome_curso,
        area: curso.area,
        modalidade: curso.modalidade,
        codigo: curso.cod_curso,
        descricao: curso.descricao,
        qtd_modulos: curso.qtd_modulos,
        qtd_encontros_modulo: curso.qtd_aulas_modulo,
        qtd_periodos: curso.qtd_periodos,
        qtd_minutos_periodo: curso.qtd_minutos_periodo,
        qtd_minutos_aula: curso.qtd_minutos_aula,
        qtd_minutos_modulo: curso.qtd_minutos_modulo,
        qtd_minutos_total: curso.qtd_minutos_total,
        padrao_encontros: curso.padrao_encontros,
        encontros: (encontros || []).map((e) => ({
            dia: e.numero_encontro,
            tempo_minutos: e.duracao_minutos,
        })),
    };

    return data;
});
