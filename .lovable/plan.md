

## Problem

The "Default landing page" setting is saved correctly in the database, but the redirect logic in `Index.tsx` only runs **once per session**. It uses `sessionStorage.getItem('landing_checked')` to skip the check on subsequent visits. So after changing the setting, the user is never redirected because the flag is already set.

## Fix

Two changes:

### 1. `src/pages/Index.tsx` — Remove the `sessionStorage` guard
The `landing_checked` flag prevents the redirect from ever re-evaluating. Remove it so the redirect always runs when the user lands on `/` (the Index page). This is safe because it only fires on the root page, not on every navigation.

### 2. `src/pages/Settings.tsx` — Clear the session flag on save (belt-and-suspenders)
After saving `default_landing_page`, clear `sessionStorage.removeItem('landing_checked')` so the next visit to `/` picks up the new value.

Both changes are minimal — a few lines each.

