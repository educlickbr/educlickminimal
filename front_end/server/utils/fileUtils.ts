import { randomUUID } from 'node:crypto';

export function generateSafeFileName(originalName: string) {
  // Pega a extensão do arquivo (ex: .png, .pdf, .jpeg)
  const extMatch = originalName.match(/\.[0-9a-z]+$/i);
  const extension = extMatch ? extMatch[0] : '';
  
  // Gera um UUID v4 e concatena com a extensão
  const uuidName = `${randomUUID()}${extension}`;
  
  return {
    originalName, // O nome original para guardarmos no banco depois
    uuidName,     // O nome criptografado para o R2
    extension     // Extensão separada caso precise
  };
}
