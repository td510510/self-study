# MODULE 2 — OData & SAP Gateway (Buổi 6 → 10)

> **JD coverage:**
> • "Integrate Fiori applications with OData services and SAP backend systems"
> • "Experience consuming and **troubleshooting** OData services"
> • "Good understanding of SAP Gateway and integration with SAP backend systems"
> • Nice-to-have: "ABAP knowledge for backend coordination and OData troubleshooting"
>
> Đây là module **quan trọng nhất** để đạt level Senior. Nhiều dev UI5 giỏi JS nhưng mù OData → trượt phỏng vấn ở đây.

---

# BUỔI 6 — OData V2: Model, đọc dữ liệu, Mock Server

## 6.1. OData là gì (nói trong 60 giây khi phỏng vấn)

> "OData is a REST-based protocol standardized by OASIS. SAP exposes business data through OData services via SAP Gateway. Every service is self-describing: `$metadata` returns an EDMX document describing entity types, entity sets, associations, function imports and annotations. That metadata is what drives SAPUI5 data binding and Fiori Elements."

## 6.2. Giải phẫu `$metadata`

```
https://sapes5.sapdevcenter.com/sap/opu/odata/IWBEP/GWSAMPLE_BASIC/$metadata
```

```xml
<edmx:Edmx Version="1.0">
 <edmx:DataServices m:DataServiceVersion="2.0">
  <Schema Namespace="GWSAMPLE_BASIC">

    <!-- 1. EntityType: định nghĩa cấu trúc + khóa -->
    <EntityType Name="Product" sap:content-version="1">
      <Key><PropertyRef Name="ProductID"/></Key>
      <Property Name="ProductID"  Type="Edm.String" Nullable="false" MaxLength="10"
                sap:label="Product ID" sap:creatable="false" sap:updatable="false"/>
      <Property Name="Price"      Type="Edm.Decimal" Precision="16" Scale="3"
                sap:unit="CurrencyCode" sap:label="Price"/>
      <Property Name="CurrencyCode" Type="Edm.String" MaxLength="5" sap:semantics="currency-code"/>

      <!-- 2. NavigationProperty: đường đi sang entity khác -->
      <NavigationProperty Name="ToSupplier"
          Relationship="GWSAMPLE_BASIC.Assoc_BusinessPartner_Products"
          FromRole="ToRole_Products" ToRole="FromRole_BusinessPartner"/>
    </EntityType>

    <!-- 3. Association: quan hệ + cardinality -->
    <Association Name="Assoc_BusinessPartner_Products">
      <End Type="GWSAMPLE_BASIC.BusinessPartner" Multiplicity="1"  Role="FromRole_BusinessPartner"/>
      <End Type="GWSAMPLE_BASIC.Product"         Multiplicity="*"  Role="ToRole_Products"/>
    </Association>

    <EntityContainer Name="GWSAMPLE_BASIC_Entities" m:IsDefaultEntityContainer="true">
      <!-- 4. EntitySet: "bảng" mà client gọi được -->
      <EntitySet Name="ProductSet" EntityType="GWSAMPLE_BASIC.Product"
                 sap:creatable="true" sap:updatable="true" sap:deletable="true"
                 sap:pageable="true" sap:addressable="true"/>
      <!-- 5. FunctionImport: action/function, không phải CRUD -->
      <FunctionImport Name="RegenerateAllData" m:HttpMethod="POST"/>
      <AssociationSet Name="Assoc_BusinessPartner_ProductsSet" .../>
    </EntityContainer>
  </Schema>
 </edmx:DataServices>
</edmx:Edmx>
```

### `sap:` annotations quan trọng — phải biết đọc
| Annotation | Ý nghĩa | Ảnh hưởng tới UI |
|---|---|---|
| `sap:creatable="false"` | Không được POST field này | SmartField tự disable ở create |
| `sap:updatable="false"` | Không được PATCH | Field readonly ở edit |
| `sap:sortable="false"` | Không sort được | Bỏ khỏi sort dialog → tránh lỗi 400 |
| `sap:filterable="false"` | Không filter được | **Nguyên nhân lỗi 400 rất hay gặp** |
| `sap:required-in-filter="true"` | Bắt buộc có trong `$filter` | Không truyền → lỗi "mandatory filter missing" |
| `sap:label` | Nhãn hiển thị | SmartField/Fiori Elements lấy làm label |
| `sap:unit` | Field chứa đơn vị/tiền tệ | Format số đúng |
| `sap:semantics` | `currency-code`, `unit-of-measure`, `email`, `tel` | |
| `sap:pageable="false"` | Không hỗ trợ `$skip/$top` | Không dùng `growing` được |

> **Bài tập bắt buộc:** mở `$metadata` của GWSAMPLE_BASIC, tìm 3 property có `sap:filterable="false"` và giải thích hậu quả nếu FE cứ filter theo chúng.

## 6.3. Query options — phải viết được bằng tay

```
GET /ProductSet?$top=20&$skip=0&$inlinecount=allpages
GET /ProductSet?$select=ProductID,Name,Price
GET /ProductSet?$filter=Price gt 100 and CategoryName eq 'Notebooks'
GET /ProductSet?$filter=substringof('Laptop',Name)
GET /ProductSet?$filter=startswith(Name,'HT')
GET /ProductSet?$orderby=Price desc,Name asc
GET /ProductSet?$expand=ToSupplier,ToSalesOrderLineItems
GET /ProductSet('HT-1000')
GET /ProductSet('HT-1000')/ToSupplier
GET /ProductSet/$count
GET /ProductSet?$filter=CreatedAt ge datetime'2024-01-01T00:00:00'
GET /ProductSet?$format=json
```

**Khác biệt V2 vs V4 (hay bị hỏi):**
| | V2 | V4 |
|---|---|---|
| Đếm tổng | `$inlinecount=allpages` | `$count=true` |
| Contains | `substringof('x',Field)` | `contains(Field,'x')` |
| Ngày | `datetime'2024-01-01T00:00:00'` | `2024-01-01T00:00:00Z` |
| Format mặc định | XML (Atom) | JSON |
| Expand lồng có filter | ❌ | ✅ `$expand=Items($filter=...;$top=5)` |
| Batch | multipart/mixed | JSON batch |

## 6.4. Khai báo ODataModel V2 đúng chuẩn

