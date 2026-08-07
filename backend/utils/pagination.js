// utils/pagination.js
class Pagination {
  constructor() {
    this.defaultLimit = 20;
    this.maxLimit = 100;
  }

  // Get pagination parameters
  getPaginationParams(query) {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(
      parseInt(query.limit) || this.defaultLimit,
      this.maxLimit
    );
    const skip = (page - 1) * limit;
    const sort = this.parseSort(query.sort, query.sortBy);

    return {
      page,
      limit,
      skip,
      sort
    };
  }

  // Parse sort parameters
  parseSort(sort, sortBy) {
    const sortField = sort || 'createdAt';
    const sortOrder = sortBy === 'asc' ? 1 : -1;
    return { [sortField]: sortOrder };
  }

  // Generate pagination metadata
  generateMetadata(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev
    };
  }

  // Get paginated results
  async paginate(model, query = {}, options = {}) {
    try {
      const { page, limit, skip, sort } = this.getPaginationParams(
        options.query || {}
      );

      const filter = options.filter || {};
      const projection = options.projection || null;
      const populate = options.populate || null;

      // Build query
      let queryBuilder = model.find({ ...filter, ...query });

      // Apply projection
      if (projection) {
        queryBuilder = queryBuilder.select(projection);
      }

      // Apply populate
      if (populate) {
        queryBuilder = queryBuilder.populate(populate);
      }

      // Get total count
      const total = await model.countDocuments({ ...filter, ...query });

      // Get paginated results
      const results = await queryBuilder
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      const metadata = this.generateMetadata(total, page, limit);

      return {
        data: results,
        metadata,
        links: this.generateLinks(options.baseUrl || '', page, limit, total, options.query || {})
      };
    } catch (error) {
      throw error;
    }
  }

  // Get paginated aggregation results
  async paginateAggregate(model, pipeline = [], options = {}) {
    try {
      const { page, limit, skip, sort } = this.getPaginationParams(
        options.query || {}
      );

      // Add pagination to pipeline
      const paginatedPipeline = [
        ...pipeline,
        { $sort: sort },
        { $skip: skip },
        { $limit: limit }
      ];

      // Get paginated results
      const results = await model.aggregate(paginatedPipeline);

      // Get total count
      const countPipeline = [
        ...pipeline,
        { $count: 'total' }
      ];
      const countResult = await model.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

      const metadata = this.generateMetadata(total, page, limit);

      return {
        data: results,
        metadata,
        links: this.generateLinks(options.baseUrl || '', page, limit, total, options.query || {})
      };
    } catch (error) {
      throw error;
    }
  }

  // Generate pagination links
  generateLinks(baseUrl, page, limit, total, query = {}) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Remove pagination params from query
    const { page: _, limit: __, ...cleanQuery } = query;

    const buildUrl = (pageNum) => {
      const params = new URLSearchParams({
        ...cleanQuery,
        page: pageNum,
        limit
      });
      return `${baseUrl}?${params.toString()}`;
    };

    return {
      first: buildUrl(1),
      previous: hasPrev ? buildUrl(page - 1) : null,
      current: buildUrl(page),
      next: hasNext ? buildUrl(page + 1) : null,
      last: buildUrl(totalPages)
    };
  }

  // Create pagination middleware
  middleware() {
    return (req, res, next) => {
      const pagination = this.getPaginationParams(req.query);
      req.pagination = pagination;
      next();
    };
  }

  // Parse cursor-based pagination
  parseCursor(cursor) {
    if (!cursor) return null;
    try {
      return JSON.parse(Buffer.from(cursor, 'base64').toString());
    } catch (error) {
      return null;
    }
  }

  // Generate cursor
  generateCursor(data) {
    if (!data) return null;
    try {
      return Buffer.from(JSON.stringify(data)).toString('base64');
    } catch (error) {
      return null;
    }
  }

  // Get cursor pagination
  async cursorPaginate(model, query = {}, options = {}) {
    try {
      const limit = Math.min(
        parseInt(options.limit) || this.defaultLimit,
        this.maxLimit
      );
      const cursor = this.parseCursor(options.cursor);
      const sort = this.parseSort(options.sort, options.sortBy);

      // Build query
      let queryBuilder = model.find(query);

      // Apply cursor
      if (cursor) {
        const cursorQuery = {};
        for (const [key, value] of Object.entries(cursor)) {
          cursorQuery[key] = { $lt: value };
        }
        queryBuilder = queryBuilder.find({
          ...query,
          ...cursorQuery
        });
      }

      // Apply sort
      queryBuilder = queryBuilder.sort(sort);

      // Get results (limit + 1 to check for next page)
      const results = await queryBuilder
        .limit(limit + 1)
        .lean();

      // Check if there are more results
      const hasMore = results.length > limit;
      const data = hasMore ? results.slice(0, limit) : results;

      // Generate next cursor
      let nextCursor = null;
      if (hasMore && data.length > 0) {
        const lastItem = data[data.length - 1];
        const cursorData = {};
        for (const [key] of Object.entries(sort)) {
          cursorData[key] = lastItem[key];
        }
        nextCursor = this.generateCursor(cursorData);
      }

      return {
        data,
        metadata: {
          limit,
          hasMore,
          nextCursor
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Search with pagination
  async searchWithPagination(model, searchFields, searchTerm, options = {}) {
    try {
      if (!searchTerm) {
        return this.paginate(model, {}, options);
      }

      const searchQuery = {
        $or: searchFields.map(field => ({
          [field]: { $regex: searchTerm, $options: 'i' }
        }))
      };

      const query = options.query || {};
      const filter = options.filter || {};

      return this.paginate(model, { ...searchQuery, ...filter }, {
        ...options,
        query: { ...options.query }
      });
    } catch (error) {
      throw error;
    }
  }

  // Get pagination info
  getPaginationInfo(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit + 1;
    const endIndex = Math.min(page * limit, total);

    return {
      total,
      page,
      limit,
      totalPages,
      startIndex,
      endIndex,
      hasPrevious: page > 1,
      hasNext: page < totalPages
    };
  }

  // Format paginated response
  formatResponse(data, metadata, baseUrl = '') {
    return {
      success: true,
      data,
      metadata,
      links: this.generateLinks(baseUrl, metadata.page, metadata.limit, metadata.total)
    };
  }
}

module.exports = new Pagination();
