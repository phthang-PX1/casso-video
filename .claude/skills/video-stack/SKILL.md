---
name: video-stack
description: Tra cứu toàn bộ tech stack dựng video card-explainer của project này (Remotion, @antv/infographic, reicon, capcut-tts-api, whisper, GSAP, rough-notation, lottie-react, undraw) — dùng khi nào, dùng ra sao, và các lưu ý/gotcha đã phát hiện lúc cài đặt. Dùng khi viết code scene, chọn công cụ minh họa, tạo giọng đọc/phụ đề, hoặc debug lỗi liên quan các lib này.
---

# Video Stack Reference

Nguồn quyết định stack: [docs/00_production_planning.md](../../docs/00_production_planning.md).
Schema asset đi kèm: [docs/asset_metadata_schema.md](../../docs/asset_metadata_schema.md).
Catalog asset thật (background/sound/character/effect, đọc trước khi chọn asset cho scene):
[docs/asset_catalog.md](../../docs/asset_catalog.md) + [metadata/index.json](../../metadata/index.json).
Bảng màu thương hiệu (đọc trước khi gán màu cho bất kỳ chữ/nền/icon nào trong scene):
[docs/01_brand_palette.md](../../docs/01_brand_palette.md).

Toàn bộ stack đã được **cài đặt và test chạy thật** (không chỉ cài package suông). Dưới đây là cách dùng + lưu ý rút ra từ quá trình test đó.

## 0. Kiến trúc tổng quát

```
casso-video/
├── app/                    ← project Remotion (Node/React) — lõi dựng video, MỌI asset đổ vào đây
├── reicon/                 ← repo nguồn icon/illustration + MCP server (build local tại packages/reicon-mcp)
├── capcut-tts-api/         ← Python SDK/CLI gọi TTS/STT của CapCut
├── undraw/                 ← repo PHP/Laravel, dùng MỘT LẦN để tải kho illustration SVG, KHÔNG chạy trong pipeline video
├── background/, SFX/       ← kho asset thô (video nền, âm thanh)
└── docs/
```

Remotion trong `app/` là trung tâm: mọi output từ các công cụ khác (icon SVG, audio TTS, timestamp whisper, illustration undraw) đều phải được đưa **vào trong `app/src` hoặc `app/public`** dưới dạng file tĩnh/component React rồi mới render ra MP4. Các repo còn lại (reicon, capcut-tts-api, undraw) là **công cụ sinh/lấy asset chạy ngoài**, không phải runtime của video.

---

## 1. Remotion (lõi dựng video)

- **Vị trí**: `app/` — scaffold bằng `create-video`, React 19 + TS.
- **Dùng khi**: luôn luôn — mọi scene, mọi composition.
- **Lệnh chính**:
  ```bash
  cd app
  npm run dev              # mở Remotion Studio để preview/dựng scene
  npx remotion render <CompositionId> out/<file>.mp4   # xuất video
  npm run lint              # eslint + tsc, chạy trước khi coi 1 scene là "xong"
  ```
- **Lưu ý**:
  - Composition khai báo trong [app/src/Root.tsx](../../app/src/Root.tsx) qua `<Composition id=... component=... />`. ID không tồn tại → render báo lỗi liệt kê composition available, đọc kỹ message thay vì đoán tên.
  - Lần đầu render trên máy sẽ tự tải Chrome Headless Shell (~113MB) — chỉ tốn thời gian ở lần đầu.

## 2. @antv/infographic — sinh sơ đồ/bảng/so sánh

- **Dùng khi**: cần bảng ma trận, so sánh 2 cột, sơ đồ tầng nguyên nhân, chart (bar/line/pie/wordcloud) tự động từ dữ liệu thay vì tự vẽ SVG tay.
- **Import đúng**: package export class là `Infographic` (KHÔNG phải `InfographicRenderer` — dễ đoán nhầm).
  ```ts
  import { Infographic } from '@antv/infographic';
  ```
