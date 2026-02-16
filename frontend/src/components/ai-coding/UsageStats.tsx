/**
 * Usage Stats Component
 * Displays cost tracking and usage metrics for AI operations
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { DollarSign, Zap, TrendingUp, Activity, Calendar } from 'lucide-react';

interface Stats {
  audit: {
    total: number;
    byType: Record<string, number>;
    totalCost: number;
    approvedActions: number;
    rejectedActions: number;
    autoApproved: number;
    errors: number;
  };
  llm: {
    totalCost: number;
    costByProvider: Record<string, number>;
    requestCount: number;
    providers: Record<string, any>;
  };
}

const UsageStats: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const loadStats = async () => {
    try {
      let url = '/api/ai/stats';
      
      if (dateRange !== 'all') {
        const now = new Date();
        const startDate = new Date();
        
        if (dateRange === 'today') {
          startDate.setHours(0, 0, 0, 0);
        } else if (dateRange === 'week') {
          startDate.setDate(now.getDate() - 7);
        } else if (dateRange === 'month') {
          startDate.setDate(now.getDate() - 30);
        }
        
        url += `?startDate=${startDate.toISOString()}&endDate=${now.toISOString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading statistics...</p>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600">No statistics available.</p>
      </Card>
    );
  }

  const approvalRate = stats.audit.total > 0
    ? ((stats.audit.approvedActions / stats.audit.total) * 100).toFixed(1)
    : '0';

  const autoApprovalRate = stats.audit.total > 0
    ? ((stats.audit.autoApproved / stats.audit.total) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-500" />
          <div className="flex gap-2">
            {['today', 'week', 'month', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                  dateRange === range
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Cost</h3>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${stats.audit.totalCost.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {stats.llm.requestCount} requests
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Actions</h3>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.audit.total}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {stats.audit.errors} errors
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Approval Rate</h3>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {approvalRate}%
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {stats.audit.approvedActions} approved
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Auto-Approved</h3>
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {autoApprovalRate}%
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {stats.audit.autoApproved} tasks
          </p>
        </Card>
      </div>

      {/* Actions by Type */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Actions by Type</h2>
        <div className="space-y-3">
          {Object.entries(stats.audit.byType).map(([type, count]) => {
            const percentage = ((count / stats.audit.total) * 100).toFixed(1);
            
            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-gray-600">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Cost by Provider */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Cost by Provider</h2>
        <div className="space-y-4">
          {Object.entries(stats.llm.costByProvider).map(([provider, cost]) => (
            <div key={provider} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-semibold capitalize">{provider}</h3>
                <p className="text-sm text-gray-600">
                  {stats.llm.providers[provider]?.tokensUsed.toLocaleString()} tokens
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  ${(cost as number).toFixed(4)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detailed Breakdown */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Detailed Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Approvals */}
          <div>
            <h3 className="font-semibold mb-3">Approval Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Approved</span>
                <span className="font-semibold text-green-600">
                  {stats.audit.approvedActions}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rejected</span>
                <span className="font-semibold text-red-600">
                  {stats.audit.rejectedActions}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auto-Approved</span>
                <span className="font-semibold text-blue-600">
                  {stats.audit.autoApproved}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Errors</span>
                <span className="font-semibold text-gray-600">
                  {stats.audit.errors}
                </span>
              </div>
            </div>
          </div>

          {/* LLM Usage */}
          <div>
            <h3 className="font-semibold mb-3">LLM Usage</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Requests</span>
                <span className="font-semibold">
                  {stats.llm.requestCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Cost</span>
                <span className="font-semibold">
                  ${stats.llm.totalCost.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Cost/Request</span>
                <span className="font-semibold">
                  ${stats.llm.requestCount > 0 
                    ? (stats.llm.totalCost / stats.llm.requestCount).toFixed(6)
                    : '0.000000'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Cost Trends (Placeholder) */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Cost Trends</h2>
        <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">Chart visualization would go here</p>
        </div>
      </Card>
    </div>
  );
};

export default UsageStats;
