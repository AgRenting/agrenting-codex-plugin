import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const execFileAsync = promisify(execFile);
const credentialPatterns = [
  /\bap_[A-Za-z0-9_-]{20,}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
];

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
  assert.match(manifest.version, /^1\.0\.1\+codex\.[a-z0-9-]+$/);
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
    "wait_for_hirings",
    "answer_hiring_question",
    "list_hiring_artifacts",
    "download_artifact",
  ]) {
    assert.match(combined, new RegExp(`\\b${tool}\\b`));
  }

  assert.match(hire, /explicit approval/i);
  assert.match(hire, /every paid hire separately/i);
  assert.match(hire, /do not substitute automatically/i);
  assert.match(hire, /open_questions/);
  assert.match(`${hire}\n${status}`, /known_question_ids/);
  assert.match(hire, /idempotency_key/);
  assert.match(hire, /cannot see the caller's local working tree/i);
});

test("repository contains no literal Agrenting or GitHub credential", async () => {
  async function walk(directory, files = []) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if ([".git", "node_modules"].includes(entry.name)) continue;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(fullPath, files);
      else if (entry.isFile()) files.push(fullPath);
    }
    return files;
  }

  for (const file of await walk(root)) {
    const content = await readFile(file, "utf8");
    for (const pattern of credentialPatterns) {
      assert.doesNotMatch(content, pattern, path.relative(root, file));
    }
  }
});

test("credential scan recognizes supported GitHub PAT shapes", () => {
  const classicPat = ["ghp", "_", "A".repeat(24)].join("");
  const fineGrainedPat = ["github", "_pat_", "A".repeat(24)].join("");

  assert.ok(credentialPatterns.some((pattern) => pattern.test(classicPat)));
  assert.ok(credentialPatterns.some((pattern) => pattern.test(fineGrainedPat)));
  assert.equal(credentialPatterns.some((pattern) => pattern.test("ghp_example")), false);
});

test("documented package dry-run command packs the plugin bundle", async () => {
  const readme = await readFile(path.join(root, "README.md"), "utf8");
  assert.match(readme, /npm pack --dry-run --json \.\/plugins\/agrenting/);

  const { stdout } = await execFileAsync(
    "npm",
    ["pack", "--dry-run", "--json", "--ignore-scripts", "./plugins/agrenting"],
    { cwd: root },
  );
  const [packed] = JSON.parse(stdout);
  assert.equal(packed.name, "@agrentingai/codex-plugin");
  assert.equal(packed.version, "1.0.1");
  for (const required of [
    ".codex-plugin/plugin.json",
    ".mcp.json",
    "skills/hire/SKILL.md",
    "skills/status/SKILL.md",
  ]) {
    assert.ok(packed.files.some((file) => file.path === required), required);
  }
});
