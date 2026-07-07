# Part 24 — Containerize & ship (Docker, CI/CD, Terraform)

**Phase:** P5 | **Data mode:** INFRA | **Bible steps:** 28/32

---

## 1. Objective

The learner packages the DealFinder stack into a reproducible Docker image, wires GitHub Actions to build and push on every merge, and provisions the target cloud infrastructure with Terraform — so the same SHA that passes CI is exactly what runs in prod.

---

## 2. Prerequisites

- Part 22 (Serve it fast & cheap — FastAPI, semantic cache, batching): the production-grade FastAPI app being containerized.
- Part 23 (Inference optimization — quant, vLLM, routing): final model-serving configuration baked into the image.
- Part 19 (Evaluation as a discipline): the eval gate that now runs inside CI.
- Part 16 (Pipelines & orchestration): Prefect workers that also need container images.

---

## 3. By the end, the learner can…

- Write a multi-stage `Dockerfile` that produces a minimal, reproducible image for the DealFinder API, with model weights and snapshot baked in at a pinned layer.
- Configure a GitHub Actions workflow that: runs linting + pytest + the eval gate, builds and pushes the image to a registry (GHCR), and deploys on green.
- Write Terraform that provisions a cloud VM/container service, managed Postgres (or RDS), and injects secrets via environment variables — no hand-clicking consoles.
- Verify environment parity (dev ↔ staging ↔ prod) by diffing the running container's `python -m pip freeze` against `requirements.txt`.
- Roll back a bad deploy by tagging the prior image SHA and re-deploying without touching Terraform state.

---

## 4. Data

**Mode: INFRA — no snapshot inference at deploy time.**

