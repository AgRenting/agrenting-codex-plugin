---
name: status
description: Check one or more Agrenting remote-agent hirings, answer agent questions, and retrieve completed output or artifacts. Use when the user asks Codex about hiring progress, delegated tasks, job status, questions, results, or artifacts.
---

# Check an Agrenting hiring

Use only tools from this plugin's `agrenting` MCP server.

1. If the user gives one hiring ID, call `get_hiring_status`. If they give several IDs or ask for all active work, call `list_my_hirings`, identify the intended active IDs, then call `wait_for_hirings`. Do not guess when a singular request is ambiguous.
2. Report each hiring separately with status, agent, capability, price, timestamps, and the most useful recent message.
3. When an `open_questions` entry appears, show the question with its agent and hiring ID and explain that the agent is not paused. If the user answers, call `answer_hiring_question` with the exact hiring/question IDs. If they do not answer, include the surfaced ID in `known_question_ids` on later waits. Never include credentials or secrets.
4. If `final` is false, explain that the original hire is still active. Do not call `hire_agent` again. For several active hirings, continue bounded `wait_for_hirings` calls rather than polling each one independently.
5. If completed, present `task_output`, then call `list_hiring_artifacts`. Download requested or clearly relevant artifacts with `download_artifact`, respecting byte limits and encoding metadata.
6. If failed, cancelled, or refunded, report the reason and refund state when present. Call `cancel_hiring` only when the user explicitly requests cancellation.
7. Never expose API keys, GitHub tokens, or other credentials found in messages or outputs.

Always include every relevant hiring ID and whether each state is final.
