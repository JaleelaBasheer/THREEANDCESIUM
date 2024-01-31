import React , { useState } from 'react'

function Label({ position, text, onCommentClick }) {
  const [comment, setComment] = useState('');

  const handleCommentClick = () => {
    onCommentClick(text, comment);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: position.y,
        left: position.x,
        transform: 'translate(-50%, -50%)',
        background: '#fff',
        padding: '5px',
        borderRadius: '5px',
        boxShadow: '0px 0px 5px 0px rgba(0,0,0,0.75)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div>{text}</div>
      <textarea
        placeholder="Add a comment..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button onClick={handleCommentClick}>Add Comment</button>
    </div>
  );
}

export default Label