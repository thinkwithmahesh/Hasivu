"""
HASIVU Intelligent Circuit Breaker System
Advanced circuit breaker implementation with AI-driven failure prediction,
adaptive thresholds, and automatic recovery for multi-school platform
"""

import asyncio
import logging
import time
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable, Any, Union
from dataclasses import dataclass, asdict
from enum import Enum
import numpy as np
from collections import deque, defaultdict
import aioredis
import asyncpg
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import json
from kubernetes import client, config
import hashlib

# Prometheus metrics for circuit breaker monitoring
CIRCUIT_BREAKER_STATE_CHANGES = Counter('hasivu_circuit_breaker_state_changes_total', 'Circuit breaker state changes', ['service', 'from_state', 'to_state'])
CIRCUIT_BREAKER_REQUESTS = Counter('hasivu_circuit_breaker_requests_total', 'Total requests through circuit breaker', ['service', 'state', 'result'])
CIRCUIT_BREAKER_FAILURES = Counter('hasivu_circuit_breaker_failures_total', 'Circuit breaker failures', ['service', 'failure_type'])
CIRCUIT_BREAKER_RECOVERY_TIME = Histogram('hasivu_circuit_breaker_recovery_duration_seconds', 'Time to recover from circuit breaker trips', ['service'])
ADAPTIVE_THRESHOLD_ADJUSTMENTS = Counter('hasivu_adaptive_threshold_adjustments_total', 'Adaptive threshold adjustments', ['service', 'adjustment_type'])

class CircuitBreakerState(Enum):
    """Circuit breaker states with enhanced state management"""
    CLOSED = "closed"           # Normal operation
    OPEN = "open"              # Circuit tripped, rejecting requests
    HALF_OPEN = "half_open"    # Testing recovery
    FORCED_OPEN = "forced_open" # Manually opened for maintenance

class FailureType(Enum):
    """Types of failures that can trigger circuit breakers"""
    TIMEOUT = "timeout"
    ERROR_RATE = "error_rate"
    LATENCY = "latency"
    RESOURCE_EXHAUSTION = "resource_exhaustion"
    DEPENDENCY_FAILURE = "dependency_failure"
    CUSTOM = "custom"

