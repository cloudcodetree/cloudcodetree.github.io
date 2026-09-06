# The cloudcodetree.com zone and its settings.
#
# Nameservers moved from Route 53 to this zone on 2026-09-03 (changed at the
# registrar — Amazon Registrar still holds the registration). The Route 53
# hosted zone was deleted on 2026-09-05, so this is the only copy of the DNS;
# this configuration is its backup.

resource "cloudflare_zone" "cloudcodetree" {
  account = {
    id = var.cloudflare_account_id
  }
  name = "cloudcodetree.com"
  type = "full"
}

# http → https at the edge (GitHub Pages used to do this at the origin).
resource "cloudflare_zone_setting" "always_use_https" {
  zone_id    = cloudflare_zone.cloudcodetree.id
  setting_id = "always_use_https"
  value      = "on"
}

resource "cloudflare_zone_setting" "automatic_https_rewrites" {
  zone_id    = cloudflare_zone.cloudcodetree.id
  setting_id = "automatic_https_rewrites"
  value      = "on"
}

# "full": Cloudflare → origin over TLS. The origin is the Worker now, so this
# only matters if the apex route is ever removed and the proxied A records
# below fall back to GitHub Pages.
resource "cloudflare_zone_setting" "ssl" {
  zone_id    = cloudflare_zone.cloudcodetree.id
  setting_id = "ssl"
  value      = "full"
}

resource "cloudflare_zone_setting" "min_tls_version" {
  zone_id    = cloudflare_zone.cloudcodetree.id
  setting_id = "min_tls_version"
  value      = "1.2"
}
