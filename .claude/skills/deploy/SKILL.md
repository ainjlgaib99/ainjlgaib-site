---
name: deploy
description: Run the full deployment pipeline for ainjlgaib-site — tests, build, and output verification.
disable-model-invocation: true
allowed-tools: "Bash(npm test) Bash(node build.js) Bash(ls *)"
---

Run the ainjlgaib-site deployment pipeline in order:

1. Run `npm test`. If any tests fail, stop and report which ones. Do not proceed to build.
2. Run `node build.js`. If it exits non-zero, stop and report the error.
3. Run `ls public/ && ls public/src/` and confirm `index.html`, `src/form.js`, `src/init.js` are present.
4. Report: tests passed count, build status, files present, and any warnings (e.g. webhook not set).
