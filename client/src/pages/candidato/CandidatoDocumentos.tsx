import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, CheckCircle, XCircle, Clock, FileText, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pendente: { label: "Pendente", icon: Clock, color: "bg-amber-100 text-amber-800" },
  aprovado: { label: "Aprovado", icon: CheckCircle, color: "bg-green-100 text-green-800" },
  reprovado: { label: "Reprovado", icon: XCircle, color: "bg-red-100 text-red-800" },
};

const TIPOS_DOC = [
  { value: "diploma", label: "Diploma / Graduação / Pós" },
  { value: "declaracao", label: "Declaração de Experiência" },
  { value: "conduta", label: "Código de Conduta" },
  { value: "recomendacao", label: "Carta de Recomendação" },
  { value: "outros", label: "Outros" },
];

export default function CandidatoDocumentos() {
  const { candidatoId } = useParams<{ candidatoId: string }>();
  const id = Number(candidatoId);
  const { data: documentos, isLoading, refetch } = trpc.documentos.byCandidato.useQuery({ candidatoId: id });
  const { data: candidato } = trpc.candidatos.byId.useQuery({ id });
  const { data: certs } = trpc.certificacoes.list.useQuery();
  const createDoc = trpc.documentos.create.useMutation();
  const uploadToS3 = trpc.documentos.getUploadUrl.useMutation();
  const [uploading, setUploading] = useState(false);
  const [nomeDoc, setNomeDoc] = useState("");
  const [tipoDoc, setTipoDoc] = useState("diploma");
  const fileRef = useRef<HTMLInputElement>(null);

  const cert = certs?.find(c => c.id === candidato?.certificacaoId);
  const docsExigidos = (cert?.documentosExigidos as string[] | null) ?? [];

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !nomeDoc) { toast.error("Selecione um arquivo e informe o nome do documento."); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("Arquivo muito grande. Máximo 20MB."); return; }
    setUploading(true);
    try {
      // 1. Solicita presigned URL do servidor
      const { uploadUrl, key, fileUrl } = await uploadToS3.mutateAsync({
        candidatoId: id,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      });

      // 2. Faz PUT direto para S3
      const uploadResp = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!uploadResp.ok) throw new Error("Falha ao enviar arquivo para o S3.");

      // 3. Registra metadados no banco
      await createDoc.mutateAsync({
        candidatoId: id,
        nomeDocumento: nomeDoc,
        tipoDocumento: tipoDoc,
        s3Key: key,
        s3Url: fileUrl,
        mimeType: file.type,
        tamanhoBytes: file.size,
      });

      toast.success("Documento enviado com sucesso!");
      setNomeDoc("");
      if (fileRef.current) fileRef.current.value = "";
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar documento. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/candidato"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-primary">Documentos</h1>
          <p className="text-sm text-muted-foreground">{cert?.nome || "Certificação"}</p>
        </div>
      </div>

      {/* Documentos exigidos */}
      {docsExigidos.length > 0 && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-800">Documentos exigidos para esta certificação</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {docsExigidos.map((doc, i) => (
                <li key={i} className="text-sm text-blue-700 flex items-center gap-2">
                  <FileText className="h-3 w-3 shrink-0" />{doc}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Formulário de upload */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Enviar Documento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Nome do Documento *</label>
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm"
              placeholder="Ex: Diploma de Graduação em Ciências Contábeis"
              value={nomeDoc}
              onChange={e => setNomeDoc(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Tipo de Documento</label>
            <select
              className="w-full border border-border rounded-lg px-3 py-2 text-sm"
              value={tipoDoc}
              onChange={e => setTipoDoc(e.target.value)}
            >
              {TIPOS_DOC.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Arquivo (PDF, JPG, PNG — máx. 20MB)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground cursor-pointer"
            />
          </div>
          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : <><Upload className="h-4 w-4 mr-2" /> Enviar Documento</>}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de documentos enviados */}
      <div>
        <h2 className="text-lg font-semibold text-primary mb-3">Documentos Enviados</h2>
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : documentos && documentos.length > 0 ? (
          <div className="space-y-3">
            {documentos.map((doc) => {
              const status = (doc.status as keyof typeof STATUS_CONFIG) || "pendente";
              const cfg = STATUS_CONFIG[status];
              return (
                <Card key={doc.id} className={`border-l-4 ${status === "aprovado" ? "border-l-green-500" : status === "reprovado" ? "border-l-red-500" : "border-l-amber-400"}`}>
                  <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <cfg.icon className={`h-5 w-5 ${status === "aprovado" ? "text-green-600" : status === "reprovado" ? "text-red-600" : "text-amber-600"}`} />
                      <div>
                        <p className="font-medium text-primary text-sm">{doc.nomeDocumento}</p>
                        <p className="text-xs text-muted-foreground">{doc.tipoDocumento} · {new Date(doc.createdAt).toLocaleDateString("pt-BR")}</p>
                        {doc.parecer && <p className="text-xs text-muted-foreground italic mt-0.5">Parecer: {doc.parecer}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cfg.color}>{cfg.label}</Badge>
                      {doc.s3Url && (
                        <a href={doc.s3Url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline"><FileText className="h-3 w-3 mr-1" /> Ver</Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Upload className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhum documento enviado ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
