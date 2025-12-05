import { MessageSquare, Send, Bell, User } from 'lucide-react';
import { useState } from 'react';

export function ChatNotifications({ onNavigate }) {
  const [message, setMessage] = useState('');

  const messages = [
    { from: 'broker', name: 'John Smith (Broker)', text: "I've reviewed your shipment SHP-002. Could you please upload an updated Certificate of Origin?", time: '10:30 AM' },
    { from: 'shipper', name: 'You', text: "Sure, I'll upload it shortly. Thanks!", time: '10:32 AM' },
    { from: 'broker', name: 'John Smith (Broker)', text: 'Great! Once uploaded, I can complete the approval.', time: '10:33 AM' }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-slate-900 mb-2">Chat & Notifications</h1>
        <p className="text-slate-600">Communicate with brokers and view notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-slate-900 mb-4">Conversations</h3>
          <div className="space-y-2">
            <button className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg text-left">
              <div className="flex items-center gap-3 mb-1">
                <User className="w-5 h-5 text-blue-600" />
                <span className="text-slate-900">John Smith (Broker)</span>
              </div>
              <p className="text-slate-600 text-sm truncate">Great! Once uploaded, I can...</p>
            </button>
            <button className="w-full p-3 hover:bg-slate-50 rounded-lg text-left">
              <div className="flex items-center gap-3 mb-1">
                <Bell className="w-5 h-5 text-slate-400" />
                <span className="text-slate-700">System Notifications</span>
              </div>
              <p className="text-slate-500 text-sm truncate">AI evaluation complete for SHP-003</p>
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-slate-900">John Smith</p>
                <p className="text-slate-500 text-sm">Customs Broker</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.from === 'shipper' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md p-3 rounded-lg ${
                  msg.from === 'shipper' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-900'
                }`}>
                  <p className="text-sm mb-1">{msg.text}</p>
                  <p className={`text-xs ${msg.from === 'shipper' ? 'text-blue-100' : 'text-slate-500'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}