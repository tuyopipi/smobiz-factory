export const SECRET_NAMES = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CHROME_CLIENT_ID",
  "CHROME_CLIENT_SECRET",
  "CHROME_REFRESH_TOKEN",
  "CHROME_PUBLISHER_ID"
] as const;

export type SecretName = (typeof SECRET_NAMES)[number];

export interface SecretProvider {
  get(name: SecretName): Promise<string>;
}

export interface AccessTokenProvider {
  getAccessToken(): Promise<string>;
}

export class MetadataAccessTokenProvider implements AccessTokenProvider {
  async getAccessToken(): Promise<string> {
    const response = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
      { headers: { "Metadata-Flavor": "Google" } }
    );
    if (!response.ok) {
      throw new Error(`Failed to read metadata access token: ${response.status}`);
    }
    const body = (await response.json()) as { access_token?: string };
    if (!body.access_token) {
      throw new Error("Metadata token response did not include access_token");
    }
    return body.access_token;
  }
}

export class SecretManagerProvider implements SecretProvider {
  constructor(
    private readonly projectId: string,
    private readonly tokenProvider: AccessTokenProvider = new MetadataAccessTokenProvider()
  ) {}

  async get(name: SecretName): Promise<string> {
    const token = await this.tokenProvider.getAccessToken();
    const url = `https://secretmanager.googleapis.com/v1/projects/${this.projectId}/secrets/${name}/versions/latest:access`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error(`Secret Manager read failed for ${name}: ${response.status}`);
    }
    const body = (await response.json()) as { payload?: { data?: string } };
    if (!body.payload?.data) {
      throw new Error(`Secret Manager payload missing for ${name}`);
    }
    return Buffer.from(body.payload.data, "base64").toString("utf8");
  }
}

export class StaticSecretProvider implements SecretProvider {
  constructor(private readonly values: Partial<Record<SecretName, string>>) {}

  async get(name: SecretName): Promise<string> {
    const value = this.values[name];
    if (!value) {
      throw new Error(`Missing static secret: ${name}`);
    }
    return value;
  }
}
