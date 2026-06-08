import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bookmark, Filter } from 'lucide-react'
import api from '../api/client'
import ArticleCard from '../components/ArticleCard'
import { useAuth } from '../context/AuthContext'

export default function FavoritesPage() {
  const [articles, setArticles] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  const fetchFavorites = useCallback(async (pageNum = 1, reset = false) => {
    setLoading(true)
    try {
      const response = await api.get('/user/favorites', {
        params: { page: pageNum, page_size: 20 },
      })
      const { items, total: totalCount, has_next } = response.data
      if (reset) {
        setArticles(items)
      } else {
        setArticles((prev) => [...prev, ...items])
      }
      setTotal(totalCount)
      setHasMore(has_next)
      setPage(pageNum)
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchFavorites(1, true)
  }, [user])

  const handleAction = (type, articleId, value) => {
    if (type === 'favorite' && !value) {
      setArticles((prev) => prev.filter((a) => a.id !== articleId))
      setTotal((prev) => prev - 1)
    }
  }

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchFavorites(page + 1, false)
    }
  }

  return (
    <div className="list-page">
      <div className="page-header">
        <div>
          <h1>
            <Bookmark size={24} />
            我的收藏
          </h1>
          <p className="text-secondary text-sm">共收藏 {total} 篇文章</p>
        </div>
      </div>

      {loading && articles.length === 0 && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}

      {!loading && articles.length === 0 && (
        <div className="empty-state">
          <Bookmark size={48} className="empty-state-icon" />
          <p>还没有收藏任何文章</p>
          <p className="text-sm text-secondary">去发现一些有趣的文章吧</p>
          <Link to="/" className="btn btn-primary mt-4">
            浏览文章
          </Link>
        </div>
      )}

      <div className="articles-grid">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} onAction={handleAction} />
        ))}
      </div>

      {hasMore && (
        <div className="load-more">
          <button className="btn btn-outline" onClick={loadMore} disabled={loading}>
            {loading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}

      <style jsx>{`
        .list-page {
          max-width: 1200px;
          margin: 0 auto;
        }
        .page-header {
          margin-bottom: 24px;
        }
        .page-header h1 {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .load-more {
          display: flex;
          justify-content: center;
          margin-top: 32px;
        }
      `}</style>
    </div>
  )
}
