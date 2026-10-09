# Admin Panel Setup — R2 + GitHub

Panduan lengkap untuk aktifkan admin panel `/admin` supaya content dan gambar
**kekal selepas redeploy**.

Sesuai untuk sesiapa yang setup kali pertama, atau kembali selepas lama.
Setiap langkah ada cara verify — jangan skip verify, sebab kegagalan senyap
adalah masalah utama yang panduan ini wujud untuk elak.

---

## Ringkasan: kenapa perlu dua servis

Site ni deploy ke **Coolify**, yang rebuild container daripada git setiap kali
push. Apa-apa yang ditulis ke filesystem container **hilang pada deploy
seterusnya**. Jadi panel tidak simpan content kat container dan harap ia kekal.

| Jenis content | Simpan di mana | Kenapa |
|---|---|---|
| **Gambar** | Cloudflare R2 | URL kekal sah merentas rebuild |
| **Teks** | Git commit (GitHub API) | Commit = deploy = kekal |

Tanpa kedua-duanya, panel masih jalan — tapi tulis ke filesystem local, dan
**akan hilang bila redeploy**. Panel akan tunjuk warning kuning di `/admin`.

---

## Bahagian 1 — Cloudflare R2 (gambar)

### 1.1 Cipta bucket

1. Login https://dash.cloudflare.com
2. Menu kiri → **R2** → **Create bucket**
3. Nama bucket: **`scientific-molding-assets`**

**Peraturan nama bucket R2:**
- Huruf kecil sahaja (`a-z`), nombor, dan hyphen (`-`)
- 3–63 aksara
- **Tidak boleh** guna underscore (`_`), space, atau huruf besar
- Betul: `scientific-molding-assets`
- Salah: `Scientific_Molding_Assets`, `smts images`

4. Location: **Automatic** (atau `APAC` kalau nak lebih dekat dengan Malaysia)
5. **Create bucket**

> **Nota:** nama bucket ni **tidak muncul** dalam URL public. Jadi nama apa pun
> tak effect customer. Namakan yang senang anda ingat.

### 1.2 Aktifkan public access

Bucket R2 **private** secara default. Gambar tak akan load tanpa langkah ni.

**Pilihan A — Custom domain (RECOMMENDED untuk production)**

1. Bucket → **Settings** → **Public access** → **Custom Domains** → **Connect Domain**
2. Masukkan: **`assets.scientificmoldings.com`**
3. Cloudflare auto-cipta DNS record (sebab domain dah di Cloudflare)
4. Tunggu status jadi **Active** (biasanya 1–5 minit)

**Pilihan B — r2.dev (untuk testing sahaja)**

1. Bucket → **Settings** → **Public access** → **R2.dev subdomain** → **Allow Access**
2. Anda dapat URL macam `https://pub-xxxxxxxx.r2.dev`

> ⚠️ **Jangan guna r2.dev untuk production.** Ia ada rate limit dan Cloudflare
> sendiri label ia "not for production". Guna untuk test dulu, tukar ke custom
> domain sebelum launch.

**Verify:** buka `https://assets.scientificmoldings.com` dalam browser. Patut
dapat error XML `NoSuchKey` — itu **betul**, maksudnya bucket boleh diakses
tapi belum ada file. Kalau `403`, public access belum aktif.

### 1.3 Cipta API token

1. R2 → **API** → **Manage API Tokens** → **Create API Token**
2. **Token name:** `smts-admin-upload`
3. **Permissions:** **Object Read & Write**
4. **Specify bucket:** pilih `scientific-molding-assets`
   *(JANGAN pilih "All buckets" — minimum privilege)*
5. **Create API Token**

**SALIN SEKARANG.** Secret hanya dipaparkan sekali. Kalau tertutup, kena cipta baru.

Anda akan dapat **tiga** nilai:

| Nilai | Guna untuk env | Bentuk |
|---|---|---|
| Access Key ID | `R2_ACCESS_KEY_ID` | 32 aksara hex |
| Secret Access Key | `R2_SECRET_ACCESS_KEY` | **64** aksara hex |
| Account ID | `R2_ACCOUNT_ID` | 32 aksara |

**Mana nak cari Account ID?**
- R2 → **Overview** → panel kanan → **Account ID**
- Atau dari URL dashboard: `dash.cloudflare.com/<ACCOUNT_ID>/r2/...`

