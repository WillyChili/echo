import { Routes, Route, Navigate } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import TodayPage from './pages/TodayPage.jsx';
import ChatPage from './pages/ChatPage.jsx';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-950">
      <Nav />
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
