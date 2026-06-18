import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users, UserCheck, ChevronRight, Search, Filter, Eye,
  FileText, Clock, CheckCircle, AlertTriangle, Shuffle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ETAPA_LABELS: Record<string, string> = {
  cadastro: "Cadastro", pagamento_1: "Pagamento 1", upload_documentos: "Upload Docs",
  validacao_documental: "Análise Doc.", avaliacao_teorica: "Aval. Teórica",
  entrevista: "Entrevista", pagamento_2: "Pagamento 2", certificado: "Certificado", encerrado: "Encerrado"
};
const ETAPA_COLORS: Record<string, string> = {
  cadastro: "bg-gray-100 text-gray-700", pagamento_1: "bg-amber-100 text-amber-800",
  upload_documentos: "bg-blue-100 text-blue-800", validacao_documental: "bg-purple-100 text-purple-800",
  avaliacao_teorica: "bg-indigo-100 text-indigo-800", entrevista: "bg-cyan-100 text-cyan-800",
  pagamento_2: "bg-orange-100 text-orange-800", certificado: "bg-green-100 text-green-800",
  encerrado: "bg-red-100 text-red-800"
};

export default function AdminCandidatos() {
  const { data: candidatos, isLoading, refetch } = trpc.candidatos.list.useQuery();
  const { data: certs } = trpc.certificacoes.list.useQuery();
  const { data: avaliadores } = trpc.avaliadores.list.useQuery();
  const { data: bancas } = trpc.bancas.list.useQuery();
  const atribuirAvaliador = trpc.avaliadores.atribuir.useMutation();
  const atribuirBanca = trpc.bancas.atribuir.useMutation();

  const [busca, setBusca] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [filtroCert, setFiltroCert] = useState("");
  const [detalhe, setDetalhe] = useState<any>(null);

  const getCertNome = (id: number) => certs?.find(c => c.id === id)?.nome || "—";

  const filtrados = (candidatos ?? []).filter(c => {
    const matchBusca = !busca ||
      (c.nomeCompleto?.toLowerCase().includes(busca.toLowerCase())) ||
      (c.empresa?.toLowerCase().includes(busca.toLowerCase()));
    const matchEtapa = !filtroEtapa || c.etapaAtual === filtroEtapa;
    const matchCert = !filtroCert || String(c.certificacaoId) === filtroCert;
    return matchBusca && matchEtapa && matchCert;
  });

  async function handleAtribuirAvaliador(candidatoId: number, certificacaoId: number) {
    try {
      await atribuirAvaliador.mutateAsync({ candidatoId, certificacaoId });
      toast.success("Avaliador atribuído aleatoriamente com balanceamento de carga!");
      refetch();
    } catch (e: any) { toast.error(e.message || "Nenhum avaliador disponível para esta certificação."); }
  }

  async function handleAtribuirBanca(candidatoId: number, certificacaoId: number) {
    try {
      await atribuirBanca.mutateAsync({ candidatoId, certificacaoId });
      toast.success("Banca atribuída aleatoriamente!");
      refetch();
    } catch (e: any) { toast.error(e.message || "Nenhuma banca disponível para esta certificação."); }
  }

  const etapasUnicas = Array.from(new Set((candidatos ?? []).map(c => c.etapaAtual)));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Candidatos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{candidatos?.length ?? 0} candidatos no sistema</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm"
                placeholder="Buscar por nome ou empresa..."
                value={busca} onChange={e => setBusca(e.target.value)}
              />
            </div>
            <select
              className="border border-border rounded-lg px-3 py-2 text-sm"
              value={filtroEtapa} onChange={e => setFiltroEtapa(e.target.value)}
            >
              <option value="">Todas as etapas</option>
              {etapasUnicas.map(e => <option key={e} value={e}>{ETAPA_LABELS[e] || e}</option>)}
            </select>
            <select
              className="border border-border rounded-lg px-3 py-2 text-sm"
              value={filtroCert} onChange={e => setFiltroCert(e.target.value)}
            >
              <option value="">Todas as certificações</option>
              {certs?.map(c => <option key={c.id} value={String(c.id)}>{c.nome}</option>)}
            </select>
            {(busca || filtroEtapa || filtroCert) && (
              <Button variant="ghost" size="sm" onClick={() => { setBusca(""); setFiltroEtapa(""); setFiltroCert(""); }}>
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumo por etapa */}
      {!busca && !filtroEtapa && !filtroCert && candidatos && candidatos.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {etapasUnicas.map(e => {
            const count = candidatos.filter(c => c.etapaAtual === e).length;
            return (
              <button key={e} onClick={() => setFiltroEtapa(e)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${ETAPA_COLORS[e] || "bg-gray-100 text-gray-700"} hover:opacity-80`}>
                {ETAPA_LABELS[e] || e}: {count}
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : filtrados.length > 0 ? (
        <div className="space-y-2">
          {filtrados.map((c) => (
            <Card key={c.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {(c.nomeCompleto || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-primary">{c.nomeCompleto || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">
                        {getCertNome(c.certificacaoId)}
                        {c.empresa && ` · ${c.empresa}`}
                        {c.cargo && ` · ${c.cargo}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs ${ETAPA_COLORS[c.etapaAtual] || "bg-gray-100 text-gray-700"}`}>
                      {ETAPA_LABELS[c.etapaAtual] || c.etapaAtual}
                    </Badge>
                    {c.caminho && (
                      <Badge variant="outline" className="text-xs">Caminho {c.caminho}</Badge>
                    )}
                    {c.etapaAtual === "validacao_documental" && (
                      <Button size="sm" variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        onClick={() => handleAtribuirAvaliador(c.id, c.certificacaoId)}
                        disabled={atribuirAvaliador.isPending}>
                        <Shuffle className="h-3 w-3 mr-1" /> Atribuir Avaliador
                      </Button>
                    )}
                    {c.etapaAtual === "entrevista" && (
                      <Button size="sm" variant="outline" className="text-cyan-600 border-cyan-200 hover:bg-cyan-50"
                        onClick={() => handleAtribuirBanca(c.id, c.certificacaoId)}
                        disabled={atribuirBanca.isPending}>
                        <Shuffle className="h-3 w-3 mr-1" /> Atribuir Banca
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setDetalhe(c)}>
                      <Eye className="h-3 w-3 mr-1" /> Ver
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>{busca || filtroEtapa || filtroCert ? "Nenhum candidato encontrado com esses filtros." : "Nenhum candidato cadastrado."}</p>
        </div>
      )}

      {/* Modal de detalhe */}
      <Dialog open={!!detalhe} onOpenChange={() => setDetalhe(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Candidato</DialogTitle>
          </DialogHeader>
          {detalhe && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  {(detalhe.nomeCompleto || "?")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-primary text-lg">{detalhe.nomeCompleto || "Sem nome"}</h3>
                  <p className="text-sm text-muted-foreground">{getCertNome(detalhe.certificacaoId)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Empresa", value: detalhe.empresa },
                  { label: "Cargo", value: detalhe.cargo },
                  { label: "Experiência", value: detalhe.anosExperiencia ? `${detalhe.anosExperiencia} anos` : null },
                  { label: "Formação", value: detalhe.formacao },
                  { label: "Etapa atual", value: ETAPA_LABELS[detalhe.etapaAtual] || detalhe.etapaAtual },
                  { label: "Caminho", value: detalhe.caminho ? `Caminho ${detalhe.caminho}` : null },
                  { label: "Pgto. 1", value: detalhe.pagamento1Status },
                  { label: "Pgto. 2", value: detalhe.pagamento2Status },
                ].filter(f => f.value).map(f => (
                  <div key={f.label} className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                    <p className="font-medium capitalize">{f.value}</p>
                  </div>
                ))}
              </div>
              {detalhe.parecerFinal && (
                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="text-xs font-semibold text-primary mb-1">Parecer Final</p>
                  <p className="text-sm text-muted-foreground italic">"{detalhe.parecerFinal}"</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
