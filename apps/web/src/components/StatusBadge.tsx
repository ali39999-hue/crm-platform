'use client';

import React from 'react';
import type { TaskPriority, TaskStatus, TicketPriority, TicketStatus } from '@crm/contracts';

export function getTaskStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'TODO':
      return 'در انتظار شروع';
    case 'IN_PROGRESS':
      return 'در حال انجام';
    case 'IN_REVIEW':
      return 'در انتظار بازبینی';
    case 'DONE':
      return 'تکمیل‌شده';
    case 'BACKLOG':
      return 'بک‌لاگ';
    case 'BLOCKED':
      return 'مسدود';
    case 'CANCELED':
      return 'لغوشده';
    default:
      return status;
  }
}

export function getPriorityLabel(priority: TaskPriority | TicketPriority | string): string {
  switch (priority) {
    case 'URGENT':
      return 'خیلی فوری';
    case 'HIGH':
      return 'بالا';
    case 'MEDIUM':
      return 'متوسط';
    case 'NORMAL':
      return 'عادی';
    case 'LOW':
      return 'پایین';
    default:
      return priority;
  }
}

export function getTicketStatusLabel(status: TicketStatus | string): string {
  switch (status) {
    case 'NEW':
      return 'جدید';
    case 'OPEN':
      return 'در حال بررسی';
    case 'PENDING_CUSTOMER':
      return 'در انتظار مشتری';
    case 'PENDING_INTERNAL':
      return 'در انتظار بررسی داخلی';
    case 'RESOLVED':
      return 'حل‌شده';
    case 'CLOSED':
      return 'بسته‌شده';
    default:
      return status;
  }
}

export interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string | undefined;
}

export function TaskStatusBadge({ status, className = '' }: TaskStatusBadgeProps) {
  const badgeClass = `badge badge-${status.toLowerCase()}`;
  return (
    <span className={`${badgeClass} ${className}`.trim()}>
      {getTaskStatusLabel(status)}
    </span>
  );
}

export interface PriorityBadgeProps {
  priority: TaskPriority | TicketPriority | string;
  className?: string | undefined;
  prefix?: string | undefined;
}

export function PriorityBadge({ priority, className = '', prefix }: PriorityBadgeProps) {
  const badgeClass = `priority-badge priority-${priority}`;
  return (
    <span className={`${badgeClass} ${className}`.trim()}>
      {prefix ? `${prefix}: ` : ''}
      {getPriorityLabel(priority)}
    </span>
  );
}

export interface TicketStatusBadgeProps {
  status: TicketStatus | string;
  className?: string | undefined;
}

export function TicketStatusBadge({ status, className = '' }: TicketStatusBadgeProps) {
  let badgeStyle = 'badge-todo';
  if (status === 'OPEN' || status === 'PENDING_INTERNAL') {
    badgeStyle = 'badge-in_progress';
  } else if (status === 'RESOLVED' || status === 'CLOSED') {
    badgeStyle = 'badge-done';
  }

  return (
    <span className={`badge ${badgeStyle} ${className}`.trim()}>
      {getTicketStatusLabel(status)}
    </span>
  );
}
