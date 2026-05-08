# `*.ts.bak` and other `.bak` snapshots

Hundreds of `*.bak` files live alongside active sources under `src/`. They are **historical snapshots**, not part of the build graph (TypeScript does not compile `.bak`).

- **Coverage:** Jest `collectCoverageFrom` excludes `src/**/*.ts.bak` so coverage reports are not skewed by dead files.
- **Hygiene:** Prefer reviving logic from git history instead of `.bak` copies; delete a `.bak` only when you are sure its content is fully superseded and reviewed.
