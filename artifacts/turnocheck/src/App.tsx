import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import NotFound from "@/pages/not-found";
import DesktopWorkspacePage from "@/pages/DesktopWorkspacePage";
import { Redirect } from "wouter";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/w/turno-noite" />} />
      <Route path="/w/:slug" component={DesktopWorkspacePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Garantir que a base seja exatamente o que o GitHub espera (/Mi-To-Do-List)
  // No GitHub Pages, BASE_URL costuma ser /RepoName/
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  // Logs diagnósticos para produção
  if (import.meta.env.PROD) {
    console.log("[App] Modo Produção");
    console.log("[App] BASE_URL:", import.meta.env.BASE_URL);
    console.log("[App] Router Base:", base);
    console.log("[App] Pathname:", window.location.pathname);
  }


  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <WouterRouter base={base}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}


export default App;
