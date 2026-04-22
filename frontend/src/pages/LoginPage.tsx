import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export function LoginPage() {
  const { isAuthenticated, login, signup, isBootstrapping } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup({ email, password, displayName });
      }
      navigate("/today");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication request failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isBootstrapping) {
    return <main className="centered-card">Restoring session...</main>;
  }

  if (isAuthenticated) {
    return <Navigate to="/today" replace />;
  }

  return (
    <main className="centered-card">
      <h1>{mode === "login" ? "Login" : "Sign Up"}</h1>
      <p>Connect this client to backend auth endpoints for session access.</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />

        {mode === "signup" ? (
          <>
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
              required
            />
          </>
        ) : null}

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={8}
          required
        />

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        className="link-button"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        disabled={isSubmitting}
      >
        {mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}
      </button>
    </main>
  );
}

