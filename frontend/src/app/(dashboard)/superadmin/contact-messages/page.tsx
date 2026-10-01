'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Search,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  RefreshCw,
  Archive,
  ChevronDown,
  User,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status: 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED';
  notes?: string | null;
  createdAt: string;
}

export default function SuperadminContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await apiClient<{
        success: boolean;
        data: { messages: ContactMessage[]; total: number; unreadCount: number };
      }>(
        `/superadmin/contact-messages?status=${statusFilter}&search=${encodeURIComponent(search)}`
      );
      if (res && res.data) {
        setMessages(res.data.messages || []);
        setTotal(res.data.total || 0);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      setMessages([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [statusFilter, search]);

  const updateMessageStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient(`/superadmin/contact-messages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchMessages();
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage({ ...selectedMessage, status: newStatus as any });
      }
    } catch (err) {
      // noop
    }
  };

  const handleSelectMessage = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    if (msg.status === 'UNREAD') {
      updateMessageStatus(msg.id, 'READ');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2e3339]">
            Contact Us Inquiries
          </h1>
          <p className="text-sm text-[#5a5e63]">
            Manage, review, and reply to messages submitted through the website Contact Us portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchMessages}
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-200 text-[#172033]"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3]">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#667085]">Total Messages</p>
              <p className="text-2xl font-bold text-[#172033]">{total}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F7FC] text-[#006EF3]">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#667085]">Unread Inquiries</p>
              <p className="text-2xl font-bold text-[#012970]">{unreadCount}</p>
            </div>
          </div>
        </Card>

        {/* Search */}
        <div className="flex items-center">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#667085]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, keyword..."
              className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#006EF3]"
            />
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'UNREAD', 'READ', 'REPLIED', 'ARCHIVED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              statusFilter === st
                ? 'bg-[#012970] text-white shadow-sm'
                : 'bg-white text-[#172033] border border-[#E2E8F0] hover:bg-[#F3F7FC]'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Messages List Column */}
        <div className="lg:col-span-6 space-y-3">
          {loading ? (
            <Card className="p-8 text-center text-[#667085]">Loading inquiries...</Card>
          ) : messages.length > 0 ? (
            messages.map((msg) => {
              const isSelected = selectedMessage?.id === msg.id;
              return (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? 'border-[#006EF3] bg-[#F3F7FC]/80 shadow-sm'
                      : 'border-[#E2E8F0] bg-white hover:border-[#006EF3]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#172033]">{msg.name}</span>
                      {msg.status === 'UNREAD' && (
                        <span className="h-2 w-2 rounded-full bg-[#006EF3]" />
                      )}
                    </div>
                    <span className="text-[11px] text-[#667085]">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-[#012970] truncate mb-1">
                    {msg.subject || 'General Inquiry'}
                  </p>
                  <p className="text-xs text-[#667085] line-clamp-2 leading-relaxed">
                    {msg.message}
                  </p>
                </div>
              );
            })
          ) : (
            <Card className="p-10 text-center text-[#667085] rounded-2xl border border-[#E2E8F0]">
              No contact messages found matching this filter.
            </Card>
          )}
        </div>

        {/* Selected Message Detail Column */}
        <div className="lg:col-span-6">
          {selectedMessage ? (
            <Card className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-start justify-between border-b border-[#E2E8F0] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#172033]">
                    {selectedMessage.subject || 'General Inquiry'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#667085] mt-1.5">
                    <span className="flex items-center gap-1 font-semibold text-[#172033]">
                      <User className="h-3.5 w-3.5 text-[#006EF3]" /> {selectedMessage.name}
                    </span>
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="flex items-center gap-1 text-[#006EF3] hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" /> {selectedMessage.email}
                    </a>
                    {selectedMessage.phone && (
                      <a
                        href={`tel:${selectedMessage.phone}`}
                        className="flex items-center gap-1 text-[#006EF3] hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" /> {selectedMessage.phone}
                      </a>
                    )}
                  </div>
                </div>

                <span className="rounded-lg bg-[#F3F7FC] border border-[#E2E8F0] px-2.5 py-1 text-xs font-bold text-[#012970]">
                  {selectedMessage.status}
                </span>
              </div>

              {/* Message Body */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-[#667085]">Inquiry Message:</p>
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F3F7FC]/50 p-4 text-sm text-[#172033] leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E2E8F0]">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || 'Inquiry')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => updateMessageStatus(selectedMessage.id, 'REPLIED')}
                >
                  <Button size="sm" className="rounded-xl bg-[#012970] text-white hover:bg-[#006EF3] transition-colors">
                    <Mail className="h-4 w-4 mr-1.5" /> Reply via Email
                  </Button>
                </a>

                <Button
                  onClick={() => updateMessageStatus(selectedMessage.id, 'REPLIED')}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-[#E2E8F0] text-[#172033] hover:bg-[#F3F7FC]"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5 text-[#006EF3]" /> Mark Replied
                </Button>

                <Button
                  onClick={() => updateMessageStatus(selectedMessage.id, 'ARCHIVED')}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-[#E2E8F0] text-[#667085] hover:bg-[#F3F7FC]"
                >
                  <Archive className="h-4 w-4 mr-1.5" /> Archive
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F3F7FC]/50 p-12 text-center text-[#667085]">
              <MessageSquare className="h-8 w-8 mx-auto text-[#006EF3] mb-2" />
              <p className="text-sm font-semibold text-[#172033]">Select an inquiry</p>
              <p className="text-xs text-[#667085]">Click any message from the left to read and respond.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
