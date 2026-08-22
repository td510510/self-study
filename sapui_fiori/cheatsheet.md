# Phụ lục B — Cheatsheet tra cứu nhanh

---

## B.1. Bootstrap

```html
<script id="sap-ui-bootstrap"
    src="resources/sap-ui-core.js"
    data-sap-ui-theme="sap_horizon"
    data-sap-ui-libs="sap.m,sap.f,sap.ui.core"
    data-sap-ui-compat-version="edge"
    data-sap-ui-async="true"
    data-sap-ui-resource-roots='{"com.bd.app": "./"}'
    data-sap-ui-frame-options="trusted"
    data-sap-ui-on-init="module:sap/ui/core/ComponentSupport">
</script>
```

## B.2. URL parameters khi debug

```
?sap-ui-debug=true                    load source không minify
?sap-ui-language=en                   ép ngôn ngữ
?sap-ui-theme=sap_horizon_dark        đổi theme
?sap-ui-logLevel=DEBUG                bật log
?sap-statistics=true                  Gateway performance breakdown
?sap-client=100                       chọn client
?sap-ui-xx-componentPreload=off       tắt preload
Ctrl+Shift+Alt+S                      UI5 Technical Information dialog
Ctrl+Shift+Alt+P                      UI5 Support Assistant
```

## B.3. Binding syntax

```xml
<!-- Property -->
<Text text="{ProductName}"/>
<Text text="{/Products/0/Name}"/>
<Text text="{i18n>title}"/>
<Text text="{view>/count}"/>

<!-- Với settings -->
<Input value="{
    path: 'Price',
    type: 'sap.ui.model.type.Float',
    formatOptions: { minFractionDigits: 2 },
    constraints: { minimum: 0 },
    mode: 'TwoWay'
}"/>

<!-- Aggregation -->
<Table items="{
    path: '/ProductSet',
    parameters: { expand: 'ToSupplier', select: 'ProductID,Name,Price' },
    sorter: { path: 'Name', descending: false, group: false },
    filters: [{ path: 'Price', operator: 'GT', value1: 100 }],
    templateShareable: false
}">

<!-- Element -->
<VBox binding="{/ProductSet('HT-1000')}">

<!-- Expression -->
<Text text="{= ${Price} * ${Qty} }"/>
<Button visible="{= ${mode} === 'edit' &amp;&amp; ${auth} }"/>
<ObjectStatus state="{= ${Stock} > 0 ? 'Success' : 'Error' }"/>

<!-- Formatter -->
<Text text="{ path: 'Stock', formatter: '.formatter.stockState' }"/>
<Text text="{ parts: ['First','Last'], formatter: '.formatter.fullName' }"/>

<!-- Escape ký tự trong XML -->
&amp;&amp;   →  &&
&lt;         →  <
&gt;         →  >
&apos;       →  '
&quot;       →  "
```

## B.4. OData V2 API

```js
// Đọc
oModel.read(sPath, { urlParameters, filters, sorters, success, error });
oModel.metadataLoaded().then(fn);
oModel.createKey("/Set", { Key1: v1, Key2: v2 });
oModel.getProperty("/Set('k')/Field");

// Ghi
oModel.create(sPath, oPayload, { success, error, groupId, changeSetId });
oModel.update(sPath, oPayload, { success, error, merge: true });
oModel.remove(sPath, { success, error });
oModel.callFunction("/FuncName", { method: "POST", urlParameters, success, error });

// Batch
oModel.setDeferredGroups(["g1"]);
oModel.setChangeGroups({ "EntityName": { groupId: "g1", changeSetId: "cs1", single: false } });
oModel.submitChanges({ groupId: "g1", success, error });
oModel.resetChanges();
oModel.hasPendingChanges();
oModel.getPendingChanges();

// Khác
oModel.refresh(bForceUpdate, bRemoveData);
oModel.refreshSecurityToken(fnSuccess, fnError);
oModel.getSecurityToken();
oModel.setUseBatch(false);
```

## B.5. OData V4 API

```js
// List binding
const oBinding = oModel.bindList("/Products", null, aSorters, aFilters, {
    $count: true, $select: "ID,Name", $$groupId: "g1"
});
const aContexts = await oBinding.requestContexts(0, 20);

// Context binding
const oCtxBinding = oModel.bindContext("/Products(1)", null, { $expand: "Supplier" });
const oContext = oCtxBinding.getBoundContext();
const oData = await oContext.requestObject();
const sName = await oContext.requestProperty("Name");

// Create / delete
const oNewCtx = oListBinding.create({ Name: "X" });
await oNewCtx.created();
await oContext.delete("$auto");

// Submit
await oModel.submitBatch("updateGroup");
oModel.resetChanges("updateGroup");
oModel.hasPendingChanges("updateGroup");

// Action
const oAction = oModel.bindContext("namespace.ActionName(...)", oContext);
oAction.setParameter("Param", "value");
await oAction.execute();
```

