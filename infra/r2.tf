# R2: blog post images (moved off the GitHub Release on 2026-09-05).
#
# Objects are uploaded by scripts/lib/r2.mjs (ingest-feed, the rehost-images
# CI job, the one-time migration) through the Cloudflare API with the same
# token; this file owns the bucket only.
#
# The public custom domain img.cloudcodetree.com is NOT managed here:
# cloudflare_r2_custom_domain has no import support in provider 5.x, and
# letting OpenTofu "create" a domain that is already attached would risk the
# image host. It was attached with
#   wrangler r2 bucket domain add cct-blog-images --domain img.cloudcodetree.com --zone-id <zone>
# and that binding owns the CNAME img.cloudcodetree.com → public.r2.dev too.
# Revisit when the provider gains import for it.

resource "cloudflare_r2_bucket" "blog_images" {
  account_id    = var.cloudflare_account_id
  name          = "cct-blog-images"
  location      = "WNAM"
  storage_class = "Standard"
  jurisdiction  = "default"
}
