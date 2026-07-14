import { serverSupabaseClient } from "#supabase/server";
import { resolvePublicBaseUrl } from "../../../../utils/avaliacao-publica";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const query = getQuery(event);
  const rawSize =
    typeof query.size === "string"
      ? Number.parseInt(query.size, 10)
      : Number.NaN;
  const qrSize = Number.isFinite(rawSize)
    ? Math.min(Math.max(rawSize, 220), 1200)
    : 420;

  if (!id || !UUID_REGEX.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Identificador inválido",
    });
  }

  const client = await serverSupabaseClient(event);
  // Use the stable token_validacao_qrcode (never rotated) so the QR printed
  // on the physical certificate stays valid forever. Scanning it redirects
  // through /certificado/validar which generates a fresh 30-min token_publico.
  const { data, error } = await client
    .from("certificados_emitidos")
    .select("token_validacao_qrcode, status_aprovacao")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(
      "[certificado-validacao:qrcode] Erro ao buscar token do certificado",
      { id, error },
    );
    throw createError({
      statusCode: 500,
      statusMessage: "Erro ao localizar token do certificado",
    });
  }

  const certificadoRow = (!Array.isArray(data) ? data : null) as {
    token_validacao_qrcode: string | null;
    status_aprovacao: string | null;
  } | null;

  if (
    !certificadoRow?.token_validacao_qrcode ||
    certificadoRow.status_aprovacao !== "aprovado"
  ) {
    throw createError({
      statusCode: 404,
      statusMessage: "Certificado aprovado não encontrado para validação",
    });
  }

  try {
    const baseUrl = resolvePublicBaseUrl(event);
    // Points to intermediary page — not directly to /certificado/publica — so that each scan
    // re-generates a fresh ephemeral token_publico, invalidating any previously shared link.
    const url = `${baseUrl}/certificado/validar/${certificadoRow.token_validacao_qrcode}`;

    // @ts-expect-error qrcode browser entry has no bundled type declarations
    const qrcodeModule = await import("qrcode/lib/browser.js");
    const QRCode = (qrcodeModule as any).default || qrcodeModule;

    const svg = await QRCode.toString(url, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
      width: qrSize,
      color: {
        dark: "#111111",
        light: "#ffffff",
      },
    });

    if (typeof svg !== "string" || !svg.includes("<svg")) {
      throw createError({
        statusCode: 500,
        statusMessage: "Falha ao gerar SVG do QR code",
      });
    }

    setHeader(event, "Content-Type", "image/svg+xml; charset=utf-8");
    // Cache the QR image: the stable token URL never changes so long caching is safe
    setHeader(event, "Cache-Control", "public, max-age=3600, s-maxage=3600");

    return svg;
  } catch (error: any) {
    console.error("[certificado-validacao:qrcode] Falha ao gerar QR code", {
      id,
      message: error?.message,
      statusMessage: error?.statusMessage,
      stack: error?.stack,
    });

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.statusMessage || "Erro ao gerar QR code",
    });
  }
});
