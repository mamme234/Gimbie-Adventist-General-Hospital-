/**
 * ============================================
 * GALLERY.CONTROLLER.JS - Gallery Controller
 * ============================================
 */

const GalleryItem = require('../models/GalleryItem');
const GalleryCategory = require('../models/GalleryCategory');
const GalleryAlbum = require('../models/GalleryAlbum');
const GalleryTag = require('../models/GalleryTag');
const GalleryComment = require('../models/GalleryComment');
const GalleryLike = require('../models/GalleryLike');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Get all gallery items
 */
const getGalleryItems = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, tag, status, featured } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (status) query.status = status;
    if (featured === 'true') query.isFeatured = true;

    const items = await GalleryItem.find(query)
      .populate('category', 'name')
      .populate('tags', 'name')
      .populate('uploadedBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await GalleryItem.countDocuments(query);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get gallery items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gallery items',
      error: error.message
    });
  }
};

/**
 * Get gallery item by ID
 */
const getGalleryItemById = async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id)
      .populate('category', 'name')
      .populate('tags', 'name')
      .populate('uploadedBy', 'firstName lastName');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    // Increment view count
    item.views += 1;
    await item.save();

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    logger.error('Get gallery item by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gallery item',
      error: error.message
    });
  }
};

/**
 * Create gallery item
 */
const createGalleryItem = async (req, res) => {
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
      description,
      categoryId,
      tags,
      imageUrl,
      isFeatured,
      status,
      metadata
    } = req.body;

    const itemId = `GAL-${new Date().getFullYear()}-${String(await GalleryItem.countDocuments() + 1).padStart(4, '0')}`;

    const item = new GalleryItem({
      itemId,
      title,
      description,
      category: categoryId,
      tags: tags || [],
      imageUrl,
      isFeatured: isFeatured || false,
      status: status || 'Published',
      metadata: metadata || {},
      uploadedBy: req.user._id
    });

    await item.save();

    logger.info(`Gallery item created: ${item.itemId}`);

    res.status(201).json({
      success: true,
      message: 'Gallery item created successfully',
      data: item
    });
  } catch (error) {
    logger.error('Create gallery item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create gallery item',
      error: error.message
    });
  }
};

/**
 * Update gallery item
 */
const updateGalleryItem = async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    const {
      title,
      description,
      categoryId,
      tags,
      imageUrl,
      isFeatured,
      status,
      metadata
    } = req.body;

    if (title) item.title = title;
    if (description) item.description = description;
    if (categoryId) item.category = categoryId;
    if (tags) item.tags = tags;
    if (imageUrl) item.imageUrl = imageUrl;
    if (isFeatured !== undefined) item.isFeatured = isFeatured;
    if (status) item.status = status;
    if (metadata) item.metadata = { ...item.metadata, ...metadata };

    await item.save();

    logger.info(`Gallery item updated: ${item.itemId}`);

    res.status(200).json({
      success: true,
      message: 'Gallery item updated successfully',
      data: item
    });
  } catch (error) {
    logger.error('Update gallery item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update gallery item',
      error: error.message
    });
  }
};

/**
 * Delete gallery item
 */
const deleteGalleryItem = async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    item.status = 'Archived';
    await item.save();

    logger.info(`Gallery item archived: ${item.itemId}`);

    res.status(200).json({
      success: true,
      message: 'Gallery item archived successfully'
    });
  } catch (error) {
    logger.error('Delete gallery item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive gallery item',
      error: error.message
    });
  }
};

/**
 * Get featured items
 */
const getFeaturedItems = async (req, res) => {
  try {
    const items = await GalleryItem.find({
      isFeatured: true,
      status: 'Published'
    })
      .populate('category', 'name')
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    logger.error('Get featured items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get featured items',
      error: error.message
    });
  }
};

/**
 * Get items by category
 */
const getItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const items = await GalleryItem.find({
      category: category,
      status: 'Published'
    })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    logger.error('Get items by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get items by category',
      error: error.message
    });
  }
};

/**
 * Get gallery categories
 */
const getGalleryCategories = async (req, res) => {
  try {
    const categories = await GalleryCategory.find().sort({ name: 1 });

    // Get item count for each category
    const categoriesWithCount = await Promise.all(categories.map(async (cat) => {
      const count = await GalleryItem.countDocuments({
        category: cat._id,
        status: 'Published'
      });
      return {
        ...cat.toObject(),
        itemCount: count
      };
    }));

    res.status(200).json({
      success: true,
      data: categoriesWithCount
    });
  } catch (error) {
    logger.error('Get gallery categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gallery categories',
      error: error.message
    });
  }
};

