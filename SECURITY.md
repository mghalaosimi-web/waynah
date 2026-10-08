# 🛡️ WAYNAH Security Policy & Controls Specification

> **Platform Identity**: WAYNAH / وَيْنَه؟  
> **Lead Architecture**: M.GH.AL  
> **Document Status**: Production Security Policy  

---

## 1. Security Overview

**WAYNAH / وَيْنَه؟** implements defense-in-depth security controls across the API gateway, database queries, authentication flows, and administrative moderation endpoints.

Security controls are verified by integration test suites (`apps/api/tests/security.test.ts` and `apps/api/tests/rbac.test.ts`).

---

## 2. Core Security Controls

### A. Role-Based Access Control (RBAC)
- Fine-grained permission keys scoped per domain action (`place.read`, `place.create`, `admin.audit.read`, `admin.branch_claims.review`, `admin.duplicates.manage`).
- Contextual identity actor (`Actor`) attached to every API request context.
- System ingestion endpoints protected via system API key authentication (`ingestionApiKey`).

### B. Session & Token Hardening
- Stateful user session tokens stored in the PostgreSQL database (`Session` model with `token`, `expiresAt`, `userId`).
- Token values transported via HTTP `Authorization: Bearer <token>`, `X-API-Key` header, or `waynah_session` HTTP cookie.

### C. Persistent Security Audit Logging
- Every administrative moderation action, authentication event, and branch claim review is recorded in `AuditLog`.
- Password hashes, session tokens, and security credentials are strictly sanitized before audit persistence.

### D. API Gateway & Transport Security
- **Security Headers (`securityHeadersMiddleware`)**: Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, and Content Security Policy headers.
- **CORS Protection**: Restricted origin validation for browser clients.
- **Safe Error Handler**: Global API error handler prevents leaking internal database stack traces or infrastructure paths to public clients.

### E. Data Integrity & SQL Injection Prevention
- All relational database interactions use **Prisma ORM** parameterized queries.
- Raw PostGIS spatial queries (`ST_Covers`, `ST_MakePoint`, `ST_DWithin`) use bound parameters.

---

## 3. Reporting Vulnerabilities

If you discover a security vulnerability within the WAYNAH platform, please report it responsibly by contacting the maintainer via GitHub:

- **GitHub Repository**: [https://github.com/mghalaosimi-web/waynah](https://github.com/mghalaosimi-web/waynah)
- **Maintainer Identity**: M.GH.AL (Mohammed Ghaleb AL-AOSIMI)

---

<div align="center">
<b>WAYNAH Security Policy · Verified Controls</b>
</div>