**`manifest.json`**
```json
{
  "sap.app": {
    "dataSources": {
      "mainService": {
        "uri": "/sap/opu/odata/IWBEP/GWSAMPLE_BASIC/",
        "type": "OData",
        "settings": {
          "odataVersion": "2.0",
          "annotations": ["annotation0"],
          "localUri": "localService/metadata.xml"
        }
      },
      "annotation0": {
        "type": "ODataAnnotation",
        "uri": "annotations/annotation0.xml",
        "settings": { "localUri": "annotations/annotation0.xml" }
      }
    }
  },
  "sap.ui5": {
    "models": {
      "": {
        "dataSource": "mainService",
        "preload": true,
        "settings": {
          "defaultBindingMode": "TwoWay",
          "defaultCountMode": "Inline",
          "defaultOperationMode": "Server",
          "useBatch": true,
          "earlyTokenRequest": true,
          "metadataUrlParams": { "sap-value-list": "none" },
          "refreshAfterChange": false
        }
      }
    }
  }
}
```

### Giải thích từng setting (rất hay bị hỏi)
| Setting | Giá trị | Vì sao |
|---|---|---|
| `preload: true` | | Model được tạo sớm → metadata request bắt đầu song song với việc load view → **nhanh hơn ~300ms** |
| `useBatch: true` | mặc định V2 | Gom nhiều request thành 1 `$batch` POST → giảm round-trip |
| `defaultCountMode` | `Inline` | Lấy count kèm data thay vì request `/$count` riêng |
| `defaultOperationMode` | `Server` | Filter/sort chạy trên backend, không tải hết về client |
| `earlyTokenRequest: true` | | Lấy CSRF token ngay từ đầu → lần ghi đầu tiên không mất thêm 1 round-trip |
| `metadataUrlParams: {"sap-value-list":"none"}` | | **Rất quan trọng cho performance**: không tải value-list annotation nếu app không dùng F4 → metadata nhẹ đi rất nhiều |
| `refreshAfterChange: false` | | Không tự refresh toàn bộ binding sau mỗi thay đổi → tránh request thừa |

## 6.5. Đọc dữ liệu bằng code

```js
const oModel = this.getOwnerComponent().getModel();

// 1. Chờ metadata load xong trước khi làm gì phụ thuộc metadata
oModel.metadataLoaded().then(() => {
    const oMeta = oModel.getServiceMetadata();
    console.log(oMeta.dataServices.schema[0].entityType);
});

// 2. read() — không lưu vào model context, chỉ trả dữ liệu
oModel.read("/ProductSet", {
    urlParameters: {
        "$top": 10,
        "$select": "ProductID,Name,Price,CurrencyCode",
        "$expand": "ToSupplier"
    },
    filters: [ new Filter("Price", FilterOperator.GT, 100) ],
    sorters: [ new Sorter("Price", true) ],
    success: (oData) => console.log(oData.results),
    error:   (oErr)  => console.error(oErr)
});

// 3. Đọc 1 entity
oModel.read("/ProductSet('HT-1000')", {
    urlParameters: { "$expand": "ToSupplier" },
    success: (oData) => console.log(oData.Name)
});

// 4. Lấy dữ liệu đã cache trong model (không gọi HTTP)
const oProduct = oModel.getProperty("/ProductSet('HT-1000')");

// 5. createKey — KHÔNG BAO GIỜ tự nối chuỗi path
const sPath = oModel.createKey("/ProductSet", { ProductID: "HT-1000" });
// → "/ProductSet('HT-1000')"  — tự encode ký tự đặc biệt, xử lý composite key
const sPath2 = oModel.createKey("/SalesOrderLineItemSet", {
    SalesOrderID: "0500000000", ItemPosition: "0000000010"
});
// → "/SalesOrderLineItemSet(SalesOrderID='0500000000',ItemPosition='0000000010')"
```

> **Lỗi kinh điển:** tự viết `"/ProductSet('" + sId + "')"` → chết ngay khi ID chứa dấu `'`, `/`, khoảng trắng, hoặc khi entity có composite key. **Luôn dùng `createKey`.**

## 6.6. Mock Server — làm việc khi backend chưa sẵn sàng

Trong product development (đúng bối cảnh JD), FE thường phải làm trước khi ABAP xong service → **bắt buộc biết mock server**.

**Bước 1: tải metadata về local**
```
webapp/localService/metadata.xml     ← lưu $metadata
webapp/localService/mockdata/ProductSet.json
webapp/localService/mockdata/BusinessPartnerSet.json
```

**`webapp/localService/mockdata/ProductSet.json`**
```json
[
  { "ProductID": "HT-1000", "Name": "Notebook Basic 15", "Price": "956.00",
    "CurrencyCode": "EUR", "CategoryName": "Notebooks", "SupplierID": "0100000046" },
  { "ProductID": "HT-1001", "Name": "Notebook Basic 17", "Price": "1249.00",
    "CurrencyCode": "EUR", "CategoryName": "Notebooks", "SupplierID": "0100000046" }
]
```

**`webapp/localService/mockserver.js`**
```js
sap.ui.define([
    "sap/ui/core/util/MockServer",
    "sap/base/util/UriParameters",
    "sap/base/Log"
], function (MockServer, UriParameters, Log) {
    "use strict";

    let oMockServer;
    const _sAppPath        = "com/bd/app/";
    const _sJsonFilesPath  = _sAppPath + "localService/mockdata";

    return {
        /**
         * @param {object} oOptions
         * @param {string} oOptions.path  service url from manifest
         * @param {int}    oOptions.delay simulated latency in ms
         * @returns {Promise}
         */
        init: function (oOptions) {
            const oUriParameters = UriParameters.fromQuery(location.search);
            const sJsonFilesUrl  = sap.ui.require.toUrl(_sJsonFilesPath);
            const sMetadataUrl   = sap.ui.require.toUrl(_sAppPath + "localService/metadata.xml");

            oMockServer = new MockServer({ rootUri: oOptions.path });

            MockServer.config({
                autoRespond: true,
                autoRespondAfter: oOptions.delay || parseInt(oUriParameters.get("serverDelay") || 500, 10)
            });

            oMockServer.simulate(sMetadataUrl, {
                sMockdataBaseUrl: sJsonFilesUrl,
                bGenerateMissingMockData: true
            });

            // --- Custom request: giả lập lỗi để test error handling ---
            const aRequests = oMockServer.getRequests();
            aRequests.push({
                method: "GET",
                path: new RegExp("ProductSet\\('ERROR'\\)"),
                response: function (oXhr) {
                    oXhr.respondJSON(500, {}, JSON.stringify({
                        error: {
                            code: "SY/530",
                            message: { lang: "en", value: "Simulated backend failure" }
                        }
                    }));
                    return true;
                }
            });
            oMockServer.setRequests(aRequests);

            oMockServer.start();
            Log.info("Mock server started for " + oOptions.path);
            return Promise.resolve();
        },

        getMockServer: function () { return oMockServer; },
        stop: function () { oMockServer && oMockServer.stop(); }
    };
});
```

