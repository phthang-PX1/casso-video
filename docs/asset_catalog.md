# Catalog asset hiện tại

Điểm vào: [`metadata/index.json`](../metadata/index.json). Bốn catalog là mảng JSON
theo các trường trong [`asset_metadata_schema.md`](asset_metadata_schema.md):

- [`metadata/background.json`](../metadata/background.json): 17 video nền, mỗi file một bản ghi.
- [`metadata/sfx.json`](../metadata/sfx.json): 937 asset âm thanh (475 WAV, 461 MP3, 1 MP4).
- [`metadata/character.json`](../metadata/character.json): 15 icon/illustration, hiện toàn bộ lấy từ reicon (xem mục "Character" bên dưới).
- [`metadata/effect.json`](../metadata/effect.json): 8 pattern hiệu ứng/transition tái sử dụng, dùng thư viện đã cài trong `app/` (GSAP, rough-notation, lottie-react, Remotion `spring()`/`interpolate()`).
- [`metadata/technical_inventory.json`](../metadata/technical_inventory.json): kết quả đọc media và SHA-256 để đối chiếu (chỉ áp dụng cho background/sound).
- [`metadata/background_annotations.json`](../metadata/background_annotations.json): mô tả biên tập của background; sửa tại đây rồi chạy `build`.

## Character (reicon)

File SVG thật nằm ở `characters/reicon/*.svg` (đã tải bằng CLI `reicon-mcp`, xem
[SKILL.md video-stack](../.claude/skills/video-stack/SKILL.md) mục 3). Khác với
background/SFX, 15 icon này được **chọn và gắn `use_when`/`avoid_when` thủ công**
theo đúng domain đối soát tài chính của Casso (`review.semantic = "curated"`), không
phải suy đoán từ tên file — vì vậy license đã xác nhận `MIT` (giấy phép của reicon,
xem `reicon/LICENSE`), không cần `needs_listening` như SFX.

**undraw chưa đóng góp asset nào**: lệnh `composer download` của repo `undraw/`
gọi `https://undraw.co/api/illustrations`, endpoint này hiện trả `404` — undraw.co
đã đổi sang giao diện Next.js mới và không còn expose API công khai đó nữa. Đây là
vấn đề bên ngoài (upstream), không phải lỗi cấu hình PHP/Composer trên máy. Khi cần
bổ sung nhân vật/ẩn dụ dạng "người" (khác icon), phải tìm nguồn thay thế hoặc tải
SVG thủ công từ https://undraw.co/illustrations rồi tự viết metadata theo schema.

Muốn thêm icon reicon mới: `node reicon/packages/reicon-mcp/bin/run.cjs view <tên>
--weight Outline`, lưu field `svg` vào `characters/reicon/<tên>.svg`, thêm mục vào
`CHARACTER_PROFILES` trong [`scripts/build_asset_metadata.py`](../scripts/build_asset_metadata.py),
rồi chạy `build` + `validate` (xem mục "Sử dụng và cập nhật" bên dưới). Icon không
có trong `CHARACTER_PROFILES` vẫn được catalog nhưng với `review.semantic =
"needs_curation"` — không nên để agent tự chọn cho tới khi gán `use_when` thật.

## Effect

8 mục trong `effect.json` là **pattern code**, không phải file media — trường
`source.url_or_path` trỏ tới ghi chú "xem SKILL.md video-stack", không phải đường
dẫn file cụ thể. Trường `review.semantic` phân biệt rõ 2 mức:
- `"rendered_smoke_test"`: pattern đã thực sự render ra MP4 thật trong session cài
  đặt stack (underline rough-notation, scale-in GSAP, hold tĩnh).
- `"documented_pattern_untested"`: dùng đúng API của thư viện đã cài & test riêng lẻ,
  nhưng chưa ghép thành 1 scene hoàn chỉnh để render thử — kiểm tra kỹ hơn trước khi
  dùng cho sản xuất hàng loạt.

Thêm effect mới: sửa `EFFECTS` trong `scripts/build_asset_metadata.py`, chạy lại `build`.

Đường dẫn `source.url_or_path` tính từ gốc dự án, giữ nguyên tên file và dùng dấu `/`.
Đây là đường dẫn filesystem, chưa phải URL public/`staticFile()` của Remotion.
ID dùng `bg_`/`sfx_`/`char_` + tên chuẩn hóa + 10 ký tự hash đường dẫn. Effect dùng
ID cố định `fx_<tên>` (không hash, vì không gắn với 1 file cụ thể). Đổi nội dung
file không đổi ID; đổi tên hoặc di chuyển file sẽ đổi ID. Hash nội dung nằm riêng ở
`file.sha256`. Không gộp các file chỉ vì chúng có tên giống nhau.

## Mức kiểm chứng

Thông số kỹ thuật được đọc bằng FFprobe có sẵn trong dependency Remotion:
thời lượng, định dạng, codec, kích thước/FPS/tỷ lệ khung hình của video,
sample rate/kênh của âm thanh, có/không có audio/video. Ba file MKV/WebM không có
duration ở container được tính từ timestamp và duration của packet. Đây là thời
lượng trên timeline media, không phải thời lượng vùng âm thanh khác im lặng.
FFprobe thành công không có nghĩa đã giải mã và xem/nghe toàn bộ file.

