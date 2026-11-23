# 06 — Data Model

## 1. Document Control

| Field | Value |
|---|---|
| Document | Data Model — Pharma Aggregator Marketplace |
| System | `pharma-aggregator-server` (Spring Boot / JPA / PostgreSQL) + `pharma-aggregator-client` (Next.js consumer) |
| Scope | All JPA entities discovered under `D:/Tiameds_MarketPlace/Backend/pharma-aggregator-server/src/main/java/com/example/pharmaaggregatorserver/entity/**` |
| Database engine | PostgreSQL (confirmed: `org.postgresql.Driver`, `PostgreSQLDialect` in `application-dev.yml`, `application-prod.yml`, `application-test.yml`) |
| Status labeling convention | **IMPLEMENTED** = verified in source. **PARTIALLY IMPLEMENTED** = exists but incomplete/inconsistent. **NOT IDENTIFIED** = searched for, not found (search described). **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED** = a suggestion, never fact. |
| Author / method | Compiled from direct reads of entity/repository/migration/seed files (paths cited throughout) plus a prior multi-pass code-discovery inventory of the same repository, itself grounded in file reads (each claim below cites its source file) |
| Last updated | 2026-08-31 |

**What this document is not**: it does not cover the `entity/product/` cosmetic/consumable/non-consumable full attribute field lists exhaustively (dozens of near-identical lookup tables are summarized in compact form per the requested structure), and it does not assert anything about a schema dump — all column facts come from JPA annotations in the entity source, not from an inspected live database or DDL export.

---

## 2. Entity List & Definitions

Grouped by module. "Table" is the JPA `@Table(name=...)` value where confirmed by direct entity inspection (this session or the grounding inventory); "—" means the exact `@Table` name was not independently re-verified by this pass and is carried from the discovery inventory's own file reads.

### 2.1 Master / Reference Data

| Entity | Table | Purpose | Module |
|---|---|---|---|
| StateMaster | `tbl_state_master` | Top of geographic hierarchy (Indian states) | master |
| DistrictMaster | `tbl_district_master` | Districts, FK to state | master |
| TalukaMaster | `tbl_taluka_master` | Talukas, FK to both state and district (denormalized) | master |
| CompanyTypeMaster | `tbl_company_type_master` | Seller company type lookup | master |
| SellerTypeMaster | `tbl_seller_type_master` | Manufacturer/Distributor/PCD/White-Labeling lookup | master |
| BuyerTypeMaster | `tbl_buyer_type_master` | Hospital/Clinic/Pharmacy/etc. lookup, FK to mandatory document type | master |
| ProductTypeMaster | `tbl_product_type_master` | Product regulatory category lookup + 1 inactive placeholder row | master |
| DocumentTypeMaster | `tbl_document_type_master` | Document type lookup (licenses, agreements, certs) | master |
| RoleMaster | `tbl_role_master` | Application role lookup (SELLER/BUYER/ADMIN); no controller exposes it | master |

### 2.2 Auth Infrastructure (Seller/Admin side)

| Entity | Table | Purpose | Module |
|---|---|---|---|
| User | `tbl_user` | Seller/admin login account | auth |
| LoginOtp | `tbl_login_otp` | Seller login OTP (2-step login) | auth |
| RefreshToken | `tbl_refresh_tokens` | Hashed refresh token for seller/admin | auth |

### 2.3 Buyer Auth Infrastructure

| Entity | Table | Purpose | Module |
|---|---|---|---|
| BuyerUser | `tbl_buyer_user` | Buyer login account (independent of seller `tbl_user`) | buyer |
| BuyerSignupOtp | `tbl_buyer_signup_otp` | Signup-time email OTP | buyer |
| BuyerLoginOtp | `tbl_buyer_login_otp` | Login-time email OTP | buyer |
| BuyerRefreshToken | `tbl_buyer_refresh_tokens` | Hashed refresh token for buyer | buyer |

### 2.4 Seller Onboarding (Temp/Staging)

| Entity | Table | Purpose | Module |
|---|---|---|---|
| TempSeller | `tbl_temp_seller` | Staging registration row, 1:1 with `User` | seller |
| TempSellerAddress | `tbl_temp_seller_address` | 1:1 registered address | seller |
| TempSellerBankDetails | `tbl_temp_seller_bank_details` | 1:1 bank details | seller |
| TempSellerCoordinator | `tbl_temp_seller_coordinator` | 1:1 point-of-contact | seller |
| TempSellerDocument | `tbl_temp_seller_document` | 1:N licence/agreement rows | seller |
| TempSellerReviewHistory | `tbl_temp_seller_review_history` | Admin review audit trail | seller |
| TempSellerEmailOtp | `tbl_temp_seller_email_otp` | Registration-time email OTP | seller |
| PhoneOTP | `phone_otp` | SMS OTP audit record (Twilio-delegated) | seller |
| SellerTerms | `tbl_terms_master` | Terms-and-conditions text master | seller |

### 2.5 Seller (Approved)

| Entity | Table | Purpose | Module |
|---|---|---|---|
| Seller | `tbl_seller` | Live approved seller, generated string PK | seller |
| SellerAddress | `tbl_seller_address` | 1:1 address | seller |
| SellerGST | `tbl_seller_gst` | 1:1 GST + verification flag | seller |
| SellerBankDetails | `tbl_seller_bank_details` | 1:1 bank details | seller |
| SellerCoordinator | `tbl_seller_coordinator` | 1:1 point-of-contact | seller |
| SellerDocument | `tbl_seller_document` | 1:N licences, FK to ProductTypeMaster (NOT NULL) | seller |
| SellerHistory | `tbl_seller_history` | Insert-only denormalized pre-update snapshot | seller |
| PendingSeller | `tbl_pending_seller` | Post-approval profile-edit staging row | seller |
| PendingSellerDocument | `tbl_pending_seller_document` | 1:N documents for a pending edit | seller |

### 2.6 Buyer Onboarding (Temp/Staging) and Approved

| Entity | Table | Purpose | Module |
|---|---|---|---|
| TempBuyer | `tbl_temp_buyer` | Staging registration row | buyer |
| TempBuyerAddress | `tbl_temp_buyer_address` | 1:1 draft address | buyer |
| TempBuyerContact | `tbl_temp_buyer_contact` | 1:1 draft contact | buyer |
| TempBuyerDocument | `tbl_temp_buyer_document` | 1:N draft documents | buyer |
| TempBuyerReviewHistory | `tbl_temp_buyer_review_history` | Admin review audit trail | buyer |
| Buyer | `tbl_buyer` | Live approved buyer, generated string PK | buyer |
| BuyerAddress | `tbl_buyer_address` | 1:1 address | buyer |
| BuyerContact | `tbl_buyer_contact` | 1:1 primary contact | buyer |
| BuyerDeliveryAddress | `tbl_buyer_delivery_address` | 1:N delivery addresses | buyer |
| BuyerDocument | `tbl_buyer_document` | 1:N compliance documents | buyer |

### 2.7 Product Catalog — Core

| Entity | Table | Purpose | Module |
|---|---|---|---|
| Category | `tm_category` | Top-level product category, root FK target | product |
| ProductDetails | `tm_product_details` | Central product row | product |
| PackagingDetails | `tm_packaging_details` | Per-product packaging record | product |
| PricingDetails | `tm_pricing_details` | Batch/lot record (stock, price, GST, discount) | product |
| AdditionalDiscount | `tm_additional_discount` | Per-batch tiered discount (persisted, not consumed by order pricing) | product |
| SpecialSchemes | `tm_special_schemes` | Per-batch buy-X-get-Y scheme (persisted, not consumed) | product |
| ProductImage | `tm_product_image` | Product image URL rows | product |
| StockLedger | `tbl_stock_ledger` | Append-only stock movement audit | product |
| GstPercentageMaster | `tm_gst_percentage_master` | Valid GST% lookup | product |

### 2.8 Product Catalog — Category Attribute Tables

