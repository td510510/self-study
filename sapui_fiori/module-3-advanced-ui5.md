# MODULE 3 — SAPUI5 nâng cao (Buổi 11 → 15)

> **JD coverage:** "Senior-level hands-on experience", "Ensure UI consistency", "Understanding of UX principles and responsive enterprise application design"

---

# BUỔI 11 — Routing & Navigation, Flexible Column Layout

## 11.1. Cấu hình routing trong `manifest.json`

```json
"sap.ui5": {
  "rootView": {
    "viewName": "com.bd.app.view.App",
    "type": "XML",
    "id": "app",
    "async": true
  },
  "routing": {
    "config": {
      "routerClass": "sap.f.routing.Router",
      "viewType": "XML",
      "viewPath": "com.bd.app.view",
      "controlId": "fcl",
      "controlAggregation": "beginColumnPages",
      "bypassed": { "target": "notFound" },
      "async": true,
      "transition": "slide"
    },
    "routes": [
      {
        "pattern": "",
        "name": "list",
        "target": ["list"]
      },
      {
        "pattern": "Products/{productId}",
        "name": "detail",
        "target": ["list", "detail"]
      },
      {
        "pattern": "Products/{productId}/items/{itemId}",
        "name": "itemDetail",
        "target": ["list", "detail", "itemDetail"]
      },
      {
        "pattern": "create/:mode:",
        "name": "create",
        "target": ["list", "create"]
      }
    ],
    "targets": {
      "list": {
        "viewName": "List",
        "viewId": "list",
        "controlAggregation": "beginColumnPages",
        "viewLevel": 1
      },
      "detail": {
        "viewName": "Detail",
        "viewId": "detail",
        "controlAggregation": "midColumnPages",
        "viewLevel": 2
      },
      "itemDetail": {
        "viewName": "ItemDetail",
        "viewId": "itemDetail",
        "controlAggregation": "endColumnPages",
        "viewLevel": 3
      },
      "notFound": {
        "viewName": "NotFound",
        "viewId": "notFound",
        "transition": "show",
        "controlAggregation": "midColumnPages"
      }
    }
  }
}
```

### Cú pháp pattern
| Pattern | Ý nghĩa |
|---|---|
| `Products/{id}` | tham số bắt buộc |
| `Products/:id:` | tham số **tùy chọn** |
| `Products/{id}/:?query:` | query parameters (`?tab=items&mode=edit`) |
| `""` | route mặc định |
| `*` (bypassed) | không match → notFound |

## 11.2. Điều hướng trong controller

```js
sap.ui.define([
    "./BaseController",
    "sap/ui/core/routing/History"
], function (BaseController, History) {
    "use strict";

    return BaseController.extend("com.bd.app.controller.List", {

        onInit: function () {
            this.getRouter().getRoute("list")
                .attachPatternMatched(this._onListMatched, this);
        },

        _onListMatched: function (oEvent) {
            // Lấy tham số route
            const oArgs  = oEvent.getParameter("arguments");
            const oQuery = oArgs["?query"] || {};
            if (oQuery.filter) { this._applyFilterFromUrl(oQuery.filter); }
        },

        onItemPress: function (oEvent) {
            const oCtx = oEvent.getSource().getBindingContext();
            this.getRouter().navTo("detail", {
                productId: window.encodeURIComponent(oCtx.getProperty("ProductID")),
                "?query": { tab: "general" }
            });
        },

        onNavBack: function () {
            const sPrev = History.getInstance().getPreviousHash();
            if (sPrev !== undefined) {
                window.history.go(-1);
            } else {
                // navTo với bReplace = true → không thêm entry vào history
                this.getRouter().navTo("list", {}, true);
            }
        }
    });
});
```

**Detail controller — bind context theo route:**
```js
onInit: function () {
    this.getRouter().getRoute("detail")
        .attachPatternMatched(this._onDetailMatched, this);
},

_onDetailMatched: function (oEvent) {
    const sId = window.decodeURIComponent(oEvent.getParameter("arguments").productId);
    const oModel = this.getModel();

    // Chờ metadata mới createKey được
    oModel.metadataLoaded().then(() => {
        const sPath = oModel.createKey("/ProductSet", { ProductID: sId });
        this._bindView("/" + sPath.replace(/^\//, ""));
    });
},

_bindView: function (sPath) {
    const oView = this.getView();
    oView.bindElement({
        path: sPath,
        parameters: { expand: "ToSupplier" },
        events: {
            dataRequested: () => oView.setBusy(true),
            dataReceived:  () => oView.setBusy(false),
            change: () => {
                // Nếu entity không tồn tại → điều hướng sang notFound
                const oCtx = oView.getElementBinding().getBoundContext();
                if (!oCtx) { this.getRouter().getTargets().display("notFound"); }
            }
        }
    });
}
```

> **Bẫy senior:** `bindElement` với path sai vẫn không throw error — chỉ im lặng không hiện gì. Luôn xử lý event `change` để bắt trường hợp `getBoundContext()` trả `undefined`.

## 11.3. Flexible Column Layout (FCL)

