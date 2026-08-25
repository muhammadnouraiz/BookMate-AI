import ChatWindow from '../components/chat/ChatWindow';

export default function ChatPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Book an appointment</h1>
      <p className="text-gray-400 mb-6 text-sm">
        Tell the assistant what you need — it'll ask for anything it's missing.
      </p>
      <ChatWindow />
    </div>
  );
}