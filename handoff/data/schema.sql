-- Cloudflare D1 (SQLite). Vorschlag, mit Drizzle abbilden. Zeiten als ISO-Text, Daten als YYYY-MM-DD.
CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, first_name TEXT NOT NULL, last_name TEXT NOT NULL, class_id TEXT REFERENCES classes(id), role TEXT NOT NULL DEFAULT 'student', created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE classes (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, program TEXT, class_teacher TEXT);
CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at TEXT NOT NULL);
CREATE TABLE subjects (code TEXT PRIMARY KEY, name TEXT NOT NULL, short TEXT NOT NULL);
CREATE TABLE teachers (code TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE periods (n INTEGER PRIMARY KEY, start_time TEXT NOT NULL, end_time TEXT NOT NULL);

-- Stundenplan: Snapshot aus dem Import. source + external_id machen den Import wiederholbar (Upsert).
CREATE TABLE lessons (id TEXT PRIMARY KEY, class_id TEXT NOT NULL REFERENCES classes(id), date TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, subject_code TEXT REFERENCES subjects(code), teacher_code TEXT, room TEXT, state TEXT NOT NULL DEFAULT 'normal' CHECK (state IN ('normal','room_changed','cancelled','sol')), original_room TEXT, source TEXT NOT NULL DEFAULT 'mock', external_id TEXT, UNIQUE (source, external_id));
CREATE INDEX lessons_class_date ON lessons (class_id, date);
CREATE TABLE import_runs (id TEXT PRIMARY KEY, source TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, ok INTEGER, lessons INTEGER, error TEXT);

CREATE TABLE exams (id TEXT PRIMARY KEY, class_id TEXT NOT NULL, subject_code TEXT NOT NULL, title TEXT NOT NULL, date TEXT NOT NULL, weight REAL NOT NULL DEFAULT 1, semester INTEGER NOT NULL, class_average REAL);
CREATE TABLE grades (id TEXT PRIMARY KEY, exam_id TEXT NOT NULL REFERENCES exams(id), user_id TEXT NOT NULL REFERENCES users(id), value REAL NOT NULL CHECK (value BETWEEN 1 AND 6), UNIQUE (exam_id, user_id));

CREATE TABLE absences (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), date TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('open','sent','excused','unexcused')), reason TEXT, note TEXT, due_date TEXT, attachment_key TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE absence_lessons (absence_id TEXT NOT NULL REFERENCES absences(id), period INTEGER NOT NULL, subject_code TEXT, PRIMARY KEY (absence_id, period));

CREATE TABLE documents (id TEXT PRIMARY KEY, grp TEXT NOT NULL, title TEXT NOT NULL, file_type TEXT NOT NULL, size_bytes INTEGER, note TEXT, r2_key TEXT, updated_at TEXT);
CREATE TABLE links (id TEXT PRIMARY KEY, grp TEXT NOT NULL, title TEXT NOT NULL, sub TEXT, url TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0);
CREATE TABLE news (id TEXT PRIMARY KEY, title TEXT NOT NULL, teaser TEXT, body_md TEXT, author TEXT, published_at TEXT NOT NULL, pinned INTEGER NOT NULL DEFAULT 0, document_id TEXT);
CREATE TABLE news_read (news_id TEXT NOT NULL, user_id TEXT NOT NULL, PRIMARY KEY (news_id, user_id));
CREATE TABLE notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, kind TEXT NOT NULL, title TEXT NOT NULL, body TEXT, href TEXT, created_at TEXT NOT NULL, read_at TEXT);
CREATE TABLE settings (user_id TEXT PRIMARY KEY, theme TEXT NOT NULL DEFAULT 'system', n_timetable INTEGER NOT NULL DEFAULT 1, n_grades INTEGER NOT NULL DEFAULT 1, n_news INTEGER NOT NULL DEFAULT 1, n_absences INTEGER NOT NULL DEFAULT 1, n_email INTEGER NOT NULL DEFAULT 0);

-- SOL
CREATE TABLE sol_blocks (id TEXT PRIMARY KEY, class_id TEXT NOT NULL, n INTEGER NOT NULL, starts TEXT, ends TEXT);
CREATE TABLE sol_days (id TEXT PRIMARY KEY, block_id TEXT NOT NULL REFERENCES sol_blocks(id), date TEXT NOT NULL);
CREATE TABLE sol_tasks (id TEXT PRIMARY KEY, block_id TEXT NOT NULL REFERENCES sol_blocks(id), subject_code TEXT NOT NULL, code TEXT NOT NULL, title TEXT NOT NULL, minutes INTEGER NOT NULL, sharepoint_url TEXT, r2_key TEXT);
CREATE TABLE sol_progress (task_id TEXT NOT NULL, user_id TEXT NOT NULL, percent INTEGER NOT NULL DEFAULT 0 CHECK (percent BETWEEN 0 AND 100), PRIMARY KEY (task_id, user_id));
CREATE TABLE sol_plan (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, sol_day_id TEXT NOT NULL REFERENCES sol_days(id), task_id TEXT NOT NULL REFERENCES sol_tasks(id), start_time TEXT NOT NULL, end_time TEXT NOT NULL, note TEXT);
CREATE TABLE sol_presence (id TEXT PRIMARY KEY, sol_day_id TEXT NOT NULL REFERENCES sol_days(id), teacher_code TEXT NOT NULL, subject_code TEXT, start_time TEXT NOT NULL, end_time TEXT NOT NULL, room TEXT);
CREATE TABLE sol_portfolio (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, sol_day_id TEXT NOT NULL REFERENCES sol_days(id), check_in TEXT, check_out TEXT, updated_at TEXT, UNIQUE (user_id, sol_day_id));
