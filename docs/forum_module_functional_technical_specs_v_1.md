# Forum Module – Functional & Technical Specification (v1)

---

## 1) Purpose & Goals

Create a modern, secure, and scalable forum inside the  portal where partners and the public can:

- Post **questions**, **discussions**, **announcements**.
- Reply with messages, mark answers as **accepted**, and upvote helpful content.
- Upload **documents** (PDF, DOCX, XLSX, images) and embed them contextually.
- Discover content via search, tags, categories, and filters.
- Receive **notifications** (in‑app + email) for mentions, replies, and watched topics.
- Support moderation, reporting, and audit trails to keep the space safe and high‑signal.

The forum will be tightly integrated with existing user accounts and organization/partner profiles.

---

## 2) User Types & Roles

- **Visitor (Public/Unauthenticated)**: Read public categories & topics, search; cannot post. (Config switch to allow sign‑up.)
- **Registered User (Public)**: Create/read/update/delete own posts; upload attachments; vote; report content; follow tags.
- **Partner Member**: Same as Registered, plus org badges, private partner‑only spaces, and ability to post under org identity (optional toggle).
- **Moderator**: Edit/lock/move/merge topics, delete content, moderate queues, handle reports, manage tags.
- **Admin**: All moderator powers + manage categories, permissions, workflows, settings, storage, retention.

> Optional: **Trust Levels** (0–4) to unlock capabilities as users contribute (rate limits loosen, links/attachments enabled, wiki posts, etc.).

---

## 3) Information Architecture

- **Spaces**
  - **Public Forum**: visible to all; good for general questions, community support, announcements.
  - **Partners’ Lounge** *(private)*: partner‑only categories (by org membership or role).
  - **Working Groups** *(invite‑only)*: project or grant‑specific discussions, file sharing.
- **Categories** (top‑level) → **Sub‑categories** → **Topics** (threads)
- **Topic Types**: Discussion, Q&A, Announcement, Poll
- **Tags**: cross‑cutting labels (e.g., *grants, reporting, MEL, finance, Kenya, Ethiopia, policy*)
- **Content Types**: Topic, Reply, Comment on attachment, System note (moderation), Wiki post

---

## 4) Key Features

1. **Posting & Editing**
   - Rich text (Markdown + toolbar), @mentions, emojis, code blocks.
   - Draft autosave; preview; edit history with diffs.
2. **Q&A Mode**
   - Mark *Accepted Answer*; sort by votes/most recent/most viewed.
3. **Attachments & Embeds**
   - Upload PDFs, DOCX, XLSX, PPTX, images (PNG/JPG/SVG), ZIP (optional).
   - File size limit (default 20MB; admin‑configurable). Virus scan on upload.
   - Inline preview for PDFs/images; download with access checks.
4. **Search & Discovery**
   - Full‑text search across titles, bodies, and files (OCR optional later).
   - Filters: category, tag, status (open/answered/locked), author, date, has‑file.
5. **Subscriptions & Notifications**
   - Watch categories/topics/tags; per‑user digest (daily/weekly); instant email on mentions/replies.
6. **Moderation**
   - Report/flag flow; mod queue; bulk actions; move/merge/split topics; lock/close; shadow ban; IP/device logging.
7. **Reputation & Gamification (Phase 2)**
   - Upvotes/downvotes; badges; karma points; leaderboards per tag/category.
8. **Access Control**
   - Category‑level ACLs (view/post/reply/upload). Org‑scoped categories.
9. **Analytics & Insights**
   - Topic views, active users, CSAT on answers, resolution time, unanswered rate, top tags.
10. **Localization & Accessibility**

- i18n framework; ARIA‑compliant components; keyboard navigation.

---

## 5) Permissions Matrix (extract)