**`view/App.view.xml`**
```xml
<mvc:View controllerName="com.bd.app.controller.App"
    xmlns="sap.m" xmlns:mvc="sap.ui.core.mvc" xmlns:f="sap.f"
    displayBlock="true" height="100%">

    <f:FlexibleColumnLayout
        id="fcl"
        layout="{appView>/layout}"
        stateChange=".onStateChange"
        backgroundDesign="Solid"/>
</mvc:View>
```

**`controller/App.controller.js`**
```js
sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/f/library"
], function (BaseController, JSONModel, fioriLibrary) {
    "use strict";

    const LayoutType = fioriLibrary.LayoutType;

    return BaseController.extend("com.bd.app.controller.App", {

        onInit: function () {
            this.setModel(new JSONModel({
                layout: LayoutType.OneColumn,
                previousLayout: "",
                actionButtonsInfo: { midColumn: { fullScreen: false } }
            }), "appView");

            this.getRouter().attachRouteMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            const sRouteName = oEvent.getParameter("name");
            const mLayoutByRoute = {
                list:       LayoutType.OneColumn,
                detail:     LayoutType.TwoColumnsMidExpanded,
                create:     LayoutType.TwoColumnsMidExpanded,
                itemDetail: LayoutType.ThreeColumnsEndExpanded
            };
            this.getModel("appView").setProperty(
                "/layout", mLayoutByRoute[sRouteName] || LayoutType.OneColumn);
        },

        /** User kéo tay đổi layout → đồng bộ lại model */
        onStateChange: function (oEvent) {
            const sLayout = oEvent.getParameter("layout");
            this.getModel("appView").setProperty("/layout", sLayout);

            // Nếu user đóng cột giữa → quay về route list
            if (sLayout === LayoutType.OneColumn) {
                this.getRouter().navTo("list");
            }
        },

        /** Nút full screen trên cột giữa */
        onToggleFullScreen: function () {
            const oModel = this.getModel("appView");
            const bFull  = oModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
            oModel.setProperty("/layout",
                bFull ? LayoutType.TwoColumnsMidExpanded : LayoutType.MidColumnFullScreen);
            oModel.setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFull);
        }
    });
});
```

### Các LayoutType hay dùng
| Layout | Hiển thị |
|---|---|
| `OneColumn` | chỉ begin |
| `TwoColumnsBeginExpanded` | begin rộng, mid hẹp |
| `TwoColumnsMidExpanded` | begin hẹp, mid rộng ← **mặc định cho detail** |
| `MidColumnFullScreen` | mid toàn màn hình |
| `ThreeColumnsMidExpanded` | 3 cột, mid rộng |
| `ThreeColumnsEndExpanded` | 3 cột, end rộng |
| `EndColumnFullScreen` | end toàn màn hình |

## 11.4. Bài tập buổi 11
1. Chuyển Project 1 sang FCL 2 cột.
2. Thêm route `create` mở form tạo mới ở cột giữa, URL phải deep-link được.
3. Test: copy URL detail → mở tab mới → phải load đúng bản ghi (deep link hoạt động).

---

# BUỔI 12 — Fragments, Dialogs, i18n

## 12.1. Fragment là gì

Fragment = mảnh UI **không có controller riêng**, dùng lại được, không có ID prefix riêng (chia sẻ namespace ID với view chứa nó — nguồn lỗi duplicate ID).

3 kiểu dùng:
| Kiểu | Cách tạo | Khi nào |
|---|---|---|
| Dialog / Popover | `Controller.loadFragment()` | Phổ biến nhất |
| Nhúng trong view | `<core:Fragment fragmentName="..." type="XML"/>` | Tái sử dụng khối form |
| Fragment có controller riêng | `Fragment.load({ controller: oCtrl })` | Fragment phức tạp |

## 12.2. Dialog đúng chuẩn (API mới, async)

**`webapp/fragment/CreateProductDialog.fragment.xml`**
```xml
<core:FragmentDefinition
    xmlns="sap.m"
    xmlns:core="sap.ui.core"
    xmlns:f="sap.ui.layout.form">

    <Dialog id="createDialog"
            title="{i18n>createProductTitle}"
            contentWidth="40rem"
            escapeHandler=".onDialogEscape"
            afterClose=".onCreateDialogClosed">

        <content>
            <MessageStrip
                text="{i18n>createHint}"
                type="Information"
                showIcon="true"
                class="sapUiSmallMargin"/>

            <f:SimpleForm editable="true" layout="ResponsiveGridLayout"
                          labelSpanS="12" labelSpanM="4" columnsM="1">
                <Label text="{i18n>name}" required="true"/>
                <Input id="nameInput"
                       value="{create>/Name}"
                       maxLength="40"
                       liveChange=".onValidateForm"/>

                <Label text="{i18n>category}" required="true"/>
                <ComboBox id="categoryBox"
                          selectedKey="{create>/CategoryID}"
                          items="{ path: '/CategorySet', sorter: { path: 'CategoryName' } }"
                          selectionChange=".onValidateForm">
                    <core:Item key="{CategoryID}" text="{CategoryName}"/>
                </ComboBox>

                <Label text="{i18n>price}" required="true"/>
                <Input id="priceInput"
                       value="{ path: 'create>/Price',
                                type: 'sap.ui.model.type.Decimal',
                                constraints: { minimum: 0.01 } }"
                       description="EUR"
                       liveChange=".onValidateForm"/>
            </f:SimpleForm>
        </content>

        <beginButton>
            <Button text="{i18n>create}"
                    type="Emphasized"
                    enabled="{create>/isValid}"
                    press=".onCreateConfirm"/>
        </beginButton>
        <endButton>
            <Button text="{i18n>cancel}" press=".onCreateCancel"/>
        </endButton>
    </Dialog>
</core:FragmentDefinition>
```