@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker behavior"""
    name: str
    service: str
    failure_threshold: int = 5           # Number of failures to trip
    recovery_timeout: int = 60           # Seconds before trying half-open
    test_request_count: int = 3          # Requests to test in half-open
    success_threshold: int = 3           # Successes needed to close
    timeout_duration: float = 30.0       # Request timeout in seconds
    error_rate_threshold: float = 0.5    # Error rate to trigger (50%)
    latency_threshold: float = 5.0       # Latency threshold in seconds
    window_size: int = 100              # Rolling window size
    adaptive_thresholds: bool = True     # Enable adaptive threshold adjustment
    ai_prediction: bool = True          # Enable AI failure prediction
    school_specific: bool = False       # School-specific circuit breaker

@dataclass
class RequestMetrics:
    """Metrics for a single request"""
    timestamp: datetime
    duration: float
    success: bool
    error_type: Optional[str]
    response_code: Optional[int]
    school_id: Optional[str]

@dataclass
class CircuitBreakerStats:
    """Statistics for circuit breaker performance"""
    total_requests: int
    successful_requests: int
    failed_requests: int
    rejected_requests: int
    average_response_time: float
    error_rate: float
    state_changes: int
    last_trip_time: Optional[datetime]
    recovery_time: Optional[float]
    adaptive_adjustments: int

class IntelligentCircuitBreaker:
    """
    Intelligent circuit breaker with AI-driven failure prediction and adaptive thresholds
    Features:
    - Adaptive threshold adjustment based on traffic patterns
    - AI-powered failure prediction using historical data
    - Multi-dimensional failure detection (timeout, error rate, latency)
    - School-specific circuit breakers for multi-tenant isolation
    - Automatic recovery testing with gradual ramp-up
    - Integration with Kubernetes for service discovery
    """

    def __init__(self, config: CircuitBreakerConfig):
        self.config = config
        self.logger = logging.getLogger(f"circuit_breaker.{config.name}")

        # Circuit breaker state
        self.state = CircuitBreakerState.CLOSED
        self.state_changed_at = datetime.now()
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[datetime] = None

        # Request tracking
        self.request_window = deque(maxlen=config.window_size)
        self.latency_window = deque(maxlen=50)  # Separate window for latency tracking

        # Adaptive thresholds
        self.adaptive_failure_threshold = config.failure_threshold
        self.adaptive_error_rate_threshold = config.error_rate_threshold
        self.adaptive_latency_threshold = config.latency_threshold

        # AI prediction components
        self.failure_patterns: Dict[str, List[float]] = defaultdict(list)
        self.prediction_confidence = 0.0
        self.predicted_failure_probability = 0.0

        # Statistics
        self.stats = CircuitBreakerStats(
            total_requests=0,
            successful_requests=0,
            failed_requests=0,
            rejected_requests=0,
            average_response_time=0.0,
            error_rate=0.0,
            state_changes=0,
            last_trip_time=None,
            recovery_time=None,
            adaptive_adjustments=0
        )

        # School-specific tracking
        self.school_metrics: Dict[str, RequestMetrics] = {}

        # Integration components
        self.redis_client: Optional[aioredis.Redis] = None
        self.db_pool: Optional[asyncpg.Pool] = None

    async def initialize(self, redis_url: str, db_url: str):
        """Initialize circuit breaker with external dependencies"""
        try:
            # Initialize Redis for state persistence
            self.redis_client = await aioredis.from_url(redis_url, decode_responses=True)

            # Initialize PostgreSQL for metrics storage
            self.db_pool = await asyncpg.create_pool(db_url, min_size=2, max_size=10)

            # Load historical state if exists
            await self._load_state_from_redis()

            # Load historical patterns for AI prediction
            await self._load_historical_patterns()

            self.logger.info(f"Circuit breaker {self.config.name} initialized successfully")

        except Exception as e:
            self.logger.error(f"Failed to initialize circuit breaker: {e}")
            raise

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute a function call through the circuit breaker
        Provides intelligent failure detection and recovery
        """
        start_time = time.time()
        school_id = kwargs.get('school_id')

        # Check if circuit is open
        if await self._should_reject_request():
            self.stats.rejected_requests += 1
            CIRCUIT_BREAKER_REQUESTS.labels(
                service=self.config.service,
                state=self.state.value,
                result='rejected'
            ).inc()

            raise CircuitBreakerOpenException(
                f"Circuit breaker {self.config.name} is open"
            )

        # Execute the request
        try:
            # Set timeout for the request
            result = await asyncio.wait_for(
                func(*args, **kwargs),
                timeout=self.config.timeout_duration
            )

            # Record successful request
            duration = time.time() - start_time
            await self._record_success(duration, school_id)

            return result

        except asyncio.TimeoutError:
            duration = time.time() - start_time
            await self._record_failure(FailureType.TIMEOUT, duration, school_id)
            raise

        except Exception as e:
            duration = time.time() - start_time
            await self._record_failure(FailureType.ERROR_RATE, duration, school_id, str(e))
            raise

    async def _should_reject_request(self) -> bool:
        """Determine if request should be rejected based on current state"""

        if self.state == CircuitBreakerState.CLOSED:
            return False

        elif self.state == CircuitBreakerState.OPEN:
            # Check if recovery timeout has elapsed
            time_since_trip = (datetime.now() - self.state_changed_at).total_seconds()
            if time_since_trip >= self.config.recovery_timeout:
                await self._transition_to_half_open()
                return False
            return True

        elif self.state == CircuitBreakerState.HALF_OPEN:
            # Allow limited requests for testing
            return self.success_count >= self.config.test_request_count

        elif self.state == CircuitBreakerState.FORCED_OPEN:
            return True

        return False

    async def _record_success(self, duration: float, school_id: Optional[str]):
        """Record a successful request and update metrics"""

        self.stats.total_requests += 1
        self.stats.successful_requests += 1
        self.success_count += 1
        self.failure_count = max(0, self.failure_count - 1)  # Gradual failure recovery

        # Record metrics
        metrics = RequestMetrics(
            timestamp=datetime.now(),
            duration=duration,
            success=True,
            error_type=None,
            response_code=200,
            school_id=school_id
        )

        self.request_window.append(metrics)
        self.latency_window.append(duration)

        # Update school-specific metrics
        if school_id:
            self.school_metrics[school_id] = metrics

        # Check for recovery in half-open state
        if self.state == CircuitBreakerState.HALF_OPEN:
            if self.success_count >= self.config.success_threshold:
                await self._transition_to_closed()

        # Update adaptive thresholds
        if self.config.adaptive_thresholds:
            await self._update_adaptive_thresholds()

        # Record metrics
        CIRCUIT_BREAKER_REQUESTS.labels(
            service=self.config.service,
            state=self.state.value,
            result='success'
        ).inc()

        # Persist state
        await self._persist_state()

        self.logger.debug(f"Recorded success: duration={duration:.3f}s, school={school_id}")

    async def _record_failure(
        self,
        failure_type: FailureType,
        duration: float,
        school_id: Optional[str],
        error_message: Optional[str] = None
    ):
        """Record a failed request and check for circuit breaker trip"""

        self.stats.total_requests += 1
        self.stats.failed_requests += 1
        self.failure_count += 1
        self.success_count = 0  # Reset success count on failure
        self.last_failure_time = datetime.now()

        # Record metrics
        metrics = RequestMetrics(
            timestamp=datetime.now(),
            duration=duration,
            success=False,
            error_type=failure_type.value,
            response_code=500,
            school_id=school_id
        )

        self.request_window.append(metrics)
        self.latency_window.append(duration)

        # Update school-specific metrics
        if school_id:
            self.school_metrics[school_id] = metrics

        # Check for circuit breaker trip
        await self._check_trip_conditions(failure_type)

        # Update AI prediction patterns
        await self._update_failure_patterns(failure_type, duration)

        # Record metrics
        CIRCUIT_BREAKER_REQUESTS.labels(
            service=self.config.service,
            state=self.state.value,
            result='failure'
        ).inc()

        CIRCUIT_BREAKER_FAILURES.labels(
            service=self.config.service,
            failure_type=failure_type.value
        ).inc()

        # Persist state
        await self._persist_state()

        self.logger.warning(
            f"Recorded failure: type={failure_type.value}, duration={duration:.3f}s, "
            f"school={school_id}, error={error_message}"
        )

    async def _check_trip_conditions(self, failure_type: FailureType):
        """Check if circuit breaker should trip based on current metrics"""

        should_trip = False
        trip_reason = ""

        # Check failure count threshold
        if self.failure_count >= self.adaptive_failure_threshold:
            should_trip = True
            trip_reason = f"failure_count({self.failure_count}) >= threshold({self.adaptive_failure_threshold})"

        # Check error rate threshold
        if len(self.request_window) >= 10:  # Need minimum requests for error rate calculation
            recent_failures = sum(1 for req in list(self.request_window)[-20:] if not req.success)
            error_rate = recent_failures / min(20, len(self.request_window))

            if error_rate >= self.adaptive_error_rate_threshold:
                should_trip = True
                trip_reason = f"error_rate({error_rate:.2f}) >= threshold({self.adaptive_error_rate_threshold:.2f})"

        # Check latency threshold
        if len(self.latency_window) >= 5:
            avg_latency = np.mean(list(self.latency_window)[-10:])
            if avg_latency >= self.adaptive_latency_threshold:
                should_trip = True
                trip_reason = f"avg_latency({avg_latency:.2f}s) >= threshold({self.adaptive_latency_threshold:.2f}s)"

        # Check AI prediction
        if self.config.ai_prediction and self.predicted_failure_probability > 0.8:
            should_trip = True
            trip_reason = f"ai_prediction({self.predicted_failure_probability:.2f}) indicates high failure probability"

        # Check school-specific patterns
        if self.config.school_specific and await self._check_school_specific_patterns():
            should_trip = True
            trip_reason = "school_specific_pattern_detected"

        # Trip the circuit breaker
        if should_trip and self.state == CircuitBreakerState.CLOSED:
            await self._transition_to_open(trip_reason)

        elif should_trip and self.state == CircuitBreakerState.HALF_OPEN:
            await self._transition_to_open(f"half_open_failure: {trip_reason}")

    async def _check_school_specific_patterns(self) -> bool:
        """Check for school-specific failure patterns"""
        if not self.config.school_specific or len(self.school_metrics) < 3:
            return False

        # Analyze recent school metrics
        failed_schools = 0
        total_schools = len(self.school_metrics)

        for school_id, metrics in self.school_metrics.items():
            # Check if school has recent failures
            time_since_last = (datetime.now() - metrics.timestamp).total_seconds()
            if time_since_last < 300 and not metrics.success:  # 5 minutes
                failed_schools += 1

        # Trip if more than 50% of schools are failing
        failure_ratio = failed_schools / total_schools
        return failure_ratio > 0.5

    async def _transition_to_open(self, reason: str):
        """Transition circuit breaker to OPEN state"""

        previous_state = self.state
        self.state = CircuitBreakerState.OPEN
        self.state_changed_at = datetime.now()
        self.stats.last_trip_time = datetime.now()
        self.stats.state_changes += 1

        # Record state change
        CIRCUIT_BREAKER_STATE_CHANGES.labels(
            service=self.config.service,
            from_state=previous_state.value,
            to_state=self.state.value
        ).inc()

        # Log state change
        self.logger.warning(
            f"Circuit breaker {self.config.name} tripped to OPEN state. Reason: {reason}"
        )

        # Notify external systems
        await self._notify_state_change(previous_state, self.state, reason)

        # Persist state
        await self._persist_state()

    async def _transition_to_half_open(self):
        """Transition circuit breaker to HALF_OPEN state for testing"""

        previous_state = self.state
        self.state = CircuitBreakerState.HALF_OPEN
        self.state_changed_at = datetime.now()
        self.success_count = 0
        self.stats.state_changes += 1

        # Record state change
        CIRCUIT_BREAKER_STATE_CHANGES.labels(
            service=self.config.service,
            from_state=previous_state.value,
            to_state=self.state.value
        ).inc()

        self.logger.info(f"Circuit breaker {self.config.name} transitioned to HALF_OPEN for testing")

        # Notify external systems
        await self._notify_state_change(previous_state, self.state, "recovery_test")

        # Persist state
        await self._persist_state()

    async def _transition_to_closed(self):
        """Transition circuit breaker to CLOSED state (fully recovered)"""

        previous_state = self.state
        self.state = CircuitBreakerState.CLOSED
        self.state_changed_at = datetime.now()
        self.failure_count = 0
        self.success_count = 0
        self.stats.state_changes += 1

        # Calculate recovery time
        if self.stats.last_trip_time:
            recovery_time = (datetime.now() - self.stats.last_trip_time).total_seconds()
            self.stats.recovery_time = recovery_time
            CIRCUIT_BREAKER_RECOVERY_TIME.labels(service=self.config.service).observe(recovery_time)

        # Record state change
        CIRCUIT_BREAKER_STATE_CHANGES.labels(
            service=self.config.service,
            from_state=previous_state.value,
            to_state=self.state.value
        ).inc()

        self.logger.info(f"Circuit breaker {self.config.name} recovered to CLOSED state")

        # Notify external systems
        await self._notify_state_change(previous_state, self.state, "recovery_complete")

        # Persist state
        await self._persist_state()

    async def _update_adaptive_thresholds(self):
        """Update adaptive thresholds based on traffic patterns and historical data"""

        if len(self.request_window) < 50:  # Need sufficient data
            return

        # Analyze recent traffic patterns
        recent_requests = list(self.request_window)[-50:]

        # Calculate traffic statistics
        traffic_volume = len(recent_requests)
        error_rate = sum(1 for req in recent_requests if not req.success) / len(recent_requests)
        avg_latency = np.mean([req.duration for req in recent_requests])

        # Time-based patterns
        current_hour = datetime.now().hour
        is_peak_hour = 9 <= current_hour <= 17  # Business hours
        is_weekend = datetime.now().weekday() >= 5

        # Adjust failure threshold based on traffic
        if traffic_volume > 40:  # High traffic
            new_failure_threshold = min(self.config.failure_threshold + 2, 10)
        elif traffic_volume < 10:  # Low traffic
            new_failure_threshold = max(self.config.failure_threshold - 1, 2)
        else:
            new_failure_threshold = self.config.failure_threshold

        # Adjust error rate threshold based on patterns
        if is_peak_hour and not is_weekend:
            # More lenient during peak hours
            new_error_rate_threshold = min(self.adaptive_error_rate_threshold + 0.1, 0.8)
        else:
            # More strict during off-peak
            new_error_rate_threshold = max(self.adaptive_error_rate_threshold - 0.05, 0.2)

        # Adjust latency threshold based on recent performance
        if avg_latency < self.adaptive_latency_threshold * 0.5:
            # Performance is good, tighten threshold
            new_latency_threshold = max(self.adaptive_latency_threshold * 0.9, 1.0)
        elif avg_latency > self.adaptive_latency_threshold * 1.5:
            # Performance is poor, relax threshold temporarily
            new_latency_threshold = min(self.adaptive_latency_threshold * 1.2, 30.0)
        else:
            new_latency_threshold = self.adaptive_latency_threshold

        # Apply changes if significant
        threshold_changed = False

        if abs(new_failure_threshold - self.adaptive_failure_threshold) >= 1:
            old_threshold = self.adaptive_failure_threshold
            self.adaptive_failure_threshold = new_failure_threshold
            threshold_changed = True
            ADAPTIVE_THRESHOLD_ADJUSTMENTS.labels(
                service=self.config.service,
                adjustment_type='failure_threshold'
            ).inc()
            self.logger.info(f"Adjusted failure threshold: {old_threshold} → {new_failure_threshold}")

        if abs(new_error_rate_threshold - self.adaptive_error_rate_threshold) >= 0.05:
            old_threshold = self.adaptive_error_rate_threshold
            self.adaptive_error_rate_threshold = new_error_rate_threshold
            threshold_changed = True
            ADAPTIVE_THRESHOLD_ADJUSTMENTS.labels(
                service=self.config.service,
                adjustment_type='error_rate_threshold'
            ).inc()
            self.logger.info(f"Adjusted error rate threshold: {old_threshold:.2f} → {new_error_rate_threshold:.2f}")

        if abs(new_latency_threshold - self.adaptive_latency_threshold) >= 0.5:
            old_threshold = self.adaptive_latency_threshold
            self.adaptive_latency_threshold = new_latency_threshold
            threshold_changed = True
            ADAPTIVE_THRESHOLD_ADJUSTMENTS.labels(
                service=self.config.service,
                adjustment_type='latency_threshold'
            ).inc()
            self.logger.info(f"Adjusted latency threshold: {old_threshold:.2f}s → {new_latency_threshold:.2f}s")

        if threshold_changed:
            self.stats.adaptive_adjustments += 1

    async def _update_failure_patterns(self, failure_type: FailureType, duration: float):
        """Update AI failure prediction patterns"""

        # Record failure pattern
        pattern_key = f"{failure_type.value}_{datetime.now().hour}"
        self.failure_patterns[pattern_key].append(duration)

        # Keep only recent patterns (last 100 entries per pattern)
        if len(self.failure_patterns[pattern_key]) > 100:
            self.failure_patterns[pattern_key] = self.failure_patterns[pattern_key][-100:]

        # Update failure probability prediction
        await self._calculate_failure_probability()

    async def _calculate_failure_probability(self):
        """Calculate predicted failure probability using historical patterns"""

        if not self.failure_patterns:
            self.predicted_failure_probability = 0.0
            self.prediction_confidence = 0.0
            return

        current_hour = datetime.now().hour
        current_patterns = []

        # Collect patterns for current time context
        for pattern_key, values in self.failure_patterns.items():
            if f"_{current_hour}" in pattern_key and values:
                current_patterns.extend(values[-10:])  # Recent patterns

        if not current_patterns:
            self.predicted_failure_probability = 0.0
            self.prediction_confidence = 0.0
            return

        # Simple prediction based on pattern frequency and recency
        recent_failure_rate = len(current_patterns) / max(len(self.request_window), 1)
        pattern_consistency = 1.0 - (np.std(current_patterns) / (np.mean(current_patterns) + 0.001))

        # Calculate probability (0-1 scale)
        base_probability = min(recent_failure_rate * 2, 1.0)
        pattern_weight = min(pattern_consistency, 1.0)

        self.predicted_failure_probability = base_probability * pattern_weight
        self.prediction_confidence = min(len(current_patterns) / 50.0, 1.0)

        self.logger.debug(
            f"Failure probability prediction: {self.predicted_failure_probability:.3f} "
            f"(confidence: {self.prediction_confidence:.3f})"
        )

    async def _notify_state_change(
        self,
        from_state: CircuitBreakerState,
        to_state: CircuitBreakerState,
        reason: str
    ):
        """Notify external systems of state changes"""

        try:
            # Prepare notification payload
            notification = {
                'timestamp': datetime.now().isoformat(),
                'circuit_breaker': self.config.name,
                'service': self.config.service,
                'from_state': from_state.value,
                'to_state': to_state.value,
                'reason': reason,
                'stats': asdict(self.stats)
            }

            # Send to Redis pub/sub for real-time notifications
            if self.redis_client:
                await self.redis_client.publish(
                    f"circuit_breaker:state_change:{self.config.service}",
                    json.dumps(notification)
                )

            # Store in database for historical analysis
            if self.db_pool:
                async with self.db_pool.acquire() as conn:
                    await conn.execute("""
                        INSERT INTO circuit_breaker_events (
                            timestamp, circuit_breaker, service, from_state, to_state, reason, stats
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    """,
                    datetime.now(), self.config.name, self.config.service,
                    from_state.value, to_state.value, reason, json.dumps(notification['stats'])
                    )

        except Exception as e:
            self.logger.error(f"Failed to notify state change: {e}")

    async def _persist_state(self):
        """Persist circuit breaker state to Redis"""

        try:
            if not self.redis_client:
                return

            state_data = {
                'state': self.state.value,
                'state_changed_at': self.state_changed_at.isoformat(),
                'failure_count': self.failure_count,
                'success_count': self.success_count,
                'adaptive_failure_threshold': self.adaptive_failure_threshold,
                'adaptive_error_rate_threshold': self.adaptive_error_rate_threshold,
                'adaptive_latency_threshold': self.adaptive_latency_threshold,
                'predicted_failure_probability': self.predicted_failure_probability,
                'stats': asdict(self.stats)
            }

            # Store with expiration (24 hours)
            await self.redis_client.setex(
                f"circuit_breaker:state:{self.config.name}",
                86400,
                json.dumps(state_data, default=str)
            )

        except Exception as e:
            self.logger.error(f"Failed to persist state: {e}")

    async def _load_state_from_redis(self):
        """Load circuit breaker state from Redis"""

        try:
            if not self.redis_client:
                return

            state_json = await self.redis_client.get(f"circuit_breaker:state:{self.config.name}")
            if not state_json:
                return

            state_data = json.loads(state_json)

            # Restore state
            self.state = CircuitBreakerState(state_data['state'])
            self.state_changed_at = datetime.fromisoformat(state_data['state_changed_at'])
            self.failure_count = state_data['failure_count']
            self.success_count = state_data['success_count']
            self.adaptive_failure_threshold = state_data.get('adaptive_failure_threshold', self.config.failure_threshold)
            self.adaptive_error_rate_threshold = state_data.get('adaptive_error_rate_threshold', self.config.error_rate_threshold)
            self.adaptive_latency_threshold = state_data.get('adaptive_latency_threshold', self.config.latency_threshold)
            self.predicted_failure_probability = state_data.get('predicted_failure_probability', 0.0)

            # Restore stats if available
            if 'stats' in state_data:
                stats_data = state_data['stats']
                self.stats.total_requests = stats_data.get('total_requests', 0)
                self.stats.successful_requests = stats_data.get('successful_requests', 0)
                self.stats.failed_requests = stats_data.get('failed_requests', 0)
                self.stats.rejected_requests = stats_data.get('rejected_requests', 0)
                self.stats.state_changes = stats_data.get('state_changes', 0)
                self.stats.adaptive_adjustments = stats_data.get('adaptive_adjustments', 0)

            self.logger.info(f"Loaded circuit breaker state: {self.state.value}")

        except Exception as e:
            self.logger.error(f"Failed to load state from Redis: {e}")

    async def _load_historical_patterns(self):
        """Load historical failure patterns for AI prediction"""

        try:
            if not self.db_pool:
                return

            async with self.db_pool.acquire() as conn:
                # Load recent failure patterns
                patterns = await conn.fetch("""
                    SELECT failure_type, duration, timestamp
                    FROM circuit_breaker_failures
                    WHERE service = $1 AND timestamp > NOW() - INTERVAL '7 days'
                    ORDER BY timestamp DESC
                    LIMIT 1000
                """, self.config.service)

                for pattern in patterns:
                    hour = pattern['timestamp'].hour
                    pattern_key = f"{pattern['failure_type']}_{hour}"
                    self.failure_patterns[pattern_key].append(pattern['duration'])

            self.logger.info(f"Loaded {len(patterns)} historical failure patterns")

        except Exception as e:
            self.logger.error(f"Failed to load historical patterns: {e}")

    async def force_open(self, reason: str = "manual"):
        """Manually force circuit breaker open"""

        previous_state = self.state
        self.state = CircuitBreakerState.FORCED_OPEN
        self.state_changed_at = datetime.now()
        self.stats.state_changes += 1

        await self._notify_state_change(previous_state, self.state, f"force_open: {reason}")
        await self._persist_state()

        self.logger.warning(f"Circuit breaker {self.config.name} manually forced open: {reason}")

    async def force_close(self, reason: str = "manual"):
        """Manually force circuit breaker closed"""

        previous_state = self.state
        self.state = CircuitBreakerState.CLOSED
        self.state_changed_at = datetime.now()
        self.failure_count = 0
        self.success_count = 0
        self.stats.state_changes += 1

        await self._notify_state_change(previous_state, self.state, f"force_close: {reason}")
        await self._persist_state()

        self.logger.info(f"Circuit breaker {self.config.name} manually forced closed: {reason}")

    def get_status(self) -> Dict[str, Any]:
        """Get current circuit breaker status and metrics"""

        return {
            'name': self.config.name,
            'service': self.config.service,
            'state': self.state.value,
            'state_changed_at': self.state_changed_at.isoformat(),
            'failure_count': self.failure_count,
            'success_count': self.success_count,
            'adaptive_thresholds': {
                'failure_threshold': self.adaptive_failure_threshold,
                'error_rate_threshold': self.adaptive_error_rate_threshold,
                'latency_threshold': self.adaptive_latency_threshold
            },
            'ai_prediction': {
                'failure_probability': self.predicted_failure_probability,
                'confidence': self.prediction_confidence
            },
            'stats': asdict(self.stats),
            'request_window_size': len(self.request_window),
            'school_metrics_count': len(self.school_metrics)
        }

