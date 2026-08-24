"""Tien ich dung chung cho Phase 08.

    from tien_ich import bat_utf8, nap_tai_lieu
    bat_utf8()
    docs = nap_tai_lieu()      # {"so_tay_nhan_vien.md": "# So tay...", ...}
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

GOC_DU_AN = Path(__file__).resolve().parents[2]
THU_MUC = GOC_DU_AN / "data" / "phase08"


def bat_utf8() -> None:
    """Ep stdout ve UTF-8 de in duoc tieng Viet co dau tren Windows.

    VI SAO CAN? Console Windows mac dinh dung bang ma cp1252. In mot ky tu
    tieng Viet ra day se nem UnicodeEncodeError va lam sap chuong trinh -
    ngay ca khi phan tinh toan cua ban hoan toan dung.

    Bug nay chi xuat hien tren may Windows, nen rat de lot qua khi ban chi
    test bang pytest (pytest bat stdout rieng). Goi ham nay dau moi script
    co in tieng Viet.
    """
    for luong in (sys.stdout, sys.stderr):
        ma = (getattr(luong, "encoding", "") or "").lower().replace("-", "")
        if ma != "utf8" and hasattr(luong, "reconfigure"):
            luong.reconfigure(encoding="utf-8", errors="replace")


def nap_tai_lieu() -> dict[str, str]:
    """Doc toan bo tai lieu noi bo -> {ten_file: noi_dung}."""
    thu_muc = THU_MUC / "tai_lieu"
    if not thu_muc.exists():
        raise FileNotFoundError(
            f"Chua co {thu_muc}.\nChay truoc: python curriculum/08-rag/tao_du_lieu.py"
        )
    return {p.name: p.read_text(encoding="utf-8") for p in sorted(thu_muc.glob("*.md"))}


def nap_cau_hoi_vang() -> list[dict]:
    """Doc bo cau hoi vang (goldset)."""
    duong_dan = THU_MUC / "cau_hoi_vang.json"
    if not duong_dan.exists():
        raise FileNotFoundError(
            f"Chua co {duong_dan}.\nChay truoc: python curriculum/08-rag/tao_du_lieu.py"
        )
    return json.loads(duong_dan.read_text(encoding="utf-8"))
