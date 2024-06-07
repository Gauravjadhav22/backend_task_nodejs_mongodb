import multer from 'multer';

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });
export default upload;