- **Lưu ý**: package khá nặng (~8.2MB unpacked, kéo theo d3, roughjs, linkedom...). Dùng đúng lúc cần sinh sơ đồ dữ liệu, không lạm dụng cho những cảnh chỉ cần 1-2 hình đơn giản (dùng SVG tay hoặc reicon sẽ nhẹ hơn).

## 3. reicon — icon nhỏ + illustration (71k+ icon)

- **Vị trí repo**: `reicon/` (đã clone từ https://github.com/dqev/reicon.git). MCP server đã build local tại `reicon/packages/reicon-mcp`.
- **Dùng khi**: cần icon UI, avatar nhân cách hóa, ẩn dụ hình ảnh nhỏ gọn (metaphor/character/diagram_element theo schema asset).
- **Cách dùng — 2 lựa chọn**:
  1. **Package npm public đã publish sẵn** (không cần build gì, nhanh nhất):
     ```bash
     npx reicon-mcp search "shopping cart"
     npx reicon-mcp view heart --weight Filled
     npx reicon-mcp apply heart --framework react --size 32 --color "#ef4444"
     ```
  2. **Bản build local từ repo đã clone** (khi cần sửa/tuỳ biến index icon):
     ```bash
     node reicon/packages/reicon-mcp/bin/run.cjs search "heart"
     ```
     Nếu sửa code nguồn, rebuild bằng: `cd reicon/packages/reicon-mcp && npm run build` (script này cần `typescript` ở `reicon/node_modules` — đã cài sẵn khi setup).
  3. **Làm MCP server** cho agent dùng trực tiếp (search/view/apply/list_categories như tool), khai báo trong MCP client config:
     ```json
     { "mcpServers": { "reicon": { "command": "node", "args": ["reicon/packages/reicon-mcp/bin/run.cjs"] } } }
     ```
- **Lưu ý**: `apply_icon`/`apply` sinh sẵn code snippet React/Vue/... — ưu tiên dùng thay vì tự copy SVG tay để tránh sai props.
- **15 icon đã catalog sẵn** (chọn tay theo domain đối soát tài chính Casso) tại `characters/reicon/*.svg` + [metadata/character.json](../../metadata/character.json) — tra `use_when`/`avoid_when` ở đó trước khi tự search icon mới, đỡ trùng lặp.

## 4. capcut-tts-api — TTS chính (Python)

- **Vị trí**: `capcut-tts-api/` (clone từ https://github.com/K07VN/capcut-tts-api.git), cài bằng `python -m pip install -e .`.
- **Dùng khi**: cần sinh giọng đọc (voice-over) cho mọi video — đây là lựa chọn TTS chính đã chốt, KHÔNG đổi giọng trừ khi health-check thất bại.
- **Cách dùng**:
  ```python
  from capcut_tts_api import CapCutClient
  client = CapCutClient()
  response = client.generate_speech(texts="...", voice="BV421_vivn_streaming", rate="1.0", wait=True)
  ```
  CLI: `capcut-tts-api tts-new --text "..." --voice "BV421_vivn_streaming"` (thêm `--dry-run` để xem request đã ký mà không gọi API thật).
- **⚠️ LƯU Ý QUAN TRỌNG — lớp phòng vệ BẮT BUỘC (chưa implement, mới chỉ cài SDK thô)**:
  Đây là API nội bộ bị dịch ngược (reverse-engineered), rủi ro nằm ở việc CapCut có thể đổi API bất cứ lúc nào. Theo [docs/00_production_planning.md](../../docs/00_production_planning.md), **PHẢI** tự viết thêm quanh SDK này trước khi dùng cho batch sản xuất thật:
  1. **Cache theo `hash(script + voice_id)`** — lưu audio đã generate, tránh chạy lại từ đầu khi API gián đoạn giữa batch.
  2. **Health-check trước mỗi batch** — gọi thử 1 câu ngắn trước khi chạy cả video.
  3. **Fallback tự động** (Azure Neural TTS hoặc edge-tts) — chỉ kích hoạt khi health-check thất bại.
  4. **Fork riêng về server của bạn** — không pull trực tiếp từ upstream `K07VN/capcut-tts-api` mỗi lần build, vì đây là repo cá nhân nhỏ có thể đổi/gỡ bất kỳ lúc nào.
  → 4 việc này **chưa được code**, chỉ mới cài & test smoke (list-voices, dry-run). Cần làm trước khi đưa vào pipeline sản xuất hàng loạt.

## 5. @remotion/whisper-web + @remotion/install-whisper-cpp — đồng bộ hình theo giọng đọc

- **Dùng khi**: cần lấy timestamp từng từ trong audio TTS để trigger reveal layer đúng nhịp giọng đọc (tự động hoá hoàn toàn, không cần canh tay).
- **Cách dùng**:
  ```ts
  import { installWhisperCpp, downloadWhisperModel, transcribe } from '@remotion/install-whisper-cpp';
  ```
- **⚠️ Lưu ý**: package mới chỉ cài & type-check OK, **CHƯA tải binary whisper.cpp** (bước `installWhisperCpp()` tải ~100MB+, là one-time setup nặng). Phải chạy bước này **trước khi** dùng thật lần đầu để xử lý audio — đừng gọi `transcribe()` trực tiếp mà chưa cài binary, sẽ lỗi vì thiếu executable.

## 6. GSAP — easing/animation tinh tế

- **Dùng khi**: cần fade/stagger/underline-draw mượt hơn animation Remotion mặc định (interpolate tuyến tính).
- **Cách dùng**: import bình thường `import gsap from 'gsap'`.
- **⚠️ LƯU Ý QUAN TRỌNG (gotcha đã xác nhận khi test)**: GSAP mặc định chạy theo đồng hồ thực (`requestAnimationFrame`), trong khi Remotion render **từng frame độc lập** theo timeline video (không theo thời gian thực khi export MP4). Nếu dùng `gsap.to(...)`/`gsap.fromTo(...)` như animation "tự chạy" bình thường, animation sẽ **không khớp chính xác** giữa preview (real-time) và video xuất ra (frame-by-frame), dễ bị lệch nhịp hoặc đứng hình sai chỗ.
  - **Cách làm đúng khi build scene thật**: neo timeline GSAP theo `frame / fps` của Remotion (`useCurrentFrame()`), ví dụ dùng `gsap.timeline({paused: true})` rồi gọi `.seek(frame / fps)` mỗi frame, thay vì để timeline tự chạy theo thời gian thực.
  - Đã test: import + chạy được trong render thật (không crash), nhưng **chưa test pattern seek-theo-frame** — cần áp dụng đúng pattern này khi viết scene production, không copy y nguyên ví dụ animation "tự chạy" của GSAP docs.
  - Đã catalog thành `fx_card_scale_in` (đã render smoke-test) và `fx_stagger_fade_in_list` (chưa render thử) trong [metadata/effect.json](../../metadata/effect.json).

## 7. rough.js / rough-notation — hiệu ứng nét vẽ tay

- **Dùng khi**: gạch chân, khoanh tròn "tự vẽ" quanh từ khóa vừa đọc xong (theo schema asset, `tier: micro`, `triggers_on: word_boundary`).
- **Cách dùng**:
  ```ts
  import { annotate } from 'rough-notation';
  const annotation = annotate(domNode, { type: 'underline', color: '#e11d48', strokeWidth: 3 });
  annotation.show();
  ```
- **Lưu ý**: `annotate()` cần DOM node thật đã mount (dùng trong `useEffect`, không gọi lúc render). Animation "vẽ" của rough-notation cũng chạy theo thời gian thực như GSAP — cùng lưu ý về đồng bộ frame ở mục 6 áp dụng tương tự nếu cần khớp chính xác theo timestamp whisper.
- Đã catalog thành `fx_underline_draw` (tier `micro`, đã render smoke-test thật) và `fx_circle_highlight` (chưa render thử) trong [metadata/effect.json](../../metadata/effect.json).

## 8. lottie-react — icon chuyển động thật

- **Dùng khi**: cần icon "sinh động" hơn fade tĩnh, có sẵn file Lottie JSON (từ LottieFiles hoặc tự tạo).
- **Import đúng**: named export, KHÔNG phải default export (dễ nhầm vì nhiều ví dụ trên mạng dùng default).
  ```ts
  import { Lottie } from 'lottie-react';   // ĐÚNG
  // import Lottie from 'lottie-react';    // SAI — sẽ lỗi TS2613 "no default export"
  ```

## 9. undraw — nhân vật/ẩn dụ hình ảnh mở rộng

- **Vị trí**: `undraw/` (clone từ https://github.com/maartenpaauw/undraw.git). Đây là **package PHP/Laravel Blade** — KHÔNG chạy trong runtime video (Remotion là Node/React).
- **Dùng khi**: reicon không có illustration phù hợp, cần bổ sung nhân vật/ẩn dụ từ kho undraw.co.
- **Cách dùng thực tế cho project này** (một lần, để lấy asset thô, không chạy Laravel):
  ```bash
  cd undraw
  composer install
  composer download   # gọi API undraw.co, tải TOÀN BỘ illustration SVG về resources/views/components/*.blade.php
  ```
  Mỗi file `.blade.php` sinh ra thực chất chỉ là SVG thô với chỗ màu đã thay bằng placeholder `{{ $color }}` (xem [undraw/download.php](../../undraw/download.php)). Muốn dùng trong Remotion: lấy nội dung SVG trong các file này, thay `{{ $color }}` bằng mã hex thật, lưu thành `.svg` tĩnh trong `app/public/` hoặc component React trong `app/src`.
- **Môi trường cần có** (đã cài sẵn trên máy này): PHP 8.4 + Composer 2.10, extension `openssl`, `curl`, `mbstring`, `zip` đã bật trong `php.ini` — nếu setup máy mới thiếu các extension này, `composer install`/`composer download` sẽ báo lỗi rõ ràng tên extension thiếu.
- **Lưu ý**: file `phpunit.xml.dist` gốc của repo khai báo XSD schema 11.2 nhưng bản PHPUnit cài được là 12.x → chạy thẳng `vendor/bin/phpunit` báo "No tests executed" (không phải lỗi code). Muốn chạy test xác minh: `vendor/bin/phpunit --no-configuration tests`.
- **⚠️ `composer download` hiện KHÔNG dùng được**: script gọi `https://undraw.co/api/illustrations`, endpoint này trả `404` — undraw.co đã đổi sang giao diện Next.js mới, không còn API công khai đó. Đây là vấn đề bên ngoài (upstream đổi), không phải lỗi cài đặt. Vì vậy **kho `character` hiện tại (15 mục trong [metadata/character.json](../../metadata/character.json)) toàn bộ lấy từ reicon, chưa có illustration nào từ undraw**. Cần nhân vật/ẩn dụ dạng "người" thật thì phải tải SVG thủ công từ https://undraw.co/illustrations rồi tự viết metadata.

## 10. Manim — đã loại bỏ (chủ động, không phải thiếu sót)

Theo quyết định trong docs, Manim quá nặng cho style card-explainer này. Mọi chuyển động toán/hình học phức tạp thay bằng **SVG/React thuần trong Remotion** (dùng trực tiếp component + `interpolate()`/`spring()` của Remotion, không cần lib ngoài).

---

## Checklist trước khi coi 1 scene là "xong"

1. `npm run lint` trong `app/` sạch (eslint + tsc).
2. Render thử ra MP4 thật (`npx remotion render`), không chỉ xem preview Studio — preview real-time có thể che giấu lỗi đồng bộ frame (đặc biệt với GSAP/rough-notation, xem mục 6-7).
3. Nếu dùng capcut-tts-api cho batch thật: đã có cache/health-check/fallback (mục 4) chưa, hay mới gọi SDK thô.
4. Nếu dùng whisper để đồng bộ: đã chạy `installWhisperCpp()` một lần trên máy chưa.
5. Trước khi tự vẽ icon/effect mới: tra [metadata/character.json](../../metadata/character.json) và [metadata/effect.json](../../metadata/effect.json) xem đã có mục phù hợp chưa (`use_when`/`avoid_when`), tránh trùng lặp. Effect có `review.semantic = "documented_pattern_untested"` nên render thử trước khi ghép vào scene thật.
