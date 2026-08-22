# MODULE 6 — Capstone Project (Buổi 23 → 24)

> **JD coverage:**
> • "Work with business and functional teams to analyze requirements and convert them into technical solutions"
> • "Ability to analyze business requirements and propose practical technical solutions"
> • "Support application lifecycle activities from design and development through testing and deployment"
> • "Provide technical guidance and support for issue resolution during project execution"

---

# BUỔI 23 — Requirement Analysis → Technical Design → Skeleton

## 23.1. Kịch bản capstone

> **BD Product Quality Inspection**
>
> BD IT Product cần một ứng dụng cho phép nhóm QA ghi nhận kết quả kiểm tra chất lượng của lô sản phẩm (batch), và cho phép quản lý chất lượng phê duyệt hoặc từ chối lô hàng.

### Requirement gốc từ functional team (nguyên văn — mập mờ có chủ ý)

```
From: Sarah Nguyen (Functional Consultant - Quality Management)
To:   Fiori Development Team
Subject: New requirement — Quality Inspection app

Hi team,

The QA department currently records inspection results in an Excel file and
sends it by email. They want a Fiori app instead. Requirements as discussed
with the business:

- QA inspectors need to see the batches waiting for inspection
- They record measurements for each inspection characteristic
- The system should tell them if the batch passes or fails
- The quality manager approves or rejects the batch
- Managers want to see how many batches failed this month
- It must work on tablets because inspectors walk around the shop floor
- Only inspectors can record results, only managers can approve
- We need this in English and Vietnamese

Please provide an estimate.

Thanks,
Sarah
```

## 23.2. Bài tập 1 — Phân tích requirement (45 phút, làm nhóm)

**Đây là kỹ năng JD nhấn mạnh.** Requirement trên **không đủ để code**. Học viên phải viết ra danh sách câu hỏi làm rõ.

### Danh sách câu hỏi phải hỏi (giảng viên chốt sau khi học viên tự làm)

**Về dữ liệu:**
1. Batch data đến từ đâu? Bảng/CDS/OData service nào đã có sẵn? Ai là owner?
2. "Inspection characteristic" định nghĩa ở đâu — master data có sẵn hay tự nhập?
3. Một batch có bao nhiêu characteristic trung bình / tối đa?
4. Có bao nhiêu batch cần kiểm tra mỗi ngày? (→ quyết định paging và loại table)
5. Kết quả kiểm tra có cần lưu lịch sử thay đổi không?

**Về logic nghiệp vụ:**
6. "System should tell them if the batch passes or fails" — quy tắc pass/fail cụ thể là gì? Tính ở frontend hay backend?
   → **Khuyến nghị: backend.** Business rule không nên nằm ở UI (dễ bị bypass, khó test, không dùng lại được).
7. Nếu 1 characteristic fail thì cả batch fail, hay có trọng số?
8. Có cho phép sửa kết quả sau khi đã submit không? Ai được sửa?
9. Approve/reject có cần comment bắt buộc không? Có cần workflow không?
10. Sau khi approve, batch có được đẩy sang hệ thống khác (SAP QM)? Đồng bộ hay bất đồng bộ?

**Về UX:**
11. "Work on tablets" — có cần offline không? (→ đây là câu hỏi quan trọng, ảnh hưởng lớn tới kiến trúc)
12. Có cần chụp ảnh / đính kèm file không?
13. Có cần quét barcode batch không?
14. "Managers want to see how many batches failed" — dashboard riêng hay chỉ 1 KPI trên list?

**Về phi chức năng:**
15. Bao nhiêu user đồng thời?
16. SLA về thời gian phản hồi?
17. Authorization: role được định nghĩa ở PFCG (on-prem) hay XSUAA (BTP)?
18. Hệ thống chạy on-premise hay BTP? Có Cloud Connector chưa?
19. Ngôn ngữ: chỉ EN + VI hay còn thêm?
20. Timeline mong đợi và có phải go-live theo đợt nào không?

### Mẫu email trả lời (tiếng Anh — rèn kỹ năng JD yêu cầu)

