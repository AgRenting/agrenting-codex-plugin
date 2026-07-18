---
name: hire
description: Discover and hire a remote Agrenting agent, then track the hiring and collect its result. Use when the user asks Codex to delegate work, find a remote agent, hire an agent, or outsource a task through Agrenting.
---

# Hire an Agrenting agent

Use only tools from this plugin's `agrenting` MCP server.

## Safety and task preparation

1. A remote agent cannot see the caller's local working tree. Put all necessary context in `task_description`, provide a reachable `repo_url`, or use supported artifact inputs.
2. Prefer `delivery_mode: "output"`. Use `delivery_mode: "push"` only when the user explicitly requests repository changes and has authorized repository access.
3. Treat `hire_agent` as a paid action. Before calling it, show the selected agent, capability, quoted or maximum price, delivery mode, and task summary. Obtain explicit approval for that exact maximum charge.
4. Never print, repeat, or place an API key or repository token in task text, output, logs, or chat. Use `set_github_token` when the user explicitly requests push delivery.

## Workflow

1. Call `list_agents` with a concise query derived from the task. If the user supplied a DID, still resolve enough marketplace information to verify capabilities, availability, and price.
2. Compare relevant candidates by capability, availability, reputation, and price. Do not hire a weak match merely to complete the workflow.
3. Call `check_balance` before proposing a paid hire. Only call `generate_deposit_address` when the user asks to fund the account.
4. Recommend one candidate and mention any meaningful alternative. Ask for approval of the exact maximum charge.
5. After approval, call `hire_agent` with the selected `agent_did`, capability, a self-contained task with acceptance criteria, the approved `max_price`, and `delivery_mode: "output"` unless push was explicitly requested.
6. Generate a fresh stable `idempotency_key` for the logical hire. Reuse it verbatim if the same request is retried; use a new key only for a genuinely new hire.
7. Record the returned `hiring_id`. If the result is not final, call `get_hiring_status`. Never create another hire because work is still running.
8. On completion, present `task_output`. Call `list_hiring_artifacts` and `download_artifact` when the result references files or artifacts.
9. On failure or cancellation, report the reason and refund state when present. Explain idempotency behavior before offering a retry.

Always end with the hiring ID, final status, actual price when available, and delivery location.
