import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../styles/Albums.css';

const API_URL = 'http://localhost:3000';
const PHOTOS_PER_PAGE = 20;

async function apiRequest(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include'
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Request failed');
  }

  return result.data;
}

async function apiRequestWithPagination(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include'
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Request failed');
  }

  return {
    data: result.data,
    totalCount: Number(response.headers.get('X-Total-Count') || 0),
    page: Number(response.headers.get('X-Page') || 1),
    totalPages: Number(response.headers.get('X-Total-Pages') || 1)
  };
}

const emptyPhotoForm = {
  title: '',
  url: '',
  thumbnail_url: ''
};

const AlbumsList = () => {
  const { user } = useOutletContext();
  const [albums, setAlbums] = useState([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [editingAlbumId, setEditingAlbumId] = useState(null);
  const [editingAlbumTitle, setEditingAlbumTitle] = useState('');
  const [photoForm, setPhotoForm] = useState(emptyPhotoForm);
  const [editingPhotoId, setEditingPhotoId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPhotos, setTotalPhotos] = useState(0);

  const selectedAlbum = albums.find((album) => album.id === selectedAlbumId);

  const loadAlbums = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest(`/albums?userId=${user.id}`);
      setAlbums(data);
      if (!selectedAlbumId && data.length > 0) {
        setSelectedAlbumId(data[0].id);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPhotos = async (albumId, page = 1) => {
    if (!albumId) {
      setPhotos([]);
      setTotalPages(1);
      setTotalPhotos(0);
      return;
    }

    setPhotosLoading(true);
    setError('');
    try {
      const result = await apiRequestWithPagination(
        `/photos?albumId=${albumId}&page=${page}&limit=${PHOTOS_PER_PAGE}`
      );
      setPhotos(result.data);
      setCurrentPage(result.page);
      setTotalPages(result.totalPages);
      setTotalPhotos(result.totalCount);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPhotosLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadAlbums();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // Initial albums load is scheduled after the user context is available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
    const timeoutId = window.setTimeout(() => {
      loadPhotos(selectedAlbumId, 1);
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // Photos reload whenever the selected album changes.
  }, [selectedAlbumId]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    loadPhotos(selectedAlbumId, newPage);
  };

  const handleCreateAlbum = async (event) => {
    event.preventDefault();
    if (!newAlbumTitle.trim()) return;

    setError('');
    try {
      const created = await apiRequest('/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          title: newAlbumTitle
        })
      });
      setAlbums((prev) => [...prev, created]);
      setSelectedAlbumId(created.id);
      setNewAlbumTitle('');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleUpdateAlbum = async (event, albumId) => {
    event.preventDefault();
    if (!editingAlbumTitle.trim()) return;

    setError('');
    try {
      const updated = await apiRequest(`/albums/${albumId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: editingAlbumTitle
        })
      });
      setAlbums((prev) => prev.map((album) => (album.id === albumId ? updated : album)));
      setEditingAlbumId(null);
      setEditingAlbumTitle('');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    setError('');
    try {
      await apiRequest(`/albums/${albumId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      setAlbums((prev) => prev.filter((album) => album.id !== albumId));
      if (selectedAlbumId === albumId) {
        setSelectedAlbumId(null);
        setPhotos([]);
        setTotalPages(1);
        setTotalPhotos(0);
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const startEditingAlbum = (album) => {
    setEditingAlbumId(album.id);
    setEditingAlbumTitle(album.title);
  };

  const startEditingPhoto = (photo) => {
    setEditingPhotoId(photo.id);
    setPhotoForm({
      title: photo.title,
      url: photo.url,
      thumbnail_url: photo.thumbnail_url
    });
  };

  const resetPhotoForm = () => {
    setEditingPhotoId(null);
    setPhotoForm(emptyPhotoForm);
  };

  const handlePhotoSubmit = async (event) => {
    event.preventDefault();
    if (!selectedAlbumId) return;

    setError('');
    try {
      if (editingPhotoId) {
        const updated = await apiRequest(`/photos/${editingPhotoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            ...photoForm
          })
        });
        setPhotos((prev) => prev.map((photo) => (photo.id === editingPhotoId ? updated : photo)));
      } else {
        const created = await apiRequest('/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            album_id: selectedAlbumId,
            userId: user.id,
            ...photoForm
          })
        });
        // Reload the current page to reflect the new photo and update pagination
        await loadPhotos(selectedAlbumId, currentPage);
      }

      resetPhotoForm();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    setError('');
    try {
      await apiRequest(`/photos/${photoId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      // Reload photos to update pagination counts and handle page boundary
      const pageToLoad = photos.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      await loadPhotos(selectedAlbumId, pageToLoad);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <section className="albums-card">
      <div className="albums-heading">
        <div>
          <h2>My Albums</h2>
          <p>{albums.length} album{albums.length === 1 ? '' : 's'}</p>
        </div>
        <button className="secondary-btn" onClick={loadAlbums}>Refresh</button>
      </div>

      <form className="album-create-form" onSubmit={handleCreateAlbum}>
        <input
          value={newAlbumTitle}
          onChange={(event) => setNewAlbumTitle(event.target.value)}
          placeholder="New album title"
          maxLength="255"
          required
        />
        <button className="primary-action" type="submit">Create Album</button>
      </form>

      {error && <div className="album-error">{error}</div>}

      {isLoading ? (
        <p className="list-message">Loading albums...</p>
      ) : albums.length === 0 ? (
        <p className="list-message">No albums yet. Create your first collection above.</p>
      ) : (
        <div className="albums-layout">
          <div className="albums-list">
            {albums.map((album, index) => (
              <article className={`album-item ${selectedAlbumId === album.id ? 'selected' : ''}`} key={album.id}>
                {editingAlbumId === album.id ? (
                  <form className="album-edit-form" onSubmit={(event) => handleUpdateAlbum(event, album.id)}>
                    <input
                      value={editingAlbumTitle}
                      onChange={(event) => setEditingAlbumTitle(event.target.value)}
                      maxLength="255"
                      required
                      autoFocus
                    />
                    <button className="small-btn save-btn" type="submit">Save</button>
                    <button className="small-btn" type="button" onClick={() => setEditingAlbumId(null)}>Cancel</button>
                  </form>
                ) : (
                  <>
                    <button className="album-select" onClick={() => setSelectedAlbumId(album.id)}>
                      <span>#{index + 1}</span>
                      <strong>{album.title}</strong>
                    </button>
                    <div className="album-actions">
                      <button className="small-btn" onClick={() => startEditingAlbum(album)}>Edit</button>
                      <button className="small-btn delete-btn" onClick={() => handleDeleteAlbum(album.id)}>Delete</button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>

          <div className="photos-panel">
            <div className="photos-heading">
              <div>
                <h3>{selectedAlbum ? selectedAlbum.title : 'Photos'}</h3>
                <p>{totalPhotos} photo{totalPhotos === 1 ? '' : 's'}</p>
              </div>
            </div>

            {selectedAlbum && (
              <form className="photo-form" onSubmit={handlePhotoSubmit}>
                <input
                  value={photoForm.title}
                  onChange={(event) => setPhotoForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Photo title"
                  maxLength="255"
                  required
                />
                <input
                  value={photoForm.url}
                  onChange={(event) => setPhotoForm((prev) => ({ ...prev, url: event.target.value }))}
                  placeholder="Full image URL"
                  maxLength="2048"
                  required
                />
                <input
                  value={photoForm.thumbnail_url}
                  onChange={(event) => setPhotoForm((prev) => ({ ...prev, thumbnail_url: event.target.value }))}
                  placeholder="Thumbnail URL"
                  maxLength="2048"
                  required
                />
                <div className="photo-form-actions">
                  {editingPhotoId && (
                    <button className="small-btn" type="button" onClick={resetPhotoForm}>Cancel</button>
                  )}
                  <button className="primary-action" type="submit">
                    {editingPhotoId ? 'Save Photo' : 'Add Photo'}
                  </button>
                </div>
              </form>
            )}

            {photosLoading ? (
              <p className="list-message">Loading photos...</p>
            ) : photos.length === 0 ? (
              <p className="list-message">{selectedAlbum ? 'No photos yet.' : 'Select an album to manage photos.'}</p>
            ) : (
              <div className="photos-grid">
                {photos.map((photo) => (
                  <article className="photo-card" key={photo.id}>
                    <img src={photo.thumbnail_url} alt={photo.title} loading="lazy" />
                    <div className="photo-card-body">
                      <strong>{photo.title}</strong>
                      <a href={photo.url} target="_blank" rel="noreferrer">Open image</a>
                      <div className="photo-actions">
                        <button className="small-btn" onClick={() => startEditingPhoto(photo)}>Edit</button>
                        <button className="small-btn delete-btn" onClick={() => handleDeletePhoto(photo.id)}>Delete</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="photos-pagination">
                <button
                  className="small-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  className="small-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default AlbumsList;
