# Student Notes + Scratchpad Feature

## Goal
Add a full note-taking system with Tiptap rich text editor across the student portal.

## Tech
- **Editor**: Tiptap (`@tiptap/react`) — rich text, headless, React-first
- **Storage**: PostgreSQL via Prisma (new `Note` model)
- **API**: Express module at `/api/notes`

## Packages to Install
```
@tiptap/react @tiptap/pm @tiptap/starter-kit
@tiptap/extension-placeholder @tiptap/extension-typography
@tiptap/extension-highlight @tiptap/extension-character-count
```

---

## Phase 1: Database

### Prisma Model — `Note`
```
model Note {
  id        String   @id @default(cuid())
  userId    String
  courseId  String
  moduleId  String?                     // null = general note, set = module scratchpad
  title     String   @default("")
  body      String   @default("")       // HTML from Tiptap
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id])
  course    Course   @relation(fields: [courseId], references: [id])

  @@index([userId])
  @@index([userId, courseId])
}
```

Add `notes Note[]` to `User` model.

---

## Phase 2: API Module

### `src/modules/notes/notes.service.ts`
- `list(userId, courseId?)` — Get all notes (optionally filtered by course)
- `get(id)` — Get single note
- `create(data)` — Create note (userId, courseId, moduleId?, title, body)
- `update(id, data)` — Update note
- `delete(id)` — Delete note
- `upsertScratchpad(userId, courseId, moduleId, body)` — One scratchpad per module per user

### `src/modules/notes/notes.controller.ts`
Wire HTTP → service, extract `req.user.id` from `requireAuth`.

### `src/modules/notes/notes.routes.ts`
```
GET    /api/notes                    — list (query: ?courseId=)
GET    /api/notes/:id                — get one
POST   /api/notes                    — create
PATCH  /api/notes/:id                — update
DELETE /api/notes/:id                — delete
PUT    /api/notes/scratchpad          — upsert scratchpad (body: {courseId, moduleId, body})
```

Register in `index.ts`: `app.use('/api/notes', noteRouter)`

---

## Phase 3: Shared Tiptap Component

### `components/editor/RichEditor.tsx`
```tsx
interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  editable?: boolean;
  minHeight?: string;
}
```

Extensions: StarterKit (bold, italic, headings, lists, blockquote, code), Placeholder, Typography, Highlight, CharacterCount.

Minimal toolbar: bold, italic, heading toggle, bullet list, ordered list, blockquote.

---

## Phase 4: Standalone Notes Page

### `app/student/notes/page.tsx`
Route: `/student/notes`

Layout (StudentPortalShell wrapper):
- **Left sidebar**: Course filter dropdown (list enrolled courses + "All Courses")
- **Right area**:
  - Stats bar + "New Note" button
  - Note cards grid (course badge, title, HTML preview stripped to text, date)
  - Click card → expand with full RichEditor for editing
  - Delete button per card

API calls:
- `GET /api/notes` (and `?courseId=X` when filtered)
- `POST /api/notes`
- `PATCH /api/notes/:id`
- `DELETE /api/notes/:id`

---

## Phase 5: Sidebar Navigation

### `components/Sidebar.tsx`
Add "My Notes" before "Support" in `growthItems`:
```tsx
{ label: "My Notes", href: "/student/notes", icon: IconNotes },
```

---

## Phase 6: CourseContentView Upgrades

### A) "Notes" Rail Tab — Upgrade to Tiptap + API
- Replace plain textarea title+body with RichEditor component
- Fetch notes from `GET /api/notes?courseId=X` on mount
- Create/update/delete via API instead of in-memory state
- Sidebar: list of notes with title, preview, date
- Main area: RichEditor for viewing/editing

### B) "Editor" Rail Tab → Scratchpad
- Replace fake code editor with Tiptap-based scratchpad
- On module select: `GET /api/notes?courseId=X&moduleId=Y` (get scratchpad)
- Auto-save 2s debounce via `PUT /api/notes/scratchpad`
- Shows heading "Scratchpad — {Module Title}"
- "Saved ✓" / "Saving..." indicator
- Empty state: placeholder text "Write your notes for this lesson..."

---

## Implementation Order
1. Install Tiptap
2. Prisma schema + migration
3. API module
4. RichEditor component
5. Standalone notes page
6. Sidebar nav update
7. CourseContentView Notes tab
8. CourseContentView Scratchpad tab
