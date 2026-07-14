export interface StudentNameSource {
    nome?: string | null;
    sobrenome?: string | null;
    nome_aluno?: string | null;
    nome_social?: string | null;
}

export interface StudentNameDisplay {
    officialName: string;
    socialName: string | null;
    primaryName: string;
    secondaryLabel: string;
    secondaryValue: string;
    secondaryText: string;
    hasSocialName: boolean;
    fallbackInitial: string;
}

export const normalizeStudentNameValue = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
};

export const getOfficialStudentName = (student: StudentNameSource): string => {
    const explicitName = normalizeStudentNameValue(student.nome_aluno);

    if (explicitName) {
        return explicitName;
    }

    return [normalizeStudentNameValue(student.nome), normalizeStudentNameValue(student.sobrenome)]
        .filter((part): part is string => Boolean(part))
        .join(' ')
        .trim();
};

export const getStudentNameDisplay = (student: StudentNameSource): StudentNameDisplay => {
    const officialName = getOfficialStudentName(student);
    const socialName = normalizeStudentNameValue(student.nome_social);
    const hasSocialName = Boolean(socialName);
    const primaryName = socialName || officialName || '-';
    const secondaryLabel = hasSocialName ? 'NR:' : 'Nome social:';
    const secondaryValue = hasSocialName ? officialName : '';
    const secondaryText = secondaryValue ? `${secondaryLabel} ${secondaryValue}` : secondaryLabel;
    const fallbackInitial = (primaryName.charAt(0) || officialName.charAt(0) || '?').toUpperCase();

    return {
        officialName,
        socialName,
        primaryName,
        secondaryLabel,
        secondaryValue,
        secondaryText,
        hasSocialName,
        fallbackInitial
    };
};

export const decorateStudentName = <T extends StudentNameSource & Record<string, any>>(student: T) => ({
    ...student,
    nome_social: normalizeStudentNameValue(student.nome_social),
    name_display: getStudentNameDisplay(student)
});

export const decorateStudentNames = <T extends StudentNameSource & Record<string, any>>(students: T[]) => {
    return students.map((student) => decorateStudentName(student));
};