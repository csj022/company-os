/**
 * AI Coding Dashboard
 * Main page for AI-powered code generation and management
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Code, Bot, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import AITaskForm from '../components/ai-coding/AITaskForm';
import PendingApprovals from '../components/ai-coding/PendingApprovals';
import AuditLog from '../components/ai-coding/AuditLog';
import UsageStats from '../components/ai-coding/UsageStats';

type Tab = 'tasks' | 'approvals' | 'audit' | 'stats';

const AICoding: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [stats, setStats] = useState({
    totalTasks: 0,
    approvedTasks: 0,
    rejectedTasks: 0,
    pendingTasks: 0,
    totalCost: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/ai/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats({
          totalTasks: data.audit.total,
          approvedTasks: data.audit.approvedActions,
          rejectedTasks: data.audit.rejectedActions,
          pendingTasks: data.audit.total - data.audit.approvedActions - data.audit.rejectedActions,
          totalCost: data.audit.totalCost
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const tabs = [
    { id: 'tasks' as Tab, label: 'New Task', icon: Code },
    { id: 'approvals' as Tab, label: 'Pending Approvals', icon: Clock, badge: stats.pendingTasks },
    { id: 'audit' as Tab, label: 'Audit Log', icon: CheckCircle },
    { id: 'stats' as Tab, label: 'Usage & Cost', icon: DollarSign }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="w-8 h-8 text-blue-500" />
            AI Code Assistant
          </h1>
          <p className="text-gray-600 mt-1">
            Hybrid AI coding system with intelligent approval workflow
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold">{stats.totalTasks}</p>
            </div>
            <Code className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approvedTasks}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejectedTasks}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingTasks}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <Badge variant="warning">{tab.badge}</Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'tasks' && (
          <AITaskForm onSuccess={loadStats} />
        )}
        
        {activeTab === 'approvals' && (
          <PendingApprovals onUpdate={loadStats} />
        )}
        
        {activeTab === 'audit' && (
          <AuditLog />
        )}
        
        {activeTab === 'stats' && (
          <UsageStats />
        )}
      </div>
    </div>
  );
};

export default AICoding;
