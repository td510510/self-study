"""Kiem tra mot thu muc capstone da du thu can nop chua.

    python curriculum/11-capstone/kiem_tra_capstone.py duong/dan/toi/capstone

SCRIPT NAY KHONG CHAM CHAT LUONG CODE.
    No chi dam bao ban KHONG QUEN thu gi. Mot capstone thieu bo eval hay thieu
    README co so lieu thi khong the "tot" duoc, bat ke code dep den dau - va do
    la thu kiem tra bang may duoc.

Thoat voi ma 0 neu du, ma 1 neu con thieu.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

MAU_KEY = re.compile(r"sk-ant-api[0-9]{2}-[A-Za-z0-9_-]{20,}")
CHO_PHEP = re.compile(r"(?i)(KHOA-GIA|VIDU|vidu|example|placeholder|xxx|KHONG-THAT)")

DUOI_MA_NGUON = (".py", ".md", ".toml", ".yml", ".yaml", ".json", ".txt", ".ipynb")
BO_QUA_THU_MUC = {".git", "node_modules", ".venv", "venv", "__pycache__",
                  ".pytest_cache", ".ruff_cache", "data"}


def _cac_file(goc: Path):
    for f in goc.rglob("*"):
        if f.is_file() and not (set(f.parts) & BO_QUA_THU_MUC):
            yield f


def _co_file(goc: Path, *mau: str) -> Path | None:
    """Tim file dau tien khop bat ky mau nao."""
    for m in mau:
        for f in goc.rglob(m):
            if f.is_file() and not (set(f.parts) & BO_QUA_THU_MUC):
                return f
    return None


def kiem_cau_truc(goc: Path):
    return [
        ("README.md", _co_file(goc, "README.md", "readme.md") is not None,
         "Thứ nhà tuyển dụng đọc đầu tiên"),
        ("Dockerfile", _co_file(goc, "Dockerfile") is not None,
         "Phase 10: đóng gói để deploy"),
        (".dockerignore", _co_file(goc, ".dockerignore") is not None,
         "Phase 10: chặn .env và .git vào ảnh"),
        ("CI workflow", _co_file(goc, "ci.yml", "ci.yaml") is not None,
         "Phase 10: .github/workflows/"),
        ("File test", _co_file(goc, "test_*.py", "*_test.py") is not None,
         "Phase 07-10: test chạy không cần API key"),
    ]


def kiem_eval(goc: Path):
    bo_test = _co_file(goc, "bo_test.json", "cau_hoi_vang.json", "eval*.json")
    so_mau, co_baseline = 0, False

    if bo_test is not None:
        try:
            d = json.loads(bo_test.read_text(encoding="utf-8"))
            so_mau = len(d) if isinstance(d, list) else len(
                d.get("cac_ca", d.get("bo_test", [])))
        except (json.JSONDecodeError, UnicodeDecodeError):
            so_mau = 0

    for f in _cac_file(goc):
        if f.suffix in DUOI_MA_NGUON:
            try:
                if "baseline" in f.read_text(encoding="utf-8").lower():
                    co_baseline = True
                    break
            except (UnicodeDecodeError, PermissionError):
                pass

    return [
        ("Bộ eval (file JSON)", bo_test is not None,
         "Phase 07-09: không có eval thì không biết nó đúng bao nhiêu"),
        (f"Bộ eval >= 30 mẫu (đang có {so_mau})", so_mau >= 30,
         "30 mẫu là mức tối thiểu để một con số có nghĩa"),
        ("Có nhắc tới baseline", co_baseline,
         "Phase 04: 'đạt 0.85' vô nghĩa khi chưa biết baseline"),
    ]


def kiem_readme(goc: Path):
    readme = _co_file(goc, "README.md", "readme.md")
    if readme is None:
        return [("README có số liệu", False, "Chưa có README")]

    noi_dung = readme.read_text(encoding="utf-8")
    thuong = noi_dung.lower()
    co_so = bool(re.search(r"\|[^|\n]*\d+[.,]\d+[^|\n]*\|", noi_dung))

    return [
        ("README có bảng số liệu", co_so,
         "'Hoạt động tốt' là câu vô nghĩa; '0.87 trên 42 ca' thì không"),
        ("README có phần hạn chế",
         any(t in thuong for t in ("hạn chế", "han che", "limitation",
                                   "chưa làm được", "không dùng được")),
         "Người viết được phần này là người hiểu hệ thống của mình"),
        ("README có phần sai/bài học",
         any(t in thuong for t in ("sai ở đâu", "sai o dau", "bài học", "bai hoc")),
         "Mục này gây ấn tượng mạnh hơn mục kết quả"),
        ("README có link demo", "http" in thuong,
         "Phase 10: URL công khai người khác mở được"),
    ]


def kiem_bao_mat(goc: Path):
    lo_key = []
    gitignore = goc / ".gitignore"
    co_gitignore = gitignore.exists()
    env_bi_bo_qua = (co_gitignore
                     and ".env" in gitignore.read_text(encoding="utf-8"))

    for f in _cac_file(goc):
        if f.suffix not in DUOI_MA_NGUON:
            continue
        try:
            for so_dong, dong in enumerate(
                    f.read_text(encoding="utf-8").splitlines(), 1):
                if MAU_KEY.search(dong) and not CHO_PHEP.search(dong):
                    lo_key.append(f"{f.relative_to(goc)}:{so_dong}")
        except (UnicodeDecodeError, PermissionError):
            pass

    return [
        ("Không có API key trong mã nguồn", not lo_key,
         ("Lộ tại: " + ", ".join(lo_key[:3])) if lo_key
         else "Lộ key thì phải XOAY key - xoá khỏi code là chưa đủ"),
        ("Có .gitignore", co_gitignore, "Phase 10"),
        (".env không có nguy cơ bị commit",
         env_bi_bo_qua or not (goc / ".env").exists(),
         "Đang có file .env mà .gitignore không loại trừ nó"),
    ]


NHOM = [
    ("Cấu trúc", kiem_cau_truc),
    ("Bộ eval", kiem_eval),
    ("README", kiem_readme),
    ("Bảo mật", kiem_bao_mat),
]


def main() -> int:
    for luong in (sys.stdout, sys.stderr):
        ma = (getattr(luong, "encoding", "") or "").lower().replace("-", "")
        if ma != "utf8" and hasattr(luong, "reconfigure"):
            luong.reconfigure(encoding="utf-8", errors="replace")

    if len(sys.argv) < 2:
        print(__doc__)
        return 2

    goc = Path(sys.argv[1]).resolve()
    if not goc.is_dir():
        print(f"Không tìm thấy thư mục: {goc}")
        return 2

    print(f"Kiểm tra capstone tại: {goc}\n")

    tong, dat, thieu = 0, 0, []
    for ten_nhom, ham in NHOM:
        print(f"-- {ten_nhom} " + "-" * (56 - len(ten_nhom)))
        for ten, ok, ghi_chu in ham(goc):
            tong += 1
            dat += ok
            print(f"  {'✅' if ok else '❌'} {ten}")
            if not ok:
                thieu.append(ten)
                if ghi_chu:
                    print(f"       -> {ghi_chu}")
        print()

    print("=" * 60)
    print(f"Đạt {dat}/{tong} mục")

    if thieu:
        print(f"\nCòn thiếu {len(thieu)} mục:")
        for t in thieu:
            print(f"  · {t}")
        print("\nScript này chỉ kiểm thứ ĐẾM ĐƯỢC. Đủ hết các mục không có")
        print("nghĩa là capstone tốt - nhưng thiếu một mục thì gần như chắc")
        print("chắn là chưa xong.")
        return 1

    print("\nĐủ các mục bắt buộc.")
    print("Giờ tới bài test thật: gửi link cho một người ngoài ngành và hỏi")
    print('"cái này làm gì và nó có tốt không". Họ trả lời được cả hai vế chứ?')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
