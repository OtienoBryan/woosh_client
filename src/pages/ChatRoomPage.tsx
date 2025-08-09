// NOTE: You may need to install socket.io-client: npm install socket.io-client
import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Pencil, Trash2, Plus, ChevronLeft, Check, X } from 'lucide-react';

import { API_BASE_URL, SOCKET_URL } from '../config/api';

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
}

interface Staff {
  id: number;
  name: string;
}

const ChatRoomPage: React.FC = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [staffError, setStaffError] = useState<string | null>(null);

  // Fetch chat rooms for user
  const fetchRooms = async () => {
    const token = localStorage.getItem('token');
          const res = await axios.get(`${API_BASE_URL}/chat/my-rooms`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setRooms(res.data);
  };

  // Fetch messages for a room
  const fetchMessages = async (roomId: number) => {
    const token = localStorage.getItem('token');
          const res = await axios.get(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMessages(res.data);
  };

  // Fetch all staff for group creation
  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/staff`, { withCredentials: true });
      setAllStaff(res.data);
      setStaffError(null);
    } catch (err: any) {
      setStaffError('Failed to load staff list. Please try again.');
      setAllStaff([]);
    }
  };

  // Initialize socket
  useEffect(() => {
    if (!user) return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [user]);

  // Join/leave room on selection
  useEffect(() => {
    if (!selectedRoom || !socketRef.current) return;
    socketRef.current.emit('joinRoom', selectedRoom.id);
    fetchMessages(selectedRoom.id);
    // Listen for new messages
    socketRef.current.on('newMessage', (msg: Message) => {
      if (msg.room_id === selectedRoom.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    return () => {
      socketRef.current?.emit('leaveRoom', selectedRoom.id);
      socketRef.current?.off('newMessage');
    };
    // eslint-disable-next-line
  }, [selectedRoom]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { fetchRooms(); fetchStaff(); }, []);

  // Mark chat last visited for dashboard badge
  useEffect(() => {
    // When page mounts or user interacts, update last visited timestamp
    const markVisited = () => {
      localStorage.setItem('chat_last_visited_ts', String(Date.now()));
    };
    markVisited();
    const onVisibility = () => { if (!document.hidden) markVisited(); };
    window.addEventListener('focus', markVisited);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', markVisited);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom || !user) return;
    // Emit to socket with correct property names
    socketRef.current?.emit('sendMessage', {
      roomId: selectedRoom.id,
      sender_id: user.id,
      sender_name: user.username || 'You',
      message: newMessage.trim(),
      sentAt: new Date().toISOString(),
    });
    // Save to backend
    const token = localStorage.getItem('token');
    await axios.post(`${API_URL}/chat/rooms/${selectedRoom.id}/messages`, { roomId: selectedRoom.id, message: newMessage }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setNewMessage('');
    // Show toast notification
    setToast('Message sent!');
    setTimeout(() => setToast(null), 2000);
  };

  // Create group chat
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedStaff.length === 0) return;
    const token = localStorage.getItem('token');
    const res = await axios.post(`${API_URL}/chat/rooms`, {
      name: groupName,
      is_group: true,
      memberIds: selectedStaff,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setShowCreateModal(false);
    setGroupName('');
    setSelectedStaff([]);
    // Fetch rooms and select the new one
    await fetchRooms();
    // Find the new room by id (from response) or by name
    const newRoomId = res.data.roomId;
    const newRoom = rooms.find(r => r.id === newRoomId) || (await axios.get(`${API_URL}/chat/my-rooms`, { headers: { Authorization: `Bearer ${token}` } })).data.find((r: any) => r.id === newRoomId);
    if (newRoom) setSelectedRoom(newRoom);
    // Show toast notification
    setToast('Group chat created!');
    setTimeout(() => setToast(null), 2000);
  };

  // Edit message handler
  const handleEditMessage = (msg: Message) => {
    setEditingMessageId(msg.id!);
    setEditMessageText(msg.message);
  };

  const handleEditMessageSave = async (msg: Message) => {
    const token = localStorage.getItem('token');
    await axios.patch(`${API_URL}/chat/messages/${msg.id}`, { message: editMessageText }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMessages((prev) => prev.map(m => m.id === msg.id ? { ...m, message: editMessageText } : m));
    setEditingMessageId(null);
    setEditMessageText('');
  };

  const handleEditMessageCancel = () => {
    setEditingMessageId(null);
    setEditMessageText('');
  };

  // Delete message handler
  const handleDeleteMessage = async (msg: Message) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/chat/messages/${msg.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMessages((prev) => prev.filter(m => m.id !== msg.id));
  };

  // Filter rooms based on search term
  const filteredRooms = rooms.filter(room => 
    room.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (room.is_group ? 'group chat' : 'private chat').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[85vh] bg-gray-50 rounded-lg shadow-lg overflow-hidden border border-gray-200">
      {/* Sidebar: Room List */}
      <div className={`w-full md:w-80 bg-white border-r ${selectedRoom ? 'hidden md:block' : 'block'}`}>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Messages</h2>
            <button 
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
              onClick={() => setShowCreateModal(true)}
              title="Create group"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full p-2 pl-8 rounded-lg bg-gray-100 border-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-2 top-3 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
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
          {filteredRooms.map(room => (
            <div
              key={room.id}
              className={`p-3 flex items-center border-b cursor-pointer hover:bg-gray-50 ${
                selectedRoom?.id === room.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
              onClick={() => setSelectedRoom(room)}
            >
              <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                {room.is_group ? 
                  <span className="font-medium">G</span> : 
                  <span className="font-medium">P</span>
                }
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">
                  {room.is_group ? (room.name || 'Group Chat') : 'Private Chat'}
                </div>
                <div className="text-xs text-gray-500">
                  {room.is_group ? `${room.name ? 'Group' : 'Direct'} chat` : 'One-to-one conversation'}
                </div>
              </div>
            </div>
          ))}
          {filteredRooms.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No chats found {searchTerm && `matching "${searchTerm}"`}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <>
            {/* Chat header */}
            <div className="bg-white p-4 border-b flex items-center">
              <button 
                className="md:hidden mr-2 text-gray-500 hover:text-gray-700"
                onClick={() => setSelectedRoom(null)}
              >
                <ChevronLeft size={20} />
              </button>
              <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                {selectedRoom.is_group ? 
                  <span className="font-medium">G</span> : 
                  <span className="font-medium">P</span>
                }
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">
                  {selectedRoom.is_group ? (selectedRoom.name || 'Group Chat') : 'Private Chat'}
                </h2>
                <div className="text-xs text-gray-500">
                  {messages.length > 0 ? `${messages.length} messages` : 'No messages yet'}
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <div className="mb-2">No messages yet</div>
                  <div className="text-sm">Send a message to start the conversation</div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  // Only allow edit/delete if there is no later message from another user
                  let canEditOrDelete = false;
                  if (msg.sender_id === user?.id) {
                    // Check if all later messages are from the same user
                    canEditOrDelete = messages.slice(idx + 1).every(m => m.sender_id === user.id);
                  }
                  return (
                    <div key={idx} className={`mb-4 flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md relative ${msg.sender_id === user?.id ? 'ml-auto' : 'mr-auto'}`}>
                        <div className={`px-4 py-3 rounded-2xl ${msg.sender_id === user?.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`}>
                          {msg.sender_id !== user?.id && (
                            <div className="text-sm font-semibold mb-1">
                              {msg.sender_name || 'User'}
                            </div>
                          )}
                          {editingMessageId === msg.id ? (
                            <div className="flex flex-col gap-2">
                              <input
                                className="border rounded px-3 py-2 text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={editMessageText}
                                onChange={e => setEditMessageText(e.target.value)}
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button 
                                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-300"
                                  onClick={handleEditMessageCancel}
                                >
                                  <X size={14} /> Cancel
                                </button>
                                <button 
                                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1 hover:bg-blue-700"
                                  onClick={() => handleEditMessageSave(msg)}
                                >
                                  <Check size={14} /> Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="text-sm">{msg.message}</div>
                              <div className={`text-xs mt-1 flex items-center justify-end ${msg.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                {msg.sent_at && new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {canEditOrDelete && (
                                  <div className="ml-2 flex gap-1">
                                    <button 
                                      title="Edit" 
                                      onClick={() => handleEditMessage(msg)} 
                                      className="p-1 hover:bg-blue-700 rounded-full"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button 
                                      title="Delete" 
                                      onClick={() => handleDeleteMessage(msg)} 
                                      className="p-1 hover:bg-blue-700 rounded-full"
                                    >
                                      <Trash2 size={14} />
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
            <form onSubmit={handleSend} className="bg-white p-4 border-t">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <button 
                  type="submit" 
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={!newMessage.trim()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md text-center">
              <div className="text-gray-400 mb-4">
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
                    strokeWidth={1}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No chat selected</h3>
              <p className="text-gray-500 mb-4">
                Select a chat from the sidebar or create a new group chat to start messaging
              </p>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Create Group Chat</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowCreateModal(false)}
                >
                  <X size={24} />
                </button>
              </div>
              {staffError && (
                <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 text-sm">{staffError}</div>
              )}
              <form onSubmit={handleCreateGroup}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                  <input
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Add Members</label>
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                    {allStaff.map(staff => (
                      <div key={staff.id} className="flex items-center p-2 hover:bg-gray-100 rounded-lg">
                        <input
                          type="checkbox"
                          id={`staff-${staff.id}`}
                          checked={selectedStaff.includes(staff.id)}
                          onChange={e => {
                            if (e.target.checked) setSelectedStaff(prev => [...prev, staff.id]);
                            else setSelectedStaff(prev => prev.filter(id => id !== staff.id));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`staff-${staff.id}`} className="ml-2 block text-sm text-gray-700 cursor-pointer">
                          {staff.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    type="button" 
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={!groupName.trim() || selectedStaff.length === 0}
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out">
          <div className="flex items-center">
            <Check className="mr-2" size={18} />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoomPage;