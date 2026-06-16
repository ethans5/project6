import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import PostItem from './PostItem';

const API_URL = 'http://localhost:3000';

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

const PostsList = () => {
  const { user } = useOutletContext();
  const [posts, setPosts] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPosts = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');
    try {
      const data = await apiRequest('/posts');
      setPosts(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadPosts();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // Initial posts load is scheduled after the user context is available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAddPost = async (event) => {
    event.preventDefault();
    if (!newTitle.trim()) return;

    setError('');
    try {
      const created = await apiRequest('/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          title: newTitle,
          body: newBody
        })
      });
      // Pessimistic: only update state after server confirms
      setPosts((prev) => [...prev, created]);
      setNewTitle('');
      setNewBody('');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleUpdatePost = async (postId, updatedData) => {
    setError('');
    try {
      const updated = await apiRequest(`/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...updatedData
        })
      });
      // Pessimistic: only update state after server confirms
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? updated : post))
      );
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  };

  const handleDeletePost = async (postId) => {
    setError('');
    try {
      await apiRequest(`/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      // Pessimistic: only update state after server confirms
      setPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <section className="posts-card">
      <div className="posts-heading">
        <div>
          <h2>All Posts</h2>
          <p>{posts.length} post{posts.length === 1 ? '' : 's'}, sorted by ID</p>
        </div>
        <button className="secondary-btn" onClick={loadPosts}>Refresh</button>
      </div>

      <form className="add-post-form" onSubmit={handleAddPost}>
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Post title"
          maxLength="255"
          required
        />
        <textarea
          value={newBody}
          onChange={(event) => setNewBody(event.target.value)}
          placeholder="Write your post content..."
          rows="3"
        />
        <button className="primary-action" type="submit">Create Post</button>
      </form>

      {error && <div className="post-error">{error}</div>}

      {isLoading ? (
        <p className="list-message">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="list-message">No posts yet. Be the first to post!</p>
      ) : (
        <div className="posts-list">
          {posts.map((post, index) => (
            <PostItem
              key={post.id}
              visualId={index + 1}
              post={post}
              user={user}
              onUpdate={handleUpdatePost}
              onDelete={handleDeletePost}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default PostsList;
