import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Shield } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = { admin: "Admin", coordenador: "Coordenador", avaliador_documental: "Avaliador Doc.", membro_banca: "Membro Banca", candidato: "Candidato" };
const ROLE_COLORS: Record<string, string> = { admin: "bg-red-100 text-red-800", coordenador: "bg-purple-100 text-purple-800", avaliador_documental: "bg-green-100 text-green-800", membro_banca: "bg-blue-100 text-blue-800", candidato: "bg-gray-100 text-gray-700" };

export default function AdminUsuarios() {
  const { data: usuarios, refetch } = trpc.auth.listUsers.useQuery();
  const updateRole = trpc.auth.updateRole.useMutation();

  async function handleRoleChange(userId: number, role: string) {
    try {
      await updateRole.mutateAsync({ userId, role: role as any });
      toast.success("Papel atualizado!");
      refetch();
    } catch (e: any) { toast.error(e.message || "Erro ao atualizar papel."); }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-6">Usuários</h1>
      <div className="space-y-3">
        {usuarios?.map((u) => (
          <Card key={u.id} className="hover:shadow-sm">
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-primary">{u.name || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground">{u.email || u.openId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={ROLE_COLORS[u.role] || "bg-gray-100 text-gray-700"}>{ROLE_LABELS[u.role] || u.role}</Badge>
                <select
                  className="border border-border rounded-lg px-2 py-1.5 text-sm"
                  value={u.role}
                  onChange={e => handleRoleChange(u.id, e.target.value)}
                >
                  <option value="candidato">Candidato</option>
                  <option value="avaliador_documental">Avaliador Documental</option>
                  <option value="membro_banca">Membro de Banca</option>
                  <option value="coordenador">Coordenador</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!usuarios || usuarios.length === 0) && (
          <div className="text-center py-16 text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Nenhum usuário cadastrado.</p></div>
        )}
      </div>
    </div>
  );
}
