import { BrowserRouter, Route, Routes } from 'react-router'
import AdminPage from './pages/AdminPage.tsx'
import BookingPage from './pages/BookingPage.tsx'
import HomePage from './pages/HomePage.tsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
