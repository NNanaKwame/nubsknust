# Library catalogue updates

The library and homepage read the repository-root `books.json`. PDFs remain in
Google Drive category subfolders. Run `npm run sync:books` locally with the existing
`.env`, or use the GitHub Actions workflow described below.

The importer writes beside `generate-books.js`, regardless of the working directory.
It records each PDF's `modifiedTime` and only downloads/extracts new or changed PDFs.
Category changes update the catalogue without another Gemini call for an unchanged
PDF. Removed PDFs disappear after a successful folder listing. All Drive listing
pages are read. An unexpectedly empty Drive listing stops the import for review.

The current catalogue has no modification timestamps, so the first successful run
will extract the existing books once. Subsequent runs reuse their metadata. An
extraction or listing failure aborts without replacing the existing catalogue;
retry after resolving the access/quota problem. The final write uses a temporary
file and rename so readers never receive a partially written JSON file.

## Activate scheduled updates

1. Push these changes, including `generate-books.js` and
   `.github/workflows/sync-books.yml`, to the GitHub repository's default branch.
2. In the Vercel project's Settings → Git → Deploy Hooks, create a hook for the
   production branch (`main` in this checkout).
3. In GitHub Settings → Secrets and variables → Actions, add these repository secrets:
   - `GOOGLE_API_KEY`
   - `GEMINI_API_KEY`
   - `DRIVE_BOOKS_FOLDER_ID`
   - `VERCEL_DEPLOY_HOOK` (the URL from step 2)
   Use the existing API/folder values from your local configuration; never commit
   the `.env` file or hook URL.
4. Allow GitHub Actions to write repository contents. The workflow requests
   `contents: write`; organization policies or protected-branch rules may require
   administrator configuration before the bot can push catalogue updates.
5. Open Actions → Update library catalogue → Run workflow. Confirm it succeeds,
   then check Vercel's deployment status and the live library.

The workflow runs daily at **06:17 UTC / Ghana time**, and can be started manually.
GitHub schedules can be delayed and run from the default branch. Scheduled
workflows in public repositories may be disabled after 60 days of inactivity.

Only changed catalogues are committed. After committing, the workflow requests a
Vercel deployment using the hook; a successful request is not proof that the
subsequent Vercel build succeeded. Manual runs request a deployment even without
catalogue changes, allowing a failed hook request to be retried. Check GitHub's
failed-run notifications and Vercel deployment results. A normal Git integration
may also request a deployment for the bot commit.

The schedule is not active merely because these files exist locally. It requires
the push and secret configuration above. No live catalogue regeneration or remote
configuration was performed while implementing this change.

## Validation

`npm run test:books` exercises new/legacy imports, unchanged-file skipping, changed
PDFs, category moves, removals, failed extraction, and Drive pagination using mocks.
It does not consume API quota or modify the real catalogue.

References: [GitHub schedule events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule),
[Vercel deploy hooks](https://vercel.com/docs/deploy-hooks).
