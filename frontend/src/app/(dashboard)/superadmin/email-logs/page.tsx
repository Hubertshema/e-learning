'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Mail,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Send,
  Eye,
  Filter,
  Calendar,
  Layers,
  Inbox
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { TableSkeleton } from '@/components/ui/table-skeleton';


interface EmailLogItem {
  id: string;
  recipient: string;
  subject: string;
  template: string;
  status: 'SENT' | 'QUEUED' | 'SENDING' | 'FAILED' | 'RETRYING' | 'CANCELLED';
  provider: string;
  providerMessageId?: string;
  errorMessage?: string;
  attempts: number;
  sentAt?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface EmailStats {
  sent: number;
  queued: number;
  failed: number;
  today: number;
  thisWeek: number;
}

export default function SuperadminEmailLogsPage() {
  const [logs, setLogs] = useState<EmailLogItem[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [templateFilter, setTemplateFilter] = useState('');
  const [search, setSearch] = useState('');

  // Selected Log Modal
  const [selectedLog, setSelectedLog] = useState<EmailLogItem | null>(null);

  const fetchEmailLogs = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: String(page),
        limit: '15',
        ...(statusFilter && { status: statusFilter }),
        ...(templateFilter && { template: templateFilter }),
        ...(search && { search }),
      });

      const res = await apiClient.get<any>(`/superadmin/email-logs?${query.toString()}`);
      if (res) {
        setLogs(res.logs || res.data || []);
        if (res.stats) {
          setStats(res.stats);
        }
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalCount(res.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load email logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
  }, [page, statusFilter, templateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmailLogs();
  };

  const getStatusBadge = (status: EmailLogItem['status']) => {
    switch (status) {
      case 'SENT':
        return <Badge variant="success" className="text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Delivered</Badge>;
      case 'QUEUED':
      case 'SENDING':
        return <Badge variant="indigo" className="text-[10px]"><Clock className="h-3 w-3 mr-1" /> Queued</Badge>;
      case 'RETRYING':
        return <Badge variant="warning" className="text-[10px]"><RotateCcw className="h-3 w-3 mr-1" /> Retrying</Badge>;
      case 'FAILED':
        return <Badge variant="destructive" className="text-[10px]"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary-600" /> Transactional Email & Delivery Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Monitor real-time outgoing mail dispatch, delivery statuses, retry policies, and recipient logs.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => fetchEmailLogs()}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Feed
        </Button>
      </div>

      {/* Metrics Overview Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="p-4 bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50">
            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Delivered
            </p>
            <p className="text-xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
              {stats.sent}
            </p>
          </Card>

          <Card className="p-4 bg-indigo-50/50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/50">
            <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              Queued / Pending
            </p>
            <p className="text-xl font-black text-indigo-900 dark:text-indigo-200 mt-1">
              {stats.queued}
            </p>
          </Card>

          <Card className="p-4 bg-rose-50/50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50">
            <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Failed
            </p>
            <p className="text-xl font-black text-rose-900 dark:text-rose-200 mt-1">
              {stats.failed}
            </p>
          </Card>

          <Card className="p-4 bg-slate-50 border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Sent Today
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {stats.today}
            </p>
          </Card>

          <Card className="p-4 bg-slate-50 border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Last 7 Days
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {stats.thisWeek}
            </p>
          </Card>
        </div>
      )}

      {/* Filter Toolbar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by recipient email or subject line..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 w-full sm:w-44"
          >
            <option value="">All Statuses</option>
            <option value="SENT">Delivered (SENT)</option>
            <option value="QUEUED">Queued / Sending</option>
            <option value="RETRYING">Retrying</option>
            <option value="FAILED">Failed</option>
          </select>

          <select
            value={templateFilter}
            onChange={(e) => {
              setTemplateFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 w-full sm:w-48"
          >
            <option value="">All Email Templates</option>
            <option value="WelcomeEmail">Welcome Email</option>
            <option value="EmailVerificationEmail">Email Verification</option>
            <option value="PasswordResetEmail">Password Reset</option>
            <option value="PaymentVerifiedEmail">Payment Verified</option>
            <option value="AssignmentGradedEmail">Assignment Graded</option>
            <option value="TeacherApprovedEmail">Teacher Approved</option>
            <option value="CourseExpiringEmail">Course Expiring</option>
            <option value="AnnouncementEmail">Announcement</option>
          </select>

          <Button type="submit" variant="gradient" size="sm">
            Search
          </Button>
        </form>
      </Card>

      {/* Logs Table */}
      {loading ? (
        <TableSkeleton rows={7} columns={6} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Recipient</th>
                <th className="p-4">Subject & Template</th>
                <th className="p-4">Status</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Attempts</th>
                <th className="p-4">Created / Sent Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Loading email ledger records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <Inbox className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No email logs match the selected filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      <div>{log.recipient}</div>
                      {log.user && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {log.user.firstName} {log.user.lastName} ({log.user.role})
                        </div>
                      )}
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {log.subject}
                      </div>
                      <Badge variant="outline" className="text-[9px] mt-0.5">
                        {log.template}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {log.provider}
                    </td>
                    <td className="p-4 font-mono text-xs">
                      {log.attempts}
                    </td>
                    <td className="p-4 text-slate-500 text-[11px]">
                      <div>{new Date(log.createdAt).toLocaleString()}</div>
                      {log.sentAt && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Delivered {new Date(log.sentAt).toLocaleTimeString()}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing page {page} of {totalPages} ({totalCount} total entries)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
      )}

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Email Dispatch Details</CardTitle>
                <CardDescription className="text-xs">Log ID: {selectedLog.id}</CardDescription>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </CardHeader>

            <CardContent className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-semibold block">Recipient:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedLog.recipient}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Status:</span>
                  {getStatusBadge(selectedLog.status)}
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Template:</span>
                  <span className="font-mono font-bold text-primary-600">{selectedLog.template}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Provider:</span>
                  <span className="font-mono">{selectedLog.provider}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Subject:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedLog.subject}</span>
              </div>

              {selectedLog.providerMessageId && (
                <div>
                  <span className="text-slate-400 font-semibold block">Provider Message ID:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{selectedLog.providerMessageId}</span>
                </div>
              )}

              {selectedLog.errorMessage && (
                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 font-mono text-[11px]">
                  <strong>Error Message:</strong>
                  <p className="mt-1">{selectedLog.errorMessage}</p>
                </div>
              )}
            </CardContent>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
