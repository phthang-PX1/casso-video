---
name: video-review-workflow
description: Quy trình soạn kịch bản + dựng preview (chưa export) + tạo gói review (âm thanh, ảnh cuối cảnh, SFX, hiệu ứng) cho video card-explainer, và cách nhận/áp dụng phản hồi chỉnh sửa theo 4 trục Sound/Script/Image/SFX. Dùng khi người dùng đưa 1 tiêu đề draft muốn dựng video, hoặc khi họ góp ý sửa 1 video đã có gói review.
---

# Video Review Workflow

> **Lưu ý (sau v6/tin-dung-la-gi)**: quy trình "gói review" mô tả dưới đây hình
> thành sớm và KHÔNG còn là cách duyệt chính — dự án tin-dung-la-gi thực tế
> chuyển sang duyệt trực tiếp qua Remotion Studio (xem
> [card-video-production SKILL mục 2](../card-video-production/SKILL.md)),
> nhanh hơn vì không cần render still mỗi lần sửa. Nguồn lời đọc cũng đã
> chuyển sang `content/<slug>.json` (không phải "1 file kịch bản .md tự do"
> như mục 1 dưới mô tả) — xem
> [card-video-production SKILL mục 3](../card-video-production/SKILL.md).
> `content/scene_manifest.json` mặc định cũ đã bị xoá vì sai hoàn toàn so với
> composition thật; dùng quy trình này chỉ khi cần bàn giao review OFFLINE
> (không mở được Studio), và phải tự dựng 1 manifest mới đúng schema mục 3
> trước, không dùng file mẫu cũ.

Hệ thống lặp: **tiêu đề draft → kịch bản + dựng preview (KHÔNG export) → gói
review → phản hồi → áp dụng sửa → gói review mới → ... → khi user duyệt mới
export MP4 thật.**

Nguồn stack/gotcha kỹ thuật: [video-stack SKILL](../video-stack/SKILL.md).
Nguồn màu thương hiệu: [docs/01_brand_palette.md](../../docs/01_brand_palette.md).

---

## 1. Từ tiêu đề draft → dựng preview

1. Đọc `docs/00_production_planning.md` + `docs/asset_catalog.md` + kho
   `svg/` (unDraw, 1377 file) nếu cần illustration mới.
2. Viết kịch bản: 1 file `content/scripts/<slug>.md` (lời đọc từng cảnh, theo
   mẫu đã có ở `content/scripts/tin_dung_la_gi_v5_actual.md`).
3. Sinh giọng đọc (capcut-tts-api) + whisper timestamp cho từng cảnh — theo quy
   trình đã có trong `video-stack` SKILL mục 4-5.
4. Viết/khởi tạo `content/scene_manifest.json` cho video này (schema ở mục 3
   dưới) — đây là NGUỒN DỮ LIỆU DUY NHẤT để sinh gói review, và cũng là nơi áp
   dụng mọi phản hồi chỉnh sửa sau này.
5. Dựng các component cảnh trong `app/src/cards/` (dùng SceneCard, GSAP layered
   entrance, idle pulse, UndrawReveal... theo pattern đã có trong project).
6. **KHÔNG chạy `remotion render` ra MP4 ở bước này.** Chỉ cần compile được
   (`npm run lint` sạch) để render still.

---

## 2. Sinh gói review

Chạy:
```bash
node app/scripts/generate_review_package.cjs content/scene_manifest.json review/<slug>
```
Script này (đọc kỹ trước khi sửa: [app/scripts/generate_review_package.cjs](../../app/scripts/generate_review_package.cjs)):
- Render **khung hình CUỐI** của mỗi cảnh (`remotion still --frame=<end-1>`) —
  chọn khung cuối vì cảnh có nhiều animation/motion, khung cuối là trạng thái
  "đã ổn định", dễ hình dung nhất bằng 1 ảnh tĩnh.
- Copy toàn bộ file âm thanh (nhạc nền + từng SFX được tham chiếu trong
  manifest) vào `review/<slug>/sound/` — để mở nghe trực tiếp.
- Xuất `review/<slug>/review.md`: bảng theo từng cảnh — mốc thời gian / lời đọc
  / ảnh cuối cảnh / mô tả hiệu ứng / danh sách SFX kèm link nghe.

Sau khi chạy xong, gửi cho user:
- `review/<slug>/review.md` (và các ảnh `*_final.png` đi kèm — dùng
  `SendUserFile` để cả ảnh và review.md tới người dùng).
- Từng file âm thanh trong `sound/` (đặc biệt file nhạc nền) — để họ bật nghe.

---

