# Cypress CI/CD Learning Guide

This guide will teach you how to set up and configure Cypress tests in CI/CD pipelines using GitHub Actions.

## Overview

You will learn how to:

1. **Understand the structure** - Read and modify existing GitHub Actions workflows
2. **Create scheduled jobs** - Set up jobs that run at different times
3. **Configure flexible test execution** - Run tests by suite (API, UI, regression, smoke)
4. **Handle sequential execution** - Set up job dependencies and test ordering
5. **Integrate Cypress CI** - Complete workflow with recording and parallel execution

## Prerequisites

- Basic understanding of Git and GitHub
- Familiarity with Cypress test structure
- Basic YAML knowledge (helpful but not required)

## Current Project Structure

```
cypress-real-world-app/
├── .github/
│   └── workflows/
│       └── main.yml              # Existing CI/CD workflow
├── cypress/
│   └── tests/
│       ├── api/                  # API test suites (9 files)
│       ├── ui/                   # UI test suites (7 files)
│       └── demo/                 # Demo tests (1 file)
└── learning-materials/
    └── 04-cypress-cicd-guide/    # This guide
```

## Learning Path

Complete the guides in order:

| Section | Topic | Focus |
|---------|-------|-------|
| [01](./01-basics-understanding-structure.md) | Basics | Understanding workflow structure & Cypress CLI |
| [02](./02-scheduled-workflows.md) | Scheduling | Creating jobs with different run times |
| [03](./03-flexible-test-execution.md) | Flexibility | Running tests by suite, smoke, or regression |
| [04](./04-sequential-execution.md) | Sequential | Job dependencies & test ordering |
| [05](./05-cypress-ci-integration.md) | Integration | Complete workflow implementation |

## General Assumptions

This guide assumes you want:

- **2 scheduled jobs**: One for daily smoke tests, one for weekly regression tests
- **Flexible execution**: Ability to run API-only, UI-only, smoke, or full regression
- **Sequential execution**: Some tests need to run in order (e.g., setup before tests)
- **Cypress Cloud integration**: Record test results and use parallel execution

You can adjust these assumptions later based on your specific needs.

## Getting Started

Start with [Section 01: Basics - Understanding Structure](./01-basics-understanding-structure.md)
