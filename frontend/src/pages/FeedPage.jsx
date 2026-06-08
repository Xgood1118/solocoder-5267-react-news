import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import ArticleCard from '../components/ArticleCard'
import useInfiniteScroll from '../hooks/useInfiniteScroll'
import { Newspaper, TrendingUp, Clock, Plus, Filter } from 'lucide-react'

export default function FeedPage() {
  const [articles, setArticles] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('published_at')
  const [activeTag, setActiveTag] = useState('')
  const [popularTags, setPopularTags] = useState([])

  const fetchArticles = useCallback(async (pageNum = 1, reset = false) => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page: pageNum,
        page_size: 20,
        sort_by: sortBy,
      }
      if (activeTag) {
        params.tag = activeTag
      }

      const response = await api.get('/articles', { params })
      const { items, total, has_next } = response.data

      if (reset) {
        setArticles(items)
      } else {
        setArticles((prev) => [...prev, ...items])
      }
      setTotal(total)
      setHasMore(has_next)
      setPage(pageNum)
    } catch (error) {
      setError('加载文章失败，请稍后重试')
      console.error('Failed to fetch articles:', error)
    } finally {
      setLoading(false)
    }
  }, [sortBy, activeTag])

  const fetchPopularTags = async () => {
    try {
      const response = await api.get('/articles/tags/popular', { params: { limit: 15 } })
      setPopularTags(response.data)
    } catch (error) {
      console.error('Failed to fetch popular tags:', error)
    }
  }

  useEffect(() => {
    fetchArticles(1, true)
    fetchPopularTags()
  }, [fetchArticles])

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await fetchArticles(page + 1, false)
  }, [page, hasMore, loading, fetchArticles])

  const { sentinelRef } = useInfiniteScroll(loadMore, hasMore)

  const handleSortChange = (sort) => {
    setSortBy(sort)
    setPage(1)
  }

  const handleTagClick = (tag) => {
    setActiveTag(activeTag === tag ? '' : tag)
    setPage(1)
  }

  return (
    <div className="feed-page">
      <div className="feed-main">
        <div className="feed-header">
          <h1>
            <Newspaper size={24} />
            最新资讯
          </h1>
          <div className="feed-actions">
            <div className="sort-tabs">
              <button
                className={`sort-tab ${sortBy === 'published_at' ? 'active' : ''}`}
                onClick={() => handleSortChange('published_at')}
              >
                <Clock size={16} />
                最新
              </button>
              <button
                className={`sort-tab ${sortBy === 'like_count' ? 'active' : ''}`}
                onClick={() => handleSortChange('like_count')}
              >
                <TrendingUp size={16} />
                热门
              </button>
            </div>
            <Link to="/sources" className="btn btn-primary btn-sm">
              <Plus size={16} />
              添加订阅
            </Link>
          </div>
        </div>

        {activeTag && (
          <div className="active-tag">
            <span>标签: #{activeTag}</span>
            <button onClick={() => handleTagClick(activeTag)}>清除</button>
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        <div className="articles-grid">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>

        {loading && articles.length === 0 && (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        )}

        {!loading && articles.length === 0 && (
          <div className="empty-state">
            <Newspaper size={48} className="empty-state-icon" />
            <p>暂无文章</p>
            <p className="text-sm text-secondary">去添加一些订阅源吧</p>
            <Link to="/sources" className="btn btn-primary mt-4">
              发现订阅源
            </Link>
          </div>
        )}

        {hasMore && (
          <div ref={sentinelRef} className="load-more-sentinel">
            {loading && <div className="spinner"></div>}
          </div>
        )}
      </div>

      <aside className="feed-sidebar">
        <div className="sidebar-card">
          <h3>
            <Filter size={18} />
            热门标签
          </h3>
          <div className="tags-list">
            {popularTags.map((tag) => (
              <button
                key={tag}
                className={`tag-btn ${activeTag === tag ? 'active' : ''}`}
                onClick={() => handleTagClick(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-card">
          <h3>订阅统计</h3>
          <div className="stat-item">
            <span>共 {total} 篇文章</span>
          </div>
        </div>
      </aside>

      <style jsx>{`
        .feed-page {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 24px;
        }
        .feed-main {
          min-width: 0;
        }
        .feed-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .feed-header h1 {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 22px;
          font-weight: 700;
        }
        .feed-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sort-tabs {
          display: flex;
          background: var(--bg-color);
          border-radius: 6px;
          padding: 2px;
        }
        .sort-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border: none;
          background: none;
          border-radius: 4px;
          font-size: 13px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .sort-tab.active {
          background: white;
          color: var(--primary-color);
          font-weight: 500;
          box-shadow: var(--shadow-sm);
        }
        .active-tag {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: #eff6ff;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
          color: var(--primary-color);
        }
        .active-tag button {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--primary-color);
          font-size: 13px;
          cursor: pointer;
          text-decoration: underline;
        }
        .error-banner {
          background: #fef2f2;
          color: var(--danger-color);
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        .load-more-sentinel {
          display: flex;
          justify-content: center;
          padding: 30px 0;
        }
        .feed-sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sidebar-card {
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 16px;
        }
        .sidebar-card h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .tag-btn {
          padding: 4px 10px;
          border: 1px solid var(--border-color);
          background: white;
          border-radius: 9999px;
          font-size: 12px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .tag-btn:hover {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }
        .tag-btn.active {
          background: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
        }
        .stat-item {
          font-size: 14px;
          color: var(--text-secondary);
        }
        @media (max-width: 1024px) {
          .feed-page {
            grid-template-columns: 1fr;
          }
          .feed-sidebar {
            order: -1;
          }
        }
      `}</style>
    </div>
  )
}
