-- RPC: fin_upsert_lancamento
-- Gerencia criação e edição de lançamentos financeiros

drop function public.fin_upsert_lancamento;

CREATE OR REPLACE FUNCTION public.fin_upsert_lancamento(
  p_id                  uuid,           -- NULL = criar, UUID = editar
  p_id_entidade         uuid,
  p_id_conta            uuid,
  p_id_categoria        uuid,
  p_id_lancamento_pai   uuid,
  p_descricao           text,
  p_valor               numeric(12,2),
  p_tipo                text,
  p_data                date,
  p_parcelado           boolean,
  p_qtd_parcelas        integer,
  p_valor_e_total       boolean,
  p_id_grupo_parcelas   uuid,
  p_criado_por          uuid DEFAULT NULL -- Novo parâmetro: ID da tabela user_expandido
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

  -- ─── CASO 1: Lançamento simples ─────────────────────────────────
  IF NOT COALESCE(p_parcelado, false) THEN

    IF p_id IS NULL THEN
      INSERT INTO public.fin_lancamentos (
        id_entidade, id_conta, id_categoria, id_lancamento_pai,
        descricao, valor, tipo, data, criado_por,
        parcelado, qtd_parcelas, parcela_n, id_grupo_parcelas
      ) VALUES (
        p_id_entidade, p_id_conta, p_id_categoria, p_id_lancamento_pai,
        nullif(trim(p_descricao), ''), p_valor, p_tipo, COALESCE(p_data, CURRENT_DATE), p_criado_por,
        false, NULL, NULL, NULL
      )
      RETURNING id INTO v_lancamento_id;
    ELSE
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
        id_grupo_parcelas = NULL
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
      parcelado, qtd_parcelas, parcela_n, id_grupo_parcelas
    ) VALUES (
      p_id_entidade, p_id_conta, p_id_categoria, p_id_lancamento_pai,
      nullif(trim(p_descricao), ''), v_valor_parcela, p_tipo, v_data_parcela, p_criado_por,
      true, p_qtd_parcelas, v_i, v_grupo_id
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
