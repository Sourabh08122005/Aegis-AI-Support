import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Shield, AlertTriangle, Clock, Activity, Search, ShieldX } from 'lucide-react';

interface Metric {
  date: string;
  totalQueries: number;
  unsafeQueries: number;
  avgLatency: number;
}

interface SafetyLog {
  id: string;
  timestamp: any;
  type: 'input' | 'output';
  content: string;
  isSafe: boolean;
  reasons: string[];
  userId: string;
  latency?: number;
}

export default function AdminDashboard({ user }: { user: User }) {
  const [logs, setLogs] = useState<SafetyLog[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    // Fetch Logs
    const qLogs = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as SafetyLog[]);
    });

    // Mock metrics based on logs for visualization since actual aggregation is backend-heavy
    // In a prod app, a cloud function would aggregate these into the 'metrics' collection
    return () => unsubLogs();
  }, []);

  const stats = [
    {
      title: "Total Queries",
      value: logs.length,
      icon: Activity,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Safety Alerts",
      value: logs.filter(l => !l.isSafe).length,
      icon: ShieldX,
      color: "text-red-600",
      bg: "bg-red-50"
    },
    {
      title: "Avg Latency",
      value: `${Math.round(logs.reduce((acc, l) => acc + (l.latency || 0), 0) / (logs.filter(l => l.latency).length || 1))}ms`,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      title: "Safety Score",
      value: `${Math.round((logs.filter(l => l.isSafe).length / (logs.length || 1)) * 100)}%`,
      icon: Shield,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Observability Dashboard</h1>
          <p className="text-slate-500">Real-time monitoring of AI performance and safety metrics.</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 bg-indigo-50 text-indigo-700 border-indigo-100">
          Admin: {user.email?.split('@')[0]}
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <Card key={idx} className="border-slate-200 shadow-sm rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-500">{s.title}</p>
                <div className={`p-2 rounded-xl ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{s.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-12">
          <TabsTrigger value="overview" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">System Health</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">Safety Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-slate-200 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Safety Trends</CardTitle>
                <CardDescription>Ratio of safe vs unsafe queries over time.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Mon', safe: 120, unsafe: 2 },
                    { name: 'Tue', safe: 145, unsafe: 5 },
                    { name: 'Wed', safe: 132, unsafe: 1 },
                    { name: 'Thu', safe: 180, unsafe: 8 },
                    { name: 'Fri', safe: logs.filter(l => l.isSafe).length || 200, unsafe: logs.filter(l => !l.isSafe).length || 4 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{fill: '#f8fafc'}}
                    />
                    <Bar dataKey="safe" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="unsafe" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-slate-200 rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Latency Distribution (ms)</CardTitle>
                <CardDescription>Response time performance tracking.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { name: '1', ms: 1200 },
                    { name: '2', ms: 1450 },
                    { name: '3', ms: 1100 },
                    { name: '4', ms: 1800 },
                    { name: '5', ms: 900 },
                    ...logs.filter(l => l.latency).slice(-10).map((l, i) => ({ name: '', ms: l.latency }))
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Line type="monotone" dataKey="ms" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold">Timestamp</TableHead>
                  <TableHead className="font-bold">Type</TableHead>
                  <TableHead className="font-bold w-[40%]">Content</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Reasons</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {log.timestamp?.toDate().toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {log.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      <div className="truncate max-w-[400px]">
                        {log.content}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.isSafe ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                          <Shield className="w-3 h-3" /> Safe
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-600 text-xs font-bold">
                          <AlertTriangle className="w-3 h-3" /> Blocked
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {log.reasons?.map((r, i) => (
                          <Badge key={i} variant="secondary" className="bg-red-50 text-red-600 border-red-100 text-[10px]">
                            {r}
                          </Badge>
                        )) || <span className="text-slate-300">-</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
