export interface Envio {
  tipo: "email" | "instagram";
  para?: string;
  assunto?: string;
  imagemUrl?: string;
  /** "prospeccao": sai pelo subdomínio de prospecção, com limite diário próprio. */
  remetente?: "prospeccao";
}

export const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export function envioOf(payload: string | null | undefined): Envio | null {
  try {
    const e = (JSON.parse(payload ?? "{}") as { envio?: Envio }).envio;
    return e && (e.tipo === "email" || e.tipo === "instagram") ? e : null;
  } catch {
    return null;
  }
}
