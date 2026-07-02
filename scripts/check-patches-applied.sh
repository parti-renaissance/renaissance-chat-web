#!/usr/bin/env bash
# PATCH-RENAISSANCE-B assertion script
# Used by CI to validate patches stay applied post-rebase
set -euo pipefail

errors=0

check() {
  local pattern="$1"
  local paths="$2"
  local label="$3"
  if grep -rq "$pattern" $paths 2>/dev/null; then
    echo "OK $label"
  else
    echo "FAIL $label — pattern '$pattern' absent in $paths"
    errors=$((errors + 1))
  fi
}

check "PATCH-RENAISSANCE-B" "apps/web/src/components/structures/auth/ apps/web/src/components/views/elements/" "Patch B (onboarding React) markers present"
check "_patch_renaissance_b_marker" "apps/web/config.sample.json" "Patch B config.sample.json marker present"
check "matrix.parti.re" "apps/web/config.sample.json" "v3 Matrix API base_url pre-cabled in config (parti.re — migration ADR 0017 sur synapse repo)"
check "chat.parti.re" "apps/web/config.sample.json" "v3 Renaissance domain pre-cabled in config (permalink + invite_link)"
check "parti.re" "apps/web/config.sample.json" "v3 server_name pre-cabled in config"

# v2 (2026-06-25) — brand Attal Président + login hardening
check "Attal Président" "apps/web/config.sample.json" "v2 brand Attal Président in config.sample.json"
check "Attal Président" "apps/web/res/manifest.json" "v2 brand Attal Président in manifest.json (PWA install name)"
check "PATCH-RENAISSANCE-B v2" "apps/web/src/components/structures/auth/Login.tsx" "v2 Login.tsx markers (ServerPicker + register footer removed)"
check "PATCH-RENAISSANCE-B v3" "apps/web/src/components/structures/auth/Login.tsx" "v3 Login.tsx comment marker (homeserver parti.re câblé, ADR 0017 synapse repo)"
check "PATCH-RENAISSANCE-B v2.3" "apps/web/src/components/structures/auth/Login.tsx" "v2.3 Login.tsx auto-redirect OIDC (skip clic Continue)"
check "PATCH-RENAISSANCE-B v2.2" "apps/web/src/components/views/auth/DefaultWelcome.tsx" "v2.2 DefaultWelcome.tsx marker (CTA Create account retiré)"
check "PATCH-RENAISSANCE-B v2.3" "apps/web/src/components/views/auth/DefaultWelcome.tsx" "v2.3 DefaultWelcome.tsx auto-redirect vers #/login si pas de session"

# Patch A (2026-06-26) — branding visuel : assets PNG/SVG remplacés (pas de marker code inline,
# on tag via la signature unique du SVG Attal Président viewBox).
check 'viewBox="0 0 191 64"' "apps/web/res/themes/element/img/logos/element-logo.svg" "Patch A logo SVG Attal Président (viewBox 191×64)"
check 'viewBox="0 0 191 64"' "apps/web/src/vector/mobile_guide/assets/element-logo.svg" "Patch A logo SVG Attal Président mobile_guide"

# Patch C (2026-06-30) — URL previews E2EE default ON
check "PATCH-RENAISSANCE-C" "apps/web/src/settings/Settings.tsx" "Patch C marker (urlPreviewsEnabled_e2ee default ON)"

# Patch D (2026-06-30) — Fix ESM circular import TDZ (WidgetStore family)
check "PATCH-RENAISSANCE-D" "apps/web/src/stores/widgets/WidgetLayoutStore.ts" "Patch D marker WidgetLayoutStore"
check "PATCH-RENAISSANCE-D" "apps/web/src/stores/WidgetStore.ts" "Patch D marker WidgetStore"
check "PATCH-RENAISSANCE-D" "apps/web/src/stores/ActiveWidgetStore.ts" "Patch D marker ActiveWidgetStore"

# Patch E (2026-07-02) — URL previews explicit + bare domains linkifiés
check "PATCH-RENAISSANCE-E" "packages/shared-components/src/core/utils/linkify.ts" "Patch E marker linkify validate (bare domains OK)"
check "urlPreviewsEnabled" "apps/web/config.sample.json" "Patch E config setting_defaults.urlPreviewsEnabled explicit"

if [ "$errors" -gt 0 ]; then
  echo ""
  echo "$errors Renaissance patches missing — rebase likely broke them"
  exit 1
fi

echo ""
echo "All Renaissance patches in place"