Background đã xem khung hình tại 10%, 50%, 90% thời lượng; `description`, màu sắc,
`layout_role`, `visual_weight`, `use_when`, `avoid_when` dựa trên các mẫu đó.
Xem nhanh [bảng ảnh 1](../metadata/previews/background_contact_1.jpg),
[bảng ảnh 2](../metadata/previews/background_contact_2.jpg),
[bảng ảnh 3](../metadata/previews/background_contact_3.jpg).
Chưa xác nhận mọi thời điểm trong clip hoặc khả năng nối loop.

SFX được phân loại bằng tên file và thư mục: whoosh, riser, click, impact,
UI, ambience, nhạc trích đoạn, meme, v.v. `review.label_basis` và
`review.classification_rule` ghi căn cứ; mọi SFX có
`review.semantic = "needs_listening"`. Tên mơ hồ giữ `subtype = "unclassified"`
và `emotional_tone = ["unknown"]` thay vì đoán nội dung. Một số file là chuỗi
âm dài, cần nghe để chọn đoạn, không mặc định toàn file là một cue ngắn.

`mix_level_db_relative` là mức khởi đầu gợi ý so với voice, chưa đo loudness hoặc
chuẩn hóa gain. Không áp dụng nó trực tiếp như volume tuyệt đối của file.
`loopable = false` nghĩa là chưa cho phép tự lặp; không kết luận rằng file không
thể loop. MP4 trong SFX có `playback.audio_stream_only = true`; background có
`playback.mute_source_audio = true` để tắt audio nhúng khi làm nền.

Chưa có bằng chứng license kèm các file: giữ `source.license = "unknown"`,
`license_status = "unverified"`. Vì schema dùng boolean, `attribution_required`
tạm đặt `true` cùng `attribution_status = "unverified"`; đây là giá trị thận trọng,
không khẳng định tác giả hoặc điều khoản. Không suy license từ tên như “free”,
“freesound”, tên pack hoặc license của app. Các mục có tên gợi ý video tải xuống,
meme/nhạc/cue trò chơi/giọng phản ứng được đặt `reference_only = true`, theo quy
tắc reference trong schema, chờ xác minh nguồn. `replaced_by = null` nghĩa là
chưa có asset thay thế, không phải ID bị thiếu. Các mục khác vẫn có license chưa
xác minh; thiếu `reference_only` không có nghĩa đã xác nhận quyền sử dụng.

`pairs_well_with` hiện để mảng rỗng vì chưa có cặp asset đã duyệt trong dự án.
Hai tài liệu gốc dẫn tới `SKILL.md` (bảng 12 loại nhiệm vụ nhận thức, xem
[00_production_planning.md](00_production_planning.md) mục 2) — file này không nằm
trong repo local, nhưng skill toàn cục tương đương (`visual-storytelling-explainer`)
đã có sẵn trong môi trường Claude Code. `.claude/skills/video-stack/SKILL.md` trong
repo là một skill khác (tra cứu tech stack), không thay thế bảng 12 nhiệm vụ này.
Các ngữ cảnh `use_when`/`avoid_when` hiện viết theo hook, checklist, giải thích,
so sánh, chuyển chương và kết luận đã mô tả trong tài liệu, chưa gán mã cụ thể của
bảng 12 nhiệm vụ nhận thức.

## Sử dụng và cập nhật

Agent đọc `index.json`, tải catalog phù hợp, lọc theo category/subtype, ngữ cảnh,
thời lượng và tỷ lệ khung hình. Xem `review` để phân biệt đo trực tiếp với nhãn
suy luận. Bỏ các bản có `duplicate_of` khi cần danh sách file không trùng byte.
38 nhóm trùng SHA-256 hiện chứa 39 bản dư; file gốc vẫn được giữ nguyên.

Chạy từ gốc dự án với Python 3.10+:

```powershell
python scripts/build_asset_metadata.py all
python scripts/build_asset_metadata.py previews
```

`all` quét lại file, tạo catalog và kiểm tra. `previews` cần Pillow, tạo ảnh mẫu
và ba bảng ảnh; không bắt buộc để đọc catalog. Khi có background mới, xem ảnh,
thêm mô tả vào `background_annotations.json`, rồi chạy:

```powershell
python scripts/build_asset_metadata.py build
python scripts/build_asset_metadata.py validate
```

Script đọc file trong `background/`, `SFX/` (qua FFprobe, cho background/sound) và
`characters/` (SVG, không cần FFprobe); `effect.json` không đọc file nào, dữ liệu
nằm thẳng trong hằng số `EFFECTS` của script. Tất cả file sinh ra nằm trong
`metadata/`. `build` ghi lại catalog từ inventory/annotations/profile, nên không sửa
trực tiếp các catalog đầu ra — sửa `CHARACTER_PROFILES`/`EFFECTS` trong script rồi
chạy lại `build`. Có thể đặt biến môi trường `FFPROBE` và `FFMPEG` nếu không dùng
binary trên PATH hoặc bản Windows kèm Remotion.

`validate()` kiểm tra background/sound: độ phủ đúng một bản ghi/file media, ID duy
nhất đúng snake_case, đường dẫn thực, kích thước file, trường chung và trường riêng,
tham chiếu ID, duration dương và stream phù hợp với category khi probe thành công.
Các lỗi probe được giữ trong catalog và liệt kê tại `index.probe_errors` để không
làm mất asset. `validate_characters_effects()` kiểm tra riêng character/effect (ID,
đường dẫn file SVG còn tồn tại, `illustration_role`/`tier`/`triggers_on` hợp lệ) —
cả hai hàm chạy cùng lúc khi gọi lệnh `validate` hoặc `all`.
