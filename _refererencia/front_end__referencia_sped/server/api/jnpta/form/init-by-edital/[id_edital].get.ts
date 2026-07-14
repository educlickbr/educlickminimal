import { serverSupabaseClient } from '#supabase/server';
import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event);
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const idEdital = getRouterParam(event, "id_edital");
    if (!idEdital) {
        throw createError({ statusCode: 400, statusMessage: "Missing id_edital" });
    }

    const query = getQuery(event);
    const bloco = typeof query.bloco === "string" ? query.bloco : null;

    const client = await serverSupabaseClient(event);

    const getExpandedUser = async (): Promise<{ id: string | null; nome: string | null; sobrenome: string | null; email: string | null }> => {
        const { data, error } = await (client.rpc as any)(
            'get_user_expandido',
            { p_auth_id: user.id }
        );

        if (error) {
            console.error('[init-by-edital] get_user_expandido RPC error:', error);
        }

        return {
            id: data?.user_expandido_id || null,
            nome: data?.nome || null,
            sobrenome: data?.sobrenome || null,
            email: data?.email || user.email || null,
        };
    };

    const buildDirecaoPrefill = async (perguntas: any[], respostasAtuais: any[]) => {
        const db: any = client;

        type UserExpandidoPrefill = {
            id: string;
            nome: string | null;
            sobrenome: string | null;
            email: string | null;
        };

        type PerguntaGeral = {
            id: string;
            pergunta: string;
            tipo?: string | null;
        };

        type RespostaGeral = {
            id_pergunta: string;
            resposta: string | null;
            arquivo_original: string | null;
        };

        const slugsDirecao = [
            'nome_registro',
            'sobrenome',
            'midias_sociais',
            'email',
            'telefone_celular',
            'cpf',
            'rg',
            'pcd',
            'cpf_arquivo',
            'rg_arquivo',
            'cep',
            'cidade',
            'endereco',
            'bairro',
            'numero',
            'complemento',
            'comprovante_endereco',
            'drt_arquivo',
            'curriculo',
        ];

        const jnptaPerguntaBySlug = new Map<string, any>();
        for (const p of perguntas || []) {
            if (p?.slug) jnptaPerguntaBySlug.set(p.slug, p);
        }

        const existingJnptaSlugs = new Set<string>();
        const jnptaPerguntaById = new Map<string, string>();
        for (const p of perguntas || []) {
            if (p?.id && p?.slug) jnptaPerguntaById.set(p.id, p.slug);
        }
        for (const r of respostasAtuais || []) {
            const slug = jnptaPerguntaById.get(r.id_pergunta);
            if (slug && (r.resposta_texto != null || r.resposta_json != null)) {
                existingJnptaSlugs.add(slug);
            }
        }

        const expanded = await getExpandedUser();
        const ux = {
            id: expanded.id,
            nome: expanded.nome,
            sobrenome: expanded.sobrenome,
            email: expanded.email,
        } as UserExpandidoPrefill;

        if (!ux?.id) {
            return [];
        }

        const { data: perguntasGeraisData, error: perguntasGeraisError } = await db
            .from('perguntas')
            .select('id, pergunta, tipo')
            .in('pergunta', slugsDirecao);

        const perguntasGerais = (perguntasGeraisData || []) as PerguntaGeral[];

        if (perguntasGeraisError) {
            return [];
        }

        const idsPerguntasGerais: string[] = [];
        for (const p of perguntasGerais) {
            idsPerguntasGerais.push(p.id);
        }

        let respostasGerais: RespostaGeral[] = [];
        if (idsPerguntasGerais.length > 0) {
            const { data: respostasData } = await db
                .from('respostas')
                .select('id_pergunta, resposta, arquivo_original')
                .eq('user_expandido_id', ux.id)
                .is('id_turma', null)
                .in('id_pergunta', idsPerguntasGerais);

            respostasGerais = (respostasData || []) as RespostaGeral[];
        }

        const respostaGeralBySlug = new Map<string, any>();
        for (const r of respostasGerais) {
            const pergunta = (perguntasGerais || []).find((p: any) => p.id === r.id_pergunta);
            if (pergunta?.pergunta) {
                respostaGeralBySlug.set(pergunta.pergunta, r);
            }
        }

        const synthetic: any[] = [];

        const pushSynthetic = (slug: string, resposta_texto: string | null, resposta_json?: any) => {
            const perguntaJnpta = jnptaPerguntaBySlug.get(slug);
            if (!perguntaJnpta || existingJnptaSlugs.has(slug)) return;
            if (resposta_texto == null || String(resposta_texto).trim() === '') return;

            synthetic.push({
                id_pergunta: perguntaJnpta.id,
                resposta_texto,
                resposta_json: resposta_json || null,
            });
        };

        pushSynthetic('nome_registro', ux.nome || null);
        pushSynthetic('sobrenome', ux.sobrenome || null);
        pushSynthetic('email', ux.email || user.email || null);

        for (const slug of slugsDirecao) {
            if (existingJnptaSlugs.has(slug)) continue;
            if (slug === 'nome_registro' || slug === 'sobrenome' || slug === 'email') continue;

            const geral = respostaGeralBySlug.get(slug);
            if (!geral) continue;

            const respostaTexto = geral.resposta ?? null;
            const respostaJson = geral.arquivo_original
                ? { nome_original: geral.arquivo_original }
                : null;

            pushSynthetic(slug, respostaTexto, respostaJson);
        }

        return synthetic;
    };

    const buildDadosPessoaisPrefill = async (perguntas: any[], respostasAtuais: any[]): Promise<any[]> => {
        const db: any = client;

        const slugsGeralToPt: Record<string, string> = {
            nome_registro: 'pt_nome',
            sobrenome: 'pt_sobrenome',
            email: 'pt_email',
            telefone_celular: 'pt_telefone',
            cpf: 'pt_cpf',
            rg: 'pt_rg',
        };

        const perguntaBySlug = new Map<string, any>();
        for (const p of perguntas || []) {
            if (p?.slug) perguntaBySlug.set(p.slug, p);
        }

        // Só preenche slugs que ainda não têm resposta
        const perguntaById = new Map<string, string>();
        for (const p of perguntas || []) {
            if (p?.id && p?.slug) perguntaById.set(p.id, p.slug);
        }
        const existingSlugs = new Set<string>();
        for (const r of respostasAtuais || []) {
            const slug = perguntaById.get(r.id_pergunta);
            if (slug && r.resposta_texto != null && String(r.resposta_texto).trim() !== '') {
                existingSlugs.add(slug);
            }
        }

        const expanded = await getExpandedUser();

        const meta = (user as any)?.user_metadata || {};
        const fullNameRaw = meta?.nome_completo || meta?.full_name || meta?.name || null;
        const fullNameParts = typeof fullNameRaw === 'string'
            ? fullNameRaw.trim().split(/\s+/).filter(Boolean)
            : [];

        const nomeFromMeta =
            (typeof meta?.nome === 'string' && meta.nome.trim()) ||
            (typeof meta?.given_name === 'string' && meta.given_name.trim()) ||
            (fullNameParts.length > 0 ? fullNameParts[0] : null) ||
            null;

        const sobrenomeFromMeta =
            (typeof meta?.sobrenome === 'string' && meta.sobrenome.trim()) ||
            (typeof meta?.family_name === 'string' && meta.family_name.trim()) ||
            (fullNameParts.length > 1 ? fullNameParts.slice(1).join(' ') : null) ||
            null;

        const slugsGerais = Object.keys(slugsGeralToPt);
        let geralByPtSlug = new Map<string, string>();

        if (slugsGerais.length > 0) {
            const { data: perguntasGeraisData } = await db
                .from('perguntas')
                .select('id, pergunta')
                .in('pergunta', slugsGerais);

            const perguntasGerais = (perguntasGeraisData || []) as Array<{ id: string; pergunta: string }>;
            const idsPerguntasGerais = perguntasGerais.map((p) => p.id);
            const perguntaGeralById = new Map<string, string>(perguntasGerais.map((p) => [p.id, p.pergunta]));

            if (idsPerguntasGerais.length > 0) {
                let q = db
                    .from('respostas')
                    .select('id_pergunta, resposta')
                    .is('id_turma', null)
                    .in('id_pergunta', idsPerguntasGerais)
                    .order('criado_em', { ascending: false });

                if (expanded.id) {
                    q = q.eq('user_expandido_id', expanded.id);
                } else {
                    q = q.eq('id_usuario', user.id);
                }

                const { data: respostasGeraisData } = await q;
                for (const r of (respostasGeraisData || []) as Array<{ id_pergunta: string; resposta: string | null }>) {
                    const slugGeral = perguntaGeralById.get(r.id_pergunta);
                    if (!slugGeral) continue;
                    const ptSlug = slugsGeralToPt[slugGeral];
                    if (!ptSlug) continue;
                    const val = r.resposta != null ? String(r.resposta).trim() : '';
                    if (!val) continue;
                    if (!geralByPtSlug.has(ptSlug)) {
                        geralByPtSlug.set(ptSlug, val);
                    }
                }
            }
        }

        const synthetic: any[] = [];

        const push = (slug: string, valor: string | null) => {
            if (!valor || existingSlugs.has(slug)) return;
            const pergunta = perguntaBySlug.get(slug);
            if (!pergunta) return;
            synthetic.push({
                id_pergunta: pergunta.id,
                resposta_texto: valor,
                resposta_json: null,
            });
        };

        push('pt_nome', expanded.nome || nomeFromMeta || geralByPtSlug.get('pt_nome') || null);
        push('pt_sobrenome', expanded.sobrenome || sobrenomeFromMeta || geralByPtSlug.get('pt_sobrenome') || null);
        push('pt_email', expanded.email || user.email || geralByPtSlug.get('pt_email') || null);
        push('pt_telefone', geralByPtSlug.get('pt_telefone') || null);
        push('pt_cpf', geralByPtSlug.get('pt_cpf') || null);
        push('pt_rg', geralByPtSlug.get('pt_rg') || null);

        return synthetic;
    };

    const resolveQualTempo = async (): Promise<'primeiro_tempo' | 'segundo_tempo' | null> => {
        const { data, error } = await client
            .from('jnpta_editais')
            .select('qual_tempo')
            .eq('id', idEdital)
            .maybeSingle();

        if (error) return null;
        const qualTempo = (data as any)?.qual_tempo;
        if (qualTempo === 'primeiro_tempo' || qualTempo === 'segundo_tempo') {
            return qualTempo;
        }
        return null;
    };

    const buildIdentityPrefillFromRpc = async (idCandidatura: string | null, blocoEfetivo: string | null, respostasAtuais: any[]): Promise<any[]> => {
        if (!idCandidatura || !blocoEfetivo) return [];

        const { data, error } = await (client.rpc as any)(
            'nxt_jnpta_form_get_prefill_identidade',
            {
                p_id_candidatura: idCandidatura,
                p_id_edital: idEdital,
                p_bloco: blocoEfetivo,
            }
        );

        if (error) {
            console.error('[init-by-edital] prefill identidade RPC error:', error);
            return [];
        }

        const existentes = new Set<string>();
        for (const r of respostasAtuais || []) {
            if (!r?.id_pergunta) continue;
            const hasTexto = r.resposta_texto != null && String(r.resposta_texto).trim() !== '';
            const hasJson = r.resposta_json != null;
            if (hasTexto || hasJson) {
                existentes.add(String(r.id_pergunta));
            }
        }

        return (Array.isArray(data) ? data : []).filter((r: any) => {
            if (!r?.id_pergunta) return false;
            if (existentes.has(String(r.id_pergunta))) return false;
            return r.resposta_texto != null && String(r.resposta_texto).trim() !== '';
        });
    };

    const mapBlocoByQualTempo = (requestedBloco: string | null, qualTempo: 'primeiro_tempo' | 'segundo_tempo' | null): string | null => {
        if (!requestedBloco || qualTempo !== 'primeiro_tempo') {
            return requestedBloco;
        }

        const legacyToPrimeiroTempo: Record<string, string> = {
            dados_grupo: 'dados_pessoais',
            endereco_empresa: 'endereco',
            direcao_artistica: 'perfil_artistico',
            documentos_projeto: 'trajetoria',
            documentos_empresa: 'documentos',
            integrantes: 'declaracoes',
            aceite_termos: 'declaracoes',
        };

        return legacyToPrimeiroTempo[requestedBloco] || requestedBloco;
    };

    const ensureNoEnviadaForEdital = async () => {
        const { data, error } = await (client.rpc as any)(
            'nxt_jnpta_elegibilidade_editais',
            { p_id_edital: idEdital }
        );

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Erro ao validar inscrição já enviada',
            });
        }

        if (!data?.ok) return;

        const editalElegibilidade = data?.editais?.[idEdital] || null;
        const hasEnviada = !!editalElegibilidade?.has_enviada;
        const idCandidaturaEnviada = editalElegibilidade?.id_candidatura_enviada || null;

        if (hasEnviada) {
            throw createError({
                statusCode: 409,
                statusMessage: 'Você já possui uma inscrição enviada para este edital.',
                data: {
                    code: 'jnpta_inscricao_ja_enviada',
                    id_candidatura: idCandidaturaEnviada,
                    status: 'enviada',
                    id_edital: idEdital,
                },
            });
        }
    };

    try {
        await ensureNoEnviadaForEdital();

        // 1. Resolve contexto: grupo + candidatura rascunho (RPC not yet in generated types)
        const { data: ctxData, error: ctxError } = await (client.rpc as any)(
            "nxt_jnpta_form_get_or_create_draft_by_edital",
            { p_id_edital: idEdital }
        );

        if (ctxError) {
            throw createError({ statusCode: 500, statusMessage: ctxError.message || "Erro ao resolver contexto do formulário" });
        }

        if (!ctxData?.ok) {
            throw createError({ statusCode: 400, statusMessage: ctxData?.erro || "Não foi possível iniciar o formulário" });
        }

        let ctx = ctxData;

        // 1.1 Se não houver grupo prévio, cria um contexto isolado para esta inscrição
        if (ctxData?.precisa_grupo) {
            const nomePadrao = `Inscrição Jornada ${new Date().toISOString().slice(0, 10)}`;
            const emailContato = user.email || `${user.id}@no-email.local`;

            const { data: novoGrupo, error: erroGrupo } = await (client.rpc as any)(
                "nxt_jnpta_criar_grupo",
                {
                    p_nome_grupo: nomePadrao,
                    p_email_contato: emailContato,
                }
            );

            if (erroGrupo || !novoGrupo?.ok || !novoGrupo?.id_grupo) {
                throw createError({ statusCode: 500, statusMessage: erroGrupo?.message || novoGrupo?.erro || "Erro ao criar contexto inicial de inscrição" });
            }

            // Re-resolve contexto por edital para garantir que a candidatura nasca com id_edital.
            const { data: ctxAfterGroup, error: ctxAfterGroupError } = await (client.rpc as any)(
                "nxt_jnpta_form_get_or_create_draft_by_edital",
                { p_id_edital: idEdital }
            );

            if (ctxAfterGroupError || !ctxAfterGroup?.ok || !ctxAfterGroup?.id_candidatura) {
                throw createError({
                    statusCode: 500,
                    statusMessage: ctxAfterGroupError?.message || ctxAfterGroup?.erro || "Erro ao criar candidatura inicial com edital",
                });
            }

            ctx = {
                ...ctxAfterGroup,
                nome_grupo: ctxAfterGroup?.nome_grupo || nomePadrao,
            };
        }

        // 2. Buscar perguntas do bloco solicitado (respeitando qual_tempo do edital)
        // (RPC not yet in generated types)
        const qualTempo = await resolveQualTempo();
        const blocoEfetivo = mapBlocoByQualTempo(bloco, qualTempo);

        const { data: perguntasData, error: perguntasError } = await (client.rpc as any)(
            "nxt_jnpta_form_get_perguntas_by_bloco",
            {
                p_bloco: blocoEfetivo,
                p_id_edital: idEdital,
            }
        );

        if (perguntasError) {
            throw createError({ statusCode: 500, statusMessage: perguntasError.message || "Erro ao carregar perguntas" });
        }

        const perguntas = Array.isArray(perguntasData) ? perguntasData : [];

        // 3. Buscar respostas existentes (só se há candidatura)
        let respostas: any[] = [];
        let grupo: any = null;

        if (ctx.id_candidatura) {
            const { data: formData, error: formError } = await (client.rpc as any)(
                "nxt_jnpta_form_get",
                { p_id_candidatura: ctx.id_candidatura }
            );

            if (formError) {
                throw createError({
                    statusCode: 500,
                    statusMessage: formError.message || 'Erro ao carregar dados existentes do formulário',
                });
            }

            if (!formData?.ok) {
                throw createError({
                    statusCode: 400,
                    statusMessage: formData?.erro || 'Não foi possível carregar dados existentes do formulário',
                });
            }

            respostas = formData.respostas_principal || [];
            grupo = formData.grupo || null;
        }

        if (blocoEfetivo === 'direcao_artistica' && perguntas.length > 0) {
            const syntheticRespostas = await buildDirecaoPrefill(perguntas, respostas);
            if (syntheticRespostas.length > 0) {
                respostas = [...respostas, ...syntheticRespostas];
            }
        }

        if ((blocoEfetivo === 'dados_pessoais' || blocoEfetivo === 'direcao_artistica' || blocoEfetivo === 'dados_grupo') && perguntas.length > 0) {
            const syntheticIdentidade = await buildIdentityPrefillFromRpc(ctx.id_candidatura ?? null, blocoEfetivo, respostas);
            if (syntheticIdentidade.length > 0) {
                respostas = [...respostas, ...syntheticIdentidade];
            }
        }

        const idsPerguntasDoBloco = new Set((perguntas || []).map((p: any) => p.id));
        const respostasDoBloco = (respostas || []).filter((r: any) => idsPerguntasDoBloco.has(r.id_pergunta));

        return {
            ok: true,
            precisa_grupo: false,
            id_candidatura: ctx.id_candidatura ?? null,
            id_grupo: ctx.id_grupo ?? null,
            id_jornada: ctx.id_jornada ?? null,
            id_edital: idEdital,
            qual_tempo: qualTempo,
            bloco_solicitado: bloco,
            bloco_efetivo: blocoEfetivo,
            nome_grupo: ctx.nome_grupo ?? null,
            perguntas,
            respostas: respostasDoBloco,
            grupo,
        };
    } catch (err: any) {
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || err.message || "Internal server error",
        });
    }
});
