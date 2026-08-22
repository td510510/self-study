# MODULE 4 — Fiori Elements, Launchpad, SAP BTP (Buổi 16 → 19)

> **JD coverage (Preferred):** "Experience with SAP BTP, Fiori Launchpad, BAS/Web IDE, or Fiori Elements"
> **JD (Must):** "Support application lifecycle activities from design and development through testing and deployment"

---

# BUỔI 16 — Fiori Elements: List Report & Object Page

## 16.1. Fiori Elements là gì và khi nào dùng

**Cơ chế:** app **không có view XML do bạn viết**. UI được sinh runtime từ **annotation** trong metadata.

```
CDS View / SEGW
   └── @UI annotations  (hoặc local annotation.xml)
        ↓
   $metadata
        ↓
   Fiori Elements template (sap.fe / sap.suite.ui.generic)
        ↓
   Giao diện hoàn chỉnh: filter bar, table, object page, draft, messages
```

### Khi nào dùng Fiori Elements vs Freestyle (câu hỏi kiến trúc rất hay được hỏi)

| Tiêu chí | Fiori Elements | Freestyle |
|---|---|---|
| UX theo floorplan chuẩn | ✅ | ✅ |
| UX đặc thù, khác chuẩn nhiều | ❌ | ✅ |
| Tốc độ phát triển | Rất nhanh | Chậm hơn |
| Bảo trì lâu dài | Dễ (ít code) | Tốn công hơn |
| Draft handling, message, variant | Có sẵn | Tự viết |
| Kiểm soát chi tiết | Hạn chế (qua extension) | Toàn quyền |
| Cần backend annotation tốt | **Bắt buộc** | Không |

**Trả lời phỏng vấn:**
> "I start with Fiori Elements when the requirement fits a standard floorplan — you get draft handling, variant management, message handling and accessibility for free, and long-term maintenance is far cheaper. I move to freestyle only when the UX genuinely deviates, or I use the Flexible Programming Model to embed custom sections into an Elements app instead of rewriting the whole thing."

## 16.2. Sinh app List Report bằng generator

```bash
yo @sap/fiori
```
```
? Which generator? → SAP Fiori application
? Template          → List Report Page
? Data source       → Connect to an OData Service
? OData service URL → https://sapes5.sapdevcenter.com/sap/opu/odata/IWBEP/GWSAMPLE_BASIC/
? Main entity       → ProductSet
? Navigation entity → ToSalesOrderLineItems
? Module name       → bd.productlr
? Application title → Product List Report
? Namespace         → com.bd
? Add deployment configuration → Yes (ABAP / Cloud Foundry)
? Add FLP configuration        → Yes
? Configure advanced options   → Yes → Enable TypeScript
```

Kết quả:
```
bd.productlr/
├── webapp/
│   ├── Component.js         ← extends sap/fe/core/AppComponent (KHÔNG có view!)
│   ├── manifest.json        ← toàn bộ "UI" nằm ở đây, phần "sap.ui5/routing/targets"
│   ├── annotations/
│   │   └── annotation.xml   ← local annotation
│   ├── ext/                 ← chỗ viết code extension
│   └── i18n/
└── ui5.yaml
```

**`Component.js` của Fiori Elements V4:**
```js
sap.ui.define(["sap/fe/core/AppComponent"], function (AppComponent) {
    "use strict";
    return AppComponent.extend("com.bd.productlr.Component", {
        metadata: { manifest: "json" }
    });
});
```
Chỉ có thế. **Toàn bộ UI do template sinh ra.**

## 16.3. `manifest.json` của Fiori Elements V4 — đây mới là "code"

