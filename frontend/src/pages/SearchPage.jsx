import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, TrendingUp, Clock, Filter } from 'lucide-react'
import api from '../api/client'
import useDebounce from '../hooks/useDebounce'
import dayjs from 'dayjs'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortBy, setSortBy] = useState('relevance')

  const debouncedQuery = useDebounce(query, 300)

  const handleSearch = useCallback(async (pageNum = 1, reset = false) => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setTotal(0)
      setHasMore(false)
      return
    }

    setLoading(true)
    try {
      const response = await api.get('/search', {
        params: {
          q: debouncedQuery,
          page: pageNum,
          page_size: 20,
          sort_by: sortBy,
        },
      })
      const { items, total: totalCount, has_next } = response.data
      if (reset) {
        setResults(items)
      } else {
        setResults((prev) => [...prev, ...items])
      }
      setTotal(totalCount)
      setHasMore(has_next)
      setPage(pageNum)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, sortBy])

  const fetchSuggestions = useCallback(async () => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      return
    }
    try {
      const response = await api.get('/search/suggest', {
        params: { q: query, limit: 10 },
      })
      setSuggestions(response.data.items)
    } catch (error) {
      console.error('Suggestions failed:', error)
    }
  }, [query])

  useEffect(() => {
    if (debouncedQuery) {
      handleSearch(1, true)
      setSearchParams({ q: debouncedQuery })
    }
  }, [debouncedQuery, sortBy])

  useEffect(() => {
    if (showSuggestions) {
      fetchSuggestions()
    }
  }, [query, showSuggestions, fetchSuggestions])

  const handleInputChange = (e) => {
    setQuery(e.target.value)
    setShowSuggestions(true)
  }

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'article') {
      window.location.href = `/article/${suggestion.id}`
    } else if (suggestion.type === 'source') {
      setQuery(suggestion.title)
    } else if (suggestion.type === 'tag') {
      setQuery(suggestion.title)
    }
    setShowSuggestions(false)
  }

  const loadMore = () => {
    if (hasMore && !loading) {
      handleSearch(page + 1, false)
    }
  }

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>搜索</h1>
        <div className="search-input-wrapper">
          <div className="search-input-box">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="搜索文章、订阅源、标签..."
              className="search-input"
            />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.id || suggestion.title}-${index}`}
                  className="suggestion-item"
                  onMouseDown={() => handleSuggestionClick(suggestion)}
                >
                  <span className={`suggestion-type type-${suggestion.type}`}>
                    {suggestion.type === 'article' ? '文章' : suggestion.type === 'source' ? '源' : '标签'}
                  </span>
                  <span className="suggestion-title">{suggestion.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {query && (
        <div className="search-results-header">
          <div className="results-info">
            找到 <strong>{total}</strong> 条相关结果
          </div>
          <div className="sort-tabs">
            <button
              className={`sort-tab ${sortBy === 'relevance' ? 'active' : ''}`}
              onClick={() => setSortBy('relevance')}
            >
              <Filter size={16} />
              相关度
            </button>
            <button
              className={`sort-tab ${sortBy === 'published_at' ? 'active' : ''}`}
              onClick={() => setSortBy('published_at')}
            >
              <Clock size={16} />
              最新
            </button>
          </div>
        </div>
      )}

      {loading && results.length === 0 && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div className="empty-state">
          <Search size={48} className="empty-state-icon" />
          <p>没有找到相关结果</p>
          <p className="text-sm text-secondary">试试其他关键词吧</p>
        </div>
      )}

      {!query && (
        <div className="search-placeholder">
          <Search size={64} className="placeholder-icon" />
          <h2>搜索你感兴趣的内容</h2>
          <p>在搜索框输入关键词，查找文章、订阅源和标签</p>
        </div>
      )}

      <div className="search-results">
        {results.map((article) => (
          <Link
            key={article.id}
            to={`/article/${article.id}`}
            className="result-item card"
          >
            <div className="result-header">
              <span className="result-source">{article.source_name}</span>
              <span className="result-date">
                {dayjs(article.published_at).fromNow()}
              </span>
            </div>
            <h3 className="result-title" dangerouslySetInnerHTML={{ __html: article.title }} />
            {article.highlight && (
              <p
                className="result-summary"
                dangerouslySetInnerHTML={{ __html: article.highlight }}
              />
            )}
            {!article.highlight && article.summary && (
              <p className="result-summary">{article.summary}</p>
            )}
          </Link>
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
        .search-page {
          max-width: 800px;
          margin: 0 auto;
        }
        .search-header {
          margin-bottom: 24px;
        }
        .search-header h1 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 16px;
        }
        .search-input-wrapper {
          position: relative;
        }
        .search-input-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          border: 2px solid var(--border-color);
          border-radius: 10px;
          padding: 0 16px;
          transition: all 0.2s;
        }
        .search-input-box:focus-within {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .search-icon {
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .search-input {
          flex: 1;
          padding: 14px 0;
          border: none;
          outline: none;
          font-size: 16px;
          background: transparent;
        }
        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: var(--shadow-lg);
          z-index: 100;
          overflow: hidden;
        }
        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 16px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s;
        }
        .suggestion-item:hover {
          background: var(--bg-color);
        }
        .suggestion-type {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
          text-transform: uppercase;
        }
        .type-article {
          background: #e0e7ff;
          color: #4338ca;
        }
        .type-source {
          background: #dcfce7;
          color: #166534;
        }
        .type-tag {
          background: #fef3c7;
          color: #92400e;
        }
        .suggestion-title {
          font-size: 14px;
          color: var(--text-primary);
        }
        .search-results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .results-info {
          font-size: 14px;
          color: var(--text-secondary);
        }
        .results-info strong {
          color: var(--text-primary);
          font-weight: 600;
        }
        .sort-tabs {
          display: flex;
          gap: 4px;
          background: var(--bg-color);
          border-radius: 6px;
          padding: 2px;
        }
        .sort-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
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
        .search-results {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .result-item {
          padding: 16px;
          display: block;
          transition: all 0.2s;
        }
        .result-item:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }
        .result-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .result-source {
          font-size: 12px;
          font-weight: 500;
          color: var(--primary-color);
          background: #eff6ff;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .result-date {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .result-title {
          font-size: 16px;
          font-weight: 600;
          line-height: 1.5;
          margin-bottom: 6px;
          color: var(--text-primary);
        }
        .result-title :global(mark) {
          background: #fef08a;
          color: inherit;
          padding: 0 2px;
          border-radius: 2px;
        }
        .result-summary {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .result-summary :global(mark) {
          background: #fef08a;
          color: inherit;
          padding: 0 2px;
          border-radius: 2px;
        }
        .load-more {
          display: flex;
          justify-content: center;
          margin-top: 24px;
        }
        .search-placeholder {
          text-align: center;
          padding: 80px 20px;
        }
        .placeholder-icon {
          color: var(--text-secondary);
          opacity: 0.3;
          margin-bottom: 16px;
        }
        .search-placeholder h2 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .search-placeholder p {
          color: var(--text-secondary);
          font-size: 14px;
        }
      `}</style>
    </div>
  )
}