**Controller — pattern chuẩn (cache fragment, không tạo lại):**
```js
sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("com.bd.app.controller.List", {

        onOpenCreateDialog: async function () {
            // Model riêng cho dialog → không đụng vào OData model
            this.setModel(new JSONModel({
                Name: "", CategoryID: "", Price: "", isValid: false
            }), "create");

            // loadFragment tự add vào dependents của view → thừa hưởng model + i18n
            if (!this._pCreateDialog) {
                this._pCreateDialog = this.loadFragment({
                    name: "com.bd.app.fragment.CreateProductDialog"
                });
            }
            const oDialog = await this._pCreateDialog;
            oDialog.open();
        },

        onValidateForm: function () {
            const oData = this.getModel("create").getData();
            const bValid = !!oData.Name && !!oData.CategoryID && parseFloat(oData.Price) > 0;
            this.getModel("create").setProperty("/isValid", bValid);
        },

        onCreateConfirm: async function () {
            const oDialog = await this._pCreateDialog;
            const oData   = this.getModel("create").getData();
            oDialog.setBusy(true);
            try {
                await this._oHelper.create("/ProductSet", {
                    Name: oData.Name,
                    CategoryID: oData.CategoryID,
                    Price: oData.Price,
                    CurrencyCode: "EUR"
                });
                this.toast("createSuccess");
                oDialog.close();
                this.byId("table").getBinding("items").refresh();
            } catch (oErr) {
                this._oHelper.showError(oErr);
            } finally {
                oDialog.setBusy(false);
            }
        },

        onCreateCancel: async function () {
            (await this._pCreateDialog).close();
        },

        onCreateDialogClosed: function () {
            this.getModel("create").setData({ Name: "", CategoryID: "", Price: "", isValid: false });
        },

        onExit: function () {
            // Fragment KHÔNG tự destroy nếu bạn không add vào dependents
            // loadFragment() đã add rồi → view destroy sẽ destroy dialog.
            // Nếu dùng Fragment.load() thủ công thì phải destroy ở đây.
        }
    });
});
```

> ❌ **Anti-pattern hay gặp:** tạo dialog mới mỗi lần bấm nút → duplicate ID error + memory leak.
> ✅ **Đúng:** cache promise (`this._pCreateDialog`), `loadFragment()` để tự add dependent.

## 12.3. Value Help Dialog (F4) — tính năng SAP đặc trưng

```xml
<Input id="supplierInput"
       value="{SupplierName}"
       showValueHelp="true"
       valueHelpRequest=".onSupplierValueHelp"
       valueHelpOnly="true"/>
```

**`fragment/SupplierValueHelp.fragment.xml`**
```xml
<core:FragmentDefinition xmlns="sap.m" xmlns:core="sap.ui.core">
    <SelectDialog
        id="supplierDialog"
        noDataText="{i18n>noSuppliers}"
        title="{i18n>selectSupplier}"
        search=".onSupplierSearch"
        liveChange=".onSupplierSearch"
        confirm=".onSupplierConfirm"
        cancel=".onSupplierCancel"
        growing="true"
        growingThreshold="30"
        items="{ path: '/BusinessPartnerSet',
                 parameters: { select: 'BusinessPartnerID,CompanyName,City,Country' },
                 sorter: { path: 'CompanyName' } }">
        <StandardListItem
            title="{CompanyName}"
            description="{BusinessPartnerID}"
            info="{City}, {Country}"
            type="Active"/>
    </SelectDialog>
</core:FragmentDefinition>
```

```js
onSupplierValueHelp: async function (oEvent) {
    this._oValueHelpSource = oEvent.getSource();
    if (!this._pSupplierDialog) {
        this._pSupplierDialog = this.loadFragment({
            name: "com.bd.app.fragment.SupplierValueHelp"
        });
    }
    (await this._pSupplierDialog).open();
},

onSupplierSearch: function (oEvent) {
    const sValue = oEvent.getParameter("value") || oEvent.getParameter("newValue") || "";
    const oFilter = new Filter({
        filters: [
            new Filter("CompanyName", FilterOperator.Contains, sValue),
            new Filter("BusinessPartnerID", FilterOperator.Contains, sValue)
        ],
        and: false
    });
    oEvent.getSource().getBinding("items").filter(sValue ? [oFilter] : []);
},

onSupplierConfirm: function (oEvent) {
    const oItem = oEvent.getParameter("selectedItem");
    if (!oItem) { return; }
    const oCtx = oItem.getBindingContext();
    this.getModel("create").setProperty("/SupplierID",   oCtx.getProperty("BusinessPartnerID"));
    this.getModel("create").setProperty("/SupplierName", oCtx.getProperty("CompanyName"));
    oEvent.getSource().getBinding("items").filter([]);   // reset filter cho lần sau
}
```

