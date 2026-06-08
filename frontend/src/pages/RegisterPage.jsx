import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username || !email || !password || !confirmPassword) {
      setError('请填写所有字段')
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码至少 6 个字符')
      return
    }

    setLoading(true)

    try {
      await register(username, email, password)
      navigate('/login', { state: { message: '注册成功，请登录' } })
    } catch (error) {
      setError(error.response?.data?.detail || '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <UserPlus size={40} className="auth-icon" />
          <h1>创建账号</h1>
          <p>加入我们，开始聚合阅读之旅</p>
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
            <label>邮箱</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
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

          <div className="form-group">
            <label>确认密码</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="auth-footer">
          已有账号？
          <Link to="/login">立即登录</Link>
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
