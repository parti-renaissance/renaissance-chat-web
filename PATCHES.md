# Patches Renaissance Chat Web V1

Maintenu à jour à chaque PR ou rebase upstream. Source de vérité pour la chaîne de patches Renaissance appliquée par-dessus Element Web.

**Base upstream** : tag `v1.12.21`
**Branche Renaissance** : `renaissance/main`

## B — Onboarding pré-câblé Renaissance (v3 — migration `parti.re` ; v2 — brand Attal Président + login hardening)

### v3 (2026-06-30) — Migration vers `parti.re`

Suite à la migration du homeserver Synapse côté repo `synapse` (ADR 0017 : `server_name = parti.re` APEX restauré après pivot court via sous-domaine ADR 0016), tout le câblage homeserver du fork bascule de `*.attalpresident.fr` vers `*.parti.re` :

- `apps/web/config.sample.json` + `apps/web/webapp/config.json` :
    - `default_server_config.m.homeserver.base_url` : `https://matrix.parti.re` (au lieu de `matrix.attalpresident.fr` / `chat.attalpresident.fr` bug typo dans webapp/config.json)
    - `default_server_config.m.homeserver.server_name` : `parti.re`
    - `permalink_prefix` : `https://chat.parti.re`
    - `room_directory.servers` : `["parti.re"]`
    - `custom.renaissance_chat.invite_link_url` : `https://chat.parti.re/onboard/`
    - **bonus** : `webapp/config.json.brand` corrigé `"Renaissance Chat"` → `"Attal Président"` (drift v2 oublié au build artifact)
- `apps/web/src/components/structures/auth/Login.tsx` :
    - fallback `server_name` dans `normalizeRenaissanceUsername()` : `"parti.re"` (au lieu de `"attalpresident.fr"`)
    - comment marker `PATCH-RENAISSANCE-B v3` à la place de v2 dans la section render
- `scripts/check-patches-applied.sh` : 3 assertions `attalpresident.fr` → `parti.re` + nouveau check `PATCH-RENAISSANCE-B v3` Login.tsx
- **Marker code** : `PATCH-RENAISSANCE-B v3`
- **Ancien filet rollback** : l'ancien projet synapse `re-synapse-prod` (`attalpresident.fr`) reste actif jusqu'à J+30 (2026-07-30). Si on doit revenir transitoirement (urgence), build l'image depuis le commit AVANT cette PR.

### v2 (initial)


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

## C — URL previews E2EE default ON

Renaissance flip le default Element `urlPreviewsEnabled_e2ee` à `true` (vs `false` upstream).

- **Fichiers** :
    - `apps/web/src/settings/Settings.tsx` ligne ~1146-1158 : `default: false` → `default: true` + commentaire PATCH-RENAISSANCE-C explicitant la décision (remplace le commentaire upstream "Can only be enabled per-device to ensure neither the homeserver nor client config can impact the user's choices")
- **Marker code** : `PATCH-RENAISSANCE-C`
- **Décision contextuelle** : upstream Element a délibérément verrouillé ce setting DEVICE-only avec default=false pour empêcher qu'un homeserver ou un client config force la fuite de previews en rooms chiffrées (URL envoyée au serveur révèle ce que le user lit, contournant partiellement E2EE). Renaissance assume le trade-off car : (a) federation OFF, (b) pool ~100 users internes Renaissance connus, (c) admins Synapse de confiance (Victor + Dimitri), (d) URL preview serveur déjà actif côté Synapse (cf. `infra/ansible/group_vars/all/main.yml` `matrix_synapse_url_preview_enabled: true` + IP blacklist anti-SSRF). User reste maître via le toggle Settings (DEVICE level préservé — on change uniquement le default).
- **Conflit attendu au rebase** : faible (la section `urlPreviewsEnabled_e2ee` du Settings.tsx upstream est stable depuis plusieurs versions ; conflit possible uniquement si upstream change la structure `SettingLevel.DEVICE` ou réécrit le bloc).
- **Alternative si rebase casse** : ré-appliquer manuellement le diff = chercher `urlPreviewsEnabled_e2ee` dans `Settings.tsx`, remplacer `default: false` par `default: true`, ré-injecter le commentaire PATCH-RENAISSANCE-C.