## 12.4. i18n chuyên nghiệp

**`i18n/i18n.properties`** (default = English)
```properties
# ---------- App ----------
#XTIT: Application title
appTitle=Product Catalog
#XTIT: Application description
appDescription=Browse and maintain BD product master data

# ---------- List view ----------
#XTIT: Page title with placeholder for the item count
listTitle=Products ({0})
#XFLD: Search field placeholder
searchPlaceholder=Search by product or supplier
#XBUT: Create button
create=Create
#XBUT
save=Save
#XBUT
cancel=Cancel
#XBUT
delete=Delete

# ---------- Messages ----------
#XMSG: Success message after creating a product, {0} = product id
createSuccess=Product {0} has been created
#YMSG: Confirmation before deleting
confirmDelete=Are you sure you want to delete this product? This cannot be undone.
#YMSG: Concurrency conflict
dataChangedByOther=The record was changed by another user. The screen will be refreshed.
```

**Text type annotation (chuẩn SAP translation)** — bắt buộc trong dự án enterprise:
| Prefix | Nghĩa |
|---|---|
| `XTIT` | Title |
| `XBUT` | Button |
| `XFLD` | Field label |
| `XCOL` | Column header |
| `XMSG` | Message |
| `YMSG` | Long message |
| `XTOL` | Tooltip |
| `XLNK` | Link |

**`i18n/i18n_vi.properties`**
```properties
appTitle=Danh mục sản phẩm
listTitle=Sản phẩm ({0})
searchPlaceholder=Tìm theo sản phẩm hoặc nhà cung cấp
create=Tạo mới
save=Lưu
cancel=Hủy
delete=Xóa
createSuccess=Đã tạo sản phẩm {0}
confirmDelete=Bạn có chắc muốn xóa sản phẩm này? Thao tác không thể hoàn tác.
```

**Khai báo supportedLocales (quan trọng cho performance — tránh 404 khi tìm bundle):**
```json
"models": {
  "i18n": {
    "type": "sap.ui.model.resource.ResourceModel",
    "settings": {
      "bundleName": "com.bd.app.i18n.i18n",
      "supportedLocales": ["", "en", "de", "vi"],
      "fallbackLocale": "en"
    }
  }
}
```

**Dùng i18n trong JS:**
```js
const sMsg = this.getResourceBundle().getText("createSuccess", [sProductId]);
```

**Số nhiều & định dạng:**
```js
// UI5 hỗ trợ số nhiều bằng ResourceBundle nếu dùng đúng cú pháp Java MessageFormat
// itemCount=There {0,choice,0#are no items|1#is one item|1<are {0} items}
```

## 12.5. Bài tập buổi 12
1. Thêm Create dialog + Value Help vào Project 1.
2. Dịch toàn bộ app sang tiếng Việt, test bằng `?sap-ui-language=vi`.
3. Chứng minh không có duplicate ID khi mở/đóng dialog 10 lần (dùng UI5 Inspector).

---

# BUỔI 13 — Responsive Design & Fiori UX Guidelines

> JD nice-to-have: *"Understanding of UX principles and responsive enterprise application design"*
> JD must-have: *"Ensure UI consistency"*

## 13.1. Ba cách làm responsive trong UI5

### A. Device Model (logic trong view)
```js
// Component.js
this.setModel(new JSONModel(sap.ui.Device), "device");
```
```xml
<Table visible="{device>/system/desktop}"/>
<List  visible="{device>/system/phone}"/>
<Panel expandable="{device>/system/phone}"/>
```

### B. Control tự responsive (ưu tiên nhất)
```xml
<!-- Table popin -->
<Column minScreenWidth="Tablet" demandPopin="true" popinDisplay="Inline">

<!-- Form tự chia cột theo breakpoint -->
<f:SimpleForm layout="ResponsiveGridLayout"
    labelSpanXL="3" labelSpanL="3" labelSpanM="4"  labelSpanS="12"
    columnsXL="3"   columnsL="2"   columnsM="1"
    singleContainerFullSize="false"/>

<!-- Grid -->
<l:Grid defaultSpan="XL3 L4 M6 S12" hSpacing="1" vSpacing="1">

<!-- Toolbar tự đưa nút vào overflow menu -->
<OverflowToolbar>
    <Button text="Action 1"/>
    <Button text="Action 2">
        <layoutData><OverflowToolbarLayoutData priority="Low"/></layoutData>
    </Button>
</OverflowToolbar>
```

### C. CSS media query (dùng cuối cùng)
```css
/* webapp/css/style.css */
.bdKpiTile { width: 25%; }
@media (max-width: 600px) {
    .bdKpiTile { width: 100%; }
}
```
```json
"sap.ui5": {
  "resources": { "css": [{ "uri": "css/style.css" }] }
}
```

### Breakpoints của UI5
| Tên | Width |
|---|---|
| S (Phone) | < 600px |
| M (Tablet) | 600–1023px |
| L (Desktop) | 1024–1439px |
| XL | ≥ 1440px |

## 13.2. Content Density — Cozy vs Compact