```
Subject: RE: New requirement — Quality Inspection app (clarifications needed)

Hi Sarah,

Thanks for the requirement. Before I can give a reliable estimate, I need to
clarify a few points. I've grouped them so you can route them to the right people.

DATA (needs input from the ABAP/QM team)
1. Which system holds the batch and inspection lot data — is there already an
   OData service, or do we need a new one? This drives roughly 40% of the effort.
2. Are inspection characteristics master data (QPMK) or free text per batch?
3. Expected volume: how many open inspection lots at peak?

BUSINESS LOGIC (needs input from you)
4. What exactly determines pass/fail? My recommendation is to implement this rule
   in the backend rather than the UI, so that it stays consistent if the data is
   also updated from SAP GUI or an interface, and so it can be unit-tested.
5. Is a comment mandatory when a manager rejects a batch?
6. Can a recorded result be corrected after submission, and by whom?

UX (needs a decision)
7. "Works on tablets" — do inspectors have stable Wi-Fi on the shop floor?
   If offline capability is needed, that is a fundamentally different architecture
   and roughly triples the effort. If connectivity is reliable, a responsive Fiori
   app covers it.
8. Do they need to attach photos of defects?

NON-FUNCTIONAL
9. Target platform: on-premise Fiori Launchpad or SAP BTP?
10. How do we define the two roles (inspector / manager) — PFCG or XSUAA?

PROPOSED APPROACH (subject to the answers above)
I would suggest a two-app scenario:
  • "Record Inspection Results" — a freestyle app optimised for tablet input
  • "Approve Batches" — a Fiori Elements List Report, since the approval flow fits
    the standard floorplan and gives us variants, export and personalisation for free

Happy to walk through this in a 30-minute call — that will be faster than email.

Best regards,
<Name>
```

> **Điểm ghi điểm với JD:** *"Ability to analyze business requirements and propose practical technical solutions"* — đề xuất giải pháp kèm **lý do kỹ thuật**, và cảnh báo về offline (rủi ro effort) **trước khi** cam kết estimate.

## 23.3. Bài tập 2 — Technical Design Document

Sau khi giảng viên đóng vai Sarah trả lời, học viên viết TDD.

**Giả định đã chốt:**
- Backend: OData V2 service `ZBD_QI_SRV` trên ES5 (mock trong khóa học)
- Pass/fail: backend tính, trả về field `OverallResult` (`A`=Accepted, `R`=Rejected, `P`=Pending)
- Không cần offline; cần đính kèm ảnh
- Platform: BTP Cloud Foundry + Work Zone
- Role: XSUAA scope `Inspect` và `Approve`

### OData contract (thiết kế cùng ABAPer)

```
EntitySet: InspectionLotSet
  Key:   LotID (Edm.String, 12)
  Props: BatchID, MaterialID, MaterialDesc, PlantID, QuantityInspected, Unit,
         CreatedAt (Edm.DateTime), CreatedBy, DueDate,
         Status (P/I/C),                 -- Pending / In progress / Completed
         OverallResult (A/R/P),
         ApprovedBy, ApprovedAt, RejectionReason
  Nav:   ToCharacteristics (1..*) → CharacteristicSet
         ToAttachments     (0..*) → AttachmentSet
  Caps:  creatable=false, updatable=true, deletable=false
         filterable: Status, OverallResult, PlantID, MaterialID, DueDate
         sortable:   DueDate, CreatedAt, LotID

EntitySet: CharacteristicSet
  Key:   LotID, CharNo
  Props: CharDesc, TargetValue, LowerLimit, UpperLimit, Unit,
         MeasuredValue (Edm.Decimal, nullable),
         Result (A/R/blank),             -- backend tính khi ghi MeasuredValue
         Mandatory (Edm.Boolean)
  Caps:  creatable=false, updatable=true (chỉ MeasuredValue), deletable=false

EntitySet: AttachmentSet
  Key:   AttachmentID
  Props: LotID, FileName, MimeType, FileSize, CreatedBy, CreatedAt
  Media: true (Edm.Stream)

FunctionImports:
  SubmitInspection(LotID)          POST → trả InspectionLot đã cập nhật
  ApproveLot(LotID)                POST → yêu cầu scope Approve
  RejectLot(LotID, Reason)         POST → yêu cầu scope Approve
```

**Điểm quan trọng để dạy:** OData contract là **hợp đồng giữa FE và BE**. Chốt nó **trước khi** cả hai bên bắt đầu code → FE dùng mock server làm việc song song với ABAPer. Đây chính là điều JD gọi là *"backend coordination"*.

### Kiến trúc ứng dụng

