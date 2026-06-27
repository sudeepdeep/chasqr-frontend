import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Eye } from 'lucide-react';
import { getAnalyticsAPI } from '../api/site.api';

interface AnalyticsData {
  total: number;
  last30Days: number;
  dailyAverage: number;
  chartData: Array<{ date: string; visits: number }>;
}

export default function AnalyticsChart({ siteId }: { siteId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsAPI(siteId)
      .then(res => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>Unable to load analytics</p>
      </div>
    );
  }

  // Find max visits for scaling
  const maxVisits = Math.max(...data.chartData.map(d => d.visits), 1);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 rounded-xl p-4 border border-slate-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <Eye size={14} className="text-primary" />
            <p className="text-xs font-medium text-slate-500">Total Visits</p>
          </div>
          <p className="font-bebas text-3xl text-slate-900">{data.total}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-50 rounded-xl p-4 border border-slate-200"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-orange-400" />
            <p className="text-xs font-medium text-slate-500">Last 30 Days</p>
          </div>
          <p className="font-bebas text-3xl text-slate-900">{data.last30Days}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-50 rounded-xl p-4 border border-slate-200 col-span-2 md:col-span-1"
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={14} className="text-purple-400" />
            <p className="text-xs font-medium text-slate-500">Daily Average</p>
          </div>
          <p className="font-bebas text-3xl text-slate-900">{data.dailyAverage}</p>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white border border-slate-200 rounded-xl p-6"
      >
        <h3 className="font-bebas text-lg text-slate-900 mb-4">Visitors (Last 30 Days)</h3>

        <div className="flex items-end justify-between gap-1 h-40">
          {data.chartData.map((day, idx) => {
            const height = maxVisits > 0 ? (day.visits / maxVisits) * 100 : 0;
            const isToday = idx === data.chartData.length - 1;

            return (
              <motion.div
                key={day.date}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: 0.01 * idx }}
                className={`flex-1 rounded-t-sm transition-colors hover:opacity-80 cursor-pointer group relative ${
                  isToday ? 'bg-primary' : 'bg-primary/40'
                }`}
                title={`${day.date}: ${day.visits} visits`}
              >
                {day.visits > 0 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.visits}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-between text-xs text-slate-400 mt-6">
          <span>{data.chartData[0].date}</span>
          <span>{data.chartData[data.chartData.length - 1].date}</span>
        </div>
      </motion.div>
    </div>
  );
}
