import { IPost, Post } from "../models/post";
import { Request, Response, NextFunction } from "express";
import Tag from "../models/tag";
import { Types } from "mongoose";
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

    return res.status(500).json({ message: "something went wrong" });
  }
};
const createPost = async (req: Request, res: Response) => {
  try {
    const tagIds = [];
    for (const tagName of req.body.tags || []) {
      let tag = await Tag.findOne({ name: tagName });
      if (!tag) {
        tag = new Tag({ name: tagName });
        await tag.save();
      }
      tagIds.push(tag?._id);
    }
    const payload = req.body as IPost;
    const newPost = new Post({
      ...payload,
      tags: tagIds,
    });

    // Save the new post
    await newPost.save();
    return res.json(newPost).status(201);
  } catch (error) {
    console.log(error);

    return res.status(500).json({ message: "something went wrong" });
  }
};

export { createPost, getPosts };
