import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Search, Loader2, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

const RecentClaimsDashboard = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 8; // CHANGE IF NEEDED

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:4000/claims');
        if (!res.ok) {
          console.error('Failed to fetch claims', res.statusText);
          setClaims([]);
        } else {
          const data = await res.json();
          if (!cancelled) setClaims(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('Error fetching claims', e);
        if (!cancelled) setClaims([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    // simple polling: refresh every 8s so analytics sees new saved claims quickly
    const interval = setInterval(fetchData, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // safe accessor: if someone saved a different shape, normalize a bit
  const normalizedClaims = claims.map((c) => ({
    id: c.id ?? c._id ?? Math.random(),
    category: (c.category || 'general').toString(),
    verdict: (c.verdict || 'unverified').toString(),
    confidence: Number(c.confidence ?? 0),
    explanation: c.explanation ?? {},
    createdAt: c.createdAt ?? ''
  }));

  // --- DATA PROCESSING ---
  const verdictCounts = normalizedClaims.reduce((acc, curr) => {
    const v = (curr.verdict || 'unverified').toLowerCase();
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});

  const pieData = [
    { name: 'True', value: verdictCounts['true'] || 0 },
    { name: 'False', value: verdictCounts['false'] || 0 },
    { name: 'Unverified', value: verdictCounts['unverified'] || 0 }
  ];

  const PIE_COLORS = ['#10B981', '#EF4444', '#F59E0B'];

  const categoryCounts = normalizedClaims.reduce((acc, curr) => {
    const c = curr.category || 'Others';
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.keys(categoryCounts).map((key) => ({
    name: key,
    count: categoryCounts[key]
  }));

  // --- FILTER & SEARCH (filter first, then reverse, then paginate)
  const filteredClaims = normalizedClaims.filter((claim) => {
    const term = searchTerm.toLowerCase();
    return (
      claim.category.toLowerCase().includes(term) ||
      claim.verdict.toLowerCase().includes(term)
    );
  });

  const reversedList = filteredClaims.slice().reverse(); // newest first

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;

  const displayList = reversedList.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(reversedList.length / entriesPerPage);

  const getVerdictStyle = (verdict) => {
    switch ((verdict || '').toLowerCase()) {
      case 'true':
        return {
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        };
      case 'false':
        return {
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          icon: <AlertCircle className="w-4 h-4 text-rose-400" />
        };
      default:
        return {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: <HelpCircle className="w-4 h-4 text-amber-400" />
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-4" />
        <p className="text-gray-400 animate-pulse">Connecting to Database...</p>
      </div>
    );
  }

  return (
    <div className="pt-8">
      <header className="max-w-7xl mx-auto mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
          Analytics Dashboard
        </h1>
        <p className="text-slate-400 text-lg">Real-time verification metrics & claim history</p>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Pie */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-2xl p-6 flex flex-col items-center hover:bg-white/10 transition-colors duration-300">
          <h2 className="text-xl font-semibold mb-6 text-slate-200 w-full border-b border-white/5 pb-2">Verdict Distribution</h2>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-2xl p-6 hover:bg-white/10 transition-colors duration-300">
          <h2 className="text-xl font-semibold mb-6 text-slate-200 w-full border-b border-white/5 pb-2">Claims by Category</h2>
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent History List */}
        <div className="lg:col-span-2">
          <div className="backdrop-blur-xl bg-white/10 border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                <h2 className="text-xl font-bold text-white tracking-wide">Claims History</h2>
              </div>

              <div className="relative w-full md:w-72 group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Filter by category or verdict..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="grid grid-cols-3 bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 text-center">Sr. No</th>
                    <th className="p-4 text-center">Category</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {displayList.length > 0 ? (
                    displayList.map((claim, index) => {
                      const style = getVerdictStyle(claim.verdict);
                      return (
                        <tr key={claim.id || index} className="grid grid-cols-3 items-center hover:bg-white/5 transition-colors group">
                          <td className="p-4 text-center text-slate-400 font-mono text-sm">{index + 1 + (currentPage - 1) * entriesPerPage}</td>
                          <td className="p-4 text-center">
                            <span className="font-medium text-slate-200 group-hover:text-white transition-colors capitalize">{claim.category}</span>
                          </td>
                          <td className="p-4 flex justify-center">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${style.badge} uppercase tracking-wide shadow-sm`}>
                              {style.icon}
                              {claim.verdict}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr className="grid grid-cols-3">
                      <td colSpan={3} className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <Search className="w-8 h-8 mb-2 opacity-50" />
                          <p>No results found for "{searchTerm}"</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROLS */}
            <div className="p-4 border-t border-white/5 bg-white/5 flex items-center justify-center gap-3">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} className="px-3 py-1 rounded bg-white/10 text-slate-300 hover:bg-white/20 transition">
                Prev
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1 rounded transition ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}>
                  {i + 1}
                </button>
              ))}

              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} className="px-3 py-1 rounded bg-white/10 text-slate-300 hover:bg-white/20 transition">
                Next
              </button>
            </div>

            <div className="block text-white/50 bg-white/5 flex justify-center pb-4">Showing {displayList.length} of {claims.length} verified claims</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Analytics = () => {
  return <RecentClaimsDashboard />;
};

export default Analytics;
