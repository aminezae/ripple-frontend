'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { Sun, Moon, LogOut, MessageSquare, Send, Users, Plus, X, Mic, Check, CheckCheck, Clock, Play, Pause, Search, Phone, Video, Info, Reply, SmilePlus, MoreVertical, Pin, BellOff, Paperclip, FileText, Download } from 'lucide-react';
import Image from 'next/image';

declare global {
  interface Window {
    Pusher: any;
    Echo: any;
  }
}

interface User {
  id: number;
  username: string;
}

interface Conversation {
  id: number;
  type: 'direct' | 'group';
  name: string;
  users: User[];
  unread_count?: number;
  is_pinned?: boolean;
  is_muted?: boolean;
}

const AudioPlayer = ({ url, duration, isMe, waveform }: { url: string, duration: number, isMe: boolean, waveform?: number[] | null }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate fallback waveform if null (old messages)
  const defaultWaveform = [0.3, 0.5, 0.8, 0.6, 0.9, 0.7, 0.4, 0.85, 1.0, 0.65, 0.8, 0.95, 0.5, 0.4, 0.75, 0.6, 0.35, 0.2, 0.4, 0.7, 0.9, 0.5, 0.8, 0.6, 1.0, 0.85, 0.4, 0.7, 0.9, 0.6, 0.5, 0.8, 0.95, 0.8, 0.65, 1.0, 0.85, 0.4, 0.7, 0.9];
  const bars = waveform && waveform.length > 0 ? waveform : defaultWaveform.slice(0, 40);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSpeedChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && duration > 0) {
      setProgress(audioRef.current.currentTime / duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const formatTime = (secondsTotal: number) => {
    const mins = Math.floor(secondsTotal / 60);
    const secs = Math.floor(secondsTotal % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentSeconds = isPlaying ? Math.floor(progress * duration) : duration;

  return (
    <div className="flex items-center gap-3 py-1 select-none">
      <audio 
        ref={audioRef} 
        src={url} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="hidden"
      />
      
      {/* Sleek Play Button */}
      <button
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause audio note' : 'Play audio note'}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md ${
          isMe
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-primary-button hover:bg-primary-button/90 text-white shadow-primary/40'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform Frequency Equalizer */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-[140px] max-w-[220px]">
        <div className="flex items-center gap-[2.5px] h-7 px-1">
          {bars.map((val, idx) => {
            const barFraction = idx / bars.length;
            const isFilled = progress >= barFraction;
            const heightPx = Math.max(5, Math.round(val * 24));

            return (
              <span
                key={idx}
                style={{ height: `${heightPx}px` }}
                className={`w-[3px] rounded-full transition-all duration-100 ${
                  isFilled
                    ? isMe
                      ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] scale-y-110'
                      : 'bg-primary shadow-[0_0_8px_rgba(91,58,120,0.8)] scale-y-110'
                    : isMe
                    ? 'bg-white/35 hover:bg-white/50'
                    : 'bg-border hover:bg-border/80'
                }`}
              />
            );
          })}
        </div>

        {/* Duration & Speed Selector */}
        <div className="flex items-center justify-between text-[11px] font-mono-num px-1">
          <span className={isMe ? 'text-white/80' : 'text-text-muted'}>
            {formatTime(currentSeconds)}
          </span>

          <button
            onClick={handleSpeedChange}
            type="button"
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition-colors ${
              isMe
                ? 'bg-white/20 hover:bg-white/30 text-white'
                : 'bg-surface/80 border border-border hover:bg-border/50 text-text-muted'
            }`}
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>
    </div>
  );
};

function getAvatarColor(name: string) {
  const colors = [
    'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
    'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    'bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Chat() {
  const [token, setToken] = useState<string | null>(null);
  const [myId, setMyId] = useState<number | null>(null);
  const [myUsername, setMyUsername] = useState<string>('');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
  const [reactionPopoverId, setReactionPopoverId] = useState<number | string | null>(null);
  
  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'direct' | 'group' | 'unread'>('all');
  const [isConnected, setIsConnected] = useState(false);

  // Notification state
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      const dismissed = localStorage.getItem('notifications_dismissed');
      if (Notification.permission === 'default' && !dismissed) {
        setShowNotificationPrompt(true);
      }
    }
  }, []);

  // Typing indicators state
  const [typingUsers, setTypingUsers] = useState<Record<number, Record<number, string>>>({});
  const typingTimeoutsRef = useRef<Record<number, Record<number, NodeJS.Timeout>>>({});
  const myTypingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastWhisperTimeRef = useRef<number>(0);
  const configuredChannelsRef = useRef<Set<number>>(new Set());

  const handleUserStoppedTyping = useCallback((convId: number, userId: number) => {
    if (typingTimeoutsRef.current[convId]?.[userId]) {
      clearTimeout(typingTimeoutsRef.current[convId][userId]);
      delete typingTimeoutsRef.current[convId][userId];
    }
    setTypingUsers(prev => {
      const convTyping = prev[convId];
      if (!convTyping || !convTyping[userId]) return prev;
      const updated = { ...convTyping };
      delete updated[userId];
      return {
        ...prev,
        [convId]: updated
      };
    });
  }, []);

  const handleUserTyping = useCallback((convId: number, userId: number, username: string) => {
    setTypingUsers(prev => {
      const convTyping = prev[convId] || {};
      return {
        ...prev,
        [convId]: { ...convTyping, [userId]: username }
      };
    });

    if (!typingTimeoutsRef.current[convId]) typingTimeoutsRef.current[convId] = {};
    if (typingTimeoutsRef.current[convId][userId]) clearTimeout(typingTimeoutsRef.current[convId][userId]);
    
    // Auto-expire after 5 seconds if no stopped-typing is received
    typingTimeoutsRef.current[convId][userId] = setTimeout(() => {
      handleUserStoppedTyping(convId, userId);
    }, 5000);
  }, [handleUserStoppedTyping]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');
  
  const [contextMenuId, setContextMenuId] = useState<number | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenuId(null);
    if (contextMenuId) {
      document.addEventListener('click', handleGlobalClick);
    }
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [contextMenuId]);

  const togglePin = async (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setContextMenuId(null);
    const newPinned = !conv.is_pinned;
    
    setConversations(prev => {
      const updated = prev.map(c => c.id === conv.id ? { ...c, is_pinned: newPinned } : c);
      return updated.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return 0;
      });
    });

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/conversations/${conv.id}/pin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(prev => {
          const updated = prev.map(c => c.id === conv.id ? { ...c, is_pinned: data.is_pinned } : c);
          return updated.sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return 0;
          });
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMute = async (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setContextMenuId(null);
    const newMuted = !conv.is_muted;
    
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, is_muted: newMuted } : c));

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/conversations/${conv.id}/mute`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, is_muted: data.is_muted } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const echoInstance = useRef<any>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('sanctum_token');
    const storedUserId = localStorage.getItem('user_id');
    const storedUsername = localStorage.getItem('username') || '';

    if (!storedToken || !storedUserId) {
      router.push('/');
      return;
    }
    
    setToken(storedToken);
    setMyId(parseInt(storedUserId));
    setMyUsername(storedUsername);
  }, [router]);

  // Fetch Conversations
  const fetchConversations = () => {
    if (!token) return;
    fetch('http://127.0.0.1:8000/api/conversations', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setConversations(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Failed to fetch conversations', err));
  };

  useEffect(() => {
    fetchConversations();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    window.Pusher = Pusher;

    echoInstance.current = new Echo({
      broadcaster: 'reverb',
      key: 'myreverbkey',
      wsHost: '127.0.0.1',
      wsPort: 8081,
      wssPort: 8081,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
      authEndpoint: 'http://127.0.0.1:8000/api/broadcasting/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    echoInstance.current.connector.pusher.connection.bind('state_change', (states: any) => {
      setIsConnected(states.current === 'connected');
    });

    return () => {
      if (echoInstance.current) {
        echoInstance.current.disconnect();
      }
    };
  }, [token]);

  const markAsRead = (convId: number) => {
    if (!token) return;
    fetch(`http://127.0.0.1:8000/api/conversations/${convId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }).catch(err => console.error('Failed to mark as read', err));
  };
  const selectedConvRef = useRef<Conversation | null>(null);
  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);

  // Global listeners for all conversations
  const convIds = conversations.map(c => c.id).join(',');
  useEffect(() => {
    if (!token || !myId || !echoInstance.current || conversations.length === 0) return;

    conversations.forEach(conv => {
      const channelName = `conversation.${conv.id}`;
      const channel = echoInstance.current.private(channelName);
      
      channel.stopListening('MessageSent');
      channel.stopListening('ConversationRead');
      channel.stopListening('ReactionUpdated');

      if (!configuredChannelsRef.current.has(conv.id)) {
        configuredChannelsRef.current.add(conv.id);
        channel.listenForWhisper('typing', (e: any) => {
          if (e.user_id !== myId) {
            handleUserTyping(conv.id, e.user_id, e.username);
          }
        });
        channel.listenForWhisper('stopped-typing', (e: any) => {
          if (e.user_id !== myId) {
            handleUserStoppedTyping(conv.id, e.user_id);
          }
        });
      }

      channel.listen('MessageSent', (e: any) => {
        const activeId = selectedConvRef.current?.id;
        if (e.message.sender_id !== myId) {
          if (activeId === conv.id) {
            setMessages((prev: any) => [...prev, e.message]);
            markAsRead(conv.id);
          } else {
            setConversations(prev => prev.map(c => 
              c.id === conv.id ? { ...c, unread_count: (c.unread_count || 0) + 1 } : c
            ));
          }

          if (
            'Notification' in window &&
            Notification.permission === 'granted' &&
            (document.hidden || activeId !== conv.id)
          ) {
            let bodyText = e.message.body || '';
            if (e.message.type === 'voice') bodyText = 'Sent a voice message';
            else if (e.message.type === 'image') bodyText = 'Sent an image';
            else if (e.message.type === 'file') bodyText = 'Sent a file';
            else if (bodyText.length > 60) bodyText = bodyText.substring(0, 60) + '...';

            const senderName = e.message.sender?.username || 'Unknown';
            const title = conv.type === 'group' ? `${conv.name}: ${senderName}` : senderName;

            const notification = new Notification(title, {
              body: bodyText,
              icon: '/favicon.ico'
            });

            notification.onclick = () => {
              window.focus();
              setSelectedConv(conv);
              notification.close();
            };

            setTimeout(() => {
              notification.close();
            }, 5000);
          }
        }
      });

      channel.listen('ConversationRead', (e: any) => {
        const activeId = selectedConvRef.current?.id;
        if (e.user_id !== myId && activeId === conv.id) {
          setMessages((prev: any) => prev.map((msg: any) => {
             if (msg.sender_id === myId && typeof msg.id === 'number' && msg.id <= e.last_read_message_id) {
                 return { ...msg, status: 'read' };
             }
             return msg;
          }));
        } else if (e.user_id === myId) {
          setConversations(prev => prev.map(c => 
            c.id === conv.id ? { ...c, unread_count: 0 } : c
          ));
        }
      });

      channel.listen('ReactionUpdated', (e: any) => {
        const activeId = selectedConvRef.current?.id;
        if (activeId === conv.id) {
          setMessages((prev: any) => prev.map((msg: any) => {
            if (msg.id === e.message_id) {
              return { ...msg, reactions: e.reactions };
            }
            return msg;
          }));
        }
      });
    });

  }, [token, myId, convIds, handleUserTyping, handleUserStoppedTyping]);

  // Fetch messages when selected conversation changes
  useEffect(() => {
    if (!token || !myId || !selectedConv) return;
    
    if (myTypingTimerRef.current) {
      clearTimeout(myTypingTimerRef.current);
      myTypingTimerRef.current = null;
    }
    lastWhisperTimeRef.current = 0;
    
    setReplyingTo(null);
    const convId = selectedConv.id;

    fetch(`http://127.0.0.1:8000/api/conversations/${convId}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setMessages(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          markAsRead(convId);
          // Optimistically reset unread count immediately on open
          setConversations(prev => prev.map(c => 
            c.id === convId ? { ...c, unread_count: 0 } : c
          ));
        }
      })
      .catch(err => console.error('Failed to fetch messages', err));
  }, [token, myId, selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!token || !selectedConv || !echoInstance.current || !myId) return;

    const channel = echoInstance.current.private(`conversation.${selectedConv.id}`);
    
    const now = Date.now();
    if (now - lastWhisperTimeRef.current > 2000) {
      lastWhisperTimeRef.current = now;
      channel.whisper('typing', {
        user_id: myId,
        username: myUsername
      });
    }

    if (myTypingTimerRef.current) clearTimeout(myTypingTimerRef.current);

    myTypingTimerRef.current = setTimeout(() => {
      lastWhisperTimeRef.current = 0;
      channel.whisper('stopped-typing', {
        user_id: myId,
        username: myUsername
      });
    }, 2500);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !token || !selectedConv) return;

    if (myTypingTimerRef.current) {
      clearTimeout(myTypingTimerRef.current);
      myTypingTimerRef.current = null;
    }
    if (lastWhisperTimeRef.current > 0 && echoInstance.current && myId) {
      lastWhisperTimeRef.current = 0;
      echoInstance.current.private(`conversation.${selectedConv.id}`).whisper('stopped-typing', {
        user_id: myId,
        username: myUsername
      });
    }

    const messageText = newMessage;
    const fileToSend = selectedFile;
    const replyTarget = replyingTo;
    
    setNewMessage('');
    setSelectedFile(null);
    setReplyingTo(null);

    const sendText = async (text: string, replyTo: any) => {
      const tempId = 'temp-' + Date.now();
      const tempMsg = {
          id: tempId,
          sender_id: myId,
          body: text,
          created_at: new Date().toISOString(),
          status: 'sending',
          ...(replyTo && {
            reply_to: {
              id: replyTo.id,
              username: replyTo.sender?.username || 'Unknown',
              snippet: replyTo.type === 'voice' ? 'Voice message' : (replyTo.body ? replyTo.body.substring(0, 60) + (replyTo.body.length > 60 ? '...' : '') : 'Attachment')
            }
          })
      };
      setMessages(prev => [...prev, tempMsg]);

      try {
        const res = await fetch(`http://127.0.0.1:8000/api/conversations/${selectedConv.id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            body: text,
            ...(replyTo && { reply_to_message_id: replyTo.id })
          })
        });

        if (res.ok) {
          const sentMessage = await res.json();
          sentMessage.status = 'delivered';
          setMessages(prev => prev.map(m => m.id === tempId ? sentMessage : m));
        } else {
          console.error('Failed to send message', await res.text());
          setMessages(prev => prev.filter(m => m.id !== tempId));
        }
      } catch (err) {
        console.error(err);
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    };

    const sendFileMsg = async (file: File, replyTo: any) => {
      const tempId = 'temp-file-' + Date.now();
      const isImage = file.type.startsWith('image/');
      
      const tempMsg = {
          id: tempId,
          sender_id: myId,
          type: isImage ? 'image' : 'file',
          file_name: file.name,
          file_size: file.size,
          file_mime_type: file.type,
          file_url: isImage ? URL.createObjectURL(file) : null,
          body: null,
          created_at: new Date().toISOString(),
          status: 'sending',
          ...(replyTo && {
            reply_to: {
              id: replyTo.id,
              username: replyTo.sender?.username || 'Unknown',
              snippet: replyTo.type === 'voice' ? 'Voice message' : (replyTo.body ? replyTo.body.substring(0, 60) + (replyTo.body.length > 60 ? '...' : '') : 'Attachment')
            }
          })
      };
      
      setMessages(prev => [...prev, tempMsg]);
      
      const formData = new FormData();
      formData.append('file', file);
      if (replyTo) {
        formData.append('reply_to_message_id', replyTo.id.toString());
      }
      
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/conversations/${selectedConv.id}/file-messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (res.ok) {
          const sentMessage = await res.json();
          sentMessage.status = 'delivered';
          setMessages(prev => prev.map(m => m.id === tempId ? sentMessage : m));
        } else {
          console.error('Failed to send file message', await res.text());
          setMessages(prev => prev.filter(m => m.id !== tempId));
        }
      } catch (err) {
        console.error(err);
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    };

    if (fileToSend) {
      await sendFileMsg(fileToSend, replyTarget);
    }
    
    if (messageText.trim()) {
      await sendText(messageText, fileToSend ? null : replyTarget);
    }
  };

  const submitReaction = async (msgId: number | string, emoji: string) => {
    if (typeof msgId === 'string' || !token) return;
    setReactionPopoverId(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/messages/${msgId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ emoji })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: data.reactions } : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeReaction = async (msgId: number | string) => {
    if (typeof msgId === 'string' || !token) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/messages/${msgId}/reactions`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: data.reactions } : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Modal handlers
  const openNewChatModal = () => {
    setShowModal(true);
    setSelectedUserIds([]);
    setGroupName('');
    fetch('http://127.0.0.1:8000/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setAllUsers(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Failed to fetch users', err));
  };

  const toggleUserSelect = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const createConversation = async () => {
    if (selectedUserIds.length === 0) return;
    if (selectedUserIds.length > 1 && !groupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    try {
      const isGroup = selectedUserIds.length > 1;
      const res = await fetch('http://127.0.0.1:8000/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: isGroup ? 'group' : 'direct',
          participant_ids: selectedUserIds,
          ...(isGroup && { name: groupName.trim() })
        })
      });

      if (res.ok) {
        const newConv = await res.json();
        fetchConversations();
        
        // Find it in the newly fetched list or just set it
        // We'll set a temporary one, the next fetchConversations will update it properly
        setSelectedConv({
          id: newConv.id,
          type: newConv.type,
          name: newConv.type === 'group' ? newConv.name : (allUsers.find(u => u.id === selectedUserIds[0])?.username || 'Unknown'),
          users: []
        });
        
        setShowModal(false);
      } else {
        console.error('Failed to create conversation', await res.text());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const uploadVoiceMessage = async (blob: Blob, duration: number, waveform?: number[] | null) => {
    if (!token || !selectedConv) return;
    
    const formData = new FormData();
    formData.append('audio', blob, 'voice.webm');
    formData.append('duration', duration.toString());
    if (waveform) {
      formData.append('waveform', JSON.stringify(waveform));
    }
    if (replyingTo) {
      formData.append('reply_to_message_id', replyingTo.id.toString());
    }
    
    setReplyingTo(null);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/conversations/${selectedConv.id}/voice-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (res.ok) {
        const sentMessage = await res.json();
        sentMessage.status = 'delivered';
        setMessages(prev => [...prev, sentMessage]);
      } else {
        console.error('Failed to send voice message', await res.text());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 119) {
            stopRecordingAndSend();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (err) {
      console.error(err);
      setMicError("Microphone access denied");
      setTimeout(() => setMicError(null), 3000);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const stopRecordingAndSend = () => {
    if (mediaRecorderRef.current && isRecording) {
      const durationToUpload = recordingDuration + 1; // approximation
      
      mediaRecorderRef.current.onstop = () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const generateWaveform = async (blob: Blob) => {
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            const rawData = audioBuffer.getChannelData(0); // Left channel
            const samples = 40; 
            const blockSize = Math.floor(rawData.length / samples);
            const filteredData = [];
            for (let i = 0; i < samples; i++) {
              let blockStart = blockSize * i;
              let sum = 0;
              for (let j = 0; j < blockSize; j++) {
                sum = sum + Math.abs(rawData[blockStart + j]);
              }
              filteredData.push(sum / blockSize);
            }
            
            const max = Math.max(...filteredData);
            const normalizedData = filteredData.map(n => Math.max(0.1, n / max));
            
            return normalizedData;
          } catch (e) {
            console.error("Failed to generate waveform", e);
            return null;
          }
        };

        generateWaveform(audioBlob).then(waveform => {
          uploadVoiceMessage(audioBlob, durationToUpload, waveform);
        });
      };
      
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleDownload = async (e: React.MouseEvent, msgId: number, filename: string, fallbackUrl: string) => {
    e.stopPropagation();
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/messages/${msgId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed', err);
      // Fallback
      window.open(fallbackUrl, '_blank');
    }
  };

  const getTypingText = (convId: number) => {
    const users = typingUsers[convId];
    if (!users) return null;
    const names = Object.values(users);
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names.length} people are typing...`;
  };

  const requestNotificationPermission = async () => {
    try {
      await Notification.requestPermission();
      setShowNotificationPrompt(false);
    } catch (err) {
      console.error(err);
    }
  };

  const dismissNotificationPrompt = () => {
    localStorage.setItem('notifications_dismissed', 'true');
    setShowNotificationPrompt(false);
  };

  if (!token || !myId) return <div className="min-h-screen flex items-center justify-center text-text-muted">Loading...</div>;

  return (
    <div className="min-h-screen flex font-sans bg-[var(--theme-bg)] text-[var(--theme-text)]">
      
      {/* LEFT SIDEBAR: Conversations */}
      <div className="w-[300px] bg-sidebar border-r border-border flex flex-col h-screen flex-shrink-0 z-10 relative">
        <div className="p-5 pb-3 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-700 to-violet-500 flex items-center justify-center shadow-md p-1">
              <Image src="/icon.png" alt="Ripple Icon" width={32} height={32} priority className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-text mt-0.5">Ripple</h1>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={openNewChatModal}
              className="p-1.5 rounded-xl bg-primary-button text-white shadow-sm hover:opacity-90 transition-opacity"
              aria-label="New Chat"
            >
              <Plus size={18} />
            </button>
            <button 
              onClick={toggleTheme}
              className="p-1.5 rounded-xl text-text-muted hover:bg-hover transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-xl text-text-muted hover:bg-hover transition-colors"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Search & Connection Status */}
        <div className="px-5 py-3 flex flex-col gap-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text">Chats</h2>
            {isConnected && (
              <div className="flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Connected</span>
              </div>
            )}
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-hover text-text text-sm rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {['all', 'direct', 'group'].map((f) => (
              <button 
                key={f}
                onClick={() => setFilterType(f as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filterType === f ? 'bg-primary-button text-white shadow-sm' : 'bg-hover text-text-muted hover:text-text'}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <button 
              onClick={() => setFilterType('unread')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filterType === 'unread' ? 'bg-primary-button text-white shadow-sm' : 'bg-hover text-text-muted hover:text-text'}`}
            >
              Unread
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          {conversations.filter(conv => {
            if (searchQuery.trim() !== '') {
              if (!conv.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            }
            if (filterType === 'direct' && conv.type !== 'direct') return false;
            if (filterType === 'group' && conv.type !== 'group') return false;
            if (filterType === 'unread' && (!conv.unread_count || conv.unread_count <= 0)) return false;
            return true;
          }).map(conv => {
            const isActive = selectedConv?.id === conv.id;
            const isGroup = conv.type === 'group';
            return (
              <div 
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`mx-3 my-1 p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-colors group relative ${
                  isActive 
                    ? 'bg-primary/10' 
                    : 'hover:bg-hover'
                }`}
              >
                <div className="relative">
                  {isGroup ? (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary bg-primary/10 flex-shrink-0">
                      <Users size={20} />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${getAvatarColor(conv.name)}`}>
                      {conv.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {!isGroup && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-gray-400 border-2 border-sidebar rounded-full" title="Offline" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="font-semibold text-text truncate leading-tight">{conv.name}</h3>
                      {conv.is_pinned && <Pin size={12} className="text-text-muted flex-shrink-0 fill-current" />}
                      {conv.is_muted && <BellOff size={12} className="text-text-muted flex-shrink-0" />}
                    </div>
                    {!!conv.unread_count && conv.unread_count > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0 ${conv.is_muted ? 'bg-black/20 dark:bg-white/20 text-text-muted' : 'bg-primary text-white'}`}>
                        {conv.unread_count > 99 ? '99+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); setContextMenuId(contextMenuId === conv.id ? null : conv.id); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-surface md:bg-transparent shadow-sm md:shadow-none"
                >
                  <MoreVertical size={16} />
                </button>

                {contextMenuId === conv.id && (
                  <div 
                    className="absolute right-10 top-1/2 -translate-y-1/2 bg-surface border border-border shadow-lg rounded-lg py-1 w-32 z-50 flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      onClick={(e) => togglePin(e, conv)} 
                      className="text-left px-3 py-1.5 text-sm text-text hover:bg-hover flex items-center gap-2"
                    >
                      <Pin size={14} /> {conv.is_pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button 
                      onClick={(e) => toggleMute(e, conv)} 
                      className="text-left px-3 py-1.5 text-sm text-text hover:bg-hover flex items-center gap-2"
                    >
                      <BellOff size={14} /> {conv.is_muted ? 'Unmute' : 'Mute'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {conversations.length === 0 && (
            <p className="p-4 text-sm text-text-muted text-center mt-4">No conversations yet.</p>
          )}
        </div>

        {/* Current User Indicator */}
        {myUsername && (
          <div className="p-4 border-t border-border bg-sidebar flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${getAvatarColor(myUsername)}`}>
              {myUsername.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Logged in as</p>
              <p className="text-sm font-bold text-text truncate">{myUsername}</p>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT MAIN AREA: Chat */}
      <div className="flex-1 flex flex-col h-screen min-w-0 relative">
        {showNotificationPrompt && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-surface border border-border shadow-lg rounded-xl p-3 flex items-center gap-4 text-sm animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex-1 min-w-[200px]">
              <p className="font-semibold text-text">Enable notifications?</p>
              <p className="text-text-muted text-xs mt-0.5">Get alerts for new messages when you're away.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={dismissNotificationPrompt} className="px-3 py-1.5 rounded-lg text-text-muted hover:bg-hover font-medium transition-colors">Not now</button>
              <button onClick={requestNotificationPermission} className="px-3 py-1.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors">Enable</button>
            </div>
          </div>
        )}
        
        {!selectedConv ? (
          // Placeholder empty state
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-4 text-primary">
              <MessageSquare size={32} strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-text mb-2">Your Messages</h2>
            <p className="text-text-muted text-center max-w-sm">
              Select a conversation to start chatting.
            </p>
          </div>
        ) : (
          // Active chat UI
          <>
            <div className="bg-surface border-b border-border px-6 py-4 flex items-center gap-3 z-10 h-[72px] flex-shrink-0 shadow-sm">
              {selectedConv.type === 'group' ? (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary bg-primary/10 flex-shrink-0">
                  <Users size={20} />
                </div>
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${getAvatarColor(selectedConv.name)}`}>
                  {selectedConv.name.charAt(0).toUpperCase()}
                </div>
              )}
              <h1 className="text-lg font-bold text-text truncate">
                {selectedConv.name}
              </h1>

              <div className="flex items-center gap-1.5 ml-auto">
                <button className="p-2 rounded-full text-text-muted hover:bg-hover transition-colors" title="Search">
                  <Search size={20} />
                </button>
                <button className="p-2 rounded-full text-text-muted hover:bg-hover transition-colors group relative" title="Voice Call">
                  <Phone size={20} />
                  <span className="absolute top-full mt-2 right-0 bg-sidebar border border-border text-text text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-sm pointer-events-none">Coming soon</span>
                </button>
                <button className="p-2 rounded-full text-text-muted hover:bg-hover transition-colors group relative" title="Video Call">
                  <Video size={20} />
                  <span className="absolute top-full mt-2 right-0 bg-sidebar border border-border text-text text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-sm pointer-events-none">Coming soon</span>
                </button>
                <button className="p-2 rounded-full text-text-muted hover:bg-hover transition-colors" title="Info">
                  <Info size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5">
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === myId;
                const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const showSender = selectedConv.type === 'group' && !isMe;

                return (
                  <div key={msg.id || idx} id={`message-${msg.id}`} className={`group flex flex-col max-w-[85%] sm:max-w-[70%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                    {showSender && msg.sender && (
                      <span className="text-xs font-semibold text-text-muted mb-1 ml-1">{msg.sender.username}</span>
                    )}
                    
                    <div className="flex items-center gap-2 max-w-full">
                      {isMe && (
                        <div className={`flex items-center transition-opacity ${reactionPopoverId === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <button onClick={() => setReplyingTo(msg)} className="p-1.5 text-text-muted hover:text-text hover:bg-hover rounded-full flex-shrink-0" title="Reply">
                            <Reply size={16} />
                          </button>
                          <div className="relative">
                            <button onClick={() => setReactionPopoverId(reactionPopoverId === msg.id ? null : msg.id)} className="p-1.5 text-text-muted hover:text-text hover:bg-hover rounded-full flex-shrink-0" title="React">
                              <SmilePlus size={16} />
                            </button>
                            {reactionPopoverId === msg.id && (
                              <div className="absolute right-0 bottom-full mb-2 bg-surface border border-border shadow-lg rounded-full px-2 py-1.5 flex items-center gap-2 z-50">
                                {reactionEmojis.map(emoji => (
                                  <button key={emoji} onClick={() => submitReaction(msg.id, emoji)} className="hover:scale-125 transition-transform text-lg leading-none">{emoji}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-col min-w-0 max-w-full">
                        {/* Quoted Block */}
                        {msg.reply_to && (
                          <div 
                            onClick={() => {
                              const el = document.getElementById(`message-${msg.reply_to.id}`);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                el.classList.add('bg-primary/20', 'rounded-xl', 'transition-colors', 'duration-500');
                                setTimeout(() => el.classList.remove('bg-primary/20'), 1500);
                              }
                            }}
                            className={`mb-1.5 px-3 py-2 rounded-lg border-l-4 border-primary bg-black/5 dark:bg-white/5 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex flex-col ${isMe ? 'self-end text-left' : 'self-start text-left'}`}
                          >
                            <span className="text-[11px] font-bold text-primary">{msg.reply_to.username}</span>
                            <span className="text-xs text-text-muted truncate max-w-[200px]">{msg.reply_to.snippet}</span>
                          </div>
                        )}
                        
                        <div 
                          className={`shadow-sm ${
                            msg.type === 'voice' ? 'p-3' : (msg.type === 'image' ? 'p-1.5' : (msg.type === 'file' ? 'p-3 pr-4' : 'px-5 py-3'))
                          } ${
                            isMe 
                              ? 'bg-primary text-white rounded-3xl rounded-tr-sm' 
                              : 'bg-surface text-text border border-border rounded-3xl rounded-tl-sm'
                          }`}
                        >
                          {msg.type === 'voice' && msg.voice_url ? (
                            <AudioPlayer url={msg.voice_url} duration={msg.voice_duration || 0} isMe={isMe} waveform={msg.voice_waveform} />
                          ) : msg.type === 'image' && msg.file_url ? (
                            <div className="relative group cursor-pointer max-w-[280px] sm:max-w-sm rounded-[20px] overflow-hidden bg-black/10">
                              <img 
                                src={msg.file_url} 
                                alt={msg.file_name || 'Attachment'} 
                                className="w-full max-h-[300px] object-cover hover:opacity-95 transition-opacity" 
                                onClick={() => window.open(msg.file_url, '_blank')}
                              />
                              <button
                                onClick={(e) => handleDownload(e, msg.id, msg.file_name || 'image.jpg', msg.file_url)}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
                                aria-label="Download image"
                                title="Download image"
                              >
                                <Download size={16} />
                              </button>
                            </div>
                          ) : msg.type === 'file' && msg.file_url ? (
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                                <FileText size={20} />
                              </div>
                              <div className="flex-1 min-w-0 max-w-[180px]">
                                <p className="text-sm font-semibold truncate leading-tight">{msg.file_name}</p>
                                <p className={`text-xs mt-0.5 ${isMe ? 'text-white/80' : 'text-text-muted'}`}>{formatFileSize(msg.file_size || 0)}</p>
                              </div>
                              <button 
                                onClick={(e) => handleDownload(e, msg.id, msg.file_name || 'document', msg.file_url)}
                                className={`ml-1 p-2 rounded-full transition-colors flex-shrink-0 ${isMe ? 'hover:bg-white/20' : 'hover:bg-border hover:text-text'}`}
                                aria-label="Download"
                                title="Download file"
                              >
                                <Download size={18} />
                              </button>
                            </div>
                          ) : (
                            msg.body
                          )}
                        </div>
                        
                        {/* Reactions Pills */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className={`flex flex-wrap items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {Object.entries(msg.reactions).map(([emoji, userIds]: [string, any]) => {
                              const count = userIds.length;
                              if (count === 0) return null;
                              const hasReacted = userIds.includes(myId);
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => hasReacted ? removeReaction(msg.id) : submitReaction(msg.id, emoji)}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-colors ${
                                    hasReacted 
                                      ? 'bg-primary/20 border-primary/50 text-primary dark:text-white' 
                                      : 'bg-surface border-border text-text-muted hover:bg-hover'
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span>{count}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {!isMe && (
                        <div className={`flex items-center transition-opacity ${reactionPopoverId === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <div className="relative">
                            <button onClick={() => setReactionPopoverId(reactionPopoverId === msg.id ? null : msg.id)} className="p-1.5 text-text-muted hover:text-text hover:bg-hover rounded-full flex-shrink-0" title="React">
                              <SmilePlus size={16} />
                            </button>
                            {reactionPopoverId === msg.id && (
                              <div className="absolute left-0 bottom-full mb-2 bg-surface border border-border shadow-lg rounded-full px-2 py-1.5 flex items-center gap-2 z-50">
                                {reactionEmojis.map(emoji => (
                                  <button key={emoji} onClick={() => submitReaction(msg.id, emoji)} className="hover:scale-125 transition-transform text-lg leading-none">{emoji}</button>
                                ))}
                              </div>
                            )}
                          </div>
                          <button onClick={() => setReplyingTo(msg)} className="p-1.5 text-text-muted hover:text-text hover:bg-hover rounded-full flex-shrink-0" title="Reply">
                            <Reply size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="text-[11px] font-medium text-text-muted mt-1.5 mx-1 flex items-center gap-1 justify-end">
                      {time}
                      {isMe && (
                        msg.status === 'read' ? (
                          <CheckCheck size={14} className="text-primary" />
                        ) : msg.status === 'delivered' ? (
                          <Check size={14} className="text-text-muted opacity-80" />
                        ) : (
                          <Clock size={12} className="text-text-muted opacity-50" />
                        )
                      )}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 sm:p-6 flex-shrink-0 relative">
              {getTypingText(selectedConv.id) && (
                <div className="max-w-5xl mx-auto mb-2 px-2 flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs font-medium text-text-muted italic">{getTypingText(selectedConv.id)}</span>
                </div>
              )}
              {replyingTo && (
                <div className="max-w-5xl mx-auto mb-3 flex items-center justify-between gap-3 bg-black/5 dark:bg-white/5 border-l-4 border-primary rounded-r-xl p-3 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Reply size={14} className="text-primary" />
                      <span className="text-xs font-bold text-primary">Replying to {replyingTo.sender?.username || 'Unknown'}</span>
                    </div>
                    <p className="text-sm text-text-muted truncate">
                      {replyingTo.type === 'voice' ? 'Voice message' : replyingTo.body}
                    </p>
                  </div>
                  <button 
                    onClick={() => setReplyingTo(null)}
                    className="p-1.5 text-text-muted hover:text-text hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {selectedFile && (
                <div className="max-w-5xl mx-auto mb-3 flex items-center justify-between gap-3 bg-black/5 dark:bg-white/5 border-l-4 border-primary rounded-r-xl p-3 shadow-sm">
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    {selectedFile.type.startsWith('image/') ? (
                      <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-black/10">
                        <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded flex items-center justify-center bg-primary/10 text-primary flex-shrink-0">
                        <FileText size={20} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{selectedFile.name}</p>
                      <p className="text-xs text-text-muted">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 text-text-muted hover:text-text hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {isRecording ? (
                <div className="flex items-center justify-between gap-3 max-w-5xl mx-auto bg-surface border border-primary/50 rounded-full p-2 pr-2.5 pl-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-text font-medium min-w-[48px]">{formatDuration(recordingDuration)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={cancelRecording}
                      className="w-10 h-10 rounded-full bg-border hover:bg-border/80 text-text flex items-center justify-center transition-colors"
                      aria-label="Cancel recording"
                    >
                      <X size={18} />
                    </button>
                    <button 
                      onClick={stopRecordingAndSend}
                      className="w-10 h-10 rounded-full bg-primary-button hover:opacity-90 text-white flex items-center justify-center transition-opacity"
                      aria-label="Send voice message"
                    >
                      <Check size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={sendMessage} className="flex items-center gap-2 max-w-5xl mx-auto bg-surface border border-border rounded-full p-1.5 pr-2 pl-4 shadow-sm focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                  <input 
                    type="text"
                    className="flex-1 bg-transparent py-2.5 focus:outline-none text-text min-w-0"
                    placeholder="Message..."
                    value={newMessage}
                    onChange={handleTyping}
                  />
                  {micError && <span className="text-[11px] font-medium text-red-500 bg-red-500/10 px-2 py-1 rounded whitespace-nowrap">{micError}</span>}
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-text-muted hover:text-text transition-colors"
                    aria-label="Attach file"
                  >
                    <Paperclip size={20} />
                  </button>

                  {!newMessage.trim() && (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="p-2 text-text-muted hover:text-text transition-colors"
                      aria-label="Record voice message"
                    >
                      <Mic size={20} />
                    </button>
                  )}

                  <button 
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedFile)}
                    className="w-10 h-10 rounded-full bg-primary-button hover:opacity-90 disabled:bg-border disabled:text-text-muted text-white flex items-center justify-center transition-opacity flex-shrink-0 ml-1"
                    aria-label="Send message"
                  >
                    <Send size={18} className={(newMessage.trim() || selectedFile) ? 'ml-0.5' : ''} />
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>

      {/* New Chat Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-text">New Chat</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-text-muted hover:bg-hover transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-text-muted">Select Participants</label>
                <div className="space-y-2">
                  {allUsers.map(user => (
                    <label key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-hover cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-primary rounded border-border focus:ring-primary accent-primary"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleUserSelect(user.id)}
                      />
                      <span className="text-text font-medium">{user.username}</span>
                    </label>
                  ))}
                  {allUsers.length === 0 && <p className="text-sm text-text-muted">No other users found.</p>}
                </div>
              </div>
              
              {selectedUserIds.length > 1 && (
                <div className="mt-6 border-t border-border pt-4">
                  <label className="block text-sm font-semibold mb-2 text-text-muted">Group Name</label>
                  <input 
                    type="text" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full border-b-2 border-border py-2 px-1 bg-transparent focus:outline-none focus:border-primary transition-colors text-text"
                    placeholder="Enter group name..."
                    required 
                  />
                </div>
              )}
            </div>

            <div className="p-5 border-t border-border">
              <button 
                onClick={createConversation}
                disabled={selectedUserIds.length === 0 || (selectedUserIds.length > 1 && !groupName.trim())}
                className="w-full bg-primary-button hover:opacity-90 disabled:bg-border disabled:text-text-muted text-white font-bold py-3 px-4 rounded-lg transition-opacity"
              >
                {selectedUserIds.length > 1 ? 'Create Group' : 'Start Chat'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
