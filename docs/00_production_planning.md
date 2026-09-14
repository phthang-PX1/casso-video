# Planning giai đoạn chuẩn bị sản xuất video (pre-production)

## 1. Bộ công cụ kỹ thuật (đã chốt so với stack hiện tại)

| Việc cần làm | Công cụ | Vai trò |
|---|---|---|
| Ghép/dựng video cuối cùng | **Remotion** (giữ) | Lõi trung tâm — mọi asset đổ vào đây, xuất MP4 bằng code |
| Sinh sơ đồ/bảng/so sánh tự động | **antvis/Infographic** (giữ) | Nguồn cho các cảnh: bảng ma trận, so sánh 2 cột, sơ đồ tầng nguyên nhân |
| Icon nhỏ + illustration | **reicon.dev** (giữ, khai thác thêm MCP Server + kho 71k illustration) | Icon UI, avatar, ẩn dụ hình ảnh |
| Chuyển động toán/hình học phức tạp | ~~Manim~~ → thay bằng animation SVG/React thuần trong Remotion | Manim quá nặng, tách pipeline riêng, không cần cho style card-explainer này |
| TTS | **capcut-tts-api (giữ làm chính, theo lựa chọn đã kiểm chứng của bạn)** + lớp phòng vệ bên dưới | Giọng đã test ổn; rủi ro chỉ nằm ở việc đây là API nội bộ bị dịch ngược, nên cần bọc thêm an toàn thay vì thay thế |

**Lớp phòng vệ đi kèm capcut-tts-api (bắt buộc, không thay đổi lựa chọn giọng):**
- *Cache theo hash(script + voice_id)*: lưu lại mọi audio đã generate, tránh chạy lại từ đầu nếu API gián đoạn giữa batch.
- *Health-check trước mỗi batch*: gọi thử 1 câu ngắn trước khi chạy cả video, phát hiện sớm nếu CapCut đổi API.
- *Fallback dự phòng* (Azure Neural TTS hoặc edge-tts): chỉ kích hoạt tự động khi health-check thất bại — không thay thế giọng chính trong điều kiện bình thường.
- *Fork riêng repo về server của bạn* (không pull trực tiếp từ upstream mỗi lần build) — vì đây là repo cá nhân nhỏ, có thể đổi/gỡ bất cứ lúc nào; fork đảm bảo bạn luôn giữ được bản đang chạy tốt.
| Đồng bộ hình theo giọng đọc | **@remotion/whisper-web** hoặc **@remotion/install-whisper-cpp** (mới) | Lấy timestamp từng từ → trigger layer reveal đúng nhịp, tự động hoàn toàn |
| Easing/animation tinh tế | **GSAP** (mới) | Chuẩn hoá fade/stagger/underline-draw |
| Hiệu ứng nét vẽ tay | **rough.js / rough-notation** (mới) | Gạch chân, khoanh tròn tự "vẽ" |
| Icon chuyển động thật | **lottie-react** (mới) | Khi cần "sinh động" hơn fade tĩnh |
| Nhân vật/ẩn dụ hình ảnh mở rộng | **unDraw self-host repo** (mới) | Bổ sung khi reicon không có mẫu phù hợp |

## 2. Skill tái sử dụng
Xem `SKILL.md` — bộ nguyên tắc kể chuyện hình ảnh (không phải rule cứng số layer),
kèm bảng "loại nhiệm vụ nhận thức → công cụ minh họa" để agent tự quyết định
cách minh họa phù hợp với domain nội dung bất kỳ.

## 3. Metadata asset
Xem `asset_metadata_schema.md` — schema cho 4 nhóm asset (background/overlay,
image/character, effect, sound/SFX), mỗi asset trả lời rõ "là gì – dùng khi nào –
nguồn/license gì", kèm quy tắc xử lý khi tham khảo asset từ video người thật làm
(không copy trực tiếp, chỉ dùng làm reference rồi thay bằng bản free tương đương).

## 4. Việc cần làm tiếp theo trước khi sản xuất thật
1. Cài đặt & test thử pipeline: Remotion + Infographic + reicon MCP + whisper-web
   trên 1 kịch bản mẫu ngắn (1 concept, ~5 cảnh) để đo thời gian tự động hoá thực tế.
2. Khởi tạo kho asset ban đầu theo schema (bắt đầu với ~10-15 background,
   10-15 nhân vật/illustration, 8-10 effect, 8-10 SFX) — đủ để agent có "vốn từ"
   ban đầu trước khi mở rộng dần.
3. Chọn bảng màu + font thương hiệu riêng cho domain mới (đổi màu do bạn quyết định,
   không thuộc phạm vi style đã phân tích).
4. Viết 1 kịch bản mẫu, chạy qua SKILL.md thủ công 1 lần (đánh giá bằng tay) trước
   khi giao agent tự động, để hiệu chỉnh bảng "loại nhiệm vụ → công cụ" nếu domain
   mới phát sinh loại nhiệm vụ nhận thức chưa có trong bảng 12 loại.