```
BD Quality Inspection
├── App 1: "Record Inspection"  (Freestyle UI5)
│    ├── List:   Worklist các lot Status = P/I, filter theo plant/due date
│    ├── Detail: ObjectPage
│    │            ├── Header: lot info + overall result indicator
│    │            ├── Section: Characteristics (editable table, inline input)
│    │            ├── Section: Attachments (UploadSet)
│    │            └── Footer: Submit
│    └── Lý do freestyle: nhập liệu inline trên tablet, UX không khớp
│         floorplan chuẩn (cần bàn phím số lớn, validate tức thì)
│
└── App 2: "Approve Batches"  (Fiori Elements List Report + Object Page)
     ├── List Report với filter bar, variant, export
     ├── Object Page read-only + action Approve / Reject
     ├── Custom action Reject mở dialog nhập lý do (FPM extension)
     └── Lý do Fiori Elements: luồng chuẩn, ít code, dễ bảo trì lâu dài
```

### Ma trận quyết định kỹ thuật (đưa vào TDD)

| Quyết định | Lựa chọn | Lý do | Rủi ro |
|---|---|---|---|
| App 1 kiểu gì | Freestyle | UX nhập liệu đặc thù trên tablet | Nhiều code hơn → chi phí bảo trì |
| App 2 kiểu gì | Fiori Elements | Luồng chuẩn, tiết kiệm 60% effort | Phụ thuộc chất lượng annotation từ BE |
| Pass/fail tính ở đâu | Backend | Nhất quán với mọi kênh, test được | Round-trip thêm khi nhập |
| Lưu khi nào | Deferred + Submit | Tránh 1 request/ô nhập trên tablet | Mất dữ liệu nếu đóng tab → cảnh báo `beforeunload` |
| Đính kèm | `UploadSet` + Media entity | Chuẩn SAP | File lớn cần chunk |
| Table cho characteristics | `sap.m.Table` | Responsive, thường < 50 dòng | Nếu > 500 phải đổi grid table |
| Ngôn ngữ | i18n EN/VI | Yêu cầu | |
| Auth | XSUAA scope | BTP standard | Phải đồng bộ với PFCG nếu sau này về on-prem |

## 23.4. Skeleton — dựng khung trong buổi

```bash
# App 1 — freestyle
yo @sap/fiori
  → SAPUI5 freestyle → SAPUI5 Application
  → Data source: mock (metadata.xml đã chuẩn bị)
  → Module: bd.qi.record
  → Namespace: com.bd

# App 2 — Fiori Elements
yo @sap/fiori
  → SAP Fiori elements → List Report Page
  → Main entity: InspectionLotSet
  → Module: bd.qi.approve
```

**Task trong buổi 23:**
1. Tạo 2 project, chạy được với mock server.
2. Dựng `metadata.xml` theo OData contract ở trên.
3. Tạo mock data: 20 lot, mỗi lot 5–8 characteristic.
4. App 1: list hiển thị được lot, click vào mở object page trống.
5. App 2: List Report hiển thị được với annotation cơ bản.

**Deliverable buổi 23:** TDD (Markdown, tiếng Anh) + 2 project skeleton chạy được.

---

# BUỔI 24 — Hoàn thiện, Test, Deploy, Present

## 24.1. Checklist hoàn thiện (làm trong buổi + về nhà)

### App 1 — Record Inspection

```markdown
- [ ] Worklist: filter theo Plant, Status, Due date (server-side)
- [ ] IconTabFilter: All / Pending / In Progress, có counter
- [ ] ObjectPage header hiển thị lot info + ObjectStatus theo OverallResult
- [ ] Bảng characteristics editable inline:
      - [ ] Input số có type Float + constraints từ Lower/Upper limit
      - [ ] ValueState đổi realtime khi giá trị ngoài giới hạn
      - [ ] Field mandatory được đánh dấu
- [ ] Deferred group: gom mọi thay đổi, chỉ submit khi bấm Submit
- [ ] Cảnh báo khi rời trang mà còn pending changes
- [ ] UploadSet đính kèm ảnh, xóa được
- [ ] Function import SubmitInspection, xử lý lỗi đầy đủ
- [ ] MessagePopover hiển thị message backend
- [ ] Responsive: test 375px / 768px / 1440px
- [ ] i18n EN + VI, không hardcode
- [ ] Content density đúng cho view và dialog
```

