# Android App (Trusted Web Activity)

GrottoCenter is published on the **Google Play Store** as a **Trusted Web Activity
(TWA)**: a thin Android wrapper that launches the live PWA (`https://grottocenter.org`)
inside Chrome. The app ships no business logic — it loads the deployed web app, so
content changes go live by deploying the website, **not** by releasing a new APK.

- **Why TWA?** Zero app rewrite, official Google solution, free, very low maintenance.
- **Platform:** Android only (TWA has no iOS equivalent — iOS would require Capacitor).
- **Tooling:** [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) (service worker) +
  [`@bubblewrap/cli`](https://github.com/GoogleChromeLabs/bubblewrap) (Google's TWA generator).

---

## How it fits together

```text
Browser / TWA  ──▶  https://grottocenter.org  (PWA: manifest.json + service worker)
                                │
        Digital Asset Links     │  /.well-known/assetlinks.json  ◀── proves the APK
        (ownership proof)       │                                    is allowed to open
                                ▼                                    the domain full-screen
                          Android TWA (.aab)
                          built from twa/twa-manifest.json by Bubblewrap
```

For the verification to succeed (no Chrome URL bar inside the app), the SHA-256
fingerprint(s) in `assetlinks.json` **must** match the certificate that signs the
installed APK.

### Files involved

| File                                                  | Role                                                    | Tracked in git?   |
| ----------------------------------------------------- | ------------------------------------------------------- | ----------------- |
| `packages/web-app/vite.config.mjs`                    | `VitePWA` plugin: service worker + web manifest         | ✅                |
| `packages/web-app/public/.well-known/assetlinks.json` | Digital Asset Links (ownership proof)                   | ✅ (placeholders) |
| `staticwebapp.config.json`                            | Azure headers/routing for `sw.js` and `assetlinks.json` | ✅                |
| `twa/twa-manifest.json`                               | Bubblewrap config (source for regenerating the project) | ✅                |
| `twa/app/`, `twa/build.gradle`, `twa/gradlew`, `twa/gradle/`, … | Generated Gradle project — committed so CI can build it | ✅                |
| `.github/workflows/twa-build.yml`                     | CI that builds the signed `.aab`                        | ✅                |
| `twa/android.keystore`                                | **Upload signing key — SECRET**                         | ❌ (gitignored)   |
| `twa/app-release*`, `twa/app/build/`, `twa/.gradle/`, `twa/local.properties` | Build outputs & caches                                  | ❌ (gitignored)   |

---

## Prerequisites (one-time)

- A **Google Play Developer** account ($25, one-time).
- **JDK 17+** and the **Android SDK** (only needed for local builds; the CI provides them).
- `@bubblewrap/cli` installed globally for local builds: `npm i -g @bubblewrap/cli`.
- App store listing assets: 512×512 icon (already `logo512.png`), screenshots,
  feature graphic (1024×500), a **Privacy Policy URL**.

---

## Play App Signing (automatic — nothing to enable)

Since August 2021, every **new** app shipped as an **AAB** (which this workflow
produces) **uses Play App Signing by default**. Google generates and holds the real
**app signing key**; you only manage an **upload key** (`android.keystore`).

Consequence: there are **two** certificates, and `assetlinks.json` needs **both**
fingerprints:

| `assetlinks.json` placeholder          | Comes from                                                                   | Available when                      |
| -------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------- |
| `REPLACE_WITH_UPLOAD_KEY_SHA256`       | your `android.keystore` (`keytool`)                                          | as soon as the keystore exists      |
| `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` | Play Console → app → **Setup → App integrity → App signing key certificate** | only **after** the first AAB upload |

> ⚠️ If `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` is missing, the app installed from the
> Play Store will show the Chrome URL bar (the delivered APK is signed by Google's key,
> not your upload key). This is the most common TWA mistake — keep **both** fingerprints.

---

## Step-by-step setup

> The whole Bubblewrap project lives in **`twa/`**. The generated Gradle project
> (`twa/app/`, `twa/build.gradle`, `twa/gradlew`, `twa/gradle/`, …) **is committed**
> so CI can build it directly — `bubblewrap build` and Gradle require an existing
> project, they do **not** regenerate it. Only build outputs and caches
> (`twa/app/build/`, `twa/.gradle/`, `twa/app-release*`, `twa/local.properties`) are
> gitignored. Run all `bubblewrap` and `keytool` commands so that `android.keystore`
> ends up in `twa/`, next to the manifest (its `signingKey.path` is `./android.keystore`).

### 1. Generate the upload keystore (do this **once**, keep it forever)

The alias **must** be `grottocenter` (it is referenced in `twa/twa-manifest.json`).

```bash
keytool -genkeypair -v -keystore twa/android.keystore -alias grottocenter -keyalg RSA -keysize 2048 -validity 9125
```

`keytool` then asks for the certificate's distinguished name. The values used for
GrottoCenter (the answers don't affect signing, but keep them consistent):

```text
Quels sont vos nom et prénom ? Grottocenter Admin
Quel est le nom de votre unité organisationnelle ? Wikicaves
Quel est le nom de votre entreprise ? Wikicaves
Quel est le nom de votre ville de résidence ? Bernex
Quel est le nom de votre état ou province ? Haute-Savoie
Quel est le code pays à deux lettres pour cette unité ? FR
```

> 🔒 Losing this file means you can no longer sign updates with your upload key.
> Back it up in **at least two** secure places and share it only via a secrets
> manager — see [Sharing secrets with the team](#sharing-secrets-with-the-team).

### 2. Get the upload key fingerprint and fill it in

```bash
keytool -list -v -keystore twa/android.keystore -alias grottocenter
```

Copy the `SHA256:` value into:

- `packages/web-app/public/.well-known/assetlinks.json` →
  replace `REPLACE_WITH_UPLOAD_KEY_SHA256`

### 3. Configure GitHub Actions secrets (for CI builds)

In **Settings → Secrets and variables → Actions**, create:

| Secret                      | Value                                                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | `base64 -w0 twa/android.keystore` on Linux or `[Convert]::ToBase64String([IO.File]::ReadAllBytes("twa/android.keystore"))` on Windows (the whole file, base64-encoded) |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password chosen in step 1                                                                                                                                 |
| `ANDROID_KEY_PASSWORD`      | the key password chosen in step 1                                                                                                                                      |

> GitHub secrets are **write-only**: they cannot be read back, even by admins. They
> are for CI only, not a way to share the keystore with humans.

### 4. Build the first AAB

Make sure the PWA is already deployed and valid at `https://grottocenter.org`
(see [Verifying the PWA](#verifying-the-pwa)). The CI workflow
(`.github/workflows/twa-build.yml`) can be triggered two ways:

- **Manually** — GitHub → Actions → _TWA Android Build_ → Run workflow, providing a
  `version_name` in strict semver `X.Y.Z` (e.g. `1.0.0`).
- **By pushing a tag** `vX.Y.Z` — the version name is derived from the tag.

Version handling **decouples the two Android version fields**, which is the standard
Play Store practice:

- **`versionName`** (the human-facing version) = the semver above. A non-semver value
  fails the build early.
- **`versionCode`** (the integer Play compares) = **`github.run_number`**, a
  CI-managed counter that GitHub increments on every run. This guarantees it is
  **strictly increasing** for each build regardless of the version name — a hard Play
  Store requirement — without depending on semver discipline (re-releasing the same
  version, or a backwards bump, would break a semver-derived code).

The CI writes both values into `twa/app/build.gradle` before building; it does not
touch `twa-manifest.json`, so Bubblewrap sees no manifest change and stays
non-interactive.

> If a previous upload to the Play Console already used a higher `versionCode` than
> the current `run_number`, add a fixed offset in the workflow so the code stays above
> it (Play rejects a code ≤ any previously uploaded one).

The workflow signs with your upload key, then:

1. uploads `*.aab` / `*.apk` as a **workflow artifact** (30-day retention — for quick
   debugging only, not durable storage), and
2. publishes a **GitHub Release** `vX.Y.Z` with the `.aab`/`.apk` attached — this is
   the **permanent, versioned archive** of each build.

(Local alternative: build it yourself — see [Building locally](#building-locally).)

> The signed AAB ultimately lives in two durable places: the **GitHub Release**
> (archive) and, after upload, the **Play Console** (source of truth for
> distribution). The ephemeral workflow artifact is only a convenience.

### 5. Create the app in the Play Console and upload the AAB

Create the application, complete the store listing, and upload the `.aab` to an
internal testing track. Google now enrolls the app in Play App Signing.

### 6. Add the Play App Signing fingerprint and redeploy the web

In **Play Console → Setup → App integrity**, copy the **App signing key
certificate** SHA-256 into:

- `packages/web-app/public/.well-known/assetlinks.json` →
  replace `REPLACE_WITH_PLAY_APP_SIGNING_SHA256`
- `twa/twa-manifest.json` → `fingerprints[0].value`
  (replace `REPLACE_WITH_YOUR_SHA256_FINGERPRINT`)

**Deploy the website** so the updated `assetlinks.json` is live **before** promoting
the app to production. Verify it:

```bash
curl https://grottocenter.org/.well-known/assetlinks.json
```

### 7. Promote to production

Once a test install opens **without a URL bar** (see
[Verifying the TWA](#verifying-the-twa)), promote the release in the Play Console.

---

## Building locally

The CI workflow (`.github/workflows/twa-build.yml`) is the canonical way to produce a
signed `.aab`. You can reproduce it locally to debug or to test on a device — all
commands run **from the `twa/` folder**.

### Prerequisites

- **JDK 17+** and the **Android SDK** on `PATH` (Bubblewrap can install/download the
  JDK and Android tools for you on first run if they are missing).
- Bubblewrap CLI: `npm i -g @bubblewrap/cli`.
- The upload keystore at `twa/android.keystore` (alias `grottocenter`) — see
  [step 1](#1-generate-the-upload-keystore-do-this-once-keep-it-forever). Get it from
  the team [secrets manager](#sharing-secrets-with-the-team) if you don't have it.

### Build the AAB / APK

```bash
cd twa

# Optional: bump the version before building. Locally, edit versionName /
# versionCode directly in twa/app/build.gradle (the values Gradle actually uses).
# The CI sets them for you (versionName = semver, versionCode = run number).

bubblewrap build --skipPwaValidation
```

Bubblewrap prompts for the keystore and key passwords. To run it non-interactively
(as the CI does), set the passwords via **environment variables** instead — Bubblewrap
has no password CLI flags:

```bash
export BUBBLEWRAP_KEYSTORE_PASSWORD='…'
export BUBBLEWRAP_KEY_PASSWORD='…'
bubblewrap build --skipPwaValidation
```

This produces, in `twa/`:

- `app-release-bundle.aab` — the bundle you upload to the Play Console.
- `app-release-signed.apk` — a signed APK for direct device installation.

> `--skipPwaValidation` mirrors the CI: it skips Bubblewrap's live Lighthouse check
> against `https://grottocenter.org`. Drop the flag to have Bubblewrap validate the
> deployed PWA as part of the build.

### Install on a connected device

```bash
bubblewrap install   # installs app-release-signed.apk via adb on a plugged-in device
```

Then launch it and confirm there is **no Chrome URL bar** (see
[Verifying the TWA](#verifying-the-twa)).

### Regenerate the Android project (and commit it)

The Gradle project under `twa/` **is committed**, so day-to-day builds never
regenerate it. You only regenerate when you change something in
`twa/twa-manifest.json` that affects the native app (icon, colors, `packageId`,
`host`, `minSdkVersion`, shortcuts, …):

```bash
cd twa
bubblewrap update            # apply twa-manifest.json changes to the project
bubblewrap build --skipPwaValidation
```

Then **commit the regenerated project** so CI builds the updated app:

```bash
git add twa/app twa/build.gradle twa/settings.gradle twa/gradle.properties \
        twa/gradle twa/gradlew twa/gradlew.bat twa/twa-manifest.json
git update-index --chmod=+x twa/gradlew   # keep the wrapper executable on Linux CI
```

> First-time generation (no project yet) is done with
> `bubblewrap init --manifest https://grottocenter.org/manifest.json`, which creates
> the project from the deployed web manifest. Commit the result the same way.

---

## Maintenance — rebuild the AAB vs. just deploy

The AAB is a shell; the content is served from the web.

| Change                                                                          | Action                                                                                           |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Content, features, UI fixes, data, translations…                                | **Deploy the website** (push to `develop`). Users get it immediately, **no Play Store release**. |
| App icon, name, `packageId`, chrome colors, `minSdkVersion`, native permissions | **Regenerate + commit** the project (see above), then run the workflow (tag or dispatch) and republish. |
| Keystore rotation                                                               | Rebuild the AAB **and** update `assetlinks.json` fingerprints, then redeploy the web.            |

> In practice, after the first release the AAB is rebuilt **rarely**. That is the
> main advantage of the TWA model for a small open-source team.

---

## Verifying the PWA

```bash
yarn workspace @grotto-front/web-app build
yarn workspace @grotto-front/web-app preview
```

In Chrome DevTools → **Application**: the service worker is _activated and running_
and the manifest has no errors. Run **Lighthouse** (PWA / “Installable”) — it must
pass _“registers a service worker”_ and _“web app manifest meets installability
requirements”_. (`devOptions.enabled: false` means the service worker does **not**
run with `yarn start` — always test with `build` + `preview`.)

After deployment, confirm these respond with `200`:

- `https://grottocenter.org/manifest.json`
- `https://grottocenter.org/sw.js` (header `Cache-Control: no-cache`)
- `https://grottocenter.org/.well-known/assetlinks.json` (`application/json`, `no-cache`)

## Verifying the TWA

```bash
bubblewrap install   # installs the test APK on a connected Android device
```

Launch the app: **no Chrome URL bar** must appear. If it does, the Digital Asset
Links check failed — re-check the fingerprints in `assetlinks.json` (you almost
certainly need the **Play App Signing** one) and that the file is deployed at the
exact host `grottocenter.org`.

---

## Sharing secrets with the team

Three distinct things, three different channels:

| Item                       | For            | Channel                             |
| -------------------------- | -------------- | ----------------------------------- |
| `android.keystore` (file)  | trusted humans | shared **secrets manager**          |
| Keystore / key passwords   | trusted humans | same secrets manager                |
| `ANDROID_*` GitHub secrets | CI only        | GitHub Actions secrets (write-only) |

Recommended secrets manager (pick one):

- **Azure Key Vault** — consistent with the existing Azure deployment; per-member
  access via RBAC, audited.
- **Bitwarden** (open-source, free org tier) — a shared collection with the keystore
  as an attachment plus the passwords.

**Never**: commit the keystore (even encrypted), or send it over Slack / email /
Drive in clear. **Always** keep at least two secure backups — without Play App
Signing recovery, losing the upload key is unrecoverable.

---

## Reference

- [TWA overview](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)
- [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
