# Riya — Digital Vehicle Identity & Social Lifecycle Platform
### Implementation Brief (for Claude Code)

> Source concept: `Riya_Proposal.md` (executive proposal). This document reframes and expands that proposal into a build-ready, phased implementation plan, with a social/sharing layer ("Instagram for vehicles") and ML/AI components broken out explicitly.

---

## 1. Product Reframing — "Instagram for Vehicles"

The core insight: a vehicle profile should feel like a **personal/identity asset**, not a records database. That's what makes people *want* to maintain it and *want* to share it.

Borrowed Instagram-style patterns, adapted for vehicles:

| Instagram concept | Riya equivalent |
|---|---|
| Profile page (handle, bio, photo) | Vehicle profile: plate number, make/model/year, cover photo, "bio" (verified badges, health score) |
| Feed of posts | Lifecycle timeline: service events, mileage milestones, ownership transfers, accident records (owner-controlled visibility per post) |
| Stories | Optional quick updates — wash/detailing, minor mods, photos (low-stakes, ephemeral, fun engagement layer) |
| Followers | Co-owners / family members with standing access; previous owners with read-only legacy access |
| Share profile link | Time-limited, scope-limited shareable link or QR — generated per "share intent" (e.g. "Share with this buyer for 7 days, show service + accident history, hide ownership cost") |
| Verified badge | Cross-validated badge — earned when data is independently confirmed by garage/insurer/DMT submissions rather than self-reported |
| Public search/discovery | **Intentionally NOT public.** No global plate-number search. Discovery only via owner-issued share link/QR, to avoid enabling theft targeting or stalking via vehicle history. |

This distinction (social *UX*, not social *exposure*) should be a guiding design principle throughout — it resolves the tension between "shareable like Instagram" and "vehicle privacy/safety."

---

## 2. Recommended Technology Stack

Building on patterns already proven across your other platforms (Creavint, VehicleWallet, FuelSmart):

**Backend (core API):**
- Node.js + TypeScript + Fastify (consistent with your current Creavint stack; fast, good schema validation via TypeBox/Zod)
- PostgreSQL (primary store — relational integrity matters a lot here: ownership chains, document links, audit trails)
- Redis + BullMQ — async jobs (OCR processing, notification scheduling, ML scoring jobs)
- Object storage: AWS S3 / S3-compatible (Cloudflare R2 also viable, cheaper egress)

**ML/AI microservice (separate from core API):**
- Python + FastAPI — mirrors your LeadReel pattern of isolating heavy/async AI work from the main API
- Houses: OCR pipeline, health score model, resale value model, fraud/anomaly detection, predictive maintenance

**Web (dealer/garage/insurer dashboards, public share-link viewer):**
- Next.js + React + TypeScript

