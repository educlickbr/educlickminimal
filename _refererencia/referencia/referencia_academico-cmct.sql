CREATE TABLE public.cmct_area_cursos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    criado_em timestamp with time zone DEFAULT now()
);


ALTER TABLE public.cmct_area_cursos OWNER TO postgres;

--
-- Name: cmct_calendario_aulas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cmct_calendario_aulas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_ciclo uuid NOT NULL,
    id_programa uuid NOT NULL,
    titulo text NOT NULL,
    descricao text,
    data_inicio timestamp with time zone NOT NULL,
    data_fim timestamp with time zone NOT NULL,
    cor_fundo text,
    cor_borda text,
    cor_texto text,
    dia_inteiro boolean DEFAULT false,
    id_grupo uuid,
    criado_em timestamp with time zone DEFAULT now(),
    modificado_em timestamp with time zone DEFAULT now(),
    criado_por uuid,
    modificado_por uuid
);


ALTER TABLE public.cmct_calendario_aulas OWNER TO postgres;

--
-- Name: cmct_ciclos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cmct_ciclos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_modulo uuid NOT NULL,
    codigo_interno text,
    data_inicio date NOT NULL,
    data_fim date NOT NULL,
    ativo boolean DEFAULT true,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone,
    criado_por uuid,
    modificado_por uuid,
    turno text,
    carga_horaria_ciclo integer,
    dias_adicionais integer,
    aulas_por_dia integer
);


ALTER TABLE public.cmct_ciclos OWNER TO postgres;

--
-- Name: cmct_ciclos_dias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cmct_ciclos_dias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_ciclo uuid NOT NULL,
    dia_semana integer NOT NULL
);


ALTER TABLE public.cmct_ciclos_dias OWNER TO postgres;

--
-- Name: cmct_ciclos_horarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cmct_ciclos_horarios (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_ciclo_dia uuid NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fim time without time zone NOT NULL
);


ALTER TABLE public.cmct_ciclos_horarios OWNER TO postgres;

--
-- Name: cmct_componentes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cmct_componentes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_modulo uuid NOT NULL,
    nome text NOT NULL,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone,
    criado_por uuid,
    modificado_por uuid,
    carga_horaria integer
);


ALTER TABLE public.cmct_componentes OWNER TO postgres;

--
-- Name: cmct_componentes_extras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cmct_componentes_extras (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_ciclo uuid NOT NULL,
    nome text NOT NULL,
    carga_horaria integer NOT NULL,
    justificativa text,
    criado_em timestamp with time zone DEFAULT now(),
    criado_por uuid
);


ALTER TABLE public.cmct_componentes_extras OWNER TO postgres;

--
-- Name: cmct_curso_modulo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cmct_curso_modulo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_curso uuid NOT NULL,
    id_modulo uuid NOT NULL
);


ALTER TABLE public.cmct_curso_modulo OWNER TO postgres;

--
-- Name: cmct_cursos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cmct_cursos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    id_area uuid NOT NULL,
    codigo_interno text,
    nivel text,
    modalidade text,
    descricao_curta text,
    descricao_longa text,
    imagem text,
    ativo boolean DEFAULT true,
    observacoes text,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone,
    criado_por uuid,
    modificado_por uuid,
    nome_arquivo_original_imagem text
);


ALTER TABLE public.cmct_cursos OWNER TO postgres;

--
-- Name: cmct_modulos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cmct_modulos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    carga_horaria integer NOT NULL,
    descricao_curta text,
    descricao_longa text,
    nivel public.enum_nivel_cursos,
    codigo_interno text,
    ativo boolean DEFAULT true,
    observacoes text,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone,
    criado_por uuid,
    modificado_por uuid,
    cor text
);


ALTER TABLE public.cmct_modulos OWNER TO postgres;

--
-- Name: COLUMN cmct_modulos.cor; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cmct_modulos.cor IS 'cor do módulo';


--
-- Name: cmct_plano_aulas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cmct_plano_aulas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_componente uuid NOT NULL,
    nome text NOT NULL,
    descricao text,
    ementa text,
    bibliografia text,
    observacoes text,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone,
    criado_por uuid,
    modificado_por uuid
);


ALTER TABLE public.cmct_plano_aulas OWNER TO postgres;

--
-- Name: cmct_plano_de_curso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cmct_plano_de_curso (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_curso uuid NOT NULL,
    nome text NOT NULL,
    plano text,
    arquivo text,
    nome_arquivo_original text,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone,
    criado_por uuid,
    modificado_por uuid
);


ALTER TABLE public.cmct_plano_de_curso OWNER TO postgres;

--
-- Name: cmct_programa_ciclo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cmct_programa_ciclo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_programa uuid NOT NULL,
    id_ciclo uuid NOT NULL,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone,
    criado_por uuid,
    modificado_por uuid
);


ALTER TABLE public.cmct_programa_ciclo OWNER TO postgres;

--
-- Name: cmct_programas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cmct_programas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_curso uuid NOT NULL,
    nome text NOT NULL,
    codigo_interno text,
    descricao text,
    ativo boolean DEFAULT true,
    criado_em timestamp with time zone DEFAULT now(),
    atualizado_em timestamp with time zone,
    criado_por uuid,
    modificado_por uuid
);


ALTER TABLE public.cmct_programas OWNER TO postgres;

--
-- Name: eq_atribuicoes_equipe; Type: TABLE; Schema: public; Owner: postgres
--