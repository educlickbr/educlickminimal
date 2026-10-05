export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aca_area: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          descricao: string | null
          id: string
          id_entidade: string
          nome_area: string
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          id_entidade: string
          nome_area: string
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          id_entidade?: string
          nome_area?: string
        }
        Relationships: [
          {
            foreignKeyName: "aca_area_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_area_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_calendario: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          dt_hora_fim: string | null
          dt_hora_ini: string | null
          id: string
          id_atribuicao_docente: string | null
          id_aula_origem: string | null
          id_aula_parceira: string | null
          id_ciclo: string | null
          id_componente: string | null
          id_docente_override: string | null
          id_entidade: string
          modificado_em: string | null
          modificado_por: string | null
          observacao: string | null
          status: string | null
          sub_turma: string | null
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          dt_hora_fim?: string | null
          dt_hora_ini?: string | null
          id?: string
          id_atribuicao_docente?: string | null
          id_aula_origem?: string | null
          id_aula_parceira?: string | null
          id_ciclo?: string | null
          id_componente?: string | null
          id_docente_override?: string | null
          id_entidade: string
          modificado_em?: string | null
          modificado_por?: string | null
          observacao?: string | null
          status?: string | null
          sub_turma?: string | null
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          dt_hora_fim?: string | null
          dt_hora_ini?: string | null
          id?: string
          id_atribuicao_docente?: string | null
          id_aula_origem?: string | null
          id_aula_parceira?: string | null
          id_ciclo?: string | null
          id_componente?: string | null
          id_docente_override?: string | null
          id_entidade?: string
          modificado_em?: string | null
          modificado_por?: string | null
          observacao?: string | null
          status?: string | null
          sub_turma?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aca_calendario_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_calendario_id_atribuicao_docente_fkey"
            columns: ["id_atribuicao_docente"]
            isOneToOne: false
            referencedRelation: "aca_docente_modulo_componente_ciclo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_calendario_id_aula_origem_fkey"
            columns: ["id_aula_origem"]
            isOneToOne: false
            referencedRelation: "aca_calendario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_calendario_id_aula_parceira_fkey"
            columns: ["id_aula_parceira"]
            isOneToOne: false
            referencedRelation: "aca_calendario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_calendario_id_ciclo_fkey"
            columns: ["id_ciclo"]
            isOneToOne: false
            referencedRelation: "aca_ciclo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_calendario_id_componente_fkey"
            columns: ["id_componente"]
            isOneToOne: false
            referencedRelation: "aca_componente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_calendario_id_docente_override_fkey"
            columns: ["id_docente_override"]
            isOneToOne: false
            referencedRelation: "aca_docente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_calendario_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_calendario_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_carga_horaria: {
        Row: {
          carga_horaria: number
          criado_em: string | null
          criado_por: string | null
          id: string
          id_componente: string | null
          id_entidade: string
          id_modulo: string | null
          modificado_em: string | null
          modificado_por: string | null
        }
        Insert: {
          carga_horaria: number
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_componente?: string | null
          id_entidade: string
          id_modulo?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
        }
        Update: {
          carga_horaria?: number
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_componente?: string | null
          id_entidade?: string
          id_modulo?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aca_carga_horaria_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_carga_horaria_id_componente_fkey"
            columns: ["id_componente"]
            isOneToOne: false
            referencedRelation: "aca_componente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_carga_horaria_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_carga_horaria_id_modulo_fkey"
            columns: ["id_modulo"]
            isOneToOne: false
            referencedRelation: "aca_modulo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_carga_horaria_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_ciclo: {
        Row: {
          ano_semestre: string | null
          criado_em: string | null
          criado_por: string | null
          data_fim: string | null
          data_ini: string | null
          descricao: string | null
          id: string
          id_entidade: string
          id_modulo: string | null
          modificado_em: string | null
          modificado_por: string | null
          turno: Database["public"]["Enums"]["tipo_turno"] | null
        }
        Insert: {
          ano_semestre?: string | null
          criado_em?: string | null
          criado_por?: string | null
          data_fim?: string | null
          data_ini?: string | null
          descricao?: string | null
          id?: string
          id_entidade: string
          id_modulo?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          turno?: Database["public"]["Enums"]["tipo_turno"] | null
        }
        Update: {
          ano_semestre?: string | null
          criado_em?: string | null
          criado_por?: string | null
          data_fim?: string | null
          data_ini?: string | null
          descricao?: string | null
          id?: string
          id_entidade?: string
          id_modulo?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          turno?: Database["public"]["Enums"]["tipo_turno"] | null
        }
        Relationships: [
          {
            foreignKeyName: "aca_ciclo_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_ciclo_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_ciclo_id_modulo_fkey"
            columns: ["id_modulo"]
            isOneToOne: false
            referencedRelation: "aca_modulo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_ciclo_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_ciclo_dia_extra: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          data: string
          hora_fim: string
          hora_ini: string
          id: string
          id_ciclo: string
          id_entidade: string
          modificado_em: string | null
          modificado_por: string | null
          observacoes: string | null
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          data: string
          hora_fim: string
          hora_ini: string
          id?: string
          id_ciclo: string
          id_entidade: string
          modificado_em?: string | null
          modificado_por?: string | null
          observacoes?: string | null
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          data?: string
          hora_fim?: string
          hora_ini?: string
          id?: string
          id_ciclo?: string
          id_entidade?: string
          modificado_em?: string | null
          modificado_por?: string | null
          observacoes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aca_ciclo_dia_extra_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_ciclo_dia_extra_id_ciclo_fkey"
            columns: ["id_ciclo"]
            isOneToOne: false
            referencedRelation: "aca_ciclo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_ciclo_dia_extra_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_ciclo_dia_semana: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          dia_sem_txt: string | null
          hora_fim: string | null
          hora_ini: string | null
          id: string
          id_ciclo: string | null
          id_entidade: string
          modificado_em: string | null
          modificado_por: string | null
          n_dia_sem: number | null
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          dia_sem_txt?: string | null
          hora_fim?: string | null
          hora_ini?: string | null
          id?: string
          id_ciclo?: string | null
          id_entidade: string
          modificado_em?: string | null
          modificado_por?: string | null
          n_dia_sem?: number | null
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          dia_sem_txt?: string | null
          hora_fim?: string | null
          hora_ini?: string | null
          id?: string
          id_ciclo?: string | null
          id_entidade?: string
          modificado_em?: string | null
          modificado_por?: string | null
          n_dia_sem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aca_ciclo_dia_semana_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_ciclo_dia_semana_id_ciclo_fkey"
            columns: ["id_ciclo"]
            isOneToOne: false
            referencedRelation: "aca_ciclo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_ciclo_dia_semana_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_ciclo_dia_semana_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_ciclo_programa: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          id: string
          id_ciclo: string | null
          id_entidade: string
          id_programa: string | null
          modificado_em: string | null
          modificado_por: string | null
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_ciclo?: string | null
          id_entidade: string
          id_programa?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_ciclo?: string | null
          id_entidade?: string
          id_programa?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aca_ciclo_programa_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_ciclo_programa_id_ciclo_fkey"
            columns: ["id_ciclo"]
            isOneToOne: false
            referencedRelation: "aca_ciclo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_ciclo_programa_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_ciclo_programa_id_programa_fkey"
            columns: ["id_programa"]
            isOneToOne: false
            referencedRelation: "aca_programa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_ciclo_programa_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_componente: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          descricao: string | null
          id: string
          id_entidade: string
          modificado_em: string | null
          modificado_por: string | null
          nome_componente: string
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          id_entidade: string
          modificado_em?: string | null
          modificado_por?: string | null
          nome_componente: string
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          id_entidade?: string
          modificado_em?: string | null
          modificado_por?: string | null
          nome_componente?: string
        }
        Relationships: [
          {
            foreignKeyName: "aca_componente_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_componente_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_componente_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_curso: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          descricao: string | null
          id: string
          id_area: string | null
          id_entidade: string
          modificado_em: string | null
          modificado_por: string | null
          nome_curso: string
          projeto_pedagogico: string | null
          tipo_modelo: string | null
          vagas_sugeridas: number | null
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          id_area?: string | null
          id_entidade: string
          modificado_em?: string | null
          modificado_por?: string | null
          nome_curso: string
          projeto_pedagogico?: string | null
          tipo_modelo?: string | null
          vagas_sugeridas?: number | null
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          id_area?: string | null
          id_entidade?: string
          modificado_em?: string | null
          modificado_por?: string | null
          nome_curso?: string
          projeto_pedagogico?: string | null
          tipo_modelo?: string | null
          vagas_sugeridas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aca_curso_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_curso_id_area_fkey"
            columns: ["id_area"]
            isOneToOne: false
            referencedRelation: "aca_area"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_curso_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_curso_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_curso_modulo: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          id: string
          id_curso: string | null
          id_entidade: string
          id_modulo: string | null
          modificado_em: string | null
          modificado_por: string | null
          ordem: number | null
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_curso?: string | null
          id_entidade: string
          id_modulo?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          ordem?: number | null
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_curso?: string | null
          id_entidade?: string
          id_modulo?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          ordem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aca_curso_modulo_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_curso_modulo_id_curso_fkey"
            columns: ["id_curso"]
            isOneToOne: false
            referencedRelation: "aca_curso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_curso_modulo_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_curso_modulo_id_modulo_fkey"
            columns: ["id_modulo"]
            isOneToOne: false
            referencedRelation: "aca_modulo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_curso_modulo_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_docente: {
        Row: {
          ativo: boolean
          criado_em: string
          criado_por: string | null
          id: string
          id_entidade: string
          id_user_expandido: string
          modificado_em: string | null
          modificado_por: string | null
          valor_hora_aula: number | null
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          criado_por?: string | null
          id?: string
          id_entidade: string
          id_user_expandido: string
          modificado_em?: string | null
          modificado_por?: string | null
          valor_hora_aula?: number | null
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          criado_por?: string | null
          id?: string
          id_entidade?: string
          id_user_expandido?: string
          modificado_em?: string | null
          modificado_por?: string | null
          valor_hora_aula?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aca_docente_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_docente_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_docente_id_user_expandido_fkey"
            columns: ["id_user_expandido"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_docente_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_docente_convite: {
        Row: {
          convite_enviado: boolean
          criado_em: string
          criado_por: string | null
          email: string | null
          id: string
          id_entidade: string
          token: string
          usado: boolean
        }
        Insert: {
          convite_enviado?: boolean
          criado_em?: string
          criado_por?: string | null
          email?: string | null
          id?: string
          id_entidade: string
          token?: string
          usado?: boolean
        }
        Update: {
          convite_enviado?: boolean
          criado_em?: string
          criado_por?: string | null
          email?: string | null
          id?: string
          id_entidade?: string
          token?: string
          usado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "aca_docente_convite_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_docente_convite_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_docente_modulo_componente_ciclo: {
        Row: {
          criado_em: string
          criado_por: string | null
          id: string
          id_ciclo: string
          id_docente: string
          id_modulo_componente: string
          modificado_em: string | null
          modificado_por: string | null
          tipo: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          id_ciclo: string
          id_docente: string
          id_modulo_componente: string
          modificado_em?: string | null
          modificado_por?: string | null
          tipo?: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          id_ciclo?: string
          id_docente?: string
          id_modulo_componente?: string
          modificado_em?: string | null
          modificado_por?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "aca_docente_modulo_componente_ciclo_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_docente_modulo_componente_ciclo_id_ciclo_fkey"
            columns: ["id_ciclo"]
            isOneToOne: false
            referencedRelation: "aca_ciclo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_docente_modulo_componente_ciclo_id_docente_fkey"
            columns: ["id_docente"]
            isOneToOne: false
            referencedRelation: "aca_docente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_docente_modulo_componente_ciclo_id_modulo_componente_fkey"
            columns: ["id_modulo_componente"]
            isOneToOne: false
            referencedRelation: "aca_modulo_componente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_docente_modulo_componente_ciclo_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_docente_proposta: {
        Row: {
          considerado: boolean | null
          criado_em: string
          email: string
          id: string
          id_curriculo: string | null
          id_edital: string | null
          id_entidade: string
          minibio: string | null
          modificado_em: string | null
          nome: string
          telefone: string | null
          visto: boolean
        }
        Insert: {
          considerado?: boolean | null
          criado_em?: string
          email: string
          id?: string
          id_curriculo?: string | null
          id_edital?: string | null
          id_entidade: string
          minibio?: string | null
          modificado_em?: string | null
          nome: string
          telefone?: string | null
          visto?: boolean
        }
        Update: {
          considerado?: boolean | null
          criado_em?: string
          email?: string
          id?: string
          id_curriculo?: string | null
          id_edital?: string | null
          id_entidade?: string
          minibio?: string | null
          modificado_em?: string | null
          nome?: string
          telefone?: string | null
          visto?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "aca_docente_proposta_id_curriculo_fkey"
            columns: ["id_curriculo"]
            isOneToOne: false
            referencedRelation: "global_arquivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_docente_proposta_id_edital_fkey"
            columns: ["id_edital"]
            isOneToOne: false
            referencedRelation: "aca_edital_docente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_docente_proposta_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_docente_vinculo: {
        Row: {
          criado_em: string
          criado_por: string | null
          elegivel: boolean
          id: string
          id_componente: string
          id_docente: string
          modificado_em: string | null
          modificado_por: string | null
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          elegivel?: boolean
          id?: string
          id_componente: string
          id_docente: string
          modificado_em?: string | null
          modificado_por?: string | null
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          elegivel?: boolean
          id?: string
          id_componente?: string
          id_docente?: string
          modificado_em?: string | null
          modificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aca_docente_vinculo_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_docente_vinculo_id_componente_fkey"
            columns: ["id_componente"]
            isOneToOne: false
            referencedRelation: "aca_componente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_docente_vinculo_id_docente_fkey"
            columns: ["id_docente"]
            isOneToOne: false
            referencedRelation: "aca_docente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_docente_vinculo_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_edital_docente: {
        Row: {
          criado_em: string
          criado_por: string | null
          data_fim: string
          data_ini: string
          descricao: string | null
          id: string
          id_entidade: string
          id_form_config: string | null
          modificado_em: string | null
          modificado_por: string | null
          nome: string
          status: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          data_fim: string
          data_ini: string
          descricao?: string | null
          id?: string
          id_entidade: string
          id_form_config?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          nome: string
          status?: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          data_fim?: string
          data_ini?: string
          descricao?: string | null
          id?: string
          id_entidade?: string
          id_form_config?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          nome?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "aca_edital_docente_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_edital_docente_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_edital_docente_id_form_config_fkey"
            columns: ["id_form_config"]
            isOneToOne: false
            referencedRelation: "aca_form_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_edital_docente_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_edital_docente_inscricao: {
        Row: {
          criado_em: string
          criado_por: string | null
          id: string
          id_candidato: string
          id_edital: string
          modificado_em: string | null
          modificado_por: string | null
          status: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          id_candidato: string
          id_edital: string
          modificado_em?: string | null
          modificado_por?: string | null
          status?: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          id_candidato?: string
          id_edital?: string
          modificado_em?: string | null
          modificado_por?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "aca_edital_docente_inscricao_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_edital_docente_inscricao_id_candidato_fkey"
            columns: ["id_candidato"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_edital_docente_inscricao_id_edital_fkey"
            columns: ["id_edital"]
            isOneToOne: false
            referencedRelation: "aca_edital_docente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_edital_docente_inscricao_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_evento: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          id_entidade: string
          modificado_em: string | null
          modificado_por: string | null
          nome_evento: string
          sobrescrever_calendario: boolean | null
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          id_entidade: string
          modificado_em?: string | null
          modificado_por?: string | null
          nome_evento: string
          sobrescrever_calendario?: boolean | null
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          id_entidade?: string
          modificado_em?: string | null
          modificado_por?: string | null
          nome_evento?: string
          sobrescrever_calendario?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "aca_evento_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_evento_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_feriado: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          data: string
          id: string
          id_entidade: string | null
          is_global: boolean | null
          modificado_em: string | null
          modificado_por: string | null
          nome: string
          recorrente_anual: boolean | null
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          data: string
          id?: string
          id_entidade?: string | null
          is_global?: boolean | null
          modificado_em?: string | null
          modificado_por?: string | null
          nome: string
          recorrente_anual?: boolean | null
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          data?: string
          id?: string
          id_entidade?: string | null
          is_global?: boolean | null
          modificado_em?: string | null
          modificado_por?: string | null
          nome?: string
          recorrente_anual?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "aca_feriado_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_feriado_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_form_config: {
        Row: {
          altura: number | null
          area_id: string | null
          bloco_nome: string
          bloco_ordem: number | null
          depende_de_pergunta_id: string | null
          escopo: string
          id: string
          id_entidade: string | null
          largura: Database["public"]["Enums"]["tipo_largura"] | null
          obrigatorio: boolean | null
          pergunta_id: string
          pergunta_ordem: number | null
          programa_id: string | null
          resposta_esperada: string | null
          tipo_cand: Database["public"]["Enums"]["tipo_candidatura"]
          tipo_proc: Database["public"]["Enums"]["tipo_processo"]
        }
        Insert: {
          altura?: number | null
          area_id?: string | null
          bloco_nome?: string
          bloco_ordem?: number | null
          depende_de_pergunta_id?: string | null
          escopo: string
          id?: string
          id_entidade?: string | null
          largura?: Database["public"]["Enums"]["tipo_largura"] | null
          obrigatorio?: boolean | null
          pergunta_id: string
          pergunta_ordem?: number | null
          programa_id?: string | null
          resposta_esperada?: string | null
          tipo_cand?: Database["public"]["Enums"]["tipo_candidatura"]
          tipo_proc?: Database["public"]["Enums"]["tipo_processo"]
        }
        Update: {
          altura?: number | null
          area_id?: string | null
          bloco_nome?: string
          bloco_ordem?: number | null
          depende_de_pergunta_id?: string | null
          escopo?: string
          id?: string
          id_entidade?: string | null
          largura?: Database["public"]["Enums"]["tipo_largura"] | null
          obrigatorio?: boolean | null
          pergunta_id?: string
          pergunta_ordem?: number | null
          programa_id?: string | null
          resposta_esperada?: string | null
          tipo_cand?: Database["public"]["Enums"]["tipo_candidatura"]
          tipo_proc?: Database["public"]["Enums"]["tipo_processo"]
        }
        Relationships: [
          {
            foreignKeyName: "aca_form_config_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "aca_area"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_form_config_depende_de_pergunta_id_fkey"
            columns: ["depende_de_pergunta_id"]
            isOneToOne: false
            referencedRelation: "cmct_pergunta_form"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_form_config_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_form_config_pergunta_id_fkey"
            columns: ["pergunta_id"]
            isOneToOne: false
            referencedRelation: "cmct_pergunta_form"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_form_config_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "aca_programa"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_matricula: {
        Row: {
          arquivo_declaracao_matricula: string | null
          criado_em: string | null
          criado_por: string | null
          declaracao_matricula: boolean
          id: string
          id_entidade: string
          id_pedido: string | null
          id_programa: string
          id_usuario: string
          modificado_em: string | null
          modificado_por: string | null
          status: string
        }
        Insert: {
          arquivo_declaracao_matricula?: string | null
          criado_em?: string | null
          criado_por?: string | null
          declaracao_matricula?: boolean
          id?: string
          id_entidade: string
          id_pedido?: string | null
          id_programa: string
          id_usuario: string
          modificado_em?: string | null
          modificado_por?: string | null
          status?: string
        }
        Update: {
          arquivo_declaracao_matricula?: string | null
          criado_em?: string | null
          criado_por?: string | null
          declaracao_matricula?: boolean
          id?: string
          id_entidade?: string
          id_pedido?: string | null
          id_programa?: string
          id_usuario?: string
          modificado_em?: string | null
          modificado_por?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "aca_matricula_arquivo_fkey"
            columns: ["arquivo_declaracao_matricula"]
            isOneToOne: false
            referencedRelation: "global_arquivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_matricula_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_matricula_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_matricula_id_pedido_fkey"
            columns: ["id_pedido"]
            isOneToOne: false
            referencedRelation: "com_pedido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_matricula_id_programa_fkey"
            columns: ["id_programa"]
            isOneToOne: false
            referencedRelation: "aca_programa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_matricula_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_matricula_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_modulo: {
        Row: {
          carga_horaria: number | null
          criado_em: string | null
          criado_por: string | null
          descricao: string | null
          id: string
          id_entidade: string
          modificado_em: string | null
          modificado_por: string | null
          nome_modulo: string
        }
        Insert: {
          carga_horaria?: number | null
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          id_entidade: string
          modificado_em?: string | null
          modificado_por?: string | null
          nome_modulo: string
        }
        Update: {
          carga_horaria?: number | null
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          id_entidade?: string
          modificado_em?: string | null
          modificado_por?: string | null
          nome_modulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "aca_modulo_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_modulo_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_modulo_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_modulo_componente: {
        Row: {
          carga_horaria: number | null
          criado_em: string | null
          criado_por: string | null
          id: string
          id_componente: string
          id_entidade: string
          id_modulo: string
          modificado_em: string | null
          modificado_por: string | null
          obrigatorio: boolean | null
          ordem: number | null
        }
        Insert: {
          carga_horaria?: number | null
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_componente: string
          id_entidade: string
          id_modulo: string
          modificado_em?: string | null
          modificado_por?: string | null
          obrigatorio?: boolean | null
          ordem?: number | null
        }
        Update: {
          carga_horaria?: number | null
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_componente?: string
          id_entidade?: string
          id_modulo?: string
          modificado_em?: string | null
          modificado_por?: string | null
          obrigatorio?: boolean | null
          ordem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aca_modulo_componente_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_modulo_componente_id_componente_fkey"
            columns: ["id_componente"]
            isOneToOne: false
            referencedRelation: "aca_componente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_modulo_componente_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_modulo_componente_id_modulo_fkey"
            columns: ["id_modulo"]
            isOneToOne: false
            referencedRelation: "aca_modulo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_modulo_componente_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_plano_de_aula: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          ementa: string | null
          id: string
          id_componente: string | null
          id_entidade: string
          id_modulo: string | null
          modificado_em: string | null
          modificado_por: string | null
          titulo_plano: string
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          ementa?: string | null
          id?: string
          id_componente?: string | null
          id_entidade: string
          id_modulo?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          titulo_plano: string
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          ementa?: string | null
          id?: string
          id_componente?: string | null
          id_entidade?: string
          id_modulo?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          titulo_plano?: string
        }
        Relationships: [
          {
            foreignKeyName: "aca_plano_de_aula_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_plano_de_aula_id_componente_fkey"
            columns: ["id_componente"]
            isOneToOne: false
            referencedRelation: "aca_componente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_plano_de_aula_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_plano_de_aula_id_modulo_fkey"
            columns: ["id_modulo"]
            isOneToOne: false
            referencedRelation: "aca_modulo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_plano_de_aula_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_processo_seletivo: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          data_fim: string
          data_inicio: string
          id: string
          id_entidade: string
          id_programa: string
          matricula_fim: string | null
          matricula_inicio: string | null
          modificado_em: string | null
          modificado_por: string | null
          nome_processo: string
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          data_fim: string
          data_inicio: string
          id?: string
          id_entidade: string
          id_programa: string
          matricula_fim?: string | null
          matricula_inicio?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          nome_processo: string
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          data_fim?: string
          data_inicio?: string
          id?: string
          id_entidade?: string
          id_programa?: string
          matricula_fim?: string | null
          matricula_inicio?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          nome_processo?: string
        }
        Relationships: [
          {
            foreignKeyName: "aca_processo_seletivo_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_processo_seletivo_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_processo_seletivo_id_programa_fkey"
            columns: ["id_programa"]
            isOneToOne: false
            referencedRelation: "aca_programa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_processo_seletivo_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_processo_seletivo_inscricoes: {
        Row: {
          criado_em: string
          criado_por: string | null
          envio_email: boolean
          id: string
          id_entidade: string
          id_processo: string
          id_programa: string
          id_usuario: string
          modificado_em: string
          modificado_por: string | null
          status_candidatura: string
          status_dados: string
          status_documentacao: string
          tipo_candidatura: Database["public"]["Enums"]["tipo_candidatura"]
          tipo_processo: Database["public"]["Enums"]["tipo_processo"]
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          envio_email?: boolean
          id?: string
          id_entidade: string
          id_processo: string
          id_programa: string
          id_usuario: string
          modificado_em?: string
          modificado_por?: string | null
          status_candidatura?: string
          status_dados?: string
          status_documentacao?: string
          tipo_candidatura: Database["public"]["Enums"]["tipo_candidatura"]
          tipo_processo: Database["public"]["Enums"]["tipo_processo"]
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          envio_email?: boolean
          id?: string
          id_entidade?: string
          id_processo?: string
          id_programa?: string
          id_usuario?: string
          modificado_em?: string
          modificado_por?: string | null
          status_candidatura?: string
          status_dados?: string
          status_documentacao?: string
          tipo_candidatura?: Database["public"]["Enums"]["tipo_candidatura"]
          tipo_processo?: Database["public"]["Enums"]["tipo_processo"]
        }
        Relationships: [
          {
            foreignKeyName: "aca_processo_seletivo_inscricoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_processo_seletivo_inscricoes_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_processo_seletivo_inscricoes_id_processo_fkey"
            columns: ["id_processo"]
            isOneToOne: false
            referencedRelation: "aca_processo_seletivo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_processo_seletivo_inscricoes_id_programa_fkey"
            columns: ["id_programa"]
            isOneToOne: false
            referencedRelation: "aca_programa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_processo_seletivo_inscricoes_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_processo_seletivo_inscricoes_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_programa: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          descricao: string | null
          exige_processo_seletivo: boolean
          gratuito: boolean
          id: string
          id_area: string | null
          id_curso: string | null
          id_entidade: string
          matricula_fim: string | null
          matricula_inicio: string | null
          modificado_em: string | null
          modificado_por: string | null
          processo_seletivo_fim: string | null
          processo_seletivo_inicio: string | null
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          exige_processo_seletivo?: boolean
          gratuito?: boolean
          id?: string
          id_area?: string | null
          id_curso?: string | null
          id_entidade: string
          matricula_fim?: string | null
          matricula_inicio?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          processo_seletivo_fim?: string | null
          processo_seletivo_inicio?: string | null
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          exige_processo_seletivo?: boolean
          gratuito?: boolean
          id?: string
          id_area?: string | null
          id_curso?: string | null
          id_entidade?: string
          matricula_fim?: string | null
          matricula_inicio?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          processo_seletivo_fim?: string | null
          processo_seletivo_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aca_programa_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_programa_id_area_fkey"
            columns: ["id_area"]
            isOneToOne: false
            referencedRelation: "aca_area"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_programa_id_curso_fkey"
            columns: ["id_curso"]
            isOneToOne: false
            referencedRelation: "aca_curso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_programa_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_programa_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_ref_plano_de_aula: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          descricao: string | null
          id: string
          id_entidade: string
          id_plano_aula: string | null
          link: string | null
          modificado_em: string | null
          modificado_por: string | null
          titulo: string | null
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          id_entidade: string
          id_plano_aula?: string | null
          link?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          titulo?: string | null
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          id_entidade?: string
          id_plano_aula?: string | null
          link?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aca_ref_plano_de_aula_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_ref_plano_de_aula_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_ref_plano_de_aula_id_plano_aula_fkey"
            columns: ["id_plano_aula"]
            isOneToOne: false
            referencedRelation: "aca_plano_de_aula"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_ref_plano_de_aula_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      aca_resposta_form: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          id: string
          id_arquivo: string | null
          id_entidade: string
          id_pergunta: string
          id_user_expandido: string
          modificado_em: string | null
          modificado_por: string | null
          resposta: string | null
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_arquivo?: string | null
          id_entidade: string
          id_pergunta: string
          id_user_expandido: string
          modificado_em?: string | null
          modificado_por?: string | null
          resposta?: string | null
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_arquivo?: string | null
          id_entidade?: string
          id_pergunta?: string
          id_user_expandido?: string
          modificado_em?: string | null
          modificado_por?: string | null
          resposta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aca_resposta_form_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_resposta_form_id_arquivo_fkey"
            columns: ["id_arquivo"]
            isOneToOne: false
            referencedRelation: "global_arquivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_resposta_form_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_resposta_form_id_pergunta_fkey"
            columns: ["id_pergunta"]
            isOneToOne: false
            referencedRelation: "cmct_pergunta_form"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_resposta_form_id_user_expandido_fkey"
            columns: ["id_user_expandido"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aca_resposta_form_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      acd_horario: {
        Row: {
          ativo: boolean
          criado_em: string
          hora_fim: string
          hora_ini: string
          id: string
          id_entidade: string
          indice: number
          is_intervalo: boolean
          nome_turno: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          hora_fim: string
          hora_ini: string
          id?: string
          id_entidade: string
          indice: number
          is_intervalo?: boolean
          nome_turno: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          hora_fim?: string
          hora_ini?: string
          id?: string
          id_entidade?: string
          indice?: number
          is_intervalo?: boolean
          nome_turno?: string
        }
        Relationships: [
          {
            foreignKeyName: "acd_horario_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      acd_reserva_sala: {
        Row: {
          criado_em: string
          criado_por: string | null
          data: string
          id: string
          id_aula: string | null
          id_entidade: string
          id_evento: string | null
          id_horario: string
          id_programa: string | null
          id_sala: string
          modificado_em: string | null
          modificado_por: string | null
          observacoes: string | null
          reserva_escopo: string | null
          reserva_grupo_id: string | null
          status: string
          tipo: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          data: string
          id?: string
          id_aula?: string | null
          id_entidade: string
          id_evento?: string | null
          id_horario: string
          id_programa?: string | null
          id_sala: string
          modificado_em?: string | null
          modificado_por?: string | null
          observacoes?: string | null
          reserva_escopo?: string | null
          reserva_grupo_id?: string | null
          status?: string
          tipo: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          data?: string
          id?: string
          id_aula?: string | null
          id_entidade?: string
          id_evento?: string | null
          id_horario?: string
          id_programa?: string | null
          id_sala?: string
          modificado_em?: string | null
          modificado_por?: string | null
          observacoes?: string | null
          reserva_escopo?: string | null
          reserva_grupo_id?: string | null
          status?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "acd_reserva_sala_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acd_reserva_sala_id_aula_fkey"
            columns: ["id_aula"]
            isOneToOne: false
            referencedRelation: "aca_calendario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acd_reserva_sala_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acd_reserva_sala_id_evento_fkey"
            columns: ["id_evento"]
            isOneToOne: false
            referencedRelation: "aca_evento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acd_reserva_sala_id_horario_fkey"
            columns: ["id_horario"]
            isOneToOne: false
            referencedRelation: "acd_horario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acd_reserva_sala_id_programa_fkey"
            columns: ["id_programa"]
            isOneToOne: false
            referencedRelation: "aca_programa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acd_reserva_sala_id_sala_fkey"
            columns: ["id_sala"]
            isOneToOne: false
            referencedRelation: "acd_sala"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acd_reserva_sala_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      acd_sala: {
        Row: {
          ativo: boolean
          capacidade: number | null
          cor: string
          criado_em: string
          criado_por: string | null
          id: string
          id_entidade: string
          modificado_em: string | null
          modificado_por: string | null
          nome: string
        }
        Insert: {
          ativo?: boolean
          capacidade?: number | null
          cor?: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          id_entidade: string
          modificado_em?: string | null
          modificado_por?: string | null
          nome: string
        }
        Update: {
          ativo?: boolean
          capacidade?: number | null
          cor?: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          id_entidade?: string
          modificado_em?: string | null
          modificado_por?: string | null
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "acd_sala_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acd_sala_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acd_sala_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      app_permissoes: {
        Row: {
          botao: string | null
          criado_em: string | null
          escopo: string
          id: string
          id_entidade: string | null
          id_papel: string | null
          id_produto: string | null
          ilha: string
          modificado_em: string | null
          permitido: boolean
          rota: string | null
        }
        Insert: {
          botao?: string | null
          criado_em?: string | null
          escopo: string
          id?: string
          id_entidade?: string | null
          id_papel?: string | null
          id_produto?: string | null
          ilha: string
          modificado_em?: string | null
          permitido?: boolean
          rota?: string | null
        }
        Update: {
          botao?: string | null
          criado_em?: string | null
          escopo?: string
          id?: string
          id_entidade?: string | null
          id_papel?: string | null
          id_produto?: string | null
          ilha?: string
          modificado_em?: string | null
          permitido?: boolean
          rota?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_permissoes_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_permissoes_id_papel_fkey"
            columns: ["id_papel"]
            isOneToOne: false
            referencedRelation: "user_papeis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_permissoes_id_produto_fkey"
            columns: ["id_produto"]
            isOneToOne: false
            referencedRelation: "produto"
            referencedColumns: ["id"]
          },
        ]
      }
      cmct_pergunta_form: {
        Row: {
          created_at: string | null
          global: boolean
          id: string
          id_entidade: string | null
          label: string
          nome_interno: string
          opcoes: Json | null
          placeholder: string | null
          tipo_pergunta: string
        }
        Insert: {
          created_at?: string | null
          global?: boolean
          id?: string
          id_entidade?: string | null
          label: string
          nome_interno: string
          opcoes?: Json | null
          placeholder?: string | null
          tipo_pergunta: string
        }
        Update: {
          created_at?: string | null
          global?: boolean
          id?: string
          id_entidade?: string | null
          label?: string
          nome_interno?: string
          opcoes?: Json | null
          placeholder?: string | null
          tipo_pergunta?: string
        }
        Relationships: [
          {
            foreignKeyName: "cmct_pergunta_form_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      com_config_gateway: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          gateway_name: string
          id: string
          id_entidade: string
          is_sandbox: boolean
          modificado_em: string | null
          modificado_por: string | null
          stripe_account_id: string | null
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          gateway_name?: string
          id?: string
          id_entidade: string
          is_sandbox?: boolean
          modificado_em?: string | null
          modificado_por?: string | null
          stripe_account_id?: string | null
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          gateway_name?: string
          id?: string
          id_entidade?: string
          is_sandbox?: boolean
          modificado_em?: string | null
          modificado_por?: string | null
          stripe_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "com_config_gateway_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "com_config_gateway_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: true
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "com_config_gateway_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      com_oferta: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          disponivel_a_partir_de: string | null
          disponivel_ate: string | null
          exige_elegibilidade: boolean
          id: string
          id_entidade: string
          id_produto: string
          is_ativa: boolean
          modificado_em: string | null
          modificado_por: string | null
          nome_curto: string | null
          parcelamento_maximo: number
          recorrencia_intervalo: number | null
          recorrencia_periodo: string | null
          slug: string
          tipo_pagamento: Database["public"]["Enums"]["tipo_pagamento_oferta"]
          valor_centavos: number
          visibilidade: Database["public"]["Enums"]["tipo_visibilidade"]
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          disponivel_a_partir_de?: string | null
          disponivel_ate?: string | null
          exige_elegibilidade?: boolean
          id?: string
          id_entidade: string
          id_produto: string
          is_ativa?: boolean
          modificado_em?: string | null
          modificado_por?: string | null
          nome_curto?: string | null
          parcelamento_maximo?: number
          recorrencia_intervalo?: number | null
          recorrencia_periodo?: string | null
          slug: string
          tipo_pagamento?: Database["public"]["Enums"]["tipo_pagamento_oferta"]
          valor_centavos?: number
          visibilidade?: Database["public"]["Enums"]["tipo_visibilidade"]
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          disponivel_a_partir_de?: string | null
          disponivel_ate?: string | null
          exige_elegibilidade?: boolean
          id?: string
          id_entidade?: string
          id_produto?: string
          is_ativa?: boolean
          modificado_em?: string | null
          modificado_por?: string | null
          nome_curto?: string | null
          parcelamento_maximo?: number
          recorrencia_intervalo?: number | null
          recorrencia_periodo?: string | null
          slug?: string
          tipo_pagamento?: Database["public"]["Enums"]["tipo_pagamento_oferta"]
          valor_centavos?: number
          visibilidade?: Database["public"]["Enums"]["tipo_visibilidade"]
        }
        Relationships: [
          {
            foreignKeyName: "com_oferta_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "com_oferta_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "com_oferta_id_produto_fkey"
            columns: ["id_produto"]
            isOneToOne: false
            referencedRelation: "com_produto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "com_oferta_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      com_oferta_elegivel: {
        Row: {
          cpf: string | null
          criado_em: string | null
          criado_por: string | null
          email: string | null
          expirado_em: string | null
          id: string
          id_entidade: string
          id_oferta: string
          utilizado_em: string | null
        }
        Insert: {
          cpf?: string | null
          criado_em?: string | null
          criado_por?: string | null
          email?: string | null
          expirado_em?: string | null
          id?: string
          id_entidade: string
          id_oferta: string
          utilizado_em?: string | null
        }
        Update: {
          cpf?: string | null
          criado_em?: string | null
          criado_por?: string | null
          email?: string | null
          expirado_em?: string | null
          id?: string
          id_entidade?: string
          id_oferta?: string
          utilizado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "com_oferta_elegivel_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "com_oferta_elegivel_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "com_oferta_elegivel_id_oferta_fkey"
            columns: ["id_oferta"]
            isOneToOne: false
            referencedRelation: "com_oferta"
            referencedColumns: ["id"]
          },
        ]
      }
      com_pedido: {
        Row: {
          cancelado_em: string | null
          criado_em: string | null
          criado_por: string | null
          id: string
          id_entidade: string
          id_inscricao: string | null
          id_oferta: string
          id_usuario: string
          modificado_em: string | null
          modificado_por: string | null
          pago_em: string | null
          status: Database["public"]["Enums"]["tipo_status_pedido"]
          stripe_checkout_id: string | null
          stripe_payment_intent_id: string | null
          valor_pago_centavos: number
        }
        Insert: {
          cancelado_em?: string | null
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_entidade: string
          id_inscricao?: string | null
          id_oferta: string
          id_usuario: string
          modificado_em?: string | null
          modificado_por?: string | null
          pago_em?: string | null
          status?: Database["public"]["Enums"]["tipo_status_pedido"]
          stripe_checkout_id?: string | null
          stripe_payment_intent_id?: string | null
          valor_pago_centavos?: number
        }
        Update: {
          cancelado_em?: string | null
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_entidade?: string
          id_inscricao?: string | null
          id_oferta?: string
          id_usuario?: string
          modificado_em?: string | null
          modificado_por?: string | null
          pago_em?: string | null
          status?: Database["public"]["Enums"]["tipo_status_pedido"]
          stripe_checkout_id?: string | null
          stripe_payment_intent_id?: string | null
          valor_pago_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "com_pedido_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "com_pedido_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "com_pedido_id_inscricao_fkey"
            columns: ["id_inscricao"]
            isOneToOne: false
            referencedRelation: "aca_processo_seletivo_inscricoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "com_pedido_id_oferta_fkey"
            columns: ["id_oferta"]
            isOneToOne: false
            referencedRelation: "com_oferta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "com_pedido_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "com_pedido_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      com_produto: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          descricao: string | null
          id: string
          id_entidade: string
          id_programa: string
          is_ativo: boolean
          modificado_em: string | null
          modificado_por: string | null
          nome_produto: string
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          id_entidade: string
          id_programa: string
          is_ativo?: boolean
          modificado_em?: string | null
          modificado_por?: string | null
          nome_produto: string
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          id_entidade?: string
          id_programa?: string
          is_ativo?: boolean
          modificado_em?: string | null
          modificado_por?: string | null
          nome_produto?: string
        }
        Relationships: [
          {
            foreignKeyName: "com_produto_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "com_produto_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "com_produto_id_programa_fkey"
            columns: ["id_programa"]
            isOneToOne: false
            referencedRelation: "aca_programa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "com_produto_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa: {
        Row: {
          cor_principal: string | null
          cor_principal_hover: string | null
          cor_secundaria: string | null
          cor_secundaria_hover: string | null
          criado_em: string | null
          criado_por: string | null
          id: string
          logo_aberto: string | null
          logo_fechado: string | null
          modificado_em: string | null
          modificado_por: string | null
          nome: string
          url: string | null
        }
        Insert: {
          cor_principal?: string | null
          cor_principal_hover?: string | null
          cor_secundaria?: string | null
          cor_secundaria_hover?: string | null
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          logo_aberto?: string | null
          logo_fechado?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          nome: string
          url?: string | null
        }
        Update: {
          cor_principal?: string | null
          cor_principal_hover?: string | null
          cor_secundaria?: string | null
          cor_secundaria_hover?: string | null
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          logo_aberto?: string | null
          logo_fechado?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          nome?: string
          url?: string | null
        }
        Relationships: []
      }
      entidade_produto: {
        Row: {
          ativo: boolean | null
          configuracoes: Json | null
          criado_em: string | null
          id: string
          id_entidade: string
          id_produto: string
          url_acesso: string | null
        }
        Insert: {
          ativo?: boolean | null
          configuracoes?: Json | null
          criado_em?: string | null
          id?: string
          id_entidade: string
          id_produto: string
          url_acesso?: string | null
        }
        Update: {
          ativo?: boolean | null
          configuracoes?: Json | null
          criado_em?: string | null
          id?: string
          id_entidade?: string
          id_produto?: string
          url_acesso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entidade_produto_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entidade_produto_id_produto_fkey"
            columns: ["id_produto"]
            isOneToOne: false
            referencedRelation: "produto"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_categorias: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          id: string
          id_entidade: string | null
          id_pai: string | null
          nivel: number | null
          nome: string
          ordem: number | null
          tipo: string
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_entidade?: string | null
          id_pai?: string | null
          nivel?: number | null
          nome: string
          ordem?: number | null
          tipo: string
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_entidade?: string | null
          id_pai?: string | null
          nivel?: number | null
          nome?: string
          ordem?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_categorias_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_categorias_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_contas: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          id: string
          id_entidade: string | null
          id_pai: string | null
          nivel: number | null
          nome: string
          ordem: number | null
          saldo_inicial: number | null
          tipo: Database["public"]["Enums"]["fin_tipo_conta"] | null
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_entidade?: string | null
          id_pai?: string | null
          nivel?: number | null
          nome: string
          ordem?: number | null
          saldo_inicial?: number | null
          tipo?: Database["public"]["Enums"]["fin_tipo_conta"] | null
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_entidade?: string | null
          id_pai?: string | null
          nivel?: number | null
          nome?: string
          ordem?: number | null
          saldo_inicial?: number | null
          tipo?: Database["public"]["Enums"]["fin_tipo_conta"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_contas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_contas_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_lancamentos: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          data: string
          descricao: string | null
          id: string
          id_categoria: string | null
          id_conta: string | null
          id_entidade: string | null
          id_grupo_parcelas: string | null
          id_lancamento_pai: string | null
          id_local: string | null
          parcela_n: number | null
          parcelado: boolean
          qtd_parcelas: number | null
          tipo: string
          valor: number
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          data?: string
          descricao?: string | null
          id?: string
          id_categoria?: string | null
          id_conta?: string | null
          id_entidade?: string | null
          id_grupo_parcelas?: string | null
          id_lancamento_pai?: string | null
          id_local?: string | null
          parcela_n?: number | null
          parcelado?: boolean
          qtd_parcelas?: number | null
          tipo: string
          valor: number
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          data?: string
          descricao?: string | null
          id?: string
          id_categoria?: string | null
          id_conta?: string | null
          id_entidade?: string | null
          id_grupo_parcelas?: string | null
          id_lancamento_pai?: string | null
          id_local?: string | null
          parcela_n?: number | null
          parcelado?: boolean
          qtd_parcelas?: number | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_lancamentos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_lancamentos_id_categoria_fkey"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "fin_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_lancamentos_id_conta_fkey"
            columns: ["id_conta"]
            isOneToOne: false
            referencedRelation: "fin_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_lancamentos_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_lancamentos_id_local_fkey"
            columns: ["id_local"]
            isOneToOne: false
            referencedRelation: "fin_locais"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_locais: {
        Row: {
          cep: string | null
          cidade: string | null
          complemento: string | null
          criado_em: string | null
          criado_por: string | null
          endereco: string | null
          estado: string | null
          id: string
          id_entidade: string | null
          likert: number | null
          modificado_em: string | null
          modificado_por: string | null
          nome: string
          numero: string | null
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          criado_em?: string | null
          criado_por?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          id_entidade?: string | null
          likert?: number | null
          modificado_em?: string | null
          modificado_por?: string | null
          nome: string
          numero?: string | null
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          criado_em?: string | null
          criado_por?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          id_entidade?: string | null
          likert?: number | null
          modificado_em?: string | null
          modificado_por?: string | null
          nome?: string
          numero?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_locais_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_locais_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_locais_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      glb_arquivo: {
        Row: {
          bucket: string
          criado_em: string | null
          criado_por: string | null
          escopo: string | null
          id: string
          id_entidade: string
          mimetype: string | null
          modificado_em: string | null
          modificado_por: string | null
          nome_original: string | null
          path: string
          tamanho_bytes: number | null
        }
        Insert: {
          bucket: string
          criado_em?: string | null
          criado_por?: string | null
          escopo?: string | null
          id?: string
          id_entidade: string
          mimetype?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          nome_original?: string | null
          path: string
          tamanho_bytes?: number | null
        }
        Update: {
          bucket?: string
          criado_em?: string | null
          criado_por?: string | null
          escopo?: string | null
          id?: string
          id_entidade?: string
          mimetype?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          nome_original?: string | null
          path?: string
          tamanho_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "glb_arquivo_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "glb_arquivo_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "glb_arquivo_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      global_arquivos: {
        Row: {
          bucket: string | null
          criado_at: string | null
          criado_por: string | null
          escopo: string | null
          id: string
          id_entidade: string | null
          mimetype: string | null
          nome_original: string | null
          path: string
          tamanho_bytes: number | null
          updated_at: string | null
        }
        Insert: {
          bucket?: string | null
          criado_at?: string | null
          criado_por?: string | null
          escopo?: string | null
          id?: string
          id_entidade?: string | null
          mimetype?: string | null
          nome_original?: string | null
          path: string
          tamanho_bytes?: number | null
          updated_at?: string | null
        }
        Update: {
          bucket?: string | null
          criado_at?: string | null
          criado_por?: string | null
          escopo?: string | null
          id?: string
          id_entidade?: string | null
          mimetype?: string | null
          nome_original?: string | null
          path?: string
          tamanho_bytes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "global_arquivos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "global_arquivos_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          id_entidade: string | null
          nome: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          id_entidade?: string | null
          nome?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          id_entidade?: string | null
          nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_atividade: {
        Row: {
          criado_em: string | null
          id: string
          id_arquivo_referencia: string | null
          id_conteudo: string
          modificado_em: string | null
          tipo_submissao: Database["public"]["Enums"]["lms_tipo_submissao_atv"]
        }
        Insert: {
          criado_em?: string | null
          id?: string
          id_arquivo_referencia?: string | null
          id_conteudo: string
          modificado_em?: string | null
          tipo_submissao?: Database["public"]["Enums"]["lms_tipo_submissao_atv"]
        }
        Update: {
          criado_em?: string | null
          id?: string
          id_arquivo_referencia?: string | null
          id_conteudo?: string
          modificado_em?: string | null
          tipo_submissao?: Database["public"]["Enums"]["lms_tipo_submissao_atv"]
        }
        Relationships: [
          {
            foreignKeyName: "lms_atividade_id_arquivo_referencia_fkey"
            columns: ["id_arquivo_referencia"]
            isOneToOne: false
            referencedRelation: "global_arquivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_atividade_id_conteudo_fkey"
            columns: ["id_conteudo"]
            isOneToOne: true
            referencedRelation: "lms_conteudo"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_avaliacao: {
        Row: {
          ambiente_seguro: boolean
          autoavaliacao: boolean
          criado_em: string | null
          descricao: string | null
          id: string
          id_arquivo_referencia: string | null
          id_conteudo: string
          modificado_em: string | null
          nome: string
          ordem_perguntas: string | null
        }
        Insert: {
          ambiente_seguro?: boolean
          autoavaliacao?: boolean
          criado_em?: string | null
          descricao?: string | null
          id?: string
          id_arquivo_referencia?: string | null
          id_conteudo: string
          modificado_em?: string | null
          nome: string
          ordem_perguntas?: string | null
        }
        Update: {
          ambiente_seguro?: boolean
          autoavaliacao?: boolean
          criado_em?: string | null
          descricao?: string | null
          id?: string
          id_arquivo_referencia?: string | null
          id_conteudo?: string
          modificado_em?: string | null
          nome?: string
          ordem_perguntas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_avaliacao_id_arquivo_referencia_fkey"
            columns: ["id_arquivo_referencia"]
            isOneToOne: false
            referencedRelation: "global_arquivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_avaliacao_id_conteudo_fkey"
            columns: ["id_conteudo"]
            isOneToOne: true
            referencedRelation: "lms_conteudo"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_bloco: {
        Row: {
          ativo: boolean | null
          cor_ident: string | null
          criado_em: string | null
          criado_por: string | null
          descricao: string | null
          id: string
          id_entidade: string
          modificado_em: string | null
          modificado_por: string | null
          titulo: string
        }
        Insert: {
          ativo?: boolean | null
          cor_ident?: string | null
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          id_entidade: string
          modificado_em?: string | null
          modificado_por?: string | null
          titulo: string
        }
        Update: {
          ativo?: boolean | null
          cor_ident?: string | null
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          id_entidade?: string
          modificado_em?: string | null
          modificado_por?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_bloco_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_bloco_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_bloco_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_conteudo: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          criado_por: string | null
          descricao: string | null
          id: string
          id_arquivo: string | null
          id_entidade: string
          modificado_em: string | null
          modificado_por: string | null
          ordem: number | null
          tipo: Database["public"]["Enums"]["lms_tipo_item"]
          titulo: string
          url: string | null
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          id_arquivo?: string | null
          id_entidade: string
          modificado_em?: string | null
          modificado_por?: string | null
          ordem?: number | null
          tipo: Database["public"]["Enums"]["lms_tipo_item"]
          titulo: string
          url?: string | null
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          id?: string
          id_arquivo?: string | null
          id_entidade?: string
          modificado_em?: string | null
          modificado_por?: string | null
          ordem?: number | null
          tipo?: Database["public"]["Enums"]["lms_tipo_item"]
          titulo?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_conteudo_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_conteudo_id_arquivo_fkey"
            columns: ["id_arquivo"]
            isOneToOne: false
            referencedRelation: "global_arquivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_conteudo_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_conteudo_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_conteudo_bloco: {
        Row: {
          criado_em: string | null
          id: string
          id_bloco: string
          id_conteudo: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          id_bloco: string
          id_conteudo: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          id_bloco?: string
          id_conteudo?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_conteudo_bloco_id_bloco_fkey"
            columns: ["id_bloco"]
            isOneToOne: false
            referencedRelation: "lms_bloco"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_conteudo_bloco_id_conteudo_fkey"
            columns: ["id_conteudo"]
            isOneToOne: false
            referencedRelation: "lms_conteudo"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_conteudo_operacional: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          criado_por: string | null
          data_disponivel: string | null
          data_entrega_limite: string | null
          destaque: boolean | null
          duracao_minutos: number | null
          id: string
          id_calendario: string | null
          id_ciclo: string | null
          id_conteudo: string
          id_distribuicao_origem: string | null
          id_entidade: string
          id_programa: string | null
          modificado_em: string | null
          modificado_por: string | null
          pontuacao_maxima: number | null
          tentativas_permitidas: number | null
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          criado_por?: string | null
          data_disponivel?: string | null
          data_entrega_limite?: string | null
          destaque?: boolean | null
          duracao_minutos?: number | null
          id?: string
          id_calendario?: string | null
          id_ciclo?: string | null
          id_conteudo: string
          id_distribuicao_origem?: string | null
          id_entidade: string
          id_programa?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          pontuacao_maxima?: number | null
          tentativas_permitidas?: number | null
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          criado_por?: string | null
          data_disponivel?: string | null
          data_entrega_limite?: string | null
          destaque?: boolean | null
          duracao_minutos?: number | null
          id?: string
          id_calendario?: string | null
          id_ciclo?: string | null
          id_conteudo?: string
          id_distribuicao_origem?: string | null
          id_entidade?: string
          id_programa?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          pontuacao_maxima?: number | null
          tentativas_permitidas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_conteudo_operacional_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_conteudo_operacional_id_calendario_fkey"
            columns: ["id_calendario"]
            isOneToOne: false
            referencedRelation: "aca_calendario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_conteudo_operacional_id_ciclo_fkey"
            columns: ["id_ciclo"]
            isOneToOne: false
            referencedRelation: "aca_ciclo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_conteudo_operacional_id_conteudo_fkey"
            columns: ["id_conteudo"]
            isOneToOne: false
            referencedRelation: "lms_conteudo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_conteudo_operacional_id_distribuicao_origem_fkey"
            columns: ["id_distribuicao_origem"]
            isOneToOne: false
            referencedRelation: "lms_distribuicao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_conteudo_operacional_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_conteudo_operacional_id_programa_fkey"
            columns: ["id_programa"]
            isOneToOne: false
            referencedRelation: "aca_programa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_conteudo_operacional_modificado_por_fkey"
            columns: ["modificado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_distribuicao: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          criado_por: string | null
          id: string
          id_area: string | null
          id_componente: string | null
          id_conteudo: string
          id_curso: string | null
          id_entidade: string
          id_modulo: string | null
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_area?: string | null
          id_componente?: string | null
          id_conteudo: string
          id_curso?: string | null
          id_entidade: string
          id_modulo?: string | null
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          id_area?: string | null
          id_componente?: string | null
          id_conteudo?: string
          id_curso?: string | null
          id_entidade?: string
          id_modulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_distribuicao_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_distribuicao_id_area_fkey"
            columns: ["id_area"]
            isOneToOne: false
            referencedRelation: "aca_area"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_distribuicao_id_componente_fkey"
            columns: ["id_componente"]
            isOneToOne: false
            referencedRelation: "aca_componente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_distribuicao_id_conteudo_fkey"
            columns: ["id_conteudo"]
            isOneToOne: false
            referencedRelation: "lms_conteudo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_distribuicao_id_curso_fkey"
            columns: ["id_curso"]
            isOneToOne: false
            referencedRelation: "aca_curso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_distribuicao_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_distribuicao_id_modulo_fkey"
            columns: ["id_modulo"]
            isOneToOne: false
            referencedRelation: "aca_modulo"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_pergunta: {
        Row: {
          criado_em: string | null
          enunciado: string
          id: string
          id_arquivo: string | null
          id_avaliacao: string
          modificado_em: string | null
          obrigatoria: boolean | null
          ordem: number | null
          pontuacao: number
          tipo: Database["public"]["Enums"]["lms_tipo_pergunta"]
        }
        Insert: {
          criado_em?: string | null
          enunciado: string
          id?: string
          id_arquivo?: string | null
          id_avaliacao: string
          modificado_em?: string | null
          obrigatoria?: boolean | null
          ordem?: number | null
          pontuacao?: number
          tipo: Database["public"]["Enums"]["lms_tipo_pergunta"]
        }
        Update: {
          criado_em?: string | null
          enunciado?: string
          id?: string
          id_arquivo?: string | null
          id_avaliacao?: string
          modificado_em?: string | null
          obrigatoria?: boolean | null
          ordem?: number | null
          pontuacao?: number
          tipo?: Database["public"]["Enums"]["lms_tipo_pergunta"]
        }
        Relationships: [
          {
            foreignKeyName: "lms_pergunta_id_arquivo_fkey"
            columns: ["id_arquivo"]
            isOneToOne: false
            referencedRelation: "global_arquivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_pergunta_id_avaliacao_fkey"
            columns: ["id_avaliacao"]
            isOneToOne: false
            referencedRelation: "lms_avaliacao"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_progresso_aluno: {
        Row: {
          concluido: boolean | null
          criado_em: string | null
          id: string
          id_conteudo: string
          id_entidade: string
          id_matricula: string
          modificado_em: string | null
          visto_em: string | null
        }
        Insert: {
          concluido?: boolean | null
          criado_em?: string | null
          id?: string
          id_conteudo: string
          id_entidade: string
          id_matricula: string
          modificado_em?: string | null
          visto_em?: string | null
        }
        Update: {
          concluido?: boolean | null
          criado_em?: string | null
          id?: string
          id_conteudo?: string
          id_entidade?: string
          id_matricula?: string
          modificado_em?: string | null
          visto_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_progresso_aluno_id_conteudo_fkey"
            columns: ["id_conteudo"]
            isOneToOne: false
            referencedRelation: "lms_conteudo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_progresso_aluno_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_progresso_aluno_id_matricula_fkey"
            columns: ["id_matricula"]
            isOneToOne: false
            referencedRelation: "aca_matricula"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_resposta_aluno: {
        Row: {
          criado_em: string | null
          id: string
          id_arquivo_envio: string | null
          id_pergunta: string
          id_resposta_possivel: string | null
          id_submissao_avaliacao: string
          modificado_em: string | null
          texto_resposta: string | null
        }
        Insert: {
          criado_em?: string | null
          id?: string
          id_arquivo_envio?: string | null
          id_pergunta: string
          id_resposta_possivel?: string | null
          id_submissao_avaliacao: string
          modificado_em?: string | null
          texto_resposta?: string | null
        }
        Update: {
          criado_em?: string | null
          id?: string
          id_arquivo_envio?: string | null
          id_pergunta?: string
          id_resposta_possivel?: string | null
          id_submissao_avaliacao?: string
          modificado_em?: string | null
          texto_resposta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_resposta_aluno_id_arquivo_envio_fkey"
            columns: ["id_arquivo_envio"]
            isOneToOne: false
            referencedRelation: "global_arquivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_resposta_aluno_id_pergunta_fkey"
            columns: ["id_pergunta"]
            isOneToOne: false
            referencedRelation: "lms_pergunta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_resposta_aluno_id_resposta_possivel_fkey"
            columns: ["id_resposta_possivel"]
            isOneToOne: false
            referencedRelation: "lms_resposta_possivel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_resposta_aluno_id_submissao_avaliacao_fkey"
            columns: ["id_submissao_avaliacao"]
            isOneToOne: false
            referencedRelation: "lms_submissao_avaliacao"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_resposta_possivel: {
        Row: {
          correta: boolean | null
          criado_em: string | null
          id: string
          id_arquivo: string | null
          id_pergunta: string
          ordem: number | null
          texto: string
        }
        Insert: {
          correta?: boolean | null
          criado_em?: string | null
          id?: string
          id_arquivo?: string | null
          id_pergunta: string
          ordem?: number | null
          texto: string
        }
        Update: {
          correta?: boolean | null
          criado_em?: string | null
          id?: string
          id_arquivo?: string | null
          id_pergunta?: string
          ordem?: number | null
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_resposta_possivel_id_arquivo_fkey"
            columns: ["id_arquivo"]
            isOneToOne: false
            referencedRelation: "global_arquivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_resposta_possivel_id_pergunta_fkey"
            columns: ["id_pergunta"]
            isOneToOne: false
            referencedRelation: "lms_pergunta"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_submissao_atividade: {
        Row: {
          comentario: string | null
          corrigido_em: string | null
          corrigido_por: string | null
          criado_em: string | null
          data_envio: string | null
          data_inicio: string | null
          id: string
          id_arquivo_envio: string | null
          id_conteudo: string
          id_entidade: string
          id_matricula: string
          modificado_em: string | null
          nota: number | null
          status: Database["public"]["Enums"]["lms_status_submissao"] | null
          tentativa: number | null
          texto_resposta: string | null
        }
        Insert: {
          comentario?: string | null
          corrigido_em?: string | null
          corrigido_por?: string | null
          criado_em?: string | null
          data_envio?: string | null
          data_inicio?: string | null
          id?: string
          id_arquivo_envio?: string | null
          id_conteudo: string
          id_entidade: string
          id_matricula: string
          modificado_em?: string | null
          nota?: number | null
          status?: Database["public"]["Enums"]["lms_status_submissao"] | null
          tentativa?: number | null
          texto_resposta?: string | null
        }
        Update: {
          comentario?: string | null
          corrigido_em?: string | null
          corrigido_por?: string | null
          criado_em?: string | null
          data_envio?: string | null
          data_inicio?: string | null
          id?: string
          id_arquivo_envio?: string | null
          id_conteudo?: string
          id_entidade?: string
          id_matricula?: string
          modificado_em?: string | null
          nota?: number | null
          status?: Database["public"]["Enums"]["lms_status_submissao"] | null
          tentativa?: number | null
          texto_resposta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_submissao_atividade_corrigido_por_fkey"
            columns: ["corrigido_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_submissao_atividade_id_arquivo_envio_fkey"
            columns: ["id_arquivo_envio"]
            isOneToOne: false
            referencedRelation: "global_arquivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_submissao_atividade_id_conteudo_fkey"
            columns: ["id_conteudo"]
            isOneToOne: false
            referencedRelation: "lms_conteudo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_submissao_atividade_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_submissao_atividade_id_matricula_fkey"
            columns: ["id_matricula"]
            isOneToOne: false
            referencedRelation: "aca_matricula"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_submissao_avaliacao: {
        Row: {
          comentario: string | null
          corrigido_em: string | null
          corrigido_por: string | null
          criado_em: string | null
          data_entrega: string | null
          data_inicio: string | null
          id: string
          id_conteudo: string
          id_entidade: string
          id_matricula: string
          modificado_em: string | null
          nota_total: number | null
          status: Database["public"]["Enums"]["lms_status_submissao"] | null
          tentativa: number | null
        }
        Insert: {
          comentario?: string | null
          corrigido_em?: string | null
          corrigido_por?: string | null
          criado_em?: string | null
          data_entrega?: string | null
          data_inicio?: string | null
          id?: string
          id_conteudo: string
          id_entidade: string
          id_matricula: string
          modificado_em?: string | null
          nota_total?: number | null
          status?: Database["public"]["Enums"]["lms_status_submissao"] | null
          tentativa?: number | null
        }
        Update: {
          comentario?: string | null
          corrigido_em?: string | null
          corrigido_por?: string | null
          criado_em?: string | null
          data_entrega?: string | null
          data_inicio?: string | null
          id?: string
          id_conteudo?: string
          id_entidade?: string
          id_matricula?: string
          modificado_em?: string | null
          nota_total?: number | null
          status?: Database["public"]["Enums"]["lms_status_submissao"] | null
          tentativa?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lms_submissao_avaliacao_corrigido_por_fkey"
            columns: ["corrigido_por"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_submissao_avaliacao_id_conteudo_fkey"
            columns: ["id_conteudo"]
            isOneToOne: false
            referencedRelation: "lms_conteudo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_submissao_avaliacao_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_submissao_avaliacao_id_matricula_fkey"
            columns: ["id_matricula"]
            isOneToOne: false
            referencedRelation: "aca_matricula"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          created_at: string
          id: string
          id_lead: string | null
          mensagem: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          id_lead?: string | null
          mensagem?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          id_lead?: string | null
          mensagem?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_id_lead_fkey"
            columns: ["id_lead"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      noticias: {
        Row: {
          criado_em: string | null
          header: string | null
          id: string
          id_entidade: string | null
          noticia: string | null
          publicada: boolean | null
        }
        Insert: {
          criado_em?: string | null
          header?: string | null
          id?: string
          id_entidade?: string | null
          noticia?: string | null
          publicada?: boolean | null
        }
        Update: {
          criado_em?: string | null
          header?: string | null
          id?: string
          id_entidade?: string | null
          noticia?: string | null
          publicada?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "noticias_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
        ]
      }
      produto: {
        Row: {
          criado_em: string | null
          descricao: string | null
          id: string
          nome: string
          slug: string
        }
        Insert: {
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nome: string
          slug: string
        }
        Update: {
          criado_em?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      user_entidade_user: {
        Row: {
          criado_em: string | null
          id: string
          id_entidade: string | null
          id_user: string | null
        }
        Insert: {
          criado_em?: string | null
          id?: string
          id_entidade?: string | null
          id_user?: string | null
        }
        Update: {
          criado_em?: string | null
          id?: string
          id_entidade?: string | null
          id_user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_entidade_user_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_entidade_user_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "user_expandido"
            referencedColumns: ["id"]
          },
        ]
      }
      user_entidades: {
        Row: {
          configuracoes: Json | null
          cor_principal: string | null
          cor_principal_hover: string | null
          cor_secundaria: string | null
          cor_secundaria_hover: string | null
          criado_em: string | null
          criado_por: string | null
          dominios: Json | null
          id: string
          logo_aberto: string | null
          logo_fechado: string | null
          modificado_em: string | null
          modificado_por: string | null
          nome_entidade: string
          rota_inicial: string | null
          tema: string | null
          tipo: string
          url: string | null
        }
        Insert: {
          configuracoes?: Json | null
          cor_principal?: string | null
          cor_principal_hover?: string | null
          cor_secundaria?: string | null
          cor_secundaria_hover?: string | null
          criado_em?: string | null
          criado_por?: string | null
          dominios?: Json | null
          id?: string
          logo_aberto?: string | null
          logo_fechado?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          nome_entidade: string
          rota_inicial?: string | null
          tema?: string | null
          tipo: string
          url?: string | null
        }
        Update: {
          configuracoes?: Json | null
          cor_principal?: string | null
          cor_principal_hover?: string | null
          cor_secundaria?: string | null
          cor_secundaria_hover?: string | null
          criado_em?: string | null
          criado_por?: string | null
          dominios?: Json | null
          id?: string
          logo_aberto?: string | null
          logo_fechado?: string | null
          modificado_em?: string | null
          modificado_por?: string | null
          nome_entidade?: string
          rota_inicial?: string | null
          tema?: string | null
          tipo?: string
          url?: string | null
        }
        Relationships: []
      }
      user_expandido: {
        Row: {
          codigo_verificacao_expira: string | null
          codigo_verificacao_hash: string | null
          codigo_verificacao_tentativas: number
          criado_em: string | null
          email: string | null
          email_verificado: boolean
          id: string
          id_user: string | null
          nome_completo: string | null
        }
        Insert: {
          codigo_verificacao_expira?: string | null
          codigo_verificacao_hash?: string | null
          codigo_verificacao_tentativas?: number
          criado_em?: string | null
          email?: string | null
          email_verificado?: boolean
          id?: string
          id_user?: string | null
          nome_completo?: string | null
        }
        Update: {
          codigo_verificacao_expira?: string | null
          codigo_verificacao_hash?: string | null
          codigo_verificacao_tentativas?: number
          criado_em?: string | null
          email?: string | null
          email_verificado?: boolean
          id?: string
          id_user?: string | null
          nome_completo?: string | null
        }
        Relationships: []
      }
      user_papeis: {
        Row: {
          id: string
          nome: string
        }
        Insert: {
          id?: string
          nome: string
        }
        Update: {
          id?: string
          nome?: string
        }
        Relationships: []
      }
      user_papeis_auth: {
        Row: {
          id: string
          id_entidade: string | null
          id_papel: string | null
          id_user: string | null
        }
        Insert: {
          id?: string
          id_entidade?: string | null
          id_papel?: string | null
          id_user?: string | null
        }
        Update: {
          id?: string
          id_entidade?: string | null
          id_papel?: string | null
          id_user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_papeis_auth_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "user_entidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_papeis_auth_id_papel_fkey"
            columns: ["id_papel"]
            isOneToOne: false
            referencedRelation: "user_papeis"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aca_add_componente_ao_modulo: {
        Args: {
          p_carga_horaria?: number
          p_id_componente: string
          p_id_entidade: string
          p_id_modulo: string
          p_obrigatorio?: boolean
          p_ordem?: number
          p_usuario_id?: string
        }
        Returns: Json
      }
      aca_add_modulo_ao_curso: {
        Args: {
          p_id_curso: string
          p_id_entidade?: string
          p_id_modulo: string
          p_ordem?: number
          p_usuario_id?: string
        }
        Returns: Json
      }
      aca_atribuir_docente_ciclo: {
        Args: {
          p_id_ciclo: string
          p_id_docente: string
          p_id_modulo_componente: string
          p_tipo?: string
        }
        Returns: Json
      }
      aca_atribuir_papel_auth: {
        Args: { p_id_papel: string; p_id_user: string }
        Returns: Json
      }
      aca_atualizar_aula_detalhes: {
        Args: {
          p_id_aula: string
          p_id_componente?: string
          p_id_docente_override?: string
          p_id_entidade: string
          p_observacao?: string
          p_sub_turma?: string
        }
        Returns: Json
      }
      aca_avaliar_inscricao: {
        Args: { p_campo: string; p_id_inscricao: string; p_valor: string }
        Returns: Json
      }
      aca_avaliar_inscricao_docente: {
        Args: { p_id: string; p_modificado_por?: string; p_status: string }
        Returns: Json
      }
      aca_calcular_cronograma_aulas: {
        Args: {
          p_data_inicio: string
          p_dias_extras: Json
          p_dias_semana: Json
          p_id_entidade: string
          p_id_modulo: string
        }
        Returns: Json
      }
      aca_cancelar_aula: {
        Args: { p_id_aula: string; p_id_entidade: string }
        Returns: Json
      }
      aca_completar_cadastro_docente: {
        Args: {
          p_id_user_expandido?: string
          p_nome: string
          p_respostas?: Json
          p_token: string
        }
        Returns: Json
      }
      aca_considerar_proposta: {
        Args: { p_considerado: boolean; p_id: string }
        Returns: Json
      }
      aca_create_programas_lote:
        | {
            Args: {
              p_ciclos: string[]
              p_descricao: string
              p_estrategia: string
              p_id_curso: string
              p_id_entidade: string
              p_usuario_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_ciclos: string[]
              p_descricao: string
              p_descricoes?: Json
              p_estrategia: string
              p_id_curso: string
              p_id_entidade: string
              p_usuario_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_ciclos: string[]
              p_descricao: string
              p_descricoes?: Json
              p_estrategia: string
              p_id_area?: string
              p_id_curso: string
              p_id_entidade: string
              p_usuario_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_ciclos: string[]
              p_descricao: string
              p_descricoes?: Json
              p_estrategia: string
              p_id_area?: string
              p_id_curso: string
              p_id_entidade: string
              p_matricula_fim?: string
              p_matricula_inicio?: string
              p_processo_seletivo_fim?: string
              p_processo_seletivo_inicio?: string
              p_usuario_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_ciclos: string[]
              p_descricao: string
              p_descricoes?: Json
              p_estrategia: string
              p_id_area?: string
              p_id_curso: string
              p_id_entidade: string
              p_matricula_fim?: string
              p_matricula_inicio?: string
              p_processo_seletivo_fim?: string
              p_processo_seletivo_inicio?: string
              p_processos?: Json
              p_usuario_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_ciclos: string[]
              p_descricao: string
              p_descricoes?: Json
              p_estrategia: string
              p_exige_processo_seletivo?: boolean
              p_gratuito?: boolean
              p_id_area?: string
              p_id_curso: string
              p_id_entidade: string
              p_matricula_fim?: string
              p_matricula_inicio?: string
              p_processo_seletivo_fim?: string
              p_processo_seletivo_inicio?: string
              p_processos?: Json
              p_usuario_id: string
            }
            Returns: Json
          }
      aca_criar_docente_completo:
        | {
            Args: {
              p_criado_por?: string
              p_email: string
              p_id_entidade: string
              p_nome: string
              p_respostas?: Json
              p_valor_hora_aula?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_criado_por?: string
              p_email: string
              p_id_entidade: string
              p_nome: string
              p_respostas: Json
            }
            Returns: Json
          }
      aca_criar_inscricao: {
        Args: {
          p_id_processo: string
          p_tipo_candidatura: Database["public"]["Enums"]["tipo_candidatura"]
          p_tipo_processo: Database["public"]["Enums"]["tipo_processo"]
        }
        Returns: {
          criado_em: string
          id: string
          id_processo: string
          id_programa: string
          id_usuario: string
          status_candidatura: string
          status_dados: string
          status_documentacao: string
          tipo_candidatura: Database["public"]["Enums"]["tipo_candidatura"]
          tipo_processo: Database["public"]["Enums"]["tipo_processo"]
        }[]
      }
      aca_criar_matricula: {
        Args: {
          p_id_entidade: string
          p_id_pedido?: string
          p_id_programa: string
          p_id_usuario: string
          p_usuario_id?: string
        }
        Returns: Json
      }
      aca_delete_area: {
        Args: { p_id: string; p_id_entidade: string }
        Returns: Json
      }
      aca_delete_ciclo: {
        Args: { p_id_ciclo: string; p_id_entidade: string }
        Returns: Json
      }
      aca_delete_componente: {
        Args: { p_id: string; p_id_entidade: string }
        Returns: Json
      }
      aca_delete_curso: {
        Args: { p_id: string; p_id_entidade: string }
        Returns: Json
      }
      aca_delete_edital_docente: {
        Args: { p_id: string; p_id_entidade: string }
        Returns: Json
      }
      aca_delete_modulo: {
        Args: { p_id: string; p_id_entidade: string }
        Returns: Json
      }
      aca_delete_plano_de_aula: {
        Args: { p_id: string; p_id_entidade: string }
        Returns: Json
      }
      aca_delete_proposta_docente: { Args: { p_id: string }; Returns: Json }
      aca_dividir_aula: {
        Args: {
          p_id_aula: string
          p_id_componente_b?: string
          p_id_docente_b?: string
          p_id_entidade: string
        }
        Returns: Json
      }
      aca_find_or_create_user_expandido: {
        Args: { p_email: string; p_nome?: string }
        Returns: string
      }
      aca_gerar_calendario_ciclo: {
        Args: {
          p_id_ciclo: string
          p_id_entidade: string
          p_usuario_id: string
        }
        Returns: Json
      }
      aca_gerar_codigo_verificacao: {
        Args: { p_id_user_expandido: string; p_validade_minutos?: number }
        Returns: Json
      }
      aca_gerar_convite_docente: {
        Args: { p_criado_por?: string; p_email?: string; p_id_entidade: string }
        Returns: Json
      }
      aca_get_areas_para_processos: {
        Args: { p_id_entidade: string }
        Returns: Json
      }
      aca_get_areas_publicas: { Args: { p_id_entidade: string }; Returns: Json }
      aca_get_calendario_ciclo_publico: {
        Args: { p_id_ciclo: string }
        Returns: Json
      }
      aca_get_calendario_docente_publico: {
        Args: { p_id_docente: string }
        Returns: Json
      }
      aca_get_calendario_programa: {
        Args: { p_id_entidade: string; p_id_programa: string }
        Returns: Json
      }
      aca_get_ciclos_do_programa: {
        Args: { p_id_programa: string }
        Returns: Json
      }
      aca_get_componentes_do_modulo: {
        Args: { p_id_modulo: string }
        Returns: Json
      }
      aca_get_componentes_paginado: {
        Args: {
          p_busca?: string
          p_id_entidade: string
          p_limite?: number
          p_ordenar_como?: string
          p_ordenar_por?: string
          p_pagina?: number
        }
        Returns: Json
      }
      aca_get_componentes_para_vinculo: {
        Args: { p_id_entidade: string }
        Returns: Json
      }
      aca_get_contexto_por_url: { Args: { p_url: string }; Returns: Json }
      aca_get_cursos_paginado: {
        Args: {
          p_busca?: string
          p_id_entidade: string
          p_limite?: number
          p_pagina?: number
        }
        Returns: Json
      }
      aca_get_docentes: {
        Args: {
          p_busca?: string
          p_id_entidade: string
          p_limite?: number
          p_pagina?: number
        }
        Returns: Json
      }
      aca_get_docentes_por_entidade: {
        Args: { p_busca?: string; p_id_entidade: string }
        Returns: Json
      }
      aca_get_editais_docente: {
        Args: { p_id_entidade: string }
        Returns: Json
      }
      aca_get_editais_para_dropdown: {
        Args: { p_id_entidade: string }
        Returns: Json
      }
      aca_get_editais_publicos: {
        Args: { p_id_entidade: string }
        Returns: Json
      }
      aca_get_form_config_completo:
        | {
            Args: {
              p_area_id?: string
              p_id_entidade: string
              p_programa_id?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_area_id?: string
              p_id_entidade: string
              p_programa_id?: string
              p_tipo_cand?: string
              p_tipo_proc?: string
            }
            Returns: Json
          }
      aca_get_inscricoes_edital: {
        Args: { p_id_edital: string; p_limite?: number; p_pagina?: number }
        Returns: Json
      }
      aca_get_inscricoes_filtradas:
        | {
            Args: {
              p_ano_semestre?: string
              p_busca?: string
              p_id_area?: string
              p_id_entidade: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_ano_semestre?: string
              p_busca?: string
              p_id_area?: string
              p_id_entidade: string
              p_limite?: number
              p_pagina?: number
            }
            Returns: Json
          }
      aca_get_matriculas_filtradas: {
        Args: {
          p_ano_semestre?: string
          p_busca?: string
          p_id_area?: string
          p_id_entidade: string
          p_id_turma?: string
          p_limite?: number
          p_pagina?: number
          p_status?: string
        }
        Returns: Json
      }
      aca_get_minhas_inscricoes: {
        Args: { p_limite?: number; p_pagina?: number }
        Returns: Json
      }
      aca_get_minhas_matriculas: { Args: never; Returns: Json }
      aca_get_modulos_componentes_por_programa: {
        Args: { p_id_entidade: string; p_id_programa: string }
        Returns: Json
      }
      aca_get_modulos_do_curso: { Args: { p_id_curso: string }; Returns: Json }
      aca_get_modulos_paginado: {
        Args: {
          p_busca?: string
          p_id_entidade: string
          p_limite?: number
          p_pagina?: number
        }
        Returns: Json
      }
      aca_get_planos_por_modulo: {
        Args: { p_id_modulo: string }
        Returns: Json
      }
      aca_get_processos_filtrados: {
        Args: {
          p_ano_semestre?: string
          p_busca?: string
          p_id_area?: string
          p_id_entidade: string
        }
        Returns: Json
      }
      aca_get_programas_com_ciclos: {
        Args: { p_ano_semestre?: string; p_id_entidade: string }
        Returns: Json
      }
      aca_get_programas_paginado: {
        Args: {
          p_busca?: string
          p_id_entidade: string
          p_limite?: number
          p_pagina?: number
        }
        Returns: Json
      }
      aca_get_programas_publicos: {
        Args: { p_id_entidade: string }
        Returns: Json
      }
      aca_get_propostas_docente: {
        Args: {
          p_filtro?: string
          p_id_entidade: string
          p_limite?: number
          p_pagina?: number
        }
        Returns: Json
      }
      aca_get_respostas_usuario: {
        Args: { p_id_user_expandido: string; p_pergunta_ids: string[] }
        Returns: Json
      }
      aca_get_turmas_para_matriculas: {
        Args: { p_id_entidade: string }
        Returns: Json
      }
      aca_get_vinculos_docente: {
        Args: { p_id_docente: string }
        Returns: Json
      }
      aca_inativar_matricula: {
        Args: { p_id: string; p_status?: string }
        Returns: Json
      }
      aca_inscrever_edital_publico:
        | {
            Args: {
              p_email: string
              p_id_edital: string
              p_id_entidade: string
              p_nome: string
              p_respostas?: Json
            }
            Returns: Json
          }
        | {
            Args: {
              p_criado_por?: string
              p_email: string
              p_id_edital: string
              p_id_entidade: string
              p_nome: string
              p_respostas?: Json
            }
            Returns: Json
          }
        | {
            Args: {
              p_id_edital: string
              p_id_entidade: string
              p_respostas?: Json
            }
            Returns: Json
          }
      aca_inserir_proposta_publica: {
        Args: {
          p_email: string
          p_id_curriculo?: string
          p_id_edital?: string
          p_id_entidade: string
          p_minibio?: string
          p_nome: string
          p_telefone?: string
        }
        Returns: Json
      }
      aca_list_areas: {
        Args: { p_id_entidade: string; p_limite?: number; p_pagina?: number }
        Returns: Json
      }
      aca_listar_atribuicoes: {
        Args: {
          p_id_ciclo?: string
          p_id_entidade: string
          p_id_programa?: string
          p_limite?: number
          p_pagina?: number
        }
        Returns: Json
      }
      aca_marcar_convite_enviado: { Args: { p_id: string }; Returns: Json }
      aca_marcar_visto_proposta: { Args: { p_id: string }; Returns: Json }
      aca_mover_aula: {
        Args: { p_id_aula: string; p_id_entidade: string; p_nova_data: string }
        Returns: Json
      }
      aca_reagendar_aula_cancelada: {
        Args: { p_id_aula: string; p_id_entidade: string; p_nova_data: string }
        Returns: Json
      }
      aca_remove_componente_do_modulo: {
        Args: { p_id_componente: string; p_id_modulo: string }
        Returns: Json
      }
      aca_remove_modulo_do_curso: {
        Args: { p_id_curso: string; p_id_modulo: string }
        Returns: Json
      }
      aca_remover_atribuicao_docente: { Args: { p_id: string }; Returns: Json }
      aca_set_valor_hora_aula: {
        Args: { p_id: string; p_modificado_por?: string; p_valor: number }
        Returns: Json
      }
      aca_swap_aulas: {
        Args: {
          p_id_aula_1: string
          p_id_aula_2: string
          p_id_entidade: string
        }
        Returns: Json
      }
      aca_sync_processos_programa: {
        Args: {
          p_default_nome_processo?: string
          p_id_entidade: string
          p_id_programa: string
          p_legacy_matricula_fim?: string
          p_legacy_matricula_inicio?: string
          p_legacy_processo_fim?: string
          p_legacy_processo_inicio?: string
          p_processos?: Json
          p_usuario_id: string
        }
        Returns: undefined
      }
      aca_toggle_docente: {
        Args: { p_ativo: boolean; p_id: string; p_modificado_por?: string }
        Returns: Json
      }
      aca_update_user_sys_fields: {
        Args: { p_field: string; p_id_user_expandido: string; p_value: string }
        Returns: Json
      }
      aca_upsert_ciclo_v1:
        | {
            Args: {
              p_ano_semestre?: string
              p_data_fim?: string
              p_data_ini?: string
              p_descricao?: string
              p_id?: string
              p_id_entidade?: string
              p_id_modulo?: string
              p_id_programa?: string
              p_turno?: Database["public"]["Enums"]["tipo_turno"]
              p_usuario_id?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_data_fim?: string
              p_data_ini?: string
              p_descricao?: string
              p_id?: string
              p_id_entidade?: string
              p_id_modulo?: string
              p_id_programa?: string
              p_usuario_id?: string
            }
            Returns: Json
          }
      aca_upsert_componente: {
        Args: {
          p_descricao?: string
          p_id?: string
          p_id_entidade?: string
          p_nome_componente?: string
          p_usuario_id?: string
        }
        Returns: Json
      }
      aca_upsert_curso:
        | {
            Args: {
              p_descricao?: string
              p_id?: string
              p_id_entidade?: string
              p_nome_curso?: string
              p_tipo_modelo?: string
              p_usuario_id?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_descricao: string
              p_id: string
              p_id_area: string
              p_id_entidade: string
              p_nome_curso: string
              p_usuario_id: string
            }
            Returns: Json
          }
      aca_upsert_curso_v1: {
        Args: {
          p_descricao?: string
          p_id?: string
          p_id_entidade?: string
          p_nome_curso?: string
          p_projeto_pedagogico?: string
          p_usuario_id?: string
          p_vagas_sugeridas?: number
        }
        Returns: Json
      }
      aca_upsert_docente: {
        Args: {
          p_criado_por?: string
          p_id_entidade: string
          p_id_user_expandido: string
        }
        Returns: Json
      }
      aca_upsert_edital_docente: {
        Args: {
          p_criado_por?: string
          p_data_fim?: string
          p_data_ini?: string
          p_descricao?: string
          p_id?: string
          p_id_entidade: string
          p_id_form_config?: string
          p_nome: string
          p_status?: string
        }
        Returns: Json
      }
      aca_upsert_modulo: {
        Args: {
          p_carga_horaria?: number
          p_descricao?: string
          p_id?: string
          p_id_entidade?: string
          p_nome_modulo?: string
          p_usuario_id?: string
        }
        Returns: Json
      }
      aca_upsert_plano_de_aula: {
        Args: {
          p_ementa?: string
          p_id?: string
          p_id_componente?: string
          p_id_entidade?: string
          p_id_modulo?: string
          p_titulo_plano?: string
          p_usuario_id?: string
        }
        Returns: Json
      }
      aca_upsert_programa:
        | {
            Args: {
              p_descricao?: string
              p_id?: string
              p_id_curso?: string
              p_id_entidade?: string
              p_usuario_id?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_ciclos?: string[]
              p_descricao?: string
              p_id?: string
              p_id_curso?: string
              p_id_entidade?: string
              p_usuario_id?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_ciclos?: string[]
              p_descricao?: string
              p_id?: string
              p_id_area?: string
              p_id_curso?: string
              p_id_entidade?: string
              p_usuario_id?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_ciclos?: string[]
              p_descricao?: string
              p_id?: string
              p_id_area?: string
              p_id_curso?: string
              p_id_entidade?: string
              p_matricula_fim?: string
              p_matricula_inicio?: string
              p_processo_seletivo_fim?: string
              p_processo_seletivo_inicio?: string
              p_usuario_id?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_ciclos?: string[]
              p_descricao?: string
              p_id?: string
              p_id_area?: string
              p_id_curso?: string
              p_id_entidade?: string
              p_matricula_fim?: string
              p_matricula_inicio?: string
              p_processo_seletivo_fim?: string
              p_processo_seletivo_inicio?: string
              p_processos?: Json
              p_usuario_id?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_ciclos?: string[]
              p_descricao?: string
              p_exige_processo_seletivo?: boolean
              p_gratuito?: boolean
              p_id?: string
              p_id_area?: string
              p_id_curso?: string
              p_id_entidade?: string
              p_matricula_fim?: string
              p_matricula_inicio?: string
              p_processo_seletivo_fim?: string
              p_processo_seletivo_inicio?: string
              p_processos?: Json
              p_usuario_id?: string
            }
            Returns: Json
          }
      aca_upsert_resposta_form: {
        Args: {
          p_id_arquivo?: string
          p_id_entidade: string
          p_id_pergunta: string
          p_id_user_expandido: string
          p_resposta?: string
          p_usuario_id?: string
        }
        Returns: Json
      }
      aca_upsert_vinculos_docente: {
        Args: { p_criado_por?: string; p_id_docente: string; p_vinculos: Json }
        Returns: Json
      }
      aca_validar_form_obrigatorio: {
        Args: {
          p_area_id?: string
          p_id_entidade: string
          p_programa_id?: string
          p_tipo_cand?: string
          p_tipo_proc?: string
          p_user_expandido_id?: string
        }
        Returns: Json
      }
      aca_verificar_codigo: {
        Args: { p_codigo: string; p_id_user_expandido: string }
        Returns: Json
      }
      aca_verificar_inscricao: {
        Args: {
          p_id_processo: string
          p_tipo_candidatura: Database["public"]["Enums"]["tipo_candidatura"]
          p_tipo_processo: Database["public"]["Enums"]["tipo_processo"]
        }
        Returns: {
          criado_em: string
          id: string
          id_processo: string
          id_programa: string
          id_usuario: string
          status_candidatura: string
          status_dados: string
          status_documentacao: string
          tipo_candidatura: Database["public"]["Enums"]["tipo_candidatura"]
          tipo_processo: Database["public"]["Enums"]["tipo_processo"]
        }[]
      }
      aca_verificar_inscricoes_lote: {
        Args: { p_id_processos: string[] }
        Returns: Json
      }
      aca_vincular_auth_user: {
        Args: { p_id_user: string; p_id_user_expandido: string }
        Returns: Json
      }
      aca_vincular_modulo_ao_curso: {
        Args: {
          p_id_curso: string
          p_id_entidade: string
          p_id_modulo: string
          p_ordem?: number
          p_remover?: boolean
          p_usuario_id: string
        }
        Returns: Json
      }
      acd_delete_horario: { Args: { p_id: string }; Returns: Json }
      acd_delete_reserva_sala: { Args: { p_id: string }; Returns: Json }
      acd_delete_sala: { Args: { p_id: string }; Returns: Json }
      acd_get_aulas_sem_reserva: {
        Args: {
          p_data_fim: string
          p_data_inicio: string
          p_id_entidade: string
        }
        Returns: Json
      }
      acd_get_eventos_range: {
        Args: {
          p_data_fim: string
          p_data_inicio: string
          p_id_entidade: string
        }
        Returns: Json
      }
      acd_get_horarios: { Args: { p_id_entidade: string }; Returns: Json }
      acd_get_reservas_range: {
        Args: {
          p_data_fim: string
          p_data_inicio: string
          p_id_entidade: string
        }
        Returns: Json
      }
      acd_get_salas_horarios: { Args: { p_id_entidade: string }; Returns: Json }
      acd_get_salas_simples: { Args: { p_id_entidade: string }; Returns: Json }
      acd_upsert_horario:
        | {
            Args: {
              p_ativo?: boolean
              p_hora_fim?: string
              p_hora_ini?: string
              p_id?: string
              p_id_entidade?: string
              p_indice?: number
              p_nome_turno?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_ativo?: boolean
              p_hora_fim?: string
              p_hora_ini?: string
              p_id?: string
              p_id_entidade?: string
              p_indice?: number
              p_is_intervalo?: boolean
              p_nome_turno?: string
            }
            Returns: Json
          }
      acd_upsert_reserva_batch: {
        Args: { p_reservas: Json; p_usuario_id: string }
        Returns: Json
      }
      acd_upsert_sala: {
        Args: {
          p_ativo?: boolean
          p_capacidade?: number
          p_cor?: string
          p_id?: string
          p_id_entidade?: string
          p_nome?: string
          p_usuario_id?: string
        }
        Returns: Json
      }
      app_get_minha_sessao: { Args: { p_id_entidade: string }; Returns: Json }
      app_resolver_entidade_por_dominio: {
        Args: { p_dominio: string }
        Returns: Json
      }
      app_resolver_entidade_por_id: { Args: { p_id: string }; Returns: Json }
      auth_verificar_email: { Args: { p_email: string }; Returns: Json }
      com_criar_pedido: {
        Args: {
          p_id_entidade: string
          p_id_inscricao?: string
          p_id_oferta: string
          p_id_usuario: string
          p_usuario_id?: string
        }
        Returns: Json
      }
      com_delete_elegivel: {
        Args: { p_id: string; p_id_entidade: string }
        Returns: Json
      }
      com_delete_oferta: {
        Args: { p_id: string; p_id_entidade: string }
        Returns: Json
      }
      com_delete_produto: {
        Args: { p_id: string; p_id_entidade: string }
        Returns: Json
      }
      com_get_elegiveis: {
        Args: { p_id_entidade: string; p_id_oferta: string }
        Returns: Json
      }
      com_get_oferta_por_id: { Args: { p_id: string }; Returns: Json }
      com_get_oferta_por_slug: {
        Args: { p_id_entidade?: string; p_slug: string }
        Returns: Json
      }
      com_get_ofertas: {
        Args: {
          p_id_entidade: string
          p_id_produto?: string
          p_limite?: number
          p_pagina?: number
        }
        Returns: Json
      }
      com_get_ofertas_publicas: {
        Args: { p_id_area?: string; p_id_entidade: string }
        Returns: Json
      }
      com_get_pedido: {
        Args: { p_id: string; p_id_entidade: string }
        Returns: Json
      }
      com_get_pedidos:
        | {
            Args: {
              p_id_entidade: string
              p_id_usuario?: string
              p_limite?: number
              p_pagina?: number
              p_status?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_id_entidade: string
              p_limite?: number
              p_pagina?: number
              p_status?: string
            }
            Returns: Json
          }
      com_get_produtos: {
        Args: {
          p_id_entidade: string
          p_id_programa?: string
          p_limite?: number
          p_pagina?: number
        }
        Returns: Json
      }
      com_upsert_elegivel: {
        Args: {
          p_cpf?: string
          p_email?: string
          p_expirado_em?: string
          p_id?: string
          p_id_entidade?: string
          p_id_oferta?: string
          p_usuario_id?: string
        }
        Returns: Json
      }
      com_upsert_oferta: {
        Args: {
          p_disponivel_a_partir_de?: string
          p_disponivel_ate?: string
          p_exige_elegibilidade?: boolean
          p_id?: string
          p_id_entidade?: string
          p_id_produto?: string
          p_is_ativa?: boolean
          p_nome_curto?: string
          p_parcelamento_maximo?: number
          p_recorrencia_intervalo?: number
          p_recorrencia_periodo?: string
          p_slug?: string
          p_tipo_pagamento?: string
          p_usuario_id?: string
          p_valor_centavos?: number
          p_visibilidade?: string
        }
        Returns: Json
      }
      com_upsert_produto: {
        Args: {
          p_descricao?: string
          p_id?: string
          p_id_entidade?: string
          p_id_programa?: string
          p_is_ativo?: boolean
          p_nome_produto?: string
          p_usuario_id?: string
        }
        Returns: Json
      }
      com_verificar_elegibilidade: {
        Args: { p_email: string; p_slug: string }
        Returns: Json
      }
      delete_categoria_segura: {
        Args: { p_confirmar?: boolean; p_id: string }
        Returns: {
          can_delete: boolean
          deleted: boolean
          has_children: boolean
          has_lancamentos: boolean
          motivo: string
        }[]
      }
      delete_conta_segura: {
        Args: { p_confirmar?: boolean; p_id: string }
        Returns: {
          can_delete: boolean
          deleted: boolean
          has_children: boolean
          has_lancamentos: boolean
          motivo: string
        }[]
      }
      fin_delete_lancamento: {
        Args: { p_id: string; p_id_entidade: string }
        Returns: boolean
      }
      fin_get_dashboard_calendario: {
        Args: { p_data_ref: string; p_id_entidade: string }
        Returns: Json
      }
      fin_get_dashboard_categorias: {
        Args: {
          p_data_ref: string
          p_id_categoria?: string
          p_id_entidade: string
        }
        Returns: Json
      }
      fin_get_lancamentos: {
        Args: {
          p_apenas_pai?: boolean
          p_data_fim?: string
          p_data_inicio?: string
          p_id_categoria?: string
          p_id_conta?: string
          p_id_entidade: string
          p_id_local?: string
          p_incluir_filhos?: boolean
        }
        Returns: {
          categoria_nome: string
          conta_nome: string
          criado_em: string
          criado_por: string
          data: string
          descricao: string
          id: string
          id_categoria: string
          id_conta: string
          id_entidade: string
          id_grupo_parcelas: string
          id_lancamento_pai: string
          id_local: string
          local_nome: string
          parcela_n: number
          parcelado: boolean
          qtd_parcelas: number
          tipo: string
          valor: number
        }[]
      }
      fin_get_top_categorias: {
        Args: { p_id_entidade: string; p_limit?: number }
        Returns: {
          id: string
          nome: string
          total: number
        }[]
      }
      fin_get_top_categorias_periodo: {
        Args: {
          p_data_fim: string
          p_data_inicio: string
          p_id_entidade: string
          p_limit?: number
        }
        Returns: {
          id: string
          nome: string
          total: number
        }[]
      }
      fin_get_top_contas: {
        Args: { p_id_entidade: string; p_limit?: number }
        Returns: {
          id: string
          nome: string
          total: number
        }[]
      }
      fin_get_top_contas_periodo: {
        Args: {
          p_data_fim: string
          p_data_inicio: string
          p_id_entidade: string
          p_limit?: number
        }
        Returns: {
          id: string
          nome: string
          total: number
        }[]
      }
      fin_get_top_locais: {
        Args: { p_id_entidade: string; p_limit?: number }
        Returns: {
          id: string
          nome: string
          total: number
        }[]
      }
      fin_get_top_locais_periodo: {
        Args: {
          p_data_fim: string
          p_data_inicio: string
          p_id_entidade: string
          p_limit?: number
        }
        Returns: {
          id: string
          nome: string
          total: number
        }[]
      }
      fin_upsert_lancamento: {
        Args: {
          p_criado_por?: string
          p_data: string
          p_descricao: string
          p_id: string
          p_id_categoria: string
          p_id_conta: string
          p_id_entidade: string
          p_id_grupo_parcelas: string
          p_id_lancamento_pai: string
          p_id_local?: string
          p_parcelado: boolean
          p_qtd_parcelas: number
          p_tipo: string
          p_valor: number
          p_valor_e_total: boolean
        }
        Returns: Json
      }
      frm_delete_pergunta: {
        Args: { p_id: string; p_id_entidade: string }
        Returns: Json
      }
      frm_get_form_config:
        | {
            Args: {
              p_area_id?: string
              p_escopo?: string
              p_id_entidade: string
              p_programa_id?: string
              p_tipo_cand?: Database["public"]["Enums"]["tipo_candidatura"]
              p_tipo_proc?: Database["public"]["Enums"]["tipo_processo"]
            }
            Returns: Json
          }
        | {
            Args: {
              p_area_id: string
              p_id_entidade: string
              p_programa_id: string
              p_tipo_cand: Database["public"]["Enums"]["tipo_candidatura"]
              p_tipo_proc: Database["public"]["Enums"]["tipo_processo"]
            }
            Returns: Json
          }
      frm_get_formularios_salvos: {
        Args: { p_id_entidade: string }
        Returns: Json
      }
      frm_get_perguntas: { Args: { p_id_entidade: string }; Returns: Json }
      frm_upsert_form_config:
        | {
            Args: {
              p_area_id: string
              p_id_entidade: string
              p_items: Json
              p_programa_id: string
              p_tipo_cand: Database["public"]["Enums"]["tipo_candidatura"]
              p_tipo_proc: Database["public"]["Enums"]["tipo_processo"]
            }
            Returns: Json
          }
        | {
            Args: {
              p_area_id: string
              p_id_entidade: string
              p_items: Json
              p_old_area_id?: string
              p_old_programa_id?: string
              p_old_tipo_cand?: Database["public"]["Enums"]["tipo_candidatura"]
              p_old_tipo_proc?: Database["public"]["Enums"]["tipo_processo"]
              p_programa_id: string
              p_tipo_cand: Database["public"]["Enums"]["tipo_candidatura"]
              p_tipo_proc: Database["public"]["Enums"]["tipo_processo"]
            }
            Returns: Json
          }
        | {
            Args: {
              p_area_id: string
              p_escopo?: string
              p_id_entidade: string
              p_items: Json
              p_old_area_id?: string
              p_old_programa_id?: string
              p_old_tipo_cand?: Database["public"]["Enums"]["tipo_candidatura"]
              p_old_tipo_proc?: Database["public"]["Enums"]["tipo_processo"]
              p_programa_id: string
              p_tipo_cand: Database["public"]["Enums"]["tipo_candidatura"]
              p_tipo_proc: Database["public"]["Enums"]["tipo_processo"]
            }
            Returns: Json
          }
      frm_upsert_pergunta: {
        Args: {
          p_id: string
          p_id_entidade: string
          p_label: string
          p_nome_interno: string
          p_opcoes?: Json
          p_placeholder: string
          p_tipo_pergunta: string
        }
        Returns: Json
      }
      get_categorias_hierarquicas: {
        Args: {
          p_id_pai?: string
          p_limit?: number
          p_nivel?: number
          p_offset?: number
        }
        Returns: {
          criado_em: string
          criado_por: string
          id: string
          id_entidade: string
          id_pai: string
          nivel: number
          nome: string
          ordem: number
          tipo: string
        }[]
      }
      get_complete_schema: { Args: never; Returns: Json }
      get_contas_hierarquicas: {
        Args: {
          p_id_pai?: string
          p_limit?: number
          p_nivel?: number
          p_offset?: number
        }
        Returns: {
          criado_em: string
          criado_por: string
          id: string
          id_entidade: string
          id_pai: string
          nivel: number
          nome: string
          ordem: number
          saldo_inicial: number
          tipo: Database["public"]["Enums"]["fin_tipo_conta"]
        }[]
      }
      get_leads_entidade: {
        Args: { p_id_entidade: string }
        Returns: {
          created_at: string
          email: string
          empresa: string
          id: string
          nome: string
        }[]
      }
      get_mensagens_leads_entidade: {
        Args: { p_id_entidade: string }
        Returns: {
          created_at: string
          id: string
          id_lead: string
          lead_email: string
          lead_nome: string
          mensagem: string
        }[]
      }
      get_noticia_completa: {
        Args: { p_id: string }
        Returns: {
          criado_em: string | null
          header: string | null
          id: string
          id_entidade: string | null
          noticia: string | null
          publicada: boolean | null
        }[]
        SetofOptions: {
          from: "*"
          to: "noticias"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_noticias_entidade: {
        Args: { p_id_entidade: string }
        Returns: {
          criado_em: string | null
          header: string | null
          id: string
          id_entidade: string | null
          noticia: string | null
          publicada: boolean | null
        }[]
        SetofOptions: {
          from: "*"
          to: "noticias"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_noticias_entidade_home: {
        Args: { p_id_entidade: string }
        Returns: {
          criado_em: string | null
          header: string | null
          id: string
          id_entidade: string | null
          noticia: string | null
          publicada: boolean | null
        }[]
        SetofOptions: {
          from: "*"
          to: "noticias"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_expandido_header: {
        Args: { p_id_user: string }
        Returns: {
          email: string
          id_user: string
          nome_completo: string
        }[]
      }
      jwt_custom_claims: { Args: { event: Json }; Returns: Json }
      lms_associar_conteudo_bloco: {
        Args: { p_id_bloco: string; p_id_conteudo: string }
        Returns: Json
      }
      lms_delete_bloco: {
        Args: { p_id: string; p_id_entidade: string }
        Returns: Json
      }
      lms_delete_conteudo: {
        Args: { p_id: string; p_id_entidade: string }
        Returns: Json
      }
      lms_delete_distribuicao: {
        Args: { p_id: string; p_id_entidade: string }
        Returns: Json
      }
      lms_delete_operacional: {
        Args: { p_id: string; p_id_entidade: string }
        Returns: Json
      }
      lms_desassociar_conteudo_bloco: {
        Args: { p_id_bloco: string; p_id_conteudo: string }
        Returns: Json
      }
      lms_finalizar_submissao_avaliacao: {
        Args: {
          p_id_entidade: string
          p_id_submissao: string
          p_respostas?: Json
        }
        Returns: Json
      }
      lms_get_avaliacao_completa: {
        Args: { p_id_conteudo: string; p_id_entidade: string }
        Returns: Json
      }
      lms_get_avaliacao_para_aluno: {
        Args: {
          p_id_conteudo: string
          p_id_entidade: string
          p_id_matricula: string
        }
        Returns: Json
      }
      lms_get_conteudos_do_aluno: {
        Args: {
          p_escopo_id: string
          p_escopo_tipo: string
          p_id_entidade: string
          p_id_matricula: string
          p_id_programa: string
        }
        Returns: Json
      }
      lms_get_curriculo_conteudos: {
        Args: {
          p_escopo_id: string
          p_escopo_tipo: string
          p_id_entidade: string
          p_id_programa: string
        }
        Returns: Json
      }
      lms_get_curriculo_estrutura: {
        Args: { p_id_entidade: string; p_id_programa: string }
        Returns: Json
      }
      lms_get_entrega_detalhe: {
        Args: {
          p_id_entidade: string
          p_id_submissao: string
          p_id_usuario: string
          p_tipo: string
        }
        Returns: Json
      }
      lms_get_programas_do_aluno: {
        Args: { p_id_entidade: string; p_id_usuario: string }
        Returns: Json
      }
      lms_iniciar_submissao_avaliacao: {
        Args: {
          p_id_conteudo: string
          p_id_entidade: string
          p_id_matricula: string
        }
        Returns: Json
      }
      lms_list_blocos: {
        Args: {
          p_busca?: string
          p_id_entidade: string
          p_limite?: number
          p_pagina?: number
        }
        Returns: Json
      }
      lms_list_conteudos: {
        Args: {
          p_busca?: string
          p_criado_por?: string
          p_id_entidade: string
          p_limite?: number
          p_pagina?: number
          p_tipo?: string
        }
        Returns: Json
      }
      lms_list_conteudos_do_bloco: {
        Args: { p_id_bloco: string }
        Returns: Json
      }
      lms_list_conteudos_entregas_docente: {
        Args: { p_id_entidade: string; p_id_usuario: string }
        Returns: Json
      }
      lms_list_distribuicoes: {
        Args: { p_escopo: string; p_escopo_id: string }
        Returns: Json
      }
      lms_list_entregas_conteudo: {
        Args: {
          p_id_conteudo: string
          p_id_entidade: string
          p_id_usuario: string
        }
        Returns: Json
      }
      lms_list_escopos_disponiveis: {
        Args: { p_id_entidade: string; p_tipo_escopo: string }
        Returns: Json
      }
      lms_list_itens_do_bloco: { Args: { p_id_bloco: string }; Returns: Json }
      lms_list_programas_para_curriculo: {
        Args: { p_id_entidade: string }
        Returns: Json
      }
      lms_programas_do_docente: {
        Args: { p_id_usuario: string }
        Returns: string[]
      }
      lms_salvar_correcao: {
        Args: {
          p_comentario: string
          p_id_entidade: string
          p_id_submissao: string
          p_id_usuario: string
          p_nota: number
          p_tipo: string
        }
        Returns: Json
      }
      lms_upsert_avaliacao_completa: {
        Args: {
          p_ambiente_seguro?: boolean
          p_autoavaliacao?: boolean
          p_descricao?: string
          p_id_conteudo: string
          p_id_entidade: string
          p_nome: string
          p_ordem_perguntas?: string
          p_perguntas?: Json
          p_usuario_id?: string
        }
        Returns: Json
      }
      lms_upsert_bloco: {
        Args: {
          p_cor_ident?: string
          p_descricao?: string
          p_id?: string
          p_id_entidade?: string
          p_titulo?: string
          p_usuario_id?: string
        }
        Returns: Json
      }
      lms_upsert_conteudo: {
        Args: {
          p_descricao?: string
          p_id?: string
          p_id_arquivo?: string
          p_id_entidade?: string
          p_tipo?: string
          p_titulo?: string
          p_url?: string
          p_usuario_id?: string
        }
        Returns: Json
      }
      lms_upsert_distribuicao: {
        Args: {
          p_id_area?: string
          p_id_componente?: string
          p_id_conteudo: string
          p_id_curso?: string
          p_id_entidade: string
          p_id_modulo?: string
          p_usuario_id?: string
        }
        Returns: Json
      }
      lms_upsert_operacional: {
        Args: {
          p_ativo?: boolean
          p_data_disponivel?: string
          p_data_entrega_limite?: string
          p_destaque?: boolean
          p_duracao_minutos?: number
          p_id_calendario?: string
          p_id_ciclo?: string
          p_id_conteudo: string
          p_id_entidade: string
          p_id_programa?: string
          p_pontuacao_maxima?: number
          p_tentativas_permitidas?: number
          p_usuario_id?: string
        }
        Returns: Json
      }
      lms_upsert_submissao_atividade: {
        Args: {
          p_id_arquivo_envio?: string
          p_id_conteudo: string
          p_id_entidade: string
          p_id_matricula: string
          p_status?: string
          p_texto_resposta?: string
        }
        Returns: Json
      }
      lms_user_expandido_id: { Args: never; Returns: string }
      lms_usuario_eh_estudante: { Args: never; Returns: boolean }
      lms_usuario_eh_gestor: { Args: never; Returns: boolean }
      lms_usuario_pertence_entidade: {
        Args: { p_id_entidade: string }
        Returns: boolean
      }
      nxt_get_user_session_v1: { Args: { p_auth_id: string }; Returns: Json }
      nxt_upsert_area: {
        Args: {
          p_criado_por: string
          p_descricao: string
          p_id: string
          p_id_entidade: string
          p_nome_area: string
        }
        Returns: string
      }
      salvar_lead_mensagem: {
        Args: {
          p_email: string
          p_empresa: string
          p_id_entidade: string
          p_mensagem: string
          p_nome: string
        }
        Returns: Json
      }
      unaccent: { Args: { "": string }; Returns: string }
      upsert_categoria_nome: {
        Args: {
          p_id?: string
          p_id_entidade?: string
          p_id_pai?: string
          p_nivel?: number
          p_nome?: string
          p_tipo?: string
        }
        Returns: {
          criado_em: string
          criado_por: string
          id: string
          id_entidade: string
          id_pai: string
          nivel: number
          nome: string
          ordem: number
          tipo: string
        }[]
      }
      upsert_conta_nome: {
        Args: {
          p_id?: string
          p_id_entidade?: string
          p_id_pai?: string
          p_nivel?: number
          p_nome?: string
          p_tipo?: Database["public"]["Enums"]["fin_tipo_conta"]
        }
        Returns: {
          criado_em: string
          criado_por: string
          id: string
          id_entidade: string
          id_pai: string
          nivel: number
          nome: string
          ordem: number
          saldo_inicial: number
          tipo: Database["public"]["Enums"]["fin_tipo_conta"]
        }[]
      }
      upsert_noticia: {
        Args: {
          p_header: string
          p_id: string
          p_id_entidade: string
          p_noticia: string
          p_publicada: boolean
        }
        Returns: string
      }
      upsert_status_noticia: {
        Args: { p_id: string; p_id_entidade: string; p_publicada: boolean }
        Returns: boolean
      }
    }
    Enums: {
      fin_tipo_conta: "Banco" | "Carteira" | "Cartão" | "Investimento"
      lms_status_submissao:
        | "em_andamento"
        | "entregue"
        | "corrigido"
        | "rascunho"
      lms_tipo_item: "material" | "atividade" | "avaliacao"
      lms_tipo_pergunta: "dissertativa" | "multipla_escolha"
      lms_tipo_submissao_atv: "texto" | "arquivo" | "texto_e_arquivo"
      tipo_candidatura: "estudante" | "docente" | "externo"
      tipo_largura: "1" | "2"
      tipo_pagamento_oferta: "unico" | "recorrente"
      tipo_processo: "matricula" | "seletivo"
      tipo_status_pedido: "pendente" | "concluido" | "cancelado" | "reembolsado"
      tipo_turno:
        | "Matutino"
        | "Vespertino"
        | "Noturno"
        | "Matutino/Vespertino"
        | "Vespertino/Noturno"
        | "Integral"
      tipo_visibilidade: "publica" | "oculta"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      fin_tipo_conta: ["Banco", "Carteira", "Cartão", "Investimento"],
      lms_status_submissao: [
        "em_andamento",
        "entregue",
        "corrigido",
        "rascunho",
      ],
      lms_tipo_item: ["material", "atividade", "avaliacao"],
      lms_tipo_pergunta: ["dissertativa", "multipla_escolha"],
      lms_tipo_submissao_atv: ["texto", "arquivo", "texto_e_arquivo"],
      tipo_candidatura: ["estudante", "docente", "externo"],
      tipo_largura: ["1", "2"],
      tipo_pagamento_oferta: ["unico", "recorrente"],
      tipo_processo: ["matricula", "seletivo"],
      tipo_status_pedido: ["pendente", "concluido", "cancelado", "reembolsado"],
      tipo_turno: [
        "Matutino",
        "Vespertino",
        "Noturno",
        "Matutino/Vespertino",
        "Vespertino/Noturno",
        "Integral",
      ],
      tipo_visibilidade: ["publica", "oculta"],
    },
  },
} as const
