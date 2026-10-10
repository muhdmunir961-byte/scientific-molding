# ANSWER.md — Keputusan, Analisis dan Soalan Terbuka

> **Tujuan.** Semua diagnosis, keputusan reka bentuk dan soalan yang belum selesai
> daripada kerja admin/foto direkodkan di sini supaya boleh dibaca dalam satu
> tempat, tanpa perlu digali semula daripada mesej commit atau chat.
>
> **Cara baca.** Bahagian 1 ialah diagnosis bug. Bahagian 2 ialah model data.
> Bahagian 3 ialah setiap keputusan yang saya buat dan **sebabnya** — termasuk
> tempat saya pilih sebaliknya daripada pilihan yang jelas. Bahagian 4 ialah apa
> yang masih terbuka dan perlukan awak.
>
> Dikemas kini terakhir: selepas commit `3c938d1`.

---

## Bahagian 1 — Diagnosis bug

### Bug 1 — `/admin/images` tunjuk `Unknown module ""`

**Punca akar.** Halaman itu minta `?group=images`. Parameter ditukar nama daripada
`group` kepada `module` apabila skema admin berhenti menerangkan *field* dan mula
menerangkan *module*, dan satu call site ini tertinggal nama lama. API tak nampak
`module`, jadi ia pulangkan **senarai module**; halaman tak jumpa `values` dalam
senarai itu lalu tunjuk ralat module kosong.

**Fix, di kedua-dua hujung.**
- Klien sekarang minta terus daripada route images (`?manifest=1`), iaitu tempat
  pipeline upload sebenarnya menulis.
- Route content kini bezakan `null` (tiada parameter → permintaan senarai yang
  sah) daripada `''` (ada tapi kosong → `400` dengan mesej yang boleh dibaca).
  Pemanggil yang hantar kosong tak boleh lagi disalah anggap sebagai minta semua.

### Bug 2 — Content → Images tunjuk `PAGE_IMAGES` sebagai `null`

**Punca akar.** `PAGE_IMAGES` tiada entri dalam registry, jadi `readExport()`
pulangkan `undefined` dan editor render `null`. Di bawahnya, tiada satu tempat
yang boleh jawab "gambar apa yang site guna sekarang?" — enam default tu
bertaburan dalam `hero-content.ts`, `about-content.ts` dan
`testimonials-content.ts`.

**Fix.** `lib/admin/images-manifest.ts` bina struktur sebenar — satu entri per
slot dengan `url` dan `source` (`override` / `default` / `unset`). Ia
**dikira, tidak disimpan**, jadi ia tak boleh jadi null.

### Bug 3 — Butang Deploy pulangkan `405`

**Punca akar.** `lib/admin/deploy.ts` hantar `GET`. Coolify v4 tukar endpoint
deploy kepada `POST`.

**Disahkan terhadap instance live**, dan inilah yang memisahkan "salah method"
daripada "salah kredensial":

| Method | Respons |
|---|---|
| GET | `405 {"message":"This endpoint has changed to a POST request."}` |
| POST | `401 {"message":"Unauthenticated."}` |

**Fix.** POST, dan envelope JSON mentah diganti dengan ayat yang beritahu apa nak
buat: `401/403` → token tiada atau tiada kebenaran deploy, `404` → uuid salah,
`429` → kena rate-limit, `5xx` → semak dashboard.

### Bug 4 — Path gambar tak konsisten

Empat defect berasingan, semuanya buat panel laporkan berjaya sedangkan site
tunjuk benda lain.

| Defect | Akibat |
|---|---|
| Key ialah `images/<slot>.<ext>` | Upload semula tulis **key sama**. Byte bertukar, URL tak bertukar, jadi setiap browser terus serve gambar lama dari cache. |
| Tiada namespace | `images/lecture.jpg` tak beritahu apa-apa tentang module atau kategori mana ia milik. |
| Tiada pengesahan | PUT boleh berjaya ke dalam bucket yang public domain-nya tak dipasang. Panel kata "uploaded", site tunjuk kosong. |
| Tiada delete | Object terkumpul selama-lamanya. |

