# Import blocks — every resource here already exists (created by hand, by
# wrangler, or by the cutover scripts). Keeping the blocks committed means a
# fresh checkout with no state can rebuild the state file with `tofu apply`
# and prove no-drift with `tofu plan`, instead of re-creating anything.
# Once a resource is in state the block is a no-op.

locals {
  zone_id = "ad51fab5cfbee46fbbe80f5effeaa971"
}

# --- zone -------------------------------------------------------------------
import {
  to = cloudflare_zone.cloudcodetree
  id = local.zone_id
}

# --- DNS records ------------------------------------------------------------
import {
  to = cloudflare_dns_record.apex_a["185.199.108.153"]
  id = "${local.zone_id}/af293cb864d2a84c1dd3e9bcf071a18e"
}
import {
  to = cloudflare_dns_record.apex_a["185.199.109.153"]
  id = "${local.zone_id}/f05b420ddc8fec91721a2acc6961876f"
}
import {
  to = cloudflare_dns_record.apex_a["185.199.110.153"]
  id = "${local.zone_id}/e8127074d47d8754c49a2d577fd62d44"
}
import {
  to = cloudflare_dns_record.apex_a["185.199.111.153"]
  id = "${local.zone_id}/aed5b60bdbcf7cc6590ef5da0a3a9933"
}
import {
  to = cloudflare_dns_record.www
  id = "${local.zone_id}/8102937d39675794458a27fc01a8bcdf"
}
import {
  to = cloudflare_dns_record.mx["aspmx.l.google.com"]
  id = "${local.zone_id}/09e19a233286ade40575e179d8e72c3a"
}
import {
  to = cloudflare_dns_record.mx["alt1.aspmx.l.google.com"]
  id = "${local.zone_id}/fa040857928f2f82cb4926f07a89f216"
}
import {
  to = cloudflare_dns_record.mx["alt2.aspmx.l.google.com"]
  id = "${local.zone_id}/d52e495970fd276ba5765cd55d851804"
}
import {
  to = cloudflare_dns_record.mx["alt3.aspmx.l.google.com"]
  id = "${local.zone_id}/5f9ade953117f9adfbb4e076457d02c4"
}
import {
  to = cloudflare_dns_record.mx["alt4.aspmx.l.google.com"]
  id = "${local.zone_id}/dcb0cf2fecdafbb9b6fa357d369dc89e"
}
import {
  to = cloudflare_dns_record.mx_verification
  id = "${local.zone_id}/fe3b54026f2f546f986a8240976884f1"
}
import {
  to = cloudflare_dns_record.spf
  id = "${local.zone_id}/0f0a6757cfc660a81c862d90d8b09866"
}
import {
  to = cloudflare_dns_record.dmarc
  id = "${local.zone_id}/b851a175495aa7232276dd5ea5b2a77e"
}
import {
  to = cloudflare_dns_record.dkim_google
  id = "${local.zone_id}/df98dab61a4ea45463228f6a652fdf40"
}

# --- zone settings ----------------------------------------------------------
import {
  to = cloudflare_zone_setting.always_use_https
  id = "${local.zone_id}/always_use_https"
}
import {
  to = cloudflare_zone_setting.ssl
  id = "${local.zone_id}/ssl"
}
import {
  to = cloudflare_zone_setting.min_tls_version
  id = "${local.zone_id}/min_tls_version"
}
import {
  to = cloudflare_zone_setting.automatic_https_rewrites
  id = "${local.zone_id}/automatic_https_rewrites"
}

# --- redirects (www → apex) ---------------------------------------------------
import {
  to = cloudflare_ruleset.redirects
  id = "zones/${local.zone_id}/8ba95ed913a348e7abc29a4716ef8dde"
}

# --- R2: blog images ----------------------------------------------------------
import {
  to = cloudflare_r2_bucket.blog_images
  id = "${var.cloudflare_account_id}/cct-blog-images/default" # account/bucket/jurisdiction
}
# (the bucket's custom domain is not importable — see r2.tf)
