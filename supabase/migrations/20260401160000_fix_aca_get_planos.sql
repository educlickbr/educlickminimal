-- Correção da ordenação no jsonb_agg
CREATE OR REPLACE FUNCTION public.aca_get_planos_por_modulo(p_id_modulo UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', base.id,
                'id_componente', base.id_componente,
                'nome_componente', base.nome_componente,
                'titulo_plano', base.titulo_plano,
                'ementa', base.ementa
            )
        )
        FROM (
            SELECT p.*, c.nome_componente
            FROM public.aca_plano_de_aula p
            JOIN public.aca_componente c ON c.id = p.id_componente
            WHERE p.id_modulo = p_id_modulo
            ORDER BY p.criado_em ASC
        ) base
    ), '[]'::jsonb);
END;
$$;
