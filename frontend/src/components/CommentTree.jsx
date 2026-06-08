import { useState } from 'react'
import { Heart, MessageCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import dayjs from 'dayjs'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

function CommentItem({ comment, onReply, onDelete, depth = 0 }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(comment.like_count)
  const [collapsed, setCollapsed] = useState(false)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLike = async () => {
    if (!user) return
    try {
      const response = await api.post(`/comments/${comment.id}/like`)
      setLiked(response.data.liked)
      setLikeCount(response.data.like_count)
    } catch (error) {
      console.error('Failed to like comment:', error)
    }
  }

  const handleSubmitReply = async (e) => {
    e.preventDefault()
    if (!replyContent.trim() || !user) return

    setSubmitting(true)
    try {
      const response = await api.post(`/comments/article/${comment.article_id}`, {
        content: replyContent,
        parent_id: comment.id
      })
      setReplyContent('')
      setShowReplyInput(false)
      onReply?.(response.data)
    } catch (error) {
      console.error('Failed to post reply:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定删除这条评论吗？')) return
    try {
      await api.delete(`/comments/${comment.id}`)
      onDelete?.(comment.id)
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  const hasReplies = comment.replies && comment.replies.length > 0

  return (
    <div className={`comment-item depth-${depth}`}>
      <div className="comment-avatar">
        <div className="avatar-fallback">
          {comment.user?.username?.charAt(0)?.toUpperCase() || '?'}
        </div>
      </div>

      <div className="comment-body">
        <div className="comment-header">
          <span className="comment-author">{comment.user?.username || '匿名用户'}</span>
          <span className="comment-time">
            {dayjs(comment.created_at).fromNow()}
          </span>
          {collapsed && hasReplies && (
            <span className="reply-count">{comment.replies.length} 条回复</span>
          )}
        </div>

        {!collapsed && (
          <>
            <div className="comment-content">
              {comment.is_deleted ? (
                <span className="deleted-text">[已删除]</span>
              ) : (
                <p>{comment.content}</p>
              )}
            </div>

            <div className="comment-actions">
              <button className="action-btn" onClick={handleLike}>
                <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                <span>{likeCount}</span>
              </button>

              {depth < 2 && !comment.is_deleted && user && (
                <button
                  className="action-btn"
                  onClick={() => setShowReplyInput(!showReplyInput)}
                >
                  <MessageCircle size={14} />
                  <span>回复</span>
                </button>
              )}

              {hasReplies && (
                <button
                  className="action-btn"
                  onClick={() => setCollapsed(!collapsed)}
                >
                  {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  <span>{collapsed ? '展开' : '收起'}</span>
                </button>
              )}

              {user && (user.id === comment.user_id || user.is_admin) && (
                <button className="action-btn delete-btn" onClick={handleDelete}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {showReplyInput && (
              <form className="reply-form" onSubmit={handleSubmitReply}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="写下你的回复..."
                  rows={2}
                />
                <div className="reply-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowReplyInput(false)}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={submitting || !replyContent.trim()}
                  >
                    {submitting ? '发送中...' : '回复'}
                  </button>
                </div>
              </form>
            )}

            {hasReplies && (
              <div className="comment-replies">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    depth={depth + 1}
                    onReply={onReply}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .comment-item {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        .comment-avatar {
          flex-shrink: 0;
        }
        .avatar-fallback {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
        }
        .comment-body {
          flex: 1;
          min-width: 0;
        }
        .comment-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }
        .comment-author {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .comment-time {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .reply-count {
          font-size: 12px;
          color: var(--primary-color);
          cursor: pointer;
        }
        .comment-content {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.6;
          margin-bottom: 6px;
        }
        .comment-content p {
          word-break: break-word;
        }
        .deleted-text {
          color: var(--text-secondary);
          font-style: italic;
        }
        .comment-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          border: none;
          background: none;
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .action-btn:hover {
          color: var(--text-primary);
          background: var(--bg-color);
        }
        .delete-btn:hover {
          color: var(--danger-color);
        }
        .reply-form {
          margin-bottom: 12px;
          padding: 10px;
          background: var(--bg-color);
          border-radius: 8px;
        }
        .reply-form textarea {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          font-size: 13px;
          resize: vertical;
          outline: none;
        }
        .reply-form textarea:focus {
          border-color: var(--primary-color);
        }
        .reply-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 8px;
        }
        .comment-replies {
          margin-top: 8px;
          padding-left: 12px;
          border-left: 2px solid var(--border-color);
        }
      `}</style>
    </div>
  )
}

export default function CommentTree({ comments, onCommentAdded, onCommentDeleted }) {
  return (
    <div className="comment-tree">
      {comments.length === 0 ? (
        <div className="empty-comments">
          <MessageCircle size={32} />
          <p>暂无评论，来说两句吧</p>
        </div>
      ) : (
        comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            depth={0}
            onReply={onCommentAdded}
            onDelete={onCommentDeleted}
          />
        ))
      )}

      <style jsx>{`
        .comment-tree {
          margin-top: 20px;
        }
        .empty-comments {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary);
        }
        .empty-comments p {
          margin-top: 8px;
          font-size: 14px;
        }
      `}</style>
    </div>
  )
}
