import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Home,
  Search,
  Bookmark,
  Clock,
  Settings,
  User,
  Bell,
  LogOut,
  Newspaper,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/', icon: Home, label: '首页' },
    { to: '/search', icon: Search, label: '搜索' },
    { to: '/favorites', icon: Bookmark, label: '收藏' },
    { to: '/read-later', icon: Clock, label: '稍后读' },
  ]

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="logo">
            <Newspaper size={24} />
            <span>新闻聚合器</span>
          </Link>

          <nav className="nav-links">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end={item.to === '/'}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="nav-right">
            {user ? (
              <div className="user-menu">
                <button className="btn-ghost btn-sm">
                  <Bell size={18} />
                </button>
                <Link to="/profile" className="btn-ghost btn-sm">
                  <User size={18} />
                </Link>
                <Link to="/settings" className="btn-ghost btn-sm">
                  <Settings size={18} />
                </Link>
                <button onClick={handleLogout} className="btn-ghost btn-sm" title="退出">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-outline btn-sm">登录</Link>
                <Link to="/register" className="btn btn-primary btn-sm">注册</Link>
              </div>
            )}
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          <div className="container">
            <nav className="mobile-nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              {user && (
                <>
                  <NavLink to="/profile" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                    <User size={18} />
                    <span>个人中心</span>
                  </NavLink>
                  <NavLink to="/settings" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                    <Settings size={18} />
                    <span>设置</span>
                  </NavLink>
                  <button className="nav-link" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>退出登录</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}

      <style jsx>{`
        .navbar {
          background: white;
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .navbar-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 60px;
          gap: 20px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 700;
          color: var(--primary-color);
        }
        .nav-links {
          display: flex;
          gap: 4px;
          flex: 1;
          margin-left: 20px;
        }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .user-menu {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .auth-buttons {
          display: flex;
          gap: 8px;
        }
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
        }
        .mobile-menu {
          border-top: 1px solid var(--border-color);
          padding: 12px 0;
        }
        .mobile-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
          .nav-right {
            display: none;
          }
          .mobile-menu-btn {
            display: block;
          }
        }
      `}</style>
    </header>
  )
}
