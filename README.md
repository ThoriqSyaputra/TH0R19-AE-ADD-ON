# TH0R19 AE — Blender Add-on (Phase 2)

Blender Add-on (Python murni, Blender API, target **Blender 4.5**) yang membaca
`thor19_scene.json` hasil export plugin After Effects TH0R19 AE dan merekonstruksi
scene-nya di Blender: Camera Orthographic + satu object **Grease Pencil** per Shape
Layer, lengkap dengan Bezier path (vertex/handle/closed-open), transform, dan animasi.

Sisi After Effects **tidak diubah sama sekali** — add-on ini murni menyesuaikan diri
dengan struktur JSON yang sudah ada.

## Struktur File

```
th0r19_ae/
├── __init__.py              <- bl_info + register()/unregister()
├── panel.py                 <- View3D > Sidebar (N) > "TH0R19 AE"
├── operators.py              <- Browse JSON, Reload Scene, Clear Log
├── json_loader.py            <- baca & validasi thor19_scene.json
├── scene_builder.py          <- orkestrator: collection, scene settings, camera, layer, UUID diff
├── camera_builder.py         <- Camera Orthographic sesuai Composition
├── grease_pencil_builder.py  <- Shape Layer -> Grease Pencil object (Bezier strokes)
├── animation_builder.py      <- evaluator keyframe + native transform keyframing
├── coordinate_converter.py   <- konversi koordinat AE <-> Blender + matriks 2D
├── uuid_manager.py           <- create/update/delete berbasis UUID (anti-duplicate)
├── auto_refresh.py           <- polling file JSON, auto Reload Scene
├── logger.py                 <- log timestamp -> panel STATUS
├── settings.py                <- PropertyGroup di Scene (json_path, auto_refresh, pixel_scale, ...)
└── utils.py                   <- helper umum (frame<->time, lerp, dll)
```

## Instalasi

1. Compress folder `th0r19_ae` menjadi `th0r19_ae.zip` (folder `th0r19_ae` sendiri
   yang di-zip, bukan isinya langsung).
2. Blender 4.5 → `Edit > Preferences > Add-ons > Install...` → pilih `th0r19_ae.zip`.
3. Centang add-on **"TH0R19 AE - Scene Reconstruction Engine"** untuk mengaktifkannya.
4. Buka `View3D`, tekan `N` untuk sidebar, buka tab **TH0R19 AE**.

## Cara Pakai

1. Export `thor19_scene.json` dari After Effects (plugin TH0R19 AE Phase 1).
2. Di Blender, klik ikon folder di sebelah **Scene JSON**, pilih file tersebut.
3. Klik **Reload Scene**.
4. Scene langsung terbentuk: Camera Orthographic + satu object Grease Pencil per
   Shape Layer, lengkap transform & animasi. Semua proses tercatat di **STATUS**.
5. (Opsional) Centang **Auto Refresh** — setiap kali `thor19_scene.json` berubah di
   disk (misalnya kamu export ulang dari After Effects), Blender otomatis menjalankan
   Reload Scene lagi tanpa membuat object duplikat.
6. **Pixel Scale** mengatur konversi 1 pixel AE = berapa unit Blender (default 0.01).

## Bagaimana Rekonstruksinya Bekerja

- **Identity & Update**: setiap object yang dibuat add-on ini ditandai dengan custom
  property `th0r19_uuid` yang nilainya sama persis dengan UUID dari JSON. Reload
  Scene mencocokkan UUID: ada → update object yang sama; belum ada → buat baru;
  sudah tidak ada di JSON → dihapus. Tidak pernah duplikat.
- **Koordinat**: composition AE (X kanan, Y bawah, origin kiri-atas) dikonversi ke
  Blender (X kanan, Y atas, origin di tengah composition) dengan satu kali flip
  sumbu Y di titik akhir konversi — bukan mirror, karena arah "atas" kamera Blender
  juga ikut berbalik, sehingga hasil render tetap sama seperti di After Effects
  (tidak mirror/flip/rotate/offset). Rotasi Shape Group dihitung langsung di ruang
  AE sebelum konversi; rotasi Shape Layer sendiri diberi tanda negatif karena
  diterapkan native oleh Blender setelah konversi — kedua pendekatan sudah
  diverifikasi matematis (lihat komentar di `coordinate_converter.py`) supaya arah
  visual rotasinya identik dengan After Effects.
