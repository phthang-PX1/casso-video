# Kịch bản: "Tín dụng là gì?"

Card-explainer, ~45-55s, 7 card. Domain: tài chính/kế toán (phù hợp brand Casso).
Mỗi card: lời đọc (voice-over) + nhiệm vụ nhận thức + cách minh họa + asset gợi ý
(tra [metadata/index.json](../../metadata/index.json) trước khi thêm asset mới).

---

## Card 0 — Title

**Hiển thị**: "TÍN DỤNG LÀ GÌ?" — chữ lớn giữa khung hình.
**Nền**: `bg_gradient` màu Brand Solid `#00A85E` → tối dần (xem [docs/01_brand_palette.md](../../docs/01_brand_palette.md)), `visual_weight: high`.
**Transition vào**: fade-in đơn giản, không hard-cut (đây là card mở, cần trang trọng).
**SFX**: 1 `whoosh` nhẹ khi chữ xuất hiện (tra `metadata/sfx.json`, subtype `whoosh`, chọn bản `-12dB`).

---

## Card 1 — Hook (đặt vấn đề, chưa lộ đáp án)

**Lời đọc**: "Bạn vay tiền mua nhà, quẹt thẻ mua đồ, hay mua trả góp một chiếc
điện thoại — tất cả đều có một điểm chung: bạn đang *dùng tiền của người khác*,
để trả *sau*. Nhưng chính xác thì, tín dụng là gì?"

**Nhiệm vụ nhận thức**: gọi tên 1 khái niệm trừu tượng — chưa tiết lộ định nghĩa.
**Minh họa**: 3 trạng thái nối tiếp trên cùng 1 layout (nhà → thẻ → điện thoại),
mỗi item xuất hiện kèm icon tương ứng, kết thúc bằng dấu "?" lớn ở giữa (trạng
thái ẩn bắt buộc trước khi lộ đáp án).
**Asset**: icon `building` (nhà/ngân hàng) đã có trong `metadata/character.json`
(`char_building_*`); thẻ và điện thoại chưa có trong kho reicon đã tải — cần
`node reicon/packages/reicon-mcp/bin/run.cjs search "credit card"` / `"smartphone"`
để bổ sung nếu build thật (chưa làm ở bước này).
**Effect**: mỗi item vào bằng `fx_stamp_pop_item` (tier `stamp`, đã có trong
`metadata/effect.json`), dấu "?" giữ tĩnh bằng `fx_hold_static_frame`.
**SFX**: `pop_snap` nhẹ mỗi lần 1 item xuất hiện.

---

## Card 2 — Định nghĩa (lộ đáp án)

**Lời đọc**: "Tín dụng, nói đơn giản, là việc một bên — ngân hàng, tổ chức tài
chính, hay người bán — *cho bạn quyền sử dụng một khoản tiền hoặc giá trị hàng
hóa ngay bây giờ*, đổi lại bạn cam kết *hoàn trả* vào một thời điểm trong tương
lai, thường kèm theo một khoản phí gọi là *lãi suất*."

**Nhiệm vụ nhận thức**: giải thích cơ chế — 3 thành phần nối nhau (dùng trước →
hoàn trả sau → có lãi).
**Minh họa**: sơ đồ tầng 3 bước, mỗi tầng 1 màu (dùng `@antv/infographic` cho
sơ đồ tầng, xem [SKILL.md video-stack](../../.claude/skills/video-stack/SKILL.md)
mục 2), đồng bộ với 3 cụm từ *"dùng ngay"* / *"trả sau"* / *"kèm lãi"* qua
timestamp whisper — không canh tay.
**Asset**: `char_money_bag` (giá trị tiền/hàng hóa), `char_clock_circle` (yếu tố
thời gian — "trả sau"), `char_diagram_up` (lãi suất tăng dần).
**Effect**: `fx_underline_draw` gạch chân đúng lúc đọc xong từ "hoàn trả" và
"lãi suất" (tier `micro`, đã render smoke-test thật — an toàn dùng ngay).
**Transition nội bộ**: fade vi mô 0.3-0.6s/lớp giữa 3 tầng.

---

## Card 3 — Ẩn dụ hóa (giúp "cảm" được khái niệm)

**Lời đọc**: "Hãy tưởng tượng tín dụng như một chiếc lò xo: nó *kéo dài sức mua*
của bạn ra trước thời gian thực tế bạn kiếm được tiền — nhưng lò xo càng kéo
dài, càng cần nhiều lực để kéo nó về đúng vị trí."

**Nhiệm vụ nhận thức**: gắn khái niệm trừu tượng vào 1 cảnh quen thuộc (ẩn dụ
vật thể cụ thể, tách riêng khỏi định nghĩa chữ ở Card 2).
**Minh họa**: 1 card riêng biệt, vẽ lò xo kéo giãn bằng SVG/React thuần trong
Remotion (theo quyết định bỏ Manim — xem mục 10 SKILL.md), không dùng chữ định
nghĩa lặp lại.
**Effect**: `fx_card_scale_in` khi ẩn dụ xuất hiện (tier `chapter`, đã render
smoke-test thật).
**Lưu ý**: đây là 1 trong 2 concept dễ nhầm nếu vẽ chung layout với Card 2 —
theo checklist skill kể chuyện, phải tách card riêng, không gộp.

