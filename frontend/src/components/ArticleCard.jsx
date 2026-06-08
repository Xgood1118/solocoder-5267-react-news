import { Link } from 'react-router-dom'
import { Heart, Bookmark, Clock, Eye, MessageCircle } from 'lucide-react'
import dayjs from 'dayjs'
import SourceBadge from './SourceBadge'
import api from '../api/client'
import { useState } from 'react'

export default function ArticleCard({ article, onAction }) {
  const [liked, setLiked] = useState(article.is_liked)
  const [likeCount, setLikeCount] = useState(article.like_count)
  const [favorited, setFavorited] = useState(article.is_favorited)
  const [readLater, setReadLater] = useState(article.is_read_later)

  const handleLike = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const response = await api.post(`/articles/${article.id}/like`)
      setLiked(response.data.liked)
      setLikeCount(response.data.like_count)
      onAction?.('like', article.id, response.data.liked)
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const handleFavorite = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const response = await api.post(`/articles/${article.id}/favorite`)
      setFavorited(response.data.favorited)
      onAction?.('favorite', article.id, response.data.favorited)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleReadLater = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const response = await api.post(`/articles/${article.id}/read-later`)
      setReadLater(response.data.saved)
      onAction?.('readLater', article.id, response.data.saved)
    } catch (error) {
      console.error('Failed to toggle read later:', error)
    }
  }

  return (
    <Link to={`/article/${article.id}`} className="article-card">
      <div className="card-content">
        <div className="card-header">
          <SourceBadge source={article.source} />
          <span className="text-secondary text-xs">
            {dayjs(article.published_at || article.created_at).fromNow()}
          </span>
        </div>

        <h3 className="card-title">{article.title}</h3>

        {article.summary && (
          <p className="card-summary">{article.summary}</p>
        )}

        {article.tags && article.tags.length > 0 && (
          <div className="card-tags">
            {article.tags.slice(0, 3).map((tag) => (
              <span key={tag.tag} className="tag">
                #{tag.tag}
              </span>
            ))}
          </div>
        )}

        <div className="card-footer">
          <div className="card-stats">
            <span className="stat">
              <Eye size={14} />
              {article.view_count || 0}
            </span>
            <span className="stat">
              <MessageCircle size={14} />
              {article.comment_count || 0}
            </span>
          </div>

          <div className="card-actions">
            <button
              className={`action-btn ${liked ? 'active' : ''}`}
              onClick={handleLike}
              title="点赞"
            >
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
              <span>{likeCount}</span>
            </button>
            <button
              className={`action-btn ${favorited ? 'active' : ''}`}
              onClick={handleFavorite}
              title="收藏"
            >
              <Bookmark size={16} fill={favorited ? 'currentColor' : 'none'} />
            </button>
            <button
              className={`action-btn ${readLater ? 'active' : ''}`}
              onClick={handleReadLater}
              title="稍后读"
            >
              <Clock size={16} />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .article-card {
          display: block;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          transition: all 0.2s;
          overflow: hidden;
        }
        .article-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
          border-color: #cbd5e1;
        }
        .card-content {
          padding: 16px;
        }
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .card-title {
          font-size: 16px;
          font-weight: 600;
          line-height: 1.5;
          color: var(--text-primary);
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card-summary {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }
        .tag {
          font-size: 12px;
          color: var(--primary-color);
          background: #eff6ff;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid var(--border-color);
        }
        .card-stats {
          display: flex;
          gap: 12px;
        }
        .stat {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .card-actions {
          display: flex;
          gap: 4px;
        }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border: none;
          background: none;
          color: var(--text-secondary);
          font-size: 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn:hover {
          background: var(--bg-color);
          color: var(--text-primary);
        }
        .action-btn.active {
          color: var(--danger-color);
        }
      `}</style>
    </Link>
  )
}