| Entity | Table | Purpose | Module |
|---|---|---|---|
| ProductAttributeDrug | `tm_product_attribute_drug` | Drug category attributes; string (non-FK) therapeutic category/dosage columns; no certifications field | product |
| ProductAttributeConsumableMedical | `tm_product_attribute_consumable_medical` | Consumable medical device attributes | product |
| ProductAttributeNonConsumableMedical | `tm_product_attribute_non_consumable_medical` | Non-consumable medical device attributes | product |
| ProductAttributeSupplementsOrNutraceuticals | `tm_product_attribute_supplements_or_nutraceuticals` | Supplements/nutraceuticals attributes | product |
| ProductAttributeCosmeticandPersonalCare | `tm_product_attribute_cosmetic_and_personal_use` | Cosmetic/personal-care attributes | product |
| ProductAttributeFoodInfant | `tm_product_attribute_food_infant` | Food & infant nutrition attributes | product |
| ProductMolecule | `pm_product_molecule` | Drug↔Molecule join with strength, composite PK | product |
| ProductUserManual | `tm_product_user_manual` | 1:1 user manual, Drug only | product |
| ProductCertificateDocument | `tm_product_certificate_document` | Shared certificate table, 5 nullable owning FKs, no discriminator | product |

### 2.9 Product Lookup / Attribute Masters (summarized — see §4.6)

DrugCategory, Molecule, MoleculeStrengthFormat, PackType, PackTypeUnitMaster, AgeGroupMaster, DosageForm, Flavour, NetQuantityUnit, ServingSizeUnit, StorageConditionMaster, StrengthUnit, TherapeuticCategoryMaster, TherapeuticSubcategoryMaster, ProductFormMaster, ProductCategoryMaster, ProductSubcategoryMaster, Certification, CertificateDocument, ConsumableMaterialType, CountryMaster, DeviceCategory, DeviceSpecificationUnit, DeviceSubCategory, DimensionSize, MedicalDeviceType, NonConsumableMaterialType, PowerSource, HairType, IntendedUseArea, ProductsFormMaster, SkinType — all `product` module.

### 2.10 Order, Payment, Return, Quote

| Entity | Table | Purpose | Module |
|---|---|---|---|
| Order | `tbl_order` | Parent order, generated string PK | order |
| OrderStatus | — (embedded string constants, not a table) | Status constants for `Order.status` | order |
| SellerOrder | `tbl_seller_order` | Per-seller slice of an order | order |
| SellerOrderStatus | — (string constants) | Status constants for `SellerOrder.status` | order |
| OrderItem | `tbl_order_item` | Purchased line, snapshotted fields | order |
| OrderStatusHistory | `tbl_order_status_history` | Append-only per-transition audit | order |
| Payment | `tbl_payment` | 1:1 payment per Order (COD-only in practice) | order |
| PaymentStatus | — (string constants) | Status constants for `Payment.status` | order |
| Refund | `tbl_refund` | Refund row against a Payment | order |
| RefundStatus | — (string constants) | Status constants | order |
| ReturnRequest | `tbl_return_request` | Buyer-initiated return against one OrderItem | order |
| ReturnStatus | — (string constants) | Status constants | order |
| Invoice | `tbl_invoice` | 1:1 tax invoice per SellerOrder | order |
| QuoteRequest | `tbl_quote_request` | RFQ / price-request negotiation record | quote |
| QuoteRequestType, QuoteRequestStatus | — (Java enums, `@Enumerated`) | RFQ discriminator and state | quote |

### 2.11 Misc / Content / Security

| Entity | Table | Purpose | Module |
|---|---|---|---|
| IFSCOverride | `tbl_ifsc_overrides` | Manual bank IFSC override/cache | misc |
| LegalContent | `tbl_legal_content` (Flyway V3) | Versioned BUYER_TERMS/SELLER_TERMS HTML | misc |

---

## 3. ER Diagram

Full source also published as a standalone file: `d:/Tiameds_MarketPlace/Frontend/pharma-aggregator-client/docs/diagrams/database-er-diagram.mmd`.

