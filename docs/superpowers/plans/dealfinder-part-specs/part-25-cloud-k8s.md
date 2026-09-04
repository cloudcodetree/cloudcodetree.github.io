# Part 25 — Cloud & Kubernetes (managed Postgres, secrets mgmt)

**Phase:** P5 · **Data mode:** INFRA · **Slug:** `dealfinder-cloud-k8s`

---

## 1. Objective

Deploy the full DealFinder stack to a real Kubernetes cluster backed by a
managed Postgres instance, with all secrets stored in a secrets manager — so the
learner understands how the containerized app from Part 24 becomes a
production-grade cloud service that any team member can operate without touching
plaintext credentials.

---

## 2. Prerequisites

- **Part 13** — pgvector persistence + semantic search over live deals (the
  Postgres schema the learner is now migrating to managed)
- **Part 16** — Pipelines & orchestration (Prefect batch jobs that will run in
  the cluster)
- **Part 20** — Closing the MLOps loop (the canary deploy pattern carried forward)
- **Part 24** — Containerize & ship (Docker images + Terraform IaC that this part
  extends)

---

## 3. By the end, the learner can…

- Provision a managed Postgres instance (AWS RDS for PostgreSQL or GCP Cloud SQL)
  via Terraform and connect it to the pgvector schema from Part 13.
- Create a Kubernetes namespace, deploy the DealFinder API and worker as
  `Deployment` + `Service` objects, and wire a `HorizontalPodAutoscaler` that
  scales on CPU.
- Store every credential (DB password, RapidAPI key, Web3Forms key) in AWS
  Secrets Manager (or GCP Secret Manager) and surface them to pods as environment
  variables via the External Secrets Operator — no plaintext values in manifests.
- Run `kubectl rollout status` and verify the live `/health` endpoint returns
  `200 OK` with DB connectivity confirmed.
- Tear the whole stack down with a single `terraform destroy` and understand what
  persists (the RDS snapshot) vs. what does not.

---

## 4. Data

**Mode: INFRA** — no snapshot items are queried during this part. The snapshot
(`companions/dealfinder/data/snapshots/electronics-2026-07.json`) is pre-loaded
into the managed Postgres instance as the "seed" step (a one-time
`psql -f seed.sql` in the cluster migration job), confirming the pgvector
`items` table holds the expected 270 rows. That row count is the one concrete
reproducible number the part asserts. No hero-cast items are fetched from an
API; they appear only in the seed verification query:

```sql
SELECT title, price FROM items
WHERE query = 'noise cancelling headphones'
ORDER BY price
LIMIT 4;
```

Expected result (pinned to snapshot values): Bose QC45 $46.00, Anker Q20i
$44.99, Sony XM5 $162.97, Sony XM6 $399.99 — the four hero-cast items,
confirming the seed landed correctly.

---

## 5. Worked example

**Starting point:** the learner has Docker images from Part 24 pushed to a
container registry (ECR or Artifact Registry). Terraform modules from Part 24
define the VPC and the CI/CD pipeline.

**Walk-through:**

1. Add a `modules/rds/` Terraform module. `terraform apply` provisions
   `db.t3.micro` RDS Postgres 16 in a private subnet. Output: the endpoint URL
   (e.g., `dealfinder.cxxxxxx.us-east-1.rds.amazonaws.com:5432`).

2. Store the DB password in AWS Secrets Manager:
   ```bash
   aws secretsmanager create-secret \
     --name dealfinder/db-password \
     --secret-string "$(openssl rand -base64 24)"
   ```
   Add the RapidAPI key and any other runtime secrets the same way.

3. Install External Secrets Operator into the cluster (`helm install`). Create an
   `ExternalSecret` manifest that reads `dealfinder/db-password` from Secrets
   Manager and projects it into a Kubernetes `Secret` named `dealfinder-db`.

4. Deploy the API:
   ```yaml
   envFrom:
     - secretRef:
         name: dealfinder-db
   ```
   The pod reads `DB_PASSWORD` at startup from the projected secret — no value
   ever appears in the manifest or in version control.

5. Run the seed migration job:
   ```bash
   kubectl apply -f k8s/jobs/seed-migration.yaml
   kubectl wait --for=condition=complete job/seed-migration --timeout=120s
   ```
   Query the hero cast (SQL above); confirm 4 rows with prices matching the
   snapshot ($44.99, $46.00, $162.97, $399.99).

6. Apply the `HorizontalPodAutoscaler` (`minReplicas: 1`, `maxReplicas: 4`,
   `targetCPUUtilizationPercentage: 60`). Hit `/deals?q=noise+cancelling+headphones`
   via the cluster LoadBalancer IP; confirm 200 OK.

---

## 6. Companion code

**Existing modules touched:**
- `dealfinder/db.py` — connection string now reads `DB_HOST`, `DB_PASSWORD` from
  env (already parameterized in Part 13; no change to the module itself, only to
  how the env is sourced).
- `dealfinder/api/main.py` — `/health` endpoint extended to check DB connectivity
  (`SELECT 1` ping) and return `{"status": "ok", "db": "connected", "items": 270}`.

**New files introduced (the code delta for this part):**
- `infra/modules/rds/main.tf` — RDS instance, subnet group, security group.
- `infra/modules/rds/outputs.tf` — endpoint, port, db_name.
- `k8s/external-secrets/store.yaml` — `SecretStore` pointing at Secrets Manager.
- `k8s/external-secrets/dealfinder-db.yaml` — `ExternalSecret` mapping.
- `k8s/deployments/api.yaml` — Deployment + Service + HPA.
- `k8s/jobs/seed-migration.yaml` — one-shot Job running `psql < seed.sql`.
- `scripts/generate-seed.py` — reads snapshot JSON, emits `seed.sql` INSERT
  statements for the `items` table.

