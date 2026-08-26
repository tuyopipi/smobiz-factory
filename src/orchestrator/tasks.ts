import { AccessTokenProvider, MetadataAccessTokenProvider } from "../config/secrets.js";

export interface TaskQueue {
  enqueue(url: string, payload: Record<string, unknown>, scheduleTime?: string): Promise<string>;
}

export class CloudTasksQueue implements TaskQueue {
  constructor(
    private readonly projectId: string,
    private readonly location: string,
    private readonly queue: string,
    private readonly serviceAccountEmail: string,
    private readonly tokenProvider: AccessTokenProvider = new MetadataAccessTokenProvider()
  ) {}

  async enqueue(url: string, payload: Record<string, unknown>, scheduleTime?: string): Promise<string> {
    const token = await this.tokenProvider.getAccessToken();
    const endpoint = `https://cloudtasks.googleapis.com/v2/projects/${this.projectId}/locations/${this.location}/queues/${this.queue}/tasks`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        task: {
          scheduleTime,
          httpRequest: {
            httpMethod: "POST",
            url,
            oidcToken: { serviceAccountEmail: this.serviceAccountEmail },
            headers: { "Content-Type": "application/json" },
            body: Buffer.from(JSON.stringify(payload)).toString("base64")
          }
        }
      })
    });
    if (!response.ok) throw new Error(`Cloud Tasks enqueue failed: ${response.status}`);
    const body = (await response.json()) as { name?: string };
    return body.name ?? "";
  }
}
