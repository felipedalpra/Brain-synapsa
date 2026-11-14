// Análise do Search Console: classifica páginas e buscas e monta os recados. Funções puras, sem rede e sem banco.
// Limite honesto: o Search Console só conhece as buscas em que a Synapsa APARECEU. Volume de mercado (quantas pessoas
// buscam "psicólogo em Curitiba" no Brasil) vem do Planejador de Palavras-chave do Google Ads, não daqui.

export interface Metrica { clicks: number; impressions: number; ctr: number; position: number }
export interface TopView extends Metrica { chave: string }

const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// ---------- páginas ----------
export type TipoPagina = "perfil" | "listagem" | "home" | "produto" | "legal" | "outra";
export interface PaginaInfo { tipo: TipoPagina; caminho: string; rotulo: string }

const LEGAL = /politica|termos|cookies|privacidade|forgot|login|cadastro|entrar/;
const ACENTOS: Record<string, string> = { psicologos: "psicólogos", psicologo: "psicólogo", clinicas: "clínicas", clinica: "clínica", politica: "política", calculadora: "calculadora", precos: "preços", paulo: "paulo", sao: "são", brasilia: "brasília", goiania: "goiânia", florianopolis: "florianópolis", belem: "belém", vitoria: "vitória" };
const titulo = (slug: string, acentuar = false) => slug.split("-").filter(Boolean).map((p, i) => {
  const w = acentuar ? ACENTOS[p] ?? p : p;
  return ["de", "da", "do", "dos", "das", "e", "para"].includes(p) && i > 0 ? w : w[0]!.toUpperCase() + w.slice(1);
}).join(" ");

export function classificarPagina(url: string): PaginaInfo {
  let caminho = url;
  try { caminho = new URL(url).pathname; } catch { /* já é caminho */ }
  caminho = caminho.replace(/\/+$/, "") || "/";
  const m = caminho.match(/^\/psicologo\/([^/]+)$/);
  if (m) return { tipo: "perfil", caminho, rotulo: titulo(decodeURIComponent(m[1]!)) };
  if (caminho === "/") return { tipo: "home", caminho, rotulo: "Página inicial" };
  if (/^\/psicologos(\/|$)/.test(caminho)) return { tipo: "listagem", caminho, rotulo: caminho === "/psicologos" ? "Lista de psicólogos" : `Lista: ${titulo(caminho.split("/").pop() ?? "", true)}` };
  if (LEGAL.test(caminho)) return { tipo: "legal", caminho, rotulo: titulo(caminho.split("/").pop() ?? "", true) };
  if (/\/(clinicas|software-para-psicologos|calculadora|funcionalidades|precos|planos)/.test(caminho)) return { tipo: "produto", caminho, rotulo: titulo(caminho.split("/").pop() ?? "", true) };
  return { tipo: "outra", caminho, rotulo: titulo(caminho.split("/").pop() ?? "", true) };
}

// ---------- buscas ----------
export type CategoriaBusca = "marca" | "concorrente" | "software" | "psicologo_local" | "psicologo_tema" | "psicologo_geral" | "outra";
export const ROTULO_CATEGORIA: Record<CategoriaBusca, string> = {
  marca: "Marca (Synapsa e erros de grafia)",
  concorrente: "Concorrentes",
  software: "Software e gestão para psicólogos",
  psicologo_local: "Psicólogo + cidade",
  psicologo_tema: "Psicólogo + tema (ansiedade, casal…)",
  psicologo_geral: "Psicólogo (genérica, online, perto de mim)",
  outra: "Outras",
};

