'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Search, Download, Calendar, CheckCircle2, Users, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Subscriber {
  id: string;
  email: string;
  isActive: boolean;
  subscribedAt: string;
}

export default function SuperadminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await apiClient<{ success: boolean; data: { subscribers: Subscriber[]; total: number } }>(
        `/superadmin/newsletter-subscribers?search=${encodeURIComponent(search)}`
      );
      if (res && res.data) {
        setSubscribers(res.data.subscribers || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      setSubscribers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [search]);

  const handleExportCsv = () => {
    if (subscribers.length === 0) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Email,Subscribed Date,Status']
        .concat(
          subscribers.map(
            (s) => `"${s.email}","${new Date(s.subscribedAt).toLocaleDateString()}","${s.isActive ? 'Active' : 'Inactive'}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2e3339]">
            Newsletter Subscribers
          </h1>
          <p className="text-sm text-[#5a5e63]">
            View and manage email subscribers collected from the website footer newsletter form.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchSubscribers}
            variant="outline"
            size="sm"
            className="rounded-xl border-[#e2ebe2] text-[#2e3339]"
          >
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
          <Button
            onClick={handleExportCsv}
            disabled={subscribers.length === 0}
            size="sm"
            className="rounded-xl bg-[#315b36] text-white hover:bg-[#254629]"
          >
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-[#e2ebe2] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eff4ec] text-[#315b36]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#5a5e63]">Total Subscribers</p>
              <p className="text-2xl font-bold text-[#2e3339]">{total}</p>
            </div>
          </div>
        </Card>

        <div className="sm:col-span-2 flex items-center">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a5e63]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subscriber by email..."
              className="h-11 w-full rounded-xl border border-[#e2ebe2] bg-white pl-10 pr-4 text-sm text-[#2e3339] focus:outline-none focus:ring-2 focus:ring-[#315b36]"
            />
          </div>
        </div>
      </div>

      {/* Subscribers Table */}
      <Card className="rounded-2xl border border-[#e2ebe2] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#2e3339]">
            <thead className="border-b border-[#e2ebe2] bg-[#eff4ec]/40 text-xs font-bold text-[#5a5e63] uppercase">
              <tr>
                <th className="px-6 py-3.5">Email Address</th>
                <th className="px-6 py-3.5">Subscribed Date</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2ebe2]">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-[#5a5e63]">
                    Loading subscribers...
                  </td>
                </tr>
              ) : subscribers.length > 0 ? (
                subscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#eff4ec]/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#2e3339] flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#315b36]" />
                      <span>{sub.email}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#5a5e63]">
                      {new Date(sub.subscribedAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#eff4ec] border border-[#e2ebe2] px-2.5 py-0.5 text-xs font-semibold text-[#315b36]">
                        <CheckCircle2 className="h-3 w-3 text-[#315b36]" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-[#5a5e63]">
                    No newsletter subscribers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
