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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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
        <Button onClick={fetchAnalytics} variant="secondary" className="text-white">
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm font-medium">Total Users</p>
                <h3 className="text-3xl font-bold text-white mt-2">{stats.totalUsers}</h3>
              </div>
              <FontAwesomeIcon icon={faUsers} className="text-4xl text-zinc-600" />
            </div>
          </CardContent>
        </Card>

        {/* Paid Users (with codes) */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm font-medium">Paid Users</p>
                <h3 className="text-3xl font-bold text-white mt-2">{stats.usersWithCodes}</h3>
                <p className="text-zinc-500 text-xs mt-1">Access codes validated</p>
              </div>
              <FontAwesomeIcon icon={faTicket} className="text-4xl text-zinc-600" />
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm font-medium">Total Revenue</p>
                <h3 className="text-3xl font-bold text-white mt-2">{stats.totalRevenue} USD</h3>
                <p className="text-zinc-500 text-xs mt-1">38 USD per user</p>
              </div>
              <FontAwesomeIcon icon={faDollarSign} className="text-4xl text-zinc-600" />
            </div>
          </CardContent>
        </Card>

        {/* Total Courses */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm font-medium">Active Courses</p>
                <h3 className="text-3xl font-bold text-white mt-2">{stats.totalCourses}</h3>
                <p className="text-zinc-500 text-xs mt-1">{stats.totalLessons} lessons total</p>
              </div>
              <FontAwesomeIcon icon={faGraduationCap} className="text-4xl text-zinc-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Signups Chart */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FontAwesomeIcon icon={faChartLine} className="text-zinc-400" />
              User Signups (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Course Revenue Chart */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FontAwesomeIcon icon={faDollarSign} className="text-zinc-400" />
              Revenue by Course
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Recent Users Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FontAwesomeIcon icon={faEye} className="text-zinc-400" />
            Recent Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Access Code</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
                        {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{user.full_name || 'No name'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300">{user.email}</TableCell>
                  <TableCell>
                    {user.code_validated ? (
                      <Badge variant="default" className="bg-green-600 text-white">
                        ✓ Validated
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-white font-semibold">
                    {user.code_validated ? `SAR 38` : 'SAR 0'}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;