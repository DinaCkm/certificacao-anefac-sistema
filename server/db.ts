import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, candidatos, certificacoes, documentos, avaliadores,
  bancas, membrosBanca, atribuicoes, cursos, pacotesCursos, leads, eventos,
  InsertUser, InsertCandidato, InsertCertificacao, InsertAvaliador,
  InsertCurso, InsertEvento, InsertDocumento,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value !== undefined) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  // Owner sempre é admin
  if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  } else if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: typeof users.$inferSelect["role"]) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Certificações ────────────────────────────────────────────────────────────

export async function getCertificacoes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(certificacoes).orderBy(certificacoes.ordem);
}

export async function getCertificacaoBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(certificacoes).where(eq(certificacoes.slug, slug)).limit(1);
  return result[0];
}

export async function getCertificacaoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(certificacoes).where(eq(certificacoes.id, id)).limit(1);
  return result[0];
}

export async function upsertCertificacao(data: InsertCertificacao & { id?: number }) {
  const db = await getDb();
  if (!db) return;
  if (data.id) {
    const { id, ...rest } = data;
    await db.update(certificacoes).set(rest).where(eq(certificacoes.id, id));
  } else {
    await db.insert(certificacoes).values(data);
  }
}

export async function deleteCertificacao(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(certificacoes).where(eq(certificacoes.id, id));
}

// ─── Candidatos ───────────────────────────────────────────────────────────────

export async function getCandidatosByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(candidatos).where(eq(candidatos.userId, userId)).orderBy(desc(candidatos.createdAt));
}

export async function getCandidatoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(candidatos).where(eq(candidatos.id, id)).limit(1);
  return result[0];
}

export async function getAllCandidatos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(candidatos).orderBy(desc(candidatos.createdAt));
}

export async function createCandidato(data: InsertCandidato) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(candidatos).values(data);
  return result[0];
}

export async function updateCandidato(id: number, data: Partial<typeof candidatos.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(candidatos).set(data).where(eq(candidatos.id, id));
}

// ─── Documentos ───────────────────────────────────────────────────────────────

export async function getDocumentosByCandidato(candidatoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documentos).where(eq(documentos.candidatoId, candidatoId));
}

export async function createDocumento(data: InsertDocumento) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(documentos).values(data);
  return result[0];
}

export async function updateDocumento(id: number, data: Partial<typeof documentos.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(documentos).set(data).where(eq(documentos.id, id));
}

// ─── Avaliadores ──────────────────────────────────────────────────────────────

export async function getAvaliadores() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(avaliadores).orderBy(avaliadores.nome);
}

export async function getAvaliadorById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(avaliadores).where(eq(avaliadores.id, id)).limit(1);
  return result[0];
}

export async function createAvaliador(data: InsertAvaliador) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(avaliadores).values(data);
  return result[0];
}

export async function updateAvaliador(id: number, data: Partial<typeof avaliadores.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(avaliadores).set(data).where(eq(avaliadores.id, id));
}

export async function deleteAvaliador(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(avaliadores).where(eq(avaliadores.id, id));
}

/**
 * Distribui candidato para o avaliador documental com menor carga,
 * habilitado para a certificação solicitada.
 */
export async function atribuirAvaliadorDocumental(
  candidatoId: number,
  certificacaoId: number
): Promise<typeof avaliadores.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;

  const todos = await db.select().from(avaliadores).where(
    and(
      eq(avaliadores.status, "ativo"),
      sql`JSON_CONTAINS(${avaliadores.certificacoesHabilitadas}, ${JSON.stringify(certificacaoId)})`
    )
  );

  const disponiveis = todos.filter(
    (a) => a.tipo === "documental" || a.tipo === "ambos"
  );
  if (disponiveis.length === 0) return null;

  const minCarga = Math.min(...disponiveis.map((a) => a.atribuicoesAtivas));
  const empatados = disponiveis.filter((a) => a.atribuicoesAtivas === minCarga);
  const escolhido = empatados[Math.floor(Math.random() * empatados.length)];

  // Registra atribuição e incrementa contadores
  await db.insert(atribuicoes).values({
    candidatoId,
    tipo: "documental",
    avaliadorId: escolhido.id,
    status: "pendente",
  });
  await db.update(avaliadores).set({
    atribuicoesAtivas: escolhido.atribuicoesAtivas + 1,
    totalAtribuicoes: escolhido.totalAtribuicoes + 1,
  }).where(eq(avaliadores.id, escolhido.id));

  return escolhido;
}

