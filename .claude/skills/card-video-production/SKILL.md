---
name: card-video-production
description: Quy trình + design system chuẩn để dựng một video card-explainer mới (dạng "X là gì?") trong hệ thống này, đúc kết từ toàn bộ quá trình dựng video tin-dung-la-gi — từ viết kịch bản, sinh giọng đọc, đồng bộ whisper, tới dựng từng card bằng bộ component dùng chung, nối card liền mạch, và review lặp với người dùng. Dùng khi bắt đầu một video card-explainer mới, hoặc khi cần đảm bảo video mới "cùng chất liệu/vibe" với video cũ.
---

# Card-Explainer Video Production

Skill này đúc kết **cách làm**, không lặp lại **cách cài đặt** — phần cài đặt/gotcha
từng công cụ đã có ở [video-stack](../video-stack/SKILL.md) (Remotion, reicon,
capcut-tts-api, whisper, GSAP, rough-notation). Đọc file đó trước nếu môi trường
chưa setup.

`video-review-workflow` mô tả một quy trình "gói review" (render still + review.md)
hình thành ở giai đoạn đầu dự án — quy trình đó **vẫn dùng được** khi cần bàn giao
review offline (không có Remotion Studio), nhưng trong thực tế cả dự án
tin-dung-la-gi được duyệt bằng cách mở **Remotion Studio thật** (`npm run dev`) và
xem trực tiếp qua Browser pane — nhanh hơn nhiều vì không cần render lại. Ưu tiên
cách này (mục 2 dưới) trừ khi người dùng cần file ảnh/review.md để xem offline.

---

## 1. Từ kịch bản tới cấu trúc card

1. Viết toàn bộ lời đọc trước, theo từng "card" (một card = một khối ý, một
   đoạn thoại/text riêng trong `content/<slug>.json`) — KHÔNG mặc định 1 card
   luôn là 1 `<Series.Sequence>` riêng: khi 2 card liền kề có liên hệ chặt
   (cùng ẩn dụ, cùng nhân vật đang nói tiếp), gộp chúng vào 1 Sequence và nối
   bằng pattern nhúng+move (mục 5) thường liền mạch hơn cắt cứng. Với 1 câu hỏi
   kiểu "X là gì?", cấu trúc nội dung đã chứng minh hiệu quả:
   - **Card 0 (hook + title)**: 1 tình huống quen thuộc dẫn vào câu hỏi. Ở video
     tin-dung-la-gi, chủ dự án chọn KHÔNG nêu tên nền tảng cụ thể (VD "Shopee" →
     "sàn Cam") — đây là **quyết định biên tập cho video/kênh đó**, không phải
     luật chung đã kiểm chứng cho mọi video hay mọi nền tảng đăng tải; hỏi lại
     chủ dự án trước khi áp dụng mặc định cho video mới.
   - **Card định nghĩa**: đi thẳng vào định nghĩa, KHÔNG lặp lại câu hỏi đã hỏi ở
     Card 0 ("Vậy X là gì?" rồi lại "X là gì?" là thừa) — nối tiếp kiểu "Vậy thì,
     hiểu đơn giản, X là...".
   - **Card ẩn dụ**: 1 hình ảnh ẩn dụ trực quan (lò xo, cán cân, dòng chảy...)
     thay vì liệt kê khái niệm suông.
   - **Card mặt trái/rủi ro**: nếu khái niệm có mặt trái, dùng đúng động từ ngữ
     nghĩa — VD "nợ xấu **xuất hiện**" (hệ quả phát sinh), KHÔNG viết "X **biến
     thành** nợ xấu" (sai bản chất — nợ xấu là hệ quả/thành phần, không phải
     trạng thái biến hình của X).
   - **Card lợi ích**: minh họa bằng hình ảnh chuyển động (biểu đồ tăng trưởng,
     hành trình...), TUYỆT ĐỐI không liệt kê 3 dòng icon+chữ tĩnh — nhìn như
     bullet list là dấu hiệu phải làm lại.
   - **Card kết (dữ liệu + câu hỏi khép)**: số liệu thật có nguồn trích dẫn, sau
     đó ẩn hết chart/data đi, phóng to câu hỏi khép, và cho `SignatureMotif` (mục
     4) bao quanh đúng từ khóa đang có sẵn trong câu — không tách riêng một dấu
     "?" đứng một mình.
