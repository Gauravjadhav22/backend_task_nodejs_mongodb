import { IPost, Post } from "../models/post";
import { Request, Response, NextFunction } from "express";
import Tag from "../models/tag";
import { Types } from "mongoose";
import { v2 as cloudinary } from "cloudinary";

interface QueryParams {
  sort?: string;
  sortBy?: string;
  page?: string;
  limit?: string;
  keyword?: string;
  tag?: string;
}
interface Query {
  $or?: Array<{ [key: string]: { $regex: RegExp } }>;
  tags?: { $in: string[] };
}
interface IPopulateOptions {
  path: string;
  select: string;
}
const allowedQueryKeys: string[] = [
  "sort",
  "sortBy",
  "page",
  "limit",
  "keyword",
  "tag",
];

const getPosts = async (req: Request, res: Response) => {
  try {
    const unauthorizedKeys = Object.keys(req.query).filter(
      (key) => !allowedQueryKeys.includes(key)
    );
    if (unauthorizedKeys.length > 0) {
      return res
        .status(400)
        .json({ message: "Bad request: Unauthorized query parameters" });
    }
    const queryParams = req.query as QueryParams;

    const { sort, sortBy, page, limit, keyword, tag } = queryParams;

    const pipeline: any[] = [];

    // Match stage for filtering
    const matchStage: any = {};
    if (keyword) {
      matchStage.$or = [
        { title: { $regex: new RegExp(keyword, "i") } },
        { desc: { $regex: new RegExp(keyword, "i") } },
      ];
    }

    if (sort && sortBy) {
      const sortOrder = sort === "asc" ? 1 : -1;
      pipeline.push({ $sort: { [sortBy]: sortOrder } });
    }

    // Add pagination stages
    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: parseInt(limit) });
    }

    pipeline.push({
      $lookup: {
        from: "tags",
        localField: "tags",
        foreignField: "_id",
        as: "tags",
      },
    });
    // pipeline.push({ $unwind: "$tags" });

    if (tag) {
      pipeline.push({
        $match: {
          "tags.name": tag,
        },
      });
    }
    pipeline.push({
      $project: {
        _id: 1,
        title: 1,
        desc: 1,
        image: 1,
        tags: "$tags.name",
      },
    });
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }
    // Execute the aggregation pipeline
    const posts = await Post.aggregate(pipeline);

    res.status(200).json({
      data: posts,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      totalElements: posts.length,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};
const createPost = async (req: Request, res: Response) => {
  try {
    const tagIds = [];
    let tags = JSON.parse(req.body.tags);

    for (const tagName of tags || []) {
      let tag = await Tag.findOne({ name: tagName });
      if (!tag) {
        tag = new Tag({ name: tagName });
        await tag.save();
      }
      tagIds.push(tag?._id);
    }
    const imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      const uploadPromises = req.files.map((file, index) => {
        return new Promise<string>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "nodejsTask",
              use_filename: false,
              unique_filename: true,
              overwrite: false,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          );
          stream.end(req.files[index].buffer);
        });
      });

      const results = await Promise.all(uploadPromises);
      imageUrls.push(...results);
    } else {
      return res.status(400).json({ message: "Image file is required" });
    }
    const payload = {
      title: req.body.title,
      desc: req.body.desc,
      image: imageUrls,
      tags: tagIds,
    } as IPost;

    const newPost = new Post(payload);

    // Save the new post
    await newPost.save();
    return res.status(201).json(newPost);
  } catch (error) {
    console.log(error);

    return res.status(500).json({ error: error.message });
  }
};

export { createPost, getPosts };
