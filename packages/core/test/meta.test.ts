import { describe, expect, it } from "vitest";
import { parseAdsInsights, wastedSpend } from "../src/meta";

const raw = (id: string, spend: string, leadValue?: string) => ({
  date_start: "2026-10-14",
  campaign_id: id,
  campaign_name: `Camp ${id}`,
  account_currency: "BRL",
  spend,
  impressions: "1000",
  clicks: "40",
  actions: leadValue ? [{ action_type: "lead", value: leadValue }, { action_type: "onsite_conversion.lead_grouped", value: leadValue }] : [],
});

describe("parser de anúncios", () => {
  it("converte números e não conta o mesmo lead em dobro", () => {
    const [r] = parseAdsInsights("act_1", [raw("c1", "35.50", "3")]);
    expect(r).toMatchObject({ spend: 35.5, impressions: 1000, clicks: 40, leads: 3 });
  });
  it("sem ações = zero leads", () => expect(parseAdsInsights("act_1", [raw("c1", "10")])[0]!.leads).toBe(0));
});

describe("gasto sem retorno", () => {
  it("só aponta campanha com gasto mínimo e zero lead", () => {
    const rows = parseAdsInsights("act_1", [raw("c1", "80"), raw("c2", "20"), raw("c3", "90", "2")]);
    expect(wastedSpend(rows, 50).map((c) => c.campaign_id)).toEqual(["c1"]);
  });
});