**Konvensyen key baharu.**

```
images/<moduleSlug>/<kategori>/<timestamp>-<slug>.<ext>

images/m1-fundamental/lecture/1791578774717-lathe-setup.jpg
```

Timestamp buat setiap upload jadi key berbeza, jadi penggantian ialah URL baharu
dan tak boleh diserve basi. Ia juga tersusun mengikut masa dalam senarai bucket,
iaitu cara operator sebenarnya cari upload terbaru.

**Pengesahan baharu.** Selepas PUT, satu `HEAD` pada URL yang dipulangkan. Kalau
ia tak resolve, upload **gagal dengan kuat** sambil menamakan URL itu. Object
**sengaja tidak** dipadam bila pengesahan gagal — itu akan musnahkan upload
disebabkan kelewatan propagasi yang mungkin sementara.

### Bug 5 — Frame kosong pada halaman About awam

**Punca akar.** `TrainerPhoto.tsx` map keempat-empat `SESSION_IMAGES` tanpa
syarat, jadi fail yang tiada render fallback gradien brand. Empat frame peach
kosong muncul.

**Status: belum dibetulkan.** Ini item terkecil yang tinggal (logic sahaja, tiada
restyling).

---

## Bahagian 2 — Model data

### `content/modules.json` — tujuh module

**Sumber kebenaran: `0_7_Module_SIM_Professional_Training.pdf`. Jangan agak, tukar
nama atau susun semula.**

| slug | tajuk | hari | tahap |
|---|---|---|---|
| `m1-fundamental` | Fundamental of Scientific Molding | 2 | Foundation |
| `m2-processability` | Processability of Thermoplastics in Injection Molding | 2 | Foundation |
| `m3-fundamental-pd` | Fundamental of Scientific Molding - Process Development | 2 | Bridge |
| `m4-process-development` | Scientific Molding - Process Development | 4 | Advanced |
| `m5-parameter-setting` | Systematic Parameter Setting for Injection Molding | 2 | Bridge |
| `m6-defects-troubleshooting` | Scientific Molding: Defects Troubleshooting | 2 | Application |
| `m7-process-portability` | Scientific Molding: Process Portability | 2 | Advanced |

Jumlah: **16 hari**.

Fail ini sahaja dibaca oleh Overview admin, dropdown admin, pengurus foto
per-module **dan** menu Programs awam. Sebelum ia wujud, site bawa lima module
bawah slug berbeza — itulah sebabnya menu bercanggah dengan dokumen klien.

### Pemetaan slug lama → slug baharu

Site sebelum ini guna lima slug yang tak padan dengan PDF. Setiap module kini
bawa `legacySlug` supaya gambar yang diupload sebelum perubahan ini kekal boleh
dicapai dan bookmark lama masih resolve.

| Module PDF | slug lama site | nota |
|---|---|---|
| m1-fundamental | `fundamentals` | ditukar nama |
| m2-processability | `materials` | ditukar nama |
| m3-fundamental-pd | — | **baharu, belum ada page** |
| m4-process-development | `process-development` | ditukar nama |
| m5-parameter-setting | — | **baharu, belum ada page** |
| m6-defects-troubleshooting | `defect-troubleshooting` | ditukar nama |
| m7-process-portability | `pathway` | ⚠️ lihat Bahagian 4 — subjek berbeza |

### `content/module-photos.json` — galeri

```jsonc
{
  "modules": {
    "m1-fundamental": {
      "lecture": [], "practical": [], "discussion": [], "presentation": []
    }
    // ... satu entri per module
  }
}
```

