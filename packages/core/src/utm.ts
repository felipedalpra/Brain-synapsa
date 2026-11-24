/** Marca um link para o GA4 saber de onde veio a visita. Mantém o texto curto: link comprido em e-mail frio pesa na entregabilidade. */
export function utm(url: string, source: string, medium: string, campaign: string): string {
  const q = `utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}`;
  return url + (url.includes("?") ? "&" : "?") + q;
}
