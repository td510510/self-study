"""Cau hinh chung cho toan bo bai test tu cham.

Ban KHONG can sua file nay.

Vi sao can no: thu muc bai hoc co ten kieu "00-setup", "01-python-foundations"
- chua dau gach ngang va bat dau bang so - nen Python khong import truc tiep duoc.
File nay cung cap ham nap module theo DUONG DAN file thay vi theo ten package.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import ModuleType

import pytest

ROOT = Path(__file__).resolve().parent.parent


def nap_module(duong_dan_tuong_doi: str) -> ModuleType:
    """Nap mot file .py thanh module, tinh tu thu muc goc cua du an.

    Vi du:
        nap_module("curriculum/01-python-foundations/exercises/ex01_basics.py")
    """
    path = ROOT / duong_dan_tuong_doi
    if not path.exists():
        pytest.fail(
            f"Khong tim thay file bai tap:\n    {path}\n"
            "Ban co dang chay pytest tu thu muc goc cua du an khong?"
        )

    ten_module = path.stem
    spec = importlib.util.spec_from_file_location(ten_module, path)
    if spec is None or spec.loader is None:  # pragma: no cover
        pytest.fail(f"Khong nap duoc module tu {path}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[ten_module] = module
    try:
        spec.loader.exec_module(module)
    except Exception as e:  # noqa: BLE001
        pytest.fail(
            f"File bai tap co loi khi chay: {type(e).__name__}: {e}\n"
            f"    File: {path}\n"
            "Hay chay truc tiep file do de doc traceback day du:\n"
            f"    python {duong_dan_tuong_doi}"
        )
    return module


def bao_chua_lam(ten_ham: str) -> str:
    """Thong bao thong nhat khi bai tap chua duoc lam."""
    return (
        f"Ham '{ten_ham}' chua duoc lam (van con dang TODO).\n"
        "Mo file bai tap, doc phan TODO va viet code thay cho dong 'pass'."
    )


@pytest.fixture(scope="session")
def root() -> Path:
    return ROOT
