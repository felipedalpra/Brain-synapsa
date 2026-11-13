import { useEffect, useMemo, useState } from "react";
import { Bot, ClipboardCheck, LayoutDashboard, Plug, Power, Radio } from "lucide-react";
import { Agentes } from "./components/Agentes";
import { Aprovacoes } from "./components/Aprovacoes";
import { Command } from "./components/Command";
import { Hoje } from "./components/Hoje";
import { Integracoes } from "./components/Integracoes";
import { Orb } from "./components/Orb";
import { AGENTS } from "./data/roster";
import { useBrain } from "./store";

type Tab = "comando" | "hoje" | "agentes" | "aprovacoes" | "integracoes";
const TABS: { id: Tab; label: string; icon: typeof Bot }[] = [
  { id: "comando", label: "Comando", icon: Radio },
  { id: "hoje", label: "Hoje", icon: LayoutDashboard },
  { id: "agentes", label: "Agentes", icon: Bot },
  { id: "aprovacoes", label: "Aprovações", icon: ClipboardCheck },
  { id: "integracoes", label: "Integrações", icon: Plug },
];

const fromHash = (): Tab => (TABS.find((t) => t.id === window.location.hash.slice(1))?.id ?? "comando");

export function App() {
  const { state, pending, setKill, dismissError } = useBrain();
  const [tab, setTab] = useState<Tab>(fromHash);
  const [openId, setOpenId] = useState<string | null>(null);
  const [preset, setPreset] = useState<string | null>(null);

  useEffect(() => {
    const on = () => setTab(fromHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  const go = (t: Tab) => {
    setTab(t);
    try {
      window.history.replaceState(null, "", `#${t}`);
    } catch {
      /* ignora */
    }
  };

  const pendingBy = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of pending) m[p.agentId] = (m[p.agentId] ?? 0) + 1;
    return m;
  }, [pending]);

  const working = AGENTS.filter((a) => state.runtime[a.id]?.status === "trabalhando" && !state.kill).length;
  const talkTo = (name: string) => {
    setOpenId(null);
    setPreset(name);
    go("comando");
  };

  return (
    <div className={`app ${state.kill ? "is-kill" : ""}`}>
      <header className="top">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div>
            <h1>Central Synapsa</h1>
            <p>{state.mode === "live" ? "Ao vivo · Brain neste computador" : "Dados de demonstração"}</p>
          </div>
        </div>
        <nav className="nav" aria-label="Seções">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={`nav-btn ${tab === id ? "on" : ""}`} aria-current={tab === id ? "page" : undefined} onClick={() => go(id)}>
              <Icon size={17} aria-hidden />
              <span>{label}</span>
              {id === "aprovacoes" && pending.length ? <em className="badge">{pending.length}</em> : null}
            </button>
          ))}
        </nav>
        <button type="button" className={`kill ${state.kill ? "on" : ""}`} onClick={() => setKill(!state.kill)} aria-pressed={state.kill} title="Para todos os agentes e bloqueia aprovações">
          <Power size={16} aria-hidden />
          <span>{state.kill ? "Retomar agentes" : "Parar tudo"}</span>
        </button>
      </header>

      {state.error ? (
        <p className="banner" role="alert">
          {state.error} <button type="button" className="link" onClick={dismissError}>Fechar</button>
        </p>
      ) : null}

      <main>
        {tab === "comando" ? (
          <div className="command">
            <section className="stage" aria-label="Agentes ao redor do núcleo">
              <Orb runtime={state.runtime} pendingBy={pendingBy} kill={state.kill} thinking={state.thinking} selected={openId} onSelect={(id) => { setOpenId(id); go("agentes"); }} />
              <p className="stage-line">
                {state.kill ? "Todos os agentes parados." : `${working} trabalhando agora · ${pending.length} esperando você · 24 agentes`}
              </p>
            </section>
            <Command presetAgent={preset} />
          </div>
        ) : null}
        {tab === "hoje" ? <Hoje /> : null}
        {tab === "agentes" ? <Agentes openId={openId} setOpenId={setOpenId} talkTo={talkTo} /> : null}
        {tab === "aprovacoes" ? <Aprovacoes /> : null}
        {tab === "integracoes" ? <Integracoes /> : null}
      </main>
    </div>
  );
}
