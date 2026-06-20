import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  startConversation,
  listMessages,
  sendMessage,
  type Message,
  type MessageModeration,
} from '../api/chat';

interface ChatPanelProps {
  workerRef: string;
  workerName: string;
  onClose: () => void;
}

const POLL_MS = 1500;

const ChatPanel: React.FC<ChatPanelProps> = ({ workerRef, workerName, onClose }) => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<MessageModeration | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async (id: string) => {
    try {
      const list = await listMessages(id);
      setMessages(list);
    } catch (e) {
      console.error('[ChatPanel] listMessages failed', e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    startConversation(workerRef, workerName)
      .then(({ conversationId: id }) => {
        if (cancelled) return;
        setConversationId(id);
        void refresh(id);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Could not start the conversation.');
      });
    return () => {
      cancelled = true;
    };
  }, [workerRef, workerName, refresh]);

  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(() => void refresh(conversationId), POLL_MS);
    return () => clearInterval(interval);
  }, [conversationId, refresh]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !conversationId || sending) return;
    setSending(true);
    setError(null);
    try {
      const result = await sendMessage(conversationId, body);
      setDraft('');
      setWarning(result.moderation.warning ? result.moderation : null);
      await refresh(conversationId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send your message.');
    } finally {
      setSending(false);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.82)',
    WebkitBackdropFilter: 'blur(8px)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        className="card"
        style={{
          color: 'var(--text-1)',
          width: '100%',
          maxWidth: '460px',
          height: '80vh',
          maxHeight: '640px',
          display: 'flex',
          flexDirection: 'column',
          padding: '18px',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid var(--glass-border)',
            paddingBottom: '12px',
            marginBottom: '12px',
          }}
        >
          <div>
            <h2 id="chat-panel-title" style={{ margin: 0, fontSize: '18px' }}>
              Message {workerName}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-3)' }}>
              Protected by AI moderation — keep it on-platform.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-2)',
              fontSize: '22px',
              lineHeight: 1,
              cursor: 'pointer',
              padding: '2px 6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Thread */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingRight: '4px',
          }}
        >
          {error && !messages.length && !conversationId ? (
            <p style={{ color: 'var(--accent)', fontSize: '13px' }}>{error}</p>
          ) : messages.length === 0 ? (
            <p style={{ color: 'var(--text-3)', fontSize: '13px', margin: 'auto 0' }}>
              Say hello to start the conversation.
            </p>
          ) : (
            messages.map((m) => {
              const isCustomer = m.senderRole === 'customer';
              const blocked = m.status === 'blocked';
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isCustomer ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                  }}
                >
                  <div
                    style={{
                      padding: '9px 13px',
                      borderRadius: '14px',
                      fontSize: '14px',
                      lineHeight: 1.4,
                      background: isCustomer
                        ? 'var(--accent-grad)'
                        : 'var(--glass-bg-soft)',
                      color: isCustomer ? '#fff' : 'var(--text-1)',
                      border: isCustomer ? 'none' : '1px solid var(--glass-border)',
                      opacity: blocked ? 0.55 : 1,
                      textDecoration: blocked ? 'line-through' : 'none',
                      wordBreak: 'break-word',
                    }}
                  >
                    {blocked && <span aria-hidden="true">🚫 </span>}
                    {m.body}
                  </div>
                  {isCustomer && (
                    <div
                      style={{
                        fontSize: '11px',
                        color:
                          m.status === 'blocked'
                            ? 'var(--accent)'
                            : 'var(--text-3)',
                        textAlign: 'right',
                        marginTop: '3px',
                      }}
                    >
                      {m.status === 'redacted'
                        ? 'redacted · contact details hidden'
                        : m.status}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={threadEndRef} />
        </div>

        {/* Moderation warning banner */}
        {warning && (
          <div
            role="alert"
            style={{
              marginTop: '12px',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '13px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '10px',
              background: warning.blocked
                ? 'rgba(255,61,127,0.14)'
                : 'rgba(255,176,32,0.14)',
              border: warning.blocked
                ? '1px solid rgba(255,61,127,0.4)'
                : '1px solid rgba(255,176,32,0.4)',
              color: 'var(--text-1)',
            }}
          >
            <span>{warning.warning}</span>
            <button
              onClick={() => setWarning(null)}
              aria-label="Dismiss warning"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-2)',
                cursor: 'pointer',
                fontSize: '16px',
                lineHeight: 1,
                padding: 0,
              }}
            >
              ✕
            </button>
          </div>
        )}

        {error && (messages.length > 0 || conversationId) && (
          <p style={{ color: 'var(--accent)', fontSize: '12px', margin: '8px 0 0' }}>{error}</p>
        )}

        {/* Composer */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={`Message ${workerName}…`}
            disabled={!conversationId || sending}
            style={{ flex: 1 }}
          />
          <button
            className="btn-amber"
            onClick={() => void handleSend()}
            disabled={!conversationId || sending || !draft.trim()}
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
