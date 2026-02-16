import { useState, useEffect } from 'react';
import { Github, Rocket, Palette, MessageSquare, Twitter, Linkedin, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';

interface Integration {
  id: string;
  service: string;
  status: 'active' | 'inactive' | 'error';
  metadata: Record<string, any>;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const integrationConfig = {
  github: {
    name: 'GitHub',
    icon: Github,
    description: 'Source control, pull requests, and code reviews',
    color: 'text-slate-100',
    scopes: ['repo', 'read:user', 'read:org', 'admin:repo_hook'],
  },
  vercel: {
    name: 'Vercel',
    icon: Rocket,
    description: 'Deployments, preview URLs, and serverless functions',
    color: 'text-slate-100',
    scopes: ['deployments', 'projects'],
  },
  figma: {
    name: 'Figma',
    icon: Palette,
    description: 'Design files, components, and design tokens',
    color: 'text-purple-400',
    scopes: ['file_read', 'webhooks'],
  },
  slack: {
    name: 'Slack',
    icon: MessageSquare,
    description: 'Team notifications and bot interactions',
    color: 'text-purple-400',
    scopes: ['chat:write', 'channels:read'],
  },
  twitter: {
    name: 'Twitter',
    icon: Twitter,
    description: 'Social media posting and engagement tracking',
    color: 'text-blue-400',
    scopes: ['tweet.read', 'tweet.write', 'users.read'],
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    description: 'Professional networking and content sharing',
    color: 'text-blue-500',
    scopes: ['r_liteprofile', 'w_member_social'],
  },
};

export function Integrations() {
  const { token } = useAuthStore();
  const [integrations, setIntegrations] = useState<Record<string, Integration>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ integrations: Integration[] }>('/api/integrations');
      const integrationsMap: Record<string, Integration> = {};
      response.integrations.forEach((integration: Integration) => {
        integrationsMap[integration.service] = integration;
      });
      setIntegrations(integrationsMap);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (service: string) => {
    try {
      // Redirect to OAuth flow with token
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      window.location.href = `${apiBaseUrl}/integrations/${service}/connect?token=${encodeURIComponent(token || '')}`;
    } catch (error) {
      console.error(`Failed to connect ${service}:`, error);
    }
  };

  const handleDisconnect = async (service: string) => {
    if (!confirm(`Are you sure you want to disconnect ${integrationConfig[service as keyof typeof integrationConfig].name}?`)) {
      return;
    }

    try {
      await api.delete(`/api/integrations/${service}/disconnect`);
      await loadIntegrations();
    } catch (error) {
      console.error(`Failed to disconnect ${service}:`, error);
    }
  };

  const handleSync = async (service: string) => {
    try {
      setSyncing({ ...syncing, [service]: true });
      await api.post(`/api/integrations/${service}/sync`);
      await loadIntegrations();
    } catch (error) {
      console.error(`Failed to sync ${service}:`, error);
    } finally {
      setSyncing({ ...syncing, [service]: false });
    }
  };

  const getStatusBadge = (integration?: Integration) => {
    if (!integration) {
      return <Badge variant="neutral">Not Connected</Badge>;
    }

    switch (integration.status) {
      case 'active':
        return <Badge variant="success">Connected</Badge>;
      case 'error':
        return <Badge variant="error">Error</Badge>;
      case 'inactive':
        return <Badge variant="neutral">Inactive</Badge>;
      default:
        return <Badge variant="neutral">Unknown</Badge>;
    }
  };

  const getStatusIcon = (integration?: Integration) => {
    if (!integration) {
      return <XCircle className="w-5 h-5 text-slate-500" />;
    }

    switch (integration.status) {
      case 'active':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'inactive':
        return <XCircle className="w-5 h-5 text-slate-500" />;
      default:
        return <XCircle className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="section-header">
          <h1 className="section-title">Integrations</h1>
          <p className="text-slate-400 mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="section-title">Integrations</h1>
          <p className="text-slate-400 mt-1">
            Connect your tools and services to enable AI automation
          </p>
        </div>
        <Button onClick={loadIntegrations} variant="secondary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(integrationConfig).map(([service, config]) => {
          const integration = integrations[service];
          const Icon = config.icon;
          const isConnected = !!integration;

          return (
            <Card key={service}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-[#2A3240] ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{config.name}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{config.description}</p>
                  </div>
                </div>
                {getStatusIcon(integration)}
              </div>

              {isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Status</span>
                    {getStatusBadge(integration)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Last Sync</span>
                    <span className="text-sm text-white">
                      {formatDate(integration.lastSyncAt)}
                    </span>
                  </div>

                  {integration.metadata && Object.keys(integration.metadata).length > 0 && (
                    <div className="pt-3 border-t border-[#2A3240]">
                      <div className="text-xs text-slate-500 mb-2">Connected As</div>
                      {integration.metadata.username && (
                        <div className="text-sm text-white">@{integration.metadata.username}</div>
                      )}
                      {integration.metadata.email && (
                        <div className="text-sm text-slate-400">{integration.metadata.email}</div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-[#2A3240]">
                    <Button
                      onClick={() => handleSync(service)}
                      variant="secondary"
                      className="flex-1"
                      disabled={syncing[service]}
                    >
                      {syncing[service] ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleDisconnect(service)}
                      variant="secondary"
                      className="flex-1"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-slate-400">
                    Not connected. Click below to authorize.
                  </div>

                  <div className="text-xs text-slate-500">
                    <div className="font-medium mb-1">Required Permissions:</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {config.scopes.map((scope) => (
                        <li key={scope}>{scope}</li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={() => handleConnect(service)}
                    variant="primary"
                    className="w-full"
                  >
                    Connect {config.name}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