Kedua-dua key datang daripada fail lain — slug module daripada `modules.json`,
kategori daripada `PHOTO_CATEGORIES` — jadi panel hanya boleh tulis key yang ia
diberi, dan galeri tak boleh tumbuh kategori kelima secara tak sengaja.

### Bentuk `Image`

```ts
{
  key: string         // identiti stabil, tak pernah berubah
  url: string         // URL awam yang site render
  alt: string         // penerangan untuk screen reader
  caption: string     // kapsyen yang dipaparkan, optional
  order: number       // kedudukan dalam kategorinya
  uploadedAt: string  // timestamp ISO
}
```

### Kenapa setiap gambar bawa `key`

Gambar **tidak boleh** dikenal pasti melalui index-nya. Selitkan satu foto di
atas, dan setiap index di bawahnya berganjak — kapsyen akan senyap-senyap
berpasangan dengan foto yang salah. Key dijana sekali semasa upload — diterbitkan
daripada key R2, jadi entri manifest dan object tersimpan tak boleh terpisah —
dan tak pernah berubah.

---

## Bahagian 3 — Keputusan dan sebabnya

### Nav link slug kanonikal; section jawab kedua-duanya

**Keputusan.** Menu link `#m1-fundamental`. Section masih bawa
`id="fundamentals"` **dan** dapat `<span id="m1-fundamental">` yang kosong.

**Kenapa tak tukar nama section terus.** Setiap bookmark, link luar dan hasil
carian yang sedia ada akan rosak, dan setiap assertion dalam
`check-entrance.mjs` akan gagal. Anchor kosong tak makan apa-apa dari segi visual
dan kekalkan semuanya berfungsi.

**Kesan pada checker.** `NAV_ANCHORS` kini assert slug kanonikal mesti *dilink*,
dan `LEGACY_ANCHORS` assert id lama masih *resolve*. Id lama sengaja tak dilink
lagi.

### Dua module disenarai tapi tak dilink

**Keputusan.** `m3` dan `m5` muncul dalam menu sebagai teks bertanda "coming
soon", bukan sebagai link.

**Sebab.** Anchor yang tunjuk ke id yang tiada buat apa-apa bila diklik, dan
pelawat baca itu sebagai site rosak, bukan sebagai module yang belum
diterbitkan. Merekacipta section untuk mereka ialah keputusan content, bukan
keputusan yang kod patut buat.

**Diassert.** `PENDING_MODULES` dalam `check-entrance.mjs` periksa mereka **tidak**
dilink — jadi menambah section tanpa buang ia daripada senarai itu akan
ditangkap.

### Reorder guna butang, bukan drag-and-drop

**Keputusan.** Butang naik/turun.

**Sebab.** Butang boleh dikendalikan dengan keyboard secara percuma, berfungsi di
skrin sentuh tanpa threshold drag, dan tak boleh tersalah lepas. Drag perlukan
library atau implementasi pointer buatan sendiri, fallback keyboard juga, dan
akan jadi satu-satunya interaksi dalam panel yang berkelakuan berbeza di telefon
— untuk operator yang edit sebelas foto di meja. Brief benarkan kedua-duanya.

### Reorder tak boleh delete

**Keputusan.** `PATCH` wajibkan setiap key sedia ada muncul tepat sekali.

**Sebab.** Tanpa check itu, key yang tercicir akan senyap-senyap buang satu foto
melalui apa yang operator sangka cuma susun semula — cara paling buruk untuk
hilang data.

### Manifest ditulis sebelum object dipadam

**Keputusan.** Bila delete: manifest → commit → barulah buang object.

**Sebab.** Kalau diterbalikkan, commit yang gagal akan tinggalkan site live
menunjuk ke byte yang dah tiada. Urutan ini kes terburuknya ialah object yatim,
yang cuma makan storage dan tak rosakkan apa-apa. Sama ada object itu pergi
dilaporkan dalam respons, bukan disembunyikan.

### Setiap kategori simpan sendiri

