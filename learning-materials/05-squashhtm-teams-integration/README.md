# SquashTM & Teams Integration Guide

Integrate Cypress tests with SquashTM (test management) and Microsoft Teams (notifications).

---

## What You'll Learn

- **Teams**: Send test reports to channel via webhook
- **SquashTM**: Link tests to test cases, track execution history

---

## Guides

| Guide | Purpose | Complexity |
|-------|---------|------------|
| [01-teams-integration.md](01-teams-integration.md) | Teams webhook setup | Easy |
| [02-squashtm-integration.md](02-squashtm-integration.md) | SquashTM linking | Medium |

---

## Quick Start

**Teams** (15 min): Create webhook → Add secret → Update workflow
**SquashTM** (30 min): JUnit reporter → Link test case → Run via orchestrator

---

## Files Created

```
scripts/
└── notify-teams.js          # Teams notification script

cypress.config.ts            # JUnit reporter config (SquashTM)
```

---

## Official Documentation

- [SquashTM Cypress Guide](https://tm-en.doc.squashtest.com/latest/user-guide/manage-automated-tests/techno/cypress.html)
- [Teams MessageCard Format](https://docs.microsoft.com/en-us/outlook/actionable-messages/message-card-reference)
