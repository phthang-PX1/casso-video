# Asset Metadata Schema

Catalog của các file hiện có: xem [hướng dẫn asset catalog](asset_catalog.md)
và [metadata/index.json](../metadata/index.json).

Mục tiêu: mỗi asset (background, nhân vật/ảnh, hiệu ứng, âm thanh/SFX) đều có
metadata trả lời được 3 câu hỏi — **Đây là gì? Dùng khi nào? Lấy/tạo ở đâu?**
— để agent chọn tự động mà không cần con người duyệt từng cái.

## Cấu trúc chung (áp dụng cho cả 4 nhóm)

```json
{
  "id": "string, unique, snake_case",
  "category": "background | character | effect | sound",
  "subtype": "string — phân loại nhỏ hơn trong category",
  "name_display": "tên dễ đọc cho người",
  "use_when": "mô tả NGỮ CẢNH/nhiệm vụ nhận thức nên dùng asset này (map với bảng 12 loại trong SKILL.md)",
  "avoid_when": "tình huống KHÔNG nên dùng (tránh agent lạm dụng)",
  "emotional_tone": ["calm | urgent | playful | serious | suspense ..."],
  "pairs_well_with": ["id của asset khác thường đi kèm"],
  "source": {
    "origin": "self-generated-code | undraw | reicon | lottiefiles | storyset | recorded-human | other",
    "url_or_path": "đường dẫn thực tế / repo local",
    "license": "MIT | CC0 | Freepik-free-attribution | proprietary-owned | unknown",
    "attribution_required": true
  },
  "tech": {
    "format": "svg | lottie-json | png | mp3 | wav",
    "editable_color": true,
    "duration_sec": null
  }
}
```

## 1. Background & Overlay

| Trường riêng | Ý nghĩa |
|---|---|
| `layout_role` | `full_bg` (nền toàn màn) / `card_surface` (mặt thẻ) / `overlay_texture` (lớp phủ nhẹ, ví dụ noise/gradient mờ) |
| `visual_weight` | `low` (không được giành sự chú ý, dùng khi chữ nhiều) / `high` (dùng ở card hook để gây ấn tượng) |

**Ví dụ mục:**
```json
{
  "id": "bg_gradient_purple_hook",
  "category": "background",
  "subtype": "full_bg gradient tĩnh",
  "use_when": "Card hook/mở bài, card cần tương phản mạnh với thẻ trắng ở giữa",
  "avoid_when": "Card có nhiều chữ nhỏ/bảng dữ liệu — dễ rối mắt nếu nền quá nổi",
  "layout_role": "full_bg",
  "visual_weight": "high",
  "source": {"origin": "self-generated-code", "license": "n/a"}
}
```

## 2. Image / Nhân vật (character, ẩn dụ, icon minh họa)

| Trường riêng | Ý nghĩa |
|---|---|
| `illustration_role` | `metaphor` (ẩn dụ khái niệm trừu tượng) / `character` (nhân cách hóa) / `diagram_element` (thành phần trong sơ đồ) / `authority_mark` (icon nguồn/trích dẫn) |
| `reusable_across_topics` | true/false — có nên giữ 1 nhân vật xuyên suốt cả series không |

**Ví dụ mục:**
```json
{
  "id": "char_spy_avatar_set_7",
  "category": "character",
  "subtype": "bộ 7 avatar nhân cách hóa (dùng cho danh sách nhiều thực thể)",
  "use_when": "Khi nội dung có >=5 thực thể trừu tượng cần người xem nhớ được (ngày/nhóm/loại), muốn tạo cảm giác nhân vật hóa",
  "avoid_when": "Nội dung chỉ có 1-2 thực thể — nhân cách hóa dư thừa",
  "illustration_role": "character",
  "reusable_across_topics": true,
  "source": {"origin": "reicon", "url_or_path": "reicon.dev/icons (MCP)", "license": "MIT", "attribution_required": false}
}
```

## 3. Hiệu ứng (transition / reveal animation)

| Trường riêng | Ý nghĩa |
|---|---|
| `tier` | `micro` (trong-card) / `chapter` (chuyển chủ đề) / `stamp` (hard-cut liệt kê) / `hold` (giữ tĩnh) — map trực tiếp SKILL.md mục 4 |
| `timing_hint_sec` | khoảng thời gian khuyến nghị |
| `triggers_on` | `word_boundary` (kích hoạt theo timestamp từ) / `sentence_end` / `manual` |

**Ví dụ mục:**
```json
{
  "id": "fx_underline_draw",
  "category": "effect",
  "subtype": "gạch chân tự vẽ (width 0% → 100%)",
  "use_when": "Nhấn 1 từ khóa vừa được đọc xong trong cùng 1 ý",
  "tier": "micro",
  "timing_hint_sec": 0.3,
  "triggers_on": "word_boundary",
  "source": {"origin": "self-generated-code", "url_or_path": "rough-notation lib", "license": "MIT"}
}
```

## 4. Sound / SFX

| Trường riêng | Ý nghĩa |
|---|---|
| `audio_role` | `music_bed` (nhạc nền loop xuyên suốt) / `voice` (giọng đọc chính) / `sfx_punctuation` (tiếng "tách/pop" khi 1 item xuất hiện) / `sfx_transition` (whoosh khi chuyển chương) |
| `mix_level_db_relative` | mức so với voice (vd -18dB cho nhạc nền để không lấn giọng) |
| `loopable` | true/false |

**Ví dụ mục:**
```json
{
  "id": "sfx_pop_item_reveal",
  "category": "sound",
  "subtype": "tiếng tách ngắn khi 1 item list xuất hiện (stamp)",
  "use_when": "Đi kèm hiệu ứng fx tier=stamp, mỗi lần thêm 1 item vào bảng/checklist",
  "audio_role": "sfx_punctuation",
  "mix_level_db_relative": -6,
  "loopable": false,
  "source": {"origin": "lottiefiles/freesound tương đương SFX pack", "license": "CC0 ưu tiên chọn"}
}
```

## Quy tắc thu thập & gắn nhãn asset "lấy từ người thật" (để tái sử dụng cảm giác chuyên nghiệp)
Khi bạn tách SFX/nhạc/icon từ video người thật làm để tham khảo chất lượng:
1. Không import nguyên file có bản quyền vào kho sản xuất đại trà — chỉ dùng làm
   "tài liệu tham chiếu cảm giác" (reference), rồi tìm/tạo bản thay thế cùng
   `emotional_tone` + `tier`/`audio_role` tương đương từ nguồn free/tự tạo.
2. Ghi chú thêm trường `"reference_only": true, "replaced_by": "<id asset thật sự dùng>"`
   để agent biết đây là bản ghi chú, không phải asset được phép dùng trực tiếp.
3. Ưu tiên nguồn free có license rõ ràng (CC0, MIT) hơn nguồn không rõ nguồn gốc,
   kể cả khi chất lượng nhỉnh hơn 1 chút — tránh rủi ro gỡ video/kênh sau này.
