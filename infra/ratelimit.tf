# Zone rate limiting (phase http_ratelimit). Free plan: one rule, 10 s period,
# 10 s mitigation, block only. Protects the one endpoint that calls a model:
# /api/search. Everything else is static and cached at the edge.

resource "cloudflare_ruleset" "ratelimit" {
  zone_id     = cloudflare_zone.cloudcodetree.id
  name        = "default"
  description = "Zone rate limits"
  kind        = "zone"
  phase       = "http_ratelimit"

  rules = [
    {
      ref         = "search-api-30-per-10s"
      description = "/api/search: 30 requests per 10 s per IP → 429 for 10 s"
      expression  = "(http.request.uri.path eq \"/api/search\")"
      action      = "block"
      enabled     = true
      ratelimit = {
        characteristics     = ["cf.colo.id", "ip.src"]
        period              = 10
        requests_per_period = 30
        mitigation_timeout  = 10
      }
    },
  ]
}
