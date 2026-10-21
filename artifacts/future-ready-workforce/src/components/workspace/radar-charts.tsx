import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';

// Kept in its own module so the dashboard can load recharts lazily.

export function CohortRadarChart({ data }: { data: { skill: string; average: number; records: number }[] }) {
  return <ResponsiveContainer width="100%" height="100%">
    <RadarChart data={data} outerRadius="68%">
      <PolarGrid stroke="#dce5ef" />
      <PolarAngleAxis dataKey="skill" tick={{ fill: '#60748b', fontSize: 10 }} />
      <PolarRadiusAxis domain={[0, 5]} tickCount={6} axisLine={false} tick={{ fill: '#8796a8', fontSize: 8 }} />
      <Tooltip isAnimationActive={false} formatter={value => `${Number(value).toFixed(1)}/5`} />
      <Radar name="Average listed proficiency" dataKey="average" type="natural" stroke="#1674d1" fill="#1674d1" fillOpacity={0.2} isAnimationActive={false} />
    </RadarChart>
  </ResponsiveContainer>;
}

export function PersonalRadarChart({ data }: { data: { skill: string; profile: number; target: number; listed: boolean }[] }) {
  return <ResponsiveContainer width="100%" height="100%">
    <RadarChart data={data} outerRadius="68%">
      <PolarGrid stroke="#dce5ef" />
      <PolarAngleAxis dataKey="skill" tick={{ fill: '#60748b', fontSize: 10 }} />
      <PolarRadiusAxis domain={[0, 5]} tickCount={6} axisLine={false} tick={{ fill: '#8796a8', fontSize: 8 }} />
      <Tooltip isAnimationActive={false} formatter={(value, name, item) => [item.payload.listed || name === 'Sample target' ? `${value}/5` : 'Not listed · drawn at 0/5', name]} />
      <Radar name="Your listed level" dataKey="profile" type="natural" stroke="#1674d1" fill="#1674d1" fillOpacity={0.24} isAnimationActive={false} />
      <Radar name="Sample target" dataKey="target" type="natural" stroke="#7892ad" fill="#7892ad" fillOpacity={0.08} isAnimationActive={false} />
    </RadarChart>
  </ResponsiveContainer>;
}
