import dotenv from "dotenv";
import express from "express";
import connectDb from "./db/connectDb";
import { createPost, getPosts } from "./controllers/postController";
import Tag from "./models/tag";

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5500;
const MONGO_URI = process.env.MONGO_URI || "";
app.get("/health", (req, res) => {
  res.send("welcome to the app!..");
});

app.get("/posts", getPosts);
app.post("/post", createPost);
app.get("/tags", async (req, res) => {
  try {
    const tags = await Tag.find();
    return res.status(200).json({ data: tags });
  } catch (error) {throw error}
});

app.listen(PORT, () => {
  console.log(`server is listening on ${PORT}`);
  connectDb(MONGO_URI)
    .then(() => console.log(`connected to db`))
    .catch((err) => console.log(err));
});
