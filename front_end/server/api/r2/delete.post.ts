import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const fileId = body?.fileId;
  const userExpandidoId = body?.user_expandido_id || null;

  if (!fileId) {
    throw createError({
      statusCode: 400,
      message: "ID do arquivo não fornecido.",
    });
  }

  const supabase = await serverSupabaseClient(event);

  // 1. Busca o registro no banco para pegar o path
  const { data, error: fetchError } = await supabase
    .from("global_arquivos")
    .select("*")
    .eq("id", fileId)
    .single();

  const dbRecord = data as any;

  if (fetchError || !dbRecord) {
    throw createError({
      statusCode: 404,
      message: "Arquivo não encontrado no banco.",
    });
  }

  // Permissão: verifica se o user_expandido_id é o mesmo do criador do arquivo
  if (
    dbRecord.criado_por &&
    userExpandidoId &&
    dbRecord.criado_por !== userExpandidoId
  ) {
    throw createError({
      statusCode: 403,
      message: "Sem permissão para deletar este arquivo.",
    });
  }

  const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
  const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
  const R2_BUCKET = process.env.R2_BUCKET;
  const R2_ENDPOINT = process.env.R2_ENDPOINT;

  if (
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_ENDPOINT ||
    !R2_BUCKET
  ) {
    throw createError({
      statusCode: 500,
      message: "Credenciais R2 não configuradas.",
    });
  }

  const s3Client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  // 2. Deleta do R2
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: dbRecord.path,
      }),
    );
  } catch (error: any) {
    console.error("Erro ao deletar no R2:", error);
    throw createError({
      statusCode: 500,
      message: "Erro ao remover arquivo físico do R2.",
    });
  }

  // 3. Deleta do banco
  const { error: deleteError, count } = await supabase
    .from("global_arquivos")
    .delete({ count: "exact" })
    .eq("id", fileId);

  if (deleteError) {
    console.error("Erro ao remover global_arquivos:", deleteError);
    throw createError({
      statusCode: 500,
      message: "Arquivo removido do R2, mas erro ao apagar do banco.",
    });
  }

  if (!count || count === 0) {
    throw createError({
      statusCode: 500,
      message:
        "Arquivo removido do R2, mas registro não foi deletado do banco (verifique as permissões).",
    });
  }

  return { success: true, message: "Arquivo deletado com sucesso." };
});
