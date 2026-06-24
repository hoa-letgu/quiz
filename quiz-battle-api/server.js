const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
//pivoyoh392@jctoto.com
//n6T!4#xwXCHa2V@
// MongoDB Atlas
const uri =
  "mongodb+srv://pivoyoh392_db_user:iu0nbRBF4nGbKPtr@cluster0.vhaitst.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

// Kết nối MongoDB
async function connectDB() {
  try {
    await client.connect();

    // Tên database
    db = client.db("english_exam");

    await db.command({ ping: 1 });

    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
  }
}

// API test
app.get("/", (req, res) => {
  res.json({ message: "Server OK" });
});

app.get("/api/test-insert", async (req, res) => {
  try {
    const result = await db.collection("questions").insertOne({
      question: "Test Question",
      answer: "A",
      createdAt: new Date(),
    });

    const data = await db.collection("questions").find({}).toArray();

    res.json({
      success: true,
      insertedId: result.insertedId,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
app.get("/api/test-data", async (req, res) => {
  try {
    const data = await db
      .collection("questions")
      .find({})
      .toArray();

    res.json(data);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Lấy tất cả câu hỏi
app.get("/api/questions", async (req, res) => {
  try {
    const questions = await db
      .collection("questions")
      .find({})
      .toArray();

    res.json(questions);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// Thêm câu hỏi
app.post("/api/questions", async (req, res) => {
  try {
    const result = await db
      .collection("questions")
      .insertOne(req.body);

    res.json({
      success: true,
      insertedId: result.insertedId,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// Cập nhật đáp án
app.put("/api/questions/:id", async (req, res) => {
  const { ObjectId } = require("mongodb");

  try {
    const result = await db.collection("questions").updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $set: req.body,
      }
    );

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// Xóa câu hỏi
app.delete("/api/questions/:id", async (req, res) => {
  const { ObjectId } = require("mongodb");

  try {
    const result = await db.collection("questions").deleteOne({
      _id: new ObjectId(req.params.id),
    });

    res.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

connectDB();