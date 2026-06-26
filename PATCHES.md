# Patches Renaissance Chat Web V1

Maintenu à jour à chaque PR ou rebase upstream. Source de vérité pour la chaîne de patches Renaissance appliquée par-dessus Element Web.

**Base upstream** : tag `v1.12.21`
**Branche Renaissance** : `renaissance/main`

## B — Onboarding pré-câblé Renaissance (v2 — brand Attal Président + login hardening)

- **Fichiers** :
    - `apps/web/config.sample.json` :
        - v1 : default_server_config + disable_custom_urls + permalink_prefix + room_directory
        - **v2** : `brand: "Attal Président"` (vs "Renaissance Chat")
    - `apps/web/webapp/manifest.json` (v2) :
        - `name: "Attal Président"` + `short_name: "Attal"` (vs "Element" upstream)
        - Suppression `related_applications` (les suggestions Element Android/iOS ne concernent pas Attal Président)
    - `apps/web/src/components/views/elements/ServerPicker.tsx` (v1, hide si `disable_custom_urls === true` — filet upstream)
    - `apps/web/src/components/structures/auth/Login.tsx` :
        - v1 : normalize username + invite link Renaissance
        - **v2** : ServerPicker plus rendu du tout + footer "Créer un compte" supprimé (inscription token-only via /onboard/) + imports `UIFeature` et `ServerPicker` retirés
    - `apps/web/src/components/structures/auth/Registration.tsx` (v1, redirect vers `https://chat.attalpresident.fr/onboard/`)
- **Marker code** : `PATCH-RENAISSANCE-B` (v1) + `PATCH-RENAISSANCE-B v2` (v2 deltas)
- **Conflit attendu au rebase** : moyen (composants React touchés régulièrement par upstream — Login.tsx en particulier)
- **Alternative si rebase casse** : ré-appliquer la logique en lisant ce ledger + script `scripts/check-patches-applied.sh`

## CI — Build pipeline Renaissance

- **Fichiers** :
    - `scripts/docker-package.sh` (override : version lue depuis `scripts/.renaissance-version`, plus git describe sur bind-mount .git ro qui ne tient pas sur branch renaissance/main)
    - `.github/workflows/build-publish.yml` (build OCI image vers ghcr.io)
    - `.github/workflows/renaissance-patches-check.yml` (assertion markers post-rebase)
- **Marker code** : `PATCH-RENAISSANCE-CI`
- **Conflit attendu au rebase** : faible (scripts/ peu touchés upstream)
- **Alternative si rebase casse** : ré-écrire docker-package.sh simple (cf. fichier actuel)

## A — Branding visuel (livré 2026-06-26)

Assets remplacés en place (override binaire upstream sans wrapper code). Source : favicons depuis `attalpresident.fr/icon`, logo SVG depuis `app.attalpresident.fr` (191×64 ATTAL PRÉSIDENT 2027).

- **Fichiers** :
    - `apps/web/res/vector-icons/{24,120,144,152,180,512,1024}.png` : favicons "G" Attal (crop centré du source 833×833 → resize Lanczos vers chaque taille). Servis dans le bundle webpack via `require()` (cf. `apps/web/src/vector/index.html`).
    - `apps/web/res/themes/element/img/logos/element-logo.svg` : logo "ATTAL PRÉSIDENT 2027" (viewBox 0 0 191 64). Servi en auth header par défaut + sur la Welcome page via `branding.auth_header_logo_url` (cf. `apps/web/src/SdkConfig.ts` default).
    - `apps/web/src/vector/mobile_guide/assets/element-logo.svg` : même logo, copie pour cohérence sur la page mobile_guide (page "redirection vers Element X" — out of scope produit Renaissance mais aligné branding).
- **Marker code** : aucun marker inline (fichiers binaires + SVG entièrement remplacés). Rebase upstream peut écraser silencieusement → check-patches-applied.sh asserte la présence du contenu Attal Président via le viewBox SVG (`viewBox="0 0 191 64"` est le tell unique).
- **Conflit attendu au rebase** : moyen (Element peut bump ses propres assets). À chaque rebase, refresh source via le script de re-extraction (voir below).
- **Alternative si rebase casse** : refetch sources :
  ```
  curl -sS -o /tmp/apex.png "https://attalpresident.fr/icon?<hash>"
  python3 -c "from PIL import Image; ... # resize aux 7 tailles" + copie
  curl -sS -o /tmp/logo.svg "..."  # extraction via Playwright cf. ce ledger
  ```
