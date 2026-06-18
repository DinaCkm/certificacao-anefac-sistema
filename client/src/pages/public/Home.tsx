import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight, Award, BookOpen, Users, CheckCircle, Star, ChevronRight } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";

const COR_MAP: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-800" },
  gold:   { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  badge: "bg-amber-100 text-amber-800" },
  green:  { bg: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-200",badge: "bg-emerald-100 text-emerald-800" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", badge: "bg-purple-100 text-purple-800" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-100 text-orange-800" },
  red:    { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    badge: "bg-red-100 text-red-800" },
  teal:   { bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200",   badge: "bg-teal-100 text-teal-800" },
};

export default function Home() {
  const { data: certificacoes, isLoading } = trpc.certificacoes.list.useQuery();
  const createLead = trpc.leads.create.useMutation();
  const { isAuthenticated } = useAuth();
  const [leadForm, setLeadForm] = useState({ nome: "", email: "", certificacaoInteresse: "" });
  const [leadSent, setLeadSent] = useState(false);

  const ativas = certificacoes?.filter((c) => c.status === "ativa" || c.status === "em_breve") ?? [];

  async function handleLead(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createLead.mutateAsync({ ...leadForm, origem: "home" });
      setLeadSent(true);
      toast.success("Interesse registrado! Entraremos em contato em breve.");
    } catch {
      toast.error("Erro ao registrar interesse. Tente novamente.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <span className="font-bold text-xl text-primary tracking-tight">
              <span className="text-accent font-display">ANEFAC</span>
              <span className="text-muted-foreground text-sm font-normal ml-2">Certificações</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/#certificacoes" className="text-muted-foreground hover:text-primary transition-colors">Certificações</Link>
            <Link href="/cursos" className="text-muted-foreground hover:text-primary transition-colors">Cursos</Link>
            <Link href="/#como-funciona" className="text-muted-foreground hover:text-primary transition-colors">Como Funciona</Link>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/candidato">
                <Button size="sm">Minha Área</Button>
              </Link>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost" size="sm">Entrar</Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-amber-500">
                    Quero me certificar
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-anefac-gradient text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-amber-400 blur-3xl" />
        </div>
        <div className="container relative py-24 lg:py-32">
          <div className="max-w-3xl animate-slide-up">
            <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/30">
              Certificações Profissionais ANEFAC
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
              Comprove sua excelência em{" "}
              <span className="text-amber-300 font-display">Finanças e Controladoria</span>
            </h1>
            <p className="text-lg lg:text-xl text-white/80 mb-8 max-w-2xl">
              Certificações reconhecidas pelo mercado financeiro brasileiro. Desenvolvidas pela ANEFAC
              para profissionais que buscam diferenciação e crescimento de carreira.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#certificacoes">
                <Button size="lg" className="bg-amber-400 text-gray-900 hover:bg-amber-300 font-semibold">
                  Ver Certificações <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link href="/cursos">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                  Cursos de Preparação
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 bg-white border-b border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "6", label: "Certificações", icon: Award },
              { value: "500+", label: "Profissionais Certificados", icon: Users },
              { value: "15+", label: "Anos de Tradição", icon: Star },
              { value: "98%", label: "Satisfação dos Certificados", icon: CheckCircle },
            ].map((stat) => (
              <div key={stat.label} className="animate-fade-in">
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-accent" />
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Certificações ── */}
      <section id="certificacoes" className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <Badge className="mb-3">Nossas Certificações</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
              Escolha sua certificação
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada certificação foi desenvolvida para um perfil específico de profissional.
              Encontre a que melhor se alinha à sua trajetória.
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ativas.map((cert) => {
                const cores = COR_MAP[cert.cor] ?? COR_MAP.blue;
                return (
                  <Card key={cert.id} className={`group hover:shadow-lg transition-all duration-300 border-2 ${cores.border} hover:-translate-y-1`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl ${cores.bg} flex items-center justify-center`}>
                          <Award className={`h-6 w-6 ${cores.text}`} />
                        </div>
                        <Badge className={cores.badge}>
                          {cert.status === "em_breve" ? "Em breve" : "Ativa"}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-primary mb-1">{cert.nome}</h3>
                      {cert.subtitulo && (
                        <p className={`text-sm font-medium ${cores.text} mb-3`}>{cert.subtitulo}</p>
                      )}
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {cert.descricaoBreve || cert.descricao}
                      </p>
                      <div className="flex gap-2 mt-auto">
                        <Link href={`/certificacao/${cert.slug}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full group-hover:border-primary">
                            Saiba mais <ChevronRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                        <Link href={`/como-funciona/${cert.slug}`} className="flex-1">
                          <Button size="sm" className={`w-full ${cores.bg} ${cores.text} border ${cores.border} hover:opacity-90`}>
                            Como funciona
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {ativas.length === 0 && (
                <div className="col-span-3 text-center py-16 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>As certificações serão exibidas aqui após o cadastro no painel administrativo.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Como Funciona (resumo) ── */}
      <section id="como-funciona" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <Badge className="mb-3">Processo</Badge>
            <h2 className="text-3xl font-bold text-primary mb-4">Como funciona a certificação</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Um processo transparente e rigoroso, desenvolvido para validar competências reais.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: "01", titulo: "Inscrição e Pagamento", desc: "Realize seu cadastro e efetue o pagamento da taxa de análise e avaliação." },
              { num: "02", titulo: "Envio de Documentos", desc: "Faça o upload dos documentos exigidos pelo edital da certificação escolhida." },
              { num: "03", titulo: "Análise e Avaliação", desc: "Nossa equipe analisa seus documentos e, conforme o caminho, realiza entrevista ou prova teórica." },
              { num: "04", titulo: "Certificado", desc: "Após aprovação, receba seu certificado ANEFAC e junte-se à rede de profissionais certificados." },
            ].map((step) => (
              <div key={step.num} className="text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-md">
                  {step.num}
                </div>
                <h3 className="font-semibold text-primary mb-2">{step.titulo}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cursos ── */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <Badge className="mb-2">Preparação</Badge>
              <h2 className="text-3xl font-bold text-primary">Cursos de Reforço</h2>
              <p className="text-muted-foreground mt-2">Prepare-se com os melhores conteúdos antes da sua certificação.</p>
            </div>
            <Link href="/cursos">
              <Button variant="outline">Ver todos <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { titulo: "Fundamentos de Controladoria", cat: "Controladoria", horas: 20 },
              { titulo: "Análise Financeira Avançada", cat: "Finanças", horas: 30 },
              { titulo: "Gestão de Riscos Corporativos", cat: "Gestão", horas: 25 },
            ].map((curso) => (
              <Card key={curso.titulo} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary" className="mb-2 text-xs">{curso.cat}</Badge>
                  <h3 className="font-semibold text-primary mb-1">{curso.titulo}</h3>
                  <p className="text-xs text-muted-foreground">{curso.horas}h de conteúdo</p>
                  <Link href="/cursos">
                    <Button size="sm" variant="ghost" className="mt-3 p-0 h-auto text-accent hover:text-amber-600">
                      Ver curso <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lead capture ── */}
      <section className="py-20 bg-anefac-gradient text-white">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Pronto para se certificar?</h2>
            <p className="text-white/80 mb-8">
              Registre seu interesse e nossa equipe entrará em contato com todas as informações.
            </p>
            {leadSent ? (
              <div className="bg-white/20 rounded-xl p-6 text-white">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-amber-300" />
                <p className="font-semibold text-lg">Interesse registrado com sucesso!</p>
                <p className="text-white/80 mt-1">Entraremos em contato em breve.</p>
              </div>
            ) : (
              <form onSubmit={handleLead} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Seu nome"
                  required
                  value={leadForm.nome}
                  onChange={(e) => setLeadForm((p) => ({ ...p, nome: e.target.value }))}
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-amber-300"
                />
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  required
                  value={leadForm.email}
                  onChange={(e) => setLeadForm((p) => ({ ...p, email: e.target.value }))}
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-amber-300"
                />
                <Button type="submit" className="bg-amber-400 text-gray-900 hover:bg-amber-300 font-semibold px-8" disabled={createLead.isPending}>
                  {createLead.isPending ? "Enviando..." : "Quero me certificar"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="font-bold text-xl mb-3">
                <span className="text-amber-300 font-display">ANEFAC</span> Certificações
              </div>
              <p className="text-white/60 text-sm">
                Associação Nacional dos Executivos de Finanças, Administração e Contabilidade.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Certificações</h4>
              <ul className="space-y-1 text-sm text-white/60">
                <li><Link href="/certificacao/cca" className="hover:text-white transition-colors">CCA</Link></li>
                <li><Link href="/certificacao/cca-plus" className="hover:text-white transition-colors">CCA Plus</Link></li>
                <li><Link href="/certificacao/ecodobem-n1" className="hover:text-white transition-colors">EcodoBem N1</Link></li>
                <li><Link href="/certificacao/ecodobem-n2" className="hover:text-white transition-colors">EcodoBem N2</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Acesso</h4>
              <ul className="space-y-1 text-sm text-white/60">
                <li><a href={getLoginUrl()} className="hover:text-white transition-colors">Área do Candidato</a></li>
                <li><Link href="/cursos" className="hover:text-white transition-colors">Cursos</Link></li>
                <li><Link href="/admin" className="hover:text-white transition-colors">Painel Admin</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-xs text-white/40">
            © {new Date().getFullYear()} ANEFAC — Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
