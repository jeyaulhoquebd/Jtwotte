import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={`bg-white/5 animate-pulse rounded ${className}`} />
  );
}

export function TweetSkeleton() {
  return (
    <div className="p-4 border-b border-white/5 space-y-4">
      <div className="flex gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-16 h-4 opacity-50" />
          </div>
          <Skeleton className="w-full h-20 rounded-2xl" />
          <div className="flex gap-8">
            <Skeleton className="w-8 h-4" />
            <Skeleton className="w-8 h-4" />
            <Skeleton className="w-8 h-4" />
            <Skeleton className="w-8 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="p-4 border-b border-white/5 flex gap-4 items-center">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="w-3/4 h-3" />
        <Skeleton className="w-1/4 h-2 opacity-50" />
      </div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="p-4 flex gap-4 items-center border-b border-white/5">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="w-1/3 h-4" />
          <Skeleton className="w-10 h-3" />
        </div>
        <Skeleton className="w-1/2 h-3 opacity-50" />
      </div>
    </div>
  );
}
