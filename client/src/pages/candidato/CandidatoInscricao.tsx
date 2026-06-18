import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CandidatoInscricao() {
  const { user } = useAuth();
  const { data: certs } = trpc.certificacoes.list.useQuery();
  const createCandidato = trpc.candidatos.create.useMutation();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ certificacaoId: 0, nomeCompleto: user?.name || "", empresa: "", cargo: "", anosExperiencia: 0, formacao: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.certificacaoId) { toast.error("Selecione uma certificação."); return; }
    try {
      await createCandidato.mutateAsync({ ...form, anosExperiencia: Number(form.anosExperiencia) });
      toast.success("Inscrição realizada com sucesso!");
      navigate("/candidato");
    } catch (err: any) {
      toast.error(err.message || "Erro ao realizar inscrição.");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/candidato"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button></Link>
        <h1 className="text-2xl font-bold text-primary">Nova Inscrição</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Dados da Inscrição</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Certificação *</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={form.certificacaoId} onChange={e => setForm(p => ({ ...p, certificacaoId: Number(e.target.value) }))}>
                <option value={0}>Selecione...</option>
                {certs?.filter(c => c.status === "ativa").map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Nome Completo</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={form.nomeCompleto} onChange={e => setForm(p => ({ ...p, nomeCompleto: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">Empresa</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={form.empresa} onChange={e => setForm(p => ({ ...p, empresa: e.target.value }))} /></div>
              <div><label className="text-sm font-medium mb-1 block">Cargo</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={form.cargo} onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">Anos de Experiência</label><input type="number" min={0} className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={form.anosExperiencia} onChange={e => setForm(p => ({ ...p, anosExperiencia: Number(e.target.value) }))} /></div>
              <div><label className="text-sm font-medium mb-1 block">Formação</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={form.formacao} onChange={e => setForm(p => ({ ...p, formacao: e.target.value }))} /></div>
            </div>
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-amber-500" disabled={createCandidato.isPending}>
              {createCandidato.isPending ? "Inscrevendo..." : "Confirmar Inscrição"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