## B.6. Filter & Sorter

```js
new Filter("Name", FilterOperator.Contains, "abc")
new Filter("Price", FilterOperator.BT, 100, 500)
new Filter({ filters: [f1, f2], and: false })          // OR
new Filter({ path: "Status", test: (v) => v !== "X" }) // client-side only

new Sorter("Name", /*descending*/ false, /*group*/ false)
new Sorter("Category", false, (oCtx) => ({
    key:  oCtx.getProperty("Category"),
    text: oCtx.getProperty("CategoryName")
}))

oBinding.filter(aFilters, FilterType.Application);
oBinding.sort([oSorter]);
oBinding.refresh(true);
oBinding.getLength();
oBinding.getCurrentContexts();
```

### FilterOperator
```
EQ NE GT GE LT LE BT NB
Contains StartsWith EndsWith
NotContains NotStartsWith NotEndsWith
Any All   (V4, cho collection)
```

## B.7. Controller snippets

```js
// Model
this.getView().getModel("name");
this.getOwnerComponent().getModel();
this.getView().setModel(oModel, "name");

// i18n
this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("key", [arg]);

// Router
sap.ui.core.UIComponent.getRouterFor(this).navTo("route", { id: "1" }, bReplace);
this.getOwnerComponent().getRouter().getRoute("name").attachPatternMatched(fn, this);
this.getOwnerComponent().getRouter().getTargets().display("notFound");

// Context
const oCtx = oEvent.getSource().getBindingContext();
oCtx.getPath(); oCtx.getObject(); oCtx.getProperty("Field");
this.getView().bindElement({ path, parameters, events });
this.getView().getElementBinding().refresh(true);

// Fragment (API mới)
this._pDialog = this.loadFragment({ name: "ns.fragment.MyDialog" });
(await this._pDialog).open();

// Message
MessageToast.show("text");
MessageBox.confirm("text", { onClose: fn });
MessageBox.error / warning / success / information / show

// Busy
this.getView().setBusy(true);
sap.ui.core.BusyIndicator.show(0);
```

## B.8. CSS class SAP

```
Margin:
  sapUiTinyMargin sapUiSmallMargin sapUiMediumMargin sapUiLargeMargin
  + Top | Bottom | Begin | End | TopBottom | BeginEnd
  sapUiResponsiveMargin  sapUiNoMargin

Padding:
  sapUiContentPadding  sapUiNoContentPadding  sapUiResponsiveContentPadding

Density:
  sapUiSizeCompact  sapUiSizeCozy

Misc:
  sapUiBody  sapUiForceWidthAuto  sapUiHideOnPhone  sapUiVisibleOnlyOnDesktop
```

## B.9. manifest.json — các khối quan trọng

```json
{
  "sap.app": {
    "id", "type", "title", "description", "applicationVersion",
    "dataSources": { "<name>": { "uri", "type", "settings": { "odataVersion", "localUri", "annotations" } } },
    "crossNavigation": { "inbounds": { "<SO>-<action>": { "semanticObject", "action", "signature" } } }
  },
  "sap.ui": { "technology", "deviceTypes", "icons" },
  "sap.ui5": {
    "rootView": { "viewName", "type", "id", "async" },
    "dependencies": { "minUI5Version", "libs" },
    "models": { "<name>": { "type" | "dataSource", "settings", "preload" } },
    "resources": { "css": [{ "uri": "css/style.css" }] },
    "routing": { "config", "routes", "targets" },
    "contentDensities": { "compact": true, "cozy": true },
    "componentUsages": { "<name>": { "name", "lazy" } },
    "extends": { "component", "extensions" },
    "flexEnabled": true
  },
  "sap.fiori": { "registrationIds", "archeType" },
  "sap.platform.cf": { "ui5VersionNumber" },
  "sap.platform.abap": { "uri" }
}
```

## B.10. Hungarian notation (chuẩn SAP)

| Prefix | Kiểu | Ví dụ |
|---|---|---|
| `s` | string | `sProductId` |
| `i` | int | `iCount` |
| `f` | float | `fPrice` |
| `b` | boolean | `bIsValid` |
| `o` | object | `oModel` |
| `a` | array | `aFilters` |
| `m` | map / object dùng như map | `mParameters` |
| `fn` | function | `fnCallback` |
| `d` | date | `dCreatedAt` |
| `r` | regexp | `rEmail` |
| `v` | variant (kiểu không cố định) | `vValue` |
| `p` | promise | `pDialog` |
| `_` | private | `_loadData` |

