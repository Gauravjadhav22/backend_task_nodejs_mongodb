import { Request, Response, NextFunction } from "express";

export const validateCreatePost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tags = JSON.parse(req.body.tags);
    if (!Array.isArray(tags)) {
      throw new Error("Tags should be an array");
    }
    next();
  } catch (error) {
    return res.status(400).json({ message: "Tags should be an valid array" });
  }
};