```json
{
  "sap.ui5": {
    "dependencies": {
      "minUI5Version": "1.120.0",
      "libs": { "sap.fe.templates": {} }
    },
    "routing": {
      "routes": [
        {
          "pattern": ":?query:",
          "name": "ProductList",
          "target": "ProductList"
        },
        {
          "pattern": "ProductSet({key}):?query:",
          "name": "ProductObjectPage",
          "target": "ProductObjectPage"
        },
        {
          "pattern": "ProductSet({key})/ToSalesOrderLineItems({key2}):?query:",
          "name": "ItemObjectPage",
          "target": "ItemObjectPage"
        }
      ],
      "targets": {
        "ProductList": {
          "type": "Component",
          "id": "ProductList",
          "name": "sap.fe.templates.ListReport",
          "options": {
            "settings": {
              "contextPath": "/ProductSet",
              "variantManagement": "Page",
              "initialLoad": "Auto",
              "navigation": {
                "ProductSet": { "detail": { "route": "ProductObjectPage" } }
              },
              "controlConfiguration": {
                "@com.sap.vocabularies.UI.v1.LineItem": {
                  "tableSettings": {
                    "type": "ResponsiveTable",
                    "selectionMode": "Multi",
                    "personalization": { "column": true, "sort": true, "filter": true },
                    "condensedTableLayout": true,
                    "enableExport": true
                  }
                },
                "@com.sap.vocabularies.UI.v1.SelectionFields": {
                  "filterFields": {
                    "Price": { "settings": { "operatorConfiguration": [] } }
                  }
                }
              }
            }
          }
        },
        "ProductObjectPage": {
          "type": "Component",
          "id": "ProductObjectPage",
          "name": "sap.fe.templates.ObjectPage",
          "options": {
            "settings": {
              "contextPath": "/ProductSet",
              "editableHeaderContent": false,
              "sectionLayout": "Tabs",
              "content": {
                "header": { "actions": {} },
                "body": {
                  "sections": {
                    "customSection": {
                      "template": "com.bd.productlr.ext.fragment.CustomSection",
                      "title": "{i18n>customSectionTitle}",
                      "position": { "placement": "After", "anchor": "GeneralSection" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## 16.4. Chạy & preview
```bash
npm start          # dùng ui5.yaml, proxy tới ES5
npm run start-mock # mock server
```

## 16.5. Bài tập buổi 16
1. Sinh app List Report cho `ProductSet`, chạy được với ES5.
2. Bật export Excel, personalization, variant management.
3. So sánh: viết tay Project 1 mất bao lâu vs Fiori Elements mất bao lâu → viết 1 đoạn nhận xét EN.

---

# BUỔI 17 — Annotations & Flexible Programming Model

## 17.1. Annotation vocabulary — bảng phải thuộc

| Annotation | Sinh ra gì |
|---|---|
| `UI.LineItem` | **Cột của bảng** trong List Report |
| `UI.SelectionFields` | **Trường trong Filter Bar** |
| `UI.HeaderInfo` | Tiêu đề Object Page (title, description, typeName, imageUrl) |
| `UI.Facets` | **Section/tab** của Object Page |
| `UI.FieldGroup` | Nhóm field trong 1 form |
| `UI.Identification` | Action ở header Object Page |
| `UI.DataPoint` | KPI, progress, rating |
| `UI.Chart` | Biểu đồ (ALP) |
| `UI.PresentationVariant` | Sort/group mặc định |
| `UI.SelectionVariant` | Filter mặc định |
| `UI.Criticality` | Màu semantic (0=None,1=Error,2=Warning,3=Success) |
| `Common.Label` | Nhãn field |
| `Common.Text` | Text mô tả cho 1 key |
| `Common.ValueList` | **Value help (F4)** |
| `Common.FieldControl` | Mandatory / ReadOnly / Hidden động |
| `Capabilities.*` | Cho phép insert/update/delete/filter/sort |
| `Core.Computed` | Field do backend tính |

## 17.2. Local annotation file (khi không sửa được backend)

**`webapp/annotations/annotation.xml`**
```xml
<edmx:Edmx Version="4.0"
    xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx"
    xmlns:Edm="http://docs.oasis-open.org/odata/ns/edm">
  <edmx:Reference Uri="/sap/opu/odata/IWBEP/GWSAMPLE_BASIC/$metadata">
    <edmx:Include Namespace="GWSAMPLE_BASIC" Alias="SAP"/>
  </edmx:Reference>
  <edmx:Reference Uri="https://sap.github.io/odata-vocabularies/vocabularies/UI.xml">
    <edmx:Include Namespace="com.sap.vocabularies.UI.v1" Alias="UI"/>
  </edmx:Reference>
  <edmx:Reference Uri="https://sap.github.io/odata-vocabularies/vocabularies/Common.xml">
    <edmx:Include Namespace="com.sap.vocabularies.Common.v1" Alias="Common"/>
  </edmx:Reference>

  <edmx:DataServices>
    <Schema Namespace="local" xmlns="http://docs.oasis-open.org/odata/ns/edm">

      <Annotations Target="SAP.Product">

        <!-- ========== HEADER OF OBJECT PAGE ========== -->
        <Annotation Term="UI.HeaderInfo">
          <Record Type="UI.HeaderInfoType">
            <PropertyValue Property="TypeName" String="Product"/>
            <PropertyValue Property="TypeNamePlural" String="Products"/>
            <PropertyValue Property="Title">
              <Record Type="UI.DataField">
                <PropertyValue Property="Value" Path="Name"/>
              </Record>
            </PropertyValue>
            <PropertyValue Property="Description">
              <Record Type="UI.DataField">
                <PropertyValue Property="Value" Path="ProductID"/>
              </Record>
            </PropertyValue>
          </Record>
        </Annotation>

        <!-- ========== TABLE COLUMNS ========== -->
        <Annotation Term="UI.LineItem">
          <Collection>
            <Record Type="UI.DataField">
              <PropertyValue Property="Value" Path="ProductID"/>
              <PropertyValue Property="Label" String="Product ID"/>
              <Annotation Term="UI.Importance" EnumMember="UI.ImportanceType/High"/>
            </Record>
            <Record Type="UI.DataField">
              <PropertyValue Property="Value" Path="Name"/>
              <Annotation Term="UI.Importance" EnumMember="UI.ImportanceType/High"/>
            </Record>
            <Record Type="UI.DataField">
              <PropertyValue Property="Value" Path="Price"/>
              <PropertyValue Property="Criticality" Path="PriceCriticality"/>
            </Record>
            <!-- Cột hiển thị navigation property -->
            <Record Type="UI.DataField">
              <PropertyValue Property="Value" Path="ToSupplier/CompanyName"/>
              <PropertyValue Property="Label" String="Supplier"/>
              <Annotation Term="UI.Importance" EnumMember="UI.ImportanceType/Medium"/>
            </Record>
            <!-- Nút action trên từng dòng -->
            <Record Type="UI.DataFieldForAction">
              <PropertyValue Property="Label" String="Reorder"/>
              <PropertyValue Property="Action" String="GWSAMPLE_BASIC.ReorderProduct"/>
            </Record>
          </Collection>
        </Annotation>

        <!-- ========== FILTER BAR ========== -->
        <Annotation Term="UI.SelectionFields">
          <Collection>
            <PropertyPath>ProductID</PropertyPath>
            <PropertyPath>CategoryName</PropertyPath>
            <PropertyPath>SupplierName</PropertyPath>
          </Collection>
        </Annotation>

        <!-- ========== OBJECT PAGE SECTIONS ========== -->
        <Annotation Term="UI.Facets">
          <Collection>
            <Record Type="UI.ReferenceFacet">
              <PropertyValue Property="ID" String="GeneralSection"/>
              <PropertyValue Property="Label" String="General Information"/>
              <PropertyValue Property="Target" AnnotationPath="@UI.FieldGroup#General"/>
            </Record>
            <Record Type="UI.ReferenceFacet">
              <PropertyValue Property="ID" String="ItemsSection"/>
              <PropertyValue Property="Label" String="Sales Order Items"/>
              <PropertyValue Property="Target"
                             AnnotationPath="ToSalesOrderLineItems/@UI.LineItem"/>
            </Record>
          </Collection>
        </Annotation>

        <Annotation Term="UI.FieldGroup" Qualifier="General">
          <Record Type="UI.FieldGroupType">
            <PropertyValue Property="Data">
              <Collection>
                <Record Type="UI.DataField"><PropertyValue Property="Value" Path="ProductID"/></Record>
                <Record Type="UI.DataField"><PropertyValue Property="Value" Path="Name"/></Record>
                <Record Type="UI.DataField"><PropertyValue Property="Value" Path="Price"/></Record>
                <Record Type="UI.DataField"><PropertyValue Property="Value" Path="Width"/></Record>
                <Record Type="UI.DataField"><PropertyValue Property="Value" Path="Depth"/></Record>
              </Collection>
            </PropertyValue>
          </Record>
        </Annotation>

      </Annotations>

      <!-- ========== VALUE HELP (F4) ========== -->
      <Annotations Target="SAP.Product/CategoryName">
        <Annotation Term="Common.ValueList">
          <Record Type="Common.ValueListType">
            <PropertyValue Property="CollectionPath" String="VH_CategorySet"/>
            <PropertyValue Property="Parameters">
              <Collection>
                <Record Type="Common.ValueListParameterInOut">
                  <PropertyValue Property="LocalDataProperty" PropertyPath="CategoryName"/>
                  <PropertyValue Property="ValueListProperty" String="Category"/>
                </Record>
              </Collection>
            </PropertyValue>
          </Record>
        </Annotation>
      </Annotations>

    </Schema>
  </edmx:DataServices>
