import { useEffect } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router";
import { Users, Sparkles, BookOpen, MessageCircle, TrendingUp } from "lucide-react";

export default function Home() {
  const { user, isPending, redirectToLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && user) {
      // Check if user has a profile
      checkProfile();
    }
  }, [user, isPending, navigate]);

  const checkProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          navigate("/matches");
        } else {
          navigate("/welcome");
        }
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-25 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-4 rounded-2xl shadow-2xl">
              <Users className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent mb-6">
            Smart Study Partner
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            Find your perfect study partner with AI-powered matching. 
            Connect with students who share your interests and study goals.
          </p>

          <button
            onClick={redirectToLogin}
            className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
          >
            <Sparkles className="w-6 h-6 inline mr-2" />
            Get Started for Free
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
            How Smart Study Partner Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-pink-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-pink-100 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">AI-Powered Matching</h3>
              <p className="text-gray-600 leading-relaxed">
                Our advanced AI analyzes your age, grade, and favorite subjects to find the most compatible study partners who share your learning goals.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-pink-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-pink-100 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Easy Communication</h3>
              <p className="text-gray-600 leading-relaxed">
                Chat with your study partners to plan sessions, share notes, and collaborate on projects. Built-in messaging makes coordination simple.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-pink-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-pink-100 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Track Progress</h3>
              <p className="text-gray-600 leading-relaxed">
                Monitor your study sessions, track your progress, and celebrate achievements with detailed analytics and insights.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
              Why Study Partners Matter
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-pink-500 rounded-full w-2 h-2 mt-2 flex-shrink-0"></div>
                  <p className="text-gray-600">
                    <span className="font-semibold">Stay Motivated:</span> Study with peers who share your goals and keep you accountable.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-pink-500 rounded-full w-2 h-2 mt-2 flex-shrink-0"></div>
                  <p className="text-gray-600">
                    <span className="font-semibold">Learn Better:</span> Explain concepts to others and gain new perspectives on challenging topics.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-pink-500 rounded-full w-2 h-2 mt-2 flex-shrink-0"></div>
                  <p className="text-gray-600">
                    <span className="font-semibold">Build Confidence:</span> Practice presentations and discussions in a supportive environment.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-pink-500 rounded-full w-2 h-2 mt-2 flex-shrink-0"></div>
                  <p className="text-gray-600">
                    <span className="font-semibold">Make Friends:</span> Connect with like-minded students and build lasting friendships.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-pink-500 rounded-full w-2 h-2 mt-2 flex-shrink-0"></div>
                  <p className="text-gray-600">
                    <span className="font-semibold">Save Time:</span> Share resources, divide research tasks, and study more efficiently together.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-pink-500 rounded-full w-2 h-2 mt-2 flex-shrink-0"></div>
                  <p className="text-gray-600">
                    <span className="font-semibold">Have Fun:</span> Make studying enjoyable with games, competitions, and social interaction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-pink-500 to-pink-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Find Your Study Partner?
            </h2>
            <p className="text-xl text-pink-100 mb-8">
              Join thousands of students who are already studying smarter, not harder.
            </p>
            <button
              onClick={redirectToLogin}
              className="bg-white text-pink-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-pink-50 focus:outline-none focus:ring-4 focus:ring-white focus:ring-offset-2 focus:ring-offset-pink-600 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
            >
              <BookOpen className="w-6 h-6 inline mr-2" />
              Start Studying Together
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white py-8 border-t border-pink-100">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            © 2025 Smart Study Partner. Making studying social and effective.
          </p>
        </div>
      </div>
    </div>
  );
}
