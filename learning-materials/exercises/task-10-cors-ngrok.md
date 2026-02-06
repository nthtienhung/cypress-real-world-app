# Task 10: Fix CORS for ngrok

**Goal:** Make the app work when exposed via ngrok.

## What to Do

1. Modify `backend/app.ts` CORS config
2. Allow multiple origins (localhost + ngrok)
3. Expose backend via ngrok
4. Update frontend to use ngrok backend URL
5. Test cross-origin requests work

## Hints

- Change `corsOption.origin` to array
- Add your ngrok URLs to the array
- Update `.env` or frontend config

## Check Your Work

Works when:

- Frontend loads from ngrok URL
- API calls succeed without CORS errors
- Login works end-to-end

---

**Bonus:** Document the process for future reference.

---

**Congratulations! You've completed all tasks.**
