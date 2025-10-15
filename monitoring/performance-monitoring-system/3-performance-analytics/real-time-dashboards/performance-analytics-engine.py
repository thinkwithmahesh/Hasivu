"""
HASIVU Performance Analytics Engine
Real-time performance analytics with SLA tracking, trend analysis, and capacity planning
Supports 500+ schools with comprehensive performance optimization recommendations
"""

import asyncio
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, asdict
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
from scipy import stats, signal
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import aioredis
import asyncpg
import json
from kubernetes import client, config
import plotly.graph_objects as go
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder

# Prometheus metrics for monitoring the analytics engine
ANALYTICS_QUERIES_TOTAL = Counter('hasivu_analytics_queries_total', 'Total analytics queries processed', ['query_type', 'school_id'])
ANALYTICS_PROCESSING_TIME = Histogram('hasivu_analytics_processing_duration_seconds', 'Time spent processing analytics')
SLA_VIOLATIONS_DETECTED = Counter('hasivu_sla_violations_total', 'Total SLA violations detected', ['service', 'sla_type'])
CAPACITY_PREDICTIONS_GENERATED = Counter('hasivu_capacity_predictions_total', 'Total capacity predictions generated', ['resource_type'])

@dataclass
class SLATarget:
    """SLA target definition with thresholds and monitoring parameters"""
    name: str
    metric_name: str
    target_value: float
    threshold_warning: float
    threshold_critical: float
    measurement_window: str  # e.g., '5m', '1h', '1d'
    aggregation: str  # e.g., 'avg', 'max', 'p95', 'p99'
    service: str
    school_id: Optional[str] = None

@dataclass
class SLAViolation:
    """SLA violation event with context and impact assessment"""
    id: str
    timestamp: datetime
    sla_target: SLATarget
    current_value: float
    violation_duration: timedelta
    severity: str  # warning, critical
    affected_users: int
    business_impact: str
    remediation_actions: List[str]

@dataclass
class PerformanceTrend:
    """Performance trend analysis result"""
    metric_name: str
    service: str
    trend_direction: str  # improving, degrading, stable
    trend_strength: float  # 0-1 scale
    prediction_7d: float
    prediction_30d: float
    confidence_interval: Tuple[float, float]
    seasonal_patterns: Dict[str, float]
    anomaly_score: float

@dataclass
class CapacityPrediction:
    """Capacity planning prediction with resource recommendations"""
    resource_type: str
    service: str
    current_utilization: float
    predicted_utilization_7d: float
    predicted_utilization_30d: float
    predicted_utilization_90d: float
    capacity_exhaustion_date: Optional[datetime]
    recommended_scaling: Dict[str, Any]
    cost_impact: float
    confidence_score: float

