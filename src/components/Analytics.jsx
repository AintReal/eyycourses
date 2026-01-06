import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faGraduationCap, 
  faTicket, 
  faDollarSign,
  faClock,
  faChartLine,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    usersWithCodes: 0,
    totalRevenue: 0,
    totalCourses: 0,
    totalLessons: 0,
    revenuePerCourse: 38, // SAR per access code
  });
  const [userActivity, setUserActivity] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    
    try {
      // Fetch users data
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch courses data
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*');

      // Fetch lessons data
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*');

      // Fetch access codes data
      const { data: accessCodes, error: codesError } = await supabase
        .from('access_codes')
        .select('*');

      if (usersError || coursesError || lessonsError || codesError) {
        console.error('Error fetching analytics:', { usersError, coursesError, lessonsError, codesError });
        return;
      }

      // Calculate stats
      const usersWithValidatedCodes = users?.filter(u => u.code_validated) || [];
      const totalRevenue = usersWithValidatedCodes.length * 38;

      setStats({
        totalUsers: users?.length || 0,
        usersWithCodes: usersWithValidatedCodes.length,
        totalRevenue: totalRevenue,
        totalCourses: courses?.length || 0,
        totalLessons: lessons?.length || 0,
        revenuePerCourse: 38,
      });

      // Course enrollment stats
      const courseStatsData = courses?.map(course => {
        const enrolledUsers = usersWithValidatedCodes.length; // All validated users have access to all courses for now
        return {
          name: course.title_en.substring(0, 20) + '...',
          students: enrolledUsers,
          revenue: enrolledUsers * 38,
        };
      }) || [];
      setCourseStats(courseStatsData);

      // User activity over time (signups per day)
      const activityData = generateActivityData(users || []);
      setUserActivity(activityData);

      // Recent users
      setRecentUsers(users?.slice(0, 10) || []);

    } catch (error) {
      console.error('Error in fetchAnalytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateActivityData = (users) => {
    // Group users by signup date
    const dateCounts = {};
    users.forEach(user => {
      const date = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    // Convert to array for chart
    return Object.entries(dateCounts).map(([date, count]) => ({
      date,
      signups: count,
    })).slice(-7); // Last 7 days
  };

  const COLORS = ['#71717a', '#52525b', '#3f3f46', '#27272a', '#18181b'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Analytics Dashboard</h2>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-xl p-6 text-white shadow-lg border border-zinc-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-300 text-sm font-medium">Total Users</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalUsers}</h3>
            </div>
            <FontAwesomeIcon icon={faUsers} className="text-4xl text-zinc-500" />
          </div>
        </div>

        {/* Paid Users (with codes) */}
        <div className="bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-xl p-6 text-white shadow-lg border border-zinc-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-300 text-sm font-medium">Paid Users</p>
              <h3 className="text-3xl font-bold mt-2">{stats.usersWithCodes}</h3>
              <p className="text-zinc-400 text-xs mt-1">Access codes validated</p>
            </div>
            <FontAwesomeIcon icon={faTicket} className="text-4xl text-zinc-500" />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-xl p-6 text-white shadow-lg border border-zinc-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-300 text-sm font-medium">Total Revenue</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalRevenue} USD</h3>
              <p className="text-zinc-400 text-xs mt-1">38 USD per user</p>
            </div>
            <FontAwesomeIcon icon={faDollarSign} className="text-4xl text-zinc-500" />
          </div>
        </div>

        {/* Total Courses */}
        <div className="bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-xl p-6 text-white shadow-lg border border-zinc-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zinc-300 text-sm font-medium">Active Courses</p>
              <h3 className="text-3xl font-bold mt-2">{stats.totalCourses}</h3>
              <p className="text-zinc-400 text-xs mt-1">{stats.totalLessons} lessons total</p>
            </div>
            <FontAwesomeIcon icon={faGraduationCap} className="text-4xl text-zinc-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Signups Chart */}
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faChartLine} className="text-zinc-400" />
            User Signups (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#27272a', border: '1px solid #52525b', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="signups" stroke="#71717a" strokeWidth={3} dot={{ fill: '#52525b', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Course Revenue Chart */}
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faDollarSign} className="text-zinc-400" />
            Revenue by Course
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#27272a', border: '1px solid #52525b', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="revenue" fill="#52525b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
        <div className="p-6 border-b border-zinc-700">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FontAwesomeIcon icon={faEye} className="text-zinc-400" />
            Recent Users
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Access Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {recentUsers.map((user, index) => (
                <tr key={user.id} className="hover:bg-zinc-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">
                        {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{user.full_name || 'No name'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.code_validated ? (
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                        ✓ Validated
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white font-semibold">
                    {user.code_validated ? `SAR 38` : 'SAR 0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                    {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;