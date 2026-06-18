import { trpc } from "@/lib/trpc";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, FileText, CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight, Send, Pencil, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

// Checklist dinâmico por tipo de documento
const CHECKLIST_POR_TIPO: Record<string, Array<{ id: string; label: string }>> = {
  diploma: [
    { id: "legivel", label: "Documento legível e sem rasuras" },
    { id: "autenticado", label: "Documento autenticado ou original digitalizado" },
    { id: "area_compativel", label: "Área de formação compatível com a certificação" },
    { id: "mec", label: "Instituição reconhecida pelo MEC" },
  ],
  declaracao: [
    { id: "legivel", label: "Documento legível" },
    { id: "papel_timbrado", label: "Em papel timbrado da empresa" },
    { id: "assinatura_cargo", label: "Assinado com identificação do cargo do signatário" },
    { id: "periodo_cargo", label: "Período e cargo claramente identificados" },
    { id: "tempo_minimo", label: "Tempo mínimo de experiência atendido" },
  ],
  conduta: [
    { id: "legivel", label: "Documento legível" },
    { id: "assinatura_data", label: "Assinado com data" },
    { id: "versao_atual", label: "Versão atual do código" },
    { id: "paginas_completas", label: "Todas as páginas presentes" },
  ],
  recomendacao: [
    { id: "legivel", label: "Documento legível" },
    { id: "recomendante_id", label: "Recomendante claramente identificado" },
    { id: "assinado", label: "Documento assinado" },
    { id: "conteudo_relevante", label: "Conteúdo relevante para a certificação" },
  ],
  outros: [
    { id: "legivel", label: "Documento legível" },
    { id: "completo", label: "Documento completo (sem páginas faltando)" },
    { id: "valido", label: "Documento dentro da validade" },
    { id: "pertinente", label: "Pertinente ao processo de certificação" },
  ],
};

function getChecklist(tipo?: string | null) {
  if (!tipo) return CHECKLIST_POR_TIPO.outros;
  return CHECKLIST_POR_TIPO[tipo] ?? CHECKLIST_POR_TIPO.outros;
}

type DocState = {
  checklistRespostas: Record<string, boolean>;
  parecer: string;
  status: "pendente" | "aprovado" | "reprovado";
};

