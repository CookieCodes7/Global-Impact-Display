import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import Terminal from "@/pages/Terminal";
import MapPage from "@/pages/MapPage";
import StockPage from "@/pages/StockPage";
import PortfolioPage from "@/pages/PortfolioPage";
import NewsPage from "@/pages/NewsPage";
import LandingPage from "@/pages/LandingPage";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!user) navigate("/landing");
  }, [user, navigate]);

  if (!user) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/landing" component={LandingPage} />
      <Route path="/map">
        <AuthGuard><MapPage /></AuthGuard>
      </Route>
      <Route path="/stock/:symbol">
        <AuthGuard><StockPage /></AuthGuard>
      </Route>
      <Route path="/portfolio">
        <AuthGuard><PortfolioPage /></AuthGuard>
      </Route>
      <Route path="/news">
        <AuthGuard><NewsPage /></AuthGuard>
      </Route>
      <Route path="/">
        <AuthGuard><Terminal /></AuthGuard>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </AuthProvider>
  );
}

export default App;
