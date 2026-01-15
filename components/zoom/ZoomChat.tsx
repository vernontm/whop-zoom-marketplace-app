'use client'

import { useEffect, useRef, useState } from 'react'

interface ChatMessage {
  id: string
  sender: string
  message: string
  timestamp: Date
  isSelf?: boolean
}

interface Participant {
  id: string
  name: string
  isHost?: boolean
}

interface ZoomChatProps {
  client: any
  userName: string
}

export default function ZoomChat({ client, userName }: ZoomChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!client) return

    const setupChat = async () => {
      try {
        // Get chat client
        const chatClient = client.getChatClient()
        
        // Get participants
        const participantsClient = client.getParticipantsClient()
        const participantsList = participantsClient.getParticipants()
        
        setParticipants(
          participantsList.map((p: any) => ({
            id: p.userId,
            name: p.displayName,
            isHost: p.isHost
          }))
        )

        // Listen for chat messages
        chatClient.on('chat-message', (message: any) => {
          const newMessage: ChatMessage = {
            id: message.id || Date.now().toString(),
            sender: message.sender || 'Unknown',
            message: message.message,
            timestamp: new Date(message.timestamp || Date.now()),
            isSelf: message.sender === userName
          }
          
          setMessages(prev => [...prev, newMessage])
        })

        setIsConnected(true)
      } catch (error) {
        console.error('Error setting up chat:', error)
      }
    }

    setupChat()

    return () => {
      // Cleanup listeners
      if (client) {
        const chatClient = client.getChatClient?.()
        if (chatClient) {
          chatClient.off?.('chat-message')
        }
      }
    }
  }, [client, userName])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || !client || !isConnected) return

    try {
      const chatClient = client.getChatClient()
      await chatClient.sendToAll(inputMessage)
      
      // Add message to local state immediately for better UX
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: userName,
        message: inputMessage,
        timestamp: new Date(),
        isSelf: true
      }
      
      setMessages(prev => [...prev, newMessage])
      setInputMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-white font-semibold">Chat</h3>
        <p className="text-gray-400 text-sm mt-1">
          {participants.length} participants
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet</p>
            <p className="text-sm mt-2">Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  msg.isSelf
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                {!msg.isSelf && (
                  <p className="text-xs font-semibold mb-1 text-blue-400">
                    {msg.sender}
                  </p>
                )}
                <p className="text-sm break-words">{msg.message}</p>
                <p className="text-xs mt-1 opacity-70">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Participants List (collapsible) */}
      <div className="border-t border-gray-800 p-4">
        <details className="text-gray-400">
          <summary className="cursor-pointer text-sm font-medium hover:text-gray-300">
            Participants ({participants.length})
          </summary>
          <div className="mt-2 space-y-1">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-300">{participant.name}</span>
                {participant.isHost && (
                  <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                    Host
                  </span>
                )}
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
            disabled={!isConnected}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || !isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
