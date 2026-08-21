# Agent entry point

This workspace uses the Gangline operating model and Orca for supervised agent execution.

Before changing files:

1. Read `management/pm-playbook.md`.
2. Read the assigned ticket in `management/backlog/` or `management/bugs/`.
3. Read the documents for the assigned surface under `projects/<surface>/documents/`.
4. Stay inside the ticket scope and assigned surface.

Do not make product, schema, API, permission, deployment, or economy decisions without an
explicit Owner approval recorded in the ticket or a decision record.

Workers dispatched by Orca must follow the injected lifecycle instructions and report
verification evidence before sending `worker_done`.
