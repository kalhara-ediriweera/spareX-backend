import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Review from '../models/Review.js';

// @desc    Get all products with advanced filters
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      subcategory,
      brand,
      condition,
      minPrice,
      maxPrice,
      rating,
      make,
      model,
      year,
      engine,
      transmission,
      fuelType,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const query = { status: 'Active' };

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { partNumber: { $regex: search, $options: 'i' } },
        { oemNumber: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category / Subcategory
    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) query.category = cat._id;
    }
    if (subcategory) {
      const sub = await Category.findOne({ slug: subcategory });
      if (sub) query.subcategory = sub._id;
    }

    // Brand
    if (brand) {
      const br = await Brand.findOne({ slug: brand });
      if (br) query.brand = br._id;
    }

    // Condition
    if (condition) {
      query.condition = condition;
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Rating
    if (rating) {
      query.ratingAverage = { $gte: Number(rating) };
    }

    // Vehicle compatibility matching
    if (make || model || year || engine || transmission || fuelType) {
      const compatibilityQuery = {};
      if (make) compatibilityQuery.make = { $regex: new RegExp(`^${make}$`, 'i') };
      if (model) compatibilityQuery.model = { $regex: new RegExp(`^${model}$`, 'i') };
      if (year) {
        const yNum = Number(year);
        compatibilityQuery.yearStart = { $lte: yNum };
        compatibilityQuery.yearEnd = { $gte: yNum };
      }
      if (engine) compatibilityQuery.engine = { $in: [engine, 'All'] };
      if (transmission) compatibilityQuery.transmission = { $in: [transmission, 'All'] };
      if (fuelType) compatibilityQuery.fuelType = { $in: [fuelType, 'All'] };

      query.compatibility = { $elemMatch: compatibilityQuery };
    }

    // Sorting
    let sortQuery = { createdAt: -1 };
    if (sort) {
      switch (sort) {
        case 'price-asc':
          sortQuery = { price: 1 };
          break;
        case 'price-desc':
          sortQuery = { price: -1 };
          break;
        case 'rating':
          sortQuery = { ratingAverage: -1 };
          break;
        case 'popular':
          sortQuery = { numReviews: -1 };
          break;
        case 'title-asc':
          sortQuery = { title: 1 };
          break;
        case 'title-desc':
          sortQuery = { title: -1 };
          break;
      }
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('brand', 'name logo')
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      count,
      pages: Math.ceil(count / Number(limit)),
      currentPage: Number(page),
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get search suggestions for search bar autocomplete
// @route   GET /api/products/suggestions
// @access  Public
export const getSearchSuggestions = async (req, res, next) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ success: true, suggestions: [] });

  try {
    const suggestions = await Product.find({
      status: 'Active',
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { partNumber: { $regex: q, $options: 'i' } },
        { oemNumber: { $regex: q, $options: 'i' } }
      ]
    })
      .select('title slug partNumber oemNumber images price')
      .limit(8);

    res.json({ success: true, suggestions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dynamic vehicle compatibility filter dropdown values
// @route   GET /api/products/filters
// @access  Public
export const getVehicleFilterOptions = async (req, res, next) => {
  try {
    // We aggregate unique vehicle components from existing products compatibility fields
    const products = await Product.find({ status: 'Active' }).select('compatibility brand category');

    const makes = new Set();
    const modelsByMake = {};
    const years = new Set();
    const engines = new Set();
    const transmissions = new Set();
    const fuelTypes = new Set();

    products.forEach(prod => {
      prod.compatibility.forEach(comp => {
        makes.add(comp.make);
        
        if (!modelsByMake[comp.make]) {
          modelsByMake[comp.make] = new Set();
        }
        modelsByMake[comp.make].add(comp.model);

        for (let y = comp.yearStart; y <= comp.yearEnd; y++) {
          years.add(y);
        }
        
        if (comp.engine && comp.engine !== 'All') engines.add(comp.engine);
        if (comp.transmission && comp.transmission !== 'All') transmissions.add(comp.transmission);
        if (comp.fuelType && comp.fuelType !== 'All') fuelTypes.add(comp.fuelType);
      });
    });

    // Convert sets to sorted arrays
    const formattedModels = {};
    Object.keys(modelsByMake).forEach(make => {
      formattedModels[make] = Array.from(modelsByMake[make]).sort();
    });

    res.json({
      success: true,
      makes: Array.from(makes).sort(),
      models: formattedModels,
      years: Array.from(years).sort((a, b) => b - a),
      engines: Array.from(engines).sort(),
      transmissions: Array.from(transmissions).sort(),
      fuelTypes: Array.from(fuelTypes).sort()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product details
// @route   GET /api/products/:slug
// @access  Public
export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, status: 'Active' })
      .populate('brand')
      .populate('category')
      .populate('subcategory');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get reviews for this product
    const reviews = await Review.find({ product: product._id, isApproved: true })
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 });

    // Get related products (same category, excluding current product)
    const related = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      status: 'Active'
    })
      .populate('brand', 'name')
      .limit(4);

    res.json({
      success: true,
      product,
      reviews,
      related
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Product Review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res, next) => {
  const { rating, comment } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user already reviewed
    const alreadyReviewed = await Review.findOne({
      product: product._id,
      user: req.user._id
    });

    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'Product already reviewed' });
    }

    const review = await Review.create({
      product: product._id,
      user: req.user._id,
      userName: req.user.name,
      rating: Number(rating),
      comment
    });

    // Update Product average rating
    const reviews = await Review.find({ product: product._id, isApproved: true });
    product.numReviews = reviews.length;
    product.ratingAverage = 
      reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

    await product.save();

    res.status(201).json({ success: true, message: 'Review added', review });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Categories
