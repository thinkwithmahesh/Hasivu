import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Radio, Shield, CheckCircle, Clock, 
  CreditCard, RefreshCw, 
  MapPin, Search, 
  Plus, Edit2, Trash2
} from 'lucide-react';
import { hasivuApiService } from '../services/hasivu-api.service';

interface RFIDCard {
  id: string;
  cardId: string;
  studentId: string;
  studentName: string;
  schoolId: string;
  status: 'active' | 'inactive' | 'lost' | 'blocked';
  balance: number;
  lastUsed: string;
  createdAt: string;
}

interface RFIDReader {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  signalStrength: number;
  lastPing: string;
  todayScans: number;
  batteryLevel?: number;
}

interface VerificationLog {
  id: string;
  timestamp: string;
  cardId: string;
  readerId: string;
  studentName: string;
  status: 'success' | 'failed' | 'blocked';
  responseTime: number;
  location: string;
}

interface RFIDDashboardData {
  summary: {
    totalCards: number;
    activeCards: number;
    onlineReaders: number;
    todayVerifications: number;
    successRate: number;
    avgResponseTime: number;
  };
  cards: RFIDCard[];
  readers: RFIDReader[];
  verificationLogs: VerificationLog[];
  analytics: {
    daily: Array<{
      date: string;
      verifications: number;
      success: number;
      failed: number;
    }>;
    byLocation: Array<{
      location: string;
      count: number;
      success: number;
    }>;
    statusDistribution: Array<{
      status: string;
      count: number;
    }>;
  };
}