export const TEMAS: Record<string, RegExp> = {
  ansiedade: /ansied|panico|estresse/, depressão: /depress|tristeza/, TDAH: /tdah|deficit de atencao/, autismo: /autis|tea\b/,
  casal: /casal|conjugal|relacionamento/, infantil: /infantil|crianca/, adolescente: /adolescen/, luto: /\bluto\b/,
  burnout: /burnout|esgotamento/, trauma: /trauma|tept/, TCC: /\btcc\b|cognitivo/, "online": /online|on-line|virtual|\bvideo/, convênio: /convenio|plano de saude|unimed/,
  "preço/social": /valor|preco|barato|gratuit|social|quanto custa/,
};
export const CAPITAIS = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Porto Alegre", "Curitiba", "Brasília", "Salvador", "Fortaleza", "Recife", "Goiânia", "Florianópolis", "Campinas", "Manaus", "Belém", "Vitória"];
const SIGLA_CIDADE: Record<string, string> = { bh: "belo horizonte", sp: "são paulo", rj: "rio de janeiro", poa: "porto alegre", bsb: "brasília", cwb: "curitiba" };
const CIDADES_N = new Map(CAPITAIS.map((c) => [sem(c), c]));

const MARCA_EXTRA = new Set(["sicpsa", "napsaicare", "psynaps", "synapsa", "sinapsa"]);
const CONCORRENTES = /consultapsi|zenklub|psicoplanner|psicomanager|amigopsi|vittude|psicologia viva|scippa|simplepractice|tangerino/;

function lev(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length]![b.length]!;
}
const NAO_E_MARCA = new Set(["sinapse", "sinapses", "sinapsis", "synapse", "synapses"]); // palavras de verdade (neurociência), não erro de grafia
export const ehMarca = (q: string): boolean => sem(q).split(/\s+/).some((t) => t.length >= 5 && !NAO_E_MARCA.has(t) && (MARCA_EXTRA.has(t) || lev(t, "synapsa") <= (t.length >= 6 && "sp".includes(t[0]!) ? 3 : 2)));

export interface BuscaInfo { categoria: CategoriaBusca; cidade?: string; tema?: string }
export function classificarBusca(busca: string): BuscaInfo {
  const q = sem(busca);
  if (ehMarca(busca)) return { categoria: "marca" };
  if (CONCORRENTES.test(q)) return { categoria: "concorrente" };
  const psi = /psicolog|terapeuta|terapia|tratamento|atendimento|consulta/.test(q);
  const softwareTipo = sem(q).split(/\s+/).some((t) => t.length >= 5 && lev(t, "software") <= 2);
  const tema = Object.entries(TEMAS).find(([, re]) => re.test(q))?.[0];
  if (softwareTipo && !psi) return { categoria: "software" };
  if (/(software|sistema|programa|plataforma|app|aplicativo|prontuario|agenda|gestao|gerenciar|controle financeiro|planejamento financeiro|clinica de psicologia)/.test(q) && (psi || /clinica/.test(q))) return { categoria: "software" };
  if (!psi) return { categoria: "outra" };
  // cidade: nome conhecido, sigla, ou o que sobra depois de "psicólogo (em|de|no|na)"
  let cidade: string | undefined;
  for (const [n, c] of CIDADES_N) if (new RegExp(`\\b${n}\\b`).test(q)) cidade = c;
  if (!cidade) for (const [s, c] of Object.entries(SIGLA_CIDADE)) if (new RegExp(`\\b${s}\\b`).test(q)) cidade = CIDADES_N.get(c) ?? titulo(c.replace(/ /g, "-"));
  if (!cidade) {
    const resto = q.replace(/psic[a-z]*|terapeuta[s]?|terapia/g, " ").replace(/\b(em|de|do|da|no|na|para|pra|com|e|a|o|perto|mim|proximo|online|melhor|melhores|bom|boa|tratamento|atendimento|consulta)\b/g, " ")
      .replace(new RegExp(`\\w*(?:${Object.values(TEMAS).map((r) => r.source).join("|")})\\w*`, "g"), " ").replace(/\s+/g, " ").trim();
    if (resto && !/^(associados|clinica|consultorio|centro|instituto|especialista|especializado|especializada|tratamento|perto|proximo)$/.test(resto) && resto.split(" ").length <= 3 && !Object.values(TEMAS).some((r) => r.test(resto))) cidade = titulo(resto.replace(/ /g, "-"));
  }
  if (cidade) return { categoria: "psicologo_local", cidade, tema };
  if (tema && tema !== "online") return { categoria: "psicologo_tema", tema };
  return { categoria: "psicologo_geral", tema };
}