```mermaid
erDiagram
    %% ============ MASTER / REFERENCE DATA ============
    tbl_state_master ||--o{ tbl_district_master : "state_id"
    tbl_state_master ||--o{ tbl_taluka_master : "state_id"
    tbl_district_master ||--o{ tbl_taluka_master : "district_id"
    tbl_document_type_master ||--o{ tbl_buyer_type_master : "mandatory_document_type_id"

    tbl_state_master {
        bigint state_id PK
        varchar state_code UK
        varchar state_name
        boolean is_active
    }
    tbl_district_master {
        bigint district_id PK
        bigint state_id FK
        varchar district_code UK
        varchar district_name
    }
    tbl_taluka_master {
        bigint taluka_id PK
        bigint state_id FK
        bigint district_id FK
        varchar taluka_code UK
        varchar taluka_name
    }
    tbl_buyer_type_master {
        bigint buyer_type_id PK
        varchar buyer_type_name UK
        varchar buyer_type_abbreviation UK
        bigint mandatory_document_type_id FK
    }
    tbl_seller_type_master {
        bigint seller_type_id PK
        varchar seller_type_name UK
        varchar seller_type_abbreviation UK
    }
    tbl_document_type_master {
        bigint document_type_id PK
        varchar document_type_name UK
        varchar document_type_code UK
    }
    tbl_role_master {
        int role_id PK
        varchar role_name UK
    }

    %% ============ SELLER ONBOARDING (temp -> approved) ============
    tbl_user ||--o| tbl_temp_seller : "user_id (1:1)"
    tbl_user ||--o| tbl_seller : "user_id (audit link)"
    tbl_temp_seller ||--o| tbl_temp_seller_address : "1:1"
    tbl_temp_seller ||--o| tbl_temp_seller_coordinator : "1:1"
    tbl_temp_seller ||--o| tbl_temp_seller_bank_details : "1:1"
    tbl_temp_seller ||--o{ tbl_temp_seller_document : "1:N"
    tbl_temp_seller ||--o{ tbl_temp_seller_review_history : "1:N"
    tbl_seller_type_master ||--o{ tbl_temp_seller : "seller_type_id"
    tbl_temp_seller ||--o| tbl_seller : "approved into (audit tempSellerId)"

    tbl_seller ||--o| tbl_seller_address : "1:1"
    tbl_seller ||--o| tbl_seller_coordinator : "1:1"
    tbl_seller ||--o| tbl_seller_bank_details : "1:1"
    tbl_seller ||--o| tbl_seller_gst : "1:1"
    tbl_seller ||--o{ tbl_seller_document : "1:N"
    tbl_seller ||--o{ tbl_seller_history : "1:N (pre-update snapshots)"
    tbl_seller ||--o{ tbl_pending_seller : "post-approval edits"
    tbl_pending_seller ||--o{ tbl_pending_seller_document : "1:N"
    tbl_product_type_master ||--o{ tbl_seller_document : "product_type_id"
    tbl_document_type_master ||--o{ tbl_seller_document : "document_type_id (opt)"

    tbl_user {
        bigint user_id PK
        varchar username UK
        varchar password_hash
        boolean is_password_temporary
        boolean is_account_locked
        int failed_login_attempts
    }
    tbl_temp_seller {
        bigint id PK
        bigint user_id FK
        varchar status
        boolean is_gst_verified
        boolean is_company_registration_certificate_verified
        bigint seller_type_id FK
    }
    tbl_seller {
        varchar seller_id PK "generated: NAME+TYPE+SEQ"
        bigint temp_seller_id "audit only, not FK"
        varchar status
    }

    %% ============ BUYER ONBOARDING (temp -> approved) ============
    tbl_buyer_user ||--o| tbl_temp_buyer : "user_id (1:1, opt)"
    tbl_buyer_user ||--o| tbl_buyer : "1:1 required"
    tbl_temp_buyer ||--o| tbl_temp_buyer_address : "1:1"
    tbl_temp_buyer ||--o| tbl_temp_buyer_contact : "1:1"
    tbl_temp_buyer ||--o{ tbl_temp_buyer_document : "1:N"
    tbl_temp_buyer ||--o{ tbl_temp_buyer_review_history : "1:N"
    tbl_buyer_type_master ||--o{ tbl_temp_buyer : "buyer_type_id"
    tbl_buyer ||--o| tbl_buyer_address : "1:1"
    tbl_buyer ||--o| tbl_buyer_contact : "1:1"
    tbl_buyer ||--o{ tbl_buyer_document : "1:N"
    tbl_buyer ||--o{ tbl_buyer_delivery_address : "1:N"
    tbl_buyer_user ||--o{ tbl_buyer_login_otp : "1:N"
    tbl_buyer_user ||--o{ tbl_buyer_refresh_tokens : "1:N"
    tbl_user ||--o{ tbl_login_otp : "1:N"
    tbl_user ||--o{ tbl_refresh_tokens : "1:N"

    tbl_buyer_user {
        bigint buyer_user_id PK
        varchar email UK
        varchar password_hash
        boolean is_password_temporary
        boolean is_account_locked
    }
    tbl_temp_buyer {
        bigint id PK
        bigint user_id FK
        varchar temp_buyer_request_id UK
        varchar status
        varchar gst_number
        varchar pan_number
    }
    tbl_buyer {
        varchar buyer_id PK "generated: NAME+TYPE+SEQ"
        bigint buyer_user_id FK UK
        varchar status
    }

    %% ============ PRODUCT CATALOG ============
    tm_category ||--o{ tm_product_details : "category_id"
    tbl_seller_reflink }o--|| tm_product_details : "seller_id"
    tm_product_details ||--o{ tm_pricing_details : "1:N batches"
    tm_product_details ||--o{ tm_packaging_details : "1:N"
    tm_product_details ||--o{ tm_product_image : "1:N"
    tm_product_details ||--o| tm_product_attribute_drug : "1:1 (Drug category)"
    tm_product_details ||--o| tm_product_attribute_consumable_medical : "1:1"
    tm_product_details ||--o| tm_product_attribute_non_consumable_medical : "1:1"
    tm_product_details ||--o| tm_product_attribute_supplements_or_nutraceuticals : "1:1"
    tm_product_details ||--o| tm_product_attribute_cosmetic_and_personal_use : "1:1"
    tm_product_details ||--o| tm_product_attribute_food_infant : "1:1"

    tm_pricing_details ||--o{ tm_additional_discount : "1:N"
    tm_pricing_details ||--o{ tm_special_schemes : "1:N"
    tm_pricing_details ||--o{ tbl_stock_ledger : "1:N movements"
    tm_pack_type ||--o{ tm_packaging_details : "pack_type_id"

    tm_product_attribute_drug ||--o{ pm_product_molecule : "1:N"
    tm_molecules_master ||--o{ pm_product_molecule : "molecule_id"
    tm_product_attribute_drug ||--o| tm_product_user_manual : "1:1"

    tbl_device_category_master ||--o{ tm_product_attribute_consumable_medical : "device_cat_id"
    tbl_device_category_master ||--o{ tm_product_attribute_non_consumable_medical : "device_cat_id"
    tbl_storage_condition_master ||--o{ tm_product_attribute_consumable_medical : "storage_condition_id"

    tm_product_attribute_consumable_medical ||--o{ tm_product_certificate_document : "1:N (nullable FK)"
    tm_product_attribute_non_consumable_medical ||--o{ tm_product_certificate_document : "1:N (nullable FK)"
    tm_product_attribute_supplements_or_nutraceuticals ||--o{ tm_product_certificate_document : "1:N (nullable FK)"
    tm_product_attribute_cosmetic_and_personal_use ||--o{ tm_product_certificate_document : "1:N (nullable FK)"
    tm_product_attribute_food_infant ||--o{ tm_product_certificate_document : "1:N (nullable FK)"

    tm_product_details {
        varchar product_id PK "generated"
        bigint category_id FK
        varchar seller_id FK
        varchar status "DRAFT/PUBLISHED/UNPUBLISHED"
    }
    tm_pricing_details {
        varchar pricing_id PK "generated SELLERBTCH#####"
        varchar product_id FK
        bigint packaging_id FK "nullable"
        varchar batch_lot_number
        date expiry_date
        int stock_quantity
        numeric mrp
        numeric selling_price
        numeric discount_percentage
        numeric gst_percentage
        numeric final_price "unused, never computed"
        timestamp deleted_at "soft delete"
    }
    tbl_stock_ledger {
        bigint ledger_id PK
        varchar pricing_id FK
        varchar product_id FK
        varchar seller_id FK
        varchar transaction_type "STOCK_IN/STOCK_OUT"
        int quantity
        int balance_after
    }
    tm_product_certificate_document {
        bigint id PK
        bigint certification_id FK
        bigint non_consumable_attribute_id FK "nullable"
        bigint consumable_attribute_id FK "nullable"
        bigint supplements_attribute_id FK "nullable"
        bigint cosmetic_attribute_id FK "nullable"
        bigint product_attribute_id FK "nullable, FoodInfant"
        varchar certificate_url
    }

    %% ============ ORDER / PAYMENT / RETURN ============
    tbl_buyer ||--o{ tbl_order : "buyer_id"
    tbl_order ||--|| tbl_payment : "1:1"
    tbl_order ||--o{ tbl_seller_order : "1:N per-seller fan-out"
    tbl_seller ||--o{ tbl_seller_order : "seller_id"
    tbl_seller_order ||--o{ tbl_order_item : "1:N"
    tbl_seller_order ||--o{ tbl_order_status_history : "1:N"
    tbl_seller_order ||--o| tbl_invoice : "1:1"
    tm_product_details ||--o{ tbl_order_item : "product_id"
    tm_pricing_details ||--o{ tbl_order_item : "pricing_id (batch)"
    tbl_payment ||--o{ tbl_refund : "1:N"
    tbl_order_item ||--o| tbl_return_request : "0..1"
    tbl_return_request ||--o| tbl_refund : "1:1 on approval"
    tbl_quote_request }o--|| tm_product_details : "product_id"
    tbl_quote_request }o--|| tbl_seller : "seller_id (auto-resolved)"
    tbl_quote_request }o--|| tbl_buyer_user : "buyer_user_id"
    tbl_quote_request ||--o| tbl_order : "order_id (string pointer, not FK)"

    tbl_order {
        varchar order_id PK "ORD-yyyyMMdd-#####"
        varchar buyer_id FK
        varchar status "rollup"
        varchar idempotency_key UK
    }
    tbl_seller_order {
        varchar seller_order_id PK "SORD-{orderSuffix}-{seq}"
        varchar order_id FK
        varchar seller_id FK
        varchar status
    }
    tbl_order_item {
        bigint order_item_id PK
        varchar seller_order_id FK
        varchar product_id FK
        varchar pricing_id FK
        varchar item_status
    }
    tbl_payment {
        varchar payment_id PK "PAY-yyyyMMdd-#####"
        varchar order_id FK UK
        varchar status "SUCCESS only, in practice"
        varchar provider "COD"
    }
    tbl_refund {
        bigint refund_id PK
        varchar payment_id FK
        bigint order_item_id FK "nullable"
        varchar status
    }
    tbl_return_request {
        bigint return_id PK
        bigint order_item_id FK
        varchar status
    }
    tbl_invoice {
        bigint invoice_id PK
        varchar seller_order_id FK UK
        varchar invoice_number UK
    }
    tbl_quote_request {
        bigint quote_request_id PK
        varchar product_id FK
        varchar seller_id FK
        bigint buyer_user_id FK
        varchar request_type "PRICE_REQUEST/RFQ"
        varchar status
        varchar order_id "string pointer"
    }
```

> Note on `tbl_seller_reflink`: this is a diagram-only label representing the plain `seller_id` FK column on `tm_product_details` → `tbl_seller`; there is no such table. Mermaid requires a named entity on both sides of a relationship line, so this placeholder keeps the diagram from redeclaring `tbl_seller`'s attribute block a second time in this cluster.

---

## 4. Table Schemas (core ~30 tables)

