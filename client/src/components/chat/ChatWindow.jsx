import { useState, useRef, useEffect, useMemo } from 'react';
import * as chatApi from '../../api/chat.api';
import * as appointmentsApi from '../../api/appointments.api';
import { useChatPolling } from '../../hooks/useChatPolling';
import MessageBubble from './MessageBubble';
import BookingForm from './BookingForm';

export default function ChatWindow() {
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const prevCountRef = useRef(0);

  const { messages, addLocalMessage, refetch } = useChatPolling(sessionId);

  // Derive the current step from the last bot message — single source of
  // truth, and it survives a page refresh since it's persisted in the DB.
  const { stage, bookingData } = useMemo(() => {
    const lastBot = [...messages].reverse().find((m) => m.role === 'bot');
    return { stage: lastBot?.stage || 'collecting', bookingData: lastBot?.bookingData || {} };
  }, [messages]);

  // Only auto-scroll when a message was actually added — not on every poll tick.
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  const sendText = async (text) => {
    if (!text || sending) return;
    setError(null);
    addLocalMessage({ role: 'user', text });
    setSending(true);
    try {
      const result = await chatApi.sendMessage({ sessionId, text });
      if (!sessionId) setSessionId(result.sessionId);
      await refetch();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    setInput('');
    sendText(text);
  };

  const handleFormSubmit = async (formData) => {
    setSending(true);
    setError(null);
    try {
      await appointmentsApi.createAppointment({ ...formData, chatSessionId: sessionId });
      await refetch();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the appointment.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[60vh] bg-white border border-gray-200 rounded-xl">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-10">
            Say hello and tell me what you'd like to book.
          </p>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} text={m.text} />
        ))}

        {stage === 'awaiting_confirmation' && (
          <div className="flex gap-2 max-w-[90%]">
            <button
              disabled={sending}
              onClick={() => sendText('yes')}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-60"
            >
              Yes, confirm
            </button>
            <button
              disabled={sending}
              onClick={() => sendText('no')}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-60"
            >
              No, change
            </button>
          </div>
        )}

        {stage === 'awaiting_form' && (
          <BookingForm
            bookingData={bookingData}
            onSubmit={handleFormSubmit}
            onCancel={() => sendText('start over')}
            submitting={sending}
          />
        )}

        <div ref={scrollRef} />
      </div>

      {error && <p className="text-red-600 text-sm px-4">{error}</p>}

      <form className="flex gap-2.5 p-3.5 border-t border-gray-200" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}