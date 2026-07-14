import { serverSupabaseClient } from "#supabase/server";
import { $fetch as ofetch } from "ofetch";
interface InviteBody {
  email: string;
  nome: string;
  sobrenome: string;
  papel_id: string;
  create_record?: boolean;
  user_id?: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<InviteBody>(event);
  const { email, nome, sobrenome, papel_id, create_record, user_id } = body;

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email é obrigatório",
    });
  }

  const webhookUrl = process.env.POWER_AUTOMATE_CONVITE_COLABORADORES;

  if (!webhookUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Serviço de convites não configurado (Env Missing)",
    });
  }

  const client = await serverSupabaseClient(event);
  const supabase = client as any;

  let dbError = null;

  if (user_id) {
    const { error: updateError } = await supabase
      .from("user_expandido")
      .update({
        convite_enviado: true,
      })
      .eq("id", user_id);

    dbError = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("user_expandido")
      .insert({
        email: email,
        nome: nome,
        sobrenome: sobrenome,
        papel_id: papel_id,
        convite_enviado: true,
      });

    dbError = insertError;
  }

  if (dbError) {
    console.error("Error saving user_expandido invite:", dbError);
    throw createError({
      statusCode: 500,
      statusMessage: "Erro ao registrar convite no banco de dados.",
    });
  }

  const linkCadastro = `https://sped.digital/cadastro_colaborador?tipo=docente&area=colaboradores&processo=cadastro&email=${email}`;

  try {
    await ofetch(webhookUrl, {
      method: "POST",
      body: {
        email: email,
        nome: nome,
        sobrenome: sobrenome,
        papel: papel_id,
        link_cadastro: linkCadastro,
      },
    });
  } catch (e) {
    console.error("Power Automate Error:", e);
    throw createError({
      statusCode: 502,
      statusMessage: "Erro ao enviar email de convite",
    });
  }

  return { success: true };
});
