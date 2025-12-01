import React, { useState } from 'react';

const PdfImageUploader = ({ onFileUpload, onFileRemove, maxFileSize = 10 }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileType, setFileType] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // Check file type (expanded to include documents and archives)
    const validTypes = [
      'application/pdf',
      'image/jpeg', 
      'image/png', 
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-zip-compressed'
    ];
    
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid file type (PDF, Images, Documents, or ZIP files)');
      return;
    }

    // Check file size (increased to 10MB to match backend)
    const maxSizeInBytes = maxFileSize * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setError(`File size exceeds ${maxFileSize}MB limit`);
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));
    setFileType(file.type);
    setError('');

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      // For non-image files, show a generic preview
      setPreviewUrl('');
    }

    // Pass file to parent component
    if (onFileUpload) {
      onFileUpload(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFileName('');
    setFileSize('');
    setFileType('');
    setError('');
    
    // Reset file input
    const fileInput = document.getElementById('pdf-image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
    
    // Notify parent component
    if (onFileRemove) {
      onFileRemove();
    }
  };

  const getFileIcon = (type) => {
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
    if (type.includes('zip')) return '📁';
    return '📎';
  };

  const handleUpload = async (additionalData = {}) => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    
    // Append any additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    try {
      // Using the correct backend endpoint for PDF/image uploads
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('File uploaded successfully:', result);
        return { success: true, data: result };
      } else {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload file. Please try again.');
      return { success: false, error: err.message };
    }
  };

  return (
    <div className="pdf-image-uploader" style={{ maxWidth: '500px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Upload File</h3>
      
      <div 
        style={{ 
          border: '2px dashed #ccc', 
          borderRadius: '8px', 
          padding: '20px', 
          textAlign: 'center', 
          cursor: 'pointer',
          backgroundColor: '#f9f9f9',
          transition: 'all 0.2s'
        }}
        onClick={() => document.getElementById('pdf-image-upload').click()}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#667eea';
          e.currentTarget.style.backgroundColor = '#f0f4ff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#ccc';
          e.currentTarget.style.backgroundColor = '#f9f9f9';
        }}
      >
        <input
          id="pdf-image-upload"
          type="file"
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip,application/x-zip-compressed,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        {previewUrl ? (
          <div>
            {fileType.startsWith('image/') ? (
              <img 
                src={previewUrl} 
                alt="Preview" 
                style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>{getFileIcon(fileType)}</div>
                <p>{getFileTypeName(fileType)} Selected</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
            <p>Click to select a file</p>
            <p style={{ fontSize: '12px', color: '#666' }}>Supports PDF, Images, Documents, ZIP (Max {maxFileSize}MB)</p>
          </div>
        )}
      </div>

      {error && (
        <div style={{ color: 'red', margin: '10px 0', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {selectedFile && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{fileName}</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>{fileSize}</div>
            </div>
            <button 
              onClick={handleRemoveFile}
              style={{ 
                background: '#ff4757', 
                border: 'none', 
                color: 'white', 
                cursor: 'pointer',
                fontSize: '16px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Remove file"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => document.getElementById('pdf-image-upload').click()}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#5a6fd8';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#667eea';
          }}
        >
          Select File
        </button>
        
        {selectedFile && (
          <button
            onClick={() => handleUpload()}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#45a049';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#4CAF50';
            }}
          >
            Upload File
          </button>
        )}
      </div>
    </div>
  );
};

const getFileTypeName = (type) => {
  if (type === 'application/pdf') return 'PDF Document';
  if (type.includes('word')) return 'Word Document';
  if (type.includes('excel') || type.includes('spreadsheet')) return 'Excel Spreadsheet';
  if (type.includes('powerpoint') || type.includes('presentation')) return 'PowerPoint Presentation';
  if (type.includes('zip')) return 'ZIP Archive';
  return 'File';
};

export default PdfImageUploader;