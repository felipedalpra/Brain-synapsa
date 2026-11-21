import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { seedKnownFacts } from "../src/seed";
import { dataIso, extrairId, interpretar, painel, sincronizar, statusDe, tipoDe } from "../src/instinct";

const T0 = Date.parse("2026-11-20T15:00:00Z");
const mk = () => { const b = new Brain(openDb(":memory:"), () => T0); seedKnownFacts(b); return b; };

describe("instinct (placar da prospecção)", () => {
  it("entende datas, tipos e status como o Instinct costuma escrever", () => {
    expect(dataIso("19/11/2026")).toBe("2026-11-19");
    expect(dataIso("2026-11-19")).toBe("2026-11-19");
    expect(dataIso("abc")).toBeNull();
    expect(tipoDe("Clínicas")).toBe("clinica");
    expect(tipoDe("Influenciadora")).toBe("influenciadora");
    expect(tipoDe("outro")).toBeNull();
    expect(statusDe("Reunião marcada")).toBe("reuniao");
    expect(statusDe("virou assinante")).toBe("assinante");
    expect(statusDe("conta gratuita")).toBe("conta gratuita");
    expect(statusDe("Sem interesse")).toBe("sem interesse");
    expect(extrairId("https://docs.google.com/spreadsheets/d/1qS7vSVuU-5mLeo9E5hqfvIipZ_T3N1X0D0EOXFEKIeo/edit")).toBe("1qS7vSVuU-5mLeo9E5hqfvIipZ_T3N1X0D0EOXFEKIeo");
  });
  it("ignora linha vazia ou incompleta e junta lead repetido pelo WhatsApp", () => {
    const r = interpretar(
      [["19/11/2026", "Clínicas", "20", "6", "2", "1", "0"], ["", "", "", "", "", "", ""], ["sem data", "Clínicas", "1"]],
      [["Clínica A", "Clínica", "SP", "(11) 98888-7777", "18/11/2026", "abordado", "18/11/2026"], ["Clínica A", "Clínica", "SP", "+55 11 98888-7777", "18/11/2026", "reunião", "19/11/2026"], ["Sem nome", "", "", "", "", "", ""]],
    );
    expect(r.dias).toHaveLength(1);
    expect(r.leads).toHaveLength(1);
    expect(r.leads[0]!.status).toBe("reuniao");
    expect(r.ignoradas).toBe(2);
  });
  it("lê a planilha pela conta de serviço e monta o funil com as taxas", async () => {
    const b = mk();
    const chamadas: string[] = [];
    const f = (async (url: string) => {
      const u = String(url);
      chamadas.push(u);
      if (u.includes("oauth2")) return new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }));
      return new Response(JSON.stringify({ valueRanges: [
        { values: [["19/11/2026", "Clínicas", "20", "6", "2", "1", "0"], ["19/11/2026", "Influenciadoras", "10", "2", "0", "0", "1"]] },
        { values: [["Clínica A", "Clínica", "SP", "11988887777", "18/11/2026", "reunião", "19/11/2026"], ["Bia", "Influenciadora", "RJ", "21999990000", "18/11/2026", "assinante", "19/11/2026"]] },
      ] }));
    }) as unknown as typeof fetch;
    // chave fake só para o JWT (nunca usada de verdade: o fetch é simulado)
    const { generateKeyPairSync } = await import("node:crypto");
    const pem = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const env = { GSC_SERVICE_ACCOUNT: JSON.stringify({ client_email: "brain@x.iam.gserviceaccount.com", private_key: pem }) };
    expect(await sincronizar(b, env, f)).toMatch(/2 linha\(s\) de dia e 2 lead/);
    const p = painel(b, env);
    expect(p.ultimos30.total.abordados).toBe(30);
    expect(p.ultimos30.clinicas.taxaResposta).toBe(30);
    expect(p.ultimos30.total.taxaConversao).toBeCloseTo(6.7, 1);
    expect(p.funil).toMatchObject({ reuniao: 1, assinante: 1 });
    expect(p.planilha.conta).toBe("brain@x.iam.gserviceaccount.com");
    expect(chamadas.some((u) => u.includes("values:batchGet"))).toBe(true);
  });
  it("sem acesso à planilha, guarda o erro com o e-mail para compartilhar", async () => {
    const b = mk();
    const { generateKeyPairSync } = await import("node:crypto");
    const pem = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const env = { GSC_SERVICE_ACCOUNT: JSON.stringify({ client_email: "brain@x.iam.gserviceaccount.com", private_key: pem }) };
    const f = (async (url: string) => String(url).includes("oauth2") ? new Response(JSON.stringify({ access_token: "t" })) : new Response(JSON.stringify({ error: { message: "forbidden" } }), { status: 403 })) as unknown as typeof fetch;
    await expect(sincronizar(b, env, f)).rejects.toThrow(/brain@x\.iam\.gserviceaccount\.com/);
    expect(painel(b, env).erro).toMatch(/compartilhe/);
  });
  it("registra o histórico de estágios quando o lead muda de status entre leituras", async () => {
    const b = mk();
    let leadRow = ["Clínica A", "Clínica", "SP", "11988887777", "10/11/2026", "abordado", "10/11/2026"];
    const f = (async (url: string) => {
      if (String(url).includes("oauth2")) return new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }));
      return new Response(JSON.stringify({ valueRanges: [{ values: [] }, { values: [leadRow] }] }));
    }) as unknown as typeof fetch;
    const { generateKeyPairSync } = await import("node:crypto");
    const pem = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const env = { GSC_SERVICE_ACCOUNT: JSON.stringify({ client_email: "brain@x.iam.gserviceaccount.com", private_key: pem }) };
    await sincronizar(b, env, f);
    leadRow = ["Clínica A", "Clínica", "SP", "11988887777", "10/11/2026", "reunião", "15/11/2026"];
    await sincronizar(b, env, f);
    await sincronizar(b, env, f);
    const l = painel(b, env).leads[0]!;
    expect(l.eventos.map((e) => `${e.para}@${e.dia}`)).toEqual(["abordado@2026-11-10", "reuniao@2026-11-15"]);
  });
});
