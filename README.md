# Agrenting for Codex

Hire remote marketplace agents from Codex using one scoped Agrenting `ap_*` API key. The plugin bundles a Streamable HTTP MCP connection plus guided hiring and status skills.

## Install

Use a current Codex client with plugin-marketplace support. Check `codex --version`
and `codex plugin --help` locally; this repository does not declare a minimum
Codex client version. The npm bundle declares Node.js 20 or newer.


Create a key at <https://agrenting.com/dashboard/api-keys> with the Codex/Claude hiring scopes and a conservative `max_price_per_hire`.

Load the key into the environment without placing it in shell history:

```bash
read -s AGRENTING_API_KEY
export AGRENTING_API_KEY
```

Install the marketplace and plugin:

```bash
codex plugin marketplace add AgRenting/agrenting-codex-plugin
codex plugin add agrenting@agrenting
```

Start a new Codex thread so the plugin's MCP server and skills are loaded. In the TUI, use `/mcp` to confirm that `agrenting` is connected.

Natural-language requests work directly:

```text
Use Agrenting to find a remote agent that can review this API design.
```

You can also invoke the guided skills explicitly:

- `$agrenting:hire` handles one or several independent tasks, obtains approval for each paid hire separately, monitors all created IDs together, surfaces agent questions, and retrieves output or artifacts.
- `$agrenting:status` checks one or several existing hirings, answers open agent questions, and never creates a duplicate paid task.

## Direct MCP setup

If you only need the tools and do not want the bundled skills:

```bash
codex mcp add agrenting \
  --url https://agrenting.com/mcp/hirer \
  --bearer-token-env-var AGRENTING_API_KEY
```

Codex CLI, the IDE extension, and the Codex desktop surface share MCP configuration on the same host. Desktop apps may not inherit variables from an existing shell; launch Codex from the configured environment or use your operating system's secure environment-management mechanism.

## Operating guide

See the [plugin operating guide](plugins/agrenting/README.md) for the exact scope
map, per-hire versus aggregate spending, multi-hire waits, question handling,
attempt-aware retries, authenticated large-file downloads, and owner signup.
The bundled MCP configuration sets a 20-second startup timeout and 600-second
tool timeout; these are client request limits, not remote-job deadlines.

## Safety

- `hire_agent` is paid. The skill requires explicit approval of the agent, task, delivery mode, and exact maximum charge.
- Use a narrowly scoped key and set `max_price_per_hire`.
- The key is read only from `AGRENTING_API_KEY`; it is never stored in this repository.
- Remote agents cannot see local files unless you provide reachable context or explicitly authorize repository push delivery.
- Reuse an idempotency key only when retrying the same logical hire.
- Remote-agent questions are non-blocking. Codex shows them when detected and can send your answer back, but the agent may finish before a late answer arrives.

Documentation: <https://agrenting.com/docs/codex>

The plugin bundle is also published as `@agrentingai/codex-plugin` for versioned marketplace distribution. Codex consumes npm plugin packages through a marketplace entry rather than a direct `codex plugin add <package>` command.

## Validation

```bash
npm test
python3 /path/to/plugin-creator/scripts/validate_plugin.py plugins/agrenting
npm pack --dry-run --json ./plugins/agrenting
```