Column facts below are sourced from the entity `@Column`/`@Id`/`@GeneratedValue`/`@JoinColumn`/`@Enumerated` annotations as captured in the grounding inventory (each entity's source path is given). Where a precise `length`/`precision` was not independently re-confirmed in this pass, the column is still asserted to exist (verified) but its exact width is marked "not confirmed in this pass."

### 4.1 `tbl_seller`
Source: `entity/seller/Seller.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| seller_id | varchar | No | — | PK | | Yes | Generated: 2-char name prefix + seller-type abbreviation + 4-digit sequence, under Postgres advisory lock 12345 |
| temp_seller_id | bigint | Yes | — | | (audit only, not enforced FK) | | Points back to originating `TempSeller.id` |
| user_id | bigint | Yes | — | | FK → `tbl_user.user_id` | | Login account link |
| seller_name | varchar | No | — | | | | |
| status | varchar | No | — | | | | Only `APPROVED` (and, via PendingSeller CREATE path, `ACTIVE`) actually assigned in code |
| created_at / updated_at | timestamp | No | now() | | | | |
| created_by / updated_by | varchar | Yes | — | | | | |

### 4.2 `tbl_seller_address`, `tbl_seller_coordinator`, `tbl_seller_bank_details`, `tbl_seller_gst`
Source: `entity/seller/SellerAddress.java`, `SellerCoordinator.java`, `SellerBankDetails.java`, `SellerGST.java`

All four are 1:1 children of `tbl_seller` via a unique FK `seller_id`. Representative shape (SellerBankDetails, the most structurally significant):

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| id | bigint | No | identity | PK | | | |
| seller_id | varchar | No | — | | FK → `tbl_seller.seller_id` | Yes | 1:1 |
| account_number | varchar | Yes | — | | | | |
| ifsc_code | varchar | Yes | — | | | | |
| bank_document_url | varchar | Yes | 'PENDING' | | | | |
| is_bank_document_verified | boolean | No | false | | | | |
| state_id / district_id / taluka_id | bigint | Yes | — | | FK → master tables | | Added by `docs/migration_add_multi_seller_type_fields.sql` |

### 4.3 `tbl_seller_document`
Source: `entity/seller/SellerDocument.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| id | bigint | No | identity | PK | | | |
| seller_id | varchar | No | — | | FK → `tbl_seller.seller_id` | | |
| product_type_id | bigint | **No** | — | | FK → `tbl_product_type_master` | | NOT NULL even for seller-level docs; falls back to placeholder row |
| document_type_id | bigint | Yes | — | | FK → `tbl_document_type_master` | | |
| document_number | varchar | Yes | — | | | | |
| document_file_url | varchar | Yes | 'PENDING' | | | | |
| issue_date / expiry_date | date | Yes | — | | | | |
| license_status | varchar | No | — | | | | Computed Active/Expired |
| is_document_verified | boolean | No | false | | | | |

### 4.4 `tbl_pending_seller`
Source: `entity/seller/profile/PendingSeller.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| pending_seller_id | bigint | No | identity | PK | | | |
| seller_id | varchar | Yes | — | | FK → `tbl_seller.seller_id` | | Null for CREATE requests |
| request_type | varchar | No | — | | | | CREATE / UPDATE (plain string) |
| status | varchar | No | — | | | | PENDING / AUTO_APPROVED / APPROVED / REJECTED / APPROVAL_FAILED |
| rejection_reason | varchar | Yes | — | | | | Also used to store exception message on APPROVAL_FAILED |

### 4.5 `tbl_temp_seller`
Source: `entity/temp/seller/TempSeller.java`, `TempSellerStatus.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| id | bigint | No | identity | PK | | | |
| user_id | bigint | Yes (draft) / effectively required otherwise | — | | FK → `tbl_user.user_id`, unique 1:1 | Yes | |
| status | varchar | No | 'DRAFT' or 'OPEN' | | | | Plain varchar; constants in `TempSellerStatus.java`: DRAFT, OPEN, RESUBMITTED, APPROVED, REJECTED, CORRECTION_REQUIRED |
| seller_type_id | bigint | Yes | — | | FK → `tbl_seller_type_master` | | |
| is_gst_verified | boolean | No | false | | | | |
| is_company_registration_certificate_verified | boolean | No | false | | | | |

### 4.6 `tbl_buyer`
Source: `entity/buyer/Buyer.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| buyer_id | varchar | No | — | PK | | Yes | Generated: 2-char org prefix + buyer-type abbreviation + 4-digit sequence, advisory lock 54321 |
| buyer_user_id | bigint | No | — | | FK → `tbl_buyer_user.buyer_user_id` | Yes | Required 1:1 |
| temp_buyer_id | bigint | Yes | — | | (audit only) | | |
| org_name | varchar | No | — | | | | |
| status | varchar | No | 'APPROVED' | | | | |
| terms_accepted | boolean | No | false | | | | |

### 4.7 `tbl_temp_buyer`
Source: `entity/temp/buyer/TempBuyer.java`, `TempBuyerStatus.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| id | bigint | No | identity | PK | | | |
| temp_buyer_request_id | varchar | No | — | | | Yes | Format `BREQ-NNN` |
| user_id | bigint | Yes | — | | FK → `tbl_buyer_user.buyer_user_id` | | Nullable — buyer can log in before registering |
| status | varchar | No | 'DRAFT' | | | | DRAFT / SUBMITTED / UNDER_REVIEW / CORRECTION_REQUIRED / REJECTED / APPROVED / SUSPENDED (`UNDER_REVIEW`, `SUSPENDED` declared but never set in code found) |
| gst_number | varchar | Yes | — | | | | Either GST or PAN required (app-level rule) |
| pan_number | varchar | Yes | — | | | | |
| is_gst_verified / is_pan_verified | boolean | No | false | | | | |

### 4.8 `tbl_temp_buyer_document`
Source: `entity/temp/buyer/TempBuyerDocument.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| id | bigint | No | identity | PK | | | |
| temp_buyer_id | bigint | No | — | | FK → `tbl_temp_buyer.id` | | |
| document_type_id | bigint | Yes | — | | FK → `tbl_document_type_master` | | |
| document_number | varchar | Yes | — | | | | |
| document_file_url | varchar | Yes | 'PENDING' (column default) | | | | |
| license_status | varchar | No | — | | | | Auto-computed `@PrePersist`/`@PreUpdate` |
| is_document_verified | boolean | No | false | | | | |

### 4.9 `tm_product_details`
Source: `entity/product/ProductDetails.java`, `enums/ProductStatus.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| product_id | varchar | No | — | PK | | Yes | Generated: 2-letter seller prefix + 3-letter product-name fragment + 5-digit global sequence |
| category_id | bigint | No | — | | FK → `tm_category.category_id` | | |
| seller_id | varchar | No | — | | FK → `tbl_seller.seller_id` | | |
| status | varchar | No | 'PUBLISHED' | | | | `@Enumerated` ProductStatus: DRAFT / PUBLISHED / UNPUBLISHED |
| product_name | varchar | No | — | | | | |
| manufacturer_name | varchar | Yes | — | | | | |

### 4.10 `tm_pricing_details`
Source: `entity/product/PricingDetails.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| pricing_id | varchar | No | — | PK | | Yes | Generated: `<2-letter seller prefix>BTCH<5-digit seq>` |
| product_id | varchar | No | — | | FK → `tm_product_details.product_id` | | |
| packaging_id | bigint | Yes | — | | FK → `tm_packaging_details.id` | | Required when a product has >1 packaging variant |
| batch_lot_number | varchar | No | — | | | | 3–20 alnum (import-time rule) |
| manufacturing_date / expiry_date | date | No | — | | | | |
| stock_quantity | int | No | — | | | | Mutable running balance for this batch |
| mrp / selling_price | numeric | No | — | | | | |
| discount_percentage | numeric(5,2) | Yes | — | | | | |
| gst_percentage | numeric | No | — | | | | |
| final_price | numeric | Yes | — | | | | **Never computed anywhere in code** — dead column |
| hsn_code | varchar | No | — | | | | 4/6/8-digit |
| deleted_at / deleted_by | timestamp / varchar | Yes | null | | | | Soft delete via `@SQLRestriction("deleted_at IS NULL")` |

### 4.11 `tbl_stock_ledger`
Source: `entity/product/StockLedger.java`, `enums/StockTransactionType.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| ledger_id | bigint | No | identity | PK | | | |
| pricing_id | varchar | No | — | | FK → `tm_pricing_details.pricing_id` | | |
| product_id | varchar | No | — | | FK → `tm_product_details.product_id` | | |
| seller_id | varchar | No | — | | FK → `tbl_seller.seller_id` | | |
| performed_by | varchar | Yes | — | | | | |
| transaction_type | varchar | No | — | | | | Enum values STOCK_IN/STOCK_OUT/ADJUSTMENT/RETURN/DAMAGE — only STOCK_IN/STOCK_OUT ever produced |
| quantity | int | No | — | | | | |
| balance_after | int | No | — | | | | |
| reference_id / reference_type | varchar | Yes | — | | | | |
| created_date | timestamp | No | now() | | | | |

### 4.12 `tm_packaging_details`
Source: `entity/product/PackagingDetails.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| id | bigint | No | identity | PK | | | |
| product_id | varchar | No | — | | FK → `tm_product_details.product_id` | | |
| pack_type_id | bigint | Yes | — | | FK → `tm_pack_type.pack_type_id` | | |
| pack_type_unit_id | bigint | Yes | — | | FK → `tm_pack_type_unit_master.id` | | |
| units_per_pack | int | Yes | — | | | | |
| min_order_qty / max_order_qty | int | Yes | — | | | | |

### 4.13 `tm_product_attribute_drug`
Source: `entity/product/ProductAttributeDrug.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| id | bigint | No | identity | PK | | | |
| product_id | varchar | No | — | | FK → `tm_product_details.product_id` (1:1) | | |
| therapeutic_category_id / therapeutic_subcategory_id | varchar | Yes | — | | **plain string, not a real FK** | | Unlike Supplements' equivalent columns |
| dosage_form | varchar | Yes | — | | plain string | | |
| No `certifications` field | — | — | — | | — | | Only Drug attribute entity lacking one |

### 4.14 `tm_product_attribute_consumable_medical`
Source: `entity/product/ProductAttributeConsumableMedical.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| id | bigint | No | identity | PK | | | |
| product_id | varchar | No | — | | FK → `tm_product_details.product_id` (1:1) | | |
| device_cat_id / device_sub_cat_id | bigint | No | — | | FK → `tbl_device_category_master` / `tbl_device_sub_category_master` | | |
| country_id | bigint | No | — | | FK → `tbl_country_master` | | |
| storage_condition_id | bigint | No | — | | FK → `tbl_storage_condition_master` | | |
| brochure_path | varchar | Yes | — | | | | |

### 4.15 `tm_product_certificate_document`
Source: `entity/product/MedicalDeviceProductMaster/CertificateDocument.java`, `entity/product/ProductCertificateDocument.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| id | bigint | No | identity | PK | | | |
| certification_id | bigint | Yes | — | | FK → `tbl_certification_master` | | |
| non_consumable_attribute_id | bigint | Yes | — | | FK (nullable) | | Only one of the 5 owning FKs populated per row |
| consumable_attribute_id | bigint | Yes | — | | FK (nullable) | | |
| supplements_or_nutraceuticals_attribute_id | bigint | Yes | — | | FK (nullable) | | |
| cosmetic_attribute_id | bigint | Yes | — | | FK (nullable) | | |
| product_attribute_id | bigint | Yes | — | | FK → FoodInfant (nullable) | | |
| certificate_url | varchar | No | 'NOT_UPLOADED' | | | | Placeholder created first, overwritten on real upload |

### 4.16 `pm_product_molecule`
Source: `entity/product/ProductMolecule.java`, `ProductMoleculeId.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| product_attribute_id | varchar | No | — | PK (composite) | FK → `tm_product_attribute_drug` | | |
| molecule_id | bigint | No | — | PK (composite) | FK → `tm_molecules_master` | | |
| strength | varchar | Yes | — | | | | Cross-validated 1:1 against molecule count at import time |

### 4.17 `tbl_order`
Source: `entity/order/Order.java`, `OrderStatus.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| order_id | varchar | No | — | PK | | Yes | `ORD-yyyyMMdd-#####`, advisory lock 98765 |
| buyer_id | varchar | No | — | | FK → `tbl_buyer.buyer_id` | | |
| status | varchar | No | — | | | | Rollup: PLACED/PARTIALLY_SHIPPED/SHIPPED/DELIVERED/CANCELLED, derived, not set directly |
| idempotency_key | varchar | Yes | — | | | Yes | Replay-safe order placement |
| subtotal / shipping_total / tax_total / grand_total | numeric | No | — | | | | |
| quote_request_id | bigint | Yes | — | | (plain id, not FK) | | |

### 4.18 `tbl_seller_order`
Source: `entity/order/SellerOrder.java`, `SellerOrderStatus.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| seller_order_id | varchar | No | — | PK | | Yes | `SORD-{orderSuffix}-{seq}`, in-memory counter, no advisory lock |
| order_id | varchar | No | — | | FK → `tbl_order.order_id` | | |
| seller_id | varchar | No | — | | FK → `tbl_seller.seller_id` | | |
| status | varchar | No | 'PLACED' | | | | PLACED/CONFIRMED/PACKED/SHIPPED/OUT_FOR_DELIVERY/DELIVERED/CANCELLED/RETURN_REQUESTED/RETURN_APPROVED/RETURN_REJECTED/RETURNED/REFUNDED (REFUNDED never actually set) |
| courier_name / tracking_number / tracking_url | varchar | Yes | — | | | | Set on `ship` |
| confirmed_at / shipped_at / delivered_at / cancelled_at | timestamp | Yes | — | | | | |

### 4.19 `tbl_order_item`
Source: `entity/order/OrderItem.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| order_item_id | bigint | No | identity | PK | | | |
| seller_order_id | varchar | No | — | | FK → `tbl_seller_order.seller_order_id` | | |
| product_id | varchar | No | — | | FK → `tm_product_details.product_id` | | |
| pricing_id | varchar | No | — | | FK → `tm_pricing_details.pricing_id` | | |
| product_name_snapshot / batch_lot_number_snapshot / packaging_id_snapshot / unit_price_snapshot | varchar/numeric | No | — | | | | Point-in-time snapshot, immune to later catalog edits |
| item_status | varchar | No | — | | | | Mirrors parent SellerOrder status (except diverging returns) |

### 4.20 `tbl_payment`
Source: `entity/order/Payment.java`, `PaymentStatus.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| payment_id | varchar | No | — | PK | | Yes | `PAY-yyyyMMdd-#####`, advisory lock 98766 |
| order_id | varchar | No | — | | FK → `tbl_order.order_id` | Yes | 1:1 |
| provider | varchar | No | 'COD' | | | | No gateway integration found |
| status | varchar | No | 'SUCCESS' | | | | Only SUCCESS ever set; REFUNDED/PARTIALLY_REFUNDED/PENDING_COD/INITIATED/FAILED declared, dead |
| paid_at | timestamp | No | now() at placement | | | | |

### 4.21 `tbl_refund`
Source: `entity/order/Refund.java`, `RefundStatus.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| refund_id | bigint | No | identity | PK | | | |
| payment_id | varchar | No | — | | FK → `tbl_payment.payment_id` | | |
| order_item_id | bigint | Yes | — | | FK → `tbl_order_item.order_item_id`, nullable | | Null = whole-seller-order refund; non-null = per-item |
| amount | numeric | No | — | | | | |
| status | varchar | No | 'REQUESTED' | | | | Only REQUESTED→COMPLETED transition ever coded; PROCESSING/FAILED dead |

### 4.22 `tbl_return_request`
Source: `entity/order/ReturnRequest.java`, `ReturnStatus.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| return_id | bigint | No | identity | PK | | | |
| order_item_id | bigint | No | — | | FK → `tbl_order_item.order_item_id` | | |
| status | varchar | No | 'REQUESTED' | | | | REQUESTED/APPROVED/REJECTED actually set; PICKED_UP/CLOSED dead |
| resolved_at / resolved_by_role | timestamp/varchar | Yes | — | | | | |

### 4.23 `tbl_invoice`
Source: `entity/order/Invoice.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| invoice_id | bigint | No | identity | PK | | | |
| seller_order_id | varchar | No | — | | FK → `tbl_seller_order.seller_order_id` | Yes | 1:1 |
| invoice_number | varchar | No | — | | | Yes | `INV-{sellerId}-{FYstartYY}{FYendYY}-{00001..}`, per-seller-per-FY, COUNT(*)-based (no lock — accepted theoretical race) |
| invoice_file_url | varchar | No | — | | | | S3 PDF |
| generated_at | timestamp | No | now() | | | | |

### 4.24 `tbl_quote_request`
Source: `entity/quote/QuoteRequest.java`, `enums/QuoteRequestType.java`, `enums/QuoteRequestStatus.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| quote_request_id | bigint | No | identity | PK | | | |
| request_type | varchar | No | — | | | | `@Enumerated`: PRICE_REQUEST / RFQ |
| product_id | varchar | No | — | | FK → `tm_product_details.product_id` | | |
| seller_id | varchar | No | — | | FK → `tbl_seller.seller_id` | | Auto-resolved from product, not buyer-chosen |
| buyer_user_id | bigint | No | — | | FK → `tbl_buyer_user.buyer_user_id`, `@JsonIgnore` | | |
| quantity | int | No | — | | | | |
| status | varchar | No | 'PENDING' | | | | `@Enumerated`: PENDING/QUOTED/ACCEPTED/REJECTED/EXPIRED (dead)/ORDER_PLACED |
| quoted_price | numeric | Yes | — | | | | Set on seller respond() |
| order_id | varchar | Yes | — | | **plain string, not FK** | | Set once ORDER_PLACED |

### 4.25 `tbl_refresh_tokens` / `tbl_buyer_refresh_tokens`
Source: `entity/auth/RefreshToken.java`, `entity/buyer/BuyerRefreshToken.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| id | bigint | No | identity | PK | | | |
| user_id / buyer_user_id | bigint | No | — | | FK | | |
| token_hash | varchar | No | — | | | Yes | SHA-256 of raw token; raw never stored |
| expires_at | timestamp | No | — | | | | 7 days |
| revoked_at | timestamp | Yes | null | | | | null = still valid |

### 4.26 `tbl_login_otp` / `tbl_buyer_login_otp`
Source: `entity/auth/LoginOtp.java`, `entity/buyer/BuyerLoginOtp.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| id | bigint | No | identity | PK | | | |
| user_id / buyer_user_id | bigint | No | — | | FK | | |
| otp_code | varchar(6) | No | — | | | | |
| expires_at | timestamp | No | — | | | | 5 minutes |
| is_used | boolean | No | false | | | | |
| failed_attempts | int | No | 0 | | | | Seller: lock at 3; Buyer: lock at 3 |
| is_locked | boolean | No | false | | | | |

### 4.27 `tbl_ifsc_overrides`
Source: `entity/ifsc/IFSCOverride.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| ifsc_code | varchar(11) | No | — | PK | | | |
| bank / branch / state / district / city / address | varchar | Yes | — | | | | |
| is_active | boolean | No | true | | | | |

---

## 5. Relationships & Cardinality

| Relationship | Cardinality | Source |
|---|---|---|
| StateMaster → DistrictMaster | 1:N (read-only FK, `insertable=false, updatable=false`) | `DistrictMaster.java` |
| StateMaster / DistrictMaster → TalukaMaster | 1:N / 1:N (Taluka denormalizes both, not derived transitively) | `TalukaMaster.java` |
| User → TempSeller | 1:1 (nullable for legacy rows) | `TempSeller.java` |
| TempSeller → {Address, Coordinator, BankDetails} | 1:1 each, cascade | `TempSeller.java` |
| TempSeller → {Document, ReviewHistory} | 1:N each, cascade | `TempSeller.java` |
| TempSeller → Seller | 1:1 conceptual promotion (audit `temp_seller_id`, not an FK constraint) | `SellerApprovalServiceImpl.java` |
| Seller → {Address, Coordinator, BankDetails, GST} | 1:1 each | `entity/seller/*.java` |
| Seller → SellerDocument | 1:N | `SellerDocument.java` |
| Seller → SellerHistory | 1:N (insert-only snapshots, pre-update) | `SellerHistory.java` |
| Seller → PendingSeller | 1:N (post-approval edit requests) | `PendingSeller.java` |
| PendingSeller → PendingSellerDocument | 1:N | `PendingSellerDocument.java` |
| BuyerUser → TempBuyer | 1:1 (nullable) | `TempBuyer.java` |
| TempBuyer → {Address, Contact} | 1:1 each | `TempBuyer*.java` |
| TempBuyer → {Document, ReviewHistory} | 1:N each | `TempBuyer*.java` |
| BuyerUser → Buyer | 1:1 required (unique FK) | `Buyer.java` |
| Buyer → {Address, Contact} | 1:1 each | `entity/buyer/*.java` |
| Buyer → {DeliveryAddress, Document} | 1:N each | `entity/buyer/*.java` |
| Category → {ProductDetails, DosageForm, PackType, NetQuantityUnit, StrengthUnit, TherapeuticCategoryMaster, ProductCategoryMaster, StorageConditionMaster, Certification} | 1:N (root master FK) | `Category.java` and dependents |
| Seller → ProductDetails | 1:N | `ProductDetails.java` |
| ProductDetails → {PackagingDetails, PricingDetails, ProductImage} | 1:N each | `ProductDetails.java` |
| ProductDetails → one of 6 category attribute entities | 1:1 | `ProductDetails.java` and the 6 attribute entities |
| PricingDetails → {AdditionalDiscount, SpecialSchemes} | 1:N each, cascade ALL + orphanRemoval | `PricingDetails.java` |
| PricingDetails → StockLedger | 1:N | `StockLedger.java` |
| PackagingDetails → PricingDetails | 1:N (optional scoping FK) | `PricingDetails.java` |
| ProductAttributeDrug → ProductMolecule → Molecule | 1:N join, composite PK | `ProductMolecule.java`, `ProductMoleculeId.java` |
| ProductAttributeDrug → ProductUserManual | 1:1 | `ProductUserManual.java` |
| 5 attribute entities → ProductCertificateDocument | 1:N each via 5 separate nullable FKs on one shared table (no discriminator) | `ProductCertificateDocument.java` |
| Buyer → Order | 1:N | `Order.java` |
| Order → Payment | 1:1 | `Payment.java` |
| Order → SellerOrder | 1:N (fan-out per distinct seller in cart) | `Order.java` |
| Seller → SellerOrder | 1:N | `SellerOrder.java` |
| SellerOrder → OrderItem | 1:N, cascade ALL + orphanRemoval | `SellerOrder.java` |
| SellerOrder → OrderStatusHistory | 1:N, cascade ALL + orphanRemoval | `SellerOrder.java` |
| SellerOrder → Invoice | 1:1 | `Invoice.java` |
| Payment → Refund | 1:N | `Refund.java` |
| OrderItem → ReturnRequest | 0..1 (per line) | `ReturnRequest.java` |
| ReturnRequest → Refund | 1:1 on approval | `ReturnRequest.java` |
| Product/Seller/BuyerUser → QuoteRequest | N:1 each (many quotes per product/seller/buyer) | `QuoteRequest.java` |
| QuoteRequest → Order | Logical pointer only (`order_id` plain string, deliberately not `@ManyToOne`) | `QuoteRequest.java` comment |

---

## 6. Normalization

- **Overall assessment: 3NF for the great majority of transactional tables.** Core entities (Seller, Buyer, Order, SellerOrder, OrderItem, PricingDetails, ProductDetails) store atomic columns, have single-purpose PKs, and push repeating/lookup data out to master tables (state/district/taluka, product-type, document-type, GST%, etc.) rather than embedding it — verified by direct inspection of the JPA field lists cited in §4.
- **Deliberate denormalization — documented and intentional:**
  1. **TalukaMaster** stores both `state_id` and `district_id` (not derived transitively through district) — `entity/master/TalukaMaster.java`.
  2. **Order** snapshots delivery-address fields as flat columns rather than a live FK to `BuyerDeliveryAddress` — `entity/order/Order.java`.
  3. **OrderItem** snapshots `productNameSnapshot`/`batchLotNumberSnapshot`/`packagingIdSnapshot`/`unitPriceSnapshot` — deliberately duplicating catalog data so later edits never rewrite order history — `entity/order/OrderItem.java`.
  4. **SellerHistory** is a fully denormalized, insert-only point-in-time copy of a Seller (including master-data *names* frozen alongside their IDs, and a JSON-string blob of documents) — `entity/seller/history/SellerHistory.java`. This is the clearest deliberate denormalization for audit-immutability reasons.
  5. **PendingSeller / TempSeller / TempBuyer** duplicate the full shape of their eventual target aggregate (Seller/Buyer) rather than reusing the same child tables — a staging-table pattern, not a normalization defect per se, but it does mean the same logical fields (address, bank, coordinator) are modeled in two parallel table families.
- **Accidental/incidental denormalization or drift found:**
  1. **`PricingDetails.finalPrice`** is a stored column that duplicates what `sellingPrice`/`discountPercentage`/`gstPercentage` should compute, but no code path ever writes it — effectively a dead, uncomputed derived column left in the schema (`entity/product/PricingDetails.java`; confirmed no writer in `ProductDetailsServiceImpl`/`ExcelProductImportServiceImpl`).
  2. **ProductAttributeDrug.therapeuticCategoryId / therapeuticSubcategoryId / dosageForm** are plain `String` columns rather than real FKs — unlike the equivalent columns on `ProductAttributeSupplementsOrNutraceuticals`, which are real FKs. This is an inconsistency, not a deliberate design choice, per the discovery inventory's direct comparison of the two entity files.
  3. **ProductCertificateDocument** uses 5 separate nullable FK columns instead of a single polymorphic/discriminated relationship — a normalization compromise (partial-column sparsity) rather than 3NF-violating redundancy, but worth flagging as a schema smell.
- **No entity found violating 1NF** (no repeating-group/comma-packed columns were found in any entity read) or storing calculated aggregates redundantly outside the two cases above.

---

## 7. Indexing Strategy

**What was actually found in the entity source:**
- Explicit `@Column(unique = true)` constraints were found on numerous columns (translating to a unique index at the DB level): `StateMaster.stateCode`, `DistrictMaster.districtCode`, `TalukaMaster.talukaCode`, `SellerTypeMaster.sellerTypeName`/`sellerTypeAbbreviation`, `BuyerTypeMaster.buyerTypeName`/`buyerTypeAbbreviation`, `CompanyTypeMaster.companyTypeName`, `ProductTypeMaster.productTypeName`, `DocumentTypeMaster.documentTypeName`/`documentTypeCode`, `RoleMaster.roleName`, `GstPercentageMaster.value`, `Order.idempotencyKey`, `Payment.orderId` (1:1), `Invoice.sellerOrderId` (1:1) / `Invoice.invoiceNumber`, `Buyer.buyerUserId` (1:1), `RefreshToken.tokenHash` / `BuyerRefreshToken.tokenHash`, `TempBuyer.tempBuyerRequestId`, `TempSellerCoordinator`/`TempBuyerContact` email+mobile.
- Flyway migration `V1__buyer_type_and_document_type_seed.sql` creates `tbl_document_type_master`/`tbl_buyer_type_master` with their PK and the seed's own `UNIQUE` constraints where stated in that script (per the discovery inventory's read of that file).
- **No explicit `@Index` / `@Table(indexes = ...)` annotation was found on any entity** in the discovery inventory's file-by-file reads (none of the entity summaries report one), and this session did not find a DDL/index-creation script beyond what Flyway's three migrations state. This is reported as **NOT IDENTIFIED** rather than assumed absent from a live database that might have manually-added indexes outside the JPA/Flyway-managed schema.
- Composite PK `ProductMoleculeId` (`productAttributeId`, `moleculeId`) on `pm_product_molecule` functions as a composite unique index by construction.

### Recommendations — NOT Currently Implemented
- **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: add explicit secondary indexes on high-cardinality foreign keys that are queried directly and are not already covered by a unique constraint or PK, in particular: `tm_pricing_details.product_id` (FIFO batch listing, `PricingDetailsRepository` queries), `tbl_stock_ledger.pricing_id`/`product_id`/`seller_id` (sum-by-type and reference lookups), `tbl_order.buyer_id` (order history listing), `tbl_seller_order.seller_id` + `status` (seller order dashboards, filtered lists), `tbl_order_item.seller_order_id`, `tbl_quote_request.seller_id` and `.buyer_user_id` (both have `findBy...OrderByCreatedAtDesc` derived queries with no confirmed index), `tbl_temp_seller.user_id` / `tbl_temp_buyer.user_id` (1:1 lookups), and `tm_product_details.seller_id` + `category_id` (product list filters).
- **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: a composite index on `(seller_id, status)` for `tbl_seller_order` and on `(status)` for `tbl_temp_seller`/`tbl_temp_buyer` to support the admin review-queue listing endpoints (`GET /temp-sellers`, `GET /temp-buyers`, `GET /admin/seller-requests/pending`), all of which currently appear to be unfiltered/full-table scans in the service code inspected.
- **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: a partial index on `tm_pricing_details (product_id) WHERE deleted_at IS NULL` to accelerate the frequently-run "available batches" / FIFO queries that already filter on the `@SQLRestriction`.

---

## 8. Data Retention / Archival

**Not identified in the current implementation.** No scheduled job, TTL/expiry column enforcement (beyond the two soft-delete patterns below), retention-policy configuration, or archival table/process was found anywhere in the discovery inventory or this session's own review of `application*.yml`, the Flyway migrations, or the service-layer code. Specifically:
- No cron/scheduled task (`@Scheduled`) was reported anywhere in the codebase inventory.
- No "archive" table, cold-storage table, or partitioning strategy was found.
- `PricingDetails` and `Seller`-family entities use **soft delete** (`deletedAt`/`deletedBy` + `@SQLRestriction`) but nothing purges or archives soft-deleted rows — they remain in the primary table indefinitely.
- `SellerHistory` is an insert-only audit table with no observed pruning logic — it will grow unbounded.
- `IndependentEmailServiceImpl`'s email-status tracking is explicitly **in-memory** (`ConcurrentHashMap`, comment: "replace with database in production") — not a retention concern for the DB schema, but confirms no persistence/retention layer exists there at all.

---

## 9. Sample / Seed Data

Source files actually opened (grounding inventory): `D:/Tiameds_MarketPlace/Backend/pharma-aggregator-server/src/main/resources/db/migration/V1__buyer_type_and_document_type_seed.sql`, `db/seed/strength_unit_seed.sql`, `db/seed/legal_content_seed.sql`, and the `docs/seed_*.sql` files.

### 9.1 Flyway-managed seed (`src/main/resources/db/migration/V1__buyer_type_and_document_type_seed.sql`)
- `tbl_document_type_master` — 4 rows: **Drug License**, **Clinical Establishment License**, **Laboratory Registration Certificate**, **Medical Council or Clinic Registration Certificate**.
- `tbl_buyer_type_master` — 6 rows, each FK'd to its mandatory document type:

| buyer_type_name | abbreviation | mandatory_document_type |
|---|---|---|
| Hospital | HOS | Clinical Establishment License |
| Clinic | CLN | Clinical Establishment License |
| Hospital Pharmacy | HPH | Drug License |
| Pharmacy | PHM | Drug License |
| Diagnostic Centre | DIA | Laboratory Registration Certificate |
| Laboratory | LAB | Laboratory Registration Certificate |

Idempotent via `ON CONFLICT DO NOTHING`.

### 9.2 Manual (non-Flyway) seeds in `src/main/resources/db/seed/`
- `strength_unit_seed.sql` — seeds `tm_strength_unit`; its own header states there is no Flyway/Liquibase management for this data and it must be run by hand.
- `legal_content_seed.sql` — re-runnable `ON CONFLICT DO UPDATE ... WHERE ... IS DISTINCT FROM` upsert for `tbl_legal_content` (BUYER_TERMS / SELLER_TERMS HTML), version-bumping on change; layered on top of Flyway V3's own initial insert of the same table.

### 9.3 Manual scripts under `docs/` (NOT Flyway-managed — see §10)
- `docs/seed_buyer_types_and_document_types.sql` — essentially the same data as V1 above, kept as a manually-runnable copy for environments where Flyway hasn't/won't run it.
- `docs/seed_seller_types_and_document_types.sql` — adds 3 seller types: **White Labeling Company/Marketer (WLM)**, **Distributor (DIS)**, **PCD (PCD)** (comment notes "Manufacturer already exists" though no seed for a Manufacturer row was found anywhere); ~19 document types (drug/FSSAI/cosmetic/medical-device licences, GMP certificate, 4 seller-type-specific agreements, trademark/IEC/import licences); and **one reserved placeholder `tbl_product_type_master` row**: `product_type_name = 'N/A - Seller Level Document'`, `is_active = FALSE` — used as the FK target for seller-level (non-product) document uploads so the NOT NULL constraint on `SellerDocument.product_type_id` can still be satisfied.
- `docs/seed_gst_percentages.sql` — seeds `tm_gst_percentage_master` with GST slabs (0/5/8/10/12 per the discovery inventory's read of this file).

No secrets, credentials, or PII appear in any of the seed rows described above — all are lookup/reference values.

---

## 10. Migration Strategy

**Engine**: Flyway (`org.flywaydb:flyway-core`, no version pin — inherited from `spring-boot-starter-parent`; confirmed no `flyway-database-postgresql` artifact alongside it in `pom.xml`).

**Flyway-scanned location**: `classpath:db/migration` (i.e. `src/main/resources/db/migration/`), explicitly configured in `application-dev.yml` and `application-test.yml` (`enabled: true`, `baseline-on-migrate: true`, `baseline-version: 0`). `application-prod.yml` has **no `spring.flyway` block at all** — it falls back to Flyway's library defaults while `ddl-auto=validate` is set there, meaning prod schema changes must already exist before the app starts.

**Real Flyway migrations found (3 total, all under `src/main/resources/db/migration/`):**

| Version | File | Effect |
|---|---|---|
| V1 | `V1__buyer_type_and_document_type_seed.sql` | `CREATE TABLE IF NOT EXISTS` for `tbl_document_type_master` + `tbl_buyer_type_master`, plus seed data (see §9.1) |
| V2 | `V2__add_buyer_user_password_temporary_column.sql` | Adds `is_password_temporary NOT NULL DEFAULT FALSE` to `tbl_buyer_user` — explicitly to work around a case where Hibernate `ddl-auto=update` failed to add it |
| V3 | `V3__create_legal_content_table.sql` | Creates `tbl_legal_content`, seeds initial BUYER_TERMS/SELLER_TERMS HTML |

**IMPLEMENTED**: Flyway is a real, wired dependency actively running these 3 versioned migrations against `db/migration`.

**⚠️ Real inconsistency — flagged as required by this document's brief, not a hidden Flyway feature:**

There are **8 additional SQL files sitting in `D:/Tiameds_MarketPlace/Backend/pharma-aggregator-server/docs/`** that are **NOT under `src/main/resources/db/migration/`** and therefore **Flyway never executes them**, regardless of their content or naming:

| File (in `docs/`, NOT Flyway-scanned) | What it does | How it must be run |
|---|---|---|
| `migration_add_multi_seller_type_fields.sql` | Adds `state_id`/`district_id`/`taluka_id` FK columns to `tbl_seller_bank_details` and `tbl_temp_seller_bank_details` | Header: "Run this manually against environments where `ddl-auto=validate` (e.g. prod)" |
| `migration_add_signup_flow.sql` | Creates `tbl_signup_otp`, links `tbl_temp_seller` to `tbl_user` | No version prefix; manual |
| `migration_add_document_file_names.sql` | Adds `*_file_name` columns across 4 temp-seller tables | Header explicitly says run on **every** environment including dev/test — because Hibernate `ddl-auto=update` won't add these consistently either |
| `migration_add_draft_support.sql` | Drops `NOT NULL` constraints across 4 temp-seller tables (for draft support) | Header notes Hibernate `ddl-auto=update` never relaxes an existing NOT NULL constraint, so this must be run everywhere |
| `migration_add_unpublished_product_status.sql` | Rebuilds the `tm_product_details_status_check` CHECK constraint to add `UNPUBLISHED` | Header notes `ddl-auto=update` never alters an existing CHECK constraint |
| `seed_seller_types_and_document_types.sql` | Seed data (see §9.3) | `ON CONFLICT DO NOTHING`, manual |
| `seed_buyer_types_and_document_types.sql` | Duplicate of V1's seed data | Manual, for non-dev/test environments |
| `seed_gst_percentages.sql` | Seed data (see §9.3) | Manual |

None of these 8 files follow Flyway's required `V<n>__description.sql` naming convention, and every one carries a header comment instructing **manual execution**. Combined with living entirely outside Flyway's configured `classpath:db/migration` location, this is unambiguous: **these are ad hoc, hand-run scripts, not a hidden or secondary Flyway migration path.** This means:
- A fresh environment provisioned purely by running the Spring Boot app + Flyway (dev/test, where `ddl-auto=update` also runs) will get the 3 Flyway migrations and whatever Hibernate auto-DDL adds, but **will silently be missing** every schema change and CHECK-constraint update described in the 8 `docs/` scripts unless a human runs them by hand.
- Production (`ddl-auto=validate`) is **more exposed** to this gap, since it has no auto-DDL safety net at all — if a required `docs/` migration was never run against a given prod database, the app will fail schema validation at startup or (worse) silently accept application-level values a stale CHECK constraint would reject.
- **`docs/seed_buyer_types_and_document_types.sql`'s content essentially duplicates Flyway's own `V1__buyer_type_and_document_type_seed.sql`** — the discovery inventory's own read of both files found near-identical INSERT statements, suggesting V1 was derived from this docs script for automated dev/test seeding while the docs copy remains the "run this by hand elsewhere" version.

**RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: fold the 8 `docs/*.sql` scripts into properly versioned Flyway migrations (`V4`, `V5`, … in `src/main/resources/db/migration/`) so schema state is guaranteed consistent across dev/test/prod instead of depending on someone remembering to run a script from `docs/` by hand.

---

## Implementation Traceability

| Design Element | Source File | Implementation |
|---|---|---|
| Geographic hierarchy (State→District→Taluka, denormalized) | `entity/master/StateMaster.java`, `DistrictMaster.java`, `TalukaMaster.java` | IMPLEMENTED |
| Seller/Buyer generated business-ID scheme with Postgres advisory locks | `service/serviceImpl/admin/SellerApprovalServiceImpl.java` (lock 12345), `BuyerApprovalServiceImpl.java` (lock 54321) | IMPLEMENTED |
| Two-phase (persist-then-migrate) S3 approval pattern | `SellerApprovalServiceImpl.java`, `BuyerApprovalServiceImpl.java` | IMPLEMENTED |
| Batch/lot inventory with append-only stock ledger | `entity/product/PricingDetails.java`, `entity/product/StockLedger.java`, `service/product/productImpl/StockServiceImpl.java` | IMPLEMENTED |
| `PricingDetails.finalPrice` computed pricing | `entity/product/PricingDetails.java` | NOT IDENTIFIED — column exists, no writer found anywhere in the codebase |
| Order-time GST/discount computation on post-discount taxable amount | `service/order/orderImpl/OrderPlacementServiceImpl.java` (lines ~262-298 per grounding inventory) | IMPLEMENTED |
| AdditionalDiscount / SpecialSchemes auto-applied to order pricing | `entity/product/AdditionalDiscount.java`, `SpecialSchemes.java` | NOT IDENTIFIED — persisted, never read by `OrderPlacementServiceImpl`; no dedicated repository exists for either |
| Soft delete on product batches | `entity/product/PricingDetails.java` (`@SQLRestriction("deleted_at IS NULL")`) | IMPLEMENTED |
| SellerOrder fulfillment state machine (single-step legal transitions) | `service/order/orderImpl/SellerOrderFulfillmentServiceImpl.java` | IMPLEMENTED |
| Order status rollup from child SellerOrders | `service/order/support/OrderStatusRollup.java` | IMPLEMENTED |
| Return/refund per-item flow with 7-day window | `service/order/orderImpl/ReturnRefundServiceImpl.java` | IMPLEMENTED (with documented deviation: no per-item SellerOrderStatus variant) |
| Refund reflected back onto parent Payment | `entity/order/Payment.java`, `PaymentStatus.java` | NOT IDENTIFIED — REFUNDED/PARTIALLY_REFUNDED declared but never set |
| Sequential per-seller-per-FY invoice numbering | `service/order/orderImpl/InvoiceServiceImpl.java`, `repository/order/InvoiceRepository.java` | IMPLEMENTED (documented race condition: plain COUNT query, no advisory lock) |
| Quote Request (RFQ) single-shot negotiation, no counter-offer | `entity/quote/QuoteRequest.java`, `service/quote/QuoteRequestService.java` | IMPLEMENTED (no renegotiation/edit/cancel endpoints found) |
| Row-level authorization (framework layer) | `config/SecurityConfig.java` | NOT IDENTIFIED as active — `anyRequest().permitAll()` is the live rule; role-scoped rules exist only commented out |
| Flyway schema migrations | `src/main/resources/db/migration/V1,V2,V3` | IMPLEMENTED |
| Ad hoc, non-Flyway schema/seed scripts in `docs/` | `docs/migration_*.sql`, `docs/seed_*.sql` | PARTIALLY IMPLEMENTED — real and necessary, but manually run, not tracked by Flyway |
| Data retention / archival policy | — | NOT IDENTIFIED — no code, config, or migration found |
| Explicit DB indexes beyond unique constraints | entity `@Column(unique=true)` annotations only | PARTIALLY IMPLEMENTED — unique constraints present; no `@Index`/DDL index statements found |
| Production RPO/RTO, compliance certifications, external prod URLs | — | Not identified in the current implementation |

---

## Open Questions / Items Not Fully Resolved

See the `openQuestions` field of this task's structured output for the list of entities/columns this pass could not fully verify against a live schema (only against JPA annotations and the grounding inventory's prior file reads), plus the items flagged inline above as NOT IDENTIFIED.
