import mongoose from 'mongoose';
import Booking from '../models/bookingModel.js';
import Schedule from '../models/scheduleModel.js';

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

    // Count only confirmed bookings (not cancelled)
    const confirmedBookings = await Booking.countDocuments({
      schedule: scheduleId,
      status: { $in: ['Pending', 'Confirmed'] },
    });

    // Calculate total tickets booked (sum of numberOfTickets for confirmed bookings)
    const bookings = await Booking.find({
      schedule: scheduleId,
      status: { $in: ['Pending', 'Confirmed'] },
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
    console.error('Get schedule availability error:', error);
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
    const availability = await getScheduleAvailability(scheduleId);
    const schedule = availability.schedule;

    // Check if schedule date/time has passed
    const scheduleDateTime = new Date(schedule.date);
    const [hours, minutes] = schedule.time.split(':').map(Number);
    scheduleDateTime.setHours(hours, minutes || 0, 0, 0);

    if (scheduleDateTime < new Date()) {
      return {
        available: false,
        reason: 'Ce créneau est déjà passé',
      };
    }

    // Check capacity
    if (availability.available < numberOfTickets) {
      return {
        available: false,
        reason: `Il ne reste que ${availability.available} place${availability.available > 1 ? 's' : ''} disponible${availability.available > 1 ? 's' : ''}`,
      };
    }

    return {
      available: true,
      reason: null,
      availability,
    };
  } catch (error) {
    console.error('Check availability error:', error);
    return {
      available: false,
      reason: 'Erreur lors de la vérification de disponibilité',
    };
  }
};

/**
 * Reserve capacity atomically using MongoDB transactions
 * Prevents double booking in concurrent scenarios
 * @param {String} scheduleId - Schedule ID
 * @param {Number} numberOfTickets - Number of tickets to reserve
 * @returns {Object} { success, availability }
 */
export const reserveCapacity = async (scheduleId, numberOfTickets) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Lock the schedule document
    const schedule = await Schedule.findById(scheduleId).session(session);
    if (!schedule) {
      await session.abortTransaction();
      return {
        success: false,
        reason: 'Schedule not found',
      };
    }

    // Check availability within transaction
    const availability = await getScheduleAvailability(scheduleId);
    
    if (availability.available < numberOfTickets) {
      await session.abortTransaction();
      return {
        success: false,
        reason: `Il ne reste que ${availability.available} place${availability.available > 1 ? 's' : ''} disponible${availability.available > 1 ? 's' : ''}`,
        availability,
      };
    }

    // Check if schedule date/time has passed
    const scheduleDateTime = new Date(schedule.date);
    const [hours, minutes] = schedule.time.split(':').map(Number);
    scheduleDateTime.setHours(hours, minutes || 0, 0, 0);

    if (scheduleDateTime < new Date()) {
      await session.abortTransaction();
      return {
        success: false,
        reason: 'Ce créneau est déjà passé',
      };
    }

    // Transaction successful - capacity is reserved
    await session.commitTransaction();
    
    return {
      success: true,
      availability,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error('Reserve capacity error:', error);
    return {
      success: false,
      reason: 'Erreur lors de la réservation',
      error: error.message,
    };
  } finally {
    session.endSession();
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
      console.warn(`Schedule ${scheduleId} not found when releasing capacity`);
      return;
    }

    // Remove booking from schedule bookings array
    schedule.bookings = schedule.bookings.filter(
      b => b.toString() !== bookingId.toString()
    );
    await schedule.save();
  } catch (error) {
    console.error('Release capacity error:', error);
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
    console.error('Get multiple schedule availability error:', error);
    throw error;
  }
};

