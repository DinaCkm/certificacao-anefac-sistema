import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Award, FileText, CheckCircle, Clock, Plus, CreditCard,
  BookOpen, Users, Star, ChevronRight, Lock, Loader2
} from "lucide-react";
import { toast } from "sonner";

const ETAPAS = [
  { key: "cadastro",             label: "Cadastro",           desc: "Dados pessoais e profissionais registrados." },
  { key: "pagamento_1",          label: "Taxa de Análise",    desc: "Pagamento da taxa de análise e avaliação." },
  { key: "upload_documentos",    label: "Documentos",         desc: "Upload dos documentos exigidos pelo edital." },
  { key: "validacao_documental", label: "Análise Documental", desc: "Avaliador analisa os documentos enviados." },
  { key: "avaliacao_teorica",    label: "Aval. Teórica",      desc: "Prova teórica (Caminho B)." },
  { key: "entrevista",           label: "Entrevista",         desc: "Entrevista com a banca avaliadora." },
  { key: "pagamento_2",          label: "Taxa de Emissão",    desc: "Pagamento da taxa de emissão do certificado." },
  { key: "certificado",          label: "Certificado",        desc: "Certificado emitido e disponível." },
];

function getEtapaIndex(etapa: string) { return ETAPAS.findIndex(e => e.key === etapa); }

