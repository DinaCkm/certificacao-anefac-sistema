import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { UserCheck, FileText, Clock, CheckCircle } from "lucide-react";

export default function AvaliadorDashboard() {
  const { data: atribuicoes, isLoading } = trpc.avaliadores.minhasAtribuicoes.useQuery();

  const pendentes = atribuicoes?.filter(a => a.status === "pendente" || a.status === "em_andamento") ?? [];
  const concluidas = atribuicoes?.filter(a => a.status === "concluida") ?? [];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-2">Minhas Atribuições</h1>
      <p className="text-muted-foreground mb-6">Candidatos atribuídos para análise documental.</p>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <>
          {pendentes.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2"><Clock className="h-5 w-5 text-amber-500" /> Pendentes ({pendentes.length})</h2>
              <div className="space-y-3">
                {pendentes.map((a) => (
                  <Card key={a.id} className="border-amber-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center"><UserCheck className="h-5 w-5 text-amber-600" /></div>
                        <div>
                          <p className="font-medium text-primary">Candidato #{a.candidatoId}</p>
                          <p className="text-xs text-muted-foreground">Atribuído em {new Date(a.atribuidoEm).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-800">{a.status === "em_andamento" ? "Em andamento" : "Pendente"}</Badge>
                        <Link href={`/avaliador/analise/${a.id}`}>
                          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-amber-500">
                            <FileText className="h-3 w-3 mr-1" /> Analisar
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {concluidas.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Concluídas ({concluidas.length})</h2>
              <div className="space-y-3">
                {concluidas.map((a) => (
                  <Card key={a.id} className="opacity-70">
                    <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                        <div>
                          <p className="font-medium text-primary">Candidato #{a.candidatoId}</p>
                          <p className="text-xs text-muted-foreground">Encaminhamento: <span className="font-medium">{a.encaminhamento === "caminho_a" ? "Caminho A" : a.encaminhamento === "caminho_b" ? "Caminho B" : "Reprovado"}</span></p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Concluída</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {atribuicoes?.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma atribuição no momento.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
