import Favorite from '../models/favoriteModel.js';
import Product from '../models/productModel.js';

// @desc    Get user's favorites
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const { listName } = req.query;
    const query = { user: req.user._id };
    
    if (listName) {
      query.listName = listName;
    }

    const favorites = await Favorite.find(query)
      .populate({
        path: 'product',
        populate: {
          path: 'operator',
          select: 'companyName publicName',
        },
      })
      .sort({ createdAt: -1 });

    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Failed to fetch favorites' });
  }
};

// @desc    Get user's favorite lists
// @route   GET /api/favorites/lists
// @access  Private
const getFavoriteLists = async (req, res) => {
  try {
    const lists = await Favorite.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$listName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json(lists.map(list => ({ name: list._id, count: list.count })));
  } catch (error) {
    console.error('Get favorite lists error:', error);
    res.status(500).json({ message: 'Failed to fetch favorite lists' });
  }
};

// @desc    Add product to favorites
// @route   POST /api/favorites
// @access  Private
const addFavorite = async (req, res) => {
  try {
    const { productId, listName = 'default', notes } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if already favorited
    const existing = await Favorite.findOne({
      user: req.user._id,
      product: productId,
      listName,
    });

    if (existing) {
      return res.status(400).json({ message: 'Product already in this list' });
    }

    // Get current product price
    const currentPrice = Number(product.price) || 0;
    
    const favorite = new Favorite({
      user: req.user._id,
      product: productId,
      listName,
      notes: notes || '',
      priceWhenAdded: currentPrice,
    });

    await favorite.save();
    await favorite.populate({
      path: 'product',
      populate: {
        path: 'operator',
        select: 'companyName publicName',
      },
    });

    res.status(201).json(favorite);
  } catch (error) {
    console.error('Add favorite error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Product already in this list' });
    }
    res.status(500).json({ message: 'Failed to add favorite' });
  }
};

// @desc    Remove product from favorites
// @route   DELETE /api/favorites/:id
// @access  Private
const removeFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findById(req.params.id);

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    // Check authorization
    if (favorite.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await favorite.deleteOne();
    res.json({ message: 'Favorite removed' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ message: 'Failed to remove favorite' });
  }
};

// @desc    Update favorite (move to different list or update notes)
// @route   PUT /api/favorites/:id
// @access  Private
const updateFavorite = async (req, res) => {
  try {
    const { listName, notes } = req.body;
    const favorite = await Favorite.findById(req.params.id);

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    // Check authorization
    if (favorite.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (listName !== undefined) {
      // Check if product already exists in target list
      const existing = await Favorite.findOne({
        user: req.user._id,
        product: favorite.product,
        listName,
        _id: { $ne: favorite._id },
      });

      if (existing) {
        return res.status(400).json({ message: 'Product already in target list' });
      }

      favorite.listName = listName;
    }

    if (notes !== undefined) {
      favorite.notes = notes;
    }

    await favorite.save();
    await favorite.populate({
      path: 'product',
      populate: {
        path: 'operator',
        select: 'companyName publicName',
      },
    });

    res.json(favorite);
  } catch (error) {
    console.error('Update favorite error:', error);
    res.status(500).json({ message: 'Failed to update favorite' });
  }
};

// @desc    Check if product is favorited
// @route   GET /api/favorites/check/:productId
// @access  Private
const checkFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOne({
      user: req.user._id,
      product: req.params.productId,
    });

    res.json({ isFavorited: !!favorite, favorite: favorite || null });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ message: 'Failed to check favorite' });
  }
};

// @desc    Share a favorite list
// @route   POST /api/favorites/lists/:listName/share
// @access  Private
const shareList = async (req, res) => {
  try {
    const { listName } = req.params;
    const crypto = await import('crypto');
    
    // Generate unique share token
    const shareToken = crypto.randomBytes(16).toString('hex');
    
    // Update all favorites in this list to be public
    await Favorite.updateMany(
      { user: req.user._id, listName },
      { isPublic: true, shareToken }
    );
    
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/shared-list/${shareToken}`;
    
    res.json({ shareUrl, shareToken });
  } catch (error) {
    console.error('Share list error:', error);
    res.status(500).json({ message: 'Failed to share list' });
  }
};

// @desc    Get public shared list
// @route   GET /api/favorites/shared/:token
// @access  Public
const getSharedList = async (req, res) => {
  try {
    const { token } = req.params;
    
    const favorites = await Favorite.find({ shareToken: token, isPublic: true })
      .populate({
        path: 'product',
        populate: {
          path: 'operator',
          select: 'companyName publicName',
        },
      })
      .sort({ createdAt: -1 });
    
    if (favorites.length === 0) {
      return res.status(404).json({ message: 'Shared list not found' });
    }
    
    res.json({
      listName: favorites[0].listName,
      products: favorites.map(f => f.product),
      count: favorites.length,
    });
  } catch (error) {
    console.error('Get shared list error:', error);
    res.status(500).json({ message: 'Failed to fetch shared list' });
  }
};

// @desc    Check for price drops in favorites
// @route   GET /api/favorites/price-alerts
// @access  Private
const getPriceAlerts = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate('product');
    
    const alerts = [];
    
    for (const favorite of favorites) {
      if (favorite.priceWhenAdded && favorite.product) {
        const currentPrice = Number(favorite.product.price) || 0;
        const oldPrice = favorite.priceWhenAdded;
        
        if (currentPrice < oldPrice) {
          const discount = ((oldPrice - currentPrice) / oldPrice) * 100;
          alerts.push({
            favoriteId: favorite._id,
            product: favorite.product,
            oldPrice,
            currentPrice,
            discount: discount.toFixed(1),
            savings: oldPrice - currentPrice,
          });
        }
      }
    }
    
    res.json({ alerts, count: alerts.length });
  } catch (error) {
    console.error('Get price alerts error:', error);
    res.status(500).json({ message: 'Failed to fetch price alerts' });
  }
};

export {
  getFavorites,
  getFavoriteLists,
  addFavorite,
  removeFavorite,
  updateFavorite,
  checkFavorite,
  shareList,
  getSharedList,
  getPriceAlerts,
};

