import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { setHostelContext } from '../middleware/hostel.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadToSupabase, deleteFromSupabase, getSupabaseFileUrl, supabaseClient } from '../config/storage.js';

const router = express.Router();

// Check if we're using Supabase Storage (when configured) or local filesystem (development)
// Use Supabase if client is initialized, otherwise fall back to filesystem
const useSupabaseStorage = !!supabaseClient;

// Configure multer for file uploads
// Use memory storage for Supabase (we need the buffer), disk storage for local development
const storage = useSupabaseStorage 
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = 'uploads/documents';
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      // Store error in request for better error handling
      req.fileValidationError = 'Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.';
      cb(new Error(req.fileValidationError));
    }
  }
});

// Get all documents
router.get('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    let query = `
      SELECT d.*, s.first_name as student_first_name, s.last_name as student_last_name,
             s.student_id, u.username as uploaded_by_name
      FROM documents d
      LEFT JOIN students s ON d.student_id = s.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND d.hostel_id = $${paramCount++}`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    if (req.query.student_id) {
      query += ` AND d.student_id = $${paramCount++}`;
      params.push(req.query.student_id);
    }

    if (req.query.document_type) {
      query += ` AND d.document_type = $${paramCount++}`;
      params.push(req.query.document_type);
    }

    query += ' ORDER BY d.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get document by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, s.first_name as student_first_name, s.last_name as student_last_name,
             s.student_id, u.username as uploaded_by_name
      FROM documents d
      LEFT JOIN students s ON d.student_id = s.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload document
router.post('/', authenticateToken, setHostelContext, upload.single('file'), async (req, res) => {
  let uploadedFilePath = null;
  let uploadedFileUrl = null;

  try {
    // Handle multer errors
    if (req.fileValidationError) {
      return res.status(400).json({ error: req.fileValidationError });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please select a file to upload.' });
    }

    const {
      student_id, document_type, hostel_id
    } = req.body;

    // Validate required fields
    if (!student_id || student_id.toString().trim() === '') {
      return res.status(400).json({ error: 'Please select a student' });
    }

    if (!document_type || document_type.toString().trim() === '') {
      return res.status(400).json({ error: 'Document type is required' });
    }

    // Validate student exists
    const studentCheck = await pool.query('SELECT id, hostel_id FROM students WHERE id = $1', [student_id]);
    if (studentCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Selected student does not exist. Please select a valid student.' });
    }

    const finalHostelId = hostel_id || req.hostelId || studentCheck.rows[0].hostel_id;
    if (!finalHostelId) {
      return res.status(400).json({ error: 'Hostel ID is required' });
    }

    // Upload file to storage (Supabase in production, filesystem in development)
    if (useSupabaseStorage) {
      // Upload to Supabase Storage
      const uploadResult = await uploadToSupabase(req.file);
      uploadedFilePath = uploadResult.path;
      uploadedFileUrl = uploadResult.url;
    } else {
      // Use local filesystem (development only)
      uploadedFilePath = req.file.path;
      uploadedFileUrl = null; // Local files don't have URLs
    }

    // Store in database
    const result = await pool.query(
      `INSERT INTO documents (student_id, document_type, file_name, file_path,
       file_size, mime_type, uploaded_by, hostel_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        student_id,
        document_type,
        req.file.originalname,
        uploadedFilePath, // Store path or Supabase path
        req.file.size,
        req.file.mimetype,
        req.user.id,
        finalHostelId
      ]
    );

    // Add file URL to response if using Supabase
    const responseData = { ...result.rows[0] };
    if (uploadedFileUrl) {
      responseData.file_url = uploadedFileUrl;
    }

    res.status(201).json(responseData);
  } catch (error) {
    // Clean up uploaded file on error
    if (uploadedFilePath) {
      try {
        if (useSupabaseStorage) {
          await deleteFromSupabase(uploadedFilePath);
        } else if (fs.existsSync(uploadedFilePath)) {
          fs.unlinkSync(uploadedFilePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }
    
    // Provide user-friendly error messages
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds the maximum limit of 10MB' });
    }
    
    console.error('Document upload error:', error);
    res.status(500).json({ error: error.message || 'Error uploading document. Please try again.' });
  }
});

// Download document
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = result.rows[0];
    const filePath = document.file_path;

    // Check if file is stored in Supabase Storage
    // Files stored in Supabase will have path starting with "documents/"
    // or we're using Supabase Storage in production
    if (filePath && (filePath.startsWith('documents/') || useSupabaseStorage)) {
      // Get public URL from Supabase
      const fileUrl = getSupabaseFileUrl(filePath);
      if (fileUrl) {
        // Redirect to Supabase public URL
        return res.redirect(fileUrl);
      } else {
        return res.status(404).json({ error: 'File not found in storage' });
      }
    } else {
      // Local filesystem (development or old files)
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on server' });
      }
      res.download(filePath, document.file_name);
    }
  } catch (error) {
    console.error('Document download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT file_path FROM documents WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = result.rows[0].file_path;
    
    // Delete from database first
    await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    
    // Delete file from storage
    if (filePath) {
      try {
        if (filePath.startsWith('documents/') || useSupabaseStorage) {
          // Delete from Supabase Storage
          await deleteFromSupabase(filePath);
        } else {
          // Delete from local filesystem (development or old files)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      } catch (deleteError) {
        console.error('Error deleting file from storage:', deleteError);
        // Continue even if file deletion fails (file might already be deleted)
      }
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Document delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;


