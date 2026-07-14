import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const user = await client.auth.getUser();

  if (!user.data.user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }

  const body = await readBody(event);

  if (!body.id_edital || !body.id_aluno) {
    throw createError({
      statusCode: 400,
      statusMessage: "Dados incompletos (Edital ou Aluno não informados).",
    });
  }

  const { data, error } = await (client.rpc as any)(
    "nxt_bolsa_submissao_criar",
    {
      p_id_edital: body.id_edital,
      p_id_aluno: body.id_aluno,
      p_aceite: body.aceite,
      p_arquivo_cad_unico: body.arquivo_cad_unico,
      p_user_id: user.data.user.id,
      p_cpf: body.cpf || null,
      p_banco: body.banco || null,
      p_agencia: body.agencia || null,
      p_tipo_conta: body.tipo_conta || null,
      p_conta: body.conta || null,
      p_chave_pix: body.chave_pix || null,
    },
  );

  if (error) {
    // Handle constraint violations (already applied)
    if (error.message.includes("bolsa_submissoes_id_edital_id_aluno_key")) {
      throw createError({
        statusCode: 400,
        statusMessage: "Você já realizou uma inscrição para este edital.",
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    });
  }

  return { id: data, message: "Inscrição realizada com sucesso" };
});
