// E-mail com a identidade da Synapsa. O texto do rascunho continua sendo a única fonte: o HTML sai dele na hora do envio,
// então qualquer edição que você fizer no rascunho vale também para o HTML.
const VIOLETA = "#8B5CF6";
const AZUL = "#38BDF8";
const TINTA = "#1F2937";
const SUAVE = "#6B7280";
const FONTE_TITULO = "Poppins, 'Segoe UI', Helvetica, Arial, sans-serif";
const FONTE_TEXTO = "Lato, 'Segoe UI', Helvetica, Arial, sans-serif";

export const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const URL_SO = /^https?:\/\/\S+$/;
const URL_EM = /(https?:\/\/[^\s<]+[^\s<.,;:)!?])/g;

function rotuloBotao(url: string): string {
  if (/wa\.me/i.test(url)) return "Falar com o Felipe no WhatsApp";
  if (/synapsa\.chat\/psicologos/i.test(url)) return "Ver o diretório de psicólogos";
  if (/synapsa\.com\.br\/clinicas/i.test(url)) return "Conhecer a Synapsa para clínicas";
  return "Conhecer a Synapsa";
}
const linkar = (t: string) => esc(t).replace(URL_EM, (u) => `<a href="${u}" style="color:${VIOLETA};text-decoration:underline">${u.replace(/^https?:\/\//, "")}</a>`);
const botao = (url: string) =>
  `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:6px 0 18px"><tr><td style="border-radius:999px;background:${VIOLETA}"><a href="${esc(url)}" style="display:inline-block;padding:13px 26px;font:700 15px ${FONTE_TITULO};color:#ffffff;text-decoration:none">${rotuloBotao(url)}</a></td></tr></table>`;

/** `corpo`: o texto do rascunho. `rodape`: assinatura e aviso de saída (texto). */
export function emailHtml(corpo: string, rodape: string): string {
  const blocos = corpo.trim().split(/\n{2,}/);
  const partes: string[] = [];
  const p = (t: string) => `<p style="margin:0 0 16px;font:400 16px/1.65 ${FONTE_TEXTO};color:${TINTA}">${t}</p>`;
  for (const b of blocos) {
    const linhas = b.split("\n").map((l) => l.trimEnd());
    if (linhas.every((l) => l.startsWith("- "))) {
      partes.push(`<ul style="margin:0 0 16px;padding-left:22px;font:400 16px/1.65 ${FONTE_TEXTO};color:${TINTA}">${linhas.map((l) => `<li style="margin:0 0 6px">${linkar(l.slice(2))}</li>`).join("")}</ul>`);
    } else if (linhas.length === 1 && URL_SO.test(linhas[0]!)) {
      partes.push(botao(linhas[0]!));
    } else if (linhas[0]!.startsWith("Abraço,")) {
      const [saudacao, nome, ...marca] = linhas;
      partes.push(`<p style="margin:22px 0 0;font:400 16px/1.5 ${FONTE_TEXTO};color:${TINTA}">${esc(saudacao!)}<br><strong>${esc(nome ?? "")}</strong></p>`);
      if (marca.length) partes.push(`<p style="margin:4px 0 0;font:600 14px ${FONTE_TITULO};color:${VIOLETA}">${esc(marca.join(" "))}</p>`);
    } else {
      partes.push(p(linhas.map(linkar).join("<br>")));
    }
  }
  const pre = esc(corpo.replace(/\s+/g, " ").slice(0, 110));
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#F5F3FF"><span style="display:none;max-height:0;overflow:hidden;opacity:0">${pre}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F3FF"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:${VIOLETA};background-image:linear-gradient(135deg,${VIOLETA},${AZUL});padding:26px 36px"><div style="font:700 26px ${FONTE_TITULO};color:#ffffff;letter-spacing:-0.3px">Synapsa</div><div style="font:400 13px ${FONTE_TEXTO};color:rgba(255,255,255,0.9);margin-top:2px">Onde a prática evolui.</div></td></tr>
<tr><td style="padding:34px 36px 12px">${partes.join("")}</td></tr>
<tr><td style="padding:18px 36px 26px;border-top:1px solid #EDE9FE;font:400 12px/1.6 ${FONTE_TEXTO};color:${SUAVE}">${esc(rodape).replace(/\n/g, "<br>")}</td></tr>
</table></td></tr></table></body></html>`;
}