```js
// Component.js — chuẩn SAP
getContentDensityClass: function () {
    if (this._sContentDensityClass === undefined) {
        if (!Device.support.touch) {
            this._sContentDensityClass = "sapUiSizeCompact";   // desktop, chuột
        } else {
            this._sContentDensityClass = "sapUiSizeCozy";      // touch, ngón tay
        }
    }
    return this._sContentDensityClass;
}
```
```js
// BaseController — áp cho view và mọi dialog
onInit: function () {
    this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
},

// Dialog phải tự add — dialog nằm ngoài DOM của view (static area)
onOpenDialog: async function () {
    const oDialog = await this._pDialog;
    oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
    oDialog.open();
}
```
> ⚠️ **Bug rất hay gặp:** dialog nhìn "to bất thường" so với app → quên add content density class cho dialog.

## 13.3. CSS class chuẩn SAP — dùng thay vì viết CSS riêng

```
Margin:  sapUiTinyMargin  sapUiSmallMargin  sapUiMediumMargin  sapUiLargeMargin
         + Top / Bottom / Begin / End / TopBottom / BeginEnd
Padding: sapUiTinyMarginTop, sapUiContentPadding, sapUiNoContentPadding
Text:    sapMText, sapUiTinyText
Layout:  sapUiResponsiveMargin, sapUiResponsiveContentPadding
Density: sapUiSizeCompact, sapUiSizeCozy
```
> Nguyên tắc code review: **CSS tự viết phải có lý do**. Ưu tiên class SAP → đảm bảo UI consistency (yêu cầu trực tiếp của JD) và không vỡ khi đổi theme.

## 13.4. Floorplan — chọn đúng khuôn mẫu Fiori

| Floorplan | Control chính | Dùng khi |
|---|---|---|
| **List Report** | `sap.f.DynamicPage` + `FilterBar` + `Table` | Danh sách + lọc |
| **Object Page** | `sap.uxap.ObjectPageLayout` | Chi tiết 1 object |
| **Worklist** | `DynamicPage` + `IconTabBar` + `Table` | Danh sách việc cần xử lý |
| **Overview Page (OVP)** | Cards | Dashboard tổng quan |
| **Analytical List Page (ALP)** | Chart + Table | Phân tích + hành động |
| **Wizard** | `sap.m.Wizard` | Quy trình nhiều bước |
| **Initial Page / Full-screen** | `sap.m.Page` | App đơn giản |

## 13.5. Checklist UI Consistency (dùng khi code review)

```markdown
## Fiori UI Review Checklist

### Layout & Floorplan
- [ ] Dùng đúng floorplan chuẩn (List Report / Object Page / Worklist)
- [ ] `DynamicPage` có title + header, `toggleHeaderOnTitleClick` bật
- [ ] Footer chỉ chứa action chính (Save / Cancel), tối đa 1 Emphasized button

### Controls
- [ ] Không dùng control deprecated (kiểm tra Console warning)
- [ ] Table responsive (`sap.m.Table`) hoặc có lý do rõ ràng dùng grid table
- [ ] Cột có `demandPopin` + `minScreenWidth`
- [ ] Empty state dùng `IllustratedMessage`, không dùng Text trơn
- [ ] Busy indicator có `busyIndicatorDelay` (tránh nhấp nháy)

### Texts
- [ ] 0 chuỗi hardcode trong XML/JS — tất cả qua i18n
- [ ] i18n có text-type annotation (#XBUT, #XTIT…)
- [ ] Nút dùng động từ ("Create", "Save"), không dùng "OK/Submit" mơ hồ

### Semantics
- [ ] Màu trạng thái đúng: Error=đỏ, Warning=cam, Success=xanh, Information=xanh dương
- [ ] Icon dùng `sap-icon://` từ SAP Icon Font, không dùng ảnh rời
- [ ] Message: MessageToast (thành công), MessageBox (cần xác nhận), MessageStrip (ngữ cảnh)

### Responsive
- [ ] Test ở 3 breakpoint: 375px / 768px / 1440px
- [ ] Content density đúng cho cả view và dialog
- [ ] Không có horizontal scroll ở phone

