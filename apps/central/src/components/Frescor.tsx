// @ts-nocheck
import * as React from "react";
import { api } from "../api";

const quando = (t: number) => {
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  return h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} d`;
};

/** Mostra que os dados se atualizam sozinhos e quando cada fonte foi lida pela última vez. */
export function Frescor() {
  const [d, setD] = React.useState(null);
  React.useEffect(() => {
    let vivo = true;
    const ler = () => api.frescor().then((x) => vivo && setD(x)).catch(() => {});
    ler();
    const id = setInterval(ler, 60000);
    return () => { vivo = false; clearInterval(id); };
  }, []);
  if (!d) return null;
  const erros = d.fontes.filter((f) => f.erro);
  const titulo = d.fontes.map((f) => `${f.nome}: ${f.ultimo ? quando(f.ultimo) : "ainda não lida"}${f.erro ? ` (erro: ${f.erro})` : ""}`).join("\n");
  return (
    <span className="muted" title={titulo} style={{ fontSize: 12, whiteSpace: "nowrap" }}>
      {erros.length ? `${erros.length} fonte(s) com erro · ` : ""}
      {d.haAtraso ? "Atualizando…" : "Dados atualizados sozinhos"}
    </span>
  );
}
