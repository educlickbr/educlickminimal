import { serverSupabaseClient } from "#supabase/server";

/**
 * GET /api/docentes/docente-detalhes?id=X
 *
 * Retorna dados completos do docente para edição:
 * - user_expandido (nome, email)
 * - aca_docente (valor_hora_aula)
 * - respostas das perguntas globais (CPF, endereço, etc.)
 */
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient(event);
    const query = getQuery(event);
    const id = query.id as string;

    if (!id) {
        throw createError({ statusCode: 400, message: "ID é obrigatório." });
    }

    // Busca docente + user_expandido
    const { data: docente, error: docError } = await (client as any)
        .from("aca_docente")
        .select("id, id_user_expandido, valor_hora_aula, id_entidade, ativo")
        .eq("id", id)
        .single();

    if (docError || !docente) {
        throw createError({ statusCode: 404, message: "Docente não encontrado." });
    }

    // Busca user_expandido
    const { data: user } = await (client as any)
        .from("user_expandido")
        .select("id, nome_completo, email")
        .eq("id", docente.id_user_expandido)
        .single();

    // Busca respostas das perguntas globais
    const perguntaIds = [
        "05c0186e-af01-4220-8031-383c8611c4fa", // cpf
        "ebf7837b-545e-45a7-ac0d-55d7b235a2c2", // data_nascimento
        "a918d49a-8ac2-4796-a656-4181897a00d1", // cep
        "745b61c2-161d-4cbb-af1c-e9065d3362f2", // endereco
        "1eebb87e-ec33-4155-be21-cc50f85d7fc5", // numero
        "23a6698e-8e01-4d58-965e-f927b2fb3d31", // complemento
        "b30fee6d-29b4-4bf9-8569-2a141150d10e", // bairro
        "9b638554-16c5-4a1a-aed8-755d85849c6c", // cidade
        "44b8bfef-6ad1-4a18-8f5c-83949895f44f", // estado
    ];

    const { data: respostas } = await client.rpc("aca_get_respostas_usuario", {
        p_id_user_expandido: docente.id_user_expandido,
        p_pergunta_ids: perguntaIds,
    } as any);

    return {
        success: true,
        docente: {
            ...docente,
            nome_completo: user?.nome_completo || "",
            email: user?.email || "",
            respostas: respostas || {},
        },
    };
});
