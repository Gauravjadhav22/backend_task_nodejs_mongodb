import dotenv from "dotenv";
import express from "express";
import connectDb from "./db/connectDb";
import { createPost, getPosts } from "./controllers/postController";
import Tag from "./models/tag";
import { v2 as cloudinary } from 'cloudinary';
import upload from './middleware/fileUpload'; 
import { validateCreatePost } from "./middleware/validateCreatePost";



dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5500;
const MONGO_URI = process.env.MONGO_URI || "";

cloudinary.config({ 
  cloud_name: 'dwmm1r1ph', 
  api_key: process.env.CLOUDINARY_URL_API_KEY, 
  api_secret: process.env.CLOUDINARY_URL_API_SECRETE, 
});

// Log the configuration
console.log(cloudinary.config());

app.get("/health", (req, res) => {
  res.send("welcome to the app!..");
});

app.get("/posts", getPosts);
app.post("/post", upload.array('image', 10),validateCreatePost,createPost);
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
