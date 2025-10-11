# 7) Role Taxonomy Alignment
Baseline roles for MVP, aligned with PRD and extended for clinic operations:
- Owner (Org-level administration, billing oversight)
- Admin (System administration, role/permission management)
- Manager (Clinic operations management, schedule oversight)
- Practitioner (Clinical documentation, scheduling, billing actions within scope)
- Assistant/Secretary (Front-desk operations, scheduling, patient intake)
- Patient (Portal, appointments, billing visibility)

Notes:
- PRD mentions Secretary and Substitute; Secretary maps to Assistant; Substitute will be implemented as Practitioner with temporary assignment flags.
- Permissions are enforced server-side via RBAC and mirrored in UI gates.