**Code mẫu — bảng characteristics với validation realtime:**

```xml
<Table id="charTable"
       items="{
           path: 'ToCharacteristics',
           parameters: { select: 'CharNo,CharDesc,TargetValue,LowerLimit,UpperLimit,Unit,MeasuredValue,Result,Mandatory' },
           sorter: { path: 'CharNo' }
       }"
       mode="None"
       sticky="ColumnHeaders">

    <headerToolbar>
        <OverflowToolbar>
            <Title text="{i18n>characteristics}" level="H3"/>
            <ToolbarSpacer/>
            <ObjectStatus
                text="{= ${view>/filledCount} }/{= ${view>/totalCount} } {i18n>completed}"
                state="{= ${view>/filledCount} === ${view>/totalCount} ? 'Success' : 'Warning' }"/>
        </OverflowToolbar>
    </headerToolbar>

    <columns>
        <Column width="4rem"><Text text="{i18n>colNo}"/></Column>
        <Column><Text text="{i18n>colCharacteristic}"/></Column>
        <Column minScreenWidth="Tablet" demandPopin="true" hAlign="End">
            <Text text="{i18n>colSpec}"/>
        </Column>
        <Column hAlign="End" width="12rem"><Text text="{i18n>colMeasured}"/></Column>
        <Column hAlign="Center" width="6rem"><Text text="{i18n>colResult}"/></Column>
    </columns>

    <items>
        <ColumnListItem>
            <cells>
                <Text text="{CharNo}"/>

                <ObjectIdentifier
                    title="{CharDesc}"
                    text="{= ${Mandatory} ? ${i18n>mandatory} : '' }"/>

                <Text text="{LowerLimit} – {UpperLimit} {Unit}"/>

                <Input
                    value="{
                        path: 'MeasuredValue',
                        type: 'sap.ui.model.type.Float',
                        formatOptions: { minFractionDigits: 2, maxFractionDigits: 3 }
                    }"
                    description="{Unit}"
                    type="Number"
                    textAlign="End"
                    liveChange=".onMeasuredValueChange"
                    valueState="{
                        parts: ['MeasuredValue', 'LowerLimit', 'UpperLimit', 'Mandatory'],
                        formatter: '.formatter.measurementState'
                    }"
                    valueStateText="{i18n>outOfSpec}"/>

                <ObjectStatus
                    text="{ path: 'Result', formatter: '.formatter.resultText' }"
                    state="{ path: 'Result', formatter: '.formatter.resultState' }"
                    icon="{ path: 'Result', formatter: '.formatter.resultIcon' }"/>
            </cells>
        </ColumnListItem>
    </items>
</Table>
```

**Formatter tương ứng:**
```js
/**
 * Validate a measurement against its specification limits.
 * Runs on the client for immediate feedback only — the authoritative
 * pass/fail decision is calculated by the backend on submit.
 *
 * @param {number} fValue measured value
 * @param {number} fLower lower specification limit
 * @param {number} fUpper upper specification limit
 * @param {boolean} bMandatory whether the characteristic must be filled
 * @returns {sap.ui.core.ValueState}
 */
measurementState: function (fValue, fLower, fUpper, bMandatory) {
    if (fValue === null || fValue === undefined || fValue === "") {
        return bMandatory ? ValueState.Warning : ValueState.None;
    }
    const f = parseFloat(fValue);
    if (isNaN(f)) { return ValueState.Error; }
    if (f < parseFloat(fLower) || f > parseFloat(fUpper)) { return ValueState.Error; }
    return ValueState.Success;
},

resultText: function (sResult) {
    const oBundle = this.getResourceBundle ? this.getResourceBundle() : null;
    const mMap = { A: "resultAccepted", R: "resultRejected", "": "resultPending" };
    return oBundle ? oBundle.getText(mMap[sResult] || "resultPending") : sResult;
},

resultState: function (sResult) {
    return { A: ValueState.Success, R: ValueState.Error }[sResult] || ValueState.None;
},

resultIcon: function (sResult) {
    return { A: "sap-icon://accept", R: "sap-icon://decline" }[sResult] || "sap-icon://pending";
}
```

