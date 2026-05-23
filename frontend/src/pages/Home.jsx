import { motion } from 'motion/react';
import { Rocket } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import Button from '../components/ui/Button.jsx';

const chartData = [
  { name: 'Mon', value: 12 },
  { name: 'Tue', value: 19 },
  { name: 'Wed', value: 7 },
  { name: 'Thu', value: 22 },
  { name: 'Fri', value: 15 },
  { name: 'Sat', value: 9 },
  { name: 'Sun', value: 14 },
];

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <section className="flex items-center gap-3">
        <Rocket className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Welcome to SIRA</h1>
      </section>

      <p className="text-gray-600 max-w-2xl">
        This is the starter Home page. It demonstrates Motion animations, a
        Lucide icon, a Recharts bar chart, and Tailwind CSS styling.
      </p>

      <div className="flex gap-3">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </div>

      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Weekly activity</h2>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </motion.div>
  );
}
