import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Shield, Plus, Pencil, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminBancas() {
  const { data: bancas, refetch } = trpc.bancas.list.useQuery();
  const { data: avaliadores } = trpc.avaliadores.list.useQuery();
  const { data: certs } = trpc.certificacoes.list.useQuery();
  const create = trpc.bancas.create.useMutation();
  const update = trpc.bancas.update.useMutation();
  const del = trpc.bancas.delete.useMutation();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | undefined>();
  const [form, setForm] = useState({ nome: "", numero: 1, status: "ativa" as const, observacoes: "" });
  const [certsSel, setCertsSel] = useState<number[]>([]);
  const [membros, setMembros] = useState<Array<{ avaliadorId: number; papel: "presidente" | "membro" }>>([]);

  function openNew() {
    const nextNum = (bancas?.length ?? 0) + 1;
    setForm({ nome: `Banca ${nextNum}`, numero: nextNum, status: "ativa", observacoes: "" });
    setCertsSel([]); setMembros([]); setEditId(undefined); setOpen(true);
  }
  function openEdit(b: any) {
    setForm({ nome: b.nome, numero: b.numero, status: b.status, observacoes: b.observacoes || "" });
    setCertsSel((b.certificacoesHabilitadas as number[] | null) ?? []);
    setMembros(b.membros?.map((m: any) => ({ avaliadorId: m.avaliadorId, papel: m.papel })) ?? []);
    setEditId(b.id); setOpen(true);
  }

  async function handleSave() {
    try {
      if (editId) await update.mutateAsync({ id: editId, ...form, certificacoesHabilitadas: certsSel, membros });
      else await create.mutateAsync({ ...form, certificacoesHabilitadas: certsSel, membros });
      toast.success(editId ? "Banca atualizada!" : "Banca criada!");
      setOpen(false); refetch();
    } catch (e: any) { toast.error(e.message || "Erro ao salvar."); }
  }

  function addMembro() {
    if (membros.length >= 5) { toast.error("Máximo de 5 membros por banca."); return; }
    setMembros(prev => [...prev, { avaliadorId: 0, papel: "membro" }]);
  }

  const entrevistadores = avaliadores?.filter(a => a.tipo === "entrevista" || a.tipo === "ambos") ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Bancas de Entrevista</h1>
        <Button onClick={openNew} className="bg-accent text-accent-foreground hover:bg-amber-500"><Plus className="h-4 w-4 mr-2" /> Nova Banca</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {bancas?.map((b) => (
          <Card key={b.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-amber-600" />{b.nome}</CardTitle>
                <Badge className={b.status === "ativa" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>{b.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                <Users className="h-4 w-4" />
                <span>{b.membros?.length ?? 0} membro(s)</span>
              </div>
              {b.membros && b.membros.length > 0 && (
                <div className="space-y-1 mb-3">
                  {b.membros.map((m: any, i: number) => {
                    const av = avaliadores?.find(a => a.id === m.avaliadorId);
                    return <div key={i} className="text-xs text-muted-foreground flex items-center gap-1"><span className={m.papel === "presidente" ? "font-semibold text-primary" : ""}>{av?.nome || "—"}</span><Badge variant="outline" className="text-xs py-0">{m.papel}</Badge></div>;
                  })}
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(b)}><Pencil className="h-3 w-3 mr-1" /> Editar</Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={async () => { if (confirm("Excluir?")) { await del.mutateAsync({ id: b.id }); refetch(); } }}><Trash2 className="h-3 w-3 mr-1" /> Excluir</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!bancas || bancas.length === 0) && (
          <div className="col-span-2 text-center py-16 text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Nenhuma banca cadastrada.</p></div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Nova"} Banca</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">Nome</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} /></div>
              <div><label className="text-sm font-medium mb-1 block">Número</label><input type="number" min={1} className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={form.numero} onChange={e => setForm(p => ({ ...p, numero: Number(e.target.value) }))} /></div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Status</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}>
                <option value="ativa">Ativa</option><option value="inativa">Inativa</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Certificações Habilitadas</label>
              <div className="space-y-1">{certs?.map(c => (<label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={certsSel.includes(c.id)} onChange={e => setCertsSel(prev => e.target.checked ? [...prev, c.id] : prev.filter(x => x !== c.id))} />{c.nome}</label>))}</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Membros (máx. 5)</label>
                <Button type="button" size="sm" variant="outline" onClick={addMembro} disabled={membros.length >= 5}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
              </div>
              <div className="space-y-2">
                {membros.map((m, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select className="flex-1 border border-border rounded-lg px-2 py-1.5 text-sm" value={m.avaliadorId} onChange={e => setMembros(prev => prev.map((x, j) => j === i ? { ...x, avaliadorId: Number(e.target.value) } : x))}>
                      <option value={0}>Selecione...</option>
                      {entrevistadores.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                    </select>
                    <select className="border border-border rounded-lg px-2 py-1.5 text-sm" value={m.papel} onChange={e => setMembros(prev => prev.map((x, j) => j === i ? { ...x, papel: e.target.value as any } : x))}>
                      <option value="membro">Membro</option><option value="presidente">Presidente</option>
                    </select>
                    <Button type="button" size="sm" variant="ghost" className="text-red-500" onClick={() => setMembros(prev => prev.filter((_, j) => j !== i))}>×</Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