**Keputusan.** Tiada butang Save peringkat borang. Foto sudah pun berada dalam R2
bila upload pulang.

**Sebab.** Save peringkat borang kena track object yang sudah diupload tapi belum
commit dan reconcile bila gagal. Simpan per perubahan bermakna state panel dan
repository bersetuju selepas setiap tindakan.

### Kapsyen simpan on blur, bukan per keystroke

**Keputusan.** `onBlur`, dan hanya bila nilai benar-benar berubah.

**Sebab.** Simpan per keystroke akan commit ke git pada setiap aksara. Blur ialah
titik operator sudah selesai berfikir. Field yang tak disentuh tak pernah post,
jadi klik menelusuri galeri tak menghasilkan commit langsung.

### `lib/admin/registry.ts` import module secara statik

**Kenapa bukan `import()` dinamik.** Turbopack tak boleh resolve path yang dibina
daripada pemboleh ubah — ia sama ada gagalkan build atau terpaksa trace seluruh
projek ke dalam output server, iaitu masalah saiz deploy yang content store sudah
pernah hadapi. Peta import statik cuma kos satu baris per module, dan
`check-admin.mjs` assert setiap key berdaftar mesti digunakan.

### Route images baca manifest-nya sendiri

**Sebab.** `PAGE_IMAGES` ialah **output pipeline upload**, bukan teks yang
operator taip. Menyalurkan bacaan-nya melalui API content-teks ialah tepat apa
yang hasilkan Bug 2. Kekalkan baca dan tulis pada satu route bermakna mereka tak
boleh bercanggah tentang di mana manifest itu tinggal.

### `check-admin.mjs` assert perkaitan, bukan sekadar bentuk

Check yang paling menanggung beban ialah: **setiap export berdaftar mesti
digunakan melalui `withOverrides`**. Itulah check yang akan tangkap bug gambar
asal, di mana panel tulis override dan komponen terus baca default-nya sedangkan
setiap langkah melaporkan berjaya.

Ia juga assert:
- setiap route API admin panggil session guard
- setiap halaman admin panggil page guard
- senarai module padan dengan PDF tepat, pada slug, tajuk, hari dan tahap
- jumlah hari ialah 16
- setiap route yang ambil slug module mengesahkannya
- setiap kumpulan yang operator sentuh ada label manusia

---

## Bahagian 4 — Soalan terbuka dan kerja tertunggak

### Perlukan keputusan awak

**1. `pathway` bukan "Process Portability".**

Section `#pathway` yang sedia ada bertajuk *"7-Module Professional Training
Pathway"* — satu portfolio overview. m7 dalam PDF ialah *"Scientific Molding:
Process Portability"*, subjek yang berbeza. m7 sekarang dipetakan ke
`legacySlug: "pathway"`.

Akibatnya: foto yang diupload ke m7 akan masuk ke section yang bercakap tentang
benda lain. Pilihannya ialah tukar nama section itu, bina section baharu, atau
alih m7 ke anchor lain. **Saya tak ubah mana-mana copy halaman.**

**2. `m3` dan `m5` tiada halaman awam.**

Mereka ditakrifkan oleh PDF, mereka ada galeri foto dan halaman admin, tapi site
awam tiada section untuk mereka. Foto yang diupload ke situ disimpan dan
dicommit tetapi **tak pernah dipaparkan**. Sama ada section ditambah, atau mereka
kekal menu-sahaja sehingga content wujud. Awak dah sahkan: bina slot sekarang,
isi kemudian.

**3. Coolify auto-deploy belum dipasang.**

Commit sampai ke `main` dan site live tak berubah. Ini didiagnosis dengan push
satu commit kosong dan poll hash CSS yang diserve pada +3 dan +7 minit — tak
berubah kedua-duanya. Butang Deploy dalam panel menampungnya secara manual
sebaik `COOLIFY_WEBHOOK_URL` + `COOLIFY_API_TOKEN` diset, tapi auto-deploy pada
push ialah mekanisme utama yang betul.

