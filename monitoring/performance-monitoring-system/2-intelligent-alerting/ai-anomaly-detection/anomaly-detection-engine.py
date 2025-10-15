"""
HASIVU Intelligent Anomaly Detection Engine
AI-powered anomaly detection with machine learning for multi-school platform
Reduces alert fatigue and provides intelligent insights for 500+ schools
"""

import asyncio
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import DBSCAN
from scipy import stats
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import aioredis
import asyncpg
from kubernetes import client, config
import json
import pickle
import joblib

# Prometheus metrics for monitoring the anomaly detection system
ANOMALIES_DETECTED = Counter('hasivu_anomalies_detected_total', 'Total anomalies detected', ['service', 'metric_type', 'severity'])
DETECTION_LATENCY = Histogram('hasivu_anomaly_detection_duration_seconds', 'Time spent on anomaly detection')
MODEL_ACCURACY = Gauge('hasivu_anomaly_model_accuracy', 'Current model accuracy score')
FALSE_POSITIVE_RATE = Gauge('hasivu_anomaly_false_positive_rate', 'False positive rate for anomaly detection')

@dataclass
class AnomalyAlert:
    """Structured anomaly alert with rich context"""
    id: str
    timestamp: datetime
    service: str
    metric_name: str
    metric_value: float
    baseline_value: float
    deviation_score: float
    severity: str  # critical, warning, info
    confidence: float
    school_id: Optional[str]
    tenant_id: Optional[str]
    context: Dict[str, Any]
    recommended_actions: List[str]
    correlation_alerts: List[str]
    business_impact: str

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data

@dataclass
class MetricPattern:
    """Historical pattern for a specific metric"""
    metric_name: str
    service: str
    baseline_mean: float
    baseline_std: float
    seasonal_patterns: Dict[str, float]
    trend_coefficient: float
    confidence_interval: Tuple[float, float]
    last_updated: datetime

