import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Rss, Globe, Check, X, Trash2 } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import SourceBadge from '../components/SourceBadge'

export default function SourcesPage() {
  const [sources, setSources] = useState([])
  const [mySubscriptions, setMySubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    feed_type: 'rss',
    description: '',
    custom_selector: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchSources()
    fetchMySubscriptions()
  }, [user])

  const fetchSources = async () => {
    try {
      const response = await api.get('/sources', { params: { limit: 50 } })
      setSources(response.data)
    } catch (error) {
      console.error('Failed to fetch sources:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMySubscriptions = async () => {
    try {
      const response = await api.get('/sources/subscriptions/mine')
      setMySubscriptions(response.data)
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
    }
  }

  const subscribedIds = new Set(mySubscriptions.map((s) => s.source_id))

  const handleSubscribe = async (sourceId) => {
    try {
      await api.post(`/sources/${sourceId}/subscribe`)
      fetchMySubscriptions()
    } catch (error) {
      console.error('Failed to subscribe:', error)
    }
  }

  const handleUnsubscribe = async (sourceId) => {
    try {
      await api.delete(`/sources/${sourceId}/subscribe`)
      fetchMySubscriptions()
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
    }
  }

  const handleAddSource = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await api.post('/sources', newSource)
      setShowAddModal(false)
      setNewSource({ name: '', url: '', feed_type: 'rss', description: '', custom_selector: '' })
      fetchSources()
      fetchMySubscriptions()
    } catch (error) {
      setError(error.response?.data?.detail || '添加失败，请检查输入')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredSources = sources.filter((source) =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="sources-page">
      <div className="page-header">
        <div>
          <h1>订阅源管理</h1>
          <p className="text-secondary text-sm">发现和管理你的信息来源</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          添加订阅源
        </button>
      </div>

      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="搜索订阅源..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {mySubscriptions.length > 0 && (
        <section className="section">
          <h2>我的订阅 ({mySubscriptions.length})</h2>
          <div className="sources-grid">
            {mySubscriptions.map((sub) => (
              <div key={sub.id} className="source-card card">
                <div className="source-card-header">
                  <SourceBadge source={sub.source} />
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleUnsubscribe(sub.source_id)}
                  >
                    <Check size={14} />
                    已订阅
                  </button>
                </div>
                <p className="source-desc">{sub.source?.description || '暂无描述'}</p>
                <div className="source-meta">
                  <span className="text-xs text-secondary">
                    {sub.source?.feed_type?.toUpperCase()}
                  </span>
                  <span className="text-xs text-secondary">
                    {sub.source?.subscriber_count || 0} 人订阅
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2>全部订阅源</h2>
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="sources-grid">
            {filteredSources.map((source) => (
              <div key={source.id} className="source-card card">
                <div className="source-card-header">
                  <SourceBadge source={source} />
                  {subscribedIds.has(source.id) ? (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleUnsubscribe(source.id)}
                    >
                      <Check size={14} />
                      已订阅
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSubscribe(source.id)}
                    >
                      <Plus size={14} />
                      订阅
                    </button>
                  )}
                </div>
                <p className="source-desc">{source.description || '暂无描述'}</p>
                <div className="source-meta">
                  <span className="text-xs text-secondary">
                    {source.feed_type?.toUpperCase()}
                  </span>
                  <span className="text-xs text-secondary">
                    {source.subscriber_count || 0} 人订阅
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredSources.length === 0 && (
          <div className="empty-state">
            <Rss size={48} className="empty-state-icon" />
            <p>没有找到匹配的订阅源</p>
          </div>
        )}
      </section>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加订阅源</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSource} className="modal-body">
              {error && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label>名称 *</label>
                <input
                  type="text"
                  className="input"
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  placeholder="订阅源名称"
                  required
                />
              </div>

              <div className="form-group">
                <label>Feed URL *</label>
                <input
                  type="url"
                  className="input"
                  value={newSource.url}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  placeholder="https://example.com/feed.xml"
                  required
                />
              </div>

              <div className="form-group">
                <label>类型</label>
                <select
                  className="input"
                  value={newSource.feed_type}
                  onChange={(e) => setNewSource({ ...newSource, feed_type: e.target.value })}
                >
                  <option value="rss">RSS</option>
                  <option value="atom">Atom</option>
                  <option value="json">JSON Feed</option>
                  <option value="custom">自定义</option>
                </select>
              </div>

              <div className="form-group">
                <label>描述</label>
                <textarea
                  className="input"
                  value={newSource.description}
                  onChange={(e) => setNewSource({ ...newSource, description: e.target.value })}
                  placeholder="订阅源描述"
                  rows={2}
                />
              </div>

              {newSource.feed_type === 'custom' && (
                <div className="form-group">
                  <label>自定义选择器 (CSS)</label>
                  <input
                    type="text"
                    className="input"
                    value={newSource.custom_selector}
                    onChange={(e) => setNewSource({ ...newSource, custom_selector: e.target.value })}
                    placeholder=".article-content"
                  />
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '添加中...' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .sources-page {
          max-width: 1000px;
          margin: 0 auto;
        }
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .page-header h1 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0 14px;
          margin-bottom: 24px;
        }
        .search-bar:focus-within {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .search-icon {
          color: var(--text-secondary);
        }
        .search-input {
          flex: 1;
          padding: 10px 0;
          border: none;
          outline: none;
          font-size: 14px;
          background: transparent;
        }
        .section {
          margin-bottom: 32px;
        }
        .section h2 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .sources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .source-card {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .source-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .source-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .source-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          border-bottom: 1px solid var(--border-color);
        }
        .modal-header h3 {
          font-size: 18px;
          font-weight: 600;
        }
        .close-btn {
          padding: 4px;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--text-secondary);
          border-radius: 4px;
        }
        .close-btn:hover {
          background: var(--bg-color);
        }
        .modal-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .error-message {
          background: #fef2f2;
          color: var(--danger-color);
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 13px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 8px;
        }
      `}</style>
    </div>
  )
}
