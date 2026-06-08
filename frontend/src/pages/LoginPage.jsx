import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      setError('请填写用户名和密码')
      return
    }

    setError('')
    setLoading(true)

    try {
      await login(username, password)
      navigate(from, { replace: true })
    } catch (error) {
      setError(error.response?.data?.detail || '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <LogIn size={40} className="auth-icon" />
          <h1>欢迎回来</h1>
          <p>登录您的账号继续阅读</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="auth-footer">
          还没有账号？
          <Link to="/register">立即注册</Link>
        </div>
      </div>

      <style jsx>{`
        .auth-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: calc(100vh - 120px);
          padding: 40px 20px;
        }
        .auth-card {
          width: 100%;
          max-width: 400px;
          background: white;
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
          padding: 40px;
        }
        .auth-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .auth-icon {
          color: var(--primary-color);
          margin-bottom: 12px;
        }
        .auth-header h1 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .auth-header p {
          color: var(--text-secondary);
          font-size: 14px;
        }
        .auth-form {
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
        .btn-block {
          width: 100%;
          padding: 10px;
          font-size: 15px;
        }
        .auth-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: var(--text-secondary);
        }
        .auth-footer a {
          color: var(--primary-color);
          font-weight: 500;
          margin-left: 4px;
        }
      `}</style>
    </div>
  )
}
