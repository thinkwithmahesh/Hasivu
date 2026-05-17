/**
 * Order Confirmation Page
 * Display order success and details after payment completion
 * ITEM 2: Meera celebration choreography with full reduced-motion support
 */

'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { orderAPIService } from '@/services/order-api.service';
import { Order } from '@/types/order';
import { getParentTestOrder } from '@/lib/parent-test-orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Meera } from '@/components/characters/HasivuFriend';
import {
  Check,
  Download,
  Share2,
  Calendar,
  MapPin,
  User,
  Phone,
  ShoppingBag,
  ArrowRight,
  Home,
} from 'lucide-react';

// ─── CONFETTI PARTICLE CONFIG ─────────────────────────────────────────
const CONFETTI_COLORS = [
  'var(--hasivu-primary, #E07020)',
  'var(--hasivu-secondary, #4CAF50)',
  'var(--hasivu-accent, #FFB74D)',
  'var(--hasivu-success, #2E7D32)',
];

function generateConfettiParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    startX: (Math.random() - 0.5) * 60,
    endX: (Math.random() - 0.5) * 160,
    endY: -(120 + Math.random() * 80),
    rotate: (Math.random() - 0.5) * 720,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    isCircle: i % 2 === 0,
    delay: i * 0.04,
  }));
}

// ─── CHECKMARK SVG COMPONENT ──────────────────────────────────────────
function AnimatedCheckmark({ shouldReduce }: { shouldReduce: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="white" strokeWidth={3}>
      {shouldReduce ? (
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <motion.path
          d="M5 13l4 4L19 7"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4, duration: 0.4, ease: 'easeOut' }}
        />
      )}
    </svg>
  );
}

