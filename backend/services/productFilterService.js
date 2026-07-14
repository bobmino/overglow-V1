/**
 * Shared product filter query builder for catalogue search.
 * Used by /api/products and /api/search/advanced + facets.
 */

const categoryNormalization = {
  tours: 'Tours',
  'day-trips': 'Day Trips',
  'day trips': 'Day Trips',
  daytrips: 'Day Trips',
  outdoor: 'Outdoor Activities',
  'outdoor activities': 'Outdoor Activities',
  outdooractivities: 'Outdoor Activities',
  shows: 'Shows & Performances',
  'shows & performances': 'Shows & Performances',
  showsandperformances: 'Shows & Performances',
  'food-drink': 'Food & Drink',
  'food & drink': 'Food & Drink',
  foodanddrink: 'Food & Drink',
  workshops: 'Classes & Workshops',
  'classes & workshops': 'Classes & Workshops',
  classesandworkshops: 'Classes & Workshops',
  activities: 'Activities',
  attractions: 'Attractions',
};

export const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const normalizeCategory = (category) => {
  if (!category) return null;
  const lower = String(category).toLowerCase().trim();
  if (categoryNormalization[lower]) return categoryNormalization[lower];
  const standards = Object.values(categoryNormalization);
  for (const name of standards) {
    if (name.toLowerCase() === lower) return name;
  }
  return category.trim();
};

const parseDurationToHours = (durationStr) => {
  if (!durationStr) return null;
  const lower = String(durationStr).toLowerCase();
  const hoursMatch = lower.match(/(\d+)\s*(?:heures?|hours?|h)/);
  if (hoursMatch) return parseInt(hoursMatch[1], 10);
  const daysMatch = lower.match(/(\d+)\s*(?:jours?|days?|j)/);
  if (daysMatch) return parseInt(daysMatch[1], 10) * 24;
  const minutesMatch = lower.match(/(\d+)\s*(?:minutes?|mins?|m)/);
  if (minutesMatch) return parseInt(minutesMatch[1], 10) / 60;
  return null;
};

export const matchesDurationFilter = (durationStr, durationFilters) => {
  if (!durationFilters || durationFilters.length === 0) return true;
  if (!durationStr) return false;
  const hours = parseDurationToHours(durationStr);
  if (hours === null) return false;
  return durationFilters.some((filter) => {
    switch (filter) {
      case '0-2':
        return hours < 2;
      case '2-4':
        return hours >= 2 && hours < 4;
      case '4-8':
        return hours >= 4 && hours < 8;
      case '1-day':
        return hours >= 8 && hours <= 24;
      case 'multi-day':
        return hours > 24;
      default:
        return true;
    }
  });
};

/**
 * Parse query string params into a normalized filter object.
 */
export const parseFilterParams = (query = {}) => {
  const durationsRaw = query.durations;
  let durations = [];
  if (Array.isArray(durationsRaw)) {
    durations = durationsRaw.filter(Boolean);
  } else if (typeof durationsRaw === 'string' && durationsRaw.trim()) {
    durations = durationsRaw.split(',').map((d) => d.trim()).filter(Boolean);
  }

  const categoriesRaw = query.categories || query.category;
  let categories = [];
  if (Array.isArray(categoriesRaw)) {
    categories = categoriesRaw.filter(Boolean);
  } else if (typeof categoriesRaw === 'string' && categoriesRaw.trim()) {
    categories = categoriesRaw.split(',').map((c) => c.trim()).filter(Boolean);
  }

  const tagsRaw = query.tags;
  let tags = [];
  if (Array.isArray(tagsRaw)) {
    tags = tagsRaw.filter(Boolean);
  } else if (typeof tagsRaw === 'string' && tagsRaw.trim()) {
    tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean);
  }

  const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
  let categoryGroup =
    typeof query.categoryGroup === 'string' && OBJECT_ID_RE.test(query.categoryGroup.trim())
      ? query.categoryGroup.trim()
      : null;

  // Legacy carousel links used ?category=<ObjectId>
  if (!categoryGroup && categories.length === 1 && OBJECT_ID_RE.test(categories[0])) {
    categoryGroup = categories[0];
    categories = [];
  } else {
    categories = categories.filter((c) => !OBJECT_ID_RE.test(c));
  }

  const rawProductType =
    typeof query.productType === 'string' ? query.productType.trim().toLowerCase() : '';
  const productType = ['tour', 'luxury_stay', 'service'].includes(rawProductType)
    ? rawProductType
    : '';

  return {
    q: typeof query.q === 'string' ? query.q.trim() : (typeof query.search === 'string' ? query.search.trim() : ''),
    city: typeof query.city === 'string' ? query.city.trim() : '',
    categories,
    productType,
    categoryGroup,
    minPrice: query.minPrice != null && query.minPrice !== '' ? Number(query.minPrice) : null,
    maxPrice: query.maxPrice != null && query.maxPrice !== '' ? Number(query.maxPrice) : null,
    minRating: query.minRating != null && query.minRating !== '' ? Number(query.minRating) : null,
    durations,
    selectedDate: typeof query.selectedDate === 'string' ? query.selectedDate : null,
    locationLat: query.locationLat != null ? Number(query.locationLat) : null,
    locationLng: query.locationLng != null ? Number(query.locationLng) : null,
    radius: query.radius != null && query.radius !== '' ? Number(query.radius) : null,
    skipTheLine: query.skipTheLine === 'true' || query.skipTheLine === true,
    tags,
    sortBy: typeof query.sortBy === 'string' ? query.sortBy : 'recommended',
    page: Math.max(1, parseInt(query.page, 10) || 1),
    limit: Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20)),
  };
};

