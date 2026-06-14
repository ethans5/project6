import { useState } from 'react';

const CommentItem = ({ comment, visualId, user, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);

  const isOwner = comment.email === user.email;

  const handleSave = async (event) => {
    event.preventDefault();
    const success = await onUpdate(comment.id, { body: editBody });
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditBody(comment.body);
  };

  return (
    <div className="comment-item">
      <div className="comment-header">
        <span className="comment-id" style={{ marginRight: '8px', color: '#64748b', fontSize: '13px' }}>#{visualId} :</span>
        <span className="comment-author">@{comment.username}</span>
      </div>

      {isEditing ? (
        <form className="edit-comment-form" onSubmit={handleSave}>
          <textarea
            value={editBody}
            onChange={(event) => setEditBody(event.target.value)}
            rows="2"
            autoFocus
          />
          <div className="edit-comment-actions">
            <button className="small-btn save-btn" type="submit">Save</button>
            <button className="small-btn" type="button" onClick={handleCancel}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <p className="comment-body">{comment.body}</p>
          {isOwner && (
            <div className="comment-actions">
              <button
                className="small-btn"
                onClick={() => { setIsEditing(true); setEditBody(comment.body); }}
              >
                Edit
              </button>
              <button
                className="small-btn delete-btn"
                onClick={() => onDelete(comment.id)}
              >
                Delete
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommentItem;