---

## Card 4 — So sánh (lật tẩy hiểu lầm phổ biến)

**Lời đọc**: "Nhiều người nghĩ tín dụng và nợ xấu là một. Không đúng. Tín dụng
là *công cụ trung tính* — dùng đúng cách, nó giúp bạn xoay vòng vốn kịp lúc.
Chỉ khi mất khả năng trả đúng hạn, tín dụng mới biến thành nợ xấu."

**Nhiệm vụ nhận thức**: so sánh 2 khái niệm dễ nhầm, trọng lượng thị giác bằng
nhau + lật tẩy hiểu lầm.
**Minh họa**: 2 pill/khối cùng cỡ đặt cạnh nhau — trái "Tín dụng (dùng đúng hạn)"
với icon `check-circle` (Positive `#6ED507` theo [docs/01_brand_palette.md](../../docs/01_brand_palette.md)),
phải "Nợ xấu (trễ hạn)" với icon `alert-triangle` (Negative — *chưa có hex chính
thức, xem ghi chú "chờ token gốc" trong 01_brand_palette.md*, tạm dùng đỏ chuẩn
web `#DC2626` và ghi rõ comment TODO thay khi có token thật).
**Effect**: hard-cut hai bên (0.3-0.4s), không easing — đúng tầng "chốt đúng/sai".
**SFX**: `check-circle` dùng `bell`/`chime` sáng; `alert-triangle` dùng `impact`
trầm hơn — không dùng chung 1 SFX cho cả 2 bên để giữ tương phản cảm xúc.

---

## Card 5 — Số liệu/xu hướng (tăng độ tin cậy)

**Lời đọc**: "Tín dụng không phải khái niệm mới — hệ thống ngân hàng hiện đại
đã xây dựng trên nó hàng trăm năm, và ngày nay phần lớn giao dịch tiêu dùng
trên thế giới đều có yếu tố tín dụng đứng sau."

**Nhiệm vụ nhận thức**: tăng độ tin cậy + định lượng hóa xu hướng (không đọc số suông).
**Minh họa**: khối xếp chồng tăng dần minh họa "phần lớn giao dịch", card định
danh nguồn riêng biệt nếu trích số liệu cụ thể (tên nguồn + năm) — **chưa có số
liệu/nguồn cụ thể ở bản nháp này, cần bạn xác nhận số liệu thật trước khi render**,
tránh bịa số.
**Asset**: `char_diagram_up`.
**Effect**: giữ khung hình tĩnh 2-3s (nội dung cần "ngấm", không hard-cut).

---

## Card 6 — Kết luận (tóm tắt nén)

**Lời đọc**: "Tóm lại: tín dụng là quyền dùng trước, trả sau, kèm lãi suất — một
công cụ tài chính trung tính, tốt hay xấu phụ thuộc vào cách bạn dùng nó."

**Nhiệm vụ nhận thức**: tóm tắt cuối bài — bảng 2 cột đối chiếu nén, không văn xuôi.
**Minh họa**: bảng 2 cột "Dùng đúng" / "Dùng sai" (tái dùng layout Card 4, chỉ
đổi nhãn — nguyên tắc "template dùng lại, dữ liệu thay đổi").
**Asset**: `char_handshake` (dùng đúng — hợp tác/uy tín) và `char_scale2` (cân
đối, kết luôn "trung tính").
**Effect**: `fx_underline_draw` cho 3 cụm từ khóa "dùng trước", "trả sau", "kèm lãi".
**Nền**: quay lại Brand gradient như Card 0 — khép vòng bố cục.

---

## Ghi chú tổng — việc CẦN làm trước khi render thật

1. **Số liệu ở Card 5 là placeholder** ("hàng trăm năm", "phần lớn giao dịch")
   — cần thay bằng số liệu có nguồn thật trước khi công bố, tránh sai thông tin
   tài chính.
2. **Card 1 cần icon thẻ tín dụng + điện thoại** — chưa có trong `characters/reicon/`
   hiện tại (mới có 15 icon ban đầu), cần search + tải bổ sung qua reicon-mcp rồi
   catalog vào `metadata/character.json` (xem quy trình trong
   [docs/asset_catalog.md](../../docs/asset_catalog.md)).
3. **Màu Negative ở Card 4 dùng tạm `#DC2626`** vì chưa có token gốc Casso Design
   System cho role `Negative` — thay ngay khi có `tokens/*.css` thật.
4. **5/8 effect trong `metadata/effect.json` chưa render-test** (`documented_pattern_untested`)
   — Card 3 dùng `fx_card_scale_in` (đã test), nhưng nếu đổi sang
   `fx_stagger_fade_in_list` hay `fx_chapter_wipe_transition` ở bản dựng thật,
   nhớ render thử trước khi ghép cả video.
5. Giọng đọc: dùng `capcut-tts-api` theo [SKILL.md video-stack](../../.claude/skills/video-stack/SKILL.md)
   mục 4 — **nhớ 4 lớp phòng vệ (cache/health-check/fallback/fork) chưa được code**,
   không chạy thẳng batch nếu chưa có.
