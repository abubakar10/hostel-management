import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client for storage
// Get Supabase URL and anon key from environment variables
// For Supabase Storage, we need the project URL and service role key (for server-side operations)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabaseClient = null;

if (supabaseUrl && supabaseServiceKey) {
  supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('✅ Supabase Storage client initialized');
} else {
  console.warn('⚠️  Supabase Storage not configured. File uploads will use local filesystem (localhost only).');
  console.warn('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables for production.');
}

export { supabaseClient };

// Helper function to upload file to Supabase Storage
export const uploadToSupabase = async (file, folder = 'documents') => {
  if (!supabaseClient) {
    throw new Error('Supabase Storage is not configured');
  }

  const fileExt = file.originalname.split('.').pop();
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  // Convert buffer to ArrayBuffer for Supabase
  const fileBuffer = file.buffer;
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

  const { data, error } = await supabaseClient.storage
    .from('documents')
    .upload(filePath, arrayBuffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Failed to upload file to Supabase: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseClient.storage
    .from('documents')
    .getPublicUrl(filePath);

  return {
    path: filePath,
    url: urlData.publicUrl,
    fileName: fileName
  };
};

// Helper function to delete file from Supabase Storage
export const deleteFromSupabase = async (filePath) => {
  if (!supabaseClient) {
    throw new Error('Supabase Storage is not configured');
  }

  // The filePath should be in format "documents/filename.pdf"
  // Remove "documents/" prefix if present to get the relative path
  let relativePath = filePath;
  if (filePath.startsWith('documents/')) {
    relativePath = filePath.substring('documents/'.length);
  }

  const { error } = await supabaseClient.storage
    .from('documents')
    .remove([relativePath]);
  
  if (error) {
    console.error('Supabase delete error:', error);
    throw new Error(`Failed to delete file from Supabase: ${error.message}`);
  }
};

// Helper function to get file URL from Supabase Storage
export const getSupabaseFileUrl = (filePath) => {
  if (!supabaseClient) {
    return null;
  }

  // The filePath should be in format "documents/filename.pdf"
  // Remove "documents/" prefix if present to get the relative path
  let relativePath = filePath;
  if (filePath.startsWith('documents/')) {
    relativePath = filePath.substring('documents/'.length);
  }

  const { data } = supabaseClient.storage
    .from('documents')
    .getPublicUrl(relativePath);

  return data.publicUrl;
};