</edmx:Edmx>
```

> **VS Code có Annotation Editor đồ họa** (SAP Fiori tools) — không phải gõ tay XML này. Nhưng **phải đọc hiểu được** khi debug.

## 17.3. Annotation trong CDS (khuyến nghị — do ABAPer làm)

```abap
@Metadata.layer: #CORE
@UI: {
  headerInfo: {
    typeName: 'Product', typeNamePlural: 'Products',
    title: { value: 'ProductName' }, description: { value: 'ProductID' }
  }
}
annotate view ZI_Product with
{
  @UI.facet: [
    { id: 'General', purpose: #STANDARD, type: #IDENTIFICATION_REFERENCE,
      label: 'General Information', position: 10 },
    { id: 'Items',   purpose: #STANDARD, type: #LINEITEM_REFERENCE,
      label: 'Items', position: 20, targetElement: '_Items' }
  ]

  @UI.lineItem:      [{ position: 10, importance: #HIGH }]
  @UI.selectionField:[{ position: 10 }]
  @UI.identification:[{ position: 10 }]
  ProductID;

  @UI.lineItem:      [{ position: 20, importance: #HIGH }]
  @UI.identification:[{ position: 20 }]
  ProductName;

  @UI.lineItem:      [{ position: 30, criticality: 'PriceCriticality' }]
  @Semantics.amount.currencyCode: 'CurrencyCode'
  Price;

  @Consumption.valueHelpDefinition: [{ entity: { name: 'ZI_CategoryVH', element: 'Category' } }]
  CategoryName;
}
```

## 17.4. Flexible Programming Model (FPM) — mở rộng Fiori Elements

Đây là điểm phân biệt developer senior: **biết cách thêm code tùy chỉnh vào Fiori Elements mà không phá cấu trúc.**

### A. Custom Section trong Object Page

**`webapp/ext/fragment/CustomSection.fragment.xml`**
```xml
<core:FragmentDefinition
    xmlns="sap.m"
    xmlns:core="sap.ui.core"
    xmlns:macros="sap.fe.macros">

    <VBox class="sapUiSmallMargin">
        <MessageStrip text="{i18n>customSectionHint}" type="Information" class="sapUiSmallMarginBottom"/>

        <!-- macros:Table dùng lại control chuẩn của Fiori Elements -->
        <macros:Table
            id="relatedOrdersTable"
            metaPath="ToSalesOrderLineItems/@com.sap.vocabularies.UI.v1.LineItem"
            readOnly="true"/>

        <Button text="{i18n>runCustomCheck}" press="cmd:RunCheck" class="sapUiSmallMarginTop"/>
    </VBox>
</core:FragmentDefinition>
```

### B. Controller Extension cho Fiori Elements

**`webapp/ext/controller/ObjectPageExt.js`**
```js
sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (ControllerExtension, MessageBox, MessageToast) {
    "use strict";

    return ControllerExtension.extend("com.bd.productlr.ext.controller.ObjectPageExt", {

        // Override các hook của sap.fe
        override: {

            /** Chạy khi Object Page khởi tạo */
            onInit: function () {
                const oView = this.base.getView();
                console.log("Custom onInit for", oView.getId());
            },

            /** Chặn trước khi save — thêm validation nghiệp vụ riêng */
            editFlow: {
                onBeforeSave: function (mParameters) {
                    const oContext = mParameters.context;
                    const fPrice   = oContext.getProperty("Price");
                    if (parseFloat(fPrice) > 100000) {
                        return Promise.reject(
                            "Price above 100,000 requires manager approval."
                        );
                    }
                    return Promise.resolve();
                },

                onAfterSave: function () {
                    MessageToast.show("Saved successfully");
                }
            },

            /** Điều chỉnh navigation */
            routing: {
                onBeforeNavigation: function (mParameters) {
                    return Promise.resolve(false);   // false = cho phép nav tiếp tục
                }
            }
        },

        /** Handler cho custom action khai báo trong manifest */
        onRunCustomCheck: function (oEvent) {
            const oContext = this.base.getView().getBindingContext();
            MessageBox.information(
                "Running check for " + oContext.getProperty("ProductID")
            );
        }
    });
});
```

**Đăng ký trong `manifest.json`:**
```json
"extends": {
  "extensions": {
    "sap.ui.controllerExtensions": {
      "sap.fe.templates.ObjectPage.ObjectPageController": {
        "controllerName": "com.bd.productlr.ext.controller.ObjectPageExt"
      }
    }
  }
}
```

### C. Custom Action button
```json
"content": {
  "header": {
    "actions": {
      "customApproveAction": {
        "press": "com.bd.productlr.ext.controller.ObjectPageExt.onRunCustomCheck",
        "visible": "{= ${Status} === 'DRAFT' }",
        "enabled": true,
        "text": "{i18n>approve}",
        "position": { "placement": "After", "anchor": "DataFieldForAction::Edit" }
      }
    }
  }
}
```

### D. Custom Column trong bảng
```json
"controlConfiguration": {
  "@com.sap.vocabularies.UI.v1.LineItem": {
    "columns": {
      "customStatusColumn": {
        "header": "{i18n>stockStatus}",
        "width": "8rem",
        "position": { "placement": "After", "anchor": "DataField::Price" },
        "template": "com.bd.productlr.ext.fragment.StatusColumn",
        "properties": ["UnitsInStock"]
      }
    }
  }
}
```

## 17.5. Bài tập buổi 17
1. Thêm annotation cho `UI.DataPoint` hiển thị Price với criticality màu.
2. Thêm 1 custom section + 1 custom action vào Object Page.
3. Implement `onBeforeSave` validation, test chặn được save.

---

# BUỔI 18 — Fiori Launchpad & Deploy lên ABAP

## 18.1. Kiến trúc Launchpad

```
User đăng nhập FLP
    │
    ▼
Role (PFCG)  →  Catalog  →  Tile  →  Target Mapping
                                          │  Semantic Object + Action
                                          ▼
                                    Intent: #Product-display
                                          │
                                          ▼
                                    App (UI5 repo / BSP)
```

**4 khái niệm cốt lõi:**
| Khái niệm | Nghĩa |
|---|---|
| **Semantic Object** | Đối tượng nghiệp vụ, vd `Product`, `SalesOrder`, `PurchaseRequisition` |
| **Action** | Hành động: `display`, `create`, `manage`, `approve` |
| **Intent** | `#SemanticObject-action` → `#Product-manage` |
| **Target Mapping** | Ánh xạ intent → app cụ thể (UI5 component / URL / transaction) |

**Vì sao dùng intent thay vì URL?** Vì có thể navigate giữa các app mà không biết URL: một app gọi `#Product-display?ProductID=HT-1000`, FLP tự tìm app xử lý intent đó.

## 18.2. Cấu hình FLP trong `manifest.json`

```json
"sap.app": {
  "id": "com.bd.productmgr",
  "type": "application",
  "title": "{{appTitle}}",
  "description": "{{appDescription}}",
  "applicationVersion": { "version": "1.0.0" },
  "crossNavigation": {
    "inbounds": {
      "Product-manage": {
        "semanticObject": "Product",
        "action": "manage",
        "title": "{{flpTitle}}",
        "subTitle": "{{flpSubtitle}}",
        "icon": "sap-icon://product",
        "signature": {
          "parameters": {
            "ProductID": { "required": false }
          },
          "additionalParameters": "allowed"
        }
      }
    },
    "outbounds": {
      "toSupplier": {
        "semanticObject": "BusinessPartner",
        "action": "display",
        "parameters": { "BusinessPartnerID": { "value": { "value": "SupplierID", "format": "binding" } } }
      }
    }
  }
}
```

## 18.3. Cross-app navigation trong code

```js
sap.ui.define([
    "./BaseController",
    "sap/ui/core/Component"
], function (BaseController, Component) {
    "use strict";

    return BaseController.extend("com.bd.app.controller.Detail", {

        /** Điều hướng sang app khác qua intent */
        onNavigateToSupplier: async function () {
            const sSupplierId = this.getView().getBindingContext().getProperty("SupplierID");

            // API mới (1.120+): CrossApplicationNavigation service
            const oCrossAppNav = await Component.getOwnerComponentFor(this.getView())
                .getService("crossApplicationNavigation");

            oCrossAppNav.toExternal({
                target: { semanticObject: "BusinessPartner", action: "display" },
                params: { BusinessPartnerID: sSupplierId }
            });
        },

        /** Lấy tham số truyền vào app từ FLP */
        _getStartupParameters: function () {
            const oComponentData = this.getOwnerComponent().getComponentData();
            const oParams = oComponentData?.startupParameters || {};
            // startupParameters luôn là mảng: { ProductID: ["HT-1000"] }
            return oParams.ProductID ? oParams.ProductID[0] : null;
        },

        /** Kiểm tra app đích có tồn tại không trước khi hiện nút */
        _checkIntentSupported: async function () {
            const oCrossAppNav = await this.getOwnerComponent()
                .getService("crossApplicationNavigation");
            const aSupported = await oCrossAppNav.isNavigationSupported([
                { target: { semanticObject: "BusinessPartner", action: "display" } }
            ]);
            this.getModel("view").setProperty("/showSupplierLink", aSupported[0].supported);
        }
    });
});
```

## 18.4. Test app trong FLP sandbox (local)

**`webapp/test/flpSandbox.html`**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>FLP Sandbox — BD Product Manager</title>
    <script type="text/javascript">
        window["sap-ushell-config"] = {
            defaultRenderer: "fiori2",
            applications: {
                "Product-manage": {
                    title: "Manage Products",
                    description: "BD IT Product master data",
                    additionalInformation: "SAPUI5.Component=com.bd.productmgr",
                    applicationType: "URL",
                    url: "../",
                    navigationMode: "embedded"
                }
            }
        };
    </script>
    <script src="https://sapui5.hana.ondemand.com/test-resources/sap/ushell/bootstrap/sandbox.js"></script>
    <script id="sap-ui-bootstrap"
        src="https://sapui5.hana.ondemand.com/resources/sap-ui-core.js"
        data-sap-ui-libs="sap.m,sap.ushell,sap.collaboration,sap.ui.comp,sap.uxap"
        data-sap-ui-compat-version="edge"
        data-sap-ui-theme="sap_horizon"
        data-sap-ui-frame-options="allow"
        data-sap-ui-async="true"
        data-sap-ui-bindingSyntax="complex">
    </script>
    <script>
        sap.ui.getCore().attachInit(function () {
            sap.ushell.Container.createRenderer().placeAt("content");
        });
    </script>
</head>
<body class="sapUiBody" id="content"></body>
</html>
```
```bash
ui5 serve --open test/flpSandbox.html
```
> **Luôn test trong FLP sandbox trước khi deploy** — nhiều bug chỉ xuất hiện khi app chạy trong shell (ví dụ: header trùng, back navigation sai, content density).

## 18.5. Deploy lên ABAP (on-premise)

**`ui5-deploy.yaml`**
```yaml
specVersion: "3.0"
metadata:
  name: com.bd.productmgr
type: application
builder:
  resources:
    excludes:
      - "/test/**"
      - "/localService/**"
  customTasks:
    - name: deploy-to-abap
      afterTask: generateCachebusterInfo
      configuration:
        target:
          url: https://sapes5.sapdevcenter.com
          client: "100"
          # hoặc dùng destination nếu qua Cloud Connector:
          # destination: MY_ABAP_SYSTEM
        app:
          name: ZBD_PRODUCTMGR             # tên BSP application (bắt đầu bằng Z/Y)
          package: ZBD_FIORI                # ABAP package
          transport: DEVK900123             # transport request
          description: BD Product Manager
        exclude:
          - /test/
```

```bash
npm install --save-dev @sap/ux-ui5-tooling
npx fiori deploy --config ui5-deploy.yaml
# hoặc
npx fiori deploy --config ui5-deploy.yaml --testMode true   # dry run
```

**Sau khi deploy, cấu hình trên hệ thống SAP:**
```
1. /UI2/FLPD_CUST (hoặc FLP Content Manager trên S/4 mới)
2. Tạo Catalog:  ZBD_CAT_PRODUCT
3. Tạo Tile (Static/Dynamic):
      Title: Manage Products
      Icon:  sap-icon://product
      Semantic Object: Product / Action: manage
4. Tạo Target Mapping trong cùng catalog:
      Semantic Object: Product
      Action: manage
      Application Type: SAPUI5 Fiori App
      URL: /sap/bc/ui5_ui5/sap/zbd_productmgr
      ID: com.bd.productmgr
5. Tạo Group: ZBD_GRP_PRODUCT, gán tile vào group
6. PFCG: tạo role ZBD_PRODUCT_USER, gán catalog + group, gán user
7. /UI2/CACHE_DEL + /UI2/INVALIDATE_CLIENT_CACHES  ← quan trọng, hay quên
8. Test: /sap/bc/ui2/flp
```

**Troubleshooting FLP thường gặp:**
| Vấn đề | Nguyên nhân | Fix |
|---|---|---|
| Tile không hiện | User chưa có role, hoặc chưa clear cache | PFCG + `/UI2/INVALIDATE_CLIENT_CACHES` |
| Click tile → "App could not be opened" | Target mapping sai URL/ID | Kiểm tra `/sap/bc/ui5_ui5/sap/<bsp>` tồn tại |
| App load nhưng trắng | `sap.app/id` không khớp Target Mapping ID | Đồng bộ 2 chỗ |
| Version cũ vẫn hiện | Cache buster | `/UI2/CACHE_DEL`, hard refresh, kiểm tra `~cachebuster` |
| Lỗi 403 khi gọi OData | Service chưa gán vào role | PFCG → S_SERVICE |

## 18.6. Bài tập buổi 18
1. Cấu hình FLP sandbox cho Project 2, test navigation.
2. Thêm cross-app navigation từ Product → BusinessPartner.
3. Viết checklist deploy ABAP 8 bước từ trí nhớ.

---

# BUỔI 19 — SAP BTP: Cloud Foundry, MTA, Destination, CI/CD

## 19.1. Kiến trúc app Fiori trên BTP Cloud Foundry

```
Browser
   │  https://<subdomain>.launchpad.cfapps.<region>.hana.ondemand.com
   ▼
[SAP Build Work Zone / Launchpad Service]     ← FLP trên cloud
   │
   ▼
[App Router]  ← xác thực (XSUAA), routing, forward token
   │
   ├── HTML5 Application Repository  ← chứa file tĩnh của app UI5
   │
   └── Destination Service ──► Cloud Connector ──► SAP on-premise (Gateway)
                          └──► SAP S/4HANA Cloud (public endpoint)
```

## 19.2. Cấu trúc MTA project

```
bd-product-mgr/
├── mta.yaml                      ← multi-target application descriptor
├── package.json
├── xs-security.json
├── app/                           (hoặc ở root)
│   └── productmgr/               ← UI5 app
│       ├── ui5.yaml
│       ├── xs-app.json           ← routing rule của app HTML5
│       └── webapp/
└── approuter/                    (nếu dùng standalone approuter)
    ├── package.json
    └── xs-app.json
```

**`mta.yaml`**
```yaml
_schema-version: "3.2"
ID: bd-product-mgr
version: 1.0.0
description: BD Product Manager Fiori application

parameters:
  enable-parallel-deployments: true

build-parameters:
  before-all:
    - builder: custom
      commands:
        - npm install
        - npx ui5 build --config=ui5.yaml --clean-dest --dest dist

modules:
  # ---------- 1. UI5 app deployer ----------
  - name: bd-product-mgr-app-content
    type: com.sap.application.content
    path: .
    requires:
      - name: bd-product-mgr-html5-repo-host
        parameters:
          content-target: true
    build-parameters:
      build-result: resources
      requires:
        - artifacts:
            - productmgr.zip
          name: productmgr
          target-path: resources/

  - name: productmgr
    type: html5
    path: app/productmgr
    build-parameters:
      build-result: dist
      builder: custom
      commands:
        - npm install
        - npm run build:cf
      supported-platforms: []

  # ---------- 2. FLP content (Work Zone) ----------
  - name: bd-product-mgr-destination-content
    type: com.sap.application.content
    requires:
      - name: bd-product-mgr-destination-service
        parameters:
          content-target: true
      - name: bd-product-mgr-html5-repo-host
        parameters:
          service-key:
            name: bd-product-mgr-html5-repo-host-key
      - name: bd-product-mgr-uaa
        parameters:
          service-key:
            name: bd-product-mgr-uaa-key
    parameters:
      content:
        instance:
          destinations:
            - Name: bd_product_mgr_html_repo_host
              ServiceInstanceName: bd-product-mgr-html5-service
              ServiceKeyName: bd-product-mgr-html5-repo-host-key
              sap.cloud.service: bd.productmgr
            - Authentication: OAuth2UserTokenExchange
              Name: bd_product_mgr_uaa
              ServiceInstanceName: bd-product-mgr-xsuaa-service
              ServiceKeyName: bd-product-mgr-uaa-key
              sap.cloud.service: bd.productmgr
          existing_destinations_policy: update
    build-parameters:
      no-source: true

resources:
  - name: bd-product-mgr-html5-repo-host
    type: org.cloudfoundry.managed-service
    parameters:
      service: html5-apps-repo
      service-name: bd-product-mgr-html5-service
      service-plan: app-host

  - name: bd-product-mgr-uaa
    type: org.cloudfoundry.managed-service
    parameters:
      service: xsuaa
      service-plan: application
      service-name: bd-product-mgr-xsuaa-service
      path: ./xs-security.json
      config:
        xsappname: bd-product-mgr-${org}-${space}
        tenant-mode: dedicated

  - name: bd-product-mgr-destination-service
    type: org.cloudfoundry.managed-service
    parameters:
      service: destination
      service-plan: lite
      service-name: bd-product-mgr-destination-service
      config:
        HTML5Runtime_enabled: true
        version: 1.0.0
        init_data:
          instance:
            existing_destinations_policy: update
            destinations:
              - Name: ui5
                Description: SAPUI5 CDN
                Authentication: NoAuthentication
                ProxyType: Internet
                Type: HTTP
                URL: https://ui5.sap.com
```

**`app/productmgr/xs-app.json`** — routing rule (rất quan trọng, hay sai)
```json
{
  "welcomeFile": "/index.html",
  "authenticationMethod": "route",
  "routes": [
    {
      "source": "^/sap/opu/odata/(.*)$",
      "target": "/sap/opu/odata/$1",
      "destination": "ES5",
      "authenticationType": "xsuaa",
      "csrfProtection": true
    },
    {
      "source": "^/resources/(.*)$",
      "target": "/resources/$1",
      "destination": "ui5",
      "authenticationType": "none"
    },
    {
      "source": "^/test-resources/(.*)$",
      "target": "/test-resources/$1",
      "destination": "ui5",
      "authenticationType": "none"
    },
    {
      "source": "^(.*)$",
      "target": "$1",
      "service": "html5-apps-repo-rt",
      "authenticationType": "xsuaa"
    }
  ]
}
```

**`xs-security.json`**
```json
{
  "xsappname": "bd-product-mgr",
  "tenant-mode": "dedicated",
  "scopes": [
    { "name": "$XSAPPNAME.Display", "description": "Display products" },
    { "name": "$XSAPPNAME.Maintain", "description": "Create and change products" }
  ],
  "role-templates": [
    {
      "name": "ProductViewer",
      "description": "Can view products",
      "scope-references": ["$XSAPPNAME.Display"]
    },
    {
      "name": "ProductMaintainer",
      "description": "Can maintain products",
      "scope-references": ["$XSAPPNAME.Display", "$XSAPPNAME.Maintain"]
    }
  ],
  "role-collections": [
    {
      "name": "BD_Product_Maintainer",
      "description": "BD IT product maintainer",
      "role-template-references": ["$XSAPPNAME.ProductMaintainer"]
    }
  ]
}
```

## 19.3. Destination — cầu nối tới SAP backend

**BTP Cockpit → Connectivity → Destinations → New Destination**

| Property | Value | Ghi chú |
|---|---|---|
| Name | `ES5` | tên dùng trong `xs-app.json` |
| Type | `HTTP` | |
| URL | `https://sapes5.sapdevcenter.com` | không có path service |
| Proxy Type | `Internet` (cloud) / `OnPremise` (qua Cloud Connector) | |
| Authentication | `BasicAuthentication` / `PrincipalPropagation` / `OAuth2SAMLBearerAssertion` | |
| **Additional properties** | | **thường bị quên → app không chạy** |
| `WebIDEEnabled` | `true` | cho BAS thấy destination |
| `WebIDEUsage` | `odata_abap,dev_abap,ui5_execute_abap` | |
| `WebIDESystem` | `ES5` | |
| `HTML5.DynamicDestination` | `true` | **bắt buộc** cho approuter dùng |
| `sap-client` | `100` | |
| `HTML5.Timeout` | `60000` | tránh timeout với request chậm |

**Authentication types — chọn thế nào:**
| Type | Dùng khi |
|---|---|
| `NoAuthentication` | endpoint public (CDN) |
| `BasicAuthentication` | dev/test, user kỹ thuật (❌ không dùng production) |
| `PrincipalPropagation` | On-premise qua Cloud Connector — user thật được propagate ✅ |
| `OAuth2SAMLBearerAssertion` | S/4HANA Cloud, user thật ✅ |
| `OAuth2ClientCredentials` | service-to-service |

## 19.4. Build & Deploy

```bash
# Build MTA archive
mbt build              # → mta_archives/bd-product-mgr_1.0.0.mtar

# Login
cf login -a https://api.cf.us10.hana.ondemand.com
cf target -o <org> -s <space>

# Deploy
cf deploy mta_archives/bd-product-mgr_1.0.0.mtar

# Kiểm tra
cf html5-list -di bd-product-mgr-destination-service -u
cf apps
cf logs bd-product-mgr-approuter --recent

# Undeploy sạch (kể cả service)
cf undeploy bd-product-mgr --delete-services --delete-service-keys
```

**Sau deploy — gán role:**
```
BTP Cockpit → Security → Role Collections
  → BD_Product_Maintainer → Edit → Users → thêm email → Save
```

**Đưa app lên launchpad:**
```
BTP Cockpit → SAP Build Work Zone → Site Manager
  → Content Manager → tìm app "Manage Products" (từ HTML5 repo)
  → tạo Group + Role → gán vào Site → Publish
```

## 19.5. CI/CD với GitHub Actions

**`.github/workflows/deploy.yml`**
```yaml
name: Build and Deploy to BTP

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Lint
        run: npm run lint
      - name: Unit tests
        run: npm run test:unit
      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  deploy:
    needs: quality
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - name: Install MBT and CF CLI
        run: |
          npm install -g mbt
          wget -q -O - https://packages.cloudfoundry.org/debian/cli.cloudfoundry.org.key | sudo apt-key add -
          echo "deb https://packages.cloudfoundry.org/debian stable main" | sudo tee /etc/apt/sources.list.d/cloudfoundry-cli.list
          sudo apt-get update && sudo apt-get install cf8-cli
          cf install-plugin multiapps -f
      - name: Build MTA
        run: mbt build
      - name: Deploy
        env:
          CF_API:      ${{ secrets.CF_API }}
          CF_USER:     ${{ secrets.CF_USER }}
          CF_PASSWORD: ${{ secrets.CF_PASSWORD }}
          CF_ORG:      ${{ secrets.CF_ORG }}
          CF_SPACE:    ${{ secrets.CF_SPACE }}
        run: |
          cf api "$CF_API"
          cf auth "$CF_USER" "$CF_PASSWORD"
          cf target -o "$CF_ORG" -s "$CF_SPACE"
          cf deploy mta_archives/*.mtar -f
```

> SAP còn có **SAP Continuous Integration and Delivery service** trên BTP với pipeline dựng sẵn cho Fiori — nêu ra khi phỏng vấn sẽ ghi điểm.

## 19.6. Bài tập buổi 19
1. Đăng ký BTP Trial, tạo destination tới ES5, verify bằng "Check Connection".
2. Chuyển Project 2 thành MTA và deploy lên CF thành công.
3. Đưa app lên Work Zone site, gán role, mở bằng user khác.
4. Viết pipeline GitHub Actions chạy lint + test.
