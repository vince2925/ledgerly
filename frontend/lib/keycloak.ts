export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
}

export interface KeycloakUser {
  sub: string;
  email?: string;
  preferred_username?: string;
  name?: string;
}

class KeycloakService {
  private config: KeycloakConfig;
  private token: string | null = null;
  private user: KeycloakUser | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.NEXT_PUBLIC_KEYCLOAK_ENABLED === "true";
    this.config = {
      url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080",
      realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "ledgerly",
      clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "ledgerly-frontend",
    };

    if (typeof window !== "undefined") {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    this.token = localStorage.getItem("keycloak_token");
    const userStr = localStorage.getItem("keycloak_user");
    if (userStr) {
      this.user = JSON.parse(userStr);
    }
  }

  async login() {
    if (!this.enabled) {
      // Mock login for development
      this.user = {
        sub: "dev-user",
        email: "dev@ledgerly.com",
        preferred_username: "developer",
        name: "Developer",
      };
      this.token = "dev-token";
      localStorage.setItem("keycloak_token", this.token);
      localStorage.setItem("keycloak_user", JSON.stringify(this.user));
      return;
    }

    // In production, redirect to Keycloak login
    const authUrl = `${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/auth`;
    const redirectUri = window.location.origin + "/dashboard";
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid profile email",
    });
    window.location.href = `${authUrl}?${params.toString()}`;
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem("keycloak_token");
    localStorage.removeItem("keycloak_user");

    if (this.enabled) {
      const logoutUrl = `${this.config.url}/realms/${this.config.realm}/protocol/openid-connect/logout`;
      const redirectUri = window.location.origin;
      window.location.href = `${logoutUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;
    } else {
      window.location.href = "/";
    }
  }

  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): KeycloakUser | null {
    return this.user;
  }

  getAuthHeader(): { Authorization: string } | {} {
    if (this.token) {
      return { Authorization: `Bearer ${this.token}` };
    }
    return {};
  }
}

export const keycloak = new KeycloakService();
