import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import axios from 'axios';
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
  is_read?: boolean;
}

interface Staff {
  id: number;
  name: string;
}

// Custom hook for chat rooms
export const useChatRooms = () => {
  return useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async (): Promise<ChatRoom[]> => {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/chat/my-rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true,
  });
};

// Custom hook for messages in a specific room
export const useMessages = (roomId: number | null) => {
  return useQuery({
    queryKey: ['messages', roomId],
    queryFn: async (): Promise<Message[]> => {
      if (!roomId) return [];
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!roomId,
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true,
  });
};

// Custom hook for staff list
export const useStaff = () => {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async (): Promise<Staff[]> => {
      const res = await axios.get(`${API_BASE_URL}/staff`, { withCredentials: true });
      return res.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Custom hook for sending messages
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ roomId, message, sender_id, sender_name }: { 
      roomId: number; 
      message: string; 
      sender_id?: number; 
      sender_name?: string; 
    }) => {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/chat/rooms/${roomId}/messages`,
        { roomId, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onMutate: async ({ roomId, message, sender_id, sender_name }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['messages', roomId] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(['messages', roomId]);

      // Optimistically update to the new value
      if (sender_id && sender_name) {
        const optimisticMessage = {
          id: Date.now(), // Temporary ID
          room_id: roomId,
          sender_id,
          sender_name,
          message,
          sent_at: new Date().toISOString(),
          is_read: false,
        };

        queryClient.setQueryData(['messages', roomId], (old: Message[] | undefined) => {
          if (!old) return [optimisticMessage];
          return [...old, optimisticMessage];
        });
      }

      // Return a context object with the snapshotted value
      return { previousMessages };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', variables.roomId], context.previousMessages);
      }
    },
    onSuccess: (data, variables) => {
      console.log('Message sent successfully:', data);
    },
  });
};

// Custom hook for creating group chat
export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, memberIds }: { name: string; memberIds: number[] }) => {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/chat/rooms`,
        { name, is_group: true, memberIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      // Invalidate and refetch chat rooms
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
  });
};

// Custom hook for editing messages
export const useEditMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ messageId, message }: { messageId: number; message: string }) => {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `${API_BASE_URL}/chat/messages/${messageId}`,
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: (data, variables) => {
      // Update the message in the cache optimistically
      queryClient.setQueryData(['messages', data.room_id], (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return oldMessages;
        return oldMessages.map(msg => 
          msg.id === variables.messageId 
            ? { ...msg, message: variables.message }
            : msg
        );
      });
    },
  });
};

