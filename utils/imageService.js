const imageService = {
  uploadImage: async (file) => {
    // Placeholder: In a real app, upload to Cloudinary/S3
    return `https://fake-image-url.com/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
  },
  deleteImage: async (url) => {
    // Placeholder
    return true;
  }
};

export default imageService;
