import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Brain, Runner, complianceReviewer, integrationsView, llmConfig, llmChat, makeThinker, ruleChat, runChecks, seedDemo, seedKnownFacts } from "@brain/core";
import { openDb } from "@brain/core/src/node-db";
import { createApp } from "./http";

const port = Number(process.env.PORT ?? 8787);
const db = openDb(process.env.BRAIN_DB ?? "./data/brain.db");
const brain = new Brain(db);
brain.reviewer = complianceReviewer;
const jarvisCfg = llmConfig(process.env, "jarvis");
const agentCfg = llmConfig(process.env, "agent");
brain.llm = jarvisCfg !== null;
const runner = new Runner(brain, process.env, agentCfg ? makeThinker(agentCfg) : undefined);
if (process.env.BRAIN_SCHEDULER !== "0") runner.start();
seedKnownFacts(brain);
if (process.env.BRAIN_DEMO === "1") seedDemo(brain);

const centralHtml = fileURLToPath(new URL("../../central/dist/index.html", import.meta.url));
const integrations = () => integrationsView(brain.db, process.env, brain.clock());
const rules = ruleChat(brain, integrations);
const server = createApp(
  {
    brain,
    env: process.env,
    indexHtml: () => (existsSync(centralHtml) ? readFileSync(centralHtml, "utf8") : null),
    chat: jarvisCfg ? llmChat(brain, integrations, jarvisCfg, rules) : rules,
    checkIntegrations: async () => {
      await runChecks(brain.db, process.env, brain.clock());
    },
  },
  port,
);
server.listen(port, "127.0.0.1", () => {
  console.log(`Brain no ar em http://localhost:${port}  (banco: ${process.env.BRAIN_DB ?? "./data/brain.db"})`);
  console.log(jarvisCfg ? `Jarvis com ${jarvisCfg.provider === "openai" ? "OpenAI" : "Anthropic"} (${jarvisCfg.model}).` : "Jarvis por regras: preencha OPENAI_API_KEY no .env.local para ele raciocinar.");
});