export default function AnaliseDocumental() {
  const { atribuicaoId } = useParams<{ atribuicaoId: string }>();
  const [, navigate] = useLocation();
  const id = Number(atribuicaoId);

  const { data: atribuicao } = trpc.atribuicoes.byCandidato.useQuery({ candidatoId: 0 }, { enabled: false });
  const { data: documentos, isLoading } = trpc.documentos.byCandidato.useQuery({ candidatoId: 0 }, { enabled: false });

  // Busca atribuições do avaliador para pegar o candidatoId
  const { data: minhasAtribuicoes } = trpc.avaliadores.minhasAtribuicoes.useQuery();
  const atrib = minhasAtribuicoes?.find(a => a.id === id);
  const candidatoId = atrib?.candidatoId ?? 0;

  const { data: docs, refetch: refetchDocs } = trpc.documentos.byCandidato.useQuery({ candidatoId }, { enabled: candidatoId > 0 });
  const { data: candidato } = trpc.candidatos.byId.useQuery({ id: candidatoId }, { enabled: candidatoId > 0 });
  const { data: certs } = trpc.certificacoes.list.useQuery();

  const analisarDoc = trpc.documentos.analisar.useMutation();
  const concluirAnalise = trpc.atribuicoes.concluirAnalise.useMutation();

  const cert = certs?.find(c => c.id === candidato?.certificacaoId);

  // Estado local de análise por documento
  const [docStates, setDocStates] = useState<Record<number, DocState>>({});
  const [modalDocId, setModalDocId] = useState<number | null>(null);
  const [modalDocIdx, setModalDocIdx] = useState(0);
  const [parecerGeral, setParecerGeral] = useState("");
  const [encaminhamento, setEncaminhamento] = useState<"caminho_a" | "caminho_b" | "reprovado" | null>(null);
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const docAtual = docs?.[modalDocIdx];
  const stateAtual = docAtual ? (docStates[docAtual.id] ?? { checklistRespostas: {}, parecer: "", status: "pendente" as const }) : null;
  const checklist = getChecklist(docAtual?.tipoDocumento);

  function setDocState(docId: number, update: Partial<DocState>) {
    setDocStates(prev => ({
      ...prev,
      [docId]: { ...({ checklistRespostas: {}, parecer: "", status: "pendente" } as DocState), ...prev[docId], ...update },
    }));
  }

  function toggleChecklist(itemId: string, value: boolean) {
    if (!docAtual) return;
    setDocState(docAtual.id, {
      checklistRespostas: { ...(stateAtual?.checklistRespostas ?? {}), [itemId]: value },
    });
  }

  function aprovarDoc(status: "aprovado" | "reprovado") {
    if (!docAtual) return;
    setDocState(docAtual.id, { status });
    toast.success(status === "aprovado" ? "Documento aprovado!" : "Documento reprovado!");
    setModalDocId(null);
  }

  const todosAnalisados = docs?.every(d => (docStates[d.id]?.status ?? "pendente") !== "pendente") ?? false;
  const aprovados = docs?.filter(d => docStates[d.id]?.status === "aprovado").length ?? 0;
  const reprovados = docs?.filter(d => docStates[d.id]?.status === "reprovado").length ?? 0;

  async function handleEnviarDecisao() {
    if (!encaminhamento) { toast.error("Selecione um encaminhamento."); return; }
    setEnviando(true);
    try {
      // Salva análise de cada documento no banco
      for (const doc of docs ?? []) {
        const state = docStates[doc.id];
        if (state && state.status !== "pendente") {
          await analisarDoc.mutateAsync({
            id: doc.id,
            checklistRespostas: state.checklistRespostas,
            parecer: state.parecer,
            status: state.status,
          });
        }
      }
      // Conclui a atribuição
      await concluirAnalise.mutateAsync({
        atribuicaoId: id,
        candidatoId,
        encaminhamento,
        parecerGeral,
      });
      toast.success("Análise concluída e encaminhamento registrado!");
      navigate("/avaliador");
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar decisão.");
    } finally {
      setEnviando(false);
    }
  }

  if (isLoading || !docs) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/avaliador"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-primary">Análise Documental</h1>
          <p className="text-sm text-muted-foreground">
            {candidato?.nomeCompleto || `Candidato #${candidatoId}`} · {cert?.nome || "Certificação"}
          </p>
        </div>
      </div>

      {/* Progresso */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-muted/30"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-primary">{docs.length}</div><div className="text-xs text-muted-foreground">Total de documentos</div></CardContent></Card>
        <Card className="bg-green-50 border-green-200"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-700">{aprovados}</div><div className="text-xs text-green-600">Aprovados</div></CardContent></Card>
        <Card className="bg-red-50 border-red-200"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-700">{reprovados}</div><div className="text-xs text-red-600">Reprovados</div></CardContent></Card>
      </div>

      {/* Lista de documentos */}
      <div className="space-y-3 mb-6">
        {docs.map((doc, idx) => {
          const state = docStates[doc.id] ?? { status: "pendente" };
          return (
            <Card key={doc.id} className={`transition-all border-2 ${state.status === "aprovado" ? "border-green-200 bg-green-50/30" : state.status === "reprovado" ? "border-red-200 bg-red-50/30" : "border-border"}`}>
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${state.status === "aprovado" ? "bg-green-100" : state.status === "reprovado" ? "bg-red-100" : "bg-muted"}`}>
                    {state.status === "aprovado" ? <CheckCircle className="h-5 w-5 text-green-600" /> : state.status === "reprovado" ? <XCircle className="h-5 w-5 text-red-600" /> : <FileText className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="font-medium text-primary">{doc.nomeDocumento}</p>
                    <p className="text-xs text-muted-foreground">{doc.tipoDocumento} · {doc.mimeType}</p>
                    {state.parecer && <p className="text-xs text-muted-foreground italic mt-0.5">"{state.parecer}"</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={state.status === "aprovado" ? "bg-green-100 text-green-800" : state.status === "reprovado" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}>
                    {state.status === "aprovado" ? "Aprovado" : state.status === "reprovado" ? "Reprovado" : "Pendente"}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => { setModalDocIdx(idx); setModalDocId(doc.id); }}>
                    <Eye className="h-3 w-3 mr-1" /> Analisar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Botão relatório final */}
      {todosAnalisados && !showRelatorio && (
        <div className="text-center">
          <Button size="lg" className="bg-primary text-primary-foreground" onClick={() => setShowRelatorio(true)}>
            Gerar Relatório e Definir Encaminhamento
          </Button>
        </div>
      )}

      {/* Relatório Final */}
      {showRelatorio && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle className="text-lg">Relatório Final de Análise Documental</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {/* Resumo dos documentos */}
            <div>
              <h3 className="font-semibold text-primary mb-3">Documentos Analisados</h3>
              <div className="space-y-2">
                {docs.map((doc) => {
                  const state = docStates[doc.id];
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-border">
                      <div>
                        <p className="text-sm font-medium">{doc.nomeDocumento}</p>
                        {state?.parecer && <p className="text-xs text-muted-foreground italic">"{state.parecer}"</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={state?.status === "aprovado" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {state?.status === "aprovado" ? "Aprovado" : "Reprovado"}
                        </Badge>
                        <Button size="sm" variant="ghost" onClick={() => { setModalDocIdx(docs.indexOf(doc)); setModalDocId(doc.id); setShowRelatorio(false); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Parecer geral */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Parecer Geral do Avaliador</label>
              <textarea
                className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[100px]"
                placeholder="Descreva sua avaliação geral do candidato e dos documentos analisados..."
                value={parecerGeral}
                onChange={e => setParecerGeral(e.target.value)}
              />
            </div>

            {/* Encaminhamento */}
            <div>
              <label className="text-sm font-semibold mb-3 block">Encaminhamento</label>
              <div className="grid md:grid-cols-3 gap-3">
                <button
                  onClick={() => setEncaminhamento("caminho_a")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${encaminhamento === "caminho_a" ? "border-green-500 bg-green-50" : "border-border hover:border-green-300"}`}
                >
                  <div className="font-semibold text-green-700 mb-1">Caminho A</div>
                  <div className="text-xs text-muted-foreground">Habilitado para Entrevista diretamente</div>
                </button>
                <button
                  onClick={() => setEncaminhamento("caminho_b")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${encaminhamento === "caminho_b" ? "border-blue-500 bg-blue-50" : "border-border hover:border-blue-300"}`}
                >
                  <div className="font-semibold text-blue-700 mb-1">Caminho B</div>
                  <div className="text-xs text-muted-foreground">Habilitado para Avaliação Teórica antes da entrevista</div>
                </button>
                <button
                  onClick={() => setEncaminhamento("reprovado")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${encaminhamento === "reprovado" ? "border-red-500 bg-red-50" : "border-border hover:border-red-300"}`}
                >
                  <div className="font-semibold text-red-700 mb-1 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Documentação Insuficiente</div>
                  <div className="text-xs text-muted-foreground">Processo encerrado por documentação inadequada</div>
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowRelatorio(false)}>Revisar Documentos</Button>
              <Button
                className="bg-primary text-primary-foreground"
                onClick={handleEnviarDecisao}
                disabled={!encaminhamento || enviando}
              >
                <Send className="h-4 w-4 mr-2" />
                {enviando ? "Enviando..." : "Enviar Decisão ao Candidato"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de análise individual */}
      <Dialog open={modalDocId !== null} onOpenChange={(open) => { if (!open) setModalDocId(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{docAtual?.nomeDocumento}</span>
              <div className="flex items-center gap-2 text-sm font-normal">
                <Button size="sm" variant="ghost" onClick={() => setModalDocIdx(i => Math.max(0, i - 1))} disabled={modalDocIdx === 0}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-muted-foreground">{modalDocIdx + 1} / {docs.length}</span>
                <Button size="sm" variant="ghost" onClick={() => setModalDocIdx(i => Math.min((docs.length ?? 1) - 1, i + 1))} disabled={modalDocIdx === (docs.length ?? 1) - 1}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 flex-1 overflow-hidden">
            {/* Visualizador */}
            <div className="flex-1 bg-muted/30 rounded-xl flex items-center justify-center min-h-[400px] overflow-hidden">
              {docAtual?.s3Url ? (
                docAtual.mimeType?.includes("pdf") ? (
                  <iframe src={docAtual.s3Url} className="w-full h-full" title="Documento" />
                ) : (
                  <img src={docAtual.s3Url} alt="Documento" className="max-w-full max-h-full object-contain" />
                )
              ) : (
                <div className="text-center text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Visualização do documento</p>
                  <p className="text-xs mt-1">{docAtual?.nomeDocumento}</p>
                </div>
              )}
            </div>

            {/* Checklist e parecer */}
            <div className="w-80 flex flex-col gap-4 overflow-y-auto">
              <div>
                <h3 className="font-semibold text-sm mb-3">Checklist de Validação</h3>
                <div className="space-y-3">
                  {checklist.map((item) => {
                    const val = stateAtual?.checklistRespostas[item.id];
                    return (
                      <div key={item.id} className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs font-medium mb-2">{item.label}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleChecklist(item.id, true)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${val === true ? "bg-green-500 text-white" : "bg-muted hover:bg-green-100 text-muted-foreground"}`}
                          >
                            ✓ Sim
                          </button>
                          <button
                            onClick={() => toggleChecklist(item.id, false)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${val === false ? "bg-red-500 text-white" : "bg-muted hover:bg-red-100 text-muted-foreground"}`}
                          >
                            ✗ Não
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Parecer Individual</label>
                <textarea
                  className="w-full border border-border rounded-lg px-3 py-2 text-xs min-h-[80px]"
                  placeholder="Observações sobre este documento..."
                  value={stateAtual?.parecer ?? ""}
                  onChange={e => docAtual && setDocState(docAtual.id, { parecer: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => aprovarDoc("aprovado")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Documento Aprovado
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => aprovarDoc("reprovado")}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Documento Reprovado
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
