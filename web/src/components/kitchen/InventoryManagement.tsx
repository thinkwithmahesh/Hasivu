'use client';

import React, { useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Filter,
  Plus,
  Edit,
  Download,
  Upload,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// API hooks
import {
  useInventoryItems,
  usePurchaseOrders,
  useInventorySuppliers,
  useInventoryMetrics,
  useInventoryMutations,
} from '@/hooks/useApiIntegration';

// TypeScript interfaces for Inventory Management
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  costPerUnit: number;
  totalValue: number;
  supplier: Supplier;
  lastUpdated: string;
  expiryDate?: string;
  location: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired' | 'ordered';
  usageRate: number; // items per day
  daysUntilEmpty: number;
  reorderPoint: number;
  lastOrderDate?: string;
  image?: string;
}

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  rating: number;
  reliability: number;
  averageDeliveryTime: number; // in days
  totalOrders: number;
  avatar?: string;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: Supplier;
  items: PurchaseOrderItem[];
  status: 'draft' | 'sent' | 'confirmed' | 'delivered' | 'cancelled';
  orderDate: string;
  expectedDelivery: string;
  actualDelivery?: string;
  totalAmount: number;
  notes?: string;
  createdBy: string;
}

interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface InventoryMetrics {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  expiringSoonItems: number;
  outOfStockItems: number;
  averageStockLevel: number;
  monthlyConsumption: number;
  costSavings: number;
}

