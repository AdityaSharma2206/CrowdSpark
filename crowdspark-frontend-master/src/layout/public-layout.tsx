import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
function PublicLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  useEffect(() => {
    // The auth cookie is HttpOnly, so we ask the server whether there is a
    // valid session. If so, redirect away from public (login/register) pages.
    const checkAuth = async () => {
      try {
        await axios.get("/api/users/current-user");
        navigate("/");
      } catch {
        // Not logged in — stay on the public page.
      }
    };
    checkAuth();
  }, []);
  return <div>{children}</div>;
}

export default PublicLayout;
