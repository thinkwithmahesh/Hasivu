/**
 * Completion & Celebration Step - Epic 2 Story 2
 *
 * Celebrates successful onboarding completion with:
 * - Success celebration with confetti animation
 * - Setup summary and achievements
 * - Next steps and quick start guide
 * - Dashboard access and navigation
 * - Support resources and training materials
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  CheckCircle,
  Sparkles,
  Download,
  ArrowRight,
  Phone,
  BookOpen,
  Heart,
  Zap,
  Award,
  Target,
  Users,
  Shield,
  Radio,
  Settings,
  Home,
  PlayCircle,
  MessageCircle,
  Headphones,
  Video,
  ChefHat,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CompletionStepProps {
  onComplete: () => void;
  onboardingData?: {
    schoolInfo?: {
      name: string;
      studentCount: number;
    };
    completedSteps?: string[];
    startedAt?: Date;
    completedAt?: Date;
  };
}

const CompletionStep: React.FC<CompletionStepProps> = ({ onComplete, onboardingData }) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [achievements, setAchievements] = useState<
    Array<{
      title: string;
      description: string;
      icon: React.ReactNode;
      completed: boolean;
    }>
  >([]);

  // Calculate setup metrics
  const setupTime =
    onboardingData?.startedAt && onboardingData?.completedAt
      ? Math.round(
          (onboardingData.completedAt.getTime() - onboardingData.startedAt.getTime()) / (1000 * 60)
        )
      : 45; // Default to 45 minutes

  const completedStepsCount = onboardingData?.completedSteps?.length || 8;
  const totalSteps = 10;
  const completionRate = Math.round((completedStepsCount / totalSteps) * 100);

  // Quick start slides
  const quickStartSlides = [
    {
      title: 'Access Your Dashboard',
      description: 'Your personalized admin dashboard is ready with real-time insights',
      action: 'Launch Dashboard',
      icon: <Home className="w-8 h-8" />,
      color: 'blue',
    },
    {
      title: 'Add Your First Menu',
      description: "Create and publish your school's daily meal menu",
      action: 'Create Menu',
      icon: <ChefHat className="w-8 h-8" />,
      color: 'green',
    },
    {
      title: 'Distribute RFID Cards',
      description: 'Start distributing RFID cards to students for contactless meals',
      action: 'Card Management',
      icon: <Radio className="w-8 h-8" />,
      color: 'purple',
    },
    {
      title: 'Go Live!',
      description: 'Activate your meal service and start serving students',
      action: 'Activate Service',
      icon: <PlayCircle className="w-8 h-8" />,
      color: 'orange',
    },
  ];

  // Support resources
  const supportResources = [
    {
      title: 'Video Training Series',
      description: 'Complete video guides for administrators and staff',
      icon: <Video className="w-5 h-5" />,
      action: 'Watch Videos',
      type: 'video',
    },
    {
      title: 'Setup Documentation',
      description: 'Detailed guides and best practices',
      icon: <BookOpen className="w-5 h-5" />,
      action: 'Read Docs',
      type: 'docs',
    },
    {
      title: '24/7 Support Chat',
      description: 'Instant help from our expert team',
      icon: <MessageCircle className="w-5 h-5" />,
      action: 'Start Chat',
      type: 'chat',
    },
    {
      title: 'Phone Support',
      description: 'Direct line to technical specialists',
      icon: <Phone className="w-5 h-5" />,
      action: 'Call Now',
      type: 'phone',
    },
  ];

  // Initialize achievements
  useEffect(() => {
    const calculatedAchievements = [
      {
        title: 'Setup Speed Champion',
        description: `Completed setup in just ${setupTime} minutes!`,
        icon: <Zap className="w-6 h-6 text-yellow-600" />,
        completed: setupTime < 60,
      },
      {
        title: 'Configuration Master',
        description: `Configured ${completedStepsCount} out of ${totalSteps} setup steps`,
        icon: <Settings className="w-6 h-6 text-blue-600" />,
        completed: completionRate >= 80,
      },
      {
        title: 'Security Expert',
        description: 'Enabled advanced security features',
        icon: <Shield className="w-6 h-6 text-green-600" />,
        completed: true,
      },
      {
        title: 'Innovation Leader',
        description: 'Adopted cutting-edge RFID technology',
        icon: <Radio className="w-6 h-6 text-purple-600" />,
        completed: true,
      },
      {
        title: 'Student Champion',
        description: `Ready to serve ${onboardingData?.schoolInfo?.studentCount || 0} students`,
        icon: <Users className="w-6 h-6 text-indigo-600" />,
        completed: true,
      },
    ];

    setAchievements(calculatedAchievements);

    // Hide confetti after 3 seconds
    setTimeout(() => setShowConfetti(false), 3000);
  }, [setupTime, completedStepsCount, completionRate, onboardingData]);

  // Confetti animation component
  const ConfettiAnimation = () => (
    <div className="fixed inset-0 pointer-events-none z-10">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][
              i % 6
            ],
            left: `${Math.random() * 100}%`,
            top: '-10px',
          }}
          animate={{
            y: window.innerHeight + 100,
            rotate: 360,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 2,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 max-w-6xl mx-auto relative"
    >
      {/* Confetti Animation */}
      <AnimatePresence>{showConfetti && <ConfettiAnimation />}</AnimatePresence>

      {/* Success Header */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center space-y-6"
      >
        <div className="relative mx-auto w-32 h-32">
          <motion.div
            className="w-32 h-32 bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Trophy className="w-16 h-16 text-white" />
          </motion.div>
          <motion.div
            className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-yellow-800" />
          </motion.div>
        </div>

        <div className="space-y-4">
          <motion.h1
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            🎉 Congratulations!
          </motion.h1>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-2"
          >
            <h2 className="text-2xl font-semibold text-gray-900">
              {onboardingData?.schoolInfo?.name || 'Your School'} is Ready to Go!
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              You've successfully set up HASIVU's AI-powered meal delivery system. Your students
              will now enjoy faster, safer, and more nutritious meals!
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Setup Statistics */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Setup Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{setupTime} min</div>
            <div className="text-sm text-gray-600 font-medium">Setup Time</div>
            <div className="text-xs text-gray-500">Target: &lt;120 min</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{completionRate}%</div>
            <div className="text-sm text-gray-600 font-medium">Completion Rate</div>
            <div className="text-xs text-gray-500">
              {completedStepsCount}/{totalSteps} steps
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {onboardingData?.schoolInfo?.studentCount || 0}
            </div>
            <div className="text-sm text-gray-600 font-medium">Students Ready</div>
            <div className="text-xs text-gray-500">For meal service</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">0</div>
            <div className="text-sm text-gray-600 font-medium">Issues Found</div>
            <div className="text-xs text-gray-500">Perfect setup!</div>
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Award className="w-6 h-6 text-yellow-600" />
          <h3 className="text-xl font-semibold text-gray-900">Achievements Unlocked</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.2 + index * 0.1 }}
              className={`p-4 rounded-xl border-2 ${
                achievement.completed
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              } transition-all duration-300`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    achievement.completed ? 'bg-green-100' : 'bg-gray-100'
                  }`}
                >
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{achievement.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
                  {achievement.completed && (
                    <div className="flex items-center space-x-1 mt-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-700">Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Start Guide */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Quick Start Guide</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <span className="text-sm text-gray-500">
              {currentSlide + 1} / {quickStartSlides.length}
            </span>
            <button
              onClick={() =>
                setCurrentSlide(Math.min(quickStartSlides.length - 1, currentSlide + 1))
              }
              disabled={currentSlide === quickStartSlides.length - 1}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={`bg-gradient-to-r from-${quickStartSlides[currentSlide].color}-50 to-${quickStartSlides[currentSlide].color}-100 rounded-xl p-6 border border-${quickStartSlides[currentSlide].color}-200`}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div
                className={`p-3 bg-${quickStartSlides[currentSlide].color}-500 text-white rounded-xl`}
              >
                {quickStartSlides[currentSlide].icon}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  {quickStartSlides[currentSlide].title}
                </h4>
                <p className="text-gray-600">{quickStartSlides[currentSlide].description}</p>
              </div>
            </div>
            <button
              className={`w-full py-3 px-6 bg-${quickStartSlides[currentSlide].color}-600 text-white rounded-lg hover:bg-${quickStartSlides[currentSlide].color}-700 transition-colors font-medium flex items-center justify-center space-x-2`}
            >
              <span>{quickStartSlides[currentSlide].action}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mt-4">
          {quickStartSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Support Resources */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Headphones className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900">Support & Training</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supportResources.map((resource, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 + index * 0.1 }}
              className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 text-left"
              onClick={() => toast.success(`Opening ${resource.title}...`)}
            >
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">{resource.icon}</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{resource.title}</h4>
                <p className="text-sm text-gray-600">{resource.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
      >
        <motion.button
          onClick={onComplete}
          className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Home className="w-6 h-6" />
          <span>Go to Dashboard</span>
        </motion.button>

        <motion.button
          onClick={() => {
            // Generate and download setup summary
            const summary = {
              school: onboardingData?.schoolInfo?.name,
              completedAt: new Date().toISOString(),
              setupTime: `${setupTime} minutes`,
              completionRate: `${completionRate}%`,
              achievements: achievements.filter(a => a.completed).length,
            };

            const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'hasivu-setup-summary.json';
            a.click();
            URL.revokeObjectURL(url);

            toast.success('Setup summary downloaded!');
          }}
          className="flex items-center space-x-3 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download className="w-6 h-6" />
          <span>Download Summary</span>
        </motion.button>
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0 }}
        className="text-center pt-6 border-t border-gray-200"
      >
        <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
          <Heart className="w-5 h-5" />
          <span className="font-medium">Thank you for choosing HASIVU!</span>
          <Heart className="w-5 h-5" />
        </div>
        <p className="text-sm text-gray-600">
          You're now part of the future of school nutrition. Together, we'll make healthy eating
          accessible, enjoyable, and efficient for every student.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default CompletionStep;
