# Bảng màu thương hiệu — Casso Design System v1.0.0-beta

Chốt cho mục 3 trong [00_production_planning.md](00_production_planning.md)
("Chọn bảng màu + font thương hiệu"). Đây là bảng màu **gốc từ hệ thống thiết kế
sản phẩm Casso** (Casso-Frontend/Backend), dùng lại cho video để đồng bộ nhận diện
thương hiệu — không phải bảng màu tự nghĩ riêng cho domain video.

## Giá trị hex đã biết chính xác

| Token | Hex | Dùng khi |
|---|---|---|
| Brand/Solid (Casso Green) | `#00A85E` | Màu thương hiệu chính — logo, CTA, điểm nhấn chính trong video |
| Brand/Hover | `#009A54` | Trạng thái hover (ít liên quan video, tham khảo khi cần gradient/variant) |
| Brand/Pressed | `#008241` | Trạng thái pressed/đậm nhất của brand |
| Positive | `#6ED507` (lime) | "Đã duyệt/thành công" — **cố ý khác màu brand** để không nhầm "đã duyệt" với "thuộc thương hiệu" |
| Canvas | `#F7F7F7` | Nền mặc định (xám rất nhạt) |
| Canvas/Alt | `#FFFFFF` | Nền xen kẽ — **đảo ngược quy ước thường thấy**, dùng để zebra-stripe hợp lệ giữa các card/section |

## Vai trò màu (roles) — chưa có hex cụ thể, cần file token gốc

Các role sau có cấu trúc 4 mức cường độ (**Flat → Pale → Subtle → Solid**) nhưng
**giá trị hex chưa được cung cấp** trong bảng mô tả, chỉ có tên vai trò:

- `Neutral`
- `Accent` (không có mức Pale riêng — dùng `Background/Support/Brand/Pale` khi cần nền nhạt hơn)
- `Negative`
- `Warning`
- `Info`

Và **18 nhóm `Support/<hue>`** (dùng phân loại — biểu đồ, tag danh mục — **không**
dùng cho trạng thái/ý nghĩa) mỗi nhóm 5 mức: Pale → Subtle → Soft → Solid → Deep.
Tên 18 hue cụ thể cũng chưa được cung cấp.

**→ Cần bạn cung cấp 4 file token gốc để dùng chính xác, tránh đoán màu:**
`tokens/base-colors.css`, `tokens/colors.css`, `tokens/component-colors.css`,
`tokens/palette.css` (1.056 bậc màu gốc), lấy từ repo Casso-Frontend/Backend. Khi
có, tôi sẽ copy/convert thành CSS variables dùng trực tiếp trong `app/src` của
Remotion (xem mục "Áp dụng vào Remotion" bên dưới).

**Cho tới lúc đó**: chỉ dùng chắc chắn 2 màu Brand (`#00A85E` họ) và Positive
(`#6ED507`) + 2 màu Canvas trong video. Không tự bịa hex cho Neutral/Negative/
Warning/Info/Support — nếu cần "màu cảnh báo" tạm thời trước khi có token, ghi rõ
trong code là placeholder (vd. comment `// TODO: thay bằng Negative/Solid thật khi có token`).

## "Alpha trap" — lưu ý bắt buộc khi dựng video

Phần lớn token `Subtle`, `Pale`, `Border/Neutral`, `Content/Neutral` là **alpha thấp
trên nền**, không phải RGB đặc — ví dụ `Background/Neutral/Subtle/Default =
rgba(1,1,1,0.063)`, gần như trong suốt, KHÔNG phải đen. Hệ quả trực tiếp cho Remotion:

1. **Không chồng 2 lớp alpha lên nhau** (vd. 2 overlay `Subtle` xếp chồng) — màu sẽ
   sai lệch khỏi thiết kế gốc vì alpha cộng dồn ngoài ý muốn.
2. **Không dùng CSS `opacity` để giả lập trạng thái disabled** — phải dùng đúng
   token `*-Disabled` riêng (khi có file token). `opacity` làm mờ luôn cả nội dung
   bên trong (chữ, icon), không chỉ nền.
3. Bề mặt nổi lên trên canvas: dùng `Surface/Default` (trắng) hoặc `Support/<hue>/Soft`
   — **tránh dùng alpha đen** để tạo bề mặt nổi, vì trên nền canvas `#F7F7F7` (đã sáng),
   một lớp alpha đen sẽ ra kết quả **tối hơn canvas** thay vì "nổi" lên như card trắng thật.

## Viền (Borders)

3 mức cường độ neutral: `Pale`, `Subtle`, `Solid` — đều dày 1px. Input mặc định
**không viền hiển thị** (trong suốt), chỉ hiện khi `focus`/`error`/`warning`/`positive`.
→ Nếu dựng scene mô phỏng UI/form trong video, giữ đúng hành vi này thay vì vẽ viền
mặc định cho mọi input.

## Dark mode

Hệ thống hỗ trợ `[data-theme="dark"]`. Video hiện tại không cần dark mode (xuất
MP4 cố định), nhưng nếu tách asset màu ra CSS variables (xem dưới), giữ nguyên cấu
trúc token thay vì hardcode để không phải làm lại khi có yêu cầu bản dark.

## Áp dụng vào Remotion (khi có đủ token)

Kế hoạch khi có 4 file token gốc:
1. Copy/convert các biến cần dùng cho video (Brand, Positive, Negative, Warning,
   Info, Neutral, Canvas, Border) thành `app/src/tokens.css`, giữ nguyên tên biến
   gốc (`--color-brand-solid` kiểu tương tự) để dễ đối chiếu ngược lại thiết kế gốc.
2. Import vào `app/src/Root.tsx` hoặc từng composition, dùng qua `var(--...)` —
   không hardcode hex rải rác trong nhiều file component.
3. Cập nhật [docs/asset_metadata_schema.md](asset_metadata_schema.md): các asset
   background có `layout_role`/`visual_weight` nên tham chiếu đúng token nền (Canvas
   vs Canvas/Alt vs Surface) thay vì mô tả màu chung chung.

## Cập nhật liên quan

- [docs/00_production_planning.md](00_production_planning.md) mục 3 nay coi là
  **đã chốt một phần** (brand + positive + canvas), còn role/support colors **chờ
  file token gốc**.
- Xem thêm [.claude/skills/video-stack/SKILL.md](../.claude/skills/video-stack/SKILL.md)
  để biết cách các thư viện (GSAP, rough-notation, @antv/infographic...) nhận màu
  qua prop/CSS — tất cả đều nhận được string màu bất kỳ (hex hoặc `var(--...)`),
  không có giới hạn kỹ thuật nào chặn việc dùng token này.