**`webapp/test/initMockServer.js`** (entry point riêng)
```js
sap.ui.define([
    "com/bd/app/localService/mockserver"
], function (mockserver) {
    "use strict";
    sap.ui.require(["sap/ui/core/ComponentSupport"]);   // boot component sau khi mock sẵn sàng
    mockserver.init({ path: "/sap/opu/odata/IWBEP/GWSAMPLE_BASIC/" });
});
```

**`webapp/test/mockServer.html`** — bản sao `index.html` nhưng bootstrap `initMockServer.js`.

Chạy: `ui5 serve --open test/mockServer.html`

## 6.7. Bài tập buổi 6
1. Viết 10 URL OData query khác nhau trên ES5, chạy trực tiếp trên browser, ghi lại kết quả.
2. Setup mock server cho GWSAMPLE_BASIC, chạy app hoàn toàn offline.
3. Thêm 1 custom mock request trả về HTTP 403 và xử lý trong controller.

---

# BUỔI 7 — OData V2 CRUD, Batch, Deep Insert, Error Handling

## 7.1. Hai cách ghi dữ liệu

| Cách | Khi nào | Ưu / Nhược |
|---|---|---|
| **Two-way binding + `submitChanges()`** | Form edit, table inline edit | Tự gom PATCH, hỗ trợ undo bằng `resetChanges()` |
| **API trực tiếp (`create/update/remove`)** | Action rời rạc, payload tự build | Kiểm soát rõ ràng, dễ debug |

### Cách 1 — binding + submitChanges (khuyến nghị cho form)
```js
onEdit: function () {
    this.getModel("view").setProperty("/editMode", true);
    // context đã có từ element binding, user gõ → model ghi vào pending changes
},

onSave: async function () {
    const oModel = this.getModel();
    if (!oModel.hasPendingChanges()) {
        this.toast("noChanges");
        return;
    }
    this.getView().setBusy(true);
    try {
        await new Promise((resolve, reject) => {
            oModel.submitChanges({ success: resolve, error: reject });
        });
        this.toast("saveSuccess");
        this.getModel("view").setProperty("/editMode", false);
    } catch (oError) {
        this._oHelper.showError(oError);
    } finally {
        this.getView().setBusy(false);
    }
},

onCancel: function () {
    this.getModel().resetChanges();          // rollback pending changes
    this.getModel("view").setProperty("/editMode", false);
}
```

> ⚠️ **Bẫy:** `submitChanges` success callback vẫn được gọi ngay cả khi 1 request con trong `$batch` lỗi! Phải kiểm tra response:
```js
success: function (oData) {
    // Với $batch, lỗi nằm trong __batchResponses
    const aErrors = [];
    (oData.__batchResponses || []).forEach(function (oResp) {
        if (oResp.message || oResp.response?.statusCode >= 400) {
            aErrors.push(oResp);
        }
        (oResp.__changeResponses || []).forEach(function (oCh) {
            if (oCh.statusCode >= 400) { aErrors.push(oCh); }
        });
    });
    if (aErrors.length) { this._handleBatchErrors(aErrors); return; }
    this.toast("saveSuccess");
}
```
**Đây là câu hỏi phỏng vấn senior rất hay gặp.**

### Cách 2 — API trực tiếp
```js
// CREATE
onCreateProduct: async function () {
    const oPayload = {
        ProductID:    "HT-9999",
        Name:         "New Product",
        Price:        "199.00",
        CurrencyCode: "EUR",
        SupplierID:   "0100000046"
    };
    try {
        const oData = await this._oHelper.create("/ProductSet", oPayload);
        this.toast("createSuccess", [oData.ProductID]);
        this.getModel().refresh(true);
    } catch (e) { this._oHelper.showError(e); }
},

// UPDATE — chỉ gửi field thay đổi (MERGE/PATCH)
onUpdatePrice: async function (sId, sNewPrice) {
    const sPath = this.getModel().createKey("/ProductSet", { ProductID: sId });
    await this._oHelper.update(sPath, { Price: sNewPrice });
},

// DELETE
onDelete: async function (oCtx) {
    const bOk = await this.confirm("confirmDelete");
    if (!bOk) { return; }
    await this._oHelper.remove(oCtx.getPath());
}
```

## 7.2. Deep Insert — tạo header + item trong 1 request

Rất hay dùng cho Sales Order, Purchase Requisition.

```js
const oOrder = {
    CustomerID: "0100000000",
    CurrencyCode: "EUR",
    Note: "Created from Fiori app",
    // Tên phải TRÙNG với NavigationProperty trong $metadata
    ToLineItems: [
        { ProductID: "HT-1000", Quantity: "2", QuantityUnit: "EA" },
        { ProductID: "HT-1001", Quantity: "1", QuantityUnit: "EA" }
    ]
};

oModel.create("/SalesOrderSet", oOrder, {
    success: function (oData) {
        MessageToast.show("Order " + oData.SalesOrderID + " created");
    },
    error: function (oErr) { /* ... */ }
});
```
> Backend ABAP phải implement `CREATE_DEEP_ENTITY` trong DPC_EXT. Nếu ABAPer chưa làm → lỗi *"Method 'CREATE_DEEP_ENTITY' not implemented"*. **Biết điều này = ghi điểm với JD "backend coordination".**

## 7.3. Function Import — gọi action không phải CRUD

```js
// Ví dụ: confirm một sales order
oModel.callFunction("/ConfirmSalesOrder", {
    method: "POST",                             // xem m:HttpMethod trong $metadata
    urlParameters: { SalesOrderID: "0500000000" },
    success: function (oData) { /* ... */ },
    error: function (oErr) { /* ... */ }
});

// GET function import (không thay đổi dữ liệu)
oModel.callFunction("/GetProductRating", {
    method: "GET",
    urlParameters: { ProductID: "HT-1000" },
    success: function (oData) { console.log(oData.Rating); }
});
```