### 1.4 Isi env

```bash
R2_ACCOUNT_ID=a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4
R2_ACCESS_KEY_ID=2f8a9c1b3d4e5f60718293a4b5c6d7e8
R2_SECRET_ACCESS_KEY=<64 aksara hex>
R2_BUCKET=scientific-molding-assets
R2_PUBLIC_URL=https://assets.scientificmoldings.com
```

> ⚠️ **`R2_PUBLIC_URL` jangan letak trailing slash.**
> Betul: `https://assets.scientificmoldings.com`
> Salah: `https://assets.scientificmoldings.com/`

**Verify:** `/admin` → overview → baris "Image storage (R2)" mesti tulis **`R2`**,
bukan "local filesystem fallback".

---

## Bahagian 2 — GitHub token (teks)

### 2.1 Cipta fine-grained token

1. Buka https://github.com/settings/tokens?type=beta
2. **Generate new token** (Fine-grained)
3. **Token name:** `smts-admin-content`
4. **Expiration:** 1 tahun (atau custom — **catat tarikh expire**)
5. **Repository access:** → **Only select repositories**
   → pilih **`muhdmunir961-byte/scientific-molding`**
   *(JANGAN pilih "All repositories")*
6. **Permissions** → **Repository permissions** → cari **Contents**
   → set **Read and write**
   *(Ini sahaja. Jangan bagi permission lain.)*
7. **Generate token** → salin (`github_pat_...`)

### 2.2 Isi env

```bash
GITHUB_TOKEN=github_pat_xxxxxxxxxxxx
GITHUB_REPO=muhdmunir961-byte/scientific-molding
GITHUB_BRANCH=main
```

**Verify:** `/admin` → "Content commits (GitHub)" mesti tulis **`enabled`**.

---

## Bahagian 3 — Password admin

```bash
ADMIN_PASSWORD=<openssl rand -base64 24>
```

Jana dengan:
```bash
openssl rand -base64 24
```

> ⚠️ **`ADMIN_PASSWORD` WAJIB.** Tanpa ia, panel **tolak SEMUA login** — ia tidak
> akan "fall open". Ini sengaja: variable Coolify yang terlupa set tidak boleh
> jadi pintu terbuka.

Optional — asingkan session secret supaya tukar password tak kill session aktif:
```bash
ADMIN_SESSION_SECRET=<openssl rand -base64 24>
```

**Verify:** `/admin` tanpa login → patut **redirect ke `/admin/login`**.

---

## Bahagian 4 — Set dalam Coolify

1. Coolify → project → **Environment Variables**
2. Tambah **semua** variable di atas
3. **Redeploy** — env baru hanya aktif selepas container restart
4. Tunggu deploy siap

**Verify selepas deploy:**
```bash
curl -s https://scientificmoldings.com/admin -o /dev/null -w '%{http_code} %{redirect_url}\n'
# Expect: 307 https://scientificmoldings.com/admin/login
```

---

## Verify guna API (tanpa browser)

Ganti `$PASS` dengan password admin:

```bash
SITE=https://scientificmoldings.com

# 1. Tanpa login — expect 401
curl -s -o /dev/null -w '%{http_code}\n' "$SITE/api/admin/content?group=hero"

# 2. Login — expect 200, simpan cookie
curl -s -c /tmp/ck.txt -o /dev/null -w '%{http_code}\n' \
  -X POST "$SITE/api/admin/auth" \
  -H 'Content-Type: application/json' -d "{\"password\":\"$PASS\"}"

# 3. Baca group — expect 200 + JSON
curl -s -b /tmp/ck.txt "$SITE/api/admin/content?group=hero" | head -c 200
```

---

## Nama & struktur object (auto — anda tak perlu pilih)

Panel **nama-kan file automatik**. Anda tak perlu fikir pasal ni:

| Slot dalam panel | Key dalam R2 |
|---|---|
| Hero image | `images/hero-training.jpg` |
| Trainer portrait | `images/trainer-portrait.jpg` |
| Session photo 1–4 | `images/session-1.jpg` … `session-4.jpg` |

**Kenapa penting:** kalau anda replace gambar dalam slot sama, ia **overwrite**
file yang sama dan URL kekal sama. Tiada file sampah menimbun, dan content lama
tak rujuk URL mati.