class HASIVUPerformanceAnalyticsEngine:
    """
    Advanced performance analytics engine for HASIVU platform
    Features:
    - Real-time SLA monitoring and violation detection
    - Trend analysis with machine learning predictions
    - Capacity planning with cost optimization
    - Performance regression detection
    - Multi-tenant analytics with school-specific insights
    - Business impact correlation
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)

        # Performance analysis models
        self.trend_models: Dict[str, LinearRegression] = {}
        self.scalers: Dict[str, StandardScaler] = {}

        # SLA definitions for HASIVU platform
        self.sla_targets = self._initialize_sla_targets()

        # Performance baselines and thresholds
        self.performance_baselines: Dict[str, Dict[str, float]] = {}
        self.regression_thresholds = {
            'response_time': 0.2,  # 20% increase
            'error_rate': 0.1,     # 10% increase
            'throughput': -0.15    # 15% decrease
        }

        # Capacity planning parameters
        self.capacity_thresholds = {
            'cpu': 0.8,      # 80% utilization
            'memory': 0.85,  # 85% utilization
            'disk': 0.9,     # 90% utilization
            'network': 0.75  # 75% utilization
        }

        # Analytics cache for performance optimization
        self.analytics_cache: Dict[str, Any] = {}
        self.cache_ttl = 300  # 5 minutes

    async def initialize(self):
        """Initialize the performance analytics engine"""
        try:
            # Initialize Kubernetes client
            config.load_incluster_config()
            self.k8s_client = client.CustomObjectsApi()

            # Initialize Redis for caching
            self.redis = await aioredis.from_url(
                self.config.get('redis_url', 'redis://hasivu-redis:6379'),
                decode_responses=True
            )

            # Initialize PostgreSQL for metrics storage
            self.db_pool = await asyncpg.create_pool(
                self.config.get('database_url', 'postgresql://hasivu:password@hasivu-postgresql:5432/hasivu_monitoring'),
                min_size=10,
                max_size=30
            )

            # Load historical performance baselines
            await self.load_performance_baselines()

            # Initialize trend analysis models
            await self.initialize_trend_models()

            # Start metrics server
            start_http_server(8081)

            self.logger.info("HASIVU Performance Analytics Engine initialized successfully")

        except Exception as e:
            self.logger.error(f"Failed to initialize performance analytics engine: {e}")
            raise

    def _initialize_sla_targets(self) -> List[SLATarget]:
        """Initialize SLA targets for HASIVU platform services"""
        return [
            # Authentication Service SLAs
            SLATarget(
                name="Authentication Response Time",
                metric_name="hasivu_auth_response_time_seconds",
                target_value=0.2,  # 200ms
                threshold_warning=0.5,  # 500ms
                threshold_critical=1.0,  # 1s
                measurement_window="5m",
                aggregation="p95",
                service="authentication"
            ),
            SLATarget(
                name="Authentication Availability",
                metric_name="hasivu_auth_availability",
                target_value=0.999,  # 99.9%
                threshold_warning=0.995,  # 99.5%
                threshold_critical=0.99,   # 99.0%
                measurement_window="1h",
                aggregation="avg",
                service="authentication"
            ),
            SLATarget(
                name="Authentication Error Rate",
                metric_name="hasivu_auth_error_rate",
                target_value=0.001,  # 0.1%
                threshold_warning=0.01,   # 1.0%
                threshold_critical=0.05,  # 5.0%
                measurement_window="5m",
                aggregation="avg",
                service="authentication"
            ),

            # Kitchen Management SLAs
            SLATarget(
                name="Kitchen Order Processing Time",
                metric_name="kitchen_order_processing_time_seconds",
                target_value=30.0,  # 30 seconds
                threshold_warning=60.0,   # 1 minute
                threshold_critical=120.0, # 2 minutes
                measurement_window="5m",
                aggregation="p95",
                service="kitchen-management"
            ),
            SLATarget(
                name="Kitchen System Availability",
                metric_name="kitchen_system_availability",
                target_value=0.995,  # 99.5%
                threshold_warning=0.99,   # 99.0%
                threshold_critical=0.95,  # 95.0%
                measurement_window="1h",
                aggregation="avg",
                service="kitchen-management"
            ),

            # Vendor Marketplace SLAs
            SLATarget(
                name="Vendor API Response Time",
                metric_name="vendor_api_response_time_seconds",
                target_value=1.0,  # 1 second
                threshold_warning=3.0,  # 3 seconds
                threshold_critical=5.0, # 5 seconds
                measurement_window="5m",
                aggregation="p95",
                service="vendor-marketplace"
            ),
            SLATarget(
                name="Vendor Procurement Success Rate",
                metric_name="vendor_procurement_success_rate",
                target_value=0.98,  # 98%
                threshold_warning=0.95,  # 95%
                threshold_critical=0.90, # 90%
                measurement_window="1h",
                aggregation="avg",
                service="vendor-marketplace"
            ),

            # Predictive Analytics SLAs
            SLATarget(
                name="ML Model Inference Time",
                metric_name="ml_inference_time_milliseconds",
                target_value=100.0,  # 100ms
                threshold_warning=250.0,  # 250ms
                threshold_critical=500.0, # 500ms
                measurement_window="5m",
                aggregation="p95",
                service="predictive-analytics"
            ),
            SLATarget(
                name="ML Model Accuracy",
                metric_name="ml_model_accuracy_score",
                target_value=0.85,  # 85%
                threshold_warning=0.80,  # 80%
                threshold_critical=0.70, # 70%
                measurement_window="1h",
                aggregation="avg",
                service="predictive-analytics"
            ),

            # Database SLAs
            SLATarget(
                name="Database Query Response Time",
                metric_name="pg_query_duration_seconds",
                target_value=0.1,   # 100ms
                threshold_warning=0.5,   # 500ms
                threshold_critical=2.0,  # 2s
                measurement_window="5m",
                aggregation="p95",
                service="database"
            ),
            SLATarget(
                name="Database Connection Pool Utilization",
                metric_name="pg_connection_pool_utilization",
                target_value=0.7,   # 70%
                threshold_warning=0.85,  # 85%
                threshold_critical=0.95, # 95%
                measurement_window="5m",
                aggregation="max",
                service="database"
            )
        ]

    async def load_performance_baselines(self):
        """Load historical performance baselines for comparison"""
        try:
            async with self.db_pool.acquire() as conn:
                # Load 30-day baseline averages
                baseline_query = """
                SELECT service, metric_name,
                       AVG(value) as baseline_avg,
                       STDDEV(value) as baseline_std,
                       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value) as baseline_median,
                       PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) as baseline_p95
                FROM performance_metrics
                WHERE timestamp > NOW() - INTERVAL '30 days'
                  AND timestamp < NOW() - INTERVAL '1 day'  -- Exclude recent data
                GROUP BY service, metric_name
                """

                baselines = await conn.fetch(baseline_query)

                for baseline in baselines:
                    service = baseline['service']
                    metric_name = baseline['metric_name']

                    if service not in self.performance_baselines:
                        self.performance_baselines[service] = {}

                    self.performance_baselines[service][metric_name] = {
                        'avg': float(baseline['baseline_avg']),
                        'std': float(baseline['baseline_std']) if baseline['baseline_std'] else 0,
                        'median': float(baseline['baseline_median']),
                        'p95': float(baseline['baseline_p95'])
                    }

                self.logger.info(f"Loaded performance baselines for {len(baselines)} metrics")

        except Exception as e:
            self.logger.error(f"Failed to load performance baselines: {e}")

    async def initialize_trend_models(self):
        """Initialize machine learning models for trend analysis"""
        try:
            # Load historical data for model training
            async with self.db_pool.acquire() as conn:
                # Get time series data for each metric
                metrics_query = """
                SELECT DISTINCT service, metric_name
                FROM performance_metrics
                WHERE timestamp > NOW() - INTERVAL '30 days'
                """

                metrics = await conn.fetch(metrics_query)

                for metric in metrics:
                    service = metric['service']
                    metric_name = metric['metric_name']
                    model_key = f"{service}:{metric_name}"

                    # Get time series data for this metric
                    data_query = """
                    SELECT DATE_TRUNC('hour', timestamp) as hour,
                           AVG(value) as avg_value
                    FROM performance_metrics
                    WHERE service = $1 AND metric_name = $2
                      AND timestamp > NOW() - INTERVAL '30 days'
                    GROUP BY hour
                    ORDER BY hour
                    """

                    time_series = await conn.fetch(data_query, service, metric_name)

                    if len(time_series) >= 24:  # Need at least 24 hours of data
                        # Prepare data for training
                        df = pd.DataFrame(time_series)
                        df['hour_numeric'] = range(len(df))

                        X = df[['hour_numeric']].values
                        y = df['avg_value'].values

                        # Train linear regression model
                        model = LinearRegression()
                        scaler = StandardScaler()

                        X_scaled = scaler.fit_transform(X)
                        model.fit(X_scaled, y)

                        # Store model and scaler
                        self.trend_models[model_key] = model
                        self.scalers[model_key] = scaler

                self.logger.info(f"Initialized {len(self.trend_models)} trend analysis models")

        except Exception as e:
            self.logger.error(f"Failed to initialize trend models: {e}")

    @ANALYTICS_PROCESSING_TIME.time()
    async def monitor_sla_compliance(self, school_id: Optional[str] = None) -> List[SLAViolation]:
        """Monitor SLA compliance across all services"""
        try:
            ANALYTICS_QUERIES_TOTAL.labels(query_type='sla_monitoring', school_id=school_id or 'all').inc()

            violations = []

            for sla_target in self.sla_targets:
                # Skip school-specific SLAs if school_id doesn't match
                if sla_target.school_id and sla_target.school_id != school_id:
                    continue

                violation = await self._check_sla_violation(sla_target, school_id)
                if violation:
                    violations.append(violation)
                    SLA_VIOLATIONS_DETECTED.labels(
                        service=sla_target.service,
                        sla_type=sla_target.name.replace(' ', '_').lower()
                    ).inc()

            # Store violations in database
            if violations:
                await self._store_sla_violations(violations)

            self.logger.info(f"SLA monitoring completed: {len(violations)} violations detected")

            return violations

        except Exception as e:
            self.logger.error(f"Error in SLA monitoring: {e}")
            return []

    async def _check_sla_violation(self, sla_target: SLATarget, school_id: Optional[str]) -> Optional[SLAViolation]:
        """Check if a specific SLA target is being violated"""
        try:
            # Build Prometheus query
            query = self._build_prometheus_query(sla_target, school_id)

            # Execute query against Prometheus (simulated here)
            current_value = await self._execute_prometheus_query(query)

            if current_value is None:
                return None

            # Determine violation severity
            violation_severity = None
            if current_value > sla_target.threshold_critical:
                violation_severity = 'critical'
            elif current_value > sla_target.threshold_warning:
                violation_severity = 'warning'

            if not violation_severity:
                return None

            # Calculate violation duration (simplified)
            violation_duration = timedelta(minutes=5)  # Would be calculated from historical data

            # Estimate affected users
            affected_users = await self._estimate_affected_users(sla_target.service, school_id)

            # Generate business impact assessment
            business_impact = self._assess_business_impact(sla_target, current_value, affected_users)

            # Generate remediation actions
            remediation_actions = self._generate_remediation_actions(sla_target, current_value)

            return SLAViolation(
                id=f"sla_violation_{datetime.now().timestamp()}_{sla_target.service}_{sla_target.name}",
                timestamp=datetime.now(),
                sla_target=sla_target,
                current_value=current_value,
                violation_duration=violation_duration,
                severity=violation_severity,
                affected_users=affected_users,
                business_impact=business_impact,
                remediation_actions=remediation_actions
            )

        except Exception as e:
            self.logger.error(f"Error checking SLA violation for {sla_target.name}: {e}")
            return None

    def _build_prometheus_query(self, sla_target: SLATarget, school_id: Optional[str]) -> str:
        """Build Prometheus query for SLA metric"""
        base_query = sla_target.metric_name

        # Add school_id filter if specified
        if school_id:
            base_query += f'{{school_id="{school_id}"}}'

        # Apply aggregation and time window
        if sla_target.aggregation == 'avg':
            query = f"avg_over_time({base_query}[{sla_target.measurement_window}])"
        elif sla_target.aggregation == 'max':
            query = f"max_over_time({base_query}[{sla_target.measurement_window}])"
        elif sla_target.aggregation == 'p95':
            query = f"histogram_quantile(0.95, rate({base_query}_bucket[{sla_target.measurement_window}]))"
        elif sla_target.aggregation == 'p99':
            query = f"histogram_quantile(0.99, rate({base_query}_bucket[{sla_target.measurement_window}]))"
        else:
            query = base_query

        return query

    async def _execute_prometheus_query(self, query: str) -> Optional[float]:
        """Execute Prometheus query and return result"""
        # This would be implemented to actually query Prometheus
        # For now, return simulated values
        import random
        return random.uniform(0.1, 2.0)  # Simulated metric value

    async def _estimate_affected_users(self, service: str, school_id: Optional[str]) -> int:
        """Estimate number of users affected by service degradation"""
        try:
            async with self.db_pool.acquire() as conn:
                if school_id:
                    # School-specific user count
                    user_query = """
                    SELECT active_students, active_staff
                    FROM school_metrics
                    WHERE school_id = $1
                    ORDER BY timestamp DESC
                    LIMIT 1
                    """
                    result = await conn.fetchrow(user_query, school_id)
                    if result:
                        return result['active_students'] + result['active_staff']
                else:
                    # Platform-wide user count
                    user_query = """
                    SELECT SUM(active_students + active_staff) as total_users
                    FROM school_metrics
                    WHERE timestamp > NOW() - INTERVAL '1 hour'
                    """
                    result = await conn.fetchrow(user_query)
                    if result and result['total_users']:
                        return int(result['total_users'])

            # Fallback estimates based on service
            service_user_estimates = {
                'authentication': 10000,  # All users
                'kitchen-management': 5000,  # Kitchen staff + ordering users
                'vendor-marketplace': 500,   # Procurement staff
                'predictive-analytics': 100, # Administrators
                'database': 10000,           # All users (indirect)
            }

            return service_user_estimates.get(service, 1000)

        except Exception as e:
            self.logger.error(f"Error estimating affected users: {e}")
            return 1000

    def _assess_business_impact(self, sla_target: SLATarget, current_value: float, affected_users: int) -> str:
        """Assess business impact of SLA violation"""
        impact_multiplier = current_value / sla_target.target_value

        if sla_target.service == 'authentication':
            if impact_multiplier > 5:
                return f"Critical impact: Login failures affecting {affected_users} users. Potential revenue loss."
            elif impact_multiplier > 2:
                return f"Moderate impact: Degraded login experience for {affected_users} users."
            else:
                return f"Minor impact: Slight authentication delays for {affected_users} users."

        elif sla_target.service == 'kitchen-management':
            if impact_multiplier > 4:
                return f"Critical impact: Kitchen operations severely delayed affecting {affected_users} staff and students."
            elif impact_multiplier > 2:
                return f"Moderate impact: Kitchen efficiency reduced, affecting meal service for {affected_users} users."
            else:
                return f"Minor impact: Slight delays in kitchen operations affecting {affected_users} users."

        elif sla_target.service == 'vendor-marketplace':
            if impact_multiplier > 3:
                return f"Critical impact: Vendor procurement failures affecting supply chain for multiple schools."
            else:
                return f"Moderate impact: Vendor response delays affecting procurement efficiency."

        elif sla_target.service == 'predictive-analytics':
            return f"Analytics impact: ML model performance degraded, affecting decision-making capabilities."

        elif sla_target.service == 'database':
            if impact_multiplier > 5:
                return f"Critical impact: Database performance issues affecting all platform operations."
            else:
                return f"Moderate impact: Database queries slower than expected, affecting user experience."

        return f"Service impact: {sla_target.service} performance below SLA thresholds."

    def _generate_remediation_actions(self, sla_target: SLATarget, current_value: float) -> List[str]:
        """Generate context-specific remediation actions"""
        actions = []

        # Service-specific actions
        if sla_target.service == 'authentication':
            actions.extend([
                'Scale authentication service pods',
                'Check database connection pool',
                'Verify Redis cache performance',
                'Review authentication logs for errors'
            ])

        elif sla_target.service == 'kitchen-management':
            actions.extend([
                'Check kitchen service resource utilization',
                'Verify inventory system connectivity',
                'Scale kitchen management pods',
                'Review order processing queues'
            ])

        elif sla_target.service == 'vendor-marketplace':
            actions.extend([
                'Check vendor API connectivity',
                'Scale vendor service instances',
                'Review AI optimization recommendations',
                'Verify third-party service status'
            ])

        elif sla_target.service == 'predictive-analytics':
            actions.extend([
                'Check ML model server resources',
                'Verify training data pipeline',
                'Scale inference pods',
                'Review model performance metrics'
            ])

        elif sla_target.service == 'database':
            actions.extend([
                'Check database connection pool',
                'Review slow query logs',
                'Verify read replica status',
                'Monitor disk I/O and memory usage'
            ])

        # Metric-specific actions
        if 'response_time' in sla_target.metric_name:
            actions.append('Investigate response time bottlenecks')

        if 'error_rate' in sla_target.metric_name:
            actions.append('Review error logs and patterns')

        if 'availability' in sla_target.metric_name:
            actions.append('Check service health and uptime')

        return actions[:5]  # Return top 5 actions

    async def analyze_performance_trends(
        self,
        services: Optional[List[str]] = None,
        school_id: Optional[str] = None,
        time_range: str = "7d"
    ) -> List[PerformanceTrend]:
        """Analyze performance trends with ML-based predictions"""
        try:
            ANALYTICS_QUERIES_TOTAL.labels(query_type='trend_analysis', school_id=school_id or 'all').inc()

            trends = []

            # Get services to analyze
            target_services = services or ['authentication', 'kitchen-management', 'vendor-marketplace', 'predictive-analytics', 'database']

            for service in target_services:
                service_trends = await self._analyze_service_trends(service, school_id, time_range)
                trends.extend(service_trends)

            # Store trend analysis results
            await self._store_trend_analysis(trends)

            self.logger.info(f"Trend analysis completed: {len(trends)} trends analyzed")

            return trends

        except Exception as e:
            self.logger.error(f"Error in trend analysis: {e}")
            return []

    async def _analyze_service_trends(
        self,
        service: str,
        school_id: Optional[str],
        time_range: str
    ) -> List[PerformanceTrend]:
        """Analyze trends for a specific service"""
        try:
            trends = []

            # Get historical data
            async with self.db_pool.acquire() as conn:
                time_filter = self._parse_time_range(time_range)

                data_query = """
                SELECT metric_name, timestamp, value
                FROM performance_metrics
                WHERE service = $1
                  AND timestamp > NOW() - INTERVAL %s
                """ % time_filter

                params = [service]
                if school_id:
                    data_query += " AND school_id = $2"
                    params.append(school_id)

                data_query += " ORDER BY metric_name, timestamp"

                metrics_data = await conn.fetch(data_query, *params)

            # Group by metric
            metric_groups = {}
            for row in metrics_data:
                metric_name = row['metric_name']
                if metric_name not in metric_groups:
                    metric_groups[metric_name] = []
                metric_groups[metric_name].append(row)

            # Analyze each metric
            for metric_name, data_points in metric_groups.items():
                if len(data_points) < 10:  # Need minimum data points
                    continue

                trend = await self._calculate_metric_trend(service, metric_name, data_points)
                if trend:
                    trends.append(trend)

            return trends

        except Exception as e:
            self.logger.error(f"Error analyzing trends for service {service}: {e}")
            return []

    async def _calculate_metric_trend(
        self,
        service: str,
        metric_name: str,
        data_points: List[Dict]
    ) -> Optional[PerformanceTrend]:
        """Calculate trend analysis for a specific metric"""
        try:
            # Convert to DataFrame
            df = pd.DataFrame(data_points)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp')

            # Create time features
            df['hour_numeric'] = range(len(df))
            df['hour_of_day'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek

            # Detect outliers and clean data
            Q1 = df['value'].quantile(0.25)
            Q3 = df['value'].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR

            # Remove outliers
            df_clean = df[(df['value'] >= lower_bound) & (df['value'] <= upper_bound)]

            if len(df_clean) < 5:
                return None

            # Calculate trend using linear regression
            X = df_clean[['hour_numeric']].values
            y = df_clean['value'].values

            model_key = f"{service}:{metric_name}"
            if model_key in self.trend_models:
                model = self.trend_models[model_key]
                scaler = self.scalers[model_key]
            else:
                model = LinearRegression()
                scaler = StandardScaler()
                X_scaled = scaler.fit_transform(X)
                model.fit(X_scaled, y)

            # Make predictions
            X_scaled = scaler.transform(X)
            y_pred = model.predict(X_scaled)

            # Calculate trend strength (R²)
            r2 = r2_score(y, y_pred)

            # Determine trend direction
            slope = model.coef_[0] if hasattr(model, 'coef_') else 0
            if slope > 0.01:
                trend_direction = 'improving' if 'error' not in metric_name.lower() else 'degrading'
            elif slope < -0.01:
                trend_direction = 'degrading' if 'error' not in metric_name.lower() else 'improving'
            else:
                trend_direction = 'stable'

            # Future predictions
            future_7d = len(df) + 24 * 7  # 7 days ahead (hourly data)
            future_30d = len(df) + 24 * 30  # 30 days ahead

            pred_7d = model.predict(scaler.transform([[future_7d]]))[0]
            pred_30d = model.predict(scaler.transform([[future_30d]]))[0]

            # Calculate confidence interval
            mse = mean_squared_error(y, y_pred)
            std_error = np.sqrt(mse)
            confidence_interval = (pred_7d - 2 * std_error, pred_7d + 2 * std_error)

            # Analyze seasonal patterns
            seasonal_patterns = self._analyze_seasonal_patterns(df_clean)

            # Calculate anomaly score
            recent_values = df_clean['value'].tail(5).values
            baseline_mean = df_clean['value'].mean()
            baseline_std = df_clean['value'].std()

            anomaly_scores = [abs(v - baseline_mean) / baseline_std for v in recent_values]
            anomaly_score = np.mean(anomaly_scores)

            return PerformanceTrend(
                metric_name=metric_name,
                service=service,
                trend_direction=trend_direction,
                trend_strength=r2,
                prediction_7d=pred_7d,
                prediction_30d=pred_30d,
                confidence_interval=confidence_interval,
                seasonal_patterns=seasonal_patterns,
                anomaly_score=anomaly_score
            )

        except Exception as e:
            self.logger.error(f"Error calculating trend for {service}:{metric_name}: {e}")
            return None

    def _analyze_seasonal_patterns(self, df: pd.DataFrame) -> Dict[str, float]:
        """Analyze seasonal patterns in the data"""
        try:
            patterns = {}

            # Hour of day patterns
            hourly_avg = df.groupby('hour_of_day')['value'].mean()
            patterns['peak_hour'] = int(hourly_avg.idxmax())
            patterns['low_hour'] = int(hourly_avg.idxmin())
            patterns['hourly_variance'] = float(hourly_avg.var())

            # Day of week patterns
            if 'day_of_week' in df.columns:
                daily_avg = df.groupby('day_of_week')['value'].mean()
                patterns['peak_day'] = int(daily_avg.idxmax())
                patterns['low_day'] = int(daily_avg.idxmin())
                patterns['daily_variance'] = float(daily_avg.var())

            return patterns

        except Exception as e:
            self.logger.error(f"Error analyzing seasonal patterns: {e}")
            return {}

    def _parse_time_range(self, time_range: str) -> str:
        """Parse time range string to PostgreSQL interval"""
        time_map = {
            '1h': '1 hour',
            '6h': '6 hours',
            '1d': '1 day',
            '7d': '7 days',
            '30d': '30 days',
            '90d': '90 days'
        }
        return time_map.get(time_range, '7 days')

    async def generate_capacity_predictions(
        self,
        services: Optional[List[str]] = None,
        school_id: Optional[str] = None
    ) -> List[CapacityPrediction]:
        """Generate capacity planning predictions with cost optimization"""
        try:
            ANALYTICS_QUERIES_TOTAL.labels(query_type='capacity_planning', school_id=school_id or 'all').inc()

            predictions = []

            # Get services to analyze
            target_services = services or ['authentication', 'kitchen-management', 'vendor-marketplace', 'predictive-analytics']

            for service in target_services:
                service_predictions = await self._generate_service_capacity_predictions(service, school_id)
                predictions.extend(service_predictions)

            # Store capacity predictions
            await self._store_capacity_predictions(predictions)

            # Update metrics
            for prediction in predictions:
                CAPACITY_PREDICTIONS_GENERATED.labels(resource_type=prediction.resource_type).inc()

            self.logger.info(f"Capacity planning completed: {len(predictions)} predictions generated")

            return predictions

        except Exception as e:
            self.logger.error(f"Error in capacity planning: {e}")
            return []

    async def _generate_service_capacity_predictions(
        self,
        service: str,
        school_id: Optional[str]
    ) -> List[CapacityPrediction]:
        """Generate capacity predictions for a specific service"""
        try:
            predictions = []

            # Resource types to monitor
            resource_types = ['cpu', 'memory', 'disk', 'network']

            for resource_type in resource_types:
                prediction = await self._predict_resource_capacity(service, resource_type, school_id)
                if prediction:
                    predictions.append(prediction)

            return predictions

        except Exception as e:
            self.logger.error(f"Error generating capacity predictions for {service}: {e}")
            return []

    async def _predict_resource_capacity(
        self,
        service: str,
        resource_type: str,
        school_id: Optional[str]
    ) -> Optional[CapacityPrediction]:
        """Predict capacity for a specific resource"""
        try:
            # Get historical resource utilization data
            async with self.db_pool.acquire() as conn:
                utilization_query = """
                SELECT timestamp, value as utilization
                FROM resource_metrics
                WHERE service = $1 AND resource_type = $2
                  AND timestamp > NOW() - INTERVAL '30 days'
                """

                params = [service, resource_type]
                if school_id:
                    utilization_query += " AND school_id = $3"
                    params.append(school_id)

                utilization_query += " ORDER BY timestamp"

                utilization_data = await conn.fetch(utilization_query, *params)

            if len(utilization_data) < 24:  # Need at least 24 hours of data
                return None

            # Convert to time series
            df = pd.DataFrame(utilization_data)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp')

            # Calculate current utilization
            current_utilization = df['utilization'].tail(5).mean()

            # Predict future utilization using trend analysis
            X = np.arange(len(df)).reshape(-1, 1)
            y = df['utilization'].values

            model = LinearRegression()
            model.fit(X, y)

            # Predict for future periods
            future_7d = len(df) + 24 * 7
            future_30d = len(df) + 24 * 30
            future_90d = len(df) + 24 * 90

            pred_7d = model.predict([[future_7d]])[0]
            pred_30d = model.predict([[future_30d]])[0]
            pred_90d = model.predict([[future_90d]])[0]

            # Ensure predictions are within reasonable bounds
            pred_7d = max(0, min(1, pred_7d))
            pred_30d = max(0, min(1, pred_30d))
            pred_90d = max(0, min(1, pred_90d))

            # Calculate when capacity will be exhausted
            threshold = self.capacity_thresholds[resource_type]
            capacity_exhaustion_date = None

            if model.coef_[0] > 0:  # Increasing trend
                days_to_exhaustion = (threshold - current_utilization) / (model.coef_[0] * 24)
                if days_to_exhaustion > 0 and days_to_exhaustion < 365:
                    capacity_exhaustion_date = datetime.now() + timedelta(days=days_to_exhaustion)

            # Generate scaling recommendations
            scaling_recommendations = self._generate_scaling_recommendations(
                service, resource_type, current_utilization, pred_30d, threshold
            )

            # Calculate cost impact
            cost_impact = self._calculate_scaling_cost_impact(service, resource_type, scaling_recommendations)

            # Calculate confidence score
            r2 = r2_score(y, model.predict(X))
            confidence_score = min(r2, 0.95)  # Cap at 95%

            return CapacityPrediction(
                resource_type=resource_type,
                service=service,
                current_utilization=current_utilization,
                predicted_utilization_7d=pred_7d,
                predicted_utilization_30d=pred_30d,
                predicted_utilization_90d=pred_90d,
                capacity_exhaustion_date=capacity_exhaustion_date,
                recommended_scaling=scaling_recommendations,
                cost_impact=cost_impact,
                confidence_score=confidence_score
            )

        except Exception as e:
            self.logger.error(f"Error predicting capacity for {service}:{resource_type}: {e}")
            return None

    def _generate_scaling_recommendations(
        self,
        service: str,
        resource_type: str,
        current_utilization: float,
        predicted_utilization: float,
        threshold: float
    ) -> Dict[str, Any]:
        """Generate scaling recommendations based on capacity predictions"""

        recommendations = {
            'action_required': False,
            'action_type': None,
            'scale_factor': 1.0,
            'timeline': None,
            'justification': None
        }

        if predicted_utilization > threshold:
            # Scale up recommendation
            scale_factor = predicted_utilization / threshold * 1.2  # 20% buffer
            recommendations.update({
                'action_required': True,
                'action_type': 'scale_up',
                'scale_factor': scale_factor,
                'timeline': 'within_7_days',
                'justification': f'{resource_type} utilization predicted to exceed {threshold*100:.0f}% threshold'
            })

        elif current_utilization < threshold * 0.3 and predicted_utilization < threshold * 0.5:
            # Scale down recommendation
            scale_factor = max(0.5, predicted_utilization / threshold)  # Don't scale below 50%
            recommendations.update({
                'action_required': True,
                'action_type': 'scale_down',
                'scale_factor': scale_factor,
                'timeline': 'within_30_days',
                'justification': f'{resource_type} utilization consistently low, cost optimization opportunity'
            })

        # Add resource-specific recommendations
        if resource_type == 'cpu':
            if recommendations['action_required']:
                recommendations['implementation'] = 'Adjust CPU requests/limits in Kubernetes deployment'

        elif resource_type == 'memory':
            if recommendations['action_required']:
                recommendations['implementation'] = 'Adjust memory requests/limits in Kubernetes deployment'

        elif resource_type == 'disk':
            if recommendations['action_required']:
                recommendations['implementation'] = 'Increase persistent volume size or add additional volumes'

        return recommendations

    def _calculate_scaling_cost_impact(
        self,
        service: str,
        resource_type: str,
        scaling_recommendations: Dict[str, Any]
    ) -> float:
        """Calculate cost impact of scaling recommendations"""

        if not scaling_recommendations['action_required']:
            return 0.0

        # Base monthly costs per service (in USD)
        base_costs = {
            'authentication': 200,
            'kitchen-management': 300,
            'vendor-marketplace': 250,
            'predictive-analytics': 500,
            'database': 800
        }

        # Resource cost multipliers
        resource_multipliers = {
            'cpu': 1.0,
            'memory': 0.8,
            'disk': 0.3,
            'network': 0.2
        }

        base_cost = base_costs.get(service, 200)
        multiplier = resource_multipliers.get(resource_type, 1.0)
        scale_factor = scaling_recommendations['scale_factor']

        if scaling_recommendations['action_type'] == 'scale_up':
            cost_impact = base_cost * multiplier * (scale_factor - 1.0)
        else:  # scale_down
            cost_impact = -base_cost * multiplier * (1.0 - scale_factor)

        return round(cost_impact, 2)

    async def _store_sla_violations(self, violations: List[SLAViolation]):
        """Store SLA violations in database"""
        try:
            async with self.db_pool.acquire() as conn:
                for violation in violations:
                    await conn.execute("""
                        INSERT INTO sla_violations (
                            id, timestamp, service, sla_name, current_value, target_value,
                            severity, affected_users, business_impact, school_id
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT (id) DO NOTHING
                    """,
                    violation.id, violation.timestamp, violation.sla_target.service,
                    violation.sla_target.name, violation.current_value, violation.sla_target.target_value,
                    violation.severity, violation.affected_users, violation.business_impact,
                    violation.sla_target.school_id
                    )

        except Exception as e:
            self.logger.error(f"Error storing SLA violations: {e}")

    async def _store_trend_analysis(self, trends: List[PerformanceTrend]):
        """Store trend analysis results in database"""
        try:
            async with self.db_pool.acquire() as conn:
                for trend in trends:
                    await conn.execute("""
                        INSERT INTO performance_trends (
                            timestamp, service, metric_name, trend_direction, trend_strength,
                            prediction_7d, prediction_30d, confidence_interval, seasonal_patterns,
                            anomaly_score
                        ) VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
                    """,
                    trend.service, trend.metric_name, trend.trend_direction, trend.trend_strength,
                    trend.prediction_7d, trend.prediction_30d, list(trend.confidence_interval),
                    json.dumps(trend.seasonal_patterns), trend.anomaly_score
                    )

        except Exception as e:
            self.logger.error(f"Error storing trend analysis: {e}")

    async def _store_capacity_predictions(self, predictions: List[CapacityPrediction]):
        """Store capacity predictions in database"""
        try:
            async with self.db_pool.acquire() as conn:
                for prediction in predictions:
                    await conn.execute("""
                        INSERT INTO capacity_predictions (
                            timestamp, service, resource_type, current_utilization,
                            predicted_utilization_7d, predicted_utilization_30d, predicted_utilization_90d,
                            capacity_exhaustion_date, recommended_scaling, cost_impact, confidence_score
                        ) VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    """,
                    prediction.service, prediction.resource_type, prediction.current_utilization,
                    prediction.predicted_utilization_7d, prediction.predicted_utilization_30d,
                    prediction.predicted_utilization_90d, prediction.capacity_exhaustion_date,
                    json.dumps(prediction.recommended_scaling), prediction.cost_impact,
                    prediction.confidence_score
                    )

        except Exception as e:
            self.logger.error(f"Error storing capacity predictions: {e}")

    async def generate_performance_report(
        self,
        school_id: Optional[str] = None,
        time_range: str = "24h"
    ) -> Dict[str, Any]:
        """Generate comprehensive performance report"""
        try:
            report = {
                'timestamp': datetime.now().isoformat(),
                'school_id': school_id,
                'time_range': time_range,
                'sla_violations': [],
                'performance_trends': [],
                'capacity_predictions': [],
                'summary': {}
            }

            # Gather all analytics data
            sla_violations = await self.monitor_sla_compliance(school_id)
            performance_trends = await self.analyze_performance_trends(school_id=school_id, time_range=time_range)
            capacity_predictions = await self.generate_capacity_predictions(school_id=school_id)

            # Convert to serializable format
            report['sla_violations'] = [asdict(v) for v in sla_violations]
            report['performance_trends'] = [asdict(t) for t in performance_trends]
            report['capacity_predictions'] = [asdict(p) for p in capacity_predictions]

            # Generate summary
            report['summary'] = {
                'total_sla_violations': len(sla_violations),
                'critical_violations': len([v for v in sla_violations if v.severity == 'critical']),
                'services_with_degrading_trends': len([t for t in performance_trends if t.trend_direction == 'degrading']),
                'services_needing_scaling': len([p for p in capacity_predictions if p.recommended_scaling['action_required']]),
                'estimated_cost_impact': sum([p.cost_impact for p in capacity_predictions]),
                'overall_health_score': self._calculate_overall_health_score(sla_violations, performance_trends)
            }

            return report

        except Exception as e:
            self.logger.error(f"Error generating performance report: {e}")
            return {}

    def _calculate_overall_health_score(
        self,
        sla_violations: List[SLAViolation],
        performance_trends: List[PerformanceTrend]
    ) -> float:
        """Calculate overall platform health score (0-100)"""

        base_score = 100.0

        # Deduct points for SLA violations
        for violation in sla_violations:
            if violation.severity == 'critical':
                base_score -= 15
            elif violation.severity == 'warning':
                base_score -= 5

        # Deduct points for degrading trends
        degrading_trends = [t for t in performance_trends if t.trend_direction == 'degrading']
        base_score -= len(degrading_trends) * 3

        # Deduct points for high anomaly scores
        high_anomaly_trends = [t for t in performance_trends if t.anomaly_score > 2.0]
        base_score -= len(high_anomaly_trends) * 2

        return max(0.0, base_score)

async def main():
    """Main entry point for the performance analytics engine"""

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    config = {
        'redis_url': 'redis://hasivu-redis:6379',
        'database_url': 'postgresql://hasivu:password@hasivu-postgresql:5432/hasivu_monitoring',
        'analysis_interval': 300,  # 5 minutes
        'sla_check_interval': 60,  # 1 minute
    }

    # Initialize performance analytics engine
    engine = HASIVUPerformanceAnalyticsEngine(config)
    await engine.initialize()

    logger = logging.getLogger(__name__)
    logger.info("HASIVU Performance Analytics Engine started successfully")

    # Main processing loop
    try:
        while True:
            # Run analytics cycle
            logger.info("Running performance analytics cycle...")

            # Monitor SLA compliance
            await engine.monitor_sla_compliance()

            # Analyze performance trends
            await engine.analyze_performance_trends()

            # Generate capacity predictions
            await engine.generate_capacity_predictions()

            await asyncio.sleep(config['analysis_interval'])

    except KeyboardInterrupt:
        logger.info("Shutting down performance analytics engine...")
    except Exception as e:
        logger.error(f"Fatal error in performance analytics engine: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())