---
name: park
description: Park the current task to free a WIP slot - save a resume note and remove it from the coach's active list.
---
1. Write `PARKED.md` in the worktree root with where you stopped, the next step, and open questions. Commit it on the branch.
2. Run `node ~/Profile/coach/index.js wip park "$(basename "$PWD")"`.
3. Confirm in one line.
