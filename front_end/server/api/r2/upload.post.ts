import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import { generateSafeFileName } from "../../utils/fileUtils";

export default defineEventHandler(async (event) => {
  // Lê o Multipart FormData
  const body = await readMultipartFormData(event);

  if (!body || body.length === 0) {
    throw createError({ statusCode: 400, message: "Nenhum arquivo enviado." });
  }

  const file = body.find((item) => item.name === "file");
  const saveToDb =
    body.find((item) => item.name === "saveToDb")?.data?.toString() === "true";
  const escopo =
    body.find((item) => item.name === "escopo")?.data?.toString() || "geral";
  const userExpandidoId =
    body.find((item) => item.name === "user_expandido_id")?.data?.toString() ||
    null;
  const idEntidade =
    body.find((item) => item.name === "id_entidade")?.data?.toString() || null;

  if (!file || !file.filename) {
    throw createError({ statusCode: 400, message: "Arquivo inválido." });
  }

  // Aqui entra a nossa utility que renomeia o arquivo
  const fileInfo = generateSafeFileName(file.filename);

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

  // A key no R2 será agora baseada no UUID e na pasta do escopo
  const key = `${escopo}/${fileInfo.uuidName}`;

  const s3Client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: file.data,
        ContentType: file.type,
      }),
    );
  } catch (error: any) {
    console.error("Erro no upload R2:", error);
    throw createError({
      statusCode: 500,
      message: "Erro ao enviar arquivo para o R2.",
    });
  }

  let dbRecord = null;

  // Grava no banco se a flag saveToDb for enviada e for true
  if (saveToDb) {
    try {
      const supabase = await serverSupabaseClient(event);
      const user = await serverSupabaseUser(event);

      const { data, error } = await supabase
        .from("global_arquivos")
        .insert({
          path: key,
          tamanho_bytes: file.data.length,
          mimetype: file.type,
          nome_original: fileInfo.originalName,
          escopo: escopo,
          id_entidade: idEntidade,
          criado_por: userExpandidoId || user?.id || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      dbRecord = data;
    } catch (dbErr: any) {
      console.error("Erro ao gravar em global_arquivos:", dbErr);
      throw createError({
        statusCode: 500,
        message:
          "Arquivo subiu pro R2, mas erro ao salvar no banco: " + dbErr.message,
      });
    }
  }

  return {
    success: true,
    message: "Upload concluído com sucesso.",
    key: key,
    originalName: fileInfo.originalName,
    uuidName: fileInfo.uuidName,
    dbRecord: dbRecord,
  };
});
