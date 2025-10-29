import { useState, useEffect, useRef } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigate, useParams } from "react-router";
import { Send, ArrowLeft, Users } from "lucide-react";
import type { ChatMessage, ChatConversation, UserProfile } from "@/shared/types";

export default function Chat() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const { partnerId } = useParams();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPartner, setCurrentPartner] = useState<UserProfile | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/");
      return;
    }

    if (user) {
      fetchConversations();
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    if (partnerId && conversations.length > 0) {
      const partner = conversations.find(c => c.partner.user_id === partnerId)?.partner;
      if (partner) {
        setCurrentPartner(partner);
        fetchMessages(partnerId);
      }
    }
  }, [partnerId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    try {
      const response = await fetch(`/api/messages/${partnerId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentPartner || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: currentPartner.user_id,
          message: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage("");
        fetchMessages(currentPartner.user_id);
        fetchConversations(); // Refresh conversations to update last message
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

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
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent mb-2">
              Study Partner Chat
            </h1>
            <p className="text-gray-600 text-lg">
              Connect with your study partners and plan your sessions
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
                  className="px-4 py-2 bg-pink-500 text-white rounded-full font-medium"
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

          <div className="bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden">
            <div className="flex h-[600px]">
              {/* Conversations List */}
              <div className="w-1/3 border-r border-pink-100">
                <div className="p-4 bg-pink-50 border-b border-pink-100">
                  <h3 className="font-semibold text-gray-800">Conversations</h3>
                </div>
                <div className="overflow-y-auto h-full">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Users className="w-12 h-12 text-pink-300 mx-auto mb-2" />
                      <p>No conversations yet</p>
                      <p className="text-sm">Start chatting with your matches!</p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.partner.user_id}
                        onClick={() => navigate(`/chat/${conversation.partner.user_id}`)}
                        className={`p-4 border-b border-pink-50 cursor-pointer hover:bg-pink-25 transition-colors ${
                          currentPartner?.user_id === conversation.partner.user_id ? 'bg-pink-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              {conversation.partner.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {conversation.partner.grade}
                            </p>
                            {conversation.last_message && (
                              <p className="text-sm text-gray-500 truncate">
                                {conversation.last_message.message}
                              </p>
                            )}
                          </div>
                          {conversation.unread_count > 0 && (
                            <div className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {conversation.unread_count}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {currentPartner ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 bg-pink-50 border-b border-pink-100 flex items-center">
                      <button
                        onClick={() => navigate("/chat")}
                        className="mr-3 p-1 hover:bg-pink-100 rounded-full transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {currentPartner.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {currentPartner.grade} • {currentPartner.favorite_subjects}
                        </p>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              message.sender_id === user?.id
                                ? 'bg-pink-500 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p>{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_id === user?.id ? 'text-pink-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <form onSubmit={sendMessage} className="p-4 border-t border-pink-100">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-2 border border-pink-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          disabled={isSending}
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || isSending}
                          className="bg-pink-500 text-white p-2 rounded-full hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Users className="w-16 h-16 text-pink-300 mx-auto mb-4" />
                      <p>Select a conversation to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
