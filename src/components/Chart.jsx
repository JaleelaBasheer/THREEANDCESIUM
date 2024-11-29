import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const CaliperLogVisualization = () => {
  // Sample caliper log data
  const data = [
    {depth: 0, max: 12.5, min: 11.2, avg: 11.8},
    {depth: 10, max: 12.6, min: 11.4, avg: 12.0},
    {depth: 20, max: 12.8, min: 11.5, avg: 12.2},
    {depth: 30, max: 13.0, min: 11.8, avg: 12.4},
    {depth: 40, max: 13.2, min: 12.0, avg: 12.6},
    {depth: 50, max: 13.4, min: 12.2, avg: 12.8},
    {depth: 60, max: 13.0, min: 12.0, avg: 12.5},
    {depth: 70, max: 13.1, min: 12.1, avg: 12.6},
    {depth: 80, max: 12.7, min: 11.9, avg: 12.3},
    {depth: 90, max: 12.6, min: 11.7, avg: 12.2}
  ];

  // Custom tooltip content
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ margin: '0', fontWeight: '500' }}>Depth: {payload[0].payload.depth}m</p>
          <p style={{ margin: '0', color: '#ef4444' }}>Max: {payload[0].value} inches</p>
          <p style={{ margin: '0', color: '#3b82f6' }}>Min: {payload[1].value} inches</p>
          <p style={{ margin: '0', color: '#22c55e' }}>Avg: {payload[2].value} inches</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        Well Caliper Log Visualization
      </h2>
      <div style={{ width: '100%', height: '600px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="depth"
              label={{ 
                value: 'Depth (m)', 
                position: 'bottom',
                offset: -10
              }}
            />
            <YAxis
              domain={[11, 14]}
              label={{ 
                value: 'Diameter (inches)', 
                angle: -90, 
                position: 'left',
                offset: -5
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Line
              type="monotone"
              dataKey="max"
              stroke="#ef4444"
              name="Max Diameter"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="min"
              stroke="#3b82f6"
              name="Min Diameter"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#22c55e"
              name="Avg Diameter"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CaliperLogVisualization;