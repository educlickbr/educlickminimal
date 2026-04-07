-- ============================================================
-- RPCs: aca_modulo_componente
-- Data: 2026-03-30
-- Descrição: Funções para gerenciar a relação entre módulos e
--            componentes (aca_modulo_componente).
--            Também atualiza aca_upsert_modulo e
--            aca_get_modulos_paginado para incluir qtd_componentes.
-- ============================================================


-- ============================================================
-- 1. aca_get_componentes_do_modulo
--    Lista os componentes associados a um módulo
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_componentes_do_modulo(
  p_id_modulo uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id',             mc.id,
      'id_componente',  mc.id_componente,
      'nome_componente', c.nome_componente,
      'descricao',      c.descricao,
      'carga_horaria',  mc.carga_horaria,
      'ordem',          mc.ordem,
      'obrigatorio',    mc.obrigatorio
    ) ORDER BY mc.ordem ASC, c.nome_componente ASC
  )
  INTO v_result
  FROM public.aca_modulo_componente mc
  INNER JOIN public.aca_componente c ON c.id = mc.id_componente
  WHERE mc.id_modulo = p_id_modulo;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


-- ============================================================
-- 2. aca_add_componente_ao_modulo
--    Adiciona ou atualiza um componente dentro de um módulo
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_add_componente_ao_modulo(
  p_id_modulo      uuid,
  p_id_componente  uuid,
  p_id_entidade    uuid,
  p_carga_horaria  int DEFAULT NULL,
  p_ordem          int DEFAULT 0,
  p_obrigatorio    bool DEFAULT true,
  p_usuario_id     uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_existing_id uuid;
BEGIN
  -- Verifica se já existe a relação
  SELECT id INTO v_existing_id
  FROM public.aca_modulo_componente
  WHERE id_modulo = p_id_modulo
    AND id_componente = p_id_componente;

  IF v_existing_id IS NOT NULL THEN
    -- Atualiza
    UPDATE public.aca_modulo_componente
    SET
      carga_horaria   = COALESCE(p_carga_horaria, carga_horaria),
      ordem           = COALESCE(p_ordem, ordem),
      obrigatorio     = COALESCE(p_obrigatorio, obrigatorio),
      modificado_por  = p_usuario_id,
      modificado_em   = NOW()
    WHERE id = v_existing_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Componente atualizado no módulo',
      'id', v_existing_id
    );
  ELSE
    -- Insere
    INSERT INTO public.aca_modulo_componente (
      id_modulo, id_componente, id_entidade,
      carga_horaria, ordem, obrigatorio,
      criado_por, criado_em, modificado_por, modificado_em
    ) VALUES (
      p_id_modulo, p_id_componente, p_id_entidade,
      p_carga_horaria, COALESCE(p_ordem, 0), COALESCE(p_obrigatorio, true),
      p_usuario_id, NOW(), p_usuario_id, NOW()
    );

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Componente adicionado ao módulo'
    );
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;


-- ============================================================
-- 3. aca_remove_componente_do_modulo
--    Remove a associação de um componente a um módulo
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_remove_componente_do_modulo(
  p_id_modulo     uuid,
  p_id_componente uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.aca_modulo_componente
  WHERE id_modulo = p_id_modulo
    AND id_componente = p_id_componente;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Associação não encontrada'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Componente removido do módulo'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;


-- ============================================================
-- 4. aca_upsert_modulo (atualizado)
--    Faz upsert do módulo. O array de componentes é gerenciado
--    separadamente via aca_add/remove_componente_ao_modulo.
--    Mantemos a carga_horaria manual no módulo como total geral.
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_upsert_modulo(
  p_id           uuid DEFAULT NULL,
  p_id_entidade  uuid DEFAULT NULL,
  p_nome_modulo  text DEFAULT NULL,
  p_descricao    text DEFAULT NULL,
  p_carga_horaria int DEFAULT NULL,
  p_usuario_id   uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_id IS NOT NULL THEN
    -- UPDATE
    UPDATE public.aca_modulo
    SET
      nome_modulo     = COALESCE(p_nome_modulo, nome_modulo),
      descricao       = COALESCE(p_descricao, descricao),
      carga_horaria   = p_carga_horaria,
      modificado_por  = p_usuario_id,
      modificado_em   = NOW()
    WHERE id = p_id
      AND id_entidade = p_id_entidade;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Módulo não encontrado ou sem permissão'
      );
    END IF;

    v_id := p_id;
  ELSE
    -- INSERT
    INSERT INTO public.aca_modulo (
      id_entidade, nome_modulo, descricao, carga_horaria,
      criado_por, criado_em, modificado_por, modificado_em
    ) VALUES (
      p_id_entidade, p_nome_modulo, p_descricao, p_carga_horaria,
      p_usuario_id, NOW(), p_usuario_id, NOW()
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', CASE WHEN p_id IS NOT NULL THEN 'Módulo atualizado' ELSE 'Módulo criado' END,
    'id', v_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;


-- ============================================================
-- 5. aca_get_modulos_paginado (atualizado)
--    Lista módulos com qtd_componentes e qtd_planos
-- ============================================================

CREATE OR REPLACE FUNCTION public.aca_get_modulos_paginado(
  p_id_entidade uuid,
  p_pagina      int DEFAULT 1,
  p_limite      int DEFAULT 20,
  p_busca       text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_offset     int;
  v_total      int;
  v_itens      jsonb;
BEGIN
  v_offset := (p_pagina - 1) * p_limite;

  SELECT COUNT(*)
  INTO v_total
  FROM public.aca_modulo m
  WHERE m.id_entidade = p_id_entidade
    AND (
      p_busca IS NULL
      OR m.nome_modulo ILIKE '%' || p_busca || '%'
    );

  SELECT jsonb_agg(row)
  INTO v_itens
  FROM (
    SELECT jsonb_build_object(
      'id',               m.id,
      'nome_modulo',      m.nome_modulo,
      'descricao',        m.descricao,
      'carga_horaria',    m.carga_horaria,
      'qtd_componentes',  (
        SELECT COUNT(*) FROM public.aca_modulo_componente mc
        WHERE mc.id_modulo = m.id
      ),
      'qtd_planos',       (
        SELECT COUNT(*) FROM public.aca_plano_de_aula pa
        WHERE pa.id_modulo = m.id
      ),
      'criado_em',        m.criado_em,
      'modificado_em',    m.modificado_em
    ) AS row
    FROM public.aca_modulo m
    WHERE m.id_entidade = p_id_entidade
      AND (
        p_busca IS NULL
        OR m.nome_modulo ILIKE '%' || p_busca || '%'
      )
    ORDER BY m.criado_em DESC
    LIMIT p_limite
    OFFSET v_offset
  ) sub;

  RETURN jsonb_build_object(
    'pagina_atual', p_pagina,
    'qtd_total',    v_total,
    'itens',        COALESCE(v_itens, '[]'::jsonb)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'pagina_atual', p_pagina,
    'qtd_total',    0,
    'itens',        '[]'::jsonb,
    'erro',         SQLERRM
  );
END;
$$;
