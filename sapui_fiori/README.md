# Khóa học SAP Fiori / SAPUI5 Developer — Từ nền tảng đến Senior Consultant

> Giáo trình được thiết kế **bám sát 1-1 với JD tuyển dụng SAP Fiori/UI5 Consultant** (BD IT Product Development).
> Sau khóa học, học viên có thể tự tin đi phỏng vấn vị trí **Senior SAP Fiori/UI5 Developer** và làm việc thực chiến trong dự án product development.

---

## 1. Thông tin khóa học

| Hạng mục | Chi tiết |
|---|---|
| Đối tượng | Lập trình viên web (JS/HTML/CSS) muốn chuyển sang SAP; ABAPer muốn làm Fiori; Fresher SAP có nền tảng lập trình |
| Thời lượng | **24 buổi × 3 giờ = 72 giờ** (lý thuyết ~40%, thực hành ~60%) |
| Hình thức | Live coding + bài tập về nhà + 3 project (2 mini + 1 capstone) |
| Ngôn ngữ | Giảng bằng tiếng Việt, **toàn bộ thuật ngữ + tài liệu + code comment bằng tiếng Anh** (JD yêu cầu English communication) |
| Đầu ra | 1 portfolio gồm 3 ứng dụng Fiori deploy được lên BTP/FLP + 1 bộ tài liệu kỹ thuật |

---

## 2. Bản đồ JD → Module (Traceability Matrix)

Đây là phần quan trọng nhất: **mọi gạch đầu dòng trong JD đều có buổi học tương ứng.**

### Must-have

| Yêu cầu JD | Module | Buổi |
|---|---|---|
| Senior-level hands-on SAPUI5 development | M1, M3 | 1–5, 11–15 |
| Strong knowledge of JavaScript | M1 | 1, 2 |
| XML views, MVC patterns, SAPUI5 controls | M1 | 3, 4, 5 |
| Consuming & troubleshooting OData services | M2 | 6, 7, 8, 10 |
| SAP Gateway & backend integration | M2 | 9, 10 |
| Analyze business requirements → technical solution | M6 | 23, 24 (+ mọi project) |
| Debugging, performance tuning, QA | M5 | 20, 21, 22 |
| Work independently / cross-functional global team | Xuyên suốt | Code review, English standup mô phỏng |
| English communication | Xuyên suốt | Buổi cuối có mock interview EN |

### Nice-to-have

| Yêu cầu JD | Module | Buổi |
|---|---|---|
| SAP BTP | M4 | 19 |
| Fiori Launchpad | M4 | 18 |
| BAS / Web IDE | M0 + M1 | 0, 1 |
| Fiori Elements | M4 | 16, 17 |
| ABAP knowledge cho OData troubleshooting | M2 | 9, 10 |
| Product development / long-term maintenance | M5, M6 | 22, 23, 24 |
| UX principles & responsive design | M3 | 13 |

---

## 3. Lộ trình 24 buổi

### Module 0 — Chuẩn bị môi trường (self-study trước buổi 1)
- [Buổi 0: Setup Environment](00-setup-environment.md)

### Module 1 — Nền tảng SAPUI5 (Buổi 1–5)
[Chi tiết →](module-1-foundation.md)
1. Kiến trúc SAP Fiori & UI5 — Hello World bằng tay
2. JavaScript & ES6+ cho UI5 developer (phần bắt buộc phải giỏi)
3. MVC, XML Views, Controller lifecycle
4. SAPUI5 Controls Library — Layout, Input, Display
5. Data Binding toàn tập (Property / Aggregation / Element / Expression)

### Module 2 — OData & SAP Gateway (Buổi 6–10)
[Chi tiết →](module-2-odata-gateway.md)
6. OData V2 — Model, đọc dữ liệu, filter/sort/expand
7. OData V2 — CRUD, batch, deep insert, xử lý lỗi
8. OData V4 — khác biệt, `ODataModel` V4, `ODataListBinding`
9. SAP Gateway & ABAP backend cho Fiori dev (SEGW, CDS, RAP)
10. **Troubleshooting OData** — công cụ, kỹ thuật, 15 lỗi kinh điển

### Module 3 — SAPUI5 nâng cao (Buổi 11–15)
[Chi tiết →](module-3-advanced-ui5.md)
11. Routing & Navigation, Deep link, Flexible Column Layout
12. Fragments, Dialogs, Custom Formatters, i18n
13. Responsive & UX theo SAP Fiori Design Guidelines
14. Custom Controls, Extension Points, Component reuse
15. SAPUI5 với TypeScript + Tooling hiện đại (ui5-tooling, npm)

