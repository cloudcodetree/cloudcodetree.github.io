# DNS records for cloudcodetree.com. ttl = 1 means "auto" in Cloudflare.
#
# Not here, on purpose:
#   - AAAA beta.cloudcodetree.com (100::) — the staging Worker's custom domain,
#     owned by wrangler (`routes` in wrangler.jsonc, env.staging)
#   - CNAME img.cloudcodetree.com → public.r2.dev — owned by the R2 custom
#     domain in r2.tf; the binding creates and deletes it
#   - the apex Worker route (cloudcodetree.com/*) — wrangler.jsonc

locals {
  # GitHub Pages' anycast IPs. Historical since the 2026-09-05 cutover: the
  # apex Worker route overlays them, so they only answer if that route is
  # removed. Kept proxied so Cloudflare, not GitHub, terminates TLS either way.
  github_pages_ips = ["185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153"]

  # Google Workspace MX (priority → host).
  google_mx = {
    "aspmx.l.google.com"      = 1
    "alt1.aspmx.l.google.com" = 5
    "alt2.aspmx.l.google.com" = 5
    "alt3.aspmx.l.google.com" = 10
    "alt4.aspmx.l.google.com" = 10
  }
}

resource "cloudflare_dns_record" "apex_a" {
  for_each = toset(local.github_pages_ips)

  zone_id = cloudflare_zone.cloudcodetree.id
  name    = "cloudcodetree.com"
  type    = "A"
  content = each.value
  ttl     = 1
  proxied = true
}

# www is answered by the redirect rule in redirects.tf before this record is
# ever consulted; the record exists so the hostname resolves (proxied).
#
# The target was cloudcodetree.github.io until 2026-09-10 — a leftover from
# GitHub Pages hosting, which was retired 2026-09-05, and from the repo name,
# which changed the same day. That hostname now 404s. Pointing at the apex
# keeps the record meaningful: it is still never fetched (the redirect rule
# runs in an earlier phase), but if the rule were ever removed www would land
# on the real site instead of a dead host.
resource "cloudflare_dns_record" "www" {
  zone_id = cloudflare_zone.cloudcodetree.id
  name    = "www.cloudcodetree.com"
  type    = "CNAME"
  content = "cloudcodetree.com"
  ttl     = 1
  proxied = true
  settings = {
    flatten_cname = false
    ipv4_only     = false
    ipv6_only     = false
  }
}

# --- mail: Google Workspace --------------------------------------------------

resource "cloudflare_dns_record" "mx" {
  for_each = local.google_mx

  zone_id  = cloudflare_zone.cloudcodetree.id
  name     = "cloudcodetree.com"
  type     = "MX"
  content  = each.key
  priority = each.value
  ttl      = 1
  proxied  = false
}

# Google's domain-verification MX from the original Workspace setup; harmless
# (lowest priority) and Google still expects it.
resource "cloudflare_dns_record" "mx_verification" {
  zone_id  = cloudflare_zone.cloudcodetree.id
  name     = "cloudcodetree.com"
  type     = "MX"
  content  = "fhutkxrcyx5qxrjkfgegek6uyaopnkpppgi6rsvybfsrqn3w7qgq.mx-verification.google.com"
  priority = 15
  ttl      = 1
  proxied  = false
}

resource "cloudflare_dns_record" "spf" {
  zone_id = cloudflare_zone.cloudcodetree.id
  name    = "cloudcodetree.com"
  type    = "TXT"
  content = "v=spf1 include:_spf.google.com ~all"
  ttl     = 1
  proxied = false
  comment = "SPF: Google Workspace only"
}

resource "cloudflare_dns_record" "dmarc" {
  zone_id = cloudflare_zone.cloudcodetree.id
  name    = "_dmarc.cloudcodetree.com"
  type    = "TXT"
  content = "v=DMARC1; p=none; rua=mailto:chris@cloudcodetree.com; fo=1"
  ttl     = 1
  proxied = false
  comment = "DMARC monitoring"
}

# Public half of the DKIM key generated in Google Admin on 2026-09-05. Rotating
# the key in Google Admin means replacing this value.
resource "cloudflare_dns_record" "dkim_google" {
  zone_id = cloudflare_zone.cloudcodetree.id
  name    = "google._domainkey.cloudcodetree.com"
  type    = "TXT"
  content = "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv2G1yFefEvNm2wlAw9Px7wCeo3r5pMIilmO4JH6/z2s3jW0Um+U1cUSLOHQysR0pBIYTjMe9dvmEDJjT8zuzAjv2YCspB3VB5A76YB/tvrltyqMHkOqoBvOU7zereKTM9dew/B9MjSOl3Sdt4QQTz9GFCXrm2JL90UZ8NNtL2ZZGt+W4LUNnVpnx/i7dPBcA1flrjePa6gd/El7ofoIro9MT7+hoRFvGiX6qf38Y1l3o/RSn4+kWbGTWHwQvWG1HUQMqjwpPOwkCMB+pRtEP6KANoGjm0a8dcCkOVH/EM2GFhHNOPez5YqDEyD6Iy1IFen+SuQhHCT+enPS/qsPHZwIDAQAB"
  ttl     = 1
  proxied = false
  comment = "Google Workspace DKIM (generated 2026-09-05)"
}
