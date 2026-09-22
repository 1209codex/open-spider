// src/cli/agents.js
/**
 * CLI commands for managing worker adapters.
 *
 * Commands:
 *   open-spider agents list            – Detect available workers and show health status.
 *   open-spider agents connect         – Run detect on all adapters and record health.
 *   open-spider agents test <worker>   – Run a trivial fake task through the adapter to verify.
 *   open-spider agents enable <worker>  – Mark worker as healthy in health store.
 *   open-spider agents disable <worker> – Mark worker as unavailable.
 *   open-spider agents integrate       – Generate diff for integrating a worker (stub).
 */
import { Command } from "commander";
import { logger } from "../core/logger.js";
import { getHealthReport, recordSuccess, recordFailure, isWorkerAvailable } from "../agents/health.js";
import { CodexAdapter } from "../agents/codex.js";
import { OpencodeAdapter } from "../agents/opencode.js";
import { HermesAdapter } from "../agents/hermes.js";
import { AntigravityAdapter } from "../agents/antigravity.js";
import { CustomAdapter } from "../agents/custom.js";
import { table } from "../ui/table.js";

const adapters = {
  codex: CodexAdapter,
  opencode: OpencodeAdapter,
  hermes: HermesAdapter,
  antigravity: AntigravityAdapter,
  custom: CustomAdapter,
};

/**
 * Detect all adapters and return a map of workerId -> {detected: boolean, version: string}.
 */
async function detectAll() {
  const results = {};
  for (const [id, Adapter] of Object.entries(adapters)) {
    try {
      const detected = await Adapter.detect();
      const version = detected ? await Adapter.version() : "N/A";
      results[id] = { detected, version };
    } catch (e) {
      results[id] = { detected: false, version: "error" };
    }
  }
  return results;
}

export function registerAgentsCommand(program) {
  const cmd = program.command("agents").description("Manage worker adapters");

  cmd.command("list").description("List detected workers and health status").action(async () => {
    const detection = await detectAll();
    const health = await getHealthReport();
    const rows = [];
    for (const [id, info] of Object.entries(detection)) {
      const healthRec = health[id] || { status: "unknown" };
      rows.push({
        Worker: id,
        Detected: info.detected ? "yes" : "no",
        Version: info.version,
        Health: healthRec.status,
      });
    }
    logger.info(table(rows, { columns: ["Worker", "Detected", "Version", "Health"] }));
  });

  cmd.command("connect").description("Detect workers and record health as healthy").action(async () => {
    const detection = await detectAll();
    for (const [id, info] of Object.entries(detection)) {
      if (info.detected) {
        await recordSuccess(id);
        logger.ok(`Worker ${id} detected (${info.version}) – marked healthy`);
      } else {
        await recordFailure(id, null);
        logger.warn(`Worker ${id} not detected`);
      }
    }
  });

  cmd
    .command("test <worker>")
    .description("Run a trivial fake task through the specified worker to verify execution and error classification")
    .action(async (worker) => {
      const Adapter = adapters[worker];
      if (!Adapter) {
        logger.error(`Unknown worker ${worker}`);
        return;
      }
      // Create a temporary prompt file.
      const { promises: fs } = await import("node:fs");
      const { tmpdir } = await import("node:os");
      const { join } = await import("node:path");
      const tmpPath = join(tmpdir(), `open-spider-${Date.now()}-prompt.txt`);
      await fs.writeFile(tmpPath, "Echo test", { mode: 0o600 });
      const task = { id: "test", title: "Test task", promptFile: tmpPath };
      const adapter = new Adapter();
      const result = await adapter.run(task);
      if (result.ok) {
        logger.ok(`Worker ${worker} succeeded. Output:\n${result.output}`);
        await recordSuccess(worker);
      } else {
        logger.fail(`Worker ${worker} failed with ${result.errorClass?.name || "Error"}`);
        await recordFailure(worker, result.errorClass);
      }
    });

  cmd
    .command("enable <worker>")
    .description("Mark a worker as healthy in the health store")
    .action(async (worker) => {
      await recordSuccess(worker);
      logger.ok(`Worker ${worker} marked healthy`);
    });

  cmd
    .command("disable <worker>")
    .description("Mark a worker as unavailable in the health store")
    .action(async (worker) => {
      await recordFailure(worker, new Error("manual disable"));
      logger.warn(`Worker ${worker} marked unavailable`);
    });

  // Stub for integrate – in real implementation this would generate a diff.
  cmd.command("integrate").description("Generate diff for integrating a worker (stub)").action(() => {
    logger.info("Integrate command is not yet implemented – placeholder.");
  });
}