/**
 * Build MongoDB filter for published products.
 * No city hardcode — empty filters return all published products.
 */
export const buildPublishedProductQuery = (filters) => {
  const query = { status: { $regex: /^published$/i } };
  const and = [];

  if (filters.q) {
    const keywordRegex = escapeRegex(filters.q);
    and.push({
      $or: [
        { title: { $regex: keywordRegex, $options: 'i' } },
        { description: { $regex: keywordRegex, $options: 'i' } },
        { highlights: { $in: [new RegExp(keywordRegex, 'i')] } },
        { city: { $regex: keywordRegex, $options: 'i' } },
        { category: { $regex: keywordRegex, $options: 'i' } },
        { tags: { $elemMatch: { $regex: keywordRegex, $options: 'i' } } },
      ],
    });
  }

  if (filters.city) {
    and.push({ city: { $regex: `^${escapeRegex(filters.city)}$`, $options: 'i' } });
  }

  if (filters.categories?.length) {
    const categoryRegexes = filters.categories.map((c) => {
      const normalized = normalizeCategory(c);
      return new RegExp(`^${escapeRegex(normalized)}$`, 'i');
    });
    and.push({
      $or: categoryRegexes.map((rx) => ({ category: { $regex: rx } })),
    });
  }

  if (filters.productType) {
    and.push({ productType: filters.productType });
  }

  if (filters.categoryGroup) {
    and.push({ categoryGroup: filters.categoryGroup });
  }

  if (filters.skipTheLine) {
    and.push({ 'skipTheLine.enabled': true });
  }

  if (filters.tags?.length) {
    and.push({
      tags: {
        $all: filters.tags.map((tag) => new RegExp(`^${escapeRegex(tag)}$`, 'i')),
      },
    });
  }

  if (Number.isFinite(filters.minPrice) || Number.isFinite(filters.maxPrice)) {
    const priceClause = {};
    if (Number.isFinite(filters.minPrice)) priceClause.$gte = filters.minPrice;
    if (Number.isFinite(filters.maxPrice)) priceClause.$lte = filters.maxPrice;
    and.push({ price: priceClause });
  }

  if (Number.isFinite(filters.minRating) && filters.minRating > 0) {
    and.push({
      $or: [
        { 'metrics.averageRating': { $gte: filters.minRating } },
        { averageRating: { $gte: filters.minRating } },
      ],
    });
  }

  if (
    Number.isFinite(filters.locationLat) &&
    Number.isFinite(filters.locationLng) &&
    Number.isFinite(filters.radius) &&
    filters.radius > 0
  ) {
    and.push({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [filters.locationLng, filters.locationLat],
          },
          $maxDistance: filters.radius * 1000,
        },
      },
    });
  }

  if (and.length) {
    query.$and = and;
  }

  return query;
};

export const buildSortOption = (sortBy) => {
  switch (sortBy) {
    case 'price-low':
      return { price: 1, createdAt: -1 };
    case 'price-high':
      return { price: -1, createdAt: -1 };
    case 'rating':
      return { 'metrics.averageRating': -1, 'metrics.reviewCount': -1 };
    case 'popularity':
      return { 'metrics.bookingCount': -1, 'metrics.reviewCount': -1 };
    case 'newest':
      return { createdAt: -1 };
    case 'recommended':
    default:
      return { 'metrics.isPopular': -1, 'metrics.averageRating': -1, createdAt: -1 };
  }
};

export default {
  escapeRegex,
  normalizeCategory,
  matchesDurationFilter,
  parseFilterParams,
  buildPublishedProductQuery,
  buildSortOption,
};