**Controller — deferred group + submit + cảnh báo unsaved:**
```js
sap.ui.define([
    "./BaseController",
    "../model/formatter",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function (BaseController, formatter, JSONModel, MessageBox) {
    "use strict";

    const DEFERRED_GROUP = "inspectionChanges";

    return BaseController.extend("com.bd.qi.record.controller.Detail", {

        formatter: formatter,

        onInit: function () {
            this.setModel(new JSONModel({
                busy: false, filledCount: 0, totalCount: 0, hasChanges: false
            }), "view");

            // Gom mọi thay đổi vào 1 group, chỉ gửi khi user bấm Submit
            const oModel = this.getOwnerComponent().getModel();
            oModel.setDeferredGroups([DEFERRED_GROUP]);
            oModel.setChangeGroups({
                "Characteristic": { groupId: DEFERRED_GROUP, changeSetId: "chars", single: false }
            });

            this.getRouter().getRoute("detail")
                .attachPatternMatched(this._onDetailMatched, this);

            // Cảnh báo khi user đóng tab với dữ liệu chưa lưu
            this._fnBeforeUnload = (oEvent) => {
                if (oModel.hasPendingChanges()) {
                    oEvent.preventDefault();
                    oEvent.returnValue = "";
                }
            };
            window.addEventListener("beforeunload", this._fnBeforeUnload);
        },

        onExit: function () {
            window.removeEventListener("beforeunload", this._fnBeforeUnload);
        },

        _onDetailMatched: function (oEvent) {
            const sLotId = decodeURIComponent(oEvent.getParameter("arguments").lotId);
            const oModel = this.getModel();

            oModel.metadataLoaded().then(() => {
                const sPath = oModel.createKey("/InspectionLotSet", { LotID: sLotId });
                this.getView().bindElement({
                    path: sPath,
                    parameters: { expand: "ToCharacteristics,ToAttachments" },
                    events: {
                        dataRequested: () => this.getView().setBusy(true),
                        dataReceived:  () => { this.getView().setBusy(false); this._updateCounters(); },
                        change: () => {
                            if (!this.getView().getElementBinding().getBoundContext()) {
                                this.getRouter().getTargets().display("notFound");
                            }
                        }
                    }
                });
            });
        },

        onMeasuredValueChange: function () {
            this._updateCounters();
            this.getModel("view").setProperty("/hasChanges", this.getModel().hasPendingChanges());
        },

        _updateCounters: function () {
            const oBinding = this.byId("charTable").getBinding("items");
            if (!oBinding) { return; }
            const aCtx = oBinding.getCurrentContexts();
            const iFilled = aCtx.filter(c => {
                const v = c.getProperty("MeasuredValue");
                return v !== null && v !== undefined && v !== "";
            }).length;
            this.getModel("view").setProperty("/totalCount",  aCtx.length);
            this.getModel("view").setProperty("/filledCount", iFilled);
        },

        onSubmit: async function () {
            const oModel = this.getModel();
            const oViewModel = this.getModel("view");

            // 1. Validate client-side trước khi gửi
            if (oViewModel.getProperty("/filledCount") < oViewModel.getProperty("/totalCount")) {
                const bContinue = await this.confirm("confirmIncompleteSubmit");
                if (!bContinue) { return; }
            }

            this.getView().setBusy(true);
            try {
                // 2. Lưu các measurement
                if (oModel.hasPendingChanges()) {
                    const oResult = await new Promise((resolve, reject) => {
                        oModel.submitChanges({
                            groupId: DEFERRED_GROUP,
                            success: resolve,
                            error: reject
                        });
                    });
                    this._assertBatchSuccess(oResult);      // ← kiểm tra __batchResponses
                }

                // 3. Gọi function import để backend tính overall result
                const sLotId = this.getView().getBindingContext().getProperty("LotID");
                await new Promise((resolve, reject) => {
                    oModel.callFunction("/SubmitInspection", {
                        method: "POST",
                        urlParameters: { LotID: sLotId },
                        success: resolve,
                        error: reject
                    });
                });

                this.toast("submitSuccess");
                oViewModel.setProperty("/hasChanges", false);
                this.getView().getElementBinding().refresh(true);

            } catch (oError) {
                this._oHelper.showError(oError);
            } finally {
                this.getView().setBusy(false);
            }
        },

        /**
         * submitChanges reports success even when individual requests inside the
         * $batch failed. Inspect the batch responses and throw if any failed.
         * @param {object} oResult batch result from submitChanges
         * @throws {Error} when at least one sub-request failed
         */
        _assertBatchSuccess: function (oResult) {
            const aErrors = [];
            (oResult.__batchResponses || []).forEach(function (oResp) {
                if (oResp.message) { aErrors.push(oResp); }
                (oResp.__changeResponses || []).forEach(function (oCh) {
                    if (parseInt(oCh.statusCode, 10) >= 400) { aErrors.push(oCh); }
                });
            });
            if (aErrors.length) {
                const oErr = new Error("Batch contained " + aErrors.length + " failed request(s)");
                oErr.responseText = aErrors[0].response ? aErrors[0].response.body : "";
                throw oErr;
            }
        },

        onCancel: async function () {
            const bOk = await this.confirm("confirmDiscardChanges");
            if (!bOk) { return; }
            this.getModel().resetChanges();
            this.getModel("view").setProperty("/hasChanges", false);
            this._updateCounters();
        }
    });
});
```

