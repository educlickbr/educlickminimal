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

/**
 * Retorna o semestre atual + anteriores + próximo.
 * Ex: getSemestresParaDrop(3) → ["26Is", "25IIs", "25Is", "26IIs"]
 *     (atual, 3 anteriores, 1 à frente — ordenado decrescente)
 */
export function getSemestresParaDrop(anteriores: number): string[] {
  const atual = getAnoSemestreAtual();
  const match = atual.match(/^(\d+)(I+)s$/);
  if (!match || !match[1] || !match[2]) return [atual];

  let ano = parseInt(match[1], 10);
  let sem = match[2] === "I" ? 1 : 2;

  const resultados: string[] = [];

  // 1 à frente
  const proxSem = sem === 1 ? 2 : 1;
  const proxAno = sem === 2 ? ano + 1 : ano;
  resultados.push(`${proxAno}${ROMANO[proxSem]}s`);

  // Atual
  resultados.push(atual);

  // Anteriores
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
