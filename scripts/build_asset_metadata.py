"""Inventory local media and build project asset catalogs (Python 3.10+).

Commands: scan, previews, build, validate, all. Run from any working directory.
FFPROBE/FFMPEG environment variables override PATH and bundled Remotion binaries.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from fractions import Fraction
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "metadata"
EXTENSIONS = {".mp4", ".mov", ".mkv", ".webm", ".mp3", ".wav", ".ogg", ".m4a", ".flac"}
CHARACTER_EXTENSIONS = {".svg"}


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def binary(name):
    bundled = ROOT / "app/node_modules/@remotion/compositor-win32-x64-msvc" / (name + ".exe")
    result = os.environ.get(name.upper()) or shutil.which(name) or (str(bundled) if bundled.is_file() else None)
    if not result:
        raise RuntimeError(f"Missing {name}: set {name.upper()} or install app dependencies")
    return result


def media_files():
    return sorted((p for folder in ("background", "SFX") for p in (ROOT / folder).rglob("*")
                   if p.is_file() and p.suffix.lower() in EXTENSIONS), key=lambda p: p.relative_to(ROOT).as_posix())


def character_files():
    folder = ROOT / "characters"
    if not folder.is_dir():
        return []
    return sorted((p for p in folder.rglob("*") if p.is_file() and p.suffix.lower() in CHARACTER_EXTENSIONS),
                  key=lambda p: p.relative_to(ROOT).as_posix())


def number(value):
    try:
        return round(float(Fraction(str(value))), 6)
    except (ValueError, ZeroDivisionError):
        return None


def inspect_file(path):
    relative = path.relative_to(ROOT).as_posix()
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    result = {"path": relative, "size_bytes": path.stat().st_size, "sha256": digest.hexdigest()}
    try:
        process = subprocess.run([binary("ffprobe"), "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)],
                                 capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=60)
        if process.returncode:
            raise RuntimeError(process.stderr.strip())
        data = json.loads(process.stdout)
        streams = data.get("streams", [])
        video = next((s for s in streams if s["codec_type"] == "video" and not s.get("disposition", {}).get("attached_pic")), None)
        audio = next((s for s in streams if s["codec_type"] == "audio"), None)
        tech = {"format": path.suffix[1:].lower(), "editable_color": False,
                "duration_sec": number(data.get("format", {}).get("duration")),
                "has_video": video is not None, "has_audio": audio is not None}
        tech["duration_basis"] = "container"
        if tech["duration_sec"] is None:
            packets = subprocess.run([binary("ffprobe"), "-v", "error", "-show_packets", "-show_entries",
                                      "packet=pts_time,duration_time", "-of", "json", str(path)],
                                     capture_output=True, text=True, encoding="utf-8", timeout=120, check=True)
            times = [(number(p.get("pts_time")), number(p.get("duration_time")) or 0)
                     for p in json.loads(packets.stdout).get("packets", [])]
            times = [(p, d) for p, d in times if p is not None]
            if times:
                tech["duration_sec"] = round(max(p + d for p, d in times) - max(0, min(p for p, d in times)), 6)
                tech["duration_basis"] = "packet_timestamps"
        if video:
            tech.update(width=video["width"], height=video["height"], fps=number(video.get("avg_frame_rate")),
                        video_codec=video.get("codec_name"), pixel_format=video.get("pix_fmt"),
                        aspect_ratio=str(Fraction(video["width"], video["height"])).replace("/", ":"))
        if audio:
            tech.update(sample_rate_hz=int(audio["sample_rate"]), channels=audio["channels"], audio_codec=audio.get("codec_name"))
        result["tech"] = tech
        result["probe_status"] = "ok"
        if process.stderr.strip():
            result["probe_warning"] = process.stderr.strip()
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError, RuntimeError, ValueError, KeyError) as error:
        result.update(probe_status="error", error=str(error))
    return result


def scan():
    files = media_files()
    with ThreadPoolExecutor(max_workers=8) as pool:
        rows = list(pool.map(inspect_file, files))
    write_json(OUT / "technical_inventory.json", rows)
    print(f"Scanned {len(rows)} files; errors: {sum(r['probe_status'] != 'ok' for r in rows)}", flush=True)


def previews():
    from PIL import Image, ImageDraw
    rows = [r for r in read_json(OUT / "technical_inventory.json") if r["path"].startswith("background/")]
    target = OUT / "previews"
    target.mkdir(parents=True, exist_ok=True)
    # Three samples per asset reveal changing colors/layouts; not a loop certification.
    for page in range(0, len(rows), 6):
        sheet = Image.new("RGB", (1050, 6 * 230), "#202020")
        draw = ImageDraw.Draw(sheet)
        for i, row in enumerate(rows[page:page + 6]):
            index = page + i + 1
            draw.text((10, i * 230 + 5), f"{index:02d}  {Path(row['path']).name}", fill="white")
            duration = row.get("tech", {}).get("duration_sec") or 1
            for col, fraction in enumerate((0.1, 0.5, 0.9)):
                frame = target / f"bg_{index:02d}_{col}.jpg"
                subprocess.run([binary("ffmpeg"), "-v", "error", "-y", "-ss", str(duration * fraction), "-i", str(ROOT / row["path"]),
                                "-frames:v", "1", "-vf", "scale=320:190:force_original_aspect_ratio=decrease", str(frame)],
                               check=True, capture_output=True, timeout=60)
                with Image.open(frame) as im:
                    sheet.paste(im, (col * 350 + (350 - im.width) // 2, i * 230 + 28))
                draw.text((col * 350 + 10, i * 230 + 213), f"{duration * fraction:.2f}s", fill="white")
        sheet.save(target / f"background_contact_{page // 6 + 1}.jpg")
    print(f"Created previews for {len(rows)} backgrounds", flush=True)


def slug(text):
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "_", text).strip("_")


def asset_id(path):
    prefix = "bg" if path.startswith("background/") else "char" if path.startswith("characters/") else "sfx"
    return f"{prefix}_{slug(Path(path).stem)[:70] or 'asset'}_{hashlib.sha256(path.encode()).hexdigest()[:10]}"


# Editorial recommendations inferred from explicit folder/name clues, not listening.
# role, tone, use_when, avoid_when, suggested level relative to narration
PROFILES = {
    "whoosh": ("sfx_transition", ["energetic"], "Chuyển chương hoặc lia/đẩy thẻ theo một hướng; đồng bộ với chuyển động lớn.", "Không dùng cho từng từ hoặc từng dòng trong cùng một ý.", -12),
    "riser": ("sfx_transition", ["suspense"], "Tăng chờ đợi trước câu hỏi, bước ngoặt hoặc phần kết luận; kết thúc tại điểm reveal.", "Không chạy liên tục dưới phần giải thích hoặc bảng số liệu.", -18),
    "impact": ("sfx_punctuation", ["dramatic"], "Nhấn một kết luận, con số bất ngờ hoặc tiêu đề hook khi thẻ xuất hiện.", "Không lặp mỗi item; tránh đè lên phụ âm đầu của lời đọc.", -14),
    "sub_drop": ("sfx_transition", ["dramatic", "serious"], "Đánh dấu bước ngoặt hoặc chốt chương bằng điểm rơi trầm.", "Tránh dùng ở checklist nhẹ nhàng hoặc nhiều lần sát nhau.", -18),
    "click": ("sfx_punctuation", ["neutral"], "Nhịp stamp khi thêm item vào checklist, chọn mục hoặc nhấn một nhãn.", "Không phát cho từng chữ; tránh dồn nhiều click cùng lúc.", -12),
    "ui": ("sfx_punctuation", ["neutral", "playful"], "Minh họa thao tác giao diện, trạng thái hoặc thông báo khớp với tên âm thanh.", "Tránh dùng âm báo lỗi cho trạng thái thành công; kiểm tra nội dung trước khi chọn.", -14),
    "bell": ("sfx_punctuation", ["bright"], "Đánh dấu đáp án, hoàn tất một bước hoặc xuất hiện điểm đáng nhớ.", "Tránh lặp chuông liên tục dưới lời đọc.", -14),
    "camera": ("sfx_punctuation", ["neutral"], "Minh họa chụp ảnh hoặc đóng băng khung hình/tư liệu.", "Không dùng như tiếng nhấn chung cho mọi thẻ.", -14),
    "glitch": ("sfx_transition", ["urgent", "tense"], "Minh họa lỗi hệ thống hoặc chuyển sang tình huống gián đoạn/công nghệ.", "Tránh cảnh cần bình tĩnh, đọc kỹ hoặc thông điệp thành công.", -16),
    "horn": ("sfx_transition", ["dramatic"], "Mở một chương kịch tính hoặc giới thiệu tình huống quy mô lớn.", "Tránh dùng cho thao tác nhỏ hay cảnh giải thích bình thường.", -18),
    "horror": ("sfx_transition", ["suspense", "tense"], "Tạo chờ đợi cho tình huống bí ẩn/căng thẳng đã được kịch bản yêu cầu.", "Không dùng cho nội dung trung tính hoặc cảnh dành cho trẻ nhỏ.", -20),
    "slow_motion": ("sfx_transition", ["suspense"], "Đi kèm đoạn chuyển động chậm để kéo dài khoảnh khắc trước reveal.", "Tránh làm chậm nhịp của danh sách hoặc hướng dẫn ngắn.", -18),
    "weapon": ("sfx_punctuation", ["urgent", "tense"], "Minh họa đúng hành động/vũ khí trong cảnh trò chơi hoặc tình huống tương ứng tên file.", "Không dùng để nhấn dữ liệu hay chuyển thẻ trong explainer thông thường.", -20),
    "ambience": ("sfx_punctuation", ["neutral"], "Minh họa bối cảnh/vật thể tương ứng tên file (lửa, nước, tàu hoặc môi trường).", "Không giả định là loop liền mạch; không phủ dài dưới lời đọc khi chưa nghe kiểm tra.", -24),
    "music_excerpt": ("music_bed", ["unknown"], "Đoạn có tên gợi ý nhạc: nghe xác nhận sắc thái trước khi chọn đoạn nền phù hợp cảnh.", "Không tự lặp hoặc dùng xuyên suốt; có thể chứa giọng hát và thay đổi nhịp.", -24),
    "meme": ("sfx_punctuation", ["playful"], "Phản ứng hài ngắn hoặc punchline khi kịch bản gọi đúng meme/nhân vật; nghe xác nhận câu nói.", "Tránh cảnh nghiêm túc, trích dẫn nguồn và phần đang có lời đọc chính.", -18),
    "unclassified": ("sfx_punctuation", ["unknown"], "Chưa đủ bằng chứng phân loại; nghe file trước khi chọn ngữ cảnh sử dụng.", "Không tự động chọn cho cảnh chỉ dựa vào tên file.", -18),
    "pop_snap": ("sfx_punctuation", ["playful"], "Nhấn nhịp xuất hiện item, bong bóng chú thích hoặc tick hoàn thành bằng tiếng pop/snap ngắn.", "Nếu file chứa chuỗi âm, cắt một nhịp phù hợp; không chồng nhiều lần dưới lời đọc.", -12),
    "foley": ("sfx_punctuation", ["neutral"], "Minh họa thao tác/vật thể được gọi tên: bánh răng, dây xích, dụng cụ hoặc bề mặt.", "Không dùng thay tiếng chuyển cảnh chung; chọn đúng hành động sau khi nghe.", -18),
    "cash_register": ("sfx_punctuation", ["bright"], "Nhấn giao dịch, doanh thu hoặc số tiền vừa xuất hiện trong cảnh minh họa.", "Tránh lặp cho mọi con số hoặc dùng ở cảnh tổn thất nghiêm túc.", -14),
    "magic": ("sfx_punctuation", ["playful"], "Minh họa biến đổi, xuất hiện bất ngờ hoặc điểm sáng của một giải pháp.", "Tránh làm nội dung số liệu/trích dẫn có cảm giác viễn tưởng.", -16),
    "game_cue": ("sfx_punctuation", ["playful"], "Minh họa hành động hoặc phản hồi trong trò chơi được gọi tên; nghe xác nhận cue trước khi đồng bộ hình.", "Không dùng làm phản hồi UI chung khi âm gắn với một trò chơi cụ thể.", -16),
    "vocal_reaction": ("sfx_punctuation", ["playful"], "Phản ứng bằng giọng người, cảm thán hoặc cổ vũ cho một punchline; nghe và kiểm tra câu nói trước khi dùng.", "Tránh chồng với giọng đọc chính hoặc dùng khi không biết nghĩa câu nói.", -18),
}


# Curated by hand for each specific icon picked for this domain (fintech reconciliation
# explainer content) — not inferred from filename like the SFX PROFILES above, so
# confidence is high and review.semantic is "curated" rather than "needs_listening".
CHARACTER_PROFILES = {
    "money-bag": ("metaphor", "Doanh thu, tiền, giá trị giao dịch cần nhấn mạnh.",
                  "Cảnh nói về chi phí/tổn thất — dùng icon cảnh báo thay vì túi tiền.", ["neutral", "bright"], True),
    "invoice": ("diagram_element", "Chứng từ, hóa đơn, giao dịch cần đối soát.",
                "Không dùng cho khái niệm trừu tượng không liên quan giấy tờ.", ["neutral"], True),
    "building": ("metaphor", "Ngân hàng, doanh nghiệp, tổ chức làm chủ thể trong câu chuyện.",
                 "Không dùng đại diện cho cá nhân/khách hàng lẻ.", ["neutral", "serious"], True),
    "diagram-up": ("diagram_element", "Tăng trưởng, xu hướng tích cực, số liệu đi lên.",
                   "Không dùng khi số liệu đi xuống hoặc trung tính.", ["bright", "playful"], True),
    "calendar": ("diagram_element", "Kỳ đối soát, deadline, mốc thời gian định kỳ.",
                 "Không dùng cho sự kiện tức thời (dùng clock-circle thay thế).", ["neutral"], True),
    "clock-circle": ("diagram_element", "Tính khẩn cấp, xử lý theo thời gian thực, tốc độ.",
                      "Không dùng cho lịch trình định kỳ dài hạn (dùng calendar thay thế).", ["urgent"], True),
    "alert-triangle": ("metaphor", "Sai lệch, cảnh báo, giao dịch bất thường cần chú ý.",
                        "Không dùng cho kết quả thành công hoặc trung tính.", ["urgent", "serious"], True),
    "check-circle": ("metaphor", "Đã đối soát khớp, hoàn tất, xác nhận thành công.",
                     "Không dùng khi kết quả còn sai lệch/chưa xử lý xong.", ["calm", "bright"], True),
    "search-minus3": ("metaphor", "Tra soát, kiểm tra, truy vết giao dịch/nguyên nhân.",
                      "Không dùng cho bước hành động (đã tìm xong) — chỉ dùng cho giai đoạn tìm kiếm.", ["neutral"], True),
    "lock": ("metaphor", "Bảo mật, tuân thủ, quyền riêng tư dữ liệu tài chính.",
             "Không dùng cho nội dung không liên quan bảo mật/compliance.", ["serious", "calm"], True),
    "scale2": ("metaphor", "So sánh, cân đối 2 phía (thu-chi, kỳ vọng-thực tế).",
               "Không dùng khi chỉ có 1 chiều dữ liệu, không phải so sánh.", ["neutral", "serious"], True),
    "handshake": ("metaphor", "Hợp tác, thỏa thuận, tích hợp giữa 2 bên/hệ thống.",
                  "Không dùng cho xung đột/tranh chấp — dùng alert-triangle hoặc scale2.", ["calm", "bright"], True),
    "lightbulb": ("metaphor", "Giải pháp, insight, ý tưởng chốt lại vấn đề.",
                  "Không dùng ở phần mở bài/đặt vấn đề — chỉ dùng lúc đưa giải pháp.", ["bright", "playful"], True),
    "puzzle-piece": ("metaphor", "Giải pháp khớp đúng nhu cầu, tích hợp nhiều phần thành một hệ thống.",
                     "Không dùng cho một hành động đơn lẻ, chỉ dùng cho khái niệm 'khớp nối'.", ["playful", "neutral"], True),
    "users": ("character", "Các bên liên quan, đội ngũ, khách hàng/nhân viên kế toán làm nhân vật trong câu chuyện.",
              "Không dùng để minh họa 1 cá nhân cụ thể có vai trò khác biệt — dùng cho nhóm chung.", ["neutral", "calm"], True),
    "credit-card": ("diagram_element", "Giao dịch quẹt thẻ, chi tiêu bằng hạn mức tín dụng.",
                    "Không dùng cho giao dịch tiền mặt/chuyển khoản trực tiếp.", ["neutral"], True),
    "mobile": ("diagram_element", "Mua trả góp/thanh toán qua ứng dụng di động.",
               "Không dùng đại diện chung cho 'công nghệ' — chỉ dùng cho ngữ cảnh giao dịch trên điện thoại.", ["neutral"], True),
}

# Hand-authored: reusable animation/transition recipes built from the confirmed-working
# libraries in app/ (GSAP, rough-notation, Remotion's own spring()/interpolate()).
# "verification" states whether the exact pattern was rendered end-to-end in this project
# (see app/src/StackDemo.tsx, deleted after the smoke test) or is a documented recipe only.
EFFECTS = [
    {"id": "fx_underline_draw", "subtype": "gạch chân tự vẽ (width 0% → 100%)", "tier": "micro",
     "timing_hint_sec": 0.3, "triggers_on": "word_boundary",
     "use_when": "Nhấn 1 từ khóa vừa được đọc xong trong cùng một ý.",
     "avoid_when": "Không dùng cho cả câu dài — chỉ 1-3 từ khóa ngắn.",
     "library": "rough-notation", "api": "annotate(node, {type: 'underline'})",
     "verification": "rendered_smoke_test"},
    {"id": "fx_circle_highlight", "subtype": "khoanh tròn tự vẽ quanh 1 vùng/số liệu", "tier": "micro",
     "timing_hint_sec": 0.4, "triggers_on": "word_boundary",
     "use_when": "Khoanh vùng 1 con số hoặc icon quan trọng vừa xuất hiện.",
     "avoid_when": "Không dùng đồng thời với underline trên cùng một phần tử.",
     "library": "rough-notation", "api": "annotate(node, {type: 'circle'})",
     "verification": "documented_pattern_untested"},
    {"id": "fx_card_scale_in", "subtype": "card/box scale+rotate spring vào khung hình", "tier": "chapter",
     "timing_hint_sec": 1.0, "triggers_on": "manual",
     "use_when": "Mở đầu 1 card/chương mới, cần cảm giác 'bật vào' rõ ràng.",
     "avoid_when": "Không lạm dụng cho mọi phần tử nhỏ trong cùng 1 card — chỉ 1 lần/card.",
     "library": "gsap", "api": "gsap.fromTo(node, {scale:0, rotate:-45}, {scale:1, rotate:0, ease:'back.out(1.7)'})",
     "gotcha": "GSAP chạy theo đồng hồ thực; phải neo timeline theo frame/fps (xem SKILL.md video-stack) để khớp khi export MP4.",
     "verification": "rendered_smoke_test"},
    {"id": "fx_stagger_fade_in_list", "subtype": "danh sách item fade+dịch lên lần lượt", "tier": "stamp",
     "timing_hint_sec": 0.15, "triggers_on": "sentence_end",
     "use_when": "Liệt kê nhiều mục (>=3) cần xuất hiện tuần tự, không phải cùng lúc.",
     "avoid_when": "Không dùng khi chỉ có 1-2 mục — dùng fx_card_scale_in thay thế.",
     "library": "gsap", "api": "gsap.from(items, {opacity:0, y:20, stagger:0.15})",
     "gotcha": "Cùng lưu ý đồng hồ thực như fx_card_scale_in.",
     "verification": "documented_pattern_untested"},
    {"id": "fx_stamp_pop_item", "subtype": "1 item bật to rồi về đúng kích thước khi thêm vào bảng/checklist", "tier": "stamp",
     "timing_hint_sec": 0.25, "triggers_on": "word_boundary",
     "use_when": "Thêm từng dòng vào bảng/checklist, đi kèm sfx_punctuation.",
     "avoid_when": "Không dùng cho cảnh cần giữ yên tĩnh/nghiêm túc liên tục.",
     "library": "remotion", "api": "spring({frame, fps, config:{damping:10}}) áp vào scale",
     "verification": "documented_pattern_untested"},
    {"id": "fx_chapter_wipe_transition", "subtype": "chuyển chương bằng slide/wipe toàn khung hình", "tier": "chapter",
     "timing_hint_sec": 0.6, "triggers_on": "manual",
     "use_when": "Chuyển từ card này sang card khác ở ranh giới 1 chương/ý lớn.",
     "avoid_when": "Không dùng giữa 2 câu trong cùng một ý — chỉ ở ranh giới chương.",
     "library": "remotion", "api": "interpolate(frame, [0,18], [0,-width]) áp vào translateX của <AbsoluteFill>",
     "verification": "documented_pattern_untested"},
    {"id": "fx_hold_static_frame", "subtype": "giữ khung hình tĩnh, không animation", "tier": "hold",
     "timing_hint_sec": None, "triggers_on": "manual",
     "use_when": "Card có bảng số liệu/nhiều chữ nhỏ cần người xem đọc, tránh phân tán chú ý.",
     "avoid_when": "Không dùng cho card hook/mở bài cần gây ấn tượng ngay.",
     "library": "self-generated-code", "api": "không áp animation — render tĩnh trong toàn bộ durationInFrames",
     "verification": "rendered_smoke_test"},
    {"id": "fx_lottie_icon_loop", "subtype": "icon chuyển động lặp (vd. loading, tia sáng, nhịp đập)", "tier": "micro",
     "timing_hint_sec": None, "triggers_on": "manual",
     "use_when": "Icon cần 'sống động' hơn SVG tĩnh, có sẵn file Lottie JSON phù hợp.",
     "avoid_when": "Không dùng khi không có file Lottie JSON chất lượng — không tự vẽ Lottie bằng tay.",
     "library": "lottie-react", "api": "<Lottie animationData={json} loop />",
     "verification": "documented_pattern_untested"},
]


def classify(path):
    text = path.lower()
    stem = Path(path).stem.lower()
    rules = [
        ("weapon", r"gun sfx"), ("riser", r"riser"),
        ("slow_motion", r"slow motion|slow mo"), ("sub_drop", r"sub.?drop|bass.drop"),
        ("horn", r"horn"), ("glitch", r"glitch"),
        ("whoosh", r"whoosh|woosh|swoosh|swish"),
        ("impact", r"/hits/|\bhit\b|impact|explosion|punch|\bboom\b"),
        ("click", r"/clicks/|/buttons/|click"),
        ("ui", r"digital hud|notification|notifikasi|interface|\bui\b|\bbeep\b|\bbips\b|keyboard|typing|confirm|apple pay"),
        ("cash_register", r"cash.register|kaching|cha.ching"),
        ("pop_snap", r"\bpop\b|snap|clap|bubble"),
        ("bell", r"/bells/|\bbell\b|\bding\b|clink"), ("camera", r"camera|shutter"),
        ("horror", r"horror|tension"), ("ambience", r"/element/|water.droplet|ambien|drone"),
        ("foley", r"bicycle|bike.chain|chain|gear|wrench|scrape|object.slide|chalk|clock.ticking"),
        ("magic", r"magic|sparkle"),
        ("whoosh", r"transition sound effects"),
    ]
    for profile, pattern in rules:
        if re.search(pattern, text):
            return profile, pattern
    if re.search(r"\bmusic\d*\b|\bsong\b|\btheme\b|\bost\b|ringtone|sad-music|remix", stem):
        return "music_excerpt", "filename_music_keyword"
    if "/memes/" in text or re.search(r"meme|spongebob|one.piece|naruto|fart|laugh|faaaaaah|fahhh", text):
        return "meme", "folder_or_filename_meme_keyword"
    if re.search(r"minecraft|mario.coin|hitmarker|valorant.loading|sonic.spring|tf2.bonk", stem):
        return "game_cue", "filename_game_keyword"
    if re.search(r"\bbruh\b|\bwow\b|\bsheesh\b|\byessir\b|kids.cheering|\bnope\b|oh.shit|aw.hell.nah", stem):
        return "vocal_reaction", "filename_reaction_keyword"
    return "unclassified", "insufficient_filename_evidence"


def build_characters():
    assets = []
    for path in character_files():
        rel = path.relative_to(ROOT).as_posix()
        stem = path.stem
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        svg_text = path.read_text(encoding="utf-8")
        profile = CHARACTER_PROFILES.get(stem)
        asset = {
            "id": asset_id(rel), "category": "character", "name_display": stem.replace("-", " ").title(),
            "pairs_well_with": [],
            "source": {"origin": "reicon", "url_or_path": rel, "license": "MIT",
                       "attribution_required": False, "license_status": "verified",
                       "attribution_status": "not_required", "collection": "reicon"},
            "tech": {"format": "svg", "editable_color": "currentColor" in svg_text, "duration_sec": None},
            "file": {"size_bytes": path.stat().st_size, "sha256": digest},
        }
        if profile:
            role, use_when, avoid_when, tone, reusable = profile
            asset.update(subtype=f"reicon icon: {stem}", illustration_role=role, use_when=use_when,
                         avoid_when=avoid_when, emotional_tone=tone, reusable_across_topics=reusable)
            asset["review"] = {"technical": "ok", "license": "ok", "semantic": "curated"}
        else:
            asset.update(subtype=f"reicon icon: {stem}", illustration_role="diagram_element",
                         use_when="Chưa gán ngữ cảnh cụ thể — xem tên icon trước khi dùng.",
                         avoid_when="Không dùng tự động cho tới khi được gán use_when cụ thể.",
                         emotional_tone=["unknown"], reusable_across_topics=False)
            asset["review"] = {"technical": "ok", "license": "ok", "semantic": "needs_curation"}
        assets.append(asset)
    return assets


def build_effects():
    assets = []
    for effect in EFFECTS:
        asset = {
            "id": effect["id"], "category": "effect", "name_display": effect["id"].removeprefix("fx_").replace("_", " ").title(),
            "subtype": effect["subtype"], "use_when": effect["use_when"], "avoid_when": effect["avoid_when"],
            "emotional_tone": ["unknown"], "pairs_well_with": [],
            "tier": effect["tier"], "timing_hint_sec": effect["timing_hint_sec"], "triggers_on": effect["triggers_on"],
            "source": {"origin": "self-generated-code", "url_or_path": f"app/src (pattern, xem SKILL.md video-stack)",
                       "license": "MIT" if effect["library"] in {"gsap", "rough-notation", "lottie-react"} else "n/a",
                       "attribution_required": False, "license_status": "verified" if effect["library"] != "self-generated-code" else "n/a",
                       "attribution_status": "not_required", "collection": effect["library"]},
            "tech": {"format": "code-pattern", "editable_color": True, "duration_sec": None},
            "review": {"technical": "ok", "license": "ok", "semantic": effect["verification"]},
            "implementation": {"library": effect["library"], "api": effect["api"]},
        }
        if "gotcha" in effect:
            asset["implementation"]["gotcha"] = effect["gotcha"]
        assets.append(asset)
    return assets


def build():
    inventory = read_json(OUT / "technical_inventory.json")
    overrides_path = OUT / "background_annotations.json"
    annotations = read_json(overrides_path) if overrides_path.exists() else {}
    catalogs = {"background": [], "sound": [], "character": build_characters(), "effect": build_effects()}
    for row in inventory:
        path = row["path"]
        category = "background" if path.startswith("background/") else "sound"
        asset = {"id": asset_id(path), "category": category, "name_display": Path(path).stem,
                 "pairs_well_with": [],
                 "source": {"origin": "other", "url_or_path": path, "license": "unknown",
                            "attribution_required": True,
                            "license_status": "unverified", "attribution_status": "unverified",
                            "collection": str(Path(path).parent).replace("\\", "/")},
                 "tech": row.get("tech", {"format": Path(path).suffix[1:], "editable_color": False, "duration_sec": None}),
                 "file": {"size_bytes": row["size_bytes"], "sha256": row["sha256"]},
                 "review": {"technical": row["probe_status"], "license": "pending"}}
        if category == "background":
            asset.update(subtype="motion_background", use_when="Nền cho card hook hoặc chuyển chương; xem preview trước khi chọn.",
                         avoid_when="Không đặt chữ nhỏ trực tiếp lên nền chuyển động chưa kiểm tra tương phản.",
                         emotional_tone=["unknown"], layout_role="full_bg", visual_weight="high")
            if path in annotations:
                asset.update(annotations[path])
                asset["review"].update(semantic="sampled_frames_reviewed", evidence="frames_at_10_50_90_percent", loop="not_verified")
            else:
                asset["review"].update(semantic="pending", loop="not_verified")
            asset["playback"] = {"mute_source_audio": True, "loop_verified": False}
            if Path(path).name.startswith("YTSave_"):
                asset.update(reference_only=True, replaced_by=None)
                asset["review"]["reference_reason"] = "downloaded_video_filename; source/license pending"
        else:
            profile, clue = classify(path)
            role, tone, use, avoid, level = PROFILES[profile]
            asset.update(subtype=profile, audio_role=role, emotional_tone=tone, use_when=use, avoid_when=avoid,
                         mix_level_db_relative=level, loopable=False)
            asset["description"] = f"Nhãn suy từ tên: {Path(path).stem}; nhóm thư mục: {Path(path).parent.name}. Chưa nghe xác nhận."
            asset["review"].update(semantic="needs_listening", label_basis="folder_and_filename", classification_rule=clue,
                                   classification_confidence="low" if profile in {"unclassified", "meme", "music_excerpt"} else "medium",
                                   mix="suggested_not_measured", loop="not_verified")
            if asset["tech"].get("has_video"):
                asset["playback"] = {"audio_stream_only": True}
            if profile in {"meme", "music_excerpt", "game_cue", "vocal_reaction"}:
                asset.update(reference_only=True, replaced_by=None)
                asset["review"]["reference_reason"] = "recognizable_excerpt_filename; source/license pending"
        if "probe_warning" in row:
            asset["review"]["probe_warning"] = row["probe_warning"]
        if "error" in row:
            asset["review"]["probe_error"] = row["error"]
        catalogs[category].append(asset)
    hashes = defaultdict(list)
    for asset in catalogs["background"] + catalogs["sound"]:
        hashes[asset["file"]["sha256"]].append(asset)
    duplicates = []
    for group in hashes.values():
        if len(group) > 1:
            canonical = group[0]["id"]
            duplicates.append({"canonical_id": canonical, "asset_ids": [a["id"] for a in group]})
            for other in group[1:]:
                other["duplicate_of"] = canonical
    for category, filename in (("background", "background.json"), ("sound", "sfx.json"),
                                ("character", "character.json"), ("effect", "effect.json")):
        write_json(OUT / filename, catalogs[category])
    all_assets = catalogs["background"] + catalogs["sound"] + catalogs["character"] + catalogs["effect"]
    write_json(OUT / "index.json", {
        "schema_document": "docs/asset_metadata_schema.md", "path_base": "repository_root",
        "catalogs": [{"path": "metadata/background.json", "category": "background", "count": len(catalogs["background"])},
                     {"path": "metadata/sfx.json", "category": "sound", "count": len(catalogs["sound"])},
                     {"path": "metadata/character.json", "category": "character", "count": len(catalogs["character"])},
                     {"path": "metadata/effect.json", "category": "effect", "count": len(catalogs["effect"])}],
        "total_assets": len(all_assets), "subtype_counts": dict(sorted(Counter(a["subtype"] for a in all_assets).items())),
        "probe_errors": [a["id"] for a in all_assets if a["review"]["technical"] != "ok"],
        "unknown_license_count": sum(a["source"]["license"] == "unknown" for a in all_assets),
        "reference_only_count": sum(a.get("reference_only", False) for a in all_assets),
        "needs_listening_count": sum(a["review"]["semantic"] == "needs_listening" for a in all_assets),
        "needs_curation_count": sum(a["review"]["semantic"] == "needs_curation" for a in all_assets),
        "exact_duplicate_groups": duplicates,
    })
    print(f"Built {len(all_assets)} asset entries; {len(duplicates)} exact duplicate groups", flush=True)


def validate():
    assets = read_json(OUT / "background.json") + read_json(OUT / "sfx.json")
    ids = [a["id"] for a in assets]
    assert len(ids) == len(set(ids)), "Duplicate IDs"
    paths = [a["source"]["url_or_path"] for a in assets]
    assert len(paths) == len(set(paths)), "Duplicate paths"
    assert set(paths) == {p.relative_to(ROOT).as_posix() for p in media_files()}, "Missing/stale assets"
    required = {"id", "category", "subtype", "name_display", "use_when", "avoid_when", "emotional_tone", "pairs_well_with", "source", "tech"}
    for a in assets:
        assert required <= a.keys(), a["id"]
        assert re.fullmatch(r"[a-z][a-z0-9_]*", a["id"]), a["id"]
        assert all(link in ids for link in a["pairs_well_with"]), a["id"]
        assert a.get("duplicate_of", a["id"]) in ids, a["id"]
        assert (ROOT / a["source"]["url_or_path"]).stat().st_size == a["file"]["size_bytes"], a["id"]
        if a["review"]["technical"] == "ok":
            assert a["tech"]["duration_sec"] and a["tech"]["duration_sec"] > 0, a["id"]
            assert a["tech"]["has_video" if a["category"] == "background" else "has_audio"], a["id"]
        assert isinstance(a["source"]["attribution_required"], bool)
        if a["category"] == "background":
            assert a["layout_role"] in {"full_bg", "card_surface", "overlay_texture"}
            assert a["visual_weight"] in {"low", "high"}
        else:
            assert a["audio_role"] in {"music_bed", "voice", "sfx_punctuation", "sfx_transition"}
            assert isinstance(a["mix_level_db_relative"], (int, float))
            assert isinstance(a["loopable"], bool)
    print(f"Validated {len(assets)} entries: coverage, IDs, paths, fields, streams, durations, references", flush=True)


def validate_characters_effects():
    characters = read_json(OUT / "character.json")
    effects = read_json(OUT / "effect.json")
    all_ids = [a["id"] for a in characters + effects]
    assert len(all_ids) == len(set(all_ids)), "Duplicate character/effect IDs"
    char_paths = [a["source"]["url_or_path"] for a in characters]
    assert set(char_paths) == {p.relative_to(ROOT).as_posix() for p in character_files()}, "Missing/stale character assets"
    required = {"id", "category", "subtype", "name_display", "use_when", "avoid_when", "emotional_tone", "pairs_well_with", "source", "tech"}
    for a in characters:
        assert required <= a.keys(), a["id"]
        assert re.fullmatch(r"[a-z][a-z0-9_]*", a["id"]), a["id"]
        assert (ROOT / a["source"]["url_or_path"]).stat().st_size == a["file"]["size_bytes"], a["id"]
        assert a["illustration_role"] in {"metaphor", "character", "diagram_element", "authority_mark"}, a["id"]
        assert isinstance(a["reusable_across_topics"], bool), a["id"]
    for a in effects:
        assert required <= a.keys(), a["id"]
        assert re.fullmatch(r"[a-z][a-z0-9_]*", a["id"]), a["id"]
        assert a["tier"] in {"micro", "chapter", "stamp", "hold"}, a["id"]
        assert a["triggers_on"] in {"word_boundary", "sentence_end", "manual"}, a["id"]
        assert a["review"]["semantic"] in {"rendered_smoke_test", "documented_pattern_untested"}, a["id"]
    print(f"Validated {len(characters)} character + {len(effects)} effect entries: coverage, IDs, paths, fields", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["scan", "previews", "build", "validate", "all"])
    command = parser.parse_args().command
    if command == "all":
        scan()
        build()
        validate()
        validate_characters_effects()
    elif command == "validate":
        validate()
        validate_characters_effects()
    else:
        globals()[command]()
