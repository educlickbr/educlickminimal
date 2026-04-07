Estamos construindo um sistema educacional com Arquitetura Atômica em Supabase.

A hierarquia é: > 1. Componente: Matéria básica.
2. Módulo: Agrupador de componentes (Unidade Pedagógica).
3. Curso: Trilha/Grade (Mapa de Módulos).
4. Ciclo: Instância de um Módulo no tempo (com dias da semana e datas).
5. Programa: Oferta final (Reunião de Ciclos vinculados a um Curso).

Diretrizes para o Front-end:

Utilize uma interface de 5 abas principais (Componente, Módulos, Cursos, Ciclos, Programas).

O Plano de Aula deve ser gerenciado via modal dentro da aba de Módulos.

O calendário deve ser modal dentro da aba ciclos, clicando em botão no card de ciclos. 

A criação de aulas reais é feita via RPC aca_gerar_calendario_ciclo que processa a recorrência no banco.

O Calendário do Programa deve consumir uma visão consolidada que une todos os calendários dos ciclos vinculados.

Priorize chamadas RPC para operações de escrita (UPSERT) enviando objetos JSON complexos para o PostgreSQL."

vamos criar esa página vai chamar academico_oferta
pode ser ?

obrigado 





