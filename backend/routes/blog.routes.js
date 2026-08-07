/**
 * ============================================
 * BLOG.ROUTES.JS - Blog Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Blog Posts
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
  
  // Blog Categories
  getBlogCategories,
  getBlogCategoryById,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  
  // Blog Tags
  getBlogTags,
  getBlogTagById,
  createBlogTag,
  updateBlogTag,
  deleteBlogTag,
  
  // Blog Authors
  getBlogAuthors,
  getBlogAuthorById,
  createBlogAuthor,
  updateBlogAuthor,
  deleteBlogAuthor,
  
  // Blog Comments
  getBlogComments,
  getBlogCommentById,
  createBlogComment,
  updateBlogComment,
  deleteBlogComment,
  approveBlogComment,
  rejectBlogComment,
  
  // Blog Likes
  toggleBlogLike,
  getBlogLikes,
  
  // Blog Views
  incrementBlogView,
  getBlogViews,
  
  // Blog Series
  getBlogSeries,
  getBlogSeriesById,
  createBlogSeries,
  updateBlogSeries,
  deleteBlogSeries,
  getSeriesPosts,
  
  // Blog Reports
  getBlogReports,
  generateBlogReport,
  
  // Blog Stats
  getBlogStats,
  getDailyStats,
  getMonthlyStats,
  
  // Blog Analytics
  getBlogAnalytics,
} = require('../controllers/blog.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { multerConfig, handleMulterError } = require('../config/multer');

const router = express.Router();

// Validation rules
const postIdValidation = [
  param('id').isMongoId().withMessage('Invalid blog post ID'),
];

const createPostValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('excerpt').optional().isString(),
  body('authorId').isMongoId().withMessage('Invalid author ID'),
  body('tags').optional().isArray(),
  body('featuredImage').optional().isString(),
  body('status').isIn(['Draft', 'Published', 'Pending', 'Scheduled']).withMessage('Invalid status'),
  body('scheduledDate').optional().isISO8601().withMessage('Invalid scheduled date'),
];

const updatePostValidation = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('status').optional().isIn(['Draft', 'Published', 'Archived', 'Pending', 'Scheduled']).withMessage('Invalid status'),
];

const categoryValidation = [
  body('name').notEmpty().withMessage('Category name is required'),
  body('slug').notEmpty().withMessage('Slug is required'),
  body('description').optional().isString(),
];

const tagValidation = [
  body('name').notEmpty().withMessage('Tag name is required'),
  body('slug').notEmpty().withMessage('Slug is required'),
];

const authorValidation = [
  body('name').notEmpty().withMessage('Author name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('bio').optional().isString(),
  body('avatar').optional().isString(),
];

const commentValidation = [
  body('postId').isMongoId().withMessage('Invalid post ID'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('content').notEmpty().withMessage('Comment content is required'),
];

const seriesValidation = [
  body('title').notEmpty().withMessage('Series title is required'),
  body('description').optional().isString(),
  body('posts').isArray().withMessage('Posts must be an array'),
];

// Public routes (no auth required)
router.get('/', getBlogPosts);
router.get('/featured', getFeaturedPosts);
router.get('/latest', getLatestPosts);
router.get('/popular', getPopularPosts);
router.get('/category/:category', getPostsByCategory);
router.get('/tag/:tag', getPostsByTag);
router.get('/author/:authorId', getPostsByAuthor);
router.get('/search', searchPosts);
router.get('/:id', postIdValidation, getBlogPostById);
router.get('/:id/related', postIdValidation, getRelatedPosts);

// Public actions
router.post('/:id/view', postIdValidation, incrementBlogView);
router.get('/:id/views', postIdValidation, getBlogViews);
router.get('/:id/comments', postIdValidation, getBlogComments);
router.post('/:id/comments', postIdValidation, commentValidation, createBlogComment);
router.post('/:id/like', postIdValidation, toggleBlogLike);
router.get('/:id/likes', postIdValidation, getBlogLikes);

// Authenticated routes
router.use(authenticate);

// Blog Categories (Protected)
router.get('/categories', getBlogCategories);
router.post('/categories', authorize('admin', 'editor'), categoryValidation, createBlogCategory);
router.get('/categories/:id', getBlogCategoryById);
router.put('/categories/:id', authorize('admin', 'editor'), categoryValidation, updateBlogCategory);
router.delete('/categories/:id', authorize('admin'), deleteBlogCategory);

// Blog Tags (Protected)
router.get('/tags', getBlogTags);
router.post('/tags', authorize('admin', 'editor'), tagValidation, createBlogTag);
router.get('/tags/:id', getBlogTagById);
router.put('/tags/:id', authorize('admin', 'editor'), tagValidation, updateBlogTag);
router.delete('/tags/:id', authorize('admin'), deleteBlogTag);

// Blog Authors (Protected)
router.get('/authors', getBlogAuthors);
router.post('/authors', authorize('admin', 'editor'), authorValidation, createBlogAuthor);
router.get('/authors/:id', getBlogAuthorById);
router.put('/authors/:id', authorize('admin', 'editor'), authorValidation, updateBlogAuthor);
router.delete('/authors/:id', authorize('admin'), deleteBlogAuthor);

// Blog Posts (Protected)
router.post('/', authorize('admin', 'editor'), createPostValidation, createBlogPost);
router.put('/:id', authorize('admin', 'editor'), postIdValidation, updatePostValidation, updateBlogPost);
router.delete('/:id', authorize('admin'), postIdValidation, deleteBlogPost);

// Blog Comments (Protected)
router.put('/comments/:id', authorize('admin', 'editor'), updateBlogComment);
router.delete('/comments/:id', authorize('admin'), deleteBlogComment);
router.post('/comments/:id/approve', authorize('admin', 'editor'), approveBlogComment);
router.post('/comments/:id/reject', authorize('admin', 'editor'), rejectBlogComment);

// Blog Series (Protected)
router.get('/series', getBlogSeries);
router.post('/series', authorize('admin', 'editor'), seriesValidation, createBlogSeries);
router.get('/series/:id', getBlogSeriesById);
router.put('/series/:id', authorize('admin', 'editor'), seriesValidation, updateBlogSeries);
router.delete('/series/:id', authorize('admin'), deleteBlogSeries);
router.get('/series/:id/posts', getSeriesPosts);

// Blog Reports (Protected)
router.get('/reports', authorize('admin'), getBlogReports);
router.post('/reports/generate', authorize('admin'), generateBlogReport);

// Blog Stats (Protected)
router.get('/stats', authorize('admin'), getBlogStats);
router.get('/stats/daily', authorize('admin'), getDailyStats);
router.get('/stats/monthly', authorize('admin'), getMonthlyStats);

// Blog Analytics (Protected)
router.get('/analytics', authorize('admin'), getBlogAnalytics);

// File uploads for blog
router.post('/upload', authorize('admin', 'editor'), multerConfig.general.single('image'), handleMulterError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }
  res.json({
    success: true,
    message: 'Image uploaded successfully',
    url: `/uploads/general/${req.file.filename}`,
    file: req.file,
  });
});

module.exports = router;
