import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserCheck, Plus, Pencil, Trash2, Mail, Building } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TIPO_LABELS: Record<string, string> = { documental: "Documental", entrevista: "Entrevista", ambos: "Ambos" };
const STATUS_COLORS: Record<string, string> = { ativo: "bg-green-100 text-green-800", inativo: "bg-gray-100 text-gray-600", afastado: "bg-amber-100 text-amber-800" };
const EMPTY = { nome: "", email: "", telefone: "", empresa: "", cargo: "", tipo: "documental" as const, status: "ativo" as const, observacoes: "" };

export default function AdminAvaliadores() {
  const { data: avaliadores, refetch } = trpc.avaliadores.list.useQuery();
  const { data: certs } = trpc.certificacoes.list.useQuery();
  const create = trpc.avaliadores.create.useMutation();
  const update = trpc.avaliadores.update.useMutation();
  const del = trpc.avaliadores.delete.useMutation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [editId, setEditId] = useState<number | undefined>();
  const [certsSel, setCertsSel] = useState<number[]>([]);

  function openNew() { setForm(EMPTY); setEditId(undefined); setCertsSel([]); setOpen(true); }
  function openEdit(a: any) {
    setForm({ nome: a.nome, email: a.email, telefone: a.telefone || "", empresa: a.empresa || "", cargo: a.cargo || "", tipo: a.tipo, status: a.status, observacoes: a.observacoes || "" });
    setEditId(a.id);
    setCertsSel((a.certificacoesHabilitadas as number[] | null) ?? []);
    setOpen(true);
  }

  async function handleSave() {
    try {
      if (editId) await update.mutateAsync({ id: editId, ...form, certificacoesHabilitadas: certsSel });
      else await create.mutateAsync({ ...form, certificacoesHabilitadas: certsSel });
      toast.success(editId ? "Avaliador atualizado!" : "Avaliador cadastrado!");
      setOpen(false); refetch();
    } catch (e: any) { toast.error(e.message || "Erro ao salvar."); }
  }

  const F = (k: string) => ({ value: form[k] ?? "", onChange: (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value })) });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Avaliadores</h1>
        <Button onClick={openNew} className="bg-accent text-accent-foreground hover:bg-amber-500"><Plus className="h-4 w-4 mr-2" /> Novo Avaliador</Button>
      </div>
      <div className="space-y-3">
        {avaliadores?.map((a) => (
          <Card key={a.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center"><UserCheck className="h-5 w-5 text-green-600" /></div>
                  <div>
                    <p className="font-medium text-primary">{a.nome}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{a.email}</span>
                      {a.empresa && <span className="flex items-center gap-1"><Building className="h-3 w-3" />{a.empresa}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={STATUS_COLORS[a.status]}>{a.status}</Badge>
                  <Badge variant="outline">{TIPO_LABELS[a.tipo]}</Badge>
                  <Button size="sm" variant="outline" onClick={() => openEdit(a)}><Pencil className="h-3 w-3" /></Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={async () => { if (confirm("Excluir?")) { await del.mutateAsync({ id: a.id }); refetch(); } }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!avaliadores || avaliadores.length === 0) && (
          <div className="text-center py-16 text-muted-foreground"><UserCheck className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Nenhum avaliador cadastrado.</p></div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Avaliador</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-sm font-medium mb-1 block">Nome *</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" {...F("nome")} /></div>
            <div><label className="text-sm font-medium mb-1 block">E-mail *</label><input type="email" className="w-full border border-border rounded-lg px-3 py-2 text-sm" {...F("email")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">Empresa</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" {...F("empresa")} /></div>
              <div><label className="text-sm font-medium mb-1 block">Cargo</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" {...F("cargo")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">Tipo</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={form.tipo} onChange={e => setForm((p: any) => ({ ...p, tipo: e.target.value }))}>
                  <option value="documental">Documental</option><option value="entrevista">Entrevista</option><option value="ambos">Ambos</option>
                </select>
              </div>
              <div><label className="text-sm font-medium mb-1 block">Status</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))}>
                  <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="afastado">Afastado</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Certificações Habilitadas</label>
              <div className="space-y-1">
                {certs?.map(c => (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={certsSel.includes(c.id)} onChange={e => setCertsSel(prev => e.target.checked ? [...prev, c.id] : prev.filter(x => x !== c.id))} />
                    {c.nome}
                  </label>
                ))}
              </div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Observações</label><textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm" rows={2} {...F("observacoes")} /></div>
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
