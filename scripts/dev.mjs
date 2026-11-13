// Sobe o Brain (porta 8787) e a Central com recarga automática (porta 5173) juntos.
import { spawn } from "node:child_process";

const procs = [
  spawn("npm", ["run", "dev", "-w", "apps/server"], { stdio: "inherit" }),
  spawn("npm", ["run", "dev", "-w", "apps/central"], { stdio: "inherit" }),
];
const stop = () => procs.forEach((p) => p.kill());
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
procs.forEach((p) => p.on("exit", stop));