2. Mỗi card là 1 file `app/src/cards/CardNName.tsx`, export component + (nếu
   card có transition-vào-card-sau) 1 hằng số `CARDN_DURATION` được tính từ
   `NARRATION` thay vì số cứng đoán chừng.
3. Composition gốc `app/src/TinDungVideo.tsx`: 1 danh sách `CARD_DURATIONS` (mỗi
   giá trị là audio thật + một khoảng hold ngắn, KHÔNG phải padding rộng rãi —
   pause dài giữa các card làm mạch xem bị ngắt) rồi `<Series>`/`<Series.Sequence>`
   theo đúng thứ tự.

## 2. Vòng lặp dựng — Studio preview, không render MP4

1. Đảm bảo `.claude/launch.json` tồn tại **ở root repo** (không phải trong
   `app/`), trỏ `npm --prefix app run dev`, port 3000 — đây là điều kiện để
   `preview_start` tìm thấy dev server.
2. `preview_start` (name trong launch.json) → `navigate` vào composition đang
   sửa → `computer` (screenshot/zoom) để xem trực tiếp thay vì
   `remotion render`/`remotion still` từng lần sửa nhỏ. Nếu screenshot timeout,
   thử lại 1 lần (page thường chỉ chưa kịp render xong).
3. Chỉ dùng `remotion still` cục bộ khi cần 1 ảnh để đọc bằng Read tool (VD zoom
   một chi tiết mà Browser pane không crop được).
4. Sau khi user duyệt 1 card, `mark_chapter` nếu chuyển hẳn sang card khác (giúp
   theo dõi tiến độ), rồi tiếp tục card kế.
5. `npm run lint` (eslint + tsc) phải sạch trước khi coi 1 card là xong — lint
   bắt được nhiều lỗi kiểu (xem mục 5) mà preview không lộ ra ngay.

## 3. Giọng đọc + đồng bộ thời gian — 1 nguồn sự thật duy nhất

Toàn bộ lời đọc của 1 video nằm ở **đúng 1 file**: `content/<slug>.json`
(VD `content/tin-dung-la-gi.json`) — mảng `cards`, mỗi phần tử có `id`,
`component`, `text`, và (nếu scene này được nhúng vào scene khác thay vì có
`Series.Sequence` riêng) `embeddedIn`. Cả `scripts/generate_narration.py`
(sinh TTS) lẫn `app/scripts/gen-timestamps.cjs` (đồng bộ whisper) đều đọc
CHÍNH file này — không còn bản copy thứ hai của lời đọc ở đâu khác.
`metadata/narration.json` và `app/src/narrationTimestamps.ts` là **output sinh
ra**, không phải nguồn — không sửa tay 2 file đó.

Quy trình khi thêm/sửa 1 card (sửa `content/<slug>.json` trước, luôn):
```bash
python scripts/generate_narration.py --card card_x   # chỉ sinh lại card đã đổi (cache theo hash text+voice+rate)
node app/scripts/transcribe-one.mjs card_x           # whisper cho riêng card vừa đổi
node app/scripts/gen-timestamps.cjs                  # rebuild narrationTimestamps.ts (đọc lại toàn bộ metadata/whisper/*.json)
```
`generate_narration.py` không gọi lại API cho card không đổi (cache theo
`sha256(voice|rate|text)` ở `metadata/tts_cache/index.json`), và kiểm tra kích
thước file tải về trước khi ghi đè — tránh vô tình ghi đè audio tốt bằng 1 lần
gọi API lỗi.

**`gen-timestamps.cjs` giờ FAIL CỨNG (exit 1) nếu word-count giữa whisper và
`content/<slug>.json` không khớp** — không còn âm thầm tiếp tục với timestamp
đoán mò. Chỉ dùng `--allow-mismatch` khi cố ý chấp nhận trôi timing ở cuối
câu; mặc định phải sửa lại text hoặc transcribe lại. Script cũng in cảnh báo
riêng cho từng từ có duration bằng 0 frame (whisper không tách được ranh giới
— vẫn dùng được nhưng nên biết).

