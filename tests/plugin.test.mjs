import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function json(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

test("marketplace points to the matching Codex plugin", async () => {
  const marketplace = await json(".agents/plugins/marketplace.json");
  assert.equal(marketplace.name, "agrenting");
  assert.equal(marketplace.plugins.length, 1);

  const entry = marketplace.plugins[0];
  assert.equal(entry.name, "agrenting");
  assert.equal(entry.source.source, "local");
  assert.equal(entry.source.path, "./plugins/agrenting");
  assert.equal(entry.policy.installation, "AVAILABLE");
  assert.equal(entry.policy.authentication, "ON_INSTALL");

  const pluginRoot = path.join(root, entry.source.path);
  assert.ok((await stat(pluginRoot)).isDirectory());
  const manifest = await json("plugins/agrenting/.codex-plugin/plugin.json");
  assert.equal(manifest.name, entry.name);
  assert.equal(manifest.version, "1.0.0");
});

test("MCP uses Streamable HTTP and environment-backed bearer auth", async () => {
  const mcp = await json("plugins/agrenting/.mcp.json");
  const server = mcp.mcpServers.agrenting;

  assert.equal(server.type, "http");
  assert.equal(server.url, "https://agrenting.com/mcp/hirer");
  assert.equal(server.bearer_token_env_var, "AGRENTING_API_KEY");
  assert.equal(server.default_tools_approval_mode, "writes");
  assert.equal(server.tool_timeout_sec, 600);
  assert.equal(JSON.stringify(mcp).includes("Authorization"), false);
});

test("skills cover the safe hiring lifecycle", async () => {
  const hire = await readFile(
    path.join(root, "plugins/agrenting/skills/hire/SKILL.md"),
    "utf8",
  );
  const status = await readFile(
    path.join(root, "plugins/agrenting/skills/status/SKILL.md"),
    "utf8",
  );
  const combined = `${hire}\n${status}`;

  for (const tool of [
    "list_agents",
    "check_balance",
    "hire_agent",
    "get_hiring_status",
    "list_hiring_artifacts",
    "download_artifact",
  ]) {
    assert.match(combined, new RegExp(`\\b${tool}\\b`));
  }

  assert.match(hire, /explicit approval/i);
  assert.match(hire, /idempotency_key/);
  assert.match(hire, /cannot see the caller's local working tree/i);
});

test("repository contains no literal Agrenting API key", async () => {
  const files = [
    "README.md",
    "plugins/agrenting/.codex-plugin/plugin.json",
    "plugins/agrenting/.mcp.json",
    "plugins/agrenting/package.json",
    "plugins/agrenting/README.md",
    "plugins/agrenting/skills/hire/SKILL.md",
    "plugins/agrenting/skills/status/SKILL.md",
  ];

  for (const file of files) {
    const content = await readFile(path.join(root, file), "utf8");
    assert.doesNotMatch(content, /ap_[A-Za-z0-9_-]{20,}/, file);
  }
});
