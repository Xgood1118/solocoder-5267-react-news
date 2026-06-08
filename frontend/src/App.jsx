import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import FeedPage from './pages/FeedPage'
import ArticlePage from './pages/ArticlePage'
import SearchPage from './pages/SearchPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FavoritesPage from './pages/FavoritesPage'
import ReadLaterPage from './pages/ReadLaterPage'
import SourcesPage from './pages/SourcesPage'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <style jsx>{`
          .loading-page {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <Routes>
            <Route path="/" element={<FeedPage />} />
            <Route path="/article/:id" element={<ArticlePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/read-later" element={<ReadLaterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
