import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, Lock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const NIVEL_LABEL: Record<string, string> = { basico: "Básico", intermediario: "Intermediário", avancado: "Avançado" };
const CAT_LABEL: Record<string, string> = { controladoria: "Controladoria", financas: "Finanças", gestao: "Gestão", sustentabilidade: "Sustentabilidade", lideranca: "Liderança", outros: "Outros" };

export default function CandidatoCursos() {
  const { data: cursos, isLoading } = trpc.cursos.list.useQuery();
  const { data: candidatos } = trpc.candidatos.meus.useQuery();
  const temPagamento = candidatos?.some(c => c.pagamento1Status === "pago");

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-2">Cursos de Reforço</h1>
      <p className="text-muted-foreground mb-6">
        {temPagamento
          ? "Acesse os cursos de preparação para sua certificação."
          : "Os cursos ficam disponíveis após o pagamento da taxa de análise."}
      </p>

      {!temPagamento && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Lock className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">Realize o pagamento da taxa de análise para desbloquear o acesso aos cursos.</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : cursos && cursos.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {cursos.map((curso) => (
            <Card key={curso.id} className={`transition-shadow ${temPagamento ? "hover:shadow-md" : "opacity-60"}`}>
              <CardContent className="p-5">
                <div className="flex gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">{CAT_LABEL[curso.categoria] || curso.categoria}</Badge>
                  <Badge variant="outline" className="text-xs">{NIVEL_LABEL[curso.nivel] || curso.nivel}</Badge>
                </div>
                <h3 className="font-semibold text-primary mb-1">{curso.titulo}</h3>
                {curso.instrutor && <p className="text-xs text-muted-foreground mb-1">Instrutor: {curso.instrutor}</p>}
                {curso.duracaoHoras && <p className="text-xs text-muted-foreground mb-3">{curso.duracaoHoras}h</p>}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{curso.descricao}</p>
                {temPagamento && curso.linkCompra ? (
                  <a href={curso.linkCompra} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-amber-500">
                      Acessar <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </a>
                ) : (
                  <Button size="sm" variant="outline" className="w-full" disabled>
                    <Lock className="h-3 w-3 mr-1" /> Bloqueado
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Nenhum curso disponível no momento.</p>
        </div>
      )}
    </div>
  );
}
