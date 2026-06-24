const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Image name is required'],
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null // null indicates it is at the root level of the drive
  },
  url: {
    type: String,
    required: [true, 'Image URL is required']
  },
  publicId: {
    type: String,
    required: [true, 'Cloudinary public ID is required']
  },
  size: {
    type: Number,
    required: [true, 'Image size is required'] // Size in bytes
  }
}, {
  timestamps: true
});

// Indexes for query optimization
imageSchema.index({ userId: 1 });
imageSchema.index({ folderId: 1 });

module.exports = mongoose.model('Image', imageSchema);
