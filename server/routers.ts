import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  upsertUser, getUserByOpenId, getAllUsers, updateUserRole,
  getCertificacoes, getCertificacaoBySlug, getCertificacaoById, upsertCertificacao, deleteCertificacao,
  getCandidatosByUserId, getCandidatoById, getAllCandidatos, createCandidato, updateCandidato,
  getDocumentosByCandidato, createDocumento, updateDocumento,
  getAvaliadores, getAvaliadorById, createAvaliador, updateAvaliador, deleteAvaliador, atribuirAvaliadorDocumental,
  getBancas, getBancaById, getMembrosDaBanca, createBanca, updateBanca, deleteBanca, setMembrosBanca, atribuirBancaEntrevista,
  getAtribuicoesDoCandidato, getAtribuicoesDoAvaliador, updateAtribuicao,
  getCursos, getAllCursos, createCurso, updateCurso, deleteCurso, getPacotesCursos, getAllPacotes,
  createLead, getLeads,
  createEvento, getEventosByCandidato, getAllEventosPendentes, getAllEventos,
  buildDestinatariosEvento,
} from "./db";

// ─── Middlewares de papel ─────────────────────────────────────────────────────

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  return next({ ctx });
});

const adminOrCoordenadorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "coordenador")
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores e coordenadores." });
  return next({ ctx });
});

const avaliadorProcedure = protectedProcedure.use(({ ctx, next }) => {
  const roles = ["admin", "coordenador", "avaliador_documental"];
  if (!roles.includes(ctx.user.role))
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a avaliadores." });
  return next({ ctx });
});