### Accessibility
- [ ] Mọi input có `<Label labelFor="...">`
- [ ] Icon-only button có `tooltip`
- [ ] Bảng có `ariaLabelledBy`
- [ ] Kiểm tra bằng theme high-contrast `sap_horizon_hcb`
```

## 13.6. Bài tập buổi 13
1. Chạy checklist trên với Project 1, sửa hết các mục fail.
2. Chụp app ở 3 breakpoint, đính vào báo cáo.
3. Đổi sang theme `sap_horizon_hcb`, tìm chỗ chữ bị mất tương phản.

---

# BUỔI 14 — Custom Controls, Extension, Reuse Component

## 14.1. Custom Control

Chỉ viết custom control khi: control chuẩn không đáp ứng **và** cần tái sử dụng ở nhiều nơi.

**`webapp/control/StatusIndicator.js`**
```js
sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Text",
    "sap/ui/core/Icon"
], function (Control, Text, Icon) {
    "use strict";

    return Control.extend("com.bd.app.control.StatusIndicator", {

        metadata: {
            properties: {
                value:     { type: "int",     defaultValue: 0 },
                threshold: { type: "int",     defaultValue: 20 },
                showLabel: { type: "boolean", defaultValue: true }
            },
            aggregations: {
                _icon:  { type: "sap.ui.core.Icon", multiple: false, visibility: "hidden" },
                _label: { type: "sap.m.Text",       multiple: false, visibility: "hidden" }
            },
            events: {
                thresholdBreached: {
                    parameters: { value: { type: "int" } }
                }
            }
        },

        init: function () {
            this.setAggregation("_icon",  new Icon());
            this.setAggregation("_label", new Text());
        },

        setValue: function (iValue) {
            this.setProperty("value", iValue, true);   // true = suppress invalidate
            this._updateInternals();
            if (iValue < this.getThreshold()) {
                this.fireThresholdBreached({ value: iValue });
            }
            this.invalidate();
            return this;
        },

        _updateInternals: function () {
            const iValue = this.getValue();
            const bLow   = iValue < this.getThreshold();
            this.getAggregation("_icon")
                .setSrc(bLow ? "sap-icon://alert" : "sap-icon://accept")
                .setColor(bLow ? "#bb0000" : "#107e3e");
            this.getAggregation("_label").setText(String(iValue));
        },

        // Renderer kiểu mới (apiVersion 2) — DOM patching, nhanh hơn
        renderer: {
            apiVersion: 2,
            render: function (oRm, oControl) {
                oRm.openStart("div", oControl);
                oRm.class("bdStatusIndicator");
                oRm.attr("role", "status");
                oRm.attr("aria-label", "Stock level " + oControl.getValue());
                oRm.openEnd();

                oRm.renderControl(oControl.getAggregation("_icon"));
                if (oControl.getShowLabel()) {
                    oRm.renderControl(oControl.getAggregation("_label"));
                }

                oRm.close("div");
            }
        }
    });
});
```

**CSS:**
```css
.bdStatusIndicator { display: inline-flex; align-items: center; gap: 0.5rem; }
```

**Dùng trong view:**
```xml
<mvc:View xmlns:bd="com.bd.app.control" ...>
    <bd:StatusIndicator
        value="{UnitsInStock}"
        threshold="20"
        thresholdBreached=".onStockLow"/>
</mvc:View>
```

## 14.2. Reuse Component — chia sẻ giữa nhiều app

Trong product development (bối cảnh JD), nhiều app dùng chung 1 khối UI → làm reuse component.

**`reuse/attachments/Component.js`**
```js
sap.ui.define(["sap/ui/core/UIComponent"], function (UIComponent) {
    "use strict";
    return UIComponent.extend("com.bd.reuse.attachments.Component", {
        metadata: {
            manifest: "json",
            properties: {
                objectKey: { type: "string" }
            }
        },
        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
        }
    });
});
```

**Nhúng vào app khác:**
```xml
<core:ComponentContainer
    id="attachmentsContainer"
    name="com.bd.reuse.attachments"
    settings="{ objectKey: '{ProductID}' }"
    propagateModel="true"
    async="true"
    height="100%"/>
```

Khai báo dependency trong `manifest.json` của app host:
```json
"sap.ui5": {
  "componentUsages": {
    "attachments": {
      "name": "com.bd.reuse.attachments",
      "lazy": true,
      "settings": {}
    }
  }
}
```
```js
// Tạo bằng code khi cần (lazy)
const oComponent = await this.getOwnerComponent().createComponent({
    usage: "attachments",
    settings: { objectKey: sProductId }
});
this.byId("container").setComponent(oComponent);
```

## 14.3. Extension Points — mở rộng app SAP standard

Khi phải customize app Fiori chuẩn của SAP mà **không được sửa code gốc** (nếu sửa sẽ mất khi upgrade).

**Trong view chuẩn của SAP:**
```xml
<core:ExtensionPoint name="extListItemInfo"/>
```

**Trong app extension của bạn (`manifest.json`):**
```json
"sap.ui5": {
  "extends": {
    "component": "sap.ui.demo.standardapp",
    "extensions": {
      "sap.ui.viewExtensions": {
        "sap.ui.demo.standardapp.view.List": {
          "extListItemInfo": {
            "className": "sap.ui.core.Fragment",
            "fragmentName": "com.bd.ext.fragment.CustomInfo",
            "type": "XML"
          }
        }
      },
      "sap.ui.controllerExtensions": {
        "sap.ui.demo.standardapp.controller.List": {
          "controllerName": "com.bd.ext.controller.ListExtension"
        }
      },
      "sap.ui.viewModifications": {
        "sap.ui.demo.standardapp.view.List": {
          "deleteButton": { "visible": false }
        }
      }
    }
  }
}
```

**Controller extension (API hiện đại — `ControllerExtension`):**
```js
sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension"
], function (ControllerExtension) {
    "use strict";

    return ControllerExtension.extend("com.bd.ext.controller.ListExtension", {

        // override method của controller gốc
        override: {
            onInit: function () {
                // gọi bản gốc trước
                this.base.getView().addStyleClass("bdCustom");
            },
            onItemPress: function (oEvent) {
                // logic riêng của BD
                console.log("BD custom navigation");
            }
        },

        // method mới cho extension fragment gọi
        onCustomAction: function () { /* ... */ }
    });
});
```

> **SAP Fiori Elements** dùng cùng cơ chế này qua "Extension API" và "Flexible Programming Model" (Buổi 17).

## 14.4. Bài tập buổi 14
1. Viết custom control `PriceTag` hiển thị giá + badge giảm giá, có event `press`.
2. Tách phần "Attachments" của Project 2 thành reuse component.
3. Tìm 1 app Fiori chuẩn trên ES5, xác định các ExtensionPoint có sẵn.

---

# BUỔI 15 — TypeScript & Tooling hiện đại

## 15.1. Vì sao SAP đang chuyển sang TypeScript

- Type safety → bắt lỗi khi build thay vì khi chạy (JD: "quality assurance").
- IntelliSense đầy đủ cho ~10.000 API của UI5.
- SAP cung cấp `@sapui5/types` chính thức, template `ui5-typescript-helloworld`.
- Bắt buộc nếu dự án dùng CAP + TS full-stack.

## 15.2. Khởi tạo project TypeScript

```bash
yo @sap/fiori
# chọn: SAPUI5 freestyle → SAPUI5 Application
# Add deployment config: No
# Configure advanced options: Yes → Enable TypeScript: Yes
```

Hoặc thủ công:
```bash
npm install --save-dev typescript @sapui5/types \
    @ui5/ts-interface-generator ui5-tooling-transpile \
    @types/openui5 eslint @typescript-eslint/parser
