export default function MessageBubble({ role, text, createdAt }) {
  const isUser = role === 'user';
  const time = createdAt
    ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={`msg-enter flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        {text}
      </div>
      {time && <span className="text-[11px] text-gray-300 mt-1 px-1">{time}</span>}
    </div>
  );
}