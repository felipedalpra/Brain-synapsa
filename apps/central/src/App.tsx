// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import { JarvisBot } from "./components/JarvisBot";
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
  Images,
  Linkedin,
  Megaphone,
} from "lucide-react";
import { Q, Ze } from "./shared-inline";
import { useBrain } from "./store";
import { Orb } from "./components/Orb";
import { Comando } from "./components/Command";
import { Escritorio } from "./components/Escritorio";
import { Dashboard } from "./components/Dashboard";
import { Midia } from "./components/Midia";
import { Prospeccoes } from "./components/Crm";
import { Financeiro } from "./components/Financeiro";
import { Seo } from "./components/Seo";
import { Equipes } from "./components/Equipes";
import { Agentes } from "./components/Agentes";
import { Aprovacoes } from "./components/Aprovacoes";
import { Integracoes } from "./components/Integracoes";
import { Avisos } from "./components/Avisos";
import { Instagram } from "./components/Instagram";
import { LinkedIn } from "./components/LinkedIn";

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
    id: "midia",
    label: "Anúncios e Instagram",
    icon: Megaphone,
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
    id: "instagram",
    label: "Instagram",
    icon: Images,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
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
// Abas agrupadas por função. Os ids das telas (e os links #financeiro, #instagram…) continuam os mesmos.
export const GRUPOS = [
  { id: "g-comando", label: "Comando", icon: Radio, filhos: ["comando", "escritorio", "aprovacoes"] },
  { id: "g-negocio", label: "Negócio", icon: LayoutDashboard, filhos: ["dashboard", "crm", "financeiro"] },
  { id: "g-marketing", label: "Marketing", icon: Images, filhos: ["seo", "midia", "instagram", "linkedin"] },
  { id: "g-ia", label: "Agentes de IA", icon: Bot, filhos: ["equipes", "agentes"] },
  { id: "g-config", label: "Integrações", icon: Plug, filhos: ["integracoes"] },
];
export const grupoDe = (tab) => GRUPOS.find((g) => g.filhos.includes(tab)) ?? GRUPOS[0];
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
  const ultimo = React.useRef({});
  const m = (d, p) => {
      ultimo.current[grupoDe(d).id] = d;
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
          <JarvisBot size={34} compacto decorativo className="brand-bot" />
          <div>
            <h1>Central Synapsa</h1>
            <p>{e.mode === "live" ? "Ao vivo \xB7 Brain neste computador" : "Dados de demonstra\xE7\xE3o"}</p>
          </div>
        </div>
        <nav className="nav" aria-label="Áreas">
          {GRUPOS.map((g) => {
            const S = g.icon;
            const ativo = grupoDe(o).id === g.id;
            const pend = g.filhos.includes("aprovacoes") && a.length ? a.length : 0;
            return (
              <button
                key={g.id}
                type="button"
                title={g.label}
                className={`nav-btn ${ativo ? "on" : ""}`}
                aria-current={ativo ? "page" : void 0}
                onClick={() => m(ultimo.current[g.id] ?? g.filhos[0])}
              >
                <S size={17} aria-hidden />
                <span>{g.label}</span>
                {pend ? <em className="badge">{pend}</em> : null}
              </button>
            );
          })}
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
      {grupoDe(o).filhos.length > 1 ? (
        <nav className="nav-sub" aria-label={`Telas de ${grupoDe(o).label}`}>
          {grupoDe(o).filhos.map((id) => {
            const t = Du.find((x) => x.id === id);
            const S = t.icon;
            return (
              <button key={id} type="button" className={o === id ? "on" : ""} aria-current={o === id ? "page" : void 0} onClick={() => m(id)}>
                <S size={15} aria-hidden />
                <span>{t.label}</span>
                {id === "aprovacoes" && a.length ? <em className="badge">{a.length}</em> : null}
              </button>
            );
          })}
        </nav>
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
        {o === "midia" ? <Midia /> : null}
        {o === "crm" ? <Prospeccoes /> : null}
        {o === "financeiro" ? <Financeiro /> : null}
        {o === "seo" ? <Seo /> : null}
        {o === "instagram" ? <Instagram /> : null}
        {o === "linkedin" ? <LinkedIn /> : null}
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
