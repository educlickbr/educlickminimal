-- ============================================================
-- Políticas de RLS para Tabelas Acadêmicas
-- Data: 2026-03-30
-- Autor: Antigravity
-- Regra: Admin ou Papéis 'aca_*' acessam dados de suas entidades.
-- ============================================================

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'aca_componente',
        'aca_modulo',
        'aca_modulo_componente',
        'aca_curso',
        'aca_curso_modulo',
        'aca_plano_de_aula',
        'aca_ref_plano_de_aula',
        'aca_programa',
        'aca_ciclo',
        'aca_ciclo_programa',
        'aca_ciclo_dia_semana',
        'aca_calendario'
    ];
    policy_name text;
    role_check text := '((auth.jwt() ->> ''papel''::text) = ''admin''::text OR (auth.jwt() ->> ''papel''::text) LIKE ''aca_%'')';
    entity_check text := '(EXISTS (SELECT 1 FROM jsonb_array_elements_text(auth.jwt() -> ''entidades''::text) e(ent_id) WHERE (e.ent_id)::uuid = %I.id_entidade))';
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- Garantir que RLS está habilitado
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

        -- Remover políticas antigas para evitar duplicidade
        FOR policy_name IN (SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public') LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, t);
        END LOOP;

        -- Criar nova política unificada para ALL (SELECT, INSERT, UPDATE, DELETE)
        -- Usando o formato solicitado pelo usuário
        EXECUTE format(
            'CREATE POLICY "aca_policy_all_access_%s" ON public.%I FOR ALL USING (%s AND %s) WITH CHECK (%s AND %s)',
            t, t,
            role_check, format(entity_check, t),
            role_check, format(entity_check, t)
        );

        RAISE NOTICE 'RLS Policy aplicada para tabela: %', t;
    END LOOP;
END $$;
