import {
  int, mysqlEnum, mysqlTable, text, timestamp, varchar,
  boolean, decimal, json
} from "drizzle-orm/mysql-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = mysqlEnum("role", [
  "admin",
  "coordenador",
  "avaliador_documental",
  "membro_banca",
  "candidato",
]);

export const certStatusEnum = mysqlEnum("cert_status", [
  "ativa", "em_breve", "inativa", "encerrada",
]);

export const certColorEnum = mysqlEnum("cert_color", [
  "blue", "gold", "green", "purple", "orange", "red", "teal",
]);

export const caminhoEnum = mysqlEnum("caminho", ["A", "B"]);

export const candidatoEtapaEnum = mysqlEnum("candidato_etapa", [
  "cadastro",
  "pagamento_1",
  "upload_documentos",
  "validacao_documental",
  "avaliacao_teorica",
  "entrevista",
  "pagamento_2",
  "certificado",
  "encerrado",
]);

export const avaliadorTipoEnum = mysqlEnum("avaliador_tipo", [
  "documental", "entrevista", "ambos",
]);

export const avaliadorStatusEnum = mysqlEnum("avaliador_status", [
  "ativo", "inativo", "afastado",
]);

export const bancaStatusEnum = mysqlEnum("banca_status", [
  "ativa", "inativa",
]);

export const membroPapelEnum = mysqlEnum("membro_papel", [
  "presidente", "membro",
]);

export const atribuicaoStatusEnum = mysqlEnum("atribuicao_status", [
  "pendente", "em_andamento", "concluida", "cancelada",
]);

export const atribuicaoTipoEnum = mysqlEnum("atribuicao_tipo", [
  "documental", "entrevista",
]);

export const docStatusEnum = mysqlEnum("doc_status", [
  "pendente", "aprovado", "reprovado",
]);

export const encaminhamentoEnum = mysqlEnum("encaminhamento", [
  "caminho_a", "caminho_b", "reprovado",
]);

export const eventoStatusEnum = mysqlEnum("evento_status", [
  "pendente", "enviado", "erro",
]);

export const cursoNivelEnum = mysqlEnum("curso_nivel", [
  "basico", "intermediario", "avancado",
]);

export const cursoCategoriaEnum = mysqlEnum("curso_categoria", [
  "controladoria", "financas", "gestao", "sustentabilidade", "lideranca", "outros",
]);

// ─── Tabelas ──────────────────────────────────────────────────────────────────

/**
 * Usuários — base de autenticação. Todos os perfis passam por aqui.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum.default("candidato").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Certificações — CCA, CCA Plus, EcodoBem N1-N4.
 * Gerenciadas pelo admin via painel.
 */