Mỗi card trong `NARRATION` (từ `narrationTimestamps.ts`) có 2 trường thời
lượng KHÔNG PHẢI là một — dùng nhầm sẽ tạo khoảng lặng hoặc cắt sớm:
- `speechEndFrame` — frame từ cuối cùng (theo whisper) kết thúc. Dùng cho các
  quyết định nội dung: "bắt đầu beat tiếp theo khi câu vừa dứt".
- `mediaDurationFrames` — frame thật của FILE audio (đo bằng ffprobe), thường
  dài hơn `speechEndFrame` một chút (còn khoảng lặng/room-tone cuối file).
  Dùng để giới hạn `<Sequence durationInFrames>` bọc `<Audio>` — không dùng
  `speechEndFrame` cho việc này, sẽ cắt audio hụt so với file thật.
(`audioDurationFrames` vẫn còn nhưng đã deprecated, tương đương
`speechEndFrame` — code cũ chưa sửa vẫn chạy được, code mới nên dùng 2 trường
trên cho rõ nghĩa.)

Trong component, lấy mốc frame bằng `findWord("card_x", "từ khóa")?.startFrame`
— nếu 1 từ xuất hiện nhiều lần trong câu, truyền thêm tham số thứ 3
(`findWord("card_x", "từ khóa", 1)` = lần xuất hiện thứ 2) để chọn đúng lần.
Với cue mà thiếu nó sẽ làm hỏng rõ rệt cả cảnh (mũi tên không có điểm đến, hiệu
ứng không có điểm kích hoạt), dùng `requireWord(...)` thay vì `findWord(...)?.
startFrame ?? <số đoán>` — `requireWord` throw ngay khi build nếu không tìm
thấy, thay vì âm thầm rơi vào số đoán sai lệch mà không ai biết.

Frame nào tính được từ `NARRATION` (offset chuyển cảnh, điểm nối, độ dài audio)
thì PHẢI tính từ đó, không hardcode — nếu không, sửa lời đọc ở
`content/<slug>.json` sẽ không tự cập nhật các mốc phụ thuộc (đã từng xảy ra ở
Card 1: `DEFINITION_OFFSET`/`MOVE_START`/`MOVE_END` từng là số cứng 238/234/280,
nay tính từ `NARRATION.card_1.speechEndFrame`).

## 4. Bộ component design system dùng chung (đừng viết lại)

- **`theme.ts`** — `COLORS` (brandSolid/Hover/Pressed #00A85E hệ, canvas/canvasAlt,
  negativeTemp/neutralTextTemp/neutralMutedTemp — các token `*Temp` là placeholder
  chờ token thật, xem `docs/01_brand_palette.md`), `FONT_FAMILY` (Inter),
  `DISPLAY_FONT_FAMILY` (Anton, dùng cho tiêu đề/motif, nạp qua
  `@remotion/google-fonts` — package này CHỈ quản lý việc chờ font load xong
  trước khi render frame, KHÔNG bundle font cục bộ; máy chạy Studio/render vẫn
  cần mạng để tải từ `fonts.gstatic.com`. Nếu cần render hoàn toàn offline,
  phải tự host file font).
- **`CardScene`** — khung chuẩn cho Card 1-5: gradient thương hiệu +
  `BackgroundMotion` (video nền loop, mixBlendMode overlay, để nền không bao giờ
  tĩnh tuyệt đối) + 1 thẻ trắng bo góc. Nội dung đặt trong toạ độ tuyệt đối
  1080×1920, giữ trong vùng x:116–964, y:230–1690 để không tràn ra ngoài thẻ.
- **`SignatureMotif`** — khối "chữ ký" thương hiệu (theo đúng Figma node
  167:205): 2 chấm góc → viền đen lệch vẽ bằng `pathLength` → khối xanh quẹt vào
  bằng `clip-path` → chữ trắng hiện. Dùng để nhấn TỪ KHÓA (không phải để bọc cả
  câu) — ví dụ bọc "TÍN DỤNG" trong câu hỏi khép ở Card cuối.
