/**
 * Validador robusto de arquivos com detecção de corrupção
 * Suporta PDF, JPEG, PNG com limite de 4MB
 */

// Magic bytes para validar integridade do arquivo
const MAGIC_BYTES: Record<string, number[]> = {
    'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
};

export const validateMagicBytes = (data: ArrayBuffer, mimeType: string): boolean => {
    const magicBytes = MAGIC_BYTES[mimeType];
    if (!magicBytes) return true; // Se não temos magic bytes definido, não validamos
    
    const view = new Uint8Array(data);
    for (let i = 0; i < magicBytes.length; i++) {
        if (view[i] !== magicBytes[i]) {
            return false;
        }
    }
    return true;
};

/**
 * Valida integridade do arquivo verificando magic bytes
 */
export const validateFileCorruption = (file: File): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        
        // Ler apenas os primeiros 4KB para validar magic bytes
        const chunk = file.slice(0, 4096);
        
        reader.readAsArrayBuffer(chunk);
        
        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                if (!validateMagicBytes(reader.result, file.type)) {
                    resolve({
                        valid: false,
                        error: `❌ Arquivo corrompido ou tipo inválido. Tipo detectado: ${file.type || "desconhecido"}. Tente fazer download novamente do arquivo original.`
                    });
                } else {
                    resolve({ valid: true });
                }
            } else {
                resolve({ valid: true });
            }
        };
        
        reader.onerror = () => {
            resolve({
                valid: false,
                error: "❌ Não foi possível verificar a integridade do arquivo. Pode estar corrompido. Tente novamente."
            });
        };
    });
};

/**
 * Valida nome do arquivo contra caracteres inválidos e encoding
 */
export const validateFileName = (fileName: string): { valid: boolean; error?: string } => {
    // Caracteres inválidos: emojis, caracteres de controle, etc
    const invalidCharPattern = /[\x00-\x1F\x7F-\x9F<>:"|?*\u{1F000}-\u{1FFFF}]/gu;
    
    if (invalidCharPattern.test(fileName)) {
        return {
            valid: false,
            error: "❌ Nome do arquivo contém caracteres inválidos (emojis, símbolos especiais). Renomeie o arquivo removendo esses caracteres e tente novamente."
        };
    }
    
    // Verifica comprimento
    if (fileName.length > 255) {
        return {
            valid: false,
            error: "❌ Nome do arquivo é muito longo. Máximo permitido: 255 caracteres."
        };
    }
    
    return { valid: true };
};

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Validação completa do arquivo
 * - Valida nome
 * - Verifica tamanho (máx 3MB)
 * - Verifica tipo MIME
 * - Valida magic bytes (detecta corrupção)
 */
export const validateFileComplete = async (
    file: File,
    allowedTypes?: string[],
): Promise<{ valid: boolean; error?: string }> => {
    // 1. Validar nome do arquivo
    const nameValidation = validateFileName(file.name);
    if (!nameValidation.valid) {
        return nameValidation;
    }

    // 2. Validar tamanho - MÁXIMO 3MB
    const MAX_SIZE = 3 * 1024 * 1024;
    if (file.size === 0) {
        return { 
            valid: false, 
            error: "❌ Arquivo vazio. Por favor, selecione um arquivo válido." 
        };
    }
    
    if (file.size > MAX_SIZE) {
        return { 
            valid: false, 
            error: `❌ Arquivo muito grande (${formatFileSize(file.size)}). Tamanho máximo permitido: 3MB. Comprima ou selecione um arquivo menor.` 
        };
    }

    // 3. Validar tipo
    const DEFAULT_TYPES = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
    ];

    const typesToCheck = allowedTypes || DEFAULT_TYPES;

    if (!typesToCheck.includes(file.type)) {
        return {
            valid: false,
            error: `❌ Tipo de arquivo inválido (${file.type || "desconhecido"}). Tipos permitidos: PDF, JPEG, PNG.`,
        };
    }

    // 4. Validar integridade (magic bytes) - Detecta corrupção
    const corruptionCheck = await validateFileCorruption(file);
    if (!corruptionCheck.valid) {
        return corruptionCheck;
    }

    return { valid: true };
};