### App 2 — Approve Batches (Fiori Elements)

```markdown
- [ ] List Report với SelectionFields: Plant, Status, OverallResult, DueDate
- [ ] LineItem: LotID, Batch, Material, Result (criticality), DueDate
- [ ] Variant management, export Excel, personalization bật
- [ ] Object Page read-only, facet: Header info + Characteristics + Attachments
- [ ] Custom action "Approve" (DataFieldForAction → ApproveLot)
- [ ] Custom action "Reject" mở dialog nhập lý do → gọi RejectLot
- [ ] Nút chỉ hiện khi Status = C và user có scope Approve
- [ ] onBeforeSave validation (nếu có editable field)
- [ ] i18n EN + VI
```

**Custom action Reject với dialog (FPM):**
```js
sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (ControllerExtension, Fragment, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return ControllerExtension.extend("com.bd.qi.approve.ext.controller.ObjectPageExt", {

        onRejectPressed: async function (oEvent) {
            const oView    = this.base.getView();
            const oContext = oView.getBindingContext();

            if (!this._pRejectDialog) {
                this._pRejectDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.bd.qi.approve.ext.fragment.RejectDialog",
                    controller: this
                }).then((oDialog) => {
                    oView.addDependent(oDialog);
                    oDialog.setModel(new JSONModel({ reason: "", valid: false }), "reject");
                    return oDialog;
                });
            }
            (await this._pRejectDialog).open();
        },

        onRejectReasonChange: async function (oEvent) {
            const oDialog = await this._pRejectDialog;
            const sReason = oEvent.getParameter("value") || "";
            oDialog.getModel("reject").setProperty("/valid", sReason.trim().length >= 10);
        },

        onRejectConfirm: async function () {
            const oDialog  = await this._pRejectDialog;
            const oView    = this.base.getView();
            const oContext = oView.getBindingContext();
            const sReason  = oDialog.getModel("reject").getProperty("/reason");

            oDialog.setBusy(true);
            try {
                // OData V4 bound action
                const oAction = oView.getModel().bindContext(
                    "com.bd.qi.RejectLot(...)", oContext
                );
                oAction.setParameter("Reason", sReason);
                await oAction.execute();

                MessageToast.show(oView.getModel("i18n")
                    .getResourceBundle().getText("rejectSuccess"));
                oDialog.close();
                oContext.refresh();
            } catch (oError) {
                MessageBox.error(oError.message);
            } finally {
                oDialog.setBusy(false);
            }
        },

        onRejectCancel: async function () {
            (await this._pRejectDialog).close();
        }
    });
});
```

## 24.2. Test suite bắt buộc

```markdown
### QUnit (>= 25 tests, coverage >= 70%)
- [ ] formatter.measurementState — 8 case (trong/ngoài giới hạn, null, NaN, mandatory)
- [ ] formatter.resultText / resultState / resultIcon
- [ ] ODataHelper.parseError — JSON, XML, HTML dump, innererror có nhiều message
- [ ] Detail.controller._assertBatchSuccess — batch OK, batch có lỗi
- [ ] Detail.controller._updateCounters

### OPA5 (>= 4 journeys)
- [ ] WorklistJourney: mở app → thấy list → filter theo status
- [ ] RecordJourney: chọn lot → nhập giá trị → submit → thấy toast
- [ ] ValidationJourney: nhập giá trị ngoài spec → thấy valueState Error
- [ ] ApprovalJourney (app 2): approve → status đổi; reject không lý do → nút disable
```

