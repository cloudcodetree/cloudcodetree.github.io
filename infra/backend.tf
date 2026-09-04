terraform {
  required_version = ">= 1.9.0"

  # Phase 0 uses LOCAL state (single operator, no shared CI applies yet).
  # When shared state is wanted, create the bucket + an R2 S3-compatible key
  # pair, then uncomment and re-init with:
  #   wrangler r2 bucket create cct-tofu-state
  #   tofu init -migrate-state -backend-config=backend.hcl
  #
  # backend "s3" {
  #   key    = "cloudcodetree/terraform.tfstate"
  #   region = "auto"
  #   skip_credentials_validation = true
  #   skip_region_validation      = true
  #   skip_requesting_account_id  = true
  #   skip_metadata_api_check     = true
  #   skip_s3_checksum            = true
  #   use_path_style              = true
  #   use_lockfile                = true
  # }
}
