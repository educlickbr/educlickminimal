import { defineEventHandler, getQuery } from "h3";
import { serverSupabaseClient } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);
  const query = getQuery(event);

  const pagina = parseInt((query.pagina as string) || "1", 10);
  const limite = parseInt((query.limite as string) || "20", 10);

  const { data, error } = await client.rpc("aca_get_minhas_inscricoes", {
    p_pagina: pagina,
    p_limite: limite,
  } as any);

  if (error) return { success: false, message: error.message };
  return data;
});
