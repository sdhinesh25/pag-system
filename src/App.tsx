import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import AccountInventory from './pages/AccountInventory'
import AccountDetail from './pages/AccountDetail'
import Workflows from './pages/Workflows'
import AuditLog from './pages/AuditLog'
import Login from './pages/Login'
import { AuthProvider, useAuth } from './auth/AuthProvider'

// App chrome + auth gate. Unauthenticated users are redirected to /login.
function ProtectedShell() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace state={{ from: location }} />

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-strong">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto px-6 py-6">
          {/* Re-mount on route change so each page gets its entrance animation. */}
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedShell />}>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<AccountInventory />} />
            <Route path="/accounts/:id" element={<AccountDetail />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
