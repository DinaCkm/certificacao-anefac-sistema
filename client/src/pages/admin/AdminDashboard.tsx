import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Users, UserCheck, Shield, BookOpen, Bell } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: candidatos } = trpc.candidatos.list.useQuery();
  const { data: certs } = trpc.certificacoes.list.useQuery();
  const { data: avaliadores } = trpc.avaliadores.list.useQuery();
  const { data: bancas } = trpc.bancas.list.useQuery();
  const { data: eventos } = trpc.eventos.pendentes.useQuery();

  const stats = [
    { label: "Certificações", value: certs?.length ?? 0, icon: Award, href: "/admin/certificacoes", color: "text-blue-600 bg-blue-50" },
    { label: "Candidatos", value: candidatos?.length ?? 0, icon: Users, href: "/admin/candidatos", color: "text-purple-600 bg-purple-50" },
    { label: "Avaliadores", value: avaliadores?.length ?? 0, icon: UserCheck, href: "/admin/avaliadores", color: "text-green-600 bg-green-50" },
    { label: "Bancas", value: bancas?.length ?? 0, icon: Shield, href: "/admin/bancas", color: "text-amber-600 bg-amber-50" },
    { label: "Eventos Pendentes", value: eventos?.length ?? 0, icon: Bell, href: "/admin/eventos", color: "text-red-600 bg-red-50" },
  ];

  const etapas = candidatos?.reduce((acc: Record<string, number>, c) => {
    acc[c.etapaAtual] = (acc[c.etapaAtual] || 0) + 1;
    return acc;
  }, {}) ?? {};

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {Object.keys(etapas).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Candidatos por Etapa</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(etapas).map(([etapa, count]) => (
                <div key={etapa} className="bg-muted/30 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-primary">{count}</div>
                  <div className="text-xs text-muted-foreground capitalize">{etapa.replace(/_/g, " ")}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
