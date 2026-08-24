"""BAI TAP 2 - Structured output & Pydantic (Tuan 17).

Cham diem:  pytest tests/phase07/test_ex02.py -v
Loi giai:   curriculum/07-llm-engineering/solutions/ex02_structured_output.py

CHAY DUOC MA KHONG CAN API KEY.

Trong san pham that, ban hiem khi can van xuoi - ban can DU LIEU CO CAU TRUC
de code xu ly tiep. Bai nay day cach ep model tra JSON dung schema, va
cach xu ly khi no van tra ve sai.

Can: pip install pydantic
"""

from __future__ import annotations

import json

from pydantic import BaseModel, Field, ValidationError


# ===========================================================================
#  2.1 - Dinh nghia schema bang Pydantic
# ===========================================================================
class HoaDon(BaseModel):
    """Thong tin trich xuat tu mot hoa don.

    TODO: khai bao cac truong sau, DUNG THU TU nay:

        ten_cua_hang : str
            Field(description="Ten cua hang tren hoa don")

        tong_tien : float
            Field(description="Tong tien phai tra, don vi VND, chi so khong dau phay")

        ngay : str
            Field(description="Ngay tren hoa don, dinh dang YYYY-MM-DD")

        so_dien_thoai : str | None
            Field(default=None, description="So dien thoai cua hang, None neu khong co")

        cac_mat_hang : list[str]
            Field(default_factory=list, description="Danh sach ten cac mat hang")

    VI SAO Field(description=...) QUAN TRONG?
        Mo ta nay duoc dua VAO SCHEMA ma model doc duoc. No vua la tai lieu
        cho nguoi, vua la CHI DAN cho model. Khong co no, model phai doan
        "ngay" la dd/mm/yyyy hay yyyy-mm-dd.

    VI SAO so_dien_thoai PHAI CHO PHEP None?
        Neu khong, model buoc phai dien mot gia tri - va no se BIA ra mot
        so dien thoai. Cho no mot loi thoat hop le la cach chong ao giac
        don gian va hieu qua nhat.
    """

    # TODO: xoa dong duoi va khai bao cac truong
    pass


# ===========================================================================
#  2.2 - Don dep dau ra cua model
# ===========================================================================
def go_rao_markdown(van_ban: str) -> str:
    """Go rao ```json ... ``` neu co, tra ve phan ben trong da strip.

    Model rat hay boc JSON trong rao markdown du ban khong yeu cau.

    Vi du:
        go_rao_markdown('```json\\n{"a": 1}\\n```')  ->  '{"a": 1}'
        go_rao_markdown('```\\n{"a": 1}\\n```')      ->  '{"a": 1}'
        go_rao_markdown('{"a": 1}')                  ->  '{"a": 1}'
        go_rao_markdown('  {"a": 1}  ')              ->  '{"a": 1}'

    Van ban khong co rao thi tra ve chinh no (da strip).

    Goi y: strip truoc, kiem tra startswith("```"), bo dong dau va dong cuoi.
    """
    # TODO
    pass


def trich_json_dau_tien(van_ban: str) -> str | None:
    """Tim va tra ve doi tuong JSON DAU TIEN trong van ban.

    Model doi khi viet them van xuoi truoc/sau JSON du ban da yeu cau
    chi tra JSON.

    Tra ve chuoi JSON (tu '{' den '}' can bang), hoac None neu khong tim thay.

    Vi du:
        trich_json_dau_tien('Day la ket qua: {"a": 1} Hy vong giup duoc ban.')
        ->  '{"a": 1}'

        trich_json_dau_tien('{"a": {"b": 2}}')  ->  '{"a": {"b": 2}}'
        trich_json_dau_tien('khong co json')    ->  None
        trich_json_dau_tien('{"a": 1')          ->  None   (khong can bang)

    Goi y: tim '{' dau tien, roi dem do sau ngoac. Nho BO QUA ngoac nam
           trong chuoi (vi du {"a": "co { trong chuoi"}).
    """
    # TODO
    pass


# ===========================================================================
#  2.3 - Validate
# ===========================================================================
def phan_tich_hoa_don(van_ban: str) -> tuple[bool, object]:
    """Phan tich van ban thanh doi tuong HoaDon.

    Cac buoc, theo dung thu tu:
        1. go_rao_markdown
        2. trich_json_dau_tien (neu khong tim thay -> that bai)
        3. json.loads (neu loi -> that bai)
        4. HoaDon(**du_lieu) (neu ValidationError -> that bai)

    Tra ve:
        (True, doi_tuong_HoaDon)   neu thanh cong
        (False, chuoi_mo_ta_loi)   neu that bai

    Chuoi loi PHAI chua mot trong cac tu khoa sau de de chan doan:
        "Khong tim thay JSON"   - buoc 2 that bai
        "JSON khong hop le"     - buoc 3 that bai
        "Thieu hoac sai truong" - buoc 4 that bai

    VI SAO TRA VE (bool, ket_qua) THAY VI NEM LOI?
        Trong vong lap xu ly 1000 hoa don, ban khong muon mot ban ghi hong
        lam sap ca chuong trinh. Ban muon dem xem bao nhieu ban that bai
        va vi sao. Mau nay goi la "Result type".
    """
    # TODO
    pass


