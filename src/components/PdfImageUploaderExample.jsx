import React, { useState } from 'react';
import PdfImageUploader from './PdfImageUploader';

const PdfImageUploaderExample = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (file) => {
    setUploadedFile(file);
    setUploadStatus('');
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
    setUploadStatus('');
  };

  const handleUploadToBackend = async () => {
    if (!uploadedFile) {
      setUploadStatus('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading...');

    try {
      // Create an instance of the uploader component
      const uploaderRef = React.createRef();
      
      // In a real implementation, you would call the uploader's handleUpload method
      // For this example, we'll simulate the upload process
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful upload
      const fakeResponse = {
        success: true,
        data: {
          fileName: uploadedFile.name,
          fileType: uploadedFile.type,
          fileSize: uploadedFile.size,
          uploadDate: new Date().toISOString(),
          fileId: 'file_' + Date.now()
        }
      };
      
      setUploadStatus('File uploaded successfully!');
      console.log('Upload result:', fakeResponse);
      
      // In a real implementation, you would do something like:
      /*
      const result = await uploaderRef.current.handleUpload({
        userId: '12345',
        documentType: 'supporting_document'
      });
      
      if (result.success) {
        setUploadStatus('File uploaded successfully!');
        console.log('Upload result:', result.data);
      } else {
        setUploadStatus(`Upload failed: ${result.error}`);
      }
      */
      
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus('Failed to upload file. Please check your connection and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>PDF & Image Uploader Example</h2>
      <p>This component allows users to upload PDF files and images with preview functionality.</p>
      
      <PdfImageUploader 
        onFileUpload={handleFileUpload}
        onFileRemove={handleFileRemove}
        maxFileSize={5} // 5MB limit
      />
      
      {uploadedFile && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
          <h3>Selected File Details:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <strong>Name:</strong> {uploadedFile.name}
            </div>
            <div>
              <strong>Type:</strong> {uploadedFile.type}
            </div>
            <div>
              <strong>Size:</strong> {Math.round(uploadedFile.size / 1024)} KB
            </div>
            <div>
              <strong>Last Modified:</strong> {new Date(uploadedFile.lastModified).toLocaleDateString()}
            </div>
          </div>
          
          <button
            onClick={handleUploadToBackend}
            disabled={isUploading}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: isUploading ? '#cccccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isUploading) {
                e.target.style.backgroundColor = '#45a049';
              }
            }}
            onMouseLeave={(e) => {
              if (!isUploading) {
                e.target.style.backgroundColor = '#4CAF50';
              }
            }}
          >
            {isUploading ? 'Uploading...' : 'Submit to Backend'}
          </button>
        </div>
      )}
      
      {uploadStatus && (
        <div 
          style={{ 
            marginTop: '20px', 
            padding: '15px', 
            borderRadius: '4px',
            backgroundColor: uploadStatus.includes('successfully') ? '#d4edda' : '#f8d7da',
            color: uploadStatus.includes('successfully') ? '#155724' : '#721c24',
            border: `1px solid ${uploadStatus.includes('successfully') ? '#c3e6cb' : '#f5c6cb'}`
          }}
        >
          {uploadStatus}
        </div>
      )}
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>How to Use:</h3>
        <ol>
          <li>Click "Select File" or drag and drop a PDF or image file</li>
          <li>Preview will show for image files, PDF files show a document icon</li>
          <li>File details (name, size) are displayed below the preview</li>
          <li>Click "Upload File" to send the file to your backend</li>
          <li>Use the X button to remove a selected file</li>
        </ol>
        
        <h3>Features:</h3>
        <ul>
          <li>Accepts only PDF files and images (JPEG, PNG, GIF)</li>
          <li>File size limit of 5MB (configurable)</li>
          <li>Visual preview for image files</li>
          <li>Clear file information display</li>
          <li>Error handling for invalid files or upload failures</li>
          <li>Responsive design</li>
        </ul>
      </div>
    </div>
  );
};

export default PdfImageUploaderExample;