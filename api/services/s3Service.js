const AWS = require('aws-sdk');
const crypto = require('crypto');
const path = require('path');

// Configure AWS SDK
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
  signatureVersion: 'v4'
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'subgrant-partner-documents';
const UPLOAD_EXPIRY = 15 * 60; // 15 minutes
const DOWNLOAD_EXPIRY = 60 * 60; // 1 hour

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'txt': 'text/plain'
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Generate a presigned URL for file upload
 * @param {string} organizationId - Organization ID
 * @param {string} documentType - Type of document (from document_requirements)
 * @param {string} fileName - Original file name
 * @param {string} fileType - File extension
 * @param {number} fileSize - File size in bytes
 * @returns {Object} Presigned URL data
 */
const generatePresignedUploadUrl = async (organizationId, documentType, fileName, fileType, fileSize) => {
  // Validate file type
  const normalizedFileType = fileType.toLowerCase();
  if (!ALLOWED_FILE_TYPES[normalizedFileType]) {
    throw new Error(`File type '${fileType}' is not allowed. Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`);
  }

  // Validate file size
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Generate unique file key
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString('hex');
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileKey = `organizations/${organizationId}/documents/${documentType}/${timestamp}_${randomId}_${sanitizedFileName}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Expires: UPLOAD_EXPIRY,
    ContentType: ALLOWED_FILE_TYPES[normalizedFileType],
    ContentLength: fileSize,
    Conditions: [
      ['content-length-range', 1, MAX_FILE_SIZE],
      ['eq', '$Content-Type', ALLOWED_FILE_TYPES[normalizedFileType]]
    ],
    Fields: {
      'x-amz-meta-organization-id': organizationId,
      'x-amz-meta-document-type': documentType,
      'x-amz-meta-original-filename': fileName,
      'x-amz-meta-upload-timestamp': timestamp.toString()
    }
  };

  try {
    const presignedPost = s3.createPresignedPost(params);
    
    return {
      uploadUrl: presignedPost.url,
      fields: presignedPost.fields,
      fileKey: fileKey,
      expiresIn: UPLOAD_EXPIRY,
      maxFileSize: MAX_FILE_SIZE,
      allowedContentType: ALLOWED_FILE_TYPES[normalizedFileType]
    };
  } catch (error) {
    console.error('Error generating presigned upload URL:', error);
    throw new Error('Failed to generate upload URL');
  }
};

/**
 * Generate a presigned URL for file download
 * @param {string} fileKey - S3 file key
 * @returns {string} Presigned download URL
 */
const generatePresignedDownloadUrl = async (fileKey) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Expires: DOWNLOAD_EXPIRY
  };

  try {
    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error('Error generating presigned download URL:', error);
    throw new Error('Failed to generate download URL');
  }
};

/**
 * Check if a file exists in S3
 * @param {string} fileKey - S3 file key
 * @returns {boolean} Whether file exists
 */
const fileExists = async (fileKey) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey
  };

  try {
    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
};

/**
 * Get file metadata from S3
 * @param {string} fileKey - S3 file key
 * @returns {Object} File metadata
 */
const getFileMetadata = async (fileKey) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey
  };

  try {
    const result = await s3.headObject(params).promise();
    return {
      size: result.ContentLength,
      lastModified: result.LastModified,
      contentType: result.ContentType,
      metadata: result.Metadata
    };
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw new Error('Failed to get file metadata');
  }
};

/**
 * Delete a file from S3
 * @param {string} fileKey - S3 file key
 * @returns {boolean} Success status
 */
const deleteFile = async (fileKey) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey
  };

  try {
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
};

/**
 * Copy a file within S3 (useful for moving files between folders)
 * @param {string} sourceKey - Source file key
 * @param {string} destinationKey - Destination file key
 * @returns {boolean} Success status
 */
const copyFile = async (sourceKey, destinationKey) => {
  const params = {
    Bucket: BUCKET_NAME,
    CopySource: `${BUCKET_NAME}/${sourceKey}`,
    Key: destinationKey
  };

  try {
    await s3.copyObject(params).promise();
    return true;
  } catch (error) {
    console.error('Error copying file:', error);
    throw new Error('Failed to copy file');
  }
};

/**
 * List files in a specific organization's folder
 * @param {string} organizationId - Organization ID
 * @param {string} documentType - Optional document type filter
 * @returns {Array} List of files
 */
const listOrganizationFiles = async (organizationId, documentType = null) => {
  const prefix = documentType 
    ? `organizations/${organizationId}/documents/${documentType}/`
    : `organizations/${organizationId}/documents/`;

  const params = {
    Bucket: BUCKET_NAME,
    Prefix: prefix,
    MaxKeys: 1000
  };

  try {
    const result = await s3.listObjectsV2(params).promise();
    return result.Contents.map(obj => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
      etag: obj.ETag
    }));
  } catch (error) {
    console.error('Error listing files:', error);
    throw new Error('Failed to list files');
  }
};

/**
 * Validate file upload completion
 * @param {string} fileKey - S3 file key
 * @param {string} organizationId - Organization ID
 * @returns {Object} Validation result
 */
const validateUploadCompletion = async (fileKey, organizationId) => {
  try {
    const exists = await fileExists(fileKey);
    if (!exists) {
      return { valid: false, error: 'File not found in storage' };
    }

    const metadata = await getFileMetadata(fileKey);
    
    // Verify organization ID matches
    if (metadata.metadata['organization-id'] !== organizationId) {
      return { valid: false, error: 'Organization ID mismatch' };
    }

    return {
      valid: true,
      metadata: {
        size: metadata.size,
        contentType: metadata.contentType,
        originalFilename: metadata.metadata['original-filename'],
        uploadTimestamp: metadata.metadata['upload-timestamp']
      }
    };
  } catch (error) {
    console.error('Error validating upload:', error);
    return { valid: false, error: 'Failed to validate upload' };
  }
};

module.exports = {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  fileExists,
  getFileMetadata,
  deleteFile,
  copyFile,
  listOrganizationFiles,
  validateUploadCompletion,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE
};
