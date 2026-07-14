const normalizeAnoSemestre = (value: unknown) => String(value ?? '').trim().toLowerCase()

export interface RegularEnrollmentGuardResult {
    blocked: boolean
    isRegular: boolean
    anoSemestre: string | null
}

export async function getRegularEnrollmentGuard(
    client: any,
    authUserId: string,
    turmaId: string,
): Promise<RegularEnrollmentGuardResult> {
    const { data: turma, error: turmaError } = await client
        .from('turmas')
        .select('id, area_curso, ano_semestre')
        .eq('id', turmaId)
        .maybeSingle()

    if (turmaError) {
        console.error('Erro ao buscar turma para validar elegibilidade de Regulares:', turmaError)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao validar turma para inscrição.',
        })
    }

    if (!turma) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Turma não encontrada.',
        })
    }

    const areaCurso = String(turma.area_curso || '').trim().toLowerCase()
    const anoSemestre = String(turma.ano_semestre || '').trim()
    const isRegular = areaCurso === 'regulares' && !!anoSemestre

    if (!isRegular) {
        return {
            blocked: false,
            isRegular: false,
            anoSemestre: anoSemestre || null,
        }
    }

    const { data: eligibilityData, error: eligibilityError } = await (client.rpc as any)(
        'nxt_get_elegibilidade_seletivo_regulares_por_cpf_v2',
        { p_auth_user_id: authUserId },
    )

    if (eligibilityError) {
        console.error('Erro ao buscar elegibilidade de Regulares por CPF/login:', eligibilityError)
        throw createError({
            statusCode: 500,
            statusMessage: 'Erro ao validar elegibilidade para Regulares.',
        })
    }

    const blockedPeriods = Array.isArray(eligibilityData?.anos_semestres_bloqueados)
        ? eligibilityData.anos_semestres_bloqueados
        : []

    return {
        blocked: blockedPeriods
            .map((period: unknown) => normalizeAnoSemestre(period))
            .includes(normalizeAnoSemestre(anoSemestre)),
        isRegular: true,
        anoSemestre,
    }
}
