import React, { useEffect, useRef, useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { socket } from "../../../sockets/socketManager";

type ChatMessage = {
  userId: string;
  message: string;
  timestamp: string;
};

const Chat: React.FC = () => {
  const usernameRef = useRef(
    `user-${Math.random().toString(36).slice(2, 8)}`
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.emit("newUser", usernameRef.current);
  }, []);

  useEffect(() => {
    const handleIncomingMessage = (payload: ChatMessage) => {
      setMessages(prev => [...prev, payload]);
    };

    socket.on("chat:message", handleIncomingMessage);

    return () => {
      socket.off("chat:message", handleIncomingMessage);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedMessage = messageDraft.trim();

    if (!trimmedMessage) {
      return;
    }

    socket.emit("chat:message", {
      userId: usernameRef.current,
      message: trimmedMessage
    });

    setMessageDraft("");
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage(event);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-800/30 backdrop-blur-sm border-l border-purple-500/20">
      {/* Chat Header */}
      <div className="bg-slate-800/50 px-4 py-3 border-b border-purple-500/20">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-slate-200">Chat</h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full p-4 mb-3">
              <MessageCircle className="w-10 h-10 text-purple-400/50" />
            </div>
            <p className="text-slate-400 text-sm">
              Aquí verás los mensajes del chat...
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isOwn = msg.userId === usernameRef.current;
              const time = new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div
                  key={`${msg.timestamp}-${index}`}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] ${
                      isOwn
                        ? "bg-gradient-to-br from-purple-600 to-purple-700"
                        : "bg-slate-700/80"
                    } rounded-xl px-3 py-2 shadow-lg`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold ${
                          isOwn ? "text-purple-200" : "text-purple-400"
                        }`}
                      >
                        {msg.userId}
                      </span>
                      <span className="text-xs text-slate-400">{time}</span>
                    </div>
                    <p
                      className={`text-sm leading-relaxed break-words ${
                        isOwn ? "text-white" : "text-slate-100"
                      }`}
                    >
                      {msg.message}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input */}
      <div className="bg-slate-800/50 px-4 py-3 border-t border-purple-500/20">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Escribe tu mensaje aquí"
            value={messageDraft}
            onChange={event => setMessageDraft(event.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-slate-700/50 text-slate-100 placeholder-slate-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-slate-600/50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!messageDraft.trim()}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg p-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;