| Capability                 | Visitor | Registered | Partner | Moderator | Admin |
| -------------------------- | ------- | ---------- | ------- | --------- | ----- |
| View public                | ✓       | ✓          | ✓       | ✓         | ✓     |
| View partner lounges       | ✗       | ✗          | ✓       | ✓         | ✓     |
| Create topic               | ✗       | ✓          | ✓       | ✓         | ✓     |
| Reply                      | ✗       | ✓          | ✓       | ✓         | ✓     |
| Upload attachments         | ✗       | ✓          | ✓       | ✓         | ✓     |
| Tag management             | ✗       | ✗          | ✗       | ✓         | ✓     |
| Moderate content           | ✗       | ✗          | ✗       | ✓         | ✓     |
| Manage categories/settings | ✗       | ✗          | ✗       | ✗         | ✓     |

> Trust Level gates can further refine: link posting, multiple attachments, posting rate, etc.

---

## 6) Data Model (ERD overview)

```
User(id, name, email, role, org_id, avatar_url, trust_level, status, created_at)
Organization(id, name, type, logo_url, verified, created_at)
Category(id, parent_id, name, slug, visibility, description, order, acl_json)
Tag(id, name, slug, description)
Topic(id, category_id, author_id, type, title, body, is_locked, is_pinned, is_answered, views, votes, created_at, updated_at)
TopicTag(topic_id, tag_id)
Post(id, topic_id, author_id, body, is_answer, votes, created_at, updated_at)
Attachment(id, owner_user_id, topic_id, post_id, filename, mime, size_bytes, url, storage_key, virus_status, created_at)
Vote(id, user_id, target_type [topic|post], target_id, value [+1|-1], created_at)
Subscription(id, user_id, target_type [category|topic|tag], target_id, level [watch|mute|digest], created_at)
Report(id, reporter_id, target_type, target_id, reason, status, moderator_id, created_at, resolved_at)
Notification(id, user_id, type, payload_json, is_read, created_at)
AuditLog(id, actor_user_id, action, target_type, target_id, meta_json, ip, ua, created_at)

// Optional
Badge(id, name, icon, criteria_json)
UserBadge(user_id, badge_id, granted_at)
```

**Indexes**: `Topic(title, body [fulltext])`, `Post(body [fulltext])`, `Attachment(filename, mime)`, `Tag(name)`, `TopicTag(tag_id, topic_id)`, `Report(status)`, `Subscription(user_id)`, `Notification(user_id, is_read)`.

---

## 7) API Design (REST + Realtime)

**Base**: `/api/forum/v1`

- **Auth**: JWT (portal SSO). OAuth2 compatible. CSRF for browser flows.
- **Rate limits**: default 60 req/min/user; write ops stricter; bursts via token bucket.

### Core Endpoints (sample)

- `GET /categories` → list (ACL‑filtered)
- `POST /categories` (admin)
- `GET /topics?category_id&tag&search&status&sort&page`
- `POST /topics` (title, body, type, category\_id, tags[])
- `GET /topics/{id}` (includes first N posts, attachment summary)
- `PATCH /topics/{id}` (author/mod/admin)
- `POST /topics/{id}/lock` (mod)
- `POST /topics/{id}/tags` (mod)
- `GET /topics/{id}/posts?page`
- `POST /topics/{id}/posts` (body, attachments[])
- `POST /posts/{id}/accept` (topic author)
- `POST /vote` (target\_type, target\_id, value)
- `POST /attachments` (multipart; returns `attachment_id`, preview URL)
- `GET /attachments/{id}/download` (short‑lived signed URL)
- `POST /reports` (target\_type, target\_id, reason)
- `GET /moderation/queue` (mod)
- `POST /moderation/{id}/resolve` (mod/admin)
- `GET /subscriptions` | `POST /subscriptions` | `DELETE /subscriptions/{id}`
- `GET /notifications` | `POST /notifications/{id}/read`
- `GET /search?q&filters...` (ES/OpenSearch proxy)

### Realtime (WebSockets)

- Channel: `forum:topic:{id}` events: `post.created`, `post.updated`, `topic.updated`, `typing`, `reaction`
- Channel: `forum:user:{id}` events: `notification.created`

