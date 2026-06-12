import Order from '../models/orderModel.js';
import { clearCache } from '../middleware/cacheMiddleware.js';
import notificationHub from '../services/notificationHub.js';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/checkout
// Valide et enregistre une commande issue du panier (utilisateur connecté ou invité)
// ─────────────────────────────────────────────────────────────────────────────
export const checkout = async (req, res) => {
  try {
    const { customer, items, totalAmount, notes } = req.body;

    // ── Validation entrée ──────────────────────────────────────────────────
    if (!customer || !customer.name || !customer.email) {
      return res.status(400).json({
        success: false,
        message: 'Les informations client (nom et email) sont obligatoires.',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le panier est vide. Impossible de créer une commande.',
      });
    }

    // ── Calcul et vérification du montant total ────────────────────────────
    const computedTotal = items.reduce((sum, item) => {
      if (!item.price || !item.quantity || item.price < 0 || item.quantity < 1) {
        throw new Error(`Article invalide dans le panier : ${item.title || 'inconnu'}`);
      }
      return sum + item.price * item.quantity;
    }, 0);

    // Tolérance de 0.10€ pour les arrondis flottants
    const clientTotal = Number(totalAmount) || 0;
    if (Math.abs(computedTotal - clientTotal) > 0.10) {
      return res.status(400).json({
        success: false,
        message: `Montant total invalide. Calculé : €${computedTotal.toFixed(2)}, reçu : €${clientTotal.toFixed(2)}.`,
      });
    }

    // ── Construction des items normalisés ─────────────────────────────────
    const normalizedItems = items.map((item) => ({
      productId: String(item.id || item.productId || ''),
      title: String(item.title || ''),
      destination: String(item.destination || item.city || ''),
      price: Number(item.price),
      quantity: Number(item.quantity),
      image: String(item.image || item.images?.[0] || ''),
      subtotal: Number(item.price) * Number(item.quantity),
    }));

    // ── Étape A : Persistance en base de données ───────────────────────────
    const order = new Order({
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone?.trim() || '',
        userId: req.user?._id || null,
      },
      items: normalizedItems,
      totalAmount: computedTotal,
      status: 'confirmed',
      notes: notes?.trim() || '',
      source: 'cart_checkout',
    });

    await order.save();

    // ── Étape B : Invalidation du cache Upstash Redis ─────────────────────
    // Les disponibilités changent, on invalide le cache global en arrière-plan
    clearCache('cache:*').catch((err) =>
      console.error('[Checkout] Erreur lors du vidage du cache Redis:', err)
    );

    // ── Étape C : Dispatch Hub de Notification ────────────────────────────
    // Envoi asynchrone de l'email de confirmation via Resend (non bloquant)
    notificationHub.dispatch('BOOKING_SUCCESS', {
      to: order.customer.email,
      booking: {
        _id: order._id,
        totalAmount: order.totalAmount,
        numberOfTickets: order.items.reduce((sum, i) => sum + i.quantity, 0),
        orderId: order.orderId,
        schedule: {
          date: order.createdAt,
          time: null,
          product: {
            title: order.items.map((i) => i.title).join(', '),
            operator: null,
          },
        },
      },
      user: {
        name: order.customer.name,
        email: order.customer.email,
      },
    });

    // ── Étape D : Réponse immédiate 201 ───────────────────────────────────
    return res.status(201).json({
      success: true,
      message: 'Commande confirmée avec succès.',
      order: {
        _id: order._id,
        orderId: order.orderId,
        customer: order.customer,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error('[Checkout Error]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur interne lors du traitement de la commande.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/my-orders
// Retourne les commandes de l'utilisateur connecté
// ─────────────────────────────────────────────────────────────────────────────
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 'customer.userId': req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('[GetMyOrders Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de vos commandes.',
    });
  }
};