// @route   GET /api/products/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ parentCategory: null });
    
    // Find all subcategories for each category
    const list = await Promise.all(categories.map(async (cat) => {
      const subcategories = await Category.find({ parentCategory: cat._id });
      return {
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        subcategories
      };
    }));

    res.json({ success: true, categories: list });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Brands
// @route   GET /api/products/brands
// @access  Public
export const getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({});
    res.json({ success: true, brands });
  } catch (error) {
    next(error);
  }
};

// @desc    Create Product (Admin)
// @route   POST /api/products
// @access  Private (Admin/Manager/Inventory Staff)
export const createProduct = async (req, res, next) => {
  try {
    const { 
      title, 
      description, 
      sku, 
      partNumber, 
      oemNumber, 
      price, 
      discountPrice, 
      stock, 
      status, 
      brand, 
      category, 
      subcategory, 
      condition, 
      originCountry, 
      warranty, 
      shippingDetails, 
      specifications, 
      compatibility 
    } = req.body;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    let productImages = [];
    if (req.files && req.files.length > 0) {
      productImages = req.files.map(f => `/uploads/products/${f.filename}`);
    } else if (req.body.images) {
      productImages = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    } else {
      productImages = ['/uploads/products/default.jpg'];
    }

    const product = await Product.create({
      title,
      description,
      slug,
      sku: sku || 'SKU-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      partNumber,
      oemNumber,
      price: Number(price),
      discountPrice: Number(discountPrice) || 0,
      stock: Number(stock) || 0,
      status: status || 'Active',
      brand,
      category,
      subcategory: subcategory || null,
      condition: condition || 'New',
      originCountry: originCountry || 'Japan',
      warranty: warranty || 'No Warranty',
      shippingDetails: shippingDetails ? (typeof shippingDetails === 'string' ? JSON.parse(shippingDetails) : shippingDetails) : { weight: 0.5, dimensions: 'Standard', fee: 0 },
      images: productImages,
      specifications: specifications ? (typeof specifications === 'string' ? JSON.parse(specifications) : specifications) : [],
      compatibility: compatibility ? (typeof compatibility === 'string' ? JSON.parse(compatibility) : compatibility) : [],
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Product (Admin)
// @route   PUT /api/products/:id
// @access  Private (Admin/Manager/Inventory Staff)
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updates = { ...req.body };
    
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(f => `/uploads/products/${f.filename}`);
    }

    if (updates.shippingDetails && typeof updates.shippingDetails === 'string') {
      updates.shippingDetails = JSON.parse(updates.shippingDetails);
    }
    if (updates.specifications && typeof updates.specifications === 'string') {
      updates.specifications = JSON.parse(updates.specifications);
    }
    if (updates.compatibility && typeof updates.compatibility === 'string') {
      updates.compatibility = JSON.parse(updates.compatibility);
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ success: true, product: updatedProduct });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Product (Admin)
// @route   DELETE /api/products/:id
// @access  Private (Admin/Manager)
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};
