// @ts-nocheck
// Central de lançamentos do financeiro: venda de cliente novo (já entra no MRR e no caixa), dinheiro que entrou, despesa e conta avulsa.
import * as React from "react";
import { X } from "lucide-react";
import { _ } from "../lib";
import { api } from "../api";
import { NovaContaForm } from "./Financeiro";

const num2 = (s) => {
  const t = String(s ?? "").trim();
  if (!t) return 0;
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  return Number.isFinite(n) ? n : 0;
};
const r2 = (n) => Math.round(n * 100) / 100;
const dm = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const maisDias = (d, n) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

function dividir(total, n, hoje) {
  const base = Math.floor((total / n) * 100) / 100;
  return Array.from({ length: n }, (_x, i) => ({
    valor: String(i === n - 1 ? r2(total - base * (n - 1)) : base).replace(".", ","),
    pago: i === 0,
    data: i === 0 ? hoje : maisDias(hoje, 14 * i),
  }));
}

function VendaForm({ d, rodar, onFeito }) {
  const hoje = d.hoje;
  const [cliente, setCliente] = React.useState("");
  const [inicio, setInicio] = React.useState(hoje);
  const [recorrente, setRecorrente] = React.useState(true);
  const [valor, setValor] = React.useState("");
  const [setup, setSetup] = React.useState("");
  const [setupPago, setSetupPago] = React.useState(true);
  const [modo, setModo] = React.useState("pago"); // pago | pendente | parcelado
  const [qtd, setQtd] = React.useState(2);
  const [parcelas, setParcelas] = React.useState(() => dividir(0, 2, hoje));
  const [meses, setMeses] = React.useState("11");
  const [enviando, setEnviando] = React.useState(false);

  const total = num2(valor);
  const reparte = (n, t) => setParcelas(dividir(t, n, inicio));
  const somaParc = r2(parcelas.reduce((s, p) => s + num2(p.valor), 0));
  const fecha = modo !== "parcelado" || Math.abs(somaParc - total) < 0.01;

  const parcelasEnvio = () => {
    if (modo === "pago") return [{ valor: total, pagoEm: inicio }];
    if (modo === "pendente") return [{ valor: total, pagoEm: null, vencimento: inicio }];
    return parcelas.map((p) => (p.pago ? { valor: num2(p.valor), pagoEm: p.data } : { valor: num2(p.valor), pagoEm: null, vencimento: p.data }));
  };

  const recebidoAgora = parcelasEnvio().filter((p) => p.pagoEm).reduce((s, p) => s + p.valor, 0) + (num2(setup) > 0 && setupPago ? num2(setup) : 0);
  const aReceber = parcelasEnvio().filter((p) => !p.pagoEm);

  const enviar = async (ev) => {
    ev.preventDefault();
    if (!fecha || enviando) return;
    setEnviando(true);
    const ok = await rodar(
      () =>
        api.finVenda({
          cliente,
          valorMensal: total,
          inicio,
          recorrente,
          mesesPrevistos: recorrente ? Math.max(0, Math.min(59, Math.round(num2(meses)))) : 0,
          taxaSetup: num2(setup) || undefined,
          taxaSetupPaga: setupPago,
          parcelas: parcelasEnvio(),
        }),
      "Venda lançada",
    );
    setEnviando(false);
    if (ok !== false) onFeito();
  };

  return (
    <form className="lancar-form" onSubmit={enviar} aria-label="Nova venda">
      <div className="conta-grid">
        <label>
          Cliente
          <input value={cliente} onChange={(e) => setCliente(e.target.value)} required maxLength={80} placeholder="Ex.: Clínica Bem Estar" />
        </label>
        <label>
          Data da venda
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
        </label>
        <label>
          {recorrente ? "Mensalidade (R$)" : "Valor do serviço (R$)"}
          <input
            inputMode="decimal"
            value={valor}
            required
            placeholder="230,00"
            onChange={(e) => {
              setValor(e.target.value);
              if (modo === "parcelado") reparte(qtd, num2(e.target.value));
            }}
          />
        </label>
        <label>
          Taxa de implementação (R$)
          <input inputMode="decimal" value={setup} onChange={(e) => setSetup(e.target.value)} placeholder="Deixe vazio se não houver" />
        </label>
      </div>

      <div className="lancar-linha" role="group" aria-label="Tipo de venda">
        <button type="button" className={`chip ${recorrente ? "chip-on" : ""}`} aria-pressed={recorrente} onClick={() => setRecorrente(true)}>
          Mensalidade (entra no MRR)
        </button>
        <button type="button" className={`chip ${!recorrente ? "chip-on" : ""}`} aria-pressed={!recorrente} onClick={() => setRecorrente(false)}>
          Venda única
        </button>
        {num2(setup) > 0 ? (
          <label className="chk">
            <input type="checkbox" checked={setupPago} onChange={(e) => setSetupPago(e.target.checked)} /> Implementação já recebida
          </label>
        ) : null}
      </div>

      <fieldset className="lancar-set">
        <legend>Como foi pago o {recorrente ? "primeiro mês" : "valor"}?</legend>
        <div className="lancar-linha">
          {[
            ["pago", "Pagou tudo"],
            ["pendente", "Ainda não pagou"],
            ["parcelado", "Parcelado"],
          ].map(([k, rot]) => (
            <button
              key={k}
              type="button"
              className={`chip ${modo === k ? "chip-on" : ""}`}
              aria-pressed={modo === k}
              onClick={() => {
                setModo(k);
                if (k === "parcelado") reparte(qtd, total);
              }}
            >
              {rot}
            </button>
          ))}
        </div>
        {modo === "parcelado" ? (
          <div className="lancar-parcelas">
            <label className="lancar-qtd">
              Parcelas
              <input
                type="number"
                min={2}
                max={12}
                value={qtd}
                onChange={(e) => {
                  const n = Math.max(2, Math.min(12, Number(e.target.value) || 2));
                  setQtd(n);
                  reparte(n, total);
                }}
              />
            </label>
            {parcelas.map((p, i) => (
              <div className="lancar-parcela" key={i}>
                <b>{i + 1}ª</b>
                <input
                  aria-label={`Valor da parcela ${i + 1}`}
                  inputMode="decimal"
                  value={p.valor}
                  onChange={(e) => setParcelas((l) => l.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)))}
                />
                <select aria-label={`Situação da parcela ${i + 1}`} value={p.pago ? "1" : "0"} onChange={(e) => setParcelas((l) => l.map((x, j) => (j === i ? { ...x, pago: e.target.value === "1" } : x)))}>
                  <option value="1">Já recebi em</option>
                  <option value="0">Vou receber em</option>
                </select>
                <input type="date" aria-label={`Data da parcela ${i + 1}`} value={p.data} onChange={(e) => setParcelas((l) => l.map((x, j) => (j === i ? { ...x, data: e.target.value } : x)))} />
              </div>
            ))}
            {!fecha ? (
              <p className="banner" role="alert">
                As parcelas somam {_(somaParc)}, mas o valor é {_(total)}. Ajuste para fechar.
              </p>
            ) : null}
          </div>
        ) : null}
        {modo === "pendente" ? <p className="muted">Fica como conta a receber na data da venda. Marque como recebida quando cair.</p> : null}
      </fieldset>

      {recorrente ? (
        <label className="lancar-meses">
          Prever as próximas mensalidades
          <input type="number" min={0} max={59} value={meses} onChange={(e) => setMeses(e.target.value)} />
          <small className="muted">meses, sempre no dia {inicio.slice(8)}. Alimenta o fluxo de caixa futuro.</small>
        </label>
      ) : null}

      {total > 0 ? (
        <div className="lancar-resumo" aria-live="polite">
          <b>Ao salvar:</b>
          <ul>
            {recorrente ? <li>{cliente || "O cliente"} entra no MRR com {_(total)}/mês.</li> : null}
            {recebidoAgora > 0 ? <li>{_(recebidoAgora)} entram como recebidos (caixa e resultado).</li> : null}
            {aReceber.map((p, i) => (
              <li key={i}>
                {_(p.valor)} ficam a receber em {dm(p.vencimento)}.
              </li>
            ))}
            {num2(setup) > 0 && !setupPago ? <li>Implementação de {_(num2(setup))} fica a receber em {dm(inicio)}.</li> : null}
            {recorrente && Math.round(num2(meses)) > 0 ? <li>{Math.round(num2(meses))} mensalidades de {_(total)} previstas, a partir de {dm(maisDias(inicio, 30))} aprox.</li> : null}
          </ul>
        </div>
      ) : null}

      <div className="conta-acoes">
        <button type="submit" className="btn btn-go" disabled={!cliente.trim() || total <= 0 || !fecha || enviando}>
          {enviando ? "Salvando…" : "Lançar venda"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onFeito}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function RecebiForm({ d, rodar, onFeito }) {
  const [desc, setDesc] = React.useState("");
  const [valor, setValor] = React.useState("");
  const [data, setData] = React.useState(d.hoje);
  const [cat, setCat] = React.useState(d.categoriasReceita[0]);
  const enviar = async (ev) => {
    ev.preventDefault();
    const ok = await rodar(() => api.finLancamento({ data, descricao: desc, valor: Math.abs(num2(valor)), categoria: cat }), "Entrada registrada");
    if (ok !== false) onFeito();
  };
  return (
    <form className="lancar-form" onSubmit={enviar} aria-label="Dinheiro que entrou">
      <p className="muted">Dinheiro que já caiu e não precisa de cobrança: Pix avulso, projeto pontual, reembolso. Entra no caixa e no resultado.</p>
      <div className="conta-grid">
        <label>
          De quem / pelo quê
          <input value={desc} onChange={(e) => setDesc(e.target.value)} required maxLength={200} />
        </label>
        <label>
          Valor (R$)
          <input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} required placeholder="0,00" />
        </label>
        <label>
          Data
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
        </label>
        <label>
          Categoria
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            {d.categoriasReceita.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="conta-acoes">
        <button type="submit" className="btn btn-go" disabled={!desc.trim() || num2(valor) <= 0}>
          Registrar entrada
        </button>
        <button type="button" className="btn btn-ghost" onClick={onFeito}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function DespesaForm({ d, rodar, onFeito }) {
  const [desc, setDesc] = React.useState("");
  const [valor, setValor] = React.useState("");
  const [data, setData] = React.useState(d.hoje);
  const [cat, setCat] = React.useState(d.categoriasDespesa[0]);
  const [pago, setPago] = React.useState(true);
  const [repetir, setRepetir] = React.useState(false);
  const [meses, setMeses] = React.useState("12");
  const enviar = async (ev) => {
    ev.preventDefault();
    const ok = await rodar(
      () =>
        api.finConta({
          tipo: "pagar",
          descricao: desc,
          categoria: cat,
          vencimento: data,
          valor: Math.abs(num2(valor)),
          pagoEm: pago ? data : null,
          recorrenciaMeses: repetir ? Math.max(2, Math.min(60, Math.round(num2(meses)))) : 1,
        }),
      "Despesa lançada",
    );
    if (ok !== false) onFeito();
  };
  return (
    <form className="lancar-form" onSubmit={enviar} aria-label="Despesa">
      <div className="conta-grid">
        <label>
          Descrição
          <input value={desc} onChange={(e) => setDesc(e.target.value)} required maxLength={200} placeholder="Ex.: Cloudflare, contador" />
        </label>
        <label>
          Valor (R$)
          <input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} required placeholder="0,00" />
        </label>
        <label>
          {pago ? "Data do pagamento" : "Vencimento"}
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
        </label>
        <label>
          Categoria
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            {d.categoriasDespesa.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="lancar-linha">
        <label className="chk">
          <input type="checkbox" checked={pago} onChange={(e) => setPago(e.target.checked)} /> Já paguei
        </label>
        <label className="chk">
          <input type="checkbox" checked={repetir} onChange={(e) => setRepetir(e.target.checked)} /> Repete todo mês
        </label>
        {repetir ? (
          <label className="lancar-meses-inline">
            por <input type="number" min={2} max={60} value={meses} onChange={(e) => setMeses(e.target.value)} /> meses
          </label>
        ) : null}
      </div>
      <div className="conta-acoes">
        <button type="submit" className="btn btn-go" disabled={!desc.trim() || num2(valor) <= 0}>
          Lançar despesa
        </button>
        <button type="button" className="btn btn-ghost" onClick={onFeito}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function FinLancar({ d, aberto, onFechar, rodar }) {
  const [aba, setAba] = React.useState("venda");
  if (!aberto) return null;
  const rodarFecha = async (fn, msg) => {
    return (await rodar(fn, msg)) !== false;
  };
  return (
    <section className="panel conta-novo lancar" aria-labelledby="lancar-t">
      <div className="panel-head">
        <h2 id="lancar-t">Lançar</h2>
        <button type="button" className="btn btn-ghost" aria-label="Fechar" onClick={onFechar}>
          <X size={15} aria-hidden />
        </button>
      </div>
      <div className="seg lancar-abas" role="tablist" aria-label="O que lançar">
        {[
          ["venda", "Venda / cliente novo"],
          ["recebi", "Recebi um valor"],
          ["despesa", "Despesa"],
          ["conta", "Conta a pagar ou receber"],
        ].map(([k, rot]) => (
          <button key={k} type="button" role="tab" aria-selected={aba === k} className={aba === k ? "on" : ""} onClick={() => setAba(k)}>
            {rot}
          </button>
        ))}
      </div>
      {aba === "venda" ? <VendaForm d={d} rodar={rodarFecha} onFeito={onFechar} /> : null}
      {aba === "recebi" ? <RecebiForm d={d} rodar={rodarFecha} onFeito={onFechar} /> : null}
      {aba === "despesa" ? <DespesaForm d={d} rodar={rodarFecha} onFeito={onFechar} /> : null}
      {aba === "conta" ? <NovaContaForm d={d} aberto onFechar={onFechar} onSalvar={async (h) => { await rodarFecha(() => api.finConta(h), "Conta cadastrada"); onFechar(); }} /> : null}
    </section>
  );
}
