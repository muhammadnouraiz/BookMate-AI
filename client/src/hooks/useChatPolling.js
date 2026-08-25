import { useState, useEffect, useCallback, useRef } from 'react';
import * as chatApi from '../api/chat.api';

const ACTIVE_INTERVAL_MS = 3000;   // right after sending, or while messages are still changing
const IDLE_INTERVAL_MS = 15000;    // once things have been quiet for a while
const IDLE_AFTER_MS = 20000;       // how long with no new messages before we consider it "idle"

// Polls GET /chat/:sessionId/messages to simulate near-real-time chat, without
// hammering the server when the user isn't actually chatting:
// - Pauses entirely when the browser tab is hidden.
// - Backs off to a slower interval once the conversation has been quiet.
// - Speeds back up automatically whenever a new message is sent locally.
export function useChatPolling(sessionId) {
  const [messages, setMessages] = useState([]);
  const timeoutRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const lastChangeAtRef = useRef(Date.now());

  const fetchMessages = useCallback(async () => {
    if (!sessionId || document.hidden) return;
    try {
      const { messages: fetched } = await chatApi.getMessages(sessionId);
      if (fetched.length !== lastMessageCountRef.current) {
        lastMessageCountRef.current = fetched.length;
        lastChangeAtRef.current = Date.now();
      }
      setMessages(fetched);
    } catch {
      // Silent on poll failures — a transient network blip shouldn't disrupt the chat view.
    }
  }, [sessionId]);

  const scheduleNext = useCallback(() => {
    const idleFor = Date.now() - lastChangeAtRef.current;
    const delay = idleFor > IDLE_AFTER_MS ? IDLE_INTERVAL_MS : ACTIVE_INTERVAL_MS;

    timeoutRef.current = setTimeout(async () => {
      await fetchMessages();
      scheduleNext();
    }, delay);
  }, [fetchMessages]);

  useEffect(() => {
    if (!sessionId) return undefined;

    lastMessageCountRef.current = 0;
    lastChangeAtRef.current = Date.now();
    fetchMessages();
    scheduleNext();

    // Resume immediately (instead of waiting out a stale delay) when the tab regains focus.
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchMessages();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timeoutRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId, fetchMessages, scheduleNext]);

  const addLocalMessage = (message) => {
    setMessages((prev) => [...prev, message]);
    lastChangeAtRef.current = Date.now(); // mark as active again — next poll comes back to 3s
  };

  const refetch = fetchMessages;

  return { messages, addLocalMessage, refetch };
}