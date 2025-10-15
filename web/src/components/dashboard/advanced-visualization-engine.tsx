'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  ReferenceLine,
  Brush,
  Legend,
  BarChart,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import {
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  TrendingUp,
  Settings,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  Play,
  Pause,
  Zap,
  Target,
  MapPin,
  Globe,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Gauge,
  Grid,
  Smartphone,
  Monitor,
  Tablet,
  Wifi,
  Code,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as d3 from 'd3';

// =====================================================
// VISUALIZATION INTERFACES
// =====================================================

interface VisualizationConfig {
  id: string;
  title: string;
  type:
    | 'bar'
    | 'line'
    | 'area'
    | 'pie'
    | 'scatter'
    | 'heatmap'
    | 'treemap'
    | 'radar'
    | 'funnel'
    | 'gauge'
    | 'sankey'
    | 'geo'
    | 'custom';
  dataSource: string;
  dimensions: {
    width: number;
    height: number;
    responsive: boolean;
  };
  styling: {
    theme: 'light' | 'dark' | 'vibrant' | 'minimal';
    colorScheme: string[];
    customColors?: Record<string, string>;
    animations: boolean;
    animationDuration: number;
  };
  interactivity: {
    zoom: boolean;
    pan: boolean;
    brush: boolean;
    tooltip: boolean;
    drillDown: boolean;
    crossFilter: boolean;
  };
  axes: {
    xAxis: AxisConfig;
    yAxis: AxisConfig;
    secondaryY?: AxisConfig;
  };
  filters: FilterConfig[];
  realTime: {
    enabled: boolean;
    updateInterval: number;
    maxDataPoints: number;
  };
}

interface AxisConfig {
  label: string;
  scale: 'linear' | 'log' | 'time' | 'categorical';
  domain?: [number, number];
  format: string;
  gridLines: boolean;
  tickInterval?: number;
}

interface FilterConfig {
  field: string;
  type: 'range' | 'categorical' | 'date' | 'text';
  values: unknown[];
  active: boolean;
}

interface CustomWidget {
  id: string;
  title: string;
  component: React.ComponentType<unknown>;
  config: Record<string, unknown>;
  dataBinding: string[];
}

interface AdvancedVisualizationEngineProps {
  className?: string;
  onConfigChange?: (config: VisualizationConfig) => void;
  initialData?: unknown[];
  realTimeEnabled?: boolean;
}

// =====================================================
// MOCK DATA GENERATORS
// =====================================================

const generateTimeSeriesData = (days: number = 30) => {
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    data.push({
      date: date.toISOString().split('T')[0],
      revenue: 45000 + Math.random() * 15000,
      orders: 120 + Math.random() * 80,
      satisfaction: 4.2 + Math.random() * 0.6,
      efficiency: 78 + Math.random() * 15,
      cost: 28000 + Math.random() * 8000,
    });
  }
  return data;
};

const generateCategoricalData = () => [
  { category: 'North India', value: 3250, subCategories: ['Delhi', 'Punjab', 'Haryana'] },
  { category: 'South India', value: 2890, subCategories: ['Karnataka', 'Tamil Nadu', 'Kerala'] },
  { category: 'West India', value: 2156, subCategories: ['Maharashtra', 'Gujarat', 'Rajasthan'] },
  { category: 'East India', value: 1678, subCategories: ['West Bengal', 'Odisha', 'Jharkhand'] },
  { category: 'Central India', value: 1234, subCategories: ['Madhya Pradesh', 'Chhattisgarh'] },
];

const generateHeatmapData = () => {
  const data = [];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  days.forEach(day => {
    hours.forEach(hour => {
      data.push({
        day,
        hour,
        value: Math.floor(Math.random() * 100) + 1,
      });
    });
  });
  return data;
};

