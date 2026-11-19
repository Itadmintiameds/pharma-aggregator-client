# Pharma Marketplace — Complete Technical Documentation

Combined single-file edition of the implementation-accurate documentation package (source: pharma-aggregator-client frontend + pharma-aggregator-server backend).

## Table of Contents

1. [Part 1 — High-Level Design (HLD)](#part-1--high-level-design-hld)
2. [Part 2 — Low-Level Design (LLD)](#part-2--low-level-design-lld)
3. [Part 3 — Data Model](#part-3--data-model)
4. [Part 4 — API Specification](#part-4--api-specification)
5. [Part 5 — Security & Deployment](#part-5--security--deployment)

Diagrams referenced throughout are embedded inline where each source document embedded them, and also exist as standalone files under `docs/diagrams/`.

---

# Part 1 — High-Level Design (HLD)

## High-Level Design (HLD) — Pharma Aggregator Marketplace

### 1. Document Control

| Field | Value |
|---|---|
| Document title | High-Level Design — Pharma Aggregator Marketplace |
| Document code | 04-HLD |
| System | pharma-aggregator-client (Next.js 16 frontend) + pharma-aggregator-server (Spring Boot backend) |
| Repositories | `Frontend/pharma-aggregator-client`, `Backend/pharma-aggregator-server` |
| Prepared from | Direct source-code inspection (controllers, services, entities, config, CI/CD, Dockerfiles) — no design intent, ticket, or third-party documentation was used as a source |
| Status | Draft — reverse-engineered from the existing codebase as of the date below |
| Related documents | `docs/08-SECURITY-AND-DEPLOYMENT.md` (full security detail; referenced, not duplicated, in Section 10) |

#### Revision History

| Version | Date | Author | Summary of changes |
|---|---|---|---|
| 0.1 | 2026-08-31 | Reverse-engineering pass (Claude Code) | Initial draft, generated entirely from source-code discovery across both repositories |

---

### 2. Introduction & Purpose

#### 2.1 Purpose

This document describes the High-Level Design of the Pharma Aggregator Marketplace as it **actually exists in code today** — not as originally specified, not as documented in stale markdown files, and not as aspirationally intended by inline comments that don't match the live code path. Every claim in this document is traceable to a specific file opened during discovery; where something could not be confirmed, this document says so explicitly rather than inferring it.

#### 2.2 System Summary

The Pharma Aggregator Marketplace is a two-sided B2B marketplace connecting pharmaceutical/medical-product **sellers** (manufacturers, distributors, PCD companies, white-labelers) with **buyers** (hospitals, clinics, pharmacies, diagnostic centres, laboratories). The system is built as:

- **Frontend**: a single Next.js 16 (App Router) application (`pharma-aggregator-client`) serving three audiences — sellers, buyers, and anonymous/guest visitors browsing products — from one codebase, with **no separate admin UI**.
- **Backend**: a single Spring Boot monolith (`pharma-aggregator-server`) exposing all functionality under one context path (`/api/v1`), backed by one PostgreSQL database.

There is **no admin frontend** anywhere in this codebase (confirmed: `src/services/admin/TestService.ts` and `src/services/buyer/TestService.ts` are both literal one-line placeholders, and admin-only backend endpoints such as `POST /admin/sellers/review`, `POST /admin/buyers/review`, and `POST /admin/orders/{orderId}/override` have no corresponding UI anywhere in `src/app/**`). Admin actions are performed by whatever external tool or manual API call reaches these backend-only endpoints — its existence is inferred only from a `app.admin-frontend-url` property referenced in email-link construction, and was not located in either repository.

#### 2.3 In Scope / Out of Scope

**In scope for this document**: seller and buyer registration/onboarding, authentication, product catalog management (6 product categories), stock/batch/pricing management, order placement and fulfillment, quote requests (RFQ), master/reference data, and the deployment/CI-CD pipeline as evidenced in the backend repository.

**Out of scope / not built**: any admin UI, any payment gateway integration (the system is COD-only — see Section 9), any real-time notification channel beyond email/SMS, and any horizontal-scaling or multi-tenant infrastructure (none evidenced).

#### 2.4 Audience

Engineering team members onboarding onto this codebase, technical reviewers assessing production-readiness, and anyone auditing the gap between intended design and shipped implementation.

---

### 3. System Overview / Architecture Diagram

The system is a classic three-tier arrangement — browser client, backend monolith, relational database — with two external SaaS integrations (AWS S3 for file storage, Twilio Verify for SMS OTP) and one for email (SMTP via Spring `JavaMailSender`, **not** AWS SES). There is no API gateway, message queue, cache layer, or CDN anywhere in the code inspected.

A structural quirk with real engineering consequences: the frontend uses **three independent Axios HTTP clients** rather than one shared client, each with different failure-handling behavior (see Section 4 and Section 9):

- `src/lib/api.ts` — used by seller auth/profile/master-data services; has full 401-triggered refresh-token rotation with a request queue.
- `src/lib/buyerApi.ts` — a structurally near-identical but entirely separate client for the buyer domain, with its own token keys and its own refresh logic.
- `src/utils/api.ts` — used by every product-category service (Drug, Consumable, Non-Consumable, Supplement, Cosmetic, Food & Infant) and shared product lookups; attaches a Bearer token but has **no** response interceptor, so a 401 here never triggers a silent refresh.

Two further call sites bypass all three clients entirely: `IFSCService.ts` (raw `fetch()` to Razorpay's public IFSC API, a `bankify.in` fallback, and — with a URL-construction bug — this app's own backend) and the bulk Excel/CSV product-import feature in `DashboardFilters.tsx` (raw `fetch()` to a **hardcoded external staging host**, `https://api-test-aggreator.tiameds.ai/api/v1/products/import`, never built from `NEXT_PUBLIC_API_URL`).

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        SellerBrowser["Seller Browser"]
        BuyerBrowser["Buyer / Guest Browser"]
    end

    subgraph Frontend["Frontend — Next.js 16 App Router (pharma-aggregator-client)<br/>Client-rendered SPA-style app; no server-side data-fetching layer found"]
        SellerUI["Seller UI<br/>seller_7a3b9f2c/** + LoginModals.tsx"]
        BuyerUI["Buyer UI<br/>buyer_e8d45a1b/** + global login/signup modals"]
        PublicUI["Public product / checkout / orders pages"]

        LibApi["src/lib/api.ts<br/>Seller Axios client<br/>Bearer attach + 401 refresh queue"]
        BuyerApiClient["src/lib/buyerApi.ts<br/>Buyer Axios client<br/>Bearer attach + 401 refresh queue (isolated token set)"]
        UtilsApi["src/utils/api.ts<br/>Product/master Axios client<br/>Bearer attach only — NO refresh handling"]
        IFSCDirect["IFSCService.ts<br/>raw fetch() — bypasses all 3 clients"]
        ExcelDirect["Bulk Excel/CSV import (DashboardFilters.tsx)<br/>raw fetch() to a HARDCODED external host —<br/>bypasses all 3 clients, ignores NEXT_PUBLIC_API_URL"]

        SellerUI --> LibApi
        SellerUI --> UtilsApi
        SellerUI --> IFSCDirect
        SellerUI --> ExcelDirect
        BuyerUI --> BuyerApiClient
        PublicUI --> UtilsApi
        PublicUI --> BuyerApiClient
    end

    SellerBrowser --> SellerUI
    BuyerBrowser --> BuyerUI
    SellerBrowser --> PublicUI
    BuyerBrowser --> PublicUI

    subgraph Backend["Backend — pharma-aggregator-server (Spring Boot monolith)<br/>context-path /api/v1 · default port 8080 (no server.port configured in any profile)"]
        AuthFilter["AuthTokenFilter<br/>validates Bearer JWT, resolves seller-vs-buyer table via a<br/>preferBuyer flag (SecurityConfig: anyRequest().permitAll() —<br/>Spring Security enforces nothing at the URL level)"]
        ControllerLayer["Controllers<br/>Auth (Seller/Buyer) · Master Data · Product Catalog ·<br/>Stock/Pricing · Order/Payment/Invoice/Return · Quote ·<br/>Temp Seller/Buyer · Admin · Content/Misc"]
        ServiceLayer["Services<br/>business rules, ID generation (Postgres advisory locks),<br/>state machines, S3/Twilio/SMTP orchestration"]
        RepoLayer["Spring Data JPA repositories"]

        AuthFilter --> ControllerLayer --> ServiceLayer --> RepoLayer
    end

    LibApi -->|"HTTPS + Bearer JWT"| AuthFilter
    BuyerApiClient -->|"HTTPS + Bearer JWT"| AuthFilter
    UtilsApi -->|"HTTPS + Bearer JWT"| AuthFilter
    IFSCDirect -.->|"GET {API_URL}ifsc/{code}<br/>missing '/' separator — 404s in practice"| AuthFilter

    subgraph Data["Data & Storage"]
        Postgres[("PostgreSQL<br/>dev: hardcoded AWS RDS endpoint<br/>test: env-var driven (Secrets Manager)<br/>prod: local docker-compose container")]
        S3[("AWS S3 (SDK v2)<br/>product images/docs, seller & buyer<br/>onboarding documents, GST tax invoices")]
    end

    RepoLayer --> Postgres
    ServiceLayer -->|"S3Service"| S3

    subgraph External["External Third-Party Services"]
        Twilio["Twilio Verify<br/>SMS OTP send/verify — code never stored server-side"]
        SMTP["SMTP mail server<br/>Spring JavaMailSender — NOT AWS SES"]
        Razorpay["Razorpay public IFSC API<br/>(external, no backend involvement)"]
        Bankify["bankify.in IFSC API<br/>(external fallback, no backend involvement)"]
        ExtStaging["api-test-aggreator.tiameds.ai<br/>hardcoded external staging backend —<br/>used only by the bulk Excel/CSV import feature"]
    end

    ServiceLayer --> Twilio
    ServiceLayer --> SMTP
    IFSCDirect --> Razorpay
    IFSCDirect --> Bankify
    ExcelDirect --> ExtStaging

    Note["NOTE: no API gateway, message queue, cache layer, CDN,<br/>or additional AWS service (SES/SNS/Lambda/DynamoDB) was found<br/>anywhere in the code inspected — none are shown because none are evidenced."]
```

---

### 4. Component Breakdown

#### 4.1 Frontend Components

| Name | Purpose | Responsibilities | Inputs | Outputs | Dependencies | Data owned | APIs exposed |
|---|---|---|---|---|---|---|---|
| Seller App (`seller_7a3b9f2c/**`) | Full seller workflow: registration, dashboard, product CRUD, orders, quotes | Client-side auth guard (`layout.tsx`), 30-min inactivity logout, back-button interception, onboarding gate | User input, JWT in `localStorage` | HTTP calls via `lib/api.ts` / `utils/api.ts` | `sellerAuthService`, product services, `StockService`, `sellerOrderService` | None (stateless UI; tokens in `localStorage`) | None — consumes backend APIs only |
| Buyer App (`buyer_e8d45a1b/**`) | Buyer signup/login, dashboard, RFQ management, order history | Client-side auth guard (`dashboard/layout.tsx`, modal-based rather than redirect-based), onboarding gate | User input, JWT in `localStorage` | HTTP calls via `lib/buyerApi.ts` / `utils/api.ts` | `buyerAuthService`, `buyerRegistrationService`, `quoteRequestService`, `orderService` | None | None |
| Public/Guest pages (`product/[id]/**`, `checkout/`, `about/`, `contact/`) | Product browsing, price-request/RFQ submission, checkout, static marketing content | Renders product data; allows anonymous quote-request submission | Product IDs, form input | HTTP calls | `quoteRequestService`, product lookup services | None | None |
| `src/lib/api.ts` | Seller-domain Axios client | Attach Bearer token; on 401, queue concurrent requests and rotate refresh token; hard-redirect on failure | Outgoing requests, `localStorage` tokens | HTTP requests/responses | None | `accessToken`/`refreshToken`/`user` in `localStorage`, `token` cookie | N/A (HTTP client) |
| `src/lib/buyerApi.ts` | Buyer-domain Axios client (independent of the seller client) | Same refresh-rotation pattern as `lib/api.ts`, fully isolated | Outgoing requests, `localStorage` tokens | HTTP requests/responses | None | `buyerAccessToken`/`buyerRefreshToken`/`buyerUser` in `localStorage`, `buyerToken` cookie | N/A |
| `src/utils/api.ts` | Product/master-data Axios client | Attach Bearer token only; **no** 401/refresh handling | Outgoing requests | HTTP requests/responses | None | None | N/A |
| Product Category Services (`src/services/product/*`) | One service per product category (Drug, Consumable, Non-Consumable, Supplement, Cosmetic, Food & Infant) plus shared lookups | Build category-specific create/update payloads, master-data lookups, document/image upload orchestration | Form data from category forms | Product/attribute DTOs | `utils/api.ts` | None | N/A |
| `SellerRegMasterService`, `IFSCService` | Registration-time master-data lookups; bank IFSC resolution | Fetch states/districts/talukas/company-types/etc.; 3-source IFSC lookup with a fallback chain | IFSC code, master-data IDs | Master lists, bank details | `lib/api.ts` (master data); raw `fetch()` (IFSC, 3 external hosts) | None | N/A |
| Zod Schemas (`src/schema/**`) | Client-side validation | Field/cross-field validation rules per domain | Form state | Validation result | `zod` | None | N/A |

#### 4.2 Backend Components

| Name | Purpose | Responsibilities | Inputs | Outputs | Dependencies | Data owned | APIs exposed |
|---|---|---|---|---|---|---|---|
| Auth (Seller) — `SignupController`, `AuthenticationController`, `AuthController` | Email/password signup, 2-step OTP login, password reset | BCrypt password check, OTP generation/verification (5-min expiry, lockout after 5/3 attempts), JWT + refresh-token issuance | Credentials, OTP codes | JWT access token, opaque refresh token | `AuthService`, `JwtUtils`, `EmailService` | `tbl_user`, `tbl_login_otp`, `tbl_refresh_tokens` | `POST /auth/signup`, `/auth/signup/verify-otp`, `/authentication/login`, `/verify-otp`, `/refresh`, `/logout`, `/auth/reset-password`, `/auth/forgot-password` |
| Auth (Buyer) — `BuyerSignupController`, `BuyerAuthenticationController`, `BuyerProfileController` | Independent buyer signup/login stack, structurally mirroring seller auth but isolated tables/services | Manual `PasswordEncoder.matches()` (bypasses `AuthenticationManager`), same OTP + JWT/refresh pattern | Credentials, OTP codes | JWT, refresh token | `BuyerAuthService`, `JwtUtils` (shared), `EmailService` | `tbl_buyer_user`, `tbl_buyer_login_otp`, `tbl_buyer_refresh_tokens` | `POST /buyer/auth/signup`, `/buyer/authentication/login`, `/verify-otp`, `/refresh`, `/reset-password`, `GET /buyer/authentication/me` |
| Seller Onboarding — `TempSellerController` + OTP controllers | Draft/submit/resubmit seller registration; email + SMS(Twilio) OTP verification | Draft save (no validation), full submit (validated), document upload to S3, admin-review resubmission loop | Registration form data, documents | `TempSeller` record, S3 URLs | `TempSellerServiceImpl`, `SellerTypeFieldValidator`, `S3Service`, `TwilioOTPService` | `tbl_temp_seller` + address/coordinator/bank/document child tables | `POST /temp-sellers`, `/draft`, `/draft/{id}/finalize`, `PUT /temp-sellers/{id}`, document upload/delete endpoints |
| Buyer Onboarding — `TempBuyerController` | Draft/submit buyer organization registration (GST/PAN/address/contact/docs) | Same draft/finalize pattern as seller; GST-or-PAN-required validation | Registration form data, documents | `TempBuyer` record, S3 URLs | `TempBuyerServiceImpl`, `S3Service` | `tbl_temp_buyer` + child tables | `POST /temp-buyers`, `/draft`, `/draft/{id}/finalize`, `PUT /temp-buyers/{id}` |
| Admin Approval — `AdminSellerController`, `AdminBuyerController`, `AdminSellerApprovalController`, `AdminOrderController` | ACCEPT/REJECT/CORRECTION review of pending registrations; profile-update approval; order status override | Seller/Buyer ID generation (Postgres advisory locks), two-phase S3 migration, non-atomic approve-then-migrate pattern | Review decision + comments | Approved `Seller`/`Buyer` records | `SellerApprovalServiceImpl`, `BuyerApprovalServiceImpl`, `SellerProfileService`, `OrderQueryServiceImpl` | `tbl_seller`, `tbl_buyer` + child tables, `tbl_pending_seller` | `POST /admin/sellers/review`, `/admin/buyers/review`, `/admin/seller-requests/{id}/approve|reject`, `/admin/orders/{id}/override` |
| Master/Reference Data — 8 `controller/master/*` + `controller/product/*` lookups | Geographic hierarchy, seller/buyer/company/product/document type lookups, dosage forms, pack types, therapeutic categories, GST%, etc. | Read-only GETs; cascading dropdown support via path variables | None (or a parent ID) | Lookup lists | JPA repositories only | `tbl_state_master`, `tbl_district_master`, `tbl_taluka_master`, `tbl_seller_type_master`, etc. | ~40 `GET` endpoints, all unauthenticated |
| Product Catalog — `ProductDetailsController`, `ProductImportController`, `ProductImageController`, `ProductDocumentController` | CRUD for 6 product categories; Strategy-pattern Excel/CSV bulk import; image/certificate/brochure upload | Per-category attribute validation, product ID generation, merge-vs-create logic on import | Product form data, spreadsheet files, image/document files | Product records, S3 file URLs | `ProductDetailsServiceImpl`, `UniversalExcelImportService`, `ProductImportStrategyFactory`, `S3Service` | `tm_product_details` + 6 category attribute tables | `POST /products/create`, `/products/import`, `GET /products/getAll`, `/getById/{id}`, `PUT /update/{id}`, image/document upload endpoints |
| Stock & Pricing — `StockController`, `PricingDetailsController` | Batch/lot-level stock ledger with FIFO consumption | Restock-or-create batch logic, FIFO debit with pessimistic locking, append-only stock ledger, soft-delete | Batch/lot data, quantities | Updated batch state, ledger rows | `StockServiceImpl`, `PricingDetailsServiceImpl` | `tm_pricing_details`, `tbl_stock_ledger` | `POST /stock/add`, `/add-batches`, `/debit`, `GET /stock/{productId}/**`, `DELETE .../batches/{pricingId}` |
| Orders — `OrderController`, `SellerOrderController`, `InvoiceController`, `PaymentController`, `ReturnController` | Order placement (COD only), per-seller fulfillment state machine, invoice generation, return/refund | Cart-to-order fan-out per seller, OTP-gated delivery confirmation, 7-day return window, GST invoice PDF generation | Cart/quote data, fulfillment actions | `Order`/`SellerOrder`/`Invoice`/`Refund` records | `OrderPlacementServiceImpl`, `SellerOrderFulfillmentServiceImpl`, `OrderCancellationServiceImpl`, `ReturnRefundServiceImpl`, `InvoiceServiceImpl`, `StockService` | `tbl_order`, `tbl_seller_order`, `tbl_order_item`, `tbl_payment`, `tbl_invoice`, `tbl_refund`, `tbl_return_request` | `POST /orders`, `/orders/{id}/cancel`, `PATCH /seller-orders/{id}/{confirm,pack,ship,out-for-delivery,deliver,cancel}`, `/returns/**`, `/invoices/**` |
| Quote Requests — `BuyerQuoteRequestController`, `SellerQuoteRequestController` | Single-shot Price-Request/RFQ negotiation | Guest-buyer auto-provisioning, one-shot seller quote, buyer accept/reject, hand-off to order placement | Quote request/response data | `QuoteRequest` records | `QuoteRequestService`, `EmailService` | `tbl_quote_request` | `POST /buyer/quote-requests`, `PATCH /accept`, `/reject`, `GET /seller/quote-requests`, `PATCH /respond` |
| Content/Misc — `LegalContentController`, `IFSCOverrideController`, `HomeController` | Legal terms content, IFSC override cache, health checks | Simple GET lookups | Content key, IFSC code | Content/IFSC data, health status | JPA repositories | `tbl_legal_content`, `tbl_ifsc_overrides` | `GET /content/{key}`, `/ifsc/{code}`, `/health`, `/public/health-check` |
| Security Infrastructure — `SecurityConfig`, `AuthTokenFilter`, `JwtUtils` | JWT issuance/validation, request-level identity resolution | HS256 signing, buyer-vs-seller table disambiguation via URL-prefix heuristic | Bearer token | `SecurityContext` population | None (foundational) | None | N/A |

#### 4.3 Implementation Traceability

| Design Element | Source File | Implementation |
|---|---|---|
| Seller Axios client with refresh-token rotation | `src/lib/api.ts` | IMPLEMENTED |
| Buyer Axios client with refresh-token rotation | `src/lib/buyerApi.ts` | IMPLEMENTED |
| Product/master Axios client (no refresh) | `src/utils/api.ts` | IMPLEMENTED (deliberately without 401 handling) |
| Client-side seller route guard | `src/app/seller_7a3b9f2c/layout.tsx` | IMPLEMENTED (post-mount, not edge middleware) |
| Client-side buyer dashboard route guard | `src/app/buyer_e8d45a1b/dashboard/layout.tsx` | IMPLEMENTED (modal-based, not redirect-based) |
| Edge-level route protection | `src/proxy.ts` | NOT IMPLEMENTED — file exists with the right shape but is never wired up (wrong filename/export for Next.js middleware auto-wiring); no `middleware.ts` exists anywhere in the repo |
| JWT issuance (HS256, subject-only claims) | `security/JwtUtils.java` | IMPLEMENTED |
| Opaque, hashed, rotating refresh tokens | `security/JwtUtils.java`, `AuthService.java`, `BuyerAuthService.java` | IMPLEMENTED |
| Framework-level endpoint authorization | `config/SecurityConfig.java` | NOT IMPLEMENTED — `anyRequest().permitAll()` is live; the role-scoped alternative is commented out |
| Seller onboarding state machine (DRAFT→OPEN→CORRECTION_REQUIRED→RESUBMITTED→APPROVED/REJECTED) | `entity/temp/seller/TempSellerStatus.java`, `service/serviceImpl/temp/seller/TempSellerServiceImpl.java` | IMPLEMENTED |
| Buyer onboarding state machine | `entity/temp/buyer/TempBuyerStatus.java`, `service/serviceImpl/temp/buyer/TempBuyerServiceImpl.java` | IMPLEMENTED |
| Seller/Buyer ID generation via Postgres advisory locks | `repository/seller/SellerRepository.java` (lock 12345), `repository/buyer/BuyerRepository.java` (lock 54321) | IMPLEMENTED |
| Two-phase (commit-then-migrate) S3 file migration on approval | `service/serviceImpl/admin/SellerApprovalServiceImpl.java`, `BuyerApprovalServiceImpl.java` | IMPLEMENTED (non-atomic by explicit design; migration failures are logged, never rolled back) |
| Strategy-pattern product import (6 categories) | `service/product/util/ProductImportStrategy.java` + 6 `*ImportStrategy.java` implementations, `ProductImportStrategyFactory.java` | IMPLEMENTED |
| Bulk import routed through the app's own configured backend | `src/app/seller_7a3b9f2c/dashboard/components/DashboardFilters.tsx` | NOT IMPLEMENTED — hits a hardcoded external staging host instead of `NEXT_PUBLIC_API_URL` |
| Batch/lot stock ledger with FIFO consumption | `entity/product/PricingDetails.java`, `entity/product/StockLedger.java`, `service/product/productImpl/StockServiceImpl.java` | IMPLEMENTED |
| Pricing recalculation on stock restock | `service/product/productImpl/PricingDetailsServiceImpl.java` | NOT IMPLEMENTED — restock only increments `stockQuantity`; MRP/selling price/discount/GST are untouched |
| Order placement with per-seller fan-out and FIFO stock debit | `service/order/orderImpl/OrderPlacementServiceImpl.java` | IMPLEMENTED |
| Payment gateway / webhook integration | `service/order/orderImpl/PaymentServiceImpl.java` | NOT IMPLEMENTED — COD-only; the entity's own javadoc references a `handleWebhook` method that does not exist anywhere in the class |
| Seller order fulfillment state machine with OTP-gated delivery | `service/order/orderImpl/SellerOrderFulfillmentServiceImpl.java` | IMPLEMENTED |
| GST invoice PDF generation, sequential per-seller-per-FY numbering | `service/order/orderImpl/InvoiceServiceImpl.java` | IMPLEMENTED (numbering race is a known, accepted gap — see Section 9) |
| Return/refund workflow | `service/order/orderImpl/ReturnRefundServiceImpl.java` | PARTIALLY IMPLEMENTED — request/approve/process-refund exists; `Payment.status` is never updated to REFUNDED, and `ReturnStatus.PICKED_UP`/`CLOSED` are declared but never reachable |
| Quote Request (RFQ/Price Request) negotiation | `service/quote/QuoteRequestService.java` | IMPLEMENTED (strictly single-shot — no counter-offer/re-quote path exists) |
| Admin approval UI | — | NOT IMPLEMENTED — no admin frontend exists anywhere in `pharma-aggregator-client`; backend admin endpoints have no corresponding UI |
| List-endpoint pagination | (searched all controllers) | NOT IDENTIFIED — no `Pageable`/page/size/sort parameter found on any endpoint in either repository |
| Automated test suite | (searched both repositories) | NOT IDENTIFIED — no test framework installed in the frontend; backend CI explicitly skips test execution |

---

### 5. Technology Stack

Only technologies with direct evidence in source/config files are listed.

#### Frontend
- **Framework**: Next.js 16.1.1 (App Router), React 19.2.3 / React DOM 19.2.3
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`), MUI (`@mui/material` 7.3.8, `@mui/x-date-pickers` 8.27.2), Bootstrap 5.3.8 + `bootstrap-icons` — three systems coexisting
- **Forms/Validation**: `react-hook-form` 7.71.2, `@hookform/resolvers` 5.2.2, `zod` 4.3.6
- **HTTP**: `axios` 1.13.2
- **Notifications (UI)**: `react-toastify` 11.1.0 and `react-hot-toast` 2.6.0 — both installed and both actually invoked
- **Build output**: `output: 'standalone'` (`next.config.ts`)
- **Linting**: ESLint 9, `eslint-config-next` 16.1.1

#### Backend
- **Framework**: Spring Boot (parent 4.0.1), Java 17 (compiler target 21 in `pom.xml` despite `java.version=17` property)
- **Security**: Spring Security (JWT via `io.jsonwebtoken`/jjwt 0.11.5, HS256), `BCryptPasswordEncoder`
- **Persistence**: Spring Data JPA / Hibernate, Flyway (`flyway-core`, no explicit `flyway-database-postgresql` artifact)
- **Documents**: iText 7.2.5 (GST invoice PDF generation)
- **API docs**: springdoc-openapi-starter-webmvc-ui 2.3.0 (Swagger UI at `/api/v1/swagger-ui`, disabled in prod)

#### Database
- **PostgreSQL** in all three profiles (`org.postgresql.Driver`, `PostgreSQLDialect`)
- Schema managed by a **mix** of Flyway migrations (`src/main/resources/db/migration/V1–V3`) and manually-run ad hoc SQL scripts under `docs/` (not Flyway-tracked, must be applied by hand — the docs themselves say so)
- `ddl-auto`: `update` in dev/test, `validate` in prod

#### Cloud / Infrastructure (evidenced)
- **AWS S3** (SDK v2, `StaticCredentialsProvider`) — file storage for product images/documents, seller/buyer onboarding documents, GST invoices
- **AWS ECR** — container registry (test environment only)
- **AWS ECS (Fargate)** — container orchestration, one task definition found (`tiamed-aggregator-task-defination`, test environment only)
- **AWS Secrets Manager** — injects all non-trivial backend environment variables in the ECS task definition
- **AWS CloudWatch Logs** — `awslogs` driver, log group `/ecs/tiameds-tiamed-aggregator-task-defination`
- **AWS RDS (PostgreSQL)** — hardcoded endpoint in the dev profile only
- **NOT identified**: no API Gateway, Load Balancer, CloudFront, SES, SNS, Lambda, DynamoDB, ElastiCache, or Cognito anywhere in either repository

#### Storage (non-AWS)
- Browser `localStorage` / `document.cookie` for session tokens (both frontend clients)

#### CI/CD
- **Backend only**: two GitHub Actions workflows — `qodana_code_quality.yml` (static analysis, no build/deploy) and `tests.yml` (the actual build+deploy pipeline, despite its name; tests are explicitly skipped via `-DskipTests`)
- **Frontend**: **NOT IDENTIFIED** — no `.github/` directory, no CI config of any kind found in `pharma-aggregator-client`

#### Monitoring
- **NOT IDENTIFIED** — no APM, error-tracking (Sentry/Rollbar/etc.), or metrics-collection library found in either repository. CloudWatch Logs (log aggregation only) is the only observability tooling evidenced.

#### Testing
- **NOT IDENTIFIED** — no test framework installed in either repository (no Jest/Vitest/Playwright/Cypress/RTL on the frontend; no JUnit test execution wired into CI on the backend — `mvn -DskipTests` explicitly skips whatever tests may exist in source).

#### Third-Party SaaS
- **Twilio Verify** (SDK 9.15.0) — SMS OTP send/verify; the backend never stores the OTP code itself for this channel
- **SMTP** via Spring `JavaMailSender` — all email (OTP, confirmations, approvals) goes through SMTP, not a cloud email API
- **Razorpay public IFSC API** and **bankify.in** — called directly from the frontend for bank-branch lookup, entirely outside backend involvement

---

### 6. Data Flow Diagrams

Each diagram below is a mermaid sequence diagram traced directly from source code (both frontend and backend), reused verbatim from the discovery pass. Every step and finding was verified against the cited files during tracing; see the accompanying `keyFindings`/`gaps` notes embedded as diagram comments where relevant.

#### 6.1 Authentication / Login (Seller & Buyer)

Both seller and buyer login are structurally identical two-step (password → email OTP) flows ending in a JWT access token plus an opaque, hashed, rotating refresh token — but fully isolated from each other (separate tables, separate controllers, separate frontend Axios clients).

```mermaid
sequenceDiagram
    autonumber

    participant Browser as Browser (localStorage + document.cookie)
    participant SUI as Seller UI (LoginModals.tsx)
    participant SAuth as sellerAuthService.ts
    participant SApi as lib/api.ts (axios, seller)
    participant SCtrl as AuthenticationController (/authentication)
    participant SSvc as AuthService (seller, backend)
    participant Jwt as JwtUtils (shared, HS256)
    participant Mail as EmailService (SMTP, shared)
    participant SDB as tbl_user / tbl_login_otp / tbl_refresh_tokens
    participant AF as AuthTokenFilter (shared, on every request)

    participant BUI as Buyer UI (LoginForm / LoginOtpStep)
    participant BAuth as buyerAuthService.ts
    participant BApi as lib/buyerApi.ts (axios, buyer)
    participant BCtrl as BuyerAuthenticationController (/buyer/authentication)
    participant BSvc as BuyerAuthService (buyer, backend)
    participant BDB as tbl_buyer_user / tbl_buyer_login_otp / tbl_buyer_refresh_tokens

    Note over SUI,SDB: SELLER LOGIN — src/app/modals/LoginModals/LoginModals.tsx is the REAL, wired-up seller login UI.<br/>src/app/(auth)/login_fhy26sb/** is a separate, orphaned scaffold (fetch('/api/seller/...') routes that don't exist) — not part of this flow.

    rect rgb(235,245,255)
    Note over Browser,SDB: STEP 1 — password login, sends OTP
    Browser->>SUI: submit username + password
    SUI->>SAuth: sellerAuthService.login(credentials)
    SAuth->>SApi: POST /authentication/login {username,password}
    SApi->>SCtrl: forwarded (Bearer attach interceptor: no token yet, so no header)
    SCtrl->>SSvc: validateCredentialsAndSendOtp(loginRequest)
    SSvc->>SDB: findByUsername(username)
    SDB-->>SSvc: User row
    alt account locked or inactive
        SSvc-->>SCtrl: AccountLockedException / AccountInactiveException
        SCtrl-->>SApi: 403 {status,error,message}
    else credentials checked
        SSvc->>SSvc: AuthenticationManager.authenticate() — BCrypt check via Spring Security
        alt bad password
            SSvc->>SDB: increment failedLoginAttempts (lock account at 5 — MAX_LOGIN_FAILED_ATTEMPTS)
            SSvc-->>SCtrl: InvalidCredentialsException
            SCtrl-->>SApi: 401 {status,error,message}
        else password OK
            SSvc->>SDB: resetFailedLoginAttempts; invalidateAllOtpsForUser(user)
            SSvc->>SDB: save new LoginOtp (6-digit, isUsed=false, expiresAt=+5min, OTP_EXPIRY_MINUTES)
            SSvc->>Mail: sendCoordinatorOtp(user.username, otpCode)
            SSvc-->>SCtrl: OtpSentResponse{message, username}
            SCtrl-->>SApi: 200 {status:"SUCCESS", data:{message,username}}
            SApi-->>SAuth: response (checked for a nested 200-wrapped 401 failure shape)
            SAuth->>Browser: localStorage.setItem("otpUsername", username)
            SAuth-->>SUI: OtpSentResponse — show OTP entry screen
        end
    end
    end

    rect rgb(235,255,240)
    Note over Browser,SDB: STEP 2 — OTP verification, JWT + refresh-token issuance
    Browser->>SUI: submit 6-digit OTP
    SUI->>SAuth: sellerAuthService.verifyOtp({username, otp})
    SAuth->>SApi: POST /authentication/verify-otp {username, otp}
    SApi->>SCtrl: forwarded
    SCtrl->>SSvc: verifyOtpAndIssueToken(request)
    SSvc->>SDB: findActiveOtpByUser(user) — unused AND unexpired AND unlocked
    alt no active OTP found
        SSvc-->>SCtrl: OtpExpiredException
        SCtrl-->>SApi: 410 Gone
    else OTP row found
        alt otp.otpCode != request.otp
            SSvc->>SDB: incrementFailedAttempts; lock OTP row at 3 (MAX_OTP_FAILED_ATTEMPTS)
            SSvc-->>SCtrl: OtpInvalidException (401) or OtpLockedException (429, must login again)
            SCtrl-->>SApi: 401 / 429 {status,error,message}
        else OTP matches
            SSvc->>SDB: markOtpAsUsed(otpId); updateLastLogin(userId, now)
            SSvc->>Jwt: generateJwtToken(authentication)
            Note right of Jwt: HS256, key = HMAC(app.jwt.secret).<br/>Claims: sub=username, iat, exp only — NO roles/userId embedded.<br/>app.jwt.expiration in application-dev.yml = 86400000ms (24h, commented as a "temporary" override of an intended 30 min)
            Jwt-->>SSvc: accessToken (signed JWT)
            SSvc->>Jwt: generateRefreshToken()
            Note right of Jwt: 64 random bytes (SecureRandom), base64url-encoded — an OPAQUE token, not a JWT
            Jwt-->>SSvc: rawRefreshToken
            SSvc->>Jwt: hashToken(rawRefreshToken) — SHA-256
            SSvc->>SDB: save RefreshToken{tokenHash (raw never stored), expiresAt=now+app.jwt.refresh-expiration (7 days)}
            SSvc-->>SCtrl: LoginResponse{accessToken, refreshToken(raw), userId, username, roles, passwordTemporary, message}
            SCtrl-->>SApi: 200 {status:"SUCCESS", data:LoginResponse}
            SApi-->>SAuth: response
            alt loginData.passwordTemporary === true
                SAuth->>Browser: do NOT store accessToken/refreshToken; clear any stale ones; deleteCookie("token")
                SAuth-->>SUI: caller routes to first-time password-reset step (POST /auth/reset-password)
            else normal login
                SAuth->>Browser: localStorage.setItem(accessToken, refreshToken, user, lastLogin)
                SAuth->>Browser: decode JWT payload via atob() to read exp → localStorage.setItem("tokenExpiresAt", exp*1000)
                SAuth->>Browser: setCookie("token", accessToken, 1 day) — plain document.cookie, NOT httpOnly, SameSite=Lax
                SAuth-->>SUI: LoginResponse — redirect into /seller_7a3b9f2c/dashboard
            end
        end
    end
    end

    Note over BUI,BDB: BUYER LOGIN — src/app/buyer_e8d45a1b/login/page.tsx renders null; a global BuyerLoginModalProvider (mounted in root layout.tsx) opens the actual modal built from these same LoginForm/LoginOtpStep components. Structurally mirrors seller login but is fully isolated (own tables, own controller, own axios client, own localStorage key prefix "buyer*").

    rect rgb(255,245,235)
    Note over Browser,BDB: STEP 1 — password login, sends OTP (buyer)
    Browser->>BUI: submit email + password
    BUI->>BAuth: buyerAuthService.login(credentials)
    BAuth->>BApi: POST /buyer/authentication/login
    BApi->>BCtrl: forwarded
    BCtrl->>BSvc: validateCredentialsAndSendOtp(loginRequest)
    BSvc->>BDB: findByEmail(username)
    BDB-->>BSvc: BuyerUser row
    alt locked / inactive
        BSvc-->>BCtrl: AccountLockedException / AccountInactiveException (403)
    else
        BSvc->>BSvc: passwordEncoder.matches(password, buyerUser.passwordHash) — manual BCrypt check, NOT Spring Security's AuthenticationManager
        alt bad password
            BSvc->>BDB: increment failedLoginAttempts (lock at 5)
            BSvc-->>BCtrl: InvalidCredentialsException (401)
        else password OK
            BSvc->>BDB: resetFailedLoginAttempts; invalidateAllOtpsForBuyerUser(buyerUser)
            BSvc->>BDB: save new BuyerLoginOtp (6-digit, +5min expiry)
            BSvc->>Mail: sendBuyerOtp(email, otpCode)
            BSvc-->>BCtrl: BuyerOtpSentResponse{message, username}
            BCtrl-->>BApi: 200 {status:"SUCCESS", data:{...}}
            BApi-->>BAuth: response
            BAuth->>Browser: localStorage.setItem("buyerOtpUsername", username)
            BAuth-->>BUI: show OTP entry screen
        end
    end
    end

    rect rgb(250,240,255)
    Note over Browser,BDB: STEP 2 — OTP verification, JWT + refresh-token issuance (buyer)
    Browser->>BUI: submit 6-digit OTP
    BUI->>BAuth: buyerAuthService.verifyOtp({username, otp})
    BAuth->>BApi: POST /buyer/authentication/verify-otp
    BApi->>BCtrl: forwarded
    BCtrl->>BSvc: verifyOtpAndIssueToken(request)
    BSvc->>BDB: findActiveOtpByBuyerUser(buyerUser)
    alt no active OTP
        BSvc-->>BCtrl: OtpExpiredException (410)
    else
        alt otp mismatch
            BSvc->>BDB: incrementFailedAttempts; lock at 3 attempts
            BSvc-->>BCtrl: OtpInvalidException (401) / OtpLockedException (429)
        else OTP matches
            BSvc->>BDB: markOtpAsUsed; updateLastLogin
            BSvc->>BSvc: manually build UserDetailsImpl{id=buyerUserId, authorities=[ROLE_BUYER]} — no AuthenticationManager/UserDetailsServiceImpl involved
            BSvc->>Jwt: generateJwtToken(authentication) — same shared JwtUtils/HS256 key as seller
            Jwt-->>BSvc: accessToken
            BSvc->>Jwt: generateRefreshToken() + hashToken()
            Jwt-->>BSvc: rawRefreshToken
            BSvc->>BDB: save BuyerRefreshToken{tokenHash, expiresAt=+7 days}
            BSvc-->>BCtrl: BuyerLoginResponse{accessToken, refreshToken(raw), buyerUserId, username, phone, roles, passwordTemporary}
            BCtrl-->>BApi: 200 {status:"SUCCESS", data:...}
            BApi-->>BAuth: response
            alt passwordTemporary === true
                BAuth-->>BUI: no tokens stored — route to reset-password (temp password from e.g. a guest quote-request account)
            else
                BAuth->>Browser: localStorage.setItem(buyerUser, buyerLastLogin, buyerAccessToken, buyerRefreshToken, buyerTokenExpiresAt)
                BAuth->>Browser: setCookie("buyerToken", accessToken, 1 day) — separate cookie name from seller's "token"
                BAuth-->>BUI: redirect — /buyer_e8d45a1b/dashboard (client-side guard in dashboard/layout.tsx checks buyerAccessToken+buyerRefreshToken)
            end
        end
    end
    end

    Note over Browser,AF: SUBSEQUENT AUTHENTICATED REQUESTS — Authorization header attach (both roles)
    rect rgb(245,245,245)
    Browser->>SApi: any seller-domain call (request interceptor)
    SApi->>SApi: reads localStorage("accessToken") → sets header Authorization: Bearer <token>
    SApi->>AF: request with Bearer token
    Note right of AF: AuthTokenFilter parses the Bearer header, jwtUtils.validateJwtToken(), then<br/>userDetailsService.loadUserByUsername(username, preferBuyer) — preferBuyer=true only if the<br/>request URI contains "/buyer/", so an email registered as both buyer and seller resolves correctly.<br/>NOTE: SecurityConfig.filterChain() sets anyRequest().permitAll() — Spring Security enforces<br/>NOTHING at the HTTP layer; this filter only populates SecurityContext for app-code checks to read.
    AF-->>SApi: 200 (protected data) — normal case
    Browser->>BApi: any buyer-domain call (request interceptor)
    BApi->>BApi: reads localStorage("buyerAccessToken") → sets Authorization: Bearer <token>
    BApi->>AF: request with Bearer token (same shared filter/JwtUtils, different token/table)
    end

    Note over Browser,SDB: 401 / REFRESH HANDLING — src/lib/api.ts response interceptor (seller)
    rect rgb(255,235,235)
    AF-->>SApi: 401 Unauthorized (expired/invalid access token)
    alt request URL contains "/refresh", or is /authentication/login, /authentication/verify-otp, or /auth/signup
        SApi-->>Browser: reject as-is (treated as a normal auth failure, NOT session expiry — no refresh attempted)
    else any other protected call, and not already retried
        alt a refresh is already in flight (isRefreshing)
            SApi->>SApi: push {resolve,reject} onto failedQueue and wait
        else first 401 to arrive
            SApi->>SApi: set _retry=true, isRefreshing=true
            alt no refreshToken in localStorage
                SApi->>Browser: clear all seller auth localStorage keys + cookie "token"; redirect "/?showLogin=true&session=expired"
            else refreshToken present
                SApi->>SCtrl: raw axios.post(/authentication/refresh, {refreshToken}) — bypasses the `api` instance itself to avoid interceptor recursion
                SCtrl->>SSvc: refreshAccessToken(rawRefreshToken)
                SSvc->>Jwt: hashToken(rawRefreshToken)
                SSvc->>SDB: findByTokenHash(hash)
                alt not found, or !isValid() (revoked or past expiresAt)
                    SSvc-->>SCtrl: RefreshTokenException
                    SCtrl-->>SApi: 401 {message}
                    SApi->>Browser: clear auth keys + cookie + sessionStorage.clear(); redirect "/?showLogin=true&session=expired"
                else valid
                    SSvc->>SDB: stored.setRevokedAt(now) — ROTATE: old refresh token is now dead
                    SSvc->>Jwt: generateJwtToken(new auth) + generateRefreshToken() (new raw)
                    SSvc->>SDB: save new RefreshToken{tokenHash of new raw, +7 days}
                    SSvc-->>SCtrl: LoginResponse{new accessToken, new refreshToken}
                    SCtrl-->>SApi: 200 {accessToken, refreshToken}
                    SApi->>Browser: localStorage.setItem(accessToken, refreshToken); cookie "token" updated
                    SApi->>SApi: processQueue() — replays every request that had queued during the refresh
                    SApi->>AF: retry the original failed request with new Bearer token
                    AF-->>SApi: 200 (success)
                end
            end
        end
    end
    end

    Note over Browser,BDB: 401 / REFRESH HANDLING — src/lib/buyerApi.ts response interceptor (buyer, structurally identical, separate token set)
    rect rgb(255,240,245)
    AF-->>BApi: 401 Unauthorized
    alt url is /refresh, /buyer/authentication/login, /buyer/authentication/verify-otp, or /buyer/auth/signup
        BApi-->>Browser: reject as-is
    else
        BApi->>BApi: queue concurrent 401s the same way (isRefreshing/failedQueue)
        alt no buyerRefreshToken
            BApi->>Browser: clear buyerAccessToken/buyerRefreshToken/buyerTokenExpiresAt/buyerUser + cookie "buyerToken"; redirect "/buyer_e8d45a1b/login?session=expired"
        else
            BApi->>BCtrl: raw axios.post(/buyer/authentication/refresh, {refreshToken})
            BCtrl->>BSvc: refreshAccessToken(rawRefreshToken)
            BSvc->>BDB: findByTokenHash(hash); check isValid()
            alt invalid/expired/revoked
                BSvc-->>BCtrl: RefreshTokenException (401)
                BApi->>Browser: clear buyer auth keys + cookie; redirect to buyer login
            else valid
                BSvc->>BDB: revoke old row (setRevokedAt)
                BSvc->>BSvc: issueTokensForUser(buyerUser) — new access+refresh pair, new BuyerRefreshToken row persisted
                BCtrl-->>BApi: 200 {accessToken, refreshToken}
                BApi->>Browser: localStorage updated; cookie "buyerToken" updated
                BApi->>AF: retry original request with new Bearer token
            end
        end
    end
    end

    Note over SApi,BApi: NOT part of this flow but adjacent: src/utils/api.ts is a THIRD axios client (used by every product/* service, not by login) that attaches the Bearer token but has NO response interceptor at all — a 401 hit through it does not auto-refresh or redirect.
```

#### 6.2 Seller Onboarding (Registration → OTP → Admin Approval → Dashboard Access)

```mermaid
sequenceDiagram
    autonumber
    actor Seller
    participant SignupUI as SignupForm.tsx<br/>(seller_7a3b9f2c/components)
    participant RegisterUI as SellerRegister.tsx<br/>(seller_7a3b9f2c/components)
    participant CoordUI as CoordinatorForm.tsx
    participant AuthSvc as sellerAuthService<br/>(src/services/seller/authService.ts, uses lib/api.ts)
    participant RegSvc as sellerRegService<br/>(sellerRegistrationService.ts)
    participant SignupCtrl as SignupController<br/>(/auth/signup)
    participant AuthCtrl as AuthenticationController<br/>(/authentication)
    participant EmailOtpCtrl as TempSellerEmailOtpController<br/>(/temp-seller/email-otp)
    participant SmsOtpCtrl as SMSOTPController<br/>(/otp) + Twilio Verify
    participant TempCtrl as TempSellerController<br/>(/temp-sellers)
    participant TempSvc as TempSellerServiceImpl
    participant DB as tbl_temp_seller (+ address/<br/>coordinator/bankDetails/documents)
    participant S3 as AWS S3<br/>(tempsellers/{REQ_ID}/...)
    actor Admin
    participant AdminCtrl as AdminSellerController<br/>(/admin/sellers/review)
    participant ApprovalSvc as SellerApprovalServiceImpl
    participant SellerDB as tbl_seller (+ child tables)

    rect rgb(235,245,255)
    note over Seller,SignupCtrl: Phase 1 — Signup-first identity (must precede any TempSeller)
    Seller->>SignupUI: Enter fullName/email/password
    SignupUI->>AuthSvc: sendSignupOtp()
    AuthSvc->>SignupCtrl: POST /auth/signup
    SignupCtrl-->>AuthSvc: OTP emailed
    Seller->>SignupUI: Enter signup OTP
    SignupUI->>AuthSvc: verifySignupOtp()
    AuthSvc->>SignupCtrl: POST /auth/signup/verify-otp
    SignupCtrl-->>AuthSvc: User created in tbl_user (no tokens issued)
    note over Seller,AuthCtrl: Seller must now log in separately (2-step OTP login)
    Seller->>AuthSvc: login(username,password)
    AuthSvc->>AuthCtrl: POST /authentication/login
    AuthCtrl-->>AuthSvc: password OK, login OTP emailed (tbl_login_otp)
    Seller->>AuthSvc: verifyOtp(code)
    AuthSvc->>AuthCtrl: POST /authentication/verify-otp
    AuthCtrl-->>AuthSvc: accessToken + refreshToken (JWT, subject-only claims)
    AuthSvc-->>AuthSvc: store accessToken/refreshToken/user in localStorage<br/>+ mirror "token" into document.cookie
    end

    rect rgb(255,248,235)
    note over Seller,DB: Phase 2 — TempSeller registration wizard (SellerRegister.tsx, 5 steps)
    Seller->>RegisterUI: Open wizard (embedded in OnboardingGate or standalone)
    RegisterUI->>RegSvc: getTempSellerByUserId(userId)
    RegSvc->>TempCtrl: GET /temp-sellers/user/{userId}
    alt no prior draft (404)
        TempCtrl-->>RegSvc: 404 Not Found (swallowed as "nothing to resume")
    else DRAFT row exists
        TempCtrl-->>RegSvc: TempSeller row (status=DRAFT)
        RegSvc-->>RegisterUI: resume formData + tempSellerId
    end

    Seller->>CoordUI: Enter coordinator email/mobile
    CoordUI->>RegSvc: sendEmailOtp({email})
    RegSvc->>EmailOtpCtrl: POST /temp-seller/email-otp/send
    EmailOtpCtrl-->>RegSvc: 6-digit code emailed (tbl_temp_seller_email_otp, 5 min expiry)
    Seller->>CoordUI: Enter emailed OTP
    CoordUI->>RegSvc: verify email OTP
    RegSvc->>EmailOtpCtrl: POST /temp-seller/email-otp/verify
    EmailOtpCtrl-->>CoordUI: verified=true (self-hosted check, no attempt-lock)

    CoordUI->>RegSvc: sendSMSOtp({phone})
    RegSvc->>SmsOtpCtrl: POST /otp/send
    SmsOtpCtrl->>SmsOtpCtrl: Twilio Verify sends SMS (PhoneOTP audit row, 5 min)
    Seller->>CoordUI: Enter SMS OTP
    CoordUI->>RegSvc: verify SMS OTP
    RegSvc->>SmsOtpCtrl: POST /otp/verify
    SmsOtpCtrl->>SmsOtpCtrl: Twilio VerificationCheck.setCode() (server stores no code)
    SmsOtpCtrl-->>CoordUI: verified=true

    opt Seller clicks "Save Draft" at any step
        RegisterUI->>RegSvc: createDraftTempSeller() / updateDraftTempSeller()
        RegSvc->>TempCtrl: POST /temp-sellers/draft  or  PUT /temp-sellers/draft/{id}
        TempCtrl->>TempSvc: saveDraft(tempSellerId, dto)  [no @Valid, no SellerTypeFieldValidator]
        TempSvc->>DB: INSERT/UPDATE status=DRAFT (bad master-data ids logged & skipped, not thrown)
        DB-->>TempSvc: tempSellerId
        TempSvc-->>RegisterUI: TempSellerResponseDTO
    end

    Seller->>RegisterUI: Complete all 5 steps, click Submit
    RegisterUI->>RegSvc: createTempSeller(request)  OR  finalizeDraftTempSeller(tempSellerId, request)
    alt no existing draft
        RegSvc->>TempCtrl: POST /temp-sellers  (@Valid full TempSellerRequestDTO)
        TempCtrl->>TempSvc: createTempSeller(dto)
        TempSvc->>TempSvc: resolveAuthenticatedUser() — reads SecurityContext<br/>(AuthTokenFilter-populated); throws 401 if no valid Bearer JWT
        TempSvc->>TempSvc: sellerTypeFieldValidator.validate() (hard-throws on bad master refs)
    else existing DRAFT row
        RegSvc->>TempCtrl: POST /temp-sellers/draft/{tempSellerId}/finalize (@Valid)
        TempCtrl->>TempSvc: finalizeDraft(tempSellerId, dto)
        TempSvc->>TempSvc: guard: current status must be DRAFT, else throw
        TempSvc->>TempSvc: sellerTypeFieldValidator.validate() (same full validation as create)
    end
    TempSvc->>DB: persist TempSeller + address + coordinator + bankDetails<br/>+ documents (status = OPEN)
    TempSvc-->>TempSvc: sendConfirmationEmail() via IndependentEmailService (SMTP)
    TempSvc-->>RegisterUI: TempSellerResponseDTO {tempSellerId, sellerRequestId, status:"OPEN"}

    RegisterUI->>RegSvc: getTempSellerById(tempSellerId)
    RegSvc->>TempCtrl: GET /temp-sellers/{id}
    TempCtrl-->>RegisterUI: full row incl. per-document ids (for file-upload targeting)

    RegisterUI->>RegSvc: uploadDocuments(tempSellerId, multipart)
    RegSvc->>TempCtrl: POST /temp-sellers/{tempSellerId}/documents/upload<br/>(sellerImage, gstFile, bankFile, companyRegistrationCertificate,<br/>authorizationLetter, licenseFiles[]+licenseNames[]+documentIds[])
    TempCtrl->>S3: store each file under tempsellers/{REQ_ID}/{gst|bankdocument|<br/>companyregistrationcertificate|authorizationletter|licenses|sellerimage}/...
    S3-->>TempCtrl: S3 URLs
    TempCtrl-->>DB: replace "PENDING" placeholder URLs with real S3 URLs
    TempCtrl-->>RegisterUI: upload success
    RegisterUI-->>Seller: Success modal — "Application submitted" (status still OPEN)
    note over RegisterUI,TempCtrl: If document upload fails, RegisterUI calls<br/>DELETE /temp-sellers/{id} to roll back the just-created row
    end

    rect rgb(255,238,238)
    note over Admin,SellerDB: Phase 3 — Admin review (AdminSellerController / SellerApprovalServiceImpl)
    Admin->>AdminCtrl: POST /admin/sellers/review<br/>{id, status: ACCEPT | REJECT | CORRECTION, comments}
    AdminCtrl->>ApprovalSvc: processReview(request)
    alt status = CORRECTION
        ApprovalSvc->>DB: tempSeller.status = CORRECTION_REQUIRED
        ApprovalSvc->>ApprovalSvc: saveReviewHistory(CORRECTION_REQUIRED) [tbl_temp_seller_review_history]
        ApprovalSvc-->>Seller: HTML email with correction link (ADMIN_FRONTEND_URL/SellerCorrection/...)
        note over Seller,TempCtrl: Seller edits via PUT /temp-sellers/{id} (updateTempSeller)<br/>— only allowed from CORRECTION_REQUIRED (throws for APPROVED/<br/>REJECTED/RESUBMITTED/OPEN) — sets status = RESUBMITTED,<br/>looping back to Admin review
    else status = REJECT
        ApprovalSvc->>DB: tempSeller.status = REJECTED
        ApprovalSvc->>ApprovalSvc: saveReviewHistory(REJECTED)
        ApprovalSvc-->>Seller: HTML rejection email with reasons
    else status = ACCEPT
        ApprovalSvc->>ApprovalSvc: handleApproval(tempSeller, comments)
        ApprovalSvc->>ApprovalSvc: signupUser = tempSeller.getUser();<br/>throw ApplicationException if null (no orphaned-row auto-fix)
        ApprovalSvc->>ApprovalSvc: generateSellerId(): [2 chars sellerName][3 chars<br/>sellerTypeAbbreviation][4-digit global seq]<br/>via pg_advisory_xact_lock(12345) + MAX(sequence)+1
        ApprovalSvc->>SellerDB: PHASE 1 — INSERT Seller + SellerAddress + SellerCoordinator<br/>+ SellerBankDetails + SellerGST + SellerDocument rows,<br/>still pointing at OLD tempsellers/{REQ_ID}/... S3 URLs;<br/>seller.status="APPROVED", approvedAt=now, user=signupUser
        ApprovalSvc->>DB: tempSeller.status = APPROVED (flipped immediately after<br/>Phase 1, BEFORE any email/PDF I/O — non-atomic by design)
        ApprovalSvc->>ApprovalSvc: saveReviewHistory(APPROVED)
        ApprovalSvc->>S3: PHASE 2 — copy each file tempsellers/{REQ_ID}/... →<br/>sellers/{SELLER_ID}/{sellerimage|gst|bankdocument|<br/>licenses|companyregistrationcertificate}/..., then delete old object<br/>(best-effort: failures logged, never roll back the approval)
        S3-->>SellerDB: update SellerDocument/SellerGST/SellerBankDetails<br/>URLs to new sellers/{SELLER_ID}/... paths
        ApprovalSvc->>ApprovalSvc: sendApprovalAgreementEmail() — fetch SellerTerms PDF,<br/>email seller ID + login link (try/catch: failure never<br/>undoes the already-committed approval)
        ApprovalSvc-->>Seller: Approval email with Seller ID + PDF agreement attached<br/>("log in using the email/password you created during signup" —<br/>no new credentials are issued at approval time)
    end
    ApprovalSvc-->>AdminCtrl: SellerApprovalResultDTO {tempSellerId, userId, sellerId, status}
    end

    rect rgb(235,255,238)
    note over Seller,SellerDB: Phase 4 — First dashboard access post-approval
    Seller->>AuthSvc: login(username,password) [/authentication/login]
    AuthSvc->>AuthSvc: verifyOtp(code) [/authentication/verify-otp] → accessToken/refreshToken stored
    Seller->>RegisterUI: Navigate to /seller_7a3b9f2c/dashboard
    note over RegisterUI: seller_7a3b9f2c/layout.tsx guard: checks localStorage<br/>accessToken + refreshToken + sellerAuthService.isAuthenticated();<br/>redirects to /?showLogin=true if any are missing
    RegisterUI->>RegSvc: useSellerOnboardingStatus() → sellerProfileService.getCurrentSellerProfile()
    RegSvc->>SellerDB: GET /sellers/user/{userId}
    alt Seller row exists (approved)
        SellerDB-->>RegSvc: 200 SellerProfile
        RegSvc-->>RegisterUI: status = "approved"
        RegisterUI-->>Seller: OnboardingGate shows one-time "Registration Complete" screen<br/>(dismiss sets localStorage sellerRegistrationCompleteSeen_{userId})<br/>then renders the real dashboard Overview
    else no Seller row yet
        SellerDB-->>RegSvc: 404 (falls back to GET /temp-sellers/user/{userId})
        RegSvc-->>RegisterUI: status = "pending" (or "draft" if TempSeller.status=DRAFT)
        RegisterUI-->>Seller: OnboardingGate shows "Application Under Review" (blocks dashboard)
    end
    end
```

#### 6.3 Buyer Onboarding (Signup → OTP → Profile)

Buyer onboarding is two independently-gated layers: account signup (email+phone+password → email OTP → an immediately-loginable `BuyerUser`, no admin gate) and organization registration (`TempBuyer` draft → submit → admin ACCEPT/REJECT/CORRECTION → `Buyer`). The admin-approval layer is a full parallel pipeline to the seller flow — not a simplified stub — using the same ACCEPT/REJECT/CORRECTION state machine and the same two-phase commit-then-S3-migration pattern, just at roughly 40–60% the code volume (measured by line count) of its seller equivalent, and with a genuinely simpler, read-only buyer profile page (no edit flow, unlike the seller's).

```mermaid
sequenceDiagram
    autonumber
    actor Buyer
    participant SignupUI as buyer_e8d45a1b/signup<br/>(SignupForm, SignupOtpStep)
    participant BuyerApi as src/lib/buyerApi.ts
    participant SignupCtl as BuyerSignupController<br/>/buyer/auth/signup
    participant SignupSvc as BuyerSignupService
    participant LoginUI as Login modal<br/>(buyer_e8d45a1b/login)
    participant AuthCtl as BuyerAuthenticationController<br/>/buyer/authentication
    participant AuthSvc as BuyerAuthService
    participant Gate as BuyerOnboardingGate.tsx
    participant Wizard as BuyerRegister.tsx<br/>(Org -> Contact -> Compliance -> Review)
    participant TempCtl as TempBuyerController<br/>/temp-buyers
    participant TempSvc as TempBuyerServiceImpl
    participant AdminCtl as AdminBuyerController<br/>/admin/buyers/review
    participant ApprovalSvc as BuyerApprovalServiceImpl
    participant DB as tbl_buyer_user / tbl_temp_buyer / tbl_buyer

    Note over Buyer,SignupSvc: Layer 1 — Account signup (identical shape to seller's SignupController)
    Buyer->>SignupUI: fill fullName/email/phone/password
    SignupUI->>BuyerApi: POST /buyer/auth/signup
    BuyerApi->>SignupCtl: forward request
    SignupCtl->>SignupSvc: sendSignupOtp()
    SignupSvc->>DB: existsByEmail? (409 if taken)
    SignupSvc->>DB: save BuyerSignupOtp (otp, 5min expiry, bcrypt pwd hash)
    SignupSvc-->>Buyer: email OTP sent
    Buyer->>SignupUI: enter 6-digit OTP
    SignupUI->>BuyerApi: POST /buyer/auth/signup/verify-otp
    BuyerApi->>SignupCtl: forward request
    SignupCtl->>SignupSvc: verifyAndCreateBuyer()
    SignupSvc->>DB: validate OTP (unused, unexpired, matches)
    SignupSvc->>DB: re-check existsByEmail (race guard)
    SignupSvc->>DB: INSERT BuyerUser (emailVerified=true, phoneVerified=false)
    SignupSvc-->>SignupUI: "Account created. Please log in." (no tokens)
    SignupUI-->>Buyer: toast + open login modal

    Note over Buyer,AuthSvc: Login — password then email OTP then JWT (fully isolated from seller/tbl_user)
    Buyer->>LoginUI: email + password
    LoginUI->>BuyerApi: POST /buyer/authentication/login
    BuyerApi->>AuthCtl: forward
    AuthCtl->>AuthSvc: validateCredentialsAndSendOtp()
    AuthSvc->>DB: PasswordEncoder.matches() (manual, not AuthenticationManager)
    AuthSvc->>DB: invalidate prior OTPs, save new BuyerLoginOtp, email it
    Buyer->>LoginUI: enter login OTP
    LoginUI->>BuyerApi: POST /buyer/authentication/verify-otp
    BuyerApi->>AuthCtl: forward
    AuthCtl->>AuthSvc: verifyOtpAndIssueToken() (max 3 attempts, else OTP locked)
    AuthSvc->>DB: issue JWT accessToken + rotated SHA-256-hashed refreshToken
    AuthSvc-->>LoginUI: BuyerLoginResponse {accessToken, refreshToken, buyerUserId}
    LoginUI-->>Buyer: store buyerAccessToken/buyerRefreshToken + buyerToken cookie

    Note over Buyer,ApprovalSvc: Layer 2 — Organization registration (parallel state machine to seller's, NOT a stub)
    Buyer->>Gate: visit /buyer_e8d45a1b/dashboard
    Gate->>BuyerApi: GET /temp-buyers/user/{buyerUserId}
    BuyerApi->>TempCtl: forward (via useBuyerOnboardingStatus)
    TempCtl->>TempSvc: findByUserId()
    alt no TempBuyer yet
        TempSvc-->>Gate: 404 -> status "draft", tempBuyer=null
        Gate-->>Buyer: BuyerWelcomeOverview ("Register Your Business")
        Buyer->>Wizard: start 3-step wizard + Review
        loop each step
            Wizard->>BuyerApi: POST/PUT /temp-buyers/draft(/{id})
            BuyerApi->>TempCtl: forward (no bean validation, status=DRAFT)
        end
        Wizard->>BuyerApi: POST /temp-buyers/draft/{id}/finalize
        BuyerApi->>TempCtl: forward
        TempCtl->>TempSvc: finalizeDraft() (validate buyerType, GST-or-PAN)
        TempSvc->>DB: status DRAFT -> SUBMITTED
    else TempBuyer exists
        TempSvc-->>Gate: status (submitted/under_review/correction_required/rejected/approved)
        Gate-->>Buyer: BuyerStatusBanner / hub / checklist per status
    end

    Note over AdminCtl,DB: Admin review (outside buyer's own UI)
    AdminCtl->>ApprovalSvc: processReview(ACCEPT|REJECT|CORRECTION)
    alt ACCEPT
        ApprovalSvc->>DB: generate Buyer ID (advisory lock 54321)
        ApprovalSvc->>DB: INSERT Buyer+BuyerAddress+BuyerContact+BuyerDocument; TempBuyer -> APPROVED (Phase 1, committed)
        ApprovalSvc-->>DB: best-effort: migrate S3 files tempbuyers/{REQ_ID}/... -> buyers/{BUYER_ID}/..., email welcome (Phase 2, failures only logged)
    else REJECT / CORRECTION
        ApprovalSvc->>DB: TempBuyer -> REJECTED / CORRECTION_REQUIRED
        ApprovalSvc-->>DB: best-effort email notice
    end
    ApprovalSvc->>DB: INSERT TempBuyerReviewHistory (reviewedBy="ADMIN")

    Gate->>Buyer: status=approved -> one-time "Congratulations" screen -> real dashboard
    Buyer->>BuyerApi: GET /temp-buyers/user/{buyerUserId} (profile page, read-only, no edit flow)
```

#### 6.4 Product Creation, Category-Specific Attributes & Import

```mermaid
sequenceDiagram
    autonumber
    actor Seller
    participant AddProduct as AddProduct.tsx<br/>(products/add/page.tsx)
    participant MedForm as MedicalDevicesForm.tsx<br/>(consumable/non-consumable radio)
    participant CatForm as Category Form<br/>(DrugForm / ConsumableForm / NonConsumableForm /<br/>SupplementForm / CosmeticForm / FoodInfantForm)
    participant Svc as utils/api.ts client<br/>(ProductService.ts / ConsumbaleService.ts / etc.)
    participant PDC as ProductDetailsController<br/>(/products/create)
    participant PDS as ProductDetailsServiceImpl
    participant DB as tm_product_details +<br/>per-category attribute tables
    participant PIC as ProductImageController<br/>(/product-images/{productId})
    participant PImgSvc as ProductImageService (+S3Service)
    participant DocCtl as ProductUserManualController /<br/>ProductDocumentController /<br/>NutritionalInformationImageController
    participant DocSvc as ProductUserManualServiceImpl /<br/>ProductDocumentService (+S3Service)

    rect rgb(235,245,255)
    Note over Seller,CatForm: Manual entry path
    Seller->>AddProduct: Click "Add Product" -> pick category
    AddProduct->>CatForm: render (Drugs/Supplements/FoodInfant/Cosmetic directly;<br/>Medical Devices via MedForm radio -> Consumable/NonConsumable)
    Seller->>CatForm: Fill product/category-attribute/packaging fields,<br/>select images, certificate files, brochure/user-manual
    CatForm->>CatForm: Client-side validate (zod schema for Drug/Supplement;<br/>hand-rolled validate() for Consumable/NonConsumable/Cosmetic)
    end

    CatForm->>Svc: createDrugProduct / createConsumableProduct / ... (payload)
    Note right of CatForm: payload omits packaging/pricing at create time —<br/>attached later from the product view page.<br/>Certificate entries sent as {certificationId, certificateUrl:"PENDING"}
    Svc->>PDC: POST /products/create (Bearer token, JSON)
    PDC->>PDS: createProduct(dto, userId, allowMergeIntoExisting=false)
    PDS->>PDS: look up Seller by userId, Category by categoryId
    PDS->>PDS: generateProductId() = 2-letter seller prefix +<br/>3-letter product-name fragment + 5-digit global sequence
    PDS->>PDS: setChildRelationships(): per-category attribute checks<br/>(NonConsumable/Supplement/FoodInfant require certifications<br/>non-empty + category FK non-null; Consumable/Cosmetic check<br/>certifications != null only — empty list passes, dead check)
    PDS->>DB: save ProductDetails (status defaults PUBLISHED)<br/>+ cascaded attribute + placeholder ProductCertificateDocument rows
    DB-->>PDS: saved entity (productId, productAttributeId per category)
    PDS-->>PDC: ProductDetailsDto
    PDC-->>Svc: 200 OK { productId, productAttribute*[0].productAttributeId,<br/>certificateDocuments[] }
    Svc-->>CatForm: response.data

    CatForm->>CatForm: extract productId + productAttributeId from response

    opt images selected
        CatForm->>Svc: uploadProductImages(productId, files) /<br/>uploadSupplementProductImages(...)
        Svc->>PIC: POST /product-images/{productId} (multipart "images")
        PIC->>PImgSvc: uploadImages(productId, files)
        PImgSvc->>PImgSvc: validate each file non-empty + contentType startsWith "image/"
        PImgSvc->>DB: S3Service.uploadFile() per file, then save ProductImage rows
        PImgSvc-->>PIC: list of image URLs
        PIC-->>Svc: 200 OK
    end

    alt Drug category
        opt user manual file selected
            CatForm->>Svc: uploadProductUserManual(productAttributeId, file)
            Svc->>DocCtl: POST /userManual/{productAttributeId} (multipart "file")
            DocCtl->>DocSvc: uploadManual() — upsert 1:1 ProductUserManual
            DocSvc->>DB: S3 upload + save ProductUserManual row
        end
    else Food & Infant category
        opt user manual file selected
            CatForm->>Svc: uploadFoodInfantUserManual(productAttributeId, file)
            Svc->>DocCtl: POST /userManual/new/{productAttributeId}
            DocCtl->>DocSvc: uploadUserManual() — sets product_user_manual<br/>column directly on ProductAttributeFoodInfant
        end
        CatForm->>Svc: uploadNutritionalInformationImage(attributeId, categoryId, image)
        Svc->>DocCtl: POST /nutritionalInformationImage/{productAttributeId}
    else Supplement category
        opt nutritional image / brochure selected
            CatForm->>Svc: uploadNutritionalInformationImage(...) /<br/>uploadSupplementBrochure(attributeId, file)
            Svc->>DocCtl: POST /nutritionalInformationImage/{id} /<br/>POST /product-documents/supplements/{id}/brochure
        end
    else Consumable / Non-Consumable / Cosmetic category
        opt brochure file selected
            CatForm->>Svc: uploadConsumableBrochure / uploadNonConsumableBrochure /<br/>uploadCosmeticBrochure(attributeId, file)
            Svc->>DocCtl: POST /product-documents/{category}/{attributeId}/brochure
            DocCtl->>DocSvc: uploadXxxBrochure() — deleteIfRealUrl(existing),<br/>S3 upload, overwrite brochurePath column in place
        end
    end

    opt certificate files selected (Consumable/NonConsumable/Supplements/Cosmetic/Food)
        loop for each certificate with a new file
            CatForm->>Svc: uploadConsumableCertificate(attributeId, productCertificateDocumentId, file)<br/>(analogous uploadXxxCertificate/uploadFoodInfantCertificates for other categories)
            Svc->>DocCtl: POST /product-documents/{category}/{attributeId}/certificates<br/>(multipart: documentIds[] + certificateFiles[], same order)
            DocCtl->>DocSvc: uploadXxxCertificates()
            DocSvc->>DB: look up existing ProductCertificateDocument by documentId,<br/>verify it belongs to this productAttributeId (else 400),<br/>deleteIfRealUrl(old S3 object), S3 upload,<br/>overwrite certificateUrl in place (no new row)
        end
    end

    CatForm-->>Seller: show success modal / navigate to product view

    rect rgb(255,245,230)
    Note over Seller,DB: Bulk Excel/CSV import path (separate entry point)
    participant DF as DashboardFilters.tsx<br/>("Add Product" dropdown -> Excel/CSV)
    participant Ext as fetch() direct call<br/>(bypasses lib/api.ts AND utils/api.ts)
    participant PIC2 as ProductImportController<br/>(/products/import)
    participant UES as UniversalExcelImportService
    participant Fac as ProductImportStrategyFactory
    participant Strat as *ImportStrategy<br/>(Drug/Consumable/NonConsumable/<br/>Cosmetics/FoodInfant/Supplements)

    Seller->>DF: pick category + choose "Excel/CSV" method,<br/>upload .xlsx/.xls/.csv file
    DF->>Ext: POST hardcoded https://api-test-aggreator.tiameds.ai/api/v1/products/import<br/>(FormData: file, categoryId; Authorization: Bearer accessToken from localStorage)
    Note right of DF: BUG: IMPORT_API_URL is a hardcoded external<br/>staging host, NOT built from NEXT_PUBLIC_API_URL —<br/>unlike every other product service in this app
    Ext->>PIC2: POST /products/import (multipart file + categoryId)
    PIC2->>UES: importFile(file, userId, categoryId)
    UES->>UES: resolveStrategyKey(categoryId) via Category.categoryName<br/>(e.g. "CONSUMABLE MEDICAL DEVICES & EQUIPMENT" -> "CONSUMABLE")
    UES->>Fac: getStrategy(strategyKey)
    Fac-->>UES: matching @Component bean (case-insensitive key match)
    UES->>UES: open workbook/CSV; skip sheets named "Master"/"Masters";<br/>data rows start at index 2 (rows 0/1 are headers)
    loop for each data row with a non-blank Product Name
        UES->>Strat: mapRow(row, categoryId, userId) / mapCsv(record, categoryId, userId)
        Strat->>Strat: validateMandatoryExcel/Csv() — collects ALL violations,<br/>then throws ValidationException (not fail-fast). Placeholder<br/>ProductCertificateDocument rows built with<br/>certificateUrl="NOT_UPLOADED" / brochurePath="NOT_UPLOADED"
        Strat-->>UES: ProductDetailsDto (or ValidationException caught per-row)
        UES->>PDS: createProduct(dto, userId, allowMergeIntoExisting=true)
        Note right of PDS: true: same seller+productName+manufacturerName+categoryId<br/>merges as a new packaging/pricing variant via<br/>addVariantToExistingProduct() instead of a new row
        PDS->>DB: save (new product OR merged packaging/pricing variant)
        UES->>UES: record success, or capture row error (rowNumber, productName, message)
    end
    UES-->>PIC2: ExcelImportResultDto (totalRows, successCount, failureCount, errors[])
    PIC2-->>Ext: 200 OK
    Ext-->>DF: parse response, show per-row validation errors if any
    Note over Seller: Certificate/brochure/user-manual/image files still need<br/>the same per-category upload endpoints above —<br/>the Excel path does not upload any binary files itself
    end
```

#### 6.5 Stock / Batch Management

```mermaid
sequenceDiagram
    autonumber
    actor Seller
    participant PV as ProductView1.tsx<br/>(Stock Management section)
    participant SUM as StockUpdateModal.tsx<br/>(wizard: restock existing / create new batch)
    participant BSUM as BatchStockUpdateModal.tsx<br/>(quick per-batch +/- update)
    participant Svc as StockService.ts<br/>(addStock / getAvailableBatches / deleteBatch)
    participant Api as utils/api.ts<br/>(axios, Bearer token, NO 401 refresh)
    participant SC as StockController<br/>(/stock/**)
    participant SS as StockServiceImpl
    participant PDS as PricingDetailsServiceImpl<br/>(resolveOrCreateBatch)
    participant PD as PricingDetails<br/>(tm_pricing_details = the batch/lot)
    participant SL as StockLedger<br/>(tbl_stock_ledger, append-only)

    Note over PV: AddBatchModal.tsx is dead code on this branch —<br/>its main modal component was removed (commit "remove AddBatchModal<br/>integration"); only orphaned unused helper JSX remains, imported nowhere.

    Seller->>PV: Open product, view "Stock Management" batch list
    PV->>Svc: getAvailableBatches(productId)
    Svc->>Api: GET /stock/{productId}/batches
    Api->>SC: GET /stock/{productId}/batches
    SC->>SS: getAvailableBatchesFifo(productId, packagingId?)
    SS->>PD: findBy...StockQuantityGreaterThanOrderByManufacturingDateAsc
    PD-->>SS: batches (FIFO by manufacturingDate, deleted_at IS NULL)
    SS-->>SC: List<BatchAvailabilityDto>
    SC-->>PV: 200 batches

    alt Row-level "Update Stock" (quick +/- on one known batch)
        Seller->>PV: Click "Update Stock" on a batch row
        PV->>BSUM: open with batch (pricingId already known client-side)
        Seller->>BSUM: Enter +/- quantity, confirm
        BSUM->>Svc: addStock({productId, packagingId, batchLotNumber,<br/>manufacturingDate, expiryDate, quantity,<br/>referenceType:"MANUAL_STOCK_UPDATE"})
    else Wizard "Update Stock" — restock an existing batch
        Seller->>PV: Click top-level "Update Stock"
        PV->>SUM: open (step 1: choose update type)
        Seller->>SUM: Pick "Existing batch", select from list, enter quantity
        SUM->>Svc: addStock({productId, packagingId, batchLotNumber,<br/>manufacturingDate, expiryDate, quantity,<br/>referenceType:"MANUAL_STOCK_UPDATE"})
    else Wizard "Update Stock" — create a brand-new batch
        Seller->>PV: Click top-level "Update Stock"
        PV->>SUM: open (step 1: choose update type)
        Seller->>SUM: Pick "New batch": lot number, mfg/expiry dates, qty,<br/>MRP, selling price, discount%, special discounts,<br/>shelf life, new packagingDetails
        SUM->>Svc: validateBatchNumber (GET /pricing/validateBatchNumber) [pre-check]
        SUM->>Svc: addStock({productId, packagingDetails{...},<br/>batchLotNumber, manufacturingDate, expiryDate, quantity,<br/>mrp, sellingPrice, discountPercentage, specialDiscounts[],<br/>shelfLifeMonths/Days, dateOfStockEntry,<br/>referenceType:"MANUAL_STOCK_UPDATE"})
    end

    Svc->>Api: POST /stock/add  (Bearer token attached; no refresh-on-401)
    Api->>SC: POST /stock/add
    SC->>SS: addStock(StockInRequestDto, userId)
    SS->>SS: load Seller by userId, load ProductDetails by productId
    SS->>SS: verify product.seller == calling seller (else 401 Unauthorized)

    alt packagingId given
        SS->>SS: resolvePackaging() — must belong to this product
    else packagingDetails given (new-batch flow)
        SS->>PD: PackagingDetailsService.resolveOrCreatePackaging(...)
    end

    SS->>PDS: resolveOrCreateBatch(product, packaging, candidatePricingDetails,<br/>sellerName, sellerId)
    PDS->>PD: lookup by (productId[, packagingId], batchLotNumber)

    alt Batch lot number already exists in scope
        alt existing.expiryDate != candidate.expiryDate
            PDS-->>SS: throw BadRequestException("...different expiry date")
            SS-->>SC: 400 error
            SC-->>Api: 400
            Api-->>Svc: reject
            Svc-->>SUM: extractErrorMessage(err) shown inline
        else expiry matches — RESTOCK
            PDS->>PD: existing.stockQuantity += candidate.stockQuantity
            Note over PDS,PD: mrp/sellingPrice/discountPercentage/gstPercentage/finalPrice<br/>are NOT touched on restock — no pricing recalculation happens here.
            PDS-->>SS: existing PricingDetails (updated qty)
        end
    else No such batch yet — CREATE
        PDS->>PD: generatePricingId() = <2-letter seller prefix>BTCH<5-digit seq><br/>(synchronized, mirrors ProductDetails' own generator)
        PDS->>PD: set productDetails, packagingDetails, dateOfStockEntry (default=today),<br/>createdBy, createdDate; mrp/sellingPrice/discountPercentage/gstPercentage<br/>are taken as-is from the request — still no computed/derived pricing
        PDS-->>SS: new PricingDetails (unsaved)
    end

    SS->>PD: pricingDetailsRepository.save(batch)
    SS->>SL: buildLedgerRow(batch, product, seller, userId,<br/>STOCK_IN, quantity, batch.stockQuantity, referenceId, referenceType)
    SS->>SL: stockLedgerRepository.save(ledger)  — append-only audit row
    SS-->>SC: StockLedgerResponseDto{ledgerId, pricingId, batchLotNumber,<br/>transactionType=STOCK_IN, quantity, balanceAfter, ...}
    SC-->>Api: 200 OK
    Api-->>Svc: response.data
    Svc-->>SUM: StockLedgerResponse
    Svc-->>BSUM: StockLedgerResponse

    SUM->>SUM: setResult({batchNumber, previousStock = balanceAfter-quantity,<br/>addedStock = quantity, updatedStock = balanceAfter}) → SuccessView
    BSUM->>BSUM: same derived-preview success view
    SUM->>PV: onSuccess() -> refetchProduct()
    BSUM->>PV: onSuccess() -> refetchProduct()
    PV->>Svc: getDrugProductById(productId) — re-render Stock Management table

    Note over SC,SL: No pricing recalculation is triggered anywhere in this flow.<br/>PricingDetails.finalPrice is never computed/set by any live code path<br/>(only commented-out Excel-import setters exist). GST/discount math for a<br/>batch's sellingPrice/discountPercentage/gstPercentage only happens later,<br/>at order time, in OrderPlacementServiceImpl — not on stock add/restock.

    opt Delete a batch (soft delete)
        Seller->>PV: Click "Delete" on a batch row
        PV->>Svc: deleteBatch(productId, pricingId)
        Svc->>Api: DELETE /stock/{productId}/batches/{pricingId}
        Api->>SC: DELETE /stock/{productId}/batches/{pricingId}
        SC->>SS: deleteBatch(productId, pricingId, userId)
        SS->>SS: verify ownership; load batch; verify batch belongs to product
        alt batch.stockQuantity > 0
            SS->>SL: write STOCK_OUT ledger row (quantity=previousQty,<br/>balanceAfter=0, referenceType="BATCH_DELETED")
        end
        SS->>PD: set deletedBy, deletedAt (stockQuantity left untouched —<br/>@SQLRestriction("deleted_at IS NULL") excludes it from all totals/availability)
        SS-->>SC: BatchDeleteResponseDto
        SC-->>PV: 200 OK
        PV->>Svc: refetchProduct()
    end
```

#### 6.6 Order Placement, Fulfillment, Invoice, Cancellation & Return

```mermaid
sequenceDiagram
    autonumber

    actor Buyer
    participant BuyerUI as Buyer UI<br/>(checkout/page.tsx,<br/>orders/page.tsx,<br/>OrderDetailContent.tsx)
    participant OrderCtrl as OrderController<br/>(/orders)
    participant PlaceSvc as OrderPlacementServiceImpl
    participant StockSvc as StockService<br/>(FIFO debit/restock)
    participant OrderDB as Order / SellerOrder /<br/>OrderItem / Payment (DB)

    actor Seller
    participant SellerUI as Seller UI<br/>(seller_7a3b9f2c/orders/page.tsx)
    participant SOCtrl as SellerOrderController<br/>(/seller-orders)
    participant FulfillSvc as SellerOrderFulfillmentServiceImpl
    participant Twilio as TwilioOTPService

    participant InvCtrl as InvoiceController<br/>(/invoices)
    participant InvSvc as InvoiceServiceImpl
    participant S3 as S3Service

    participant PayCtrl as PaymentController<br/>(/payments)

    participant APIClient as No frontend caller found<br/>(returns/refunds/invoices/payments<br/>are backend-only today)
    participant RetCtrl as ReturnController<br/>(/returns)
    participant RetSvc as ReturnRefundServiceImpl
    participant CancelSvc as OrderCancellationServiceImpl

    Note over OrderCtrl,RetCtrl: SecurityConfig.filterChain = anyRequest().permitAll()<br/>(no @PreAuthorize anywhere in this flow) — only<br/>SellerOrderController resolves the actor from the JWT;<br/>everywhere else actorId/buyerId/sellerId is trusted from the request body.

    rect rgb(235,245,255)
    Note over Buyer,OrderDB: 1. ORDER PLACEMENT — POST /orders (real UI: checkout/page.tsx -> orderService.placeOrder)
    Buyer->>BuyerUI: Checkout cart (or "Place Order" from an ACCEPTED QuoteRequest)
    BuyerUI->>OrderCtrl: POST /orders {buyerId, lines[] or quoteRequestId, idempotencyKey}
    OrderCtrl->>PlaceSvc: placeOrder(request)
    alt idempotencyKey already used
        PlaceSvc-->>OrderCtrl: return the ORIGINAL Order unchanged (no duplicate)
    else new order
        PlaceSvc->>PlaceSvc: resolve product/seller/packaging server-side per line<br/>(sellerId never trusted from client)
        PlaceSvc->>StockSvc: hasSufficientStock() then debitStock() (FIFO, per line)
        StockSvc-->>PlaceSvc: debited batches (1 line may span multiple batches)
        Note right of PlaceSvc: A line that can't be fulfilled is dropped into<br/>rejectedLines instead of failing the whole order<br/>(BadRequestException only if EVERY line fails)
        PlaceSvc->>PlaceSvc: group resulting OrderItems by sellerId<br/>(LinkedHashMap) -> build one SellerOrder per seller<br/>id = SORD-{orderId-suffix}-{seq}, status=PLACED
        PlaceSvc->>OrderDB: save Order (status=OrderStatus.PLACED,<br/>id=ORD-yyyyMMdd-##### via pg advisory lock 98765)
        PlaceSvc->>OrderDB: save Payment (provider=COD,<br/>status=PaymentStatus.SUCCESS, paidAt=now,<br/>id=PAY-yyyyMMdd-##### via advisory lock 98766)
        Note right of OrderDB: COD-only build, no gateway/webhook —<br/>every order is settled SUCCESS immediately.<br/>Invoice is NOT generated here (only on delivery).
        PlaceSvc-->>OrderCtrl: OrderResponseDTO (+ rejectedLines[])
    end
    OrderCtrl-->>BuyerUI: 201 Created
    BuyerUI-->>Buyer: order confirmation
    end

    rect rgb(235,255,240)
    Note over Seller,Twilio: 2. SELLER-ORDER FULFILLMENT — real UI: seller_7a3b9f2c/orders/page.tsx -> sellerOrderService.ts
    Seller->>SellerUI: Confirm order
    SellerUI->>SOCtrl: PATCH /seller-orders/{id}/confirm (JWT -> sellerId, ownership checked)
    SOCtrl->>FulfillSvc: confirm(sellerOrderId, sellerId)
    FulfillSvc->>FulfillSvc: require PLACED -> set CONFIRMED,<br/>write OrderStatusHistory, recompute Order rollup
    FulfillSvc-->>SellerUI: SellerOrder(CONFIRMED)

    SellerUI->>SOCtrl: PATCH /seller-orders/{id}/pack
    SOCtrl->>FulfillSvc: pack(): require CONFIRMED -> PACKED

    SellerUI->>SOCtrl: PATCH /seller-orders/{id}/ship {courierName, trackingNumber, trackingUrl}
    SOCtrl->>FulfillSvc: ship(): require PACKED -> SHIPPED (records courier info)

    SellerUI->>SOCtrl: PATCH /seller-orders/{id}/out-for-delivery
    SOCtrl->>FulfillSvc: markOutForDelivery(): require SHIPPED -> OUT_FOR_DELIVERY
    FulfillSvc->>Twilio: sendOTP(buyer delivery phone) [best-effort, failure only logged]

    Seller->>SellerUI: Buyer reads OTP aloud at doorstep
    opt buyer says OTP never arrived
        SellerUI->>SOCtrl: PATCH /seller-orders/{id}/resend-delivery-otp
        SOCtrl->>FulfillSvc: resendDeliveryOtp() (only while OUT_FOR_DELIVERY, not a status transition)
        FulfillSvc->>Twilio: sendOTP() again (failure IS surfaced this time)
    end

    SellerUI->>SOCtrl: PATCH /seller-orders/{id}/deliver {otp}
    SOCtrl->>FulfillSvc: markDelivered(sellerOrderId, sellerId, otp)
    FulfillSvc->>Twilio: verifyOTP(phone, otp)
    Twilio-->>FulfillSvc: valid (else BadRequestException BEFORE any state mutation)
    FulfillSvc->>InvSvc: generateInvoiceWithPdfBytes(sellerOrderId) [best-effort,<br/>try/catch — a PDF/S3 failure never blocks DELIVERED]
    InvSvc->>S3: uploadFileFromResource(invoice PDF)
    InvSvc->>OrderDB: save Invoice (INV-{sellerId}-{FYstartYY}{FYendYY}-#####,<br/>one per SellerOrder, sequential per seller per FY)
    FulfillSvc->>OrderDB: SellerOrder OUT_FOR_DELIVERY -> DELIVERED,<br/>deliveredAt=now, recompute Order rollup
    FulfillSvc-->>SellerUI: SellerOrder(DELIVERED)
    end

    rect rgb(255,250,230)
    Note over APIClient,S3: 3. INVOICE — no frontend UI calls this;<br/>only reachable via a direct API client
    APIClient->>InvCtrl: POST /invoices/generate/{sellerOrderId}
    InvCtrl->>InvSvc: generateInvoice()
    alt Invoice already exists for this SellerOrder
        InvSvc->>S3: GET existing PDF bytes (plain java.net.http.HttpClient)
        InvSvc-->>InvCtrl: same Invoice (idempotent — no duplicate numbering)
    else no invoice yet
        InvSvc->>OrderDB: create Invoice as in step 2
    end
    APIClient->>InvCtrl: GET /invoices/{invoiceId}
    InvCtrl-->>APIClient: invoiceNumber, invoiceFileUrl, generatedAt

    APIClient->>PayCtrl: GET /payments/{paymentId}
    PayCtrl-->>APIClient: Payment row (read-only; class javadoc says<br/>no gateway/webhook is integrated — COD-only)
    end

    rect rgb(255,235,235)
    Note over Buyer,OrderDB: 4. CANCELLATION — real UI: OrderDetailContent.tsx / seller orders page<br/>only legal while SellerOrder is PLACED, CONFIRMED or PACKED
    alt buyer cancels whole Order
        BuyerUI->>OrderCtrl: POST /orders/{orderId}/cancel {actorRole:BUYER, actorId, reason}
        OrderCtrl->>CancelSvc: cancelOrder() — SELLER role is REJECTED on this endpoint,<br/>ADMIN unrestricted
    else buyer or seller cancels one SellerOrder
        BuyerUI->>SOCtrl: (buyer, via buyerApi) PATCH /seller-orders/{id}/cancel
        SellerUI->>SOCtrl: (seller) PATCH /seller-orders/{id}/cancel
        SOCtrl->>CancelSvc: cancelSellerOrder()
    end
    CancelSvc->>StockSvc: restockExactBatch() per OrderItem (by pricingId)
    CancelSvc->>OrderDB: OrderItem.itemStatus=CANCELLED,<br/>SellerOrder.status=CANCELLED
    opt Payment.status == SUCCESS
        CancelSvc->>OrderDB: create Refund(status=REQUESTED,<br/>orderItem=null i.e. whole-seller-order scope,<br/>amount=sellerOrder.grandTotal)
    end
    CancelSvc->>OrderDB: recompute Order rollup (OrderStatusRollup.compute)
    end

    rect rgb(245,235,255)
    Note over APIClient,RetSvc: 5. RETURN / REFUND — no frontend UI calls /returns anywhere in this repo
    APIClient->>RetCtrl: POST /returns {orderItemId, buyerId, reason}
    RetCtrl->>RetSvc: requestReturn()
    RetSvc->>RetSvc: require SellerOrder.status==DELIVERED AND<br/>now <= deliveredAt + 7 days (RETURN_WINDOW_DAYS, hardcoded placeholder)
    RetSvc->>OrderDB: create ReturnRequest(status=REQUESTED),<br/>SellerOrder DELIVERED -> RETURN_REQUESTED

    APIClient->>RetCtrl: PATCH /returns/{id}/decision {sellerId, approve, comment}
    RetCtrl->>RetSvc: decideReturn() — only legal while ReturnRequest==REQUESTED
    alt approve = true
        RetSvc->>OrderDB: ReturnRequest -> APPROVED,<br/>SellerOrder -> RETURN_APPROVED
        RetSvc->>OrderDB: create Refund(status=REQUESTED, orderItem=that item,<br/>amount=item.lineTotal), linked to the ReturnRequest
    else approve = false
        RetSvc->>OrderDB: ReturnRequest -> REJECTED,<br/>SellerOrder -> RETURN_REJECTED (terminal — no Refund)
    end

    APIClient->>RetCtrl: POST /returns/refunds/{refundId}/process
    RetCtrl->>RetSvc: processRefund() — idempotent no-op if already COMPLETED
    RetSvc->>OrderDB: Refund.status=COMPLETED, processedAt=now
    RetSvc->>StockSvc: restockExactBatch() (unconditional — no "resellable" flag exists)
    RetSvc->>OrderDB: SellerOrder -> RETURNED (actorRole=SYSTEM, terminal state)
    Note right of OrderDB: Payment.status is NEVER updated to REFUNDED here —<br/>PaymentStatus.REFUNDED/PARTIALLY_REFUNDED and<br/>SellerOrderStatus.REFUNDED are declared but dead code.<br/>ReturnStatus.PICKED_UP/CLOSED are also declared but never set —<br/>an approved ReturnRequest stays APPROVED forever.
    end
```

#### 6.7 Buyer/Seller Quote Request Workflow (RFQ / Price Request)

A buyer (logged in, or an anonymous guest) submits a Price Request or RFQ against one specific product; the seller is auto-resolved from that product. The workflow is strictly linear/single-shot — no counter-offer, no re-quote, no edit/cancel endpoint exists anywhere in the code.

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Buyer / Guest
    participant FE_B as Frontend: Product Page<br/>(RequestPriceForm / GetQuoteForm)
    participant BQC as BuyerQuoteRequestController
    participant QRS as QuoteRequestService
    participant DB as tbl_quote_request
    actor Seller as Seller
    participant FE_S as Frontend: Conversions Page
    participant SQC as SellerQuoteRequestController
    participant FE_B2 as Frontend: Buyer RFQ Page
    participant FE_CO as Frontend: Checkout Page
    participant OPS as OrderPlacementServiceImpl

    Note over Buyer,DB: 1. Submission (PRICE_REQUEST or RFQ)
    Buyer->>FE_B: Fill form (product, qty, contact info,<br/>+ type-specific fields)
    FE_B->>BQC: POST /buyer/quote-requests (guest allowed)
    BQC->>BQC: resolveOptionalBuyerUserId()<br/>(JWT if ROLE_BUYER, else null)
    BQC->>QRS: create(buyerUserId?, dto)
    alt buyerUserId == null (guest)
        QRS->>QRS: resolveOrCreateGuestBuyer()<br/>(match by email, or auto-provision<br/>BuyerUser + temp password, email it)
    end
    QRS->>QRS: seller = product.getSeller()<br/>(buyer never chooses seller)
    QRS->>DB: save QuoteRequest(status=PENDING)
    QRS-->>Buyer: best-effort confirmation email
    QRS-->>Seller: best-effort new-request email
    QRS-->>FE_B: QuoteRequestResponseDTO

    Note over Seller,DB: 2. Seller responds (one-shot, PENDING only)
    Seller->>FE_S: Open Conversions / Quote Requests
    FE_S->>SQC: GET /seller/quote-requests
    SQC->>QRS: listForSeller(sellerId from JWT)
    QRS->>DB: findBySeller_SellerId...
    DB-->>FE_S: list (incl. this PENDING request)
    Seller->>FE_S: Enter quotedPrice, validUntil, notes
    FE_S->>SQC: PATCH /seller/quote-requests/{id}/respond
    SQC->>QRS: respond(id, sellerId, dto)
    alt status != PENDING
        QRS-->>SQC: 400 "already responded to"
    else status == PENDING
        QRS->>DB: set quotedPrice/quoteValidUntil/sellerNotes,<br/>status=QUOTED
        QRS-->>Buyer: best-effort "you've received a quote" email
        QRS-->>FE_S: updated DTO
    end

    Note over Buyer,DB: 3. Buyer accepts or rejects (QUOTED only)
    Buyer->>FE_B2: Open RFQ dashboard
    FE_B2->>BQC: GET /buyer/quote-requests
    BQC->>QRS: listForBuyer(buyerUserId from JWT)
    QRS->>DB: findByBuyerUser_BuyerUserId...
    DB-->>FE_B2: list (incl. this QUOTED request)
    alt Buyer accepts
        Buyer->>FE_B2: Click Accept
        FE_B2->>BQC: PATCH /buyer/quote-requests/{id}/accept
        BQC->>QRS: accept(id, buyerUserId)
        alt status != QUOTED
            QRS-->>BQC: 400 "Only a quoted request can be accepted"
        else status == QUOTED
            QRS->>DB: status=ACCEPTED
        end
    else Buyer rejects
        Buyer->>FE_B2: Click Reject
        FE_B2->>BQC: PATCH /buyer/quote-requests/{id}/reject
        BQC->>QRS: reject(id, buyerUserId)
        alt status != QUOTED
            QRS-->>BQC: 400 "Only a quoted request can be rejected"
        else status == QUOTED
            QRS->>DB: status=REJECTED
        end
    end

    Note over Buyer,OPS: 4. Accepted quote → Order (separate downstream flow)
    Buyer->>FE_B2: Click "Place Order" (only if org approved)
    FE_B2->>FE_CO: navigate /checkout?quoteRequestId={id}
    FE_CO->>OPS: place order referencing quoteRequestId
    alt status == ORDER_PLACED already
        OPS-->>FE_CO: error "already placed as order <orderId>"
    else status != ACCEPTED
        OPS-->>FE_CO: error (not accepted)
    else status == ACCEPTED
        OPS->>OPS: build order line item from<br/>product/quantity/quotedPrice
        OPS->>DB: status=ORDER_PLACED, orderId=&lt;new order id&gt;
        OPS-->>FE_CO: Order created
    end
```

#### 6.8 Master Data Retrieval — No Pagination/Sort/Search Convention

There is **no** pagination, sorting, or search-query convention anywhere in this codebase. Every list endpoint returns the entire result set in one response; the seller Products page's search/sort/filter/paging is implemented **entirely client-side**, on the already-fully-fetched array, and none of that state is ever sent back to the server.

```mermaid
sequenceDiagram
    autonumber
    participant UI as ProductList.tsx (seller Products page)
    participant FE as ProductService.ts / sellerOrderService.ts
    participant PDC as ProductDetailsController
    participant SOC as SellerOrderController
    participant SVC as Service layer
    participant DB as Repository / DB

    Note over UI,DB: No endpoint in the backend accepts page/size/sort — confirmed by repo-wide grep

    UI->>FE: getProductList()
    FE->>PDC: GET /products/getAll  (NO page, size, sort, or search params)
    PDC->>SVC: getAllProducts(userId)
    SVC->>DB: findAll-style query, no Pageable, no LIMIT/OFFSET
    DB-->>SVC: entire result set
    SVC-->>PDC: List of ProductDetailsDto (ALL rows)
    PDC-->>FE: 200 OK, raw List (no envelope, no count)
    FE-->>UI: full array

    Note over UI: Everything below happens client-side, in the browser,<br/>on the already-fetched full array — never sent back to the server
    UI->>UI: data.filter(searchTerm, categoryFilter, stockFilter, statusFilter)
    UI->>UI: sortData(filteredData, sortOption)
    UI->>UI: sortedData.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE) — PAGE_SIZE hardcoded = 10

    Note over FE,SOC: The ONE real backend filter param found anywhere: status
    FE->>SOC: GET /seller-orders/seller/{sellerId}?status=SHIPPED
    SOC->>SVC: getSellerOrdersBySeller(sellerId, status)
    SVC->>DB: query filtered by status (still no page/size)
    DB-->>SVC: full filtered result set
    SVC-->>SOC: List of SellerOrderResponseDTO
    SOC-->>FE: ApiResponse{status,message,data,count} — count = data.size(), not a page total

    Note over PDC,SOC: Master-data controllers (StateMasterController /states,<br/>DistrictMasterController /districts/state/{stateId}, etc.)<br/>behave like ProductDetailsController: full list, path-variable<br/>scoping only, zero query-string params, no pagination.
```

#### 6.9 System Architecture (reference)

See Section 3 for the full system-architecture diagram (`docs/diagrams/system-architecture.mmd`).

#### 6.10 Deployment Architecture (reference)

See Section 8 for the full deployment-architecture diagram (`docs/diagrams/deployment-architecture.mmd`).

#### 6.11 Component Diagram (reference)

```mermaid
flowchart TB
    subgraph FE["FRONTEND — pharma-aggregator-client (Next.js 16 App Router)"]
        direction TB

        subgraph FE_Routes["Routing (src/app/**)"]
            R_Public["Public: page.tsx, about/, contact/,<br/>product/[id]/{request-price,get-quote}"]
            R_Seller["seller_7a3b9f2c/**<br/>dashboard, products (add/edit/view), profile,<br/>orders, conversions, settings*, shipment*<br/>(* = UnderDevelopment stub)"]
            R_Buyer["buyer_e8d45a1b/**<br/>login, signup, dashboard (orders, rfq, profile,<br/>catalog*, suppliers*, support*)"]
            R_Checkout["checkout/, orders/[orderId]<br/>reset-password/, reset-password/[token]"]
            R_Dead["(auth)/login_fhy26sb/**<br/>ORPHANED — calls non-existent /api/seller/* routes,<br/>linked from nowhere in the app"]
        end

        subgraph FE_Modals["Global auth surfaces"]
            M_Seller["LoginModals.tsx<br/>(real seller login/OTP/reset UI)"]
            M_Buyer["BuyerLoginModal / BuyerSignupModal<br/>(mounted in root layout.tsx)"]
        end

        subgraph FE_Services["Services layer (src/services/**)"]
            S_Seller["seller/*<br/>authService, updateProfileService,<br/>SellerRegMasterService, IFSCService,<br/>sellerRegistrationService"]
            S_Buyer["buyer/*<br/>buyerAuthService, buyerProfileService,<br/>buyerRegistrationService, quoteRequestService,<br/>orderService"]
            S_Product["product/*<br/>ProductService (Drug), ConsumbaleService,<br/>NonConsumbaleService, SupplementService,<br/>CosmeticService, FoodInfantService,<br/>+ shared lookups (PackType, Molecule,<br/>TherapeuticCategory, StorageCondition, Pricing)"]
            S_Other["StockService.ts, sellerOrderService.ts,<br/>quoteRequestService.ts (seller side)"]
            S_Stub["admin/TestService.ts, buyer/TestService.ts<br/>one-line placeholders — no admin UI in this app"]
        end

        subgraph FE_Api["API clients"]
            A_Lib["lib/api.ts (seller, refresh-aware)"]
            A_Buyer["lib/buyerApi.ts (buyer, refresh-aware)"]
            A_Utils["utils/api.ts (product/master, no refresh)"]
        end

        subgraph FE_Support["Cross-cutting"]
            Sch["src/schema/** — Zod validation<br/>(mostly manual .parse()/.safeParse(),<br/>react-hook-form used in only 7 files)"]
            State["localStorage tokens, CartContext,<br/>useSessionManager (30-min seller inactivity logout),<br/>react-toastify + react-hot-toast (both live)"]
            ProxyDead["src/proxy.ts — DEAD CODE<br/>wrong filename/export, never wired as middleware"]
        end

        R_Seller --> M_Seller
        R_Seller --> S_Seller
        R_Seller --> S_Product
        R_Seller --> S_Other
        R_Buyer --> M_Buyer
        R_Buyer --> S_Buyer
        R_Checkout --> S_Buyer
        R_Checkout --> S_Other
        S_Seller --> A_Lib
        S_Buyer --> A_Buyer
        S_Product --> A_Utils
        S_Other --> A_Utils
        FE_Routes --> Sch
        FE_Routes --> State
    end

    subgraph BE["BACKEND — pharma-aggregator-server (Spring Boot monolith, /api/v1)"]
        direction TB

        subgraph BE_Security["Security"]
            Sec_Config["SecurityConfig<br/>anyRequest().permitAll() is LIVE —<br/>role-scoped rules exist only commented out"]
            Sec_Filter["AuthTokenFilter + JwtUtils<br/>HS256 JWT (subject-only claims),<br/>opaque SHA-256-hashed rotating refresh tokens"]
        end

        subgraph BE_Auth["Auth & Onboarding controllers/services"]
            C_SellerAuth["SignupController, AuthenticationController,<br/>AuthController (seller)"]
            C_BuyerAuth["BuyerSignupController,<br/>BuyerAuthenticationController,<br/>BuyerProfileController"]
            C_TempSeller["TempSellerController + OTP controllers<br/>(TempSellerEmailOtpController, SMSOTPController)<br/>-> TempSellerServiceImpl"]
            C_TempBuyer["TempBuyerController<br/>-> TempBuyerServiceImpl"]
            C_Admin["AdminSellerController, AdminBuyerController,<br/>AdminOrderController, AdminSellerApprovalController<br/>-> SellerApprovalServiceImpl / BuyerApprovalServiceImpl<br/>/ SellerProfileService / OrderQueryServiceImpl"]
        end

        subgraph BE_Master["Master / Reference Data"]
            C_Master["8 controller/master/* (State/District/Taluka,<br/>SellerType, BuyerType, CompanyType,<br/>ProductType, DocumentType) — GET-only"]
            C_ProdLookup["controller/product/* lookups<br/>(MastersController god-service, DosageForm,<br/>PackType, Therapeutic, Category, GST%, etc.)"]
        end

        subgraph BE_Product["Product Catalog"]
            C_ProductCrud["ProductDetailsController<br/>-> ProductDetailsServiceImpl<br/>(create/update/delete, per-category attribute rules)"]
            C_Import["ProductImportController<br/>-> UniversalExcelImportService<br/>-> ProductImportStrategyFactory<br/>-> 6x *ImportStrategy (Strategy pattern)"]
            C_Docs["ProductImageController, ProductDocumentController,<br/>ProductUserManualController,<br/>NutritionalInformationImageController<br/>-> S3Service"]
        end

        subgraph BE_StockOrder["Stock, Pricing & Orders"]
            C_Stock["StockController, PricingDetailsController<br/>-> StockServiceImpl, PricingDetailsServiceImpl<br/>(batch/lot ledger, FIFO debit, advisory-lock IDs)"]
            C_Order["OrderController, SellerOrderController,<br/>InvoiceController, PaymentController, ReturnController<br/>-> OrderPlacementServiceImpl,<br/>SellerOrderFulfillmentServiceImpl,<br/>OrderCancellationServiceImpl,<br/>ReturnRefundServiceImpl, InvoiceServiceImpl"]
        end

        subgraph BE_Quote["Quote Requests"]
            C_Quote["BuyerQuoteRequestController,<br/>SellerQuoteRequestController<br/>-> QuoteRequestService"]
        end

        subgraph BE_Misc["Content / Misc"]
            C_Content["LegalContentController, IFSCOverrideController,<br/>HomeController (health checks)"]
        end

        subgraph BE_Repo["Persistence"]
            Repo["Spring Data JPA repositories<br/>(one package per domain, mirrors controller layout)"]
        end

        Sec_Filter --> BE_Auth
        Sec_Filter --> BE_Master
        Sec_Filter --> BE_Product
        Sec_Filter --> BE_StockOrder
        Sec_Filter --> BE_Quote
        Sec_Filter --> BE_Misc
        Sec_Config -.->|"configures"| Sec_Filter

        C_SellerAuth --> Repo
        C_BuyerAuth --> Repo
        C_TempSeller --> Repo
        C_TempBuyer --> Repo
        C_Admin --> Repo
        C_Master --> Repo
        C_ProdLookup --> Repo
        C_ProductCrud --> Repo
        C_Import --> C_ProductCrud
        C_Docs --> Repo
        C_Stock --> Repo
        C_Order --> C_Stock
        C_Quote --> C_Order
        C_Content --> Repo
    end

    A_Lib -->|"HTTP/JSON, Bearer JWT"| Sec_Filter
    A_Buyer -->|"HTTP/JSON, Bearer JWT"| Sec_Filter
    A_Utils -->|"HTTP/JSON, Bearer JWT"| Sec_Filter

    Repo --> DB[("PostgreSQL")]
    C_Docs --> S3ext[("AWS S3")]
    C_TempSeller --> S3ext
    C_TempBuyer --> S3ext
    C_Order --> S3ext
    C_TempSeller --> TwilioExt["Twilio Verify"]
    C_TempBuyer --> TwilioExt
    C_Order --> TwilioExt
    C_SellerAuth --> SmtpExt["SMTP (JavaMailSender)"]
    C_BuyerAuth --> SmtpExt
    C_Admin --> SmtpExt
```

---

### 7. Integration Points

| Integration | Direction | Protocol | Purpose | Auth Mechanism | Evidence |
|---|---|---|---|---|---|
| Frontend ↔ Backend (seller domain) | Bidirectional | HTTPS/JSON via Axios | All seller-facing API calls | Bearer JWT + refresh-token rotation | `src/lib/api.ts` |
| Frontend ↔ Backend (buyer domain) | Bidirectional | HTTPS/JSON via Axios | All buyer-facing API calls | Bearer JWT + refresh-token rotation (isolated from seller) | `src/lib/buyerApi.ts` |
| Frontend ↔ Backend (product/master domain) | Bidirectional | HTTPS/JSON via Axios | Product CRUD, master-data lookups | Bearer JWT, **no refresh handling** | `src/utils/api.ts` |
| Frontend → AWS S3 | Outbound (indirect, via backend) | HTTPS multipart upload → backend → S3 SDK v2 | Product images/docs, onboarding documents, invoices | AWS static credentials (backend-held) | `S3Config.java`, `S3Service.java` |
| Backend → Twilio Verify | Outbound | HTTPS (Twilio SDK) | SMS OTP send/verify for phone verification | Twilio Account SID/Auth Token/Verify Service SID | `TwilioConfig.java`, `TwilioOTPService.java` |
| Backend → SMTP server | Outbound | SMTP | All transactional email (OTP, confirmations, approval/rejection notices) | SMTP credentials via `SPRING_MAIL_*` | `EmailService.java`, `application-dev.yml` |
| Frontend → Razorpay public IFSC API | Outbound (direct from browser) | HTTPS | Bank IFSC code → branch details lookup | None (public API) | `IFSCService.ts` |
| Frontend → bankify.in | Outbound (direct from browser) | HTTPS | IFSC lookup fallback | None (public API) | `IFSCService.ts` |
| Frontend → backend `/ifsc/{code}` | Outbound (direct from browser) | HTTPS | IFSC lookup for KSCB-prefixed codes / last-resort fallback | None | `IFSCService.ts`, `IFSCOverrideController.java` — **note**: URL is malformed (missing `/` separator), so this call 404s in practice |
| Frontend bulk-import → hardcoded external host | Outbound (direct from browser) | HTTPS multipart | Excel/CSV bulk product import | Bearer token manually attached | `DashboardFilters.tsx` — hits `https://api-test-aggreator.tiameds.ai/api/v1/products/import`, a different deployment than `NEXT_PUBLIC_API_URL` |
| CI/CD → Amazon ECR / ECS | Outbound (pipeline) | AWS API | Container image push + deployment | AWS credentials (GitHub Actions secrets) | `.github/workflows/tests.yml` |
| Backend → PostgreSQL | Outbound | JDBC | All persistent state | DB credentials per profile | `application-{dev,test,prod}.yml` |

---

### 8. Deployment Architecture

The **backend** has an evidenced, real CI/CD pipeline and AWS deployment target for its **test environment only**. The **frontend** has containerization assets (`Dockerfile`, `docker-compose.yml`) but **no evidenced CI/CD pipeline or cloud deployment target** — no `.github/` directory or other CI config exists in `pharma-aggregator-client`.

```mermaid
flowchart TB
    subgraph Dev["Local development"]
        DevWs["Developer workstation"]
        FEDockerCompose["Frontend docker-compose.yml<br/>single 'app' service, port 3000:3000, env_file .env"]
        BEDockerCompose["Backend docker-compose.yml<br/>app-dev/postgres-dev (8080/5432)<br/>app-test/postgres-test (8081/5433)<br/>app-prod/postgres-prod (8082/5434)<br/>each postgres:16-alpine, own named volume"]
        DevWs --> FEDockerCompose
        DevWs --> BEDockerCompose
    end

    subgraph FEImage["Frontend Docker image (Dockerfile, 3-stage)"]
        FEBuilder["Stage: builder — node:20-alpine<br/>npm run build<br/>(next.config.ts: output: 'standalone')"]
        FERunner["Stage: runner — node:20-alpine<br/>runs as non-root user 'nextjs' (uid/gid 1001)<br/>copies .next/standalone + .next/static + public<br/>CMD node server.js · EXPOSE 3000"]
        FEBuilder --> FERunner
    end

    subgraph BEImage["Backend Docker image (Dockerfile, multi-stage)"]
        BEBuilder["Stage: build — maven:3.9.9-eclipse-temurin-17-alpine<br/>mvn -q -DskipTests package"]
        BERunner["Stage: runtime — eclipse-temurin:17-jre-alpine<br/>curl installed (used by ECS health check)<br/>ENV SPRING_PROFILES_ACTIVE=dev (overridable)<br/>ENTRYPOINT java -jar app.jar · EXPOSE 8080"]
        BEBuilder --> BERunner
    end

    FEDockerCompose --> FEImage
    BEDockerCompose --> BEImage

    subgraph CI["GitHub Actions — backend repo only<br/>(no .github/, no CI config of any kind found in the frontend repo)"]
        Qodana["qodana_code_quality.yml<br/>JetBrains Qodana static/security scan<br/>on push to dev/main/test + all pull requests<br/>NO build step, NO test execution, NO deploy"]
        TestsYml["tests.yml — filename says 'tests', content is the real CI/CD pipeline<br/>trigger: push/PR to the 'test' branch, or manual dispatch<br/>1. mvn -DskipTests clean install (tests explicitly skipped)<br/>2. docker build, tag = commit SHA<br/>3. push image to Amazon ECR<br/>4. render deploy/tiamed-aggregator-task-defination.json with the new image<br/>5. amazon-ecs-deploy-task-definition, wait-for-service-stability<br/>(a post-deploy health-check step exists in the file but is fully commented out)"]
    end

    BERunner -.->|"image built from this Dockerfile"| TestsYml

    subgraph AWSTest["AWS — 'test' environment (the only environment with an evidenced ECS deployment)<br/>region ap-south-1 · account 977098986605"]
        ECR[("Amazon ECR<br/>repo referenced by GitHub secret ECR_REPOSITORY<br/>image tag = git commit SHA")]
        SecretsMgr[("AWS Secrets Manager<br/>secret name: pharma_aggregator_test<br/>DB_URL / DB_PORT / DB_NAME / DB_USERNAME / DB_PASSWORD<br/>AWS_ACCESS_KEY / AWS_SECRET_KEY / AWS_REGION / AWS_BUCKET_NAME<br/>ACCOUNT_SID / AUTH_TOKEN / SERVICE_SID<br/>SPRING_MAIL_HOST / PORT / USERNAME / PASSWORD<br/>(injected as `secrets`, never as plaintext `environment`)")]
        ECSTask["ECS Fargate task definition<br/>family: tiamed-aggregator-task-defination<br/>1 vCPU / 3 GB memory · linux/x86_64<br/>container 'pharma-aggregator-test', port 8080 -> 8080 (awsvpc)<br/>plaintext env var: SPRING_PROFILES_ACTIVE=test"]
        ECSService["ECS Service / Cluster<br/>name supplied at deploy time via GitHub secrets<br/>ECS_SERVICE / ECS_CLUSTER (not literal values in the repo)"]
        CWLogs[("Amazon CloudWatch Logs<br/>log group: /ecs/tiameds-tiamed-aggregator-task-defination<br/>driver: awslogs, stream prefix 'ecs'")]
        RDS[("Amazon RDS — PostgreSQL<br/>dev profile hardcodes the endpoint<br/>pharma-aggregator-test.*.rds.amazonaws.com directly in source;<br/>test profile's DB_URL/DB_PORT/DB_NAME are injected via Secrets Manager<br/>(same naming pattern — not confirmed to be the identical instance)")]
        S3Bucket[("Amazon S3 bucket<br/>name from AWS_BUCKET_NAME secret<br/>accessed via AWS SDK v2, StaticCredentialsProvider")]
        IAMRole["IAM role: ecsTaskExecutionRole<br/>used as BOTH taskRoleArn and executionRoleArn"]

        TestsYml -->|"docker push"| ECR
        TestsYml -->|"register + deploy"| ECSTask
        ECR -->|"pulled at task launch"| ECSTask
        ECSTask --> ECSService
        ECSTask -.->|"secretsmanager ARN references"| SecretsMgr
        ECSService --> CWLogs
        ECSService -->|"JDBC"| RDS
        ECSService -->|"S3 SDK calls"| S3Bucket
        ECSTask --> IAMRole
    end

    subgraph HealthCheck["Container health check (evidenced directly in the task definition JSON)"]
        HC["curl -f http://localhost:8080/api/v1/public/health-check<br/>interval 30s / timeout 5s / retries 3 / startPeriod 60s<br/>backed by HomeController's GET /public/health-check"]
    end
    ECSTask --> HC

    subgraph NotEvidenced["Explicitly NOT evidenced in discovery — omitted rather than invented"]
        NE1["No Application Load Balancer, API Gateway, or reverse proxy<br/>appears in the ECS task definition or any config file read"]
        NE2["No CloudFront / CDN configuration found"]
        NE3["No CI/CD pipeline or cloud deployment target found for the FRONTEND<br/>(only a Dockerfile + docker-compose.yml, run locally)"]
        NE4["No production ECS task definition found — only the 'test'-tagged<br/>family exists; application-prod.yml instead points at a local<br/>docker-compose 'postgres-prod' host, suggesting prod may run via<br/>docker-compose rather than ECS, but this is not confirmed"]
        NE5["No blue/green or canary deployment strategy evidenced —<br/>amazon-ecs-deploy-task-definition performs a standard rolling update"]
    end
```

Environment summary (as evidenced in `application-{dev,test,prod}.yml`):

| Profile | `ddl-auto` | Datasource | Swagger UI | Flyway |
|---|---|---|---|---|
| `dev` | `update` | Hardcoded AWS RDS endpoint | Enabled, try-it-out on | Enabled (`baseline-on-migrate: true`) |
| `test` | `update` | Env-var driven (`DB_URL`/`DB_PORT`/`DB_NAME`) | Enabled, try-it-out on | Enabled (same block as dev) |
| `prod` | `validate` | Local docker-compose `postgres-prod` host | **Disabled** (`springdoc.swagger-ui.enabled: false`) | No `spring.flyway` block — falls back to library defaults |

---

### 9. Scalability & Performance

| Item | Status | Detail |
|---|---|---|
| Stateless JWT authentication | **IMPLEMENTED** | `SessionCreationPolicy.STATELESS`, CSRF disabled — standard for horizontal scale-out (`SecurityConfig.java`) |
| Refresh-token rotation with concurrent-request queueing | **IMPLEMENTED** | Both `src/lib/api.ts` and `src/lib/buyerApi.ts` coalesce concurrent 401s behind one in-flight refresh call | 
| FIFO batch consumption with pessimistic row locking | **IMPLEMENTED** | `StockServiceImpl.debitStock` uses `PESSIMISTIC_WRITE`-locked queries inside a single `@Transactional` method to prevent overselling under concurrent debits (`PricingDetailsRepository.lockAvailableBatchesForDebit`) |
| Sequential ID generation via Postgres advisory locks | **IMPLEMENTED** | Seller IDs (lock key `12345`), Buyer IDs (`54321`), Order IDs (`98765`), Payment IDs (`98766`) — serializes ID generation under concurrent approvals/placements without a global table lock |
| Idempotent order placement | **IMPLEMENTED** | `PlaceOrderRequestDTO.idempotencyKey` — a repeat call with the same key returns the original `Order` unchanged |
| Idempotent invoice generation | **IMPLEMENTED** | Re-calling `POST /invoices/generate/{sellerOrderId}` for an existing invoice re-fetches the stored PDF rather than regenerating/renumbering it |
| Pagination on list endpoints | **NOT IDENTIFIED** | Searched: every controller for `Pageable`/`PageRequest`/`Sort.by`/`page`/`size`/`limit`/`offset` query params across the entire backend — found none in live code (one dead, commented-out `Sort.by` line). All list endpoints (`GET /products/getAll`, `GET /sellers`, `GET /temp-sellers`, `GET /buyer/quote-requests`, etc.) return the entire unpaginated result set |
| Server-side filtering/search/sort | **NOT IDENTIFIED** | The only real backend query-param filter found anywhere is an optional `status` string on two order-list endpoints. All product-list search/sort/filter/pagination in the seller UI (`ProductList.tsx`) runs client-side, in the browser, on the full fetched array |
| Connection pooling tuning | **NOT IDENTIFIED** | No HikariCP settings found anywhere in `src/main/resources` — Spring Boot/HikariCP defaults apply in every profile |
| Caching layer (Redis/Memcached/CDN) | **NOT IDENTIFIED** | No cache dependency, no CDN configuration, in either repository |
| Horizontal scaling / auto-scaling configuration | **NOT IDENTIFIED** | The ECS task definition specifies a fixed task (no `desiredCount`/auto-scaling policy evidenced); no load balancer target group was found |
| Invoice numbering race-condition guard | **PARTIALLY IMPLEMENTED** | `InvoiceRepository.countByInvoiceNumberPrefix` is a plain `COUNT(*)` query with **no** advisory lock (unlike Seller/Buyer/Order/Payment ID generation) — the repository's own doc comment accepts this as a theoretical race under concurrent generation for the same seller+financial-year |
| GST/pricing recalculation on stock restock | **NOT IMPLEMENTED (by design of current code)** | Confirmed by direct read of `PricingDetailsServiceImpl`: restocking a batch never recalculates `finalPrice`, `gstPercentage`, `discountPercentage`, or `sellingPrice` — those are computed only once, at order time, in `OrderPlacementServiceImpl` |
| — | RECOMMENDATION — NOT CURRENTLY IMPLEMENTED | Add `Pageable`-based pagination to all list endpoints, especially `GET /products/getAll`, `GET /sellers`, `GET /temp-sellers`, and `GET /admin/orders`, before catalog/order volume grows |
| — | RECOMMENDATION — NOT CURRENTLY IMPLEMENTED | Introduce a read-side cache (e.g. Redis) for master/reference-data lookups (states/districts/talukas, product-category masters) — these are unauthenticated, read-only, and rarely change, making them ideal cache candidates |
| — | RECOMMENDATION — NOT CURRENTLY IMPLEMENTED | Apply a Postgres advisory lock (or a `SELECT ... FOR UPDATE` sequence table) to invoice-number generation to close the documented race condition |
| — | RECOMMENDATION — NOT CURRENTLY IMPLEMENTED | Define an ECS auto-scaling policy and an Application Load Balancer in front of the ECS service, currently absent from the task definition |
| — | RECOMMENDATION — NOT CURRENTLY IMPLEMENTED | Unify the three frontend Axios clients (or at minimum add 401/refresh handling to `utils/api.ts`) so a token expiry during product management does not silently fail requests |

---

### 10. Security Considerations (Summary)

Full detail — JWT/refresh-token mechanics, CORS configuration, password hashing, exception-handling architecture, and the complete authorization gap analysis — lives in **[`08-SECURITY-AND-DEPLOYMENT.md`](./08-SECURITY-AND-DEPLOYMENT.md)**. This section is a summary only.

The single most consequential security fact in this codebase, cited throughout Sections 3–8 because it affects nearly every flow: **`SecurityConfig.java`'s live filter-chain rule is `auth.anyRequest().permitAll()`** — every HTTP endpoint in the backend is reachable without a valid JWT at the Spring Security layer. A stricter, role-scoped rule set exists in the same file but is entirely commented out. `AuthTokenFilter` still runs and populates `SecurityContext` on every request, so any "requires authentication" behavior described elsewhere in this document (e.g. `resolveAuthenticatedUser()` in `TempSellerServiceImpl`, JWT-derived seller/buyer identity in `SellerOrderController`) is enforced **only by application code reading that context**, not by the framework.

Other summary points (see the linked document for full detail and file citations):

- Passwords: `BCryptPasswordEncoder` (backend), correctly never sent/stored client-side beyond the login form.
- Tokens: HS256 JWT with subject-only claims (no roles embedded), paired with an opaque, SHA-256-hashed, single-use-rotation refresh token — a sound pattern, but access-token expiry in `application-dev.yml`/`application-test.yml` is set to 24 hours with an inline comment admitting this is a "temporary" override of an intended 30 minutes.
- Session storage: tokens are kept in `localStorage` and mirrored into a plain, **non-httpOnly** `document.cookie` (`token` for sellers, `buyerToken` for buyers) — vulnerable to XSS token theft by design of this pattern.
- Many admin-only endpoints (`POST /admin/buyers/review`, `POST /admin/orders/{orderId}/override`) have **no application-level authorization check at all** in the controller itself, relying entirely on the (currently disabled) framework-level rule.
- CORS is configured with an explicit origin whitelist in `CrossConfig.java`, but several individual controllers additionally carry `@CrossOrigin(origins = "*")`, which conflicts with the whitelist+credentials configuration — Spring's precedence between the two was not resolved during discovery.
- No admin UI exists in this frontend for any of the admin-only backend actions described above (see Section 2.2).

---

### 11. Assumptions & Constraints

#### 11.1 Verified (directly confirmed by opening source files)

- Single Spring Boot monolith at context path `/api/v1`, default port 8080.
- PostgreSQL is the only database engine used, in all three profiles.
- Three independent frontend Axios clients exist with materially different failure-handling behavior.
- No admin frontend exists anywhere in the `pharma-aggregator-client` repository.
- The system is COD-only — no payment gateway or webhook integration exists in `PaymentServiceImpl` (confirmed: it has exactly one method, `getByPaymentId`).
- `src/proxy.ts` is genuinely dead code (wrong filename and export name for Next.js middleware auto-wiring); real route protection is 100% client-side, post-mount.
- AWS S3 (SDK v2), Twilio Verify, and SMTP (JavaMailSender) are the only three external SaaS integrations found in the backend.
- The backend CI/CD pipeline (`tests.yml`) explicitly skips test execution (`-DskipTests`) while still deploying to ECS.

#### 11.2 Unknowns (could not be confirmed from source)

- Whether the frontend is deployed anywhere beyond a developer's local `docker-compose up` — no CI/CD or hosting configuration was found for it.
- Whether the "test" RDS instance referenced in the dev profile and the one injected via Secrets Manager for the test profile are the same physical database.
- How (or whether) the production environment is actually deployed — `application-prod.yml` exists and is internally consistent, but no ECS task definition, CI/CD trigger, or hosting evidence for a "prod" target was found in either repository.
- The identity and nature of the external "admin frontend" implied by the `app.admin-frontend-url` property (used to build correction-request email links) — no such application was located in either repository provided for this review.
- Production RPO/RTO targets, backup schedules, or disaster-recovery procedures — **Not identified in the current implementation.**
- Any compliance certification (SOC 2, ISO 27001, HIPAA, etc.) — **Not identified in the current implementation.**
- Production domain names / public URLs for either the frontend or the backend — **Not identified in the current implementation** beyond the `pharma-aggregator-test.*.rds.amazonaws.com` RDS hostname and the `api-test-aggreator.tiameds.ai` staging host referenced in one frontend file.

#### 11.3 Constraints (structural, evidenced in code)

- All authorization is enforced in application code, not the Spring Security framework — a constraint on how safely new endpoints can be added without an explicit, deliberate authorization check.
- The three-Axios-client split means any future auth-flow change (e.g. tightening 401 handling) must be applied in up to three places to have full effect.
- `ddl-auto: validate` in production means the production schema **must** be kept in sync manually via the ad hoc SQL scripts under `docs/` — Flyway alone will not create or evolve the production schema for anything beyond the three tracked migrations.
- No test suite exists in either repository, so no automated regression safety net constrains change — every code change up to this point has relied on manual verification.

---

### 12. Risks & Mitigations

| # | Risk | Impact | Likelihood | Evidence | Mitigation |
|---|---|---|---|---|---|
| 1 | `SecurityConfig.anyRequest().permitAll()` leaves every backend endpoint reachable without authentication at the framework level | Critical — data exposure, unauthorized admin actions (e.g. `POST /admin/orders/{orderId}/override` has no controller-level check at all) | High (live in current code) | `SecurityConfig.java` | Uncomment and adapt the existing role-scoped `authorizeHttpRequests` block; add `@PreAuthorize` to every admin/mutating endpoint as defense-in-depth |
| 2 | No frontend CI/CD pipeline or cloud deployment target evidenced | Deployments are manual/ungoverned; no build gate, no automated deploy | Medium-High | Absence of `.github/` in `pharma-aggregator-client` | Stand up a CI/CD pipeline mirroring the backend's `tests.yml` pattern, adapted for a Next.js `standalone` build |
| 3 | Bulk Excel/CSV import posts to a hardcoded external staging host, bypassing `NEXT_PUBLIC_API_URL` | Silent data-routing bug — imports may land on a different backend/database than every other feature in a given deployment | High (functional bug, not just a security concern) | `DashboardFilters.tsx` `IMPORT_API_URL` constant | Route bulk import through the same configured API base URL as every other service |
| 4 | `IFSCService.ts`'s backend-fallback URL is malformed (missing `/`) | Silent 404s on the one IFSC lookup path meant to hit this app's own backend | Medium | `IFSCService.ts` | Fix the string concatenation to insert the missing path separator |
| 5 | CI/CD explicitly skips test execution (`mvn -DskipTests`) before every deploy, and no test framework exists in either repo | Regressions reach the "test" ECS environment with zero automated verification | High | `tests.yml`, absence of any test framework/config in both repos | Introduce a test suite and re-enable `mvn test` (or an equivalent) as a required, non-skippable CI gate |
| 6 | No pagination on any list endpoint | Unbounded response payloads as data grows — `GET /products/getAll`, `GET /sellers`, `GET /admin/orders` will all degrade linearly with table size | Medium (grows over time) | Repo-wide grep for `Pageable`/`page`/`size` params, confirmed absent | Add `Pageable` support incrementally, starting with the highest-cardinality endpoints (products, orders) |
| 7 | Access-token expiry hardcoded to 24 hours in dev/test with a comment admitting it's a "temporary" override of an intended 30 minutes | Wider-than-intended attack window if a token is exfiltrated | Medium | `application-dev.yml`, `application-test.yml` inline comments | Restore the intended 30-minute expiry (or shorter) for non-local environments; rely on the already-implemented refresh-token rotation for session continuity |
| 8 | Non-httpOnly cookies (`token`, `buyerToken`) mirror JWTs into `document.cookie`, readable by any script | XSS on any page in the app can exfiltrate a live session token | Medium | `sellerAuthService.ts`, `buyerAuthService.ts` | Migrate to httpOnly, Secure cookies set by the backend, dropping the client-side `document.cookie` mirror entirely |
| 9 | Two-phase, non-atomic S3-migration-after-DB-commit pattern in both seller and buyer approval (`SellerApprovalServiceImpl`, `BuyerApprovalServiceImpl`) can leave an approved record pointing at stale `temp*/...` S3 URLs if the migration step fails | Broken document links for an approved seller/buyer, discovered only when someone tries to open the file | Low-Medium (failures are logged but never surfaced or retried) | Both `*ApprovalServiceImpl.java` files, confirmed via direct read | Add a retry queue or a reconciliation job that re-attempts failed S3 migrations, and surface migration failures to an operator dashboard |
| 10 | Orphaned dead-code paths remain reachable/confusing: `(auth)/login_fhy26sb/**` (calls non-existent API routes), two duplicate `/reset-password` implementations, `AddBatchModal.tsx`'s unused remnants | Developer confusion, risk of a future change being made to the wrong (dead) file | Low (code-quality risk, not a runtime risk) | Confirmed via grep across `src/` — zero live references to these paths | Delete the dead code in a dedicated cleanup PR once confirmed genuinely unreachable |
| 11 | GST/discount/final-price fields on a stock batch are never recalculated after initial creation, even on restock | A batch's displayed pricing can silently drift from what the seller intended if they update MRP/discount elsewhere without realizing restock doesn't touch it | Low-Medium | `PricingDetailsServiceImpl.resolveOrCreateBatch`, confirmed via direct read | Add an explicit "update pricing" action distinct from "add stock", or warn the seller in the UI that restock does not change price fields |

---

# Part 2 — Low-Level Design (LLD)

## Low-Level Design Document — Pharma Aggregator Marketplace

### 1. Document Control

| Field | Value |
|---|---|
| Document | Low-Level Design (LLD) |
| System | Pharma Aggregator Marketplace (`pharma-aggregator-server` Spring Boot backend + `pharma-aggregator-client` Next.js 16 frontend) |
| Scope | Full-stack: backend domain modules (product, order, seller/buyer onboarding, security, admin), and frontend routing/services/schemas/auth layers that consume them |
| Backend repo | `D:/Tiameds_MarketPlace/Backend/pharma-aggregator-server` (Java 17/21, Spring Boot 4.0.1 parent, PostgreSQL, Flyway, AWS S3, Twilio Verify) |
| Frontend repo | `D:/Tiameds_MarketPlace/Frontend/pharma-aggregator-client` (Next.js 16 App Router, React 19, TypeScript, Tailwind v4 + MUI + Bootstrap) |
| Backend base path | `/api/v1` (`server.servlet.context-path`, `src/main/resources/application.yml`) |
| Frontend API base | `NEXT_PUBLIC_API_URL` (`.env`: `http://localhost:8080/api/v1`) |
| Source basis | Direct reads of controller/service/entity/repository source files (paths cited inline) plus a prior structured discovery pass over both repos; every claim below is grounded in a cited file — nothing is inferred beyond what the code shows |
| Status labels used throughout | **IMPLEMENTED** (verified in source) · **PARTIALLY IMPLEMENTED** (exists but incomplete) · **NOT IDENTIFIED** (searched, not found — search basis stated) · **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED** (a suggestion, never conflated with fact) |
| Known material gaps this document is honest about | No admin UI exists in the frontend (`src/services/admin/TestService.ts` is a one-line stub); Spring Security's active rule is `auth.anyRequest().permitAll()` (`config/SecurityConfig.java`) so almost all authorization is application-code-level, not framework-level; the backend has test-scope dependencies declared but effectively one smoke test; several frontend service calls target non-existent or malformed backend routes (documented in §7) |

---

### 2. Module Overview

The system is organized as 13 backend domain modules (one Spring Boot monolith, package-scoped) and 5 frontend cross-cutting layers. Each module table below lists package/path, responsibility, and its controllers/services/repositories/entities/DTOs/validators/dependencies as verified in source.

#### M1 — Master / Reference Data

| Aspect | Detail |
|---|---|
| Package/Path | `controller/master`, `service/master`, `service/serviceImpl/master`, `entity/master`, `repository/master` |
| Responsibility | Read-only lookups for geography (State→District→Taluka) and seller/buyer/company/product/document type dropdowns consumed by registration wizards |
| Controllers | `BuyerTypeMasterController`, `CompanyTypeMasterController`, `DistrictMasterController`, `DocumentTypeMasterController`, `ProductTypeMasterController`, `SellerTypeMasterController`, `StateMasterController`, `TalukaMasterController` — all `GET`-only, no writes anywhere in the package |
| Services | One `*MasterService`/`*MasterServiceImpl` pair per entity; `ProductTypeMasterServiceImpl` is the only one that filters `isActive=true` via a stream (the rest either use `findAllByIsActiveTrue` — `BuyerTypeMasterService` — or return all rows with no filter — Company/Seller/Document type services) |
| Repositories | `StateMasterRepository`, `DistrictMasterRepository` (`findByStateStateId`), `TalukaMasterRepository` (`findByDistrictDistrictId`), plus one per remaining entity; `RoleMasterRepository` lives under `repository/auth`, not `repository/master` |
| Entities | `StateMaster` (`tbl_state_master`), `DistrictMaster` (`tbl_district_master`), `TalukaMaster` (`tbl_taluka_master`), `CompanyTypeMaster`, `SellerTypeMaster`, `ProductTypeMaster`, `BuyerTypeMaster` (FK `mandatoryDocumentTypeId` → `DocumentTypeMaster`), `DocumentTypeMaster`, `RoleMaster` (`tbl_role_master`, no controller anywhere) |
| DTOs | `*ResponseDTO` per entity; `BuyerTypeMasterController` is the only one wrapped in the shared `ApiResponse{status,message,data,count}` envelope — every sibling controller returns a raw `List` |
| Validators | None (read-only) |
| Dependencies | Consumed by M5 (Seller registration wizard), M7 (Buyer registration wizard), M2 (Category chain) |

#### M2 — Product Catalog Core

| Aspect | Detail |
|---|---|
| Package/Path | `controller/product` (core), `service/product/productImpl`, `service/product/util`, `entity/product` |
| Responsibility | Multi-category product CRUD (Drug, Consumable Medical, Non-Consumable Medical, Supplements/Nutraceuticals, Cosmetic & Personal Care, Food & Infant Nutrition), Strategy-pattern bulk Excel/CSV import, per-category document/certificate/image upload |
| Controllers | `ProductDetailsController` (`/products/create`, `/getAll`, `/getById/{id}`, `/all`, `/update/{id}`, `/delete/{id}`, `/{id}/packaging`, `/subcategories/{categoryId}`), `ProductImportController` (`/products/import` — active), `ExcelProductImportController` (entirely commented out — dead), `ProductCategoryController`, `ProductImageController`, `ProductDocumentController`, `ProductUserManualController`, `NutritionalInformationImageController` |
| Services | `ProductDetailsServiceImpl` (core CRUD + merge logic), `UniversalExcelImportService` (import orchestrator), `ProductImportStrategyFactory` (bean-name lookup), `ProductImageService`, `ProductDocumentService`, `ProductUserManualServiceImpl` |
| Repositories | `ProductDetailsRepository` (incl. `findMaxProductNumber`), `ProductImageRepository`, `ProductCertificateDocumentRepository`, `ProductUserManualRepository`, one repo per attribute entity |
| Entities | `ProductDetails` (`tm_product_details`), `ProductAttributeDrug`, `ProductAttributeConsumableMedical`, `ProductAttributeNonConsumableMedical`, `ProductAttributeSupplementsOrNutraceuticals`, `ProductAttributeCosmeticandPersonalCare`, `ProductAttributeFoodInfant`, `ProductImage`, `ProductCertificateDocument` (5 nullable FKs, one per attribute type, no discriminator), `ProductUserManual` (Drug-only 1:1) |
| DTOs | `ProductDetailsDto` (shared create/update payload across all 6 categories) |
| Validators | Per-category "at least one certification" / "category FK non-null" checks inline in `ProductDetailsServiceImpl.setChildRelationships` (not a separate validator class) |
| Dependencies | M1 (Category, GST%), M3 (dosage forms, device categories, therapeutic categories, storage conditions), M5/M6 (Seller ownership), M11 (S3, Authentication principal) |

#### M3 — Product Lookup / Attribute Masters

| Aspect | Detail |
|---|---|
| Package/Path | `controller/product` (lookup controllers), `service/product/MasterService`, `entity/product`, `entity/product/MedicalDeviceProductMaster`, `entity/product/CosmeticPersonalCareMasters` |
| Responsibility | ~20 independent lookup tables feeding category-specific product forms: `Category` (root), `DosageForm`, `PackType`, `TherapeuticCategoryMaster`/`TherapeuticSubcategoryMaster`, `Molecule`, `StorageConditionMaster`, `DeviceCategory`/`DeviceSubCategory`, `Certification`, `CountryMaster`, `HairType`/`SkinType`/`IntendedUseArea`, `AgeGroupMaster`, `Flavour`, `GstPercentageMaster`, `ProductFormMaster` vs. `ProductsFormMaster` (two distinct near-identically-named entities — do not conflate) |
| Controllers | `MastersController` (umbrella, 11 GETs, `/masters/**`), `StorageConditionController` (separate DTO shape from `/masters/storagecondition`), `TherapeuticController`, `DosageFormController`, `MoleculeController`, `PackTypeController`, `PackTypeUnitMasterController`, `AgeGroupController`, `FlavourController` (only CRUD-complete lookup controller), `NetQuantityUnitController` (returns raw entities, not DTOs), `ServingSizeUnitController`, `GstPercentageMasterController`, `ProductFormMasterController`, `ProductCategoryController`, `DrugCategoryController`, `StrengthUnitController` |
| Services | `MasterService` (god-service, 9 injected repositories, hand-rolled entity→DTO mapping) plus one focused service per remaining controller |
| Repositories | One JpaRepository per entity; `DimensionRepository` and the `MedicalDeviceType` repository exist but have **no controller endpoint** — reachable only from import-strategy/mapper code |
| Entities | Listed above; `Category` (`tm_category`) is the root FK target for most others |
| DTOs | Inconsistent shapes: raw entity (NetQuantityUnitController), `ApiResponse` envelope (Gst/PackTypeUnit/StrengthUnit controllers), raw `List<Dto>` (AgeGroup/DrugCategory) |
| Validators | None (read-only except Flavour CRUD) |
| Dependencies | Consumed by M2 |

#### M4 — Stock & Pricing (Inventory)

| Aspect | Detail |
|---|---|
| Package/Path | `controller/product/StockController`, `controller/product/PricingDetailsController`, `service/product/productImpl/StockServiceImpl`, `service/product/productImpl/PricingDetailsServiceImpl`, `entity/product/StockLedger`, `entity/product/PricingDetails` |
| Responsibility | Batch/lot-level inventory: each physical batch is a `PricingDetails` row (own MRP/selling price/discount/GST/expiry/quantity); every movement is journaled as an immutable `StockLedger` row |
| Controllers | `StockController` (`/stock/add`, `/add-batches`, `/debit`, `/{productId}/total`, `/{productId}/batches`, `/{productId}/debited-total`, `/{productId}/added-total`, `DELETE /{productId}/batches/{pricingId}`), `PricingDetailsController` (`/pricing/validateBatchNumber`) |
| Services | `StockServiceImpl` (FIFO debit, restock-or-create dispatch, soft-delete), `PricingDetailsServiceImpl` (`resolveOrCreateBatch`, `generatePricingId`) |
| Repositories | `PricingDetailsRepository` (pessimistic-locked FIFO queries, `findMaxPricingNumber`, batch-exists-for-seller check), `StockLedgerRepository` (sum-by-type, lookups by reference/pricing id) |
| Entities | `PricingDetails` (`tm_pricing_details`, `@SQLRestriction("deleted_at IS NULL")`), `StockLedger` (`tbl_stock_ledger`, append-only), `AdditionalDiscount`/`SpecialSchemes` (persisted, cascade child of `PricingDetails`, never read by any pricing computation) |
| DTOs | `StockInRequestDto`, `StockDebitRequestDto`, `StockLedgerResponseDto`, `BatchAvailabilityDto`, `BatchDeleteResponseDto` |
| Validators | Inline in `StockServiceImpl`/`PricingDetailsServiceImpl` (packaging-required-if-multi-variant, expiry-match-on-restock, pre-lock sufficiency check) |
| Dependencies | M2 (`ProductDetails`, `PackagingDetails` FK), M5/M6 (seller ownership), consumed downstream by M9 (order debit/restock) |

#### M5 — Seller Signup & Temp-Seller Registration (OTP pipeline)

| Aspect | Detail |
|---|---|
| Package/Path | `controller/auth/SignupController`, `controller/temp/seller`, `service/serviceImpl/temp/seller`, `entity/temp/seller` |
| Responsibility | Signup-first identity (`/auth/signup` → bare `User` row) followed by a much heavier `TempSeller` business registration staged for admin review |
| Controllers | `SignupController` (`/auth/signup`, `/verify-otp`), `TempSellerController` (create/read/update/delete/draft/finalize/verify/upload, ~25 endpoints), `TempSellerEmailOtpController`, `SMSOTPController` (Twilio-delegated), `IndependentEmailController` |
| Services | `SignupService`, `TempSellerServiceImpl` (`resolveAuthenticatedUser`, `createTempSeller`, `saveDraft`, `finalizeDraft`, `updateTempSeller`), `TempSellerEmailOtpService`, `TwilioOTPService` |
| Repositories | `TempSellerRepository`, `TempSellerReviewHistoryRepository`, `SellerTermsRepository` |
| Entities | `TempSeller` (`tbl_temp_seller`, 1:1 nullable `User` FK), `TempSellerAddress`, `TempSellerBankDetails`, `TempSellerCoordinator`, `TempSellerDocument` (`@PrePersist`/`@PreUpdate` computes `licenseStatus`), `TempSellerReviewHistory`, `TempSellerEmailOtp`, `PhoneOTP`, `SellerTerms`, `TempSellerStatus` (plain `String` constants, not a JPA enum) |
| DTOs | `TempSellerRequestDTO` (full, `@Valid`), `TempSellerDraftRequestDTO` (all-optional, no validation) |
| Validators | `SellerTypeFieldValidator` (hard-throws on bad master refs — run on create/finalize, skipped on draft save) |
| Dependencies | M1 (types/geography), M11 (JWT-authenticated user required), S3, SMTP, Twilio Verify |

#### M6 — Seller Approval & Profile

| Aspect | Detail |
|---|---|
| Package/Path | `controller/admin/AdminSellerController`, `service/serviceImpl/admin/SellerApprovalServiceImpl`, `controller/seller/profile`, `service/profile/SellerProfileService`, `entity/seller`, `entity/seller/profile`, `entity/seller/history` |
| Responsibility | Two independent pipelines: (a) `TempSeller`→`Seller` initial-registration approval (ACCEPT/REJECT/CORRECTION state machine); (b) post-approval profile-edit requests (`PendingSeller`, auto-approved or admin-approved) |
| Controllers | `AdminSellerController` (`POST /admin/sellers/review`), `AdminSellerApprovalController` (`/admin/seller-requests/**`), `SellerProfileController` (`/sellers/**`) |
| Services | `SellerApprovalServiceImpl` (`processReview`, `handleApproval`, `generateSellerId`, two-phase S3 migration), `SellerProfileService` (`requiresAdminApproval`, `autoApproveUpdate` via raw `EntityManager` updates, `approveSellerUpdate`) |
| Repositories | `SellerRepository` (advisory-lock ID generation), `PendingSellerRepository`, `PendingSellerDocumentServiceImpl`'s repo, `SellerHistoryRepository` |
| Entities | `Seller` (`tbl_seller`), `SellerAddress`, `SellerCoordinator`, `SellerBankDetails`, `SellerGST`, `SellerDocument`, `SellerHistory` (insert-only audit snapshot), `PendingSeller` (`tbl_pending_seller`, status PENDING/AUTO_APPROVED/APPROVED/REJECTED/APPROVAL_FAILED), `PendingSellerDocument` |
| DTOs | `SellerApprovalRequestDTO`/`ResultDTO`, `SellerEditRequest`, `UpdateSellerProfileRequest` |
| Validators | `requiresAdminApproval()` diff logic (sellerName/address/licenses/GST/bank → requires approval; coordinator/companyType/phone/email/website/terms → auto-approve) |
| Dependencies | M5 (source `TempSeller`), M1, M11, S3, SMTP |

#### M7 — Buyer Signup, Login & Temp-Buyer Registration

| Aspect | Detail |
|---|---|
| Package/Path | `controller/buyer`, `controller/temp/buyer`, `controller/admin/AdminBuyerController`, `service/buyer`, `service/serviceImpl/temp/buyer`, `service/serviceImpl/admin/BuyerApprovalServiceImpl`, `entity/buyer`, `entity/temp/buyer` |
| Responsibility | Fully isolated buyer identity stack (own tables/services/JWT client) mirroring M5/M6's structure end-to-end, including a parallel admin-approval state machine — **not** a simplified/approval-free variant |
| Controllers | `BuyerSignupController`, `BuyerAuthenticationController`, `BuyerProfileController`, `TempBuyerController` (~25 endpoints, draft/finalize/verify/upload), `AdminBuyerController` (`POST /admin/buyers/review`) |
| Services | `BuyerSignupService`, `BuyerAuthService`, `BuyerProfileService`, `TempBuyerServiceImpl`, `TempBuyerDocumentServiceImpl`, `TempBuyerContactService`, `BuyerRequestIdGeneratorService`, `BuyerApprovalServiceImpl` |
| Repositories | `BuyerUserRepository`, `BuyerLoginOtpRepository`, `BuyerSignupOtpRepository`, `BuyerRefreshTokenRepository`, `TempBuyerRepository`, `TempBuyerContactRepository`, `TempBuyerDocumentRepository`, `TempBuyerReviewHistoryRepository`, `BuyerRepository` (advisory lock key 54321) |
| Entities | `BuyerUser`, `BuyerSignupOtp`, `BuyerLoginOtp`, `BuyerRefreshToken`, `TempBuyer` (`TempBuyerStatus`: DRAFT/SUBMITTED/UNDER_REVIEW/APPROVED/CORRECTION_REQUIRED/REJECTED/SUSPENDED — `UNDER_REVIEW`/`SUSPENDED` declared but never set), `TempBuyerAddress`, `TempBuyerContact`, `TempBuyerDocument`, `TempBuyerReviewHistory`, `Buyer`, `BuyerAddress`, `BuyerContact`, `BuyerDeliveryAddress` (no controller/service found), `BuyerDocument` |
| DTOs | `BuyerSignupRequest`, `TempBuyerRequestDTO`, `TempBuyerDraftRequestDTO`, `BuyerApprovalRequestDTO` |
| Validators | GST-or-PAN-required-if-other-blank (`TempBuyerServiceImpl` lines ~512-521), password strength regex (`BuyerSignupRequest`) |
| Dependencies | M1, M11, S3, SMTP |

#### M8 — Admin Controllers (Buyer/Seller/Order review & override)

| Aspect | Detail |
|---|---|
| Package/Path | `controller/admin/{AdminBuyerController,AdminSellerController,AdminOrderController}` |
| Responsibility | Single-endpoint admin actions: buyer/seller registration review, and an order-status force-override that bypasses the normal fulfillment state machine |
| Controllers | `AdminBuyerController` (`POST /admin/buyers/review`), `AdminSellerController` (`POST /admin/sellers/review`), `AdminOrderController` (`GET /admin/orders`, `POST /admin/orders/{orderId}/override`) |
| Services | Delegates to M6's `SellerApprovalServiceImpl`, M7's `BuyerApprovalServiceImpl`, and M9's `OrderQueryServiceImpl.adminOverride` |
| Entities | Shared with M6/M7/M9 |
| Dependencies | M6, M7, M9 |
| Frontend consumer | **NOT IDENTIFIED** — grepped the entire `pharma-aggregator-client/src` tree for `/admin/buyers`, `/admin/sellers`, `/admin/orders`: zero matches. No admin route/page/component exists anywhere in the Next.js app. These endpoints are backend-only or consumed by an undocumented external admin client (only inferred from an `app.admin-frontend-url` property, never located) |

#### M9 — Order, Payment, Invoice, Return/Refund

| Aspect | Detail |
|---|---|
| Package/Path | `controller/order`, `service/order`, `service/order/orderImpl`, `service/order/support`, `entity/order` |
| Responsibility | Buyer checkout → per-seller `SellerOrder` fan-out → seller fulfillment state machine (OTP-gated delivery) → invoice generation on delivery → cancellation/return/refund; COD-only, no payment gateway |
| Controllers | `OrderController`, `SellerOrderController`, `InvoiceController`, `PaymentController`, `ReturnController` |
| Services | `OrderPlacementServiceImpl`, `SellerOrderFulfillmentServiceImpl`, `OrderCancellationServiceImpl`, `ReturnRefundServiceImpl`, `InvoiceServiceImpl`, `PaymentServiceImpl` (read-only), `OrderQueryServiceImpl` |
| Repositories | `OrderRepository` (advisory lock 98765), `PaymentRepository` (advisory lock 98766), `SellerOrderRepository`, `OrderItemRepository`, `InvoiceRepository`, `RefundRepository`, `ReturnRequestRepository`, `OrderStatusHistoryRepository` |
| Entities | `Order`, `OrderStatus` (PLACED/PARTIALLY_SHIPPED/SHIPPED/DELIVERED/CANCELLED — plain `String` constants), `SellerOrder`, `SellerOrderStatus` (PLACED→CONFIRMED→PACKED→SHIPPED→OUT_FOR_DELIVERY→DELIVERED, plus CANCELLED/RETURN_*/RETURNED/REFUNDED — `REFUNDED` never assigned), `OrderItem`, `OrderStatusHistory`, `Payment`, `PaymentStatus` (only `SUCCESS` ever assigned), `Refund`, `RefundStatus`, `ReturnRequest`, `ReturnStatus`, `Invoice` |
| DTOs | `PlaceOrderRequestDTO` (`idempotencyKey`), `CancelOrderRequestDTO`, `AdminOrderOverrideRequestDTO` |
| Validators | `OrderStatusRollup.compute` (pure function), `SellerOrderFulfillmentServiceImpl.transition` (private state-machine guard) |
| Dependencies | M4 (stock debit/restock), M6/M7 (Seller/Buyer FK), M10 (accepted quote → order), M11, S3 (invoices) |

#### M10 — Quote Request (RFQ / Price Request)

| Aspect | Detail |
|---|---|
| Package/Path | `controller/quote`, `service/quote`, `entity/quote` |
| Responsibility | Single-table (`tbl_quote_request`) negotiation flow: buyer/guest submits → seller quotes once → buyer accepts/rejects once → downstream order placement |
| Controllers | `BuyerQuoteRequestController` (create/list/accept/reject), `SellerQuoteRequestController` (list/respond) |
| Services | `QuoteRequestService` (`create`, `respond`, `accept`, `reject`, `resolveOrCreateGuestBuyer`) |
| Repositories | `QuoteRequestRepository` |
| Entities | `QuoteRequest` (`requestType`: PRICE_REQUEST/RFQ discriminator; `status`: PENDING→QUOTED→ACCEPTED/REJECTED→ORDER_PLACED, `EXPIRED` never set) |
| DTOs | `QuoteRequestCreateDTO`, `SellerQuoteResponseDTO`, `QuoteRequestResponseDTO` |
| Validators | Bean-validation on `QuoteRequestCreateDTO` (productId/requestType/quantity/contactPerson/phone/email only) |
| Dependencies | M2 (Product FK), M7 (guest `BuyerUser` auto-provisioning), M9 (downstream order placement writes `ORDER_PLACED`/`orderId` back onto this entity) |

#### M11 — Security & Auth Infrastructure

| Aspect | Detail |
|---|---|
| Package/Path | `security`, `config/SecurityConfig.java`, `config/CrossConfig.java`, `exception/*` |
| Responsibility | JWT issuance/validation, opaque rotating refresh tokens, password hashing, CORS, global exception mapping |
| Key classes | `JwtUtils` (HS256, `Keys.hmacShaKeyFor`), `AuthTokenFilter` (`preferBuyer` dual-identity resolution), `UserDetailsServiceImpl`, `UserDetailsImpl`, `AuthEntryPointJwt`, `SecurityConfig` (`anyRequest().permitAll()` live; role-scoped rule commented out) |
| Controllers | `AuthenticationController` (`/authentication/**`), `AuthController` (`/auth/reset-password`, `/forgot-password`, etc.), `BuyerAuthenticationController` |
| Services | `AuthService` (seller), `UserService`, `BuyerAuthService` |
| Repositories | `UserRepository`, `RefreshTokenRepository`, `LoginOtpRepository`, `RoleMasterRepository` |
| Entities | `User`, `RefreshToken` (`tokenHash` = SHA-256 of raw token), `LoginOtp` |
| Exception handling | `GlobalExceptionHandler` (`@RestControllerAdvice`) + `GlobalLogInExceptionHandler` (second, overlapping `@ControllerAdvice`) + `GlobalResponseHandler` (`ResponseBodyAdvice`, wraps 2xx bodies in `ApiResponse`) |
| Dependencies | Consumed by every other backend module |

#### M12 — Database Config, Migrations & Seed Data

| Aspect | Detail |
|---|---|
| Package/Path | `src/main/resources/application*.yml`, `src/main/resources/db/migration` (Flyway), `src/main/resources/db/seed` (manual), `docs/*.sql` (manual, non-Flyway) |
| Responsibility | PostgreSQL datasource config per profile (dev/test/prod), Flyway-managed schema/seed for 3 tables, manual ad-hoc scripts for everything ADDED after initial `ddl-auto=update` dev/test convenience |
| Flyway migrations | `V1__buyer_type_and_document_type_seed.sql`, `V2__add_buyer_user_password_temporary_column.sql`, `V3__create_legal_content_table.sql` |
| Manual scripts | 8 files under `docs/` (`migration_add_*`, `seed_*`) — none follow Flyway's `V<n>__` convention, all outside Flyway's configured `classpath:db/migration` location, all headers instruct manual execution |
| `ddl-auto` | `update` (dev, test) vs `validate` (prod) — prod's `validate` is why the manual `docs/migration_*.sql` scripts exist |
| Dependencies | Underpins every backend module |

#### M13 — Infrastructure & CI/CD

| Aspect | Detail |
|---|---|
| Package/Path | `Dockerfile`, `docker-compose.yml`, `deploy/tiamed-aggregator-task-defination.json`, `.github/workflows/*.yml` |
| Responsibility | Multi-stage Docker build (Maven/Temurin-17 → `eclipse-temurin:17-jre-alpine`), AWS ECS Fargate deployment for a `test` environment, GitHub Actions build+deploy pipeline (tests explicitly skipped via `-DskipTests`) |
| Cloud services evidenced | AWS S3 (SDK v2), AWS ECS Fargate, AWS ECR, AWS RDS (dev profile only), AWS Secrets Manager, AWS CloudWatch Logs, Twilio Verify |
| CI | `.github/workflows/qodana_code_quality.yml` (static analysis only) and `.github/workflows/tests.yml` (named for tests, actually a build+deploy pipeline — `mvn -DskipTests clean install`, no test execution anywhere in CI despite the filename) |
| Dependencies | Packages/deploys all backend modules |

#### M14 — Frontend Routing, Pages & Layouts

| Aspect | Detail |
|---|---|
| Package/Path | `src/app/**` (App Router) |
| Responsibility | Obfuscated-slug role sections (`login_fhy26sb`, `seller_7a3b9f2c`, `buyer_e8d45a1b`), auth-guard layouts, onboarding-gate components |
| Key files | `seller_7a3b9f2c/layout.tsx` (client-side guard + back-button trap + inactivity timer wiring), `buyer_e8d45a1b/dashboard/layout.tsx` (client-side guard, modal-based), `src/proxy.ts` (dead — wrong filename/export, never wired as Next.js middleware) |
| Dependencies | M15, M16, M17 |

#### M15 — Frontend API Client Layer & Services

| Aspect | Detail |
|---|---|
| Package/Path | `src/lib/api.ts`, `src/lib/buyerApi.ts`, `src/utils/api.ts`, `src/services/**` |
| Responsibility | Three independently-evolved axios clients: `lib/api.ts` (seller, full 401-refresh queue), `lib/buyerApi.ts` (buyer, structurally identical but isolated token set), `utils/api.ts` (used by every `product/*` service, Bearer-attach only, **no** refresh handling) |
| Dependencies | Every backend module's REST surface; M18 for `NEXT_PUBLIC_API_URL` |

#### M16 — Frontend Validation Schemas & Forms

| Aspect | Detail |
|---|---|
| Package/Path | `src/schema/**` (Zod), forms under `src/app/**/components` |
| Responsibility | Per-domain Zod schemas mirroring `src/services/<domain>/`; only a minority of consumers use `react-hook-form` + `zodResolver` — most product-category forms and both registration wizards call `schema.parse()`/`safeParse()` by hand inside `useState`-driven submit handlers |
| Dependencies | M14 (forms), M15 (submission target) |

#### M17 — Frontend Auth, Session & State Management

| Aspect | Detail |
|---|---|
| Package/Path | `src/services/seller/authService.ts`, `src/services/buyer/buyerAuthService.ts`, `src/hooks/useSessionManager.ts`, `src/utils/auth.ts` |
| Responsibility | Token storage/refresh orchestration, 30-minute seller inactivity auto-logout, manual JWT payload decode (`atob()`, no signature verification client-side — by design, verification is server-side) |
| Dependencies | M15 |

#### M18 — Frontend Build, Env & Deployment Config

| Aspect | Detail |
|---|---|
| Package/Path | `next.config.ts` (`output: 'standalone'`), `Dockerfile`, `docker-compose.yml`, `.env`/`.env.example` |
| Responsibility | Standalone Next.js build packaged into a 3-stage Alpine Docker image; `.env.example` and `docs/*.md` document a dead env var (`NEXT_PUBLIC_BACKEND_URL`) never read by any `src/` file — only `NEXT_PUBLIC_API_URL` is live |
| Dependencies | Packages M14-M17 |

---

### 3. Class Diagrams / Component Diagrams

Six major modules, each as a Controller → Service → Repository → Entity chain with real class names verified against source.

#### 3.1 Product Catalog Core (Strategy pattern for import)

```mermaid
classDiagram
    class ProductDetailsController {
        +createProduct(dto, userId) ProductDetailsDto
        +getProductList(userId) List
        +getProductById(productId) ProductDetailsDto
        +updateProduct(productId, dto) ProductDetailsDto
        +deleteProduct(productId)
        +addPackagingVariant(productId, dto)
    }
    class ProductImportController {
        +importFile(file, categoryId, userId) ExcelImportResultDto
    }
    class ProductDetailsServiceImpl {
        -generateProductId(productName, sellerName) String
        -setChildRelationships(product, sellerName, sellerId)
        -addVariantToExistingProduct(existing, dto, seller) ProductDetailsDto
        +createProduct(dto, userId, allowMergeIntoExisting) ProductDetailsDto
        +getAllProducts(userId) List
        +updateProduct(productId, dto) ProductDetailsDto
        +deleteProductById(productId)
    }
    class UniversalExcelImportService {
        +importFile(file, userId, categoryId) ExcelImportResultDto
        -resolveStrategyKey(categoryId) String
    }
    class ProductImportStrategyFactory {
        -strategies : Map~String,ProductImportStrategy~
        +getStrategy(categoryName) ProductImportStrategy
    }
    class ProductImportStrategy {
        <<interface>>
        +mapRow(row, categoryId, userId) ProductDetailsDto
        +mapCsv(record, categoryId, userId) ProductDetailsDto
    }
    class DrugImportStrategy
    class ConsumableImportStrategy
    class NonConsumableImportStrategy
    class CosmeticsImportStrategy
    class FoodInfantImportStrategy
    class SupplementsImportStrategy
    class ProductDetailsRepository {
        <<interface>>
        +findMaxProductNumber() Integer
    }
    class ProductDetails {
        +String productId
        +ProductStatus status
        +Category category
        +Seller seller
    }
    class ProductAttributeDrug
    class ProductAttributeConsumableMedical
    class ProductAttributeNonConsumableMedical
    class ProductAttributeSupplementsOrNutraceuticals
    class ProductAttributeCosmeticandPersonalCare
    class ProductAttributeFoodInfant
    class ProductImage
    class ProductCertificateDocument {
        +String certificateUrl
        +ProductAttributeNonConsumableMedical nonConsumableAttribute
        +ProductAttributeConsumableMedical consumableAttribute
        +ProductAttributeSupplementsOrNutraceuticals supplementsAttribute
        +ProductAttributeCosmeticandPersonalCare cosmeticAttribute
        +ProductAttributeFoodInfant productAttribute
    }

    ProductDetailsController --> ProductDetailsServiceImpl
    ProductImportController --> UniversalExcelImportService
    UniversalExcelImportService --> ProductImportStrategyFactory
    ProductImportStrategyFactory --> ProductImportStrategy
    ProductImportStrategy <|.. DrugImportStrategy
    ProductImportStrategy <|.. ConsumableImportStrategy
    ProductImportStrategy <|.. NonConsumableImportStrategy
    ProductImportStrategy <|.. CosmeticsImportStrategy
    ProductImportStrategy <|.. FoodInfantImportStrategy
    ProductImportStrategy <|.. SupplementsImportStrategy
    UniversalExcelImportService --> ProductDetailsServiceImpl : createProduct(dto,userId,true)
    ProductDetailsServiceImpl --> ProductDetailsRepository
    ProductDetailsRepository --> ProductDetails
    ProductDetails "1" *-- "0..*" ProductAttributeDrug
    ProductDetails "1" *-- "0..*" ProductAttributeConsumableMedical
    ProductDetails "1" *-- "0..*" ProductAttributeNonConsumableMedical
    ProductDetails "1" *-- "0..*" ProductAttributeSupplementsOrNutraceuticals
    ProductDetails "1" *-- "0..*" ProductAttributeCosmeticandPersonalCare
    ProductDetails "1" *-- "0..*" ProductAttributeFoodInfant
    ProductDetails "1" *-- "0..*" ProductImage
    ProductAttributeConsumableMedical "1" *-- "0..*" ProductCertificateDocument
```

#### 3.2 Seller Onboarding & Approval

```mermaid
classDiagram
    class TempSellerController {
        +createTempSeller(dto) TempSellerResponseDTO
        +createDraft(dto) TempSellerResponseDTO
        +finalizeDraft(id, dto) TempSellerResponseDTO
        +updateTempSeller(id, dto) TempSellerResponseDTO
        +uploadDocuments(id, multipart)
    }
    class AdminSellerController {
        +reviewSeller(request) SellerApprovalResultDTO
    }
    class TempSellerServiceImpl {
        -resolveAuthenticatedUser() User
        +createTempSeller(dto) TempSellerResponseDTO
        +saveDraft(id, dto) TempSellerResponseDTO
        +finalizeDraft(id, dto) TempSellerResponseDTO
        +updateTempSeller(id, dto) TempSellerResponseDTO
        -resolvePlaceholderProductType() ProductTypeMaster
    }
    class SellerApprovalServiceImpl {
        +processReview(request) SellerApprovalResultDTO
        -handleCorrection(seller, comments)
        -handleRejection(seller, comments)
        -handleApproval(seller, comments) Seller
        -generateSellerId(tempSeller) String
        -sendApprovalAgreementEmail(tempSeller, seller, comments)
    }
    class TempSellerRepository { <<interface>> }
    class SellerRepository {
        <<interface>>
        +acquireSellerIdLock()
        +findMaxSellerSequence() Integer
    }
    class TempSeller {
        +Long tempSellerId
        +String status
        +User user
    }
    class TempSellerAddress
    class TempSellerCoordinator
    class TempSellerBankDetails
    class TempSellerDocument
    class TempSellerReviewHistory
    class Seller {
        +String sellerId
        +String status
        +TempSeller tempSellerId
    }
    class SellerAddress
    class SellerCoordinator
    class SellerBankDetails
    class SellerGST
    class SellerDocument
    class SellerHistory

    TempSellerController --> TempSellerServiceImpl
    AdminSellerController --> SellerApprovalServiceImpl
    TempSellerServiceImpl --> TempSellerRepository
    SellerApprovalServiceImpl --> TempSellerRepository
    SellerApprovalServiceImpl --> SellerRepository
    TempSellerRepository --> TempSeller
    SellerRepository --> Seller
    TempSeller "1" *-- "1" TempSellerAddress
    TempSeller "1" *-- "1" TempSellerCoordinator
    TempSeller "1" *-- "1" TempSellerBankDetails
    TempSeller "1" *-- "0..*" TempSellerDocument
    TempSeller "1" *-- "0..*" TempSellerReviewHistory
    Seller "1" *-- "1" SellerAddress
    Seller "1" *-- "1" SellerCoordinator
    Seller "1" *-- "1" SellerBankDetails
    Seller "1" *-- "1" SellerGST
    Seller "1" *-- "0..*" SellerDocument
    SellerApprovalServiceImpl ..> Seller : creates on ACCEPT
    SellerApprovalServiceImpl ..> SellerHistory : profile-edit snapshots only
```

#### 3.3 Buyer Onboarding & Approval

```mermaid
classDiagram
    class BuyerSignupController {
        +signup(request)
        +verifyOtp(request)
    }
    class TempBuyerController {
        +createTempBuyer(dto) TempBuyerResponseDTO
        +createDraft(dto)
        +finalizeDraft(id, dto)
    }
    class AdminBuyerController {
        +reviewBuyer(request)
    }
    class BuyerSignupService {
        +sendSignupOtp(request)
        +verifyAndCreateBuyer(request) BuyerUser
    }
    class TempBuyerServiceImpl {
        +createTempBuyer(dto)
        +finalizeDraft(id, dto)
        -validateGstOrPan(dto)
    }
    class BuyerApprovalServiceImpl {
        +processReview(request)
        -generateBuyerId(tempBuyer) String
        -handleApproval(tempBuyer) Buyer
    }
    class BuyerUserRepository { <<interface>> }
    class TempBuyerRepository { <<interface>> }
    class BuyerRepository {
        <<interface>>
        +acquireBuyerIdLock()
        +findMaxBuyerSequence() Integer
    }
    class BuyerUser
    class TempBuyer {
        +String status
        +BuyerUser user
    }
    class TempBuyerAddress
    class TempBuyerContact
    class TempBuyerDocument
    class Buyer {
        +String buyerId
        +String status
    }
    class BuyerAddress
    class BuyerContact
    class BuyerDocument

    BuyerSignupController --> BuyerSignupService
    TempBuyerController --> TempBuyerServiceImpl
    AdminBuyerController --> BuyerApprovalServiceImpl
    BuyerSignupService --> BuyerUserRepository
    TempBuyerServiceImpl --> TempBuyerRepository
    BuyerApprovalServiceImpl --> TempBuyerRepository
    BuyerApprovalServiceImpl --> BuyerRepository
    BuyerUserRepository --> BuyerUser
    TempBuyerRepository --> TempBuyer
    BuyerRepository --> Buyer
    TempBuyer "1" *-- "1" TempBuyerAddress
    TempBuyer "1" *-- "1" TempBuyerContact
    TempBuyer "1" *-- "0..*" TempBuyerDocument
    Buyer "1" *-- "1" BuyerAddress
    Buyer "1" *-- "1" BuyerContact
    Buyer "1" *-- "0..*" BuyerDocument
    BuyerApprovalServiceImpl ..> Buyer : creates on ACCEPT
```

#### 3.4 Order Lifecycle

```mermaid
classDiagram
    class OrderController {
        +placeOrder(request) OrderResponseDTO
        +getOrder(orderId) OrderResponseDTO
        +cancelOrder(orderId, request) OrderResponseDTO
    }
    class SellerOrderController {
        +confirm(id) SellerOrderResponseDTO
        +pack(id) SellerOrderResponseDTO
        +ship(id, courier, tracking, url) SellerOrderResponseDTO
        +outForDelivery(id) SellerOrderResponseDTO
        +deliver(id, otp) SellerOrderResponseDTO
        +cancel(id) SellerOrderResponseDTO
    }
    class ReturnController {
        +requestReturn(dto) ReturnRequestDTO
        +decideReturn(id, dto) ReturnRequestDTO
        +processRefund(refundId) RefundDTO
    }
    class InvoiceController {
        +generateInvoice(sellerOrderId) InvoiceDTO
    }
    class OrderPlacementServiceImpl {
        +placeOrder(request) OrderResponseDTO
    }
    class SellerOrderFulfillmentServiceImpl {
        -transition(id, sellerId, from, to, mutator) SellerOrderResponseDTO
        +confirm(id, sellerId) SellerOrderResponseDTO
        +markDelivered(id, sellerId, otp) SellerOrderResponseDTO
    }
    class OrderCancellationServiceImpl {
        -CANCELLABLE_STATUSES : Set~String~
        +cancelOrder(orderId, actorRole, actorId, reason)
        +cancelSellerOrder(id, actorRole, actorId, reason)
    }
    class ReturnRefundServiceImpl {
        +requestReturn(dto)
        +decideReturn(id, dto)
        +processRefund(refundId)
    }
    class InvoiceServiceImpl {
        +generateInvoiceWithPdfBytes(sellerOrderId) InvoicePdfResult
        +generateInvoice(sellerOrderId) InvoiceDTO
    }
    class OrderStatusRollup {
        +compute(childStatuses) String$
    }
    class OrderRepository { <<interface>> }
    class SellerOrderRepository { <<interface>> }
    class Order {
        +String orderId
        +String status
        +Payment payment
    }
    class SellerOrder {
        +String sellerOrderId
        +String status
        +Invoice invoice
    }
    class OrderItem {
        +String itemStatus
        +PricingDetails pricingDetails
    }
    class Payment
    class Refund
    class ReturnRequest
    class Invoice
    class OrderStatusHistory

    OrderController --> OrderPlacementServiceImpl
    OrderController --> OrderCancellationServiceImpl
    SellerOrderController --> SellerOrderFulfillmentServiceImpl
    SellerOrderController --> OrderCancellationServiceImpl
    ReturnController --> ReturnRefundServiceImpl
    InvoiceController --> InvoiceServiceImpl
    SellerOrderFulfillmentServiceImpl --> InvoiceServiceImpl
    SellerOrderFulfillmentServiceImpl --> OrderStatusRollup
    OrderCancellationServiceImpl --> OrderStatusRollup
    ReturnRefundServiceImpl --> OrderStatusRollup
    OrderPlacementServiceImpl --> OrderRepository
    SellerOrderFulfillmentServiceImpl --> SellerOrderRepository
    OrderRepository --> Order
    SellerOrderRepository --> SellerOrder
    Order "1" *-- "1..*" SellerOrder
    Order "1" *-- "1" Payment
    SellerOrder "1" *-- "1..*" OrderItem
    SellerOrder "1" *-- "0..1" Invoice
    SellerOrder "1" *-- "0..*" OrderStatusHistory
    Payment "1" *-- "0..*" Refund
    OrderItem "1" *-- "0..1" ReturnRequest
```

#### 3.5 Security / Auth Infrastructure

```mermaid
classDiagram
    class AuthenticationController {
        +login(request) OtpSentResponse
        +verifyOtp(request) LoginResponse
        +refresh(request) LoginResponse
        +logout(request)
    }
    class BuyerAuthenticationController {
        +login(request)
        +verifyOtp(request)
        +refresh(request)
    }
    class AuthService {
        +validateCredentialsAndSendOtp(request) OtpSentResponse
        +verifyOtpAndIssueToken(request) LoginResponse
        +issueTokensForUser(user) LoginResponse
        +refreshAccessToken(rawRefreshToken) LoginResponse
        +logout(rawRefreshToken)
    }
    class BuyerAuthService {
        +validateCredentialsAndSendOtp(request)
        +verifyOtpAndIssueToken(request)
        +refreshAccessToken(rawRefreshToken)
    }
    class JwtUtils {
        +generateJwtToken(authentication) String
        +getUserNameFromJwtToken(token) String
        +validateJwtToken(token) boolean
        +generateRefreshToken() String
        +hashToken(rawToken) String
    }
    class AuthTokenFilter {
        #doFilterInternal(request, response, chain)
    }
    class UserDetailsServiceImpl {
        +loadUserByUsername(username, preferBuyer) UserDetails
    }
    class UserRepository { <<interface>> }
    class RefreshTokenRepository {
        <<interface>>
        +findByTokenHash(hash) Optional~RefreshToken~
    }
    class LoginOtpRepository { <<interface>> }
    class User
    class RefreshToken {
        +String tokenHash
        +LocalDateTime expiresAt
        +LocalDateTime revokedAt
        +isValid() boolean
    }
    class LoginOtp
    class BuyerRefreshToken
    class BuyerLoginOtp

    AuthenticationController --> AuthService
    BuyerAuthenticationController --> BuyerAuthService
    AuthService --> JwtUtils
    BuyerAuthService --> JwtUtils
    AuthService --> UserRepository
    AuthService --> RefreshTokenRepository
    AuthService --> LoginOtpRepository
    AuthTokenFilter --> JwtUtils
    AuthTokenFilter --> UserDetailsServiceImpl
    UserRepository --> User
    RefreshTokenRepository --> RefreshToken
    LoginOtpRepository --> LoginOtp
    User "1" *-- "0..*" RefreshToken
    User "1" *-- "0..*" LoginOtp
```

#### 3.6 Stock & Pricing

```mermaid
classDiagram
    class StockController {
        +addStock(request) StockLedgerResponseDto
        +debitStock(request) List~StockLedgerResponseDto~
        +getAvailableBatchesFifo(productId) List~BatchAvailabilityDto~
        +deleteBatch(productId, pricingId) BatchDeleteResponseDto
    }
    class PricingDetailsController {
        +validateBatchNumber(batchLotNumber, categoryId) Map
    }
    class StockServiceImpl {
        +addStock(request, userId) StockLedgerResponseDto
        +debitStock(request, userId) List~StockLedgerResponseDto~
        +restockExactBatch(pricingId, qty, userId) StockLedgerResponseDto
        +hasSufficientStock(productId, packagingId, qty) boolean
        +deleteBatch(productId, pricingId, userId) BatchDeleteResponseDto
        +getAvailableBatchesFifo(productId, packagingId) List
    }
    class PricingDetailsServiceImpl {
        +resolveOrCreateBatch(product, packaging, candidate, sellerName, sellerId) PricingDetails
        -generatePricingId(sellerName) String
        +isBatchNumberExistsForSeller(batchLotNumber, sellerId, categoryId) boolean
    }
    class PricingDetailsRepository {
        <<interface>>
        +findMaxPricingNumber() Integer
        +findByProductDetails_ProductIdAndBatchLotNumber(id, lot) Optional
    }
    class StockLedgerRepository { <<interface>> }
    class PricingDetails {
        +String pricingId
        +String batchLotNumber
        +Long stockQuantity
        +BigDecimal mrp
        +BigDecimal sellingPrice
        +BigDecimal discountPercentage
        +BigDecimal gstPercentage
        +LocalDateTime deletedAt
    }
    class StockLedger {
        +Long ledgerId
        +String transactionType
        +Long quantity
        +Long balanceAfter
    }
    class AdditionalDiscount
    class SpecialSchemes

    StockController --> StockServiceImpl
    PricingDetailsController --> PricingDetailsServiceImpl
    StockServiceImpl --> PricingDetailsServiceImpl
    StockServiceImpl --> StockLedgerRepository
    PricingDetailsServiceImpl --> PricingDetailsRepository
    PricingDetailsRepository --> PricingDetails
    StockLedgerRepository --> StockLedger
    PricingDetails "1" *-- "0..*" AdditionalDiscount
    PricingDetails "1" *-- "0..*" SpecialSchemes
    PricingDetails "1" --> "0..*" StockLedger : referenced by pricingId
```

---

### 4. Sequence Diagrams

Eight end-to-end flows, traced directly against source and verified by opening the cited controller/service files. Each diagram was generated from an actual read-through of the code path, not inferred from naming.

#### 4.1 Authentication / Login (Seller & Buyer)

```mermaid
sequenceDiagram
    autonumber

    participant Browser as Browser (localStorage + document.cookie)
    participant SUI as Seller UI (LoginModals.tsx)
    participant SAuth as sellerAuthService.ts
    participant SApi as lib/api.ts (axios, seller)
    participant SCtrl as AuthenticationController (/authentication)
    participant SSvc as AuthService (seller, backend)
    participant Jwt as JwtUtils (shared, HS256)
    participant Mail as EmailService (SMTP, shared)
    participant SDB as tbl_user / tbl_login_otp / tbl_refresh_tokens
    participant AF as AuthTokenFilter (shared, on every request)

    participant BUI as Buyer UI (LoginForm / LoginOtpStep)
    participant BAuth as buyerAuthService.ts
    participant BApi as lib/buyerApi.ts (axios, buyer)
    participant BCtrl as BuyerAuthenticationController (/buyer/authentication)
    participant BSvc as BuyerAuthService (buyer, backend)
    participant BDB as tbl_buyer_user / tbl_buyer_login_otp / tbl_buyer_refresh_tokens

    Note over SUI,SDB: SELLER LOGIN — src/app/modals/LoginModals/LoginModals.tsx is the REAL, wired-up seller login UI.<br/>src/app/(auth)/login_fhy26sb/** is a separate, orphaned scaffold (fetch('/api/seller/...') routes that don't exist) — not part of this flow.

    rect rgb(235,245,255)
    Note over Browser,SDB: STEP 1 — password login, sends OTP
    Browser->>SUI: submit username + password
    SUI->>SAuth: sellerAuthService.login(credentials)
    SAuth->>SApi: POST /authentication/login {username,password}
    SApi->>SCtrl: forwarded (Bearer attach interceptor: no token yet, so no header)
    SCtrl->>SSvc: validateCredentialsAndSendOtp(loginRequest)
    SSvc->>SDB: findByUsername(username)
    SDB-->>SSvc: User row
    alt account locked or inactive
        SSvc-->>SCtrl: AccountLockedException / AccountInactiveException
        SCtrl-->>SApi: 403 {status,error,message}
    else credentials checked
        SSvc->>SSvc: AuthenticationManager.authenticate() — BCrypt check via Spring Security
        alt bad password
            SSvc->>SDB: increment failedLoginAttempts (lock account at 5 — MAX_LOGIN_FAILED_ATTEMPTS)
            SSvc-->>SCtrl: InvalidCredentialsException
            SCtrl-->>SApi: 401 {status,error,message}
        else password OK
            SSvc->>SDB: resetFailedLoginAttempts; invalidateAllOtpsForUser(user)
            SSvc->>SDB: save new LoginOtp (6-digit, isUsed=false, expiresAt=+5min, OTP_EXPIRY_MINUTES)
            SSvc->>Mail: sendCoordinatorOtp(user.username, otpCode)
            SSvc-->>SCtrl: OtpSentResponse{message, username}
            SCtrl-->>SApi: 200 {status:"SUCCESS", data:{message,username}}
            SApi-->>SAuth: response (checked for a nested 200-wrapped 401 failure shape)
            SAuth->>Browser: localStorage.setItem("otpUsername", username)
            SAuth-->>SUI: OtpSentResponse — show OTP entry screen
        end
    end
    end

    rect rgb(235,255,240)
    Note over Browser,SDB: STEP 2 — OTP verification, JWT + refresh-token issuance
    Browser->>SUI: submit 6-digit OTP
    SUI->>SAuth: sellerAuthService.verifyOtp({username, otp})
    SAuth->>SApi: POST /authentication/verify-otp {username, otp}
    SApi->>SCtrl: forwarded
    SCtrl->>SSvc: verifyOtpAndIssueToken(request)
    SSvc->>SDB: findActiveOtpByUser(user) — unused AND unexpired AND unlocked
    alt no active OTP found
        SSvc-->>SCtrl: OtpExpiredException
        SCtrl-->>SApi: 410 Gone
    else OTP row found
        alt otp.otpCode != request.otp
            SSvc->>SDB: incrementFailedAttempts; lock OTP row at 3 (MAX_OTP_FAILED_ATTEMPTS)
            SSvc-->>SCtrl: OtpInvalidException (401) or OtpLockedException (429, must login again)
            SCtrl-->>SApi: 401 / 429 {status,error,message}
        else OTP matches
            SSvc->>SDB: markOtpAsUsed(otpId); updateLastLogin(userId, now)
            SSvc->>Jwt: generateJwtToken(authentication)
            Note right of Jwt: HS256, key = HMAC(app.jwt.secret).<br/>Claims: sub=username, iat, exp only — NO roles/userId embedded.<br/>app.jwt.expiration in application-dev.yml = 86400000ms (24h, commented as a "temporary" override of an intended 30 min)
            Jwt-->>SSvc: accessToken (signed JWT)
            SSvc->>Jwt: generateRefreshToken()
            Note right of Jwt: 64 random bytes (SecureRandom), base64url-encoded — an OPAQUE token, not a JWT
            Jwt-->>SSvc: rawRefreshToken
            SSvc->>Jwt: hashToken(rawRefreshToken) — SHA-256
            SSvc->>SDB: save RefreshToken{tokenHash (raw never stored), expiresAt=now+app.jwt.refresh-expiration (7 days)}
            SSvc-->>SCtrl: LoginResponse{accessToken, refreshToken(raw), userId, username, roles, passwordTemporary, message}
            SCtrl-->>SApi: 200 {status:"SUCCESS", data:LoginResponse}
            SApi-->>SAuth: response
            alt loginData.passwordTemporary === true
                SAuth->>Browser: do NOT store accessToken/refreshToken; clear any stale ones; deleteCookie("token")
                SAuth-->>SUI: caller routes to first-time password-reset step (POST /auth/reset-password)
            else normal login
                SAuth->>Browser: localStorage.setItem(accessToken, refreshToken, user, lastLogin)
                SAuth->>Browser: decode JWT payload via atob() to read exp → localStorage.setItem("tokenExpiresAt", exp*1000)
                SAuth->>Browser: setCookie("token", accessToken, 1 day) — plain document.cookie, NOT httpOnly, SameSite=Lax
                SAuth-->>SUI: LoginResponse — redirect into /seller_7a3b9f2c/dashboard
            end
        end
    end
    end

    Note over BUI,BDB: BUYER LOGIN — src/app/buyer_e8d45a1b/login/page.tsx renders null; a global BuyerLoginModalProvider (mounted in root layout.tsx) opens the actual modal built from these same LoginForm/LoginOtpStep components. Structurally mirrors seller login but is fully isolated (own tables, own controller, own axios client, own localStorage key prefix "buyer*").

    rect rgb(255,245,235)
    Note over Browser,BDB: STEP 1 — password login, sends OTP (buyer)
    Browser->>BUI: submit email + password
    BUI->>BAuth: buyerAuthService.login(credentials)
    BAuth->>BApi: POST /buyer/authentication/login
    BApi->>BCtrl: forwarded
    BCtrl->>BSvc: validateCredentialsAndSendOtp(loginRequest)
    BSvc->>BDB: findByEmail(username)
    BDB-->>BSvc: BuyerUser row
    alt locked / inactive
        BSvc-->>BCtrl: AccountLockedException / AccountInactiveException (403)
    else
        BSvc->>BSvc: passwordEncoder.matches(password, buyerUser.passwordHash) — manual BCrypt check, NOT Spring Security's AuthenticationManager
        alt bad password
            BSvc->>BDB: increment failedLoginAttempts (lock at 5)
            BSvc-->>BCtrl: InvalidCredentialsException (401)
        else password OK
            BSvc->>BDB: resetFailedLoginAttempts; invalidateAllOtpsForBuyerUser(buyerUser)
            BSvc->>BDB: save new BuyerLoginOtp (6-digit, +5min expiry)
            BSvc->>Mail: sendBuyerOtp(email, otpCode)
            BSvc-->>BCtrl: BuyerOtpSentResponse{message, username}
            BCtrl-->>BApi: 200 {status:"SUCCESS", data:{...}}
            BApi-->>BAuth: response
            BAuth->>Browser: localStorage.setItem("buyerOtpUsername", username)
            BAuth-->>BUI: show OTP entry screen
        end
    end
    end

    rect rgb(250,240,255)
    Note over Browser,BDB: STEP 2 — OTP verification, JWT + refresh-token issuance (buyer)
    Browser->>BUI: submit 6-digit OTP
    BUI->>BAuth: buyerAuthService.verifyOtp({username, otp})
    BAuth->>BApi: POST /buyer/authentication/verify-otp
    BApi->>BCtrl: forwarded
    BCtrl->>BSvc: verifyOtpAndIssueToken(request)
    BSvc->>BDB: findActiveOtpByBuyerUser(buyerUser)
    alt no active OTP
        BSvc-->>BCtrl: OtpExpiredException (410)
    else
        alt otp mismatch
            BSvc->>BDB: incrementFailedAttempts; lock at 3 attempts
            BSvc-->>BCtrl: OtpInvalidException (401) / OtpLockedException (429)
        else OTP matches
            BSvc->>BDB: markOtpAsUsed; updateLastLogin
            BSvc->>BSvc: manually build UserDetailsImpl{id=buyerUserId, authorities=[ROLE_BUYER]} — no AuthenticationManager/UserDetailsServiceImpl involved
            BSvc->>Jwt: generateJwtToken(authentication) — same shared JwtUtils/HS256 key as seller
            Jwt-->>BSvc: accessToken
            BSvc->>Jwt: generateRefreshToken() + hashToken()
            Jwt-->>BSvc: rawRefreshToken
            BSvc->>BDB: save BuyerRefreshToken{tokenHash, expiresAt=+7 days}
            BSvc-->>BCtrl: BuyerLoginResponse{accessToken, refreshToken(raw), buyerUserId, username, phone, roles, passwordTemporary}
            BCtrl-->>BApi: 200 {status:"SUCCESS", data:...}
            BApi-->>BAuth: response
            alt passwordTemporary === true
                BAuth-->>BUI: no tokens stored — route to reset-password (temp password from e.g. a guest quote-request account)
            else
                BAuth->>Browser: localStorage.setItem(buyerUser, buyerLastLogin, buyerAccessToken, buyerRefreshToken, buyerTokenExpiresAt)
                BAuth->>Browser: setCookie("buyerToken", accessToken, 1 day) — separate cookie name from seller's "token"
                BAuth-->>BUI: redirect — /buyer_e8d45a1b/dashboard (client-side guard in dashboard/layout.tsx checks buyerAccessToken+buyerRefreshToken)
            end
        end
    end
    end

    Note over Browser,AF: SUBSEQUENT AUTHENTICATED REQUESTS — Authorization header attach (both roles)
    rect rgb(245,245,245)
    Browser->>SApi: any seller-domain call (request interceptor)
    SApi->>SApi: reads localStorage("accessToken") → sets header Authorization: Bearer <token>
    SApi->>AF: request with Bearer token
    Note right of AF: AuthTokenFilter parses the Bearer header, jwtUtils.validateJwtToken(), then<br/>userDetailsService.loadUserByUsername(username, preferBuyer) — preferBuyer=true only if the<br/>request URI contains "/buyer/", so an email registered as both buyer and seller resolves correctly.<br/>NOTE: SecurityConfig.filterChain() sets anyRequest().permitAll() — Spring Security enforces<br/>NOTHING at the HTTP layer; this filter only populates SecurityContext for app-code checks to read.
    AF-->>SApi: 200 (protected data) — normal case
    Browser->>BApi: any buyer-domain call (request interceptor)
    BApi->>BApi: reads localStorage("buyerAccessToken") → sets Authorization: Bearer <token>
    BApi->>AF: request with Bearer token (same shared filter/JwtUtils, different token/table)
    end

    Note over Browser,SDB: 401 / REFRESH HANDLING — src/lib/api.ts response interceptor (seller)
    rect rgb(255,235,235)
    AF-->>SApi: 401 Unauthorized (expired/invalid access token)
    alt request URL contains "/refresh", or is /authentication/login, /authentication/verify-otp, or /auth/signup
        SApi-->>Browser: reject as-is (treated as a normal auth failure, NOT session expiry — no refresh attempted)
    else any other protected call, and not already retried
        alt a refresh is already in flight (isRefreshing)
            SApi->>SApi: push {resolve,reject} onto failedQueue and wait
        else first 401 to arrive
            SApi->>SApi: set _retry=true, isRefreshing=true
            alt no refreshToken in localStorage
                SApi->>Browser: clear all seller auth localStorage keys + cookie "token"; redirect "/?showLogin=true&session=expired"
            else refreshToken present
                SApi->>SCtrl: raw axios.post(/authentication/refresh, {refreshToken}) — bypasses the `api` instance itself to avoid interceptor recursion
                SCtrl->>SSvc: refreshAccessToken(rawRefreshToken)
                SSvc->>Jwt: hashToken(rawRefreshToken)
                SSvc->>SDB: findByTokenHash(hash)
                alt not found, or !isValid() (revoked or past expiresAt)
                    SSvc-->>SCtrl: RefreshTokenException
                    SCtrl-->>SApi: 401 {message}
                    SApi->>Browser: clear auth keys + cookie + sessionStorage.clear(); redirect "/?showLogin=true&session=expired"
                else valid
                    SSvc->>SDB: stored.setRevokedAt(now) — ROTATE: old refresh token is now dead
                    SSvc->>Jwt: generateJwtToken(new auth) + generateRefreshToken() (new raw)
                    SSvc->>SDB: save new RefreshToken{tokenHash of new raw, +7 days}
                    SSvc-->>SCtrl: LoginResponse{new accessToken, new refreshToken}
                    SCtrl-->>SApi: 200 {accessToken, refreshToken}
                    SApi->>Browser: localStorage.setItem(accessToken, refreshToken); cookie "token" updated
                    SApi->>SApi: processQueue() — replays every request that had queued during the refresh
                    SApi->>AF: retry the original failed request with new Bearer token
                    AF-->>SApi: 200 (success)
                end
            end
        end
    end
    end

    Note over Browser,BDB: 401 / REFRESH HANDLING — src/lib/buyerApi.ts response interceptor (buyer, structurally identical, separate token set)
    rect rgb(255,240,245)
    AF-->>BApi: 401 Unauthorized
    alt url is /refresh, /buyer/authentication/login, /buyer/authentication/verify-otp, or /buyer/auth/signup
        BApi-->>Browser: reject as-is
    else
        BApi->>BApi: queue concurrent 401s the same way (isRefreshing/failedQueue)
        alt no buyerRefreshToken
            BApi->>Browser: clear buyerAccessToken/buyerRefreshToken/buyerTokenExpiresAt/buyerUser + cookie "buyerToken"; redirect "/buyer_e8d45a1b/login?session=expired"
        else
            BApi->>BCtrl: raw axios.post(/buyer/authentication/refresh, {refreshToken})
            BCtrl->>BSvc: refreshAccessToken(rawRefreshToken)
            BSvc->>BDB: findByTokenHash(hash); check isValid()
            alt invalid/expired/revoked
                BSvc-->>BCtrl: RefreshTokenException (401)
                BApi->>Browser: clear buyer auth keys + cookie; redirect to buyer login
            else valid
                BSvc->>BDB: revoke old row (setRevokedAt)
                BSvc->>BSvc: issueTokensForUser(buyerUser) — new access+refresh pair, new BuyerRefreshToken row persisted
                BCtrl-->>BApi: 200 {accessToken, refreshToken}
                BApi->>Browser: localStorage updated; cookie "buyerToken" updated
                BApi->>AF: retry original request with new Bearer token
            end
        end
    end
    end

    Note over SApi,BApi: NOT part of this flow but adjacent: src/utils/api.ts is a THIRD axios client (used by every product/* service, not by login) that attaches the Bearer token but has NO response interceptor at all — a 401 hit through it does not auto-refresh or redirect.
```

#### 4.2 Seller Onboarding (Registration → OTP → Admin Approval → Dashboard Access)

```mermaid
sequenceDiagram
    autonumber
    actor Seller
    participant SignupUI as SignupForm.tsx<br/>(seller_7a3b9f2c/components)
    participant RegisterUI as SellerRegister.tsx<br/>(seller_7a3b9f2c/components)
    participant CoordUI as CoordinatorForm.tsx
    participant AuthSvc as sellerAuthService<br/>(src/services/seller/authService.ts, uses lib/api.ts)
    participant RegSvc as sellerRegService<br/>(sellerRegistrationService.ts)
    participant SignupCtrl as SignupController<br/>(/auth/signup)
    participant AuthCtrl as AuthenticationController<br/>(/authentication)
    participant EmailOtpCtrl as TempSellerEmailOtpController<br/>(/temp-seller/email-otp)
    participant SmsOtpCtrl as SMSOTPController<br/>(/otp) + Twilio Verify
    participant TempCtrl as TempSellerController<br/>(/temp-sellers)
    participant TempSvc as TempSellerServiceImpl
    participant DB as tbl_temp_seller (+ address/<br/>coordinator/bankDetails/documents)
    participant S3 as AWS S3<br/>(tempsellers/{REQ_ID}/...)
    actor Admin
    participant AdminCtrl as AdminSellerController<br/>(/admin/sellers/review)
    participant ApprovalSvc as SellerApprovalServiceImpl
    participant SellerDB as tbl_seller (+ child tables)

    rect rgb(235,245,255)
    note over Seller,SignupCtrl: Phase 1 — Signup-first identity (must precede any TempSeller)
    Seller->>SignupUI: Enter fullName/email/password
    SignupUI->>AuthSvc: sendSignupOtp()
    AuthSvc->>SignupCtrl: POST /auth/signup
    SignupCtrl-->>AuthSvc: OTP emailed
    Seller->>SignupUI: Enter signup OTP
    SignupUI->>AuthSvc: verifySignupOtp()
    AuthSvc->>SignupCtrl: POST /auth/signup/verify-otp
    SignupCtrl-->>AuthSvc: User created in tbl_user (no tokens issued)
    note over Seller,AuthCtrl: Seller must now log in separately (2-step OTP login)
    Seller->>AuthSvc: login(username,password)
    AuthSvc->>AuthCtrl: POST /authentication/login
    AuthCtrl-->>AuthSvc: password OK, login OTP emailed (tbl_login_otp)
    Seller->>AuthSvc: verifyOtp(code)
    AuthSvc->>AuthCtrl: POST /authentication/verify-otp
    AuthCtrl-->>AuthSvc: accessToken + refreshToken (JWT, subject-only claims)
    AuthSvc-->>AuthSvc: store accessToken/refreshToken/user in localStorage<br/>+ mirror "token" into document.cookie
    end

    rect rgb(255,248,235)
    note over Seller,DB: Phase 2 — TempSeller registration wizard (SellerRegister.tsx, 5 steps)
    Seller->>RegisterUI: Open wizard (embedded in OnboardingGate or standalone)
    RegisterUI->>RegSvc: getTempSellerByUserId(userId)
    RegSvc->>TempCtrl: GET /temp-sellers/user/{userId}
    alt no prior draft (404)
        TempCtrl-->>RegSvc: 404 Not Found (swallowed as "nothing to resume")
    else DRAFT row exists
        TempCtrl-->>RegSvc: TempSeller row (status=DRAFT)
        RegSvc-->>RegisterUI: resume formData + tempSellerId
    end

    Seller->>CoordUI: Enter coordinator email/mobile
    CoordUI->>RegSvc: sendEmailOtp({email})
    RegSvc->>EmailOtpCtrl: POST /temp-seller/email-otp/send
    EmailOtpCtrl-->>RegSvc: 6-digit code emailed (tbl_temp_seller_email_otp, 5 min expiry)
    Seller->>CoordUI: Enter emailed OTP
    CoordUI->>RegSvc: verify email OTP
    RegSvc->>EmailOtpCtrl: POST /temp-seller/email-otp/verify
    EmailOtpCtrl-->>CoordUI: verified=true (self-hosted check, no attempt-lock)

    CoordUI->>RegSvc: sendSMSOtp({phone})
    RegSvc->>SmsOtpCtrl: POST /otp/send
    SmsOtpCtrl->>SmsOtpCtrl: Twilio Verify sends SMS (PhoneOTP audit row, 5 min)
    Seller->>CoordUI: Enter SMS OTP
    CoordUI->>RegSvc: verify SMS OTP
    RegSvc->>SmsOtpCtrl: POST /otp/verify
    SmsOtpCtrl->>SmsOtpCtrl: Twilio VerificationCheck.setCode() (server stores no code)
    SmsOtpCtrl-->>CoordUI: verified=true

    opt Seller clicks "Save Draft" at any step
        RegisterUI->>RegSvc: createDraftTempSeller() / updateDraftTempSeller()
        RegSvc->>TempCtrl: POST /temp-sellers/draft  or  PUT /temp-sellers/draft/{id}
        TempCtrl->>TempSvc: saveDraft(tempSellerId, dto)  [no @Valid, no SellerTypeFieldValidator]
        TempSvc->>DB: INSERT/UPDATE status=DRAFT (bad master-data ids logged & skipped, not thrown)
        DB-->>TempSvc: tempSellerId
        TempSvc-->>RegisterUI: TempSellerResponseDTO
    end

    Seller->>RegisterUI: Complete all 5 steps, click Submit
    RegisterUI->>RegSvc: createTempSeller(request)  OR  finalizeDraftTempSeller(tempSellerId, request)
    alt no existing draft
        RegSvc->>TempCtrl: POST /temp-sellers  (@Valid full TempSellerRequestDTO)
        TempCtrl->>TempSvc: createTempSeller(dto)
        TempSvc->>TempSvc: resolveAuthenticatedUser() — reads SecurityContext<br/>(AuthTokenFilter-populated); throws 401 if no valid Bearer JWT
        TempSvc->>TempSvc: sellerTypeFieldValidator.validate() (hard-throws on bad master refs)
    else existing DRAFT row
        RegSvc->>TempCtrl: POST /temp-sellers/draft/{tempSellerId}/finalize (@Valid)
        TempCtrl->>TempSvc: finalizeDraft(tempSellerId, dto)
        TempSvc->>TempSvc: guard: current status must be DRAFT, else throw
        TempSvc->>TempSvc: sellerTypeFieldValidator.validate() (same full validation as create)
    end
    TempSvc->>DB: persist TempSeller + address + coordinator + bankDetails<br/>+ documents (status = OPEN)
    TempSvc-->>TempSvc: sendConfirmationEmail() via IndependentEmailService (SMTP)
    TempSvc-->>RegisterUI: TempSellerResponseDTO {tempSellerId, sellerRequestId, status:"OPEN"}

    RegisterUI->>RegSvc: getTempSellerById(tempSellerId)
    RegSvc->>TempCtrl: GET /temp-sellers/{id}
    TempCtrl-->>RegisterUI: full row incl. per-document ids (for file-upload targeting)

    RegisterUI->>RegSvc: uploadDocuments(tempSellerId, multipart)
    RegSvc->>TempCtrl: POST /temp-sellers/{tempSellerId}/documents/upload<br/>(sellerImage, gstFile, bankFile, companyRegistrationCertificate,<br/>authorizationLetter, licenseFiles[]+licenseNames[]+documentIds[])
    TempCtrl->>S3: store each file under tempsellers/{REQ_ID}/{gst|bankdocument|<br/>companyregistrationcertificate|authorizationletter|licenses|sellerimage}/...
    S3-->>TempCtrl: S3 URLs
    TempCtrl-->>DB: replace "PENDING" placeholder URLs with real S3 URLs
    TempCtrl-->>RegisterUI: upload success
    RegisterUI-->>Seller: Success modal — "Application submitted" (status still OPEN)
    note over RegisterUI,TempCtrl: If document upload fails, RegisterUI calls<br/>DELETE /temp-sellers/{id} to roll back the just-created row
    end

    rect rgb(255,238,238)
    note over Admin,SellerDB: Phase 3 — Admin review (AdminSellerController / SellerApprovalServiceImpl)
    Admin->>AdminCtrl: POST /admin/sellers/review<br/>{id, status: ACCEPT | REJECT | CORRECTION, comments}
    AdminCtrl->>ApprovalSvc: processReview(request)
    alt status = CORRECTION
        ApprovalSvc->>DB: tempSeller.status = CORRECTION_REQUIRED
        ApprovalSvc->>ApprovalSvc: saveReviewHistory(CORRECTION_REQUIRED) [tbl_temp_seller_review_history]
        ApprovalSvc-->>Seller: HTML email with correction link (ADMIN_FRONTEND_URL/SellerCorrection/...)
        note over Seller,TempCtrl: Seller edits via PUT /temp-sellers/{id} (updateTempSeller)<br/>— only allowed from CORRECTION_REQUIRED (throws for APPROVED/<br/>REJECTED/RESUBMITTED/OPEN) — sets status = RESUBMITTED,<br/>looping back to Admin review
    else status = REJECT
        ApprovalSvc->>DB: tempSeller.status = REJECTED
        ApprovalSvc->>ApprovalSvc: saveReviewHistory(REJECTED)
        ApprovalSvc-->>Seller: HTML rejection email with reasons
    else status = ACCEPT
        ApprovalSvc->>ApprovalSvc: handleApproval(tempSeller, comments)
        ApprovalSvc->>ApprovalSvc: signupUser = tempSeller.getUser();<br/>throw ApplicationException if null (no orphaned-row auto-fix)
        ApprovalSvc->>ApprovalSvc: generateSellerId(): [2 chars sellerName][3 chars<br/>sellerTypeAbbreviation][4-digit global seq]<br/>via pg_advisory_xact_lock(12345) + MAX(sequence)+1
        ApprovalSvc->>SellerDB: PHASE 1 — INSERT Seller + SellerAddress + SellerCoordinator<br/>+ SellerBankDetails + SellerGST + SellerDocument rows,<br/>still pointing at OLD tempsellers/{REQ_ID}/... S3 URLs;<br/>seller.status="APPROVED", approvedAt=now, user=signupUser
        ApprovalSvc->>DB: tempSeller.status = APPROVED (flipped immediately after<br/>Phase 1, BEFORE any email/PDF I/O — non-atomic by design)
        ApprovalSvc->>ApprovalSvc: saveReviewHistory(APPROVED)
        ApprovalSvc->>S3: PHASE 2 — copy each file tempsellers/{REQ_ID}/... →<br/>sellers/{SELLER_ID}/{sellerimage|gst|bankdocument|<br/>licenses|companyregistrationcertificate}/..., then delete old object<br/>(best-effort: failures logged, never roll back the approval)
        S3-->>SellerDB: update SellerDocument/SellerGST/SellerBankDetails<br/>URLs to new sellers/{SELLER_ID}/... paths
        ApprovalSvc->>ApprovalSvc: sendApprovalAgreementEmail() — fetch SellerTerms PDF,<br/>email seller ID + login link (try/catch: failure never<br/>undoes the already-committed approval)
        ApprovalSvc-->>Seller: Approval email with Seller ID + PDF agreement attached<br/>("log in using the email/password you created during signup" —<br/>no new credentials are issued at approval time)
    end
    ApprovalSvc-->>AdminCtrl: SellerApprovalResultDTO {tempSellerId, userId, sellerId, status}
    end

    rect rgb(235,255,238)
    note over Seller,SellerDB: Phase 4 — First dashboard access post-approval
    Seller->>AuthSvc: login(username,password) [/authentication/login]
    AuthSvc->>AuthSvc: verifyOtp(code) [/authentication/verify-otp] → accessToken/refreshToken stored
    Seller->>RegisterUI: Navigate to /seller_7a3b9f2c/dashboard
    note over RegisterUI: seller_7a3b9f2c/layout.tsx guard: checks localStorage<br/>accessToken + refreshToken + sellerAuthService.isAuthenticated();<br/>redirects to /?showLogin=true if any are missing
    RegisterUI->>RegSvc: useSellerOnboardingStatus() → sellerProfileService.getCurrentSellerProfile()
    RegSvc->>SellerDB: GET /sellers/user/{userId}
    alt Seller row exists (approved)
        SellerDB-->>RegSvc: 200 SellerProfile
        RegSvc-->>RegisterUI: status = "approved"
        RegisterUI-->>Seller: OnboardingGate shows one-time "Registration Complete" screen<br/>(dismiss sets localStorage sellerRegistrationCompleteSeen_{userId})<br/>then renders the real dashboard Overview
    else no Seller row yet
        SellerDB-->>RegSvc: 404 (falls back to GET /temp-sellers/user/{userId})
        RegSvc-->>RegisterUI: status = "pending" (or "draft" if TempSeller.status=DRAFT)
        RegisterUI-->>Seller: OnboardingGate shows "Application Under Review" (blocks dashboard)
    end
    end
```

#### 4.3 Buyer Onboarding (Signup → OTP → Organization Registration → Admin Approval)

```mermaid
sequenceDiagram
    autonumber
    actor Buyer
    participant SignupUI as buyer_e8d45a1b/signup<br/>(SignupForm, SignupOtpStep)
    participant BuyerApi as src/lib/buyerApi.ts
    participant SignupCtl as BuyerSignupController<br/>/buyer/auth/signup
    participant SignupSvc as BuyerSignupService
    participant LoginUI as Login modal<br/>(buyer_e8d45a1b/login)
    participant AuthCtl as BuyerAuthenticationController<br/>/buyer/authentication
    participant AuthSvc as BuyerAuthService
    participant Gate as BuyerOnboardingGate.tsx
    participant Wizard as BuyerRegister.tsx<br/>(Org -> Contact -> Compliance -> Review)
    participant TempCtl as TempBuyerController<br/>/temp-buyers
    participant TempSvc as TempBuyerServiceImpl
    participant AdminCtl as AdminBuyerController<br/>/admin/buyers/review
    participant ApprovalSvc as BuyerApprovalServiceImpl
    participant DB as tbl_buyer_user / tbl_temp_buyer / tbl_buyer

    Note over Buyer,SignupSvc: Layer 1 — Account signup (identical shape to seller's SignupController)
    Buyer->>SignupUI: fill fullName/email/phone/password
    SignupUI->>BuyerApi: POST /buyer/auth/signup
    BuyerApi->>SignupCtl: forward request
    SignupCtl->>SignupSvc: sendSignupOtp()
    SignupSvc->>DB: existsByEmail? (409 if taken)
    SignupSvc->>DB: save BuyerSignupOtp (otp, 5min expiry, bcrypt pwd hash)
    SignupSvc-->>Buyer: email OTP sent
    Buyer->>SignupUI: enter 6-digit OTP
    SignupUI->>BuyerApi: POST /buyer/auth/signup/verify-otp
    BuyerApi->>SignupCtl: forward request
    SignupCtl->>SignupSvc: verifyAndCreateBuyer()
    SignupSvc->>DB: validate OTP (unused, unexpired, matches)
    SignupSvc->>DB: re-check existsByEmail (race guard)
    SignupSvc->>DB: INSERT BuyerUser (emailVerified=true, phoneVerified=false)
    SignupSvc-->>SignupUI: "Account created. Please log in." (no tokens)
    SignupUI-->>Buyer: toast + open login modal

    Note over Buyer,AuthSvc: Login — password then email OTP then JWT (fully isolated from seller/tbl_user)
    Buyer->>LoginUI: email + password
    LoginUI->>BuyerApi: POST /buyer/authentication/login
    BuyerApi->>AuthCtl: forward
    AuthCtl->>AuthSvc: validateCredentialsAndSendOtp()
    AuthSvc->>DB: PasswordEncoder.matches() (manual, not AuthenticationManager)
    AuthSvc->>DB: invalidate prior OTPs, save new BuyerLoginOtp, email it
    Buyer->>LoginUI: enter login OTP
    LoginUI->>BuyerApi: POST /buyer/authentication/verify-otp
    BuyerApi->>AuthCtl: forward
    AuthCtl->>AuthSvc: verifyOtpAndIssueToken() (max 3 attempts, else OTP locked)
    AuthSvc->>DB: issue JWT accessToken + rotated SHA-256-hashed refreshToken
    AuthSvc-->>LoginUI: BuyerLoginResponse {accessToken, refreshToken, buyerUserId}
    LoginUI-->>Buyer: store buyerAccessToken/buyerRefreshToken + buyerToken cookie

    Note over Buyer,ApprovalSvc: Layer 2 — Organization registration (parallel state machine to seller's, NOT a stub)
    Buyer->>Gate: visit /buyer_e8d45a1b/dashboard
    Gate->>BuyerApi: GET /temp-buyers/user/{buyerUserId}
    BuyerApi->>TempCtl: forward (via useBuyerOnboardingStatus)
    TempCtl->>TempSvc: findByUserId()
    alt no TempBuyer yet
        TempSvc-->>Gate: 404 -> status "draft", tempBuyer=null
        Gate-->>Buyer: BuyerWelcomeOverview ("Register Your Business")
        Buyer->>Wizard: start 3-step wizard + Review
        loop each step
            Wizard->>BuyerApi: POST/PUT /temp-buyers/draft(/{id})
            BuyerApi->>TempCtl: forward (no bean validation, status=DRAFT)
        end
        Wizard->>BuyerApi: POST /temp-buyers/draft/{id}/finalize
        BuyerApi->>TempCtl: forward
        TempCtl->>TempSvc: finalizeDraft() (validate buyerType, GST-or-PAN)
        TempSvc->>DB: status DRAFT -> SUBMITTED
    else TempBuyer exists
        TempSvc-->>Gate: status (submitted/under_review/correction_required/rejected/approved)
        Gate-->>Buyer: BuyerStatusBanner / hub / checklist per status
    end

    Note over AdminCtl,DB: Admin review (outside buyer's own UI)
    AdminCtl->>ApprovalSvc: processReview(ACCEPT|REJECT|CORRECTION)
    alt ACCEPT
        ApprovalSvc->>DB: generate Buyer ID (advisory lock 54321)
        ApprovalSvc->>DB: INSERT Buyer+BuyerAddress+BuyerContact+BuyerDocument; TempBuyer -> APPROVED (Phase 1, committed)
        ApprovalSvc-->>DB: best-effort: migrate S3 files tempbuyers/{REQ_ID}/... -> buyers/{BUYER_ID}/..., email welcome (Phase 2, failures only logged)
    else REJECT / CORRECTION
        ApprovalSvc->>DB: TempBuyer -> REJECTED / CORRECTION_REQUIRED
        ApprovalSvc-->>DB: best-effort email notice
    end
    ApprovalSvc->>DB: INSERT TempBuyerReviewHistory (reviewedBy="ADMIN")

    Gate->>Buyer: status=approved -> one-time "Congratulations" screen -> real dashboard
    Buyer->>BuyerApi: GET /temp-buyers/user/{buyerUserId} (profile page, read-only, no edit flow)
```

#### 4.4 Product Creation, Category-Specific Attributes & Import

```mermaid
sequenceDiagram
    autonumber
    actor Seller
    participant AddProduct as AddProduct.tsx<br/>(products/add/page.tsx)
    participant MedForm as MedicalDevicesForm.tsx<br/>(consumable/non-consumable radio)
    participant CatForm as Category Form<br/>(DrugForm / ConsumableForm / NonConsumableForm /<br/>SupplementForm / CosmeticForm / FoodInfantForm)
    participant Svc as utils/api.ts client<br/>(ProductService.ts / ConsumbaleService.ts / etc.)
    participant PDC as ProductDetailsController<br/>(/products/create)
    participant PDS as ProductDetailsServiceImpl
    participant DB as tm_product_details +<br/>per-category attribute tables
    participant PIC as ProductImageController<br/>(/product-images/{productId})
    participant PImgSvc as ProductImageService (+S3Service)
    participant DocCtl as ProductUserManualController /<br/>ProductDocumentController /<br/>NutritionalInformationImageController
    participant DocSvc as ProductUserManualServiceImpl /<br/>ProductDocumentService (+S3Service)

    rect rgb(235,245,255)
    Note over Seller,CatForm: Manual entry path
    Seller->>AddProduct: Click "Add Product" -> pick category
    AddProduct->>CatForm: render (Drugs/Supplements/FoodInfant/Cosmetic directly;<br/>Medical Devices via MedForm radio -> Consumable/NonConsumable)
    Seller->>CatForm: Fill product/category-attribute/packaging fields,<br/>select images, certificate files, brochure/user-manual
    CatForm->>CatForm: Client-side validate (zod schema for Drug/Supplement;<br/>hand-rolled validate() for Consumable/NonConsumable/Cosmetic)
    end

    CatForm->>Svc: createDrugProduct / createConsumableProduct / ... (payload)
    Note right of CatForm: payload omits packaging/pricing at create time —<br/>attached later from the product view page.<br/>Certificate entries sent as {certificationId, certificateUrl:"PENDING"}
    Svc->>PDC: POST /products/create (Bearer token, JSON)
    PDC->>PDS: createProduct(dto, userId, allowMergeIntoExisting=false)
    PDS->>PDS: look up Seller by userId, Category by categoryId
    PDS->>PDS: generateProductId() = 2-letter seller prefix +<br/>3-letter product-name fragment + 5-digit global sequence
    PDS->>PDS: setChildRelationships(): per-category attribute checks<br/>(NonConsumable/Supplement/FoodInfant require certifications<br/>non-empty + category FK non-null; Consumable/Cosmetic check<br/>certifications != null only — empty list passes, dead check)
    PDS->>DB: save ProductDetails (status defaults PUBLISHED)<br/>+ cascaded attribute + placeholder ProductCertificateDocument rows
    DB-->>PDS: saved entity (productId, productAttributeId per category)
    PDS-->>PDC: ProductDetailsDto
    PDC-->>Svc: 200 OK { productId, productAttribute*[0].productAttributeId,<br/>certificateDocuments[] }
    Svc-->>CatForm: response.data

    CatForm->>CatForm: extract productId + productAttributeId from response

    opt images selected
        CatForm->>Svc: uploadProductImages(productId, files) /<br/>uploadSupplementProductImages(...)
        Svc->>PIC: POST /product-images/{productId} (multipart "images")
        PIC->>PImgSvc: uploadImages(productId, files)
        PImgSvc->>PImgSvc: validate each file non-empty + contentType startsWith "image/"
        PImgSvc->>DB: S3Service.uploadFile() per file, then save ProductImage rows
        PImgSvc-->>PIC: list of image URLs
        PIC-->>Svc: 200 OK
    end

    alt Drug category
        opt user manual file selected
            CatForm->>Svc: uploadProductUserManual(productAttributeId, file)
            Svc->>DocCtl: POST /userManual/{productAttributeId} (multipart "file")
            DocCtl->>DocSvc: uploadManual() — upsert 1:1 ProductUserManual
            DocSvc->>DB: S3 upload + save ProductUserManual row
        end
    else Food & Infant category
        opt user manual file selected
            CatForm->>Svc: uploadFoodInfantUserManual(productAttributeId, file)
            Svc->>DocCtl: POST /userManual/new/{productAttributeId}
            DocCtl->>DocSvc: uploadUserManual() — sets product_user_manual<br/>column directly on ProductAttributeFoodInfant
        end
        CatForm->>Svc: uploadNutritionalInformationImage(attributeId, categoryId, image)
        Svc->>DocCtl: POST /nutritionalInformationImage/{productAttributeId}
    else Supplement category
        opt nutritional image / brochure selected
            CatForm->>Svc: uploadNutritionalInformationImage(...) /<br/>uploadSupplementBrochure(attributeId, file)
            Svc->>DocCtl: POST /nutritionalInformationImage/{id} /<br/>POST /product-documents/supplements/{id}/brochure
        end
    else Consumable / Non-Consumable / Cosmetic category
        opt brochure file selected
            CatForm->>Svc: uploadConsumableBrochure / uploadNonConsumableBrochure /<br/>uploadCosmeticBrochure(attributeId, file)
            Svc->>DocCtl: POST /product-documents/{category}/{attributeId}/brochure
            DocCtl->>DocSvc: uploadXxxBrochure() — deleteIfRealUrl(existing),<br/>S3 upload, overwrite brochurePath column in place
        end
    end

    opt certificate files selected (Consumable/NonConsumable/Supplements/Cosmetic/Food)
        loop for each certificate with a new file
            CatForm->>Svc: uploadConsumableCertificate(attributeId, productCertificateDocumentId, file)<br/>(analogous uploadXxxCertificate/uploadFoodInfantCertificates for other categories)
            Svc->>DocCtl: POST /product-documents/{category}/{attributeId}/certificates<br/>(multipart: documentIds[] + certificateFiles[], same order)
            DocCtl->>DocSvc: uploadXxxCertificates()
            DocSvc->>DB: look up existing ProductCertificateDocument by documentId,<br/>verify it belongs to this productAttributeId (else 400),<br/>deleteIfRealUrl(old S3 object), S3 upload,<br/>overwrite certificateUrl in place (no new row)
        end
    end

    CatForm-->>Seller: show success modal / navigate to product view

    rect rgb(255,245,230)
    Note over Seller,DB: Bulk Excel/CSV import path (separate entry point)
    participant DF as DashboardFilters.tsx<br/>("Add Product" dropdown -> Excel/CSV)
    participant Ext as fetch() direct call<br/>(bypasses lib/api.ts AND utils/api.ts)
    participant PIC2 as ProductImportController<br/>(/products/import)
    participant UES as UniversalExcelImportService
    participant Fac as ProductImportStrategyFactory
    participant Strat as *ImportStrategy<br/>(Drug/Consumable/NonConsumable/<br/>Cosmetics/FoodInfant/Supplements)

    Seller->>DF: pick category + choose "Excel/CSV" method,<br/>upload .xlsx/.xls/.csv file
    DF->>Ext: POST hardcoded https://api-test-aggreator.tiameds.ai/api/v1/products/import<br/>(FormData: file, categoryId; Authorization: Bearer accessToken from localStorage)
    Note right of DF: BUG: IMPORT_API_URL is a hardcoded external<br/>staging host, NOT built from NEXT_PUBLIC_API_URL —<br/>unlike every other product service in this app
    Ext->>PIC2: POST /products/import (multipart file + categoryId)
    PIC2->>UES: importFile(file, userId, categoryId)
    UES->>UES: resolveStrategyKey(categoryId) via Category.categoryName<br/>(e.g. "CONSUMABLE MEDICAL DEVICES & EQUIPMENT" -> "CONSUMABLE")
    UES->>Fac: getStrategy(strategyKey)
    Fac-->>UES: matching @Component bean (case-insensitive key match)
    UES->>UES: open workbook/CSV; skip sheets named "Master"/"Masters";<br/>data rows start at index 2 (rows 0/1 are headers)
    loop for each data row with a non-blank Product Name
        UES->>Strat: mapRow(row, categoryId, userId) / mapCsv(record, categoryId, userId)
        Strat->>Strat: validateMandatoryExcel/Csv() — collects ALL violations,<br/>then throws ValidationException (not fail-fast).<br/>Placeholder ProductCertificateDocument rows built with<br/>certificateUrl="NOT_UPLOADED" / brochurePath="NOT_UPLOADED"
        Strat-->>UES: ProductDetailsDto (or ValidationException caught per-row)
        UES->>PDS: createProduct(dto, userId, allowMergeIntoExisting=true)
        Note right of PDS: true: same seller+productName+manufacturerName+categoryId<br/>merges as a new packaging/pricing variant via<br/>addVariantToExistingProduct() instead of a new row
        PDS->>DB: save (new product OR merged packaging/pricing variant)
        UES->>UES: record success, or capture row error (rowNumber, productName, message)
    end
    UES-->>PIC2: ExcelImportResultDto (totalRows, successCount, failureCount, errors[])
    PIC2-->>Ext: 200 OK
    Ext-->>DF: parse response, show per-row validation errors if any
    Note over Seller: Certificate/brochure/user-manual/image files still need<br/>the same per-category upload endpoints above —<br/>the Excel path does not upload any binary files itself
    end
```

#### 4.5 Stock / Batch Management

```mermaid
sequenceDiagram
    autonumber
    actor Seller
    participant PV as ProductView1.tsx<br/>(Stock Management section)
    participant SUM as StockUpdateModal.tsx<br/>(wizard: restock existing / create new batch)
    participant BSUM as BatchStockUpdateModal.tsx<br/>(quick per-batch +/- update)
    participant Svc as StockService.ts<br/>(addStock / getAvailableBatches / deleteBatch)
    participant Api as utils/api.ts<br/>(axios, Bearer token, NO 401 refresh)
    participant SC as StockController<br/>(/stock/**)
    participant SS as StockServiceImpl
    participant PDS as PricingDetailsServiceImpl<br/>(resolveOrCreateBatch)
    participant PD as PricingDetails<br/>(tm_pricing_details = the batch/lot)
    participant SL as StockLedger<br/>(tbl_stock_ledger, append-only)

    Note over PV: AddBatchModal.tsx is dead code on this branch —<br/>its main modal component was removed (commit "remove AddBatchModal<br/>integration"); only orphaned unused helper JSX remains, imported nowhere.

    Seller->>PV: Open product, view "Stock Management" batch list
    PV->>Svc: getAvailableBatches(productId)
    Svc->>Api: GET /stock/{productId}/batches
    Api->>SC: GET /stock/{productId}/batches
    SC->>SS: getAvailableBatchesFifo(productId, packagingId?)
    SS->>PD: findBy...StockQuantityGreaterThanOrderByManufacturingDateAsc
    PD-->>SS: batches (FIFO by manufacturingDate, deleted_at IS NULL)
    SS-->>SC: List<BatchAvailabilityDto>
    SC-->>PV: 200 batches

    alt Row-level "Update Stock" (quick +/- on one known batch)
        Seller->>PV: Click "Update Stock" on a batch row
        PV->>BSUM: open with batch (pricingId already known client-side)
        Seller->>BSUM: Enter +/- quantity, confirm
        BSUM->>Svc: addStock({productId, packagingId, batchLotNumber,<br/>manufacturingDate, expiryDate, quantity,<br/>referenceType:"MANUAL_STOCK_UPDATE"})
    else Wizard "Update Stock" — restock an existing batch
        Seller->>PV: Click top-level "Update Stock"
        PV->>SUM: open (step 1: choose update type)
        Seller->>SUM: Pick "Existing batch", select from list, enter quantity
        SUM->>Svc: addStock({productId, packagingId, batchLotNumber,<br/>manufacturingDate, expiryDate, quantity,<br/>referenceType:"MANUAL_STOCK_UPDATE"})
    else Wizard "Update Stock" — create a brand-new batch
        Seller->>PV: Click top-level "Update Stock"
        PV->>SUM: open (step 1: choose update type)
        Seller->>SUM: Pick "New batch": lot number, mfg/expiry dates, qty,<br/>MRP, selling price, discount%, special discounts,<br/>shelf life, new packagingDetails
        SUM->>Svc: validateBatchNumber (GET /pricing/validateBatchNumber) [pre-check]
        SUM->>Svc: addStock({productId, packagingDetails{...},<br/>batchLotNumber, manufacturingDate, expiryDate, quantity,<br/>mrp, sellingPrice, discountPercentage, specialDiscounts[],<br/>shelfLifeMonths/Days, dateOfStockEntry,<br/>referenceType:"MANUAL_STOCK_UPDATE"})
    end

    Svc->>Api: POST /stock/add  (Bearer token attached; no refresh-on-401)
    Api->>SC: POST /stock/add
    SC->>SS: addStock(StockInRequestDto, userId)
    SS->>SS: load Seller by userId, load ProductDetails by productId
    SS->>SS: verify product.seller == calling seller (else 401 Unauthorized)

    alt packagingId given
        SS->>SS: resolvePackaging() — must belong to this product
    else packagingDetails given (new-batch flow)
        SS->>PD: PackagingDetailsService.resolveOrCreatePackaging(...)
    end

    SS->>PDS: resolveOrCreateBatch(product, packaging, candidatePricingDetails,<br/>sellerName, sellerId)
    PDS->>PD: lookup by (productId[, packagingId], batchLotNumber)

    alt Batch lot number already exists in scope
        alt existing.expiryDate != candidate.expiryDate
            PDS-->>SS: throw BadRequestException("...different expiry date")
            SS-->>SC: 400 error
            SC-->>Api: 400
            Api-->>Svc: reject
            Svc-->>SUM: extractErrorMessage(err) shown inline
        else expiry matches — RESTOCK
            PDS->>PD: existing.stockQuantity += candidate.stockQuantity
            Note over PDS,PD: mrp/sellingPrice/discountPercentage/gstPercentage/finalPrice<br/>are NOT touched on restock — no pricing recalculation happens here.
            PDS-->>SS: existing PricingDetails (updated qty)
        end
    else No such batch yet — CREATE
        PDS->>PD: generatePricingId() = <2-letter seller prefix>BTCH<5-digit seq><br/>(synchronized, mirrors ProductDetails' own generator)
        PDS->>PD: set productDetails, packagingDetails, dateOfStockEntry (default=today),<br/>createdBy, createdDate; mrp/sellingPrice/discountPercentage/gstPercentage<br/>are taken as-is from the request — still no computed/derived pricing
        PDS-->>SS: new PricingDetails (unsaved)
    end

    SS->>PD: pricingDetailsRepository.save(batch)
    SS->>SL: buildLedgerRow(batch, product, seller, userId,<br/>STOCK_IN, quantity, batch.stockQuantity, referenceId, referenceType)
    SS->>SL: stockLedgerRepository.save(ledger)  — append-only audit row
    SS-->>SC: StockLedgerResponseDto{ledgerId, pricingId, batchLotNumber,<br/>transactionType=STOCK_IN, quantity, balanceAfter, ...}
    SC-->>Api: 200 OK
    Api-->>Svc: response.data
    Svc-->>SUM: StockLedgerResponse
    Svc-->>BSUM: StockLedgerResponse

    SUM->>SUM: setResult({batchNumber, previousStock = balanceAfter-quantity,<br/>addedStock = quantity, updatedStock = balanceAfter}) → SuccessView
    BSUM->>BSUM: same derived-preview success view
    SUM->>PV: onSuccess() -> refetchProduct()
    BSUM->>PV: onSuccess() -> refetchProduct()
    PV->>Svc: getDrugProductById(productId) — re-render Stock Management table

    Note over SC,SL: No pricing recalculation is triggered anywhere in this flow.<br/>PricingDetails.finalPrice is never computed/set by any live code path<br/>(only commented-out Excel-import setters exist). GST/discount math for a<br/>batch's sellingPrice/discountPercentage/gstPercentage only happens later,<br/>at order time, in OrderPlacementServiceImpl — not on stock add/restock.

    opt Delete a batch (soft delete)
        Seller->>PV: Click "Delete" on a batch row
        PV->>Svc: deleteBatch(productId, pricingId)
        Svc->>Api: DELETE /stock/{productId}/batches/{pricingId}
        Api->>SC: DELETE /stock/{productId}/batches/{pricingId}
        SC->>SS: deleteBatch(productId, pricingId, userId)
        SS->>SS: verify ownership; load batch; verify batch belongs to product
        alt batch.stockQuantity > 0
            SS->>SL: write STOCK_OUT ledger row (quantity=previousQty,<br/>balanceAfter=0, referenceType="BATCH_DELETED")
        end
        SS->>PD: set deletedBy, deletedAt (stockQuantity left untouched —<br/>@SQLRestriction("deleted_at IS NULL") excludes it from all totals/availability)
        SS-->>SC: BatchDeleteResponseDto
        SC-->>PV: 200 OK
        PV->>Svc: refetchProduct()
    end
```

#### 4.6 Order Lifecycle (Placement → Fulfillment → Invoice → Cancellation → Return/Refund)

```mermaid
sequenceDiagram
    autonumber

    actor Buyer
    participant BuyerUI as Buyer UI<br/>(checkout/page.tsx,<br/>orders/page.tsx,<br/>OrderDetailContent.tsx)
    participant OrderCtrl as OrderController<br/>(/orders)
    participant PlaceSvc as OrderPlacementServiceImpl
    participant StockSvc as StockService<br/>(FIFO debit/restock)
    participant OrderDB as Order / SellerOrder /<br/>OrderItem / Payment (DB)

    actor Seller
    participant SellerUI as Seller UI<br/>(seller_7a3b9f2c/orders/page.tsx)
    participant SOCtrl as SellerOrderController<br/>(/seller-orders)
    participant FulfillSvc as SellerOrderFulfillmentServiceImpl
    participant Twilio as TwilioOTPService

    participant InvCtrl as InvoiceController<br/>(/invoices)
    participant InvSvc as InvoiceServiceImpl
    participant S3 as S3Service

    participant PayCtrl as PaymentController<br/>(/payments)

    participant APIClient as No frontend caller found<br/>(returns/refunds/invoices/payments<br/>are backend-only today)
    participant RetCtrl as ReturnController<br/>(/returns)
    participant RetSvc as ReturnRefundServiceImpl
    participant CancelSvc as OrderCancellationServiceImpl

    Note over OrderCtrl,RetCtrl: SecurityConfig.filterChain = anyRequest().permitAll()<br/>(no @PreAuthorize anywhere in this flow) — only<br/>SellerOrderController resolves the actor from the JWT;<br/>everywhere else actorId/buyerId/sellerId is trusted from the request body.

    rect rgb(235,245,255)
    Note over Buyer,OrderDB: 1. ORDER PLACEMENT — POST /orders (real UI: checkout/page.tsx -> orderService.placeOrder)
    Buyer->>BuyerUI: Checkout cart (or "Place Order" from an ACCEPTED QuoteRequest)
    BuyerUI->>OrderCtrl: POST /orders {buyerId, lines[] or quoteRequestId, idempotencyKey}
    OrderCtrl->>PlaceSvc: placeOrder(request)
    alt idempotencyKey already used
        PlaceSvc-->>OrderCtrl: return the ORIGINAL Order unchanged (no duplicate)
    else new order
        PlaceSvc->>PlaceSvc: resolve product/seller/packaging server-side per line<br/>(sellerId never trusted from client)
        PlaceSvc->>StockSvc: hasSufficientStock() then debitStock() (FIFO, per line)
        StockSvc-->>PlaceSvc: debited batches (1 line may span multiple batches)
        Note right of PlaceSvc: A line that can't be fulfilled is dropped into<br/>rejectedLines instead of failing the whole order<br/>(BadRequestException only if EVERY line fails)
        PlaceSvc->>PlaceSvc: group resulting OrderItems by sellerId<br/>(LinkedHashMap) -> build one SellerOrder per seller<br/>id = SORD-{orderId-suffix}-{seq}, status=PLACED
        PlaceSvc->>OrderDB: save Order (status=OrderStatus.PLACED,<br/>id=ORD-yyyyMMdd-##### via pg advisory lock 98765)
        PlaceSvc->>OrderDB: save Payment (provider=COD,<br/>status=PaymentStatus.SUCCESS, paidAt=now,<br/>id=PAY-yyyyMMdd-##### via advisory lock 98766)
        Note right of OrderDB: COD-only build, no gateway/webhook —<br/>every order is settled SUCCESS immediately.<br/>Invoice is NOT generated here (only on delivery).
        PlaceSvc-->>OrderCtrl: OrderResponseDTO (+ rejectedLines[])
    end
    OrderCtrl-->>BuyerUI: 201 Created
    BuyerUI-->>Buyer: order confirmation
    end

    rect rgb(235,255,240)
    Note over Seller,Twilio: 2. SELLER-ORDER FULFILLMENT — real UI: seller_7a3b9f2c/orders/page.tsx -> sellerOrderService.ts
    Seller->>SellerUI: Confirm order
    SellerUI->>SOCtrl: PATCH /seller-orders/{id}/confirm (JWT -> sellerId, ownership checked)
    SOCtrl->>FulfillSvc: confirm(sellerOrderId, sellerId)
    FulfillSvc->>FulfillSvc: require PLACED -> set CONFIRMED,<br/>write OrderStatusHistory, recompute Order rollup
    FulfillSvc-->>SellerUI: SellerOrder(CONFIRMED)

    SellerUI->>SOCtrl: PATCH /seller-orders/{id}/pack
    SOCtrl->>FulfillSvc: pack(): require CONFIRMED -> PACKED

    SellerUI->>SOCtrl: PATCH /seller-orders/{id}/ship {courierName, trackingNumber, trackingUrl}
    SOCtrl->>FulfillSvc: ship(): require PACKED -> SHIPPED (records courier info)

    SellerUI->>SOCtrl: PATCH /seller-orders/{id}/out-for-delivery
    SOCtrl->>FulfillSvc: markOutForDelivery(): require SHIPPED -> OUT_FOR_DELIVERY
    FulfillSvc->>Twilio: sendOTP(buyer delivery phone) [best-effort, failure only logged]

    Seller->>SellerUI: Buyer reads OTP aloud at doorstep
    opt buyer says OTP never arrived
        SellerUI->>SOCtrl: PATCH /seller-orders/{id}/resend-delivery-otp
        SOCtrl->>FulfillSvc: resendDeliveryOtp() (only while OUT_FOR_DELIVERY, not a status transition)
        FulfillSvc->>Twilio: sendOTP() again (failure IS surfaced this time)
    end

    SellerUI->>SOCtrl: PATCH /seller-orders/{id}/deliver {otp}
    SOCtrl->>FulfillSvc: markDelivered(sellerOrderId, sellerId, otp)
    FulfillSvc->>Twilio: verifyOTP(phone, otp)
    Twilio-->>FulfillSvc: valid (else BadRequestException BEFORE any state mutation)
    FulfillSvc->>InvSvc: generateInvoiceWithPdfBytes(sellerOrderId) [best-effort,<br/>try/catch — a PDF/S3 failure never blocks DELIVERED]
    InvSvc->>S3: uploadFileFromResource(invoice PDF)
    InvSvc->>OrderDB: save Invoice (INV-{sellerId}-{FYstartYY}{FYendYY}-#####,<br/>one per SellerOrder, sequential per seller per FY)
    FulfillSvc->>OrderDB: SellerOrder OUT_FOR_DELIVERY -> DELIVERED,<br/>deliveredAt=now, recompute Order rollup
    FulfillSvc-->>SellerUI: SellerOrder(DELIVERED)
    end

    rect rgb(255,250,230)
    Note over APIClient,S3: 3. INVOICE — no frontend UI calls this;<br/>only reachable via a direct API client
    APIClient->>InvCtrl: POST /invoices/generate/{sellerOrderId}
    InvCtrl->>InvSvc: generateInvoice()
    alt Invoice already exists for this SellerOrder
        InvSvc->>S3: GET existing PDF bytes (plain java.net.http.HttpClient)
        InvSvc-->>InvCtrl: same Invoice (idempotent — no duplicate numbering)
    else no invoice yet
        InvSvc->>OrderDB: create Invoice as in step 2
    end
    APIClient->>InvCtrl: GET /invoices/{invoiceId}
    InvCtrl-->>APIClient: invoiceNumber, invoiceFileUrl, generatedAt

    APIClient->>PayCtrl: GET /payments/{paymentId}
    PayCtrl-->>APIClient: Payment row (read-only; class javadoc says<br/>no gateway/webhook is integrated — COD-only)
    end

    rect rgb(255,235,235)
    Note over Buyer,OrderDB: 4. CANCELLATION — real UI: OrderDetailContent.tsx / seller orders page<br/>only legal while SellerOrder is PLACED, CONFIRMED or PACKED
    alt buyer cancels whole Order
        BuyerUI->>OrderCtrl: POST /orders/{orderId}/cancel {actorRole:BUYER, actorId, reason}
        OrderCtrl->>CancelSvc: cancelOrder() — SELLER role is REJECTED on this endpoint,<br/>ADMIN unrestricted
    else buyer or seller cancels one SellerOrder
        BuyerUI->>SOCtrl: (buyer, via buyerApi) PATCH /seller-orders/{id}/cancel
        SellerUI->>SOCtrl: (seller) PATCH /seller-orders/{id}/cancel
        SOCtrl->>CancelSvc: cancelSellerOrder()
    end
    CancelSvc->>StockSvc: restockExactBatch() per OrderItem (by pricingId)
    CancelSvc->>OrderDB: OrderItem.itemStatus=CANCELLED,<br/>SellerOrder.status=CANCELLED
    opt Payment.status == SUCCESS
        CancelSvc->>OrderDB: create Refund(status=REQUESTED,<br/>orderItem=null i.e. whole-seller-order scope,<br/>amount=sellerOrder.grandTotal)
    end
    CancelSvc->>OrderDB: recompute Order rollup (OrderStatusRollup.compute)
    end

    rect rgb(245,235,255)
    Note over APIClient,RetSvc: 5. RETURN / REFUND — no frontend UI calls /returns anywhere in this repo
    APIClient->>RetCtrl: POST /returns {orderItemId, buyerId, reason}
    RetCtrl->>RetSvc: requestReturn()
    RetSvc->>RetSvc: require SellerOrder.status==DELIVERED AND<br/>now <= deliveredAt + 7 days (RETURN_WINDOW_DAYS, hardcoded placeholder)
    RetSvc->>OrderDB: create ReturnRequest(status=REQUESTED),<br/>SellerOrder DELIVERED -> RETURN_REQUESTED

    APIClient->>RetCtrl: PATCH /returns/{id}/decision {sellerId, approve, comment}
    RetCtrl->>RetSvc: decideReturn() — only legal while ReturnRequest==REQUESTED
    alt approve = true
        RetSvc->>OrderDB: ReturnRequest -> APPROVED,<br/>SellerOrder -> RETURN_APPROVED
        RetSvc->>OrderDB: create Refund(status=REQUESTED, orderItem=that item,<br/>amount=item.lineTotal), linked to the ReturnRequest
    else approve = false
        RetSvc->>OrderDB: ReturnRequest -> REJECTED,<br/>SellerOrder -> RETURN_REJECTED (terminal — no Refund)
    end

    APIClient->>RetCtrl: POST /returns/refunds/{refundId}/process
    RetCtrl->>RetSvc: processRefund() — idempotent no-op if already COMPLETED
    RetSvc->>OrderDB: Refund.status=COMPLETED, processedAt=now
    RetSvc->>StockSvc: restockExactBatch() (unconditional — no "resellable" flag exists)
    RetSvc->>OrderDB: SellerOrder -> RETURNED (actorRole=SYSTEM, terminal state)
    Note right of OrderDB: Payment.status is NEVER updated to REFUNDED here —<br/>PaymentStatus.REFUNDED/PARTIALLY_REFUNDED and<br/>SellerOrderStatus.REFUNDED are declared but dead code.<br/>ReturnStatus.PICKED_UP/CLOSED are also declared but never set —<br/>an approved ReturnRequest stays APPROVED forever.
    end
```

#### 4.7 Buyer/Seller Quote Request Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Buyer / Guest
    participant FE_B as Frontend: Product Page<br/>(RequestPriceForm / GetQuoteForm)
    participant BQC as BuyerQuoteRequestController
    participant QRS as QuoteRequestService
    participant DB as tbl_quote_request
    actor Seller as Seller
    participant FE_S as Frontend: Conversions Page
    participant SQC as SellerQuoteRequestController
    participant FE_B2 as Frontend: Buyer RFQ Page
    participant FE_CO as Frontend: Checkout Page
    participant OPS as OrderPlacementServiceImpl

    Note over Buyer,DB: 1. Submission (PRICE_REQUEST or RFQ)
    Buyer->>FE_B: Fill form (product, qty, contact info,<br/>+ type-specific fields)
    FE_B->>BQC: POST /buyer/quote-requests (guest allowed)
    BQC->>BQC: resolveOptionalBuyerUserId()<br/>(JWT if ROLE_BUYER, else null)
    BQC->>QRS: create(buyerUserId?, dto)
    alt buyerUserId == null (guest)
        QRS->>QRS: resolveOrCreateGuestBuyer()<br/>(match by email, or auto-provision<br/>BuyerUser + temp password, email it)
    end
    QRS->>QRS: seller = product.getSeller()<br/>(buyer never chooses seller)
    QRS->>DB: save QuoteRequest(status=PENDING)
    QRS-->>Buyer: best-effort confirmation email
    QRS-->>Seller: best-effort new-request email
    QRS-->>FE_B: QuoteRequestResponseDTO

    Note over Seller,DB: 2. Seller responds (one-shot, PENDING only)
    Seller->>FE_S: Open Conversions / Quote Requests
    FE_S->>SQC: GET /seller/quote-requests
    SQC->>QRS: listForSeller(sellerId from JWT)
    QRS->>DB: findBySeller_SellerId...
    DB-->>FE_S: list (incl. this PENDING request)
    Seller->>FE_S: Enter quotedPrice, validUntil, notes
    FE_S->>SQC: PATCH /seller/quote-requests/{id}/respond
    SQC->>QRS: respond(id, sellerId, dto)
    alt status != PENDING
        QRS-->>SQC: 400 "already responded to"
    else status == PENDING
        QRS->>DB: set quotedPrice/quoteValidUntil/sellerNotes,<br/>status=QUOTED
        QRS-->>Buyer: best-effort "you've received a quote" email
        QRS-->>FE_S: updated DTO
    end

    Note over Buyer,DB: 3. Buyer accepts or rejects (QUOTED only)
    Buyer->>FE_B2: Open RFQ dashboard
    FE_B2->>BQC: GET /buyer/quote-requests
    BQC->>QRS: listForBuyer(buyerUserId from JWT)
    QRS->>DB: findByBuyerUser_BuyerUserId...
    DB-->>FE_B2: list (incl. this QUOTED request)
    alt Buyer accepts
        Buyer->>FE_B2: Click Accept
        FE_B2->>BQC: PATCH /buyer/quote-requests/{id}/accept
        BQC->>QRS: accept(id, buyerUserId)
        alt status != QUOTED
            QRS-->>BQC: 400 "Only a quoted request can be accepted"
        else status == QUOTED
            QRS->>DB: status=ACCEPTED
        end
    else Buyer rejects
        Buyer->>FE_B2: Click Reject
        FE_B2->>BQC: PATCH /buyer/quote-requests/{id}/reject
        BQC->>QRS: reject(id, buyerUserId)
        alt status != QUOTED
            QRS-->>BQC: 400 "Only a quoted request can be rejected"
        else status == QUOTED
            QRS->>DB: status=REJECTED
        end
    end

    Note over Buyer,OPS: 4. Accepted quote → Order (separate downstream flow)
    Buyer->>FE_B2: Click "Place Order" (only if org approved)
    FE_B2->>FE_CO: navigate /checkout?quoteRequestId={id}
    FE_CO->>OPS: place order referencing quoteRequestId
    alt status == ORDER_PLACED already
        OPS-->>FE_CO: error "already placed as order <orderId>"
    else status != ACCEPTED
        OPS-->>FE_CO: error (not accepted)
    else status == ACCEPTED
        OPS->>OPS: build order line item from<br/>product/quantity/quotedPrice
        OPS->>DB: status=ORDER_PLACED, orderId=&lt;new order id&gt;
        OPS-->>FE_CO: Order created
    end
```

#### 4.8 Master Data Retrieval — No Pagination/Sorting Convention (as-built)

```mermaid
sequenceDiagram
    autonumber
    participant UI as ProductList.tsx (seller Products page)
    participant FE as ProductService.ts / sellerOrderService.ts
    participant PDC as ProductDetailsController
    participant SOC as SellerOrderController
    participant SVC as Service layer
    participant DB as Repository / DB

    Note over UI,DB: No endpoint in the backend accepts page/size/sort — confirmed by grep across the whole controller tree

    UI->>FE: getProductList()
    FE->>PDC: GET /products/getAll (NO page, size, sort, or search params)
    PDC->>SVC: getAllProducts(userId)
    SVC->>DB: findAll-style query, no Pageable, no LIMIT/OFFSET
    DB-->>SVC: entire result set
    SVC-->>PDC: List of ProductDetailsDto (ALL rows)
    PDC-->>FE: 200 OK, raw List (no envelope, no count)
    FE-->>UI: full array

    Note over UI: Everything below happens client-side, in the browser,<br/>on the already-fetched full array — never sent back to the server
    UI->>UI: data.filter(searchTerm, categoryFilter, stockFilter, statusFilter)
    UI->>UI: sortData(filteredData, sortOption)
    UI->>UI: sortedData.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE) // PAGE_SIZE hardcoded = 10

    Note over FE,SOC: The ONE real backend filter param found anywhere: status
    FE->>SOC: GET /seller-orders/seller/{sellerId}?status=SHIPPED
    SOC->>SVC: getSellerOrdersBySeller(sellerId, status)
    SVC->>DB: query filtered by status (still no page/size)
    DB-->>SVC: full filtered result set
    SVC-->>SOC: List of SellerOrderResponseDTO
    SOC-->>FE: ApiResponse{status,message,data,count} // count = data.size(), not a page total

    Note over PDC,SOC: Master-data controllers (StateMasterController /states,<br/>DistrictMasterController /districts/state/{stateId}, etc.)<br/>behave like ProductDetailsController: full list, path-variable<br/>scoping only, zero query-string params, no pagination.
```

---

### 5. Method-Level Design

Business-critical methods only, each verified by directly reading the method body (file/line cited in Business Logic where useful).

| Method | Class | Input | Output | Validation | Business Logic | Exceptions | DB Interaction |
|---|---|---|---|---|---|---|---|
| `processReview` | `SellerApprovalServiceImpl` (`.../service/serviceImpl/admin/SellerApprovalServiceImpl.java:74`) | `SellerApprovalRequestDTO{id,status,comments}` | `SellerApprovalResultDTO` | `status.toUpperCase()` must be `ACCEPT`/`REJECT`/`CORRECTION` | Switches to `handleCorrection`/`handleRejection`/`handleApproval`; always returns `tempSellerId` + real generated `sellerId` (unrelated values) | `NotFoundException("Seller not found")`; `ApplicationException("Invalid Status")` for anything else | SELECT `TempSeller` by id; downstream INSERT/UPDATE per branch; `@Transactional` |
| `handleApproval` (private) | `SellerApprovalServiceImpl:380` | `TempSeller`, `comments` | `Seller` | `tempSeller.getUser() != null` (signup-first invariant) | Phase 1: persist `Seller`+children via `mapAndPersistSeller`, flip `TempSeller.status=APPROVED` immediately; Phase 2 (after commit-worthy state): best-effort S3 migration + agreement email, wrapped in its own try/catch so failure never undoes the approval | `ApplicationException` if `signupUser == null` | INSERT `tbl_seller`+children; UPDATE `tbl_temp_seller.status`; INSERT `tbl_temp_seller_review_history` |
| `generateSellerId` (private) | `SellerApprovalServiceImpl:672` | `TempSeller` | `String` | none (assumes `sellerName`/`sellerType` populated) | `[first 2 alpha chars of sellerName, uppercased][first 3 chars of sellerTypeAbbreviation, uppercased][4-digit zero-padded global sequence]`; sequence via `sellerRepo.findMaxSellerSequence()+1` guarded by `sellerRepo.acquireSellerIdLock()` (`pg_advisory_xact_lock(12345)`) | none thrown directly | Native `SELECT MAX(sequence)`; advisory lock acquired first to prevent duplicate IDs under concurrent approvals |
| `generateProductId` (private, `synchronized`) | `ProductDetailsServiceImpl:375` | `productName`, `sellerName` | `String` | none | 2-letter seller-name prefix (alpha-only, uppercased, X-padded) + 3-letter product-name fragment + 5-digit zero-padded global sequence from `productRepo.findMaxProductNumber()` | none | Native `SELECT MAX` query |
| `createProduct` | `ProductDetailsServiceImpl:59` | `ProductDetailsDto dto, Long userId, boolean allowMergeIntoExisting` | `ProductDetailsDto` | Per-category checks inline in `setChildRelationships` (certifications non-empty + category FK for NonConsumable/Supplement/FoodInfant; certifications `!= null` only — a no-op given the entity's default empty-list initializer — for Consumable/Cosmetic) | If `allowMergeIntoExisting=true` and an existing product matches seller+productName+manufacturerName+categoryId, delegates to `addVariantToExistingProduct` (packaging/pricing only); else generates `productId` and inserts a fresh `ProductDetails` + attribute rows + placeholder `ProductCertificateDocument` rows | `RuntimeException` on failed per-category checks | INSERT `tm_product_details` + attribute table + certificate placeholders, OR INSERT into `tm_packaging_details`/`tm_pricing_details` (merge path) |
| `mapRow` / `validateMandatoryExcel`/`Csv` | e.g. `DrugImportStrategy` implementing `ProductImportStrategy` | `Row`/`CSVRecord`, `categoryId`, `userId` | `ProductDetailsDto` | Collects **all** field violations (length/range/regex/lookup: GST∈{0,5,12,18}, HSN 4/6/8 digits, MRP/selling-price ordering, batch alphanumeric 3-20 chars + uniqueness via `PricingDetailsService.isBatchNumberExistsForSeller`, up to 4 additional-discount slabs) | Builds a `ProductDetailsDto` with placeholder cert/brochure fields (`"NOT_UPLOADED"`) | `ValidationException(List<String>)` thrown once at the end — **not** fail-fast | Read-only (`isBatchNumberExistsForSeller` query) during validation |
| `getStrategy` | `ProductImportStrategyFactory` (`Map<String,ProductImportStrategy> strategies`) | `categoryName: String` | `ProductImportStrategy` | Case-insensitive key match | Resolves the `@Component`-named bean (`"DRUGS"`, `"CONSUMABLE"`, etc.) matching the mapped key | `RuntimeException` listing registered keys if no match | none (in-memory bean map) |
| `transition` (private) | `SellerOrderFulfillmentServiceImpl:227` | `sellerOrderId, sellerId, requiredCurrentStatus, newStatus, mutator, notificationAttachments` | `SellerOrderResponseDTO` | Ownership (`sellerOrder.getSeller().getSellerId().equals(sellerId)`); exact current-status match | Mutates `SellerOrder`, sets `newStatus`, mirrors any `OrderItem` still at `fromStatus` forward, appends `OrderStatusHistory`, saves, then recomputes the parent `Order` rollup | `ResourceNotFoundException`; `UnauthorizedException`; `BadRequestException("...must be X to move to Y, but is currently Z")` | UPDATE `tbl_seller_order`, `tbl_order_item`; INSERT `tbl_order_status_history`; UPDATE `tbl_order` (rollup) |
| `markDelivered` | `SellerOrderFulfillmentServiceImpl:86` | `sellerOrderId, sellerId, otp` | `SellerOrderResponseDTO` | OTP must verify via Twilio **before** any state mutation; current status must be `OUT_FOR_DELIVERY` | Verifies OTP, generates an invoice attachment best-effort (`generateInvoiceAttachment`, deliberately non-`@Transactional` per its own comment so a PDF/S3 failure can't roll back the delivery confirmation), then calls `transition()` to `DELIVERED` | `BadRequestException` on bad OTP or wrong status | Same as `transition()` + INSERT `tbl_invoice` (best-effort) |
| `compute` | `OrderStatusRollup:42` | `List<String> childStatuses` | `String` (parent status) | none | Pure function: no children→`PLACED`; all `CANCELLED`→`CANCELLED`; all active children in a "post-delivery" set→`DELIVERED`; all active children shipped-or-beyond→`SHIPPED`; any active child shipped-or-beyond→`PARTIALLY_SHIPPED`; else `PLACED` | none | none — no DB access, called after every child-status mutation |
| `cancelSellerOrder` | `OrderCancellationServiceImpl:75` | `sellerOrderId, actorRole, actorId, reason` | `SellerOrderResponseDTO` | Current status ∈ `CANCELLABLE_STATUSES = {PLACED, CONFIRMED, PACKED}` | Restocks each `OrderItem`'s exact batch (`stockService.restockExactBatch` by `pricingId`), sets item/order status `CANCELLED`; if `Payment.status==SUCCESS`, inserts a whole-order-scope `Refund(REQUESTED)`; recomputes rollup | `BadRequestException` if not in a cancellable status | UPDATE `tbl_seller_order`/`tbl_order_item`; UPDATE `tm_pricing_details` (restock) + INSERT `tbl_stock_ledger`; conditional INSERT `tbl_refund` |
| `resolveOrCreateBatch` | `PricingDetailsServiceImpl:40` | `ProductDetails product, PackagingDetails packaging, PricingDetails candidate, String sellerName, String sellerId` | `PricingDetails` (existing, mutated, or new unsaved) | `packagingId` required if product has >1 packaging variant; on a lot-number match, `expiryDate` must be identical | If a batch with the same `(productId[, packagingId], batchLotNumber)` exists and expiry matches → **restock** (`stockQuantity += candidate.stockQuantity`, no pricing fields touched); else generate `pricingId` (`generatePricingId`) and persist the candidate's raw pricing fields as-is (no computation) | `BadRequestException` (packaging required / expiry mismatch) | SELECT by composite key; native `MAX` query for sequence inside `generatePricingId` |
| `debitStock` | `StockServiceImpl:218` | `StockDebitRequestDto`, `userId` | `List<StockLedgerResponseDto>` | Pre-check (non-locking) total available ≥ requested; `packagingId` required if >1 variant | FIFO by `manufacturingDate` ascending across matching batches, each read/decrement inside a `PESSIMISTIC_WRITE`-locked query within one `@Transactional` method, taking `min(remaining, batch.stockQuantity)` per batch until satisfied | `InsufficientStockException` if pre-lock total < requested | `SELECT ... FOR UPDATE` on `tm_pricing_details`; UPDATE `stockQuantity` per batch touched; INSERT one `STOCK_OUT` `tbl_stock_ledger` row per batch |
| `generateJwtToken` / `generateRefreshToken` / `hashToken` | `JwtUtils` (`security/JwtUtils.java:33,65,71`) | `Authentication` / – / `rawToken` | Signed JWT / opaque raw token / SHA-256 hash | none | HS256 sign via `Keys.hmacShaKeyFor(app.jwt.secret)`, claims `sub`/`iat`/`exp` only (no roles/userId embedded); refresh token = 64 `SecureRandom` bytes, base64url-encoded; hash = SHA-256 digest, base64-encoded | `RuntimeException` if SHA-256 unavailable (never in practice) | none |
| `refreshAccessToken` | `AuthService:250` (seller) | `rawRefreshToken` | `LoginResponse{accessToken, refreshToken}` | Token must resolve by hash and pass `isValid()` (not revoked, not expired) | **Rotation**: `stored.setRevokedAt(now)` on the old row, then generates + persists a brand-new access token and a brand-new `RefreshToken` row | `RefreshTokenException` (mapped to 401) | SELECT `tbl_refresh_tokens` by `tokenHash`; UPDATE `revokedAt`; INSERT new row |
| `respond` | `QuoteRequestService` | `quoteRequestId, sellerId, SellerQuoteResponseDTO{quotedPrice,quoteValidUntil,sellerNotes}` | `QuoteRequestResponseDTO` | Current status must be `PENDING` | Sets `quotedPrice`/`quoteValidUntil`/`sellerNotes`, flips `status=QUOTED`, best-effort emails the buyer | 400 `"This request has already been responded to"` if not `PENDING` | UPDATE `tbl_quote_request` |
| `accept` / `reject` | `QuoteRequestService` | `quoteRequestId, buyerUserId` | `QuoteRequestResponseDTO` | Current status must be `QUOTED` | Flips `status=ACCEPTED`/`REJECTED` | 400 `"Only a quoted request can be accepted/rejected"` if not `QUOTED` | UPDATE `tbl_quote_request` |

---

### 6. Database Interactions Per Module

| Module | Tables Accessed | R/I/U/D | Joins | Transactions |
|---|---|---|---|---|
| M1 Master/Reference Data | `tbl_state_master`, `tbl_district_master`, `tbl_taluka_master`, `tbl_company_type_master`, `tbl_seller_type_master`, `tbl_product_type_master`, `tbl_buyer_type_master`, `tbl_document_type_master`, `tbl_role_master` | Read-only everywhere | `DistrictMaster`/`TalukaMaster` → `StateMaster` (read-only `insertable=false,updatable=false` FK); `BuyerTypeMaster` → `DocumentTypeMaster` (`mandatoryDocumentTypeId`) | None declared (all simple reads) |
| M2 Product Catalog Core | `tm_product_details`, `tm_product_attribute_drug`, `tm_product_attribute_consumable_medical`, `tm_product_attribute_non_consumable_medical`, `tm_product_attribute_supplements_or_nutraceuticals`, `tm_product_attribute_cosmetic_and_personal_use`, `tm_product_attribute_food_infant`, `tm_product_image`, `tm_product_certificate_document`, `tm_product_user_manual`, `pm_product_molecule` | R/I/U/D | `ProductDetails` ↔ `Seller`, `Category`; `ProductCertificateDocument` has 5 nullable FKs (one per attribute type, no discriminator) | `createProduct`/`updateProduct` are single-transaction cascades (product + all attribute rows + cert placeholders committed together) |
| M3 Product Lookup/Attribute Masters | `tm_category`, `tbl_dosage_form_master`, `tm_pack_type`, `tm_therapeutic_category_master`/`_subcategory_master`, `tm_molecules_master`, `tbl_storage_condition_master`, `tbl_device_category_master`/`_sub_category_master`, `tbl_certification_master`, `tbl_country_master`, `tm_hair_type_master`/`tm_skin_type_master`, `tm_age_group_master`, `tm_flavour_master`, `tm_gst_percentage_master` | Read-only (Flavour: full CRUD) | Most FK into `tm_category` | None (read-only) |
| M4 Stock & Pricing | `tm_pricing_details`, `tbl_stock_ledger`, `tm_additional_discount`, `tm_special_schemes` | R/I/U (soft-D via `deletedAt`) | `PricingDetails` → `ProductDetails`, `PackagingDetails` | `addStock`/`debitStock`/`deleteBatch` are each `@Transactional`; `debitStock` uses `PESSIMISTIC_WRITE` row locks across all touched batches |
| M5 Seller Signup & Temp Registration | `tbl_user` (create-only here), `tbl_temp_seller`, `tbl_temp_seller_address`, `tbl_temp_seller_coordinator`, `tbl_temp_seller_bank_details`, `tbl_temp_seller_document`, `tbl_temp_seller_review_history`, `tbl_temp_seller_email_otp`, `phone_otp`, `tbl_terms_master` | R/I/U/D | `TempSeller` 1:1 to `User`; cascaded 1:1/1:N to address/coordinator/bank/documents | `createTempSeller`/`finalizeDraft` persist the full aggregate in one transaction |
| M6 Seller Approval & Profile | `tbl_seller`, `tbl_seller_address`, `tbl_seller_coordinator`, `tbl_seller_bank_details`, `tbl_seller_gst`, `tbl_seller_document`, `tbl_seller_history`, `tbl_pending_seller`, `tbl_pending_seller_document` | R/I/U | `Seller` ↔ `TempSeller` (audit link only, `tempSellerId` on `Seller`) | `handleApproval` is `@Transactional` for Phase 1 (Seller+children insert, TempSeller status flip) only — Phase 2 S3 migration runs **after** commit, outside any DB transaction, so a failed file copy cannot be rolled back |
| M7 Buyer Signup & Temp Registration | `tbl_buyer_user`, `tbl_buyer_signup_otp`, `tbl_buyer_login_otp`, `tbl_buyer_refresh_tokens`, `tbl_temp_buyer`, `tbl_temp_buyer_address`, `tbl_temp_buyer_contact`, `tbl_temp_buyer_document`, `tbl_temp_buyer_review_history`, `tbl_buyer`, `tbl_buyer_address`, `tbl_buyer_contact`, `tbl_buyer_document` | R/I/U/D | `TempBuyer` 1:1 to `BuyerUser`; `Buyer` ↔ `TempBuyer` (audit link) | Same two-phase pattern as M6, mirrored exactly (per `BuyerApprovalServiceImpl`'s own doc comment) |
| M8 Admin | Reads/writes the same tables as M6/M7/M9 through their services; `AdminOrderController.adminOverride` additionally writes `tbl_order_status_history` per `SellerOrder` | R/U | — | `adminOverride` is transactional per order; bypasses `SellerOrderFulfillmentServiceImpl.transition`'s legality check entirely |
| M9 Order/Payment/Invoice/Return | `tbl_order`, `tbl_seller_order`, `tbl_order_item`, `tbl_order_status_history`, `tbl_payment`, `tbl_refund`, `tbl_return_request`, `tbl_invoice` | R/I/U | `Order` 1:N `SellerOrder` 1:N `OrderItem`; `SellerOrder` 1:1 `Invoice`; `Payment` 1:N `Refund`; `OrderItem` 1:0..1 `ReturnRequest` | `placeOrder` is one transaction spanning stock debit + Order/SellerOrder/OrderItem/Payment insert; each fulfillment transition is its own `@Transactional` method |
| M10 Quote Request | `tbl_quote_request` | R/I/U | → `ProductDetails`, `Seller`, `BuyerUser` | Each `create`/`respond`/`accept`/`reject` call is a single-row transaction |
| M11 Security & Auth Infrastructure | `tbl_user`, `tbl_refresh_tokens`, `tbl_login_otp` | R/I/U | `User` 1:N `RefreshToken`, 1:N `LoginOtp` | Refresh rotation (revoke old + insert new) happens inside one `@Transactional` method |
| M12 DB Config/Migrations | Schema-level only (Flyway `V1`-`V3`, manual `docs/*.sql`) | DDL + seed INSERTs | — | Flyway migrations run once at startup under its own transaction management |
| M14-18 Frontend | No direct DB access — all persistence is via the backend REST surface; `localStorage`/cookies hold only client-side session/token state | — | — | — |

---

### 7. Error Handling & Edge Cases

#### 7.1 Exception classes (verified: `exception/*.java`, `exception/auth/*.java`)

| Exception | Extends | HTTP Status | Mapped by |
|---|---|---|---|
| `BaseException` | `RuntimeException` | Carries its own `HttpStatus` | `GlobalExceptionHandler.handleBaseException` |
| `ApplicationException` | `BaseException` | 400 (default) or explicit | `GlobalExceptionHandler.handleBaseException` |
| `NotFoundException` | `BaseException` | 404 | `GlobalExceptionHandler.handleBaseException` |
| `InsufficientStockException` | `BaseException` | 409 | `GlobalExceptionHandler.handleBaseException` |
| `ResourceNotFoundException` | `RuntimeException`, `@ResponseStatus(NOT_FOUND)` | 404 | `GlobalExceptionHandler.handleResourceNotFoundException` (explicit handler) plus Spring's own `@ResponseStatus` |
| `BadRequestException` | `RuntimeException` | 400 | `GlobalExceptionHandler.handleBadRequestException` |
| `UnauthorizedException` | `RuntimeException` | 401 | `GlobalExceptionHandler.handleUnauthorizedException` |
| `ValidationException` | `RuntimeException` | Falls through to the generic `Exception` handler (500) — **not** individually mapped | `GlobalExceptionHandler.handleGenericException` |
| `DuplicateRequestException` | `RuntimeException` | Its dedicated handler is entirely commented out in `GlobalExceptionHandler.java` (lines 77-96) | Falls through to `handleGenericException` (500) |
| `InvalidCredentialsException`, `AccountLockedException`, `AccountInactiveException` | `RuntimeException` | 401 / 403 / 403 | `GlobalLogInExceptionHandler` (a **second**, separate `@ControllerAdvice`) |
| `MethodArgumentNotValidException` | (Spring) | 400 | Handled **twice** — once in `GlobalExceptionHandler` (wraps in `ApiResponse`) and once in `GlobalLogInExceptionHandler` (raw field map) — an ambiguity, resolved only by Spring's advice-bean ordering, not by any explicit precedence in code |
| `OtpExpiredException`, `OtpInvalidException`, `OtpLockedException`, `RefreshTokenException` (`exception/auth/`) | (not directly inspected in this pass) | 410 / 401 / 429 / 401 respectively, per the caller sites read in `AuthService`/`BuyerAuthService` | Caught at the controller layer via `buildErrorResponse()` helpers in `AuthenticationController`/`SignupController`, not solely by the global advices |

#### 7.2 Global response enveloping

`GlobalResponseHandler` (`response/GlobalResponseHandler.java`, a `ResponseBodyAdvice`) wraps every **successful** (`<400`) response body not already an `ApiResponse` into `{status:"SUCCESS", message:"Request processed successfully", data, count}`. This means the same conceptual "list" endpoint can return three different shapes across the app depending on which controller wrote it: a raw `List` (e.g. `ProductDetailsController.getAll`), an `ApiResponse`-wrapped `List` (e.g. `SellerProfileController.findAll`), or (per §4.8) an unpaginated full array either way — **IMPLEMENTED**, but inconsistent, not a deliberate two-tier design.

#### 7.3 Notable edge cases (grounded in source, each labeled)

| Edge case | Status | Evidence |
|---|---|---|
| Non-atomic seller/buyer approval: DB commit (Phase 1) happens before best-effort S3 file migration and email (Phase 2); a failed S3 copy leaves the seller "APPROVED" with a mix of old `tempsellers/...` and new `sellers/...` URLs | **IMPLEMENTED** (by design, per code comments) | `SellerApprovalServiceImpl.handleApproval`/`migrateAllSellerImages`, `BuyerApprovalServiceImpl` mirror |
| Consumable/Cosmetic certification check (`certifications != null`) can never fire because the entity field defaults to `new ArrayList<>()` — an empty list silently passes where NonConsumable/Supplement/FoodInfant correctly reject it | **IMPLEMENTED** (a dead-check bug, not a deliberate rule) | `ProductDetailsServiceImpl.setChildRelationships` |
| `SellerOrderStatus.REFUNDED`, `PaymentStatus.REFUNDED`/`PARTIALLY_REFUNDED`/`PENDING_COD`/`INITIATED`/`FAILED`, `ReturnStatus.PICKED_UP`/`CLOSED`, `RefundStatus.PROCESSING`/`FAILED`, `QuoteRequestStatus.EXPIRED`, `TempBuyerStatus.UNDER_REVIEW`/`SUSPENDED` are all declared enum/constant values that no code path in the repository ever assigns | **NOT IDENTIFIED** (searched via repo-wide grep for each assignment site — none found) | Multiple status-constant classes across M7/M9/M10 |
| A completed refund never propagates back to `Payment.status`; an approved `ReturnRequest` stays `APPROVED` forever (never advances to `PICKED_UP`/`CLOSED`) | **PARTIALLY IMPLEMENTED** — refund tracked only on the separate `Refund` row | `ReturnRefundServiceImpl.processRefund` |
| `ExcelProductImportController` is a fully commented-out, unregistered dead controller; the live bulk-import path is `ProductImportController` | **IMPLEMENTED** (dead code confirmed, not wired as a Spring bean) | `controller/product/ExcelProductImportController.java` |
| Frontend bulk-import UI (`DashboardFilters.tsx`) posts to a **hardcoded external host** (`https://api-test-aggreator.tiameds.ai/api/v1/products/import`) instead of `NEXT_PUBLIC_API_URL`, bypassing both `lib/api.ts` and `utils/api.ts` | **IMPLEMENTED** (a real bug) | `src/app/seller_7a3b9f2c/dashboard/components/DashboardFilters.tsx` |
| `ConsumbaleService.getConsumableStorageConditions()` calls `api.get("storageconditions")` — no matching backend route exists anywhere (grepped case-insensitively) | **NOT IDENTIFIED** (route absent on backend) — frontend call will 404 | `src/services/product/ConsumbaleService.ts` |
| `ProductService.getPackTypes()` calls `masters/pack-types` — no matching backend route exists (only the distinct `/pack-type-units` does) | **NOT IDENTIFIED** — will 404 | `src/services/product/ProductService.ts` |
| `FoodInfantService.uploadFoodInfantBrochure()`/`updateFoodInfantBrochureUrl()` target `/product-documents/food-infant/{id}/brochure` and `/product-attributes/food-infant/{id}/brochure` — neither exists on the backend (Food & Infant has no brochure endpoint at all, only certificates) | **NOT IDENTIFIED** — will 404 | `src/services/product/FoodInfantService.ts` |
| `IFSCService.ts`'s backend fallback URL is built as `` `${NEXT_PUBLIC_API_URL}ifsc` `` with no `/` separator, producing `.../api/v1ifsc/{code}` instead of `.../api/v1/ifsc/{code}` | **IMPLEMENTED** (a real bug) | `src/services/seller/IFSCService.ts` |
| `src/proxy.ts` has the right shape for Next.js middleware (checks a `token` cookie, redirects, exports a `matcher`) but is named/exported wrong (`proxy.ts`/`proxy()` instead of `middleware.ts`/`middleware()`); no `middleware.ts` exists anywhere in the repo | **NOT IDENTIFIED** — confirmed dead, never runs | `src/proxy.ts`; repo-wide glob for `middleware.{ts,js}` |
| Spring Security's active rule is `auth.anyRequest().permitAll()` — the stricter, role-scoped rule set exists only as commented-out code | **IMPLEMENTED** (the permissive rule is what actually runs) | `config/SecurityConfig.java` |
| `AdminBuyerController.reviewBuyer` and most of `TempSellerController`'s endpoints (all but `createTempSeller`/`createDraft`) have **no** in-code Authentication check of any kind, on top of the permissive Spring Security rule above | **NOT IDENTIFIED** (no auth check found in these handlers) | `controller/admin/AdminBuyerController.java`; `controller/temp/seller/TempSellerController.java` |
| Order module: `OrderController`/`ReturnController`/`InvoiceController`/`PaymentController` trust `buyerId`/`sellerId`/`actorId` from the request body with no JWT cross-check; only `SellerOrderController` resolves the actor from the JWT | **PARTIALLY IMPLEMENTED** | `controller/order/*.java` |
| `/stock/{productId}/total`, `/batches`, `/debited-total`, `/added-total` (GET) declare no `Authentication` parameter, unlike the POST/DELETE stock endpoints | **PARTIALLY IMPLEMENTED** | `controller/product/StockController.java` |
| No frontend caller was found for `ReturnController`, `PaymentController`, or `InvoiceController` (manual generate/get) anywhere in `src/` | **NOT IDENTIFIED** | grep across `src/services/**` |
| Two duplicate `resetPasswordSchema` definitions exist (`src/schema/seller/loginSchema.ts` vs. locally-defined copies in `src/app/reset-password/page.tsx` and `.../[token]/page.tsx`), and the non-dynamic `/reset-password` route requires a `usernameFromUrl` prop the App Router never supplies | **IMPLEMENTED** (both routes render, but the plain one's username field is always empty) | `src/app/reset-password/page.tsx`, `.../[token]/page.tsx` |

---

### 8. Design Patterns Used

Only patterns with a concrete, cited implementation are listed — no pattern is claimed without a pointer to real code.

| Pattern | Where | Status |
|---|---|---|
| **Strategy** | `ProductImportStrategy` interface + 6 `@Component` implementations (`DrugImportStrategy`, `ConsumableImportStrategy`, `NonConsumableImportStrategy`, `CosmeticsImportStrategy`, `FoodInfantImportStrategy`, `SupplementsImportStrategy`), selected at runtime per product category | **IMPLEMENTED** — `service/product/util/*ImportStrategy.java` |
| **Factory** | `ProductImportStrategyFactory` wraps Spring's `Map<String,Bean>` auto-injection with a case-insensitive `getStrategy(categoryName)` lookup | **IMPLEMENTED** — `service/product/util/ProductImportStrategyFactory.java` |
| **Repository** | Every entity has a Spring Data `JpaRepository` interface (verified across all 13 backend modules) | **IMPLEMENTED** |
| **Service Layer** (interface + impl) | Consistently `XService`/`XServiceImpl` across `service/**` (e.g. `SellerApprovalService`/`SellerApprovalServiceImpl`, `StockService`/`StockServiceImpl`) | **IMPLEMENTED** |
| **DTO** | Dedicated `dto/**` package per domain, never exposing entities directly across the REST boundary (verified for product, seller, buyer, order, quote) | **IMPLEMENTED** |
| **Builder** | Lombok `@Builder` used throughout DTOs/entities (e.g. `SellerApprovalResultDTO.builder()...build()`, `TempSellerReviewHistory.builder()...build()`) | **IMPLEMENTED** |
| **Ledger / append-only journal** | `StockLedger` records every stock movement with a running `balanceAfter`, alongside the mutable `PricingDetails.stockQuantity` as the fast-read projection; confirmed only ever inserted, never updated/deleted | **IMPLEMENTED** — `entity/product/StockLedger.java`, `service/product/productImpl/StockServiceImpl.java` |
| **Soft delete via `@SQLRestriction`** | `PricingDetails` (`deleted_at IS NULL`) — deleted batches are excluded from every default query/total automatically | **IMPLEMENTED** — `entity/product/PricingDetails.java` |
| **Two-phase commit-then-migrate** | Seller/buyer approval persists the DB aggregate with old (temp) S3 URLs first, commits, *then* best-effort copies files to the permanent folder and deletes the old copy — explicitly so a slow/failed S3 operation can never block or half-undo an otherwise-valid approval | **IMPLEMENTED** — `SellerApprovalServiceImpl`, `BuyerApprovalServiceImpl` |
| **Advisory-lock sequential ID generation** | Postgres `pg_advisory_xact_lock` keys: 12345 (seller ID), 54321 (buyer ID), 98765 (order ID), 98766 (payment ID) — each distinct so concurrent approvals/placements across domains never race each other | **IMPLEMENTED** — `SellerRepository`, `BuyerRepository`, `OrderRepository`, `PaymentRepository` |
| **`ResponseBodyAdvice` global envelope** | `GlobalResponseHandler` wraps all unwrapped 2xx bodies in `ApiResponse`, explicitly skipping already-wrapped bodies and ≥400 responses | **IMPLEMENTED**, but inconsistently applied across controllers (§7.2) |
| **Draft/staging entity pattern** | `TempSeller`/`TempBuyer` are flat, denormalized full copies of the eventual `Seller`/`Buyer` aggregate rather than reusing the same child entities — admin approval is a field-by-field copy, not a status flip on a shared row | **IMPLEMENTED** — `entity/temp/seller/*`, `entity/temp/buyer/*` |
| **Optimistic/best-effort side-effect isolation** | Every email send and the delivery-OTP send/agreement-PDF fetch are wrapped in their own try/catch so a mail/PDF/S3 failure can never mark the caller's transaction rollback-only or fail an otherwise-valid business operation | **IMPLEMENTED** — `SellerApprovalServiceImpl.sendApprovalAgreementEmail`, `SellerOrderFulfillmentServiceImpl.generateInvoiceAttachment`, `QuoteRequestService.notifyOnCreate/notifyOnRespond` |
| **Pure-function status rollup** | `OrderStatusRollup.compute(List<String>)` is the single, side-effect-free source of truth for deriving `Order.status` from child `SellerOrder` statuses, called identically from 4 different service classes | **IMPLEMENTED** — `service/order/support/OrderStatusRollup.java` |
| **JWT + rotating opaque refresh token hybrid** | Stateless signed JWT (subject-only claims) for request auth, paired with a persisted, rotated, SHA-256-hashed opaque refresh token — never the raw value at rest | **IMPLEMENTED** — `security/JwtUtils.java` |
| **Singleton service (frontend)** | `export const sellerAuthService = new SellerAuthService()` etc. alongside plain exported async functions in `product/*` services — two coexisting conventions | **IMPLEMENTED** |
| **Client-side route guard** | `seller_7a3b9f2c/layout.tsx` and `buyer_e8d45a1b/dashboard/layout.tsx` each independently implement a `useEffect`-based auth check + redirect/modal, not a shared guard component | **IMPLEMENTED**, duplicated rather than abstracted |

---

### 9. Pseudocode

Derived directly from the method bodies cited in §5 — no invented logic.

#### 9.1 Product category import: strategy resolution + validation

```
function importFile(file, userId, categoryId):
    category = CategoryRepository.findById(categoryId)
    strategyKey = resolveStrategyKey(category.categoryName)   # e.g. "CONSUMABLE MEDICAL DEVICES & EQUIPMENT" -> "CONSUMABLE"
    strategy = ProductImportStrategyFactory.getStrategy(strategyKey)   # case-insensitive bean-name match; throws if none

    rows = openWorkbookOrCsv(file)
    skip sheets named "Master" / "Masters"
    for row in rows[2:]:                       # rows 0/1 are headers
        if row.productName is blank: continue
        try:
            dto = strategy.mapRow(row, categoryId, userId)
                # inside mapRow -> validateMandatoryExcel(row):
                #   errors = []
                #   for each mandatory field: check length/range/regex/lookup, append to errors on failure
                #   check GST in {0,5,12,18}; HSN is 4/6/8 digits
                #   check batch number 3-20 alnum AND not already used by this seller+category
                #   check MRP>0, sellingPrice>0 and <= MRP
                #   check up to 4 additional-discount slabs (MPQ/discount%/date-window rules)
                #   if errors not empty: throw ValidationException(errors)   # NOT fail-fast
                #   build dto with certificateUrl = "NOT_UPLOADED" placeholders
            ProductDetailsService.createProduct(dto, userId, allowMergeIntoExisting = true)
                # merges into an existing seller+productName+manufacturerName+categoryId match
                # as a new packaging/pricing variant, instead of a duplicate product row
            successCount += 1
        catch ValidationException as e:
            errors.append({rowNumber, productName, message: e.messages})
            failureCount += 1
    return ExcelImportResultDto(totalRows, successCount, failureCount, errors)
```

#### 9.2 Order status transition + parent rollup

```
function transition(sellerOrderId, sellerId, requiredCurrentStatus, newStatus, mutator):
    sellerOrder = SellerOrderRepository.findBySellerOrderId(sellerOrderId)
                  or throw ResourceNotFoundException
    if sellerOrder.seller.sellerId != sellerId: throw UnauthorizedException
    if sellerOrder.status != requiredCurrentStatus:
        throw BadRequestException("must be " + requiredCurrentStatus + " to move to " + newStatus
                                   + ", but is currently " + sellerOrder.status)

    fromStatus = sellerOrder.status
    mutator(sellerOrder)                       # e.g. set shippedAt / courier fields
    sellerOrder.status = newStatus
    for item in sellerOrder.orderItems:
        if item.itemStatus == fromStatus:      # items already diverged (e.g. individual return) are left alone
            item.itemStatus = newStatus
    sellerOrder.statusHistory.add(OrderStatusHistory(fromStatus, newStatus, changedByRole="SELLER", changedById=sellerId))
    save(sellerOrder)

    parentOrder = sellerOrder.order
    parentOrder.status = OrderStatusRollup.compute(parentOrder.sellerOrders.map(so -> so.status))
    save(parentOrder)
    return toDto(sellerOrder)

function OrderStatusRollup.compute(childStatuses):
    if childStatuses is empty: return PLACED                      # defensive, shouldn't occur post-placement
    if all childStatuses == CANCELLED: return CANCELLED
    active = childStatuses without CANCELLED
    if active is empty: return CANCELLED
    if all active in {DELIVERED, RETURN_REQUESTED, RETURN_APPROVED, RETURN_REJECTED, RETURNED, REFUNDED}:
        return DELIVERED
    if all active in {SHIPPED, OUT_FOR_DELIVERY} union post-delivery-set:
        return SHIPPED
    if any active in shipped-or-beyond: return PARTIALLY_SHIPPED
    return PLACED
```

#### 9.3 Seller approval state machine

```
function processReview(request):
    tempSeller = TempSellerRepository.findById(request.id) or throw NotFoundException

    switch request.status.toUpperCase():
        case "CORRECTION":
            tempSeller.status = CORRECTION_REQUIRED
            saveReviewHistory(tempSeller, CORRECTION_REQUIRED, request.comments)
            emailCorrectionLink(tempSeller)                       # best-effort

        case "REJECT":
            tempSeller.status = REJECTED
            saveReviewHistory(tempSeller, REJECTED, request.comments)
            emailRejection(tempSeller)                             # best-effort

        case "ACCEPT":
            if tempSeller.user == null:
                throw ApplicationException("no linked login account — re-register")

            sellerId = generateSellerId(tempSeller)                # advisory lock 12345
            seller = mapAndPersistSeller(tempSeller, tempSeller.user, sellerId)
                     # Phase 1: INSERT Seller + address + coordinator + bank + GST + documents
                     # (still pointing at OLD tempsellers/{REQ_ID}/... S3 URLs)
            saveReviewHistory(tempSeller, APPROVED, request.comments)
            tempSeller.status = APPROVED                            # committed BEFORE Phase 2 —
            save(tempSeller)                                        # a slow/failed Phase 2 can never
                                                                     # leave the seller half-approved
            try:
                migrateAllSellerImages(tempSeller.requestId, sellerId)   # Phase 2: copy S3 files,
                                                                          # delete old, update URLs
                sendApprovalAgreementEmail(tempSeller, seller)           # fetch T&C PDF, email it
            catch Exception e:
                log.error(...)                                          # swallowed — approval already final

        default:
            throw ApplicationException("Invalid Status")

    return SellerApprovalResultDTO(tempSellerId, userId, sellerId, tempSeller.status)
```

*Buyer approval (`BuyerApprovalServiceImpl.processReview`) is structurally identical, with advisory lock key 54321 instead of 12345 — per its own class javadoc, explicitly written to mirror `SellerApprovalServiceImpl`.*

#### 9.4 Stock FIFO debit & restock-or-create batch

```
function debitStock(request, userId):
    seller = SellerRepository.findByUserId(userId)
    total = PricingDetailsRepository.sumAvailable(request.productId, request.packagingId)  # non-locking
    if total < request.quantity: throw InsufficientStockException

    batches = PricingDetailsRepository.lockAvailableBatchesForDebit(          # PESSIMISTIC_WRITE
                  request.productId, request.packagingId)                     # ORDER BY manufacturingDate ASC
    remaining = request.quantity
    ledgerRows = []
    for batch in batches:
        if remaining <= 0: break
        take = min(remaining, batch.stockQuantity)
        batch.stockQuantity -= take
        save(batch)
        ledgerRows.append(StockLedger(batch, product, seller, userId, STOCK_OUT, take, batch.stockQuantity))
        remaining -= take
    save(ledgerRows)
    return ledgerRows

function resolveOrCreateBatch(product, packaging, candidate, sellerName, sellerId):
    if packaging == null and product has >1 packaging variant:
        throw BadRequestException("packagingId is required")

    existing = PricingDetailsRepository.findByKey(product.id, packaging?.id, candidate.batchLotNumber)
    if existing exists:
        if existing.expiryDate != candidate.expiryDate:
            throw BadRequestException("different expiry date")
        existing.stockQuantity += candidate.stockQuantity          # RESTOCK — no pricing fields touched
        return existing
    else:
        candidate.pricingId = generatePricingId(sellerName)         # <2-letter prefix>BTCH<5-digit seq>
        candidate.productDetails = product
        candidate.packagingDetails = packaging
        # mrp / sellingPrice / discountPercentage / gstPercentage stored exactly as given — no derivation
        return candidate                                            # CREATE
```

---

### 10. Unit Test Considerations

**Frontend (`pharma-aggregator-client`)** — **NOT IDENTIFIED.** Per this repo's own `CLAUDE.md` (confirmed, not merely repeated): no Jest/Vitest/Playwright/Cypress/React Testing Library is installed, there is no test config file of any kind, and no `*.test.*`/`*.spec.*` file exists anywhere in `src/`. `npm run lint` is the only quality gate; there is no `npm test` script.

**Backend (`pharma-aggregator-server`)** — **PARTIALLY IMPLEMENTED.** `pom.xml` declares three test-scope dependencies (`spring-boot-starter-data-jpa-test`, `spring-boot-starter-security-test`, `spring-boot-starter-webmvc-test`), but `src/test/` contains exactly **one** file:

```java
// src/test/java/com/example/pharmaaggregatorserver/PharmaAggregatorServerApplicationTests.java
@SpringBootTest
@ActiveProfiles("test")
class PharmaAggregatorServerApplicationTests {
    @Test
    void contextLoads() { }
}
```

This is a bare Spring context-load smoke test with zero assertions on any business logic. No JUnit/Mockito unit tests exist for any service, controller, or repository — confirmed by `find src/test -type f` returning a single file. CI (`.github/workflows/tests.yml`) runs `mvn -DskipTests clean install`, so even this one test is skipped during the actual build/deploy pipeline; the filename `tests.yml` is misleading — it is a build-and-deploy pipeline, not a test pipeline.

#### RECOMMENDATION — NOT CURRENTLY IMPLEMENTED

The following are suggestions only, clearly separated from the facts above:

- **Backend unit tests** (JUnit 5 + Mockito, dependencies already present) for the state-machine-heavy classes identified as business-critical in §5: `SellerApprovalServiceImpl.processReview`/`handleApproval` (assert the non-atomic commit-then-migrate ordering and the `tempSeller.getUser()==null` guard), `SellerOrderFulfillmentServiceImpl.transition` (assert every illegal-transition combination throws `BadRequestException`), each `*ImportStrategy.validateMandatoryExcel/Csv` (assert the collect-all-then-throw behavior and each numeric/format rule), `PricingDetailsServiceImpl.resolveOrCreateBatch` (assert the expiry-mismatch rejection and the restock-vs-create branch), `JwtUtils`/`AuthService.refreshAccessToken` (assert rotation actually revokes the old token).
- **Backend integration tests** (`spring-boot-starter-webmvc-test` + Testcontainers-Postgres, not currently configured) for `StockServiceImpl.debitStock`'s FIFO-under-concurrency behavior, since it is the one place `PESSIMISTIC_WRITE` locking is relied on for correctness.
- **Frontend**: introducing Vitest + React Testing Library (neither installed) for the Zod schemas under `src/schema/**` (pure functions, cheap to test in isolation) and for the client-side auth guards in `seller_7a3b9f2c/layout.tsx`/`buyer_e8d45a1b/dashboard/layout.tsx`.
- **Contract tests** between the two repos for the frontend service calls flagged as broken/mismatched in §7.3 (`ConsumbaleService.getConsumableStorageConditions`, `ProductService.getPackTypes`, `FoodInfantService` brochure endpoints) — these would have caught the 404s at build time rather than at runtime.

---

### 11. Dependencies Between Modules

```
M1 Master/Reference Data          <── M2, M3, M5, M6, M7  (geography/type dropdowns)
M3 Product Lookup/Attribute Masters <── M2  (dosage forms, device categories, therapeutic categories, storage conditions)
M2 Product Catalog Core            <── M4 (Stock & Pricing references ProductDetails/PackagingDetails)
                                    <── M9 (Order reads Product/Packaging at placement time)
                                    <── M10 (Quote Request references Product, auto-resolves Seller from it)
M4 Stock & Pricing                 <── M9 (Order debits/restocks stock on placement/cancel/return)
M5 Seller Signup & Temp Registration → produces the TempSeller consumed by M6
M6 Seller Approval & Profile       <── M8 (Admin triggers review), produces the Seller consumed by M2/M4/M9's ownership checks
M7 Buyer Signup & Temp Registration → produces the TempBuyer consumed by (buyer approval logic co-located in M7)
                                    <── M8 (Admin triggers review), produces the Buyer consumed by M9/M10
M8 Admin                           → delegates into M6, M7, M9 — no independent business logic of its own
M9 Order/Payment/Invoice/Return    <── M10 (an ACCEPTED QuoteRequest becomes an Order; OrderPlacementServiceImpl
                                          writes ORDER_PLACED + orderId back onto the QuoteRequest row)
                                    → depends on M4 (stock), M6 (Seller), M7 (Buyer), M11 (JWT for seller-order ownership)
M10 Quote Request                  → depends on M2 (Product), M7 (guest BuyerUser auto-provisioning)
M11 Security & Auth Infrastructure ← depended on by every other backend module (JWT validation, password hashing,
                                          exception mapping); itself depends on nothing else in-repo
M12 DB Config/Migrations           ← underpins all persistence for every module above
M13 Infrastructure & CI/CD         → packages/deploys the backend as a whole; no runtime dependency relationship

--- frontend ---
M14 Frontend Routing/Pages/Layouts → depends on M15 (API calls), M16 (form validation), M17 (auth state)
M15 Frontend API Client Layer      → depends on M18 (NEXT_PUBLIC_API_URL) and every backend module's REST surface
M16 Frontend Validation Schemas    → depends on nothing (pure Zod), consumed by M14's forms
M17 Frontend Auth/Session State    → depends on M15 (token issuance/refresh calls), consumed by M14's guards
M18 Frontend Build/Env/Deployment  → underpins M14-M17's runtime configuration
```

**Cross-cutting observation**: M8 (Admin) has no frontend consumer at all (§Module Overview, M8) — it is reachable only as a backend REST surface, either for manual/API-client use or an undocumented external admin tool never located in either repository.

---

### Implementation Traceability

| Design Element | Source File | Implementation |
|---|---|---|
| Strategy pattern for product import | `service/product/util/ProductImportStrategy.java`, `DrugImportStrategy.java`, `ConsumableImportStrategy.java`, etc. | IMPLEMENTED |
| Factory for strategy resolution | `service/product/util/ProductImportStrategyFactory.java` | IMPLEMENTED |
| Seller ID generation (advisory lock) | `service/serviceImpl/admin/SellerApprovalServiceImpl.java:672-693`, `repository/seller/SellerRepository.java` | IMPLEMENTED |
| Buyer ID generation (advisory lock) | `service/serviceImpl/admin/BuyerApprovalServiceImpl.java`, `repository/buyer/BuyerRepository.java` | IMPLEMENTED |
| Order/Payment ID generation (advisory lock) | `repository/order/OrderRepository.java`, `repository/order/PaymentRepository.java` | IMPLEMENTED |
| Two-phase commit-then-S3-migrate approval | `SellerApprovalServiceImpl.java:380-414`, `BuyerApprovalServiceImpl.java` | IMPLEMENTED |
| Seller-order fulfillment state machine | `service/order/orderImpl/SellerOrderFulfillmentServiceImpl.java:227-273` | IMPLEMENTED |
| Order status rollup (pure function) | `service/order/support/OrderStatusRollup.java:42` | IMPLEMENTED |
| FIFO stock debit with pessimistic locking | `service/product/productImpl/StockServiceImpl.java:218` | IMPLEMENTED |
| Batch restock-or-create dispatch | `service/product/productImpl/PricingDetailsServiceImpl.java:40-99` | IMPLEMENTED |
| JWT issuance (HS256, subject-only claims) | `security/JwtUtils.java:33-42` | IMPLEMENTED |
| Opaque rotating refresh token | `security/JwtUtils.java:65-79`, `service/seller/SellerLogIn/AuthService.java:250-285` | IMPLEMENTED |
| Dual seller/buyer identity resolution | `security/AuthTokenFilter.java`, `security/UserDetailsServiceImpl.java` | IMPLEMENTED |
| Framework-level endpoint authorization | `config/SecurityConfig.java` (`anyRequest().permitAll()` live; role-scoped rule commented out) | **NOT IDENTIFIED** as enforced — application-code checks only |
| Global exception→HTTP mapping | `exception/GlobalExceptionHandler.java`, `exception/GlobalLogInExceptionHandler.java` | PARTIALLY IMPLEMENTED (two overlapping advices) |
| Global success-response envelope | `response/GlobalResponseHandler.java` | PARTIALLY IMPLEMENTED (inconsistently applied) |
| Quote-request negotiation state machine | `service/quote/QuoteRequestService.java` | IMPLEMENTED (linear, single-shot — no counter-offer) |
| Draft/staging registration pattern (seller) | `entity/temp/seller/TempSeller.java` + children | IMPLEMENTED |
| Draft/staging registration pattern (buyer) | `entity/temp/buyer/TempBuyer.java` + children | IMPLEMENTED |
| Post-approval profile-edit auto-approval | `service/profile/SellerProfileService.java` (`requiresAdminApproval`, raw `EntityManager` updates) | IMPLEMENTED |
| Append-only stock ledger | `entity/product/StockLedger.java` | IMPLEMENTED |
| Soft-delete via `@SQLRestriction` | `entity/product/PricingDetails.java` | IMPLEMENTED |
| Seller-side client auth guard | `src/app/seller_7a3b9f2c/layout.tsx` | IMPLEMENTED (client-side only, post-mount) |
| Buyer-side client auth guard | `src/app/buyer_e8d45a1b/dashboard/layout.tsx` | IMPLEMENTED (client-side only, modal-based) |
| Backend middleware-level route protection | `src/proxy.ts` | **NOT IDENTIFIED** — wrong filename/export, never wired as Next.js middleware |
| Frontend axios refresh-queue (seller) | `src/lib/api.ts` | IMPLEMENTED |
| Frontend axios refresh-queue (buyer) | `src/lib/buyerApi.ts` | IMPLEMENTED (separate, parallel implementation) |
| Frontend axios client with no refresh handling | `src/utils/api.ts` (used by every `product/*` service) | IMPLEMENTED (a real gap, not a bug — no refresh logic exists here at all) |
| Backend unit/integration test suite | `src/test/java/.../PharmaAggregatorServerApplicationTests.java` | **PARTIALLY IMPLEMENTED** — one context-load smoke test only |
| Frontend test suite | *(none)* | **NOT IDENTIFIED** — no framework installed, no test files exist |
| Production URLs, RPO/RTO targets, compliance certifications | *(searched `application*.yml`, `docs/*.md`, `deploy/*.json`)* | Not identified in the current implementation |

---

*End of document. Every claim above cites a file this document's author opened directly; where the discovery pass's own notes flagged a claim as unverified or out of scope, that caveat is preserved rather than resolved by inference.*


---

# Part 3 — Data Model

## 06 — Data Model

### 1. Document Control

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

### 2. Entity List & Definitions

Grouped by module. "Table" is the JPA `@Table(name=...)` value where confirmed by direct entity inspection (this session or the grounding inventory); "—" means the exact `@Table` name was not independently re-verified by this pass and is carried from the discovery inventory's own file reads.

#### 2.1 Master / Reference Data

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

#### 2.2 Auth Infrastructure (Seller/Admin side)

| Entity | Table | Purpose | Module |
|---|---|---|---|
| User | `tbl_user` | Seller/admin login account | auth |
| LoginOtp | `tbl_login_otp` | Seller login OTP (2-step login) | auth |
| RefreshToken | `tbl_refresh_tokens` | Hashed refresh token for seller/admin | auth |

#### 2.3 Buyer Auth Infrastructure

| Entity | Table | Purpose | Module |
|---|---|---|---|
| BuyerUser | `tbl_buyer_user` | Buyer login account (independent of seller `tbl_user`) | buyer |
| BuyerSignupOtp | `tbl_buyer_signup_otp` | Signup-time email OTP | buyer |
| BuyerLoginOtp | `tbl_buyer_login_otp` | Login-time email OTP | buyer |
| BuyerRefreshToken | `tbl_buyer_refresh_tokens` | Hashed refresh token for buyer | buyer |

#### 2.4 Seller Onboarding (Temp/Staging)

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

#### 2.5 Seller (Approved)

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

#### 2.6 Buyer Onboarding (Temp/Staging) and Approved

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

#### 2.7 Product Catalog — Core

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

#### 2.8 Product Catalog — Category Attribute Tables

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

#### 2.9 Product Lookup / Attribute Masters (summarized — see §4.6)

DrugCategory, Molecule, MoleculeStrengthFormat, PackType, PackTypeUnitMaster, AgeGroupMaster, DosageForm, Flavour, NetQuantityUnit, ServingSizeUnit, StorageConditionMaster, StrengthUnit, TherapeuticCategoryMaster, TherapeuticSubcategoryMaster, ProductFormMaster, ProductCategoryMaster, ProductSubcategoryMaster, Certification, CertificateDocument, ConsumableMaterialType, CountryMaster, DeviceCategory, DeviceSpecificationUnit, DeviceSubCategory, DimensionSize, MedicalDeviceType, NonConsumableMaterialType, PowerSource, HairType, IntendedUseArea, ProductsFormMaster, SkinType — all `product` module.

#### 2.10 Order, Payment, Return, Quote

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

#### 2.11 Misc / Content / Security

| Entity | Table | Purpose | Module |
|---|---|---|---|
| IFSCOverride | `tbl_ifsc_overrides` | Manual bank IFSC override/cache | misc |
| LegalContent | `tbl_legal_content` (Flyway V3) | Versioned BUYER_TERMS/SELLER_TERMS HTML | misc |

---

### 3. ER Diagram

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

### 4. Table Schemas (core ~30 tables)

Column facts below are sourced from the entity `@Column`/`@Id`/`@GeneratedValue`/`@JoinColumn`/`@Enumerated` annotations as captured in the grounding inventory (each entity's source path is given). Where a precise `length`/`precision` was not independently re-confirmed in this pass, the column is still asserted to exist (verified) but its exact width is marked "not confirmed in this pass."

#### 4.1 `tbl_seller`
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

#### 4.2 `tbl_seller_address`, `tbl_seller_coordinator`, `tbl_seller_bank_details`, `tbl_seller_gst`
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

#### 4.3 `tbl_seller_document`
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

#### 4.4 `tbl_pending_seller`
Source: `entity/seller/profile/PendingSeller.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| pending_seller_id | bigint | No | identity | PK | | | |
| seller_id | varchar | Yes | — | | FK → `tbl_seller.seller_id` | | Null for CREATE requests |
| request_type | varchar | No | — | | | | CREATE / UPDATE (plain string) |
| status | varchar | No | — | | | | PENDING / AUTO_APPROVED / APPROVED / REJECTED / APPROVAL_FAILED |
| rejection_reason | varchar | Yes | — | | | | Also used to store exception message on APPROVAL_FAILED |

#### 4.5 `tbl_temp_seller`
Source: `entity/temp/seller/TempSeller.java`, `TempSellerStatus.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| id | bigint | No | identity | PK | | | |
| user_id | bigint | Yes (draft) / effectively required otherwise | — | | FK → `tbl_user.user_id`, unique 1:1 | Yes | |
| status | varchar | No | 'DRAFT' or 'OPEN' | | | | Plain varchar; constants in `TempSellerStatus.java`: DRAFT, OPEN, RESUBMITTED, APPROVED, REJECTED, CORRECTION_REQUIRED |
| seller_type_id | bigint | Yes | — | | FK → `tbl_seller_type_master` | | |
| is_gst_verified | boolean | No | false | | | | |
| is_company_registration_certificate_verified | boolean | No | false | | | | |

#### 4.6 `tbl_buyer`
Source: `entity/buyer/Buyer.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| buyer_id | varchar | No | — | PK | | Yes | Generated: 2-char org prefix + buyer-type abbreviation + 4-digit sequence, advisory lock 54321 |
| buyer_user_id | bigint | No | — | | FK → `tbl_buyer_user.buyer_user_id` | Yes | Required 1:1 |
| temp_buyer_id | bigint | Yes | — | | (audit only) | | |
| org_name | varchar | No | — | | | | |
| status | varchar | No | 'APPROVED' | | | | |
| terms_accepted | boolean | No | false | | | | |

#### 4.7 `tbl_temp_buyer`
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

#### 4.8 `tbl_temp_buyer_document`
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

#### 4.9 `tm_product_details`
Source: `entity/product/ProductDetails.java`, `enums/ProductStatus.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| product_id | varchar | No | — | PK | | Yes | Generated: 2-letter seller prefix + 3-letter product-name fragment + 5-digit global sequence |
| category_id | bigint | No | — | | FK → `tm_category.category_id` | | |
| seller_id | varchar | No | — | | FK → `tbl_seller.seller_id` | | |
| status | varchar | No | 'PUBLISHED' | | | | `@Enumerated` ProductStatus: DRAFT / PUBLISHED / UNPUBLISHED |
| product_name | varchar | No | — | | | | |
| manufacturer_name | varchar | Yes | — | | | | |

#### 4.10 `tm_pricing_details`
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

#### 4.11 `tbl_stock_ledger`
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

#### 4.12 `tm_packaging_details`
Source: `entity/product/PackagingDetails.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| id | bigint | No | identity | PK | | | |
| product_id | varchar | No | — | | FK → `tm_product_details.product_id` | | |
| pack_type_id | bigint | Yes | — | | FK → `tm_pack_type.pack_type_id` | | |
| pack_type_unit_id | bigint | Yes | — | | FK → `tm_pack_type_unit_master.id` | | |
| units_per_pack | int | Yes | — | | | | |
| min_order_qty / max_order_qty | int | Yes | — | | | | |

#### 4.13 `tm_product_attribute_drug`
Source: `entity/product/ProductAttributeDrug.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| id | bigint | No | identity | PK | | | |
| product_id | varchar | No | — | | FK → `tm_product_details.product_id` (1:1) | | |
| therapeutic_category_id / therapeutic_subcategory_id | varchar | Yes | — | | **plain string, not a real FK** | | Unlike Supplements' equivalent columns |
| dosage_form | varchar | Yes | — | | plain string | | |
| No `certifications` field | — | — | — | | — | | Only Drug attribute entity lacking one |

#### 4.14 `tm_product_attribute_consumable_medical`
Source: `entity/product/ProductAttributeConsumableMedical.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| id | bigint | No | identity | PK | | | |
| product_id | varchar | No | — | | FK → `tm_product_details.product_id` (1:1) | | |
| device_cat_id / device_sub_cat_id | bigint | No | — | | FK → `tbl_device_category_master` / `tbl_device_sub_category_master` | | |
| country_id | bigint | No | — | | FK → `tbl_country_master` | | |
| storage_condition_id | bigint | No | — | | FK → `tbl_storage_condition_master` | | |
| brochure_path | varchar | Yes | — | | | | |

#### 4.15 `tm_product_certificate_document`
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

#### 4.16 `pm_product_molecule`
Source: `entity/product/ProductMolecule.java`, `ProductMoleculeId.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| product_attribute_id | varchar | No | — | PK (composite) | FK → `tm_product_attribute_drug` | | |
| molecule_id | bigint | No | — | PK (composite) | FK → `tm_molecules_master` | | |
| strength | varchar | Yes | — | | | | Cross-validated 1:1 against molecule count at import time |

#### 4.17 `tbl_order`
Source: `entity/order/Order.java`, `OrderStatus.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| order_id | varchar | No | — | PK | | Yes | `ORD-yyyyMMdd-#####`, advisory lock 98765 |
| buyer_id | varchar | No | — | | FK → `tbl_buyer.buyer_id` | | |
| status | varchar | No | — | | | | Rollup: PLACED/PARTIALLY_SHIPPED/SHIPPED/DELIVERED/CANCELLED, derived, not set directly |
| idempotency_key | varchar | Yes | — | | | Yes | Replay-safe order placement |
| subtotal / shipping_total / tax_total / grand_total | numeric | No | — | | | | |
| quote_request_id | bigint | Yes | — | | (plain id, not FK) | | |

#### 4.18 `tbl_seller_order`
Source: `entity/order/SellerOrder.java`, `SellerOrderStatus.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| seller_order_id | varchar | No | — | PK | | Yes | `SORD-{orderSuffix}-{seq}`, in-memory counter, no advisory lock |
| order_id | varchar | No | — | | FK → `tbl_order.order_id` | | |
| seller_id | varchar | No | — | | FK → `tbl_seller.seller_id` | | |
| status | varchar | No | 'PLACED' | | | | PLACED/CONFIRMED/PACKED/SHIPPED/OUT_FOR_DELIVERY/DELIVERED/CANCELLED/RETURN_REQUESTED/RETURN_APPROVED/RETURN_REJECTED/RETURNED/REFUNDED (REFUNDED never actually set) |
| courier_name / tracking_number / tracking_url | varchar | Yes | — | | | | Set on `ship` |
| confirmed_at / shipped_at / delivered_at / cancelled_at | timestamp | Yes | — | | | | |

#### 4.19 `tbl_order_item`
Source: `entity/order/OrderItem.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| order_item_id | bigint | No | identity | PK | | | |
| seller_order_id | varchar | No | — | | FK → `tbl_seller_order.seller_order_id` | | |
| product_id | varchar | No | — | | FK → `tm_product_details.product_id` | | |
| pricing_id | varchar | No | — | | FK → `tm_pricing_details.pricing_id` | | |
| product_name_snapshot / batch_lot_number_snapshot / packaging_id_snapshot / unit_price_snapshot | varchar/numeric | No | — | | | | Point-in-time snapshot, immune to later catalog edits |
| item_status | varchar | No | — | | | | Mirrors parent SellerOrder status (except diverging returns) |

#### 4.20 `tbl_payment`
Source: `entity/order/Payment.java`, `PaymentStatus.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| payment_id | varchar | No | — | PK | | Yes | `PAY-yyyyMMdd-#####`, advisory lock 98766 |
| order_id | varchar | No | — | | FK → `tbl_order.order_id` | Yes | 1:1 |
| provider | varchar | No | 'COD' | | | | No gateway integration found |
| status | varchar | No | 'SUCCESS' | | | | Only SUCCESS ever set; REFUNDED/PARTIALLY_REFUNDED/PENDING_COD/INITIATED/FAILED declared, dead |
| paid_at | timestamp | No | now() at placement | | | | |

#### 4.21 `tbl_refund`
Source: `entity/order/Refund.java`, `RefundStatus.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| refund_id | bigint | No | identity | PK | | | |
| payment_id | varchar | No | — | | FK → `tbl_payment.payment_id` | | |
| order_item_id | bigint | Yes | — | | FK → `tbl_order_item.order_item_id`, nullable | | Null = whole-seller-order refund; non-null = per-item |
| amount | numeric | No | — | | | | |
| status | varchar | No | 'REQUESTED' | | | | Only REQUESTED→COMPLETED transition ever coded; PROCESSING/FAILED dead |

#### 4.22 `tbl_return_request`
Source: `entity/order/ReturnRequest.java`, `ReturnStatus.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| return_id | bigint | No | identity | PK | | | |
| order_item_id | bigint | No | — | | FK → `tbl_order_item.order_item_id` | | |
| status | varchar | No | 'REQUESTED' | | | | REQUESTED/APPROVED/REJECTED actually set; PICKED_UP/CLOSED dead |
| resolved_at / resolved_by_role | timestamp/varchar | Yes | — | | | | |

#### 4.23 `tbl_invoice`
Source: `entity/order/Invoice.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| invoice_id | bigint | No | identity | PK | | | |
| seller_order_id | varchar | No | — | | FK → `tbl_seller_order.seller_order_id` | Yes | 1:1 |
| invoice_number | varchar | No | — | | | Yes | `INV-{sellerId}-{FYstartYY}{FYendYY}-{00001..}`, per-seller-per-FY, COUNT(*)-based (no lock — accepted theoretical race) |
| invoice_file_url | varchar | No | — | | | | S3 PDF |
| generated_at | timestamp | No | now() | | | | |

#### 4.24 `tbl_quote_request`
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

#### 4.25 `tbl_refresh_tokens` / `tbl_buyer_refresh_tokens`
Source: `entity/auth/RefreshToken.java`, `entity/buyer/BuyerRefreshToken.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| id | bigint | No | identity | PK | | | |
| user_id / buyer_user_id | bigint | No | — | | FK | | |
| token_hash | varchar | No | — | | | Yes | SHA-256 of raw token; raw never stored |
| expires_at | timestamp | No | — | | | | 7 days |
| revoked_at | timestamp | Yes | null | | | | null = still valid |

#### 4.26 `tbl_login_otp` / `tbl_buyer_login_otp`
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

#### 4.27 `tbl_ifsc_overrides`
Source: `entity/ifsc/IFSCOverride.java`

| Column | Data Type | Nullable | Default | PK | FK | Unique | Description |
|---|---|---|---|---|---|---|---|
| ifsc_code | varchar(11) | No | — | PK | | | |
| bank / branch / state / district / city / address | varchar | Yes | — | | | | |
| is_active | boolean | No | true | | | | |

---

### 5. Relationships & Cardinality

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

### 6. Normalization

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

### 7. Indexing Strategy

**What was actually found in the entity source:**
- Explicit `@Column(unique = true)` constraints were found on numerous columns (translating to a unique index at the DB level): `StateMaster.stateCode`, `DistrictMaster.districtCode`, `TalukaMaster.talukaCode`, `SellerTypeMaster.sellerTypeName`/`sellerTypeAbbreviation`, `BuyerTypeMaster.buyerTypeName`/`buyerTypeAbbreviation`, `CompanyTypeMaster.companyTypeName`, `ProductTypeMaster.productTypeName`, `DocumentTypeMaster.documentTypeName`/`documentTypeCode`, `RoleMaster.roleName`, `GstPercentageMaster.value`, `Order.idempotencyKey`, `Payment.orderId` (1:1), `Invoice.sellerOrderId` (1:1) / `Invoice.invoiceNumber`, `Buyer.buyerUserId` (1:1), `RefreshToken.tokenHash` / `BuyerRefreshToken.tokenHash`, `TempBuyer.tempBuyerRequestId`, `TempSellerCoordinator`/`TempBuyerContact` email+mobile.
- Flyway migration `V1__buyer_type_and_document_type_seed.sql` creates `tbl_document_type_master`/`tbl_buyer_type_master` with their PK and the seed's own `UNIQUE` constraints where stated in that script (per the discovery inventory's read of that file).
- **No explicit `@Index` / `@Table(indexes = ...)` annotation was found on any entity** in the discovery inventory's file-by-file reads (none of the entity summaries report one), and this session did not find a DDL/index-creation script beyond what Flyway's three migrations state. This is reported as **NOT IDENTIFIED** rather than assumed absent from a live database that might have manually-added indexes outside the JPA/Flyway-managed schema.
- Composite PK `ProductMoleculeId` (`productAttributeId`, `moleculeId`) on `pm_product_molecule` functions as a composite unique index by construction.

#### Recommendations — NOT Currently Implemented
- **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: add explicit secondary indexes on high-cardinality foreign keys that are queried directly and are not already covered by a unique constraint or PK, in particular: `tm_pricing_details.product_id` (FIFO batch listing, `PricingDetailsRepository` queries), `tbl_stock_ledger.pricing_id`/`product_id`/`seller_id` (sum-by-type and reference lookups), `tbl_order.buyer_id` (order history listing), `tbl_seller_order.seller_id` + `status` (seller order dashboards, filtered lists), `tbl_order_item.seller_order_id`, `tbl_quote_request.seller_id` and `.buyer_user_id` (both have `findBy...OrderByCreatedAtDesc` derived queries with no confirmed index), `tbl_temp_seller.user_id` / `tbl_temp_buyer.user_id` (1:1 lookups), and `tm_product_details.seller_id` + `category_id` (product list filters).
- **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: a composite index on `(seller_id, status)` for `tbl_seller_order` and on `(status)` for `tbl_temp_seller`/`tbl_temp_buyer` to support the admin review-queue listing endpoints (`GET /temp-sellers`, `GET /temp-buyers`, `GET /admin/seller-requests/pending`), all of which currently appear to be unfiltered/full-table scans in the service code inspected.
- **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: a partial index on `tm_pricing_details (product_id) WHERE deleted_at IS NULL` to accelerate the frequently-run "available batches" / FIFO queries that already filter on the `@SQLRestriction`.

---

### 8. Data Retention / Archival

**Not identified in the current implementation.** No scheduled job, TTL/expiry column enforcement (beyond the two soft-delete patterns below), retention-policy configuration, or archival table/process was found anywhere in the discovery inventory or this session's own review of `application*.yml`, the Flyway migrations, or the service-layer code. Specifically:
- No cron/scheduled task (`@Scheduled`) was reported anywhere in the codebase inventory.
- No "archive" table, cold-storage table, or partitioning strategy was found.
- `PricingDetails` and `Seller`-family entities use **soft delete** (`deletedAt`/`deletedBy` + `@SQLRestriction`) but nothing purges or archives soft-deleted rows — they remain in the primary table indefinitely.
- `SellerHistory` is an insert-only audit table with no observed pruning logic — it will grow unbounded.
- `IndependentEmailServiceImpl`'s email-status tracking is explicitly **in-memory** (`ConcurrentHashMap`, comment: "replace with database in production") — not a retention concern for the DB schema, but confirms no persistence/retention layer exists there at all.

---

### 9. Sample / Seed Data

Source files actually opened (grounding inventory): `D:/Tiameds_MarketPlace/Backend/pharma-aggregator-server/src/main/resources/db/migration/V1__buyer_type_and_document_type_seed.sql`, `db/seed/strength_unit_seed.sql`, `db/seed/legal_content_seed.sql`, and the `docs/seed_*.sql` files.

#### 9.1 Flyway-managed seed (`src/main/resources/db/migration/V1__buyer_type_and_document_type_seed.sql`)
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

#### 9.2 Manual (non-Flyway) seeds in `src/main/resources/db/seed/`
- `strength_unit_seed.sql` — seeds `tm_strength_unit`; its own header states there is no Flyway/Liquibase management for this data and it must be run by hand.
- `legal_content_seed.sql` — re-runnable `ON CONFLICT DO UPDATE ... WHERE ... IS DISTINCT FROM` upsert for `tbl_legal_content` (BUYER_TERMS / SELLER_TERMS HTML), version-bumping on change; layered on top of Flyway V3's own initial insert of the same table.

#### 9.3 Manual scripts under `docs/` (NOT Flyway-managed — see §10)
- `docs/seed_buyer_types_and_document_types.sql` — essentially the same data as V1 above, kept as a manually-runnable copy for environments where Flyway hasn't/won't run it.
- `docs/seed_seller_types_and_document_types.sql` — adds 3 seller types: **White Labeling Company/Marketer (WLM)**, **Distributor (DIS)**, **PCD (PCD)** (comment notes "Manufacturer already exists" though no seed for a Manufacturer row was found anywhere); ~19 document types (drug/FSSAI/cosmetic/medical-device licences, GMP certificate, 4 seller-type-specific agreements, trademark/IEC/import licences); and **one reserved placeholder `tbl_product_type_master` row**: `product_type_name = 'N/A - Seller Level Document'`, `is_active = FALSE` — used as the FK target for seller-level (non-product) document uploads so the NOT NULL constraint on `SellerDocument.product_type_id` can still be satisfied.
- `docs/seed_gst_percentages.sql` — seeds `tm_gst_percentage_master` with GST slabs (0/5/8/10/12 per the discovery inventory's read of this file).

No secrets, credentials, or PII appear in any of the seed rows described above — all are lookup/reference values.

---

### 10. Migration Strategy

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

### Implementation Traceability

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

### Open Questions / Items Not Fully Resolved

See the `openQuestions` field of this task's structured output for the list of entities/columns this pass could not fully verify against a live schema (only against JPA annotations and the grounding inventory's prior file reads), plus the items flagged inline above as NOT IDENTIFIED.

---

# Part 4 — API Specification

## API Specification — Pharma Aggregator Platform

### 1. Document Control

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

### 2. API Overview

- **Base path**: `/api/v1` — IMPLEMENTED. Confirmed via `server.servlet.context-path: /api/v1` in `application.yml`, `application-dev.yml`, `application-test.yml`, and `application-prod.yml` (all four files set this identically). This matches the frontend's `NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1` convention documented in this repo's own `CLAUDE.md`.
- **Production Base URL**: **Not identified in the repository.** `application-prod.yml` configures a datasource pointing at a docker-compose-local `postgres-prod` host, not a public production domain, and no `.env.production` or deployed public hostname was found in either repo. The ECS task definition (`D:/Tiameds_MarketPlace/Backend/pharma-aggregator-server/deploy/tiamed-aggregator-task-defination.json`) is for the **test** environment (`pharma-aggregator-test` image/service), not production.
- **Protocol**: HTTP/HTTPS (TLS termination not evidenced in application config — likely handled by a load balancer/ALB outside the repo; **not identified**).
- **Content type**: `application/json` for standard requests; `multipart/form-data` for file-upload endpoints.
- **API documentation tooling**: springdoc-openapi (`springdoc-openapi-starter-webmvc-ui` 2.3.0) — Swagger UI at `/api/v1/swagger-ui`, OpenAPI JSON at `/api/v1/api-docs`. Enabled with "try it out" in dev/test; **explicitly disabled in prod** (`springdoc.swagger-ui.enabled: false` in `application-prod.yml`). Source: `D:/.../config/SwaggerConfig.java`.
- **Database**: PostgreSQL (all profiles); Flyway migrations at `src/main/resources/db/migration` (`V1`–`V3`) plus a large body of manually-run ad hoc SQL under `docs/` (not Flyway-managed — see §9 of the backend's own docs discovery, not repeated here as it is out of scope for an API spec).
- **File storage**: AWS S3 (SDK v2), confirmed via `D:/.../config/S3Config.java` and `D:/.../service/S3Service.java`.

---

### 3. Authentication & Authorization

#### 3.1 Mechanism — IMPLEMENTED (application-code level only)

- **Access token**: JWT, HS256, signed via `Keys.hmacShaKeyFor(app.jwt.secret)`. Claims are **subject (username/email) + iat + exp only** — no roles, no userId embedded. Source: `D:/.../security/JwtUtils.java`.
- **Sent as**: `Authorization: Bearer <accessToken>` header, attached by frontend axios interceptors (`src/lib/api.ts`, `src/lib/buyerApi.ts`, `src/utils/api.ts`).
- **Refresh token**: NOT a JWT — a 64-byte `SecureRandom` value, base64url-encoded. Only its **SHA-256 hash** is persisted (`tbl_refresh_tokens` / `tbl_buyer_refresh_tokens`); the raw value is returned to the client exactly once. Refresh is **single-use rotation**: on `/authentication/refresh`, the old row is revoked (`revokedAt` set) and a brand-new access+refresh pair is issued.
- **Access token expiry**: `app.jwt.expiration` = 86,400,000 ms (24h) in dev/test — **PARTIALLY IMPLEMENTED / known misconfiguration**: an inline YAML comment admits this is meant to be 30 minutes in production ("Temporarily set to 24 hours for testing, change back to 30 minutes in production"). `application-prod.yml` defines **no** `app.jwt.*` keys at all — a prod deployment relying only on the checked-in files would fail to resolve `${app.jwt.secret}` unless supplied externally (env vars/secrets manager). Source: `application-dev.yml`, `application-prod.yml` (24 lines, read in full).
- **Refresh token expiry**: `app.jwt.refresh-expiration` = 604,800,000 ms (7 days), dev/test only, same prod gap as above.
- **Password hashing**: BCrypt (`BCryptPasswordEncoder` bean in `SecurityConfig.java`), genuinely consumed across seller/buyer auth services (grep-confirmed).

#### 3.2 Critical fact: URL-level authorization is OFF for the entire application — IMPLEMENTED AS PERMIT-ALL (this is a fact about the code, not a recommendation)

`D:/.../config/SecurityConfig.java` line 52 sets:
```java
auth.anyRequest().permitAll()
```
The intended, stricter rule set (require authentication except for swagger/auth/public paths) exists only as a **commented-out block** directly below it. This means:
- Spring Security itself blocks **nothing** at the HTTP layer, for **any** controller in the application (master data, product, order, admin, seller, buyer — all of it).
- The `AuthTokenFilter` still runs and populates `SecurityContextHolder` when a valid Bearer token is present, so **application-code-level checks** (e.g., `resolveAuthenticatedUser()` reading `SecurityContextHolder`, or a controller comparing a path variable to the JWT-derived id) are the *only* real protection that exists anywhere in this backend today.
- `@EnableMethodSecurity` is turned on, but **no `@PreAuthorize`/`@Secured` annotation was found anywhere** in the codebase during discovery — so despite the annotation processor being enabled, it is not actually used to gate anything.

**Practical consequence documented per-endpoint in §4**: "Auth" column values of "None enforced" mean literally callable by anyone with network access; "App-level" means a Java check inside the controller/service reads the JWT principal (if present) and throws 401/403 in code — this is not equivalent to a Spring Security path rule and can be bypassed by any endpoint that forgets to perform the check.

#### 3.3 Public vs protected — summary

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

### 4. Endpoint List

All paths below are relative to base path `/api/v1`. "Role" reflects the *intended* actor, not an enforced Spring Security role (see §3.2).

#### 4.1 Master / Reference Data (`controller/master/**`, `controller/product/*Master*`, `MastersController`)

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

#### 4.2 Product Catalog (`controller/product/**`)

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

#### 4.3 Seller Registration / Temp-Seller (`controller/temp/seller/**`)

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

#### 4.4 Seller Auth / Password / Profile

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

#### 4.5 Admin (Seller/Buyer/Order Review) — `controller/admin/**`, `controller/seller/profile/**`

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

#### 4.6 Order, Payment, Invoice, Return (`controller/order/**`)

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

#### 4.7 Quote Requests (RFQ / Price Request) — `controller/quote/**`

| Method | Path | Controller | Purpose | Auth | Role | Module |
|---|---|---|---|---|---|---|
| POST | /buyer/quote-requests | BuyerQuoteRequestController | Submit PRICE_REQUEST/RFQ (guest allowed) | Optional JWT (guest if absent/not ROLE_BUYER) | Buyer/Guest | Quote |
| GET | /buyer/quote-requests | BuyerQuoteRequestController | List buyer's requests | App-level: ROLE_BUYER required | Buyer | Quote |
| PATCH | /buyer/quote-requests/{id}/accept | BuyerQuoteRequestController | Accept a QUOTED request | App-level: ROLE_BUYER + ownership | Buyer | Quote |
| PATCH | /buyer/quote-requests/{id}/reject | BuyerQuoteRequestController | Reject a QUOTED request | App-level: ROLE_BUYER + ownership | Buyer | Quote |
| GET | /seller/quote-requests | SellerQuoteRequestController | List requests for seller's products | App-level: ROLE_SELLER + Seller profile resolved | Seller | Quote |
| PATCH | /seller/quote-requests/{id}/respond | SellerQuoteRequestController | One-shot price response (PENDING→QUOTED) | App-level: ROLE_SELLER + ownership | Seller | Quote |

#### 4.8 Buyer Auth / Signup / Profile

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

#### 4.9 Buyer Registration / Temp-Buyer (`controller/temp/buyer/**`)

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

### 5. Request Schema (Key Endpoints)

#### 5.1 `POST /auth/signup` — Seller Signup

- **Headers**: `Content-Type: application/json`
- **Body** (`SignupRequest`):
```json
{ "email": "seller@example.com", "password": "P@ssw0rd1" }
```
- **Validation**: password strength enforced client-side and mirrored server-side per `TempBuyer`-analogous rules found elsewhere (min 8 chars, uppercase, lowercase, digit, special char) — for the seller `SignupRequest` DTO body itself, exact field-level `@Size`/`@Pattern` annotations were **not independently opened in this pass**; behavior confirmed via `SignupService.sendSignupOtp()` (checks `existsByUsername`, generates OTP, emails it).

#### 5.2 `POST /authentication/login` — Seller Login (Step 1)

- **Body**:
```json
{ "username": "seller@example.com", "password": "P@ssw0rd1" }
```
- **Behavior**: `AuthenticationManager.authenticate()` BCrypt check; locks account after 5 failed attempts (`MAX_LOGIN_FAILED_ATTEMPTS`); on success emails a 6-digit OTP (5 min expiry).

#### 5.3 `POST /authentication/verify-otp` — Seller Login (Step 2)

- **Body**:
```json
{ "username": "seller@example.com", "otp": "482913" }
```
- **Behavior**: OTP locks after 3 wrong attempts (`MAX_OTP_FAILED_ATTEMPTS`); on success issues `accessToken` (JWT) + `refreshToken` (opaque).

#### 5.4 `POST /temp-sellers` — Seller Registration (Full Submit)

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

#### 5.5 `POST /temp-seller/email-otp/send` and `/verify`

- Body: `{ "email": "coordinator@acme.com" }` → emails 6-digit code (5 min expiry, self-hosted, no attempt lock).
- Verify body: `{ "email": "coordinator@acme.com", "otp": "104822" }`.

#### 5.6 `POST /products/create` — Product Creation (Drug example)

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

#### 5.7 `POST /products/import` — Bulk Import

- **Headers**: `Authorization: Bearer <accessToken>`, `Content-Type: multipart/form-data`
- **Form fields**: `file` (`.xlsx`/`.xls`/`.csv`), `categoryId` (query or form param).
- **Behavior**: dispatches to the matching `ProductImportStrategy` bean by `Category.categoryName`; rows start at index 2; validation collects **all** violations before throwing (`ValidationException`), not fail-fast; successful rows call `createProduct(dto, userId, true)` — `true` enables merge-into-existing-product-as-new-variant when seller+productName+manufacturerName+categoryId match.

#### 5.8 `POST /stock/add` — Add/Restock a Batch

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

#### 5.9 `POST /orders` — Place Order (COD)

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

#### 5.10 `PATCH /seller-orders/{sellerOrderId}/deliver` — OTP-Gated Delivery Confirmation

- **Headers**: `Authorization: Bearer <accessToken>` (seller, ownership enforced)
- **Body** (`DeliverSellerOrderRequestDTO`): `{ "otp": "738291" }` — note the DTO also declares a `@NotBlank sellerId` field that the controller **never actually reads** (dead required field — confirmed in source).
- **Behavior**: requires current status `OUT_FOR_DELIVERY`; OTP verified via Twilio before any state mutation; on success transitions to `DELIVERED` and best-effort generates an `Invoice`.

#### 5.11 `PATCH /seller/quote-requests/{quoteRequestId}/respond` — Seller Quote Response

- **Body** (`SellerQuoteResponseDTO`): `quotedPrice` (required, positive `BigDecimal`), `quoteValidUntil` (optional date), `sellerNotes` (optional).
- **Validation**: only legal while status is `PENDING`, else `400` "This request has already been responded to."

---

### 6. Response Schema (Success + Error, Key Endpoints)

#### 6.1 General envelope inconsistency — IMPLEMENTED (documented fact, not a design choice worth relying on)

Two response shapes coexist in the backend:
1. **Raw body**: e.g. `ProductDetailsController.getAll` returns `List<ProductDetailsDto>` directly, no wrapper.
2. **`ApiResponse<T>` envelope**: `{ "status": "SUCCESS", "message": "Request processed successfully", "data": <T>, "count": <int> }` — applied globally to any *not-already-wrapped* 2xx response by `GlobalResponseHandler` (a `ResponseBodyAdvice`), except when the body is already an `ApiResponse` or the underlying status is ≥400.

`count` in list responses is simply `data.size()` — **it is not a page total**, because there is no pagination anywhere in the backend (see §9).

#### 6.2 `POST /authentication/verify-otp` — Success (200)

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

#### 6.3 `POST /temp-sellers` — Success (200/201)

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

#### 6.4 `POST /products/create` — Success

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

#### 6.5 `POST /stock/add` — Success

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

#### 6.6 `POST /orders` — Success (Partial Fulfillment Example)

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

#### 6.7 Error Response Shapes — IMPLEMENTED (three competing shapes — see §7)

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

### 7. Status Codes & Error Dictionary

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

#### 7.1 Duplicate/competing exception handling — IMPLEMENTED (a real defect, documented as fact)

Three separate `@RestControllerAdvice`/`ResponseBodyAdvice` classes exist and overlap:
1. `D:/.../exception/GlobalExceptionHandler.java` — `BaseException`, `MethodArgumentNotValidException`, `ResourceNotFoundException`, `BadRequestException`, `UnauthorizedException`, `ResponseStatusException`, generic `Exception`.
2. `D:/.../exception/GlobalLogInExceptionHandler.java` — a **second**, differently-shaped handler for `MethodArgumentNotValidException` (again), `InvalidCredentialsException`, `AccountLockedException`, `AccountInactiveException`, and its own generic `Exception` (again).
3. `D:/.../response/GlobalResponseHandler.java` — wraps all successful (non-error, non-already-wrapped) bodies in `ApiResponse`.

Having two handlers for `MethodArgumentNotValidException` and two for generic `Exception` means the exact response shape for a given validation error or crash depends on Spring's advice-ordering, which is **not deterministic from reading either file alone** — flagged as-is, not resolved.

#### 7.2 Custom application exceptions

| Class | Base | Default status |
|---|---|---|
| `BaseException` | `RuntimeException` | carries its own `HttpStatus` |
| `ApplicationException` | `BaseException` | 400 (or explicit) |
| `NotFoundException` | `BaseException` | 404 (fixed) |
| `InvalidCredentialsException`, `AccountLockedException`, `AccountInactiveException` | plain exceptions, handled only in `GlobalLogInExceptionHandler` | 401 / 403 / 403 |

No numeric "custom error code" scheme (e.g. `ERR_1042`) was found anywhere — errors are HTTP status + free-text `message` only. **NOT IDENTIFIED.**

---

### 8. Rate Limiting / Throttling

**No application-level rate limiting was identified.** Searched: `SecurityConfig.java`, all controller classes, `pom.xml` (no Bucket4j/resilience4j/rate-limiter dependency), and application YAML files. The only "limiting" behavior present is domain-specific lockout logic (5 failed login attempts locks an account; 3 failed OTP attempts locks that OTP) — this is account-security lockout, not a request-rate limiter, and it applies per-credential, not per-IP or per-client.

---

### 9. Pagination / Filtering / Sorting

**No pagination exists anywhere in this backend.** Verified by grepping the entire controller tree for `Pageable`, `PageRequest`, `Sort.by`, `page`, `size`, `limit`, `offset` — the only hit was one dead, commented-out `Sort.by` line in `SellerApprovalServiceImpl.java`. Every list endpoint (`/products/getAll`, `/products/all`, `/sellers`, `/temp-sellers`, `/temp-buyers`, `/buyer/quote-requests`, `/admin/orders`, etc.) returns the **entire** result set in one response.

- **The only real query-parameter filter found**: an optional `status` string on two order-list endpoints — `GET /admin/orders?status=SHIPPED` and `GET /seller-orders/seller/{sellerId}?status=SHIPPED` (exact match via `findByStatus`).
- **Cascading master-data filters use path variables, not query params**: `GET /districts/state/{stateId}`, `GET /talukas/district/{districtId}`, `GET /dosage/packType/{dosageId}`, etc.
- **Frontend behavior**: `src/app/seller_7a3b9f2c/dashboard/components/ProductList.tsx` fetches the *entire* unpaginated product list via `GET /products/getAll`, then performs search (`Array.filter`), sort (`sortData()` helper), and pagination (hardcoded `PAGE_SIZE = 10`, `Array.slice()`) **entirely client-side in the browser** — none of `searchTerm`/`categoryFilter`/`stockFilter`/`statusFilter`/`sortOption`/`currentPage` is ever sent to the backend as a request parameter.
- **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: introduce `page`/`size`/`sort` query parameters backed by Spring Data `Pageable` on high-volume list endpoints (`/products/getAll`, `/products/all`, `/sellers`, `/temp-sellers`) before production data volume makes full-list responses impractical.

---

### 10. Sample Requests / Responses

#### 10.1 Seller Login (full round trip)

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

#### 10.2 Batch Number Already Exists — Error Sample

```http
POST /api/v1/stock/add HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{ "productId": "ACPA00042", "batchLotNumber": "BATCH2024A", "expiryDate": "2027-06-01", "stockQuantity": 100, "mrp": 50, "sellingPrice": 42 }
```
```json
{ "status": 400, "message": "Batch lot number 'BATCH2024A' already exists for this product/variant with a different expiry date" }
```

#### 10.3 Quote Request Creation (Guest)

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

### 11. Changelog / Versioning

- **Versioning scheme**: single, unversioned `/api/v1` base path (set via `server.servlet.context-path`), consistent across all four Spring profiles (`application.yml`, `-dev`, `-test`, `-prod`). There is no `/v2`, no header-based versioning, and no per-endpoint deprecation marker anywhere in the codebase.
- **Changelog**: **Not identified in the repository.** No `CHANGELOG.md` was found for the backend; the only chronological evidence of API evolution is the three Flyway migrations (`V1`–`V3` under `src/main/resources/db/migration`) and git commit history, neither of which constitutes a documented API changelog.
- **Dead/superseded code worth flagging for anyone versioning against this API**:
  - `controller/product/ExcelProductImportController.java` — entirely commented out, not a live route.
  - A commented-out `handleApprovalForTempSeller()` block in `SellerApprovalServiceImpl.java` that once minted temporary login credentials at approval time — dead, not reachable.
  - `PricingDetails.finalPrice` — a persisted column with no live computation path anywhere (only two dead, commented-out Excel-import setters reference it).

---

### Implementation Traceability

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

### Open Questions

- The exact `SignupRequest`/`TempSellerRequestDTO` field-level `@NotNull`/`@Size`/`@Pattern` annotations were not all individually re-opened in this pass for every field listed in §5 — validation behavior is grounded in the corresponding service-layer logic and prior verified discovery, not a fresh line-by-line DTO read for every field.
- No numeric/custom error-code dictionary (e.g., `ERR_1042`) exists — confirm with the backend team whether one is planned, since none was found in `exception/` or `response/`.
- Production base URL, RPO/RTO, and any compliance certifications (HIPAA/SOC2/etc.) are not evidenced anywhere in either repository and must be sourced from infrastructure/ops documentation outside this codebase.

---

# Part 5 — Security & Deployment

## Security & Deployment

Pharma Aggregator Marketplace — `pharma-aggregator-server` (Spring Boot backend) + `pharma-aggregator-client` (Next.js frontend)

---

### 1. Document Control

| Field | Value |
|---|---|
| Document | Security & Deployment Assessment |
| Scope | `pharma-aggregator-server` (Spring Boot, Java) and `pharma-aggregator-client` (Next.js 16) |
| Method | Direct source inspection — every claim below is tied to a file path actually opened during this and prior discovery passes. No claim is made from framework convention or assumption. |
| Status labels used | **IMPLEMENTED** (verified in source) · **PARTIALLY IMPLEMENTED** (exists but incomplete) · **NOT IDENTIFIED** (searched, not found — search scope stated) · **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED** (a suggestion, never fact) |
| Author | Generated from repository discovery data + direct file reads (SecurityConfig.java, CrossConfig.java, security/*.java, Dockerfile, docker-compose*.yml, ECS task definition, GitHub Actions workflows, `.env.example` names, CLAUDE.md, `proxy.ts`, seller layout) |
| Prepared for | somilm@tiameds.ai |
| Date | 2026-08-31 |
| Not a certification | This document reports what is implemented in code today. It makes no claim of compliance certification, penetration-test sign-off, or production security audit. |

---

### 2. Threat Model / Risk Assessment

| Threat | Attack Vector | Impact | Likelihood | Existing Control | Gap | Recommendation |
|---|---|---|---|---|---|---|
| Global unauthenticated API access | `SecurityConfig.java` line 52: `auth.anyRequest().permitAll()` is the live rule for the entire Spring MVC application — the stricter role-scoped rule set exists only as a commented-out block beneath it | Critical — every REST endpoint in the backend (seller/buyer registration, admin approval, orders, payments, stock, product CRUD) is reachable without a valid JWT at the HTTP layer | Certain (already true in the shipped code, not a hypothetical) | `AuthTokenFilter` still parses and validates any Bearer token present and populates `SecurityContextHolder`; some controllers/services additionally perform a manual `SecurityContextHolder`/`Authentication` check (e.g. `TempSellerServiceImpl.resolveAuthenticatedUser()`, `SellerOrderController`'s JWT-resolved-seller ownership checks) | No endpoint-level authorization is enforced by the framework; protection depends entirely on whether each individual controller/service happens to add its own check — many admin (`AdminBuyerController`, `AdminSellerController`, `AdminOrderController`) and several `TempSellerController`/`TempBuyerController` endpoints have **no check at all** | **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: uncomment/rebuild the `authorizeHttpRequests` rule set in `SecurityConfig.java` to require authentication by default and scope admin routes to an ADMIN role via `@PreAuthorize`/`@Secured` (method security is enabled via `@EnableMethodSecurity` but no annotation usage was found anywhere in the codebase) |
| Client-side-only route guard can be bypassed | Seller and buyer dashboard protection is a `useEffect` in `src/app/seller_7a3b9f2c/layout.tsx` / `src/app/buyer_e8d45a1b/dashboard/layout.tsx` that runs after mount and checks `localStorage` | High — protected UI can render briefly before redirect ("flash of protected content"); more importantly, since the backend also permits all requests (row above), a client bypass is not even necessary to reach the underlying API | High — this is the *only* seller/buyer route protection that exists; nothing enforces it at the network edge | `useEffect` checks `accessToken`/`refreshToken` + `sellerAuthService.isAuthenticated()` (seller) or `buyerAuthService.isAuthenticated()` (buyer) and redirects/opens a login modal if missing | `src/proxy.ts` has the correct shape (checks a `token` cookie, redirects unauthenticated seller-dashboard requests) but is **not wired up**: wrong filename (`proxy.ts`, Next.js requires `middleware.ts`/`middleware.js`) and wrong export name (`proxy`, not `middleware`/default export). No file imports it; no `middleware.ts`/`.js` exists anywhere in `src/` or the project root (confirmed by repo-wide search) | **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: rename `src/proxy.ts` → `middleware.ts`, export `middleware`, and update its `matcher` to cover the current protected-route set (`dashboard`, `products`, `profile`, `orders`, `conversions`, `settings`, `shipment` — the existing `matcher` only covers `/seller_7a3b9f2c/dashboard(/*)` and would under-protect even if wired up). This alone does not fix the backend gap above and must be paired with it |
| Session token theft via XSS (non-httpOnly cookie + localStorage JWT) | `src/services/seller/authService.ts` and `src/services/buyer/buyerAuthService.ts` both mirror the access token into a plain `document.cookie` (`"token"` for seller, `"buyerToken"` for buyer) using a hand-written `setCookie()` helper — client-side JS cannot set `HttpOnly`, so this cookie (and the parallel `localStorage` copies of `accessToken`/`refreshToken`) is fully readable by any script running in the page | High — a single XSS vulnerability anywhere in the app (any component that renders unsanitized user/seller-supplied content) would allow exfiltration of both the access token and, more seriously, the raw refresh token, giving an attacker persistent account takeover until the refresh token is rotated/revoked | Medium — depends on an XSS vector existing elsewhere in the app; not independently confirmed present, but the storage design offers no defense-in-depth if one is found | None — this is architectural, not a bug in a specific line | This is a real, structural gap, not a hypothetical: tokens are deliberately stored in JS-readable locations (`localStorage` + non-httpOnly cookie) rather than an httpOnly, `SameSite=Strict` cookie set by the server | **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: issue the refresh token (and ideally the access token) as a server-set `HttpOnly; Secure; SameSite=Strict` cookie instead of returning it in the JSON body for client-side storage; this requires backend (`AuthenticationController`/`BuyerAuthenticationController`) and frontend (`lib/api.ts`/`lib/buyerApi.ts`) changes together |
| JWT contains no roles/claims beyond subject | `security/JwtUtils.java`: the signed JWT carries only `sub` (username), `iat`, `exp` — no roles, no userId | Low-Medium — every request must re-resolve the full `UserDetails` (including roles) from the database via `UserDetailsServiceImpl.loadUserByUsername()`, which is a design choice, not itself a vulnerability, but it does mean a stale/cached role assumption is impossible while a DB-lookup-skipping optimization is not | Low | `AuthTokenFilter` re-resolves roles per request | None identified beyond the performance/architecture trade-off | No recommendation — documenting the design choice, not flagging a defect |
| Access-token lifetime misconfigured for production | `application-dev.yml` / `application-test.yml`: `app.jwt.expiration=86400000` (24 hours), with an inline comment admitting it is "Temporarily set to 24 hours for testing, change back to 30 minutes in production" | Medium — a stolen access token remains valid for a full day instead of 30 minutes, widening the exploitation window if one leaks (e.g. via the XSS/storage gap above) | Certain in dev/test profiles as shipped; `application-prod.yml` defines **no** `app.jwt.*` keys at all (see Secrets Management, §5) | None — the comment is the only safeguard, and it is advisory only | The 24h value ships in the checked-in dev/test YAML; prod would need this value supplied externally or the application fails to start (unresolved `${app.jwt.expiration}` placeholder) | **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: set `app.jwt.expiration` to the intended 30-minute value via an externally-injected value for any real production deployment, and remove/correct the misleading comment |
| Refresh token replay / no server-side revocation on logout across devices | `RefreshToken.tokenHash` (SHA-256, tbl_refresh_tokens) — rotation is implemented (old token revoked on refresh, new one issued) and logout revokes the *presented* refresh token, but there is no "revoke all sessions for this user" action anywhere in the code inspected | Medium — a leaked refresh token that is never used again by the legitimate device (so never triggers rotation) remains valid until its 7-day (`app.jwt.refresh-expiration=604800000`) expiry, with no way for the user/admin to kill it early except knowing the exact stored hash | Low-Medium | Rotation + hash-only storage (`JwtUtils.hashToken`) already mitigate raw-token-at-rest exposure | No bulk/"logout everywhere" revocation endpoint found in `AuthenticationController.java` / `BuyerAuthenticationController.java` | **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: add a "revoke all refresh tokens for user" admin/self-service action |
| CORS wildcard + credentials conflict | `config/CrossConfig.java` registers a `CorsFilter` bean on `/**` with a fixed 5-origin allowlist + `allowCredentials=true` — correct per spec. However several individual controllers (`SignupController.java`, `IFSCOverrideController.java`, seller `AuthenticationController.java`) additionally carry `@CrossOrigin(origins = "*")` | Medium — a wildcard origin combined with credentials is invalid per the CORS spec and is rejected by browsers when both are actually in force together, but Spring's precedence between a global `CorsFilter` bean and a per-controller `@CrossOrigin` annotation was **not traced** in this inspection, so the practical effect for a given request is unconfirmed | Unknown — depends on which mechanism Spring actually applies per request | The global whitelist itself, if it is the one enforced, is a reasonable control | Ambiguous precedence between two competing CORS configurations is itself a maintainability/security risk (a future change to one without checking the other could silently open or close cross-origin access) | **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: remove the per-controller `@CrossOrigin(origins="*")` annotations and rely solely on the single `CrossConfig` `CorsFilter` bean, or vice versa — pick one mechanism |
| No CSRF protection | `SecurityConfig.java` line 48: CSRF is explicitly disabled (`.csrf(csrf -> csrf.disable())`) | Low, given the app is a stateless, Bearer-token SPA architecture (CSRF primarily threatens cookie-session-authenticated state-changing requests) — but the non-httpOnly auth cookie (row above) that IS also sent automatically by the browser on same-origin requests, combined with a fully-open backend (`permitAll()`), means CSRF-style attacks are not entirely moot if the cookie is ever relied on server-side for auth (not observed to be the case; the cookie appears to be a client-side convenience mirror, not something the backend reads for `Authorization`) | Low, given current usage of the cookie is client-read-only per source inspected | Standard for stateless JWT-Bearer APIs (`SessionCreationPolicy.STATELESS` is also set) | None identified as a live exploitation path in the code inspected | No recommendation — standard practice for this architecture as implemented |
| No rate limiting / brute-force throttling at the infrastructure layer | Login lockout exists at the *application* layer only: seller login locks after 5 failed password attempts (`AuthService.MAX_LOGIN_FAILED_ATTEMPTS=5`) and 3 failed OTP attempts (`MAX_OTP_FAILED_ATTEMPTS=3`); buyer login mirrors this | Medium — application-level lockout is real and does function, but there is no evidence of any WAF, API gateway, or reverse-proxy rate limiting in front of the service (no such config found in the ECS task definition, docker-compose files, or any config file inspected) | Medium | Per-account lockout (application code) | No IP-based or endpoint-wide rate limiting identified anywhere in the infrastructure config inspected | **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: add rate limiting at a load balancer / API gateway / WAF layer (none of which appear in this repository's infrastructure config) |
| Input validation posture — mixed | Extensive Bean Validation (`@Valid`) plus hand-written `ValidationException`-collecting validators exist per product-import category (`DrugImportStrategy`, `ConsumableImportStrategy`, etc. — regex/length/range checks on product fields), and Zod schemas exist frontend-side (`src/schema/**`) | Low-Medium overall — validation exists and is fairly thorough where it is wired up | Low for the wired-up paths; higher for the gaps below | Server-side Bean Validation on DTOs; category-specific import validators; frontend Zod schemas paired with manual `.safeParse()` calls in most product forms | Frontend validation is inconsistent: `CosmeticSchema.ts`, `ConsumableDeviceSchema.ts`, `NonConsumableDeviceSchema.ts` are defined but **not imported by any live component** (orphaned); `FoodInfantForm.tsx` imports `foodInfantSchema` but never calls `.parse()`/`.safeParse()` on it (dead import); `EditProduct.tsx` and `ProductOnboarding.tsx` have their schema `.safeParse()` calls commented out. Regardless, this is frontend-only defense-in-depth — the backend's own Bean Validation and `ValidationException` collectors are the actual enforcement boundary and were confirmed present for Drug/Consumable import paths | **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: re-wire the orphaned Cosmetic/Consumable/Non-Consumable Zod schemas into their respective forms, or remove them if genuinely superseded, to avoid maintaining dead validation code that could mislead a future reviewer into believing client-side validation exists where it does not |
| Multi-seller-type IDOR-style exposure via unauthenticated GETs | Numerous `TempSellerController`/`TempBuyerController` endpoints (e.g. `GET /temp-sellers/{id}`, `GET /temp-sellers/user/{userId}`, all `/contact/check-*`, all document upload/delete endpoints) have **no auth check in the controller method itself**, on top of the global `permitAll()` | High — any caller who can guess/enumerate a numeric `id`/`userId` can read another seller's/buyer's full registration record (address, GST, bank details, documents) or delete/replace their uploaded files | High, given IDs are small sequential integers in several of these paths | None found for the specific endpoints named | Sensitive PII/financial data (GST numbers, bank account details, uploaded license/ID documents) is retrievable and mutable by an unauthenticated caller who knows or guesses an ID | **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: add authentication + ownership checks (mirroring the pattern already used in `SellerOrderController`, which resolves the seller from the JWT rather than trusting a path parameter) to every `TempSellerController`/`TempBuyerController` GET/PATCH/DELETE/upload endpoint |
| Admin approval endpoints fully open | `AdminBuyerController.reviewBuyer`, `AdminSellerController.reviewSeller`, `AdminOrderController.overrideOrderStatus`/`getAllOrders` have no `@PreAuthorize`/role check anywhere, and `AdminOrderOverrideRequestDTO.adminId` is an optional, free-text, unvalidated field only used to stamp an audit column | Critical — any unauthenticated caller who reaches the network can approve/reject seller and buyer registrations, or force any order into any status string (no validation that the string is even a real `SellerOrderStatus` constant) | High given `permitAll()` is confirmed live | An append-only `*ReviewHistory`/`OrderStatusHistory` audit trail exists, so actions are logged, but nothing prevents them | Same root cause as row 1, called out separately here because these specific endpoints have real business-approval and financial-state consequences (this app has "no admin UI" per its own `CLAUDE.md`, meaning these endpoints are presumably intended to be called from a separate, undiscovered admin tool referenced only by an `app.admin-frontend-url` property — that tool's own access control, if any, was not part of this repository and could not be assessed) | **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: gate all `/admin/**` controllers behind a verified `ROLE_ADMIN` check once the global `permitAll()` is corrected |

---

### 3. Authentication & Authorization Architecture

#### 3.1 Sequence diagram (traced from source)

The diagram below is reproduced from `d:/Tiameds_MarketPlace/Frontend/pharma-aggregator-client/docs/diagrams/authentication-sequence.mmd`, itself built by directly reading `AuthenticationController.java`, `AuthService.java`, `BuyerAuthenticationController.java`, `BuyerAuthService.java`, `JwtUtils.java`, `AuthTokenFilter.java`, `src/lib/api.ts`, and `src/lib/buyerApi.ts`.

```mermaid
sequenceDiagram
    autonumber

    participant Browser as Browser (localStorage + document.cookie)
    participant SUI as Seller UI (LoginModals.tsx)
    participant SAuth as sellerAuthService.ts
    participant SApi as lib/api.ts (axios, seller)
    participant SCtrl as AuthenticationController (/authentication)
    participant SSvc as AuthService (seller, backend)
    participant Jwt as JwtUtils (shared, HS256)
    participant Mail as EmailService (SMTP, shared)
    participant SDB as tbl_user / tbl_login_otp / tbl_refresh_tokens
    participant AF as AuthTokenFilter (shared, on every request)

    participant BUI as Buyer UI (LoginForm / LoginOtpStep)
    participant BAuth as buyerAuthService.ts
    participant BApi as lib/buyerApi.ts (axios, buyer)
    participant BCtrl as BuyerAuthenticationController (/buyer/authentication)
    participant BSvc as BuyerAuthService (buyer, backend)
    participant BDB as tbl_buyer_user / tbl_buyer_login_otp / tbl_buyer_refresh_tokens

    Note over SUI,SDB: SELLER LOGIN — src/app/modals/LoginModals/LoginModals.tsx is the REAL, wired-up seller login UI.<br/>src/app/(auth)/login_fhy26sb/** is a separate, orphaned scaffold (fetch('/api/seller/...') routes that don't exist) — not part of this flow.

    rect rgb(235,245,255)
    Note over Browser,SDB: STEP 1 — password login, sends OTP
    Browser->>SUI: submit username + password
    SUI->>SAuth: sellerAuthService.login(credentials)
    SAuth->>SApi: POST /authentication/login {username,password}
    SApi->>SCtrl: forwarded (Bearer attach interceptor: no token yet, so no header)
    SCtrl->>SSvc: validateCredentialsAndSendOtp(loginRequest)
    SSvc->>SDB: findByUsername(username)
    SDB-->>SSvc: User row
    alt account locked or inactive
        SSvc-->>SCtrl: AccountLockedException / AccountInactiveException
        SCtrl-->>SApi: 403 {status,error,message}
    else credentials checked
        SSvc->>SSvc: AuthenticationManager.authenticate() — BCrypt check via Spring Security
        alt bad password
            SSvc->>SDB: increment failedLoginAttempts (lock account at 5 — MAX_LOGIN_FAILED_ATTEMPTS)
            SSvc-->>SCtrl: InvalidCredentialsException
            SCtrl-->>SApi: 401 {status,error,message}
        else password OK
            SSvc->>SDB: resetFailedLoginAttempts; invalidateAllOtpsForUser(user)
            SSvc->>SDB: save new LoginOtp (6-digit, isUsed=false, expiresAt=+5min, OTP_EXPIRY_MINUTES)
            SSvc->>Mail: sendCoordinatorOtp(user.username, otpCode)
            SSvc-->>SCtrl: OtpSentResponse{message, username}
            SCtrl-->>SApi: 200 {status:"SUCCESS", data:{message,username}}
            SApi-->>SAuth: response (checked for a nested 200-wrapped 401 failure shape)
            SAuth->>Browser: localStorage.setItem("otpUsername", username)
            SAuth-->>SUI: OtpSentResponse — show OTP entry screen
        end
    end
    end

    rect rgb(235,255,240)
    Note over Browser,SDB: STEP 2 — OTP verification, JWT + refresh-token issuance
    Browser->>SUI: submit 6-digit OTP
    SUI->>SAuth: sellerAuthService.verifyOtp({username, otp})
    SAuth->>SApi: POST /authentication/verify-otp {username, otp}
    SApi->>SCtrl: forwarded
    SCtrl->>SSvc: verifyOtpAndIssueToken(request)
    SSvc->>SDB: findActiveOtpByUser(user) — unused AND unexpired AND unlocked
    alt no active OTP found
        SSvc-->>SCtrl: OtpExpiredException
        SCtrl-->>SApi: 410 Gone
    else OTP row found
        alt otp.otpCode != request.otp
            SSvc->>SDB: incrementFailedAttempts; lock OTP row at 3 (MAX_OTP_FAILED_ATTEMPTS)
            SSvc-->>SCtrl: OtpInvalidException (401) or OtpLockedException (429, must login again)
            SCtrl-->>SApi: 401 / 429 {status,error,message}
        else OTP matches
            SSvc->>SDB: markOtpAsUsed(otpId); updateLastLogin(userId, now)
            SSvc->>Jwt: generateJwtToken(authentication)
            Note right of Jwt: HS256, key = HMAC(app.jwt.secret).<br/>Claims: sub=username, iat, exp only — NO roles/userId embedded.<br/>app.jwt.expiration in application-dev.yml = 86400000ms (24h, commented as a "temporary" override of an intended 30 min)
            Jwt-->>SSvc: accessToken (signed JWT)
            SSvc->>Jwt: generateRefreshToken()
            Note right of Jwt: 64 random bytes (SecureRandom), base64url-encoded — an OPAQUE token, not a JWT
            Jwt-->>SSvc: rawRefreshToken
            SSvc->>Jwt: hashToken(rawRefreshToken) — SHA-256
            SSvc->>SDB: save RefreshToken{tokenHash (raw never stored), expiresAt=now+app.jwt.refresh-expiration (7 days)}
            SSvc-->>SCtrl: LoginResponse{accessToken, refreshToken(raw), userId, username, roles, passwordTemporary, message}
            SCtrl-->>SApi: 200 {status:"SUCCESS", data:LoginResponse}
            SApi-->>SAuth: response
            alt loginData.passwordTemporary === true
                SAuth->>Browser: do NOT store accessToken/refreshToken; clear any stale ones; deleteCookie("token")
                SAuth-->>SUI: caller routes to first-time password-reset step (POST /auth/reset-password)
            else normal login
                SAuth->>Browser: localStorage.setItem(accessToken, refreshToken, user, lastLogin)
                SAuth->>Browser: decode JWT payload via atob() to read exp → localStorage.setItem("tokenExpiresAt", exp*1000)
                SAuth->>Browser: setCookie("token", accessToken, 1 day) — plain document.cookie, NOT httpOnly, SameSite=Lax
                SAuth-->>SUI: LoginResponse — redirect into /seller_7a3b9f2c/dashboard
            end
        end
    end
    end

    Note over BUI,BDB: BUYER LOGIN — src/app/buyer_e8d45a1b/login/page.tsx renders null; a global BuyerLoginModalProvider (mounted in root layout.tsx) opens the actual modal built from these same LoginForm/LoginOtpStep components. Structurally mirrors seller login but is fully isolated (own tables, own controller, own axios client, own localStorage key prefix "buyer*").

    rect rgb(255,245,235)
    Note over Browser,BDB: STEP 1 — password login, sends OTP (buyer)
    Browser->>BUI: submit email + password
    BUI->>BAuth: buyerAuthService.login(credentials)
    BAuth->>BApi: POST /buyer/authentication/login
    BApi->>BCtrl: forwarded
    BCtrl->>BSvc: validateCredentialsAndSendOtp(loginRequest)
    BSvc->>BDB: findByEmail(username)
    BDB-->>BSvc: BuyerUser row
    alt locked / inactive
        BSvc-->>BCtrl: AccountLockedException / AccountInactiveException (403)
    else
        BSvc->>BSvc: passwordEncoder.matches(password, buyerUser.passwordHash) — manual BCrypt check, NOT Spring Security's AuthenticationManager
        alt bad password
            BSvc->>BDB: increment failedLoginAttempts (lock at 5)
            BSvc-->>BCtrl: InvalidCredentialsException (401)
        else password OK
            BSvc->>BDB: resetFailedLoginAttempts; invalidateAllOtpsForBuyerUser(buyerUser)
            BSvc->>BDB: save new BuyerLoginOtp (6-digit, +5min expiry)
            BSvc->>Mail: sendBuyerOtp(email, otpCode)
            BSvc-->>BCtrl: BuyerOtpSentResponse{message, username}
            BCtrl-->>BApi: 200 {status:"SUCCESS", data:{...}}
            BApi-->>BAuth: response
            BAuth->>Browser: localStorage.setItem("buyerOtpUsername", username)
            BAuth-->>BUI: show OTP entry screen
        end
    end
    end

    rect rgb(250,240,255)
    Note over Browser,BDB: STEP 2 — OTP verification, JWT + refresh-token issuance (buyer)
    Browser->>BUI: submit 6-digit OTP
    BUI->>BAuth: buyerAuthService.verifyOtp({username, otp})
    BAuth->>BApi: POST /buyer/authentication/verify-otp
    BApi->>BCtrl: forwarded
    BCtrl->>BSvc: verifyOtpAndIssueToken(request)
    BSvc->>BDB: findActiveOtpByBuyerUser(buyerUser)
    alt no active OTP
        BSvc-->>BCtrl: OtpExpiredException (410)
    else
        alt otp mismatch
            BSvc->>BDB: incrementFailedAttempts; lock at 3 attempts
            BSvc-->>BCtrl: OtpInvalidException (401) / OtpLockedException (429)
        else OTP matches
            BSvc->>BDB: markOtpAsUsed; updateLastLogin
            BSvc->>BSvc: manually build UserDetailsImpl{id=buyerUserId, authorities=[ROLE_BUYER]} — no AuthenticationManager/UserDetailsServiceImpl involved
            BSvc->>Jwt: generateJwtToken(authentication) — same shared JwtUtils/HS256 key as seller
            Jwt-->>BSvc: accessToken
            BSvc->>Jwt: generateRefreshToken() + hashToken()
            Jwt-->>BSvc: rawRefreshToken
            BSvc->>BDB: save BuyerRefreshToken{tokenHash, expiresAt=+7 days}
            BSvc-->>BCtrl: BuyerLoginResponse{accessToken, refreshToken(raw), buyerUserId, username, phone, roles, passwordTemporary}
            BCtrl-->>BApi: 200 {status:"SUCCESS", data:...}
            BApi-->>BAuth: response
            alt passwordTemporary === true
                BAuth-->>BUI: no tokens stored — route to reset-password (temp password from e.g. a guest quote-request account)
            else
                BAuth->>Browser: localStorage.setItem(buyerUser, buyerLastLogin, buyerAccessToken, buyerRefreshToken, buyerTokenExpiresAt)
                BAuth->>Browser: setCookie("buyerToken", accessToken, 1 day) — separate cookie name from seller's "token"
                BAuth-->>BUI: redirect — /buyer_e8d45a1b/dashboard (client-side guard in dashboard/layout.tsx checks buyerAccessToken+buyerRefreshToken)
            end
        end
    end
    end

    Note over Browser,AF: SUBSEQUENT AUTHENTICATED REQUESTS — Authorization header attach (both roles)
    rect rgb(245,245,245)
    Browser->>SApi: any seller-domain call (request interceptor)
    SApi->>SApi: reads localStorage("accessToken") → sets header Authorization: Bearer <token>
    SApi->>AF: request with Bearer token
    Note right of AF: AuthTokenFilter parses the Bearer header, jwtUtils.validateJwtToken(), then<br/>userDetailsService.loadUserByUsername(username, preferBuyer) — preferBuyer=true only if the<br/>request URI contains "/buyer/", so an email registered as both buyer and seller resolves correctly.<br/>NOTE: SecurityConfig.filterChain() sets anyRequest().permitAll() — Spring Security enforces<br/>NOTHING at the HTTP layer; this filter only populates SecurityContext for app-code checks to read.
    AF-->>SApi: 200 (protected data) — normal case
    Browser->>BApi: any buyer-domain call (request interceptor)
    BApi->>BApi: reads localStorage("buyerAccessToken") → sets Authorization: Bearer <token>
    BApi->>AF: request with Bearer token (same shared filter/JwtUtils, different token/table)
    end

    Note over Browser,SDB: 401 / REFRESH HANDLING — src/lib/api.ts response interceptor (seller)
    rect rgb(255,235,235)
    AF-->>SApi: 401 Unauthorized (expired/invalid access token)
    alt request URL contains "/refresh", or is /authentication/login, /authentication/verify-otp, or /auth/signup
        SApi-->>Browser: reject as-is (treated as a normal auth failure, NOT session expiry — no refresh attempted)
    else any other protected call, and not already retried
        alt a refresh is already in flight (isRefreshing)
            SApi->>SApi: push {resolve,reject} onto failedQueue and wait
        else first 401 to arrive
            SApi->>SApi: set _retry=true, isRefreshing=true
            alt no refreshToken in localStorage
                SApi->>Browser: clear all seller auth localStorage keys + cookie "token"; redirect "/?showLogin=true&session=expired"
            else refreshToken present
                SApi->>SCtrl: raw axios.post(/authentication/refresh, {refreshToken}) — bypasses the `api` instance itself to avoid interceptor recursion
                SCtrl->>SSvc: refreshAccessToken(rawRefreshToken)
                SSvc->>Jwt: hashToken(rawRefreshToken)
                SSvc->>SDB: findByTokenHash(hash)
                alt not found, or !isValid() (revoked or past expiresAt)
                    SSvc-->>SCtrl: RefreshTokenException
                    SCtrl-->>SApi: 401 {message}
                    SApi->>Browser: clear auth keys + cookie + sessionStorage.clear(); redirect "/?showLogin=true&session=expired"
                else valid
                    SSvc->>SDB: stored.setRevokedAt(now) — ROTATE: old refresh token is now dead
                    SSvc->>Jwt: generateJwtToken(new auth) + generateRefreshToken() (new raw)
                    SSvc->>SDB: save new RefreshToken{tokenHash of new raw, +7 days}
                    SSvc-->>SCtrl: LoginResponse{new accessToken, new refreshToken}
                    SCtrl-->>SApi: 200 {accessToken, refreshToken}
                    SApi->>Browser: localStorage.setItem(accessToken, refreshToken); cookie "token" updated
                    SApi->>SApi: processQueue() — replays every request that had queued during the refresh
                    SApi->>AF: retry the original failed request with new Bearer token
                    AF-->>SApi: 200 (success)
                end
            end
        end
    end
    end

    Note over Browser,BDB: 401 / REFRESH HANDLING — src/lib/buyerApi.ts response interceptor (buyer, structurally identical, separate token set)
    rect rgb(255,240,245)
    AF-->>BApi: 401 Unauthorized
    alt url is /refresh, /buyer/authentication/login, /buyer/authentication/verify-otp, or /buyer/auth/signup
        BApi-->>Browser: reject as-is
    else
        BApi->>BApi: queue concurrent 401s the same way (isRefreshing/failedQueue)
        alt no buyerRefreshToken
            BApi->>Browser: clear buyerAccessToken/buyerRefreshToken/buyerTokenExpiresAt/buyerUser + cookie "buyerToken"; redirect "/buyer_e8d45a1b/login?session=expired"
        else
            BApi->>BCtrl: raw axios.post(/buyer/authentication/refresh, {refreshToken})
            BCtrl->>BSvc: refreshAccessToken(rawRefreshToken)
            BSvc->>BDB: findByTokenHash(hash); check isValid()
            alt invalid/expired/revoked
                BSvc-->>BCtrl: RefreshTokenException (401)
                BApi->>Browser: clear buyer auth keys + cookie; redirect to buyer login
            else valid
                BSvc->>BDB: revoke old row (setRevokedAt)
                BSvc->>BSvc: issueTokensForUser(buyerUser) — new access+refresh pair, new BuyerRefreshToken row persisted
                BCtrl-->>BApi: 200 {accessToken, refreshToken}
                BApi->>Browser: localStorage updated; cookie "buyerToken" updated
                BApi->>AF: retry original request with new Bearer token
            end
        end
    end
    end

    Note over SApi,BApi: NOT part of this flow but adjacent: src/utils/api.ts is a THIRD axios client (used by every product/* service, not by login) that attaches the Bearer token but has NO response interceptor at all — a 401 hit through it does not auto-refresh or redirect.
```

#### 3.2 Role / permission model — **PARTIALLY IMPLEMENTED**

- **Roles exist as data, not as enforcement.** `RoleMaster` (`tbl_role_master`, `entity/master/RoleMaster.java`) declares `SELLER`/`BUYER`/`ADMIN` per its own comment, but has **no seed data shipped** — `UserCreationService.createUserFromSignup` throws if the `SELLER` row is missing, with the message "Please seed the roles table," confirming this must be done manually outside the repository. **IMPLEMENTED** (as a lookup table) but **NOT IDENTIFIED** as a self-seeding mechanism.
- **JWT carries no role claims** (`JwtUtils.generateJwtToken` — subject/iat/exp only). Roles are re-resolved per request from the database by `UserDetailsServiceImpl.loadUserByUsername(username, preferBuyer)`, with `preferBuyer` derived from whether the request URI contains `/buyer/` (`AuthTokenFilter.java`). **IMPLEMENTED**.
- **Two entirely separate identity tables**: `tbl_user` (seller/admin) and `tbl_buyer_user` (buyer) — a single email can exist in both, disambiguated only by URL prefix at authentication time. **IMPLEMENTED**, but this means "ADMIN" is a role value that would have to live in `tbl_user`, and no admin-specific login flow, admin UI, or admin-role-gated route was found anywhere in this frontend repository (confirmed by the discovery pass: `src/services/admin/TestService.ts` is a one-line placeholder, and no `admin/**` App Router route exists). **NOT IDENTIFIED**: any admin-facing UI or admin-specific login flow in this codebase. The three `/admin/**` controllers found (`AdminBuyerController`, `AdminSellerController`, `AdminOrderController`) are real, wired Spring MVC endpoints, presumably consumed by a separate, undiscovered admin client referenced only by the `app.admin-frontend-url` property in `SellerApprovalServiceImpl.java` — that external tool was not part of this repository and could not be assessed.
- **Authorization enforcement, where it exists at all, is per-endpoint application code**, not a framework-level role check: e.g. `SellerOrderController` resolves the seller from the JWT principal and checks `SellerOrder` ownership; `BuyerProfileController` requires the caller to be the same `buyerUserId` or hold `ROLE_ADMIN`; `TempBuyerController`'s admin-only listing checks `ROLE_ADMIN` manually. **PARTIALLY IMPLEMENTED** — present in a minority of controllers, absent in most (see §2 rows on admin endpoints and `TempSellerController`/`TempBuyerController`).
- **No `@PreAuthorize`/`@Secured` annotation usage was found anywhere in the backend** despite `@EnableMethodSecurity` being turned on in `SecurityConfig.java` — the capability exists but is unused.

---

### 4. Data Encryption

#### In Transit

- **NOT IDENTIFIED in the current implementation.** No TLS/HTTPS termination configuration was found in any file inspected — not in the Dockerfile, `docker-compose*.yml`, the ECS task definition, or any Spring configuration file. Next.js and Spring Boot do not self-document TLS termination; it is normally handled by a load balancer or reverse proxy that would sit in front of this application, and no such component (ALB listener config, nginx config, Caddy config, etc.) exists in either repository. **Likely terminated at a load balancer/reverse proxy not present in this repository**, consistent with the fact that the ECS task definition configures only a plain HTTP container health check (`curl -f http://localhost:8080/...`) with no TLS materials referenced.
- Passwords are transmitted from the frontend to `/authentication/login`/`/buyer/authentication/login` as plaintext JSON over whatever transport the deployment uses — this is standard for a Bearer-token API behind TLS, but **the presence of that TLS layer is not evidenced in this repository**.

#### At Rest

- **Passwords**: `BCryptPasswordEncoder` is declared as the `PasswordEncoder` bean in `SecurityConfig.java` (lines 37-39) and is genuinely consumed by `SignupService.java`, `UserCreationService.java`, `AuthService.java`, `BuyerSignupService.java`, `BuyerAuthService.java`, `UserService.java`, and `SellerServiceImpl.java` (confirmed via grep across those files). **IMPLEMENTED**.
- **Refresh tokens**: stored only as a SHA-256 hash (`RefreshToken.tokenHash`, `BuyerRefreshToken.tokenHash`) — the raw opaque token is never persisted, only returned to the client once. **IMPLEMENTED**.
- **Database encryption at rest (e.g. RDS storage encryption)**: **NOT IDENTIFIED in the current implementation.** No `storage-encrypted`/KMS configuration was found in any file inspected (there is no Terraform/CloudFormation/CDK infrastructure-as-code in either repository — only an application-level `application-dev.yml` datasource URL pointing at an existing AWS RDS Postgres endpoint). Whether that RDS instance has storage encryption enabled is an AWS console/IaC-level setting outside this repository's scope and **cannot be confirmed from the code**.
- **S3 object encryption** (product images, seller/buyer documents, invoices): `S3Config.java` builds a plain `S3Client` via `StaticCredentialsProvider`; no server-side-encryption (SSE-S3/SSE-KMS) parameter was found on any `S3Service` upload call (`uploadFile`, `uploadFileFromResource`) in the files inspected. **NOT IDENTIFIED in the current implementation** — if the bucket has default encryption configured at the bucket-policy level (not visible from application code), objects would still be encrypted at rest, but that is a bucket configuration this repository does not contain evidence of either way.
- **Sensitive PII in plain columns**: GST numbers, PAN numbers, bank account numbers, and license document numbers are stored as plain `varchar` columns in `tbl_seller_gst`, `tbl_seller_bank_details`, `tbl_temp_buyer` etc., with no column-level/application-level encryption or tokenization identified in any entity file inspected. **NOT IDENTIFIED in the current implementation.**

---

### 5. Secrets Management

| Secret / Config | Where it lives | Evidence |
|---|---|---|
| DB credentials, AWS keys, Twilio credentials, mail credentials (production/ECS) | AWS Secrets Manager, referenced by name only | `deploy/tiamed-aggregator-task-defination.json` — every non-trivial environment variable (`DB_URL`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`, `ACCOUNT_SID`, `AUTH_TOKEN`, `SERVICE_SID`, `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD`) arrives via the ECS `secrets` block referencing `secretsmanager` ARNs under secret name `pharma_aggregator_test`, **not** the `environment` block. Only `SPRING_PROFILES_ACTIVE=test` is a plaintext value. **IMPLEMENTED** (AWS Secrets Manager usage for the ECS/test deployment). |
| Local/dev secrets | `.env` (git-ignored, not committed) and `.env.example` (committed, names only) | `.env.example` at the backend documents 13 variable **names only** — no values reproduced here. Frontend `.env.example` documents `NEXT_PUBLIC_BACKEND_URL`/`BACKEND_URL` (confirmed stale — not read anywhere in `src/`, per this repo's own `CLAUDE.md`; the real variable is `NEXT_PUBLIC_API_URL`). |
| **Hardcoded credential-shaped strings found during inspection** | | ⚠️ **`application-dev.yml`** (backend, `src/main/resources/application-dev.yml`) hardcodes a literal Postgres username and password on the line following `spring.datasource.url` (pointed at a real AWS RDS endpoint `pharma-aggregator-test.cfsi2w0iou42.ap-south-1.rds.amazonaws.com`). This file is checked into source control. **The value itself is not reproduced here** — flagging only its file location and the fact that it should be rotated and moved to an externally-injected secret (env var or AWS Secrets Manager), consistent with how the `test` profile (`application-test.yml`) already sources its DB credentials from `${DB_USERNAME}`/`${DB_PASSWORD}` env vars instead of hardcoding them. |
| | | ⚠️ **`application-prod.yml`** (backend) hardcodes a Postgres username (`postgres`) and a literal weak password value on its datasource lines, pointed at host `postgres-prod` (the docker-compose-local Postgres container, not RDS). This file is checked into source control. **Recommendation: rotate this credential and source it externally** (env var / secret) rather than committing it, exactly as `application-test.yml` already does for its own datasource block. |
| | | ⚠️ **`application-dev.yml` / `application-test.yml`** (backend) both hardcode a literal JWT signing secret string under `app.jwt.secret`, identical between the two profiles. Since this value is checked into source control and shared across dev and test, **it should be rotated and replaced with an externally-injected secret** for any environment that matters, and must never be reused for a production profile. |
| Production JWT config | **NOT IDENTIFIED** | `application-prod.yml` (read in full, 24 lines) defines **no** `app.jwt.secret`/`app.jwt.expiration`/`app.jwt.refresh-expiration` keys at all. A production deployment using only the four checked-in `application*.yml` files would fail to start (unresolved `${app.jwt.secret}` placeholder) unless these are supplied externally — no such external wiring (e.g. an ECS task definition for prod, a prod Secrets Manager reference) was found in this repository. The only ECS task definition present (`deploy/tiamed-aggregator-task-defination.json`) targets the **test** environment (image tag `pharma-aggregator-test`), not production. |
| Stale env-var documentation | `.env.example` (both repos), `docs/ENVIRONMENT_VARIABLES.md`, `docs/DOCKER.md`, `docs/QUICK_START.md` (backend); `.env.example` (frontend) | Confirmed via grep that the documented variable names in these files diverge from what the code actually reads (backend: `.env.example`'s `POSTGRES_URL`/`POSTGRES_PASSWORD` vs. the real `DB_URL`/`DB_PORT`/`DB_NAME`/`DB_USERNAME`/`DB_PASSWORD`; frontend: `NEXT_PUBLIC_BACKEND_URL` vs. the real `NEXT_PUBLIC_API_URL`, per this repo's own `CLAUDE.md`). **This is a documentation-hygiene gap, not a security control failure**, but it increases the risk of a future engineer misconfiguring a deployment. |

---

### 6. Network Security

- **VPC / Security Groups / Subnets**: **NOT IDENTIFIED in the current implementation.** No VPC ID, subnet ID, or security group reference appears in `deploy/tiamed-aggregator-task-defination.json` — the task definition specifies only `networkMode: awsvpc` (required for Fargate) with no embedded network configuration (network configuration for `awsvpc` mode is normally supplied at `ecs run-task`/service-creation time, not in the task definition JSON itself, and no ECS service definition or `aws ecs create-service` invocation was found in this repository to confirm what subnets/security groups are actually attached).
- **Application Load Balancer**: **NOT IDENTIFIED in the current implementation.** No ALB/target-group configuration was found in the task definition, the GitHub Actions workflows, or any other file inspected.
- **Container-to-container network isolation**: `docker-compose.yml` defines three isolated environment stacks (dev/test/prod), each with its own Postgres container on distinct host ports (5432/5433/5434) and app container on distinct host ports (8080/8081/8082) — this is local/dev-only Docker networking, not a production network topology. **IMPLEMENTED** for local development only.
- **RDS network placement**: the `application-dev.yml` datasource points directly at a public-looking RDS endpoint (`*.rds.amazonaws.com`) — whether that RDS instance sits in a private subnet reachable only from the application's security group, or is publicly accessible, **is not evidenced in this repository** (that is an AWS console/IaC-level setting, and no IaC exists here).

---

### 7. Compliance

| Framework | Classification | Basis |
|---|---|---|
| GDPR | Potentially Applicable | The system stores personal data (names, emails, phone numbers, addresses, uploaded ID/license documents) for sellers and buyers. No code-level data-subject-rights tooling (export/erasure endpoints), consent-tracking beyond a boolean `termsAccepted` flag, or data-residency configuration was found. **No certification claim can be made; this is a data-handling characteristic only.** |
| HIPAA | Not Evidenced | This is a pharmaceutical *marketplace* (product catalog, ordering, seller/buyer onboarding) — no patient health record, prescription, or clinical data model was found anywhere in the entities inspected (product entities model drug/device/cosmetic catalog attributes, not patient data). No BAA, PHI-handling code, or HIPAA-specific control was found. |
| SOC 2 | Not Evidenced | No SOC 2 control documentation, audit trail retention policy, or formal change-management process artifact was found in either repository. Application-level audit trails do exist for specific workflows (`OrderStatusHistory`, `TempSellerReviewHistory`, `TempBuyerReviewHistory`) but this does not constitute or imply SOC 2 compliance. |
| PCI-DSS | Not Applicable (as currently coded) | `Payment.java`'s own class javadoc references a `PaymentServiceImpl#handleWebhook` method that **does not exist in the codebase** — `PaymentServiceImpl` has exactly one method (`getByPaymentId`, read-only). Every order in the current implementation is settled as `provider='COD'`, `status=SUCCESS` at placement time (`OrderPlacementServiceImpl`) — there is no payment gateway, card data collection, or tokenization integration anywhere in the code inspected. PCI-DSS scope would only become relevant if a card-payment gateway is added later. |
| DPDP (India's Digital Personal Data Protection Act) | Potentially Applicable | Given the application's operating context (Indian states/districts/talukas master data, GST/PAN fields, `.rds.amazonaws.com` in `ap-south-1`), DPDP is a plausible applicable framework given the personal data processed, but **no DPDP-specific control (consent manager, data-principal-rights endpoint, breach-notification workflow) was found in the code.** |

No compliance certification of any kind is claimed or evidenced anywhere in either repository.

---

### 8. CI/CD Pipeline

Two GitHub Actions workflows exist in the backend repository (`D:/Tiameds_MarketPlace/Backend/pharma-aggregator-server/.github/workflows/`); **none exist in the frontend repository** (confirmed: no `.github/` directory, no `.gitlab-ci.yml`, no `Jenkinsfile` anywhere in `pharma-aggregator-client`).

#### `qodana_code_quality.yml` — **IMPLEMENTED** (static analysis only)
- Triggers: `workflow_dispatch`, all `pull_request`s, and pushes to `dev`/`main`/`test`.
- Runs JetBrains Qodana (`JetBrains/qodana-action@v2025.2`), full-project scan (`pr-mode: false`), posts PR comments, does **not** upload a SARIF artifact (`upload-result: false`).
- Does **not** build, test, or deploy anything.

#### `tests.yml` — **IMPLEMENTED**, but its name is misleading (it is a build+deploy pipeline that skips tests)
- Triggers: push/PR to the `test` branch, and manual dispatch.
- Steps (in order): checkout → set up JDK 17 (Temurin) → `mvn -DskipTests clean install` (**tests are explicitly skipped**) → configure AWS credentials from GitHub secrets → log in to Amazon ECR → `docker build`/`docker push` tagged with the commit SHA → render the ECS task definition (`deploy/tiamed-aggregator-task-defination.json`) → `amazon-ecs-deploy-task-definition` with `wait-for-service-stability: true`.
- A "Post-deployment Health Check" step exists in the file but is **entirely commented out** — no live post-deploy verification runs.

#### Plain statement of what does and does not exist
- **NOT IDENTIFIED**: any automated unit/integration test execution in CI (neither workflow runs `mvn test` or equivalent, despite one being named `tests.yml`).
- **IMPLEMENTED**: a real, automatic build → containerize → deploy pipeline exists, gated to the `test` branch only (there is no equivalent workflow deploying to a `prod` branch/environment anywhere in this repository).
- **NOT IDENTIFIED**: any lint step, any dedicated security-scan step beyond Qodana (which is a separate, non-blocking workflow), or any automated rollback step.
- **NOT IDENTIFIED (frontend)**: any CI/CD configuration of any kind for `pharma-aggregator-client` — it has only local build/containerization assets (`Dockerfile`, `docker-compose.yml`), no automated pipeline.

The Mermaid flowchart at `d:/Tiameds_MarketPlace/Frontend/pharma-aggregator-client/docs/diagrams/cicd-flow.mmd` visualizes this exact pipeline, stopping where the evidenced automation stops and explicitly labeling everything past that point as "manual/undocumented."

```mermaid
flowchart TD
    subgraph triggers["Triggers"]
        A1["push to dev / main / test"]
        A2["pull_request (any branch)"]
        A3["push/PR to test branch"]
        A4["workflow_dispatch (manual)"]
    end

    subgraph qodana["qodana_code_quality.yml"]
        B1["Checkout"]
        B2["JetBrains Qodana static scan\n(pr-mode: false, full-project)"]
        B3["Post PR comments + annotations"]
        B4["upload-result: false\n(no SARIF artifact)"]
        B1 --> B2 --> B3 --> B4
    end

    subgraph tests["tests.yml (named for tests, is actually CI/CD Pipeline)"]
        C1["Checkout"]
        C2["Set up JDK 17 (Temurin)"]
        C3["mvn -DskipTests clean install\n(tests explicitly SKIPPED)"]
        C4["Configure AWS credentials\n(GitHub secrets)"]
        C5["Log in to Amazon ECR"]
        C6["docker build + docker push\n(tag = commit SHA)"]
        C7["Render ECS task definition\n(deploy/tiamed-aggregator-task-defination.json)"]
        C8["amazon-ecs-deploy-task-definition\n(wait-for-service-stability: true)"]
        C9["Post-deployment Health Check step\n(ENTIRE STEP COMMENTED OUT)"]
        C1 --> C2 --> C3 --> C4 --> C5 --> C6 --> C7 --> C8 --> C9
    end

    A1 --> B1
    A2 --> B1
    A3 --> C1
    A4 --> B1
    A4 --> C1

    C9 -.->|"no live verification runs"| D["Manual / undocumented:\nno automated test execution,\nno post-deploy verification,\nno rollback automation anywhere in the workflow files"]

    style D fill:#00000000,stroke-dasharray: 5 5
    style C9 stroke-dasharray: 3 3
    style B4 stroke-dasharray: 3 3
    style C3 stroke-dasharray: 3 3
```

---

### 9. Environment Strategy

Three Spring profiles are evidenced by `application-dev.yml`, `application-test.yml`, `application-prod.yml`:

| | Local (`dev`) | Test | Production (`prod`) |
|---|---|---|---|
| `ddl-auto` | `update` | `update` | `validate` (schema must already exist — see the `docs/migration_*.sql` ad hoc scripts run manually against this profile) |
| Datasource | Hardcoded AWS RDS Postgres endpoint (`pharma-aggregator-test.cfsi2w0iou42.ap-south-1.rds.amazonaws.com`) with hardcoded credentials in the committed YAML | Fully env-var driven (`${DB_URL}`/`${DB_PORT}`/`${DB_NAME}`/`${DB_USERNAME}`/`${DB_PASSWORD}`) | Hardcoded to local docker-compose host `postgres-prod` with a hardcoded credential in the committed YAML |
| Flyway | `enabled:true`, `locations:classpath:db/migration`, `baseline-on-migrate:true` | Same as dev | **No `spring.flyway` block at all** — falls back to Flyway library defaults, with `ddl-auto=validate` implying the prod schema is expected to be pre-existing/managed manually |
| Swagger/OpenAPI | Enabled, `try-it-out-enabled: true` | Enabled, `try-it-out-enabled: true` | **Explicitly disabled** (`springdoc.swagger-ui.enabled: false`) |
| JWT config (`app.jwt.*`) | Present (hardcoded secret, 24h access-token expiry — see §2/§5) | Present (same hardcoded secret as dev) | **Absent entirely** — see §5 |
| Container port mapping (docker-compose) | 8080:8080 (app-dev), 5432 (postgres-dev) | 8081:8080 (app-test), 5433 (postgres-test) | 8082:8080 (app-prod), 5434 (postgres-prod) |
| Deployed via CI/CD | No (local `docker-compose up`/`start-dev.*` scripts only) | **Yes** — `tests.yml` builds and deploys this profile to AWS ECS Fargate | No CI/CD pipeline targets this profile anywhere in this repository |

**Frontend**: no equivalent profile system exists — a single `.env`/`NEXT_PUBLIC_API_URL` value determines which backend the Next.js app talks to, switched manually (the `.env` file itself contains a commented-out production alternative URL, `https://api-test-aggreator.tiameds.ai/api/v1/`, alongside the live local value).

---

### 10. Infrastructure Setup

Only AWS services with direct file/config evidence are listed. **No other AWS service is claimed.**

| Service | Evidence | Status |
|---|---|---|
| Amazon S3 | `config/S3Config.java` defines an `S3Client` bean (AWS SDK v2, `software.amazon.awssdk:s3` v2.25.60 per `pom.xml`) using `StaticCredentialsProvider` from `aws.s3.access-key`/`aws.s3.secret-key`/`aws.s3.region` properties; consumed by `S3Service.java` (upload/delete/copy/getFile) throughout product image, document, and invoice-PDF handling | **IMPLEMENTED** |
| Twilio (not AWS, third-party) | `config/TwilioConfig.java` — `@PostConstruct` `Twilio.init(accountSid, authToken)`; `twilio.verify.service-sid` property present, consistent with Twilio Verify for delivery-OTP SMS (`TwilioOTPService`) | **IMPLEMENTED** |
| Amazon ECS (Fargate) | `deploy/tiamed-aggregator-task-defination.json` — a registered Fargate task definition (`requiresCompatibilities: ["FARGATE"]`, `networkMode: awsvpc`, task-level `cpu:1024`/`memory:3072`); `tests.yml` actively deploys to it via `amazon-ecs-deploy-task-definition` | **IMPLEMENTED** (for the `test` environment only — no prod ECS task definition exists in this repository) |
| Amazon ECR | `tests.yml` logs in and pushes images to an ECR repository named via `secrets.ECR_REPOSITORY` | **IMPLEMENTED** |
| Amazon RDS | `application-dev.yml`'s hardcoded datasource URL points at a real `*.rds.amazonaws.com` endpoint | **IMPLEMENTED** (dev profile only — `test` sources its DB target from injected env vars of unknown backing infrastructure, and `prod`'s datasource points at a local docker-compose Postgres container, not RDS) |
| AWS Secrets Manager | ECS task definition's `secrets` block (see §5) | **IMPLEMENTED** |
| AWS CloudWatch Logs | ECS task definition's `logConfiguration.logDriver: "awslogs"`, log group `/ecs/tiameds-tiamed-aggregator-task-defination` | **IMPLEMENTED** (log shipping only — see §11 for what is and isn't monitored) |

**NOT IDENTIFIED anywhere in the files inspected**: CloudFront, Lambda, SQS/SNS, API Gateway, ElastiCache, DynamoDB, Cognito, WAF, or any VPC/security-group/ALB infrastructure-as-code.

---

### 11. Monitoring & Logging

- **Logging framework**: Spring Boot's default logging (SLF4J/Logback) is used throughout the backend (`log.warn`/`log.error` calls observed in numerous service classes, e.g. `SellerApprovalServiceImpl`, `BuyerApprovalServiceImpl`, `SellerOrderFulfillmentServiceImpl`). **IMPLEMENTED** at the application-code level (structured try/catch + logging around best-effort side effects like email sends and S3 migrations).
- **Log shipping**: `awslogs` driver configured in the ECS task definition, shipping container stdout/stderr to CloudWatch Logs group `/ecs/tiameds-tiamed-aggregator-task-defination`. **IMPLEMENTED** for the `test` ECS deployment.
- **APM / distributed tracing**: **NOT IDENTIFIED in the current implementation.** No X-Ray, Datadog, New Relic, OpenTelemetry, or Micrometer/Actuator-metrics-export configuration was found in `pom.xml` or any `application*.yml`.
- **Health checks**: `GET /api/v1/public/health-check` (`HomeController.java`) is implemented and is the exact endpoint the ECS task definition's container health check curls (`interval 30s / timeout 5s / retries 3 / startPeriod 60s`). **IMPLEMENTED**, but this is a liveness check only (`{"status":"UP"}` unconditionally) — it does not check database connectivity, S3 reachability, or any dependency health.
- **Spring Boot Actuator**: **NOT IDENTIFIED** — no `spring-boot-starter-actuator` dependency or `/actuator/**` endpoint reference was found in `pom.xml` or any controller.
- **CloudWatch Alarms / dashboards**: **NOT IDENTIFIED in the current implementation** — no alarm/dashboard configuration exists in any file inspected (would be an AWS console/IaC-level setting outside this repository's scope).
- **Audit trails** (application-level, not infrastructure monitoring): `OrderStatusHistory`, `TempSellerReviewHistory`, `TempBuyerReviewHistory` tables provide append-only business-event audit trails. **IMPLEMENTED**, but these are business-process audit logs, not security/access monitoring.

---

### 12. Backup & Disaster Recovery

**RPO/RTO are not explicitly defined in the current implementation.** No backup schedule, snapshot policy, multi-AZ configuration, or disaster-recovery runbook was found in any file inspected in either repository. This is consistent with the absence of any infrastructure-as-code (Terraform/CloudFormation/CDK) — RDS backup retention, snapshot frequency, and multi-AZ failover are all AWS console/IaC-level settings that would not appear in an application source repository, and none were found.

> **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: Define explicit RPO (maximum acceptable data loss) and RTO (maximum acceptable downtime) targets, then configure RDS automated backups/snapshots and multi-AZ deployment (or equivalent) to meet them, and document the restore procedure. Given the presence of financial data (orders, payments, refunds) and regulated-adjacent PII (GST/PAN, license documents), a same-day RPO and a low-single-digit-hour RTO would be a reasonable starting target, but this is a suggestion, not a requirement derived from any evidence in the codebase.

---

### 13. Rollback Strategy

#### Actual (evidenced)
- **Application deploy rollback**: **NOT IDENTIFIED as an automated capability.** `tests.yml`'s deploy step uses `amazon-ecs-deploy-task-definition` with `wait-for-service-stability: true` — if the new task definition fails to stabilize, ECS's own deployment circuit breaker (if enabled at the *service* level, which is not configured in any file inspected here) would be the only automatic protection; no explicit rollback step exists in the workflow file itself.
- **Data-layer rollback**: Flyway migrations (`V1`, `V2`, `V3` under `src/main/resources/db/migration/`) are forward-only — no `undo`/`down` migrations were found, and Flyway Community Edition (the dependency present, `flyway-core` with no `flyway-database-postgresql` companion artifact confirmed absent) does not support automated rollback of applied migrations.
- **Application-level "rollback" patterns that do exist** (business-logic safety nets, not deployment rollback): the two-phase approval pattern (`SellerApprovalServiceImpl`, `BuyerApprovalServiceImpl`) deliberately commits the database state change *before* best-effort S3 file migration and email sending, specifically so a downstream failure in those side effects can never leave a record half-approved — this is a data-consistency safeguard, not a deployment rollback mechanism. **IMPLEMENTED** as a design pattern, but scoped narrowly to the approval workflows, not to deployments.

#### Recommended
> **RECOMMENDATION — NOT CURRENTLY IMPLEMENTED**: 
> 1. Enable ECS deployment circuit breaker with automatic rollback on the ECS *service* definition (not present in this repository — only the task definition is).
> 2. Add an explicit rollback job to `tests.yml` (or a separate workflow) that re-deploys the last-known-good task definition revision on health-check failure, since the existing "Post-deployment Health Check" step is currently commented out and would need to be restored first to have anything to gate a rollback on.
> 3. Adopt Flyway `undo` migrations (Flyway Teams/Enterprise feature) or hand-write compensating migrations for any schema change that needs to be reversible in production.

---

### Implementation Traceability

| Design Element | Source File | Implementation |
|---|---|---|
| Global HTTP authorization | `D:/Tiameds_MarketPlace/Backend/pharma-aggregator-server/src/main/java/com/example/pharmaaggregatorserver/config/SecurityConfig.java` | **IMPLEMENTED as `permitAll()`** — the intended role-scoped rule set exists only as commented-out code |
| CORS | `D:/Tiameds_MarketPlace/Backend/pharma-aggregator-server/src/main/java/com/example/pharmaaggregatorserver/config/CrossConfig.java` | **IMPLEMENTED** — fixed 5-origin allowlist + credentials, `CorsFilter` bean on `/**` |
| JWT issuance/validation | `.../security/JwtUtils.java` | **IMPLEMENTED** — HS256, subject-only claims |
| JWT request filter | `.../security/AuthTokenFilter.java` | **IMPLEMENTED** — buyer/seller dual-identity resolution via URI-prefix check |
| Unauthenticated-access entry point | `.../security/AuthEntryPointJwt.java` | **IMPLEMENTED** — JSON 401 body |
| Password hashing | `SecurityConfig.java` (bean) + consumers (`SignupService.java`, `AuthService.java`, `BuyerAuthService.java`, etc.) | **IMPLEMENTED** — BCrypt |
| Refresh-token rotation (seller) | `.../service/seller/SellerLogIn/AuthService.java` | **IMPLEMENTED** — hash-only storage, single-use rotation |
| Refresh-token rotation (buyer) | `.../service/buyer/BuyerAuthService.java` | **IMPLEMENTED** — mirrors seller |
| Global exception handling | `.../exception/GlobalExceptionHandler.java`, `.../exception/GlobalLogInExceptionHandler.java` | **PARTIALLY IMPLEMENTED** — two competing `@ControllerAdvice` classes with overlapping `@ExceptionHandler(Exception.class)`/`MethodArgumentNotValidException` mappings; precedence between them was not traced |
| Response enveloping | `.../response/GlobalResponseHandler.java` | **IMPLEMENTED** — `ResponseBodyAdvice` wraps all 2xx bodies |
| Secrets injection (ECS) | `deploy/tiamed-aggregator-task-defination.json` | **IMPLEMENTED** — AWS Secrets Manager references, names only |
| S3 file storage | `.../config/S3Config.java`, `.../service/S3Service.java` | **IMPLEMENTED** — AWS SDK v2, no SSE parameter identified |
| Twilio SMS OTP | `.../config/TwilioConfig.java`, `.../service/temp/seller/TwilioOTPService.java` | **IMPLEMENTED** |
| CI build/deploy | `.github/workflows/tests.yml` | **IMPLEMENTED** for `test` branch/environment only; tests skipped, health-check step disabled |
| CI static analysis | `.github/workflows/qodana_code_quality.yml` | **IMPLEMENTED** |
| Client-side seller route guard | `d:/Tiameds_MarketPlace/Frontend/pharma-aggregator-client/src/app/seller_7a3b9f2c/layout.tsx` | **IMPLEMENTED** — post-mount `useEffect`, can flash protected content |
| Client-side buyer dashboard guard | `.../src/app/buyer_e8d45a1b/dashboard/layout.tsx` | **IMPLEMENTED** — renders `null` while unauthenticated (no flash), opens login modal rather than redirecting |
| Edge/middleware route protection | `.../src/proxy.ts` | **NOT IMPLEMENTED (dead code)** — wrong filename/export, never wired up by Next.js, no `middleware.ts` exists anywhere in the repo |
| Inactivity auto-logout | `.../src/hooks/useSessionManager.ts` | **IMPLEMENTED** — seller only, 30-minute timeout; **NOT IDENTIFIED** for buyer |
| Session token storage | `.../src/services/seller/authService.ts`, `.../src/services/buyer/buyerAuthService.ts` | **IMPLEMENTED as localStorage + non-httpOnly cookie** — a documented gap, see Threat Model §2 |

---

### Open Items Requiring Follow-Up Beyond This Repository's Evidence

- TLS termination point and certificate management (not present in either repository).
- Whether the RDS instance referenced in `application-dev.yml` has storage encryption, automated backups, or multi-AZ enabled (AWS console/IaC-level, no IaC found).
- VPC/subnet/security-group placement for the ECS service (no ECS *service* definition or network configuration was found alongside the task definition).
- The identity, access control, and security posture of the external admin frontend implied by `app.admin-frontend-url` (referenced but not present in this repository).
- Whether S3 bucket-level default encryption or bucket policies are configured (not visible from application code).