## 7.4. Deferred groups & batch control

```js
// Tách các thay đổi thành nhóm để submit riêng
oModel.setDeferredGroups(["headerGroup", "itemGroup"]);

oModel.update(sHeaderPath, oHeaderData, { groupId: "headerGroup" });
oModel.create("/ItemSet", oItem,       { groupId: "itemGroup", changeSetId: "cs1" });

// Submit riêng từng nhóm
oModel.submitChanges({ groupId: "headerGroup", success: fnOk, error: fnErr });

// Tắt batch cho 1 request (debug dễ hơn — thấy rõ URL trong Network tab)
oModel.setUseBatch(false);
```

### Hiểu changeSet (quan trọng khi troubleshoot)
```
POST /$batch
--batch_xxx
  --changeset_yyy        ← 1 changeset = 1 LUW = atomic (all-or-nothing)
    POST /ProductSet
    PATCH /ProductSet('HT-1000')
  --changeset_yyy--
  GET /SupplierSet        ← GET nằm ngoài changeset
--batch_xxx--
```
> Nếu 2 thao tác phải cùng thành công hoặc cùng rollback → đặt chung `changeSetId`. Nếu độc lập → tách changeSetId khác nhau, tránh 1 lỗi làm rollback cả cụm.

## 7.5. CSRF Token — nguyên nhân lỗi 403 số 1

Luồng chuẩn:
```
1. GET  /service/  header: X-CSRF-Token: Fetch     → response header: X-CSRF-Token: abc123
2. POST /service/EntitySet  header: X-CSRF-Token: abc123
```

`ODataModel` tự làm việc này. Nhưng lỗi vẫn xảy ra khi:
| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| 403 "CSRF token validation failed" ở lần ghi đầu | Token chưa fetch | Bật `earlyTokenRequest: true` |
| 403 sau khi app mở lâu | Session timeout, token hết hạn | `oModel.refreshSecurityToken()` rồi retry |
| 403 khi gọi qua fetch/ajax thủ công | Quên gửi token | `oModel.getSecurityToken()` |
| 403 qua approuter/BTP | Destination không forward cookie | Cấu hình destination `HTML5.forwardAuthToken` / `sap-client` |

```js
// Retry pattern cho token hết hạn
_submitWithTokenRetry: function (fnSubmit) {
    return fnSubmit().catch((oErr) => {
        if (oErr.statusCode === 403 || oErr.response?.statusCode === 403) {
            return new Promise((resolve, reject) => {
                this.getModel().refreshSecurityToken(
                    () => fnSubmit().then(resolve).catch(reject),
                    reject
                );
            });
        }
        throw oErr;
    });
}
```

## 7.6. ETag & Optimistic Concurrency

```
GET  /ProductSet('HT-1000')      → ETag: W/"20240815120000"
PATCH /ProductSet('HT-1000')     header: If-Match: W/"20240815120000"
    → 200 nếu chưa ai sửa
    → 412 Precondition Failed nếu người khác đã sửa
```

Xử lý 412 đúng cách:
```js
error: function (oError) {
    if (oError.statusCode === "412") {
        MessageBox.warning(this.getText("dataChangedByOther"), {
            actions: [MessageBox.Action.OK],
            onClose: () => {
                // Bắt buộc refresh để lấy ETag mới, KHÔNG được force overwrite bừa
                this.getView().getElementBinding().refresh(true);
            }
        });
    }
}
```

## 7.7. Message Model — hiển thị message từ Gateway

Gateway trả message qua header `sap-message` hoặc trong `innererror`. UI5 tự đưa vào MessageModel.

```xml
<!-- Trong footer toolbar -->
<Button id="messageButton"
        icon="sap-icon://message-popup"
        text="{= ${message>/}.length }"
        visible="{= ${message>/}.length > 0 }"
        type="{= ${message>/}.length ? 'Emphasized' : 'Default' }"
        press=".onMessagePopoverPress"/>
```

**`fragment/MessagePopover.fragment.xml`**
```xml
<core:FragmentDefinition xmlns="sap.m" xmlns:core="sap.ui.core">
    <MessagePopover items="{message>/}" groupItems="true">
        <MessageItem
            type="{message>type}"
            title="{message>message}"
            subtitle="{message>additionalText}"
            description="{message>description}"
            markupDescription="true"/>
    </MessagePopover>
</core:FragmentDefinition>
```

```js
onMessagePopoverPress: async function (oEvent) {
    const oPopover = await this.loadFragment("com.bd.app.fragment.MessagePopover");
    oPopover.openBy(oEvent.getSource());
}
```

## 7.8. Lab 7 — Form CRUD hoàn chỉnh

