# Kịch bản thực tế — "Tín dụng là gì?" (bản v5 đang render)

Tài liệu này mô tả ĐÚNG những gì đang có trong `tin-dung-la-gi-v5.mp4` (không phải
bản kế hoạch ban đầu ở `tin_dung_la_gi.md` — file đó đã lỗi thời so với build hiện
tại). Dùng để bạn chỉnh sửa trực tiếp — sửa xong phần nào, gửi lại đúng phần đó
(lời đọc, thời lượng, mô tả hình ảnh...) và nói rõ muốn đổi thành gì.

Tổng thời lượng: **82.83s** (2485 frame @ 30fps). 8 cảnh (card0 → card6, có thêm
card3b).

---

## Card 0 — Tiêu đề
**Thời gian:** 0.00s – 2.50s (75 frame)
**Lời đọc:** "Tín dụng là gì?"
**Hình ảnh:** Toàn màn hình gradient xanh brand (`#00A85E → #008241`), có lớp
video nền chuyển động (lưới, mờ, blend overlay) phía sau. Chữ "TÍN DỤNG LÀ GÌ?"
to, trắng, giữa khung, vào bằng GSAP scale+fade (`back.out`), sau đó có nhịp thở
nhẹ (idle pulse) chứ không đứng im tuyệt đối.
**Âm thanh:** 1 tiếng whoosh nhẹ khi chữ xuất hiện.

---

## Card 1 — Mở đầu (Hook)
**Thời gian:** 2.50s – 14.17s (350 frame)
**Lời đọc:** "Bạn vay tiền mua nhà, quẹt thẻ mua đồ, hay mua trả góp một chiếc
điện thoại. Tất cả đều có một điểm chung: bạn đang dùng tiền của người khác, để
trả sau. Nhưng chính xác thì, tín dụng là gì?"
**Hình ảnh:** Trong khung card trắng bo góc (nền gradient xanh phía sau). 3 icon
xuất hiện lần lượt, đúng nhịp giọng đọc (dùng timestamp whisper thật, không canh
tay):
  - Icon nhà (`building`) — nhãn "Vay mua nhà"
  - Icon thẻ (`credit-card`) — nhãn "Quẹt thẻ"
  - Icon điện thoại (`mobile`) — nhãn "Trả góp"
  Mỗi icon vào theo 3 lớp GSAP (khung màu → glyph xoay vào → nhãn chữ), rồi giữ
  nhịp bập bênh nhẹ. Kết thúc bằng dấu "?" lớn màu brand phóng to giữa khung.
**Âm thanh:** pop nhẹ mỗi icon xuất hiện, pop mạnh hơn khi dấu "?" hiện ra.

---

## Card 2 — Định nghĩa
**Thời gian:** 14.17s – 29.83s (470 frame)
**Lời đọc:** "Tín dụng, nói đơn giản, là việc một bên, ngân hàng, tổ chức tài
chính, hay người bán, cho bạn quyền sử dụng một khoản tiền hoặc giá trị hàng hóa
ngay bây giờ, đổi lại bạn cam kết hoàn trả vào một thời điểm trong tương lai,
thường kèm theo một khoản phí gọi là lãi suất."
**Hình ảnh:** Trong khung card trắng.
  1. Đầu cảnh: illustration unDraw thật ("credit_card_payment" — 3 người + thẻ
     tín dụng, chi tiết màu brand) hiện lên theo 3 lớp (nền → người → chi tiết
     accent).
  2. Chữ "Đổi lại, bạn cam kết:" hiện ra đúng lúc giọng đọc tới từ "cam kết".
  3. Sơ đồ 3 bước (dùng `@antv/infographic`, không tự vẽ tay): **Dùng ngay** →
     **Trả sau** → **Kèm lãi**, mỗi bước có icon riêng (túi tiền / đồng hồ /
     biểu đồ tăng).
**Âm thanh:** whoosh đầu cảnh, pop khi chữ và sơ đồ hiện ra.

---

## Card 3 — Ẩn dụ: Lò xo
**Thời gian:** 29.83s – 41.17s (340 frame)
**Lời đọc:** "Hãy tưởng tượng tín dụng như một chiếc lò xo. Nó kéo dài sức mua
của bạn ra trước thời gian thực tế bạn kiếm được tiền. Nhưng lò xo càng kéo dài,
càng cần nhiều lực để kéo nó về đúng vị trí."
**Hình ảnh:** Lò xo (SVG vẽ tay, có hiệu ứng "vẽ nét" lúc xuất hiện) kéo dài dần
đúng theo tốc độ giọng đọc, sau đó đung đưa nhẹ khi đã kéo hết cỡ. Bên dưới là
câu chữ: "Tín dụng kéo dài **sức mua** ra trước — càng kéo dài, càng cần nhiều
**lực để trả** về đúng vị trí." (2 từ khóa được bọc pill màu).
**Âm thanh:** whoosh đầu cảnh, pop khi lò xo bắt đầu kéo giãn.

---

