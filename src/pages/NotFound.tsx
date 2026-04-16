import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f5f5f5"
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ marginBottom: "16px", fontSize: "32px", fontWeight: "bold" }}>404</h1>
        <p style={{ marginBottom: "16px", fontSize: "20px", color: "#666" }}>Oops! Page not found</p>
        <a
          href="/"
          style={{
            color: "#0066cc",
            textDecoration: "underline",
            cursor: "pointer"
          }}
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