class CircuitBreakerOpenException(Exception):
    """Exception raised when circuit breaker is open"""
    pass

class CircuitBreakerManager:
    """
    Manager for multiple circuit breakers with centralized coordination
    """

    def __init__(self):
        self.circuit_breakers: Dict[str, IntelligentCircuitBreaker] = {}
        self.logger = logging.getLogger("circuit_breaker_manager")

    async def create_circuit_breaker(
        self,
        config: CircuitBreakerConfig,
        redis_url: str,
        db_url: str
    ) -> IntelligentCircuitBreaker:
        """Create and initialize a new circuit breaker"""

        circuit_breaker = IntelligentCircuitBreaker(config)
        await circuit_breaker.initialize(redis_url, db_url)

        self.circuit_breakers[config.name] = circuit_breaker

        self.logger.info(f"Created circuit breaker: {config.name}")

        return circuit_breaker

    def get_circuit_breaker(self, name: str) -> Optional[IntelligentCircuitBreaker]:
        """Get circuit breaker by name"""
        return self.circuit_breakers.get(name)

    async def get_system_status(self) -> Dict[str, Any]:
        """Get status of all circuit breakers"""

        status = {
            'timestamp': datetime.now().isoformat(),
            'total_circuit_breakers': len(self.circuit_breakers),
            'circuit_breakers': {}
        }

        state_counts = defaultdict(int)

        for name, cb in self.circuit_breakers.items():
            cb_status = cb.get_status()
            status['circuit_breakers'][name] = cb_status
            state_counts[cb_status['state']] += 1

        status['state_summary'] = dict(state_counts)

        return status

    async def health_check_all(self) -> bool:
        """Perform health check on all circuit breakers"""

        healthy = True

        for name, cb in self.circuit_breakers.items():
            if cb.state == CircuitBreakerState.OPEN:
                self.logger.warning(f"Circuit breaker {name} is open")
                healthy = False

        return healthy

