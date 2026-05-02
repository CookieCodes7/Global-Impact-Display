import { Switch, Route, Router as WouterRouter } from "wouter";
import Terminal from "@/pages/Terminal";
import MapPage from "@/pages/MapPage";
import StockPage from "@/pages/StockPage";
import PortfolioPage from "@/pages/PortfolioPage";
import NewsPage from "@/pages/NewsPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Terminal} />
      <Route path="/map" component={MapPage} />
      <Route path="/stock/:symbol" component={StockPage} />
      <Route path="/portfolio" component={PortfolioPage} />
      <Route path="/news" component={NewsPage} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default App;