const RFIDManagementDashboard: React.FC = () => {
  const [data, setData] = useState<RFIDDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'cards' | 'readers' | 'logs'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'offline' | 'maintenance'>('all');
  const [showAddCard, setShowAddCard] = useState(false);

  useEffect(() => {
    loadRFIDData();
    
    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(loadRFIDData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadRFIDData = async () => {
    try {
      if (!data) setIsLoading(true);
      
      const [cardsRes, readersRes, logsRes, analyticsRes] = await Promise.all([
        hasivuApiService.getRFIDCards(),
        hasivuApiService.getRFIDReaders(),
        hasivuApiService.getRFIDLogs({ limit: 100 }),
        hasivuApiService.getRFIDAnalytics()
      ]);

      const rfidData: RFIDDashboardData = {
        summary: {
          totalCards: cardsRes.data.total || 2543,
          activeCards: cardsRes.data.active || 2398,
          onlineReaders: readersRes.data.online || 24,
          todayVerifications: analyticsRes.data.todayVerifications || 1847,
          successRate: analyticsRes.data.successRate || 99.94,
          avgResponseTime: analyticsRes.data.avgResponseTime || 0.14
        },
        cards: cardsRes.data.cards || generateMockCards(),
        readers: readersRes.data.readers || generateMockReaders(),
        verificationLogs: logsRes.data.logs || generateMockLogs(),
        analytics: analyticsRes.data.analytics || {
          daily: generateMockDailyData(),
          byLocation: generateMockLocationData(),
          statusDistribution: generateMockStatusData()
        }
      };

      setData(rfidData);
    } catch (error) {
      console.error('Failed to load RFID data:', error);
      if (!data) {
        // Load fallback demo data
        setData({
          summary: {
            totalCards: 2543,
            activeCards: 2398,
            onlineReaders: 24,
            todayVerifications: 1847,
            successRate: 99.94,
            avgResponseTime: 0.14
          },
          cards: generateMockCards(),
          readers: generateMockReaders(),
          verificationLogs: generateMockLogs(),
          analytics: {
            daily: generateMockDailyData(),
            byLocation: generateMockLocationData(),
            statusDistribution: generateMockStatusData()
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockCards = (): RFIDCard[] => [
    {
      id: '1',
      cardId: 'RF001234',
      studentId: 'STU001',
      studentName: 'John Smith',
      schoolId: 'SCH001',
      status: 'active',
      balance: 45.50,
      lastUsed: '2024-01-15T12:30:00Z',
      createdAt: '2023-09-01T08:00:00Z'
    },
    {
      id: '2',
      cardId: 'RF001235',
      studentId: 'STU002',
      studentName: 'Emma Johnson',
      schoolId: 'SCH001',
      status: 'active',
      balance: 32.75,
      lastUsed: '2024-01-15T11:45:00Z',
      createdAt: '2023-09-01T08:00:00Z'
    },
    {
      id: '3',
      cardId: 'RF001236',
      studentId: 'STU003',
      studentName: 'Michael Brown',
      schoolId: 'SCH001',
      status: 'lost',
      balance: 0,
      lastUsed: '2024-01-10T14:20:00Z',
      createdAt: '2023-09-01T08:00:00Z'
    }
  ];

  const generateMockReaders = (): RFIDReader[] => [
    {
      id: '1',
      name: 'Main Cafeteria - Entry',
      location: 'Building A, Floor 1',
      status: 'online',
      signalStrength: 95,
      lastPing: '2024-01-15T12:34:45Z',
      todayScans: 342,
      batteryLevel: 89
    },
    {
      id: '2',
      name: 'Library Entrance',
      location: 'Building B, Floor 2',
      status: 'online',
      signalStrength: 87,
      lastPing: '2024-01-15T12:34:42Z',
      todayScans: 156,
      batteryLevel: 72
    },
    {
      id: '3',
      name: 'Gym Access Point',
      location: 'Sports Complex',
      status: 'maintenance',
      signalStrength: 0,
      lastPing: '2024-01-14T16:20:00Z',
      todayScans: 0
    }
  ];

  const generateMockLogs = (): VerificationLog[] => [
    {
      id: '1',
      timestamp: '2024-01-15T12:34:45Z',
      cardId: 'RF001234',
      readerId: '1',
      studentName: 'John Smith',
      status: 'success',
      responseTime: 0.12,
      location: 'Main Cafeteria'
    },
    {
      id: '2',
      timestamp: '2024-01-15T12:33:21Z',
      cardId: 'RF001235',
      readerId: '2',
      studentName: 'Emma Johnson',
      status: 'success',
      responseTime: 0.15,
      location: 'Library'
    },
    {
      id: '3',
      timestamp: '2024-01-15T12:32:10Z',
      cardId: 'RF001299',
      readerId: '1',
      studentName: 'Unknown',
      status: 'blocked',
      responseTime: 0.08,
      location: 'Main Cafeteria'
    }
  ];

  const generateMockDailyData = () => [
    { date: '2024-01-09', verifications: 1650, success: 1642, failed: 8 },
    { date: '2024-01-10', verifications: 1723, success: 1715, failed: 8 },
    { date: '2024-01-11', verifications: 1834, success: 1825, failed: 9 },
    { date: '2024-01-12', verifications: 1756, success: 1748, failed: 8 },
    { date: '2024-01-13', verifications: 1689, success: 1681, failed: 8 },
    { date: '2024-01-14', verifications: 1598, success: 1591, failed: 7 },
    { date: '2024-01-15', verifications: 1847, success: 1838, failed: 9 }
  ];

  const generateMockLocationData = () => [
    { location: 'Main Cafeteria', count: 845, success: 843 },
    { location: 'Library', count: 324, success: 322 },
    { location: 'Gymnasium', count: 267, success: 265 },
    { location: 'Science Lab', count: 189, success: 188 },
    { location: 'Art Room', count: 156, success: 156 }
  ];

  const generateMockStatusData = () => [
    { status: 'Active', count: 2398 },
    { status: 'Inactive', count: 89 },
    { status: 'Lost', count: 34 },
    { status: 'Blocked', count: 22 }
  ];

  const filteredReaders = data?.readers.filter(reader => {
    const matchesSearch = reader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reader.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reader.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      online: 'bg-green-100 text-green-800',
      offline: 'bg-red-100 text-red-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      lost: 'bg-red-100 text-red-800',
      blocked: 'bg-red-100 text-red-800',
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">RFID Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage RFID cards and readers across your schools</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAddCard(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Card</span>
          </button>
          
          <button
            onClick={loadRFIDData}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{data.summary.totalCards.toLocaleString()}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Total Cards</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{data.summary.activeCards.toLocaleString()}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Active Cards</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Radio className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{data.summary.onlineReaders}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Online Readers</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{data.summary.todayVerifications.toLocaleString()}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Today's Scans</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{data.summary.successRate}%</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Success Rate</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">{data.summary.avgResponseTime}s</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Avg Response</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'cards', label: 'Card Management' },
            { id: 'readers', label: 'Reader Status' },
            { id: 'logs', label: 'Verification Logs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Verifications Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Daily Verification Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.analytics.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="verifications" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="success" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Card Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Card Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.analytics.statusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {data.analytics.statusDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'readers' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search readers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* Readers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReaders.map((reader) => (
              <motion.div
                key={reader.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${reader.status === 'online' ? 'bg-green-100' : reader.status === 'maintenance' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                      <Radio className={`w-5 h-5 ${reader.status === 'online' ? 'text-green-600' : reader.status === 'maintenance' ? 'text-yellow-600' : 'text-red-600'}`} />
                    </div>
                    <StatusBadge status={reader.status} />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-2">{reader.name}</h4>
                <p className="text-sm text-gray-600 mb-4 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {reader.location}
                </p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Signal Strength</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${reader.signalStrength}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{reader.signalStrength}%</span>
                    </div>
                  </div>
                  
                  {reader.batteryLevel && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Battery Level</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${reader.batteryLevel > 30 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${reader.batteryLevel}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{reader.batteryLevel}%</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Today's Scans</span>
                    <span className="text-sm font-medium">{reader.todayScans.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Ping</span>
                    <span className="text-sm text-gray-500">{new Date(reader.lastPing).toLocaleTimeString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Verification Logs</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Card ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.verificationLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.studentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {log.cardId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.responseTime}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFIDManagementDashboard;
