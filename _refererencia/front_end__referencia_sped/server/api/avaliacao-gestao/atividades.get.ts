import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);

    const { data, error } = await client
        .from('avl_atividade_recuperacao')
        .select('id, titulo, enunciado, link_externo, id_turma, arquivo_apoio, criado_em')
        .order('criado_em', { ascending: false });

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }

    const atividades = data || [];
    const turmaIds = atividades
        .map((item: any) => String(item?.id_turma || '').trim())
        .filter((id: string) => !!id);

    if (!turmaIds.length) {
        return atividades;
    }

    const { data: turmas, error: turmasError } = await client
        .from('turmas')
        .select('id, nome_curso, cod_turma, turno')
        .in('id', turmaIds);

    if (turmasError) {
        throw createError({ statusCode: 500, statusMessage: turmasError.message });
    }

    const turmaMap = new Map(
        (turmas || []).map((t: any) => [
            String(t.id),
            [
                t.nome_curso || null,
                t.cod_turma ? `(${t.cod_turma})` : null,
                t.turno || null,
            ]
                .filter(Boolean)
                .join(' - ') || null,
        ])
    );

    return atividades.map((atividade: any) => ({
        ...atividade,
        turma_nome_turno: atividade.id_turma ? (turmaMap.get(String(atividade.id_turma)) || null) : null,
    }));
});