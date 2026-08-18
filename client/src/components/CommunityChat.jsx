import { useState, useEffect, useRef } from 'react';
import { supabase, getAvatarUrl, getStorageUrl } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatChatTime, validateFile } from '../lib/utils';
import Modal from './Modal';
import './CommunityChat.css';

export default function CommunityChat({ community, isJoined, onJoinRequest }) {
  const { user, profile, loginWithGoogle } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const communityId = community?.id;

  // 1. Load initial message history
  const fetchMessages = async () => {
    if (!communityId || !isJoined) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles!user_id(id, full_name, username, avatar_url), message_attachments(*), reply_message:messages!reply_to_id(content, profiles!user_id(full_name))')
        .eq('circle_id', communityId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Messages fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [communityId, isJoined]);

  // 2. Realtime subscription via Supabase Channels
  useEffect(() => {
    if (!communityId || !isJoined) return;

    const channel = supabase
      .channel(`circle-chat-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `circle_id=eq.${communityId}`,
        },
        async (payload) => {
          const newMsg = payload.new;
          // Fetch user profile for new message
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .eq('id', newMsg.user_id)
            .single();

          // Fetch attachments if any
          const { data: attachments } = await supabase
            .from('message_attachments')
            .select('*')
            .eq('message_id', newMsg.id);

          const fullMsg = {
            ...newMsg,
            profiles: userProfile,
            message_attachments: attachments || [],
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === fullMsg.id)) return prev;
            return [...prev, fullMsg];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `circle_id=eq.${communityId}`,
        },
        (payload) => {
          const deletedId = payload.old.id;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, isJoined]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle Send Message
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending || !user) return;

    setSending(true);
    try {
      // Check rate limit RPC
      const { data: rateOk } = await supabase.rpc('check_message_rate_limit', {
        p_user_id: user.id,
        p_circle_id: communityId,
      });

      if (rateOk === false) {
        showToast("Juda tez xabar yuboryapsiz. Bir oz kuting.", "warning");
        setSending(false);
        return;
      }

      const { data: newMsg, error } = await supabase
        .from('messages')
        .insert({
          circle_id: communityId,
          user_id: user.id,
          content: text,
          type: 'text',
          reply_to_id: replyTo?.id || null,
        })
        .select('*, profiles!user_id(id, full_name, username, avatar_url)')
        .single();

      if (error) throw error;

      setInputText('');
      setReplyTo(null);

      // Optimistic update if realtime is slightly delayed
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    } catch (err) {
      showToast(err.message || 'Xabar yuborishda xatolik', 'error');
    } finally {
      setSending(false);
    }
  };

  // Media File Upload in Chat
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user || !communityId) return;

    const fileErr = validateFile(file, {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov'],
    });

    if (fileErr) {
      showToast(fileErr, 'error');
      return;
    }

    try {
      setUploadingMedia(true);
      const isVideo = file.type.startsWith('video');
      const ext = file.name.split('.').pop();
      const filePath = `${communityId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('chat-media')
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const publicUrl = getStorageUrl('chat-media', filePath);

      // Insert message record
      const { data: msgData, error: msgErr } = await supabase
        .from('messages')
        .insert({
          circle_id: communityId,
          user_id: user.id,
          content: isVideo ? '🎥 Video' : '📷 Rasm',
          type: isVideo ? 'video' : 'image',
        })
        .select('*, profiles!user_id(id, full_name, username, avatar_url)')
        .single();

      if (msgErr) throw msgErr;

      // Insert attachment record
      await supabase.from('message_attachments').insert({
        message_id: msgData.id,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        original_name: file.name,
      });

      showToast("Media fayl muvaffaqiyatli yuborildi!", "success");
      fetchMessages();
    } catch (err) {
      showToast(err.message || "Fayl yuklashda xatolik", "error");
    } finally {
      setUploadingMedia(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Haqiqatan ham ushbu xabarni o'chirmoqchimisiz?")) return;
    try {
      const { error } = await supabase.from('messages').delete().eq('id', msgId);
      if (error) throw error;
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      showToast("Xabar o'chirildi", 'info');
    } catch (err) {
      showToast(err.message || "O'chirishda xatolik", 'error');
    }
  };

  // Locked states
  if (!user) {
    return (
      <div className="chat-container chat-locked-card">
        <div className="locked-icon">💬</div>
        <h3>Davra Chat va Networking</h3>
        <p>Ushbu davra a'zolari bilan real vaqt rejimida muloqot qilish uchun avval tizimga kiring.</p>
        <button className="btn btn-primary mt-4" onClick={loginWithGoogle}>
          Google orqali kirish
        </button>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="chat-container chat-locked-card">
        <div className="locked-icon">🔒</div>
        <h3>Yopiq Hamjamiyat Chati</h3>
        <p>Ushbu chat faqat <strong>{community?.name}</strong> davrasi a'zolari uchun ochiq.</p>
        <button className="btn btn-primary mt-4" onClick={onJoinRequest}>
          Davraga qo'shilish
        </button>
      </div>
    );
  }

  const promptChips = [
    "👋 Assalomu alaykum! Davraga yangi qo'shildim.",
    "🚀 Hozirda yangi loyiha ustida ishlayapman.",
    "💡 Soha bo'yicha maslahat olmoqchi edim.",
    "🤝 Yangi networking uchun ochiqman!"
  ];

  return (
    <div className="chat-container card-glass">
      <div className="chat-header">
        <div className="chat-title-info">
          <h4>
            <span className="live-indicator" />
            {community?.name} — Networking Chati
          </h4>
          <span className="chat-participant-count text-muted">
            {community?.member_count || 0} nafar a'zo
          </span>
        </div>
      </div>

      <div className="chat-messages-area">
        {loading ? (
          <div className="chat-loading">
            <div className="spinner spinner-md" />
            <p>Xabarlar yuklanmoqda...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-icon">🤝</div>
            <h4>Suhbatni birinchi bo'lib boshlang!</h4>
            <p>O'zingizni tanishtiring va fikr almashishni boshlang.</p>

            <div className="prompt-chips">
              {promptChips.map((chip, idx) => (
                <button
                  key={idx}
                  className="prompt-chip btn btn-sm btn-outline"
                  onClick={() => handleSendMessage(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((msg) => {
              const isMine = msg.user_id === user.id;
              const authorName = msg.profiles?.full_name || 'Foydalanuvchi';
              const avatarUrl = msg.profiles?.avatar_url;

              return (
                <div key={msg.id} className={`chat-message-item ${isMine ? 'mine' : 'theirs'}`}>
                  <img
                    src={getAvatarUrl(avatarUrl, authorName)}
                    alt={authorName}
                    className="msg-avatar avatar avatar-sm"
                    onClick={() => setSelectedUser(msg.profiles)}
                  />

                  <div className="msg-body-wrapper">
                    <div className="msg-header">
                      <span className="msg-author-name">{isMine ? 'Siz' : authorName}</span>
                      <span className="msg-time">{formatChatTime(msg.created_at)}</span>

                      {isMine && (
                        <button
                          className="msg-delete-btn"
                          onClick={() => handleDeleteMessage(msg.id)}
                          title="O'chirish"
                        >
                          &times;
                        </button>
                      )}
                    </div>

                    {msg.reply_message && (
                      <div className="reply-quote">
                        <span className="reply-author">{msg.reply_message.profiles?.full_name}</span>
                        <p>{msg.reply_message.content}</p>
                      </div>
                    )}

                    <div className="msg-content">
                      {msg.content}

                      {/* Attachments */}
                      {msg.message_attachments && msg.message_attachments.map((att) => (
                        <div key={att.id} className="msg-media-attachment mt-2">
                          {att.file_type?.startsWith('video') ? (
                            <video src={att.file_url} controls className="msg-video" />
                          ) : (
                            <img src={att.file_url} alt="Attachment" className="msg-image" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div className="reply-preview-bar">
          <span>Javob berilmoqda: <strong>{replyTo.profiles?.full_name}</strong></span>
          <button onClick={() => setReplyTo(null)} className="tag-remove">&times;</button>
        </div>
      )}

      {/* Chat Input */}
      <div className="chat-input-area">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,video/*"
          hidden
        />

        <button
          className="btn btn-icon btn-ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingMedia || sending}
          title="Rasm yoki video biriktirish"
        >
          {uploadingMedia ? '...' : '📎'}
        </button>

        <textarea
          className="chat-textarea input"
          placeholder="Xabaringizni yozing... (Enter — yuborish)"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          rows={1}
          maxLength={2000}
          disabled={sending}
        />

        <button
          className="btn btn-primary chat-send-btn"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || sending}
        >
          {sending ? '...' : 'Yuborish'}
        </button>
      </div>

      {/* Member Profile Modal */}
      {selectedUser && (
        <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="A'zo Profili">
          <div className="user-preview-modal text-center">
            <img
              src={getAvatarUrl(selectedUser.avatar_url, selectedUser.full_name)}
              alt={selectedUser.full_name}
              className="avatar avatar-xl mb-4"
              style={{ margin: '0 auto' }}
            />
            <h3>{selectedUser.full_name}</h3>
            <p className="text-primary font-semibold">@{selectedUser.username || 'username'}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
