export const buildProtectedFileUrl = (
    hashBase: string | null | undefined,
    filePath: string | null | undefined,
    stripPrefix?: string,
) => {
    if (!hashBase || !filePath) return '';

    const normalizedBase = String(hashBase).trim();
    const normalizedPath = String(filePath)
        .trim()
        .replace(/^\/+/, '');

    const cleanPath = stripPrefix
        ? normalizedPath.replace(new RegExp(`^${stripPrefix.replace('/', '\\/')}\\/?`), '')
        : normalizedPath;

    if (!normalizedBase || !cleanPath) return '';

    const qIndex = normalizedBase.indexOf('?');
    if (qIndex >= 0) {
        const basePart = normalizedBase.slice(0, qIndex).replace(/\/+$/, '');
        const queryPart = normalizedBase.slice(qIndex + 1);
        if (!queryPart) {
            return `${basePart}/${cleanPath}`;
        }
        return `${basePart}/${cleanPath}?${queryPart}`;
    }

    return `${normalizedBase.replace(/\/+$/, '')}/${cleanPath}`;
};
