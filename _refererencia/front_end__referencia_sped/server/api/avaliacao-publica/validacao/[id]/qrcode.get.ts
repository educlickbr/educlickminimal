import { buildValidationAvaliacaoUrl } from "../../../../utils/avaliacao-publica";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const query = getQuery(event);
  const nomeExibicao = typeof query.nome === "string" ? query.nome : null;
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

  try {
    const url = buildValidationAvaliacaoUrl(id, event, nomeExibicao);
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
    setHeader(event, "Cache-Control", "public, max-age=600, s-maxage=600");

    return svg;
  } catch (error: any) {
    console.error("[avaliacao-validacao:qrcode] Falha ao gerar QR code", {
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
