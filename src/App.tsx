import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import AccountInventory from './pages/AccountInventory'
import AccessReview from './pages/AccessReview'
import AuditLog from './pages/AuditLog'
import ComplianceSummary from './pages/ComplianceSummary'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/accounts" />} />
            <Route path="/accounts" element={<AccountInventory />} />
            <Route path="/reviews" element={<AccessReview />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/compliance" element={<ComplianceSummary />} />
            <Route path="*" element={<Navigate to="/accounts" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