```xml
<mvc:View controllerName="com.bd.app.controller.ProductDetail"
    xmlns="sap.m" xmlns:mvc="sap.ui.core.mvc"
    xmlns:f="sap.ui.layout.form" xmlns:uxap="sap.uxap" xmlns:core="sap.ui.core">

    <uxap:ObjectPageLayout id="opl" showTitleInHeaderContent="true" upperCaseAnchorBar="false">
        <uxap:headerTitle>
            <uxap:ObjectPageDynamicHeaderTitle>
                <uxap:heading>
                    <Title text="{Name}"/>
                </uxap:heading>
                <uxap:expandedHeading>
                    <ObjectStatus text="{ProductID}"/>
                </uxap:expandedHeading>
                <uxap:actions>
                    <Button text="{i18n>edit}" type="Emphasized"
                            visible="{= !${view>/editMode} }" press=".onEdit"/>
                    <Button text="{i18n>save}" type="Emphasized"
                            visible="{view>/editMode}" press=".onSave"/>
                    <Button text="{i18n>cancel}"
                            visible="{view>/editMode}" press=".onCancel"/>
                    <Button text="{i18n>delete}" type="Reject"
                            visible="{= !${view>/editMode} }" press=".onDelete"/>
                </uxap:actions>
            </uxap:ObjectPageDynamicHeaderTitle>
        </uxap:headerTitle>

        <uxap:sections>
            <uxap:ObjectPageSection title="{i18n>generalInfo}">
                <uxap:subSections>
                    <uxap:ObjectPageSubSection>
                        <f:SimpleForm editable="{view>/editMode}" layout="ResponsiveGridLayout"
                                      labelSpanXL="3" labelSpanL="3" labelSpanM="4" labelSpanS="12"
                                      columnsXL="2" columnsL="2">
                            <Label text="{i18n>productId}"/>
                            <Text text="{ProductID}"/>

                            <Label text="{i18n>name}" required="true"/>
                            <Input value="{
                                       path: 'Name',
                                       type: 'sap.ui.model.type.String',
                                       constraints: { maxLength: 255, minLength: 1 }
                                   }"
                                   editable="{view>/editMode}"/>

                            <Label text="{i18n>price}" required="true"/>
                            <Input value="{
                                       path: 'Price',
                                       type: 'sap.ui.model.type.Decimal',
                                       constraints: { minimum: 0, precision: 16, scale: 3 }
                                   }"
                                   description="{CurrencyCode}"
                                   editable="{view>/editMode}"/>

                            <Label text="{i18n>supplier}"/>
                            <Input value="{ToSupplier/CompanyName}"
                                   showValueHelp="{view>/editMode}"
                                   valueHelpRequest=".onSupplierValueHelp"
                                   editable="false"/>
                        </f:SimpleForm>
                    </uxap:ObjectPageSubSection>
                </uxap:subSections>
            </uxap:ObjectPageSection>
        </uxap:sections>

        <uxap:footer>
            <OverflowToolbar>
                <Button id="messageButton" icon="sap-icon://message-popup"
                        text="{= ${message>/}.length }"
                        visible="{= ${message>/}.length > 0 }"
                        press=".onMessagePopoverPress"/>
                <ToolbarSpacer/>
            </OverflowToolbar>
        </uxap:footer>
    </uxap:ObjectPageLayout>
</mvc:View>
```

## 7.9. Bài tập buổi 7
1. Implement full CRUD trên `ProductSet` của ES5 (create thật, sửa thật, xóa thật).
2. Cố tình gây lỗi 412 bằng cách mở 2 tab và sửa cùng lúc → xử lý đúng.
3. Bật `useBatch: false`, so sánh số request trong Network tab với `true`.

---

# BUỔI 8 — OData V4

## 8.1. Vì sao phải học V4

- Mọi service mới trên **S/4HANA (RAP — RESTful ABAP Programming Model)** đều là **OData V4**.
- CAP (Cloud Application Programming) sinh ra service V4.
- Fiori Elements V4 chỉ chạy với OData V4.
- Nhưng: **hệ thống on-premise cũ vẫn đầy V2** → JD thực tế cần biết cả hai.

## 8.2. Khác biệt về lập trình (bảng so sánh dùng khi phỏng vấn)

| Chủ đề | V2 (`sap.ui.model.odata.v2.ODataModel`) | V4 (`sap.ui.model.odata.v4.ODataModel`) |
|---|---|---|
| Client-side cache | Có, model lưu toàn bộ dữ liệu | **Không** — dữ liệu nằm ở binding |
| `oModel.getProperty("/Path")` | ✅ hoạt động | ❌ **không dùng được** — phải qua context |
| `oModel.read()` | ✅ | ❌ không có; dùng `bindContext` / `bindList` |
| `oModel.create()` | ✅ | ❌ dùng `oListBinding.create()` |
| Submit | `submitChanges()` | `oModel.submitBatch(sGroupId)` |
| Auto batch | có | có, theo `groupId` (`$auto`, `$direct`, custom) |
| Two-way binding | pending changes trong model | pending changes trong binding |
| `$expand` lồng có filter | ❌ | ✅ |
| Draft handling | tự viết | hỗ trợ sẵn (với RAP) |
| Message | `sap-message` header | `SAP__Messages` property |

## 8.3. Code V4 thực tế

**manifest.json**
```json
"models": {
  "": {
    "dataSource": "mainService",
    "settings": {
      "synchronizationMode": "None",
      "operationMode": "Server",
      "autoExpandSelect": true,
      "earlyRequests": true,
      "groupId": "$auto",
      "updateGroupId": "$auto"
    }
  }
}
```
> `autoExpandSelect: true` — UI5 tự sinh `$select` và `$expand` từ binding trong view → **giảm payload rất nhiều**, luôn bật.
> `synchronizationMode: "None"` bắt buộc với UI5 < 1.110; từ 1.110 trở đi có thể bỏ.

**Đọc list**
```xml
<Table items="{
    path: '/Products',
    parameters: {
        $count: true,
        $filter: 'Price gt 100',
        $orderby: 'Name',
        $$groupId: 'listGroup',
        $$updateGroupId: 'updateGroup'
    }
}">
```

**CREATE trong V4**
```js
onCreate: function () {
    const oListBinding = this.byId("table").getBinding("items");
    const oContext = oListBinding.create({
        Name: "New Product",
        Price: "0.00"
    });

    // Chờ POST hoàn tất
    oContext.created()
        .then(() => this.toast("createSuccess"))
        .catch((oErr) => {
            if (!oErr.canceled) { MessageBox.error(oErr.message); }
        });
}
```

**UPDATE trong V4**
```js
onSave: async function () {
    const oModel = this.getView().getModel();
    try {
        await oModel.submitBatch("updateGroup");
        this.toast("saveSuccess");
    } catch (oError) {
        MessageBox.error(oError.message);
    }
},

onCancel: function () {
    this.getView().getModel().resetChanges("updateGroup");
}
```

**DELETE trong V4**
```js
onDelete: async function (oEvent) {
    const oContext = oEvent.getSource().getBindingContext();
    await oContext.delete("$auto");
}
```

**Đọc 1 property (khác hoàn toàn V2)**
```js
// ❌ V2 style — không chạy với V4
// const sName = oModel.getProperty("/Products(1)/Name");

// ✅ V4
const oContextBinding = oModel.bindContext("/Products(1)");
const oContext = oContextBinding.getBoundContext();
const sName = await oContext.requestProperty("Name");

// hoặc lấy cả object
const oProduct = await oContext.requestObject();
```

**Gọi Action / Function (V4)**
```js
// Bound action
const oAction = oModel.bindContext("com.sap.gateway.srvd.zui_travel.v0001.acceptTravel(...)",
                                   oContext);
await oAction.execute();
const oResult = oAction.getBoundContext().getObject();

// Unbound function
const oFunc = oModel.bindContext("/GetProductStock(...)");
oFunc.setParameter("ProductID", "HT-1000");
await oFunc.execute();
```

