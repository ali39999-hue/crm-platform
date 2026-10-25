'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { SearchResultDto, SearchResultItem } from '@crm/contracts';
import { apiClient } from '../lib/api-client';

export type CommandPaletteTab =
  'overview' | 'my-work' | 'crm' | 'support' | 'notifications' | 'reports' | 'automation' | 'audit';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: (() => void) | undefined;
  onNavigateTab: (tab: CommandPaletteTab) => void;
  onOpenCreateTask?: (() => void) | undefined;
  onOpenCreateLead?: (() => void) | undefined;
  onSelectResult?: ((item: SearchResultItem) => void) | undefined;
}

interface CommandItem {
  id: string;
  category: 'ACTION' | 'NAV' | 'TASK' | 'ACCOUNT' | 'CONTACT' | 'LEAD' | 'TICKET';
  categoryLabel: string;
  title: string;
  subtitle?: string | null | undefined;
  badge?: string | null | undefined;
  statusBadge?: string | null | undefined;
  onSelect: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpen,
  onNavigateTab,
  onOpenCreateTask,
  onOpenCreateLead,
  onSelectResult,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultDto | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Focus input and lock body scroll when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults(null);
      setSearchError(null);
      setSelectedIndex(0);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Live debounced search (300ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setIsSearching(false);
      setSearchError(null);
      setSelectedIndex(0);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.search({ q: trimmed });
        setResults(res);
        setSelectedIndex(0);
      } catch (err: any) {
        setSearchError(err.message || 'خطا در برقراری ارتباط با جستجو');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Default quick actions & navigation items
  const defaultItems = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      // Quick Actions
      {
        id: 'action-create-task',
        category: 'ACTION',
        categoryLabel: 'عملیات سریع',
        title: 'ایجاد وظیفه جدید',
        subtitle: 'باز کردن پنجره ثبت تسک جدید با اولویت و مهلت انجام',
        badge: 'اکشن',
        onSelect: () => {
          onClose();
          onOpenCreateTask?.();
        },
      },
      {
        id: 'action-create-lead',
        category: 'ACTION',
        categoryLabel: 'عملیات سریع',
        title: 'ثبت سرنخ جدید',
        subtitle: 'انتقال به مدیریت مشتریان برای ایجاد فرصت و سرنخ جدید',
        badge: 'اکشن',
        onSelect: () => {
          onClose();
          onOpenCreateLead?.();
        },
      },

      // Quick Navigation
      {
        id: 'nav-my-work',
        category: 'NAV',
        categoryLabel: 'دسترسی سریع به بخش‌ها',
        title: 'رفتن به کارهای من',
        subtitle: 'مشاهده وظایف، کانبان بورد، فهرست و تقویم کاری',
        badge: 'بخش',
        onSelect: () => {
          onClose();
          onNavigateTab('my-work');
        },
      },
      {
        id: 'nav-crm',
        category: 'NAV',
        categoryLabel: 'دسترسی سریع به بخش‌ها',
        title: 'رفتن به مشتریان',
        subtitle: 'حساب‌های تجاری، سرنخ‌ها، مخاطبین و فرصت‌های فروش',
        badge: 'بخش',
        onSelect: () => {
          onClose();
          onNavigateTab('crm');
        },
      },
      {
        id: 'nav-support',
        category: 'NAV',
        categoryLabel: 'دسترسی سریع به بخش‌ها',
        title: 'رفتن به تیکت‌ها',
        subtitle: 'میز پشتیبانی، درخواست‌های مشتریان و گفتگوها',
        badge: 'بخش',
        onSelect: () => {
          onClose();
          onNavigateTab('support');
        },
      },
      {
        id: 'nav-reports',
        category: 'NAV',
        categoryLabel: 'دسترسی سریع به بخش‌ها',
        title: 'رفتن به گزارش‌ها',
        subtitle: 'داشبورد سلامت، حجم کاری، نرخ تبدیل و شاخص‌های SLA',
        badge: 'بخش',
        onSelect: () => {
          onClose();
          onNavigateTab('reports');
        },
      },
      {
        id: 'nav-automation',
        category: 'NAV',
        categoryLabel: 'دسترسی سریع به بخش‌ها',
        title: 'رفتن به اتوماسیون',
        subtitle: 'قوانین خودکارسازی، شروط و اقدامات سیستم',
        badge: 'بخش',
        onSelect: () => {
          onClose();
          onNavigateTab('automation');
        },
      },
      {
        id: 'nav-portal',
        category: 'NAV',
        categoryLabel: 'دسترسی سریع به بخش‌ها',
        title: 'رفتن به پورتال مشتریان',
        subtitle: 'مشاهده نمای کاربری و ثبت درخواست‌های سلف‌سرویس مشتری',
        badge: 'پورتال',
        onSelect: () => {
          onClose();
          window.location.href = '/portal';
        },
      },
    ];
    return list;
  }, [onClose, onNavigateTab, onOpenCreateLead, onOpenCreateTask]);

  // Convert search results into grouped items
  const resultItems = useMemo<CommandItem[]>(() => {
    if (!results || !results.items) return [];

    const categoryNames: Record<string, string> = {
      TASK: 'وظایف (Tasks)',
      ACCOUNT: 'حساب‌های مشتریان (Accounts)',
      CONTACT: 'مخاطبین (Contacts)',
      LEAD: 'سرنخ‌های فروش (Leads)',
      TICKET: 'تیکت‌های پشتیبانی (Tickets)',
    };

    const typeBadges: Record<string, string> = {
      TASK: 'وظیفه',
      ACCOUNT: 'حساب',
      CONTACT: 'مخاطب',
      LEAD: 'سرنخ',
      TICKET: 'تیکت',
    };

    return results.items.map((item) => ({
      id: `res-${item.entityType}-${item.id}`,
      category: item.entityType,
      categoryLabel: categoryNames[item.entityType] || item.entityType,
      title: item.title,
      subtitle: item.subtitle,
      badge: typeBadges[item.entityType] || item.entityType,
      statusBadge: item.status || null,
      onSelect: () => {
        onClose();
        if (onSelectResult) {
          onSelectResult(item);
        } else {
          if (item.entityType === 'TASK') onNavigateTab('my-work');
          else if (item.entityType === 'ACCOUNT') onNavigateTab('crm');
          else if (item.entityType === 'CONTACT') onNavigateTab('crm');
          else if (item.entityType === 'LEAD') onNavigateTab('crm');
          else if (item.entityType === 'TICKET') onNavigateTab('support');
        }
      },
    }));
  }, [results, onClose, onSelectResult, onNavigateTab]);

  const flatItems = query.trim() ? resultItems : defaultItems;

  // Group items by category for visual sections
  const groupedSections = useMemo(() => {
    const groups: Array<{
      label: string;
      items: Array<{ item: CommandItem; globalIndex: number }>;
    }> = [];
    const map = new Map<string, Array<{ item: CommandItem; globalIndex: number }>>();

    flatItems.forEach((item, globalIndex) => {
      const cat = item.categoryLabel;
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push({ item, globalIndex });
    });

    map.forEach((items, label) => {
      groups.push({ label, items });
    });

    return groups;
  }, [flatItems]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (flatItems.length > 0 ? (prev + 1) % flatItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        flatItems.length > 0 ? (prev - 1 + flatItems.length) % flatItems.length : 0,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="command-palette-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="پالت دستورات و جستجوی سراسری"
      data-testid="command-palette-modal"
    >
      <div className="command-palette-panel" onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className="command-palette-header">
          <svg
            className="command-search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="جستجو در وظایف، مشتریان، تیکت‌ها و دستورات..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-autocomplete="list"
            aria-controls="command-palette-results"
            data-testid="command-palette-input"
          />

          {isSearching && <div className="command-spinner" title="در حال جستجو..." />}

          {query && !isSearching && (
            <button
              type="button"
              className="command-clear-btn"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="پاک کردن متن جستجو"
            >
              ×
            </button>
          )}

          <kbd className="command-kbd-esc" onClick={onClose} title="بستن (Esc)">
            Esc
          </kbd>
        </div>

        {/* Results / Navigation Body */}
        <div
          ref={listRef}
          id="command-palette-results"
          className="command-palette-body"
          role="listbox"
          data-testid="command-palette-results"
        >
          {searchError && (
            <div className="command-empty-state" style={{ color: 'var(--danger)' }}>
              {searchError}
            </div>
          )}

          {!searchError && isSearching && flatItems.length === 0 && (
            <div className="command-empty-state">در حال جستجو در داده‌های سازمانی...</div>
          )}

          {!searchError && !isSearching && query.trim() && flatItems.length === 0 && (
            <div className="command-empty-state">
              <p style={{ margin: 0, fontWeight: 700 }}>نتیجه‌ای برای «{query}» یافت نشد</p>
              <small style={{ color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                می‌توانید عنوان وظیفه، شناسه (مانند TSK-1001)، نام شرکت، مخاطب یا شماره تیکت را وارد
                کنید.
              </small>
            </div>
          )}

          {!searchError &&
            groupedSections.map((group) => (
              <div key={group.label} className="command-group">
                <div className="command-group-header">{group.label}</div>
                <div className="command-group-items">
                  {group.items.map(({ item, globalIndex }) => {
                    const isSelected = selectedIndex === globalIndex;
                    return (
                      <div
                        key={item.id}
                        role="option"
                        aria-selected={isSelected}
                        className={`command-item ${isSelected ? 'active' : ''}`}
                        onClick={item.onSelect}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        data-testid="command-item"
                        data-category={item.category}
                      >
                        <div className="command-item-main">
                          <div className="command-item-title-row">
                            <span className="command-item-title" data-testid="command-item-title">
                              {item.title}
                            </span>
                            {item.statusBadge && (
                              <span className="command-status-pill">{item.statusBadge}</span>
                            )}
                          </div>
                          {item.subtitle && (
                            <div className="command-item-subtitle">{item.subtitle}</div>
                          )}
                        </div>

                        {item.badge && <span className="command-badge">{item.badge}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        {/* Footer shortcuts hint */}
        <footer className="command-palette-footer">
          <div className="command-footer-hints">
            <span>
              <kbd className="command-footer-kbd">↑</kbd>
              <kbd className="command-footer-kbd">↓</kbd>
              پیمایش
            </span>
            <span>
              <kbd className="command-footer-kbd">↵</kbd>
              انتخاب
            </span>
            <span>
              <kbd className="command-footer-kbd">Esc</kbd>
              بستن
            </span>
            <span>
              <kbd className="command-footer-kbd">Ctrl+K</kbd>
              میانبر
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default CommandPalette;
