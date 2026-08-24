"""Kiem tra moi truong hoc tap da san sang chua.

Chay:
    python curriculum/00-setup/exercises/check_environment.py

Script nay KHONG phai bai tap - ban khong can sua gi.
No chi kiem tra va bao cho ban biet con thieu gi.
"""

from __future__ import annotations

import importlib.metadata
import os
import platform
import shutil
import subprocess
import sys

# --------------------------------------------------------------------------
# Tien ich in ra man hinh
# --------------------------------------------------------------------------
WIDTH = 62
loi_can_sua: list[str] = []


def tieu_de(text: str) -> None:
    print("=" * WIDTH)
    print(f"  {text}")
    print("=" * WIDTH)


def ok(msg: str) -> None:
    print(f"[PASS] {msg}")


def fail(msg: str, cach_sua: str) -> None:
    print(f"[FAIL] {msg}")
    print(f"       -> {cach_sua}")
    loi_can_sua.append(msg)


def skip(msg: str) -> None:
    print(f"[SKIP] {msg}")


# --------------------------------------------------------------------------
# Cac phep kiem tra
# --------------------------------------------------------------------------
def kiem_tra_python() -> None:
    major, minor = sys.version_info[:2]
    phien_ban = f"{major}.{minor}.{sys.version_info[2]}"
    if (major, minor) >= (3, 11):
        ok(f"Python {phien_ban}")
    else:
        fail(
            f"Python {phien_ban} - qua cu, chuong trinh can >= 3.11",
            "Tai ban moi tai https://www.python.org/downloads/ va nho tick 'Add to PATH'",
        )


def kiem_tra_venv() -> None:
    trong_venv = sys.prefix != getattr(sys, "base_prefix", sys.prefix)
    if trong_venv:
        ok("Dang chay trong moi truong ao (.venv)")
    else:
        fail(
            "KHONG chay trong moi truong ao",
            r"Chay:  .\.venv\Scripts\Activate.ps1   (xem SETUP.md muc 4)",
        )


def kiem_tra_git() -> None:
    duong_dan = shutil.which("git")
    if duong_dan is None:
        fail(
            "Khong tim thay Git",
            "Cai tai https://git-scm.com/download/win roi mo lai terminal",
        )
        return
    try:
        out = subprocess.run(
            ["git", "--version"], capture_output=True, text=True, timeout=10, check=False
        )
        ok(out.stdout.strip() or "Git da cai")
    except Exception:  # noqa: BLE001
        fail("Git co nhung khong chay duoc", "Thu mo lai terminal")


def kiem_tra_thu_vien() -> None:
    """Kiem tra nhom [core] - cac thu vien can cho Phase 00-03."""
    can_co = ["numpy", "pandas", "matplotlib", "seaborn", "pytest", "jupyter"]
    thieu: list[str] = []

    for ten in can_co:
        try:
            phien_ban = importlib.metadata.version(ten)
            ok(f"{ten:<12} {phien_ban}")
        except importlib.metadata.PackageNotFoundError:
            thieu.append(ten)

    if thieu:
        fail(
            f"Thieu thu vien: {', '.join(thieu)}",
            'Chay:  pip install -e ".[core]"',
        )


def kiem_tra_api_key() -> None:
    key = os.environ.get("ANTHROPIC_API_KEY", "")

    # Thu doc tu file .env neu co
    if not key:
        try:
            from dotenv import load_dotenv  # type: ignore[import-not-found]

            load_dotenv()
            key = os.environ.get("ANTHROPIC_API_KEY", "")
        except ImportError:
            pass

    if not key:
        skip("ANTHROPIC_API_KEY chua dat (chi can tu Tuan 16 - Phase 07)")
    elif key.startswith("sk-ant-") and "thay-bang-key" not in key:
        ok(f"ANTHROPIC_API_KEY da dat ({key[:14]}...)")
    else:
        fail(
            "ANTHROPIC_API_KEY co ve khong hop le",
            "Key that phai bat dau bang 'sk-ant-'. Xem SETUP.md muc 5",
        )


def kiem_tra_he_dieu_hanh() -> None:
    print(f"[INFO] He dieu hanh: {platform.system()} {platform.release()}")
    print(f"[INFO] Python tai:   {sys.executable}")


# --------------------------------------------------------------------------
def main() -> int:
    tieu_de("KIEM TRA MOI TRUONG HOC TAP")
    kiem_tra_he_dieu_hanh()
    print("-" * WIDTH)
    kiem_tra_python()
    kiem_tra_venv()
    kiem_tra_git()
    print("-" * WIDTH)
    kiem_tra_thu_vien()
    print("-" * WIDTH)
    kiem_tra_api_key()
    print("-" * WIDTH)

    if loi_can_sua:
        print(f"  Con {len(loi_can_sua)} van de can sua:")
        for i, msg in enumerate(loi_can_sua, 1):
            print(f"    {i}. {msg}")
        print()
        print("  Sua xong chay lai script nay.")
        print("  Bi qua thi doc muc 'Xu ly su co' cuoi file SETUP.md")
        print("=" * WIDTH)
        return 1

    print("  SAN SANG! Mo curriculum/00-setup/README.md de bat dau.")
    print("=" * WIDTH)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
