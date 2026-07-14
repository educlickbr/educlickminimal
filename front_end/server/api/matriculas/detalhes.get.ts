import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/matriculas/detalhes?id_matricula=UUID
 *
 * Retorna tudo para o modal de detalhes:
 * - Dados da matrícula (aluno, programa, área, turma)
 * - Config do formulário de matrícula (blocos + perguntas)
 * - Respostas do aluno ao formulário
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);
    const id_matricula = query.id_matricula as string;

    if (!id_matricula) {
        throw createError({
            statusCode: 400,
            message: "id_matricula é obrigatório",
        });
    }

    // 1. Buscar matrícula com dados do aluno e programa
    const { data: matricula, error: errMat } = await client
        .from("aca_matricula")
        .select(
            `
            id, criado_em, status, declaracao_matricula,
            id_usuario, id_programa, id_pedido,
            usuario:user_expandido!aca_matricula_id_usuario_fkey(nome_completo, email),
            programa:aca_programa!aca_matricula_id_programa_fkey(
                id, descricao, id_area, id_entidade,
                area:aca_area(id, nome_area)
            )
        `,
        )
        .eq("id", id_matricula)
        .single();

    if (errMat || !matricula) {
        throw createError({
            statusCode: 404,
            message: "Matrícula não encontrada",
        });
    }

    const programa = (matricula as any).programa;
    const id_entidade = programa?.id_entidade;
    const programa_id = matricula.id_programa;
    const area_id = programa?.id_area;

    // 2. Buscar turma primária do programa
    const { data: turmaData } = await client
        .from("aca_ciclo_programa")
        .select(
            `
            ciclo:aca_ciclo(id, descricao, ano_semestre)
        `,
        )
        .eq("id_programa", programa_id)
        .order("ciclo(data_ini)", { ascending: true } as any)
        .limit(1)
        .maybeSingle();

    // 3. Buscar config do formulário (hierarquia: programa → área)
    const { data: blocos, error: errConfig } = await client.rpc(
        "aca_get_form_config_completo",
        {
            p_id_entidade: id_entidade,
            p_programa_id: programa_id,
            p_area_id: area_id,
            p_tipo_proc: "matricula",
            p_tipo_cand: "estudante",
        } as any,
    );

    if (errConfig) {
        throw createError({ statusCode: 500, message: errConfig.message });
    }

    // 4. Coletar ids das perguntas
    const perguntas: any[] = [];
    for (const bloco of (blocos as any[]) || []) {
        for (const p of bloco.perguntas || []) {
            perguntas.push(p);
        }
    }
    const perguntaIds = perguntas.map((p) => p.pergunta_id);

    // 5. Buscar respostas do usuário
    let respostas: Record<string, any> = {};
    if (perguntaIds.length > 0) {
        const { data: respData, error: errResp } = await client.rpc(
            "aca_get_respostas_usuario",
            {
                p_id_user_expandido: matricula.id_usuario,
                p_pergunta_ids: perguntaIds,
            } as any,
        );

        if (!errResp && respData) {
            for (const [pid, val] of Object.entries(
                respData as Record<string, any>,
            )) {
                respostas[pid] = (val as any).resposta;
                if ((val as any).id_arquivo) {
                    respostas[pid + "_id_arquivo"] = (val as any).id_arquivo;
                }
            }
        }
    }

    return {
        success: true,
        matricula: {
            id: matricula.id,
            criado_em: matricula.criado_em,
            status: matricula.status,
            usuario: (matricula as any).usuario,
            turma: turmaData
                ? (turmaData as any).ciclo
                : null,
        },
        programa: {
            id: programa.id,
            descricao: programa.descricao,
            area: programa.area,
        },
        blocos,
        perguntas,
        respostas,
    };
});
