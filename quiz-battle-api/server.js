const express = require("express");
const cors = require("cors");
const path = require("node:path");
const fs = require("node:fs");
const { randomUUID } = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const app = express();
const PORT = Number(process.env.PORT || 3001);
const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "quiz-battle.sqlite"));
db.exec("PRAGMA foreign_keys = ON;");
db.exec(`
  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    document TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    document TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quiz_slides (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    document TEXT NOT NULL,
    slide_order INTEGER NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_quizzes_created_at
    ON quizzes(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_quiz_slides_quiz_order
    ON quiz_slides(quiz_id, slide_order);
`);

app.use(cors());
app.use(express.json({ limit: "25mb" }));

function toRecord(row) {
  if (!row) return null;
  return { ...JSON.parse(row.document), _id: row.id };
}

function saveSlides(quizId, slides) {
  const insertSlide = db.prepare(
    "INSERT INTO quiz_slides (id, quiz_id, document, slide_order) VALUES (?, ?, ?, ?)"
  );

  return slides.map((slide, index) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    const document = { ...slide, quizId, createdAt: now, updatedAt: now };
    insertSlide.run(id, quizId, JSON.stringify(document), Number(slide.order ?? index + 1));
    return id;
  });
}

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Server OK", database: "SQLite" });
});

app.get("/api/test-insert", (req, res) => {
  try {
    const id = randomUUID();
    const document = { question: "Test Question", answer: "A", createdAt: new Date() };
    db.prepare("INSERT INTO questions (id, document) VALUES (?, ?)")
      .run(id, JSON.stringify(document));

    const data = db.prepare("SELECT id, document FROM questions ORDER BY rowid").all()
      .map(toRecord);
    res.json({ success: true, insertedId: id, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/test-data", (req, res) => {
  try {
    const data = db.prepare("SELECT id, document FROM questions ORDER BY rowid").all()
      .map(toRecord);
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/questions", (req, res) => {
  try {
    const questions = db.prepare("SELECT id, document FROM questions ORDER BY rowid").all()
      .map(toRecord);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/questions", (req, res) => {
  try {
    const id = randomUUID();
    const document = { ...req.body };
    delete document._id;
    db.prepare("INSERT INTO questions (id, document) VALUES (?, ?)")
      .run(id, JSON.stringify(document));
    res.json({ success: true, insertedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/quizzes", (req, res) => {
  try {
    const quizzes = db.prepare(
      "SELECT id, document FROM quizzes ORDER BY created_at DESC, rowid DESC"
    ).all().map(toRecord);
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/quizzes/:id", (req, res) => {
  try {
    const quiz = toRecord(db.prepare(
      "SELECT id, document FROM quizzes WHERE id = ?"
    ).get(req.params.id));

    if (!quiz) {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }

    const slides = db.prepare(
      "SELECT id, document FROM quiz_slides WHERE quiz_id = ? ORDER BY slide_order, rowid"
    ).all(req.params.id).map(toRecord);

    res.json({ ...quiz, slides });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/quizzes", (req, res) => {
  try {
    const { slides = [], ...quizData } = req.body || {};
    if (!Array.isArray(slides)) {
      return res.status(400).json({ success: false, error: "slides phải là một mảng" });
    }

    const quizId = randomUUID();
    const now = new Date().toISOString();
    const quiz = {
      ...quizData,
      slideCount: slides.length,
      createdAt: now,
      updatedAt: now,
    };

    db.exec("BEGIN");
    try {
      db.prepare("INSERT INTO quizzes (id, document, created_at) VALUES (?, ?, ?)")
        .run(quizId, JSON.stringify(quiz), now);
      const slideIds = saveSlides(quizId, slides);
      db.exec("COMMIT");

      res.json({
        success: true,
        insertedId: quizId,
        slideCount: slideIds.length,
        slideIds,
      });
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/api/questions/:id", (req, res) => {
  try {
    const row = db.prepare("SELECT document FROM questions WHERE id = ?")
      .get(req.params.id);
    if (!row) return res.json({ success: true, modifiedCount: 0 });

    const updated = { ...JSON.parse(row.document), ...req.body };
    delete updated._id;
    const result = db.prepare("UPDATE questions SET document = ? WHERE id = ?")
      .run(JSON.stringify(updated), req.params.id);
    res.json({ success: true, modifiedCount: Number(result.changes) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/questions/:id", (req, res) => {
  try {
    const result = db.prepare("DELETE FROM questions WHERE id = ?").run(req.params.id);
    res.json({ success: true, deletedCount: Number(result.changes) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`SQLite connected: ${path.join(dataDir, "quiz-battle.sqlite")}`);
  console.log(`Server running on ${PORT}`);
});
