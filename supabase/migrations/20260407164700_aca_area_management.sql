-- Migration: Gestão de Áreas Educacionais e Refatoração de Cursos
-- Data: 2026-04-07
-- Referência Anterior: 20260402191500_aca_curso_projeto_pedagogico.sql

-- 1. Criar Tabela de Áreas Educacionais
CREATE TABLE IF NOT EXISTS public.aca_area (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome_area text NOT NULL,
  descricao text NULL,
  id_entidade uuid NOT NULL,
  criado_em timestamp with time zone DEFAULT now(),
  criado_por uuid NULL,
  
  CONSTRAINT aca_area_pkey PRIMARY KEY (id),
  CONSTRAINT aca_area_id_entidade_fkey FOREIGN KEY (id_entidade) REFERENCES public.user_entidades (id) ON DELETE CASCADE,
  CONSTRAINT aca_area_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.user_expandido (id)
);

-- RLS (Regra 4: Security Invoker)
ALTER TABLE public.aca_area ENABLE ROW LEVEL SECURITY;

-- Política de Acesso por Entidade e Papel (ALL)
CREATE POLICY "Gestão de Áreas Educacionais (Entidade)" ON public.aca_area
AS PERMISSIVE FOR ALL
TO authenticated
USING (
  (((auth.jwt() ->> 'papel'::text) = 'admin'::text) OR ((auth.jwt() ->> 'papel'::text) ~~ 'aca_%'::text)) 
  AND (EXISTS ( 
    SELECT 1 
    FROM jsonb_array_elements_text((auth.jwt() -> 'entidades'::text)) e(ent_id)
    WHERE ((e.ent_id)::uuid = aca_area.id_entidade)
  ))
);

-- 2. Atualizar aca_curso para incluir id_area
ALTER TABLE public.aca_curso 
ADD COLUMN IF NOT EXISTS id_area uuid NULL;

ALTER TABLE public.aca_curso
ADD CONSTRAINT aca_curso_id_area_fkey 
FOREIGN KEY (id_area) REFERENCES public.aca_area (id) ON DELETE SET NULL;

-- 3. RPC para Upsert de Áreas
CREATE OR REPLACE FUNCTION public.nxt_upsert_area(
  p_id uuid,
  p_nome_area text,
  p_descricao text,
  p_id_entidade uuid,
  p_criado_por uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO public.aca_area (nome_area, descricao, id_entidade, criado_por)
    VALUES (p_nome_area, p_descricao, p_id_entidade, p_criado_por)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.aca_area SET
      nome_area = p_nome_area,
      descricao = p_descricao,
      id_entidade = p_id_entidade
    WHERE id = p_id
    RETURNING id INTO v_id;
  END IF;
  
  RETURN v_id;
END;
$$;

-- 4. Atualizar RPC de Cursos para incluir o parâmetro p_id_area
CREATE OR REPLACE FUNCTION public.aca_upsert_curso(
  p_id uuid,
  p_id_entidade uuid,
  p_nome_curso text,
  p_descricao text,
  p_id_area uuid,
  p_usuario_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_id uuid;
  v_result jsonb;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO public.aca_curso (
      nome_curso, 
      descricao, 
      id_area, 
      id_entidade, 
      criado_por
    ) VALUES (
      p_nome_curso, 
      p_descricao, 
      p_id_area, 
      p_id_entidade, 
      p_usuario_id
    ) RETURNING id INTO v_id;
  ELSE
    UPDATE public.aca_curso SET
      nome_curso = p_nome_curso,
      descricao = p_descricao,
      id_area = p_id_area,
      modificado_por = p_usuario_id,
      modificado_em = now()
    WHERE id = p_id AND id_entidade = p_id_entidade
    RETURNING id INTO v_id;
  END IF;

  SELECT jsonb_build_object('success', true, 'id', v_id) INTO v_result;
  RETURN v_result;
END;
$$;

-- 5. Atualizar RPC de Listagem de Cursos para incluir dados de Área
CREATE OR REPLACE FUNCTION public.aca_get_cursos_paginado(
  p_id_entidade uuid,
  p_pagina integer DEFAULT 1,
  p_limite integer DEFAULT 20,
  p_busca text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_offset integer;
  v_total integer;
  v_itens jsonb;
  v_result jsonb;
BEGIN
  v_offset := (p_pagina - 1) * p_limite;

  -- Contagem total com busca
  SELECT count(*) INTO v_total
  FROM public.aca_curso c
  WHERE c.id_entidade = p_id_entidade
    AND (p_busca IS NULL OR p_busca = '' OR c.nome_curso ILIKE '%' || p_busca || '%');

  -- Busca itens com LEFT JOIN na nova tabela aca_area
  SELECT jsonb_agg(sub) INTO v_itens
  FROM (
    SELECT 
      c.*,
      a.nome_area, -- Precisamos disso para o badge
      (SELECT count(*) FROM public.aca_modulo_curso mc WHERE mc.id_curso = c.id) as qtd_modulos
    FROM public.aca_curso c
    LEFT JOIN public.aca_area a ON a.id = c.id_area
    WHERE c.id_entidade = p_id_entidade
      AND (p_busca IS NULL OR p_busca = '' OR c.nome_curso ILIKE '%' || p_busca || '%')
    ORDER BY c.nome_curso ASC
    LIMIT p_limite OFFSET v_offset
  ) sub;

  SELECT jsonb_build_object(
    'success', true,
    'itens', COALESCE(v_itens, '[]'::jsonb),
    'total', v_total,
    'pagina', p_pagina,
    'limite', p_limite
  ) INTO v_result;

  RETURN v_result;
END;
$$;