// ---------- agregações ----------
const somar = (a: Metrica[]): Metrica => {
  const clicks = a.reduce((t, x) => t + x.clicks, 0), impressions = a.reduce((t, x) => t + x.impressions, 0);
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: impressions ? a.reduce((t, x) => t + x.position * x.impressions, 0) / impressions : 0 };
};

export interface Categoria extends Metrica { categoria: CategoriaBusca; rotulo: string; buscas: number }
export function porCategoria(qs: TopView[]): Categoria[] {
  const g = new Map<CategoriaBusca, TopView[]>();
  for (const q of qs) { const c = classificarBusca(q.chave).categoria; g.set(c, [...(g.get(c) ?? []), q]); }
  return [...g].map(([categoria, l]) => ({ categoria, rotulo: ROTULO_CATEGORIA[categoria], buscas: l.length, ...somar(l) })).sort((a, b) => b.impressions - a.impressions);
}

export interface Cobertura extends Metrica { nome: string; buscas: number; melhor: string | null }
/** Cidades (as observadas + as maiores capitais) e temas, com a presença atual da Synapsa. Zero impressão = lacuna. */
export function cobertura(qs: TopView[]): { cidades: Cobertura[]; temas: Cobertura[] } {
  const cid = new Map<string, TopView[]>(), tem = new Map<string, TopView[]>();
  for (const c of CAPITAIS) cid.set(c, []);
  for (const t of Object.keys(TEMAS)) tem.set(t, []);
  for (const q of qs) {
    const i = classificarBusca(q.chave);
    if (i.cidade) cid.set(i.cidade, [...(cid.get(i.cidade) ?? []), q]);
    if (i.tema && i.categoria !== "marca") tem.set(i.tema, [...(tem.get(i.tema) ?? []), q]);
  }
  const monta = (m: Map<string, TopView[]>): Cobertura[] => [...m].map(([nome, l]) => ({ nome, buscas: l.length, melhor: l.length ? [...l].sort((a, b) => a.position - b.position)[0]!.chave : null, ...somar(l) }))
    .sort((a, b) => b.impressions - a.impressions || b.buscas - a.buscas || a.nome.localeCompare(b.nome));
  return { cidades: monta(cid), temas: monta(tem) };
}

export interface Oportunidade extends TopView { acao: string; categoria: CategoriaBusca; pagina?: string }
/** Busca com impressão, pouco clique e posição que dá para subir. Limiares pequenos de propósito: o volume ainda é baixo. */
export function oportunidades(qs: TopView[], paginaDaBusca: Map<string, string> = new Map()): Oportunidade[] {
  return qs
    .filter((q) => classificarBusca(q.chave).categoria !== "marca" && q.impressions >= 3 && q.ctr < 0.05 && q.position >= 3)
    .map((q): Oportunidade => {
      const info = classificarBusca(q.chave);
      const pagina = paginaDaBusca.get(q.chave);
      const onde = pagina ? ` (hoje aparece com ${pagina.replace(/^https?:\/\/(www\.)?/, "")})` : "";
      let acao: string;
      if (q.position <= 10) acao = `Primeira página, mas sem clique${onde}: reescreva título e descrição para pedir o clique.`;
      else if (q.position <= 20) acao = `Segunda página${onde}: reforce o conteúdo da página e ponha links internos apontando para ela com essa busca no texto.`;
      else if (pagina && classificarPagina(pagina).tipo === "listagem" && classificarPagina(pagina).caminho !== "/psicologos") acao = `A página da lista (${classificarPagina(pagina).caminho}) já existe, mas está na posição ${Math.round(q.position)}: reforce o texto da página, os perfis listados e os links internos para ela.`;
      else if (info.categoria === "psicologo_local") acao = `Fora do alcance${onde}: falta uma página que responda a essa cidade (lista de psicólogos de ${info.cidade ?? "lá"} ou perfis com a cidade no título).`;
      else acao = `Longe do topo${onde}: precisa de página própria para esse assunto.`;
      return { ...q, acao, categoria: info.categoria, pagina };
    })
    .sort((a, b) => b.impressions * (b.position <= 20 ? 2 : 1) - a.impressions * (a.position <= 20 ? 2 : 1) || b.impressions - a.impressions)
    .slice(0, 15);
}

