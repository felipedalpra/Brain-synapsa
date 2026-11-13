// Validador mínimo de JSON Schema (o subconjunto que o OpenAPI do CRM usa). Roda antes de qualquer escrita.
// Os erros citam só o campo e a regra, nunca o valor (pode ser nome, telefone ou e-mail).

type Schema = Record<string, any>;

const typeOk = (t: string, v: unknown): boolean => {
  switch (t) {
    case "string": return typeof v === "string";
    case "integer": return typeof v === "number" && Number.isInteger(v);
    case "number": return typeof v === "number" && Number.isFinite(v);
    case "boolean": return typeof v === "boolean";
    case "null": return v === null;
    case "array": return Array.isArray(v);
    case "object": return typeof v === "object" && v !== null && !Array.isArray(v);
    default: return true;
  }
};

const FORMATS: Record<string, RegExp> = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  "date-time": /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/,
  uri: /^https?:\/\/\S+$/i,
};

function check(s: Schema, v: unknown, path: string, errs: string[]): void {
  if (v === undefined) return;
  const types: string[] | undefined = s.type === undefined ? undefined : Array.isArray(s.type) ? s.type : [s.type];
  if (types && !types.some((t) => typeOk(t, v))) { errs.push(`${path}: tipo inválido (esperado ${types.join(" ou ")})`); return; }
  if (v === null) return;
  if (s.enum && !s.enum.includes(v)) { errs.push(`${path}: valor fora da lista permitida`); return; }
  if (s.const !== undefined && s.const !== v) errs.push(`${path}: valor fixo diferente`);
  if (typeof v === "string") {
    if (s.minLength !== undefined && v.length < s.minLength) errs.push(`${path}: curto demais (mínimo ${s.minLength})`);
    if (s.maxLength !== undefined && v.length > s.maxLength) errs.push(`${path}: longo demais (máximo ${s.maxLength})`);
    if (s.format && FORMATS[s.format] && !FORMATS[s.format]!.test(v)) errs.push(`${path}: formato ${s.format} inválido`);
  }
  if (typeof v === "number") {
    if (s.minimum !== undefined && v < s.minimum) errs.push(`${path}: abaixo do mínimo ${s.minimum}`);
    if (s.maximum !== undefined && v > s.maximum) errs.push(`${path}: acima do máximo ${s.maximum}`);
  }
  if (Array.isArray(v)) {
    if (s.minItems !== undefined && v.length < s.minItems) errs.push(`${path}: precisa de ao menos ${s.minItems} item(ns)`);
    if (s.items) v.forEach((x, i) => check(s.items, x, `${path}[${i}]`, errs));
  }
  if (typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    for (const r of s.required ?? []) if (o[r] === undefined) errs.push(`${path}.${r}: obrigatório`);
    const props: Schema = s.properties ?? {};
    for (const k of Object.keys(o)) {
      if (props[k]) check(props[k], o[k], `${path}.${k}`, errs);
      else if (s.additionalProperties === false) errs.push(`${path}.${k}: campo não existe no contrato`);
    }
    if (s.minProperties !== undefined && Object.keys(o).length < s.minProperties) errs.push(`${path}: informe ao menos ${s.minProperties} campo(s)`);
  }
  for (const a of s.allOf ?? []) {
    if (a.if && a.then) {
      const cond: string[] = [];
      check(a.if, v, path, cond);
      if (cond.length === 0 && typeof v === "object" && v) {
        for (const r of a.then.required ?? []) if ((v as any)[r] === undefined) errs.push(`${path}.${r}: obrigatório nesse caso`);
      }
    }
  }
}

/** Devolve a lista de problemas (vazia = válido). */
export function validar(schema: Schema, valor: unknown, raiz = "payload"): string[] {
  const errs: string[] = [];
  check(schema, valor, raiz, errs);
  return errs;
}
