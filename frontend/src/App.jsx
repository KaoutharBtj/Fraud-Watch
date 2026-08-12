import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import DashboardLayout from './pages/DashboardLayout'
import Overview from './pages/Overview'
import Transactions from './pages/Transactions'
import TransactionDetail from './pages/TransactionDetail'
import Customer from './pages/Customer'
import Decisions from './pages/Decisions'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="transactions/:auditId" element={<TransactionDetail />} />
            <Route path="customers/:customerId" element={<Customer />} />
            <Route path="decisions" element={<Decisions />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}