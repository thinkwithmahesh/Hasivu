/**
 * HASIVU Epic 3 → Story 5: AI Insight Card Component
 *
 * Interactive card component for displaying AI-generated insights with:
 * - Priority-based visual styling
 * - Confidence indicators
 * - Action items and recommendations
 * - Expandable details
 * - Natural language explanations
 *
 * @author HASIVU Development Team
 * @version 1.0.0
 * @since 2024-09-18
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { _Alert, _AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  TrendingUp,
  _TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  CornerDownRight,
  ChevronDown,
  ChevronRight,
  Brain,
  Clock,
  CheckCircle2,
  Circle,
  _Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Types
interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'prediction' | 'correlation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  title: string;
  description: string;
  actionItems?: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    completed?: boolean;
    dueDate?: Date;
  }>;
  metadata?: {
    algorithm: string;
    modelVersion: string;
    generatedAt: Date;
    reviewStatus: 'pending' | 'approved' | 'rejected';
  };
}

interface InsightCardProps {
  insight: Insight;
  onActionComplete?: (actionId: string) => void;
  onInsightReview?: (insightId: string, status: 'approved' | 'rejected') => void;
  className?: string;
}

const INSIGHT_ICONS = {
  trend: TrendingUp,
  anomaly: AlertTriangle,
  recommendation: Lightbulb,
  prediction: Target,
  correlation: CornerDownRight,
};

const PRIORITY_COLORS = {
  low: 'bg-blue-50 border-blue-200 text-blue-800',
  medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  high: 'bg-orange-50 border-orange-200 text-orange-800',
  critical: 'bg-red-50 border-red-200 text-red-800',
};

const PRIORITY_BADGES = {
  low: 'default',
  medium: 'secondary',
  high: 'destructive',
  critical: 'destructive',
} as const;

/**
 * AI Insight Card Component
 */
export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onActionComplete,
  onInsightReview,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState(false);

  const IconComponent = INSIGHT_ICONS[insight.type];
  const priorityColor = PRIORITY_COLORS[insight.priority];
  const priorityBadge = PRIORITY_BADGES[insight.priority];

  const handleActionToggle = (actionId: string) => {
    if (onActionComplete) {
      onActionComplete(actionId);
    }
  };

  const handleReview = (status: 'approved' | 'rejected') => {
    if (onInsightReview) {
      onInsightReview(insight.id, status);
    }
  };

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', priorityColor, className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'p-2 rounded-lg',
                insight.priority === 'critical'
                  ? 'bg-red-100'
                  : insight.priority === 'high'
                    ? 'bg-orange-100'
                    : insight.priority === 'medium'
                      ? 'bg-yellow-100'
                      : 'bg-blue-100'
              )}
            >
              <IconComponent
                className={cn(
                  'h-5 w-5',
                  insight.priority === 'critical'
                    ? 'text-red-600'
                    : insight.priority === 'high'
                      ? 'text-orange-600'
                      : insight.priority === 'medium'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                )}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base">{insight.title}</CardTitle>
                <Badge variant={priorityBadge as any} className="text-xs">
                  {insight.priority}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {insight.type}
                </Badge>
              </div>
              <CardDescription className="text-sm">{insight.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {(insight.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI Confidence Level</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Confidence progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Confidence</span>
            <span>{(insight.confidence * 100).toFixed(1)}%</span>
          </div>
          <Progress value={insight.confidence * 100} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Action Items */}
        {insight.actionItems && insight.actionItems.length > 0 && (
          <div className="mb-4">
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-auto text-sm font-medium">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-1" />
                  )}
                  {insight.actionItems.length} Action Item
                  {insight.actionItems.length !== 1 ? 's' : ''}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="space-y-2">
                  {insight.actionItems.map(action => (
                    <div
                      key={action.id}
                      className="flex items-start gap-3 p-3 bg-white/50 rounded-lg border"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 mt-0.5"
                        onClick={() => handleActionToggle(action.id)}
                      >
                        {action.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <h4
                          className={cn(
                            'text-sm font-medium',
                            action.completed && 'line-through text-muted-foreground'
                          )}
                        >
                          {action.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {action.priority} priority
                          </Badge>
                          {action.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(action.dueDate), 'MMM dd')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Metadata and Review */}
        <div className="border-t pt-3">
          <Collapsible open={expandedDetails} onOpenChange={setExpandedDetails}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-xs text-muted-foreground"
              >
                {expandedDetails ? (
                  <ChevronDown className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 mr-1" />
                )}
                Details
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              {insight.metadata && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Algorithm:</span>
                      <span className="ml-2 font-mono">{insight.metadata.algorithm}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Model:</span>
                      <span className="ml-2 font-mono">{insight.metadata.modelVersion}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Generated:</span>
                      <span className="ml-2">
                        {format(new Date(insight.metadata.generatedAt), 'PPp')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant={
                          insight.metadata.reviewStatus === 'approved'
                            ? 'default'
                            : insight.metadata.reviewStatus === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className="ml-2 text-xs"
                      >
                        {insight.metadata.reviewStatus}
                      </Badge>
                    </div>
                  </div>

                  {/* Review Actions */}
                  {insight.metadata.reviewStatus === 'pending' && onInsightReview && (
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview('approved')}
                        className="text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview('rejected')}
                        className="text-xs"
                      >
                        <Circle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightCard;
