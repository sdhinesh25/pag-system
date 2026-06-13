import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './pages/Dashboard'
import AccountInventory from './pages/AccountInventory'
import AccountDetail from './pages/AccountDetail'
import Workflows from './pages/Workflows'
import AuditLog from './pages/AuditLog'

function AppRoutes() {
  // Re-mount on route change so each page gets its entrance animation.
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="animate-fade-in">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accounts" element={<AccountInventory />} />
        <Route path="/accounts/:id" element={<AccountDetail />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/audit" element={<AuditLog />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-canvas text-strong">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-auto px-6 py-6">
            <AppRoutes />
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
