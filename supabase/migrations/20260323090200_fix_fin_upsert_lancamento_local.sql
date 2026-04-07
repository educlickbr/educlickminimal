-- MIGRATION: Atualiza a assinatura da RPC fin_upsert_lancamento para incluir p_id_local
-- Data: 2026-03-23

DROP FUNCTION IF EXISTS public.fin_upsert_lancamento(uuid, uuid, uuid, uuid, uuid, text, numeric, text, date, boolean, integer, boolean, uuid, uuid);
DROP FUNCTION IF EXISTS public.fin_upsert_lancamento(uuid, uuid, uuid, uuid, uuid, text, numeric, text, date, boolean, integer, boolean, uuid);

CREATE OR REPLACE FUNCTION public.fin_upsert_lancamento(
  p_id                  uuid,           -- NULL = criar, UUID = editar
  p_id_entidade         uuid,
  p_id_conta            uuid,           -- conta ou subconta selecionada
  p_id_categoria        uuid,           -- categoria ou subcategoria selecionada
  p_id_lancamento_pai   uuid,           -- NULL = raiz, UUID = filho analítico
  p_descricao           text,
  p_valor               numeric(12,2),  -- valor informado pelo usuário
  p_tipo                text,           -- 'receita' | 'despesa'
  p_data                date,           -- data base do lançamento
  p_parcelado           boolean,        -- true = gera N lançamentos mensais
  p_qtd_parcelas        integer,        -- número total de parcelas (mín: 2)
  p_valor_e_total       boolean,        -- true = p_valor é total (divide); false = é por parcela (replica)
  p_id_grupo_parcelas   uuid,           -- NULL = novo, UUID = editar grupo existente
  p_criado_por          uuid DEFAULT NULL, -- Referência à tabela user_expandido (PK)
  p_id_local            uuid DEFAULT NULL  -- Referência à tabela fin_locais
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_grupo_id          uuid;
  v_valor_parcela     numeric(12,2);
  v_data_parcela      date;
  v_lancamento_id     uuid;
  v_lancamentos_ids   uuid[] := '{}';
  v_i                 integer;
BEGIN

  -- ─── Validações básicas ─────────────────────────────────────────
  IF p_tipo NOT IN ('receita', 'despesa') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tipo inválido. Use "receita" ou "despesa".');
  END IF;

  IF p_valor IS NULL OR p_valor <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valor deve ser maior que zero.');
  END IF;

  -- ─── CASO 1: Lançamento simples (não parcelado) ─────────────────
  IF NOT COALESCE(p_parcelado, false) THEN

    IF p_id IS NULL THEN
      -- Inserir novo
      INSERT INTO public.fin_lancamentos (
        id_entidade, id_conta, id_categoria, id_lancamento_pai,
        descricao, valor, tipo, data, criado_por,
        parcelado, qtd_parcelas, parcela_n, id_grupo_parcelas, id_local
      ) VALUES (
        p_id_entidade, p_id_conta, p_id_categoria, p_id_lancamento_pai,
        nullif(trim(p_descricao), ''), p_valor, p_tipo, COALESCE(p_data, CURRENT_DATE), p_criado_por,
        false, NULL, NULL, NULL, p_id_local
      )
      RETURNING id INTO v_lancamento_id;
    ELSE
      -- Atualizar existente
      UPDATE public.fin_lancamentos SET
        id_conta          = p_id_conta,
        id_categoria      = p_id_categoria,
        id_lancamento_pai = p_id_lancamento_pai,
        descricao         = nullif(trim(p_descricao), ''),
        valor             = p_valor,
        tipo              = p_tipo,
        data              = COALESCE(p_data, CURRENT_DATE),
        parcelado         = false,
        qtd_parcelas      = NULL,
        parcela_n         = NULL,
        id_grupo_parcelas = NULL,
        id_local          = COALESCE(p_id_local, id_local) -- opcionalmente mantemos o mesmo ou atualizamos
      WHERE id = p_id AND id_entidade = p_id_entidade
      RETURNING id INTO v_lancamento_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'lancamento_id', v_lancamento_id);

  END IF;

  -- ─── CASO 2: Lançamento parcelado ───────────────────────────────
  IF p_valor_e_total THEN
    v_valor_parcela := ROUND(p_valor / p_qtd_parcelas, 2);
  ELSE
    v_valor_parcela := p_valor;
  END IF;

  IF p_id_grupo_parcelas IS NOT NULL THEN
    DELETE FROM public.fin_lancamentos WHERE id_grupo_parcelas = p_id_grupo_parcelas;
    v_grupo_id := p_id_grupo_parcelas;
  ELSE
    v_grupo_id := gen_random_uuid();
  END IF;

  FOR v_i IN 1..p_qtd_parcelas LOOP
    v_data_parcela := COALESCE(p_data, CURRENT_DATE) + ((v_i - 1) * INTERVAL '1 month');

    INSERT INTO public.fin_lancamentos (
      id_entidade, id_conta, id_categoria, id_lancamento_pai,
      descricao, valor, tipo, data, criado_por,
      parcelado, qtd_parcelas, parcela_n, id_grupo_parcelas, id_local
    ) VALUES (
      p_id_entidade, p_id_conta, p_id_categoria, p_id_lancamento_pai,
      nullif(trim(p_descricao), ''), v_valor_parcela, p_tipo, v_data_parcela, p_criado_por,
      true, p_qtd_parcelas, v_i, v_grupo_id, p_id_local
    )
    RETURNING id INTO v_lancamento_id;

    v_lancamentos_ids := array_append(v_lancamentos_ids, v_lancamento_id);
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'parcelado', true,
    'id_grupo_parcelas', v_grupo_id,
    'lancamentos_ids', to_jsonb(v_lancamentos_ids)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fin_upsert_lancamento(uuid, uuid, uuid, uuid, uuid, text, numeric, text, date, boolean, integer, boolean, uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fin_upsert_lancamento(uuid, uuid, uuid, uuid, uuid, text, numeric, text, date, boolean, integer, boolean, uuid, uuid, uuid) TO service_role;
