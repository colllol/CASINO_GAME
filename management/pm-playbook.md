# Casino World PM Playbook

## Operating model

Gangline stores durable intent and evidence in Git. Orca supervises Codex and Claude while
they execute bounded work. The mapping is:

```text
Owner intent
  -> Gangline ticket and decision gates
  -> Orca Run
  -> Orca Task and Dispatch
  -> Codex or Claude surface agent
  -> build, tests, and observed behavior
  -> independent PM verification
  -> synchronized Gangline lane
```

## Roles

- Owner: approves product direction, contracts, irreversible actions, releases, and scope.
- PM/coordinator: maintains tickets, dependencies, agent assignments, gates, and evidence.
- Game design agent: owns gameplay specifications, economy rules, quests, and content data.
- Unreal agent: owns Unreal C++, Blueprint integration, networking, camera, and gameplay.
- Backend agent: owns identity, persistence, inventory, transactions, and service contracts.
- QA/ops agent: owns automated tests, multiplayer smoke tests, builds, and release evidence.

Codex and Claude are implementation providers, not permanent owners. Assignment is chosen
per ticket based on the surface and reviewed by the PM before integration.

## Ticket flow

1. Search `backlog/STATUS.md`, `bugs/STATUS.md`, and all ticket bodies for related work.
2. Derive a new numeric ID from ticket filenames, never from `STATUS.md`.
3. Apply the four-signal rubric: blast radius, change type, product decision, contract impact.
4. Put any ask signal in `Awaiting Owner` until approval is recorded.
5. Create an Orca Task whose spec includes the ticket path, scope fence, and evidence bar.
6. Dispatch independent tasks in parallel only when their file ownership does not overlap.
7. Require the worker to report changed files, commands, counts, and observed behavior.
8. PM independently checks the diff and runs the relevant verification.
9. Update the ticket Outcome and Harness delta, then synchronize `STATUS.md`.

## Lanes

- Epics: approved or proposed multi-phase outcomes tracked at project level.
- Open: approved and ready, active, or blocked implementation work.
- Awaiting Owner: requires a product, contract, review, commit, or release decision.
- Closed: evidence gate passed; the ticket body is immutable.

## Evidence bar

A ticket cannot close on an agent claim. Record all applicable evidence:

- exact build and test commands;
- passing test counts;
- a dedicated-server and client smoke test for multiplayer changes;
- observed in-engine behavior for gameplay and UI changes;
- transaction invariants for money, inventory, rewards, and casino outcomes;
- files changed and explicit confirmation that the ticket scope was checked.

The Harness delta states what should change in tests, tooling, documentation, or process.
Write `None` when the work taught no reusable lesson.

## Parallel execution policy

Parallel work is allowed for independent surfaces. Do not run two editing agents against
the same files. Architecture and contract tickets must resolve before dependent client and
backend implementations begin. Keep dependency chains at four levels or fewer.

Recommended initial split after Owner approval:

| Agent | Initial responsibility |
| --- | --- |
| Claude | Draft GDD, economy constraints, quest graph, and risk review |
| Codex | Unreal architecture, project bootstrap, build automation, and integration review |
| Claude | Backend API proposal and persistence threat model after contracts are approved |
| Codex | Multiplayer vertical slice and automated verification after architecture approval |

## Owner gates

Owner approval is required before selecting the engine/service stack, changing an API or
schema, adding monetization, enabling real-money value transfer, deploying a public build,
or publishing an artifact. Casino currency must remain closed-loop and non-purchasable
with real money unless a future legal and product review explicitly changes this rule.
