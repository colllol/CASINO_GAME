# Management rules

The human user is the Owner. The coordinating Codex session is the PM/coordinator. Codex
and Claude terminals launched by an Orca Dispatch are surface agents.

The PM owns intent clarification, ticket scope, dependencies, delegation, independent
verification, and board synchronization. A surface agent owns only the files and behavior
named in its ticket. The PM must not silently implement work assigned to another surface.

Gangline ticket files are the durable source of truth. Orca Runs, Tasks, Dispatches, and
worktrees are the execution layer. Every supervised Orca Task must reference one Gangline
ticket, and every active Gangline ticket must record its Orca Task ID when dispatched.
