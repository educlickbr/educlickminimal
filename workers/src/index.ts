export interface Env {
  MY_BUCKET: R2Bucket;
  AUTH_SECRET: string;
}

// Função para gerar e validar o Hash usando Web Crypto API (padrão Cloudflare)
async function verifyToken(key: string, secret: string, tokenToVerify: string) {
  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    secretKey,
    encoder.encode(key)
  );

  // Converte a assinatura binária para Hex String (ex: a1b2c3d4...)
  const hashArray = Array.from(new Uint8Array(signature));
  const expectedToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return expectedToken === tokenToVerify;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.slice(1); // Nome do arquivo. Ex: /minha-imagem.jpg -> minha-imagem.jpg
    const token = url.searchParams.get('token'); // Pega o ?token=... da URL

    // Configurações básicas de CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Responde ao Preflight do navegador
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'GET') {
      if (!key) return new Response('Arquivo não especificado', { status: 400, headers: corsHeaders });
      
      if (!env.AUTH_SECRET) {
         return new Response('Erro no servidor: AUTH_SECRET não configurado no Worker', { status: 500, headers: corsHeaders });
      }

      if (!token) return new Response('Acesso Negado: Token ausente', { status: 403, headers: corsHeaders });

      // Verifica se o token na URL bate com o Hash esperado
      const isValid = await verifyToken(key, env.AUTH_SECRET, token);
      if (!isValid) {
        return new Response('Acesso Negado: Token/Hash inválido', { status: 403, headers: corsHeaders });
      }

      // Se a assinatura for válida, busca o arquivo no R2
      const object = await env.MY_BUCKET.get(key);

      if (object === null) {
        return new Response('Arquivo não encontrado no R2', { status: 404, headers: corsHeaders });
      }

      // Monta os headers de resposta passando os metadados do arquivo original (tipo, cache, etc)
      const headers = new Headers(corsHeaders);
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);

      return new Response(object.body, { headers });
    }

    // Como o Nuxt fará PUT e DELETE via S3 direto, bloqueamos esses métodos aqui por segurança
    return new Response('Método não permitido nesta rota', { status: 405, headers: corsHeaders });
  },
};