// ─── Router principal ─────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["admin", "coordenador", "avaliador_documental", "membro_banca", "candidato"]) }))
      .mutation(async ({ input }) => {
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    listUsers: adminProcedure.query(async () => getAllUsers()),
  }),

  // ── Certificações ─────────────────────────────────────────────────────────
  certificacoes: router({
    list: publicProcedure.query(async () => getCertificacoes()),
    bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const cert = await getCertificacaoBySlug(input.slug);
      if (!cert) throw new TRPCError({ code: "NOT_FOUND" });
      return cert;
    }),
    byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const cert = await getCertificacaoById(input.id);
      if (!cert) throw new TRPCError({ code: "NOT_FOUND" });
      return cert;
    }),
    upsert: adminProcedure
      .input(z.object({
        id: z.number().optional(),
        slug: z.string(),
        nome: z.string(),
        subtitulo: z.string().optional(),
        descricao: z.string().optional(),
        descricaoBreve: z.string().optional(),
        publicoAlvo: z.string().optional(),
        competencias: z.array(z.string()).optional(),
        preRequisitos: z.array(z.string()).optional(),
        documentosExigidos: z.array(z.string()).optional(),
        taxaAnalise: z.string().optional(),
        taxaEmissao: z.string().optional(),
        caminhoDefault: z.enum(["A", "B"]).nullable().optional(),
        status: z.enum(["ativa", "em_breve", "inativa", "encerrada"]).optional(),
        cor: z.enum(["blue", "gold", "green", "purple", "orange", "red", "teal"]).optional(),
        imagemUrl: z.string().optional(),
        editalUrl: z.string().optional(),
        comoFunciona: z.any().optional(),
        ordem: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertCertificacao(input as any);
        return { success: true };
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteCertificacao(input.id);
      return { success: true };
    }),
  }),

  // ── Candidatos ────────────────────────────────────────────────────────────
  candidatos: router({
    meus: protectedProcedure.query(async ({ ctx }) => getCandidatosByUserId(ctx.user.id)),
    byId: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const c = await getCandidatoById(input.id);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      // Candidato só pode ver o próprio
      if (ctx.user.role === "candidato" && c.userId !== ctx.user.id)
        throw new TRPCError({ code: "FORBIDDEN" });
      return c;
    }),
    list: adminOrCoordenadorProcedure.query(async () => getAllCandidatos()),
    create: protectedProcedure
      .input(z.object({
        certificacaoId: z.number(),
        nomeCompleto: z.string().optional(),
        cpf: z.string().optional(),
        telefone: z.string().optional(),
        empresa: z.string().optional(),
        cargo: z.string().optional(),
        anosExperiencia: z.number().optional(),
        formacao: z.string().optional(),
        linkedin: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const candidato = await createCandidato({ ...input, userId: ctx.user.id });
        // Registra evento de cadastro
        await createEvento({
          candidatoId: (candidato as any)?.insertId ?? 0,
          etapa: "cadastro",
          descricao: `${ctx.user.name || "Candidato"} realizou o cadastro para a certificação.`,
          destinatarios: buildDestinatariosEvento(
            "cadastro",
            ctx.user.name || "Candidato",
            ctx.user.email || "",
            "admin@anefac.com.br"
          ),
        });
        return candidato;
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nomeCompleto: z.string().optional(),
        cpf: z.string().optional(),
        telefone: z.string().optional(),
        empresa: z.string().optional(),
        cargo: z.string().optional(),
        anosExperiencia: z.number().optional(),
        formacao: z.string().optional(),
        linkedin: z.string().optional(),
        etapaAtual: z.enum(["cadastro","pagamento_1","upload_documentos","validacao_documental","avaliacao_teorica","entrevista","pagamento_2","certificado","encerrado"]).optional(),
        caminho: z.enum(["A","B"]).nullable().optional(),
        pagamento1Status: z.enum(["pendente","pago","cancelado"]).optional(),
        pagamento2Status: z.enum(["pendente","pago","cancelado"]).optional(),
        aprovado: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const c = await getCandidatoById(id);
        if (!c) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role === "candidato" && c.userId !== ctx.user.id)
          throw new TRPCError({ code: "FORBIDDEN" });
        await updateCandidato(id, data as any);
        return { success: true };
      }),
    registrarPagamento1: protectedProcedure
      .input(z.object({ candidatoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const c = await getCandidatoById(input.candidatoId);
        if (!c) throw new TRPCError({ code: "NOT_FOUND" });
        await updateCandidato(input.candidatoId, {
          pagamento1Status: "pago",
          pagamento1Data: new Date(),
          etapaAtual: "upload_documentos",
        });
        await createEvento({
          candidatoId: input.candidatoId,
          etapa: "pagamento_1",
          descricao: `${ctx.user.name} efetuou o pagamento da Taxa de Análise e Avaliação.`,
          destinatarios: buildDestinatariosEvento("pagamento_1", ctx.user.name || "", ctx.user.email || "", "admin@anefac.com.br"),
        });
        return { success: true };
      }),
  }),

  // ── Documentos ────────────────────────────────────────────────────────────
  documentos: router({
    byCandidato: protectedProcedure.input(z.object({ candidatoId: z.number() })).query(async ({ input }) =>
      getDocumentosByCandidato(input.candidatoId)
    ),
    getUploadUrl: protectedProcedure
      .input(z.object({
        candidatoId: z.number(),
        filename: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { ENV } = await import("./_core/env");
        const forgeUrl = ENV.forgeApiUrl?.replace(/\/+$/, "");
        const forgeKey = ENV.forgeApiKey;
        if (!forgeUrl || !forgeKey) throw new Error("Storage não configurado.");
        const key = `candidatos/${input.candidatoId}/${Date.now()}_${input.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
        presignUrl.searchParams.set("path", key);
        const resp = await fetch(presignUrl.toString(), { headers: { Authorization: `Bearer ${forgeKey}` } });
        if (!resp.ok) throw new Error("Falha ao obter URL de upload.");
        const { url: uploadUrl } = await resp.json() as { url: string };
        return { uploadUrl, key, fileUrl: `/manus-storage/${key}` };
      }),
    create: protectedProcedure
      .input(z.object({
        candidatoId: z.number(),
        nomeDocumento: z.string(),
        tipoDocumento: z.string().optional(),
        s3Key: z.string(),
        s3Url: z.string().optional(),
        mimeType: z.string().optional(),
        tamanhoBytes: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const doc = await createDocumento(input);
        await createEvento({
          candidatoId: input.candidatoId,
          etapa: "upload_documentos",
          descricao: `${ctx.user.name || "Candidato"} enviou o documento: ${input.nomeDocumento}.`,
          destinatarios: buildDestinatariosEvento(
            "upload_documentos",
            ctx.user.name || "Candidato",
            ctx.user.email || "",
            "admin@anefac.com.br"
          ),
          metadados: { nomeDocumento: input.nomeDocumento, tipoDocumento: input.tipoDocumento },
        });
        return doc;
      }),
    getViewUrl: protectedProcedure
      .input(z.object({ s3Key: z.string() }))
      .query(async ({ input }) => {
        const { ENV } = await import("./_core/env");
        const forgeUrl = ENV.forgeApiUrl?.replace(/\/+$/, "");
        const forgeKey = ENV.forgeApiKey;
        if (!forgeUrl || !forgeKey) throw new Error("Storage não configurado.");
        const presignUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
        presignUrl.searchParams.set("path", input.s3Key);
        presignUrl.searchParams.set("expiresIn", "3600");
        const resp = await fetch(presignUrl.toString(), { headers: { Authorization: `Bearer ${forgeKey}` } });
        if (!resp.ok) throw new Error("Falha ao obter URL de visualização.");
        const { url } = await resp.json() as { url: string };
        return { url };
      }),
    analisar: avaliadorProcedure
      .input(z.object({
        id: z.number(),
        checklistRespostas: z.record(z.string(), z.boolean()).optional(),
        parecer: z.string().optional(),
        status: z.enum(["aprovado", "reprovado"]),
        avaliadorId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateDocumento(input.id, {
          checklistRespostas: input.checklistRespostas,
          parecer: input.parecer,
          status: input.status,
          avaliadorId: input.avaliadorId,
          avaliadoEm: new Date(),
        });
        return { success: true };
      }),
  }),

  // ── Avaliadores ───────────────────────────────────────────────────────────
  avaliadores: router({
    list: adminOrCoordenadorProcedure.query(async () => getAvaliadores()),
    byId: adminOrCoordenadorProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const a = await getAvaliadorById(input.id);
      if (!a) throw new TRPCError({ code: "NOT_FOUND" });
      return a;
    }),
    create: adminProcedure
      .input(z.object({
        nome: z.string(),
        email: z.string().email(),
        telefone: z.string().optional(),
        empresa: z.string().optional(),
        cargo: z.string().optional(),
        tipo: z.enum(["documental", "entrevista", "ambos"]),
        status: z.enum(["ativo", "inativo", "afastado"]).optional(),
        certificacoesHabilitadas: z.array(z.number()).optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createAvaliador(input as any);
        return result;
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        empresa: z.string().optional(),
        cargo: z.string().optional(),
        tipo: z.enum(["documental", "entrevista", "ambos"]).optional(),
        status: z.enum(["ativo", "inativo", "afastado"]).optional(),
        certificacoesHabilitadas: z.array(z.number()).optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateAvaliador(id, data as any);
        return { success: true };
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteAvaliador(input.id);
      return { success: true };
    }),
    atribuir: adminOrCoordenadorProcedure
      .input(z.object({ candidatoId: z.number(), certificacaoId: z.number() }))
      .mutation(async ({ input }) => {
        const avaliador = await atribuirAvaliadorDocumental(input.candidatoId, input.certificacaoId);
        if (!avaliador) throw new TRPCError({ code: "NOT_FOUND", message: "Nenhum avaliador disponível para esta certificação." });
        return avaliador;
      }),
    minhasAtribuicoes: avaliadorProcedure.query(async ({ ctx }) => {
      // Busca o avaliador pelo email do usuário logado
      const todos = await getAvaliadores();
      const avaliador = todos.find((a) => a.email === ctx.user.email);
      if (!avaliador) return [];
      return getAtribuicoesDoAvaliador(avaliador.id);
    }),
  }),

  // ── Bancas ────────────────────────────────────────────────────────────────
  bancas: router({
    list: adminOrCoordenadorProcedure.query(async () => {
      const todas = await getBancas();
      return Promise.all(todas.map(async (b) => ({
        ...b,
        membros: await getMembrosDaBanca(b.id),
      })));
    }),
    byId: adminOrCoordenadorProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const b = await getBancaById(input.id);
      if (!b) throw new TRPCError({ code: "NOT_FOUND" });
      return { ...b, membros: await getMembrosDaBanca(b.id) };
    }),
    create: adminProcedure
      .input(z.object({
        nome: z.string(),
        numero: z.number(),
        certificacoesHabilitadas: z.array(z.number()).optional(),
        status: z.enum(["ativa", "inativa"]).optional(),
        observacoes: z.string().optional(),
        membros: z.array(z.object({ avaliadorId: z.number(), papel: z.enum(["presidente", "membro"]) })).max(5),
      }))
      .mutation(async ({ input }) => {
        const { membros, ...bancaData } = input;
        const result = await createBanca(bancaData as any);
        const bancaId = (result as any)?.insertId;
        if (bancaId && membros.length > 0) {
          await setMembrosBanca(bancaId, membros);
        }
        return { success: true, bancaId };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        certificacoesHabilitadas: z.array(z.number()).optional(),
        status: z.enum(["ativa", "inativa"]).optional(),
        observacoes: z.string().optional(),
        membros: z.array(z.object({ avaliadorId: z.number(), papel: z.enum(["presidente", "membro"]) })).max(5).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, membros, ...data } = input;
        await updateBanca(id, data as any);
        if (membros !== undefined) await setMembrosBanca(id, membros);
        return { success: true };
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteBanca(input.id);
      return { success: true };
    }),
    atribuir: adminOrCoordenadorProcedure
      .input(z.object({ candidatoId: z.number(), certificacaoId: z.number() }))
      .mutation(async ({ input }) => {
        const banca = await atribuirBancaEntrevista(input.candidatoId, input.certificacaoId);
        if (!banca) throw new TRPCError({ code: "NOT_FOUND", message: "Nenhuma banca disponível para esta certificação." });
        return banca;
      }),
  }),

  // ── Cursos ────────────────────────────────────────────────────────────────
  cursos: router({
    list: publicProcedure.query(async () => getCursos()),
    listAdmin: adminOrCoordenadorProcedure.query(async () => getAllCursos()),
    pacotes: publicProcedure.query(async () => getPacotesCursos()),
    pacotesAdmin: adminOrCoordenadorProcedure.query(async () => getAllPacotes()),
    create: adminProcedure
      .input(z.object({
        titulo: z.string(),
        descricao: z.string().optional(),
        categoria: z.enum(["controladoria","financas","gestao","sustentabilidade","lideranca","outros"]),
        nivel: z.enum(["basico","intermediario","avancado"]),
        duracaoHoras: z.number().optional(),
        instrutor: z.string().optional(),
        preco: z.string().optional(),
        linkCompra: z.string().optional(),
        imagemUrl: z.string().optional(),
        certificacaoRelacionadaId: z.number().optional(),
        destaque: z.boolean().optional(),
        ativo: z.boolean().optional(),
        ordem: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createCurso(input as any);
        return result;
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        titulo: z.string().optional(),
        descricao: z.string().optional(),
        categoria: z.enum(["controladoria","financas","gestao","sustentabilidade","lideranca","outros"]).optional(),
        nivel: z.enum(["basico","intermediario","avancado"]).optional(),
        duracaoHoras: z.number().optional(),
        instrutor: z.string().optional(),
        preco: z.string().optional(),
        linkCompra: z.string().optional(),
        imagemUrl: z.string().optional(),
        certificacaoRelacionadaId: z.number().optional(),
        destaque: z.boolean().optional(),
        ativo: z.boolean().optional(),
        ordem: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCurso(id, data as any);
        return { success: true };
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteCurso(input.id);
      return { success: true };
    }),
  }),

  // ── Leads ─────────────────────────────────────────────────────────────────
  leads: router({
    create: publicProcedure
      .input(z.object({
        nome: z.string(),
        email: z.string().email(),
        certificacaoInteresse: z.string().optional(),
        origem: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createLead(input);
        return { success: true };
      }),
    list: adminOrCoordenadorProcedure.query(async () => getLeads()),
  }),

  // ── Eventos ───────────────────────────────────────────────────────────────
  eventos: router({
    byCandidato: protectedProcedure.input(z.object({ candidatoId: z.number() })).query(async ({ input }) =>
      getEventosByCandidato(input.candidatoId)
    ),
    pendentes: adminOrCoordenadorProcedure.query(async () => getAllEventosPendentes()),
    all: adminOrCoordenadorProcedure.query(async () => getAllEventos()),
    create: protectedProcedure
      .input(z.object({
        candidatoId: z.number(),
        etapa: z.enum(["cadastro","pagamento_1","upload_documentos","validacao_documental","avaliacao_teorica","entrevista","pagamento_2","certificado","encerrado"]),
        descricao: z.string(),
        destinatarios: z.array(z.object({
          papel: z.string(),
          nome: z.string(),
          email: z.string(),
          assunto: z.string(),
          mensagem: z.string(),
        })).optional(),
        metadados: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ input }) => {
        await createEvento(input as any);
        return { success: true };
      }),
  }),

  // ── Atribuições ───────────────────────────────────────────────────────────
  atribuicoes: router({
    byCandidato: protectedProcedure.input(z.object({ candidatoId: z.number() })).query(async ({ input }) =>
      getAtribuicoesDoCandidato(input.candidatoId)
    ),
    byAvaliador: avaliadorProcedure.query(async ({ ctx }) =>
      getAtribuicoesDoAvaliador(ctx.user.id)
    ),
    concluirAnalise: avaliadorProcedure
      .input(z.object({
        atribuicaoId: z.number(),
        candidatoId: z.number(),
        encaminhamento: z.enum(["caminho_a", "caminho_b", "reprovado"]),
        parecerGeral: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Atualiza a atribuição
        await updateAtribuicao(input.atribuicaoId, {
          encaminhamento: input.encaminhamento,
          parecerGeral: input.parecerGeral,
          status: "concluida",
          decisaoEm: new Date(),
        });
        // Determina a próxima etapa
        const proximaEtapa = input.encaminhamento === "reprovado"
          ? "encerrado"
          : input.encaminhamento === "caminho_b"
            ? "avaliacao_teorica"
            : "entrevista";
        // Atualiza etapa do candidato
        await updateCandidato(input.candidatoId, {
          etapaAtual: proximaEtapa as any,
          caminho: input.encaminhamento === "caminho_a" ? "A" : input.encaminhamento === "caminho_b" ? "B" : null,
        });
        // Registra evento de validação documental
        const c = await getCandidatoById(input.candidatoId);
        await createEvento({
          candidatoId: input.candidatoId,
          etapa: "validacao_documental",
          descricao: `Análise documental concluída. Encaminhamento: ${input.encaminhamento}. Próxima etapa: ${proximaEtapa}.`,
          destinatarios: buildDestinatariosEvento(
            "validacao_documental",
            c?.nomeCompleto || "Candidato",
            "",
            "admin@anefac.com.br"
          ),
          metadados: { encaminhamento: input.encaminhamento, proximaEtapa, parecerGeral: input.parecerGeral },
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
