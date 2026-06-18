import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BookOpen, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const EMPTY = { titulo: "", descricao: "", categoria: "controladoria" as const, nivel: "basico" as const, duracaoHoras: 0, instrutor: "", preco: "", linkCompra: "", destaque: false, ativo: true };

export default function AdminCursos() {
  const { data: cursos, refetch } = trpc.cursos.listAdmin.useQuery();
  const create = trpc.cursos.create.useMutation();
  const update = trpc.cursos.update.useMutation();
  const del = trpc.cursos.delete.useMutation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [editId, setEditId] = useState<number | undefined>();

  function openNew() { setForm(EMPTY); setEditId(undefined); setOpen(true); }
  function openEdit(c: any) { setForm({ titulo: c.titulo, descricao: c.descricao || "", categoria: c.categoria, nivel: c.nivel, duracaoHoras: c.duracaoHoras || 0, instrutor: c.instrutor || "", preco: c.preco || "", linkCompra: c.linkCompra || "", destaque: c.destaque, ativo: c.ativo }); setEditId(c.id); setOpen(true); }

  async function handleSave() {
    try {
      if (editId) await update.mutateAsync({ id: editId, ...form, duracaoHoras: Number(form.duracaoHoras) });
      else await create.mutateAsync({ ...form, duracaoHoras: Number(form.duracaoHoras) });
      toast.success(editId ? "Curso atualizado!" : "Curso criado!"); setOpen(false); refetch();
    } catch (e: any) { toast.error(e.message || "Erro ao salvar."); }
  }

  const F = (k: string) => ({ value: form[k] ?? "", onChange: (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value })) });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Cursos</h1>
        <Button onClick={openNew} className="bg-accent text-accent-foreground hover:bg-amber-500"><Plus className="h-4 w-4 mr-2" /> Novo Curso</Button>
      </div>
      <div className="space-y-3">
        {cursos?.map((c) => (
          <Card key={c.id} className="hover:shadow-sm">
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><BookOpen className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="font-medium text-primary">{c.titulo}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">{c.instrutor && <span>{c.instrutor}</span>}{c.duracaoHoras && <span>· {c.duracaoHoras}h</span>}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{c.categoria}</Badge>
                <Badge variant={c.ativo ? "default" : "outline"} className="text-xs">{c.ativo ? "Ativo" : "Inativo"}</Badge>
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={async () => { if (confirm("Excluir?")) { await del.mutateAsync({ id: c.id }); refetch(); } }}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!cursos || cursos.length === 0) && <div className="text-center py-16 text-muted-foreground"><BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Nenhum curso cadastrado.</p></div>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Curso</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-sm font-medium mb-1 block">Título *</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" {...F("titulo")} /></div>
            <div><label className="text-sm font-medium mb-1 block">Descrição</label><textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm" rows={2} {...F("descricao")} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">Categoria</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={form.categoria} onChange={e => setForm((p: any) => ({ ...p, categoria: e.target.value }))}>
                  <option value="controladoria">Controladoria</option><option value="financas">Finanças</option><option value="gestao">Gestão</option><option value="sustentabilidade">Sustentabilidade</option><option value="lideranca">Liderança</option><option value="outros">Outros</option>
                </select>
              </div>
              <div><label className="text-sm font-medium mb-1 block">Nível</label>
                <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={form.nivel} onChange={e => setForm((p: any) => ({ ...p, nivel: e.target.value }))}>
                  <option value="basico">Básico</option><option value="intermediario">Intermediário</option><option value="avancado">Avançado</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">Instrutor</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" {...F("instrutor")} /></div>
              <div><label className="text-sm font-medium mb-1 block">Duração (horas)</label><input type="number" min={0} className="w-full border border-border rounded-lg px-3 py-2 text-sm" {...F("duracaoHoras")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">Preço (R$)</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" {...F("preco")} /></div>
              <div><label className="text-sm font-medium mb-1 block">Link de Compra</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" {...F("linkCompra")} /></div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.ativo} onChange={e => setForm((p: any) => ({ ...p, ativo: e.target.checked }))} /> Ativo</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.destaque} onChange={e => setForm((p: any) => ({ ...p, destaque: e.target.checked }))} /> Destaque</label>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={create.isPending || update.isPending}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