// ─── Bancas ───────────────────────────────────────────────────────────────────

export async function getBancas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bancas).orderBy(bancas.numero);
}

export async function getBancaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bancas).where(eq(bancas.id, id)).limit(1);
  return result[0];
}

export async function getMembrosDaBanca(bancaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(membrosBanca).where(eq(membrosBanca.bancaId, bancaId));
}

export async function createBanca(data: typeof bancas.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(bancas).values(data);
  return result[0];
}

export async function updateBanca(id: number, data: Partial<typeof bancas.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(bancas).set(data).where(eq(bancas.id, id));
}

export async function deleteBanca(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(membrosBanca).where(eq(membrosBanca.bancaId, id));
  await db.delete(bancas).where(eq(bancas.id, id));
}

export async function setMembrosBanca(bancaId: number, membros: Array<{ avaliadorId: number; papel: "presidente" | "membro" }>) {
  const db = await getDb();
  if (!db) return;
  await db.delete(membrosBanca).where(eq(membrosBanca.bancaId, bancaId));
  if (membros.length > 0) {
    await db.insert(membrosBanca).values(membros.map((m) => ({ bancaId, ...m })));
  }
}

/**
 * Distribui candidato para a banca com menor carga, habilitada para a certificação.
 */
export async function atribuirBancaEntrevista(
  candidatoId: number,
  certificacaoId: number
): Promise<typeof bancas.$inferSelect | null> {
  const db = await getDb();
  if (!db) return null;

  const todas = await db.select().from(bancas).where(eq(bancas.status, "ativa"));
  const disponiveis = todas.filter((b) => {
    const habilitadas = (b.certificacoesHabilitadas as number[] | null) ?? [];
    return habilitadas.includes(certificacaoId) && b.entrevistasAtivas < 5;
  });
  if (disponiveis.length === 0) return null;

  const minCarga = Math.min(...disponiveis.map((b) => b.entrevistasAtivas));
  const empatadas = disponiveis.filter((b) => b.entrevistasAtivas === minCarga);
  const escolhida = empatadas[Math.floor(Math.random() * empatadas.length)];

  await db.insert(atribuicoes).values({
    candidatoId,
    tipo: "entrevista",
    bancaId: escolhida.id,
    status: "pendente",
  });
  await db.update(bancas).set({
    entrevistasAtivas: escolhida.entrevistasAtivas + 1,
    totalEntrevistas: escolhida.totalEntrevistas + 1,
  }).where(eq(bancas.id, escolhida.id));

  return escolhida;
}

// ─── Atribuições ──────────────────────────────────────────────────────────────

export async function getAtribuicoesDoCandidato(candidatoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(atribuicoes).where(eq(atribuicoes.candidatoId, candidatoId));
}

export async function getAtribuicoesDoAvaliador(avaliadorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(atribuicoes).where(
    and(eq(atribuicoes.avaliadorId, avaliadorId), eq(atribuicoes.tipo, "documental"))
  );
}

export async function updateAtribuicao(id: number, data: Partial<typeof atribuicoes.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(atribuicoes).set(data).where(eq(atribuicoes.id, id));
}

// ─── Cursos ───────────────────────────────────────────────────────────────────

export async function getCursos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cursos).where(eq(cursos.ativo, true)).orderBy(cursos.ordem);
}

export async function getAllCursos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cursos).orderBy(cursos.ordem);
}

