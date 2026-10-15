import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  Trash2,
  Image,
  CheckCircle,
  XCircle,
  Loader,
  RefreshCw,
  Tag,
  X,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import {
  uploadGalleryImage,
  fetchGalleryItems,
  deleteGalleryImage,
} from '../services/galleryService';

const CATEGORY_OPTIONS = [
  { value: 'hair', label: '💇 Hair' },
  { value: 'nails', label: '💅 Nails' },
];

const MAX_FILE_SIZE_MB = 8;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

function validateFile(file) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Only JPG, PNG or WebP images are allowed.';
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `Image must be under ${MAX_FILE_SIZE_MB}MB.`;
  }
  return null;
}

function UploadCard({ adminPin, onUploadSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('hair');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [fileError, setFileError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setFileError(err);
      return;
    }
    setFileError('');
    setSelectedFile(file);
    setTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
    setUploadStatus(null);
    setUploadMessage('');
    setFieldErrors({});

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setTitle('');
    setDesc('');
    setType('hair');
    setUploadStatus(null);
    setUploadMessage('');
    setFileError('');
    setFieldErrors({});
    if (inputRef.current) inputRef.current.value = '';
  };

  const validateForm = () => {
    const errors = {};
    if (!title.trim()) {
      errors.title = 'Title is required for the gallery photo.';
    }
    if (!desc.trim()) {
      errors.desc = 'Description is required to display on the gallery screens.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!validateForm()) return;

    setUploading(true);
    setUploadStatus(null);
    setUploadMessage('Uploading to Google Drive…');

    const result = await uploadGalleryImage({
      file: selectedFile,
      title: title.trim(),
      desc: desc.trim(),
      type,
      adminPin,
    });

    setUploading(false);

    if (result.success) {
      setUploadStatus('success');
      setUploadMessage('Image & description uploaded to gallery successfully!');
      onUploadSuccess();
      setTimeout(clearSelection, 2500);
    } else {
      setUploadStatus('error');
      setUploadMessage(result.error || 'Upload failed. Please try again.');
    }
  };

  return (
    <div className="ag-upload-card glass-panel">
      <h3 className="ag-section-title">
        <UploadCloud size={18} />
        Upload New Image
      </h3>

      {/* Drop Zone */}
      <div
        className={`ag-dropzone${dragging ? ' ag-dropzone--drag' : ''}${selectedFile ? ' ag-dropzone--has-file' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        onClick={() => !selectedFile && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !selectedFile && inputRef.current?.click()}
        aria-label="Drop image here or click to select"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="ag-file-input"
          onChange={(e) => handleFile(e.target.files?.[0])}
          aria-label="Select image file"
        />

        {preview ? (
          <div className="ag-preview-wrap">
            <img src={preview} alt="Preview" className="ag-preview-img" />
            <button
              type="button"
              className="ag-preview-clear"
              onClick={(e) => { e.stopPropagation(); clearSelection(); }}
              aria-label="Remove selected image"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="ag-dropzone-inner">
            <div className="ag-dropzone-icon">
              <Image size={32} />
            </div>
            <p className="ag-dropzone-text">
              <strong>Drag &amp; drop</strong> an image here
            </p>
            <p className="ag-dropzone-sub">or click to browse &middot; JPG, PNG, WebP &middot; max {MAX_FILE_SIZE_MB}MB</p>
          </div>
        )}
      </div>

      {fileError && (
        <p className="ag-error-text">
          <AlertTriangle size={14} /> {fileError}
        </p>
      )}

      {/* Fields */}
      {selectedFile && (
        <div className="ag-upload-fields">
          <div className="form-group">
            <label className="form-label">
              Photo Title <span className="ag-required">*</span>
            </label>
            <input
              className={`form-control${fieldErrors.title ? ' ag-input-error' : ''}`}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) {
                  setFieldErrors((prev) => ({ ...prev, title: '' }));
                }
              }}
              placeholder="e.g. Rich Burgundy Hair Color"
              maxLength={80}
            />
            {fieldErrors.title && (
              <p className="ag-field-error">
                <AlertTriangle size={13} /> {fieldErrors.title}
              </p>
            )}
          </div>

          <div className="form-group">
            <div className="ag-label-row">
              <label className="form-label" htmlFor="ag-desc-input">
                Description <span className="ag-required">*</span>
              </label>
              <span className="ag-char-counter">{desc.length} / 220</span>
            </div>
            <p className="ag-field-hint">
              This description appears below the title on gallery cards and in the fullscreen lightbox preview.
            </p>
            <textarea
              id="ag-desc-input"
              className={`form-control ag-textarea${fieldErrors.desc ? ' ag-input-error' : ''}`}
              rows={3}
              value={desc}
              onChange={(e) => {
                setDesc(e.target.value);
                if (fieldErrors.desc) {
                  setFieldErrors((prev) => ({ ...prev, desc: '' }));
                }
              }}
              placeholder="e.g. Deep mahogany tones with layered V-cut and a glossy signature blow-dry finish."
              maxLength={220}
            />
            {fieldErrors.desc && (
              <p className="ag-field-error">
                <AlertTriangle size={13} /> {fieldErrors.desc}
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Tag size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Category
            </label>
            <div className="ag-type-pills">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`ag-type-pill${type === opt.value ? ' active' : ''}`}
                  onClick={() => setType(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview on Gallery Screen */}
          <div className="ag-screen-preview">
            <div className="ag-screen-preview-header">
              <Eye size={14} />
              <span>Gallery Screen Preview</span>
              <span className="ag-screen-preview-tag">
                {type === 'hair' ? '💇 Hair' : '💅 Nails'}
              </span>
            </div>
            <div className="ag-screen-preview-body">
              <div className="ag-screen-preview-thumb">
                <img src={preview} alt="Upload preview" />
              </div>
              <div className="ag-screen-preview-details">
                <h4 className="ag-screen-preview-title">
                  {title.trim() || 'Photo Title'}
                </h4>
                <p className="ag-screen-preview-desc">
                  {desc.trim() || 'Type a description above to see how it appears on the gallery screens…'}
                </p>
              </div>
            </div>
          </div>

          {uploadStatus && (
            <div className={`ag-upload-status ag-upload-status--${uploadStatus}`}>
              {uploadStatus === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
              <span>{uploadMessage}</span>
            </div>
          )}

          {!uploadStatus && uploadMessage && (
            <div className="ag-upload-status ag-upload-status--loading">
              <Loader size={16} className="ag-spin" />
              <span>{uploadMessage}</span>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary ag-upload-btn"
            onClick={handleUpload}
            disabled={uploading || !title.trim() || !desc.trim()}
          >
            {uploading ? (
              <><Loader size={16} className="ag-spin" /> Uploading&hellip;</>
            ) : (
              <><UploadCloud size={16} /> Upload to Gallery</>
            )}
          </button>
          {(!title.trim() || !desc.trim()) && !uploading && (
            <p className="ag-upload-requirement-hint">
              * Please provide both title and description before uploading.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function GalleryItemCard({ item, onDelete, deleting }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgFallback, setImgFallback] = useState(false);

  const displaySrc = imgFallback
    ? item.rawImage || item.image
    : item.image || item.rawImage;

  return (
    <div className="ag-item-card">
      <div className="ag-item-img-wrap">
        <img
          src={displaySrc}
          alt={item.title}
          className="ag-item-img"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => {
            if (!imgFallback && item.rawImage && item.rawImage !== item.image) {
              setImgFallback(true);
            }
          }}
        />
        <span className={`ag-item-badge ag-item-badge--${item.type}`}>
          {item.type === 'hair' ? '💇 Hair' : '💅 Nails'}
        </span>
      </div>

      <div className="ag-item-info">
        <h4 className="ag-item-title" title={item.title}>{item.title}</h4>
        {item.desc ? (
          <p className="ag-item-desc" title={item.desc}>{item.desc}</p>
        ) : (
          <p className="ag-item-desc ag-item-desc--missing" title="No description provided">
            <em>No description provided</em>
          </p>
        )}
        <p className="ag-item-date">
          {item.uploadedAt
            ? new Date(item.uploadedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : ''}
        </p>
      </div>

      <div className="ag-item-actions">
        {confirmDelete ? (
          <>
            <span className="ag-confirm-text">Delete?</span>
            <button
              type="button"
              className="ag-delete-confirm-btn"
              onClick={() => { onDelete(item); setConfirmDelete(false); }}
              disabled={deleting}
            >
              {deleting ? <Loader size={14} className="ag-spin" /> : 'Yes'}
            </button>
            <button
              type="button"
              className="ag-delete-cancel-btn"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              No
            </button>
          </>
        ) : (
          <button
            type="button"
            className="ag-delete-btn"
            onClick={() => setConfirmDelete(true)}
            aria-label={`Delete ${item.title}`}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminGallery({ adminPin }) {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadGallery = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const items = await fetchGalleryItems();
      setGalleryItems(items);
    } catch {
      setLoadError('Failed to load gallery. Check your Apps Script webhook.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const handleDelete = async (item) => {
    setDeletingId(item.id);
    const result = await deleteGalleryImage({
      fileId: item.fileId,
      rowIndex: item.rowIndex,
      adminPin,
    });
    setDeletingId(null);

    if (result.success) {
      setGalleryItems((prev) => prev.filter((g) => g.id !== item.id));
    } else {
      alert(`Delete failed: ${result.error}`);
    }
  };

  const filtered = filter === 'all' ? galleryItems : galleryItems.filter((g) => g.type === filter);

  return (
    <div className="ag-root">
      {/* Upload Section */}
      <UploadCard adminPin={adminPin} onUploadSuccess={loadGallery} />

      {/* Gallery List */}
      <div className="ag-list-card glass-panel">
        <div className="ag-list-header">
          <h3 className="ag-section-title">
            <Image size={18} />
            Uploaded Images
            <span className="ag-count-badge">{galleryItems.length}</span>
          </h3>

          <div className="ag-list-controls">
            <div className="ag-filter-pills">
              {['all', 'hair', 'nails'].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`ag-filter-pill${filter === f ? ' active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'hair' ? '💇 Hair' : '💅 Nails'}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="ag-refresh-btn"
              onClick={loadGallery}
              disabled={loading}
              aria-label="Refresh gallery"
            >
              <RefreshCw size={16} className={loading ? 'ag-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="ag-state-center">
            <Loader size={32} className="ag-spin ag-state-icon" />
            <p>Loading gallery items&hellip;</p>
          </div>
        ) : loadError ? (
          <div className="ag-state-center ag-state--error">
            <XCircle size={32} className="ag-state-icon" />
            <p>{loadError}</p>
            <button type="button" className="btn btn-secondary" onClick={loadGallery} style={{ marginTop: '1rem' }}>
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="ag-state-center ag-state--empty">
            <Image size={40} className="ag-state-icon" style={{ opacity: 0.35 }} />
            <p>
              {galleryItems.length === 0
                ? 'No images uploaded yet. Use the upload panel above.'
                : `No ${filter} images found.`}
            </p>
          </div>
        ) : (
          <div className="ag-grid">
            {filtered.map((item) => (
              <GalleryItemCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                deleting={deletingId === item.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