Extension mengikut jenis file yang diupload — upload PNG ke slot hero → jadi
`hero-training.png`, dan path dalam content module auto-update.

---

## Troubleshooting

### Upload gagal — "R2 upload failed (403)"

Token tiada permission **Object Read & Write**, atau salah bucket.
Cipta token baru, pastikan "Specify bucket" pilih bucket betul.

### Gambar tak load — 403 dalam browser

Public access belum aktif. Semak **1.2**. Custom domain kena status **Active**.

### Gambar tak load — 404

Path dalam content module tak match object sebenar. Semak
Cloudflare R2 → bucket → **Objects**. Patut ada `images/hero-training.jpg`.

### "Saved to the local filesystem only"

`GITHUB_TOKEN` atau `GITHUB_REPO` tak set. Semak **Bahagian 2**.

### "local filesystem fallback" untuk images

R2 env tak lengkap — **kelima-lima** variable mesti ada dan bukan kosong.
Variable yang ada tapi blank (`R2_BUCKET=`) dikira **tak set**.

### Save berjaya tapi site tak berubah

1. Semak Coolify → **Deployments** — ada deploy baru?
2. Commit sampai GitHub? Semak repo → **Commits**
3. Hard refresh browser — container lama mungkin dibaca dari cache

### Session tamat tiba-tiba

Session 8 jam. Log masuk semula. Kalau kerap sangat, semak
`ADMIN_SESSION_SECRET` tak berubah antara deploy.

### "Could not sign in" tapi password betul

Semak `ADMIN_PASSWORD` tak ada space tersembunyi di hujung. Code trim
whitespace, tapi kalau password anda sengaja ada space, ia akan di-trim dan
tak match. Guna password tanpa space depan/belakang.

---

## Kos

R2 free tier: **10 GB storage + 1 juta Class A (write) + 10 juta Class B (read)
sebulan**. Laman ni guna **enam** gambar, jadi takkan dekat pun had tersebut.
Kos praktikal: **RM0**.

Cloudflare **tak charge egress** (data keluar) — ini sebab utama R2 dipilih
berbanding AWS S3, yang charge setiap GB keluar.

---

## Security checklist sebelum launch

- [ ] `ADMIN_PASSWORD` guna nilai random panjang (`openssl rand`), **bukan** senang teka
- [ ] `ADMIN_PASSWORD` **tidak** ada dalam repo (semak `.gitignore` ada `.env.local`)
- [ ] GitHub token **fine-grained**, satu repo sahaja, permission **Contents** sahaja
- [ ] R2 token **bucket-specific**, bukan "All buckets"
- [ ] Custom domain R2 aktif (bukan r2.dev) untuk production
- [ ] `/admin` set **noindex** (auto — semak dalam page source)
- [ ] `ADMIN_SESSION_SECRET` diset berasingan (optional tapi digalakkan)
- [ ] Catat tarikh expire GitHub token — kalau luput, save akan gagal

---

## Bila credentials tukar

**Tukar password:**
Set `ADMIN_PASSWORD` baru → redeploy. Session lama jadi invalid (melainkan
`ADMIN_SESSION_SECRET` diset berasingan) — itu betul, orang lama kena login
semula.

**Tukar GitHub token (bila expire):**
Cipta token baru → update `GITHUB_TOKEN` → redeploy. Tiada perubahan code.

**Tukar R2 bucket:**
Update `R2_BUCKET` + `R2_PUBLIC_URL` → redeploy. **Gambar lama tidak berpindah** —
kena upload semula, atau copy object antara bucket dalam dashboard Cloudflare.

---

## Ringkasan cepat (cheat sheet)

```bash
# --- Wajib ---
ADMIN_PASSWORD=<openssl rand -base64 24>

# --- Gambar (R2) ---
R2_ACCOUNT_ID=<32 hex>
R2_ACCESS_KEY_ID=<32 hex>
R2_SECRET_ACCESS_KEY=<64 hex>
R2_BUCKET=scientific-molding-assets
R2_PUBLIC_URL=https://assets.scientificmoldings.com

# --- Teks (GitHub) ---
GITHUB_TOKEN=github_pat_...
GITHUB_REPO=muhdmunir961-byte/scientific-molding
GITHUB_BRANCH=main

# --- Optional ---
ADMIN_SESSION_SECRET=<openssl rand -base64 24>
```

Selesai. Buka `/admin`, login, dan mula upload.
