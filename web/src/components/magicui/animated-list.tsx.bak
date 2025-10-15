"use client";

import React, { ReactElement, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface AnimatedListProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

export const AnimatedList = React.memo<AnimatedListProps>(
  ({ className, children, delay = 1000 }) => {
    const [messages, setMessages] = React.useState<ReactElement[]>([]);

    const childrenArray = React.Children.toArray(children);

    React.useEffect(() => {
      const interval = setInterval(() => {
        setMessages((prev) => {
          const newMessages = [...prev];
          if (newMessages.length < childrenArray.length) {
            newMessages.push(childrenArray[newMessages.length] as ReactElement);
          }
          return newMessages;
        });
      }, delay);

      return () => clearInterval(interval);
    }, [childrenArray, delay]);

    return (
      <div className={className}>
        <AnimatePresence>
          {messages.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {item}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }
);

AnimatedList.displayName = "AnimatedList";
