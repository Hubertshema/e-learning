'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Search, RefreshCw, Terminal, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/table-skeleton';


export default function SuperadminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);


  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient<any[]>('/superadmin/audit-logs');
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch {
      // Graceful error handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) =>
    `${l.action} ${l.entity} ${l.user?.email || ''} ${l.ipAddress || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="indigo">Security Audit</Badge>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Server-Side Immutable Audit Trail
          </h1>
          <p className="text-xs text-slate-500">
            Cryptographically tracked records of authentication, state changes, approvals, and security events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} isLoading={isLoading}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh Trail
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by action, entity, user email, or IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-800 dark:bg-slate-900"
        />
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Timestamp</th>
                <th className="px-6 py-3.5 font-semibold">Action</th>
                <th className="px-6 py-3.5 font-semibold">Target Entity</th>
                <th className="px-6 py-3.5 font-semibold">Actor / User</th>
                <th className="px-6 py-3.5 font-semibold">IP Address</th>
                <th className="px-6 py-3.5 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition">
                  <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
                    {log.entity}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System Agent'}
                    </p>
                    <p className="text-[11px] text-slate-500">{log.user?.email}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                      className="h-7 text-xs"
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Payload
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      )}

      {/* Metadata Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg p-6 space-y-4 bg-white dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary-600" />
                <span>Audit Event Payload: {selectedLog.action}</span>
              </CardTitle>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p><strong>Actor:</strong> {selectedLog.user?.email || 'System'}</p>
              <p><strong>Entity:</strong> {selectedLog.entity} (ID: {selectedLog.entityId || 'N/A'})</p>
              <p><strong>IP:</strong> {selectedLog.ipAddress}</p>
              <div className="mt-3">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Raw Metadata JSON:</span>
                <pre className="mt-1.5 rounded-xl bg-slate-900 p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