async def main():
    """Example usage of the intelligent circuit breaker system"""

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Start Prometheus metrics server
    start_http_server(8082)

    # Create circuit breaker manager
    manager = CircuitBreakerManager()

    # Configuration for different services
    configs = [
        CircuitBreakerConfig(
            name="auth_service_cb",
            service="authentication",
            failure_threshold=5,
            recovery_timeout=60,
            error_rate_threshold=0.1,
            latency_threshold=2.0,
            adaptive_thresholds=True,
            ai_prediction=True
        ),
        CircuitBreakerConfig(
            name="kitchen_service_cb",
            service="kitchen-management",
            failure_threshold=8,
            recovery_timeout=90,
            error_rate_threshold=0.15,
            latency_threshold=5.0,
            school_specific=True
        ),
        CircuitBreakerConfig(
            name="vendor_service_cb",
            service="vendor-marketplace",
            failure_threshold=10,
            recovery_timeout=120,
            error_rate_threshold=0.2,
            latency_threshold=10.0,
            adaptive_thresholds=True
        )
    ]

    # Create circuit breakers
    redis_url = "redis://hasivu-redis:6379"
    db_url = "postgresql://hasivu:password@hasivu-postgresql:5432/hasivu_monitoring"

    circuit_breakers = []
    for config in configs:
        cb = await manager.create_circuit_breaker(config, redis_url, db_url)
        circuit_breakers.append(cb)

    logger = logging.getLogger(__name__)
    logger.info("Circuit breaker system initialized successfully")

    # Example of using circuit breakers
    async def example_service_call():
        """Example service call that might fail"""
        # Simulate random failures
        if random.random() < 0.1:  # 10% failure rate
            raise Exception("Service temporarily unavailable")

        # Simulate random latency
        await asyncio.sleep(random.uniform(0.1, 2.0))

        return {"status": "success", "data": "response"}

    # Simulation loop
    try:
        while True:
            # Test all circuit breakers
            for cb in circuit_breakers:
                try:
                    result = await cb.call(example_service_call)
                    logger.debug(f"Service call succeeded through {cb.config.name}")
                except CircuitBreakerOpenException as e:
                    logger.warning(f"Request rejected by {cb.config.name}: {e}")
                except Exception as e:
                    logger.error(f"Service call failed through {cb.config.name}: {e}")

            # Print system status periodically
            system_status = await manager.get_system_status()
            logger.info(f"System status: {system_status['state_summary']}")

            await asyncio.sleep(5)

    except KeyboardInterrupt:
        logger.info("Shutting down circuit breaker system...")

if __name__ == "__main__":
    asyncio.run(main())