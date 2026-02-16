import { useState, useEffect } from 'react';
import {
  Rocket,
  StopCircle,
  RotateCcw,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Terminal,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';

interface Deployment {
  id: string;
  vercelDeploymentId: string;
  projectName: string;
  url: string;
  state: 'queued' | 'building' | 'ready' | 'error' | 'canceled';
  environment: 'production' | 'preview' | 'development';
  commitSha: string | null;
  branch: string | null;
  agentChecked: boolean;
  healthScore: number | null;
  metadata: {
    buildDuration?: number;
    creator?: string;
    source?: string;
  };
  createdAt: string;
  updatedAt: string;
  readyAt: string | null;
}

export function DeploymentControls() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [deploying, setDeploying] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadDeployments();
    const interval = setInterval(loadDeployments, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadDeployments = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ deployments: Deployment[] }>('/api/deployments');
      setDeployments(response.deployments || []);
    } catch (error) {
      console.error('Failed to load deployments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async (projectName: string, environment: string) => {
    try {
      setDeploying({ ...deploying, [projectName]: true });
      await api.post('/api/deployments/deploy', {
        projectName,
        environment,
      });
      await loadDeployments();
    } catch (error) {
      console.error('Failed to trigger deployment:', error);
      alert('Failed to trigger deployment. Check console for details.');
    } finally {
      setDeploying({ ...deploying, [projectName]: false });
    }
  };

  const handleRollback = async (deployment: Deployment) => {
    if (!confirm(`Are you sure you want to rollback ${deployment.projectName}?`)) {
      return;
    }

    try {
      await api.post(`/api/deployments/${deployment.id}/rollback`);
      await loadDeployments();
    } catch (error) {
      console.error('Failed to rollback:', error);
      alert('Failed to rollback. Check console for details.');
    }
  };

  const handleViewLogs = async (deployment: Deployment) => {
    try {
      setSelectedDeployment(deployment);
      setShowLogs(true);
      const response = await api.get<{ logs: string[] }>(`/api/deployments/${deployment.id}/logs`);
      setLogs(response.logs || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
      setLogs(['Error loading logs. Check console for details.']);
    }
  };

  const getStateBadge = (state: Deployment['state']) => {
    switch (state) {
      case 'ready':
        return <Badge variant="success">Ready</Badge>;
      case 'building':
        return <Badge variant="warning">Building</Badge>;
      case 'queued':
        return <Badge variant="neutral">Queued</Badge>;
      case 'error':
        return <Badge variant="error">Error</Badge>;
      case 'canceled':
        return <Badge variant="neutral">Canceled</Badge>;
      default:
        return <Badge variant="neutral">{state}</Badge>;
    }
  };

  const getStateIcon = (state: Deployment['state']) => {
    switch (state) {
      case 'ready':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'building':
        return <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />;
      case 'queued':
        return <Clock className="w-5 h-5 text-slate-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'canceled':
        return <StopCircle className="w-5 h-5 text-slate-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getEnvironmentBadge = (environment: Deployment['environment']) => {
    switch (environment) {
      case 'production':
        return <Badge variant="error">Production</Badge>;
      case 'preview':
        return <Badge variant="warning">Preview</Badge>;
      case 'development':
        return <Badge variant="neutral">Development</Badge>;
      default:
        return <Badge variant="neutral">{environment}</Badge>;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Group deployments by project
  const projectGroups = deployments.reduce((acc, deployment) => {
    if (!acc[deployment.projectName]) {
      acc[deployment.projectName] = [];
    }
    acc[deployment.projectName].push(deployment);
    return acc;
  }, {} as Record<string, Deployment[]>);

  if (loading && deployments.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Deploy */}
      <Card>
        <CardHeader>
          <span>Quick Deploy</span>
        </CardHeader>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Object.keys(projectGroups)
            .slice(0, 3)
            .map((projectName) => (
              <div
                key={projectName}
                className="p-4 rounded-lg bg-[#232931] border border-[#2A3240]"
              >
                <h4 className="text-white font-medium mb-3">{projectName}</h4>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDeploy(projectName, 'production')}
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    disabled={deploying[projectName]}
                  >
                    {deploying[projectName] ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-1" />
                        Production
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleDeploy(projectName, 'preview')}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    disabled={deploying[projectName]}
                  >
                    Preview
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Deployment History */}
      <Card>
        <CardHeader>
          <span>Deployment History</span>
          <Button onClick={loadDeployments} variant="secondary" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <div className="space-y-4">
          {deployments.slice(0, 10).map((deployment) => (
            <div
              key={deployment.id}
              className="p-4 rounded-lg bg-[#232931] hover:bg-[#2A3240] transition-all border border-[#2A3240]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  {getStateIcon(deployment.state)}
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{deployment.projectName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {getEnvironmentBadge(deployment.environment)}
                      {getStateBadge(deployment.state)}
                      {deployment.healthScore !== null && (
                        <Badge
                          variant={
                            deployment.healthScore >= 80
                              ? 'success'
                              : deployment.healthScore >= 60
                              ? 'warning'
                              : 'error'
                          }
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {deployment.healthScore}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-400">
                {deployment.branch && (
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Branch</div>
                    <div className="text-white">{deployment.branch}</div>
                  </div>
                )}
                {deployment.commitSha && (
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Commit</div>
                    <div className="text-white font-mono text-xs">
                      {deployment.commitSha.slice(0, 7)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-slate-500 text-xs mb-1">Created</div>
                  <div className="text-white">{formatDate(deployment.createdAt)}</div>
                </div>
                {deployment.metadata.buildDuration && (
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Build Time</div>
                    <div className="text-white">
                      {formatDuration(deployment.metadata.buildDuration)}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-[#2A3240]">
                <a
                  href={deployment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="secondary" size="sm" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit
                  </Button>
                </a>
                <Button
                  onClick={() => handleViewLogs(deployment)}
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                >
                  <Terminal className="w-4 h-4 mr-2" />
                  Logs
                </Button>
                {deployment.state === 'ready' && deployment.environment === 'production' && (
                  <Button
                    onClick={() => handleRollback(deployment)}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Rollback
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Logs Modal */}
      {showLogs && selectedDeployment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[80vh] flex flex-col">
            <CardHeader>
              <span>
                Deployment Logs: {selectedDeployment.projectName} (
                {selectedDeployment.environment})
              </span>
              <Button onClick={() => setShowLogs(false)} variant="secondary" size="sm">
                Close
              </Button>
            </CardHeader>
            <div className="flex-1 overflow-auto">
              <div className="bg-[#0A0E12] rounded-lg p-4 font-mono text-xs">
                {logs.map((log, i) => (
                  <div key={i} className="text-slate-300">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
