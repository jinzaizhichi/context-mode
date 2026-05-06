/**
 * Shared routing block for context-mode hooks.
 * Single source of truth — imported by pretooluse.mjs and sessionstart.mjs.
 *
 * Factory functions accept a tool namer `t(bareTool) => platformSpecificName`
 * so each platform gets correct tool names in guidance messages.
 *
 * Backward compat: static exports (ROUTING_BLOCK, READ_GUIDANCE, etc.)
 * default to claude-code naming convention.
 */

import { createToolNamer } from "./core/tool-naming.mjs";

// ── Factory functions ─────────────────────────────────────

export function createRoutingBlock(t, options = {}) {
  const { includeCommands = true } = options;
  return `
<context_window_protection>
  <priority_instructions>
    Raw output floods context. Use context-mode MCP tools. Keep data in sandbox.
  </priority_instructions>

  <tool_selection_hierarchy>
    0. MEMORY: ${t("ctx_search")}(sort: "timeline") — check prior context after resume
    1. GATHER: ${t("ctx_batch_execute")}(commands, queries) — ONE call for research, auto-indexes, searches
    2. FOLLOW-UP: ${t("ctx_search")}(queries: ["q1",...]) — all follow-ups in ONE call
    3. PROCESSING: ${t("ctx_execute")}(language, code) | ${t("ctx_execute_file")}(path, language, code) — API, logs, data
  </tool_selection_hierarchy>

  <forbidden_actions>
    NO Bash for >20 line output. NO Read for analysis — use ${t("ctx_execute_file")}.
    NO WebFetch — use ${t("ctx_fetch_and_index")}. Bash ONLY: git/mkdir/rm/mv/navigation.
    NO ${t("ctx_execute")}/${t("ctx_execute_file")} for file creation — analysis only.
    ALWAYS use Write/Edit for files (code, configs, plans, specs, YAML, JSON, markdown).
  </forbidden_actions>

  <output_constraints>
    Terse, technical, fragments OK. Auto-expand: security, irreversible, confusion.
    Write artifacts to FILES, return path + 1-line description.
    Summarize: actions (2-3 bullets), files, findings.
  </output_constraints>

  <session_continuity>
    Skills/roles/decisions persist until revoked. Don't drop directives as context grows.
  </session_continuity>
${includeCommands ? `
  <ctx_commands>
    ctx stats|ctx-stats|/ctx-stats → stats MCP, display verbatim
    ctx doctor|ctx-doctor|/ctx-doctor → doctor MCP, run shell, show checklist
    ctx upgrade|ctx-upgrade|/ctx-upgrade → upgrade MCP, run shell, show checklist
    ctx purge|ctx-purge|/ctx-purge → purge MCP confirm:true, warn irreversible
    After /clear|/compact: "knowledge base preserved. Use \`ctx purge\` to reset."
  </ctx_commands>
` : ''}
</context_window_protection>`;
}

export function createReadGuidance(t) {
  return '<context_guidance>\n  <tip>\n    Reading to Edit? Read correct. Reading to explore? Use ' + t("ctx_execute_file") + '(path, language, code) — only summary enters context.\n  </tip>\n</context_guidance>';
}

export function createGrepGuidance(t) {
  return '<context_guidance>\n  <tip>\n    May flood context. Use ' + t("ctx_execute") + '(language: "shell", code: "...") — only summary enters context.\n  </tip>\n</context_guidance>';
}

export function createBashGuidance(t) {
  return '<context_guidance>\n  <tip>\n    May flood context. Use ' + t("ctx_batch_execute") + '(commands, queries) for multiple commands, ' + t("ctx_execute") + '(language: "shell", code: "...") for single. Bash only: git, mkdir, rm, mv, navigation.\n  </tip>\n</context_guidance>';
}

// ── Backward compat: static exports defaulting to claude-code ──

const _t = createToolNamer("claude-code");
export const ROUTING_BLOCK = createRoutingBlock(_t);
export const READ_GUIDANCE = createReadGuidance(_t);
export const GREP_GUIDANCE = createGrepGuidance(_t);
export const BASH_GUIDANCE = createBashGuidance(_t);
