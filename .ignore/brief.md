# Product Brief – Physiotherapy Practice Management App (v2)

**Status**: Refined draft · **Scope**: Desktop‑first MVP, responsive for tablet/PC · **Source**: consolidated from provided PRD

---

## 1) Context & Vision

Unify the day‑to‑day operations of a physiotherapy practice in a simple, secure, and efficient application. The product **centralizes patient records**, **schedules and tracks sessions**, and **handles billing and payments**, while strictly respecting **health‑data privacy and compliance** (GDPR and certified health‑data hosting such as HDS or local equivalent).

## 2) Problem

Small practices often juggle disparate tools (spreadsheets, separate calendars, paper files). The result: high administrative time, billing errors, difficulty tracking plan‑of‑care progress, and compliance risk.

## 3) Objectives (SMART)

* **Efficiency**: Reduce administrative time by **≥30%** within 3 months of adoption.
* **Attendance**: Reduce missed appointments by **≥25%** via automated reminders.
* **Quality of care**: Ensure 100% of active patients have a **Treatment Plan** and **Initial Clinical Assessment** captured and up to date.
* **Compliance**: **Zero incidents** of data leakage; GDPR/HDS (or local equivalent) policies enforced.

## 4) Target Users & Personas

* **Independent Physiotherapist (MVP)**: manages patients, calendar, and billing.
* **Medical Secretary (future)**: admin operations with restricted permissions.
* **Patient (future)**: self‑service booking, document access, messaging, home exercise program.

## 5) MVP Scope (functional)

1. **Access & Security**: authentication, secure sessions, strong password policy. Single role **Owner/Practitioner** (clinic creator).
2. **Patient Records**: demographic/admin profile, conditions & allergies, referring physician, **document uploads**, visit history.
3. **Calendar & Appointments**: create/edit/cancel, day/week/month views, statuses (confirmed/cancelled/no‑show), **email reminders**.
4. **Treatment Plan & Clinical Assessment**: intake (history, pain, functional tests), goals per prescription; **automatic decrement** of remaining sessions.
5. **Sessions, Billing & Payments**: check‑in/out, **multi‑session invoices**, payment tracking (card/check/cash), outstanding balances.

## 6) Non‑Functional Requirements (MVP)

* **Performance**: responsive UI (target <200 ms TTI for critical UI flows; indicative goal).
* **Accessibility & Compatibility**: modern browsers; **desktop‑first**, responsive tablet support.

## 7) Out‑of‑Scope for MVP & Roadmap (post‑MVP)

* **Multi‑user & Advanced Roles**: user invites; roles such as Secretary/Assistant or Substitute; **MFA/2FA**; **audit log**.
* **Patient Portal**: online booking, document access, **home exercise program** (text/photo/video), **secure messaging**.
* **Accounting & Reporting**: dashboards (revenue, patients), expenses, accounting exports, **revenue sharing**.
* **Mobility**: native iOS/Android apps; **offline mode** with sync.
* **Telehealth**: secure video sessions; telehealth billing.
* **AI & IoT**: assistance with assessments, motion sensors, VR/AR for rehab.

## 8) UX/UI Principles

* **Simplicity first**: short workflows, domain language.
* **Calendar‑centric navigation**: the calendar is the entry point to session, invoice, and record.
* **Progressive disclosure**: show complex forms (assessment/plan) in sections to reduce cognitive load.
* **State & feedback**: clear statuses (appointment, invoice, payment), gentle confirmations.

## 9) Success Metrics (KPIs)

Administrative time per clinician per week; no‑show rate; average time from invoice to payment; assessment completion rate; clinician satisfaction (CSAT/NPS); compliance (audit pass rate).

## 10) Risks & Mitigations

* **Compliance (HDS/GDPR)**: select a certified health‑data host; conduct DPIA; encrypt data at rest/in transit; sign DPAs with vendors.
* **Adoption**: guided onboarding, built‑in assessment templates, CSV import of patients.
* **Scope creep**: versioned roadmap and strict MVP exit criteria.
* **Billing variability**: local billing rules differ → configurable parameters and documentation.

## 11) Assumptions & Dependencies

* Single‑practitioner clinic at start; stable internet; modern browser.
* Access to certified health‑data hosting and compliant transactional email provider.

## 12) Milestones (proposal)

* **W0–W2**: Discovery & validation with 2–3 pilot practices.
* **W3–W6**: Access & Patient Records.
* **W7–W10**: Calendar + reminders.
* **W11–W13**: Treatment Plan & Billing/Payments.
* **W14**: QA and Pilot Go/No‑Go; deployment preparation.

## 13) Acceptance Criteria (MVP examples)

* Create/edit a **patient** with attachments; search and open the patient’s history.
* Create an **appointment** from the calendar, receive an email reminder, mark as **completed**.
* Create a **treatment plan** linked to a prescription; remaining sessions auto‑decrement.
* Generate a **multi‑session invoice**, record a payment, and view outstanding balances.
* Create **Owner/Practitioner** account; secure session; auto logout on inactivity.

## 14) Next Steps

* Validate this brief with a reference clinician.
* Handoff to **@PM** to refine the PRD into prioritized epics/stories.
* Handoff to **@Architect** for the technical specification (security, data model, certified hosting, stack choices).
* Handoff to **@PO** for the execution checklist and backlog preparation.
