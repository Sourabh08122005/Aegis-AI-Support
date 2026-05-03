import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Send, User as UserIcon, Bot, ShieldCheck, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: any;
  safetyFlags?: string[];
}

interface ChatInterfaceProps {
  user: User;
}

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize or fetch ticket
  useEffect(() => {
    const q = query(
      collection(db, 'tickets'),
      where('userId', '==', user.uid),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setTicketId(snapshot.docs[0].id);
      } else {
        createNewTicket();
      }
    });

    return unsubscribe;
  }, [user.uid]);

  // Fetch messages
  useEffect(() => {
    if (!ticketId) return;

    const q = query(
      collection(db, `tickets/${ticketId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Message[];
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return unsubscribe;
  }, [ticketId]);

  const createNewTicket = async () => {
    try {
      const docRef = await addDoc(collection(db, 'tickets'), {
        userId: user.uid,
        status: 'open',
        subject: 'New Chat Session',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setTicketId(docRef.id);
    } catch (error) {
      console.error("Error creating ticket:", error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !ticketId || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      // 1. Store User Message
      await addDoc(collection(db, `tickets/${ticketId}/messages`), {
        ticketId,
        role: 'user',
        content: userMessage,
        timestamp: serverTimestamp(),
      });

      // 2. Call Backend API (includes safety guard)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          messages: [...messages, { role: 'user', content: userMessage }]
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Something went wrong");
        // Log the safety violation
        if (data.safetyResult) {
           await addDoc(collection(db, 'logs'), {
             timestamp: serverTimestamp(),
             type: 'input',
             content: userMessage,
             isSafe: false,
             reasons: data.safetyResult.reasons,
             userId: user.uid
           });
        }
        setLoading(false);
        return;
      }

      // 3. Store AI Response
      await addDoc(collection(db, `tickets/${ticketId}/messages`), {
        ticketId,
        role: 'assistant',
        content: data.content,
        timestamp: serverTimestamp(),
      });

      // 4. Log Success
      await addDoc(collection(db, 'logs'), {
        timestamp: serverTimestamp(),
        type: 'output',
        content: data.content,
        isSafe: true,
        latency: data.latency,
        userId: user.uid
      });

    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to connect to support engine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col gap-6"
    >
      <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <Bot className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Aegis Support Assistant</h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Safety Guard Active
              </div>
            </div>
          </div>
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
            Ticket ID: {ticketId?.slice(0, 8)}
          </Badge>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Welcome to Secure Support</h3>
                  <p className="text-slate-500 text-sm max-w-xs">
                    Our AI assistant is ready to help you with any questions. 
                    Your conversation is monitored for safety.
                  </p>
                </div>
              </div>
            )}
            
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.role === 'user' ? 'bg-indigo-600' : 'bg-slate-100'
                }`}>
                  {m.role === 'user' ? (
                    <UserIcon className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div className={`space-y-1 max-w-[80%] ${m.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`p-4 rounded-2xl ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-slate-50 text-slate-900 border border-slate-100 rounded-tl-none shadow-sm'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                    </span>
                    {m.role === 'assistant' && (
                      <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" /> Verified Safe
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-slate-600 animate-bounce" />
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl rounded-tl-none">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <form onSubmit={handleSend} className="p-4 bg-slate-50/50 border-t border-slate-100">
          <div className="flex gap-2 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your issue..."
              className="h-12 bg-white rounded-xl pr-12 border-slate-200 focus-visible:ring-indigo-600"
              disabled={loading}
            />
            <Button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="absolute right-1.5 top-1.5 h-9 w-9 p-0 bg-indigo-600 hover:bg-indigo-700 rounded-lg group"
            >
              <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" /> End-to-end moderated
            </div>
            <div className="h-2 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" /> Real-time toxicity filter
            </div>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
