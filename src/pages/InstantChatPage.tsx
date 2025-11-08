import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Pencil, Trash2, Plus, ChevronLeft, Check, X, Wifi, WifiOff, RefreshCw, Send } from 'lucide-react';
import { DateTime } from 'luxon';
import {
  useChatRooms,
  useMessages,
  useStaff,
  useSendMessage,
  useCreateGroup,
  useEditMessage,
  useDeleteMessage,
  useSocket,
  useUnreadCounts,
  useReadMessages,
} from '../hooks/useChat';

interface ChatRoom {
  id: number;
  name: string | null;
  is_group: boolean;
  created_by: number;
  created_at: string;
}

interface Message {
  id?: number;
  room_id: number;
  sender_id: number;
  sender_name?: string;
  message: string;
  sent_at?: string;
  is_read?: boolean;
}

// Utility function to format time consistently using Luxon
const formatTime = (timeString: string): string => {
  if (!timeString) return 'N/A';
  
  try {
    let dt: DateTime;
    
    if (timeString.includes('T') && timeString.includes('Z')) {
      dt = DateTime.fromISO(timeString, { zone: 'utc' });
    } else if (timeString.includes(' ')) {
      dt = DateTime.fromFormat(timeString, 'yyyy-MM-dd HH:mm:ss.SSS', { zone: 'utc' });
      if (!dt.isValid) {
        dt = DateTime.fromFormat(timeString, 'yyyy-MM-dd HH:mm:ss', { zone: 'utc' });
      }
    } else {
      dt = DateTime.fromISO(timeString, { zone: 'utc' });
    }
    
    if (!dt.isValid) {
      console.error('Invalid date:', dt.invalidReason, dt.invalidExplanation);
      return 'N/A';
    }
    
    return dt.toFormat('MMM dd, yyyy, HH:mm');
  } catch (error) {
    console.error('Error formatting time with Luxon:', error);
    return 'N/A';
  }
};

// Utility function to format time in a more compact way for chat messages
const formatMessageTime = (timeString: string): string => {
  if (!timeString) return 'N/A';
  
  try {
    let dt: DateTime;
    
    if (timeString.includes('T') && timeString.includes('Z')) {
      dt = DateTime.fromISO(timeString, { zone: 'utc' });
    } else if (timeString.includes(' ')) {
      dt = DateTime.fromFormat(timeString, 'yyyy-MM-dd HH:mm:ss.SSS', { zone: 'utc' });
      if (!dt.isValid) {
        dt = DateTime.fromFormat(timeString, 'yyyy-MM-dd HH:mm:ss', { zone: 'utc' });
      }
    } else {
      dt = DateTime.fromISO(timeString, { zone: 'utc' });
    }
    
    if (!dt.isValid) {
      return 'N/A';
    }
    
    const now = DateTime.now();
    const diffInDays = now.diff(dt, 'days').days;
    
    let formatted: string;
    
    if (diffInDays < 1) {
      formatted = dt.toFormat('HH:mm');
    } else if (diffInDays < 2) {
      formatted = `Yesterday, ${dt.toFormat('HH:mm')}`;
    } else if (diffInDays < 7) {
      formatted = dt.toFormat('EEE, HH:mm');
    } else {
      formatted = dt.toFormat('MMM dd, HH:mm');
    }
    
    return formatted;
  } catch (error) {
    console.error('Error formatting message time with Luxon:', error);
    return 'N/A';
  }
};

const InstantChatPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  // Use React Query hooks
  const { data: rooms = [], isLoading: roomsLoading, error: roomsError, refetch: refetchRooms } = useChatRooms();
  const { data: messages = [], isLoading: messagesLoading, error: messagesError, refetch: refetchMessages } = useMessages(selectedRoom?.id || null);
  const { data: allStaff = [], error: staffError } = useStaff();
  const { unreadCounts, markRoomAsRead, getTotalUnreadCount, updateRoomUnreadCount } = useUnreadCounts(user?.id);
  const { isMessageRead, markMessageAsRead, markRoomMessagesAsRead } = useReadMessages(user?.id);
  
  // Socket connection for real-time updates (WebSocket-based)
  const { isConnected, joinRoom, leaveRoom } = useSocket(user?.id);
  
  // Mutations
  const sendMessageMutation = useSendMessage();
  const createGroupMutation = useCreateGroup();
  const editMessageMutation = useEditMessage();
  const deleteMessageMutation = useDeleteMessage();

  // Handle room selection
  const handleRoomSelect = (room: ChatRoom) => {
    if (selectedRoom) {
      leaveRoom(selectedRoom.id);
    }
    setSelectedRoom(room);
    joinRoom(room.id);
    
    // Mark all messages in the room as read when selecting it
    // This will be handled by the useEffect when messages load
  };

  // Handle retry connection
  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      await refetchRooms();
      await refetchMessages();
      setToast('Connection restored!');
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      setToast('Failed to restore connection. Please try again.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsRetrying(false);
    }
  };

  // Mark all rooms as read
  const markAllRoomsAsRead = () => {
    rooms.forEach((room: ChatRoom) => {
      markRoomAsRead(room.id);
    });
    setToast('All messages marked as read!');
    setTimeout(() => setToast(null), 2000);
  };

  // Mark current room as read with all message IDs
  const markCurrentRoomAsRead = () => {
    if (selectedRoom && messages.length > 0) {
      // Only mark messages from other users as read
      const messageIds = messages
        .filter(msg => msg.sender_id !== user?.id && msg.id)
        .map(msg => msg.id!)
        .filter(id => id);
        
      if (messageIds.length > 0) {
        markRoomMessagesAsRead(selectedRoom.id, messageIds);
        markRoomAsRead(selectedRoom.id, messageIds);
        // Update unread count immediately
        updateRoomUnreadCount(selectedRoom.id);
        setToast('Messages marked as read!');
        setTimeout(() => setToast(null), 2000);
      } else {
        setToast('No unread messages!');
        setTimeout(() => setToast(null), 2000);
      }
    }
  };

  // Track the last processed message count to avoid unnecessary updates
  const lastProcessedCountRef = useRef<number>(0);
  const lastRoomIdRef = useRef<number | null>(null);

  // Scroll to bottom on new message and mark messages as read when they come into view
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Only mark as read when room changes or new messages arrive (not on every render)
    if (selectedRoom && messages.length > 0) {
      const roomChanged = lastRoomIdRef.current !== selectedRoom.id;
      const newMessages = messages.length > lastProcessedCountRef.current;
      
      // Only process if room changed or we have new messages
      if (roomChanged || newMessages) {
        // Only mark messages from other users as read
        const messageIds = messages
          .filter(msg => msg.sender_id !== user?.id && msg.id)
          .map(msg => msg.id!)
          .filter(id => id);
          
        if (messageIds.length > 0) {
          markRoomMessagesAsRead(selectedRoom.id, messageIds);
          // Update unread count immediately
          updateRoomUnreadCount(selectedRoom.id);
          lastProcessedCountRef.current = messages.length;
          lastRoomIdRef.current = selectedRoom.id;
        }
      }
    } else if (!selectedRoom) {
      // Reset when no room is selected
      lastProcessedCountRef.current = 0;
      lastRoomIdRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, selectedRoom?.id, user?.id]);

  // Mark messages as read when they come into view and update unread count
  useEffect(() => {
    if (!messages.length || !selectedRoom) return;

    const messageElements = document.querySelectorAll('[data-message-id]');
    
    const observer = new IntersectionObserver(
      (entries) => {
        let hasNewReadMessages = false;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = parseInt(entry.target.getAttribute('data-message-id') || '0');
            if (messageId > 0) {
              const message = messages.find(m => m.id === messageId);
              // Only mark as read if it's not from current user and not already read
              if (message && message.sender_id !== user?.id && !isMessageRead(message)) {
                markMessageAsRead(messageId);
                hasNewReadMessages = true;
              }
            }
          }
        });
        
        // Update unread count if any messages were marked as read
        if (hasNewReadMessages && selectedRoom) {
          setTimeout(() => {
            updateRoomUnreadCount(selectedRoom.id);
          }, 100);
        }
      },
      { threshold: 0.1 }
    );

    messageElements.forEach((el) => observer.observe(el));

    return () => {
      messageElements.forEach((el) => observer.unobserve(el));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, selectedRoom?.id, user?.id]);

  // Update localStorage with unread count for dashboard badge
  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce((total, count) => total + count, 0);
    localStorage.setItem('instant_chat_unread', totalUnread.toString());
  }, [unreadCounts]);

  // Show connection status notifications (only on state change, not repeatedly)
  const prevConnectedRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    // Only show toast if connection state actually changed
    if (prevConnectedRef.current !== undefined && prevConnectedRef.current !== isConnected) {
      if (isConnected) {
        setToast('Connected to instant chat server');
        setTimeout(() => setToast(null), 2000);
      } else {
        setToast('Disconnected from instant chat server');
        setTimeout(() => setToast(null), 3000);
      }
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected]);

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom || !user) return;
    
    const messageText = newMessage.trim();
    setNewMessage('');
    
    try {
      await sendMessageMutation.mutateAsync({
        roomId: selectedRoom.id,
        message: messageText,
        sender_id: user.id,
        sender_name: user.username || 'You',
      });
      setToast('Message sent instantly!');
      setTimeout(() => setToast(null), 1500);
    } catch (error) {
      setToast('Failed to send message. Please try again.');
      setTimeout(() => setToast(null), 3000);
      setNewMessage(messageText); // Restore message on failure
    }
  };

  // Create group chat
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedStaff.length === 0) return;
    
    try {
      const res = await createGroupMutation.mutateAsync({
        name: groupName,
        memberIds: selectedStaff,
      });
      
      setShowCreateModal(false);
      setGroupName('');
      setSelectedStaff([]);
      
      const newRoomId = res.roomId;
      const newRoom = rooms.find((r: ChatRoom) => r.id === newRoomId);
      if (newRoom) {
        handleRoomSelect(newRoom);
      }
      
      setToast('Group chat created!');
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      setToast('Failed to create group chat. Please try again.');
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Edit message handler
  const handleEditMessage = (msg: Message) => {
    setEditingMessageId(msg.id!);
    setEditMessageText(msg.message);
  };

  const handleEditMessageSave = async (msg: Message) => {
    try {
      await editMessageMutation.mutateAsync({
        messageId: msg.id!,
        message: editMessageText,
      });
      setEditingMessageId(null);
      setEditMessageText('');
      setToast('Message updated!');
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      setToast('Failed to update message. Please try again.');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleEditMessageCancel = () => {
    setEditingMessageId(null);
    setEditMessageText('');
  };

  // Delete message handler
  const handleDeleteMessage = async (msg: Message) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await deleteMessageMutation.mutateAsync(msg.id!);
      setToast('Message deleted!');
      setTimeout(() => setToast(null), 2000);
    } catch (error) {
      setToast('Failed to delete message. Please try again.');
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Filter rooms based on search term
  const filteredRooms = rooms.filter((room: ChatRoom) => 
    room.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (room.is_group ? 'group chat' : 'private chat').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[85vh] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-2xl overflow-hidden border border-indigo-200">
      {/* Sidebar: Room List */}
      <div className={`w-full md:w-80 bg-white border-r border-indigo-100 ${selectedRoom ? 'hidden md:block' : 'block'}`}>
        <div className="p-3 border-b border-indigo-100 bg-gradient-to-r from-blue-500 to-indigo-600">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Instant Chat</h2>
              {getTotalUnreadCount() > 0 && (
                <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[24px] text-center font-semibold animate-pulse">
                  {getTotalUnreadCount()}
                </div>
              )}
              <div className="flex items-center gap-1" title={isConnected ? "Connected" : "Disconnected"}>
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-300 animate-pulse" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-300" />
                )}
              </div>
            </div>
            <div className="flex gap-1.5">
              <button 
                className="bg-white/20 text-white p-1.5 rounded-full hover:bg-white/30 transition-all disabled:opacity-50 backdrop-blur-sm"
                onClick={handleRetryConnection}
                disabled={isRetrying}
                title="Refresh messages"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              </button>
              {getTotalUnreadCount() > 0 && (
                <button 
                  className="bg-white/20 text-white p-1.5 rounded-full hover:bg-white/30 transition-all backdrop-blur-sm"
                  onClick={markAllRoomsAsRead}
                  title="Mark all as read"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              <button 
                className="bg-white/20 text-white p-1.5 rounded-full hover:bg-white/30 transition-all backdrop-blur-sm"
                onClick={() => setShowCreateModal(true)}
                title="Create group"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full p-1.5 pl-7 text-sm rounded-lg bg-white/90 backdrop-blur-sm border-none focus:ring-2 focus:ring-white shadow-sm text-gray-700 placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-2 top-2 h-3.5 w-3.5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100%-110px)]">
          {roomsLoading ? (
            <div className="p-3 text-center text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1.5 text-indigo-500" />
              <p className="text-xs">Loading rooms...</p>
            </div>
          ) : roomsError ? (
            <div className="p-3 text-center text-red-500">
              <WifiOff className="w-5 h-5 mx-auto mb-1.5" />
              <p className="text-xs mb-1.5">Failed to load rooms</p>
              <button 
                onClick={handleRetryConnection}
                className="text-indigo-600 hover:underline text-xs font-medium"
              >
                Retry
              </button>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-3 text-center text-gray-500">
              <p className="text-xs">No chats found {searchTerm && `matching "${searchTerm}"`}</p>
            </div>
          ) : (
            filteredRooms.map((room: ChatRoom) => (
              <div
                key={room.id}
                className={`p-2.5 flex items-center border-b border-gray-100 cursor-pointer hover:bg-indigo-50 transition-all ${
                  selectedRoom?.id === room.id ? 'bg-indigo-100 border-l-4 border-l-indigo-500' : ''
                }`}
                onClick={() => handleRoomSelect(room)}
              >
                <div className={`rounded-full w-10 h-10 flex items-center justify-center mr-2.5 font-semibold text-sm ${
                  room.is_group 
                    ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white' 
                    : 'bg-gradient-to-br from-blue-400 to-indigo-400 text-white'
                }`}>
                  {room.is_group ? 'G' : 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-800 text-xs truncate">
                      {room.is_group ? (room.name || 'Group Chat') : 'Private Chat'}
                    </div>
                    {unreadCounts[room.id] > 0 && (
                      <div className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-semibold ml-1">
                        {unreadCounts[room.id]}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                    {room.is_group ? `${room.name ? 'Group' : 'Direct'} conversation` : 'Private conversation'}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {room.created_at && formatTime(room.created_at)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            {/* Chat header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 flex items-center justify-between shadow-lg">
              <div className="flex items-center">
                <button 
                  className="md:hidden mr-2 text-white hover:text-indigo-100"
                  onClick={() => setSelectedRoom(null)}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className={`rounded-full w-10 h-10 flex items-center justify-center mr-2.5 font-semibold text-sm ${
                  selectedRoom.is_group 
                    ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white' 
                    : 'bg-gradient-to-br from-blue-300 to-indigo-300 text-white'
                }`}>
                  {selectedRoom.is_group ? 'G' : 'P'}
                </div>
                <div>
                  <h2 className="font-semibold text-white text-sm">
                    {selectedRoom.is_group ? (selectedRoom.name || 'Group Chat') : 'Private Chat'}
                  </h2>
                  <div className="text-[10px] text-indigo-100">
                    {unreadCounts[selectedRoom.id] > 0 
                      ? `${unreadCounts[selectedRoom.id]} new message${unreadCounts[selectedRoom.id] > 1 ? 's' : ''}` 
                      : 'All caught up'}
                  </div>
                </div>
              </div>
              
              {unreadCounts[selectedRoom.id] > 0 && (
                <button
                  onClick={markCurrentRoomAsRead}
                  className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/30 transition-all backdrop-blur-sm"
                >
                  Mark as Read
                </button>
              )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-3 bg-gradient-to-br from-blue-50 to-indigo-50">
              {messagesLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mb-2 text-indigo-500" />
                  <div className="text-xs">Loading messages...</div>
                </div>
              ) : messagesError ? (
                <div className="flex flex-col items-center justify-center h-full text-red-500">
                  <WifiOff className="w-6 h-6 mb-2" />
                  <div className="mb-2 text-xs">Failed to load messages</div>
                  <button 
                    onClick={handleRetryConnection}
                    className="text-indigo-600 hover:underline text-xs font-medium"
                  >
                    Retry
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <div className="mb-2 text-sm font-medium">No messages yet</div>
                  <div className="text-xs">Send a message to start the conversation</div>
                </div>
              ) : (
                messages.map((msg: Message, idx: number) => {
                  let canEditOrDelete = false;
                  if (msg.sender_id === user?.id) {
                    canEditOrDelete = messages.slice(idx + 1).every((m: Message) => m.sender_id === user?.id);
                  }
                  return (
                    <div 
                      key={idx} 
                      className={`mb-3 flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      data-message-id={msg.id}
                    >
                      <div className={`max-w-xs lg:max-w-md relative ${msg.sender_id === user?.id ? 'ml-auto' : 'mr-auto'}`}>
                        <div className={`px-3 py-2 rounded-xl shadow-lg ${
                          msg.sender_id === user?.id 
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-sm' 
                            : 'bg-white text-gray-800 rounded-bl-sm'
                        } ${!isMessageRead(msg) && msg.sender_id !== user?.id ? 'ring-2 ring-indigo-300' : ''}`}>
                          {msg.sender_id !== user?.id && (
                            <div className="text-[10px] font-semibold mb-1 flex items-center gap-1.5 text-indigo-600">
                              <span>{msg.sender_name || 'User'}</span>
                              {!isMessageRead(msg) && (
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" title="Unread"></span>
                              )}
                            </div>
                          )}
                          {editingMessageId === msg.id ? (
                            <div className="flex flex-col gap-1.5">
                              <input
                                className="border rounded-lg px-2.5 py-1.5 text-xs text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={editMessageText}
                                onChange={e => setEditMessageText(e.target.value)}
                                autoFocus
                              />
                              <div className="flex gap-1.5 justify-end">
                                <button 
                                  className="px-2.5 py-1 bg-gray-200 text-gray-800 rounded-lg text-xs flex items-center gap-1 hover:bg-gray-300 transition-all"
                                  onClick={handleEditMessageCancel}
                                >
                                  <X size={12} /> Cancel
                                </button>
                                <button 
                                  className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs flex items-center gap-1 hover:bg-indigo-700 transition-all"
                                  onClick={() => handleEditMessageSave(msg)}
                                >
                                  <Check size={12} /> Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="text-xs leading-relaxed">{msg.message}</div>
                              <div className={`text-[10px] mt-1 flex items-center justify-end gap-1.5 ${
                                msg.sender_id === user?.id ? 'text-indigo-100' : 'text-gray-500'
                              }`}>
                                <span>{msg.sent_at && formatMessageTime(msg.sent_at)}</span>
                                {msg.sender_id === user?.id && (
                                  <span className="flex items-center">
                                    {msg.is_read ? (
                                      <span className="text-green-300" title="Read">✓✓</span>
                                    ) : (
                                      <span className="text-indigo-200" title="Sent">✓</span>
                                    )}
                                  </span>
                                )}
                                {canEditOrDelete && (
                                  <div className="flex gap-1">
                                    <button 
                                      title="Edit" 
                                      onClick={() => handleEditMessage(msg)} 
                                      className="p-0.5 hover:bg-indigo-700 rounded-full transition-all"
                                    >
                                      <Pencil size={10} />
                                    </button>
                                    <button 
                                      title="Delete" 
                                      onClick={() => handleDeleteMessage(msg)} 
                                      className="p-0.5 hover:bg-indigo-700 rounded-full transition-all"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSend} className="bg-white p-2.5 border-t border-indigo-100 shadow-lg">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 border-2 border-indigo-200 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                />
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-2 rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <div className="max-w-md text-center">
              <div className="text-indigo-300 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Welcome to Instant Chat</h3>
              <p className="text-sm text-gray-500 mb-4">
                Select a chat from the sidebar or create a new group chat to start instant messaging
              </p>
              <button
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={() => setShowCreateModal(true)}
              >
                Create Group Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold">Create Group Chat</h3>
                <button 
                  className="text-white hover:text-indigo-100 transition-all"
                  onClick={() => setShowCreateModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-4">
              {staffError && (
                <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg mb-3 text-xs">
                  {staffError instanceof Error ? staffError.message : String(staffError)}
                </div>
              )}
              <form onSubmit={handleCreateGroup}>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Group Name</label>
                  <input
                    className="w-full border-2 border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Add Members</label>
                  <div className="max-h-48 overflow-y-auto border-2 border-indigo-100 rounded-lg p-2 bg-gray-50">
                    {allStaff.map((staff: any) => (
                      <div key={staff.id} className="flex items-center p-1.5 hover:bg-indigo-50 rounded-lg transition-all">
                        <input
                          type="checkbox"
                          id={`staff-${staff.id}`}
                          checked={selectedStaff.includes(staff.id)}
                          onChange={e => {
                            if (e.target.checked) setSelectedStaff(prev => [...prev, staff.id]);
                            else setSelectedStaff(prev => prev.filter(id => id !== staff.id));
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`staff-${staff.id}`} className="ml-2 block text-xs text-gray-700 cursor-pointer font-medium">
                          {staff.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button 
                    type="button" 
                    className="px-4 py-1.5 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all text-xs font-medium"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 text-xs font-medium shadow-lg"
                    disabled={!groupName.trim() || selectedStaff.length === 0 || createGroupMutation.isPending}
                  >
                    {createGroupMutation.isPending ? (
                      <div className="flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Creating...
                      </div>
                    ) : (
                      'Create Group'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg shadow-2xl z-50 animate-fade-in-out">
          <div className="flex items-center gap-1.5">
            <Check className="mr-1" size={16} />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstantChatPage;