## 24.3. Deploy

```bash
# 1. Build & test
npm run lint && npm run test

# 2. Build MTA (2 app trong 1 MTA)
mbt build

# 3. Deploy
cf deploy mta_archives/bd-quality-inspection_1.0.0.mtar

# 4. Gán role collection
#    BTP Cockpit → Security → Role Collections → BD_QI_Inspector / BD_QI_Manager

# 5. Đưa vào Work Zone site, publish

# 6. Smoke test với 2 user khác nhau (inspector và manager)
```

## 24.4. Present — 10 phút bằng tiếng Anh

Đây là bài kiểm tra cuối. Cấu trúc bài trình bày:

```
1. Business context                          (1 phút)
   "The QA team recorded inspection results in Excel..."

2. Requirement analysis — what I clarified   (2 phút)
   "The original requirement had three gaps I had to close before estimating:
    where the pass/fail rule lives, whether offline was needed, and where the
    batch data comes from. The offline question alone was a 3x effort factor."

3. Solution architecture                     (2 phút)
   Sơ đồ + lý do chọn freestyle cho app 1 và Fiori Elements cho app 2

4. Live demo                                 (3 phút)
   Record → submit → approve, kèm 1 lỗi cố ý để show error handling

5. Quality & performance                     (1.5 phút)
   "70% unit coverage, 4 OPA journeys, list loads in 1.8 seconds with 5,000 lots
    thanks to server-side paging and $select."

6. What I'd do next                          (0.5 phút)
   "Add offline draft support with IndexedDB if the shop floor Wi-Fi proves
    unreliable, and push the pass/fail rule into a reusable CDS calculation."
```

### Câu hỏi giảng viên sẽ hỏi (mô phỏng phỏng vấn thật)
1. Why did you use a deferred group instead of saving on every change?
2. What happens if two inspectors open the same lot?
3. How would you handle 500 characteristics instead of 8?
4. The manager says the app is slow. Walk me through how you'd investigate.
5. The ABAP developer says the service is fine but the app shows an error. What do you do?
6. Why Fiori Elements for app 2 and not for app 1?
7. How do you make sure only managers can approve?
8. What's in your `onExit` and why?

## 24.5. Rubric capstone (200đ)

| Hạng mục | Điểm |
|---|---|
| **Requirement analysis** — danh sách câu hỏi làm rõ, email EN, đề xuất giải pháp có lý do | 30 |
| **TDD** — OData contract, kiến trúc, ma trận quyết định, non-functional | 25 |
| **App 1 chức năng** — worklist, editable table, validation, submit, attachment | 35 |
| **App 2 chức năng** — Fiori Elements, annotation, custom action, dialog reject | 25 |
| **Kỹ thuật OData** — deferred group, batch error handling, function import, ETag | 20 |
| **Test** — QUnit ≥ 25 tests, coverage ≥ 70%, OPA5 ≥ 4 journeys | 20 |
| **Performance** — có số đo trước/sau, đạt < 3s | 10 |
| **Deploy** — chạy được trên BTP + Work Zone, 2 role hoạt động đúng | 15 |
| **Documentation** — README, TDD, JSDoc, CHANGELOG (EN) | 10 |
| **Presentation** — 10 phút EN, trả lời được ≥ 6/8 câu hỏi | 10 |

**Đạt (Senior-ready): ≥ 150/200 và không có hạng mục nào = 0.**

---

# Sau khóa học — lộ trình tự phát triển

| Giai đoạn | Mục tiêu | Hành động |
|---|---|---|
| Tháng 1–2 | Củng cố | Làm lại capstone với OData V4 + CAP backend tự viết |
| Tháng 2–3 | Mở rộng | Học CAP (Node.js) để tự tạo service, không phụ thuộc ABAPer |
| Tháng 3–4 | Chứng chỉ | Thi **C_FIORDEV_22** (SAP Certified Development Associate — SAP Fiori Application Developer) |
| Tháng 4–6 | Chiều sâu | Học ABAP RAP cơ bản; đóng góp 1 sample app lên GitHub |
| Liên tục | Cập nhật | Theo dõi SAP Community, UI5 release notes mỗi quý (UI5 ra bản mới ~6 tuần/lần) |
