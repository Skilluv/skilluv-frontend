#!/usr/bin/env bash
#
# FE-06 -- every {@html} sink is audited.
#
# Svelte escapes interpolations; {@html} does not. A user-controlled value that
# reaches {@html} without escaping is XSS (the greeting fed auth.displayName;
# JsonLd embedded JSON in a <script>). Both now escape. This keeps it that way:
# a {@html} in any file not on the allowlist fails, forcing a review that adds
# the escaping and then the file here.
set -uo pipefail

# Files whose {@html} sinks are audited and escaped (FE-06).
ALLOW='src/lib/components/seo/JsonLd.svelte|src/routes/\+page.svelte'

hits=$(grep -rln '@html' src/ --include='*.svelte' 2>/dev/null | grep -vE "$ALLOW" || true)
if [ -n "$hits" ]; then
  echo "FE-06 FAIL -- unaudited {@html} sink(s). Escape user content (src/lib/utils/html.ts), then allowlist:"
  printf '%s\n' "$hits" | sed 's/^/  /'
  exit 1
fi
echo "FE-06 ok -- every {@html} sink is in an audited, escaped file"
