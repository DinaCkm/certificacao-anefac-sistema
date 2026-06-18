import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Award, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = { ativa: "bg-green-100 text-green-800", em_breve: "bg-amber-100 text-amber-800", inativa: "bg-gray-100 text-gray-600", encerrada: "bg-red-100 text-red-800" };

const EMPTY = { slug: "", nome: "", subtitulo: "", descricao: "", descricaoBreve: "", taxaAnalise: "", taxaEmissao: "", status: "ativa" as const, cor: "blue" as const, caminhoDefault: null as "A" | "B" | null };

export default function AdminCertificacoes() {
  const { data: certs, refetch } = trpc.certificacoes.list.useQuery();
  const upsert = trpc.certificacoes.upsert.useMutation();
  const del = trpc.certificacoes.delete.useMutation();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [editId, setEditId] = useState<number | undefined>();

  function openNew() { setForm(EMPTY); setEditId(undefined); setOpen(true); }
  function openEdit(c: any) { setForm({ ...c, competencias: undefined, preRequisitos: undefined, documentosExigidos: undefined }); setEditId(c.id); setOpen(true); }

  async function handleSave() {
    try {
      await upsert.mutateAsync({ ...form, id: editId });
      toast.success(editId ? "Certificação atualizada!" : "Certificação criada!");
      setOpen(false); refetch();
    } catch (e: any) { toast.error(e.message || "Erro ao salvar."); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Confirmar exclusão?")) return;
    try { await del.mutateAsync({ id }); toast.success("Excluída!"); refetch(); }
    catch (e: any) { toast.error(e.message || "Erro ao excluir."); }
  }

  const F = (k: string) => ({ value: form[k] ?? "", onChange: (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value })) });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Certificações</h1>
        <Button onClick={openNew} className="bg-accent text-accent-foreground hover:bg-amber-500"><Plus className="h-4 w-4 mr-2" /> Nova</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {certs?.map((c) => (
          <Card key={c.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-accent" />
                  <h3 className="font-semibold text-primary">{c.nome}</h3>
                </div>
                <Badge className={STATUS_COLORS[c.status]}>{c.status}</Badge>
              </div>
              {c.subtitulo && <p className="text-sm text-muted-foreground mb-2">{c.subtitulo}</p>}
              <div className="flex gap-2 text-xs text-muted-foreground mb-4">
                {c.taxaAnalise && <span>Taxa análise: R$ {c.taxaAnalise}</span>}
                {c.taxaEmissao && <span>· Taxa emissão: R$ {c.taxaEmissao}</span>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Pencil className="h-3 w-3 mr-1" /> Editar</Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(c.id)}><Trash2 className="h-3 w-3 mr-1" /> Excluir</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!certs || certs.length === 0) && (
          <div className="col-span-2 text-center py-16 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhuma certificação cadastrada.</p>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar" : "Nova"} Certificação</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2"><label className="text-sm font-medium mb-1 block">Nome *</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" {...F("nome")} /></div>
            <div><label className="text-sm font-medium mb-1 block">Slug *</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="cca, cca-plus, ecodobem-n1" {...F("slug")} /></div>
            <div><label className="text-sm font-medium mb-1 block">Status</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))}>
                <option value="ativa">Ativa</option><option value="em_breve">Em breve</option><option value="inativa">Inativa</option><option value="encerrada">Encerrada</option>
              </select>
            </div>
            <div className="col-span-2"><label className="text-sm font-medium mb-1 block">Subtítulo</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" {...F("subtitulo")} /></div>
            <div className="col-span-2"><label className="text-sm font-medium mb-1 block">Descrição Breve</label><textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm" rows={2} {...F("descricaoBreve")} /></div>
            <div className="col-span-2"><label className="text-sm font-medium mb-1 block">Descrição Completa</label><textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm" rows={3} {...F("descricao")} /></div>
            <div><label className="text-sm font-medium mb-1 block">Taxa de Análise (R$)</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" {...F("taxaAnalise")} /></div>
            <div><label className="text-sm font-medium mb-1 block">Taxa de Emissão (R$)</label><input className="w-full border border-border rounded-lg px-3 py-2 text-sm" {...F("taxaEmissao")} /></div>
            <div><label className="text-sm font-medium mb-1 block">Cor</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={form.cor} onChange={e => setForm((p: any) => ({ ...p, cor: e.target.value }))}>
                <option value="blue">Azul</option><option value="gold">Dourado</option><option value="green">Verde</option><option value="purple">Roxo</option><option value="orange">Laranja</option><option value="teal">Teal</option>
              </select>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Caminho Padrão</label>
              <select className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={form.caminhoDefault ?? ""} onChange={e => setForm((p: any) => ({ ...p, caminhoDefault: e.target.value || null }))}>
                <option value="">Nenhum</option><option value="A">Caminho A</option><option value="B">Caminho B</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>{upsert.isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
