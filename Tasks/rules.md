# AI Coding Agent Rules

1. **Strict Task Scope:** Refer to `Tasks/current_task.md` before making any file edits. Do not attempt unassigned tasks.
2. **Parallel Isolation:** Developers on Track A must avoid modifying logic in data scoring engines; Developers on Track B must avoid editing map UI layouts to prevent git merge conflicts.
3. **No External Auth/APIs (except Maps/ASI):** Do not add login flows, authentication middleware, or external database drivers.
4. **Mobile First:** All UI components created in Track A must target mobile viewport sizes by default.