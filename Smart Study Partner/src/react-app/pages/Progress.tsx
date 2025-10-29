import { useState, useEffect } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router";
import { TrendingUp, BookOpen, Users, Calendar, Plus } from "lucide-react";
import type { StudySession } from "@/shared/types";

export default function Progress() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddSession, setShowAddSession] = useState(false);
  const [newSession, setNewSession] = useState({
    subject: "",
    duration_minutes: 60,
    notes: "",
    partner_id: "",
  });

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/");
      return;
    }

    if (user) {
      fetchSessions();
    }
  }, [user, isPending, navigate]);

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/sessions");
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      });

      if (response.ok) {
        setShowAddSession(false);
        setNewSession({ subject: "", duration_minutes: 60, notes: "", partner_id: "" });
        fetchSessions();
      }
    } catch (error) {
      console.error("Error adding session:", error);
    }
  };

  const totalSessions = sessions.length;
  const totalHours = sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0) / 60;
  const subjectCounts = sessions.reduce((acc, session) => {
    acc[session.subject] = (acc[session.subject] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-25 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-3 rounded-full">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent mb-2">
              Your Study Progress
            </h1>
            <p className="text-gray-600 text-lg">
              Track your study sessions and celebrate your achievements
            </p>
          </div>

          {/* Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-full p-2 shadow-lg border border-pink-100">
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate("/matches")}
                  className="px-4 py-2 text-gray-600 hover:bg-pink-50 rounded-full font-medium transition-colors"
                >
                  Matches
                </button>
                <button
                  onClick={() => navigate("/chat")}
                  className="px-4 py-2 text-gray-600 hover:bg-pink-50 rounded-full font-medium transition-colors"
                >
                  Chat
                </button>
                <button
                  onClick={() => navigate("/progress")}
                  className="px-4 py-2 bg-pink-500 text-white rounded-full font-medium"
                >
                  Progress
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-pink-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Sessions</p>
                  <p className="text-3xl font-bold text-gray-800">{totalSessions}</p>
                </div>
                <div className="bg-pink-100 p-3 rounded-full">
                  <BookOpen className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 border border-pink-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Study Hours</p>
                  <p className="text-3xl font-bold text-gray-800">{totalHours.toFixed(1)}</p>
                </div>
                <div className="bg-pink-100 p-3 rounded-full">
                  <Calendar className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 border border-pink-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Study Partners</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {new Set(sessions.filter(s => s.partner_id).map(s => s.partner_id)).size}
                  </p>
                </div>
                <div className="bg-pink-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Add Session Button */}
          <div className="mb-8">
            <button
              onClick={() => setShowAddSession(true)}
              className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Log Study Session
            </button>
          </div>

          {/* Add Session Modal */}
          {showAddSession && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Log Study Session</h3>
                <form onSubmit={addSession} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={newSession.subject}
                      onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g., Math, Science, History"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={newSession.duration_minutes}
                      onChange={(e) => setNewSession({ ...newSession, duration_minutes: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      value={newSession.notes}
                      onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="What did you study? Any achievements?"
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddSession(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                    >
                      Save Session
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Subject Breakdown */}
          {Object.keys(subjectCounts).length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-pink-100 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Study Subjects</h3>
              <div className="space-y-3">
                {Object.entries(subjectCounts).map(([subject, count]) => (
                  <div key={subject} className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">{subject}</span>
                    <div className="flex items-center space-x-2">
                      <div className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm">
                        {count} sessions
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-pink-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Study Sessions</h3>
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-pink-300 mx-auto mb-3" />
                <p className="text-gray-500">No study sessions logged yet</p>
                <p className="text-sm text-gray-400">Start tracking your progress!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 10).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-pink-50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-gray-800">{session.subject}</h4>
                      {(session as any).partner_name && (
                        <p className="text-sm text-gray-600">
                          With {(session as any).partner_name}
                        </p>
                      )}
                      {session.notes && (
                        <p className="text-sm text-gray-500">{session.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {session.duration_minutes} min
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
