---
name: hire
description: Discover and hire one or more remote Agrenting agents, then track the independent hirings and collect their results. Use when the user asks Codex to delegate work, find remote agents, hire agents, or outsource tasks through Agrenting.
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
4. For one task, recommend one candidate and mention any meaningful alternative. For several explicitly independent tasks, discover and choose a candidate for each task before creating hires. Do not invent dependencies, duplicate the same task across agents, or silently substitute a different agent.
5. Handle every paid hire separately: refresh `check_balance`, show that hire's selected agent, capability, task, delivery mode, and exact maximum charge, then obtain explicit approval for that hire.
6. Immediately after each approval, call `hire_agent` with the selected `agent_did`, capability, a self-contained task with acceptance criteria, the approved `max_price`, and `delivery_mode: "output"` unless push was explicitly requested. If one creation fails or the agent became busy, report that line item and continue with already-created or later approved hires. Do not substitute automatically.
7. Generate a fresh stable `idempotency_key` for each logical hire. Reuse it verbatim if that same request is retried; never share one key between different hires.
8. Record every returned `hiring_id`. For one active hire, use `get_hiring_status`. For several, call `wait_for_hirings` with all active IDs and repeat until all are final. Never create another hire merely because work is still running.
9. When `open_questions` appears, show the question with its agent and hiring ID. Explain that the agent is continuing with its stated assumptions. Ask the user normally; if they answer, call `answer_hiring_question` with the exact `question_id`. Never put credentials or secrets in an answer. If the user does not answer, include that surfaced ID in `known_question_ids` on later `wait_for_hirings` calls so monitoring continues without hiding later questions or fabricating an answer.
10. On completion, present each hiring's result separately. Call `get_hiring_status`, `list_hiring_artifacts`, and `download_artifact` as needed for final output. Do not automatically synthesize several agents' results unless the user asks.
11. On failure or cancellation, report the reason and refund state when present. Explain idempotency behavior before offering a retry; a replacement candidate requires a new explicit approval.

Always end with every hiring ID, final status, actual price when available, and delivery location.