## 3. Schema `content/scene_manifest.json`

```json
{
  "title": "...",
  "compositionId": "TenCompositionInRoot.tsx",
  "fps": 30,
  "version": "v1",
  "backgroundSound": {
    "file": "app/public/sfx/...",
    "volumeRelativeDb": -18,
    "loop": true,
    "description": "...",
    "isRealMusic": true|false,
    "note": "..."
  },
  "scenes": [
    {
      "id": "card_x",
      "title": "...",
      "component": "CardXName",
      "durationFrames": 300,
      "narration": "lời đọc đầy đủ",
      "audioFile": "app/public/audio/card_x.mp3",
      "visualDescription": "...",
      "effects": ["..."],
      "illustration": { "source": "svg/xxx.svg", "component": "XxxIllustration" } | null,
      "dataDisclaimer": "..." ,
      "sfx": [{ "kind": "pop|whoosh|...", "timing": "mô tả thời điểm", "file": "app/public/sfx/..." }]
    }
  ]
}
```
Mỗi cảnh trong manifest PHẢI khớp với `durationFrames` thật trong
`CARD_DURATIONS`/`Series.Sequence` của composition — sai lệch làm review.md ghi
sai mốc thời gian.

---

## 4. Nhận và áp dụng phản hồi — 4 trục

Người dùng góp ý theo 1 trong 2 cách cho mỗi trục: **thay trực tiếp** (đưa file/
text cụ thể) hoặc **mô tả mong muốn** (để tự tìm/tự soạn). Xử lý như sau:

### Sound (âm thanh nền)
- Thay trực tiếp: user gửi file nhạc → copy vào `app/public/sfx/`, cập nhật
  `backgroundSound.file` trong manifest + trong code (`<Audio loop volume=.../>`
  ở component gốc của composition).
- Mô tả: tra `metadata/background.json`/`metadata/sfx.json` (asset đã cataloged)
  xem có mục nào khớp mood; nếu không có, nói thẳng là chưa có nguồn phù hợp
  trong kho, đừng tự bịa link ngoài.

### Script (lời đọc)
- Thay trực tiếp: user cho câu mới → cập nhật `narration` trong manifest +
  `content/scripts/<slug>.md`, **sinh lại TTS + whisper timestamp CHỈ cho cảnh
  đó** (không chạy lại toàn bộ pipeline), cập nhật `narrationTimestamps.ts`.
- Mô tả: viết lại câu theo ý mô tả, xác nhận lại với user trước khi sinh TTS
  (tốn thời gian generate audio, tránh sinh sai rồi phải làm lại).

### Image cuối cảnh (bao gồm asset/illustration bên trong, không chỉ nền)
- User upload ảnh mẫu + mô tả: ảnh mẫu là THAM CHIẾU PHONG CÁCH/BỐ CỤC, không
  phải để nhúng thẳng (trừ khi họ nói rõ "dùng đúng ảnh này làm asset"). Đọc mô
  tả để biết đổi phần nào: nền / illustration / icon / layout.
  - Nếu đổi illustration → tìm file phù hợp trong `svg/` (1377 file unDraw),
    chạy `app/scripts/process_undraw.cjs` để tách lớp bg/body/accent, xác minh
    bằng `remotion still` trước khi báo xong (bài học từ `savings.svg` render
    mờ — luôn render thử, đừng tin phân loại màu tự động).
  - Nếu đổi layout/bố cục → sửa component cảnh tương ứng trong `app/src/cards/`.
- Cập nhật `visualDescription` + `illustration` trong manifest cho khớp.

### SFX
- Thay trực tiếp: user gửi file → copy vào `app/public/sfx/`, cập nhật
  `sfx[].file` trong manifest + `<SfxCue kind=... />` trong component.
- Mô tả: tra `metadata/sfx.json` theo `use_when`/`emotional_tone`; nếu không có
  mục khớp, nói rõ chưa có SFX phù hợp trong kho thay vì chọn đại 1 file gần
  giống.

Sau khi áp dụng bất kỳ thay đổi nào: chạy lại
`node app/scripts/generate_review_package.cjs` để sinh gói review MỚI (ghi đè
thư mục `review/<slug>/`), gửi lại cho user — lặp lại tới khi họ duyệt.

---

## 5. Khi nào export MP4 thật

Chỉ chạy `npx remotion render <compositionId> out/<file>.mp4` sau khi user xác
nhận đã duyệt gói review (không tự ý export khi còn đang trong vòng góp ý —
export tốn thời gian hơn nhiều so với still, và mỗi lần sửa nhỏ không cần render
lại cả video).