- **Hierarki Shape Group**: karena satu Shape Layer = satu object Grease Pencil
  (bukan object terpisah per grup), transform tiap Shape Group (anchor/position/
  scale/rotation/skew) di-*bake* langsung ke posisi setiap titik saat stroke
  dibangun. Transform milik Layer itu sendiri (Position/Rotation/Scale/Opacity)
  dipasang sebagai transform Blender native (bisa dianimasikan dengan keyframe asli
  Blender) di object Grease Pencil-nya.
- **Bezier Path**: setiap Path shape menjadi satu stroke Grease Pencil dengan
  `curve_type = 'BEZIER'`. Jumlah titik dipertahankan persis (tidak resample), dan
  Handle Left/Right ditulis melalui `GreasePencilDrawing.attributes` (`handle_left`,
  `handle_right`, dengan `handle_type_left/right` diset ke `FREE` supaya Blender
  tidak menghitung ulang handle secara otomatis).
- **Path Animation**: jika path shape ATAU salah satu leluhur Shape Group-nya
  animated, add-on membangun **satu Grease Pencil frame per frame AE** di seluruh
  rentang keyframe-nya (bukan mengandalkan interpolasi Blender), sesuai permintaan —
  akurasi diprioritaskan di atas jumlah data.
- **Transform Keyframe** (Position/Rotation/Scale/Opacity milik Layer) dipasang
  sebagai keyframe Blender native, dengan tipe interpolasi Blender yang dipetakan
  dari tipe AE: `LINEAR→LINEAR`, `HOLD→CONSTANT`, selain itu `BEZIER`. Opacity
  disimpan sebagai custom property `th0r19_opacity` yang animatable (dipakai
  belakangan untuk driver/material jika dibutuhkan).

## Catatan Jujur (Keterbatasan yang Perlu Diketahui)

- **Grease Pencil 3.0** (arsitektur baru sejak Blender 4.3) menyimpan data Bezier
  handle sebagai *attribute* generik (`handle_left`/`handle_right`) yang **belum
  didokumentasikan resmi** oleh Blender (lihat
  [Blender bug tracker #126610](https://projects.blender.org/blender/blender/issues/126610)).
  Add-on ini menulis ke attribute tersebut berdasarkan konvensi penamaan yang
  konsisten dipakai di seluruh sistem Curves Blender, dan sudah diverifikasi lewat
  simulasi matematis di luar Blender — tapi karena API ini resmi belum
  didokumentasikan, ada kemungkinan kecil nama/domain attribute sedikit berbeda di
  build Blender tertentu. Jika itu terjadi, add-on **tidak akan crash**: posisi
  titik & bentuk kurva tetap 100% akurat (karena posisi ditulis lewat API resmi
  `point.position`), hanya handle Bezier yang mungkin memakai default Blender
  (biasanya `AUTO`) — dan STATUS log akan menampilkan warning yang jelas jika itu
  terjadi, supaya mudah dilaporkan untuk diperbaiki.
- **Interpolasi Bezier temporal AE** (ease/influence numerik) tidak ikut diekspor
  oleh JSON Phase 1 (hanya tipe `LINEAR`/`BEZIER`/`HOLD` yang tersimpan, sesuai
  struktur yang memang tidak boleh diubah). Karena itu, easing kurva `BEZIER` di
  Blender memakai kurva bezier default Blender (mendekati, bukan identik secara
  matematis) — sementara `LINEAR` dan `HOLD` sudah 100% identik karena tidak
  memerlukan data ease tambahan.
- Fill/Stroke warna, Effects, Text, Mask, dan elemen lain di luar scope Phase 1
  JSON otomatis tidak ada — sesuai keputusan untuk tidak mengubah exporter AE.