export default function CandidatoDashboard() {
  const { user } = useAuth();
  const { data: candidatos, isLoading } = trpc.candidatos.meus.useQuery();
  const { data: certs } = trpc.certificacoes.list.useQuery();
  const registrarPagamento = trpc.candidatos.registrarPagamento1.useMutation();
  const utils = trpc.useUtils();

  const getCert = (id: number) => certs?.find(c => c.id === id);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin h-8 w-8 text-primary" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">Meu Processo de Certificação</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Olá, <span className="font-medium text-foreground">{user?.name}</span>. Acompanhe sua jornada abaixo.
          </p>
        </div>
        <Link href="/candidato/inscricao">
          <Button className="bg-accent text-accent-foreground hover:bg-amber-500 shadow-sm">
            <Plus className="h-4 w-4 mr-2" /> Nova Inscrição
          </Button>
        </Link>
      </div>

      {candidatos && candidatos.length > 0 ? (
        <div className="space-y-8">
          {candidatos.map((c) => {
            const etapaIdx = getEtapaIndex(c.etapaAtual);
            const cert = getCert(c.certificacaoId);
            const corMap: Record<string, string> = {
              blue: "from-blue-900 to-blue-700",
              gold: "from-amber-700 to-amber-500",
              green: "from-emerald-800 to-emerald-600",
              purple: "from-purple-900 to-purple-700",
              orange: "from-orange-700 to-orange-500",
              red: "from-red-900 to-red-700",
              teal: "from-teal-800 to-teal-600",
            };
            const gradiente = corMap[cert?.cor || "blue"] || corMap.blue;

            return (
              <Card key={c.id} className="overflow-hidden border-0 shadow-lg">
                <div className={`bg-gradient-to-r ${gradiente} p-5 text-white`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Certificação</p>
                      <h2 className="text-xl font-bold">{cert?.nome || "Certificação"}</h2>
                      {cert?.subtitulo && <p className="text-white/80 text-sm mt-0.5">{cert.subtitulo}</p>}
                    </div>
                    <Badge className="bg-white/20 text-white border-white/30 shrink-0">
                      {ETAPAS.find(e => e.key === c.etapaAtual)?.label || c.etapaAtual}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  {/* Timeline */}
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Progresso</p>
                  <div className="relative mb-6">
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
                    <div
                      className="absolute top-4 left-4 h-0.5 bg-green-400 transition-all duration-700"
                      style={{ width: etapaIdx > 0 ? `${(etapaIdx / (ETAPAS.length - 1)) * 100}%` : "0%" }}
                    />
                    <div className="relative flex justify-between">
                      {ETAPAS.map((etapa, i) => {
                        const done = i < etapaIdx;
                        const active = i === etapaIdx;
                        return (
                          <div key={etapa.key} className="flex flex-col items-center gap-1.5" title={etapa.desc}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                              done ? "bg-green-500" : active ? "bg-accent ring-2 ring-accent/30" : "bg-muted border-2 border-border"
                            }`}>
                              {done ? <CheckCircle className="h-4 w-4 text-white" /> :
                               active ? <Clock className="h-4 w-4 text-accent-foreground" /> :
                               <Lock className="h-3 w-3 text-muted-foreground" />}
                            </div>
                            <span className={`text-[10px] font-medium text-center leading-tight max-w-[52px] ${
                              active ? "text-accent font-bold" : done ? "text-green-600" : "text-muted-foreground"
                            }`}>{etapa.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Etapa atual */}
                  <div className="bg-primary/5 rounded-xl p-4 mb-5 border border-primary/10">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold text-primary text-sm">
                          Etapa atual: {ETAPAS.find(e => e.key === c.etapaAtual)?.label}
                        </p>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {ETAPAS.find(e => e.key === c.etapaAtual)?.desc}
                        </p>
                        {c.caminho && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {c.caminho === "A" ? "Caminho A — Entrevista Direta" : "Caminho B — Avaliação Teórica + Entrevista"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-3 flex-wrap">
                    {c.etapaAtual === "pagamento_1" && (
                      <Button size="sm" className="bg-accent text-accent-foreground hover:bg-amber-500"
                        onClick={async () => {
                          try {
                            await registrarPagamento.mutateAsync({ candidatoId: c.id });
                            utils.candidatos.meus.invalidate();
                            toast.success("Pagamento confirmado! Agora envie seus documentos.");
                          } catch { toast.error("Erro ao confirmar pagamento."); }
                        }}
                        disabled={registrarPagamento.isPending}>
                        {registrarPagamento.isPending
                          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processando...</>
                          : <><CreditCard className="h-4 w-4 mr-2" />Confirmar Pagamento (Demo)</>}
                      </Button>
                    )}
                    {c.etapaAtual === "upload_documentos" && (
                      <Link href={`/candidato/documentos/${c.id}`}>
                        <Button size="sm" className="bg-primary text-primary-foreground">
                          <FileText className="h-4 w-4 mr-2" />Enviar Documentos<ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    )}
                    {c.etapaAtual === "validacao_documental" && (
                      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg px-3 py-2 text-sm">
                        <Clock className="h-4 w-4" /><span>Documentos em análise. Aguarde o retorno do avaliador.</span>
                      </div>
                    )}
                    {c.etapaAtual === "avaliacao_teorica" && (
                      <div className="flex items-center gap-2 text-blue-600 bg-blue-50 rounded-lg px-3 py-2 text-sm">
                        <FileText className="h-4 w-4" /><span>Aguarde o agendamento da avaliação teórica.</span>
                      </div>
                    )}
                    {c.etapaAtual === "entrevista" && (
                      <div className="flex items-center gap-2 text-purple-600 bg-purple-50 rounded-lg px-3 py-2 text-sm">
                        <Users className="h-4 w-4" /><span>Aguarde o agendamento da entrevista com a banca.</span>
                      </div>
                    )}
                    {c.etapaAtual === "pagamento_2" && (
                      <Button size="sm" className="bg-accent text-accent-foreground hover:bg-amber-500">
                        <CreditCard className="h-4 w-4 mr-2" />Pagar Taxa de Emissão (Demo)
                      </Button>
                    )}
                    {c.etapaAtual === "certificado" && (
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg px-3 py-2 text-sm font-semibold">
                        <Star className="h-4 w-4 fill-green-500" /><span>Parabéns! Certificado emitido com sucesso.</span>
                      </div>
                    )}
                    {etapaIdx >= 1 && (
                      <Link href="/candidato/cursos">
                        <Button size="sm" variant="outline">
                          <BookOpen className="h-4 w-4 mr-2" />Cursos de Reforço
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-16 border-dashed border-2">
          <CardContent>
            <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-semibold text-primary mb-2">Nenhuma inscrição ativa</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Inicie sua jornada de certificação ANEFAC e comprove sua excelência profissional.
            </p>
            <Link href="/candidato/inscricao">
              <Button className="bg-accent text-accent-foreground hover:bg-amber-500">
                <Plus className="h-4 w-4 mr-2" />Iniciar Inscrição
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
