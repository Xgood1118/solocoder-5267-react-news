import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, Bookmark, Clock, ArrowLeft, Eye, MessageSquare, Share2 } from 'lucide-react'
import dayjs from 'dayjs'
import api from '../api/client'
import SourceBadge from '../components/SourceBadge'
import CommentTree from '../components/CommentTree'
import { useAuth } from '../context/AuthContext'

export default function ArticlePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [comments, setComments] = useState([])
  const [commentContent, setCommentContent] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    fetchArticle()
    fetchComments()
  }, [id])

  const fetchArticle = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/articles/${id}`)
      setArticle(response.data)
    } catch (error) {
      setError('加载文章失败')
      console.error('Failed to fetch article:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await api.get(`/comments/article/${id}`)
      setComments(response.data.items)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const handleLike = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const response = await api.post(`/articles/${id}/like`)
      setArticle((prev) => ({
        ...prev,
        is_liked: response.data.liked,
        like_count: response.data.like_count,
      }))
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const handleFavorite = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const response = await api.post(`/articles/${id}/favorite`)
      setArticle((prev) => ({
        ...prev,
        is_favorited: response.data.favorited,
      }))
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleReadLater = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      const response = await api.post(`/articles/${id}/read-later`)
      setArticle((prev) => ({
        ...prev,
        is_read_later: response.data.saved,
      }))
    } catch (error) {
      console.error('Failed to toggle read later:', error)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    if (!commentContent.trim()) return

    setSubmittingComment(true)
    try {
      const response = await api.post(`/comments/article/${id}`, {
        content: commentContent,
      })
      setComments((prev) => [response.data, ...prev])
      setCommentContent('')
      setArticle((prev) => ({
        ...prev,
        comment_count: (prev.comment_count || 0) + 1,
      }))
    } catch (error) {
      console.error('Failed to post comment:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="article-error">
        <p>{error || '文章不存在'}</p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={16} />
          返回首页
        </Link>
      </div>
    )
  }

  return (
    <div className="article-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} />
        返回
      </button>

      <article className="article-detail card">
        <header className="article-header">
          <div className="article-meta-top">
            <SourceBadge source={article.source} size="md" />
            <span className="text-secondary text-sm">
              {dayjs(article.published_at || article.created_at).format('YYYY-MM-DD HH:mm')}
            </span>
          </div>

          <h1 className="article-title">{article.title}</h1>

          {article.author && (
            <div className="article-author">
              <span>作者: {article.author}</span>
            </div>
          )}

          {article.tags && article.tags.length > 0 && (
            <div className="article-tags">
              {article.tags.map((tag) => (
                <span key={tag.tag} className="tag">
                  #{tag.tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="article-actions">
          <div className="stat-group">
            <span className="stat">
              <Eye size={18} />
              {article.view_count || 0} 阅读
            </span>
            <span className="stat">
              <MessageSquare size={18} />
              {article.comment_count || 0} 评论
            </span>
          </div>

          <div className="action-buttons">
            <button
              className={`action-btn ${article.is_liked ? 'active' : ''}`}
              onClick={handleLike}
            >
              <Heart size={18} fill={article.is_liked ? 'currentColor' : 'none'} />
              <span>{article.like_count || 0}</span>
            </button>
            <button
              className={`action-btn ${article.is_favorited ? 'active' : ''}`}
              onClick={handleFavorite}
            >
              <Bookmark size={18} fill={article.is_favorited ? 'currentColor' : 'none'} />
              <span>{article.is_favorited ? '已收藏' : '收藏'}</span>
            </button>
            <button
              className={`action-btn ${article.is_read_later ? 'active' : ''}`}
              onClick={handleReadLater}
            >
              <Clock size={18} />
              <span>{article.is_read_later ? '已保存' : '稍后读'}</span>
            </button>
            <button className="action-btn">
              <Share2 size={18} />
              <span>分享</span>
            </button>
          </div>
        </div>

        {article.summary && (
          <div className="article-summary">
            <h4>摘要</h4>
            <p>{article.summary}</p>
          </div>
        )}

        <div className="article-content">
          {article.content ? (
            article.content.split('\n').map((paragraph, index) => (
              paragraph && <p key={index}>{paragraph}</p>
            ))
          ) : (
            <div className="no-content">
              <p>暂无全文内容，前往原文阅读</p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                阅读原文
              </a>
            </div>
          )}
        </div>

        {article.url && (
          <div className="article-source-link">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              查看原文 →
            </a>
          </div>
        )}
      </article>

      <section className="comments-section card">
        <h2>
          <MessageSquare size={20} />
          评论 ({article.comment_count || 0})
        </h2>

        {user ? (
          <form className="comment-form" onSubmit={handleSubmitComment}>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="写下你的评论..."
              rows={3}
            />
            <div className="comment-form-actions">
              <span className="char-count">{commentContent.length}/2000</span>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={submittingComment || !commentContent.trim()}
              >
                {submittingComment ? '发布中...' : '发布评论'}
              </button>
            </div>
          </form>
        ) : (
          <div className="login-prompt">
            <p>登录后可以发表评论</p>
            <Link to="/login" className="btn btn-primary btn-sm">立即登录</Link>
          </div>
        )}

        <CommentTree comments={comments} />
      </section>

      <style jsx>{`
        .article-page {
          max-width: 800px;
          margin: 0 auto;
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: none;
          background: none;
          color: var(--text-secondary);
          font-size: 14px;
          cursor: pointer;
          border-radius: 6px;
          margin-bottom: 16px;
          transition: all 0.2s;
        }
        .back-btn:hover {
          background: white;
          color: var(--text-primary);
        }
        .article-detail {
          padding: 32px;
          margin-bottom: 24px;
        }
        .article-header {
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border-color);
        }
        .article-meta-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .article-title {
          font-size: 28px;
          font-weight: 700;
          line-height: 1.4;
          margin-bottom: 12px;
        }
        .article-author {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }
        .article-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .tag {
          font-size: 13px;
          color: var(--primary-color);
          background: #eff6ff;
          padding: 4px 10px;
          border-radius: 4px;
        }
        .article-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-color);
        }
        .stat-group {
          display: flex;
          gap: 20px;
        }
        .stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--text-secondary);
        }
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: 1px solid var(--border-color);
          background: white;
          border-radius: 6px;
          font-size: 14px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }
        .action-btn.active {
          color: var(--danger-color);
          border-color: #fecaca;
          background: #fef2f2;
        }
        .article-summary {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .article-summary h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text-secondary);
        }
        .article-summary p {
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-primary);
        }
        .article-content {
          font-size: 16px;
          line-height: 1.8;
          color: var(--text-primary);
        }
        .article-content p {
          margin-bottom: 16px;
        }
        .no-content {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary);
        }
        .no-content p {
          margin-bottom: 16px;
        }
        .article-source-link {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
          text-align: right;
        }
        .article-source-link a {
          color: var(--primary-color);
          font-size: 14px;
          font-weight: 500;
        }
        .comments-section {
          padding: 24px;
        }
        .comments-section h2 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .comment-form {
          margin-bottom: 24px;
        }
        .comment-form textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 14px;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s;
        }
        .comment-form textarea:focus {
          border-color: var(--primary-color);
        }
        .comment-form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }
        .char-count {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .login-prompt {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .login-prompt p {
          font-size: 14px;
          color: var(--text-secondary);
        }
        .article-error {
          text-align: center;
          padding: 60px 20px;
        }
        .article-error p {
          font-size: 16px;
          color: var(--text-secondary);
          margin-bottom: 20px;
        }
        @media (max-width: 768px) {
          .article-detail {
            padding: 20px;
          }
          .article-title {
            font-size: 22px;
          }
          .article-actions {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  )
}
