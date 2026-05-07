import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import tokenService from '../../services/tokenService';
import { departmentService } from '../../services/displayService';
import Button from '../common/Button';
import Card from '../common/Card';

const TokenManagement = () => {
  const [tokens, setTokens] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchTokens = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = selectedDepartment 
        ? await tokenService.getTokensByDepartment(selectedDepartment)
        : await tokenService.getAllTokens();
      setTokens(response.tokens || []);
    } catch {
      toast.error('Failed to fetch tokens');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAllDepartments();
      setDepartments(response.departments || []);
    } catch {
      toast.error('Failed to fetch departments');
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchTokens();
    }
  }, [selectedDepartment, fetchTokens]);

  const handleCallNext = async () => {
    if (!selectedDepartment) {
      toast.error('Please select a department');
      return;
    }

    try {
      const response = await tokenService.callNextToken(selectedDepartment);
      toast.success(`Called token: ${response.token.tokenNumber}`);
      fetchTokens();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to call next token');
    }
  };

  const handleCompleteToken = async (tokenId) => {
    try {
      await tokenService.completeToken(tokenId);
      toast.success('Token completed');
      fetchTokens();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete token');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'token-waiting';
      case 'active': return 'token-active';
      case 'completed': return 'token-completed';
      default: return 'token-waiting';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'emergency': return 'text-danger-600 font-bold';
      case 'urgent': return 'text-warning-600 font-semibold';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Token Management">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          
          <Button onClick={handleCallNext} disabled={!selectedDepartment}>
            Call Next Token
          </Button>
          
          <Button onClick={fetchTokens} variant="secondary">
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading tokens...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tokens.map((token) => (
                  <tr key={token.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {token.tokenNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {token.patientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {token.departmentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={getPriorityColor(token.priority)}>
                        {token.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(token.status)}`}>
                        {token.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(token.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {token.status === 'active' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleCompleteToken(token.id)}
                        >
                          Complete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {tokens.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No tokens found</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default TokenManagement;
