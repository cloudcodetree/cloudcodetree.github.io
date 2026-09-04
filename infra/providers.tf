terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.23"
    }
  }
}

# Reads CLOUDFLARE_API_TOKEN from the environment at apply time.
provider "cloudflare" {}