export async function createCurso(data: InsertCurso) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(cursos).values(data);
  return result[0];
}

export async function updateCurso(id: number, data: Partial<InsertCurso>) {
  const db = await getDb();
  if (!db) return;
  await db.update(cursos).set(data).where(eq(cursos.id, id));
}

export async function deleteCurso(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cursos).where(eq(cursos.id, id));
}

export async function getPacotesCursos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pacotesCursos).where(eq(pacotesCursos.ativo, true));
}

export async function getAllPacotes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pacotesCursos);
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export async function createLead(data: typeof leads.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(leads).values(data);
  return result[0];
}

export async function getLeads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

export async function createEvento(data: InsertEvento) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(eventos).values(data);
  return result[0];
}

export async function getEventosByCandidato(candidatoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(eventos).where(eq(eventos.candidatoId, candidatoId)).orderBy(desc(eventos.createdAt));
}

export async function getAllEventosPendentes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(eventos).where(eq(eventos.statusNotificacao, "pendente")).orderBy(desc(eventos.createdAt));
}

export async function getAllEventos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(eventos).orderBy(desc(eventos.createdAt));
}

// ─── Helpers de evento por etapa ──────────────────────────────────────────────

/**
 * Mapeamento de destinatários por etapa — usado para preencher a tabela de eventos.
 * Na Fase 2, o sistema de e-mail lerá esses dados para disparar as notificações.
 */
export function buildDestinatariosEvento(
  etapa: string,
  candidatoNome: string,
  candidatoEmail: string,
  adminEmail: string,
  avaliadorEmail?: string,
  avaliadorNome?: string,
  membrosBancaList?: Array<{ nome: string; email: string }>
) {
  const dest: Array<{ papel: string; nome: string; email: string; assunto: string; mensagem: string }> = [];

  const etapaLabels: Record<string, string> = {
    cadastro: "Cadastro realizado",
    pagamento_1: "Pagamento da Taxa de Análise",
    upload_documentos: "Upload de documentos",
    validacao_documental: "Resultado da análise documental",
    avaliacao_teorica: "Avaliação teórica agendada",
    entrevista: "Entrevista agendada",
    pagamento_2: "Pagamento da Taxa de Emissão",
    certificado: "Certificado emitido",
    encerrado: "Processo encerrado",
  };

  const label = etapaLabels[etapa] || etapa;

  // Candidato sempre recebe
  dest.push({
    papel: "candidato",
    nome: candidatoNome,
    email: candidatoEmail,
    assunto: `ANEFAC — ${label}`,
    mensagem: `Olá ${candidatoNome}, sua etapa "${label}" foi registrada com sucesso no sistema ANEFAC.`,
  });

  // Admin sempre recebe
  dest.push({
    papel: "admin",
    nome: "Administrador ANEFAC",
    email: adminEmail,
    assunto: `[ANEFAC Admin] ${candidatoNome} — ${label}`,
    mensagem: `O candidato ${candidatoNome} concluiu a etapa: ${label}.`,
  });

  // Avaliador documental recebe quando upload é feito
  if (etapa === "upload_documentos" && avaliadorEmail) {
    dest.push({
      papel: "avaliador_documental",
      nome: avaliadorNome || "Avaliador",
      email: avaliadorEmail,
      assunto: `[ANEFAC] Novo candidato para análise documental — ${candidatoNome}`,
      mensagem: `O candidato ${candidatoNome} enviou os documentos e aguarda sua análise.`,
    });
  }

  // Membros da banca recebem quando entrevista é agendada
  if (etapa === "entrevista" && membrosBancaList?.length) {
    for (const membro of membrosBancaList) {
      dest.push({
        papel: "membro_banca",
        nome: membro.nome,
        email: membro.email,
        assunto: `[ANEFAC] Entrevista agendada — ${candidatoNome}`,
        mensagem: `Uma entrevista foi agendada com o candidato ${candidatoNome}. Verifique o painel para detalhes.`,
      });
    }
  }

  return dest;
}
