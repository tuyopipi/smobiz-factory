import { AccessTokenProvider, MetadataAccessTokenProvider } from "../config/secrets.js";
import { nowIso } from "../utils/env.js";

export interface DocumentStore<T extends { id: string }> {
  get(collection: string, id: string): Promise<T | undefined>;
  save(collection: string, document: T): Promise<T>;
  list(collection: string): Promise<T[]>;
  query(collection: string, field: keyof T & string, value: unknown): Promise<T[]>;
}

export class InMemoryDocumentStore<T extends { id: string }> implements DocumentStore<T> {
  private readonly data = new Map<string, Map<string, T>>();

  async get(collection: string, id: string): Promise<T | undefined> {
    return this.data.get(collection)?.get(id);
  }

  async save(collection: string, document: T): Promise<T> {
    if (!this.data.has(collection)) {
      this.data.set(collection, new Map());
    }
    this.data.get(collection)!.set(document.id, structuredClone(document));
    return document;
  }

  async list(collection: string): Promise<T[]> {
    return [...(this.data.get(collection)?.values() ?? [])].map((value) => structuredClone(value));
  }

  async query(collection: string, field: keyof T & string, value: unknown): Promise<T[]> {
    const docs = await this.list(collection);
    return docs.filter((doc) => Object.is(doc[field], value));
  }
}

export class FirestoreRestStore<T extends { id: string }> implements DocumentStore<T> {
  constructor(
    private readonly projectId: string,
    private readonly database = "(default)",
    private readonly tokenProvider: AccessTokenProvider = new MetadataAccessTokenProvider()
  ) {}

  async get(collection: string, id: string): Promise<T | undefined> {
    const response = await this.request(`${this.baseUrl()}/documents/${collection}/${id}`);
    if (response.status === 404) return undefined;
    if (!response.ok) throw new Error(`Firestore get failed: ${response.status}`);
    return this.decodeDocument(await response.json());
  }

  async save(collection: string, document: T): Promise<T> {
    const existing = await this.get(collection, document.id);
    const url = existing
      ? `${this.baseUrl()}/documents/${collection}/${document.id}`
      : `${this.baseUrl()}/documents/${collection}?documentId=${encodeURIComponent(document.id)}`;
    const response = await this.request(url, {
      method: existing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: this.encodeFields({ ...document, updatedAt: nowIso() }) })
    });
    if (!response.ok) {
      throw new Error(`Firestore save failed: ${response.status}`);
    }
    return this.decodeDocument(await response.json());
  }

  async list(collection: string): Promise<T[]> {
    const response = await this.request(`${this.baseUrl()}/documents/${collection}`);
    if (!response.ok) throw new Error(`Firestore list failed: ${response.status}`);
    const body = (await response.json()) as { documents?: unknown[] };
    return (body.documents ?? []).map((doc) => this.decodeDocument(doc));
  }

  async query(collection: string, field: keyof T & string, value: unknown): Promise<T[]> {
    const docs = await this.list(collection);
    return docs.filter((doc) => JSON.stringify(doc[field]) === JSON.stringify(value));
  }

  private baseUrl(): string {
    return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/${this.database}`;
  }

  private async request(url: string, init: RequestInit = {}): Promise<Response> {
    const token = await this.tokenProvider.getAccessToken();
    return fetch(url, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`
      }
    });
  }

  private encodeFields(value: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(value).map(([key, fieldValue]) => [key, this.encodeValue(fieldValue)]));
  }

  private encodeValue(value: unknown): Record<string, unknown> {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === "string") return { stringValue: value };
    if (typeof value === "boolean") return { booleanValue: value };
    if (typeof value === "number" && Number.isInteger(value)) return { integerValue: String(value) };
    if (typeof value === "number") return { doubleValue: value };
    if (Array.isArray(value)) return { arrayValue: { values: value.map((item) => this.encodeValue(item)) } };
    if (typeof value === "object") return { mapValue: { fields: this.encodeFields(value as Record<string, unknown>) } };
    return { stringValue: String(value) };
  }

  private decodeDocument(raw: unknown): T {
    const doc = raw as { name?: string; fields?: Record<string, unknown> };
    const id = doc.name?.split("/").pop() ?? "";
    return { id, ...this.decodeFields(doc.fields ?? {}) } as T;
  }

  private decodeFields(fields: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, this.decodeValue(value as Record<string, unknown>)]));
  }

  private decodeValue(value: Record<string, unknown>): unknown {
    if ("stringValue" in value) return value.stringValue;
    if ("booleanValue" in value) return value.booleanValue;
    if ("integerValue" in value) return Number(value.integerValue);
    if ("doubleValue" in value) return value.doubleValue;
    if ("nullValue" in value) return null;
    if ("arrayValue" in value) {
      const values = (value.arrayValue as { values?: unknown[] }).values ?? [];
      return values.map((item) => this.decodeValue(item as Record<string, unknown>));
    }
    if ("mapValue" in value) {
      return this.decodeFields((value.mapValue as { fields?: Record<string, unknown> }).fields ?? {});
    }
    return undefined;
  }
}