```

**`tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "skipLibCheck": true,
    "allowJs": true,
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "rootDir": "./webapp",
    "baseUrl": "./",
    "paths": {
      "com/bd/app/*": ["./webapp/*"]
    },
    "types": ["@sapui5/types"]
  },
  "include": ["./webapp/**/*"]
}
```

**`ui5.yaml`** thêm middleware transpile:
```yaml
builder:
  customTasks:
    - name: ui5-tooling-transpile-task
      afterTask: replaceVersion
server:
  customMiddleware:
    - name: ui5-tooling-transpile-middleware
      afterMiddleware: compression
```

## 15.3. Controller viết bằng TypeScript

**`webapp/controller/List.controller.ts`**
```ts
import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import MessageToast from "sap/m/MessageToast";
import Table from "sap/m/Table";
import SearchField from "sap/m/SearchField";
import ListBinding from "sap/ui/model/ListBinding";
import Event from "sap/ui/base/Event";
import UIComponent from "sap/ui/core/UIComponent";

interface ViewState {
    busy: boolean;
    count: number;
    editMode: boolean;
}

/**
 * @namespace com.bd.app.controller
 */
export default class List extends Controller {

    private viewModel: JSONModel;

    public onInit(): void {
        this.viewModel = new JSONModel({
            busy: false, count: 0, editMode: false
        } as ViewState);
        this.getView()?.setModel(this.viewModel, "view");
    }

    public onSearch(event: Event): void {
        // Type-safe: compiler biết getSource() trả về SearchField
        const query = (event.getSource() as SearchField).getValue();
        const filters: Filter[] = [];

        if (query) {
            filters.push(new Filter("Name", FilterOperator.Contains, query));
        }

        const table = this.byId("productTable") as Table;
        const binding = table.getBinding("items") as ListBinding;
        binding.filter(filters);
    }

    public onItemPress(event: Event): void {
        const context = (event.getSource() as Table).getBindingContext();
        if (!context) { return; }

        const productId = context.getProperty("ProductID") as string;
        (this.getOwnerComponent() as UIComponent)
            .getRouter()
            .navTo("detail", { productId: encodeURIComponent(productId) });
    }

    public async onRefresh(): Promise<void> {
        const model = this.getView()?.getModel() as ODataModel;
        model.refresh(true);
        MessageToast.show("Refreshed");
    }
}
```

> Comment `/** @namespace com.bd.app.controller */` là **bắt buộc** — transpiler dùng nó để sinh đúng `sap.ui.define` namespace.

## 15.4. Model typing từ metadata (nâng cao)
```bash
npx @sap-ux/odata-cli generate-types --metadata webapp/localService/metadata.xml
```
Sinh ra interface TS cho từng entity → binding an toàn kiểu.

## 15.5. UI5 Tooling — build cho production

**`package.json`**
```json
{
  "scripts": {
    "start": "ui5 serve --open index.html",
    "start-mock": "ui5 serve --open test/mockServer.html",
    "build": "ui5 build --clean-dest",
    "build:prod": "ui5 build self-contained --clean-dest --all",
    "lint": "eslint webapp --ext .js,.ts",
    "lint:fix": "eslint webapp --ext .js,.ts --fix",
    "test": "karma start",
    "test:unit": "karma start karma-unit.conf.js --single-run",
    "deploy": "npm run build && fiori deploy --config ui5-deploy.yaml"
  }
}
```

**`ui5.yaml` cấu hình build tối ưu:**
```yaml
builder:
  resources:
    excludes:
      - "/test/**"
      - "/localService/**"
  customTasks:
    - name: ui5-tooling-modules-task
      afterTask: replaceVersion
  bundles:
    - bundleDefinition:
        name: "com/bd/app/Component-preload.js"
        defaultFileTypes: [".js", ".fragment.xml", ".view.xml", ".properties", ".json"]
        sections:
          - mode: preload
            filters:
              - "com/bd/app/"
              - "!com/bd/app/test/"
            resolve: false
            resolveConditional: false
            renderer: true
      bundleOptions:
        optimize: true
        usePredefineCalls: true
