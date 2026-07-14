import { getStudentContext } from '../../utils/student-context'

export default defineEventHandler(async (event) => {
    const { client, userExpandidoId } = await getStudentContext(event)

    const { data, error } = await client
        .from('jnpta_candidaturas')
        .select(`
            id,
            status,
            id_edital,
            id_grupo,
            qtd_integrantes,
            created_at,
            updated_at,
            enviado_em,
            submitted_at,
            jnpta_editais!id_edital (
                id,
                edital_titulo,
                qual_tempo,
                ano_semestre
            ),
            jnpta_grupos!id_grupo (
                id,
                nome_grupo
            )
        `)
        .eq('id_direcao_artistica', userExpandidoId)
        .not('id_edital', 'is', null)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        })
    }

    return (data || []).map((item: any) => ({
        id_candidatura: item.id,
        status: item.status,
        id_edital: item.id_edital,
        id_grupo: item.id_grupo,
        qtd_integrantes: item.qtd_integrantes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        enviado_em: item.enviado_em,
        submitted_at: item.submitted_at,
        edital_titulo: item.jnpta_editais?.edital_titulo || null,
        qual_tempo: item.jnpta_editais?.qual_tempo || null,
        ano_semestre: item.jnpta_editais?.ano_semestre || null,
        nome_grupo: item.jnpta_grupos?.nome_grupo || null,
    }))
})