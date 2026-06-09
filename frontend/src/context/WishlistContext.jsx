import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const stored = localStorage.getItem('wishlistItems');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse wishlistItems from localStorage:', error);
      return [];
    }
  });

  // Keep localStorage in sync with state
  useEffect(() => {
    try {
      localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
    } catch (error) {
      console.error('Failed to save wishlistItems to localStorage:', error);
    }
  }, [wishlistItems]);

  const addToWishlist = useCallback((productId) => {
    setWishlistItems((prev) => {
      if (!prev.includes(productId)) {
        return [...prev, productId];
      }
      return prev;
    });
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    setWishlistItems((prev) => prev.filter((id) => id !== productId));
  }, []);

  const isInWishlist = useCallback((productId) => {
    return wishlistItems.includes(productId);
  }, [wishlistItems]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
