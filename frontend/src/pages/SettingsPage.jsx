import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, User, Bell, Shield, Save } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(true)
  const [digestEnabled, setDigestEnabled] = useState(true)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user])

  const tabs = [
    { id: 'profile', label: '个人资料', icon: User },
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'security', label: '账号安全', icon: Shield },
  ]

  const handleSaveNotifications = async () => {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setMessage('通知设置已保存')
    } catch (err) {
      setError('保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('请填写所有字段')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }

    if (newPassword.length < 6) {
      setError('新密码至少 6 个字符')
      return
    }

    setSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setMessage('密码修改成功')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError('修改失败，请检查原密码是否正确')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = () => {
    if (confirm('确定要注销账号吗？此操作不可恢复。')) {
      logout()
      navigate('/')
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>
          <Settings size={24} />
          设置
        </h1>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="settings-content card">
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          {activeTab === 'profile' && (
            <div className="tab-content">
              <h2>个人资料</h2>
              <div className="form-section">
                <div className="form-group">
                  <label>用户名</label>
                  <input
                    type="text"
                    className="input"
                    value={user?.username || ''}
                    disabled
                  />
                  <p className="hint">用户名不可修改</p>
                </div>

                <div className="form-group">
                  <label>邮箱</label>
                  <input
                    type="email"
                    className="input"
                    value={user?.email || ''}
                    disabled
                  />
                  <p className="hint">邮箱不可修改</p>
                </div>

                <div className="form-group">
                  <label>注册时间</label>
                  <input
                    type="text"
                    className="input"
                    value={user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : ''}
                    disabled
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="tab-content">
              <h2>通知设置</h2>
              <div className="form-section">
                <div className="toggle-item">
                  <div className="toggle-info">
                    <h4>邮件通知</h4>
                    <p>接收重要更新的邮件提醒</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={emailEnabled}
                      onChange={(e) => setEmailEnabled(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-info">
                    <h4>站内推送</h4>
                    <p>接收站内实时通知</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={pushEnabled}
                      onChange={(e) => setPushEnabled(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-info">
                    <h4>每日摘要</h4>
                    <p>每日发送文章摘要邮件</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={digestEnabled}
                      onChange={(e) => setDigestEnabled(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleSaveNotifications}
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? '保存中...' : '保存设置'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="tab-content">
              <h2>修改密码</h2>
              <form onSubmit={handleChangePassword} className="form-section">
                <div className="form-group">
                  <label>当前密码</label>
                  <input
                    type="password"
                    className="input"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="请输入当前密码"
                  />
                </div>

                <div className="form-group">
                  <label>新密码</label>
                  <input
                    type="password"
                    className="input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="请输入新密码"
                  />
                </div>

                <div className="form-group">
                  <label>确认新密码</label>
                  <input
                    type="password"
                    className="input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入新密码"
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '修改中...' : '修改密码'}
                </button>
              </form>

              <div className="danger-section">
                <h3>危险操作</h3>
                <div className="danger-item">
                  <div>
                    <h4>注销账号</h4>
                    <p>注销后您的所有数据将被清除，且无法恢复</p>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={handleDeleteAccount}>
                    注销账号
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .settings-page {
          max-width: 900px;
          margin: 0 auto;
        }
        .settings-header {
          margin-bottom: 24px;
        }
        .settings-header h1 {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 22px;
          font-weight: 700;
        }
        .settings-layout {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 24px;
        }
        .settings-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border: none;
          background: none;
          text-align: left;
          border-radius: 8px;
          font-size: 14px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .nav-item:hover {
          background: white;
          color: var(--text-primary);
        }
        .nav-item.active {
          background: white;
          color: var(--primary-color);
          font-weight: 500;
          box-shadow: var(--shadow-sm);
        }
        .settings-content {
          padding: 24px;
        }
        .tab-content h2 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .form-section {
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
        .hint {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        .success-message {
          background: #f0fdf4;
          color: #166534;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 14px;
          margin-bottom: 16px;
        }
        .error-message {
          background: #fef2f2;
          color: var(--danger-color);
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 14px;
          margin-bottom: 16px;
        }
        .toggle-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: var(--bg-color);
          border-radius: 8px;
        }
        .toggle-info h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .toggle-info p {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: 0.3s;
          border-radius: 26px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: var(--primary-color);
        }
        input:checked + .slider:before {
          transform: translateX(22px);
        }
        .danger-section {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--border-color);
        }
        .danger-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--danger-color);
          margin-bottom: 16px;
        }
        .danger-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: #fef2f2;
          border-radius: 8px;
        }
        .danger-item h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .danger-item p {
          font-size: 13px;
          color: var(--text-secondary);
        }
        @media (max-width: 768px) {
          .settings-layout {
            grid-template-columns: 1fr;
          }
          .settings-nav {
            flex-direction: row;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  )
}
