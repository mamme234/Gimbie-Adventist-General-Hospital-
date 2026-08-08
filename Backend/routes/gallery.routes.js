/**
 * ============================================
 * GALLERY.ROUTES.JS - Gallery Routes
 * ============================================
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const {
  // Gallery Items
  getGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  getFeaturedItems,
  getItemsByCategory,
  
  // Categories
  getGalleryCategories,
  getGalleryCategoryById,
  createGalleryCategory,
  updateGalleryCategory,
  deleteGalleryCategory,
  
  // Gallery Images
  uploadGalleryImage,
  deleteGalleryImage,
  getGalleryImages,
  
  // Gallery Albums
  getAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  getAlbumItems,
  addToAlbum,
  removeFromAlbum,
  
  // Gallery Tags
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  getItemsByTag,
  
  // Gallery Stats
  getGalleryStats,
  
  // Gallery Comments
  getComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
  
  // Gallery Likes
  toggleLike,
  getLikes,
  
  // Gallery Views
  incrementView,
  getViewCount,
  
  // Gallery Reports
  getReports,
  generateReport,
} = require('../controllers/gallery.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { multerConfig, handleMulterError } = require('../config/multer');

const router = express.Router();

// Validation rules
const itemIdValidation = [
  param('id').isMongoId().withMessage('Invalid gallery item ID'),
];

const albumIdValidation = [
  param('id').isMongoId().withMessage('Invalid album ID'),
];

const createItemValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional().isString(),
  body('category').notEmpty().withMessage('Category is required'),
  body('tags').optional().isArray(),
];

const updateItemValidation = [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('status').optional().isIn(['Published', 'Draft', 'Archived']).withMessage('Invalid status'),
];

const categoryValidation = [
  body('name').notEmpty().withMessage('Category name is required'),
  body('description').optional().isString(),
];

const albumValidation = [
  body('name').notEmpty().withMessage('Album name is required'),
  body('description').optional().isString(),
  body('coverImage').optional().isString(),
];

const tagValidation = [
  body('name').notEmpty().withMessage('Tag name is required'),
];

const commentValidation = [
  body('itemId').isMongoId().withMessage('Invalid item ID'),
  body('content').notEmpty().withMessage('Comment content is required'),
];

// Public routes (no auth required for viewing)
router.get('/', getGalleryItems);
router.get('/featured', getFeaturedItems);
router.get('/category/:category', getItemsByCategory);
router.get('/items/:id', itemIdValidation, getGalleryItemById);
router.get('/albums', getAlbums);
router.get('/albums/:id', albumIdValidation, getAlbumById);
router.get('/albums/:id/items', albumIdValidation, getAlbumItems);
router.get('/tags', getTags);
router.get('/tags/:id', getTagById);
router.get('/tags/:id/items', getItemsByTag);
router.get('/categories', getGalleryCategories);
router.get('/categories/:id', getGalleryCategoryById);
router.get('/images', getGalleryImages);

// Public actions (no auth required)
router.post('/items/:id/view', itemIdValidation, incrementView);
router.get('/items/:id/views', itemIdValidation, getViewCount);
router.get('/items/:id/comments', itemIdValidation, getComments);
router.post('/items/:id/comments', authenticate, itemIdValidation, commentValidation, createComment);

// Authenticated routes
router.use(authenticate);

// Gallery Items (Protected)
router.post('/items', authorize('admin', 'staff'), createItemValidation, createGalleryItem);
router.put('/items/:id', authorize('admin', 'staff'), itemIdValidation, updateItemValidation, updateGalleryItem);
router.delete('/items/:id', authorize('admin'), itemIdValidation, deleteGalleryItem);

// Gallery Images (Protected)
router.post('/items/:id/images', authorize('admin', 'staff'), itemIdValidation, multerConfig.general.array('images', 10), handleMulterError, uploadGalleryImage);
router.delete('/items/:id/images/:imageId', authorize('admin', 'staff'), deleteGalleryImage);

// Gallery Albums (Protected)
router.post('/albums', authorize('admin', 'staff'), albumValidation, createAlbum);
router.put('/albums/:id', authorize('admin', 'staff'), albumIdValidation, albumValidation, updateAlbum);
router.delete('/albums/:id', authorize('admin'), albumIdValidation, deleteAlbum);
router.post('/albums/:id/add', authorize('admin', 'staff'), albumIdValidation, addToAlbum);
router.post('/albums/:id/remove', authorize('admin', 'staff'), albumIdValidation, removeFromAlbum);

// Gallery Categories (Protected)
router.post('/categories', authorize('admin'), categoryValidation, createGalleryCategory);
router.put('/categories/:id', authorize('admin'), categoryValidation, updateGalleryCategory);
router.delete('/categories/:id', authorize('admin'), deleteGalleryCategory);

// Gallery Tags (Protected)
router.post('/tags', authorize('admin', 'staff'), tagValidation, createTag);
router.put('/tags/:id', authorize('admin', 'staff'), tagValidation, updateTag);
router.delete('/tags/:id', authorize('admin'), deleteTag);

// Gallery Comments (Protected)
router.put('/comments/:id', authorize('admin', 'staff'), updateComment);
router.delete('/comments/:id', authorize('admin'), deleteComment);

// Gallery Likes (Protected)
router.post('/items/:id/like', itemIdValidation, toggleLike);
router.get('/items/:id/likes', itemIdValidation, getLikes);

// Gallery Stats (Protected)
router.get('/stats', authorize('admin'), getGalleryStats);

// Gallery Reports (Protected)
router.get('/reports', authorize('admin'), getReports);
router.post('/reports/generate', authorize('admin'), generateReport);

module.exports = router;