class HASIVUAnomalyDetectionEngine:
    """
    Advanced AI-powered anomaly detection engine for HASIVU platform
    Features:
    - Multi-algorithm ensemble detection (Isolation Forest, DBSCAN, Statistical)
    - School-specific and cross-school pattern analysis
    - Contextual anomaly correlation
    - Automated false positive reduction
    - Business impact assessment
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)

        # AI models for different detection methods
        self.isolation_forest = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=200
        )
        self.scaler = StandardScaler()
        self.dbscan = DBSCAN(eps=0.5, min_samples=5)

        # Pattern storage and caching
        self.metric_patterns: Dict[str, MetricPattern] = {}
        self.model_cache: Dict[str, Any] = {}

        # Alert correlation and deduplication
        self.active_alerts: Dict[str, AnomalyAlert] = {}
        self.alert_correlation_window = timedelta(minutes=10)

        # Business impact scoring
        self.service_criticality = {
            'authentication': 0.95,
            'kitchen-management': 0.90,
            'vendor-marketplace': 0.85,
            'predictive-analytics': 0.80,
            'business-intelligence': 0.75,
            'database': 0.95,
            'message-queue': 0.85
        }

        # Performance tracking
        self.detection_stats = {
            'total_detections': 0,
            'false_positives': 0,
            'true_positives': 0,
            'processing_time': []
        }

    async def initialize(self):
        """Initialize the anomaly detection engine"""
        try:
            # Initialize Kubernetes client
            config.load_incluster_config()
            self.k8s_client = client.CustomObjectsApi()

            # Initialize Redis for caching and alert storage
            self.redis = await aioredis.from_url(
                self.config.get('redis_url', 'redis://hasivu-redis:6379'),
                decode_responses=True
            )

            # Initialize PostgreSQL for historical data
            self.db_pool = await asyncpg.create_pool(
                self.config.get('database_url', 'postgresql://hasivu:password@hasivu-postgresql:5432/hasivu_monitoring'),
                min_size=5,
                max_size=20
            )

            # Load pre-trained models and patterns
            await self.load_historical_patterns()
            await self.load_trained_models()

            # Start metrics server
            start_http_server(8080)

            self.logger.info("HASIVU Anomaly Detection Engine initialized successfully")

        except Exception as e:
            self.logger.error(f"Failed to initialize anomaly detection engine: {e}")
            raise

    async def load_historical_patterns(self):
        """Load historical metric patterns from database"""
        try:
            async with self.db_pool.acquire() as conn:
                query = """
                SELECT metric_name, service, baseline_mean, baseline_std,
                       seasonal_patterns, trend_coefficient, confidence_interval, last_updated
                FROM anomaly_metric_patterns
                WHERE last_updated > NOW() - INTERVAL '30 days'
                """
                rows = await conn.fetch(query)

                for row in rows:
                    pattern = MetricPattern(
                        metric_name=row['metric_name'],
                        service=row['service'],
                        baseline_mean=row['baseline_mean'],
                        baseline_std=row['baseline_std'],
                        seasonal_patterns=json.loads(row['seasonal_patterns']),
                        trend_coefficient=row['trend_coefficient'],
                        confidence_interval=tuple(row['confidence_interval']),
                        last_updated=row['last_updated']
                    )

                    pattern_key = f"{row['service']}:{row['metric_name']}"
                    self.metric_patterns[pattern_key] = pattern

                self.logger.info(f"Loaded {len(self.metric_patterns)} historical patterns")

        except Exception as e:
            self.logger.error(f"Failed to load historical patterns: {e}")

    async def load_trained_models(self):
        """Load pre-trained ML models from cache"""
        try:
            # Load models from Redis cache
            model_keys = await self.redis.keys("anomaly_model:*")

            for key in model_keys:
                model_data = await self.redis.get(key)
                if model_data:
                    model = pickle.loads(model_data.encode('latin1'))
                    service = key.split(':')[1]
                    self.model_cache[service] = model

            self.logger.info(f"Loaded {len(self.model_cache)} trained models")

        except Exception as e:
            self.logger.error(f"Failed to load trained models: {e}")

    @DETECTION_LATENCY.time()
    async def detect_anomalies(self, metrics_data: List[Dict[str, Any]]) -> List[AnomalyAlert]:
        """
        Main anomaly detection pipeline using ensemble methods
        """
        try:
            start_time = datetime.now()
            detected_anomalies = []

            # Group metrics by service for contextual analysis
            service_groups = self._group_metrics_by_service(metrics_data)

            for service, metrics in service_groups.items():
                # Apply multiple detection algorithms
                isolation_anomalies = await self._detect_isolation_forest_anomalies(service, metrics)
                statistical_anomalies = await self._detect_statistical_anomalies(service, metrics)
                pattern_anomalies = await self._detect_pattern_anomalies(service, metrics)

                # Ensemble voting for final anomaly decision
                ensemble_anomalies = self._ensemble_anomaly_decision(
                    isolation_anomalies, statistical_anomalies, pattern_anomalies
                )

                # Add business context and impact assessment
                for anomaly in ensemble_anomalies:
                    anomaly = await self._enrich_anomaly_context(anomaly, metrics)
                    detected_anomalies.append(anomaly)

            # Correlate related anomalies
            correlated_anomalies = await self._correlate_anomalies(detected_anomalies)

            # Filter false positives using historical feedback
            filtered_anomalies = await self._filter_false_positives(correlated_anomalies)

            # Update detection statistics
            processing_time = (datetime.now() - start_time).total_seconds()
            self.detection_stats['processing_time'].append(processing_time)
            self.detection_stats['total_detections'] += len(filtered_anomalies)

            # Record metrics
            for anomaly in filtered_anomalies:
                ANOMALIES_DETECTED.labels(
                    service=anomaly.service,
                    metric_type=anomaly.metric_name,
                    severity=anomaly.severity
                ).inc()

            self.logger.info(f"Detected {len(filtered_anomalies)} anomalies in {processing_time:.2f}s")

            return filtered_anomalies

        except Exception as e:
            self.logger.error(f"Error in anomaly detection: {e}")
            return []

    def _group_metrics_by_service(self, metrics_data: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group metrics by service for contextual analysis"""
        service_groups = {}

        for metric in metrics_data:
            service = metric.get('service', 'unknown')
            if service not in service_groups:
                service_groups[service] = []
            service_groups[service].append(metric)

        return service_groups

    async def _detect_isolation_forest_anomalies(
        self, service: str, metrics: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Detect anomalies using Isolation Forest algorithm"""
        try:
            if len(metrics) < 10:  # Need minimum samples
                return []

            # Prepare feature matrix
            features = []
            metric_info = []

            for metric in metrics:
                feature_vector = [
                    metric.get('value', 0),
                    metric.get('timestamp', datetime.now()).hour,  # Time-based feature
                    metric.get('timestamp', datetime.now()).weekday(),  # Day-based feature
                ]
                features.append(feature_vector)
                metric_info.append(metric)

            features_array = np.array(features)

            # Scale features
            features_scaled = self.scaler.fit_transform(features_array)

            # Detect anomalies
            anomaly_labels = self.isolation_forest.fit_predict(features_scaled)
            anomaly_scores = self.isolation_forest.decision_function(features_scaled)

            anomalies = []
            for i, (label, score) in enumerate(zip(anomaly_labels, anomaly_scores)):
                if label == -1:  # Anomaly detected
                    anomaly_info = metric_info[i].copy()
                    anomaly_info['detection_method'] = 'isolation_forest'
                    anomaly_info['anomaly_score'] = float(score)
                    anomaly_info['confidence'] = min(abs(score) * 10, 1.0)
                    anomalies.append(anomaly_info)

            return anomalies

        except Exception as e:
            self.logger.error(f"Error in isolation forest detection: {e}")
            return []

    async def _detect_statistical_anomalies(
        self, service: str, metrics: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Detect anomalies using statistical methods (Z-score, IQR)"""
        try:
            anomalies = []

            # Group by metric name
            metric_groups = {}
            for metric in metrics:
                name = metric.get('metric_name', 'unknown')
                if name not in metric_groups:
                    metric_groups[name] = []
                metric_groups[name].append(metric)

            for metric_name, metric_list in metric_groups.items():
                if len(metric_list) < 5:  # Need minimum samples
                    continue

                values = [m.get('value', 0) for m in metric_list]

                # Calculate statistical thresholds
                mean_val = np.mean(values)
                std_val = np.std(values)
                q75, q25 = np.percentile(values, [75, 25])
                iqr = q75 - q25

                # Z-score threshold (3 standard deviations)
                z_threshold = 3.0

                # IQR threshold
                iqr_lower = q25 - 1.5 * iqr
                iqr_upper = q75 + 1.5 * iqr

                for metric in metric_list:
                    value = metric.get('value', 0)
                    z_score = abs((value - mean_val) / std_val) if std_val > 0 else 0

                    # Check for anomalies
                    is_z_anomaly = z_score > z_threshold
                    is_iqr_anomaly = value < iqr_lower or value > iqr_upper

                    if is_z_anomaly or is_iqr_anomaly:
                        anomaly_info = metric.copy()
                        anomaly_info['detection_method'] = 'statistical'
                        anomaly_info['z_score'] = z_score
                        anomaly_info['confidence'] = min(z_score / z_threshold, 1.0)
                        anomaly_info['baseline_mean'] = mean_val
                        anomaly_info['baseline_std'] = std_val
                        anomalies.append(anomaly_info)

            return anomalies

        except Exception as e:
            self.logger.error(f"Error in statistical detection: {e}")
            return []

    async def _detect_pattern_anomalies(
        self, service: str, metrics: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Detect anomalies based on historical patterns and seasonality"""
        try:
            anomalies = []

            for metric in metrics:
                metric_name = metric.get('metric_name', 'unknown')
                pattern_key = f"{service}:{metric_name}"

                # Check if we have historical pattern
                if pattern_key not in self.metric_patterns:
                    continue

                pattern = self.metric_patterns[pattern_key]
                current_value = metric.get('value', 0)
                timestamp = metric.get('timestamp', datetime.now())

                # Calculate expected value considering seasonality
                expected_value = self._calculate_expected_value(pattern, timestamp)

                # Calculate deviation
                deviation = abs(current_value - expected_value)
                threshold = pattern.baseline_std * 2.5  # 2.5 sigma threshold

                if deviation > threshold:
                    anomaly_info = metric.copy()
                    anomaly_info['detection_method'] = 'pattern'
                    anomaly_info['expected_value'] = expected_value
                    anomaly_info['deviation'] = deviation
                    anomaly_info['confidence'] = min(deviation / threshold, 1.0)
                    anomalies.append(anomaly_info)

            return anomalies

        except Exception as e:
            self.logger.error(f"Error in pattern detection: {e}")
            return []

    def _calculate_expected_value(self, pattern: MetricPattern, timestamp: datetime) -> float:
        """Calculate expected value based on historical patterns and seasonality"""
        base_value = pattern.baseline_mean

        # Add seasonal component
        hour_of_day = timestamp.hour
        day_of_week = timestamp.weekday()

        # Get seasonal adjustments
        hour_adjustment = pattern.seasonal_patterns.get(f"hour_{hour_of_day}", 0)
        day_adjustment = pattern.seasonal_patterns.get(f"day_{day_of_week}", 0)

        # Apply trend (if any)
        days_since_baseline = (timestamp - pattern.last_updated).days
        trend_adjustment = pattern.trend_coefficient * days_since_baseline

        expected_value = base_value + hour_adjustment + day_adjustment + trend_adjustment

        return expected_value

    def _ensemble_anomaly_decision(
        self, isolation_anomalies: List[Dict[str, Any]],
        statistical_anomalies: List[Dict[str, Any]],
        pattern_anomalies: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Combine results from multiple detection methods using ensemble voting"""

        # Create a mapping of metrics to detection results
        metric_detections = {}

        # Process each detection method
        for anomaly_list, method in [
            (isolation_anomalies, 'isolation_forest'),
            (statistical_anomalies, 'statistical'),
            (pattern_anomalies, 'pattern')
        ]:
            for anomaly in anomaly_list:
                key = f"{anomaly.get('service', 'unknown')}:{anomaly.get('metric_name', 'unknown')}:{anomaly.get('timestamp', datetime.now())}"

                if key not in metric_detections:
                    metric_detections[key] = {
                        'metric_info': anomaly,
                        'detection_methods': [],
                        'total_confidence': 0,
                        'method_count': 0
                    }

                metric_detections[key]['detection_methods'].append(method)
                metric_detections[key]['total_confidence'] += anomaly.get('confidence', 0)
                metric_detections[key]['method_count'] += 1

        # Apply ensemble voting
        ensemble_anomalies = []

        for key, detection_info in metric_detections.items():
            method_count = detection_info['method_count']
            avg_confidence = detection_info['total_confidence'] / method_count

            # Require at least 2 methods to agree or very high confidence from 1 method
            if method_count >= 2 or (method_count == 1 and avg_confidence > 0.8):
                anomaly = detection_info['metric_info'].copy()
                anomaly['ensemble_confidence'] = avg_confidence
                anomaly['detection_methods'] = detection_info['detection_methods']
                anomaly['method_agreement'] = method_count
                ensemble_anomalies.append(anomaly)

        return ensemble_anomalies

    async def _enrich_anomaly_context(
        self, anomaly: Dict[str, Any], all_metrics: List[Dict[str, Any]]
    ) -> AnomalyAlert:
        """Enrich anomaly with business context and impact assessment"""

        service = anomaly.get('service', 'unknown')
        metric_name = anomaly.get('metric_name', 'unknown')
        metric_value = anomaly.get('value', 0)
        timestamp = anomaly.get('timestamp', datetime.now())
        confidence = anomaly.get('ensemble_confidence', anomaly.get('confidence', 0))

        # Determine severity based on service criticality and confidence
        service_criticality = self.service_criticality.get(service, 0.5)
        severity_score = confidence * service_criticality

        if severity_score > 0.8:
            severity = 'critical'
        elif severity_score > 0.5:
            severity = 'warning'
        else:
            severity = 'info'

        # Calculate business impact
        business_impact = self._calculate_business_impact(service, metric_name, metric_value, severity)

        # Generate recommended actions
        recommended_actions = self._generate_recommended_actions(service, metric_name, anomaly)

        # Extract school and tenant information
        school_id = anomaly.get('school_id')
        tenant_id = anomaly.get('tenant_id')

        # Create structured alert
        alert = AnomalyAlert(
            id=f"anomaly_{timestamp.timestamp()}_{service}_{metric_name}",
            timestamp=timestamp,
            service=service,
            metric_name=metric_name,
            metric_value=metric_value,
            baseline_value=anomaly.get('baseline_mean', anomaly.get('expected_value', 0)),
            deviation_score=confidence,
            severity=severity,
            confidence=confidence,
            school_id=school_id,
            tenant_id=tenant_id,
            context={
                'detection_methods': anomaly.get('detection_methods', []),
                'method_agreement': anomaly.get('method_agreement', 1),
                'z_score': anomaly.get('z_score'),
                'anomaly_score': anomaly.get('anomaly_score'),
                'deviation': anomaly.get('deviation')
            },
            recommended_actions=recommended_actions,
            correlation_alerts=[],  # Will be filled during correlation
            business_impact=business_impact
        )

        return alert

    def _calculate_business_impact(
        self, service: str, metric_name: str, metric_value: float, severity: str
    ) -> str:
        """Calculate the business impact of the anomaly"""

        impact_templates = {
            'critical': {
                'authentication': 'User login failures affecting all schools. Potential revenue loss.',
                'kitchen-management': 'Kitchen operations disrupted. Meal service delays affecting {estimated_students} students.',
                'vendor-marketplace': 'Vendor procurement issues. Supply chain disruption affecting multiple schools.',
                'database': 'Database performance degraded. All platform services affected.',
                'default': 'Critical system anomaly detected. Immediate investigation required.'
            },
            'warning': {
                'authentication': 'Authentication system showing degraded performance.',
                'kitchen-management': 'Kitchen efficiency reduced. Monitor for further degradation.',
                'vendor-marketplace': 'Vendor response times elevated. Procurement delays possible.',
                'default': 'System performance anomaly detected. Monitor closely.'
            },
            'info': {
                'default': 'Minor anomaly detected. Normal monitoring continues.'
            }
        }

        severity_impacts = impact_templates.get(severity, {})
        impact = severity_impacts.get(service, severity_impacts.get('default', 'Anomaly detected.'))

        # Add context-specific information
        if 'estimated_students' in impact:
            # Estimate affected students (placeholder logic)
            estimated_students = min(int(metric_value * 100), 10000)
            impact = impact.format(estimated_students=estimated_students)

        return impact

    def _generate_recommended_actions(
        self, service: str, metric_name: str, anomaly: Dict[str, Any]
    ) -> List[str]:
        """Generate context-aware recommended actions"""

        actions = []

        # Service-specific actions
        service_actions = {
            'authentication': [
                'Check authentication service logs for errors',
                'Verify database connectivity',
                'Monitor failed login patterns for security threats',
                'Scale authentication pods if needed'
            ],
            'kitchen-management': [
                'Check kitchen service health and logs',
                'Verify inventory management system connectivity',
                'Contact kitchen staff for manual verification',
                'Review meal preparation schedules'
            ],
            'vendor-marketplace': [
                'Check vendor API connectivity',
                'Review AI optimization recommendations',
                'Monitor supply chain status',
                'Verify vendor SLA compliance'
            ],
            'database': [
                'Check database connection pool utilization',
                'Review slow query logs',
                'Monitor disk space and memory usage',
                'Consider read replica scaling'
            ]
        }

        # Metric-specific actions
        if 'response_time' in metric_name:
            actions.append('Investigate response time degradation')
            actions.append('Check infrastructure resource utilization')

        if 'error_rate' in metric_name:
            actions.append('Review error logs for patterns')
            actions.append('Check recent deployments for issues')

        if 'memory' in metric_name or 'cpu' in metric_name:
            actions.append('Monitor resource usage trends')
            actions.append('Consider scaling recommendations')

        # Add service-specific actions
        actions.extend(service_actions.get(service, ['Monitor service health', 'Review service logs']))

        # Add detection method specific actions
        detection_methods = anomaly.get('detection_methods', [])
        if 'pattern' in detection_methods:
            actions.append('Compare with historical patterns')

        if 'statistical' in detection_methods:
            actions.append('Verify statistical significance')

        return actions[:5]  # Limit to top 5 actions

    async def _correlate_anomalies(self, anomalies: List[AnomalyAlert]) -> List[AnomalyAlert]:
        """Correlate related anomalies to reduce alert noise"""

        if len(anomalies) <= 1:
            return anomalies

        # Time-based correlation window
        correlation_window = self.alert_correlation_window

        # Group anomalies by time proximity
        time_groups = []
        for anomaly in sorted(anomalies, key=lambda x: x.timestamp):
            placed = False

            for group in time_groups:
                # Check if anomaly falls within correlation window of any anomaly in group
                for group_anomaly in group:
                    time_diff = abs((anomaly.timestamp - group_anomaly.timestamp).total_seconds())
                    if time_diff <= correlation_window.total_seconds():
                        group.append(anomaly)
                        placed = True
                        break

                if placed:
                    break

            if not placed:
                time_groups.append([anomaly])

        # Correlate anomalies within each time group
        correlated_anomalies = []

        for group in time_groups:
            if len(group) == 1:
                correlated_anomalies.append(group[0])
                continue

            # Find primary anomaly (highest severity + confidence)
            primary_anomaly = max(group, key=lambda x: (
                {'critical': 3, 'warning': 2, 'info': 1}[x.severity] + x.confidence
            ))

            # Add correlation information to primary anomaly
            related_alerts = [a.id for a in group if a.id != primary_anomaly.id]
            primary_anomaly.correlation_alerts = related_alerts

            # Update context with correlation information
            primary_anomaly.context['correlated_services'] = list(set(a.service for a in group))
            primary_anomaly.context['correlated_metrics'] = list(set(a.metric_name for a in group))
            primary_anomaly.context['correlation_count'] = len(group) - 1

            correlated_anomalies.append(primary_anomaly)

        return correlated_anomalies

    async def _filter_false_positives(self, anomalies: List[AnomalyAlert]) -> List[AnomalyAlert]:
        """Filter false positives using historical feedback and patterns"""

        filtered_anomalies = []

        for anomaly in anomalies:
            # Check historical false positive patterns
            fp_score = await self._calculate_false_positive_score(anomaly)

            # Apply false positive threshold
            if fp_score < 0.7:  # Keep anomalies with low false positive probability
                filtered_anomalies.append(anomaly)
            else:
                self.logger.debug(f"Filtered potential false positive: {anomaly.id} (FP score: {fp_score:.2f})")

        # Update false positive rate metric
        if len(anomalies) > 0:
            fp_rate = (len(anomalies) - len(filtered_anomalies)) / len(anomalies)
            FALSE_POSITIVE_RATE.set(fp_rate)

        return filtered_anomalies

    async def _calculate_false_positive_score(self, anomaly: AnomalyAlert) -> float:
        """Calculate the probability that this anomaly is a false positive"""

        try:
            # Query historical false positive patterns
            async with self.db_pool.acquire() as conn:
                query = """
                SELECT AVG(CASE WHEN confirmed_false_positive THEN 1.0 ELSE 0.0 END) as fp_rate,
                       COUNT(*) as total_count
                FROM anomaly_feedback
                WHERE service = $1 AND metric_name = $2
                AND created_at > NOW() - INTERVAL '30 days'
                """
                row = await conn.fetchrow(query, anomaly.service, anomaly.metric_name)

                if row and row['total_count'] > 5:
                    historical_fp_rate = row['fp_rate']
                else:
                    historical_fp_rate = 0.1  # Default low false positive rate

            # Factors that influence false positive probability
            confidence_factor = 1.0 - anomaly.confidence  # Lower confidence = higher FP probability
            method_agreement_factor = 1.0 / (anomaly.context.get('method_agreement', 1))  # Less agreement = higher FP
            correlation_factor = 1.0 / (1 + anomaly.context.get('correlation_count', 0))  # Less correlation = higher FP

            # Combined false positive score
            fp_score = (
                historical_fp_rate * 0.4 +
                confidence_factor * 0.3 +
                method_agreement_factor * 0.2 +
                correlation_factor * 0.1
            )

            return min(fp_score, 1.0)

        except Exception as e:
            self.logger.error(f"Error calculating false positive score: {e}")
            return 0.1  # Default to low false positive probability

    async def update_model_with_feedback(self, alert_id: str, is_false_positive: bool):
        """Update models based on human feedback"""
        try:
            # Store feedback in database
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO anomaly_feedback (alert_id, confirmed_false_positive, feedback_timestamp)
                    VALUES ($1, $2, NOW())
                    ON CONFLICT (alert_id) DO UPDATE SET
                        confirmed_false_positive = $2,
                        feedback_timestamp = NOW()
                """, alert_id, is_false_positive)

            # Update model accuracy metrics
            if is_false_positive:
                self.detection_stats['false_positives'] += 1
            else:
                self.detection_stats['true_positives'] += 1

            # Calculate and update accuracy metric
            total_feedback = self.detection_stats['false_positives'] + self.detection_stats['true_positives']
            if total_feedback > 0:
                accuracy = self.detection_stats['true_positives'] / total_feedback
                MODEL_ACCURACY.set(accuracy)

            self.logger.info(f"Updated model with feedback for alert {alert_id}: FP={is_false_positive}")

        except Exception as e:
            self.logger.error(f"Error updating model with feedback: {e}")

    async def retrain_models(self):
        """Retrain anomaly detection models with recent data and feedback"""
        try:
            self.logger.info("Starting model retraining process...")

            # Get recent training data
            async with self.db_pool.acquire() as conn:
                # Get metrics with feedback
                training_data = await conn.fetch("""
                    SELECT m.*, f.confirmed_false_positive
                    FROM anomaly_training_data m
                    LEFT JOIN anomaly_feedback f ON m.alert_id = f.alert_id
                    WHERE m.timestamp > NOW() - INTERVAL '7 days'
                    ORDER BY m.timestamp DESC
                    LIMIT 10000
                """)

            if len(training_data) < 100:
                self.logger.warning("Insufficient training data for model retraining")
                return

            # Prepare training dataset
            X = []
            y = []

            for row in training_data:
                features = [
                    row['metric_value'],
                    row['baseline_value'],
                    row['deviation_score'],
                    row['timestamp'].hour,
                    row['timestamp'].weekday()
                ]
                X.append(features)

                # Label: 1 for true anomaly, 0 for false positive
                is_anomaly = not row['confirmed_false_positive'] if row['confirmed_false_positive'] is not None else 1
                y.append(is_anomaly)

            X = np.array(X)
            y = np.array(y)

            # Retrain Isolation Forest with updated parameters
            self.isolation_forest = IsolationForest(
                contamination=np.mean(y == 0),  # Use actual false positive rate
                random_state=42,
                n_estimators=200
            )

            # Fit model on normal data (y == 1)
            normal_data = X[y == 1]
            if len(normal_data) > 50:
                self.isolation_forest.fit(normal_data)

                # Cache retrained model
                model_data = pickle.dumps(self.isolation_forest)
                await self.redis.set("anomaly_model:retrained", model_data.decode('latin1'), ex=86400)

                self.logger.info("Successfully retrained anomaly detection models")

        except Exception as e:
            self.logger.error(f"Error during model retraining: {e}")

    async def get_anomaly_statistics(self) -> Dict[str, Any]:
        """Get anomaly detection statistics and health metrics"""
        try:
            # Calculate recent performance metrics
            recent_processing_times = self.detection_stats['processing_time'][-100:]
            avg_processing_time = np.mean(recent_processing_times) if recent_processing_times else 0

            total_feedback = self.detection_stats['false_positives'] + self.detection_stats['true_positives']
            accuracy = self.detection_stats['true_positives'] / total_feedback if total_feedback > 0 else 0

            # Get alert distribution from database
            async with self.db_pool.acquire() as conn:
                alert_stats = await conn.fetch("""
                    SELECT service, severity, COUNT(*) as count
                    FROM anomaly_alerts
                    WHERE created_at > NOW() - INTERVAL '24 hours'
                    GROUP BY service, severity
                """)

            return {
                'total_detections': self.detection_stats['total_detections'],
                'accuracy': accuracy,
                'false_positive_rate': self.detection_stats['false_positives'] / max(total_feedback, 1),
                'avg_processing_time_seconds': avg_processing_time,
                'active_alerts': len(self.active_alerts),
                'loaded_patterns': len(self.metric_patterns),
                'cached_models': len(self.model_cache),
                'recent_alert_distribution': [dict(row) for row in alert_stats]
            }

        except Exception as e:
            self.logger.error(f"Error getting statistics: {e}")
            return {}

async def main():
    """Main entry point for the anomaly detection engine"""

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    config = {
        'redis_url': 'redis://hasivu-redis:6379',
        'database_url': 'postgresql://hasivu:password@hasivu-postgresql:5432/hasivu_monitoring',
        'detection_interval': 60,  # seconds
        'retraining_interval': 3600,  # seconds
    }

    # Initialize anomaly detection engine
    engine = HASIVUAnomalyDetectionEngine(config)
    await engine.initialize()

    logger = logging.getLogger(__name__)
    logger.info("HASIVU Anomaly Detection Engine started successfully")

    # Main processing loop
    try:
        while True:
            # Process anomaly detection cycle
            # This would typically receive metrics from Prometheus or other sources
            # For now, we'll simulate the processing cycle

            logger.info("Running anomaly detection cycle...")

            # In a real implementation, you would:
            # 1. Query metrics from Prometheus
            # 2. Run anomaly detection
            # 3. Send alerts to alertmanager
            # 4. Store results in database

            await asyncio.sleep(config['detection_interval'])

    except KeyboardInterrupt:
        logger.info("Shutting down anomaly detection engine...")
    except Exception as e:
        logger.error(f"Fatal error in anomaly detection engine: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())