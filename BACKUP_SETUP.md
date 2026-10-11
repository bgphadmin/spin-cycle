# Off-site database backups

The `Daily database backup` GitHub Actions workflow creates a PostgreSQL custom-format dump every day at 18:00 UTC (02:00 in the Philippines), encrypts it with `age` before upload, and stores it in Cloudflare R2. It can also be run manually from the repository's **Actions** tab. Configure the items below before enabling it.

The dump contains PostgreSQL data and schema, not the actual files in Supabase Storage. Back up Storage objects separately if the project uses them.

## 1. Create an encryption key

Install [`age`](https://github.com/FiloSottile/age#installation) on a trusted computer and run:

```sh
age-keygen -o spin-cycle-backup-key.txt
```

Keep `spin-cycle-backup-key.txt` private and store a protected copy somewhere separate from GitHub and R2. It contains the private key required to decrypt backups. The command prints a public recipient beginning with `age1`; that public recipient is safe to provide to the workflow.

## 2. Create a private R2 bucket and token

In the [Cloudflare dashboard](https://dash.cloudflare.com/):

1. Open **R2 Object Storage** and create a private bucket, for example `spin-cycle-db-backups`.
2. Create an R2 API token with object read/write access scoped only to this bucket. The workflow needs to upload objects; do not grant account-wide permissions.
3. Save the access key ID and secret access key from token creation. The secret may not be shown again.
4. Note the Cloudflare account ID. The endpoint used by the workflow is `https://<account-id>.r2.cloudflarestorage.com`.
5. In the bucket's **Settings → Object Lifecycle Rules**, add a rule for prefix `spin-cycle/` to delete objects after 30 days. This keeps retention in R2 rather than granting the workflow permission to delete backups.

R2 has a monthly free allowance for Standard storage and operations; usage beyond the current allowance is billed. Check [Cloudflare's R2 pricing](https://developers.cloudflare.com/r2/pricing/) and configure billing/usage alerts as appropriate.

## 3. Add GitHub Actions secrets and variables

In the GitHub repository, open **Settings → Secrets and variables → Actions**.

Add these **repository secrets**:

| Name | Value |
| --- | --- |
| `SUPABASE_DB_URL` | Production PostgreSQL connection string from Supabase **Connect → Direct connection**. If direct connectivity is unavailable from GitHub's runner, use the **Session pooler** connection string instead. Do not use transaction-pooler mode for `pg_dump`. |
| `R2_ACCESS_KEY_ID` | Access key ID from the bucket-scoped R2 token |
| `R2_SECRET_ACCESS_KEY` | Secret access key from that token |

Add these **repository variables**:

| Name | Value |
| --- | --- |
| `BACKUP_AGE_RECIPIENT` | Public `age1...` recipient from step 1 |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_BUCKET` | Exact R2 bucket name |

Use the production database password only in the GitHub secret. When copying a Supabase URL, replace any password placeholder and percent-encode reserved characters in the password. Do not paste the connection string into chat, a commit, or a workflow log.

## 4. Run a test backup

In GitHub, open **Actions → Daily database backup → Run workflow**. Confirm the run succeeds and that an encrypted `.dump.age` object appears under `spin-cycle/` in the R2 bucket. The workflow does not print the database URL or dump contents.

If the database rejects the connection, verify the connection string and Supabase network restrictions. The workflow queries the server version and uses a matching PostgreSQL Docker image for `pg_dump`.

## 5. Verify decryption and restore

Download a test object from R2 to a trusted computer and decrypt it with the private key:

```sh
age --decrypt --identity spin-cycle-backup-key.txt --output spin-cycle.dump spin-cycle-YYYYMMDDTHHMMSSZ.dump.age
```

Restore it to an **empty, separate test database**, not production. Set `TEST_DATABASE_URL` in your local shell to that test database's connection string, then run:

```sh
pg_restore --no-owner --no-acl --dbname="$TEST_DATABASE_URL" spin-cycle.dump
```

Run this restore test periodically. A successful upload alone does not prove a backup can be restored. Store and protect the private age key separately: without it, the uploaded encrypted backups cannot be recovered.

## 6. Monitor scheduled runs

GitHub Actions runs on the default branch. Check the workflow's **Actions** page after its scheduled time and enable repository notifications for failed workflow runs. `workflow_dispatch` is available for a manual run at any time.
