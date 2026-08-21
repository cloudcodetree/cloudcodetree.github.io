variable "cloudflare_account_id" {
  description = "Cloudflare account that owns the Worker, R2 buckets, and zone."
  type        = string
  default     = "2473c9873f03835b5779ea7c11d41106" # not a secret; visible in every dashboard URL
}