const generateNetworkData = () => ({
  nodes: [
    { id: 'kitchen-1', group: 'kitchen', value: 45 },
    { id: 'kitchen-2', group: 'kitchen', value: 38 },
    { id: 'school-1', group: 'school', value: 120 },
    { id: 'school-2', group: 'school', value: 95 },
    { id: 'school-3', group: 'school', value: 87 },
    { id: 'supplier-1', group: 'supplier', value: 65 },
    { id: 'supplier-2', group: 'supplier', value: 52 },
  ],
  links: [
    { source: 'supplier-1', target: 'kitchen-1', value: 25 },
    { source: 'supplier-2', target: 'kitchen-2', value: 18 },
    { source: 'kitchen-1', target: 'school-1', value: 45 },
    { source: 'kitchen-1', target: 'school-2', value: 32 },
    { source: 'kitchen-2', target: 'school-3', value: 28 },
  ],
});

// =====================================================
// VISUALIZATION COMPONENTS
// =====================================================

const CustomGaugeChart: React.FC<{
  value: number;
  max: number;
  title: string;
  color: string;
  size?: number;
}> = ({ value, max, title, color, size = 200 }) => {
  const percentage = (value / max) * 100;
  const strokeDasharray = `${percentage * 2.51} 251`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r="40"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r="40"
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-xs text-gray-500">of {max}</span>
        </div>
      </div>
      <p className="text-sm font-medium mt-2">{title}</p>
    </div>
  );
};

const HeatmapVisualization: React.FC<{
  data: Array<{ day: string; hour: number; value: number }>;
  width?: number;
  height?: number;
}> = ({ data, width = 600, height = 300 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data.length) return;

    const container = d3.select(containerRef.current);
    container.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = container.append('svg').attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const days = Array.from(new Set(data.map(d => d.day)));
    const hours = Array.from(new Set(data.map(d => d.hour))).sort((a, b) => a - b);

    const xScale = d3.scaleBand().domain(hours.map(String)).range([0, innerWidth]).padding(0.05);

    const yScale = d3.scaleBand().domain(days).range([0, innerHeight]).padding(0.05);

    const colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(data, d => d.value) as [number, number]);

    // Draw heatmap cells
    g.selectAll('.cell')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', d => xScale(String(d.hour)) || 0)
      .attr('y', d => yScale(d.day) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.value))
      .attr('stroke', 'white')
      .attr('stroke-width', 1);

    // Add x-axis
    g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(xScale));

    // Add y-axis
    g.append('g').call(d3.axisLeft(yScale));

    // Add labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - innerHeight / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Day of Week');

    g.append('text')
      .attr('transform', `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 5})`)
      .style('text-anchor', 'middle')
      .text('Hour of Day');
  }, [data, width, height]);

  return <div ref={containerRef} />;
};

const NetworkVisualization: React.FC<{
  data: { nodes: unknown[]; links: unknown[] };
  width?: number;
  height?: number;
}> = ({ data, width = 600, height = 400 }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data.nodes.length) return;

    const container = d3.select(containerRef.current);
    container.selectAll('*').remove();

    const svg = container.append('svg').attr('width', width).attr('height', height);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const simulation = d3
      .forceSimulation(data.nodes)
      .force(
        'link',
        d3.forceLink(data.links).id((d: any) => d.id)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke-width', (d: any) => Math.sqrt(d.value));

    const node = svg
      .append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', (d: any) => d.value / 3)
      .attr('fill', (d: any) => {
        switch (d.group) {
          case 'kitchen':
            return '#10B981';
          case 'school':
            return '#3B82F6';
          case 'supplier':
            return '#F59E0B';
          default:
            return '#6B7280';
        }
      });

    node.append('title').text((d: any) => d.id);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
    });

    // Add drag behavior
    const drag = d3
      .drag()
      .on('start', (event: any, d: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event: any, d: any) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event: any, d: any) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag as any);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }, [data, width, height]);

  return <div ref={containerRef} />;
};

// =====================================================
// ADVANCED VISUALIZATION ENGINE
// =====================================================