```

Kết quả `ui5 build`:
```
dist/
├── Component-preload.js     ← gộp toàn bộ view/controller/fragment thành 1 file
├── manifest.json
├── index.html
└── resources/               (chỉ khi self-contained)
```
> `Component-preload.js` giảm từ **~80 HTTP request xuống 1** → đây là tối ưu hiệu năng lớn nhất (Buổi 21).

## 15.6. ESLint cho UI5

**`.eslintrc.json`**
```json
{
  "env": { "browser": true, "es2022": true },
  "extends": ["eslint:recommended"],
  "parserOptions": { "ecmaVersion": 2022, "sourceType": "script" },
  "globals": { "sap": "readonly", "jQuery": "readonly", "QUnit": "readonly", "opaTest": "readonly" },
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "no-unused-vars": "error",
    "no-alert": "error",
    "eqeqeq": ["error", "smart"],
    "curly": "error",
    "strict": ["error", "function"],
    "no-var": "warn",
    "prefer-const": "warn",
    "camelcase": ["warn", { "properties": "never" }],
    "max-len": ["warn", { "code": 120 }],
    "no-restricted-globals": [
      "error",
      { "name": "jQuery", "message": "Use sap.ui.define dependencies instead" }
    ]
  }
}
```

## 15.7. Bài tập buổi 15
1. Migrate 1 controller của Project 1 sang TypeScript, build chạy được.
2. Chạy `ui5 build` và so sánh số request trước/sau bằng Network tab.
3. Chạy ESLint, sửa hết error.

---

# PROJECT 2 — Purchase Requisition Manager (nộp sau buổi 15)

## Bối cảnh nghiệp vụ
> BD IT Product cần một ứng dụng cho phép **Requester** tạo và theo dõi Purchase Requisition (PR), và cho phép **Approver** duyệt/từ chối.

## User stories
| ID | Story | Priority |
|---|---|---|
| US-01 | As a requester, I want to see all my PRs with their status so I can track them | Must |
| US-02 | As a requester, I want to create a PR with multiple line items in one step | Must |
| US-03 | As a requester, I want to edit a PR while it is in status "Draft" | Must |
| US-04 | As a requester, I want to attach a supplier from a value help | Must |
| US-05 | As an approver, I want to approve or reject a PR with a comment | Must |
| US-06 | As a user, I want the app to work on my phone | Must |
| US-07 | As a user, I want to see clear error messages when something fails | Must |
| US-08 | As a user, I want the app in English and Vietnamese | Should |

## Yêu cầu kỹ thuật bắt buộc
1. **FCL 2 cột** (list + object page), deep link hoạt động.
2. OData V2 trên ES5 (`GWSAMPLE_BASIC` — map Sales Order ↔ PR) hoặc mock server nếu ES5 down.
3. **Deep insert** khi tạo PR có nhiều item.
4. **ETag handling** — xử lý 412 đúng cách.
5. **Message Popover** hiển thị message từ backend.
6. Value Help dialog cho Supplier với search server-side.
7. Fragment cached, không duplicate ID.
8. `BaseController` + `formatter` + `ODataHelper` tách file rõ ràng.
9. i18n EN + VI đầy đủ, có text-type annotation.
10. Content density đúng cho cả view và dialog.
11. Không hardcode path — dùng `createKey`.
12. ESLint pass 0 error.

## Cấu trúc bàn giao
```
s15-project2-pr-manager/
├── package.json
├── ui5.yaml
├── ui5-mock.yaml
├── .eslintrc.json
└── webapp/
    ├── Component.js
    ├── manifest.json
    ├── index.html
    ├── controller/
    │   ├── BaseController.js
    │   ├── App.controller.js
    │   ├── List.controller.js
    │   ├── Detail.controller.js
    │   ├── Create.controller.js
    │   └── NotFound.controller.js
    ├── view/
    │   ├── App.view.xml
    │   ├── List.view.xml
    │   ├── Detail.view.xml
    │   ├── Create.view.xml
    │   └── NotFound.view.xml
    ├── fragment/
    │   ├── SupplierValueHelp.fragment.xml
    │   ├── MessagePopover.fragment.xml
    │   ├── RejectDialog.fragment.xml
    │   └── ItemForm.fragment.xml
    ├── control/
    │   └── StatusIndicator.js
    ├── model/
    │   ├── formatter.js
    │   ├── models.js
    │   └── ODataHelper.js
    ├── css/style.css
    ├── i18n/
    │   ├── i18n.properties
    │   └── i18n_vi.properties
    └── localService/
        ├── metadata.xml
        ├── mockserver.js
        └── mockdata/*.json
```

## Rubric (100đ)
| Tiêu chí | Điểm |
|---|---|
| 8 user stories hoạt động | 30 |
| Deep insert + ETag + Message Popover đúng kỹ thuật | 20 |
| Kiến trúc code (BaseController, tách layer, không lặp) | 15 |
| Routing/FCL/deep link | 10 |
| i18n + UI consistency checklist pass | 10 |
| Error handling đầy đủ (batch response, 403, 412, 500) | 10 |
| ESLint pass, không console.log, có JSDoc | 5 |
