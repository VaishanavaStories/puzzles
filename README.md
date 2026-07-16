# Crossword Challenge!

A mobile-friendly crossword puzzle app built with Vue 3 and Supabase. Kids solve crossword puzzles, and admins can create new crosswords, view submissions, and export scores.

## Features

### Public
- Dynamic crossword grid that adapts to screen size (28–36px cells)
- Keyboard navigation between cells with auto-direction switching
- Answer validation with correct (green) and wrong (red) highlights
- Confirmation modal before submission
- Toast alerts for errors and success messages

### Admin
- Secure login (`/admin`)
- Dashboard with cards for creating crosswords and viewing submissions
- **Create Crossword** — enter a name, clues, and answers; uses `crossword-layout-generator` to auto-layout the grid
- **Submissions** — filter by crossword, view each kid's score (word-level: all-or-nothing per word), click to see their filled grid in a read-only modal
- **Export to Excel** — download submissions as `.xlsx` with Name, Email, Score, and Submission Time
- Logout from any admin page

## Tech Stack

- **Frontend:** Vue 3 + Vite
- **Backend:** Supabase (PostgreSQL)
- **Testing:** Vitest + @vue/test-utils + jsdom (25 tests)

## Database Tables

```sql
-- Crossword puzzles
create table public.crossword_qns (
  created_at  timestamp with time zone not null default (now() at time zone 'utc'),
  qns_json    text not null,
  qns_id      uuid not null default gen_random_uuid(),
  crossword_name text,
  constraint crossword_qns_pkey primary key (qns_id),
  constraint crossword_qns_questionsJson_key unique (qns_json)
);

-- Kid submissions
create table public.crosssword_submissions (
  submission_id uuid not null default gen_random_uuid(),
  qn_id         uuid references public.crossword_qns(qns_id),
  kid_name      text,
  kid_email_id  text,
  ans_json      jsonb,
  created_at    timestamp with time zone not null default (now() at time zone 'utc'),
  constraint crosssword_submissions_pkey primary key (submission_id)
);

-- Admin users
create table public.admin_users (
  id        uuid not null default gen_random_uuid(),
  user_name text,
  password  text,
  constraint admin_users_pkey primary key (id)
);
```

RLS policies: `SELECT USING (true)` on `admin_users` and `crosssword_submissions`.

## Getting Started

```bash
npm install
npm run dev
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
src/
  components/
    CrosswordGrid.vue          # Grid rendering, cell sizing, keyboard nav
    CrosswordPuzzle.vue        # Puzzle page: fetch, fill, validate, submit
    AdminLogin.vue             # Admin login page
    AdminDashboard.vue         # Dashboard with nav cards
    AdminSubmissions.vue       # View submissions, grid modal, Excel export
    CreateCrossword.vue        # Create crossword form with layout generator
    __tests__/
      CrosswordGrid.test.js    # 12 grid tests
      CrosswordPuzzle.test.js  # 13 puzzle tests
  router/index.js              # Routes: /puzzle/:id, /admin, /dashboard, /submissions, /create
  supabaseClient.js            # Supabase client init
  style.css                    # Global resets
  test-setup.js                # Vitest setup (ResizeObserver polyfill)
```

## License

MIT
