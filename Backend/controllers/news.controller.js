/**
 * ============================================
 * NEWS.CONTROLLER.JS - News Controller
 * ============================================
 */

const News = require('../models/News');
const NewsCategory = require('../models/NewsCategory');
const NewsTag = require('../models/NewsTag');
const NewsComment = require('../models/NewsComment');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');
const { sendNotification } = require('../config/socket');

/**
 * Get all news
 */
const getNews = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag, status, search, featured } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (status) query.status = status;
    if (featured === 'true') query.isFeatured = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    const news = await News.find(query)
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await News.countDocuments(query);

    res.status(200).json({
      success: true,
      data: news,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news',
      error: error.message
    });
  }
};

/**
 * Get news by ID
 */
const getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('author', 'firstName lastName');

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    // Increment view count
    news.views += 1;
    await news.save();

    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    logger.error('Get news by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news',
      error: error.message
    });
  }
};

/**
 * Create news
 */
const createNews = async (req, res) => {
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
      featuredImage,
      isFeatured,
      status,
      publishedDate,
      metaDescription,
      metaKeywords
    } = req.body;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const news = new News({
      title,
      slug,
      content,
      excerpt,
      category: categoryId,
      tags: tags || [],
      featuredImage,
      isFeatured: isFeatured || false,
      status: status || 'Draft',
      author: req.user._id,
      publishedDate: status === 'Published' ? new Date() : null,
      metaDescription,
      metaKeywords
    });

    await news.save();

    // Send notification if published
    if (status === 'Published') {
      sendNotification('all', {
        type: 'NEWS_PUBLISHED',
        title,
        slug: news.slug,
        excerpt
      });
    }

    logger.info(`News created: ${news.slug}`);

    res.status(201).json({
      success: true,
      message: 'News created successfully',
      data: news
    });
  } catch (error) {
    logger.error('Create news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create news',
      error: error.message
    });
  }
};

/**
 * Update news
 */
const updateNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
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
      metaDescription,
      metaKeywords
    } = req.body;

    if (title) {
      news.title = title;
      news.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (content) news.content = content;
    if (excerpt) news.excerpt = excerpt;
    if (categoryId) news.category = categoryId;
    if (tags) news.tags = tags;
    if (featuredImage) news.featuredImage = featuredImage;
    if (isFeatured !== undefined) news.isFeatured = isFeatured;
    if (status) {
      news.status = status;
      if (status === 'Published' && !news.publishedDate) {
        news.publishedDate = new Date();
      }
    }
    if (metaDescription) news.metaDescription = metaDescription;
    if (metaKeywords) news.metaKeywords = metaKeywords;

    await news.save();

    logger.info(`News updated: ${news.slug}`);

    res.status(200).json({
      success: true,
      message: 'News updated successfully',
      data: news
    });
  } catch (error) {
    logger.error('Update news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update news',
      error: error.message
    });
  }
};

/**
 * Delete news
 */
const deleteNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    news.status = 'Archived';
    await news.save();

    logger.info(`News archived: ${news.slug}`);

    res.status(200).json({
      success: true,
      message: 'News archived successfully'
    });
  } catch (error) {
    logger.error('Delete news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive news',
      error: error.message
    });
  }
};

/**
 * Get featured news
 */
const getFeaturedNews = async (req, res) => {
  try {
    const news = await News.find({
      isFeatured: true,
      status: 'Published'
    })
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName')
      .sort({ publishedDate: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    logger.error('Get featured news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get featured news',
      error: error.message
    });
  }
};

/**
 * Get latest news
 */
const getLatestNews = async (req, res) => {
  try {
    const news = await News.find({
      status: 'Published'
    })
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName')
      .sort({ publishedDate: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    logger.error('Get latest news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get latest news',
      error: error.message
    });
  }
};

/**
 * Get news by category
 */
const getNewsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const news = await News.find({
      category: category,
      status: 'Published'
    })
      .populate('author', 'firstName lastName')
      .sort({ publishedDate: -1 });

    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    logger.error('Get news by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news by category',
      error: error.message
    });
  }
};

