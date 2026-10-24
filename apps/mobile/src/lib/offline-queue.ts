import { ApiClient, apiClient as defaultApiClient } from './api-client';

export interface QueuedMutation {
  id: string; // UUID / unique id
  type: 'CREATE_TASK' | 'TRANSITION_TASK' | 'CREATE_TICKET' | 'ADD_MESSAGE';
  payload: any;
  createdAt: string;
  attempts: number;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  error?: string;
}

export interface SyncMutationResult {
  id: string;
  type: QueuedMutation['type'];
  success: boolean;
  error?: string;
  data?: unknown;
}

export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  results: SyncMutationResult[];
}

export interface QueueStorageAbstraction {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

const GLOBAL_QUEUE_STORE_KEY = '__CRM_OFFLINE_MUTATION_STORAGE__';

/**
 * In-memory storage implementation with JSON serialization.
 * Stored on globalThis to survive fast-refresh and mock app restarts.
 */
export class JsonMemoryStorage implements QueueStorageAbstraction {
  private map: Map<string, string>;

  constructor() {
    const globalObj = globalThis as unknown as {
      [GLOBAL_QUEUE_STORE_KEY]?: Map<string, string>;
    };

    if (!globalObj[GLOBAL_QUEUE_STORE_KEY]) {
      globalObj[GLOBAL_QUEUE_STORE_KEY] = new Map<string, string>();
    }
    this.map = globalObj[GLOBAL_QUEUE_STORE_KEY];
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

export class OfflineMutationQueue {
  private queue: QueuedMutation[] = [];
  private storage: QueueStorageAbstraction;
  private readonly storageKey: string;
  private listeners: Set<(queue: QueuedMutation[]) => void> = new Set();
  private isSyncing = false;

  constructor(
    storage: QueueStorageAbstraction = new JsonMemoryStorage(),
    storageKey: string = '@crm/offline_mutations',
  ) {
    this.storage = storage;
    this.storageKey = storageKey;
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (typeof raw === 'string' && raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.queue = parsed;
        }
      }
    } catch {
      this.queue = [];
    }
  }

  private persist(): void {
    try {
      const serialized = JSON.stringify(this.queue);
      this.storage.setItem(this.storageKey, serialized);
    } catch {
      // Ignore storage write issues
    }
    this.notify();
  }

  private notify(): void {
    const snapshot = [...this.queue];
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        // Safe dispatch
      }
    }
  }

  /**
   * Subscribe to queue changes
   */
  public subscribe(listener: (queue: QueuedMutation[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.queue]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Enqueue a new mutation
   */
  public enqueue(
    mutation: Omit<QueuedMutation, 'id' | 'createdAt' | 'attempts' | 'status'> &
      Partial<Pick<QueuedMutation, 'id' | 'createdAt' | 'attempts' | 'status'>>,
  ): QueuedMutation {
    const uniqueId =
      mutation.id ||
      `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const queuedItem: QueuedMutation = {
      id: uniqueId,
      type: mutation.type,
      payload: mutation.payload,
      createdAt: mutation.createdAt || new Date().toISOString(),
      attempts: mutation.attempts ?? 0,
      status: mutation.status ?? 'PENDING',
      error: mutation.error,
    };

    this.queue.push(queuedItem);
    this.persist();
    return queuedItem;
  }

  /**
   * Returns all pending items
   */
  public getQueue(): QueuedMutation[] {
    return [...this.queue];
  }

  /**
   * Returns count of mutations awaiting sync or failed
   */
  public getPendingCount(): number {
    return this.queue.filter((m) => m.status === 'PENDING' || m.status === 'FAILED')
      .length;
  }

  /**
   * Removes a specific mutation by ID
   */
  public remove(id: string): void {
    this.queue = this.queue.filter((m) => m.id !== id);
    this.persist();
  }

  /**
   * Clears all items in the queue
   */
  public clear(): void {
    this.queue = [];
    try {
      this.storage.removeItem(this.storageKey);
    } catch {
      // Ignore
    }
    this.notify();
  }

  /**
   * Exports queue contents as a serialized JSON string
   */
  public exportToJson(): string {
    return JSON.stringify(this.queue, null, 2);
  }

  /**
   * Imports and restores queue from a JSON string
   */
  public importFromJson(jsonString: string): void {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        this.queue = parsed;
        this.persist();
      }
    } catch (err) {
      throw new Error(`Failed to parse queue JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }

  /**
   * Iterates and executes pending mutations sequentially, reporting successes and failures.
   */
  public async syncQueue(client: ApiClient = defaultApiClient): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        total: 0,
        synced: 0,
        failed: 0,
        results: [],
      };
    }

    this.isSyncing = true;
    const initialItemsToSync = this.queue.filter(
      (m) => m.status === 'PENDING' || m.status === 'FAILED',
    );

    const syncReport: SyncResult = {
      total: initialItemsToSync.length,
      synced: 0,
      failed: 0,
      results: [],
    };

    try {
      for (const mutation of initialItemsToSync) {
        mutation.status = 'SYNCING';
        mutation.attempts += 1;
        this.persist();

        try {
          let responseData: unknown = null;

          switch (mutation.type) {
            case 'CREATE_TASK': {
              responseData = await client.createTask({
                title: mutation.payload.title,
                description: mutation.payload.description,
                priority: mutation.payload.priority,
                visibility: mutation.payload.visibility,
                projectId: mutation.payload.projectId,
                assigneeId: mutation.payload.assigneeId,
                dueAt: mutation.payload.dueAt,
              });
              break;
            }

            case 'TRANSITION_TASK': {
              responseData = await client.transitionTask(mutation.payload.id, {
                targetStatus: mutation.payload.targetStatus,
                expectedVersion: mutation.payload.expectedVersion,
                reason: mutation.payload.reason,
              });
              break;
            }

            case 'CREATE_TICKET': {
              responseData = await client.createTicket({
                title: mutation.payload.title,
                description: mutation.payload.description,
                priority: mutation.payload.priority,
                accountId: mutation.payload.accountId,
                assigneeId: mutation.payload.assigneeId,
              });
              break;
            }

            case 'ADD_MESSAGE': {
              responseData = await client.addTicketMessage(mutation.payload.ticketId, {
                body: mutation.payload.body,
                visibility: mutation.payload.visibility,
              });
              break;
            }

            default:
              throw new Error(`نوع جهش ناشناخته: ${(mutation as QueuedMutation).type}`);
          }

          // Successfully executed: remove from pending queue
          this.queue = this.queue.filter((m) => m.id !== mutation.id);
          this.persist();

          syncReport.synced += 1;
          syncReport.results.push({
            id: mutation.id,
            type: mutation.type,
            success: true,
            data: responseData,
          });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'خطای ناشناخته در همگام‌سازی';

          mutation.status = 'FAILED';
          mutation.error = errorMessage;
          this.persist();

          syncReport.failed += 1;
          syncReport.results.push({
            id: mutation.id,
            type: mutation.type,
            success: false,
            error: errorMessage,
          });
        }
      }
    } finally {
      this.isSyncing = false;
      this.notify();
    }

    return syncReport;
  }
}

export const offlineQueue = new OfflineMutationQueue();
