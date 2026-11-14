// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import {
  Bot,
  Building2,
  ClipboardCheck,
  Handshake,
  LayoutDashboard,
  Plug,
  Power,
  Radio,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { Q, Ze } from "./shared-inline";
import { useBrain } from "./store";
import { Orb } from "./components/Orb";
import { Comando } from "./components/Command";
import { Escritorio } from "./components/Escritorio";
import { Dashboard } from "./components/Dashboard";
import { Prospeccoes } from "./components/Crm";
import { Financeiro } from "./components/Financeiro";
import { Seo } from "./components/Seo";
import { Equipes } from "./components/Equipes";
import { Agentes } from "./components/Agentes";
import { Aprovacoes } from "./components/Aprovacoes";
import { Integracoes } from "./components/Integracoes";
import { Avisos } from "./components/Avisos";

export const Du = [
  {
    id: "comando",
    label: "Comando",
    icon: Radio,
  },
  {
    id: "escritorio",
    label: "Escrit\xF3rio",
    icon: Building2,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "crm",
    label: "CRM",
    icon: Handshake,
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: Wallet,
  },
  {
    id: "seo",
    label: "SEO",
    icon: Search,
  },
  {
    id: "equipes",
    label: "Equipes",
    icon: Users,
  },
  {
    id: "agentes",
    label: "Agentes",
    icon: Bot,
  },
  {
    id: "aprovacoes",
    label: "Aprova\xE7\xF5es",
    icon: ClipboardCheck,
  },
  {
    id: "integracoes",
    label: "Integra\xE7\xF5es",
    icon: Plug,
  },
];
export const Ts = () => window.location.hash.slice(1).split("/");
export const rc = () => {
  const e = Ts()[0] === "hoje" ? "dashboard" : Ts()[0];
  return Du.find((a) => a.id === e)?.id ?? "comando";
};
export const oc = () => Ze.find((e) => e.id === Ts()[1])?.id ?? "marketing";
export function App() {
  const { state: e, pending: a, setKill: t, dismissError: r } = useBrain(),
    [o, s] = React.useState(rc),
    [i, l] = React.useState(oc),
    [c, u] = React.useState(null),
    [v, g] = React.useState(null),
    [x, j] = React.useState(null);
  React.useEffect(() => {
    const d = () => {
      (s(rc()), l(oc()));
    };
    return (window.addEventListener("hashchange", d), () => window.removeEventListener("hashchange", d));
  }, []);
  const m = (d, p) => {
      (s(d), p && l(p));
      try {
        window.history.replaceState(null, "", d === "equipes" ? `#equipes/${p ?? i}` : `#${d}`);
      } catch {}
    },
    N = React.useMemo(() => {
      const d = {};
      for (const p of a) d[p.agentId] = (d[p.agentId] ?? 0) + 1;
      return d;
    }, [a]),
    h = Q.filter((d) => e.runtime[d.id]?.status === "trabalhando" && !e.kill).length,
    f = (d) => {
      (u(null), g(d), m("comando"));
    };
  return (
    <div className={`app ${e.kill ? "is-kill" : ""}`}>
      <header className="top">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div>
            <h1>Central Synapsa</h1>
            <p>{e.mode === "live" ? "Ao vivo \xB7 Brain neste computador" : "Dados de demonstra\xE7\xE3o"}</p>
          </div>
        </div>
        <nav className="nav" aria-label="Seções">
          {Du.map(({ id: d, label: p, icon: S }) => (
            <button
              type="button"
              title={p}
              className={`nav-btn ${o === d ? "on" : ""}`}
              aria-current={o === d ? "page" : void 0}
              onClick={() => m(d)}
            >
              <S size={17} aria-hidden />
              <span>{p}</span>
              {d === "aprovacoes" && a.length ? <em className="badge">{a.length}</em> : null}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className={`kill ${e.kill ? "on" : ""}`}
          onClick={() => t(!e.kill)}
          aria-pressed={e.kill}
          title="Para todos os agentes e bloqueia aprovações"
        >
          <Power size={16} aria-hidden />
          <span>{e.kill ? "Retomar agentes" : "Parar tudo"}</span>
        </button>
      </header>
      {e.error ? (
        <p className="banner" role="alert">
          {e.error}{" "}
          <button type="button" className="link" onClick={r}>
            Fechar
          </button>
        </p>
      ) : null}
      <main>
        {o === "comando" ? (
          <div className="command">
            <section className="stage" aria-label="Agentes ao redor do núcleo">
              <Orb
                runtime={e.runtime}
                pendingBy={N}
                kill={e.kill}
                thinking={e.thinking}
                selected={c}
                onSelect={(d) => {
                  (u(d), m("agentes"));
                }}
              />
              <p className="stage-line">
                {e.kill
                  ? "Todos os agentes parados."
                  : `${h} trabalhando agora \xB7 ${a.length} esperando voc\xEA \xB7 24 agentes`}
              </p>
            </section>
            <Comando presetAgent={v} />
          </div>
        ) : null}
        {o === "escritorio" ? <Escritorio goApprovals={() => m("aprovacoes")} sel={x} setSel={j} /> : null}
        {o === "dashboard" ? <Dashboard /> : null}
        {o === "crm" ? <Prospeccoes /> : null}
        {o === "financeiro" ? <Financeiro /> : null}
        {o === "seo" ? <Seo /> : null}
        {o === "equipes" ? (
          <Equipes teamId={i} setTeamId={(d) => m("equipes", d)} goApprovals={() => m("aprovacoes")} />
        ) : null}
        {o === "agentes" ? <Agentes openId={c} setOpenId={u} talkTo={f} /> : null}
        {o === "aprovacoes" ? <Aprovacoes /> : null}
        {o === "integracoes" ? <Integracoes /> : null}
      </main>
      <Avisos
        onOpen={(d) => {
          (j(d), m("escritorio"));
        }}
      />
    </div>
  );
}
