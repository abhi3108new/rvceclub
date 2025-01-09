const Posts = require("../models/postModel");
const Comments = require("../models/commentModel");
const Users = require("../models/userModel");

class APIfeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  paginating() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 9;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

const postCtrl = {
  createPost: async (req, res) => {
    try {
      const { content, images } = req.body;

      if (!images || images.length === 0) {
        return res.status(400).json({ msg: "Please add photo(s)." });
      }

      const newPost = new Posts({
        content,
        images,
        user: req.user._id,
      });

      await newPost.save();

      res.json({
        msg: "Post created successfully.",
        newPost: {
          ...newPost._doc,
          user: req.user,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server error. Please try again." });
    }
  },

  getPosts: async (req, res) => {
    try {
      if (!req.user || !req.user.following || !req.user._id) {
        return res.status(400).json({ msg: "Invalid user data." });
      }

      const userIds = [...req.user.following, req.user._id];
      const features = new APIfeatures(
        Posts.find({ user: { $in: userIds } }),
        req.query
      ).paginating();

      const posts = await features.query
        .sort("-createdAt")
        .populate("user", "avatar username fullname followers")
        .populate("likes", "avatar username fullname")
        .populate({
          path: "comments",
          populate: {
            path: "user likes",
            select: "-password",
          },
        });

      res.json({
        msg: "Success",
        result: posts.length,
        posts,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server error. Please try again." });
    }
  },

  updatePost: async (req, res) => {
    try {
      const { content, images } = req.body;

      const post = await Posts.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { content, images },
        { new: true }
      )
        .populate("user likes", "avatar username fullname")
        .populate({
          path: "comments",
          populate: {
            path: "user likes",
            select: "-password",
          },
        });

      if (!post) {
        return res.status(404).json({ msg: "Post not found." });
      }

      res.json({
        msg: "Post updated successfully.",
        newPost: {
          ...post._doc,
          content,
          images,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server error. Please try again." });
    }
  },

  likePost: async (req, res) => {
    try {
      const postExists = await Posts.findOne({
        _id: req.params.id,
        likes: req.user._id,
      });

      if (postExists) {
        return res.status(400).json({ msg: "You have already liked this post." });
      }

      const post = await Posts.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { likes: req.user._id } },
        { new: true }
      );

      if (!post) {
        return res.status(404).json({ msg: "Post not found." });
      }

      res.json({ msg: "Post liked successfully.", post });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server error. Please try again." });
    }
  },

  unLikePost: async (req, res) => {
    try {
      const post = await Posts.findOneAndUpdate(
        { _id: req.params.id },
        { $pull: { likes: req.user._id } },
        { new: true }
      );

      if (!post) {
        return res.status(404).json({ msg: "Post not found." });
      }

      res.json({ msg: "Post unliked successfully.", post });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server error. Please try again." });
    }
  },

  deletePost: async (req, res) => {
    try {
      const post = await Posts.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });

      if (!post) {
        return res.status(404).json({ msg: "Post not found." });
      }

      await Comments.deleteMany({ _id: { $in: post.comments } });

      res.json({
        msg: "Post deleted successfully.",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server error. Please try again." });
    }
  },

  getUserPosts: async (req, res) => {
    try {
      const features = new APIfeatures(
        Posts.find({ user: req.params.id }),
        req.query
      ).paginating();
      const posts = await features.query.sort("-createdAt");

      res.json({
        posts,
        result: posts.length,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server error. Please try again." });
    }
  },

  getPost: async (req, res) => {
    try {
      const post = await Posts.findById(req.params.id)
        .populate("user likes", "avatar username fullname followers")
        .populate({
          path: "comments",
          populate: {
            path: "user likes",
            select: "-password",
          },
        });

      if (!post) {
        return res.status(404).json({ msg: "Post not found." });
      }

      res.json({ post });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server error. Please try again." });
    }
  },

  getPostDiscover: async (req, res) => {
    try {
      const newArr = [...req.user.following, req.user._id];
      const num = req.query.num || 8;

      const posts = await Posts.aggregate([
        { $match: { user: { $nin: newArr } } },
        { $sample: { size: Number(num) } },
      ]);

      res.json({
        msg: "Success",
        result: posts.length,
        posts,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server error. Please try again." });
    }
  },

  savePost: async (req, res) => {
    try {
      const user = await Users.findOneAndUpdate(
        { _id: req.user._id },
        { $addToSet: { saved: req.params.id } },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ msg: "User not found." });
      }

      res.json({ msg: "Post saved successfully." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server error. Please try again." });
    }
  },

  unSavePost: async (req, res) => {
    try {
      const user = await Users.findOneAndUpdate(
        { _id: req.user._id },
        { $pull: { saved: req.params.id } },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ msg: "User not found." });
      }

      res.json({ msg: "Post unsaved successfully." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server error. Please try again." });
    }
  },

  getSavePost: async (req, res) => {
    try {
      const features = new APIfeatures(
        Posts.find({ _id: { $in: req.user.saved } }),
        req.query
      ).paginating();

      const savePosts = await features.query.sort("-createdAt");

      res.json({
        savePosts,
        result: savePosts.length,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: "Server error. Please try again." });
    }
  },
};

module.exports = postCtrl;
