import User from '../models/userModel.js';
import Operator from '../models/operatorModel.js';
import generateToken from '../../utils/generateToken.js';
import { validationResult } from 'express-validator';
import { notifyOperatorRegistered } from '../utils/notificationService.js';
import mongoose from 'mongoose';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, companyName, description } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Default role is 'Client' (not 'Voyageur')
    const finalRole = role || 'Client';
    
    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      // Clients are auto-approved, operators need approval
      isApproved: finalRole === 'Client',
      approvedAt: finalRole === 'Client' ? new Date() : undefined,
    });

    if (user) {
      if (finalRole === 'Opérateur') {
        const operator = await Operator.create({
          user: user._id,
          companyName: companyName || `${name}'s Company`,
          description: description || '',
          status: 'Pending', // Operators start as Pending
        });
        
        // Notify all admins of new operator registration
        const adminUsers = await User.find({ role: 'Admin' });
        const adminIds = adminUsers.map(admin => admin._id);
        if (adminIds.length > 0) {
          await notifyOperatorRegistered(operator, adminIds);
        }
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('Login error: JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ 
        message: 'Server configuration error. Please contact support.',
        error: 'JWT_SECRET missing'
      });
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Login error: Database not connected', { readyState: mongoose.connection.readyState });
      // Try to reconnect
      try {
        const connectDB = (await import('../../config/db.js')).default;
        await connectDB();
        // Wait a bit for connection to establish
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (dbError) {
        console.error('Database reconnection failed:', dbError.message);
        return res.status(500).json({ 
          message: 'Database connection error. Please try again later.',
          error: 'Database unavailable'
        });
      }
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user has a password (should always be true, but safety check)
    if (!user.password) {
      console.error('Login error: User found but password is missing', { userId: user._id, email });
      return res.status(500).json({ 
        message: 'Server error: User account configuration issue',
        error: 'Password missing'
      });
    }

    // Verify password
    let passwordMatch = false;
    try {
      passwordMatch = await user.matchPassword(password);
    } catch (matchError) {
      console.error('Password match error:', {
        message: matchError.message,
        stack: matchError.stack,
        name: matchError.name,
        email: email
      });
      return res.status(500).json({ 
        message: 'Server error during password verification',
        error: process.env.NODE_ENV === 'development' ? matchError.message : undefined
      });
    }

    if (passwordMatch) {
      // Generate token
      let token;
      try {
        token = generateToken(user._id, user.role);
      } catch (tokenError) {
        console.error('Token generation error:', {
          message: tokenError.message,
          stack: tokenError.stack,
          name: tokenError.name,
          email: email
        });
        return res.status(500).json({ 
          message: 'Server error during token generation',
          error: process.env.NODE_ENV === 'development' ? tokenError.message : undefined
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: token,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    // Log full error details for debugging
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      email: req.body?.email || 'N/A'
    });
    
    // Return appropriate error message
    if (error.message && error.message.includes('JWT_SECRET')) {
      res.status(500).json({ 
        message: 'Server configuration error. Please contact support.',
        error: 'JWT_SECRET missing'
      });
    } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
      res.status(500).json({ 
        message: 'Database connection error. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } else {
      res.status(500).json({ 
        message: 'Server error during login',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      approvedAt: user.approvedAt,
      phone: user.phone,
      bio: user.bio,
      location: user.location,
      dateOfBirth: user.dateOfBirth,
      website: user.website,
      socialLinks: user.socialLinks,
      createdAt: user.createdAt,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, bio, location, dateOfBirth, website, socialLinks } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    // Update fields
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (website !== undefined) user.website = website;
    if (socialLinks !== undefined) {
      user.socialLinks = {
        ...user.socialLinks,
        ...socialLinks,
      };
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      bio: user.bio,
      location: user.location,
      dateOfBirth: user.dateOfBirth,
      website: user.website,
      socialLinks: user.socialLinks,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

export { registerUser, loginUser, getMe, updateProfile };
