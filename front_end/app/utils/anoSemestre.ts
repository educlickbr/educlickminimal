/**
 * Utilitário de ano/semestre acadêmico.
 *
 * Convenção usada no banco: "AA" + romano + "s"
 *   - I  = primeiro semestre (jan–jun)  → "26Is"
 *   - II = segundo semestre  (jul–dez)  → "26IIs"
 */

const ROMANO: Record<number, string> = { 1: "I", 2: "II" };

export function getAnoSemestreAtual(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear() % 100;
  const semestre = hoje.getMonth() < 6 ? 1 : 2;
  return `${ano}${ROMANO[semestre]}s`;
}

export function getSemestresParaDrop(anteriores: number): string[] {
  const atual = getAnoSemestreAtual();
  const match = atual.match(/^(\d+)(I+)s$/);
  if (!match || !match[1] || !match[2]) return [atual];
  let ano = parseInt(match[1], 10);
  let sem = match[2] === "I" ? 1 : 2;
  const resultados: string[] = [];
  const proxSem = sem === 1 ? 2 : 1;
  const proxAno = sem === 2 ? ano + 1 : ano;
  resultados.push(`${proxAno}${ROMANO[proxSem]}s`);
  resultados.push(atual);
  for (let i = 0; i < anteriores; i++) {
    if (sem === 1) {
      sem = 2;
      ano--;
    } else {
      sem = 1;
    }
    resultados.push(`${ano}${ROMANO[sem]}s`);
  }
  return resultados;
}

/** Converte uma data para o código de semestre. Ex: "2026-06-15" → "26Is" */
export function getAnoSemestre(dateStr: string): string | null {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const ano = d.getFullYear() % 100;
  const sem = d.getMonth() < 6 ? 1 : 2;
  return `${ano}${ROMANO[sem]}s`;
}

/** Gera lista de semestres para dropdown. */
export function getAnoSemestreList(
  count: number,
): { id: string; nome: string }[] {
  const codigos = getSemestresParaDrop(count);
  return codigos.map((cod: string) => {
    const match = cod.match(/^(\d+)(I+)s$/);
    if (!match || !match[1] || !match[2]) return { id: cod, nome: cod };
    const ano = parseInt(match[1], 10) + 2000;
    const sem = match[2] === "I" ? 1 : 2;
    return { id: cod, nome: `${ano} - ${sem}º Semestre` };
  });
}