The snapshot (`companions/dealfinder/data/snapshots/electronics-2026-07.json`, 270 items) is used only in the CI eval gate (Part 19's golden set runs inside the container build). The Terraform config provisions a Postgres instance that will hold the pgvector index from Part 13; the snapshot is not re-ingested here.

Concrete reproducible numbers referenced:
- Eval gate threshold from Part 19: precision@5 ≥ 0.72 on the 54-item headphones golden set (anchored to snapshot query "noise cancelling headphones", median $162.97).
- Container image size target: < 2 GB compressed (fastembed `BAAI/bge-small-en-v1.5` weights ≈ 130 MB; this is checkable).
- `GET /healthz` response time < 200 ms cold on the provisioned instance (pinned in a smoke test).

---

## 5. Worked example

**Scenario:** the learner has just merged a change to the deal-score blending weights (Part 3/20) and wants to ship it.

**Walkthrough the tutorial shows:**

1. `git push origin main` triggers the Actions workflow.
2. CI stage runs `ruff`, `pytest tests/unit/`, then the eval gate: `pytest tests/eval/test_golden_headphones.py` — which loads the 54-item golden set and checks that the Anker Soundcore Q20i ($44.99) ranks in top-3 for "noise cancelling headphones" and the Bose QC45 ($46) is *not* in top-5 (the false-positive guard). Gate passes; Sony WH-1000XM5 @ $162.97 (Costco) is the anchor that keeps the median stable.
3. Build stage: `docker build --target prod -t ghcr.io/cloudcodetree/dealfinder:${{ github.sha }} .` — multi-stage strips dev deps; final image ≈ 1.4 GB compressed.
4. Push to GHCR; deploy stage SSHs into the provisioned VM and runs `docker pull … && docker run -d -p 8000:8000 --env-file .env ghcr.io/cloudcodetree/dealfinder:$SHA`.
5. Smoke test: `curl https://api.dealfinder.example/healthz` returns `{"status":"ok","model":"bge-small-en-v1.5","snapshot":"electronics-2026-07"}` — the snapshot version is embedded at build time as an env var, making every image traceable.

**Rollback:** the prior green SHA is tagged `stable`; re-deploy by setting `IMAGE_TAG=stable` in the Terraform variable and running `terraform apply`.

---

## 6. Companion code

**Existing modules used:**
- `dealfinder/api.py` (the FastAPI app from Part 22)
- `dealfinder/search.py`, `dealfinder/deal_score.py` (score blending)
- `tests/eval/test_golden_headphones.py` (golden set from Part 19)

**Step tags in `tutorial-dealfinder`:**
- `step-28`: `Dockerfile` (multi-stage: `builder` → `prod`), `.dockerignore`, `docker-compose.yml` for local parity
- `step-32`: `.github/workflows/ci-cd.yml` (lint → test → eval-gate → build → push → deploy), `terraform/` (main.tf, variables.tf, outputs.tf for a single cloud VM + managed Postgres)

**Code delta this part introduces:**
- `Dockerfile` — NEW (multi-stage; `builder` installs all deps + bakes snapshot path; `prod` copies only the venv and app; `LABEL snapshot_version=electronics-2026-07`)
- `.github/workflows/ci-cd.yml` — NEW (5-stage pipeline; eval gate is a required check)
- `terraform/` — NEW (`main.tf` provisions compute + Postgres; `variables.tf` exposes `image_tag`, `db_password`; remote state in S3/GCS bucket)
- `scripts/smoke_test.sh` — NEW (hits `/healthz`, asserts < 200 ms, validates snapshot label matches)

---

## 7. Animations

**Animation 1 — REUSE: `CDPipeline`** (already in `app/components/mdx/CDPipeline.tsx`)

Re-theme the five stages to DealFinder's pipeline: `git push` → `CI (ruff · pytest · eval gate)` → `build (Docker, ~1.4 GB)` → `deploy (VM / container)` → `live (/healthz ✓)`. The eval gate sub-label should call out "precision@5 ≥ 0.72" to make the gate concrete. No shape change needed — the linear token-advance metaphor is exactly right for a sequential pipeline.

**Animation 2 — REUSE: `ContainerParity`** (already in `app/components/mdx/ContainerParity.tsx`)

Re-theme the center image label to `dealfinder:$SHA` and the three environment boxes to `local`, `CI`, `prod`. Add a fourth sub-label line inside each box showing the snapshot version (`electronics-2026-07`) so the learner sees environment parity includes data parity, not just code parity. The fan-out shape is the right visual metaphor.

---

## 8. Teaching beats

1. **Concept — "works on my machine" is a data problem too:** show that `pip install` on two machines on different days produces different transitive deps; the container pins both code *and* the snapshot label.
2. **Code — multi-stage Dockerfile:** walk each `FROM` stage, explain why the `builder` stage installs torch/fastembed and the `prod` stage copies only the venv (size reduction from ~4 GB → ~1.4 GB).
3. **Concept — the eval gate as a deploy blocker:** restate Part 19's golden set; the CI job `required_checks` means a precision@5 regression physically prevents the merge.
4. **Code — GitHub Actions workflow:** show the YAML job dependency graph (`needs: [lint, test, eval]`); walk the build/push steps; show how `${{ github.sha }}` makes every image traceable to a commit.
5. **Proof — smoke test on the running container:** `curl /healthz` returns the snapshot label; `docker inspect` shows the `LABEL snapshot_version`. Nothing invented — the output is deterministic.
6. **Code — Terraform:** show `main.tf` provisioning compute + Postgres; `terraform plan` output; `terraform apply`; explain remote state and why local state is dangerous on a team.
7. **Concept — rollback without Terraform drift:** re-deploy by changing `image_tag` variable only; Terraform applies a no-op on infra, just restarts the container. The snapshot label in the old image confirms which data version is running.

---

## 9. Cross-references

**Back:** Part 23 (Inference optimization, for real) established the final model-serving configuration — quant settings, batch sizes, and routing rules — that Part 24 bakes into the container image. The Dockerfile `ENV` layer locks those settings so they cannot silently drift between environments.

**Forward:** Part 25 (Cloud & Kubernetes — managed Postgres, secrets management) extends the Terraform foundation laid here: the `terraform/` module grows to add a managed Kubernetes cluster, and the single VM deploy is replaced with a `Deployment` + `Service`; secrets move from `.env` files to a secrets manager. Learners who want to skip K8s can stop at Part 24 — the single-VM deploy is production-usable.

---

## 10. Reproducibility checks

```python
# tests/infra/test_image_labels.py
# Run after: docker build --target prod -t dealfinder:test .
import subprocess, json

def test_snapshot_label():
    out = subprocess.check_output(
        ["docker", "inspect", "--format", "{{json .Config.Labels}}", "dealfinder:test"]
    )
    labels = json.loads(out)
    assert labels["snapshot_version"] == "electronics-2026-07"

def test_healthz_fast(base_url="http://localhost:8000"):
    import time, requests
    t0 = time.perf_counter()
    r = requests.get(f"{base_url}/healthz")
    elapsed_ms = (time.perf_counter() - t0) * 1000
    assert r.status_code == 200
    assert elapsed_ms < 200, f"healthz too slow: {elapsed_ms:.0f}ms"
    assert r.json()["snapshot"] == "electronics-2026-07"
```

```bash
# Pin image size in CI (add to ci-cd.yml after build):
IMAGE_SIZE=$(docker image inspect dealfinder:$SHA --format='{{.Size}}')
python -c "import sys; s=int('$IMAGE_SIZE'); assert s < 2_200_000_000, f'image too large: {s/1e9:.1f}GB'"
```

Golden-set eval gate (already pinned in Part 19, re-run here):
- Anker Soundcore Q20i @ $44.99 in top-3 for "noise cancelling headphones"
- Bose QC45 @ $46 NOT in top-5
- Sony WH-1000XM5 @ $162.97 (Costco) within ±5% of query median $162.97

---

## 11. Risks / notes

- **Docker build on CI runners:** fastembed downloads model weights at import time by default; the Dockerfile must run a `python -c "from fastembed import TextEmbedding; TextEmbedding('BAAI/bge-small-en-v1.5')"` bake step so weights are in the image layer and the runner needs internet only at build time, not at deploy time.
- **Terraform state:** tutorial uses a local backend for the walkthrough but calls out that teams must use remote state (S3 + DynamoDB lock / GCS); the `terraform/README.md` in the companion repo documents the remote-state setup. Learners on a free tier can use a single `t3.small` / `e2-small`.
- **Secrets in CI:** the tutorial uses GitHub Actions encrypted secrets (`DB_PASSWORD`, `GHCR_TOKEN`); no `.env` file is ever committed. The `secret-scan.sh` hook (already in the parent repo) blocks accidental key commits.
- **Non-determinism in model weights:** fastembed `BAAI/bge-small-en-v1.5` weights are pinned by the `fastembed==0.x.y` version in `requirements.txt`; the Dockerfile copies `requirements.txt` before the bake step so Docker layer caching is invalidated only when deps change.
- **Cost:** the tutorial targets a single small VM (< $10/month on any major cloud) and explicitly does not provision GPUs — inference optimization (Part 23) already reduced the model to CPU-viable. The Terraform `variables.tf` has `instance_type` defaulting to a free-tier-eligible shape with a comment to upgrade for production load.