## 8.4. Bài tập buổi 8
1. Dùng service V4 public: `https://services.odata.org/TripPinRESTierService/` — build list People có filter + paging.
2. Viết bảng so sánh V2/V4 từ trí nhớ, trình bày bằng tiếng Anh trong 3 phút.
3. Migrate 1 màn hình từ Project 1 (V2) sang V4, ghi lại mọi chỗ phải sửa.

---

# BUỔI 9 — SAP Gateway & ABAP Backend cho Fiori Developer

> JD nice-to-have: *"ABAP knowledge for backend coordination and OData troubleshooting"*.
> Không cần code ABAP giỏi, nhưng **phải nói chuyện được với ABAPer và biết lỗi nằm ở đâu**.

## 9.1. Kiến trúc Gateway

```
Fiori App (browser)
   │  HTTPS  /sap/opu/odata/SAP/ZSRV/...
   ▼
[SAP Gateway Hub]        ← ICF service, SICF
   │  RFC / trusted
   ▼
[Backend S/4 or ECC]
   │
   ├─ SEGW project → MPC (model) + DPC (data provider)
   ├─ CDS View + @OData.publish  (Gateway hub-less)
   └─ RAP Service Binding (OData V4)
```

**3 cách tạo OData service trong SAP — biết khi nào dùng cái nào:**

| Cách | Version | Thời đại | Ghi chú |
|---|---|---|---|
| **SEGW** (Gateway Service Builder) | V2 | ECC / S4 cũ | Code ABAP trong `*_DPC_EXT` class |
| **CDS View + `@OData.publish: true`** | V2 | S/4 1610+ | Nhanh, read-only là chính |
| **RAP** (Behavior Definition + Service Binding) | V4 | S/4 2020+, BTP ABAP | Chuẩn hiện tại, có draft |

## 9.2. Transaction ABAP mà Fiori dev phải biết

| T-code | Dùng để | Tình huống |
|---|---|---|
| `/IWFND/MAINT_SERVICE` | Đăng ký/kích hoạt service ở Gateway hub | Service 404 → check ở đây trước |
| `/IWFND/GW_CLIENT` | **Gateway Client** — test OData không cần UI | Xác định lỗi ở FE hay BE |
| `/IWFND/ERROR_LOG` | Error log của Gateway hub | Xem stack trace lỗi 500 |
| `/IWBEP/ERROR_LOG` | Error log ở backend | Khi hub và backend tách nhau |
| `/IWFND/CACHE_CLEANUP` | Xóa cache metadata | **Sửa metadata mà app không thấy → chạy cái này** |
| `/IWBEP/CACHE_CLEANUP` | Xóa cache metadata backend | |
| `SEGW` | Gateway Service Builder | Xem cấu trúc entity |
| `SICF` | Kích hoạt ICF node | Service không gọi được |
| `SU53` | Kiểm tra authorization vừa fail | Lỗi 403 do thiếu quyền |
| `ST22` | ABAP short dump | Lỗi 500 kèm dump |
| `SM59` | RFC destination | Hub ↔ backend không kết nối |
| `/UI2/FLPD_CUST` | Fiori Launchpad Designer | Tạo tile/catalog |
| `/UI2/FLP` | Mở FLP | |
| `/UI5/UI5_REPOSITORY_LOAD` | Upload app UI5 lên ABAP repo (cách cũ) | |
| `SE80` / `SE24` | Xem class DPC_EXT | Đọc code backend |
| `STAUTHTRACE` | Trace authorization | Lỗi quyền phức tạp |

## 9.3. Dùng Gateway Client để phân định lỗi FE/BE

Đây là **kỹ năng quan trọng nhất** để trả lời JD *"troubleshooting OData"*.

```
/IWFND/GW_CLIENT
  Request URI: /sap/opu/odata/IWBEP/GWSAMPLE_BASIC/ProductSet?$top=5
  HTTP Method: GET
  → Execute
```

**Quy trình quyết định:**
```
App báo lỗi
 │
 ├─ Copy đúng URL từ Network tab (F12) → dán vào GW_CLIENT
 │
 ├─ GW_CLIENT CŨNG lỗi   → lỗi BACKEND. Gửi cho ABAPer kèm:
 │                            • URL đầy đủ
 │                            • Screenshot /IWFND/ERROR_LOG
 │                            • Timestamp + user
 │
 └─ GW_CLIENT CHẠY OK    → lỗi FRONTEND hoặc tầng trung gian:
                              • CSRF token / cookie
                              • Destination / approuter / CORS
                              • sai path trong createKey
                              • sai binding / filter sai cú pháp
```

**Email mẫu gửi ABAPer (tiếng Anh — JD yêu cầu English communication):**
```
Subject: [ZPROD_SRV] 500 error on ProductSet with $expand=ToSupplier

Hi <ABAP colleague>,

I'm getting an HTTP 500 when calling the following request from the Fiori app:

  GET /sap/opu/odata/SAP/ZPROD_SRV/ProductSet?$expand=ToSupplier&$top=20

I reproduced it directly in /IWFND/GW_CLIENT (so it's not a UI issue).

  Time (system time): 2026-08-15 14:32:10
  User: P001234567
  Client: 100
  Error log entry: /IWFND/ERROR_LOG → ID 0000123456
  Message: "CX_SY_ITAB_LINE_NOT_FOUND in ZCL_ZPROD_DPC_EXT->PRODUCTSET_GET_ENTITYSET"

The same request without $expand works fine, so the issue looks to be in the
expand handling (GET_EXPANDED_ENTITYSET).

Could you check ST22 for a dump at that timestamp?
Happy to jump on a quick call if that's faster.

Thanks,
<Your name>
```

## 9.4. Đọc code ABAP DPC_EXT (đủ để hiểu, không cần viết)