// Utility functions
const getStockStatusColor = (status: InventoryItem['status']) => {
  switch (status) {
    case 'in_stock':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'low_stock':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'out_of_stock':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'expired':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'ordered':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getOrderStatusColor = (status: PurchaseOrder['status']) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'sent':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'delivered':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getDaysUntilExpiry = (expiryDate: string) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Inventory Item Card Component
const InventoryItemCard = ({
  item,
  onReorder,
}: {
  item: InventoryItem;
  onReorder: (item: InventoryItem) => void;
}) => {
  const stockPercentage = (item.currentStock / item.maxStock) * 100;
  const isExpiringSoon = item.expiryDate && getDaysUntilExpiry(item.expiryDate) <= 3;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {item.image && (
              <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{item.name}</h3>
              <p className="text-sm text-gray-600">
                {item.category} • {item.subcategory}
              </p>
              <p className="text-xs text-gray-500">{item.sku}</p>
            </div>
          </div>
          <Badge className={`${getStockStatusColor(item.status)} border`}>
            {item.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Stock Level */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Stock Level</span>
            <span
              className={`font-semibold ${
                item.status === 'low_stock'
                  ? 'text-orange-600'
                  : item.status === 'out_of_stock'
                    ? 'text-red-600'
                    : 'text-gray-900'
              }`}
            >
              {item.currentStock} {item.unit}
            </span>
          </div>
          <Progress value={stockPercentage} className="h-3" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Min: {item.minStock}</span>
            <span>Max: {item.maxStock}</span>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="space-y-2 mb-4">
          {item.status === 'low_stock' && (
            <div className="flex items-center p-2 bg-yellow-50 border border-yellow-200 rounded">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
              <span className="text-xs text-yellow-800">Low stock - reorder needed</span>
            </div>
          )}

          {item.status === 'out_of_stock' && (
            <div className="flex items-center p-2 bg-red-50 border border-red-200 rounded">
              <XCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-xs text-red-800">Out of stock</span>
            </div>
          )}

          {isExpiringSoon && (
            <div className="flex items-center p-2 bg-orange-50 border border-orange-200 rounded">
              <Clock className="w-4 h-4 text-orange-600 mr-2" />
              <span className="text-xs text-orange-800">
                Expires in {getDaysUntilExpiry(item.expiryDate!)} days
              </span>
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <p className="text-gray-600">Unit Price</p>
            <p className="font-semibold">Rs.{item.costPerUnit}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Value</p>
            <p className="font-semibold">Rs.{item.totalValue}</p>
          </div>
          <div>
            <p className="text-gray-600">Usage Rate</p>
            <p className="font-semibold">
              {item.usageRate}/{item.unit}/day
            </p>
          </div>
          <div>
            <p className="text-gray-600">Days Left</p>
            <p
              className={`font-semibold ${
                item.daysUntilEmpty <= 3 ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              {item.daysUntilEmpty} days
            </p>
          </div>
        </div>

        {/* Supplier Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center space-x-2">
            <Avatar className="w-5 h-5">
              <AvatarImage src={item.supplier.avatar} alt={item.supplier.name} />
              <AvatarFallback className="text-xs">
                {item.supplier.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <span>{item.supplier.name}</span>
          </div>
          <span>{item.location}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          {(item.status === 'low_stock' || item.status === 'out_of_stock') && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onReorder(item)}
              data-testid={`reorder-button-${item.id}`}
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              Reorder
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Purchase Order Card Component
const PurchaseOrderCard = ({
  order,
  onMarkDelivered,
}: {
  order: PurchaseOrder;
  onMarkDelivered: (order: PurchaseOrder) => void;
}) => {
  const expectedDelivery = new Date(order.expectedDelivery);
  const daysPending = Math.ceil(
    (expectedDelivery.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">{order.orderNumber}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Avatar className="w-6 h-6">
                <AvatarImage src={order.supplier.avatar} alt={order.supplier.name} />
                <AvatarFallback className="text-xs">
                  {order.supplier.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-gray-600">{order.supplier.name}</p>
            </div>
          </div>
          <Badge className={`${getOrderStatusColor(order.status)} border`}>
            {order.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Order Items */}
        <div className="space-y-2 mb-4">
          {order.items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
            >
              <span>
                {item.quantity} x {item.itemName}
              </span>
              <span className="font-semibold">Rs.{item.totalPrice}</span>
            </div>
          ))}
        </div>

        {/* Delivery Information */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <p className="text-gray-600">Order Date</p>
            <p className="font-semibold">{new Date(order.orderDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-600">Expected Delivery</p>
            <p className={`font-semibold ${daysPending < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {expectedDelivery.toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Total Amount</p>
            <p className="font-semibold text-lg">Rs.{order.totalAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-600">Created By</p>
            <p className="font-semibold">{order.createdBy}</p>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> {order.notes}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Eye className="w-3 h-3 mr-1" />
            View Details
          </Button>
          {order.status === 'sent' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMarkDelivered(order)}
              data-testid={`mark-delivered-button-${order.id}`}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Mark Delivered
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Supplier Card Component
const SupplierCard = ({ supplier }: { supplier: Supplier }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={supplier.avatar} alt={supplier.name} />
            <AvatarFallback>
              {supplier.name
                .split(' ')
                .map(n => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
            <p className="text-sm text-gray-600">{supplier.contact}</p>
            <p className="text-xs text-gray-500">{supplier.email}</p>
          </div>
        </div>

        {/* Supplier Metrics */}
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Rating</span>
              <div className="flex items-center space-x-1">
                <span className="font-semibold">{supplier.rating}</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full mr-1 ${
                        i < Math.floor(supplier.rating) ? 'bg-yellow-400' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Reliability</span>
              <span className="font-semibold">{supplier.reliability}%</span>
            </div>
            <Progress value={supplier.reliability} className="h-2" />
          </div>
        </div>

        {/* Supplier Stats */}
        <div className="grid grid-cols-2 gap-3 text-center mb-4">
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-gray-900">{supplier.averageDeliveryTime}</div>
            <div className="text-xs text-gray-600">Avg Delivery (days)</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-gray-900">{supplier.totalOrders}</div>
            <div className="text-xs text-gray-600">Total Orders</div>
          </div>
        </div>

        <Button size="sm" className="w-full">
          <ShoppingCart className="w-3 h-3 mr-1" />
          Create Order
        </Button>
      </CardContent>
    </Card>
  );
};

// Main Inventory Management Component
export const InventoryManagement: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const [reorderOpen, setReorderOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [reorderQty, setReorderQty] = useState<number>(0);

  const { toast } = useToast();

  // Live data from backend
  const {
    data: inventoryData,
    loading: _itemsLoading,
    error: _itemsError,
    refetch: refetchItems,
  } = useInventoryItems();
  const {
    data: suppliersData,
    loading: _suppliersLoading,
    error: _suppliersError,
  } = useInventorySuppliers();
  const {
    data: purchaseOrdersData,
    loading: _poLoading,
    error: _poError,
    refetch: refetchPO,
  } = usePurchaseOrders();
  const {
    data: metricsData,
    loading: _metricsLoading,
    error: _metricsError,
  } = useInventoryMetrics();
  const {
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    updateStock,
    loading: invMutLoading,
  } = useInventoryMutations();

  const inventory: any[] = inventoryData || [];
  const suppliers: any[] = suppliersData || [];
  const purchaseOrders: any[] = purchaseOrdersData || [];
  const metrics: InventoryMetrics =
    metricsData ||
    ({
      totalItems: inventory.length,
      totalValue: inventory.reduce((sum, it: any) => sum + (it.totalValue || 0), 0),
      lowStockItems: inventory.filter((it: any) => it.status === 'low_stock').length,
      expiringSoonItems: 0,
      outOfStockItems: inventory.filter((it: any) => it.status === 'out_of_stock').length,
      averageStockLevel: 0,
      monthlyConsumption: 0,
      costSavings: 0,
    } as any);

  // Filter inventory items
  const filteredInventory = useMemo(() => {
    return inventory.filter((item: any) => {
      const matchesSearch =
        (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === 'all' || (item.category || '').toLowerCase() === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchTerm, filterCategory]);

  // Handlers for actions
  const openReorder = (item: InventoryItem) => {
    setSelectedItem(item);
    const suggested = Math.max(item.reorderPoint || item.minStock || 1, 1);
    setReorderQty(suggested);
    setReorderOpen(true);
  };

  const submitReorder = async () => {
    try {
      if (!selectedItem || reorderQty <= 0) return;
      await createPurchaseOrder({
        supplierId: selectedItem.supplier?.id,
        items: [
          { itemId: selectedItem.id, quantity: reorderQty, unitPrice: selectedItem.costPerUnit },
        ],
      });
      toast({ title: 'Reorder Created', description: `${selectedItem.name} x ${reorderQty}` });
      setReorderOpen(false);
      setSelectedItem(null);
      await Promise.all([refetchItems(), refetchPO?.()]);
      setSelectedTab('orders');
    } catch (e) {
      toast({ title: 'Reorder Failed', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const markDelivered = async (order: PurchaseOrder) => {
    try {
      await updatePurchaseOrderStatus(order.id, 'delivered');
      // Optionally adjust stock for each order item
      for (const oi of order.items) {
        await updateStock(oi.itemId, oi.quantity, 'add');
      }
      toast({ title: 'Order Marked Delivered', description: order.orderNumber });
      await Promise.all([refetchItems(), refetchPO?.()]);
    } catch (e) {
      toast({
        title: 'Update Failed',
        description: 'Could not mark as delivered.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="inventory-header">
              Inventory Management
            </h1>
            <p className="text-gray-600">
              Track stock levels, manage suppliers, and automate reorders
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{metrics.totalItems ?? '-'}</p>
                  <p className="text-gray-600">Total Items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">
                    Rs.{(metrics.totalValue ?? 0).toLocaleString()}
                  </p>
                  <p className="text-gray-600">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{metrics.lowStockItems ?? 0}</p>
                  <p className="text-gray-600">Low Stock Items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">
                    Rs.{(metrics.costSavings ?? 0).toLocaleString()}
                  </p>
                  <p className="text-gray-600">Monthly Savings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search items by name, category, or SKU..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                className="px-3 py-2 border border-gray-200 rounded-md"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="grains">Grains</option>
                <option value="protein">Protein</option>
                <option value="vegetables">Vegetables</option>
                <option value="oils">Oils</option>
              </select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>

            {(itemsError || metricsError) && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800">
                Failed to load inventory data.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInventory.map((item: any) => (
                <div data-testid="inventory-item" key={item.id}>
                  <InventoryItemCard item={item as any} onReorder={openReorder} />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Purchase Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {poError && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800">
                Failed to load purchase orders.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(purchaseOrders || []).map((order: any) => (
                <PurchaseOrderCard
                  key={order.id}
                  order={order as any}
                  onMarkDelivered={markDelivered}
                />
              ))}
            </div>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            {suppliersError && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800">
                Failed to load suppliers.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(suppliers || []).map((supplier: any) => (
                <SupplierCard key={supplier.id} supplier={supplier as any} />
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Consumption</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    Rs.{(metrics.monthlyConsumption ?? 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">+8.5% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Stock Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {metrics.averageStockLevel ?? 0}%
                  </div>
                  <Progress value={metrics.averageStockLevel ?? 0} className="mb-2" />
                  <p className="text-sm text-gray-600">Optimal stock maintenance</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reorder Dialog */}
      <Dialog open={reorderOpen} onOpenChange={setReorderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>Reorder stock for {selectedItem?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Item</Label>
              <div className="text-sm font-medium">{selectedItem?.name}</div>
              <div className="text-xs text-gray-500">SKU: {selectedItem?.sku}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder-qty">Quantity</Label>
              <Input
                id="reorder-qty"
                type="number"
                min={1}
                value={reorderQty}
                onChange={e => setReorderQty(parseInt(e.target.value || '0', 10))}
                data-testid="reorder-qty-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReorderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitReorder} disabled={invMutLoading} data-testid="reorder-submit">
              {invMutLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Order'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagement;
