import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static site
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

// SQLite DB (file stored in server/feedback.sqlite)
const dbPath = path.join(__dirname, "feedback.sqlite");
const db = new Database(dbPath);

// Initialize table
db.exec(`
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    stakeholder TEXT NOT NULL,
    org TEXT,
    country TEXT,
    use_case TEXT,
    rating_overall INTEGER NOT NULL,
    rating_usability INTEGER NOT NULL,
    rating_trust INTEGER NOT NULL,
    priority TEXT NOT NULL,          -- JSON string
    comments TEXT,
    risks TEXT,
    recommendations TEXT,
    email TEXT
  );
`);

app.post("/api/feedback", (req, res) => {
  try {
    const {
      stakeholder,
      org,
      country,
      use_case,
      rating_overall,
      rating_usability,
      rating_trust,
      priority,
      comments,
      risks,
      recommendations,
      email
    } = req.body || {};

    // Minimal validation
    if (!stakeholder) return res.status(400).json({ error: "stakeholder required" });

    const ro = Number(rating_overall);
    const ru = Number(rating_usability);
    const rt = Number(rating_trust);

    if (![ro, ru, rt].every(n => Number.isInteger(n) && n >= 1 && n <= 5)) {
      return res.status(400).json({ error: "ratings must be integers 1..5" });
    }

    const pr = Array.isArray(priority) ? priority : [];
    if (pr.length === 0) return res.status(400).json({ error: "select at least one priority area" });

    const stmt = db.prepare(`
      INSERT INTO feedback
      (created_at, stakeholder, org, country, use_case,
       rating_overall, rating_usability, rating_trust,
       priority, comments, risks, recommendations, email)
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      new Date().toISOString(),
      stakeholder,
      org || "",
      country || "",
      use_case || "",
      ro, ru, rt,
      JSON.stringify(pr),
      comments || "",
      risks || "",
      recommendations || "",
      email || ""
    );

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "server error" });
  }
});

app.get("/api/admin/feedback", (_req, res) => {
  try {
    const stmt = db.prepare(`SELECT * FROM feedback ORDER BY datetime(created_at) DESC`);
    const rows = stmt.all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Skyline feedback site running on http://localhost:${PORT}`));
