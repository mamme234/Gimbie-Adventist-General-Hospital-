/**
 * ============================================
 * NEWS.ROUTES.JS - News Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // News Articles
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  getFeaturedNews,
  getLatestNews,
  getNewsByCategory,
  getNewsByTag,
  getRelatedNews,
  searchNews,
  
  // News Categories
  getNewsCategories,
  getNewsCategoryById,
  createNewsCategory,
  updateNewsCategory,
  deleteNewsCategory,
  
  // News Tags
  getNewsTags,
  getNewsTagById,
  createNewsTag,
  updateNewsTag,
  deleteNewsTag,
  
  // News Comments
  getNewsComments,
  getNewsCommentById,
  createNewsComment,
  updateNewsComment,
  deleteNewsComment,
  approveComment,
  rejectComment,
  
  // News Likes
  toggleNewsLike,
  getNewsLikes,
  
  // News Views
  incrementNewsView,
  getNewsViews,
  
  // News Reports
  getNewsReports,
  generateNewsReport,
  
  // News Stats
  getNewsStats,
  getDailyStats,
  getMonthlyStats,
  
  // News Publishing
  publishNews,
  unpublishNews,
  archiveNews,
  
  // News Analytics
  getNewsAnalytics,
} = require('../controllers/news.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const newsIdValidation = [
  param('id').isMongoId().withMessage('Invalid news ID'),
];

const createNewsValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('excerpt').optional().isString(),
  body('author').notEmpty().withMessage('Author is required'),
  body('tags').optional().isArray(),
  body('featuredImage').optional().isString(),
];

const updateNewsValidation = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('status').optional().isIn(['Draft', 'Published', 'Archived', 'Pending']).withMessage('Invalid status'),
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

const commentValidation = [
  body('newsId').isMongoId().withMessage('Invalid news ID'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('content').notEmpty().withMessage('Comment content is required'),
];

// Public routes (no auth required)
router.get('/', getNews);
router.get('/featured', getFeaturedNews);
router.get('/latest', getLatestNews);
router.get('/category/:category', getNewsByCategory);
router.get('/tag/:tag', getNewsByTag);
router.get('/search', searchNews);
router.get('/:id', newsIdValidation, getNewsById);
router.get('/:id/related', newsIdValidation, getRelatedNews);

// Public actions
router.post('/:id/view', newsIdValidation, incrementNewsView);
router.get('/:id/views', newsIdValidation, getNewsViews);
router.get('/:id/comments', newsIdValidation, getNewsComments);
router.post('/:id/comments', newsIdValidation, commentValidation, createNewsComment);
router.post('/:id/like', newsIdValidation, toggleNewsLike);
router.get('/:id/likes', newsIdValidation, getNewsLikes);

// Authenticated routes
router.use(authenticate);

// News Categories (Protected)
router.get('/categories', getNewsCategories);
router.post('/categories', authorize('admin', 'editor'), categoryValidation, createNewsCategory);
router.get('/categories/:id', getNewsCategoryById);
router.put('/categories/:id', authorize('admin', 'editor'), categoryValidation, updateNewsCategory);
router.delete('/categories/:id', authorize('admin'), deleteNewsCategory);

// News Tags (Protected)
router.get('/tags', getNewsTags);
router.post('/tags', authorize('admin', 'editor'), tagValidation, createNewsTag);
router.get('/tags/:id', getNewsTagById);
router.put('/tags/:id', authorize('admin', 'editor'), tagValidation, updateNewsTag);
router.delete('/tags/:id', authorize('admin'), deleteNewsTag);

// News Articles (Protected)
router.post('/', authorize('admin', 'editor'), createNewsValidation, createNews);
router.put('/:id', authorize('admin', 'editor'), newsIdValidation, updateNewsValidation, updateNews);
router.delete('/:id', authorize('admin'), newsIdValidation, deleteNews);

// News Publishing (Protected)
router.post('/:id/publish', authorize('admin', 'editor'), newsIdValidation, publishNews);
router.post('/:id/unpublish', authorize('admin', 'editor'), newsIdValidation, unpublishNews);
router.post('/:id/archive', authorize('admin', 'editor'), newsIdValidation, archiveNews);

// News Comments (Protected)
router.put('/comments/:id', authorize('admin', 'editor'), updateNewsComment);
router.delete('/comments/:id', authorize('admin'), deleteNewsComment);
router.post('/comments/:id/approve', authorize('admin', 'editor'), approveComment);
router.post('/comments/:id/reject', authorize('admin', 'editor'), rejectComment);

// News Reports (Protected)
router.get('/reports', authorize('admin'), getNewsReports);
router.post('/reports/generate', authorize('admin'), generateNewsReport);

// News Stats (Protected)
router.get('/stats', authorize('admin'), getNewsStats);
router.get('/stats/daily', authorize('admin'), getDailyStats);
router.get('/stats/monthly', authorize('admin'), getMonthlyStats);

// News Analytics (Protected)
router.get('/analytics', authorize('admin'), getNewsAnalytics);

module.exports = router;
