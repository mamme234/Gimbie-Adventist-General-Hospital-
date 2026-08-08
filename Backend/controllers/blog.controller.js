/**
 * ============================================
 * BLOG.CONTROLLER.JS - Blog Controller
 * ============================================
 */

const BlogPost = require('../models/BlogPost');
const BlogCategory = require('../models/BlogCategory');
const BlogTag = require('../models/BlogTag');
const BlogAuthor = require('../models/BlogAuthor');
const BlogComment = require('../models/BlogComment');
const BlogSeries = require('../models/BlogSeries');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');
const { sendNotification } = require('../config/socket');

/**
 * Get all blog posts
 */
const getBlogPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag, author, status, search, featured } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (author) query.author = author;
    if (status) query.status = status;
    if (featured === 'true') query.isFeatured = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    const posts = await BlogPost.find(query)
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await BlogPost.countDocuments(query);

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get blog posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog posts',
      error: error.message
    });
  }
};

/**
 * Get blog post by ID
 */
const getBlogPostById = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'name email bio')
      .populate('series', 'title');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment view count
    post.views += 1;
    await post.save();

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    logger.error('Get blog post by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog post',
      error: error.message
    });
  }
};

/**
 * Create blog post
 */
const createBlogPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const {
      title,
      content,
      excerpt,
      categoryId,
      tags,
      authorId,
      featuredImage,
      isFeatured,
      status,
      scheduledDate,
      metaDescription,
      metaKeywords,
      seriesId,
      readingTime
    } = req.body;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const post = new BlogPost({
      title,
      slug,
      content,
      excerpt,
      category: categoryId,
      tags: tags || [],
      author: authorId || req.user._id,
      featuredImage,
      isFeatured: isFeatured || false,
      status: status || 'Draft',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      metaDescription,
      metaKeywords,
      series: seriesId,
      readingTime: readingTime || 5
    });

    await post.save();

    // Send notification if published
    if (status === 'Published') {
      sendNotification('all', {
        type: 'BLOG_PUBLISHED',
        title,
        slug: post.slug,
        excerpt
      });
    }

    logger.info(`Blog post created: ${post.slug}`);

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: post
    });
  } catch (error) {
    logger.error('Create blog post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog post',
      error: error.message
    });
  }
};

/**
 * Update blog post
 */
const updateBlogPost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const {
      title,
      content,
      excerpt,
      categoryId,
      tags,
      featuredImage,
      isFeatured,
      status,
      scheduledDate,
      metaDescription,
      metaKeywords,
      seriesId,
      readingTime
    } = req.body;

    if (title) {
      post.title = title;
      post.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (content) post.content = content;
    if (excerpt) post.excerpt = excerpt;
    if (categoryId) post.category = categoryId;
    if (tags) post.tags = tags;
    if (featuredImage) post.featuredImage = featuredImage;
    if (isFeatured !== undefined) post.isFeatured = isFeatured;
    if (status) {
      post.status = status;
      if (status === 'Published' && !post.publishedDate) {
        post.publishedDate = new Date();
      }
    }
    if (scheduledDate) post.scheduledDate = new Date(scheduledDate);
    if (metaDescription) post.metaDescription = metaDescription;
    if (metaKeywords) post.metaKeywords = metaKeywords;
    if (seriesId) post.series = seriesId;
    if (readingTime) post.readingTime = readingTime;

    await post.save();

    logger.info(`Blog post updated: ${post.slug}`);

    res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      data: post
    });
  } catch (error) {
    logger.error('Update blog post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog post',
      error: error.message
    });
  }
};

/**
 * Delete blog post
 */
const deleteBlogPost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    post.status = 'Archived';
    await post.save();

    logger.info(`Blog post archived: ${post.slug}`);

    res.status(200).json({
      success: true,
      message: 'Blog post archived successfully'
    });
  } catch (error) {
    logger.error('Delete blog post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive blog post',
      error: error.message
    });
  }
};

/**
 * Get featured posts
 */
const getFeaturedPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find({
      isFeatured: true,
      status: 'Published'
    })
      .populate('category', 'name slug')
      .populate('author', 'name')
      .sort({ publishedDate: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    logger.error('Get featured posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get featured posts',
      error: error.message
    });
  }
};

/**
 * Get latest posts
 */
const getLatestPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find({
      status: 'Published'
    })
      .populate('category', 'name slug')
      .populate('author', 'name')
      .sort({ publishedDate: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    logger.error('Get latest posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get latest posts',
      error: error.message
    });
  }
};

/**
 * Get popular posts
 */
const getPopularPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find({
      status: 'Published'
    })
      .populate('category', 'name slug')
      .populate('author', 'name')
      .sort({ views: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    logger.error('Get popular posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular posts',
      error: error.message
    });
  }
};

/**
 * Get posts by category
 */
const getPostsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const posts = await BlogPost.find({
      category: category,
      status: 'Published'
    })
      .populate('author', 'name')
      .sort({ publishedDate: -1 });

    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    logger.error('Get posts by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get posts by category',
      error: error.message
    });
  }
};

/**
 * Get posts by tag
 */
const getPostsByTag = async (req, res) => {
  try {
    const { tag } = req.params;

    const posts = await BlogPost.find({
      tags: tag,
      status: 'Published'
    })
      .populate('category', 'name slug')
      .populate('author', 'name')
      .sort({ publishedDate: -1 });

    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    logger.error('Get posts by tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get posts by tag',
      error: error.message
    });
  }
};

/**
 * Get posts by author
 */
const getPostsByAuthor = async (req, res) => {
  try {
    const { authorId } = req.params;

    const posts = await BlogPost.find({
      author: authorId,
      status: 'Published'
    })
      .populate('category', 'name slug')
      .sort({ publishedDate: -1 });

    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    logger.error('Get posts by author error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get posts by author',
      error: error.message
    });
  }
};

/**
 * Search posts
 */
const searchPosts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const posts = await BlogPost.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } }
      ],
      status: 'Published'
    })
      .populate('category', 'name slug')
      .populate('author', 'name')
      .sort({ publishedDate: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    logger.error('Search posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search posts',
      error: error.message
    });
  }
};

/**
 * Get related posts
 */
const getRelatedPosts = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const related = await BlogPost.find({
      $or: [
        { category: post.category },
        { tags: { $in: post.tags } }
      ],
      _id: { $ne: post._id },
      status: 'Published'
    })
      .populate('category', 'name slug')
      .populate('author', 'name')
      .sort({ publishedDate: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: related
    });
  } catch (error) {
    logger.error('Get related posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get related posts',
      error: error.message
    });
  }
};

/**
 * Get blog categories
 */
const getBlogCategories = async (req, res) => {
  try {
    const categories = await BlogCategory.find().sort({ name: 1 });

    const categoriesWithCount = await Promise.all(categories.map(async (cat) => {
      const count = await BlogPost.countDocuments({
        category: cat._id,
        status: 'Published'
      });
      return {
        ...cat.toObject(),
        postCount: count
      };
    }));

    res.status(200).json({
      success: true,
      data: categoriesWithCount
    });
  } catch (error) {
    logger.error('Get blog categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog categories',
      error: error.message
    });
  }
};

/**
 * Get blog category by ID
 */
const getBlogCategoryById = async (req, res) => {
  try {
    const category = await BlogCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error('Get blog category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog category',
      error: error.message
    });
  }
};

/**
 * Create blog category
 */
const createBlogCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, slug, description } = req.body;

    const category = new BlogCategory({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      isActive: true
    });

    await category.save();

    logger.info(`Blog category created: ${category.name}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    logger.error('Create blog category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog category',
      error: error.message
    });
  }
};

/**
 * Update blog category
 */
const updateBlogCategory = async (req, res) => {
  try {
    const category = await BlogCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { name, slug, description, isActive } = req.body;

    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (description) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    logger.info(`Blog category updated: ${category.name}`);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    logger.error('Update blog category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog category',
      error: error.message
    });
  }
};

/**
 * Delete blog category
 */
const deleteBlogCategory = async (req, res) => {
  try {
    const category = await BlogCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isActive = false;
    await category.save();

    logger.info(`Blog category deactivated: ${category.name}`);

    res.status(200).json({
      success: true,
      message: 'Category deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete blog category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate blog category',
      error: error.message
    });
  }
};

/**
 * Get blog tags
 */
const getBlogTags = async (req, res) => {
  try {
    const tags = await BlogTag.find().sort({ name: 1 });

    const tagsWithCount = await Promise.all(tags.map(async (tag) => {
      const count = await BlogPost.countDocuments({
        tags: tag._id,
        status: 'Published'
      });
      return {
        ...tag.toObject(),
        postCount: count
      };
    }));

    res.status(200).json({
      success: true,
      data: tagsWithCount
    });
  } catch (error) {
    logger.error('Get blog tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog tags',
      error: error.message
    });
  }
};

/**
 * Get blog tag by ID
 */
const getBlogTagById = async (req, res) => {
  try {
    const tag = await BlogTag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tag
    });
  } catch (error) {
    logger.error('Get blog tag by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog tag',
      error: error.message
    });
  }
};

/**
 * Create blog tag
 */
const createBlogTag = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, slug, description } = req.body;

    const tag = new BlogTag({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      isActive: true
    });

    await tag.save();

    logger.info(`Blog tag created: ${tag.name}`);

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: tag
    });
  } catch (error) {
    logger.error('Create blog tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog tag',
      error: error.message
    });
  }
};

/**
 * Update blog tag
 */
const updateBlogTag = async (req, res) => {
  try {
    const tag = await BlogTag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    const { name, slug, description, isActive } = req.body;

    if (name) tag.name = name;
    if (slug) tag.slug = slug;
    if (description) tag.description = description;
    if (isActive !== undefined) tag.isActive = isActive;

    await tag.save();

    logger.info(`Blog tag updated: ${tag.name}`);

    res.status(200).json({
      success: true,
      message: 'Tag updated successfully',
      data: tag
    });
  } catch (error) {
    logger.error('Update blog tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog tag',
      error: error.message
    });
  }
};

/**
 * Delete blog tag
 */
const deleteBlogTag = async (req, res) => {
  try {
    const tag = await BlogTag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    tag.isActive = false;
    await tag.save();

    logger.info(`Blog tag deactivated: ${tag.name}`);

    res.status(200).json({
      success: true,
      message: 'Tag deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete blog tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate blog tag',
      error: error.message
    });
  }
};

/**
 * Get blog authors
 */
const getBlogAuthors = async (req, res) => {
  try {
    const authors = await BlogAuthor.find().sort({ name: 1 });

    const authorsWithCount = await Promise.all(authors.map(async (author) => {
      const count = await BlogPost.countDocuments({
        author: author._id,
        status: 'Published'
      });
      return {
        ...author.toObject(),
        postCount: count
      };
    }));

    res.status(200).json({
      success: true,
      data: authorsWithCount
    });
  } catch (error) {
    logger.error('Get blog authors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog authors',
      error: error.message
    });
  }
};

/**
 * Get blog author by ID
 */
const getBlogAuthorById = async (req, res) => {
  try {
    const author = await BlogAuthor.findById(req.params.id);
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    res.status(200).json({
      success: true,
      data: author
    });
  } catch (error) {
    logger.error('Get blog author by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog author',
      error: error.message
    });
  }
};

/**
 * Create blog author
 */
const createBlogAuthor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, email, bio, avatar, socialLinks } = req.body;

    const author = new BlogAuthor({
      name,
      email,
      bio,
      avatar,
      socialLinks: socialLinks || {},
      isActive: true
    });

    await author.save();

    logger.info(`Blog author created: ${author.name}`);

    res.status(201).json({
      success: true,
      message: 'Author created successfully',
      data: author
    });
  } catch (error) {
    logger.error('Create blog author error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog author',
      error: error.message
    });
  }
};

/**
 * Update blog author
 */
const updateBlogAuthor = async (req, res) => {
  try {
    const author = await BlogAuthor.findById(req.params.id);
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    const { name, email, bio, avatar, socialLinks, isActive } = req.body;

    if (name) author.name = name;
    if (email) author.email = email;
    if (bio) author.bio = bio;
    if (avatar) author.avatar = avatar;
    if (socialLinks) author.socialLinks = socialLinks;
    if (isActive !== undefined) author.isActive = isActive;

    await author.save();

    logger.info(`Blog author updated: ${author.name}`);

    res.status(200).json({
      success: true,
      message: 'Author updated successfully',
      data: author
    });
  } catch (error) {
    logger.error('Update blog author error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog author',
      error: error.message
    });
  }
};

/**
 * Delete blog author
 */
const deleteBlogAuthor = async (req, res) => {
  try {
    const author = await BlogAuthor.findById(req.params.id);
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    author.isActive = false;
    await author.save();

    logger.info(`Blog author deactivated: ${author.name}`);

    res.status(200).json({
      success: true,
      message: 'Author deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete blog author error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate blog author',
      error: error.message
    });
  }
};

/**
 * Get blog comments
 */
const getBlogComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await BlogComment.find({ post: postId })
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    logger.error('Get blog comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog comments',
      error: error.message
    });
  }
};

/**
 * Get blog comment by ID
 */
const getBlogCommentById = async (req, res) => {
  try {
    const comment = await BlogComment.findById(req.params.id)
      .populate('user', 'firstName lastName');

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: comment
    });
  } catch (error) {
    logger.error('Get blog comment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog comment',
      error: error.message
    });
  }
};

/**
 * Create blog comment
 */
const createBlogComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { postId, name, email, content } = req.body;

    const post = await BlogPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const comment = new BlogComment({
      post: postId,
      name,
      email,
      content,
      user: req.user?._id || null,
      isApproved: req.user ? true : false
    });

    await comment.save();

    logger.info(`Comment created for blog post: ${postId}`);

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment
    });
  } catch (error) {
    logger.error('Create blog comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message
    });
  }
};

/**
 * Update blog comment
 */
const updateBlogComment = async (req, res) => {
  try {
    const comment = await BlogComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check permissions
    if (comment.user && comment.user.toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { content, isApproved } = req.body;

    if (content) comment.content = content;
    if (isApproved !== undefined && req.user?.role === 'admin') {
      comment.isApproved = isApproved;
    }

    await comment.save();

    logger.info(`Blog comment updated: ${comment._id}`);

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });
  } catch (error) {
    logger.error('Update blog comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
};

/**
 * Delete blog comment
 */
const deleteBlogComment = async (req, res) => {
  try {
    const comment = await BlogComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check permissions
    if (comment.user && comment.user.toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await comment.remove();

    logger.info(`Blog comment deleted: ${comment._id}`);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    logger.error('Delete blog comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

/**
 * Approve blog comment
 */
const approveBlogComment = async (req, res) => {
  try {
    const comment = await BlogComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    comment.isApproved = true;
    comment.approvedAt = new Date();
    await comment.save();

    logger.info(`Blog comment approved: ${comment._id}`);

    res.status(200).json({
      success: true,
      message: 'Comment approved successfully',
      data: comment
    });
  } catch (error) {
    logger.error('Approve blog comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve comment',
      error: error.message
    });
  }
};

/**
 * Reject blog comment
 */
const rejectBlogComment = async (req, res) => {
  try {
    const comment = await BlogComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    comment.isApproved = false;
    await comment.save();

    logger.info(`Blog comment rejected: ${comment._id}`);

    res.status(200).json({
      success: true,
      message: 'Comment rejected successfully',
      data: comment
    });
  } catch (error) {
    logger.error('Reject blog comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject comment',
      error: error.message
    });
  }
};

/**
 * Toggle blog like
 */
const toggleBlogLike = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Placeholder - would implement like functionality
    res.status(200).json({
      success: true,
      data: { likes: post.likes || 0 }
    });
  } catch (error) {
    logger.error('Toggle blog like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: error.message
    });
  }
};

/**
 * Get blog likes
 */
const getBlogLikes = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { likes: post.likes || 0 }
    });
  } catch (error) {
    logger.error('Get blog likes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get likes',
      error: error.message
    });
  }
};

/**
 * Increment blog view
 */
const incrementBlogView = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    post.views += 1;
    await post.save();

    res.status(200).json({
      success: true,
      data: { views: post.views }
    });
  } catch (error) {
    logger.error('Increment blog view error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to increment view',
      error: error.message
    });
  }
};

/**
 * Get blog views
 */
const getBlogViews = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { views: post.views }
    });
  } catch (error) {
    logger.error('Get blog views error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get views',
      error: error.message
    });
  }
};

/**
 * Get blog series
 */
const getBlogSeries = async (req, res) => {
  try {
    const series = await BlogSeries.find().sort({ title: 1 });

    const seriesWithCount = await Promise.all(series.map(async (s) => {
      const count = await BlogPost.countDocuments({
        series: s._id,
        status: 'Published'
      });
      return {
        ...s.toObject(),
        postCount: count
      };
    }));

    res.status(200).json({
      success: true,
      data: seriesWithCount
    });
  } catch (error) {
    logger.error('Get blog series error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog series',
      error: error.message
    });
  }
};

/**
 * Get blog series by ID
 */
const getBlogSeriesById = async (req, res) => {
  try {
    const series = await BlogSeries.findById(req.params.id);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
      });
    }

    res.status(200).json({
      success: true,
      data: series
    });
  } catch (error) {
    logger.error('Get blog series by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog series',
      error: error.message
    });
  }
};

/**
 * Create blog series
 */
const createBlogSeries = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { title, description, posts, coverImage } = req.body;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const series = new BlogSeries({
      title,
      slug,
      description,
      posts: posts || [],
      coverImage,
      isActive: true
    });

    await series.save();

    logger.info(`Blog series created: ${series.title}`);

    res.status(201).json({
      success: true,
      message: 'Series created successfully',
      data: series
    });
  } catch (error) {
    logger.error('Create blog series error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog series',
      error: error.message
    });
  }
};

/**
 * Update blog series
 */
const updateBlogSeries = async (req, res) => {
  try {
    const series = await BlogSeries.findById(req.params.id);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
      });
    }

    const { title, description, posts, coverImage, isActive } = req.body;

    if (title) {
      series.title = title;
      series.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (description) series.description = description;
    if (posts) series.posts = posts;
    if (coverImage) series.coverImage = coverImage;
    if (isActive !== undefined) series.isActive = isActive;

    await series.save();

    logger.info(`Blog series updated: ${series.title}`);

    res.status(200).json({
      success: true,
      message: 'Series updated successfully',
      data: series
    });
  } catch (error) {
    logger.error('Update blog series error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog series',
      error: error.message
    });
  }
};

/**
 * Delete blog series
 */
const deleteBlogSeries = async (req, res) => {
  try {
    const series = await BlogSeries.findById(req.params.id);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
      });
    }

    series.isActive = false;
    await series.save();

    logger.info(`Blog series deactivated: ${series.title}`);

    res.status(200).json({
      success: true,
      message: 'Series deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete blog series error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate blog series',
      error: error.message
    });
  }
};

/**
 * Get series posts
 */
const getSeriesPosts = async (req, res) => {
  try {
    const series = await BlogSeries.findById(req.params.id);
    if (!series) {
      return res.status(404).json({
        success: false,
        message: 'Series not found'
      });
    }

    const posts = await BlogPost.find({
      _id: { $in: series.posts },
      status: 'Published'
    })
      .populate('author', 'name')
      .sort({ publishedDate: 1 });

    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    logger.error('Get series posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get series posts',
      error: error.message
    });
  }
};

/**
 * Get blog stats
 */
const getBlogStats = async (req, res) => {
  try {
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      totalViews,
      totalComments,
      totalAuthors,
      totalCategories,
      totalTags
    ] = await Promise.all([
      BlogPost.countDocuments(),
      BlogPost.countDocuments({ status: 'Published' }),
      BlogPost.countDocuments({ status: 'Draft' }),
      BlogPost.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      BlogComment.countDocuments({ isApproved: true }),
      BlogAuthor.countDocuments({ isActive: true }),
      BlogCategory.countDocuments({ isActive: true }),
      BlogTag.countDocuments({ isActive: true })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPosts,
        publishedPosts,
        draftPosts,
        totalViews: totalViews[0]?.total || 0,
        totalComments,
        totalAuthors,
        totalCategories,
        totalTags
      }
    });
  } catch (error) {
    logger.error('Get blog stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog stats',
      error: error.message
    });
  }
};

/**
 * Get daily stats
 */
const getDailyStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      publishedToday,
      commentsToday,
      viewsToday
    ] = await Promise.all([
      BlogPost.countDocuments({
        publishedDate: { $gte: today, $lt: tomorrow },
        status: 'Published'
      }),
      BlogComment.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
        isApproved: true
      }),
      BlogPost.aggregate([
        { $match: { updatedAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, views: { $sum: '$views' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        date: today,
        publishedToday,
        commentsToday,
        viewsToday: viewsToday[0]?.views || 0
      }
    });
  } catch (error) {
    logger.error('Get daily stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily stats',
      error: error.message
    });
  }
};

/**
 * Get monthly stats
 */
const getMonthlyStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      publishedMonth,
      commentsMonth,
      viewsMonth
    ] = await Promise.all([
      BlogPost.countDocuments({
        publishedDate: { $gte: startOfMonth, $lt: endOfMonth },
        status: 'Published'
      }),
      BlogComment.countDocuments({
        createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        isApproved: true
      }),
      BlogPost.aggregate([
        { $match: { updatedAt: { $gte: startOfMonth, $lt: endOfMonth } } },
        { $group: { _id: null, views: { $sum: '$views' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        month: startOfMonth,
        publishedMonth,
        commentsMonth,
        viewsMonth: viewsMonth[0]?.views || 0
      }
    });
  } catch (error) {
    logger.error('Get monthly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly stats',
      error: error.message
    });
  }
};

/**
 * Get blog analytics
 */
const getBlogAnalytics = async (req, res) => {
  try {
    // Placeholder - would get blog analytics
    const analytics = {
      topCategories: [],
      topTags: [],
      topAuthors: [],
      trendingPosts: [],
      engagementRate: 0
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Get blog analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog analytics',
      error: error.message
    });
  }
};

/**
 * Get blog reports
 */
const getBlogReports = async (req, res) => {
  try {
    // Placeholder - would generate blog reports
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get blog reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog reports',
      error: error.message
    });
  }
};

/**
 * Generate blog report
 */
const generateBlogReport = async (req, res) => {
  try {
    // Placeholder - would generate report
    res.status(200).json({
      success: true,
      message: 'Report generated successfully'
    });
  } catch (error) {
    logger.error('Generate blog report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate blog report',
      error: error.message
    });
  }
};

module.exports = {
  getBlogPosts,
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getFeaturedPosts,
  getLatestPosts,
  getPopularPosts,
  getPostsByCategory,
  getPostsByTag,
  getPostsByAuthor,
  searchPosts,
  getRelatedPosts,
  getBlogCategories,
  getBlogCategoryById,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  getBlogTags,
  getBlogTagById,
  createBlogTag,
  updateBlogTag,
  deleteBlogTag,
  getBlogAuthors,
  getBlogAuthorById,
  createBlogAuthor,
  updateBlogAuthor,
  deleteBlogAuthor,
  getBlogComments,
  getBlogCommentById,
  createBlogComment,
  updateBlogComment,
  deleteBlogComment,
  approveBlogComment,
  rejectBlogComment,
  toggleBlogLike,
  getBlogLikes,
  incrementBlogView,
  getBlogViews,
  getBlogSeries,
  getBlogSeriesById,
  createBlogSeries,
  updateBlogSeries,
  deleteBlogSeries,
  getSeriesPosts,
  getBlogStats,
  getDailyStats,
  getMonthlyStats,
  getBlogAnalytics,
  getBlogReports,
  generateBlogReport
};
