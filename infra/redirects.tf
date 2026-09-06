# Zone-level redirects (Single Redirects, phase http_request_dynamic_redirect).
#
# www → apex. Deliberately a zone rule rather than a Worker route: the Worker
# only runs for `run_worker_first` paths, so routing www to it would serve a
# duplicate of the site instead of the 301 GitHub Pages used to send. Rules in
# this phase run before Workers, so the Worker never sees www traffic.

resource "cloudflare_ruleset" "redirects" {
  zone_id     = cloudflare_zone.cloudcodetree.id
  name        = "default"
  description = "Zone redirects"
  kind        = "zone"
  phase       = "http_request_dynamic_redirect"

  rules = [
    {
      ref         = "3157f614b860433babd796252aa3871a" # keeps the rule's identity stable across applies
      description = "www -> apex 301 (path + query preserved); replaces the GitHub Pages redirect"
      expression  = "(http.host eq \"www.cloudcodetree.com\")"
      action      = "redirect"
      enabled     = true
      action_parameters = {
        from_value = {
          status_code           = 301
          preserve_query_string = true
          target_url = {
            expression = "concat(\"https://cloudcodetree.com\", http.request.uri.path)"
          }
        }
      }
    },
  ]
}