---

## 8) File Storage & Documents

- **Storage**: S3‑compatible (MinIO, AWS S3, or GCS). Foldering by `org_id/year/month`.
- **Security**: Private bucket; downloads via **short‑lived signed URLs** (2–10 min).
- **Antivirus**: ClamAV/Lambda scan; block/quarantine `virus_status = infected`.
- **Preview**: Server‑side PDF render (first page thumbnail) + in‑browser PDF viewer.
- **Limits**: Per‑file (e.g., 20MB default), per‑post total (e.g., 50MB), per‑user daily cap (e.g., 200MB). Configurable.
- **Types**: Allowed list; block executables; optional OCR for scanned PDFs later.

---

## 9) Moderation Workflow

1. User flags content ⇒ **Report** created.
2. Moderation Queue displays items with context & history.
3. Actions: Dismiss, Edit, Warn user (templated message), Hide, Delete, Shadow‑ban, Suspend.
4. **Appeals**: user can request review; mod notes stored in `AuditLog`.
5. **Auto‑moderation** (rules engine):
   - New users cannot post links or large attachments until TL ≥ 1.
   - Block posts with banned words/phrases; queue for mod review.
   - Reputation‑weighted spam detection (Bayesian/ML in Phase 2).

---

## 10) Security, Privacy, Compliance

- **AuthN/Z**: Portal SSO (JWT); role + org claims; per‑category ACL checks server‑side.
- **Transport**: HTTPS/TLS 1.2+ only; HSTS; secure cookies; SameSite.
- **Data**: PII minimization; encryption at rest for attachments; hashed passwords (Argon2/bcrypt) where applicable.
- **Abuse**: IP rate limiting, reCAPTCHA/Turnstile on sign‑up & first posts; device fingerprinting optional.
- **Logs**: Structured logs; SIEM export; immutable **AuditLog** of admin/mod actions.
- **Backups**: Daily DB snapshots; object storage lifecycle (versioning + retention policies).
- **Legal**: Clear ToS, Privacy Policy, and Content Guidelines; DMCA‑style takedowns; data retention (e.g., 36 months, configurable).

---

## 11) Notifications & Emails

- In‑app bell + counter; batch read.
- **Email**: mentions, replies, private space invitations, weekly digests.
- Templates with branding; per‑user granular preferences; per‑thread mute.
- Optional **SMS** alerts for partner‑critical categories (via Mobulk Africa).

---

## 12) Integrations

- **Portal SSO**: Reuse existing users; map `org_id` to partner lounge permissions.
- **Knowledge Base** (later): surface top answers into help center.
- **Analytics**: PostHog/Matomo; dashboard widgets inside Admin.
- **Search**: OpenSearch/Elasticsearch; fall back to DB full‑text for MVP.

---

## 13) UI/UX (React Frontend)

- **Layout**: Left sidebar (Spaces/Categories/Tags), center content, right rail (related topics, top contributors, rules).
- **Composer**: Floating editor with Markdown toolbar, attachment tray, drag‑drop upload, autosave, preview tab.
- **Topic View**: Sticky accepted answer; answer summary pill; filter by *answers only*; sort controls.
- **List View**: Dense cards with unread dot, tag chips, last activity, views, votes, attachment indicator.
- **User Profile**: Bio, org badge, stats, badges, recent posts, subscriptions.
- **Admin Console**: Category manager, tag manager, moderation queue, settings, analytics.
- **Accessibility**: Skip‑links; focus states; semantic headings; color‑contrast ≥ 4.5:1.

---

## 14) Tech Stack

- **Frontend**: React + TypeScript; state via RTK Query; WebSocket client; Tailwind; shadcn/ui; Markdown editor (TipTap/MDX hybrid).
- **Backend**: Node.js (NestJS or Express + Zod); PostgreSQL; Redis (queues, rate‑limits, websockets pub/sub); OpenSearch (optional).
- **Storage**: S3/MinIO; ClamAV; image/pdf preview service.
- **Infra**: Docker; Nginx; CI/CD (GitHub Actions); IaC (Terraform optional); autoscaling for WS nodes.