// ─── CONFETTI BURST ───────────────────────────────────────────────────
function ConfettiBurst() {
  const particles = useMemo(() => generateConfettiParticles(16), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2"
          style={{
            width: p.isCircle ? 8 : 6,
            height: p.isCircle ? 8 : 14,
            borderRadius: p.isCircle ? '50%' : 2,
            backgroundColor: p.color,
          }}
          initial={{ x: p.startX, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: p.endX,
            y: p.endY,
            rotate: p.rotate,
            opacity: 0,
          }}
          transition={{
            delay: 0.9 + p.delay,
            duration: 0.9,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

interface OrderConfirmationProps {
  orderId: string;
}

export default function OrderConfirmationClient({ orderId }: OrderConfirmationProps) {
  const shouldReduce = useReducedMotion();
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoading(true);
        const storedOrder = getParentTestOrder(orderId);
        if (storedOrder) {
          setOrder(storedOrder);
          setError(null);
          return;
        }

        const orderData = await orderAPIService.getOrder(orderId);
        setOrder(orderData);
      } catch (err: any) {
        console.error('Error loading order:', err);
        setError(err.message || 'Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  // Focus management: move focus to heading on mount for a11y
  useEffect(() => {
    if (!isLoading && order && headingRef.current) {
      headingRef.current.focus();
    }
  }, [isLoading, order]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  const formatDeliveryDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'full',
    }).format(new Date(dateString));
  };

  const getPaymentStatusBadge = (status: Order['paymentStatus']) => {
    const variants = {
      completed: 'default',
      processing: 'secondary',
      pending: 'outline',
      failed: 'destructive',
      refunded: 'secondary',
    } as const;

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // ─── LOADING STATE ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // ─── ERROR STATE ──────────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Order</CardTitle>
            <CardDescription>{error || 'Order not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/orders')}>View All Orders</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── ANIMATION VARIANTS ───────────────────────────────────────────
  const instant = { duration: 0.001 };

  const fadeUp = shouldReduce
    ? { hidden: { opacity: 1 }, visible: { opacity: 1, transition: instant } }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } },
      };

  const scaleIn = shouldReduce
    ? { hidden: { opacity: 1, scale: 1 }, visible: { opacity: 1, scale: 1, transition: instant } }
    : {
        hidden: { opacity: 0, scale: 0 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { delay: 0.3, type: 'spring', stiffness: 280, damping: 22 },
        },
      };

  const headingSpring = shouldReduce
    ? { hidden: { opacity: 1, scale: 1 }, visible: { opacity: 1, scale: 1, transition: instant } }
    : {
        hidden: { opacity: 0, scale: 0.9 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { delay: 1.1, type: 'spring', stiffness: 300, damping: 25 },
        },
      };

  const staggerContainer = shouldReduce
    ? { hidden: {}, visible: { transition: instant } }
    : {
        hidden: {},
        visible: {
          transition: { delayChildren: 1.2, staggerChildren: 0.08 },
        },
      };

  const staggerItem = shouldReduce
    ? { hidden: { opacity: 1 }, visible: { opacity: 1, transition: instant } }
    : {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
      };

  const buttonFade = shouldReduce
    ? { hidden: { opacity: 1 }, visible: { opacity: 1, transition: instant } }
    : {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { delay: 1.8, duration: 0.3 } },
      };

  // ─── SUCCESS RENDER ───────────────────────────────────────────────
  return (
    <motion.div
      className="container mx-auto px-4 py-8 max-w-sm sm:max-w-lg md:max-w-4xl"
      initial={shouldReduce ? undefined : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={shouldReduce ? instant : { duration: 0.3 }}
    >
      {/* ── Success Header with Meera ─────────────────────────────── */}
      <div className="text-center mb-8 relative" role="status">
        {/* Meera character — top-right of card, decorative */}
        <div className="absolute -top-2 -right-2 sm:right-4" aria-hidden="true">
          {shouldReduce ? (
            <Meera size={80} animation="idle" respectReducedMotion />
          ) : (
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 0.7,
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
            >
              <Meera size={80} animation="celebrate" respectReducedMotion={false} />
            </motion.div>
          )}
        </div>

        {/* Confetti — decorative only */}
        {!shouldReduce && <ConfettiBurst />}

        {/* Green success circle */}
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 bg-hasivu-success rounded-full mb-4 relative"
          variants={scaleIn}
          initial="hidden"
          animate="visible"
        >
          <AnimatedCheckmark shouldReduce={!!shouldReduce} />
        </motion.div>

        {/* Heading */}
        <motion.h1
          ref={headingRef}
          tabIndex={-1}
          className="text-[30px] font-display font-bold text-hasivu-text-primary mb-2 outline-none"
          variants={headingSpring}
          initial="hidden"
          animate="visible"
        >
          Order Confirmed!
        </motion.h1>

        {/* Order ID */}
        <motion.p
          className="font-mono text-[13px] text-hasivu-text-secondary"
          aria-live="polite"
          variants={staggerItem}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          Order #{order.orderNumber}
        </motion.p>
      </div>

      {/* ── Summary Card ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card className="mb-6 rounded-2xl bg-hasivu-bg-warm shadow-warm-sm">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-display text-hasivu-text-primary">
                  Order #{order.orderNumber}
                </CardTitle>
                <CardDescription className="mt-2 text-hasivu-text-secondary">
                  Placed on {formatDate(order.createdAt)}
                </CardDescription>
              </div>
              {getPaymentStatusBadge(order.paymentStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* Student Info */}
              <motion.div className="flex items-start gap-3" variants={staggerItem}>
                <div className="p-2 bg-hasivu-primary/10 rounded-lg">
                  <User className="h-5 w-5 text-hasivu-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-hasivu-text-primary">Student</p>
                  <p className="text-sm text-hasivu-text-secondary">
                    {order.student.firstName} {order.student.lastName}
                  </p>
                  {order.student.grade && order.student.section && (
                    <p className="text-xs text-hasivu-text-secondary/70">
                      Grade {order.student.grade}
                      {order.student.section}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* School Info */}
              <motion.div className="flex items-start gap-3" variants={staggerItem}>
                <div className="p-2 bg-hasivu-primary/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-hasivu-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-hasivu-text-primary">School</p>
                  <p className="text-sm text-hasivu-text-secondary">{order.school.name}</p>
                </div>
              </motion.div>

              {/* Delivery Date */}
              <motion.div className="flex items-start gap-3" variants={staggerItem}>
                <div className="p-2 bg-hasivu-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-hasivu-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-hasivu-text-primary">Delivery Date</p>
                  <p className="text-sm text-hasivu-text-secondary">
                    {formatDeliveryDate(order.deliveryDate)}
                  </p>
                </div>
              </motion.div>

              {/* Contact Phone */}
              {order.contactPhone && (
                <motion.div className="flex items-start gap-3" variants={staggerItem}>
                  <div className="p-2 bg-hasivu-primary/10 rounded-lg">
                    <Phone className="h-5 w-5 text-hasivu-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-hasivu-text-primary">Contact</p>
                    <p className="text-sm text-hasivu-text-secondary">{order.contactPhone}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Delivery Instructions */}
            {order.deliveryInstructions && (
              <div className="mt-6 p-4 bg-hasivu-bg-warm rounded-xl">
                <p className="text-sm font-medium text-hasivu-text-primary mb-1">
                  Delivery Instructions
                </p>
                <p className="text-sm text-hasivu-text-secondary">{order.deliveryInstructions}</p>
              </div>
            )}

            {/* Allergy Info */}
            {order.allergyInfo && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm font-medium text-amber-900 mb-1">Allergy Information</p>
                <p className="text-sm text-amber-800">{order.allergyInfo}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Order Items ───────────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card className="mb-6 rounded-2xl shadow-warm-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-hasivu-text-primary">
              <ShoppingBag className="h-5 w-5" />
              Order Items ({order.orderItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.orderItems.map((item, index) => (
                <div key={item.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-hasivu-text-primary">
                        {item.menuItem?.name || 'Menu Item'}
                      </h4>
                      <p className="text-sm text-hasivu-text-secondary mt-1">
                        Quantity: {item.quantity} × {formatCurrency(item.unitPrice)}
                      </p>
                      {item.specialInstructions && (
                        <p className="text-sm text-hasivu-text-secondary/70 mt-1">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                      <Badge variant="outline" className="mt-2">
                        {item.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-hasivu-text-primary">
                        {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            {/* Payment Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-hasivu-text-secondary">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-hasivu-text-secondary">Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-hasivu-text-secondary">Delivery Fee</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-hasivu-success">Discount</span>
                  <span className="text-hasivu-success">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-hasivu-text-primary">Total Paid</span>
                <span className="text-hasivu-primary">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Action Buttons ────────────────────────────────────────── */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4"
        variants={buttonFade}
        initial="hidden"
        animate="visible"
      >
        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => window.print()}>
          <Download className="h-4 w-4 mr-2" />
          Download Receipt
        </Button>
        <Button
          variant="outline"
          className="flex-1 rounded-xl"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `Order ${order.orderNumber}`,
                text: `Order confirmed for ${order.student.firstName}`,
              });
            }
          }}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Order
        </Button>
      </motion.div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <motion.div
        className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
        variants={buttonFade}
        initial="hidden"
        animate="visible"
      >
        <Button variant="parent" size="lg" className="rounded-xl" asChild>
          <Link href={`/orders/${order.id}/track`}>
            Track Order
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="rounded-xl" asChild>
          <Link href="/orders">View All Orders</Link>
        </Button>
        <Button variant="ghost" size="lg" className="rounded-xl" asChild>
          <Link href="/menu">
            <Home className="h-4 w-4 mr-2" />
            Back to Menu
          </Link>
        </Button>
      </motion.div>

      {/* ── Next Steps Info ───────────────────────────────────────── */}
      <Card className="mt-8 bg-hasivu-primary/5 border-hasivu-primary/20 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-display text-hasivu-text-primary">
            What happens next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {[
              { title: 'Order Confirmation', desc: "You'll receive an email confirmation shortly" },
              {
                title: 'Kitchen Preparation',
                desc: 'Our kitchen will prepare your order with care',
              },
              {
                title: 'Delivery',
                desc: `Meal will be delivered on ${formatDeliveryDate(order.deliveryDate)}`,
              },
              {
                title: 'Track Updates',
                desc: "You'll receive notifications at each step",
              },
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-hasivu-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </div>
                <div>
                  <p className="font-medium text-hasivu-text-primary">{step.title}</p>
                  <p className="text-sm text-hasivu-text-secondary">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </motion.div>
  );
}
