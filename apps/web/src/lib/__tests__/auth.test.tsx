import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createApiClient } from "@hgi/api-client";
import { AuthProvider, useAuth } from "../auth";

vi.mock("@hgi/api-client", () => ({ createApiClient: vi.fn() }));

const mockedCreateApiClient = vi.mocked(createApiClient);

const adminUser = { id: "u1", email: "admin@hgi-immobilien.de", name: "Admin", role: "ADMIN" as const };

function TestConsumer() {
  const { user, isLoading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user ? user.email : "none"}</span>
      <button onClick={() => void login("admin@hgi-immobilien.de", "secret")}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  mockedCreateApiClient.mockReset();
});

describe("AuthProvider / useAuth", () => {
  it("resolves to no user when there is no stored token", async () => {
    mockedCreateApiClient.mockReturnValue({
      auth: { me: { query: vi.fn() }, login: { mutate: vi.fn() } },
    } as unknown as ReturnType<typeof createApiClient>);

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("user")).toHaveTextContent("none");
  });

  it("loads the current user when a token is already stored", async () => {
    localStorage.setItem("hgi.token", "stored-token");
    mockedCreateApiClient.mockReturnValue({
      auth: { me: { query: vi.fn().mockResolvedValue(adminUser) }, login: { mutate: vi.fn() } },
    } as unknown as ReturnType<typeof createApiClient>);

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent(adminUser.email));
  });

  it("discards an invalid stored token instead of leaving the user stuck loading", async () => {
    localStorage.setItem("hgi.token", "expired-token");
    mockedCreateApiClient.mockReturnValue({
      auth: { me: { query: vi.fn().mockRejectedValue(new Error("UNAUTHORIZED")) }, login: { mutate: vi.fn() } },
    } as unknown as ReturnType<typeof createApiClient>);

    renderAuth();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(localStorage.getItem("hgi.token")).toBeNull();
  });

  it("stores the token and sets the user after a successful login", async () => {
    mockedCreateApiClient.mockReturnValue({
      auth: {
        me: { query: vi.fn().mockResolvedValue(adminUser) },
        login: { mutate: vi.fn().mockResolvedValue({ token: "new-token", user: adminUser }) },
      },
    } as unknown as ReturnType<typeof createApiClient>);

    renderAuth();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    fireEvent.click(screen.getByText("login"));

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent(adminUser.email));
    expect(localStorage.getItem("hgi.token")).toBe("new-token");
  });

  it("clears the token and user on logout", async () => {
    localStorage.setItem("hgi.token", "stored-token");
    mockedCreateApiClient.mockReturnValue({
      auth: { me: { query: vi.fn().mockResolvedValue(adminUser) }, login: { mutate: vi.fn() } },
    } as unknown as ReturnType<typeof createApiClient>);

    renderAuth();
    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent(adminUser.email));

    fireEvent.click(screen.getByText("logout"));

    expect(localStorage.getItem("hgi.token")).toBeNull();
    expect(screen.getByTestId("user")).toHaveTextContent("none");
  });
});
