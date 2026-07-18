import mongoose from 'mongoose';
import Booking from '../models/bookingModel.js';
import Schedule from '../models/scheduleModel.js';
import { logger } from './logger.js';

/**
 * Calculate available capacity for a schedule
 * Only counts confirmed bookings (excludes cancelled ones)
 * @param {String} scheduleId - Schedule ID
 * @returns {Object} { available, booked, total }
 */
export const getScheduleAvailability = async (scheduleId) => {
  try {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // Count active holds: Pending, awaiting offline payment, and Confirmed
    // (PENDING_PAYMENT must hold capacity until admin confirms or rejects)
    const bookings = await Booking.find({
      schedule: scheduleId,
      status: { $in: ['Pending', 'PENDING_PAYMENT', 'Confirmed'] },
    }).select('numberOfTickets');

    const totalTicketsBooked = bookings.reduce((sum, booking) => {
      return sum + (booking.numberOfTickets || 0);
    }, 0);

    const available = Math.max(0, schedule.capacity - totalTicketsBooked);
    const booked = totalTicketsBooked;

    return {
      available,
      booked,
      total: schedule.capacity,
      schedule,
    };
  } catch (error) {
    logger.error('Get schedule availability error:', error);
    throw error;
  }
};

/**
 * Check if a schedule is still available for booking
 * @param {String} scheduleId - Schedule ID
 * @param {Number} numberOfTickets - Number of tickets requested
 * @returns {Object} { available, reason }
 */
export const checkAvailability = async (scheduleId, numberOfTickets) => {
  try {
    logger.info('🔍 checkAvailability called:', { scheduleId, numberOfTickets });
    
    const availability = await getScheduleAvailability(scheduleId);
    const schedule = availability.schedule;
    
    logger.info('📅 Schedule data:', {
      scheduleId: schedule._id?.toString(),
      date: schedule.date,
      time: schedule.time,
      capacity: schedule.capacity,
      available: availability.available,
    });

    // FIX TIMEZONE BUG
    const dateObj = new Date(schedule.date);
    // Trick: Add 12 hours to bypass any Midnight UTC boundary shift caused by local timezones
    const midDay = new Date(dateObj.getTime() + 12 * 60 * 60 * 1000);
    const year = midDay.getUTCFullYear();
    const month = midDay.getUTCMonth();
    const date = midDay.getUTCDate();
    
    let hours = 0, minutes = 0;
    if (schedule.time) {
      [hours, minutes] = schedule.time.split(':').map(Number);
    }
    
    // Create the date in local server time
    const scheduleDateTime = new Date(year, month, date, hours, minutes || 0, 0, 0);
    
    logger.info('🕐 Schedule datetime:', scheduleDateTime.toISOString());

    const now = new Date();
    // Buffer de 2 heures pour les réservations de dernière minute
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    
    logger.info('⏰ Time comparison:', {
      scheduleDateTime: scheduleDateTime.toISOString(),
      now: now.toISOString(),
      twoHoursAgo: twoHoursAgo.toISOString(),
      isPast: scheduleDateTime < twoHoursAgo,
    });
    
    if (scheduleDateTime < twoHoursAgo) {
      logger.info('❌ Schedule is in the past');
      return {
        available: false,
        reason: 'Ce créneau est déjà passé',
      };
    }

    // Check capacity
    if (availability.available < numberOfTickets) {
      logger.info('❌ Not enough capacity:', { available: availability.available, requested: numberOfTickets });
      return {
        available: false,
        reason: `Il ne reste que ${availability.available} place${availability.available > 1 ? 's' : ''} disponible${availability.available > 1 ? 's' : ''}`,
      };
    }

    logger.info('✅ Schedule is available');
    return {
      available: true,
      reason: null,
      availability,
    };
  } catch (error) {
    logger.error('❌ Check availability error:', { message: error.message, stack: error.stack });
    return {
      available: false,
      reason: 'Erreur lors de la vérification de disponibilité: ' + error.message,
    };
  }
};

/**
 * Vérifie / réserve la capacité.
 * Sans replica set Mongo (Docker standalone), les transactions échouent —
 * on utilise donc un check non-transactionnel + findById (OK soft-launch).
 * @param {String} scheduleId - Schedule ID
 * @param {Number} numberOfTickets - Number of tickets to reserve
 * @returns {Object} { success, availability }
 */
export const reserveCapacity = async (scheduleId, numberOfTickets) => {
  try {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return {
        success: false,
        reason: 'Schedule not found',
      };
    }

    const availability = await getScheduleAvailability(scheduleId);

    if (availability.available < numberOfTickets) {
      return {
        success: false,
        reason: `Il ne reste que ${availability.available} place${availability.available > 1 ? 's' : ''} disponible${availability.available > 1 ? 's' : ''}`,
        availability,
      };
    }

    // FIX TIMEZONE BUG
    const dateObj = new Date(schedule.date);
    const midDay = new Date(dateObj.getTime() + 12 * 60 * 60 * 1000);
    const year = midDay.getUTCFullYear();
    const month = midDay.getUTCMonth();
    const date = midDay.getUTCDate();

    let hours = 0;
    let minutes = 0;
    if (schedule.time) {
      [hours, minutes] = schedule.time.split(':').map(Number);
    }

    const scheduleDateTime = new Date(year, month, date, hours, minutes || 0, 0, 0);
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    logger.info('🔒 reserveCapacity Time check:', {
      scheduleDate: schedule.date,
      scheduleTime: schedule.time,
      scheduleDateTime: scheduleDateTime.toISOString(),
      now: now.toISOString(),
      twoHoursAgo: twoHoursAgo.toISOString(),
    });

    if (scheduleDateTime < twoHoursAgo) {
      return {
        success: false,
        reason: 'Ce créneau est déjà passé',
      };
    }

    return {
      success: true,
      availability,
    };
  } catch (error) {
    logger.error('Reserve capacity error:', error);
    return {
      success: false,
      reason: 'Erreur lors de la réservation',
      error: error.message,
    };
  }
};

/**
 * Release capacity when booking is cancelled
 * @param {String} scheduleId - Schedule ID
 * @param {String} bookingId - Booking ID to remove from schedule
 */
export const releaseCapacity = async (scheduleId, bookingId) => {
  try {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      logger.warn(`Schedule ${scheduleId} not found when releasing capacity`);
      return;
    }

    // Remove booking from schedule bookings array
    schedule.bookings = schedule.bookings.filter(
      b => b.toString() !== bookingId.toString()
    );
    await schedule.save();
  } catch (error) {
    logger.error('Release capacity error:', error);
    throw error;
  }
};

/**
 * Get availability for multiple schedules
 * @param {Array<String>} scheduleIds - Array of schedule IDs
 * @returns {Object} Map of scheduleId -> availability
 */
export const getMultipleScheduleAvailability = async (scheduleIds) => {
  try {
    const schedules = await Schedule.find({ _id: { $in: scheduleIds } });
    const availabilityMap = {};

    for (const schedule of schedules) {
      const availability = await getScheduleAvailability(schedule._id);
      availabilityMap[schedule._id.toString()] = availability;
    }

    return availabilityMap;
  } catch (error) {
    logger.error('Get multiple schedule availability error:', error);
    throw error;
  }
};

