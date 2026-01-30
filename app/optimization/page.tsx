'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AmazonConnection {
  id: number;
  profile_id: string;
  profile_name: string;
  marketplace_id: string;
  country_code: string;
}

interface OptimizationRule {
  id: string;
  name: string;
  rule_type: string;
  enabled: boolean;
  schedule: string;
  priority: number;
  conditions: any;
  actions: any;
  last_run_at: string;
  next_run_at: string;
  run_count: number;
  success_count: number;
  failure_count: number;
}

export default function OptimizationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [connections, setConnections] = useState<AmazonConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [rules, setRules] = useState<OptimizationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      fetchRules();
    }
  }, [selectedConnection]);

  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/amazon/connections');
      const data = await res.json();
      if (data.success) {
        setConnections(data.connections);
        if (data.connections.length > 0) {
          setSelectedConnection(data.connections[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    if (!selectedConnection) return;
    
    try {
      const res = await fetch(`/api/optimization/rules?connectionId=${selectedConnection}`);
      const data = await res.json();
      if (data.success) {
        setRules(data.rules);
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/optimization/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled })
      });
      
      if (res.ok) {
        fetchRules();
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const executeRule = async (ruleId: string) => {
    try {
      const res = await fetch('/api/optimization/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId })
      });
      
      const data = await res.json();
      if (data.success) {
        alert(`Rule executed successfully! ${data.execution.entitiesAffected} entities affected.`);
        fetchRules();
      } else {
        alert(`Failed to execute rule: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to execute rule:', error);
      alert('Failed to execute rule');
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      const res = await fetch(`/api/optimization/rules/${ruleId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchRules();
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Optimization Rules</h1>
          <p className="text-gray-600 mt-2">Automate your Amazon Ads campaigns with intelligent rules</p>
        </div>

        {/* Profile Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Amazon Profile
          </label>
          <select
            value={selectedConnection || ''}
            onChange={(e) => setSelectedConnection(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {connections.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.profile_name} ({conn.country_code}) - {conn.profile_id}
              </option>
            ))}
          </select>
        </div>

        {/* Create Rule Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            + Create New Rule
          </button>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {rules.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">No optimization rules created yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first rule →
              </button>
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{rule.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {rule.rule_type.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-gray-500">Schedule:</span>
                        <p className="font-medium">{rule.schedule}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Priority:</span>
                        <p className="font-medium">{rule.priority}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Executions:</span>
                        <p className="font-medium">{rule.run_count}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Success Rate:</span>
                        <p className="font-medium">
                          {rule.run_count > 0
                            ? `${Math.round((rule.success_count / rule.run_count) * 100)}%`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {rule.last_run_at && (
                      <div className="mt-3 text-sm text-gray-600">
                        Last run: {new Date(rule.last_run_at).toLocaleString()}
                      </div>
                    )}
                    {rule.next_run_at && (
                      <div className="text-sm text-gray-600">
                        Next run: {new Date(rule.next_run_at).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleRule(rule.id, rule.enabled)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        rule.enabled
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {rule.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => executeRule(rule.id)}
                      disabled={!rule.enabled}
                      className="px-4 py-2 rounded-lg font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Run Now
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="px-4 py-2 rounded-lg font-medium bg-red-100 text-red-800 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Rule Modal */}
        {showCreateModal && (
          <CreateRuleModal
            connectionId={selectedConnection}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchRules();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Create Rule Modal Component
function CreateRuleModal({ connectionId, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: '',
    rule_type: 'BID_ADJUSTMENT',
    schedule: 'DAILY',
    priority: 0,
    conditions: {},
    actions: {}
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/optimization/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amazon_connection_id: connectionId
        })
      });
      
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(`Failed to create rule: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to create rule:', error);
      alert('Failed to create rule');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Create Optimization Rule</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rule Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rule Type
            </label>
            <select
              value={formData.rule_type}
              onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="BID_ADJUSTMENT">Bid Adjustment</option>
              <option value="KEYWORD_AUTOMATION">Keyword Automation</option>
              <option value="BUDGET_CONTROL">Budget Control</option>
              <option value="NEGATIVE_KEYWORD">Negative Keyword</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule
            </label>
            <select
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="HOURLY">Hourly</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority (0-10)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Conditions and actions will be configured in the next step after creation.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
