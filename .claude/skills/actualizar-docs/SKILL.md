---
name: actualizar-docs
description: Al terminar una implementación, revisa solo lo que cambió en el código y actualiza la documentación que quedó desfasada por ese cambio — puertas del sistema (rutas, pantallas, comandos, funciones públicas, herramientas de un agente), docs/puertas.md, OpenAPI, README, AGENTS.md/CLAUDE.md y guías técnicas — en el mismo cambio. Propone cada edición con evidencia archivo:línea, muestra el diff y espera aprobación antes de guardar. Nunca toca código ni decisiones (PRD, HUs, ADRs). Use when an implementation, feature, fix, or refactor is finished and the docs must be brought up to date before opening the PR, or when asked to update, sync, or refresh the documentation after a change.
---

# Documentation Updater

## Goal

Documentation goes stale because nobody updates it when the code changes. This skill runs at the
end of any implementation and closes that gap **in the same change**: it reads what the diff
changed, finds every document that now says something false or incomplete because of it, and
proposes the exact edits — each one backed by evidence from the code.

It is diff-scoped on purpose. It does not audit the whole project (that is `auditar-drift`); it
answers one question: **"what did this change make outdated?"**

## Definition: a "puerta"

A *puerta* (door) is any point through which someone — a person or another system — asks the
system for something: an HTTP route, a screen and its actions, a CLI command, the public functions
of a module, or the tools/intents of an agent. The industry calls it an interface or an API. A
documented door answers three questions: **what it receives, what it returns, and how it fails**
(in business language).

## Input

- The change to document. By default: everything on the current branch against its base
  (`git merge-base HEAD <main branch>`), plus uncommitted changes. If the user names a commit
  range, a PR, or specific files, use that instead.
- The project's existing documentation — discovered, not assumed (step 2).

If there is no git history and the user gives no scope, ask what changed before proceeding.

## Workflow

### 1. Understand the change

List the changed files and read the diff. Summarize the change in business terms in 1-3 lines.
Then classify what kind of things changed:

- **Doors**: a door was added, removed, renamed, or its inputs, outputs, or errors changed.
- **How to run it**: commands, scripts, dependencies, required environment variables, ports.
- **Structure**: new or moved components, modules, folders, data model, integrations.
- **Rules for agents**: conventions or paths that `AGENTS.md`/`CLAUDE.md` describe.

If the change is purely internal (no door, command, config, or structure changed), say so and
stop: "no documentation impact" is a valid, useful result.

### 2. Find the documents that talk about it

Inventory the documentation that actually exists in the project. Typical candidates:
`README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/puertas.md`, `docs/openapi.yaml` (or any
OpenAPI/Swagger file), `TECH-DESIGN.md`, `docs/**`, `.env.example`, `CHANGELOG.md`, PR templates.

For each change from step 1, search those documents for the places that describe it. Use the
code-intelligence tooling the environment provides (code graph, IDE index) for the code side
before broad grep.

### 3. Decide what each document needs

For each affected spot, classify:

- **DESACTUALIZADO** — the document states something the code no longer does.
- **FALTA** — the change added something the document should cover and doesn't (for example, a
  new door missing from `docs/puertas.md` or from the OpenAPI file).
- **SIN IMPACTO** — mentioned, but still true. Count these; don't list them.

If a door changed in a way that breaks whoever already uses it (a required input added, a field
renamed or removed, an error changed), flag it as **CAMBIO QUE ROMPE** and say so explicitly —
it must be announced and versioned, not silently documented.

### 4. Decisions are not documentation

`PRD.md`, user stories (HU files), and ADRs record **decisions**, not descriptions. Never edit
them. If the change contradicts one of them, report it as **DECISIÓN A REVISAR** with the quote
and the code evidence, and suggest the human either update the decision or run `auditar-drift`.

### 5. Propose, show the diff, wait

Present a table before writing anything:

| Documento | Sección | Estado | Qué cambia | Evidencia (archivo:línea) |
|---|---|---|---|---|

Then show the proposed diff of each document. **Wait for explicit approval.** The user may
approve all, some, or ask for changes.

Rules for the edits:

- Only touch the parts affected by this change. Do not rewrite, reorganize, or restyle the rest.
- Keep each document's existing language, tone, and format.
- Every fact comes from the code with `archivo:línea`. What cannot be verified goes as
  `NO VERIFICADO`. Never invent fields, errors, commands, or URLs.
- Never modify code. If documenting reveals a code bug, report it; don't fix it.

### 6. Apply and check

Apply only the approved edits. If an OpenAPI file was edited and a validator is available in the
project (or via `npx @redocly/cli lint <file>`), run it and report the result; if it can't run,
say it was not validated.

## Output

- The approved documentation edits, applied in the working tree (same branch as the code change).
- A short final report:
  - Change summarized in business terms.
  - Documents updated (with what changed in each).
  - `CAMBIO QUE ROMPE`, `DECISIÓN A REVISAR`, and `NO VERIFICADO` items, if any.
  - A suggested line for the PR description: "Documentación actualizada: <files>".

## Quality Gate

Before returning, silently check:

- Every edit traces to a specific change in the diff — nothing outside the change's scope was
  touched.
- Every documented fact cites `archivo:línea` or is marked `NO VERIFICADO`.
- New doors were actively looked for, not only modified ones — a door missing from the docs is
  the easiest gap to skip.
- No code, PRD, HU, or ADR file was modified.
- Nothing was written before the user approved it.
