import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [circuitItems, setCircuitItems] = useState(() => {
    try {
      const stored = localStorage.getItem('circuitItems');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse circuitItems from localStorage:', error);
      return [];
    }
  });

  // Keep localStorage in sync with circuitItems state
  useEffect(() => {
    try {
      localStorage.setItem('circuitItems', JSON.stringify(circuitItems));
    } catch (error) {
      console.error('Failed to save circuitItems to localStorage:', error);
    }
  }, [circuitItems]);

  // Check if two circuit items are the same product + schedule
  const isSameItem = (itemA, itemB) => {
    const idA = itemA.schedule?._id || '';
    const idB = itemB.schedule?._id || '';
    const isVirtualA = String(idA).startsWith('virtual_');
    const isVirtualB = String(idB).startsWith('virtual_');

    if (isVirtualA && isVirtualB) {
      return (
        itemA.product?._id === itemB.product?._id &&
        itemA.schedule?.date === itemB.schedule?.date &&
        itemA.schedule?.time === itemB.schedule?.time
      );
    }

    return idA === idB && idA !== '';
  };

  // Helper to calculate price breakdown for an item
  const calculateItemPriceBreakdown = (product, schedule, tickets) => {
    const basePrice = Number(schedule?.price || product?.price) || 0;
    const baseTotal = basePrice * tickets;
    
    const skipTheLinePrice = (product?.skipTheLine?.enabled && product?.skipTheLine?.additionalPrice) 
      ? Number(product.skipTheLine.additionalPrice) * tickets 
      : 0;
    
    const subtotal = baseTotal + skipTheLinePrice;
    
    return {
      basePrice,
      baseTotal,
      skipTheLinePrice,
      subtotal,
      numberOfTickets: tickets,
    };
  };

  const addToCircuit = useCallback((newItem) => {
    setCircuitItems((prevItems) => {
      // Find if item already exists in circuit
      const existingIndex = prevItems.findIndex((item) => isSameItem(item, newItem));

      if (existingIndex > -1) {
        // Update existing item tickets count
        const updated = [...prevItems];
        const existing = updated[existingIndex];
        const newTickets = existing.numberOfTickets + newItem.numberOfTickets;
        
        updated[existingIndex] = {
          ...existing,
          numberOfTickets: newTickets,
          skipTheLine: existing.skipTheLine || newItem.skipTheLine,
          priceBreakdown: calculateItemPriceBreakdown(
            existing.product,
            existing.schedule,
            newTickets
          )
        };
        return updated;
      } else {
        // Add new item with fresh price breakdown and a unique local ID
        const tickets = newItem.numberOfTickets || 1;
        const localId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return [
          ...prevItems,
          {
            id: localId,
            product: newItem.product,
            schedule: newItem.schedule,
            numberOfTickets: tickets,
            skipTheLine: !!newItem.skipTheLine,
            priceBreakdown: calculateItemPriceBreakdown(
              newItem.product,
              newItem.schedule,
              tickets
            )
          }
        ];
      }
    });
  }, []);

  const removeFromCircuit = useCallback((itemId) => {
    setCircuitItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  }, []);

  const clearCircuit = useCallback(() => {
    setCircuitItems([]);
  }, []);

  return (
    <CartContext.Provider
      value={{
        circuitItems,
        addToCircuit,
        removeFromCircuit,
        clearCircuit,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
