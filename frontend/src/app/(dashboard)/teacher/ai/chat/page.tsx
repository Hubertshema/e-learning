'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AIHeaderTabs } from '@/components/ai/ai-header-tabs';
import {
  MessageSquare,
  Sparkles,
  ArrowLeft,
  Send,
  RotateCcw,
  Bot,
  User,
  Copy,
  Check,
  Trash2,
  Lightbulb,
} from 'lucide-react';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AIChatCopilotPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am your **FluentEdge Curriculum AI Copilot**.\n\nI can help you brainstorm lesson ideas, formulate concept-checking questions (CCQs), adapt tasks for large classes, or draft assessment rubrics.\n\nWhat would you like to prepare for your learners today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Create a 45-min B1 lesson on reported speech.',
    'Suggest 5 interactive speaking warm-ups for A2 learners.',
    'How do I scaffold a writing essay for mixed-ability teenagers?',
    'Generate 3 Concept Checking Questions (CCQs) for the present perfect tense.',
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || sending) return;

    const userMsg: ChatMsg = {
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await api.post<{ reply: string; timestamp: string }>('/ai/chat', {
        message: textToSend.trim(),
        conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      const aiMsg: ChatMsg = {
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMsg = {
        role: 'assistant',
        content: `⚠️ Sorry, I encountered an issue processing your request: ${err.message || 'Network error'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleCopy = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation reset. How can I assist your teaching preparation today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Unified AI Studio Navigation Tabs */}
      <AIHeaderTabs />

      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/teacher/ai">
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" /> AI Hub
            </Button>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-cyan-500" />
            Curriculum Copilot Chat
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClear} className="h-8 text-xs gap-1.5 text-slate-500">
            <Trash2 className="h-3.5 w-3.5" /> Clear Chat
          </Button>
          <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
            Context Aware
          </Badge>
        </div>
      </div>

      {/* Chat Container Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xl flex flex-col h-[680px]">
        {/* Messages Stream */}
        <CardContent className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg, idx) => {
            const isAI = msg.role === 'assistant';
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-[88%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    isAI
                      ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md'
                      : 'bg-slate-700 text-white'
                  }`}
                >
                  {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                {/* Message Bubble */}
                <div className="space-y-1">
                  <div
                    className={`rounded-2xl p-4 text-xs md:text-sm leading-relaxed shadow-sm relative group ${
                      isAI
                        ? 'bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-sm'
                        : 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-tr-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {isAI && (
                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        title="Copy message"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        {copiedIndex === idx ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>

                  <span className={`text-[10px] text-slate-400 block px-1 ${isAI ? 'text-left' : 'text-right'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex gap-3 mr-auto max-w-[80%]">
              <div className="h-8 w-8 rounded-full bg-cyan-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-slate-50 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500">
                <RotateCcw className="h-3.5 w-3.5 animate-spin text-cyan-500" />
                Curriculum Assistant is thinking...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </CardContent>

        {/* Bottom Input & Quick Prompts */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
          {/* Quick Prompt Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Quick Prompts:
            </span>
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(qp)}
                className="whitespace-nowrap rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-[11px] text-slate-700 dark:text-slate-300 hover:border-cyan-500 hover:text-cyan-500 transition-colors"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Form Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your Curriculum Copilot anything (e.g., 'Draft a speaking roleplay on travel for A2')..."
              disabled={sending}
              className="text-xs md:text-sm h-11"
            />
            <Button
              type="submit"
              disabled={sending || !input.trim()}
              className="h-11 px-5 bg-cyan-600 hover:bg-cyan-700 text-white shrink-0 font-semibold text-xs"
            >
              <Send className="h-4 w-4 mr-1.5" /> Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