# ===========================================================================
#  2.4 - Dung prompt tu schema
# ===========================================================================
def mo_ta_schema(model_class: type[BaseModel]) -> str:
    """Tao mo ta schema dang chuoi de nhet vao prompt.

    Moi truong mot dong, dinh dang CHINH XAC:
        "- <ten_truong> (<kieu>): <mo ta>"

    Neu truong khong co description thi dung "(khong co mo ta)".

    Vi du voi mot model co hai truong ten:str va tuoi:int:
        "- ten (string): Ten day du\\n- tuoi (integer): Tuoi tinh bang nam"

    Goi y: model_class.model_json_schema() tra ve dict co khoa "properties".
           Moi property co the co "type" va "description".
           Voi truong co the None, "type" khong ton tai ma co "anyOf" -
           truong hop do dung "string" neu tim thay, khong thi "any".
    """
    # TODO
    pass


def tao_prompt_trich_xuat(van_ban: str, model_class: type[BaseModel]) -> str:
    """Dung prompt yeu cau model trich xuat theo schema.

    Dinh dang CHINH XAC (chu y cac dong trong):

        Trich xuat thong tin tu van ban sau thanh JSON.

        Cac truong can trich:
        <mo ta schema>

        Quy tac:
        - Chi tra ve JSON, khong giai thich
        - Truong khong tim thay thi dat null
        - Khong bia thong tin khong co trong van ban

        <van_ban>
        {van_ban}
        </van_ban>

    BA QUY TAC TRONG PROMPT NAY DEU CO LY DO:
        1. "Chi tra ve JSON"     -> giam kha nang model them van xuoi
        2. "Khong tim thay -> null" -> cho model loi thoat, chong bia
        3. The <van_ban> XML     -> ranh gioi ro rang hon dau ngoac kep,
                                    va chong duoc mot phan prompt injection
    """
    # TODO
    pass


# ===========================================================================
#  2.5 - Do do chinh xac tung truong  <- cau noi sang Tuan 19
# ===========================================================================
def so_sanh_trich_xuat(du_doan: dict, chuan: dict) -> dict:
    """So sanh ket qua trich xuat voi dap an chuan, theo TUNG TRUONG.

    Chi xet cac truong CO trong `chuan`.

    Tra ve dict co dung 4 khoa:
        "so_truong"   - so truong trong chuan
        "so_dung"     - so truong khop chinh xac
        "do_chinh_xac"- so_dung / so_truong (0.0 neu chuan rong)
        "truong_sai"  - list ten cac truong sai, sap theo bang chu cai

    Truong thieu trong du_doan tinh la SAI.

    Vi du:
        so_sanh_trich_xuat({"a": 1, "b": 2}, {"a": 1, "b": 3})
        -> {"so_truong": 2, "so_dung": 1, "do_chinh_xac": 0.5,
            "truong_sai": ["b"]}

    VI SAO DO THEO TUNG TRUONG MA KHONG PHAI "dung/sai" CA BAN GHI?
        "70% ban ghi dung hoan toan" va "95% truong dung" la hai buc tranh
        rat khac nhau. Do theo truong cho ban biet TRUONG NAO hay sai -
        thong tin de sua prompt. Do theo ban ghi chi cho mot con so.

        Day chinh la tinh than cua eval o Tuan 19: do sao cho ket qua
        CHI DUONG duoc viec phai lam tiep theo.
    """
    # TODO
    pass


# ===========================================================================
if __name__ == "__main__":
    mau = '''```json
{
  "ten_cua_hang": "Sieu thi ABC",
  "tong_tien": 250000,
  "ngay": "2026-08-22",
  "so_dien_thoai": null,
  "cac_mat_hang": ["Sua", "Banh mi"]
}
```'''

    kq = go_rao_markdown(mau)
    if kq is None:
        print("  Chua lam go_rao_markdown.")
        raise SystemExit(0)

    print(f"  Sau khi go rao: {kq[:40]}...")
    print()

    ok, ket_qua = phan_tich_hoa_don(mau)
    print(f"  phan_tich_hoa_don -> thanh cong={ok}")
    print(f"    {ket_qua}")
    print()

    ok2, loi = phan_tich_hoa_don("khong co json o day")
    print(f"  Van ban khong co JSON -> {ok2}, {loi}")
    print()

    print("  Mo ta schema de nhet vao prompt:")
    print(mo_ta_schema(HoaDon))
