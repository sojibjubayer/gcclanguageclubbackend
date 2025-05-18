const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Configuration
const uri =
  "mongodb+srv://tm-database:tIU9KyjaGtkfLqKq@cluster0.j998cjx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB!");

    const database = client.db("gcclanguageclub");
    const vocabularyCollection = database.collection("vocabularies");
    const usersCollection = database.collection("users");
    const sentenceCollection = database.collection("sentences");

    // GET VOCABULARIES

    app.get("/api/vocabulary", async (req, res) => {
      try {
        const lessonType = req.query.lessonType;
        const query = lessonType ? { lessonType } : {}; // Only filter if lessonType is provided
        const items = await vocabularyCollection.find(query).toArray();

        if (!items || items.length === 0) {
          return res.status(404).json({ message: "No vocabulary items found" });
        }

        res.status(200).json(items);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Server error" });
      }
    });
    // GET SENTENCES

    app.get("/api/sentences", async (req, res) => {
      try {
        const lessonType = req.query.sentenceType;
        const query = lessonType ? { lessonType } : {}; 
        const items = await sentenceCollection.find(query).toArray();
        if (!items || items.length === 0) {
          return res.status(404).json({ message: "No sentence found" });
        }

        res.status(200).json(items);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Server error" });
      }
    });

    // Vocabulary for manage
    app.get("/api/managevocabulary", async (req, res) => {
      try {
        const vocabularies = await vocabularyCollection.find().toArray();

        if (!vocabularies || vocabularies.length === 0) {
          return res.status(404).json({ message: "No vocabulary items found" });
        }

        res.status(200).json(vocabularies);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Server error" });
      }
    });

    // GET USERS endpoint
    app.get("/api/getusers", async (req, res) => {
      try {
        const users = await usersCollection.find().toArray();

        if (!users || users.length === 0) {
          return res.status(404).json({ message: "No users found" });
        }

        res.status(200).json(users);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Server error" });
      }
    });
    // Update user role
    app.put("/api/users/:id/role", async (req, res) => {
      const { id } = req.params;
      const { role } = req.body;

      if (!["admin", "user"].includes(role)) {
        return res.status(400).json({ error: "Invalid role value" });
      }

      try {
        const result = await usersCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { role } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: `User role updated to ${role}` });
      } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ error: "Server error" });
      }
    });

    app.put("/api/updatevocabulary/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = { ...req.body };

      // Remove _id if it exists to prevent error
      delete updatedData._id;

      try {
        const result = await vocabularyCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Vocabulary item not found" });
        }

        res.json({ message: "Vocabulary item updated successfully" });
      } catch (error) {
        console.error("Error updating vocabulary:", error);
        res.status(500).json({ error: "Server error" });
      }
    });

    // DELETE USER
    app.delete("/api/deleteuser/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const result = await usersCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "User deleted successfully" });
      } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Server error" });
      }
    });
    // DELETE VOCABULARY
    app.delete("/api/deletevocabulary/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const result = await vocabularyCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Vocabulary not found" });
        }

        res.json({ message: "Vocabulary deleted successfully" });
      } catch (error) {
        console.error("Error deleting vocabulary:", error);
        res.status(500).json({ error: "Server error" });
      }
    });

    // POST route to insert vocabulary
    app.post("/api/vocabulary", async (req, res) => {
      try {
        const result = await vocabularyCollection.insertOne(req.body);
        res
          .status(201)
          .json({ message: "Data inserted", id: result.insertedId });
      } catch (error) {
        console.error("Error inserting data:", error);
        res.status(500).json({ message: "Server error" });
      }
    });
    // POST route to insert Sentence
    app.post("/api/dailysentence", async (req, res) => {
      try {
        const result = await sentenceCollection.insertOne(req.body);
        res
          .status(201)
          .json({ message: "Data inserted", id: result.insertedId });
      } catch (error) {
        console.error("Error inserting data:", error);
        res.status(500).json({ message: "Server error" });
      }
    });

    // Registration Endpoint
    app.post("/api/register", async (req, res) => {
      const { name, mobile, country, password, role } = req.body;

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
          name,
          mobile,
          country,
          password: hashedPassword, // Save hashed password
          role,
        };

        const result = await usersCollection.insertOne(newUser);

        res.status(201).json({ message: "User registered successfully!" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });

    // LOGIN Endpoint
    app.post("/api/login", async (req, res) => {
      const { mobile, password } = req.body;

      try {
        const user = await usersCollection.findOne({ mobile });

        if (!user) {
          return res.status(400).json({ message: "User not found!" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return res.status(400).json({ message: "Invalid password!" });
        }

        // 3. Create JWT token
        const token = jwt.sign(
          { userId: user._id, mobile: user.mobile, role: user.role },
          process.env.JWT_SECRET, // Use a secure secret for signing the token
          { expiresIn: "1h" } // Set token expiry (e.g., 1 hour)
        );

        // 4. Send success response with token
        res.status(200).json({
          message: "Login successful",
          token, // Include the token in the response
          user: {
            id: user._id,
            name: user.name,
            mobile: user.mobile,
            country: user.country,
          },
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

run().catch(console.dir);