const AdvancedVisualizationEngine: React.FC<AdvancedVisualizationEngineProps> = ({
  className,
  onConfigChange,
  initialData,
  realTimeEnabled = true,
}) => {
  // State management
  const [selectedVisualization, setSelectedVisualization] = useState('overview');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [autoRefresh, setAutoRefresh] = useState(realTimeEnabled);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Data state
  const [timeSeriesData, setTimeSeriesData] = useState(generateTimeSeriesData());
  const [categoricalData, setCategoricalData] = useState(generateCategoricalData());
  const [heatmapData, setHeatmapData] = useState(generateHeatmapData());
  const [networkData, setNetworkData] = useState(generateNetworkData());

  // Configuration state
  const [visualizationConfig, setVisualizationConfig] = useState<Partial<VisualizationConfig>>({
    styling: {
      theme: 'light',
      colorScheme: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      animations: true,
      animationDuration: 750,
    },
    interactivity: {
      zoom: true,
      pan: true,
      brush: true,
      tooltip: true,
      drillDown: false,
      crossFilter: false,
    },
  });

  // Chart color schemes
  const colorSchemes = {
    default: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
    professional: ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7'],
    pastel: ['#A8E6CF', '#DCEDC1', '#FFD3A5', '#FDB99B', '#F8B195'],
  };

  // Real-time data updates
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simulate real-time data updates
      setTimeSeriesData(prev => {
        const newPoint = {
          date: new Date().toISOString().split('T')[0],
          revenue: 45000 + Math.random() * 15000,
          orders: 120 + Math.random() * 80,
          satisfaction: 4.2 + Math.random() * 0.6,
          efficiency: 78 + Math.random() * 15,
          cost: 28000 + Math.random() * 8000,
        };
        return [...prev.slice(-29), newPoint];
      });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Device-specific dimensions
  const getViewportDimensions = () => {
    switch (deviceView) {
      case 'mobile':
        return { width: 375, height: 250 };
      case 'tablet':
        return { width: 768, height: 400 };
      default:
        return { width: 'auto', height: 400 };
    }
  };

  const handleConfigUpdate = useCallback(
    (updates: Partial<VisualizationConfig>) => {
      const newConfig = { ...visualizationConfig, ...updates };
      setVisualizationConfig(newConfig);
      onConfigChange?.(newConfig as VisualizationConfig);
    },
    [visualizationConfig, onConfigChange]
  );

  const exportVisualization = useCallback((format: 'png' | 'svg' | 'pdf') => {
    // Export functionality would be implemented here
    // Exporting visualization
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Visualization Controls Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Advanced Visualizations</span>
              </div>

              <Select value={selectedVisualization} onValueChange={setSelectedVisualization}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview Dashboard</SelectItem>
                  <SelectItem value="timeseries">Time Series Analysis</SelectItem>
                  <SelectItem value="comparison">Comparative Analysis</SelectItem>
                  <SelectItem value="correlation">Correlation Matrix</SelectItem>
                  <SelectItem value="geographic">Geographic Distribution</SelectItem>
                  <SelectItem value="network">Network Analysis</SelectItem>
                  <SelectItem value="custom">Custom Widgets</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {/* Device View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                <Button
                  variant={deviceView === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDeviceView('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={deviceView === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDeviceView('tablet')}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={deviceView === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDeviceView('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>

              {/* Animation Toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={animationsEnabled}
                  onCheckedChange={setAnimationsEnabled}
                  size="sm"
                />
                <span className="text-sm text-gray-600">Animations</span>
              </div>

              {/* Real-time Toggle */}
              <div className="flex items-center gap-2">
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} size="sm" />
                <span className="text-sm text-gray-600">Real-time</span>
              </div>

              {/* Export Options */}
              <Select onValueChange={exportVisualization}>
                <SelectTrigger className="w-24">
                  <Download className="h-4 w-4" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="svg">SVG</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>

              {/* Configuration Panel */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-96">
                  <SheetHeader>
                    <SheetTitle>Visualization Settings</SheetTitle>
                    <SheetDescription>
                      Customize appearance and behavior of visualizations
                    </SheetDescription>
                  </SheetHeader>

                  <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                    <div className="space-y-6">
                      {/* Theme Selection */}
                      <div className="space-y-3">
                        <Label>Color Scheme</Label>
                        <Select
                          value={visualizationConfig.styling?.theme}
                          onValueChange={value =>
                            handleConfigUpdate({
                              styling: {
                                ...visualizationConfig.styling,
                                theme: value as typeof visualizationConfig.styling.theme,
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="vibrant">Vibrant</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="grid grid-cols-4 gap-2">
                          {Object.entries(colorSchemes).map(([name, colors]) => (
                            <Button
                              key={name}
                              variant="outline"
                              className="h-8 p-1"
                              onClick={() =>
                                handleConfigUpdate({
                                  styling: { ...visualizationConfig.styling, colorScheme: colors },
                                })
                              }
                            >
                              <div className="flex w-full h-full rounded">
                                {colors.slice(0, 3).map((color, index) => (
                                  <div
                                    key={index}
                                    className="flex-1"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Animation Settings */}
                      <div className="space-y-3">
                        <Label>Animation Duration (ms)</Label>
                        <Slider
                          value={[visualizationConfig.styling?.animationDuration || 750]}
                          onValueChange={([value]) =>
                            handleConfigUpdate({
                              styling: { ...visualizationConfig.styling, animationDuration: value },
                            })
                          }
                          max={2000}
                          min={0}
                          step={250}
                        />
                        <div className="text-xs text-gray-500">
                          Current: {visualizationConfig.styling?.animationDuration || 750}ms
                        </div>
                      </div>

                      {/* Interactivity Settings */}
                      <div className="space-y-3">
                        <Label>Interactivity Options</Label>
                        <div className="space-y-2">
                          {[
                            { key: 'zoom', label: 'Zoom & Pan' },
                            { key: 'brush', label: 'Brush Selection' },
                            { key: 'tooltip', label: 'Tooltips' },
                            { key: 'drillDown', label: 'Drill Down' },
                            { key: 'crossFilter', label: 'Cross Filtering' },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-sm">{label}</span>
                              <Switch
                                checked={
                                  visualizationConfig.interactivity?.[
                                    key as keyof typeof visualizationConfig.interactivity
                                  ]
                                }
                                onCheckedChange={checked =>
                                  handleConfigUpdate({
                                    interactivity: {
                                      ...visualizationConfig.interactivity,
                                      [key]: checked,
                                    },
                                  })
                                }
                                size="sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Real-time Settings */}
                      {autoRefresh && (
                        <div className="space-y-3">
                          <Label>Refresh Interval (seconds)</Label>
                          <Select
                            value={String(refreshInterval / 1000)}
                            onValueChange={value => setRefreshInterval(Number(value) * 1000)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 second</SelectItem>
                              <SelectItem value="5">5 seconds</SelectItem>
                              <SelectItem value="10">10 seconds</SelectItem>
                              <SelectItem value="30">30 seconds</SelectItem>
                              <SelectItem value="60">1 minute</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              {/* Fullscreen Toggle */}
              <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Visualization Area */}
      <div
        className={cn('space-y-6', isFullscreen && 'fixed inset-0 z-50 bg-white p-6 overflow-auto')}
      >
        {/* Overview Dashboard */}
        {selectedVisualization === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Revenue Trend */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Revenue & Performance Trends
                </CardTitle>
                <CardDescription>Multi-metric time series analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  style={{
                    width: getViewportDimensions().width,
                    height: getViewportDimensions().height,
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={value => new Date(value).toLocaleDateString()}
                      />
                      <YAxis yAxisId="revenue" orientation="left" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="orders" orientation="right" tick={{ fontSize: 12 }} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 shadow-lg rounded-lg border">
                                <p className="font-medium">
                                  {new Date(label).toLocaleDateString()}
                                </p>
                                {payload.map((entry, index) => (
                                  <p key={index} style={{ color: entry.color }}>
                                    {entry.name}: {entry.value}
                                  </p>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      {visualizationConfig.interactivity?.brush && (
                        <Brush dataKey="date" height={30} stroke="#3B82F6" />
                      )}
                      <Bar yAxisId="revenue" dataKey="revenue" fill="#3B82F6" opacity={0.7} />
                      <Line
                        yAxisId="orders"
                        type="monotone"
                        dataKey="orders"
                        stroke="#10B981"
                        strokeWidth={3}
                      />
                      <Line
                        yAxisId="orders"
                        type="monotone"
                        dataKey="satisfaction"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Performance Gauges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-blue-600" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <CustomGaugeChart
                    value={87}
                    max={100}
                    title="Efficiency"
                    color="#10B981"
                    size={120}
                  />
                  <CustomGaugeChart
                    value={4.6}
                    max={5}
                    title="Satisfaction"
                    color="#3B82F6"
                    size={120}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Regional Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-purple-600" />
                  Regional Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoricalData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={animationsEnabled ? 800 : 0}
                      >
                        {categoricalData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={visualizationConfig.styling?.colorScheme?.[index] || '#3B82F6'}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Activity Heatmap */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid className="h-5 w-5 text-orange-600" />
                  Activity Heatmap
                </CardTitle>
                <CardDescription>Peak usage times by day and hour</CardDescription>
              </CardHeader>
              <CardContent>
                <HeatmapVisualization
                  data={heatmapData}
                  width={deviceView === 'mobile' ? 350 : 600}
                  height={250}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Time Series Analysis */}
        {selectedVisualization === 'timeseries' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Time Series Analysis</CardTitle>
                <CardDescription>
                  Interactive time series with multiple metrics and forecasting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: 500 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={value => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={value => new Date(value).toLocaleDateString()}
                        formatter={(value: unknown, name: string) => [
                          typeof value === 'number' ? value.toLocaleString() : value,
                          name,
                        ]}
                      />
                      <Legend />
                      {visualizationConfig.interactivity?.brush && (
                        <Brush dataKey="date" height={40} stroke="#3B82F6" />
                      )}
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={false}
                        animationDuration={animationsEnabled ? 1000 : 0}
                      />
                      <Line
                        type="monotone"
                        dataKey="orders"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={false}
                        animationDuration={animationsEnabled ? 1200 : 0}
                      />
                      <Line
                        type="monotone"
                        dataKey="satisfaction"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        animationDuration={animationsEnabled ? 1400 : 0}
                      />
                      <ReferenceLine
                        y={45000}
                        stroke="#EF4444"
                        strokeDasharray="3 3"
                        label="Target"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Trend Analysis Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Growth Velocity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">+12.4%</div>
                  <p className="text-sm text-gray-600">Month-over-month growth</p>
                  <div className="mt-2 h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeSeriesData.slice(-7)}>
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10B981"
                          fill="#10B981"
                          opacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Volatility Index</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">0.23</div>
                  <p className="text-sm text-gray-600">Revenue stability score</p>
                  <div className="mt-2 h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={timeSeriesData.slice(-7)}>
                        <Bar dataKey="efficiency" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Forecast Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">94.8%</div>
                  <p className="text-sm text-gray-600">ML model precision</p>
                  <Progress value={94.8} className="mt-2" />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Network Analysis */}
        {selectedVisualization === 'network' && (
          <Card>
            <CardHeader>
              <CardTitle>Supply Chain Network Analysis</CardTitle>
              <CardDescription>
                Interactive network visualization of supply chain relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NetworkVisualization
                data={networkData}
                width={deviceView === 'mobile' ? 350 : 800}
                height={400}
              />
              <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Kitchens</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Schools</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Suppliers</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Widgets */}
        {selectedVisualization === 'custom' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Widget Gallery</CardTitle>
                <CardDescription>Pre-built custom visualization components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'KPI Card', icon: Target },
                    { name: 'Progress Ring', icon: Activity },
                    { name: 'Metric Spark', icon: Zap },
                    { name: 'Status Grid', icon: Grid },
                  ].map(({ name, icon: Icon }) => (
                    <Button key={name} variant="outline" className="h-20 flex-col gap-2">
                      <Icon className="h-6 w-6" />
                      <span className="text-xs">{name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Chart Builder</CardTitle>
                <CardDescription>Drag and drop chart configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Custom chart builder coming soon</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Create custom visualizations with our visual editor
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedVisualizationEngine;