**Step tags in `tutorial-dealfinder`:** `step-25-rds`, `step-25-k8s-deploy`,
`step-25-eso` (three fine-grained tags so learners can diff each phase).

---

## 7. Animations

**Animation 1 — REUSE `ContainerParity`** re-themed to electronics infra.
Currently illustrates local ↔ container env parity; re-theme the label layer to
show `dealfinder-api` pod on the left, RDS in a "private subnet" box on the
right, and the ESO projected secret flowing as a dashed arrow between them. The
shape (two boxes + arrow) stays identical; only the labels change. Makes visible
the "no plaintext in manifests" guarantee.

**Animation 2 — NEW `SecretsVault`.**
Visual metaphor: a vault door (rectangle with circular dial) on the left labeled
"Secrets Manager"; three keys flow out rightward into a Kubernetes pod outline
(rounded rectangle). Each key is labeled (`DB_PASSWORD`, `RAPIDAPI_KEY`,
`WEB3FORMS_KEY`). The pod's interior shows `env:` lines populating in sequence.
Framer Motion: keys slide from vault → pod one at a time with a stagger (0.3 s
each). Static-export-safe: all labels are real DOM text, no runtime fetch.
Concept made visible: secrets are fetched once at pod startup from a central
store, never baked into images or manifests.

---

## 8. Teaching beats

1. **Concept — why managed Postgres?** Local Docker Postgres from Part 24 loses
   data on container restart; RDS gives backups, failover, and connection pooling
   out of the box. Show the `terraform apply` output: endpoint URL appears, no
   manual DB install.

2. **Code — RDS Terraform module.** Walk `infra/modules/rds/main.tf` line by
   line. Highlight `skip_final_snapshot = false` (the safety net on destroy) and
   the private-subnet placement that blocks public internet access.

3. **Concept — secrets sprawl kills teams.** Show the anti-pattern: a `.env` file
   committed by accident. Then show AWS Secrets Manager + ESO as the fix.
   `SecretsVault` animation here.

4. **Code — ExternalSecret manifest.** Read `k8s/external-secrets/dealfinder-db.yaml`
   together; point out that `spec.data[].remoteRef.key` is the only reference to
   the secret — the value never appears in Git.

5. **Code — Deployment + HPA.** Walk `k8s/deployments/api.yaml`; apply it; watch
   `kubectl get pods -w` show `Running`. `ContainerParity` animation re-themed here.

6. **Proof — seed verification query.** Run the hero-cast SQL; show the 4 rows
   with exact snapshot prices. Then hit `/health`; show `{"items": 270}`.

7. **Concept — tear-down discipline.** Run `terraform destroy`; explain what the
   RDS final snapshot preserves and why `kubectl delete namespace dealfinder` is
   safe to run first.

---

## 9. Cross-references

**Back-reference (Part 24):** "In Part 24 — Containerize & ship, you built Docker
images and wrote Terraform for your VPC and CI/CD pipeline. This part extends
that infrastructure: the same images now run in a Kubernetes cluster backed by a
managed database, with credentials sourced from a secrets manager instead of
environment files."

**Forward-reference (Part 26):** "Part 26 — Observability & FinOps installs
Langfuse and Grafana into the same cluster, wires them to the API pods you just
deployed, and adds a live cost dashboard so you can see exactly what the RDS
instance and node pool cost per day."

---

## 10. Reproducibility checks

| Assert | How pinned |
|---|---|
| `SELECT COUNT(*) FROM items` returns `270` | `test_infra.py::test_seed_row_count` against the running cluster (or a local pg container with the seed applied) |
| Hero-cast SQL returns exactly 4 rows with prices `[44.99, 46.00, 162.97, 399.99]` | `test_infra.py::test_hero_cast_prices` — exact float equality |
| `/health` returns `{"status": "ok", "db": "connected", "items": 270}` | `test_infra.py::test_health_endpoint` via `requests` against `localhost:8000` (local Docker) or cluster LB |
| `kubectl get hpa dealfinder-api` shows `MINPODS=1 MAXPODS=4` | Asserted in the CI smoke test via `kubectl get hpa -o json` + `jq` |

All four can run locally against a Docker-compose stack (postgres + the API
image) without a real cloud account; the CI job substitutes Docker-compose for
the full K8s cluster so tests are deterministic and free.

---

## 11. Risks / notes

- **Cloud cost:** an `db.t3.micro` RDS instance costs ~$15/month. The part opens
  with a FinOps note: run the tutorial, then `terraform destroy` the same day.
  Part 26 adds the cost dashboard that makes this visible in real time.
- **Cluster provisioning time:** EKS or GKE cluster creation takes 10–15 minutes.
  The part provides a pre-provisioned `kind` (Kubernetes-in-Docker) path for
  learners who want to walk the manifests without a cloud account; all `kubectl`
  commands are identical.
- **ESO version pinning:** `external-secrets` Helm chart version is pinned in
  `infra/helm/values.yaml` (`v0.9.x`) to prevent API drift. The part notes this
  explicitly.
- **No GPU required:** this is pure infra; all ML models were trained in earlier
  parts and are embedded in the Docker image from Part 24. No training happens
  here.
- **Secret rotation** is out of scope (mentioned as a "next step" pointer to AWS
  Secrets Manager rotation docs) to keep the part tight.
- **`skip_final_snapshot = false` on RDS** means `terraform destroy` will create
  a snapshot before deletion. The part tells learners to manually delete the
  snapshot afterward to avoid ongoing storage charges.
