import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { useEffect } from "react";

import Home from "./pages/public/Home";
import CertificacaoPage from "./pages/public/CertificacaoPage";
import ComoFunciona from "./pages/public/ComoFunciona";
import CursosPublico from "./pages/public/CursosPublico";

import CandidatoLayout from "./pages/candidato/CandidatoLayout";
import CandidatoDashboard from "./pages/candidato/CandidatoDashboard";
import CandidatoDocumentos from "./pages/candidato/CandidatoDocumentos";
import CandidatoCursos from "./pages/candidato/CandidatoCursos";
import CandidatoInscricao from "./pages/candidato/CandidatoInscricao";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCertificacoes from "./pages/admin/AdminCertificacoes";
import AdminCandidatos from "./pages/admin/AdminCandidatos";
import AdminAvaliadores from "./pages/admin/AdminAvaliadores";
import AdminBancas from "./pages/admin/AdminBancas";
import AdminCursos from "./pages/admin/AdminCursos";
import AdminEventos from "./pages/admin/AdminEventos";
import AdminUsuarios from "./pages/admin/AdminUsuarios";

import AvaliadorLayout from "./pages/avaliador/AvaliadorLayout";
import AvaliadorDashboard from "./pages/avaliador/AvaliadorDashboard";
import AnaliseDocumental from "./pages/avaliador/AnaliseDocumental";

function RoleRedirect() {
  const { user, loading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (loading || !user) return;
    if (location !== "/") return;
    const role = (user as { role?: string }).role;
    if (role === "admin" || role === "coordenador") {
      navigate("/admin");
    } else if (role === "avaliador_documental" || role === "membro_banca") {
      navigate("/avaliador");
    } else if (role === "candidato" || role === "user") {
      navigate("/candidato");
    }
  }, [user, loading, location, navigate]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/certificacao/:slug" component={CertificacaoPage} />
      <Route path="/como-funciona/:slug" component={ComoFunciona} />
      <Route path="/cursos" component={CursosPublico} />

      <Route path="/candidato">
        {() => (
          <CandidatoLayout>
            <CandidatoDashboard />
          </CandidatoLayout>
        )}
      </Route>
      <Route path="/candidato/inscricao">
        {() => (
          <CandidatoLayout>
            <CandidatoInscricao />
          </CandidatoLayout>
        )}
      </Route>
      <Route path="/candidato/documentos/:candidatoId">
        {() => (
          <CandidatoLayout>
            <CandidatoDocumentos />
          </CandidatoLayout>
        )}
      </Route>
      <Route path="/candidato/cursos">
        {() => (
          <CandidatoLayout>
            <CandidatoCursos />
          </CandidatoLayout>
        )}
      </Route>

      <Route path="/admin">
        {() => (
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/certificacoes">
        {() => (
          <AdminLayout>
            <AdminCertificacoes />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/candidatos">
        {() => (
          <AdminLayout>
            <AdminCandidatos />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/avaliadores">
        {() => (
          <AdminLayout>
            <AdminAvaliadores />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/bancas">
        {() => (
          <AdminLayout>
            <AdminBancas />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/cursos">
        {() => (
          <AdminLayout>
            <AdminCursos />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/eventos">
        {() => (
          <AdminLayout>
            <AdminEventos />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/usuarios">
        {() => (
          <AdminLayout>
            <AdminUsuarios />
          </AdminLayout>
        )}
      </Route>

      <Route path="/avaliador">
        {() => (
          <AvaliadorLayout>
            <AvaliadorDashboard />
          </AvaliadorLayout>
        )}
      </Route>
      <Route path="/avaliador/analise/:atribuicaoId">
        {() => (
          <AvaliadorLayout>
            <AnaliseDocumental />
          </AvaliadorLayout>
        )}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <RoleRedirect />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
