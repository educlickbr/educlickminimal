-- ============================================================
-- 1. Adicionar coluna `global` em cmct_pergunta_form
-- ============================================================
ALTER TABLE public.cmct_pergunta_form
    ADD COLUMN IF NOT EXISTS global boolean NOT NULL DEFAULT false;

-- ============================================================
-- 2. Índice único parcial para perguntas globais
--    (garante que não haja dois CPFs, dois CEPs globais, etc.)
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_pergunta_form_global_nome
    ON public.cmct_pergunta_form (nome_interno)
    WHERE global = true;

-- ============================================================
-- 3. Seed das perguntas globais
-- ============================================================
INSERT INTO public.cmct_pergunta_form
    (id_entidade, nome_interno, label, placeholder, tipo_pergunta, global)
VALUES
    (NULL, 'cpf',         'CPF',          '000.000.000-00',             'cpf',  true),
    (NULL, 'cep',         'CEP',          '00000-000',                  'cep',  true),
    (NULL, 'endereco',    'Endereço',     'Rua / Avenida...',           'text', true),
    (NULL, 'numero',      'Número',       'Ex: 123',                    'text', true),
    (NULL, 'complemento', 'Complemento',  'Apto, Bloco, Casa...',       'text', true),
    (NULL, 'bairro',      'Bairro',       'Nome do bairro',             'text', true),
    (NULL, 'cidade',      'Cidade',       'Nome da cidade',             'text', true),
    (NULL, 'estado',      'Estado (UF)',  'Ex: SP',                     'text', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Atualizar RPC frm_get_perguntas para retornar globais
-- ============================================================
CREATE OR REPLACE FUNCTION public.frm_get_perguntas(
    p_id_entidade uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id',            p.id,
                'id_entidade',   p.id_entidade,
                'nome_interno',  p.nome_interno,
                'label',         p.label,
                'placeholder',   p.placeholder,
                'tipo_pergunta', p.tipo_pergunta,
                'opcoes',        p.opcoes,
                'global',        p.global,
                'created_at',    p.created_at
            )
            ORDER BY p.global DESC, p.label ASC
        ),
        '[]'::jsonb
    )
    INTO v_result
    FROM public.cmct_pergunta_form p
    WHERE
        -- Perguntas da entidade OU globais
        p.id_entidade = p_id_entidade
        OR p.global = true;

    RETURN jsonb_build_object('success', true, 'data', v_result);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;