### Module 4 — Fiori Elements, Launchpad, BTP (Buổi 16–19)
[Chi tiết →](module-4-fiori-elements-flp-btp.md)
16. Fiori Elements — List Report & Object Page
17. Annotations (CDS + local), Flexible Programming Model
18. Fiori Launchpad — tiles, roles, catalogs, deploy lên ABAP FES
19. SAP BTP — Cloud Foundry, MTA, destination, approuter, CI/CD

### Module 5 — Chất lượng, hiệu năng, bảo trì (Buổi 20–22)
[Chi tiết →](module-5-quality-performance.md)
20. Debugging chuyên sâu (UI5 Inspector, sources, network, ABAP debug)
21. Performance tuning (async, lazy load, model tuning, bundling)
22. Unit test QUnit + Integration test OPA5 + ESLint + documentation standards

### Module 6 — Project thực chiến (Buổi 23–24 + tự làm)
[Chi tiết →](module-6-capstone-projects.md)
23. Capstone Part 1: Requirement analysis → technical design → skeleton
24. Capstone Part 2: Hoàn thiện, review, deploy, present bằng tiếng Anh

### Phụ lục
- [Chuẩn bị phỏng vấn & làm việc thực tế](interview-and-job-readiness.md)
- [Cheatsheet tra cứu nhanh](cheatsheet.md)

---

## 4. Ba project trong khóa

| Project | Sau buổi | Nội dung | Kỹ năng JD được chứng minh |
|---|---|---|---|
| **P1 — Product Catalog** (Freestyle) | 5 | Master-Detail, Northwind OData V2, search/filter/sort | UI5 controls, MVC, XML views, data binding |
| **P2 — Purchase Requisition Manager** | 15 | CRUD đầy đủ, FCL, fragment dialog, i18n, draft handling, error handling | OData CRUD, Gateway, routing, UX |
| **P3 — Capstone: BD Product Quality Inspection** | 24 | Fiori Elements + Freestyle hybrid, deploy BTP + FLP, có unit test & OPA5, có tài liệu kỹ thuật EN | Toàn bộ JD |

---

## 5. Cách sử dụng repo này

```
sapui_fiori/
├── README.md                          ← bạn đang ở đây
├── 00-setup-environment.md
├── module-1-foundation.md
├── module-2-odata-gateway.md
├── module-3-advanced-ui5.md
├── module-4-fiori-elements-flp-btp.md
├── module-5-quality-performance.md
├── module-6-capstone-projects.md
├── interview-and-job-readiness.md
├── cheatsheet.md
└── code/                              ← code mẫu từng buổi (tự tạo khi học)
    ├── s01-hello-ui5/
    ├── s05-project1-product-catalog/
    ├── s15-project2-pr-manager/
    └── s24-capstone/
```

**Quy tắc học:**
1. Đọc phần lý thuyết trước buổi (30 phút).
2. Trong buổi: gõ lại 100% code mẫu, **không copy-paste**.
3. Sau buổi: làm bài tập, push lên GitHub cá nhân.
4. Mỗi 5 buổi có 1 buổi code review chéo (mô phỏng cross-functional team).

---

## 6. Tiêu chí đánh giá đầu ra (Senior-ready checklist)

Học viên được coi là đạt khi tự làm được, không cần tra cứu:

- [ ] Khởi tạo project UI5 freestyle từ đầu, không dùng template
- [ ] Giải thích được vòng đời controller và thứ tự khởi tạo Component → Manifest → Router → View
- [ ] Viết binding path phức tạp (relative, absolute, expression binding) không sai
- [ ] Đọc `$metadata` và tự viết được URL OData có `$filter/$expand/$select/$orderby/$batch`
- [ ] Debug một lỗi 500 từ OData: đọc payload → xác định lỗi ở FE hay BE → nêu hướng fix cho ABAPer
- [ ] Tối ưu 1 app load 8s xuống dưới 3s và giải thích được từng thay đổi
- [ ] Viết QUnit + OPA5 test đạt coverage > 70%
- [ ] Deploy lên BTP CF và lên ABAP FLP
- [ ] Trình bày technical design 10 phút bằng tiếng Anh

---

## 7. Tài nguyên chính thức (bookmark ngay)

| Nguồn | Link |
|---|---|
| SAPUI5 SDK & Demo Kit | https://sapui5.hana.ondemand.com/ |
| SAP Fiori Design Guidelines | https://experience.sap.com/fiori-design-web/ |
| SAP Fiori Elements docs | https://sapui5.hana.ondemand.com/#/topic/03265b0408e2432c9571d6b3feb6b1fd |
| UI5 Tooling | https://sap.github.io/ui5-tooling/ |
| SAP Business Application Studio | https://help.sap.com/bas |
| Northwind OData (free) | https://services.odata.org/V2/Northwind/Northwind.svc/ |
| SAP ES5 Gateway Demo System | https://developers.sap.com/tutorials/gateway-demo-signup.html |
| SAP Learning Journey | https://learning.sap.com/learning-journeys |
