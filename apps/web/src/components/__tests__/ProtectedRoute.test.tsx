import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../ProtectedRoute";
import { useAuth } from "../../lib/auth";

vi.mock("../../lib/auth", () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route path="/login" element={<p>Login-Seite</p>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <p>Geschützter Inhalt</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("shows a loading indicator while the auth state is still resolving", () => {
    mockedUseAuth.mockReturnValue({ user: null, isLoading: true } as ReturnType<typeof useAuth>);
    renderProtected();
    expect(screen.getByText("Lädt…")).toBeInTheDocument();
    expect(screen.queryByText("Geschützter Inhalt")).not.toBeInTheDocument();
  });

  it("redirects to /login when there is no authenticated user", () => {
    mockedUseAuth.mockReturnValue({ user: null, isLoading: false } as ReturnType<typeof useAuth>);
    renderProtected();
    expect(screen.getByText("Login-Seite")).toBeInTheDocument();
    expect(screen.queryByText("Geschützter Inhalt")).not.toBeInTheDocument();
  });

  it("renders the protected children once a user is present", () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "u1", email: "admin@hgi-immobilien.de", name: "Admin", role: "ADMIN" },
      isLoading: false,
    } as ReturnType<typeof useAuth>);
    renderProtected();
    expect(screen.getByText("Geschützter Inhalt")).toBeInTheDocument();
  });
});
