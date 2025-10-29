import { useState, useEffect } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router";
import { Users, MessageCircle, Sparkles, Star, BookOpen } from "lucide-react";
import type { MatchWithProfile } from "@/shared/types";

export default function Matches() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/");
      return;
    }

    if (user) {
      fetchMatches();
    }
  }, [user, isPending, navigate]);

  const fetchMatches = async () => {
    try {
      const response = await fetch("/api/matches");
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startChat = (partnerId: string) => {
    navigate(`/chat/${partnerId}`);
  };

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-pink-600 font-medium">Finding your perfect study partners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-25 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-3 rounded-full">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent mb-2">
              Your AI-Matched Study Partners
            </h1>
            <p className="text-gray-600 text-lg">
              We found these perfect study partners based on your interests and goals
            </p>
          </div>

          {/* Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-full p-2 shadow-lg border border-pink-100">
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate("/matches")}
                  className="px-4 py-2 bg-pink-500 text-white rounded-full font-medium"
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
                  className="px-4 py-2 text-gray-600 hover:bg-pink-50 rounded-full font-medium transition-colors"
                >
                  Progress
                </button>
              </div>
            </div>
          </div>

          {/* Matches */}
          {matches.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-pink-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No matches yet</h3>
              <p className="text-gray-500">
                Complete your profile to find study partners who share your interests!
              </p>
              <button
                onClick={() => navigate("/welcome")}
                className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
              >
                Update Profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                <div
                  key={match.matched_user_id}
                  className="bg-white rounded-2xl shadow-xl p-6 border border-pink-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Match Score */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-bold text-gray-800">
                        {Math.round(match.compatibility_score * 100)}% Match
                      </span>
                    </div>
                    <div className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-sm font-medium">
                      Perfect Fit
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {match.matched_profile.name}
                    </h3>
                    <p className="text-gray-600">
                      {match.matched_profile.age} years old • {match.matched_profile.grade}
                    </p>
                  </div>

                  {/* Subjects */}
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <BookOpen className="w-4 h-4 text-pink-500 mr-2" />
                      <span className="text-sm font-semibold text-gray-700">Favorite Subjects</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {match.matched_profile.favorite_subjects.split(',').map((subject, index) => (
                        <span
                          key={index}
                          className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-medium"
                        >
                          {subject.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Match Reason */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 italic">
                      "{match.match_reason}"
                    </p>
                  </div>

                  {/* Bio */}
                  {match.matched_profile.bio && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-600">
                        {match.matched_profile.bio}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => startChat(match.matched_user_id)}
                    className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <MessageCircle className="w-4 h-4 inline mr-2" />
                    Start Chatting
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Refresh Button */}
          <div className="text-center mt-8">
            <button
              onClick={fetchMatches}
              className="px-6 py-3 bg-white text-pink-600 border border-pink-200 rounded-xl font-semibold hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Find New Matches
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
