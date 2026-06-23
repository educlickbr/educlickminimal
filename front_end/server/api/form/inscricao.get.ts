import { defineEventHandler, getQuery } from "h3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const user = await serverSupabaseUser(event);

  if (!user) {
    return {
      success: false,
      message: "Usuário não autenticado",
      inscricao: null,
    };
  }

  const { id_processo, tipo_proc, tipo_cand, id_inscricao } = getQuery(
    event,
  ) as {
    id_processo?: string;
    tipo_proc?: string;
    tipo_cand?: string;
    id_inscricao?: string;
  };

  // Busca por ID direto da inscrição (página de sucesso)
  if (id_inscricao) {
    const { data, error } = await client
      .from("aca_processo_seletivo_inscricoes")
      .select("*")
      .eq("id", id_inscricao)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: "Inscrição não encontrada",
        inscricao: null,
      };
    }

    return { success: true, inscricao: data };
  }

  if (!id_processo || !tipo_proc || !tipo_cand) {
    return {
      success: false,
      message: "Parâmetros incompletos (id_processo, tipo_proc, tipo_cand)",
      inscricao: null,
    };
  }

  const { data, error } = await (client.rpc as any)("aca_verificar_inscricao", {
    p_id_processo: id_processo,
    p_tipo_processo: tipo_proc,
    p_tipo_candidatura: tipo_cand,
  });

  if (error) {
    console.error("Erro ao verificar inscrição:", error);
    return { success: false, message: error.message, inscricao: null };
  }

  // data é um array (RETURNS TABLE), pegamos o primeiro ou null
  const inscricao = Array.isArray(data) && data.length > 0 ? data[0] : null;

  return { success: true, inscricao };
});
