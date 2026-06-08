import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  Bookmark,
  Clock,
  BookOpen,
  Bell,
  Rss,
  ChevronRight,
  Settings,
  LogOut
} from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const [stats, setStats] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchStats()
    fetchNotifications()
  }, [user])

  const fetchStats = async () => {
    try {
      const response = await api.get('/user/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/user/notifications', {
        params: { page_size: 5 },
      })
      setNotifications(response.data.items)
      setUnreadCount(response.data.unread_count)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const statItems = [
    { label: '订阅源', value: stats?.subscription_count || 0, icon: Rss, path: '/sources' },
    { label: '收藏文章', value: stats?.favorite_count || 0, icon: Bookmark, path: '/favorites' },
    { label: '稍后读', value: stats?.read_later_count || 0, icon: Clock, path: '/read-later' },
    { label: '已阅读', value: stats?.read_count || 0, icon: BookOpen, path: '/user/history' },
  ]

  return (
    <div className="profile-page">
      <div className="profile-header card">
        <div className="avatar">
          {user?.username?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="user-info">
          <h1>{user?.username}</h1>
          <p className="email">{user?.email}</p>
          <p className="join-date">
            加入于 {new Date(user?.created_at).toLocaleDateString('zh-CN')}
          </p>
        </div>
        <div className="profile-actions">
          <Link to="/settings" className="btn btn-outline btn-sm">
            <Settings size={16} />
            设置
          </Link>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            <LogOut size={16} />
            退出
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {statItems.map((item) => (
          <Link key={item.label} to={item.path} className="stat-card card">
            <div className="stat-icon">
              <item.icon size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{item.value}</span>
              <span className="stat-label">{item.label}</span>
            </div>
            <ChevronRight size={20} className="chevron" />
          </Link>
        ))}
      </div>

      <div className="notifications-section card">
        <div className="section-header">
          <h2>
            <Bell size={20} />
            最近通知
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </h2>
          <button className="text-link text-sm" onClick={fetchNotifications}>
            查看全部
          </button>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-notifications">
            <Bell size={32} />
            <p>暂无通知</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
              >
                <div className={`notif-type type-${notif.type}`}>
                  {notif.type === 'article_new' && <Rss size={16} />}
                  {notif.type === 'system' && <Bell size={16} />}
                  {notif.type === 'comment' && <BookOpen size={16} />}
                </div>
                <div className="notif-content">
                  <h4>{notif.title}</h4>
                  {notif.content && <p>{notif.content}</p>}
                  <span className="notif-time">
                    {new Date(notif.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .profile-page {
          max-width: 800px;
          margin: 0 auto;
        }
        .profile-header {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .user-info {
          flex: 1;
        }
        .user-info h1 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .email {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .join-date {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .profile-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: #eff6ff;
          color: var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-content {
          flex: 1;
        }
        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.2;
        }
        .stat-label {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .chevron {
          color: var(--text-secondary);
        }
        .notifications-section {
          padding: 20px;
        }
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .section-header h2 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
        }
        .badge {
          background: var(--danger-color);
          color: white;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
        }
        .text-link {
          color: var(--primary-color);
          background: none;
          border: none;
          cursor: pointer;
        }
        .empty-notifications {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-secondary);
        }
        .empty-notifications p {
          margin-top: 8px;
          font-size: 14px;
        }
        .notification-list {
          display: flex;
          flex-direction: column;
        }
        .notification-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .notification-item:hover {
          background: var(--bg-color);
        }
        .notification-item.unread {
          background: #eff6ff;
        }
        .notif-type {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .type-article_new {
          background: #dcfce7;
          color: #166534;
        }
        .type-system {
          background: #e0e7ff;
          color: #4338ca;
        }
        .type-comment {
          background: #fef3c7;
          color: #92400e;
        }
        .notif-content {
          flex: 1;
          min-width: 0;
        }
        .notif-content h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .notif-content p {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .notif-time {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 4px;
          display: block;
        }
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .profile-header {
            flex-direction: column;
            text-align: center;
          }
          .profile-actions {
            flex-direction: row;
          }
        }
      `}</style>
    </div>
  )
}
