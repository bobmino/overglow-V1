import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Client', 'Opérateur', 'Admin'],
    default: 'Client',
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  approvedAt: {
    type: Date,
  },
  // Profile fields
  phone: {
    type: String,
  },
  bio: {
    type: String,
  },
  location: {
    type: String,
  },
  dateOfBirth: {
    type: Date,
  },
  website: {
    type: String,
  },
  socialLinks: {
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String },
    linkedin: { type: String },
  },
}, {
  timestamps: true,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
