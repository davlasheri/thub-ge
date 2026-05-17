import { useState, useCallback } from 'react';
import { processImageFile } from '../utils/imageProcess';
import './ImageTool.css';

interface ProcessedImg {
  id: string;
  name: string;
  blobUrl: string;
}

export default function ImageTool() {
  const [images, setImages] = useState<ProcessedImg[]>([]);
  const [processing, setProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!arr.length) return;
    setProcessing(true);
    try {
      const results = await Promise.all(arr.map(async f => {
        const r = await processImageFile(f);
        return { id: Math.random().toString(36).slice(2), name: r.fileName, blobUrl: r.blobUrl };
      }));
      setImages(prev => [...results, ...prev]);
    } finally {
      setProcessing(false);
    }
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) handleFiles(e.target.files);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  function handleDownload(img: ProcessedImg) {
    const a = document.createElement('a');
    a.href = img.blobUrl;
    a.download = img.name;
    a.click();
  }

  function handleDownloadAll() {
    images.forEach((img, i) => {
      setTimeout(() => handleDownload(img), i * 120);
    });
  }

  function handleRemove(id: string) {
    setImages(prev => {
      const removed = prev.find(x => x.id === id);
      if (removed) URL.revokeObjectURL(removed.blobUrl);
      return prev.filter(x => x.id !== id);
    });
  }

  return (
    <div className="imgtool-root">
      <div className="imgtool-page">

        <div className="imgtool-header">
          <a href="/" className="imgtool-back">← Back to site</a>
          <h1>Product Image Tool</h1>
          <p>Upload product photos — each is resized to 800×800, placed on an anthracite background, and stamped with the THub.ge badge.</p>
        </div>

        <label
          className={`imgtool-drop${isDragging ? ' imgtool-drop-active' : ''}${processing ? ' imgtool-drop-busy' : ''}`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
          {processing ? (
            <>
              <div className="imgtool-spinner" />
              <span>Processing…</span>
            </>
          ) : (
            <>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="imgtool-drop-main">Click to upload or drag &amp; drop</span>
              <span className="imgtool-drop-sub">JPG · PNG · WEBP · multiple files supported</span>
            </>
          )}
        </label>

        {images.length > 0 && (
          <>
            <div className="imgtool-toolbar">
              <span>{images.length} image{images.length !== 1 ? 's' : ''} ready</span>
              <button className="btn-secondary imgtool-dl-all" onClick={handleDownloadAll}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download All
              </button>
            </div>

            <div className="imgtool-grid">
              {images.map(img => (
                <div key={img.id} className="imgtool-card">
                  <div className="imgtool-thumb-wrap">
                    <img src={img.blobUrl} alt={img.name} className="imgtool-thumb" />
                  </div>
                  <div className="imgtool-card-footer">
                    <span className="imgtool-card-name" title={img.name}>{img.name}</span>
                    <div className="imgtool-card-btns">
                      <button className="btn-primary imgtool-btn" onClick={() => handleDownload(img)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Save
                      </button>
                      <button className="imgtool-remove" onClick={() => handleRemove(img.id)} title="Remove">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