export interface PerfilView extends Metrica { url: string; nome: string; anterior: { clicks: number; impressions: number }; serie: number[]; buscas: { busca: string; clicks: number; impressions: number; position: number }[]; status: "clique" | "visto" | "sem_impressao" }
export interface ResumoPerfis { total: number; comImpressao: number; comClique: number; semImpressao: PerfilView[]; esperados: number | null }

// ---------- recados ----------
export interface EntradaRecados {
  rotuloSite: string; tipoSite: "site" | "diretorio";
  atual: Metrica; marca: Metrica; naoMarca: Metrica;
  categorias: Categoria[]; ops: Oportunidade[];
  cobertura: { cidades: Cobertura[]; temas: Cobertura[] };
  perfis?: ResumoPerfis;
}
const n = (x: number) => Math.round(x).toLocaleString("pt-BR");
export function recados(e: EntradaRecados): string[] {
  const r: string[] = [];
  if (e.atual.impressions === 0) return ["Ainda sem impressões nesse período."];
  const visiveis = e.marca.clicks + e.naoMarca.clicks;
  const shareMarca = visiveis ? e.marca.clicks / visiveis : 0;
  if (e.tipoSite === "site") {
    if (visiveis >= 5) r.push(`Dos ${n(e.atual.clicks)} cliques, o Google detalha a busca de ${n(visiveis)}; ${Math.round(shareMarca * 100)}% deles (${n(e.marca.clicks)}) vêm de gente que já procurou "Synapsa" pelo nome. Quem busca por necessidade (software, gestão, programa para psicólogos) trouxe ${n(e.naoMarca.clicks)} cliques em ${n(e.naoMarca.impressions)} impressões. Para crescer, o ganho está aí.`);
    const soft = e.categorias.find((c) => c.categoria === "software");
    if (soft && soft.impressions >= 5) r.push(`Buscas de software para psicólogos: ${n(soft.impressions)} impressões, posição média ${soft.position.toFixed(1)} e ${n(soft.clicks)} cliques. É o público que compra; vale uma página por intenção ("software para psicólogos", "gestão financeira para psicólogos", "prontuário").`);
  } else if (e.perfis) {
    const p = e.perfis;
    r.push(`${n(p.comImpressao)} perfis apareceram no Google, ${n(p.comClique)} receberam clique${p.semImpressao.length ? ` e ${n(p.semImpressao.length)} ainda não apareceram em nenhuma busca` : ""}.`);
    if (e.naoMarca.impressions) r.push(`Buscas por psicólogo (sem contar a marca): ${n(e.naoMarca.impressions)} impressões, posição média ${e.naoMarca.position.toFixed(0)}. Acima da posição 10 quase ninguém clica; o diretório ainda está fora da disputa por "psicólogo em <cidade>".`);
  }
  const lacunas = e.cobertura.cidades.filter((c) => c.impressions === 0).slice(0, 5).map((c) => c.nome);
  if (e.tipoSite === "diretorio" && lacunas.length) r.push(`Capitais sem nenhuma presença nas buscas: ${lacunas.join(", ")}. Priorize as cidades onde você já tem psicólogos cadastrados.`);
  const top = e.ops[0];
  if (top) r.push(`Maior oportunidade: "${top.chave}" (${n(top.impressions)} impressões, posição ${top.position.toFixed(0)}). ${top.acao}`);
  const grafias = e.categorias.find((c) => c.categoria === "marca");
  if (grafias && grafias.buscas >= 4) r.push(`A marca é buscada de ${n(grafias.buscas)} jeitos diferentes (sinapsa, psynaps, sanapsy…). Vale garantir "Synapsa" no título e no texto das páginas principais e ter um perfil no Google Meu Negócio.`);
  return r;
}
