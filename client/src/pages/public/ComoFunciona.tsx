import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function ComoFunciona() {
  const { slug } = useParams<{ slug: string }>();
  const { data: cert, isLoading } = trpc.certificacoes.bySlug.useQuery({ slug: slug || "" });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!cert) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Certificação não encontrada.</div>;

  const cf = cert.comoFunciona as any;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center h-16 gap-4">
          <Link href={`/certificacao/${cert.slug}`}><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button></Link>
          <span className="font-bold text-primary">Como Funciona — {cert.nome}</span>
        </div>
      </nav>
      <div className="container py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-primary mb-2">{cf?.titulo || `Como funciona a ${cert.nome}`}</h1>
        {cf?.subtitulo && <p className="text-muted-foreground mb-8">{cf.subtitulo}</p>}
        {cf?.etapas ? (
          <div className="space-y-6">
            {cf.etapas.map((etapa: any, i: number) => (
              <div key={i} className="flex gap-4 p-5 bg-muted/30 rounded-xl border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">{etapa.numero || i + 1}</div>
                <div>
                  <h3 className="font-semibold text-primary mb-1">{etapa.titulo}</h3>
                  <p className="text-sm text-muted-foreground">{etapa.descricao}</p>
                  {etapa.nota && <p className="text-xs text-accent mt-2 font-medium">{etapa.nota}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">O conteúdo "Como Funciona" será configurado pelo administrador para esta certificação.</p>
        )}
        <div className="mt-10">
          <a href={getLoginUrl()}><Button size="lg" className="bg-accent text-accent-foreground hover:bg-amber-500">Iniciar processo de certificação</Button></a>
        </div>
      </div>
    </div>
  );
}
