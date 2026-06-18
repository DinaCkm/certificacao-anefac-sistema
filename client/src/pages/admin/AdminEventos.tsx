import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Clock, CheckCircle, Users, Mail, Filter, BarChart3, AlertCircle } from "lucide-react";
import { useState } from "react";

const ETAPA_LABELS: Record<string, string> = {
  cadastro: "Cadastro", pagamento_1: "Pagamento 1", upload_documentos: "Upload Docs",
  validacao_documental: "Análise Doc.", avaliacao_teorica: "Aval. Teórica",
  entrevista: "Entrevista", pagamento_2: "Pagamento 2", certificado: "Certificado", encerrado: "Encerrado"
};

const ETAPA_ICONS: Record<string, string> = {
  cadastro: "👤", pagamento_1: "💳", upload_documentos: "📄",
  validacao_documental: "🔍", avaliacao_teorica: "📝",
  entrevista: "🎤", pagamento_2: "💳", certificado: "🏆", encerrado: "🚫"
};

export default function AdminEventos() {
  const { data: eventos, isLoading } = trpc.eventos.all.useQuery();
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("");

  const pendentes = eventos?.filter(e => e.statusNotificacao === "pendente").length ?? 0;
  const enviados = eventos?.filter(e => e.statusNotificacao === "enviado").length ?? 0;

  const filtrados = (eventos ?? []).filter(e => {
    const matchStatus = !filtroStatus || e.statusNotificacao === filtroStatus;
    const matchEtapa = !filtroEtapa || e.etapa === filtroEtapa;
    return matchStatus && matchEtapa;
  });

  const etapasUnicas = Array.from(new Set((eventos ?? []).map(e => e.etapa)));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Eventos e Notificações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log de etapas concluídas por candidato e destinatários a notificar.
          </p>
        </div>
      </div>

      {/* Aviso Fase 2 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Mail className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Envio de e-mail — Fase 2</p>
          <p className="text-xs text-amber-700 mt-1">
            Os eventos abaixo registram cada etapa concluída pelo candidato e os destinatários que deverão ser notificados.
            O envio automático de e-mail será implementado na próxima fase. Os dados já estão estruturados e prontos para integração.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{eventos?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Total de Eventos</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-700">{pendentes}</div>
            <div className="text-xs text-amber-600 mt-1">Notificações Pendentes</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{enviados}</div>
            <div className="text-xs text-green-600 mt-1">Notificações Enviadas</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select className="border border-border rounded-lg px-3 py-2 text-sm"
          value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="enviado">Enviado</option>
        </select>
        <select className="border border-border rounded-lg px-3 py-2 text-sm"
          value={filtroEtapa} onChange={e => setFiltroEtapa(e.target.value)}>
          <option value="">Todas as etapas</option>
          {etapasUnicas.map(e => <option key={e} value={e}>{ETAPA_LABELS[e] || e}</option>)}
        </select>
        {(filtroStatus || filtroEtapa) && (
          <Button variant="ghost" size="sm" onClick={() => { setFiltroStatus(""); setFiltroEtapa(""); }}>
            Limpar
          </Button>
        )}
        <span className="text-xs text-muted-foreground self-center ml-auto">
          {filtrados.length} evento(s)
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : filtrados.length > 0 ? (
        <div className="space-y-3">
          {filtrados.map((ev) => {
            const destinatarios = (ev.destinatarios as any[] | null) ?? [];
            const isPendente = ev.statusNotificacao === "pendente";
            return (
              <Card key={ev.id} className={`hover:shadow-sm transition-shadow ${isPendente ? "border-amber-200" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base ${isPendente ? "bg-amber-100" : "bg-green-100"}`}>
                        {ETAPA_ICONS[ev.etapa] || "📋"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary">{ev.descricao}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Candidato #{ev.candidatoId} · {new Date(ev.createdAt).toLocaleString("pt-BR")}
                        </p>

                        {destinatarios.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                              <Users className="h-3 w-3" /> {destinatarios.length} destinatário(s) a notificar:
                            </p>
                            <div className="space-y-1">
                              {destinatarios.map((d: any, i: number) => (
                                <div key={i} className={`text-xs rounded-lg px-3 py-2 flex items-start gap-2 ${isPendente ? "bg-amber-50 border border-amber-100" : "bg-green-50 border border-green-100"}`}>
                                  <Mail className={`h-3 w-3 shrink-0 mt-0.5 ${isPendente ? "text-amber-500" : "text-green-500"}`} />
                                  <div>
                                    <span className="font-semibold capitalize">{d.papel}</span>: {d.nome}
                                    {d.email && <span className="text-muted-foreground"> ({d.email})</span>}
                                    {d.assunto && <div className="text-muted-foreground mt-0.5">Assunto: {d.assunto}</div>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge className={isPendente ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}>
                        {isPendente ? (
                          <><Clock className="h-3 w-3 mr-1" />Pendente</>
                        ) : (
                          <><CheckCircle className="h-3 w-3 mr-1" />Enviado</>
                        )}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {ETAPA_LABELS[ev.etapa] || ev.etapa}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Nenhum evento registrado ainda.</p>
          <p className="text-xs mt-2 max-w-sm mx-auto">
            Os eventos são criados automaticamente conforme os candidatos avançam nas etapas do processo de certificação.
          </p>
        </div>
      )}
    </div>
  );
}
