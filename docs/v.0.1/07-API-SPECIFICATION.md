# API Specification — Pharma Aggregator Platform

## 1. Document Control

| Field | Value |
|---|---|
| Document | API Specification |
| System | pharma-aggregator-server (Spring Boot backend) consumed by pharma-aggregator-client (Next.js 16) |
| Source of truth | Backend source at `D:/Tiameds_MarketPlace/Backend/pharma-aggregator-server/src/main/java/com/example/pharmaaggregatorserver/**`, confirmed against actual `@RequestMapping`/`@GetMapping`/etc. annotations and DTO validation annotations |
| Generated from | Direct source inspection (controllers, DTOs, entities, `SecurityConfig.java`, `application*.yml`) — not from Swagger/OpenAPI output |
| Status | IMPLEMENTED unless explicitly marked otherwise |
| Version scheme | Single unversioned API — see §11 |
| Last verified against code | This inspection pass (see file paths cited throughout) |

This document intentionally uses four precise labels throughout: **IMPLEMENTED**, **PARTIALLY IMPLEMENTED**, **NOT IDENTIFIED**, and **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**. Do not read a recommendation as an existing feature.

---

## 2. API Overview

- **Base path**: `/api/v1` — IMPLEMENTED. Confirmed via `server.servlet.context-path: /api/v1` in `application.yml`, `application-dev.yml`, `application-test.yml`, and `application-prod.yml` (all four files set this identically). This matches the frontend's `NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1` convention documented in this repo's own `CLAUDE.md`.
- **Production Base URL**: **Not identified in the repository.** `application-prod.yml` configures a datasource pointing at a docker-compose-local `postgres-prod` host, not a public production domain, and no `.env.production` or deployed public hostname was found in either repo. The ECS task definition (`D:/Tiameds_MarketPlace/Backend/pharma-aggregator-server/deploy/tiamed-aggregator-task-defination.json`) is for the **test** environment (`pharma-aggregator-test` image/service), not production.
- **Protocol**: HTTP/HTTPS (TLS termination not evidenced in application config — likely handled by a load balancer/ALB outside the repo; **not identified**).
- **Content type**: `application/json` for standard requests; `multipart/form-data` for file-upload endpoints.
- **API documentation tooling**: springdoc-openapi (`springdoc-openapi-starter-webmvc-ui` 2.3.0) — Swagger UI at `/api/v1/swagger-ui`, OpenAPI JSON at `/api/v1/api-docs`. Enabled with "try it out" in dev/test; **explicitly disabled in prod** (`springdoc.swagger-ui.enabled: false` in `application-prod.yml`). Source: `D:/.../config/SwaggerConfig.java`.
- **Database**: PostgreSQL (all profiles); Flyway migrations at `src/main/resources/db/migration` (`V1`–`V3`) plus a large body of manually-run ad hoc SQL under `docs/` (not Flyway-managed — see §9 of the backend's own docs discovery, not repeated here as it is out of scope for an API spec).
- **File storage**: AWS S3 (SDK v2), confirmed via `D:/.../config/S3Config.java` and `D:/.../service/S3Service.java`.

---

## 3. Authentication & Authorization

### 3.1 Mechanism — IMPLEMENTED (application-code level only)

- **Access token**: JWT, HS256, signed via `Keys.hmacShaKeyFor(app.jwt.secret)`. Claims are **subject (username/email) + iat + exp only** — no roles, no userId embedded. Source: `D:/.../security/JwtUtils.java`.
- **Sent as**: `Authorization: Bearer <accessToken>` header, attached by frontend axios interceptors (`src/lib/api.ts`, `src/lib/buyerApi.ts`, `src/utils/api.ts`).
- **Refresh token**: NOT a JWT — a 64-byte `SecureRandom` value, base64url-encoded. Only its **SHA-256 hash** is persisted (`tbl_refresh_tokens` / `tbl_buyer_refresh_tokens`); the raw value is returned to the client exactly once. Refresh is **single-use rotation**: on `/authentication/refresh`, the old row is revoked (`revokedAt` set) and a brand-new access+refresh pair is issued.
- **Access token expiry**: `app.jwt.expiration` = 86,400,000 ms (24h) in dev/test — **PARTIALLY IMPLEMENTED / known misconfiguration**: an inline YAML comment admits this is meant to be 30 minutes in production ("Temporarily set to 24 hours for testing, change back to 30 minutes in production"). `application-prod.yml` defines **no** `app.jwt.*` keys at all — a prod deployment relying only on the checked-in files would fail to resolve `${app.jwt.secret}` unless supplied externally (env vars/secrets manager). Source: `application-dev.yml`, `application-prod.yml` (24 lines, read in full).
- **Refresh token expiry**: `app.jwt.refresh-expiration` = 604,800,000 ms (7 days), dev/test only, same prod gap as above.
- **Password hashing**: BCrypt (`BCryptPasswordEncoder` bean in `SecurityConfig.java`), genuinely consumed across seller/buyer auth services (grep-confirmed).

### 3.2 Critical fact: URL-level authorization is OFF for the entire application — IMPLEMENTED AS PERMIT-ALL (this is a fact about the code, not a recommendation)

`D:/.../config/SecurityConfig.java` line 52 sets:
```java
auth.anyRequest().permitAll()
```
The intended, stricter rule set (require authentication except for swagger/auth/public paths) exists only as a **commented-out block** directly below it. This means:
- Spring Security itself blocks **nothing** at the HTTP layer, for **any** controller in the application (master data, product, order, admin, seller, buyer — all of it).
- The `AuthTokenFilter` still runs and populates `SecurityContextHolder` when a valid Bearer token is present, so **application-code-level checks** (e.g., `resolveAuthenticatedUser()` reading `SecurityContextHolder`, or a controller comparing a path variable to the JWT-derived id) are the *only* real protection that exists anywhere in this backend today.
- `@EnableMethodSecurity` is turned on, but **no `@PreAuthorize`/`@Secured` annotation was found anywhere** in the codebase during discovery — so despite the annotation processor being enabled, it is not actually used to gate anything.

**Practical consequence documented per-endpoint in §4**: "Auth" column values of "None enforced" mean literally callable by anyone with network access; "App-level" means a Java check inside the controller/service reads the JWT principal (if present) and throws 401/403 in code — this is not equivalent to a Spring Security path rule and can be bypassed by any endpoint that forgets to perform the check.

### 3.3 Public vs protected — summary

| Category | Enforcement | Example |
|---|---|---|
| Master/reference data (`/states`, `/districts`, `/product-types`, etc.) | None (Spring Security permits all; no code-level check either) | `GET /states` |
| Seller/Buyer registration create/update | App-level: `resolveAuthenticatedUser()` reads `SecurityContextHolder`; throws 401 if absent | `POST /temp-sellers` |
| Seller/Buyer registration read/admin-verify/list | Mostly **none enforced in code** (a real gap — see findings in discovery) | `GET /temp-sellers`, `PATCH /temp-sellers/{id}/verify/gst` |
| Seller order fulfillment (`/seller-orders/**`) | App-level: seller identity resolved from JWT via `SellerRepository.findByUserId`, ownership checked | `PATCH /seller-orders/{id}/confirm` |
| Buyer order placement/list/cancel | **None enforced** — buyerId trusted as-is from request body/path | `POST /orders`, `GET /orders/buyer/{buyerId}` |
| Admin (`/admin/**`) | **None enforced in code, none in Spring Security** — fully open | `POST /admin/sellers/review`, `POST /admin/orders/{id}/override` |
| Quote requests | App-level: buyer/seller id resolved strictly from JWT | `PATCH /seller/quote-requests/{id}/respond` |

---

## 4. Endpoint List

All paths below are relative to base path `/api/v1`. "Role" reflects the *intended* actor, not an enforced Spring Security role (see §3.2).

### 4.1 Master / Reference Data (`controller/master/**`, `controller/product/*Master*`, `MastersController`)

| Method | Path | Controller | Purpose | Auth | Role | Module |
|---|---|---|---|---|---|---|
| GET | /buyer-types | BuyerTypeMasterController | List active buyer types | None | Any | Master |
| GET | /company-types | CompanyTypeMasterController | List all company types | None | Any | Master |
| GET | /districts | DistrictMasterController | List all districts | None | Any | Master |
| GET | /districts/state/{stateId} | DistrictMasterController | Districts by state (cascade) | None | Any | Master |
| GET | /document-types | DocumentTypeMasterController | List all document types | None | Any | Master |
| GET | /product-types | ProductTypeMasterController | List active product types (excludes placeholder row) | None | Any | Master |
| GET | /seller-types | SellerTypeMasterController | List all seller types | None | Any | Master |
| GET | /states | StateMasterController | List all states | None | Any | Master |
| GET | /talukas | TalukaMasterController | List all talukas | None | Any | Master |
| GET | /talukas/district/{districtId} | TalukaMasterController | Talukas by district (cascade) | None | Any | Master |
| GET | /drugCategory/getAll | DrugCategoryController | Drug categories | None | Any | Product Lookup |
| GET | /molecules/getAllMolecules | MoleculeController | All molecules | None | Any | Product Lookup |
| GET | /molecules/byName | MoleculeController | Molecule by name (query) | None | Any | Product Lookup |
| GET | /molecules/getMoleculeById | MoleculeController | Molecule by id + productAttributeId (query) | None | Any | Product Lookup |
| GET | /molecules/getByTherapeuticSubcategoryId/{id} | MoleculeController | Molecules by therapeutic subcategory | None | Any | Product Lookup |
| GET | /dosageMolecule/strengthFormat/{dosageId} | MoleculeStrengthFormatController | Strength format by dosage | None | Any | Product Lookup |
| GET | /packType/packTypeById/{packTypeId} | PackTypeController | Pack type by id | None | Any | Product Lookup |
| GET | /pack-type-units | PackTypeUnitMasterController | All pack type units | None | Any | Product Lookup |
| GET | /ageGroup/getAll | AgeGroupController | Age groups | None | Any | Product Lookup |
| GET | /dosage/allDosage | DosageFormController | All dosage forms | None | Any | Product Lookup |
| GET | /dosage/categoryId/{categoryId} | DosageFormController | Dosage forms by category | None | Any | Product Lookup |
| GET | /dosage/packType/{dosageId} | DosageFormController | Pack types by dosage | None | Any | Product Lookup |
| GET | /dosage/packType/category/{categoryId} | DosageFormController | Pack types by category | None | Any | Product Lookup |
| GET/POST/PUT/DELETE | /flavours(/{id}) | FlavourController | Flavour CRUD (only fully-CRUD lookup controller) | None | Any | Product Lookup |
| GET | /net-quantity-units/{categoryId} | NetQuantityUnitController | Net quantity units by category | None | Any | Product Lookup |
| GET | /net-quantity-units/productsform | NetQuantityUnitController | Cosmetic product forms | None | Any | Product Lookup |
| GET | /serving-size(/{id}, /dosageForm/{id}, /productForm/{id}) | ServingSizeUnitController | Serving size units | None | Any | Product Lookup |
| GET | /storageConditions/{categoryId} | StorageConditionController | Storage conditions by category | None | Any | Product Lookup |
| GET | /storageConditions/storageConditionsById/{id} | StorageConditionController | Storage condition by id | None | Any | Product Lookup |
| GET | /strengthUnit/category/{categoryId}, /strengthUnit/{id} | StrengthUnitController | Strength units | None | Any | Product Lookup |
| GET | /gst-percentages | GstPercentageMasterController | GST % reference list | None | Any | Product Lookup |
| GET | /therapeutic/** (6 endpoints) | TherapeuticController | Therapeutic category/subcategory lookups | None | Any | Product Lookup |
| GET | /productForm/getAll | ProductFormMasterController | Product forms | None | Any | Product Lookup |
| GET | /productCategory/getProductCategory/{categoryId} | ProductCategoryController | Product categories | None | Any | Product Lookup |
| GET | /productCategory/getProductSubcategory/{id} | ProductCategoryController | Product subcategories | None | Any | Product Lookup |
| GET | /masters/countries, /masters/storagecondition, /masters/consumable-material-types, /masters/device-categories(/{type}), /masters/intended-use-areas, /masters/device-sub-categories(/{categoryId}), /masters/non-consumable-material-types, /masters/certifications(/categoryId/{id}), /masters/power-sources, /masters/hair-types, /masters/skin-types, /masters/by-subcategory/{id} | MastersController | 12-endpoint umbrella of misc lookups | None | Any | Product Lookup |
| GET | /pricing/validateBatchNumber | PricingDetailsController | Check batch-lot-number uniqueness | Authentication required | Seller | Stock/Pricing |
| GET | /ifsc/{ifscCode} | IFSCOverrideController | Manual IFSC bank override lookup | None (`@CrossOrigin(origins="*")`) | Any | Misc |
| GET | /content/{contentKey} | LegalContentController | Legal content (terms) by key | None | Any | Misc |
| GET | /, /health, /test-health, /public/health-check | HomeController | Health/root info | None | Any | Misc |

### 4.2 Product Catalog (`controller/product/**`)

| Method | Path | Controller | Purpose | Auth | Role | Module |
|---|---|---|---|---|---|---|
| POST | /products/create | ProductDetailsController | Create a single product (never merges) | Authentication required | Seller | Product |
| GET | /products/getAll | ProductDetailsController | List authenticated seller's products | Authentication required | Seller | Product |
| GET | /products/getById/{productId} | ProductDetailsController | Get one product (owner-restricted) | Authentication required | Seller | Product |
| GET | /products/all | ProductDetailsController | List all PUBLISHED products, all sellers | **None enforced in this method** | Buyer/Public | Product |
| DELETE | /products/delete/{productId} | ProductDetailsController | Delete product + S3 images (owner-only) | Authentication required | Seller | Product |
| PUT | /products/update/{productId} | ProductDetailsController | Update product (owner-only) | Authentication required | Seller | Product |
| POST | /products/{productId}/packaging | ProductDetailsController | Add packaging variant | Authentication required | Seller | Product |
| GET | /products/subcategories/{categoryId} | ProductDetailsController | Therapeutic subcategories for category | None enforced | Any | Product |
| POST | /products/import | ProductImportController | Bulk import via Excel/CSV | Authentication required | Seller | Product Import |
| POST | /product-images/{productId} | ProductImageController | Upload product images (multipart) | None enforced in controller | Seller | Product |
| GET | /product-images/getImg/{productId} | ProductImageController | List image URLs | None enforced | Any | Product |
| POST | /product-documents/{category}/{productAttributeId}/certificates | ProductDocumentController | Upload/replace certificates (5 category variants: non-consumable, consumable, supplements, cosmetic, food) | Authentication required (used only for uploadedBy) | Seller | Product |
| POST | /product-documents/{category}/{productAttributeId}/brochure | ProductDocumentController | Upload/replace brochure PDF (4 variants — no Food&Infant brochure endpoint exists) | Authentication required | Seller | Product |
| POST | /userManual/{productAttributeId} | ProductUserManualController | Upload Drug user manual (1:1) | None enforced | Seller | Product |
| POST | /userManual/new/{productAttributeId} | ProductUserManualController | Upload Food&Infant user manual column | None enforced | Seller | Product |
| POST | /nutritionalInformationImage/{productAttributeId} | NutritionalInformationImageController | Upload nutritional info image (Supplements/Food&Infant) | None enforced | Seller | Product |
| GET | /stock/{productId}/total, /batches, /debited-total, /added-total | StockController | Stock read queries | None declared on method | Any | Stock |
| POST | /stock/add | StockController | Add/restock a batch | Authentication required | Seller | Stock |
| POST | /stock/add-batches | StockController | Add multiple batches | Authentication required | Seller | Stock |
| POST | /stock/debit | StockController | FIFO debit stock | Authentication required | Seller | Stock |
| DELETE | /stock/{productId}/batches/{pricingId} | StockController | Soft-delete a batch | Authentication required | Seller | Stock |

### 4.3 Seller Registration / Temp-Seller (`controller/temp/seller/**`)

| Method | Path | Controller | Purpose | Auth | Role | Module |
|---|---|---|---|---|---|---|
| POST | /temp-sellers | TempSellerController | Create full registration (status=OPEN) | App-level: JWT required | Seller | Onboarding |
| GET | /temp-sellers | TempSellerController | List all registrations (admin queue) | **None enforced** | Admin (intended) | Onboarding |
| GET | /temp-sellers/{id} | TempSellerController | Fetch one registration | None enforced | Any | Onboarding |
| GET | /temp-sellers/user/{userId} | TempSellerController | Find registration by user id | None enforced | Any | Onboarding |
| PATCH | /temp-sellers/{id}/verify/gst, /verify/document, /verify/bank, /verify/company-registration-certificate | TempSellerController | Admin per-field verification toggles | None enforced | Admin (intended) | Onboarding |
| DELETE | /temp-sellers/{id} | TempSellerController | Delete registration + S3 files | None enforced | Any | Onboarding |
| DELETE | /temp-sellers/both/{id} | TempSellerController | Delete registration + approved Seller | None enforced | Any | Onboarding |
| GET | /temp-sellers/coordinator/check-{email,phone,document,gstnumber} | TempSellerController | Registration-time uniqueness checks | None | Any | Onboarding |
| GET | /temp-sellers/coordinator/check-profile{email,phone,document,gstnumber} | TempSellerController | Profile-update-time uniqueness checks | None | Any | Onboarding |
| POST | /temp-sellers/{tempSellerId}/documents/upload | TempSellerController | Multipart document upload | None enforced | Seller | Onboarding |
| DELETE | /temp-sellers/{tempSellerId}/files/{company-registration-certificate,gst,authorization-letter,bank-document} | TempSellerController | Delete individual S3 file | None enforced | Seller | Onboarding |
| DELETE | /temp-sellers/{tempSellerId}/documents/{documentId}/file | TempSellerController | Delete one license file | None enforced | Seller | Onboarding |
| PUT | /temp-sellers/{tempSellerId} | TempSellerController | Edit registration (only from CORRECTION_REQUIRED/DRAFT); sets RESUBMITTED | None enforced in handler | Seller | Onboarding |
| POST | /temp-sellers/draft | TempSellerController | Create DRAFT (partial, no validation) | App-level: JWT required when no tempSellerId | Seller | Onboarding |
| PUT | /temp-sellers/draft/{tempSellerId} | TempSellerController | Update DRAFT | None enforced beyond status check | Seller | Onboarding |
| POST | /temp-sellers/draft/{tempSellerId}/finalize | TempSellerController | Promote DRAFT→OPEN (full validation) | None enforced in handler | Seller | Onboarding |
| POST | /temp-seller/email-otp/send, /exist/send, /verify | TempSellerEmailOtpController | Self-hosted email OTP for registration | None | Any | Onboarding |
| POST | /otp/send, /verify | SMSOTPController | SMS OTP via Twilio Verify | None | Any | Onboarding |
| POST | /independent/email/send-confirmation, /send, /send-quick | IndependentEmailController | Standalone email sender | None | Any | Onboarding |
| GET | /independent/email/status/{id} | IndependentEmailController | Email send status (in-memory only, not durable) | None | Any | Onboarding |

### 4.4 Seller Auth / Password / Profile

| Method | Path | Controller | Purpose | Auth | Role | Module |
|---|---|---|---|---|---|---|
| POST | /auth/signup | SignupController | Email+password signup, sends OTP | None | Seller (signup-first) | Auth |
| POST | /auth/signup/verify-otp | SignupController | Verify OTP, create `tbl_user` row (no token issued) | None | Seller | Auth |
| POST | /auth/reset-password | AuthController | First-time password change (temp password) | None (no JWT check; username in body) | Seller | Auth |
| POST | /auth/forgot-password | AuthController | Send password-reset OTP | None | Seller | Auth |
| POST | /auth/verify-otp | AuthController | Verify forgot-password OTP, issue reset token | None | Seller | Auth |
| POST | /auth/validate-reset-token | AuthController | Validate reset token | None | Seller | Auth |
| POST | /auth/reset-password-with-token | AuthController | Set new password via token | None | Seller | Auth |
| POST | /authentication/login | AuthenticationController | Step 1: password check, sends login OTP | None | Seller | Auth |
| POST | /authentication/verify-otp | AuthenticationController | Step 2: verify OTP, issue JWT+refresh | None | Seller | Auth |
| POST | /authentication/refresh | AuthenticationController | Rotate refresh token | None (refresh token is the credential) | Seller | Auth |
| POST | /authentication/logout | AuthenticationController | Revoke refresh token | None enforced | Seller | Auth |
| PUT | /sellers/{sellerId}/request-update | SellerProfileController | Submit profile-edit request (creates PendingSeller) | None enforced | Seller | Profile |
| GET | /sellers/user/{userId} | SellerProfileController | Find Seller by auth user id | None enforced | Seller | Profile |
| POST | /sellers/{pendingSellerId}/documents/upload | SellerProfileController | Upload profile-edit documents | None enforced | Seller | Profile |
| DELETE | /sellers/pendingSellerId/{pendingSellerId} | SellerProfileController | Rollback pending profile edit | None enforced | Seller | Profile |
| GET | /sellers/product-types | SellerProfileController | Product types for current seller | Authentication required | Seller | Profile |
| GET | /sellers | SellerProfileController | List all sellers | None enforced | Admin (intended) | Profile |
| DELETE | /sellers/{sellerId} | SellerProfileController | Delete a Seller | None enforced | Admin (intended) | Profile |

### 4.5 Admin (Seller/Buyer/Order Review) — `controller/admin/**`, `controller/seller/profile/**`

| Method | Path | Controller | Purpose | Auth | Role | Module |
|---|---|---|---|---|---|---|
| POST | /admin/sellers/review | AdminSellerController | ACCEPT/REJECT/CORRECTION on a TempSeller | **None enforced anywhere** (Spring Security permitAll + no code check) | Admin (intended, unenforced) | Admin |
| POST | /admin/buyers/review | AdminBuyerController | ACCEPT/REJECT/CORRECTION on a TempBuyer | **None enforced anywhere** | Admin (intended, unenforced) | Admin |
| GET | /admin/orders | AdminOrderController | List all orders (optional `status` filter) | **None enforced** | Admin (intended, unenforced) | Admin |
| POST | /admin/orders/{orderId}/override | AdminOrderController | Force every SellerOrder under an order to an arbitrary status | **None enforced** | Admin (intended, unenforced) | Admin |
| GET | /admin/seller-requests/pending, /pending/{id} | AdminSellerApprovalController | List/get pending profile-edit requests | None enforced | Admin (intended) | Admin |
| GET | /admin/seller-requests/{sellerId} | AdminSellerApprovalController | Fetch a live approved Seller | None enforced | Admin (intended) | Admin |
| POST | /admin/seller-requests/{id}/approve, /reject, /batch-approve | AdminSellerApprovalController | Approve/reject profile-edit request(s) | None enforced | Admin (intended) | Admin |

Note that the frontend has **no consuming UI at all** for `/admin/**` (confirmed via `CLAUDE.md` and a repo-wide grep for these paths in `src/`) — these endpoints exist and are reachable but are not called from this Next.js app.

### 4.6 Order, Payment, Invoice, Return (`controller/order/**`)

| Method | Path | Controller | Purpose | Auth | Role | Module |
|---|---|---|---|---|---|---|
| POST | /orders | OrderController | Place a consolidated order (COD, settled immediately) | **None enforced**; buyerId trusted from body | Buyer | Order |
| GET | /orders/{orderId} | OrderController | Order detail | None enforced | Buyer | Order |
| GET | /orders/buyer/{buyerId} | OrderController | List a buyer's orders | None enforced | Buyer | Order |
| POST | /orders/{orderId}/cancel | OrderController | Cancel whole order (eligible children only) | App-level: actorRole/actorId from body, checked against order.buyer | Buyer | Order |
| GET | /seller-orders/{sellerOrderId} | SellerOrderController | Fetch one SellerOrder | App-level: JWT-resolved seller, ownership enforced | Seller | Order |
| GET | /seller-orders/seller/{sellerId} | SellerOrderController | List seller's orders (optional `status`) | App-level: JWT-resolved seller (path `{sellerId}` ignored) | Seller | Order |
| PATCH | /seller-orders/{id}/confirm, /pack, /ship, /out-for-delivery, /deliver, /resend-delivery-otp, /cancel | SellerOrderController | Fulfillment state machine + OTP-gated delivery | App-level: JWT-resolved seller, ownership enforced | Seller | Order |
| POST | /invoices/generate/{sellerOrderId} | InvoiceController | Generate/re-fetch GST invoice PDF | None enforced | Seller | Order |
| GET | /invoices/{invoiceId} | InvoiceController | Invoice metadata | None enforced | Any | Order |
| GET | /payments/{paymentId} | PaymentController | Read-only payment lookup (COD-only, no gateway) | None enforced | Any | Order |
| POST | /returns | ReturnController | Request a return (7-day window, DELIVERED only) | None enforced; buyerId trusted from body | Buyer | Order |
| PATCH | /returns/{id}/decision | ReturnController | Seller approves/rejects a return | None enforced; sellerId trusted from body | Seller | Order |
| GET | /returns/{id} | ReturnController | Fetch a return request | None enforced | Any | Order |
| POST | /returns/refunds/{refundId}/process | ReturnController | Mark refund COMPLETED, restock, seller order → RETURNED | **None enforced at all** | System/Admin (intended) | Order |

### 4.7 Quote Requests (RFQ / Price Request) — `controller/quote/**`

| Method | Path | Controller | Purpose | Auth | Role | Module |
|---|---|---|---|---|---|---|
| POST | /buyer/quote-requests | BuyerQuoteRequestController | Submit PRICE_REQUEST/RFQ (guest allowed) | Optional JWT (guest if absent/not ROLE_BUYER) | Buyer/Guest | Quote |
| GET | /buyer/quote-requests | BuyerQuoteRequestController | List buyer's requests | App-level: ROLE_BUYER required | Buyer | Quote |
| PATCH | /buyer/quote-requests/{id}/accept | BuyerQuoteRequestController | Accept a QUOTED request | App-level: ROLE_BUYER + ownership | Buyer | Quote |
| PATCH | /buyer/quote-requests/{id}/reject | BuyerQuoteRequestController | Reject a QUOTED request | App-level: ROLE_BUYER + ownership | Buyer | Quote |
| GET | /seller/quote-requests | SellerQuoteRequestController | List requests for seller's products | App-level: ROLE_SELLER + Seller profile resolved | Seller | Quote |
| PATCH | /seller/quote-requests/{id}/respond | SellerQuoteRequestController | One-shot price response (PENDING→QUOTED) | App-level: ROLE_SELLER + ownership | Seller | Quote |

### 4.8 Buyer Auth / Signup / Profile

| Method | Path | Controller | Purpose | Auth | Role | Module |
|---|---|---|---|---|---|---|
| POST | /buyer/auth/signup | BuyerSignupController | Email+phone+password signup, sends OTP | None | Buyer | Auth |
| POST | /buyer/auth/signup/verify-otp | BuyerSignupController | Verify OTP, create `tbl_buyer_user` (no token) | None | Buyer | Auth |
| POST | /buyer/authentication/login | BuyerAuthenticationController | Password check, sends login OTP | None | Buyer | Auth |
| POST | /buyer/authentication/verify-otp | BuyerAuthenticationController | Verify OTP, issue JWT+refresh | None | Buyer | Auth |
| POST | /buyer/authentication/refresh | BuyerAuthenticationController | Rotate refresh token | None | Buyer | Auth |
| POST | /buyer/authentication/reset-password | BuyerAuthenticationController | Temp-password first-time reset | None | Buyer | Auth |
| GET | /buyer/authentication/me | BuyerAuthenticationController | Current buyer identity | Authentication required | Buyer | Auth |
| POST | /buyer/authentication/logout | BuyerAuthenticationController | Revoke refresh token | None enforced | Buyer | Auth |
| GET | /buyer/profile/by-user/{buyerUserId} | BuyerProfileController | Resolve Buyer business id from BuyerUser id | App-level: self or ROLE_ADMIN | Buyer | Profile |

### 4.9 Buyer Registration / Temp-Buyer (`controller/temp/buyer/**`)

| Method | Path | Controller | Purpose | Auth | Role | Module |
|---|---|---|---|---|---|---|
| POST | /temp-buyers | TempBuyerController | Create full registration (status=SUBMITTED) | None enforced | Buyer | Onboarding |
| GET | /temp-buyers | TempBuyerController | List all (admin queue) | App-level: ROLE_ADMIN required | Admin | Onboarding |
| GET | /temp-buyers/{id}, /user/{userId} | TempBuyerController | Fetch registration | None enforced | Any | Onboarding |
| PATCH | /temp-buyers/{id}/verify/gst, /verify/pan, /verify/document | TempBuyerController | Admin verification toggles | None enforced | Admin (intended) | Onboarding |
| DELETE | /temp-buyers/{id}, /both/{id} | TempBuyerController | Delete registration (+approved Buyer) | App-level: owner or ROLE_ADMIN | Buyer/Admin | Onboarding |
| GET | /temp-buyers/contact/check-{email,phone,gstnumber,pannumber,document} | TempBuyerController | Uniqueness checks | None | Any | Onboarding |
| POST | /temp-buyers/{tempBuyerId}/documents/upload | TempBuyerController | Multipart document upload | None enforced | Buyer | Onboarding |
| DELETE | /temp-buyers/{tempBuyerId}/files/{gst,pan,org-logo} | TempBuyerController | Delete individual S3 file | None enforced | Buyer | Onboarding |
| DELETE | /temp-buyers/{tempBuyerId}/documents/{documentId}/file | TempBuyerController | Delete one license file | None enforced | Buyer | Onboarding |
| PUT | /temp-buyers/{tempBuyerId} | TempBuyerController | Full update (non-terminal status only) | None enforced | Buyer | Onboarding |
| POST | /temp-buyers/draft | TempBuyerController | Create DRAFT | None | Buyer | Onboarding |
| PUT | /temp-buyers/draft/{tempBuyerId} | TempBuyerController | Update DRAFT | None | Buyer | Onboarding |
| POST | /temp-buyers/draft/{tempBuyerId}/finalize | TempBuyerController | Promote DRAFT→SUBMITTED | None | Buyer | Onboarding |

---

## 5. Request Schema (Key Endpoints)

### 5.1 `POST /auth/signup` — Seller Signup

- **Headers**: `Content-Type: application/json`
- **Body** (`SignupRequest`):
```json
{ "email": "seller@example.com", "password": "P@ssw0rd1" }
```
- **Validation**: password strength enforced client-side and mirrored server-side per `TempBuyer`-analogous rules found elsewhere (min 8 chars, uppercase, lowercase, digit, special char) — for the seller `SignupRequest` DTO body itself, exact field-level `@Size`/`@Pattern` annotations were **not independently opened in this pass**; behavior confirmed via `SignupService.sendSignupOtp()` (checks `existsByUsername`, generates OTP, emails it).

### 5.2 `POST /authentication/login` — Seller Login (Step 1)

- **Body**:
```json
{ "username": "seller@example.com", "password": "P@ssw0rd1" }
```
- **Behavior**: `AuthenticationManager.authenticate()` BCrypt check; locks account after 5 failed attempts (`MAX_LOGIN_FAILED_ATTEMPTS`); on success emails a 6-digit OTP (5 min expiry).

### 5.3 `POST /authentication/verify-otp` — Seller Login (Step 2)

- **Body**:
```json
{ "username": "seller@example.com", "otp": "482913" }
```
- **Behavior**: OTP locks after 3 wrong attempts (`MAX_OTP_FAILED_ATTEMPTS`); on success issues `accessToken` (JWT) + `refreshToken` (opaque).

### 5.4 `POST /temp-sellers` — Seller Registration (Full Submit)

- **Headers**: `Authorization: Bearer <accessToken>` (required — `resolveAuthenticatedUser()` throws 401 otherwise)
- **Body** (`TempSellerRequestDTO`, `@Valid`): company name/address (state/district/taluka FKs), company type, seller type, product type ids, coordinator (name/designation/email/mobile), bank details, GST number, documents array (each with `productTypeId` or `documentTypeId`, document number, issue/expiry dates).
- **Validation**: Full bean validation — required fields per `SellerTypeFieldValidator.validate()` (per-seller-type mandatory agreements/documents), GST format, coordinator email/mobile uniqueness (pre-checked via the `/coordinator/check-*` endpoints).
- **Example** (abbreviated):
```json
{
  "companyName": "Acme Pharma Pvt Ltd",
  "companyTypeId": 1,
  "sellerTypeId": 2,
  "productTypeIds": [3, 5],
  "address": { "stateId": 12, "districtId": 45, "talukaId": 210, "street": "MG Road", "pinCode": "560001" },
  "coordinator": { "name": "Jane Doe", "designation": "Manager", "email": "jane@acme.com", "mobile": "9876543210" },
  "gstNumber": "29ABCDE1234F1Z5",
  "bankDetails": { "accountNumber": "123456789012", "ifscCode": "HDFC0001234", "bankName": "HDFC Bank" }
}
```

### 5.5 `POST /temp-seller/email-otp/send` and `/verify`

- Body: `{ "email": "coordinator@acme.com" }` → emails 6-digit code (5 min expiry, self-hosted, no attempt lock).
- Verify body: `{ "email": "coordinator@acme.com", "otp": "104822" }`.

### 5.6 `POST /products/create` — Product Creation (Drug example)

- **Headers**: `Authorization: Bearer <accessToken>` (required)
- **Body**: category-specific DTO — for Drug: `productName` (3-150 chars, alnum+special regex), `molecules[]` (min 1, each with `moleculeId`+`strength`), `manufacturerName`, `description` (≤1000 chars), `categoryId`, `therapeuticCategoryId`/`therapeuticSubcategoryId`, `storageConditionIds[]` (min 1), `hsnCode` (4/6/8 digits), `gstPercentage` (enum {0,5,12,18}), and — on manual create only — **no packaging/pricing fields** (those are attached afterward via `POST /products/{productId}/packaging` and `POST /stock/add`).
- **Validation** (server-side, `DrugImportStrategy`/`ProductDetailsServiceImpl.setChildRelationships`): storage conditions required (min 1); molecule/strength counts must match 1:1.
- **Example**:
```json
{
  "productName": "Paracetamol 500mg",
  "manufacturerName": "Acme Pharma",
  "categoryId": 1,
  "therapeuticCategoryId": "TC001",
  "therapeuticSubcategoryId": "TSC004",
  "molecules": [ { "moleculeId": 12, "strength": "500mg" } ],
  "storageConditionIds": [3],
  "hsnCode": "3004",
  "gstPercentage": 12,
  "description": "Antipyretic and analgesic tablet."
}
```

### 5.7 `POST /products/import` — Bulk Import

- **Headers**: `Authorization: Bearer <accessToken>`, `Content-Type: multipart/form-data`
- **Form fields**: `file` (`.xlsx`/`.xls`/`.csv`), `categoryId` (query or form param).
- **Behavior**: dispatches to the matching `ProductImportStrategy` bean by `Category.categoryName`; rows start at index 2; validation collects **all** violations before throwing (`ValidationException`), not fail-fast; successful rows call `createProduct(dto, userId, true)` — `true` enables merge-into-existing-product-as-new-variant when seller+productName+manufacturerName+categoryId match.

### 5.8 `POST /stock/add` — Add/Restock a Batch

- **Headers**: `Authorization: Bearer <accessToken>`
- **Body** (`StockInRequestDto`):
```json
{
  "productId": "ACPA00042",
  "packagingId": "PKG00012",
  "batchLotNumber": "BATCH2024A",
  "manufacturingDate": "2024-01-15",
  "expiryDate": "2026-01-15",
  "stockQuantity": 500,
  "mrp": 50.00,
  "sellingPrice": 42.00,
  "discountPercentage": 5,
  "gstPercentage": 12,
  "hsnCode": "3004",
  "referenceType": "MANUAL_STOCK_UPDATE"
}
```
- **Validation/behavior**: batch identity = `(productId[, packagingId], batchLotNumber)`. If an existing batch matches and `expiryDate` is identical → restock (**only** `stockQuantity` is incremented; pricing fields on the existing row are left untouched even if different values are sent). If `expiryDate` differs → `400 BadRequestException` ("already exists ... with a different expiry date"). If `packagingId` is omitted and the product has more than one packaging variant → `400 BadRequestException`.

### 5.9 `POST /orders` — Place Order (COD)

- **Body** (`PlaceOrderRequestDTO`): `buyerId`, delivery address fields, cart line items (`productId`/`pricingId`, `quantity`) or a `quoteRequestId` (uses the quote's negotiated price instead of live selling price), optional `idempotencyKey`.
- **Validation**: packaging min/max order quantity enforced when present; stock checked via `hasSufficientStock` then debited via FIFO-locked `debitStock`; a line that cannot be fulfilled is dropped into `rejectedLines` (partial-success model) rather than failing the whole order — unless **every** line fails, in which case `400 BadRequestException`.
- **Example**:
```json
{
  "buyerId": "HOHOS0007",
  "deliveryAddress": { "line1": "12 MG Road", "city": "Bengaluru", "state": "Karnataka", "pinCode": "560001" },
  "items": [ { "productId": "ACPA00042", "pricingId": "ACBTCH00019", "quantity": 10 } ],
  "idempotencyKey": "b2f1c9d0-req-001"
}
```

### 5.10 `PATCH /seller-orders/{sellerOrderId}/deliver` — OTP-Gated Delivery Confirmation

- **Headers**: `Authorization: Bearer <accessToken>` (seller, ownership enforced)
- **Body** (`DeliverSellerOrderRequestDTO`): `{ "otp": "738291" }` — note the DTO also declares a `@NotBlank sellerId` field that the controller **never actually reads** (dead required field — confirmed in source).
- **Behavior**: requires current status `OUT_FOR_DELIVERY`; OTP verified via Twilio before any state mutation; on success transitions to `DELIVERED` and best-effort generates an `Invoice`.

### 5.11 `PATCH /seller/quote-requests/{quoteRequestId}/respond` — Seller Quote Response

- **Body** (`SellerQuoteResponseDTO`): `quotedPrice` (required, positive `BigDecimal`), `quoteValidUntil` (optional date), `sellerNotes` (optional).
- **Validation**: only legal while status is `PENDING`, else `400` "This request has already been responded to."

---

## 6. Response Schema (Success + Error, Key Endpoints)

### 6.1 General envelope inconsistency — IMPLEMENTED (documented fact, not a design choice worth relying on)

Two response shapes coexist in the backend:
1. **Raw body**: e.g. `ProductDetailsController.getAll` returns `List<ProductDetailsDto>` directly, no wrapper.
2. **`ApiResponse<T>` envelope**: `{ "status": "SUCCESS", "message": "Request processed successfully", "data": <T>, "count": <int> }` — applied globally to any *not-already-wrapped* 2xx response by `GlobalResponseHandler` (a `ResponseBodyAdvice`), except when the body is already an `ApiResponse` or the underlying status is ≥400.

`count` in list responses is simply `data.size()` — **it is not a page total**, because there is no pagination anywhere in the backend (see §9).

### 6.2 `POST /authentication/verify-otp` — Success (200)

```json
{
  "status": "SUCCESS",
  "message": "Request processed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "R9x2kP...base64url...",
    "tokenType": "Bearer",
    "username": "seller@example.com",
    "passwordTemporary": false
  }
}
```

### 6.3 `POST /temp-sellers` — Success (200/201)

```json
{
  "status": "SUCCESS",
  "message": "Request processed successfully",
  "data": {
    "tempSellerId": 118,
    "sellerRequestId": "REQ-2026-000118",
    "status": "OPEN"
  }
}
```

### 6.4 `POST /products/create` — Success

```json
{
  "status": "SUCCESS",
  "message": "Request processed successfully",
  "data": {
    "productId": "ACPA00042",
    "productAttributeId": "6f2a1c9e-...-uuid",
    "certificateDocuments": [
      { "documentId": 501, "certificateUrl": "NOT_UPLOADED" }
    ]
  }
}
```

### 6.5 `POST /stock/add` — Success

```json
{
  "status": "SUCCESS",
  "message": "Request processed successfully",
  "data": {
    "pricingId": "ACBTCH00019",
    "batchLotNumber": "BATCH2024A",
    "quantity": 500,
    "balanceAfter": 500,
    "transactionType": "STOCK_IN"
  }
}
```

### 6.6 `POST /orders` — Success (Partial Fulfillment Example)

```json
{
  "status": "SUCCESS",
  "message": "Request processed successfully",
  "data": {
    "orderId": "ORD-20260831-00042",
    "status": "PLACED",
    "sellerOrders": [
      { "sellerOrderId": "SORD-00042-1", "sellerId": "ACMFG0007", "status": "PLACED", "grandTotal": 420.00 }
    ],
    "rejectedLines": []
  }
}
```

### 6.7 Error Response Shapes — IMPLEMENTED (three competing shapes — see §7)

`{status, message}` (`ErrorResponse.java`, via `GlobalExceptionHandler`):
```json
{ "status": 400, "message": "Selling price cannot exceed MRP" }
```

Field-validation errors (`MethodArgumentNotValidException`, via `GlobalExceptionHandler`, wrapped in `ApiResponse`):
```json
{
  "status": "FAILURE",
  "message": "Validation failed",
  "data": { "gstNumber": "must match pattern ^[0-9]{2}[A-Z]{5}...", "coordinator.email": "must be a valid email" }
}
```

`AuthEntryPointJwt` 401 shape (Spring Security's own handler, for unauthenticated access where a code path does check):
```json
{ "status": 401, "error": "Unauthorized", "message": "Full authentication is required to access this resource", "path": "/api/v1/..." }
```

---

## 7. Status Codes & Error Dictionary

| HTTP Code | Meaning here | Source |
|---|---|---|
| 200 | Success | All controllers |
| 400 | Bad request — validation failure, illegal state transition (e.g. wrong order status, batch expiry mismatch), or `ApplicationException` default | `ApplicationException.java` defaults to 400; `BadRequestException` |
| 401 | Unauthorized — invalid/missing JWT, bad OTP/password, or `resolveAuthenticatedUser()` finding no principal | `UnauthorizedException`; `AuthEntryPointJwt` |
| 403 | Forbidden — account locked/inactive | `AccountLockedException`, `AccountInactiveException` (handled only by `GlobalLogInExceptionHandler`) |
| 404 | Not found | `NotFoundException` (fixed 404), `ResourceNotFoundException` |
| 409 | Not formally used as a distinct exception type — duplicate-email/phone conflicts are generally surfaced as 400 via `ApplicationException`. **NOT IDENTIFIED**: no dedicated `ConflictException`/409 mapping found in `GlobalExceptionHandler`. |
| 429 | OTP rate-limited (login OTP lock after 3 attempts) — surfaced via a specific exception type inside `AuthService.verifyOtpAndIssueToken()` per discovery notes; exact class name not independently re-verified in this pass. |
| 500 | Unhandled exception | Generic `Exception` catch-all in both `GlobalExceptionHandler` and the separate `GlobalLogInExceptionHandler` |

### 7.1 Duplicate/competing exception handling — IMPLEMENTED (a real defect, documented as fact)

Three separate `@RestControllerAdvice`/`ResponseBodyAdvice` classes exist and overlap:
1. `D:/.../exception/GlobalExceptionHandler.java` — `BaseException`, `MethodArgumentNotValidException`, `ResourceNotFoundException`, `BadRequestException`, `UnauthorizedException`, `ResponseStatusException`, generic `Exception`.
2. `D:/.../exception/GlobalLogInExceptionHandler.java` — a **second**, differently-shaped handler for `MethodArgumentNotValidException` (again), `InvalidCredentialsException`, `AccountLockedException`, `AccountInactiveException`, and its own generic `Exception` (again).
3. `D:/.../response/GlobalResponseHandler.java` — wraps all successful (non-error, non-already-wrapped) bodies in `ApiResponse`.

Having two handlers for `MethodArgumentNotValidException` and two for generic `Exception` means the exact response shape for a given validation error or crash depends on Spring's advice-ordering, which is **not deterministic from reading either file alone** — flagged as-is, not resolved.

### 7.2 Custom application exceptions

| Class | Base | Default status |
|---|---|---|
| `BaseException` | `RuntimeException` | carries its own `HttpStatus` |
| `ApplicationException` | `BaseException` | 400 (or explicit) |
| `NotFoundException` | `BaseException` | 404 (fixed) |
| `InvalidCredentialsException`, `AccountLockedException`, `AccountInactiveException` | plain exceptions, handled only in `GlobalLogInExceptionHandler` | 401 / 403 / 403 |

No numeric "custom error code" scheme (e.g. `ERR_1042`) was found anywhere — errors are HTTP status + free-text `message` only. **NOT IDENTIFIED.**

---

## 8. Rate Limiting / Throttling

**No application-level rate limiting was identified.** Searched: `SecurityConfig.java`, all controller classes, `pom.xml` (no Bucket4j/resilience4j/rate-limiter dependency), and application YAML files. The only "limiting" behavior present is domain-specific lockout logic (5 failed login attempts locks an account; 3 failed OTP attempts locks that OTP) — this is account-security lockout, not a request-rate limiter, and it applies per-credential, not per-IP or per-client.

---

## 9. Pagination / Filtering / Sorting

**No pagination exists anywhere in this backend.** Verified by grepping the entire controller tree for `Pageable`, `PageRequest`, `Sort.by`, `page`, `size`, `limit`, `offset` — the only hit was one dead, commented-out `Sort.by` line in `SellerApprovalServiceImpl.java`. Every list endpoint (`/products/getAll`, `/products/all`, `/sellers`, `/temp-sellers`, `/temp-buyers`, `/buyer/quote-requests`, `/admin/orders`, etc.) returns the **entire** result set in one response.

- **The only real query-parameter filter found**: an optional `status` string on two order-list endpoints — `GET /admin/orders?status=SHIPPED` and `GET /seller-orders/seller/{sellerId}?status=SHIPPED` (exact match via `findByStatus`).
- **Cascading master-data filters use path variables, not query params**: `GET /districts/state/{stateId}`, `GET /talukas/district/{districtId}`, `GET /dosage/packType/{dosageId}`, etc.
- **Frontend behavior**: `src/app/seller_7a3b9f2c/dashboard/components/ProductList.tsx` fetches the *entire* unpaginated product list via `GET /products/getAll`, then performs search (`Array.filter`), sort (`sortData()` helper), and pagination (hardcoded `PAGE_SIZE = 10`, `Array.slice()`) **entirely client-side in the browser** — none of `searchTerm`/`categoryFilter`/`stockFilter`/`statusFilter`/`sortOption`/`currentPage` is ever sent to the backend as a request parameter.
- **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: introduce `page`/`size`/`sort` query parameters backed by Spring Data `Pageable` on high-volume list endpoints (`/products/getAll`, `/products/all`, `/sellers`, `/temp-sellers`) before production data volume makes full-list responses impractical.

---

## 10. Sample Requests / Responses

### 10.1 Seller Login (full round trip)

**Request 1**
```http
POST /api/v1/authentication/login HTTP/1.1
Content-Type: application/json

{ "username": "demo.seller@example.com", "password": "DemoPass1!" }
```
**Response 1** — `200 OK`
```json
{ "status": "SUCCESS", "message": "OTP sent to registered email", "data": null }
```

**Request 2**
```http
POST /api/v1/authentication/verify-otp HTTP/1.1
Content-Type: application/json

{ "username": "demo.seller@example.com", "otp": "512309" }
```
**Response 2** — `200 OK`
```json
{
  "status": "SUCCESS",
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZW1vLnNlbGxlckBleGFtcGxlLmNvbSIsImlhdCI6MTc1NjYwMDAwMCwiZXhwIjoxNzU2Njg2NDAwfQ.EXAMPLE_SIGNATURE",
    "refreshToken": "b3JhbmRvbTY0Ynl0ZXZhbHVlZXhhbXBsZQ==",
    "tokenType": "Bearer",
    "passwordTemporary": false
  }
}
```

### 10.2 Batch Number Already Exists — Error Sample

```http
POST /api/v1/stock/add HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{ "productId": "ACPA00042", "batchLotNumber": "BATCH2024A", "expiryDate": "2027-06-01", "stockQuantity": 100, "mrp": 50, "sellingPrice": 42 }
```
```json
{ "status": 400, "message": "Batch lot number 'BATCH2024A' already exists for this product/variant with a different expiry date" }
```

### 10.3 Quote Request Creation (Guest)

```http
POST /api/v1/buyer/quote-requests HTTP/1.1
Content-Type: application/json

{
  "productId": "ACPA00042",
  "requestType": "PRICE_REQUEST",
  "quantity": 200,
  "targetPrice": 38.00,
  "pincode": "560001",
  "contactPerson": "Ravi Kumar",
  "phone": "9998887776",
  "email": "ravi.kumar@example-clinic.in"
}
```
```json
{
  "status": "SUCCESS",
  "message": "Request processed successfully",
  "data": { "quoteRequestId": 2044, "status": "PENDING", "sellerName": "Acme Pharma", "productName": "Paracetamol 500mg" }
}
```

*(All example values above are synthetic placeholders — no real credentials, tokens, or personal data.)*

---

## 11. Changelog / Versioning

- **Versioning scheme**: single, unversioned `/api/v1` base path (set via `server.servlet.context-path`), consistent across all four Spring profiles (`application.yml`, `-dev`, `-test`, `-prod`). There is no `/v2`, no header-based versioning, and no per-endpoint deprecation marker anywhere in the codebase.
- **Changelog**: **Not identified in the repository.** No `CHANGELOG.md` was found for the backend; the only chronological evidence of API evolution is the three Flyway migrations (`V1`–`V3` under `src/main/resources/db/migration`) and git commit history, neither of which constitutes a documented API changelog.
- **Dead/superseded code worth flagging for anyone versioning against this API**:
  - `controller/product/ExcelProductImportController.java` — entirely commented out, not a live route.
  - A commented-out `handleApprovalForTempSeller()` block in `SellerApprovalServiceImpl.java` that once minted temporary login credentials at approval time — dead, not reachable.
  - `PricingDetails.finalPrice` — a persisted column with no live computation path anywhere (only two dead, commented-out Excel-import setters reference it).

---

## Implementation Traceability

| Design Element | Source File | Implementation |
|---|---|---|
| Base path `/api/v1` | `application.yml`, `application-{dev,test,prod}.yml` | IMPLEMENTED |
| JWT access token (HS256, subject-only claims) | `D:/.../security/JwtUtils.java` | IMPLEMENTED |
| Refresh token rotation (SHA-256 hash stored, single-use) | `D:/.../service/seller/SellerLogIn/AuthService.java`, `D:/.../entity/auth/RefreshToken.java` | IMPLEMENTED |
| Spring Security URL-level authorization | `D:/.../config/SecurityConfig.java` line 52 | **NOT IMPLEMENTED** (`anyRequest().permitAll()` is live; intended rule set is commented out) |
| Role-based method security (`@PreAuthorize`) | Searched entire controller/service tree | **NOT IDENTIFIED** — `@EnableMethodSecurity` is on but no annotation usage found |
| Admin endpoint protection | `AdminSellerController.java`, `AdminBuyerController.java`, `AdminOrderController.java` | **NOT IMPLEMENTED** — no auth check anywhere in these three controllers |
| Seller order ownership enforcement | `D:/.../controller/order/SellerOrderController.java` | IMPLEMENTED (JWT-resolved seller id, compared to order's seller) |
| Buyer order ownership enforcement | `D:/.../controller/order/OrderController.java` | **PARTIALLY IMPLEMENTED** — `buyerId` trusted from request body/path with no cross-check against the JWT principal |
| Product creation → category attribute validation | `D:/.../service/product/productImpl/ProductDetailsServiceImpl.java` (`setChildRelationships`) | IMPLEMENTED, with one confirmed dead-check bug (Consumable/Cosmetic certifications `== null` check can never fire since the field defaults to an empty list) |
| Bulk Excel/CSV import strategy pattern | `D:/.../service/product/util/ProductImportStrategy.java` + 6 `@Component` implementations | IMPLEMENTED |
| Stock/batch ledger (append-only) | `D:/.../entity/product/StockLedger.java`, `StockServiceImpl.java` | IMPLEMENTED |
| Pricing recalculation on restock | `D:/.../service/product/productImpl/PricingDetailsServiceImpl.java` | **NOT IMPLEMENTED** — restock only increments `stockQuantity`; pricing fields on the existing row are never recomputed |
| Order placement (COD, FIFO stock debit) | `D:/.../service/order/orderImpl/OrderPlacementServiceImpl.java` | IMPLEMENTED |
| Payment gateway / webhook integration | `D:/.../entity/order/Payment.java`, `PaymentServiceImpl.java` | **NOT IMPLEMENTED** — COD-only; entity javadoc references a nonexistent `handleWebhook` method |
| Return/refund flow | `D:/.../service/order/orderImpl/ReturnRefundServiceImpl.java` | IMPLEMENTED, with declared-but-dead statuses (`ReturnStatus.PICKED_UP/CLOSED`, `RefundStatus.PROCESSING/FAILED`, `PaymentStatus.REFUNDED`) |
| Seller onboarding state machine (DRAFT→OPEN→CORRECTION_REQUIRED→RESUBMITTED→APPROVED/REJECTED) | `D:/.../entity/temp/seller/TempSellerStatus.java`, `TempSellerServiceImpl.java`, `SellerApprovalServiceImpl.java` | IMPLEMENTED |
| Buyer onboarding state machine (parallel to seller's) | `D:/.../entity/temp/buyer/TempBuyerStatus.java`, `TempBuyerServiceImpl.java`, `BuyerApprovalServiceImpl.java` | IMPLEMENTED |
| Quote Request negotiation (single-shot, no counter-offer) | `D:/.../service/quote/QuoteRequestService.java` | IMPLEMENTED as linear-only; **NOT IMPLEMENTED**: counter-offer/re-quote/edit/cancel |
| Pagination on list endpoints | Searched entire controller tree for `Pageable`/`Sort`/`page`/`size` | **NOT IMPLEMENTED** |
| Rate limiting | Searched `pom.xml`, `SecurityConfig.java`, all controllers | **NOT IMPLEMENTED** |
| API versioning beyond `/api/v1` | `application*.yml` | **NOT IMPLEMENTED** (single unversioned base) |
| Global exception handling | `GlobalExceptionHandler.java`, `GlobalLogInExceptionHandler.java`, `GlobalResponseHandler.java` | **PARTIALLY IMPLEMENTED** — three overlapping, non-deduplicated handlers |
| Production base URL | Searched all `application*.yml`, ECS task definition, `.env*` | **NOT IDENTIFIED IN REPOSITORY** |

---

## Open Questions

- The exact `SignupRequest`/`TempSellerRequestDTO` field-level `@NotNull`/`@Size`/`@Pattern` annotations were not all individually re-opened in this pass for every field listed in §5 — validation behavior is grounded in the corresponding service-layer logic and prior verified discovery, not a fresh line-by-line DTO read for every field.
- No numeric/custom error-code dictionary (e.g., `ERR_1042`) exists — confirm with the backend team whether one is planned, since none was found in `exception/` or `response/`.
- Production base URL, RPO/RTO, and any compliance certifications (HIPAA/SOC2/etc.) are not evidenced anywhere in either repository and must be sourced from infrastructure/ops documentation outside this codebase.
