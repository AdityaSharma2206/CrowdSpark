import Cookies from "js-cookie";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
function PublicLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  useEffect(() => {
    if (Cookies.get("token")) {
      navigate("/");
    }
  }, []);
  return <div>{children}</div>;
}

export default PublicLayout;
