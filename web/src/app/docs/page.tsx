'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, RefreshCw } from 'lucide-react';

// Dynamically import Swagger UI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-2 text-gray-600">Loading API Documentation...</span>
    </div>
  ),
});

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact?: {
      name: string;
      email: string;
    };
    license?: {
      name: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  security: Array<{
    bearerAuth: string[];
  }>;
  paths: Record<string, any>;
  components: {
    securitySchemes: Record<string, any>;
  };
  tags?: Array<{
    name: string;
    description: string;
  }>;
}

export default function DocsPage() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSpec();
  }, []);

  const loadSpec = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load the OpenAPI spec
      const response = await fetch('/openapi.json');
      if (!response.ok) {
        throw new Error('Failed to load API specification');
      }

      const data = await response.json();
      setSpec(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API specification');
    } finally {
      setLoading(false);
    }
  };

  const downloadSpec = () => {
    if (!spec) return;

    const dataStr = JSON.stringify(spec, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = 'hasivu-api-spec.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Loading API Documentation...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Error Loading Documentation</CardTitle>
              <CardDescription>
                Failed to load the API specification. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadSpec} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HASIVU Platform API</h1>
              <p className="text-gray-600 mt-2">
                Comprehensive API documentation for the HASIVU school meal ordering and management
                platform
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                OpenAPI 3.0.3
              </Badge>
              <Button onClick={downloadSpec} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download JSON
              </Button>
              <Button
                onClick={() => window.open('/api/docs', '_blank')}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Raw JSON
              </Button>
            </div>
          </div>

          {/* API Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {spec?.paths ? Object.keys(spec.paths).length : 0}
                </div>
                <p className="text-sm text-gray-600">API Endpoints</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {spec?.tags ? spec.tags.length : 0}
                </div>
                <p className="text-sm text-gray-600">API Categories</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent class="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {spec?.servers ? spec.servers.length : 0}
                </div>
                <p className="text-sm text-gray-600">Server Environments</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">Bearer</div>
                <p className="text-sm text-gray-600">Authentication</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Swagger UI */}
        <Card className="shadow-lg">
          <CardContent className="p-0">
            {spec && (
              <SwaggerUI
                spec={spec}
                tryItOutEnabled={true}
                requestInterceptor={req => {
                  // Add authorization header if token exists
                  const token = localStorage.getItem('auth-token');
                  if (token) {
                    req.headers.Authorization = `Bearer ${token}`;
                  }
                  return req;
                }}
                responseInterceptor={res => {
                  // Log responses for debugging
                  return res;
                }}
                docExpansion="list"
                defaultModelsExpandDepth={1}
                defaultModelExpandDepth={1}
                displayRequestDuration={true}
                filter={true}
                showExtensions={true}
                showCommonExtensions={true}
                presets={[SwaggerUI.presets.apis]}
                layout="StandaloneLayout"
              />
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">
            For support or questions about the API, please contact{' '}
            <a href="mailto:support@hasivu.com" className="text-blue-600 hover:text-blue-800">
              support@hasivu.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