---

## 15) Performance & Scalability

- Pagination with keyset where possible; denormalized counts (views, replies) with periodic reconciliation.
- Caching: Redis for hot topic lists and user preferences; CDN for attachment downloads (signed).
- WebSocket sharding; graceful degradation to long‑polling for restricted networks.

---

## 16) Analytics KPIs

- New topics/day, replies/day, answer rate, median time‑to‑first‑response, median time‑to‑accepted, top tags, unresolved topics aging, active users, partner lounge activity, attachment bandwidth.

---

## 17) Admin Settings (config panel)

- File types/limits; virus scan required (on/off); OCR (on/off).
- Category ACLs and org mapping; trust‑level thresholds.
- Moderation rules; banned words; auto‑close after N days.
- Email templates & digests; SMS provider keys.
- Search index toggles; analytics opt‑in.

---

## 18) Migration & Seeding

- Create default categories: Announcements, General Discussion, Q&A, Resources; Partners’ Lounge; per‑country sub‑cats.
- Seed tags: grants, reporting, MEL, finance, policy, data, capacity‑building.
- Import existing FAQs as pinned wiki topics.

---

## 19) Phased Delivery

**MVP (4–6 weeks)**

- Public + partner spaces, categories, tags
- Topics, replies, attachments (with AV scan)
- Search (DB full‑text), notifications (in‑app + email)
- Moderation basics (reports, queue, delete/hide, lock)
- Admin settings (core), analytics (basic)

**Phase 2**

- OpenSearch, accepted answers, votes, badges, trust levels, working groups, OCR for PDFs, spam ML, SMS alerts, wiki posts, polls.

**Phase 3**

- Knowledge base export, leaderboards, advanced analytics, API for third‑party embedding, SSO federation with external communities.

---

## 20) Acceptance Criteria (MVP snapshot)

- Users can create topics with attachments; partners see private lounges; visitors read public content.
- Moderators can resolve a report and lock a topic.
- Email arrives on mention within 1 minute; digest can be configured and is sent on schedule.
- Attachments are scanned; infected files are blocked and logged.
- Search returns relevant results across titles & bodies in < 500 ms (p95) for 100k posts.

---

## 21) Risks & Mitigations

- **Spam/abuse** → Trust levels, rate limits, CAPTCHA, mod queue.
- **PII leakage in files** → Training & guidance, private buckets, DLP scans (Phase 2).
- **Storage costs** → Lifecycle policies, size caps, purge old previews.
- **Performance under load** → Caching, indices, async queues, WS scaling.

---

## 22) Build vs Buy (Quick Note)

- **Build** (spec above) → Deep integration, fine‑grained ACLs, custom workflows; more dev effort.
- **Buy/Integrate** (e.g., Discourse, Flarum) → Faster launch; may require SSO + theming + plugin dev; ACLs for partner lounges must be validated.

Recommendation: **Ship MVP in‑house** for tight portal integration, with clean interfaces so we could later swap in a managed forum engine if needed.

---

## 23) Wireframe Sketch (textual)

- **Forum Home**: [Left] Spaces/Categories/Tags | [Center] Topic List (tab: Latest/Top/Unanswered) | [Right] Rules, Top Contributors, Trending Tags
- **Topic Page**: Title → Meta chips (category, tags, views, votes) → Accepted Answer (if any) → Posts list → Composer (reply)
- **Composer**: Title (for new topic), Body (Markdown), Attachments tray, Tag selector, Post button
- **Admin**: Tabs → Categories | Tags | Moderation | Settings | Analytics

---

## 24) Next Steps

1. Confirm **MVP scope & config defaults** (file limits, categories, trust thresholds).
2. Approve **UI library** and editor choice.
3. Kick off sprint planning with the module breakdown above.

— End of Spec —

