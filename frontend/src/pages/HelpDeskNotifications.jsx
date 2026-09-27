import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import { MessageSquareText, Send, Phone } from 'lucide-react';

const PRIORITY_STYLE = {
  urgent: 'bg-[#fbf0ed] text-[#a84f3b]',
  high: 'bg-[#fbf0ed] text-[#a84f3b]',
  normal: 'bg-brand-100 text-brand-700',
  low: 'bg-ink-900/5 text-ink-700',
};

export default function HelpDeskNotifications() {
  const [requests, setRequests] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySaving, setReplySaving] = useState(false);

  function load() {
    api.get('/requests').then((res) => setRequests(res.data));
  }

  useEffect(() => {
    load();
  }, []);

  async function sendMessage(id) {
    if (!replyText.trim()) return;
    setReplySaving(true);
    try {
      await api.post(`/requests/${id}/message`, { message: replyText.trim() });
      setReplyText('');
      load();
    } finally {
      setReplySaving(false);
    }
  }

  const chatThreads = useMemo(() => {
    if (!requests) return [];
    const grouped = new Map();
    requests.forEach((request) => {
      const guestKey = request.guest?._id || request.guest?.phone || request.guest?.name || request._id;
      const entries = request.conversation?.length
        ? request.conversation
        : [{ sender: 'guest', message: request.message }];
      const existing = grouped.get(guestKey);
      if (existing) {
        existing.conversation.push(...entries);
        existing.read = existing.read && request.read;
        existing.sourceId = request._id;
      } else {
        grouped.set(guestKey, {
          ...request,
          _id: `guest-${guestKey}`,
          sourceId: request._id,
          conversation: [...entries],
        });
      }
    });
    return [...grouped.values()];
  }, [requests]);

  if (!requests) return <Loader />;

  const selectedRequest = chatThreads.find((request) => request._id === selectedId) || chatThreads[0];

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <MessageSquareText size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-700">Help desk</p>
              <h2 className="mt-1 text-2xl font-semibold text-ink-900">Guest conversations</h2>
            </div>
          </div>

        </div>
      </div>

      <div className="card min-h-[calc(100vh-220px)] overflow-hidden">
        <div className="border-b border-ink-900/5 bg-ink-900/3 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-700/60">Live guest messages</p>
        </div>

        {chatThreads.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-700/60">No guest help desk messages yet.</div>
        ) : (
          <div className="divide-y divide-ink-900/5">
            <div className="grid min-h-[calc(100vh-300px)] lg:grid-cols-[280px_1fr]">
              <div className="border-b border-ink-900/5 lg:border-b-0 lg:border-r">
                {chatThreads.map((request) => (
                  <button key={request._id} type="button" onClick={() => setSelectedId(request._id)} className={`w-full border-b border-ink-900/5 p-4 text-left transition hover:bg-brand-50/50 ${selectedRequest?._id === request._id ? 'bg-brand-50' : ''}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink-900">{request.guest?.name || 'Guest'}</span>
                      {!request.read && <span className="h-2 w-2 rounded-full bg-coral" />}
                    </div>
                    <p className="mt-1 truncate text-xs text-ink-700/60">{request.conversation?.at(-1)?.message || request.message}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-ink-700/45">{request.category}</p>
                  </button>
                ))}
              </div>
              {selectedRequest ? (
                <div className="flex min-h-[540px] flex-col">
                  <div className="flex items-center justify-between border-b border-ink-900/5 px-4 py-3">
                    <div>
                      <p className="font-semibold text-ink-900">{selectedRequest.guest?.name || 'Guest'}</p>
                      {selectedRequest.guest?.phone && <a href={`tel:${selectedRequest.guest.phone}`} className="inline-flex items-center gap-1 text-xs text-brand-700"><Phone size={12} /> {selectedRequest.guest.phone}</a>}
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${PRIORITY_STYLE[selectedRequest.priority] || PRIORITY_STYLE.normal}`}>{selectedRequest.priority}</span>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto bg-[#f5f1e9] p-4">
                    {(selectedRequest.conversation?.length ? selectedRequest.conversation : [{ sender: 'guest', message: selectedRequest.message }])
                      .filter((entry) => entry.sender === 'guest' || entry.sender === 'manager')
                      .map((entry, index) => (
                      <div key={`${selectedRequest._id}-${index}`} className={`flex ${entry.sender === 'manager' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${entry.sender === 'manager' ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm bg-white text-ink-800'}`}>
                          <p className="leading-6">{entry.message}</p>
                          <p className={`mt-1 text-[10px] ${entry.sender === 'manager' ? 'text-white/65' : 'text-ink-700/45'}`}>{entry.sender === 'manager' ? 'Manager' : entry.sender === 'staff' ? 'Assigned staff' : selectedRequest.guest?.name || 'Guest'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={(event) => { event.preventDefault(); sendMessage(selectedRequest.sourceId); }} className="flex gap-2 border-t border-ink-900/5 bg-white p-3">
                    <input value={replyText} onChange={(event) => setReplyText(event.target.value)} className="input-field flex-1" placeholder="Write a message..." />
                    <button type="submit" disabled={replySaving || !replyText.trim()} aria-label="Send message" className="btn-primary px-4"><Send size={16} /></button>
                  </form>
                </div>
              ) : <div className="flex items-center justify-center p-8 text-sm text-ink-700/60">Select a conversation.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
