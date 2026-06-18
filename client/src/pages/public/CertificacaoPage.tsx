import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Award, CheckCircle } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function CertificacaoPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: cert, isLoading } = trpc.certificacoes.bySlug.useQuery({ slug: slug || "" });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!cert) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Certificação não encontrada.</div>;

  const competencias = (cert.competencias as string[] | null) ?? [];
  const preRequisitos = (cert.preRequisitos as string[] | null) ?? [];
  const documentos = (cert.documentosExigidos as string[] | null) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center h-16 gap-4">
          <Link href="/"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button></Link>
          <span className="font-bold text-primary">ANEFAC Certificações</span>
        </div>
      </nav>
      <div className="container py-12 max-w-4xl">
        <Badge className="mb-4">Certificação</Badge>
        <h1 className="text-4xl font-bold text-primary mb-2">{cert.nome}</h1>
        {cert.subtitulo && <p className="text-xl text-muted-foreground mb-6">{cert.subtitulo}</p>}
        <p className="text-lg text-foreground mb-8">{cert.descricao}</p>
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {competencias.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-primary mb-4">Competências avaliadas</h2>
              <ul className="space-y-2">{competencias.map((c, i) => <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />{c}</li>)}</ul>
            </div>
          )}
          {preRequisitos.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-primary mb-4">Pré-requisitos</h2>
              <ul className="space-y-2">{preRequisitos.map((p, i) => <li key={i} className="flex items-start gap-2 text-sm"><Award className="h-4 w-4 text-accent mt-0.5 shrink-0" />{p}</li>)}</ul>
            </div>
          )}
        </div>
        {documentos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-primary mb-4">Documentos exigidos</h2>
            <ul className="space-y-2">{documentos.map((d, i) => <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />{d}</li>)}</ul>
          </div>
        )}
        <div className="flex gap-4 flex-wrap">
          <a href={getLoginUrl()}><Button size="lg" className="bg-accent text-accent-foreground hover:bg-amber-500">Quero me certificar</Button></a>
          <Link href={`/como-funciona/${cert.slug}`}><Button size="lg" variant="outline">Como funciona</Button></Link>
        </div>
      </div>
    </div>
  );
}
