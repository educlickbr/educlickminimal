/**
 * Utilitário para cálculo de Ano/Semestre (ex: '25Is', '25IIs')
 * 
 * @param hojeParam - Data base (opcional, default: hoje)
 * @param offsetParam - Deslocamento em semestres (opcional, default: 0)
 * @returns String formatada AAIs ou AAIIs (ex: '25Is')
 */
export const getAnoSemestre = (hojeParam?: string | number | Date, offsetParam?: number | string): string => {
  // hoje pode vir vazio ou como string → cai no Date() atual
  const baseDate = hojeParam ? new Date(hojeParam) : new Date();
  const offset = Number(offsetParam) || 0;

  const ano2 = baseDate.getFullYear() % 100;   // 2025 → 25
  const mes = baseDate.getMonth() + 1;
  const semestreIdx = mes <= 6 ? 0 : 1;        // 0 = Is, 1 = IIs

  // Aplica deslocamento em semestres (aceita negativo também)
  const total = ano2 * 2 + semestreIdx + offset;
  const novoAno2 = Math.floor(total / 2) % 100;
  const novoSemestre = total % 2 === 0 ? "Is" : "IIs";

  return `${String(novoAno2).padStart(2, "0")}${novoSemestre}`;
};

/**
 * Gera uma lista de opções de Ano/Semestre baseada na data atual.
 * Ex: Se hoje é 2026-02 (26Is), gera [26Is, 25IIs, 25Is, ...]
 * 
 * @param count - Quantidade de semestres para gerar (default: 6)
 * @returns Array de objetos { id: string, nome: string }
 */
export const getAnoSemestreList = (count: number = 6) => {
  const list = [];
  // Gera do próximo (+1) até o passado
  for (let i = 1; i > 1 - count; i--) {
    const value = getAnoSemestre(undefined, i);
    let label = value;

    if (i === 1) label += ' (Próximo)';
    if (i === 0) label += ' (Atual)';
    if (i === -1) label += ' (Anterior)';

    list.push({ id: value, nome: label });
  }
  return list;
};