### Semua item sudah siap

| Item | Commit | Status |
|---|---|---|
| **F** — Testimonials CRUD | `1bee5c8` | ✅ add / edit / delete / reorder / publish |
| **G** — Migrasi slot lama | `742fb8f` | ✅ `npm run migrate:images` |
| **Bug 5** — Frame kosong di About | `880bd8b` | ✅ tiada frame kosong |
| Galeri module awam | `f68b73a` | ✅ papar foto ikut 4 kategori |

### Batasan yang diketahui

- **Fallback filesystem tempatan hilang gambar bila redeploy.** Coolify rebuild
  container daripada git, jadi apa-apa yang ditulis ke `public/` semasa runtime
  akan hilang. Panel beri amaran tentang ini; R2 ialah laluan yang disokong.
- **`ADMIN_PASSWORD` masih lemah.** Ia boleh ubah content production dan upload
  ke R2. Guna `openssl rand -base64 24`.
- **Port 8000 pada host Coolify boleh dicapai dari internet awam.** Itu
  mendedahkan dashboard Coolify kepada brute-force. Elok dihadkan di firewall.
- **Galeri awam buat masa ini hanya pada Program A (m1).** Empat lagi ambil satu
  baris setiap satu apabila klien ada gambar. Menambahnya sekarang bermakna empat
  lagi child yang tak pernah render apa-apa.

### Jumlah pengesahan pada `f68b73a`

```
Build          0 error, 0 warning
check:admin    40 lulus, 0 gagal
check:entrance 602 lulus, 0 gagal
```

**Nota penting:** gate testimonial yang sebelum ini **sentiasa gagal** kini
**lulus**. Ia bukan kerana testimonial palsu dimasukkan — ia kerana placeholder
kini disembunyikan di sebalik `published: false`, jadi gate berubah daripada
"adakah section ada di page" kepada "adakah apa-apa diterbitkan", iaitu sifat
yang sebenarnya penting.

---

## Bahagian 5 — Draf M3 dan M5

M3 dan M5 **tiada PDF sumber**, jadi semua kandungan kursus untuk keduanya
**ditulis untuk semakan**, bukan diekstrak. Lima module lain ialah salinan
verbatim daripada PDF yang diluluskan.

| Fail | Isi |
|---|---|
| `content/modules/m3-fundamental-pd.json` | Draf penuh M3 |
| `content/modules/m5-parameter-setting.json` | Draf penuh M5 |
| `content/modules/module.schema.json` | Bentuk yang disahkan oleh kedua-duanya |
| `docs/m3-m5-review.md` | Senarai semak untuk trainer meluluskan setiap item |
| `scripts/check-module-drafts.mjs` | `npm run check:drafts` |

**Setiap blok dalam fail JSON bertanda `status`:**

| Tanda | Maksud |
|---|---|
| `fact` | Datang dari `content/modules.json` atau pemalar siri. Bukan draf. |
| `draft-needs-trainer-review` | **Ditulis untuk semakan. Perlu kelulusan trainer.** |

**Kedua-dua fail `published: false`**, dan tiada komponen mengimport
`content/modules/` — jadi tiada draf boleh sampai ke page. Dua module ini masih
muncul dalam menu dengan **tajuk, hari dan level sahaja**, bertanda "coming soon".

**Apa yang check ini halang:**
- Draf ditanda published sebelum content betul → build gagal
- Draf muncul dalam served HTML → build gagal
- Slug draf tak wujud dalam manifest → build gagal
- Blok tanpa `status` → build gagal

---

## Bahagian 6 — Kosong (semua kerja selesai)

Tiada kerja tertunggak yang boleh saya buat tanpa input awak. Dua isu di Bahagian
4 (pathway/m7 dan m3/m5) memerlukan keputusan content, bukan kerja kod.
