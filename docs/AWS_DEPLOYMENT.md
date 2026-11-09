# AWS deployment plan – CHITTI NAIDU RUN

> **Website only.** The Android/iOS apps are offline and local-first and need none of this. The website (and
> therefore this AWS setup) is planned to be retired once the apps ship – see `docs/MOBILE_APP.md`. If you launch the
> app first, you can skip AWS entirely.

> **Nothing in this repository provisions paid AWS resources automatically.** Everything below is a
> plan to review and approve first. Prices are approximate (Mumbai `ap-south-1`, late 2026) – confirm
> with the [AWS Pricing Calculator](https://calculator.aws/) before deploying.

## 1. Architecture

```
                         Route 53 (DNS)  ──  ACM certificates (HTTPS, free)
                               │
        ┌──────────────────────┴───────────────────────┐
        ▼                                              ▼
 play.example.com                               assets.example.com (optional alias)
 AWS Amplify Hosting (Next.js SSR)              Amazon CloudFront ── OAC ──► private S3 bucket
  ├─ static pages/JS → Amplify's CDN               (sprite atlases, backgrounds; content-hashed,
  └─ /api/* route handlers → managed,               cached 1 year, gzip/brotli, HTTP/3)
     Lambda-backed compute (scale-to-zero)
            │  IAM compute role (least privilege)
            ▼
   Amazon DynamoDB (on-demand, single table, TTL)          Amazon CloudWatch
     RUN#<id>   – single-use run tokens (replay guard)       ├─ Amplify/SSR logs (structured JSON)
     BOARD#<id> – leaderboards (sorted by score in SK)       ├─ alarms: DynamoDB throttles/writes, CDN 5xx
     PLAYER#<id>– reserved for cloud profile sync            └─ SNS e-mail alerts
                                                           AWS Budgets – 50 % / 80 % / forecast-100 % alerts
```

* **No always-on infrastructure**: Amplify SSR compute, DynamoDB on-demand, S3 and CloudFront all bill per use and
  scale to zero.
* **Audio needs no hosting at all** – music and SFX are synthesised in the browser (WebAudio).
* **All game art is ~113 KiB** (PNG atlases), cached immutably; Phaser itself is only downloaded when a run starts.
* An optional standalone Lambda entry point (`infra/lambda/handler.ts`) wraps the same API handlers for API Gateway
  if you ever want the API outside Amplify.

## 2. Environments

| | Staging | Production |
|---|---|---|
| Git branch → Amplify branch | `staging` | `main` |
| `APP_STAGE` | `staging` | `production` |
| CloudFormation stack | `chitti-run-staging` (`Stage=staging`) | `chitti-run-production` (`Stage=production`) |
| DynamoDB table | `chitti-run-staging` (no PITR) | `chitti-run-production` (PITR on, `Retain`) |
| `RUN_TOKEN_SECRET` | its own random value | its own random value |
| Budget | e.g. $5 | e.g. $10–20 |

Each stage has separate data, secrets, budget and alarms. Staging can be protected with Amplify branch
password protection.

## 3. Secrets & configuration

| Variable | Scope | Where to set |
|---|---|---|
| `RUN_TOKEN_SECRET` | **server only** (HMAC key, ≥ 32 chars) | Amplify Console → *Hosting → Secrets / Environment variables* per branch (or SSM Parameter Store `SecureString` `/chitti-run/<stage>/run-token-secret`) |
| `APP_STAGE` | server | Amplify env var per branch |
| `DDB_TABLE_NAME` | server | Amplify env var (stack output `TableName`) |
| `AWS_REGION` | server | Amplify env var (e.g. `ap-south-1`) |
| `NEXT_PUBLIC_ASSET_BASE_URL` | public | Amplify env var (`https://<AssetCdnDomain>`) – optional |
| `NEXT_PUBLIC_APP_STAGE` | public | Amplify env var |

* Only `NEXT_PUBLIC_*` values reach the browser; none of them are secrets.
* Without `RUN_TOKEN_SECRET`, **staging and production refuse to issue or accept score tokens (HTTP 503)** instead of
  running insecurely. Development falls back to an ephemeral random secret.
* Generate a secret: `openssl rand -hex 32`.
* `amplify.yml` writes the server-only variables into `.env.production` at build time, which is how Amplify exposes
  environment variables to Next.js SSR compute. They are not included in client bundles.
* AWS credentials are **never** used as env vars: the SSR compute assumes `ComputeRoleArn` (DynamoDB + SSM read only).

## 4. Score security (why leaderboards can't be spammed)

1. `POST /api/runs` issues an HMAC-SHA256-signed token (`runId`, issue time, mode, level, board).
2. `POST /api/scores` verifies the signature (timing-safe), token age, and that **real elapsed server time ≥ claimed
   play time** (you cannot submit a 10-minute run 5 seconds after starting).
3. The run summary is validated against the game's own physics: max speed, max multiplier, max coin rate, minimum
   time per mission/boss/challenge, and per-10-second checkpoints (monotonic, rate-bounded – no score spikes).
4. Each run id is single-use (DynamoDB conditional write) – replays get HTTP 409.
5. Names are sanitised and filtered; payloads limited to 32 KB; per-IP token-bucket rate limits.
6. Recommended in production: an **AWS WAF** rate-based rule on `/api/*` (~$6/month + $0.60 per million requests –
   add when traffic justifies it).

Honest limitation: a determined cheater can still automate a *plausible* run in real time (e.g. a bot). Server-side
deterministic replay of input logs is the next step if that becomes a problem (the simulation is already
deterministic and engine-free, so it can run inside Lambda).

## 5. Step-by-step deployment (after approval)

Prerequisites: AWS account with billing alerts enabled, AWS CLI v2, a GitHub connection for Amplify.

```bash
# 0) Tag-based cost allocation: Billing console → Cost allocation tags → activate "app".

# 1) Backend + asset CDN per stage (repeat with Stage=production)
aws cloudformation deploy \
  --stack-name chitti-run-staging \
  --template-file infra/cloudformation/chittirun.yaml \
  --parameter-overrides Stage=staging AlertEmail=you@example.com MonthlyBudgetUSD=5 \
  --capabilities CAPABILITY_NAMED_IAM --region ap-south-1
aws cloudformation describe-stacks --stack-name chitti-run-staging --query "Stacks[0].Outputs"

# 2) Upload sprites/backgrounds to the private bucket (served via CloudFront)
scripts/sync-assets.sh <AssetBucketName>

# 3) Amplify Hosting
#    Console → Create app → GitHub repo → branches main (production) and staging.
#    Build settings: use amplify.yml from the repo (platform: Web compute / SSR).
#    App settings → IAM roles → Compute role: <ComputeRoleArn> for the matching branch.
#    Environment variables per branch (see §3).

# 4) Custom domain
#    Route 53: create/transfer the hosted zone for example.com.
#    Amplify → Custom domains → add play.example.com (Amplify requests + validates the ACM certificate).
#    Optional: assets.example.com → add an ACM certificate in us-east-1 and an alias on the CloudFront
#    distribution, then point NEXT_PUBLIC_ASSET_BASE_URL at it.

# 5) Verify
curl https://play.example.com/api/health   # {"ok":true,"stage":"production","store":"dynamodb"}
```

Rollback: Amplify keeps previous deployments (one-click redeploy). DynamoDB is `Retain`ed on stack deletion.

## 6. Monitoring

* **Logs**: API handlers log one JSON line per event (`run.start`, `score.accepted`, `score.rejected` with reason,
  `error`). Example CloudWatch Logs Insights query:
  ```
  fields @timestamp, event, reason, board, score
  | filter svc = "chitti-run-api" and event = "score.rejected"
  | stats count() by reason
  ```
* **Alarms** (template): DynamoDB throttles, unusual write volume (abuse), CloudFront 5xx rate → SNS e-mail.
* **Client errors**: the React error boundary logs `ui-error` to the console; add CloudWatch RUM later if needed
  (paid per event – off by default for cost reasons).
* `/api/health` is suitable for an optional Route 53 health check ($0.50/month).

## 7. Cost estimate (MVP)

Assumptions: 10,000 monthly players, 5 runs each (50k runs, 100k API writes), ~0.7 MB first visit, ~30 builds/month.

| Service | Estimate / month |
|---|---|
| Amplify Hosting – build minutes (30 × ~4 min) | ~$1.20 |
| Amplify Hosting – data transfer (~7 GB) + SSR requests | ~$1.50 |
| CloudFront (assets) | $0 (always-free tier: 1 TB + 10M requests) |
| S3 (< 1 MB stored) | < $0.05 |
| DynamoDB on-demand (~100k writes, ~200k reads, < 1 GB) | ~$0.25 |
| CloudWatch Logs (~1 GB) + alarms (3) | ~$1.00 |
| Route 53 hosted zone | $0.50 (+ domain registration ~$10–15/year) |
| ACM certificates | $0 |
| AWS Budgets (2 budgets) | $0 |
| **Total per stage** | **≈ $4–5 / month** (staging usually < $2) |

Costs scale roughly linearly with players; at 100k players expect ~$20–30/month, dominated by Amplify data transfer.
Moving the Phaser bundle behind CloudFront too, and WAF (only when needed), are the main future cost levers.