## Card 3b — Ẩn dụ: Bóng bay xì hơi (nợ xấu)
**Thời gian:** 41.17s – 50.17s (270 frame)
**Lời đọc:** "Còn nợ xấu? Nó giống như một quả bóng bay bị xì hơi. Giá trị mất
dần theo từng ngày trễ hạn, và càng để lâu, càng khó bơm căng trở lại."
**Hình ảnh:** Quả bóng bay đỏ (SVG nhiều lớp: quầng sáng mờ phía sau → dây buộc
vẽ nét → thân bóng → 2 nếp nhăn vẽ tay khi bóng xì) xẹp dần đúng nhịp giọng đọc,
đổi màu từ đỏ sang xám khi xẹp quá nửa, sau đó đung đưa như con lắc. Câu chữ:
"Còn **nợ xấu**? Nó giống quả bóng bay bị xì hơi — mất **giá trị** dần theo từng
ngày trễ hạn."
**Âm thanh:** whoosh đầu cảnh, pop khi bóng bắt đầu xì.

---

## Card 4 — So sánh: Tín dụng ≠ Nợ xấu
**Thời gian:** 50.17s – 62.33s (365 frame)
**Lời đọc:** "Nhiều người nghĩ tín dụng và nợ xấu là một. Không đúng. Tín dụng
là công cụ trung tính, dùng đúng cách, nó giúp bạn xoay vòng vốn kịp lúc. Chỉ
khi mất khả năng trả đúng hạn, tín dụng mới biến thành nợ xấu."
**Hình ảnh:** Layout khác hẳn Card 1/2/3 — không có khung card trắng, nội dung
nổi trực tiếp trên nền gradient xanh + video chuyển động. Tiêu đề "Tín dụng ≠ Nợ
xấu" (chữ trắng). Hai khối tròn trắng đối xứng, hiện ra hard-cut (không easing)
đúng lúc giọng đọc nhắc tới:
  - Trái: icon dấu tick xanh lá — "Tín dụng (đúng hạn)"
  - Phải: icon tam giác cảnh báo đỏ — "Nợ xấu (trễ hạn)"
**Âm thanh:** whoosh đầu cảnh, pop khi mỗi bên hiện ra.

---

## Card 5 — Xu hướng / số liệu
**Thời gian:** 62.33s – 72.83s (315 frame)
**Lời đọc:** "Tín dụng không phải khái niệm mới. Hệ thống ngân hàng hiện đại đã
xây dựng trên nó hàng trăm năm, và ngày nay phần lớn giao dịch tiêu dùng trên
thế giới đều có yếu tố tín dụng đứng sau."
**Hình ảnh:** Trong khung card trắng. Câu dẫn hiện trước, sau đó biểu đồ cột 4
cột tự mọc dần từng cột một (không hiện nguyên cục), kèm số % đếm lên đồng bộ
theo từng cột.
> ⚠️ Số liệu trên biểu đồ (1→22%, 2→48%, 3→74%, 4→97%) **chỉ là minh họa xu
> hướng tăng dần, không phải số liệu thật có nguồn** — nếu bạn có số liệu thật
> (ví dụ % dân số dùng thẻ tín dụng qua các năm, theo nguồn cụ thể), gửi lại để
> thay vào đúng chỗ này.
**Âm thanh:** whoosh đầu cảnh, pop khi biểu đồ bắt đầu mọc.

---

## Card 6 — Kết luận
**Thời gian:** 72.83s – 82.83s (300 frame)
**Lời đọc:** "Tóm lại: tín dụng là quyền dùng trước, trả sau, kèm lãi suất, một
công cụ tài chính trung tính, tốt hay xấu phụ thuộc vào cách bạn dùng nó."
**Hình ảnh:** Layout full-bleed như Card 4 (không có khung card trắng). Illustration
unDraw thật ("personal_finance" — người + biểu đồ tăng trưởng màu brand) trên 1
nền trắng nhỏ ở đầu cảnh. Bên dưới: 2 khối so sánh "Dùng đúng hạn" (xanh) / "Trễ
hạn = nợ xấu" (đỏ). Cuối cảnh: dòng tóm tắt 3 từ khóa dạng pill — "Dùng trước ·
trả sau · kèm lãi".
**Âm thanh:** whoosh đầu cảnh, whoosh nhẹ trước dòng tóm tắt cuối.

---

## Nhạc nền / SFX xuyên suốt cả video
- 1 lớp ambient-pad âm lượng thấp (-18dB tương đối) chạy liên tục từ đầu đến
  cuối, để không bao giờ có đoạn im lặng tuyệt đối.
  > ⚠️ Đây KHÔNG phải nhạc nền thật (không có nhạc royalty-free nào trong kho
  > hiện tại) — chỉ là 1 lớp "room tone". Nếu bạn có nguồn nhạc nền muốn dùng,
  > gửi file/link để thay.
- Nền hình ảnh: video chuyển động (lưới, mờ, blend overlay) phía sau mọi cảnh,
  thay cho nền màu phẳng tĩnh.

---

## Cách chỉnh sửa và gửi lại

Bạn có thể sửa trực tiếp trong file này (giữ lại cấu trúc theo từng Card) rồi
gửi lại phần đã sửa, ví dụ:
- Đổi lời đọc của 1 card → tôi sẽ tạo lại giọng đọc (TTS) + timestamp cho card đó.
- Đổi mô tả hình ảnh/hiệu ứng → tôi sẽ sửa code component tương ứng.
- Thêm/bớt card → tôi sẽ cập nhật lại `CARD_DURATIONS` và toàn bộ pipeline.
- Số liệu Card 5, nhạc nền — đang là placeholder, cần bạn xác nhận hoặc cung cấp
  nguồn thật.

Không cần gửi lại nguyên văn cả file — chỉ cần nói rõ "Card X: đổi lời đọc thành
..." hoặc "Card X: đổi hình ảnh thành ..." là đủ.
