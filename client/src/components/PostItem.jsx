import { useState } from 'react';
import CommentItem from './CommentItem';

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

const PostItem = ({ post, visualId, user, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editBody, setEditBody] = useState(post.body);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentError, setCommentError] = useState('');

  const [newCommentBody, setNewCommentBody] = useState('');

  const isOwner = post.user_id === user.id;

  // --- Post editing ---
  const handleSavePost = async (event) => {
    event.preventDefault();
    if (!editTitle.trim()) return;
    const success = await onUpdate(post.id, { title: editTitle, body: editBody });
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(post.title);
    setEditBody(post.body);
  };

  // --- Comments ---
  const loadComments = async () => {
    setCommentsLoading(true);
    setCommentError('');
    try {
      const data = await apiRequest(`/comments?postId=${post.id}`);
      setComments(data);
      setCommentsLoaded(true);
    } catch (requestError) {
      setCommentError(requestError.message);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleToggleComments = () => {
    if (!showComments && !commentsLoaded) {
      loadComments();
    }
    setShowComments((prev) => !prev);
  };

  const handleAddComment = async (event) => {
    event.preventDefault();
    if (!newCommentBody.trim()) return;

    setCommentError('');
    try {
      const created = await apiRequest('/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          username: user.username,
          email: user.email,
          body: newCommentBody
        })
      });
      // Pessimistic: only update state after server confirms
      setComments((prev) => [...prev, created]);
      setNewCommentBody('');
    } catch (requestError) {
      setCommentError(requestError.message);
    }
  };

  const handleUpdateComment = async (commentId, updatedData) => {
    setCommentError('');
    try {
      const updated = await apiRequest(`/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          ...updatedData
        })
      });
      // Pessimistic: only update state after server confirms
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updated : c))
      );
      return true;
    } catch (requestError) {
      setCommentError(requestError.message);
      return false;
    }
  };

  const handleDeleteComment = async (commentId) => {
    setCommentError('');
    try {
      await apiRequest(`/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      // Pessimistic: only update state after server confirms
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (requestError) {
      setCommentError(requestError.message);
    }
  };

  return (
    <article className="post-item">
      {isEditing ? (
        <form className="edit-post-form" onSubmit={handleSavePost}>
          <input
            className="edit-post-title"
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            placeholder="Post title"
            maxLength="255"
            required
            autoFocus
          />
          <textarea
            className="edit-post-body"
            value={editBody}
            onChange={(event) => setEditBody(event.target.value)}
            placeholder="Post body"
            rows="3"
          />
          <div className="edit-post-actions">
            <button className="small-btn save-btn" type="submit">Save</button>
            <button className="small-btn" type="button" onClick={handleCancelEdit}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <div className="post-content">
            <div className="post-meta">
              <span className="post-id">#{visualId} :</span>
              <span className="post-author">by @{post.author_username}</span>
              {isOwner && <span className="post-owner-badge">Your post</span>}
            </div>
            <h3 className="post-title">{post.title}</h3>
            <p className="post-body">{post.body}</p>
          </div>

          <div className="post-footer">
            <button
              className={`small-btn comments-toggle ${showComments ? 'active' : ''}`}
              onClick={handleToggleComments}
            >
              {showComments ? 'Hide Comments' : 'Show Comments'}
              {commentsLoaded && ` (${comments.length})`}
            </button>

            {isOwner && (
              <div className="post-actions">
                <button
                  className="small-btn"
                  onClick={() => { setIsEditing(true); setEditTitle(post.title); setEditBody(post.body); }}
                >
                  Edit
                </button>
                <button
                  className="small-btn delete-btn"
                  onClick={() => onDelete(post.id)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {showComments && (
        <div className="comments-section">
          <h4 className="comments-title">Comments</h4>

          <form className="add-comment-form" onSubmit={handleAddComment}>
            <textarea
              value={newCommentBody}
              onChange={(event) => setNewCommentBody(event.target.value)}
              placeholder="Write a comment..."
              rows="2"
              required
            />
            <button className="primary-action small-btn" type="submit">Add Comment</button>
          </form>

          {commentError && <div className="post-error">{commentError}</div>}

          {commentsLoading ? (
            <p className="list-message">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="list-message">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="comments-list">
              {comments.map((comment, index) => (
                <CommentItem
                  key={comment.id}
                  visualId={index + 1}
                  comment={comment}
                  user={user}
                  onUpdate={handleUpdateComment}
                  onDelete={handleDeleteComment}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default PostItem;