// Custom hook for deleting messages
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: number) => {
      const token = localStorage.getItem('token');
      const res = await axios.delete(
        `${API_BASE_URL}/chat/messages/${messageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    },
    onSuccess: (data, variables) => {
      // Remove the message from the cache optimistically
      queryClient.setQueryData(['messages', data.room_id], (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return oldMessages;
        return oldMessages.filter(msg => msg.id !== variables);
      });
    },
  });
};

// Custom hook for real-time socket connection
export const useSocket = (userId: number | undefined) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Listen for new messages
    newSocket.on('newMessage', (message: Message) => {
      console.log('New message received:', message);
      
      // Update the messages cache for the specific room
      queryClient.setQueryData(['messages', message.room_id], (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return [message];
        
        // Check if message already exists to avoid duplicates
        // Check by both ID and content to be more thorough
        const existingMessageIndex = oldMessages.findIndex(msg => 
          msg.id === message.id || 
          (msg.message === message.message && 
           msg.sender_id === message.sender_id && 
           Math.abs(new Date(msg.sent_at || '').getTime() - new Date(message.sent_at || '').getTime()) < 1000)
        );
        
        if (existingMessageIndex !== -1) {
          // Replace the optimistic message with the real one
          const updatedMessages = [...oldMessages];
          updatedMessages[existingMessageIndex] = message;
          console.log('Replacing optimistic message with real message:', message);
          return updatedMessages;
        }
        
        return [...oldMessages, message];
      });

      // Invalidate rooms to update unread counts
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
    };
  }, [userId, queryClient]);

  const joinRoom = (roomId: number) => {
    if (socket) {
      socket.emit('joinRoom', roomId);
    }
  };

  const leaveRoom = (roomId: number) => {
    if (socket) {
      socket.emit('leaveRoom', roomId);
    }
  };

  return {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
  };
};

// Custom hook for read message tracking
export const useReadMessages = (currentUserId?: number) => {
  const [readMessages, setReadMessages] = useState<{ [messageId: number]: boolean }>({});
  const [lastReadTimestamps, setLastReadTimestamps] = useState<{ [roomId: number]: string }>({});
  const { data: rooms } = useChatRooms();

  // Initialize last read timestamps when rooms are loaded
  useEffect(() => {
    if (rooms && rooms.length > 0) {
      const newLastReadTimestamps = { ...lastReadTimestamps };
      let hasChanges = false;
      
      rooms.forEach(room => {
        if (!newLastReadTimestamps[room.id]) {
          newLastReadTimestamps[room.id] = room.created_at;
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        setLastReadTimestamps(newLastReadTimestamps);
      }
    }
  }, [rooms]);

  // Mark a specific message as read
  const markMessageAsRead = async (messageId: number) => {
    console.log('Marking message as read:', messageId);
    setReadMessages(prev => {
      const newState = { ...prev, [messageId]: true };
      console.log('Updated read messages state:', newState);
      return newState;
    });
    
    // Send read receipt to server (optional - server might not have this endpoint)
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/chat/messages/${messageId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Read receipt sent to server');
    } catch (error) {
      console.log('Read receipt failed (this is expected if server endpoint doesn\'t exist):', error);
    }
  };

  // Mark all messages in a room as read
  const markRoomMessagesAsRead = (roomId: number, messageIds: number[]) => {
    const now = new Date().toISOString();
    setLastReadTimestamps(prev => ({ ...prev, [roomId]: now }));
    
    const newReadMessages = { ...readMessages };
    messageIds.forEach(id => {
      newReadMessages[id] = true;
    });
    setReadMessages(newReadMessages);
  };

  // Check if a message is read
  const isMessageRead = (message: Message): boolean => {
    if (message.sender_id === currentUserId) return true; // Own messages are always "read"
    return readMessages[message.id!] || message.is_read || false;
  };

  // Get unread messages for a room
  const getUnreadMessages = (messages: Message[]): Message[] => {
    return messages.filter(msg => !isMessageRead(msg));
  };

  return {
    readMessages,
    lastReadTimestamps,
    markMessageAsRead,
    markRoomMessagesAsRead,
    isMessageRead,
    getUnreadMessages,
  };
};

// Custom hook for unread message counts
export const useUnreadCounts = (currentUserId?: number) => {
  const { data: rooms } = useChatRooms();
  const [unreadCounts, setUnreadCounts] = useState<{ [roomId: number]: number }>({});
  const { lastReadTimestamps, getUnreadMessages, markRoomMessagesAsRead } = useReadMessages(currentUserId);

  // Initialize last read timestamps - this is now handled by useReadMessages
  // We just need to trigger the unread count calculation when rooms change

  // Calculate unread counts using the read message tracking
  useEffect(() => {
    if (!rooms) return;

    const calculateUnreadCounts = async () => {
      const token = localStorage.getItem('token');
      const newUnreadCounts: { [roomId: number]: number } = {};
      
      for (const room of rooms) {
        try {
          const res = await axios.get(`${API_BASE_URL}/chat/rooms/${room.id}/messages`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Use the read message tracking to get unread count
          const unreadMessages = getUnreadMessages(res.data);
          
          console.log(`Room ${room.id} unread calculation:`, {
            totalMessages: res.data.length,
            unreadCount: unreadMessages.length,
            unreadMessages: unreadMessages.map(m => ({ id: m.id, sender_id: m.sender_id, sent_at: m.sent_at }))
          });
          
          newUnreadCounts[room.id] = unreadMessages.length;
        } catch (error) {
          console.error(`Error calculating unread count for room ${room.id}:`, error);
          newUnreadCounts[room.id] = 0;
        }
      }
      
      setUnreadCounts(newUnreadCounts);
    };

    calculateUnreadCounts();
  }, [rooms, getUnreadMessages]);

  const markRoomAsRead = (roomId: number, messageIds?: number[]) => {
    setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }));
    
    // If message IDs are provided, mark them as read using the read messages hook
    if (messageIds && messageIds.length > 0) {
      markRoomMessagesAsRead(roomId, messageIds);
    }
  };

  const getTotalUnreadCount = (): number => {
    return Object.values(unreadCounts).reduce((total, count) => total + count, 0);
  };

  return {
    unreadCounts,
    lastReadTimestamps,
    markRoomAsRead,
    getTotalUnreadCount,
  };
};