- **`Spring`/`springPath`** (`app/src/Spring.tsx`) — lò xo xoắn ốc tham số hoá
  (coils/radius/length), vẽ bằng `pathLength`/`strokeDashoffset`. Nếu 2 card
  dùng cùng ẩn dụ lò xo, PHẢI dùng chung hằng số `SPRING` để cắt cảnh liền mạch
  tuyệt đối (không tự vẽ lại lò xo riêng cho card sau — đã từng gây lỗi "đứt
  hình" khi 2 card vẽ lò xo bằng công thức khác nhau).
- **`useIdlePulse(sinceFrame, opts)`** — gắn vào phần tử MINH HỌA đã "ổn định"
  (nhân vật, icon, khối trang trí đứng yên chờ hết narration). Video
  card-explainer có clip narration dài 8-12s nhưng animation vào chỉ ~1s —
  không có idle pulse thì phần lớn thời lượng là khung hình tĩnh tuyệt đối (đã
  đo được bug này ở bản đầu). KHÔNG áp dụng máy móc cho mọi thứ: chữ đang cần
  đọc, số liệu, nhãn trên biểu đồ... nên đứng yên để dễ đọc — rung nhẹ liên tục
  ở đúng chỗ đang cần tập trung đọc là phản tác dụng. Coi đây là 1 lựa chọn có
  chủ đích theo vai trò của từng phần tử, không phải quy tắc "mọi phần tử đều
  phải rung".
- **`UndrawReveal`** — bọc 1 illustration đã qua `process_undraw.cjs`, reveal
  layered qua GSAP timeline neo theo `startFrame/fps` (bg → body → accent), stagger
  bouncy cho accent. KHÔNG dùng `gsap.to()` tự chạy theo thời gian thực trong
  component video — luôn seek theo frame (xem gotcha ở video-stack mục 6).
- **`Icon`** (`ICONS` từ `app/src/icons.ts`, auto-generated bởi
  `app/scripts/gen-icons.cjs` từ `characters/reicon/*.svg`) + **`SfxCue`** (2 kind:
  `pop` cho reveal icon/keyword, `whoosh` cho chuyển cảnh) — gắn SfxCue ở MỌI
  điểm reveal quan trọng, im lặng hoàn toàn không có SFX là dấu hiệu thiếu sức
  sống.
- **`BackgroundMotion`** — video nền loop mờ dưới gradient, dùng `<Loop>` (không
  dùng prop `loop` trên `OffthreadVideo`, phiên bản Remotion này không có prop
  đó).

## 5. Gotcha đã root-cause — áp dụng lại nếu gặp lại

- **`process_undraw.cjs` (unDraw SVG → React component)**: PHẢI tag từng shape
  bằng `data-layer` **tại chỗ**, giữ nguyên thứ tự vẽ gốc trong 1 blob duy nhất —
  KHÔNG regroup shape vào 3 `<g>` xếp chồng theo layer. Regroup làm sai z-index
  (từng khiến 1 shape xanh vẽ đè lên mặt nhân vật). Luôn strip `<defs>` trước khi
  match shape (tránh 1 `<rect>` trong `<clipPath>` bị nhận nhầm thành hình thật).
  Sau khi sinh illustration mới, LUÔN render thử bằng Studio/still trước khi báo
  xong — phân loại màu tự động có thể sai với ảnh lạ.
- **GSAP trong Remotion**: timeline phải `paused: true` + seek theo
  `frame/fps`, không để chạy real-time — nếu không animation preview và video
  xuất ra sẽ lệch nhau.
- **TypeScript array literal bị widen kiểu** khi vừa khai báo vừa `.map()` cùng
  lúc (VD mảng chứa `icon: IconName` bị widen thành `string`) — tách thành 2
  bước: `const X_BASE: {...}[] = [...]` (khai báo tường minh kiểu) rồi
  `const X = X_BASE.map(...)` (để TS suy luận, giữ literal union).
- **`.claude/launch.json` phải ở root repo**, không phải trong `app/` — nếu
  không `preview_start` báo không tìm thấy file.
- **Chuyển cảnh liền mạch giữa 2 card** (thay vì cắt cứng, và thay vì luôn coi
  "1 card = 1 `Series.Sequence`" — Card 1→2 và Card 3→3b đã chứng minh 1 khối ý
  không nhất thiết là 1 cảnh cắt riêng): nhúng card sau vào bên trong
  `<Sequence>` của card trước (`embedded` prop để card sau tự bỏ
  background/whoosh riêng khi được nhúng), rồi dùng 1 `interpolate` chung
  (`Easing.inOut(Easing.cubic)`) để "move" object dùng chung (nhân vật, icon...)
  từ toạ độ/scale của card trước sang toạ độ/scale của card sau. Khi làm theo
  pattern này, quyết định rõ 4 điều trước khi code: (1) phần tử nào tồn tại
  xuyên suốt cả 2 card (chỉ "move", không unmount/remount), (2) card nào sở
  hữu nền/`CardScene`/SFX-nền (chỉ 1 trong 2, card kia phải tắt qua `embedded`),
  (3) audio 2 card map vào timeline chung ra sao (xem dưới), (4) tại điểm nối,
  phần nào move, phần nào fade, phần nào cắt thẳng.
  **Lưu ý: `trimBefore` chỉ cắt phần đầu của audio thứ hai — đây là NỐI liền
  mạch (audio 1 dừng đúng lúc audio 2 bắt đầu), KHÔNG phải crossfade thật.**
  Crossfade thật cần 1 khoảng chồng lấp (audio 2 bắt đầu trước khi audio 1 kết
  thúc) + đường âm lượng chéo nhau (`volume={(f) => ...}` giảm dần audio 1,
  tăng dần audio 2) — nếu 2 giọng đọc chồng lên nhau sẽ đè nhau, khó nghe, nên
  cách nối hiện tại (cắt liền, không chồng) là lựa chọn đúng cho 2 câu nói nối
  tiếp nhau, không phải hạn chế cần sửa. Cách nối kiểu embed+move đã dùng cho
  Card1→Card2 (glide nhân vật+ngân hàng) và Card3→Card3b (ghép chung 1 spring,
  2 audio nối liền không chồng).

## 6. Checklist trước khi coi 1 card là "xong"

1. `npm run lint` sạch (eslint + tsc).
2. Xem trực tiếp trong Remotion Studio (mục 2), không chỉ tin code compile được.
3. Có SFX ở mọi điểm reveal quan trọng; có `useIdlePulse` ở mọi phần tử đã ổn
   định; không có khung hình nào "chết" quá lâu.
4. Lời đọc trong component khớp 100% với `content/<slug>.json` (mục 3) —
   `gen-timestamps.cjs` chạy xong không lỗi (mismatch giờ fail cứng, không còn
   là cảnh báo có thể bỏ qua).
5. Nếu card này nối tiếp card khác: đã kiểm tra điểm nối không có khoảng lặng dài,
   và (nếu áp dụng) đã dùng pattern nhúng+move ở mục 5 thay vì cắt cứng.
6. Từ ngữ nhạy cảm đã kiểm tra với chủ dự án theo từng video cụ thể (không mặc
   định áp luật của video trước cho video mới — mục 1); động từ mô tả quan hệ
   nhân-quả đúng bản chất (không quy đổi ẩu giữa khái niệm và hệ quả của nó).
7. Kiểm tra chuyển động/điểm nối/âm thanh bằng cách render thử MỘT ĐOẠN NGẮN
   (`npx remotion render TinDungLaGi out/check.mp4 --frames=<from>-<to>`, không
   phải cả video) quanh điểm vừa sửa — xem trực tiếp trong Studio chỉ bắt được
   lỗi bố cục tĩnh, không bắt được lỗi chuyển động/easing/điểm nối audio (2
   thứ này chỉ lộ ra khi phát thật theo frame). Render TOÀN BỘ MP4 chỉ khi
   người dùng đã duyệt và yêu cầu bàn giao — không tự ý render full khi còn
   đang trong vòng góp ý.
8. Nếu cần 1 bộ ảnh để gửi review offline (không mở được Studio): frame cuối
   cảnh KHÔNG phải lúc nào cũng là frame đại diện đúng — kiểm tra thủ công
   card nào có nội dung chính ở giữa/đầu cảnh (VD frame cuối Card 1 hiện là
   phần định nghĩa của Card 2 đã nhúng vào; frame cuối Card 5 đã ẩn hết biểu
   đồ) và chọn đúng mốc nội dung + mốc điểm nối, đừng lấy máy móc "frame cuối"
   của toàn Sequence.

## 7. Quyết định thiết kế đã chốt (đọc trước khi "tiện tay" đổi lại)

- **Card 0 dùng `PaperGridScene`** (`app/src/PaperGridScene.tsx`), khác nền với
  `CardScene` của Card 1-5 — đây là 1 hệ nền riêng cho phần hook/title, không
  phải thiếu nhất quán.
- Dấu gạch nối hiển thị trên màn hình dùng ký tự `-` thường (có khoảng trắng 2
  bên, VD "trả sau - kèm lãi"), không dùng em dash `—` trong text hiển thị cho
  người xem (em dash vẫn dùng bình thường trong code/comment/tài liệu).
- Từ Card 1 trở đi, KHÔNG dùng `eyebrow` (nhãn nhỏ góc trên-trái của
  `CardScene`) nữa — bố cục nội dung tự nói lên ngữ cảnh, nhãn góc chỉ dùng ở
  các bản nháp đầu.
- Khi 1 hình minh họa/mũi tên gắn với 1 câu/khối ý cụ thể, nó phải biến mất
  CÙNG NHỊP với câu đó kết thúc (cùng khoảng `interpolate`, không lệch pha) —
  không để hình đứng lại mồ côi sau khi ý đã chuyển sang phần khác (đây là lý
  do `targetsFade`/`fadeOut` ở Card 1 dùng chung `BANK_FRAME` với phần xuất
  hiện tiếp theo, thay vì mốc riêng).
- Khi 2 card/2 đoạn liền kề nói về CÙNG một đối tượng hình ảnh (nhân vật, ngân
  hàng...), ưu tiên giữ nguyên object đó xuyên suốt (dùng pattern nhúng+move ở
  mục 5) thay vì unmount rồi tạo lại object tương tự ở card sau — giữ liên tục
  giúp người xem không phải "nhận diện lại" một hình mới.

## 8. Việc còn nợ (áp dụng khi bắt đầu video mới cũng cần biết)

- `capcut-tts-api` mới dùng SDK thô — 4 lớp phòng vệ (cache theo hash, health-check
  trước batch, fallback TTS khác, fork riêng) **chưa implement**, xem chi tiết ở
  [video-stack SKILL mục 4](../video-stack/SKILL.md).
- Chưa có nhạc nền thật (chỉ có `ambient-pad.wav` là room-tone tạm) — nếu video
  mới cần nhạc, tra `metadata/sfx.json`/`metadata/background.json` trước, đừng
  tự tạo/tự bịa nguồn.
- `COLORS.negativeTemp`/`neutralTextTemp`/`neutralMutedTemp` là token tạm — thay
  bằng token thật ngay khi `docs/01_brand_palette.md` được cập nhật đầy đủ.
- `generate_narration.py` giờ đã cache theo hash + có thể chạy `--card`, nhưng
  **chưa có checkpoint/resume giữa chừng 1 batch nhiều card** (nếu API lỗi ở
  card thứ 5/8, 4 card trước đã cache nên không sinh lại, nhưng vẫn phải chạy
  lại lệnh từ đầu) và **audio của mọi video đều ghi chung vào
  `app/public/audio/card_x.mp3`** — 2 video khác nhau cùng dùng id `card_1` sẽ
  ghi đè lẫn nhau. Khi có video thứ 2, việc đầu tiên cần làm là tách theo
  `app/public/audio/<slug>/card_x.mp3` (và cập nhật `staticFile(...)` ở mọi
  card cho khớp) trước khi dựng song song 2 video.
- Không còn `content/scene_manifest.json`/gói-review-theo-manifest mặc định
  (file cũ đã sai hoàn toàn so với composition thật nên đã bị xoá) —
  `app/scripts/generate_review_package.cjs` vẫn dùng được nhưng cần 1 manifest
  mới, được sinh từ đúng cấu trúc `Series.Sequence` thật trong
  `TinDungVideo.tsx` (không phải tự khai tay như bản v5), việc này CHƯA làm.