/**
 * Get news by tag
 */
const getNewsByTag = async (req, res) => {
  try {
    const { tag } = req.params;

    const news = await News.find({
      tags: tag,
      status: 'Published'
    })
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName')
      .sort({ publishedDate: -1 });

    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    logger.error('Get news by tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news by tag',
      error: error.message
    });
  }
};

/**
 * Search news
 */
const searchNews = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const news = await News.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } }
      ],
      status: 'Published'
    })
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName')
      .sort({ publishedDate: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    logger.error('Search news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search news',
      error: error.message
    });
  }
};

/**
 * Get related news
 */
const getRelatedNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    const related = await News.find({
      $or: [
        { category: news.category },
        { tags: { $in: news.tags } }
      ],
      _id: { $ne: news._id },
      status: 'Published'
    })
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName')
      .sort({ publishedDate: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: related
    });
  } catch (error) {
    logger.error('Get related news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get related news',
      error: error.message
    });
  }
};

/**
 * Get news categories
 */
const getNewsCategories = async (req, res) => {
  try {
    const categories = await NewsCategory.find().sort({ name: 1 });

    // Get news count for each category
    const categoriesWithCount = await Promise.all(categories.map(async (cat) => {
      const count = await News.countDocuments({
        category: cat._id,
        status: 'Published'
      });
      return {
        ...cat.toObject(),
        newsCount: count
      };
    }));

    res.status(200).json({
      success: true,
      data: categoriesWithCount
    });
  } catch (error) {
    logger.error('Get news categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news categories',
      error: error.message
    });
  }
};

/**
 * Get news category by ID
 */
const getNewsCategoryById = async (req, res) => {
  try {
    const category = await NewsCategory.findById(req.params.id);
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
    logger.error('Get news category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news category',
      error: error.message
    });
  }
};

/**
 * Create news category
 */
