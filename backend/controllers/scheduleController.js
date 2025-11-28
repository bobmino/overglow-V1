import Schedule from '../models/scheduleModel.js';
import Product from '../models/productModel.js';
import Operator from '../models/operatorModel.js';
import { validationResult } from 'express-validator';

// @desc    Create a schedule
// @route   POST /api/products/:productId/schedules
// @access  Private/Operator
const createSchedule = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { date, endDate, time, endTime, capacity, price, currency } = req.body;
  const productId = req.params.productId;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const operator = await Operator.findOne({ user: req.user._id });
  if (product.operator.toString() !== operator._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to add schedule to this product');
  }

  const schedule = new Schedule({
    product: productId,
    date,
    endDate: endDate || date,
    time,
    endTime: endTime || time,
    capacity,
    price,
    currency,
  });

  const createdSchedule = await schedule.save();
  res.status(201).json(createdSchedule);
};

// @desc    Get schedules for a product
// @route   GET /api/products/:productId/schedules
// @access  Public
const getSchedules = async (req, res) => {
  const schedules = await Schedule.find({ product: req.params.productId });
  res.json(schedules);
};

// @desc    Update a schedule
// @route   PUT /api/schedules/:id
// @access  Private/Operator
const updateSchedule = async (req, res) => {
  const { date, endDate, time, endTime, capacity, price, currency } = req.body;

  const schedule = await Schedule.findById(req.params.id).populate('product');

  if (schedule) {
    const operator = await Operator.findOne({ user: req.user._id });
    if (schedule.product.operator.toString() !== operator._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this schedule');
    }

    schedule.date = date || schedule.date;
    schedule.endDate = endDate !== undefined ? endDate : schedule.endDate;
    schedule.time = time || schedule.time;
    schedule.endTime = endTime !== undefined ? endTime : schedule.endTime;
    schedule.capacity = capacity || schedule.capacity;
    schedule.price = price || schedule.price;
    schedule.currency = currency || schedule.currency;

    const updatedSchedule = await schedule.save();
    res.json(updatedSchedule);
  } else {
    res.status(404);
    throw new Error('Schedule not found');
  }
};

// @desc    Delete a schedule
// @route   DELETE /api/schedules/:id
// @access  Private/Operator
const deleteSchedule = async (req, res) => {
  const schedule = await Schedule.findById(req.params.id).populate('product');

  if (schedule) {
    const operator = await Operator.findOne({ user: req.user._id });
    if (schedule.product.operator.toString() !== operator._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this schedule');
    }

    await schedule.deleteOne();
    res.json({ message: 'Schedule removed' });
  } else {
    res.status(404);
    throw new Error('Schedule not found');
  }
};

export { createSchedule, getSchedules, updateSchedule, deleteSchedule };
