// Category mapping between slugs and display names
// This ensures consistency between DiscoverMenu, SearchPage, and backend

export const categoryMapping = {
  // Slug -> Display Name
  'tours': 'Tours',
  'activities': 'Activities',
  'attractions': 'Attractions',
  'day-trips': 'Day Trips',
  'outdoor': 'Outdoor Activities',
  'shows': 'Shows & Performances',
  'food-drink': 'Food & Drink',
  'workshops': 'Classes & Workshops',
};

// Reverse mapping: Display Name -> Slug
export const categorySlugMapping = {
  'Tours': 'tours',
  'Activities': 'activities',
  'Attractions': 'attractions',
  'Day Trips': 'day-trips',
  'Outdoor Activities': 'outdoor',
  'Shows & Performances': 'shows',
  'Food & Drink': 'food-drink',
  'Classes & Workshops': 'workshops',
};

// Get display name from slug
export const getCategoryName = (slug) => {
  return categoryMapping[slug] || slug;
};

// Get slug from display name
export const getCategorySlug = (name) => {
  return categorySlugMapping[name] || name.toLowerCase().replace(/\s+/g, '-');
};

// Normalize category name (handle variations)
export const normalizeCategory = (category) => {
  if (!category) return null;
  
  // Try to find exact match first
  if (categorySlugMapping[category]) {
    return category;
  }
  
  // Try slug mapping
  if (categoryMapping[category]) {
    return categoryMapping[category];
  }
  
  // Try case-insensitive match
  const lowerCategory = category.toLowerCase();
  for (const [displayName, slug] of Object.entries(categorySlugMapping)) {
    if (displayName.toLowerCase() === lowerCategory || slug === lowerCategory) {
      return displayName;
    }
  }
  
  // Return as-is if no match found
  return category;
};

// Get all category display names
export const getAllCategoryNames = () => {
  return Object.values(categoryMapping);
};

// Get all category slugs
export const getAllCategorySlugs = () => {
  return Object.keys(categoryMapping);
};