export const certificacoes = mysqlTable("certificacoes", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(), // "cca", "cca-plus", "ecodobem-n1"
  nome: varchar("nome", { length: 128 }).notNull(),
  subtitulo: varchar("subtitulo", { length: 128 }),
  descricao: text("descricao"),
  descricaoBreve: varchar("descricaoBreve", { length: 255 }),
  publicoAlvo: text("publicoAlvo"),
  competencias: json("competencias").$type<string[]>(),
  preRequisitos: json("preRequisitos").$type<string[]>(),
  documentosExigidos: json("documentosExigidos").$type<string[]>(),
  taxaAnalise: decimal("taxaAnalise", { precision: 10, scale: 2 }).default("0.00"),
  taxaEmissao: decimal("taxaEmissao", { precision: 10, scale: 2 }).default("0.00"),
  caminhoDefault: caminhoEnum,
  status: certStatusEnum.default("ativa").notNull(),
  cor: certColorEnum.default("blue").notNull(),
  imagemUrl: text("imagemUrl"),
  editalUrl: text("editalUrl"),
  /** Conteúdo "Como Funciona" — JSON com etapas, investimento, inclusões */
  comoFunciona: json("comoFunciona").$type<{
    titulo: string;
    subtitulo: string;
    etapas: Array<{ numero: string; titulo: string; descricao: string; nota?: string }>;
    investimento?: string;
    inclusoes?: string;
    observacoes?: string;
  }>(),
  ordem: int("ordem").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Candidatos — dados do processo de certificação.
 * Um usuário pode ter múltiplos processos (uma por certificação).
 */
export const candidatos = mysqlTable("candidatos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → users.id
  certificacaoId: int("certificacaoId").notNull(), // FK → certificacoes.id
  // Dados pessoais e profissionais
  nomeCompleto: varchar("nomeCompleto", { length: 255 }),
  cpf: varchar("cpf", { length: 14 }),
  telefone: varchar("telefone", { length: 20 }),
  empresa: varchar("empresa", { length: 255 }),
  cargo: varchar("cargo", { length: 128 }),
  anosExperiencia: int("anosExperiencia"),
  formacao: varchar("formacao", { length: 255 }),
  linkedin: varchar("linkedin", { length: 255 }),
  // Processo
  etapaAtual: candidatoEtapaEnum.default("cadastro").notNull(),
  caminho: caminhoEnum, // definido após validação documental
  // Pagamentos
  pagamento1Status: mysqlEnum("pagamento1Status", ["pendente", "pago", "cancelado"]).default("pendente"),
  pagamento1Data: timestamp("pagamento1Data"),
  pagamento2Status: mysqlEnum("pagamento2Status", ["pendente", "pago", "cancelado"]).default("pendente"),
  pagamento2Data: timestamp("pagamento2Data"),
  // Resultado final
  aprovado: boolean("aprovado"),
  certificadoUrl: text("certificadoUrl"),
  certificadoEmitidoEm: timestamp("certificadoEmitidoEm"),
  // Metadados
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Documentos enviados pelos candidatos — armazenados no S3.
 */
export const documentos = mysqlTable("documentos", {
  id: int("id").autoincrement().primaryKey(),
  candidatoId: int("candidatoId").notNull(), // FK → candidatos.id
  nomeDocumento: varchar("nomeDocumento", { length: 255 }).notNull(), // "Diploma de Graduação"
  tipoDocumento: varchar("tipoDocumento", { length: 64 }), // "diploma", "declaracao", "conduta"
  s3Key: varchar("s3Key", { length: 512 }).notNull(),
  s3Url: text("s3Url"),
  mimeType: varchar("mimeType", { length: 64 }),
  tamanhoBytes: int("tamanhoBytes"),
  status: docStatusEnum.default("pendente").notNull(),
  // Análise do avaliador
  checklistRespostas: json("checklistRespostas").$type<Record<string, boolean>>(),
  parecer: text("parecer"),
  avaliadorId: int("avaliadorId"), // FK → avaliadores.id
  avaliadoEm: timestamp("avaliadoEm"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Avaliadores documentais e de entrevista.
 */
export const avaliadores = mysqlTable("avaliadores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // FK → users.id (opcional — avaliador pode não ter login ainda)
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  telefone: varchar("telefone", { length: 20 }),
  empresa: varchar("empresa", { length: 255 }),
  cargo: varchar("cargo", { length: 128 }),
  tipo: avaliadorTipoEnum.notNull(),
  status: avaliadorStatusEnum.default("ativo").notNull(),
  certificacoesHabilitadas: json("certificacoesHabilitadas").$type<number[]>(), // IDs de certificacoes
  totalAtribuicoes: int("totalAtribuicoes").default(0).notNull(),
  atribuicoesAtivas: int("atribuicoesAtivas").default(0).notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Bancas de entrevista — Banca 1, Banca 2...
 */
export const bancas = mysqlTable("bancas", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 64 }).notNull(), // "Banca 1", "Banca 2"
  numero: int("numero").notNull(),
  certificacoesHabilitadas: json("certificacoesHabilitadas").$type<number[]>(),
  status: bancaStatusEnum.default("ativa").notNull(),
  totalEntrevistas: int("totalEntrevistas").default(0).notNull(),
  entrevistasAtivas: int("entrevistasAtivas").default(0).notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Membros de cada banca (1 a 5 por banca).
 */
export const membrosBanca = mysqlTable("membros_banca", {
  id: int("id").autoincrement().primaryKey(),
  bancaId: int("bancaId").notNull(), // FK → bancas.id
  avaliadorId: int("avaliadorId").notNull(), // FK → avaliadores.id
  papel: membroPapelEnum.default("membro").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Atribuições — liga candidato a avaliador documental ou banca de entrevista.
 */
export const atribuicoes = mysqlTable("atribuicoes", {
  id: int("id").autoincrement().primaryKey(),
  candidatoId: int("candidatoId").notNull(),
  tipo: atribuicaoTipoEnum.notNull(),
  avaliadorId: int("avaliadorId"), // para análise documental
  bancaId: int("bancaId"),         // para entrevista
  status: atribuicaoStatusEnum.default("pendente").notNull(),
  // Resultado da análise documental
  encaminhamento: encaminhamentoEnum,
  parecerGeral: text("parecerGeral"),
  decisaoEm: timestamp("decisaoEm"),
  // Entrevista
  dataEntrevista: timestamp("dataEntrevista"),
  resultadoEntrevista: mysqlEnum("resultadoEntrevista", ["aprovado", "reprovado"]),
  observacoesEntrevista: text("observacoesEntrevista"),
  // Metadados
  atribuidoEm: timestamp("atribuidoEm").defaultNow().notNull(),
  concluidoEm: timestamp("concluidoEm"),
});

/**
 * Cursos — gerenciados pelo admin, com link externo (Hotmart, Kiwify etc.).
 */
export const cursos = mysqlTable("cursos", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  categoria: cursoCategoriaEnum.default("controladoria").notNull(),
  nivel: cursoNivelEnum.default("basico").notNull(),
  duracaoHoras: int("duracaoHoras"),
  instrutor: varchar("instrutor", { length: 255 }),
  preco: decimal("preco", { precision: 10, scale: 2 }),
  linkCompra: text("linkCompra"), // URL externa (Hotmart, Kiwify etc.)
  imagemUrl: text("imagemUrl"),
  certificacaoRelacionadaId: int("certificacaoRelacionadaId"), // FK → certificacoes.id
  destaque: boolean("destaque").default(false),
  ativo: boolean("ativo").default(true),
  ordem: int("ordem").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Pacotes de cursos.
 */
export const pacotesCursos = mysqlTable("pacotes_cursos", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  preco: decimal("preco", { precision: 10, scale: 2 }),
  linkCompra: text("linkCompra"),
  imagemUrl: text("imagemUrl"),
  cursosIds: json("cursosIds").$type<number[]>(),
  certificacaoRelacionadaId: int("certificacaoRelacionadaId"),
  destaque: boolean("destaque").default(false),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Leads capturados no site público (antes do login).
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  certificacaoInteresse: varchar("certificacaoInteresse", { length: 64 }),
  origem: varchar("origem", { length: 64 }), // "quero_me_certificar", "quero_me_preparar"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Eventos — log de cada etapa concluída pelo candidato.
 * Estrutura preparada para envio de e-mail na Fase 2.
 */
export const eventos = mysqlTable("eventos", {
  id: int("id").autoincrement().primaryKey(),
  candidatoId: int("candidatoId").notNull(),
  etapa: candidatoEtapaEnum.notNull(),
  descricao: varchar("descricao", { length: 255 }).notNull(), // "Candidato realizou upload de documentos"
  // Destinatários que DEVERÃO ser notificados (Fase 2)
  destinatarios: json("destinatarios").$type<Array<{
    papel: string;
    nome: string;
    email: string;
    assunto: string;
    mensagem: string;
  }>>(),
  // Status de envio (Fase 2 preencherá isso)
  statusNotificacao: eventoStatusEnum.default("pendente").notNull(),
  notificadoEm: timestamp("notificadoEm"),
  metadados: json("metadados").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Tipos inferidos ──────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Certificacao = typeof certificacoes.$inferSelect;
export type InsertCertificacao = typeof certificacoes.$inferInsert;
export type Candidato = typeof candidatos.$inferSelect;
export type InsertCandidato = typeof candidatos.$inferInsert;
export type Documento = typeof documentos.$inferSelect;
export type InsertDocumento = typeof documentos.$inferInsert;
export type Avaliador = typeof avaliadores.$inferSelect;
export type InsertAvaliador = typeof avaliadores.$inferInsert;
export type Banca = typeof bancas.$inferSelect;
export type InsertBanca = typeof bancas.$inferInsert;
export type MembroBanca = typeof membrosBanca.$inferSelect;
export type Atribuicao = typeof atribuicoes.$inferSelect;
export type Curso = typeof cursos.$inferSelect;
export type InsertCurso = typeof cursos.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type Evento = typeof eventos.$inferSelect;
export type InsertEvento = typeof eventos.$inferInsert;
