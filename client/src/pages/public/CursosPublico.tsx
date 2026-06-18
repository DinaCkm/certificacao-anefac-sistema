import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";

const NIVEL_LABEL: Record<string, string> = { basico: "Básico", intermediario: "Intermediário", avancado: "Avançado" };
const CAT_LABEL: Record<string, string> = { controladoria: "Controladoria", financas: "Finanças", gestao: "Gestão", sustentabilidade: "Sustentabilidade", lideranca: "Liderança", outros: "Outros" };

export default function CursosPublico() {
  const { data: cursos, isLoading } = trpc.cursos.list.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center h-16 gap-4">
          <Link href="/"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Início</Button></Link>
          <span className="font-bold text-primary">Cursos de Preparação</span>
        </div>
      </nav>
      <div className="container py-12">
        <h1 className="text-3xl font-bold text-primary mb-2">Cursos de Preparação</h1>
        <p className="text-muted-foreground mb-8">Prepare-se para sua certificação com os melhores conteúdos do mercado.</p>
        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : cursos && cursos.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursos.map((curso) => (
              <Card key={curso.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">{CAT_LABEL[curso.categoria] || curso.categoria}</Badge>
                    <Badge variant="outline" className="text-xs">{NIVEL_LABEL[curso.nivel] || curso.nivel}</Badge>
                  </div>
                  <h3 className="font-semibold text-primary mb-1">{curso.titulo}</h3>
                  {curso.instrutor && <p className="text-xs text-muted-foreground mb-1">Instrutor: {curso.instrutor}</p>}
                  {curso.duracaoHoras && <p className="text-xs text-muted-foreground mb-3">{curso.duracaoHoras}h de conteúdo</p>}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{curso.descricao}</p>
                  {curso.preco && <p className="font-bold text-primary mb-3">R$ {Number(curso.preco).toFixed(2)}</p>}
                  {curso.linkCompra ? (
                    <a href={curso.linkCompra} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-amber-500">
                        Acessar curso <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </a>
                  ) : (
                    <Button size="sm" variant="outline" className="w-full" disabled>Em breve</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Os cursos serão exibidos aqui após o cadastro no painel administrativo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