/**
 * Get gallery category by ID
 */
const getGalleryCategoryById = async (req, res) => {
  try {
    const category = await GalleryCategory.findById(req.params.id);
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
    logger.error('Get gallery category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gallery category',
      error: error.message
    });
  }
};

/**
 * Create gallery category
 */
const createGalleryCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, description, icon } = req.body;

    const category = new GalleryCategory({
      name,
      description,
      icon: icon || 'fa-folder',
      isActive: true
    });

    await category.save();

    logger.info(`Gallery category created: ${category.name}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    logger.error('Create gallery category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create gallery category',
      error: error.message
    });
  }
};

/**
 * Update gallery category
 */
const updateGalleryCategory = async (req, res) => {
  try {
    const category = await GalleryCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const { name, description, icon, isActive } = req.body;

    if (name) category.name = name;
    if (description) category.description = description;
    if (icon) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    logger.info(`Gallery category updated: ${category.name}`);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    logger.error('Update gallery category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update gallery category',
      error: error.message
    });
  }
};

/**
 * Delete gallery category
 */
const deleteGalleryCategory = async (req, res) => {
  try {
    const category = await GalleryCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.isActive = false;
    await category.save();

    logger.info(`Gallery category deactivated: ${category.name}`);

    res.status(200).json({
      success: true,
      message: 'Category deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete gallery category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate gallery category',
      error: error.message
    });
  }
};

/**
 * Upload gallery image
 */
const uploadGalleryImage = async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    const images = req.files.map(file => ({
      url: `/uploads/gallery/${file.filename}`,
      filename: file.filename,
      size: file.size,
      uploadedAt: new Date()
    }));

    item.images = [...(item.images || []), ...images];
    await item.save();

    logger.info(`Images uploaded for gallery item: ${item.itemId}`);

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: images
    });
  } catch (error) {
    logger.error('Upload gallery image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
};

/**
 * Delete gallery image
 */
const deleteGalleryImage = async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    const { imageId } = req.params;
    item.images = item.images.filter(img => img._id.toString() !== imageId);
    await item.save();

    logger.info(`Image deleted from gallery item: ${item.itemId}`);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    logger.error('Delete gallery image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};

/**
 * Get gallery images
 */
const getGalleryImages = async (req, res) => {
  try {
    const { itemId } = req.query;
    let query = {};
    if (itemId) query._id = itemId;

    const items = await GalleryItem.find(query)
      .select('images title itemId');

    const images = items.flatMap(item => 
      (item.images || []).map(img => ({
        ...img,
        itemId: item.itemId,
        title: item.title
      }))
    );

    res.status(200).json({
      success: true,
      data: images
    });
  } catch (error) {
    logger.error('Get gallery images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gallery images',
      error: error.message
    });
  }
};

/**
 * Get albums
 */
const getAlbums = async (req, res) => {
  try {
    const albums = await GalleryAlbum.find()
      .populate('items', 'title itemId images')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: albums
    });
  } catch (error) {
    logger.error('Get albums error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get albums',
      error: error.message
    });
  }
};

/**
 * Get album by ID
 */
const getAlbumById = async (req, res) => {
  try {
    const album = await GalleryAlbum.findById(req.params.id)
      .populate('items', 'title itemId images description')
      .populate('createdBy', 'firstName lastName');

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    res.status(200).json({
      success: true,
      data: album
    });
  } catch (error) {
    logger.error('Get album by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get album',
      error: error.message
    });
  }
};

/**
 * Create album
 */
const createAlbum = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, description, coverImage, items } = req.body;

    const album = new GalleryAlbum({
      name,
      description,
      coverImage,
      items: items || [],
      createdBy: req.user._id,
      isActive: true
    });

    await album.save();

    logger.info(`Gallery album created: ${album.name}`);

    res.status(201).json({
      success: true,
      message: 'Album created successfully',
      data: album
    });
  } catch (error) {
    logger.error('Create album error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create album',
      error: error.message
    });
  }
};

/**
 * Update album
 */
const updateAlbum = async (req, res) => {
  try {
    const album = await GalleryAlbum.findById(req.params.id);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    const { name, description, coverImage, items, isActive } = req.body;

    if (name) album.name = name;
    if (description) album.description = description;
    if (coverImage) album.coverImage = coverImage;
    if (items) album.items = items;
    if (isActive !== undefined) album.isActive = isActive;

    await album.save();

    logger.info(`Gallery album updated: ${album.name}`);

    res.status(200).json({
      success: true,
      message: 'Album updated successfully',
      data: album
    });
  } catch (error) {
    logger.error('Update album error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update album',
      error: error.message
    });
  }
};

/**
 * Delete album
 */
const deleteAlbum = async (req, res) => {
  try {
    const album = await GalleryAlbum.findById(req.params.id);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    album.isActive = false;
    await album.save();

    logger.info(`Gallery album deactivated: ${album.name}`);

    res.status(200).json({
      success: true,
      message: 'Album deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete album error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate album',
      error: error.message
    });
  }
};

/**
 * Get album items
 */
const getAlbumItems = async (req, res) => {
  try {
    const album = await GalleryAlbum.findById(req.params.id)
      .populate('items', 'title itemId images description tags');

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    res.status(200).json({
      success: true,
      data: album.items || []
    });
  } catch (error) {
    logger.error('Get album items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get album items',
      error: error.message
    });
  }
};

/**
 * Add to album
 */
const addToAlbum = async (req, res) => {
  try {
    const album = await GalleryAlbum.findById(req.params.id);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    const { itemId } = req.body;

    const item = await GalleryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    if (!album.items.includes(itemId)) {
      album.items.push(itemId);
      await album.save();
    }

    logger.info(`Item added to album: ${album.name}`);

    res.status(200).json({
      success: true,
      message: 'Item added to album successfully',
      data: album
    });
  } catch (error) {
    logger.error('Add to album error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to album',
      error: error.message
    });
  }
};

/**
 * Remove from album
 */
const removeFromAlbum = async (req, res) => {
  try {
    const album = await GalleryAlbum.findById(req.params.id);
    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    const { itemId } = req.body;

    album.items = album.items.filter(id => id.toString() !== itemId);
    await album.save();

    logger.info(`Item removed from album: ${album.name}`);

    res.status(200).json({
      success: true,
      message: 'Item removed from album successfully',
      data: album
    });
  } catch (error) {
    logger.error('Remove from album error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from album',
      error: error.message
    });
  }
};

/**
 * Get tags
 */
const getTags = async (req, res) => {
  try {
    const tags = await GalleryTag.find().sort({ name: 1 });

    // Get item count for each tag
    const tagsWithCount = await Promise.all(tags.map(async (tag) => {
      const count = await GalleryItem.countDocuments({
        tags: tag._id,
        status: 'Published'
      });
      return {
        ...tag.toObject(),
        itemCount: count
      };
    }));

    res.status(200).json({
      success: true,
      data: tagsWithCount
    });
  } catch (error) {
    logger.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tags',
      error: error.message
    });
  }
};

/**
 * Get tag by ID
 */
const getTagById = async (req, res) => {
  try {
    const tag = await GalleryTag.findById(req.params.id);
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
    logger.error('Get tag by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tag',
      error: error.message
    });
  }
};

/**
 * Create tag
 */
const createTag = async (req, res) => {
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

    const tag = new GalleryTag({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      isActive: true
    });

    await tag.save();

    logger.info(`Gallery tag created: ${tag.name}`);

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: tag
    });
  } catch (error) {
    logger.error('Create tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tag',
      error: error.message
    });
  }
};

/**
 * Update tag
 */
const updateTag = async (req, res) => {
  try {
    const tag = await GalleryTag.findById(req.params.id);
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

    logger.info(`Gallery tag updated: ${tag.name}`);

    res.status(200).json({
      success: true,
      message: 'Tag updated successfully',
      data: tag
    });
  } catch (error) {
    logger.error('Update tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tag',
      error: error.message
    });
  }
};

/**
 * Delete tag
 */
const deleteTag = async (req, res) => {
  try {
    const tag = await GalleryTag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    tag.isActive = false;
    await tag.save();

    logger.info(`Gallery tag deactivated: ${tag.name}`);

    res.status(200).json({
      success: true,
      message: 'Tag deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate tag',
      error: error.message
    });
  }
};

/**
 * Get items by tag
 */
const getItemsByTag = async (req, res) => {
  try {
    const { tagId } = req.params;

    const items = await GalleryItem.find({
      tags: tagId,
      status: 'Published'
    })
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    logger.error('Get items by tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get items by tag',
      error: error.message
    });
  }
};

/**
 * Get comments
 */
const getComments = async (req, res) => {
  try {
    const { itemId } = req.params;

    const comments = await GalleryComment.find({ item: itemId })
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    logger.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comments',
      error: error.message
    });
  }
};

/**
 * Get comment by ID
 */
const getCommentById = async (req, res) => {
  try {
    const comment = await GalleryComment.findById(req.params.id)
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
    logger.error('Get comment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comment',
      error: error.message
    });
  }
};

/**
 * Create comment
 */
const createComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { itemId, content } = req.body;

    const item = await GalleryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    const comment = new GalleryComment({
      item: itemId,
      user: req.user._id,
      content
    });

    await comment.save();

    logger.info(`Comment created for gallery item: ${itemId}`);

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment
    });
  } catch (error) {
    logger.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message
    });
  }
};

/**
 * Update comment
 */
const updateComment = async (req, res) => {
  try {
    const comment = await GalleryComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is comment owner or admin
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { content } = req.body;

    if (content) comment.content = content;
    comment.isEdited = true;
    comment.editedAt = new Date();

    await comment.save();

    logger.info(`Comment updated: ${comment._id}`);

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });
  } catch (error) {
    logger.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
};

/**
 * Delete comment
 */
const deleteComment = async (req, res) => {
  try {
    const comment = await GalleryComment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is comment owner or admin
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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
    logger.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

/**
 * Toggle like
 */
const toggleLike = async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    const existingLike = await GalleryLike.findOne({
      item: item._id,
      user: req.user._id
    });

    if (existingLike) {
      await existingLike.remove();
      item.likes = Math.max(0, item.likes - 1);
      await item.save();
      res.status(200).json({
        success: true,
        message: 'Like removed',
        data: { liked: false, likes: item.likes }
      });
    } else {
      const like = new GalleryLike({
        item: item._id,
        user: req.user._id
      });
      await like.save();
      item.likes += 1;
      await item.save();
      res.status(200).json({
        success: true,
        message: 'Like added',
        data: { liked: true, likes: item.likes }
      });
    }
  } catch (error) {
    logger.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: error.message
    });
  }
};

/**
 * Get likes
 */
const getLikes = async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    const likes = await GalleryLike.find({ item: item._id })
      .populate('user', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: {
        count: likes.length,
        likes
      }
    });
  } catch (error) {
    logger.error('Get likes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get likes',
      error: error.message
    });
  }
};

/**
 * Increment view
 */
const incrementView = async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    item.views += 1;
    await item.save();

    res.status(200).json({
      success: true,
      message: 'View incremented',
      data: { views: item.views }
    });
  } catch (error) {
    logger.error('Increment view error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to increment view',
      error: error.message
    });
  }
};

/**
 * Get view count
 */
const getViewCount = async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { views: item.views }
    });
  } catch (error) {
    logger.error('Get view count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get view count',
      error: error.message
    });
  }
};

/**
 * Get gallery stats
 */
const getGalleryStats = async (req, res) => {
  try {
    const [
      totalItems,
      publishedItems,
      totalAlbums,
      totalTags,
      totalComments,
      totalLikes
    ] = await Promise.all([
      GalleryItem.countDocuments(),
      GalleryItem.countDocuments({ status: 'Published' }),
      GalleryAlbum.countDocuments({ isActive: true }),
      GalleryTag.countDocuments({ isActive: true }),
      GalleryComment.countDocuments(),
      GalleryLike.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalItems,
        publishedItems,
        totalAlbums,
        totalTags,
        totalComments,
        totalLikes,
        views: 0 // Would need to aggregate views
      }
    });
  } catch (error) {
    logger.error('Get gallery stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gallery stats',
      error: error.message
    });
  }
};

/**
 * Get reports
 */
const getReports = async (req, res) => {
  try {
    // Placeholder - would generate gallery reports
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reports',
      error: error.message
    });
  }
};

/**
 * Generate report
 */
const generateReport = async (req, res) => {
  try {
    // Placeholder - would generate report
    res.status(200).json({
      success: true,
      message: 'Report generated successfully'
    });
  } catch (error) {
    logger.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message
    });
  }
};

module.exports = {
  getGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  getFeaturedItems,
  getItemsByCategory,
  getGalleryCategories,
  getGalleryCategoryById,
  createGalleryCategory,
  updateGalleryCategory,
  deleteGalleryCategory,
  uploadGalleryImage,
  deleteGalleryImage,
  getGalleryImages,
  getAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  getAlbumItems,
  addToAlbum,
  removeFromAlbum,
  getTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  getItemsByTag,
  getComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
  toggleLike,
  getLikes,
  incrementView,
  getViewCount,
  getGalleryStats,
  getReports,
  generateReport
};
