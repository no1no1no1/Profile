---
name: ship
description: Finish the current task - run checks, commit, push, open a PR, and notify the coach. Use when the user says ship, wrap up, or done.
---
1. Run the repo's lint/typecheck/tests. Fix failures. Do not skip tests.
2. Commit with a clear message and `git push -u origin <branch>`.
3. Open a PR (never merge it).
4. Run `~/bin/coach-notify pr-ready "<PR url>"`.
5. Reply with 3 lines: what changed, how it was verified, what the user must decide.