**Auth:**
- JWT (short-lived access + refresh) + OAuth (Google/Facebook login for buyers who don't want to register fully)
- Role-based access control: Owner, Co-owner, Buyer (scoped/temporary), Garage, Insurer, Admin

**AI Assistant:**
- Claude API (Anthropic) — RAG-style grounding against the vehicle's own structured record set, not general web knowledge

**Deployment:**
- Docker + AWS (ECS/Fargate or EC2 depending on budget) — matches your existing GCP/Docker/Terraform familiarity, can swap to GCP Cloud Run if preferred for cost

---

## 3. High-Level Architecture

```
                         ┌─────────────────────┐
                         │   Mobile (Flutter)   │
                         │   Web (Next.js)      │
                         └─────────┬────────────┘
                                   │
                         ┌─────────▼────────────┐
                         │   Core API (Fastify)  │
                         │  Auth, Vehicles, Docs,│
                         │  Sharing, Notifications│
                         └────┬─────────────┬────┘
                               │             │
                  ┌────────────▼───┐   ┌─────▼─────────────┐
                  │ PostgreSQL      │   │  Redis + BullMQ   │
                  │ (core data)     │   │  (job queue)      │
                  └─────────────────┘   └─────┬─────────────┘
                                                │
                                   ┌────────────▼─────────────┐
                                   │  ML/AI Service (FastAPI) │
                                   │  OCR · Health Score ·    │
                                   │  Valuation · Fraud ·     │
                                   │  Predictive Maintenance  │
                                   └───────────┬───────────────┘
                                                │
                                   ┌────────────▼─────────────┐
                                   │   S3 (documents, photos) │
                                   └───────────────────────────┘
```

---

## 4. Core Data Model (entities, high level)

- `users` (owners, buyers, garage staff, insurer staff, admins)
- `vehicles` (plate, chassis, engine no., make/model/year, cover photo)
- `ownership_history` (vehicle_id, owner_id, start_date, end_date, transfer_type)
- `documents` (vehicle_id, type, file_url, OCR_status, extracted_fields JSON, verified_by)
- `service_records` (vehicle_id, garage_id, date, mileage, description, cost, verified)
- `accident_records` (vehicle_id, date, severity, description, source)
- `insurance_policies` (vehicle_id, provider, policy_no, start/end, claims[])
- `revenue_licenses` / `emission_tests` (vehicle_id, issue/expiry, certificate_url)
- `mileage_log` (vehicle_id, date, mileage, source) — backbone for fraud detection & health score
- `share_links` (vehicle_id, issued_by, scope JSON, expires_at, token, view_count)
- `timeline_posts` (vehicle_id, type, payload, visibility, created_at) — feed entries
- `notifications` (user_id, type, due_date, status)
- `audit_log` (entity, entity_id, action, actor_id, hash_prev, hash_self, timestamp) — tamper-evident chain

---

## 5. Phased Implementation Plan

### Phase 0 — Foundations
**Goal:** Architecture, auth, and schema in place before any feature work.
- Monorepo setup (API, ML service, web, mobile)
- PostgreSQL schema migration tooling (Prisma or Drizzle)
- JWT + OAuth auth flows, RBAC middleware
- CI/CD pipeline, Docker Compose for local dev
- Core entity CRUD: `users`, `vehicles`, `ownership_history`

### Phase 1 — Vehicle Profile & Document Vault (MVP)
**Goal:** A working personal record-keeping app, no AI yet.
- Vehicle profile creation/edit, cover photo upload
- Document vault: upload to S3, manual metadata entry (no OCR yet)
- Manual service/insurance/license record entry
- Basic timeline view (chronological list, not yet "feed"-styled)
- Smart notifications: BullMQ scheduled reminders for renewals
- QR code generation for profile (static, full-detail share — sharing scopes come in Phase 3)

### Phase 2 — AI Document Scanner (OCR Pipeline)
**Goal:** Remove manual data entry friction.
- FastAPI OCR microservice; BullMQ job dispatch from core API on upload
- OCR engine choice: AWS Textract or Google Vision API for speed-to-ship; evaluate PaddleOCR/Tesseract for cost reduction later
- Sri Lankan gov documents (revenue license, registration cert) are heavily templated — worth building **anchor/template-based field extraction** (fixed-position regions + OCR) rather than relying purely on generic OCR, since layouts are consistent
- Confidence scoring per extracted field; low-confidence fields routed to a human-review/correction UI
- Auto-populate `documents.extracted_fields`, propagate to relevant entity tables on confirmation

### Phase 3 — Social/Sharing Layer
**Goal:** This is the "Instagram" differentiator.
- `share_links`: owner selects scope (which record categories visible), expiry, single-use vs. multi-view
- Buyer-facing share-link viewer (web, no login required, token-based)
- Timeline restyled as a feed: visual cards per event type (service, mileage milestone, ownership change, accident)
- Verified badge logic: badge awarded only when a record is corroborated by a second party (garage submission, insurer submission) rather than self-entry
- Co-owner access (multiple `users` linked to one vehicle with shared edit rights)
- Ownership transfer workflow: outgoing owner initiates, incoming owner claims, history archived not deleted

### Phase 4 — AI Insights Engine
**Goal:** The features that make Riya feel intelligent, not just a filing cabinet.
- **Vehicle Health Score:** v1 = weighted rule-based formula (mileage, age, service frequency, accident count); v2 = regression model once enough data accumulates across vehicles
- **Resale Value Prediction:** gradient boosting (XGBoost/LightGBM) trained on vehicle attributes + market comparables. Market comparables likely need scraped/aggregated listing data (e.g. riyasewana.com-style sources) — **flag for legal review**: check site ToS, prefer official partnership/API access over scraping where possible, respect robots.txt and rate limits
- **Predictive Maintenance:** v1 = mileage/time-threshold rules per service type (oil change every X km, etc.); v2 = survival-analysis style modeling per component as historical data grows
- **Fraud Detection:** anomaly detection over `mileage_log` (e.g. isolation forest or simple statistical thresholding on mileage deltas) to flag odometer rollback; gap detection in service record continuity; this maps directly onto anomaly detection / random forest material from your SLIIT coursework — same techniques, applied use case

### Phase 5 — Garage / Insurer / Business Integrations
**Goal:** Third-party data sources reduce reliance on manual/self-reported entries (and feed the verified-badge system).
- Garage partner portal (web): garages push service records directly, tied to their verified business account
- Insurance company integration: policy/claims auto-sync
- Business accounts: dealers, leasing companies, multi-vehicle fleet view

### Phase 6 — Marketplace & Monetization
**Goal:** Revenue layer from the original proposal, built on top of the trust infrastructure above.
- Marketplace listing flow — listing automatically attaches a verified share-link snapshot
- Payment integration for premium tier (local gateway, e.g. PayHere) and marketplace commission
- Freemium gating: AI insights, valuation, predictive maintenance, extended storage behind premium

### Phase 7 — AI Vehicle Assistant
**Goal:** Natural-language access to a vehicle's own data.
- Claude API integration, RAG-grounded against that specific vehicle's structured records only (no general web knowledge needed)
- Handles: renewal due dates, valuation queries, health status, "what's coming up for my car"
- AI Vehicle Summary: on-demand plain-language report generated from full record set (useful both for owners and for buyers viewing a shared profile)


### Phase 8 — Government Integration (Future / Stretch)
- DMT registration verification (pending data-access agreements)
- Revenue license & emission testing system integration
- This phase is dependent on external government API availability — treat as roadmap intent rather than a committed sprint

---

## 6. ML/AI Component Summary

| Component | Phase | Approach (v1 → v2) |
|---|---|---|
| Document OCR | 2 | Template-anchored extraction + cloud OCR → fine-tuned model for local document formats |
| Vehicle Health Score | 4 | Weighted rule-based formula → learned regression model |
| Resale Valuation | 4 | Comparable-based estimate → gradient boosting (XGBoost/LightGBM) |
| Predictive Maintenance | 4 | Threshold rules per service type → time-series/survival model |
| Fraud/Anomaly Detection | 4 | Statistical thresholding on mileage deltas → isolation forest / learned anomaly model |
| AI Assistant | 5 | Claude API + RAG over vehicle's own record set |

---

## 7. Privacy, Security & Compliance Notes

- **No public/global vehicle search.** Discovery only through owner-issued, scoped, time-limited share links — core to avoiding theft-targeting and stalking risks inherent in a fully "public profile" model.
- Field-level visibility control on every share link (owner decides exactly what a buyer sees: e.g. service + accident history, but not full name/address).
- Encrypt documents at rest (S3 SSE) and sensitive fields in Postgres (e.g. pgcrypto for chassis/engine numbers if treated as sensitive).
- Tamper-evident audit log (`audit_log` hash-chaining, not literal blockchain) for ownership transfers and verified-record changes — gives you a defensible "this record wasn't silently edited" guarantee without the overhead of a real distributed ledger.
- Sri Lanka's Personal Data Protection Act (PDPA No. 9 of 2022) applies — design consent capture and data-retention/deletion flows with this in mind from Phase 0, not retrofitted later.

---

## 8. Additional Feature Backlog (beyond the original proposal)

- **Multi-vehicle "garage view"** for owners with more than one vehicle (account-switcher UX, fleet-style summary for dealers/leasing companies)
- **Garage/mechanic ratings & reviews** — builds trust in the garage partner network, Yelp-style but scoped to verified service interactions only
- **Renewal streaks / responsible-ownership badges** — light gamification to encourage on-time renewals and consistent service logging (kept private/optional, not a public leaderboard, to avoid turning vehicle upkeep into unhealthy social comparison)
- **Dealer/marketplace embed badge** — API for third-party used-car marketplaces to embed a "Riya Verified" badge linking to a scoped share profile

---

## 9. Open Questions for Next Planning Pass

- OCR vendor choice: cloud API (faster ship, ongoing per-document cost) vs. self-hosted (PaddleOCR/Tesseract, more upfront engineering, cheaper at scale)?
- Market-comparable data for resale valuation: scraping vs. partnership/licensed data feed — needs a legal-feasibility check before Phase 4 starts
- Mobile-first vs. web-first rollout order for MVP (Phase 1)?
- Garage/insurer onboarding: self-serve signup vs. manual partner vetting at launch?
