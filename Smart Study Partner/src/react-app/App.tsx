import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@getmocha/users-service/react";
import HomePage from "@/react-app/pages/Home";
import WelcomePage from "@/react-app/pages/Welcome";
import MatchesPage from "@/react-app/pages/Matches";
import ChatPage from "@/react-app/pages/Chat";
import ProgressPage from "@/react-app/pages/Progress";
import AuthCallbackPage from "@/react-app/pages/AuthCallback";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:partnerId" element={<ChatPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
