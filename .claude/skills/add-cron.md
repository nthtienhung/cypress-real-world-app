---
name: add-cron
description: Add or modify cron schedule in a GitHub Actions workflow file
---

Add a cron schedule to the specified workflow file. Ask for:
1. Which workflow file (.github/workflows/*.yml)
2. What time (in Vietnam time)
3. Frequency (daily, weekly, etc.)

Convert Vietnam time to UTC (UTC+7) and update the schedule trigger.
