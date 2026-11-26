/** Marca um link para o GA4 saber de onde veio a visita. Mantém o texto curto: link comprido em e-mail frio pesa na entregabilidade.
 *  `conteudo` é o código do lead (utm_content): o GA4 mostra quais leads clicaram, sem trocar o endereço do site por um encurtador. */
export function utm(url: string, source: string, medium: string, campaign: string, conteudo?: string): string {
  const q = `utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}${conteudo ? `&utm_content=${conteudo}` : ""}`;
  return url + (url.includes("?") ? "&" : "?") + q;
}

/** Código opaco do lead no link (sem nome nem e-mail): "l" + id em base 36. */
export const codigoLead = (prospectId: number): string => `l${prospectId.toString(36)}`;
/** Volta do código para o id da clínica ou do psicólogo; null se não for um código válido. */
export function idDoCodigo(codigo: string): number | null {
  const m = /^l([0-9a-z]{1,8})$/.exec(codigo);
  const id = m ? parseInt(m[1]!, 36) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
