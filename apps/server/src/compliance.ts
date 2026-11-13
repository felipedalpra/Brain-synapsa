import type { ProposalInput, Reviewer } from "./brain";
import { row } from "./db";

const EXTERNAL = new Set(["whatsapp", "email", "linkedin", "instagram"]);
const NEEDS_CONSENT = new Set(["whatsapp", "email"]);

interface Rule {
  id: string;
  test: RegExp;
  why: string;
  /** "draft": só o texto que vai ao contato. Títulos internos podem citar o assunto (ex.: "Desconto termina em 24 dias"). */
  scope: "draft" | "all";
}

/** Regras de texto. O que passa daqui ainda depende da sua aprovação: isto só barra o que nunca deveria chegar à fila. */
export const TEXT_RULES: Rule[] = [
  { id: "promessa", test: /\b(cura|curar|cure|garantid[oa]s?|garantimos|garantia de resultado|resultado garantido|sem risco|100 ?%)\b/i, why: "promete resultado a pacientes ou garantia, o que o CFP e a LGPD não admitem", scope: "all" },
  { id: "desconto", test: /\b(desconto|promo[cç][aã]o|cupom|black ?friday|de gra[cç]a por|[0-9]+ ?% off)\b/i, why: "oferece desconto ou promoção: nenhum agente faz isso, só você decide", scope: "draft" },
  { id: "clinico", test: /\b(cpf|prontu[aá]rio|diagn[oó]stico d[eao]|cid[- ]?\d|laudo)\b/i, why: "cita dado clínico de paciente, que nunca entra no Brain", scope: "all" },
  { id: "pressao", test: /\b(últim[ao]s? (vaga|chance|hora)|só hoje|corra|n[aã]o perca)\b/i, why: "usa pressão de urgência artificial", scope: "draft" },
];

/** Conformidade e LGPD, como regra de código. Barra, registra o motivo e não deixa o agente contornar. */
export const complianceReviewer: Reviewer = (p: ProposalInput, { db, now }) => {
  for (const r of TEXT_RULES) {
    const text = r.scope === "draft" ? (p.draft ?? "") : `${p.title}\n${p.draft ?? ""}`;
    if (r.test.test(text)) return { ok: false, note: r.why };
  }
  if (EXTERNAL.has(p.channel) && p.draft) {
    if (!p.contactRef) return { ok: false, note: "mensagem externa sem identificar o contato: não dá para checar consentimento nem o intervalo entre contatos" };
    if (NEEDS_CONSENT.has(p.channel)) {
      const c = row<{ revoked_at: number | null }>(db, "select revoked_at from consents where contact_ref = ? and channel = ?", p.contactRef, p.channel);
      if (!c || c.revoked_at) return { ok: false, note: `sem consentimento válido para ${p.channel} desse contato` };
    }
    const policy = row<{ value: string }>(db, "select value from policies where key = 'contact_policy'");
    const minDays = policy ? (JSON.parse(policy.value) as { min_days_between: number }).min_days_between : 3;
    const last = row<{ at: number }>(db, "select max(at) as at from contact_log where contact_ref = ?", p.contactRef);
    if (last?.at && now - last.at < minDays * 86_400_000) {
      const d = Math.ceil((minDays * 86_400_000 - (now - last.at)) / 86_400_000);
      return { ok: false, note: `esse contato recebeu mensagem há menos de ${minDays} dias; liberar em ${d} dia(s)` };
    }
  }
  return { ok: true };
};