```abap
CLASS zcl_zprod_dpc_ext DEFINITION INHERITING FROM zcl_zprod_dpc.
  PROTECTED SECTION.
    " Đọc danh sách -> tương ứng GET /ProductSet
    METHODS productset_get_entityset REDEFINITION.
    " Đọc 1 bản ghi -> GET /ProductSet('HT-1000')
    METHODS productset_get_entity    REDEFINITION.
    " Tạo mới -> POST
    METHODS productset_create_entity REDEFINITION.
    " Sửa -> PUT/MERGE
    METHODS productset_update_entity REDEFINITION.
    " Xóa -> DELETE
    METHODS productset_delete_entity REDEFINITION.
    " Deep insert -> POST kèm nested items
    METHODS create_deep_entity       REDEFINITION.
ENDCLASS.

CLASS zcl_zprod_dpc_ext IMPLEMENTATION.
  METHOD productset_get_entityset.
    DATA lt_filter TYPE /iwbep/t_mgw_select_option.

    " 1. Lấy $filter mà UI5 gửi lên
    lt_filter = io_tech_request_context->get_filter( )->get_filter_select_options( ).

    " 2. Lấy $top / $skip  (paging)
    DATA(lv_top)  = io_tech_request_context->get_top( ).
    DATA(lv_skip) = io_tech_request_context->get_skip( ).

    " 3. Lấy $orderby
    DATA(lt_order) = io_tech_request_context->get_orderby( ).

    " 4. SELECT dữ liệu -> et_entityset
    " 5. Trả $inlinecount
    es_response_context-inlinecount = lines( et_entityset ).
  ENDMETHOD.
ENDCLASS.
```

**Điều Fiori dev cần rút ra:**
- Nếu ABAPer **không đọc `get_filter()`** → filter từ UI5 bị bỏ qua, app trả về toàn bộ dữ liệu → **chậm**. Đây là bug hiệu năng số 1 trong dự án thật.
- Nếu không đọc `get_top/get_skip` → `growing` không hoạt động, tải hết bảng.
- Nếu không set `inlinecount` → counter trên UI hiển thị sai.

**Câu nói ghi điểm khi phỏng vấn:**
> "When a list is slow, I first check whether the backend actually honours `$filter`, `$top` and `$skip`. Many DPC_EXT implementations select everything and let Gateway paginate in memory — that's where the latency comes from, not the UI."

## 9.5. CDS View — cách hiện đại

```abap
@AbapCatalog.sqlViewName: 'ZIPRODUCT'
@OData.publish: true                      " → sinh service ZI_PRODUCT_CDS
@UI.headerInfo: { typeName: 'Product', typeNamePlural: 'Products' }
define view ZI_Product as select from mara
  association [0..1] to ZI_ProductText as _Text
    on $projection.Material = _Text.Material
{
  @UI.lineItem: [{ position: 10, label: 'Material' }]
  @UI.selectionField: [{ position: 10 }]
  key mara.matnr as Material,

  @UI.lineItem: [{ position: 20 }]
  mara.mtart as MaterialType,

  @Semantics.quantity.unitOfMeasure: 'BaseUnit'
  mara.brgew as GrossWeight,
  mara.meins as BaseUnit,

  _Text
}
```
> `@UI.*` annotation trong CDS chính là thứ **Fiori Elements đọc để sinh giao diện** (Buổi 16–17). Hiểu điều này giúp bạn nói chuyện với ABAPer về việc "thêm annotation" thay vì "viết thêm code UI".

## 9.6. RAP tóm tắt (OData V4)
```abap
" Behavior definition
managed implementation in class zbp_i_travel unique;
define behavior for ZI_Travel alias Travel
persistent table ztravel
draft table ztravel_d              " ← draft handling tự động
lock master
authorization master ( instance )
{
  field ( readonly ) TravelId;
  field ( mandatory ) CustomerId, BeginDate, EndDate;
  create; update; delete;
  action ( features : instance ) acceptTravel result [1] $self;
  determination setInitialStatus on modify { create; }
  validation validateDates on save { field BeginDate, EndDate; }
}
```
Fiori dev cần biết: **RAP tự lo draft**, nên với Fiori Elements V4 bạn gần như không phải code draft ở FE.

## 9.7. Bài tập buổi 9
1. Login ES5, mở `/IWFND/GW_CLIENT`, chạy 5 request GET/POST, chụp màn hình kết quả.
2. Viết 1 email tiếng Anh báo lỗi backend theo template mục 9.3 cho tình huống lỗi 400 "Filter on property X not supported".
3. Vẽ sơ đồ Gateway architecture từ trí nhớ.

---

# BUỔI 10 — Troubleshooting OData: 15 lỗi kinh điển

> Buổi này là **buổi ăn tiền của JD**. Học viên phải làm được: nhìn lỗi → đoán nguyên nhân → xác minh → fix hoặc chuyển đúng người.

## 10.1. Quy trình debug chuẩn (7 bước)

```
1. Mở DevTools (F12) → tab Network → filter "XHR"
2. Tìm request lỗi (đỏ). Xem:
      • Request URL đầy đủ (đã decode)
      • Status code
      • Request headers (X-CSRF-Token, If-Match, sap-client)
      • Response body (payload lỗi Gateway)
3. Nếu là $batch → mở Payload, đọc từng phần multipart
4. Copy URL → chạy trực tiếp trên browser (chỉ GET) hoặc /IWFND/GW_CLIENT
5. Backend cũng lỗi? → /IWFND/ERROR_LOG + ST22 → chuyển ABAPer
6. Backend OK? → so sánh request UI5 sinh ra với request tay: khác chỗ nào?
7. Ghi lại root cause + fix vào defect tracker (JD: "defect fixing", "documentation")
```

## 10.2. Bảng 15 lỗi kinh điển

| # | Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|---|
| 1 | **404** service not found | Service chưa activate ở hub | `/IWFND/MAINT_SERVICE` → Add Service |
| 2 | **403** CSRF token validation failed | Token chưa fetch / hết hạn | `earlyTokenRequest: true`; `refreshSecurityToken()` |
| 3 | **403** không phải CSRF | Thiếu authorization object | `SU53` ngay sau khi lỗi → gửi Basis |
| 4 | **400** "Property X is not filterable" | `sap:filterable="false"` trong metadata | Bỏ filter, hoặc yêu cầu ABAPer bật |
| 5 | **400** invalid `$filter` syntax | Tự nối chuỗi filter, quên escape `'` | Dùng `sap.ui.model.Filter`, không nối tay |
| 6 | **412** Precondition Failed | ETag cũ, người khác đã sửa | Refresh binding rồi thử lại |
| 7 | **500** với dump | Lỗi ABAP trong DPC_EXT | `/IWFND/ERROR_LOG` + `ST22` → ABAPer |
| 8 | **501** Not Implemented | Method chưa redefine (vd. `CREATE_DEEP_ENTITY`) | Yêu cầu ABAPer implement |
| 9 | Metadata cũ, field mới không thấy | Cache metadata | `/IWFND/CACHE_CLEANUP` + `/IWBEP/CACHE_CLEANUP` + Ctrl+Shift+R |
| 10 | `$expand` trả `null` / thiếu dữ liệu | ABAPer chưa implement `GET_EXPANDED_ENTITYSET` | Đọc lẻ bằng nhiều request, hoặc yêu cầu implement |
| 11 | App load rất chậm, 1 request 30s | Backend không honour `$top/$skip/$filter` | Xem mục 9.4 → làm việc với ABAPer |
| 12 | CORS error khi dev local | Gọi thẳng backend từ localhost | Dùng `fiori-tools-proxy` trong `ui5.yaml` |
| 13 | Sửa giá trị nhưng save không đổi gì | `defaultBindingMode` không phải TwoWay, hoặc quên `submitChanges()` | Kiểm tra manifest settings |
| 14 | `submitChanges` "success" nhưng dữ liệu không lưu | Lỗi nằm trong `__batchResponses` | Kiểm tra batch response (mục 7.1) |
| 15 | Số liệu counter sai | `defaultCountMode` sai hoặc backend không set `inlinecount` | Đặt `Inline`; yêu cầu BE set `es_response_context-inlinecount` |

## 10.3. Bộ công cụ debug

### A. Network tab — đọc `$batch`
```
POST /sap/opu/odata/SAP/ZSRV/$batch
Content-Type: multipart/mixed; boundary=batch_id-123

--batch_id-123
Content-Type: multipart/mixed; boundary=changeset_id-456

--changeset_id-456
Content-Type: application/http
Content-Transfer-Encoding: binary

MERGE ProductSet('HT-1000') HTTP/1.1
Content-Type: application/json
{"Price":"1099.00"}
--changeset_id-456--
--batch_id-123--
```
Response lỗi:
```
HTTP/1.1 400 Bad Request
{"error":{"code":"ZPROD/012","message":{"value":"Price must be greater than zero"}}}
```

### B. UI5 Diagnostics (Ctrl + Shift + Alt + S)
Panel hiện ra cho phép xem: Control Tree, Binding Info, Model data, UI5 version, loaded modules.

### C. UI5 Inspector (Chrome extension) — **bắt buộc cài**
https://chrome.google.com/webstore → "UI5 Inspector"
Cho phép: click control → xem properties, binding path, model data, sự kiện.

### D. URL parameters hữu dụng
```
?sap-ui-debug=true                 → load file nguồn không minify
?sap-ui-language=en                → ép ngôn ngữ
?sap-client=100                    → chọn client
?sap-ui-theme=sap_horizon_dark
?sap-statistics=true               → bật Gateway performance statistics header
?sap-ui-xx-componentPreload=off    → tắt preload, debug từng file
```

`sap-statistics=true` trả về header `sap-perf-fesrec` và cho phép xem:
```
Gateway total time | Backend time | Framework overhead | Application time
```
→ **Đây là cách chứng minh "chậm do backend hay do FE"** — cực kỳ ghi điểm.

### E. Console snippets
```js
// Model nào đang có trên view hiện tại?
const oView = sap.ui.getCore().byId(sap.ui.core.Element.registry.filter(e => e.isA("sap.ui.core.mvc.View"))[0].getId());

// Xem pending changes
oModel.getPendingChanges();

// Xem metadata đã load chưa
oModel.getServiceMetadata();

// Xem toàn bộ dữ liệu model V2 đang cache
oModel.oData;

// Bật log chi tiết
sap.base.Log.setLevel(sap.base.Log.Level.DEBUG);
```

## 10.4. Lab 10 — Bug hunt (thực hành nhóm)

Giảng viên chuẩn bị 1 app có **6 bug cài sẵn**, học viên tìm và fix trong 60 phút:

| Bug | Triệu chứng học viên thấy | Root cause cài sẵn |
|---|---|---|
| 1 | Bảng trắng, không lỗi | binding path sai `/ProductsSet` thay vì `/ProductSet` |
| 2 | Search không hoạt động | filter apply lên binding sai (`items` vs `rows`) |
| 3 | Save báo thành công nhưng không lưu | không check `__batchResponses` |
| 4 | Lỗi 400 khi sort theo Supplier | property `sap:sortable="false"` |
| 5 | Detail page load 6s | thiếu `$select`, expand thừa 4 navigation |
| 6 | Dialog mở lần 2 bị lỗi | fragment tạo mới mỗi lần, không destroy → duplicate ID |

**Deliverable:** mỗi học viên nộp 1 bảng `Bug → Root cause → Fix → Verification` bằng tiếng Anh. Đây chính là **defect report** trong dự án thật.

## 10.5. Template Defect Report (dùng luôn trong công việc)

```markdown
### DEF-0042 — Product list returns HTTP 400 when sorting by supplier

**Environment:** DEV / client 100 / ZPROD_SRV v1 / UI5 1.120.3
**Severity:** Medium — blocks sorting, no data loss
**Steps to reproduce:**
1. Open "Product Catalog" app
2. Open sort dialog → select "Supplier"
3. Press OK

**Expected:** list sorted by supplier name
**Actual:** HTTP 400 — "Property 'ToSupplier/CompanyName' is not sortable"

**Root cause:** `sap:sortable="false"` on the navigation property in ZPROD_SRV
metadata; sorting across an association is not supported by the DPC implementation.

**Fix (frontend):** remove the option from the sort dialog and sort by SupplierID
instead (which is sortable).
**Fix (backend, requested):** implement sorting in `PRODUCTSET_GET_ENTITYSET`
and set `sap:sortable="true"` — tracked as CR-0117.

**Verification:** sort by SupplierID returns 200 with correctly ordered result;
regression test added to OPA5 journey `SortJourney`.
```

## 10.6. Bài tập buổi 10
1. Hoàn thành bug hunt, nộp defect report EN.
2. Bật `sap-statistics=true` trên ES5, đo và so sánh thời gian gateway vs backend cho 3 request.
3. Tự tạo 3 bug và đố bạn học khác tìm (rèn tư duy debug 2 chiều).
