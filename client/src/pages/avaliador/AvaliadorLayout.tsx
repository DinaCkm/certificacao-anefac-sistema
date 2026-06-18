import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { UserCheck, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/avaliador", label: "Minhas Atribuições", icon: LayoutDashboard },
];

export default function AvaliadorLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center max-w-sm p-8 bg-white rounded-2xl shadow-lg">
          <UserCheck className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold text-primary mb-2">Painel do Avaliador</h2>
          <p className="text-muted-foreground mb-6">Faça login para acessar suas atribuições.</p>
          <a href={getLoginUrl()}><Button size="lg" className="w-full">Entrar</Button></a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary text-primary-foreground flex flex-col transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>
        <div className="p-5 border-b border-white/10">
          <Link href="/"><span className="font-bold text-lg"><span className="text-amber-300 font-display">ANEFAC</span></span></Link>
          <p className="text-white/60 text-xs mt-1">Painel do Avaliador</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${location === item.href ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
                <item.icon className="h-4 w-4" />{item.label}
              </div>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-white/60 mb-2 truncate">{user?.name}</div>
          <Button variant="ghost" size="sm" className="w-full text-white/70 hover:text-white hover:bg-white/10 justify-start" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-border px-4 h-14 flex items-center justify-between lg:hidden">
          <span className="font-bold text-primary">ANEFAC Avaliador</span>
          <button onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
