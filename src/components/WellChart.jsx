import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#fff',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px'
      }}>
        <p style={{ margin: '0', fontWeight: 'bold' }}>Depth: {payload[0].payload.depth}m</p>
        <p style={{ margin: '0', color: '#ef4444' }}>Max: {payload[0].value} inches</p>
        <p style={{ margin: '0', color: '#3b82f6' }}>Min: {payload[1].value} inches</p>
        <p style={{ margin: '0', color: '#22c55e' }}>Avg: {payload[2].value} inches</p>
      </div>
    );
  }
  return null;
};

const WellChart = ({ currentDepth }) => {
  const caliperData = [
    { depth: 0, max: 12.5, min: 11.2, avg: 11.8 },
    { depth: 50, max: 12.6, min: 11.4, avg: 12.0 },
    { depth: 100, max: 12.8, min: 11.5, avg: 12.2 },
    { depth: 150, max: 13.0, min: 11.8, avg: 12.4 },
    { depth: 200, max: 13.2, min: 12.0, avg: 12.6 },
    { depth: 250, max: 13.4, min: 12.2, avg: 12.8 },
    { depth: 300, max: 13.0, min: 12.0, avg: 12.5 },
    { depth: 350, max: 13.1, min: 12.1, avg: 12.6 },
    { depth: 400, max: 12.7, min: 11.9, avg: 12.3 }
  ];

  return (
    <div style={{ width: '100%', height: '500px', padding: '20px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={caliperData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="depth" 
            type="number"
            domain={[0, 400]}
            label={{ value: 'Depth (m)', position: 'bottom' }}
          />
          <YAxis
            domain={[11, 14]}
            label={{ value: 'Diameter (inches)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
          />
          <Line
            type="monotone"
            dataKey="max"
            stroke="#ef4444"
            name="Max Diameter"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="min"
            stroke="#3b82f6"
            name="Min Diameter"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="avg"
            stroke="#22c55e"
            name="Avg Diameter"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          {currentDepth !== null && (
            <ReferenceLine
              x={Math.abs(currentDepth)}
              stroke="#000"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{
                position: 'right',
                value: `Current Depth: ${Math.abs(currentDepth).toFixed(1)}m`,
                fill: '#000',
                fontSize: 12
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WellChart;