## B.11. Gateway t-codes

```
/IWFND/MAINT_SERVICE      đăng ký & kích hoạt service
/IWFND/GW_CLIENT          test OData không cần UI
/IWFND/ERROR_LOG          log lỗi hub
/IWBEP/ERROR_LOG          log lỗi backend
/IWFND/CACHE_CLEANUP      xóa cache metadata hub
/IWBEP/CACHE_CLEANUP      xóa cache metadata backend
/IWFND/TRACES             trace request
SEGW                      Gateway Service Builder
SICF                      kích hoạt ICF node
SU53                      kiểm tra authorization fail
STAUTHTRACE               trace authorization
ST22                      ABAP dump
SM59                      RFC destination
/UI2/FLPD_CUST            Launchpad Designer (customer scope)
/UI2/FLP                  mở Fiori Launchpad
/UI2/CACHE_DEL            xóa cache UI2
/UI2/INVALIDATE_CLIENT_CACHES   invalidate cache client
/UI5/UI5_REPOSITORY_LOAD  upload app lên ABAP repository
```

## B.12. CLI

```bash
# UI5 Tooling
ui5 init
ui5 serve --open index.html
ui5 serve --config ui5-mock.yaml
ui5 build --clean-dest
ui5 build self-contained --all
ui5 use SAPUI5@1.120.0
ui5 add sap.f sap.ui.table

# Fiori tools
npx fiori add deploy-config
npx fiori add flp-config
npx fiori add mockserver-config
npx fiori deploy --config ui5-deploy.yaml
npx fiori deploy --config ui5-deploy.yaml --testMode true
npx fiori undeploy --config ui5-deploy.yaml

# Generator
yo @sap/fiori

# MTA / CF
mbt build
cf login -a https://api.cf.<region>.hana.ondemand.com
cf target -o <org> -s <space>
cf deploy mta_archives/<file>.mtar
cf undeploy <mta-id> --delete-services
cf html5-list -di <destination-service> -u
cf logs <app> --recent

# Test
npm run lint
karma start
karma start --browsers Chrome --no-single-run
```

## B.13. Icon hay dùng

```
sap-icon://add            sap-icon://edit          sap-icon://delete
sap-icon://save           sap-icon://accept        sap-icon://decline
sap-icon://refresh        sap-icon://search        sap-icon://filter
sap-icon://sort           sap-icon://download      sap-icon://excel-attachment
sap-icon://message-popup  sap-icon://alert         sap-icon://information
sap-icon://nav-back       sap-icon://action        sap-icon://overflow
sap-icon://product        sap-icon://cart          sap-icon://supplier
sap-icon://employee       sap-icon://approvals     sap-icon://pending
sap-icon://full-screen    sap-icon://exit-full-screen
```
Tra đầy đủ: https://sapui5.hana.ondemand.com/#/test-resources/sap/m/demokit/iconExplorer/webapp/index.html

## B.14. ValueState & Criticality

```js
sap.ui.core.ValueState:  None | Error | Warning | Success | Information

// Criticality trong annotation (số):
0 = Neutral
1 = Negative (Error)
2 = Critical (Warning)
3 = Positive (Success)
5 = New / Information
```

## B.15. Các lỗi & fix nhanh

| Lỗi | Fix |
|---|---|
| `Cannot read property 'X' of undefined` trong `sap.ui.define` | Thứ tự dependency ≠ thứ tự tham số |
| `Duplicate ID` | Fragment tạo lại nhiều lần — cache promise |
| Bảng trắng, không lỗi | Binding path sai / model chưa set / model có tên |
| `403 CSRF token validation failed` | `earlyTokenRequest: true`, `refreshSecurityToken()` |
| `400 Property not filterable` | Kiểm tra `sap:filterable` trong `$metadata` |
| `412 Precondition Failed` | ETag cũ → refresh binding |
| `501 Not Implemented` | Backend chưa redefine method |
| Field mới không hiện | `/IWFND/CACHE_CLEANUP` + hard refresh |
| Save "thành công" nhưng không lưu | Kiểm tra `__batchResponses` |
| Dialog to bất thường | Quên `addStyleClass(getContentDensityClass())` |
| CORS error khi dev | `fiori-tools-proxy` trong `ui5.yaml` |
| App trắng sau deploy | Path tuyệt đối / cache buster / `sap.app.id` ≠ target mapping |