const createNewsCategory = async (req, res) => {
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

    const category = new NewsCategory({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      isActive: true
    });

    await category.save();

    logger.info(`News category created: ${category.name}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    logger.error('Create news category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create news category',
      error: error.message
    });
  }
};

/**
 * Update news category
 */
const updateNewsCategory = async (req, res) => {
  try {
    const category = await NewsCategory.findById(req.params.id);
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

    logger.info(`News category updated: ${category.name}`);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    logger.error('Update news category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update news category',
      error: error.message
    });
  }
};

/**
 * Delete news category
 */
const deleteNewsCategory = async (req, res) => {
  try {
    const category = await NewsCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isActive = false;
    await category.save();

    logger.info(`News category deactivated: ${category.name}`);

    res.status(200).json({
      success: true,
      message: 'Category deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete news category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate news category',
      error: error.message
    });
  }
};

/**
 * Get news tags
 */
const getNewsTags = async (req, res) => {
  try {
    const tags = await NewsTag.find().sort({ name: 1 });

    const tagsWithCount = await Promise.all(tags.map(async (tag) => {
      const count = await News.countDocuments({
        tags: tag._id,
        status: 'Published'
      });
      return {
        ...tag.toObject(),
        newsCount: count
      };
    }));

    res.status(200).json({
      success: true,
      data: tagsWithCount
    });
  } catch (error) {
    logger.error('Get news tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news tags',
      error: error.message
    });
  }
};

/**
 * Get news tag by ID
 */
const getNewsTagById = async (req, res) => {
  try {
    const tag = await NewsTag.findById(req.params.id);
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
    logger.error('Get news tag by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news tag',
      error: error.message
    });
  }
};

/**
 * Create news tag
 */
const createNewsTag = async (req, res) => {
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

    const tag = new NewsTag({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      isActive: true
    });

    await tag.save();

    logger.info(`News tag created: ${tag.name}`);

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: tag
    });
  } catch (error) {
    logger.error('Create news tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create news tag',
      error: error.message
    });
  }
};

/**
 * Update news tag
 */
const updateNewsTag = async (req, res) => {
  try {
    const tag = await NewsTag.findById(req.params.id);
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

    logger.info(`News tag updated: ${tag.name}`);

    res.status(200).json({
      success: true,
      message: 'Tag updated successfully',
      data: tag
    });
  } catch (error) {
    logger.error('Update news tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update news tag',
      error: error.message
    });
  }
};

/**
 * Delete news tag
 */
const deleteNewsTag = async (req, res) => {
  try {
    const tag = await NewsTag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    tag.isActive = false;
    await tag.save();

    logger.info(`News tag deactivated: ${tag.name}`);

    res.status(200).json({
      success: true,
      message: 'Tag deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete news tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate news tag',
      error: error.message
    });
  }
};

/**
 * Get news comments
 */
const getNewsComments = async (req, res) => {
  try {
    const { newsId } = req.params;

    const comments = await NewsComment.find({ news: newsId })
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    logger.error('Get news comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news comments',
      error: error.message
    });
  }
};

/**
 * Get news comment by ID
 */
const getNewsCommentById = async (req, res) => {
  try {
    const comment = await NewsComment.findById(req.params.id)
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
    logger.error('Get news comment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news comment',
      error: error.message
    });
  }
};

/**
 * Create news comment
 */
const createNewsComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { newsId, name, email, content } = req.body;

    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    const comment = new NewsComment({
      news: newsId,
      name,
      email,
      content,
      user: req.user?._id || null,
      isApproved: req.user ? true : false
    });

    await comment.save();

    logger.info(`Comment created for news: ${newsId}`);

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment
    });
  } catch (error) {
    logger.error('Create news comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message
    });
  }
};

/**
 * Update news comment
 */
const updateNewsComment = async (req, res) => {
  try {
    const comment = await NewsComment.findById(req.params.id);
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

    logger.info(`Comment updated: ${comment._id}`);

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });
  } catch (error) {
    logger.error('Update news comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
};

/**
 * Delete news comment
 */
const deleteNewsComment = async (req, res) => {
  try {
    const comment = await NewsComment.findById(req.params.id);
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

    logger.info(`Comment deleted: ${comment._id}`);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    logger.error('Delete news comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

/**
 * Approve comment
 */
const approveComment = async (req, res) => {
  try {
    const comment = await NewsComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    comment.isApproved = true;
    comment.approvedAt = new Date();
    await comment.save();

    logger.info(`Comment approved: ${comment._id}`);

    res.status(200).json({
      success: true,
      message: 'Comment approved successfully',
      data: comment
    });
  } catch (error) {
    logger.error('Approve comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve comment',
      error: error.message
    });
  }
};

/**
 * Reject comment
 */
const rejectComment = async (req, res) => {
  try {
    const comment = await NewsComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    comment.isApproved = false;
    await comment.save();

    logger.info(`Comment rejected: ${comment._id}`);

    res.status(200).json({
      success: true,
      message: 'Comment rejected successfully',
      data: comment
    });
  } catch (error) {
    logger.error('Reject comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject comment',
      error: error.message
    });
  }
};

/**
 * Toggle news like
 */
const toggleNewsLike = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    // Placeholder - would implement like functionality
    res.status(200).json({
      success: true,
      data: { likes: news.likes || 0 }
    });
  } catch (error) {
    logger.error('Toggle news like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: error.message
    });
  }
};

/**
 * Get news likes
 */
const getNewsLikes = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { likes: news.likes || 0 }
    });
  } catch (error) {
    logger.error('Get news likes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get likes',
      error: error.message
    });
  }
};

/**
 * Increment news view
 */
const incrementNewsView = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    news.views += 1;
    await news.save();

    res.status(200).json({
      success: true,
      data: { views: news.views }
    });
  } catch (error) {
    logger.error('Increment news view error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to increment view',
      error: error.message
    });
  }
};

/**
 * Get news views
 */
const getNewsViews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { views: news.views }
    });
  } catch (error) {
    logger.error('Get news views error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get views',
      error: error.message
    });
  }
};

/**
 * Publish news
 */
const publishNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    news.status = 'Published';
    news.publishedDate = new Date();
    await news.save();

    // Send notification
    sendNotification('all', {
      type: 'NEWS_PUBLISHED',
      title: news.title,
      slug: news.slug,
      excerpt: news.excerpt
    });

    logger.info(`News published: ${news.slug}`);

    res.status(200).json({
      success: true,
      message: 'News published successfully',
      data: news
    });
  } catch (error) {
    logger.error('Publish news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish news',
      error: error.message
    });
  }
};

/**
 * Unpublish news
 */
const unpublishNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    news.status = 'Draft';
    await news.save();

    logger.info(`News unpublished: ${news.slug}`);

    res.status(200).json({
      success: true,
      message: 'News unpublished successfully',
      data: news
    });
  } catch (error) {
    logger.error('Unpublish news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unpublish news',
      error: error.message
    });
  }
};

/**
 * Archive news
 */
const archiveNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    news.status = 'Archived';
    await news.save();

    logger.info(`News archived: ${news.slug}`);

    res.status(200).json({
      success: true,
      message: 'News archived successfully',
      data: news
    });
  } catch (error) {
    logger.error('Archive news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive news',
      error: error.message
    });
  }
};

/**
 * Get news reports
 */
const getNewsReports = async (req, res) => {
  try {
    // Placeholder - would generate news reports
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get news reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news reports',
      error: error.message
    });
  }
};

/**
 * Generate news report
 */
const generateNewsReport = async (req, res) => {
  try {
    // Placeholder - would generate report
    res.status(200).json({
      success: true,
      message: 'Report generated successfully'
    });
  } catch (error) {
    logger.error('Generate news report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate news report',
      error: error.message
    });
  }
};

/**
 * Get news stats
 */
const getNewsStats = async (req, res) => {
  try {
    const [
      totalNews,
      publishedNews,
      draftNews,
      archivedNews,
      totalViews,
      totalComments
    ] = await Promise.all([
      News.countDocuments(),
      News.countDocuments({ status: 'Published' }),
      News.countDocuments({ status: 'Draft' }),
      News.countDocuments({ status: 'Archived' }),
      News.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      NewsComment.countDocuments({ isApproved: true })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalNews,
        publishedNews,
        draftNews,
        archivedNews,
        totalViews: totalViews[0]?.total || 0,
        totalComments
      }
    });
  } catch (error) {
    logger.error('Get news stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news stats',
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
      News.countDocuments({
        publishedDate: { $gte: today, $lt: tomorrow },
        status: 'Published'
      }),
      NewsComment.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
        isApproved: true
      }),
      News.aggregate([
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
      News.countDocuments({
        publishedDate: { $gte: startOfMonth, $lt: endOfMonth },
        status: 'Published'
      }),
      NewsComment.countDocuments({
        createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        isApproved: true
      }),
      News.aggregate([
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
 * Get news analytics
 */
const getNewsAnalytics = async (req, res) => {
  try {
    // Placeholder - would get news analytics
    const analytics = {
      topCategories: [],
      topTags: [],
      topAuthors: [],
      trendingNews: [],
      engagementRate: 0
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Get news analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news analytics',
      error: error.message
    });
  }
};

module.exports = {
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  getFeaturedNews,
  getLatestNews,
  getNewsByCategory,
  getNewsByTag,
  searchNews,
  getRelatedNews,
  getNewsCategories,
  getNewsCategoryById,
  createNewsCategory,
  updateNewsCategory,
  deleteNewsCategory,
  getNewsTags,
  getNewsTagById,
  createNewsTag,
  updateNewsTag,
  deleteNewsTag,
  getNewsComments,
  getNewsCommentById,
  createNewsComment,
  updateNewsComment,
  deleteNewsComment,
  approveComment,
  rejectComment,
  toggleNewsLike,
  getNewsLikes,
  incrementNewsView,
  getNewsViews,
  publishNews,
  unpublishNews,
  archiveNews,
  getNewsReports,
  generateNewsReport,
  getNewsStats,
  getDailyStats,
  getMonthlyStats,
  getNewsAnalytics
};
