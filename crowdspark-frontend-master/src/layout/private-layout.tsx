import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./header";
import axios from "axios";
import usersStore, { UsersStoreProps } from "../store/users-store";
import { message, Spin } from "antd";

function PrivateLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { setCurrentUser, currentUser }: UsersStoreProps =
    usersStore() as UsersStoreProps;
  const pathname = window.location.pathname;
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/users/current-user");
      setCurrentUser(response.data.user);
    } catch (error: any) {
      message.error(error.response.data.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Cookies.get("token")) {
      navigate("/login");
    }

    if (!currentUser) {
      getData();
    }
  }, []);

  if(loading)
  {
    return <div className="flex justify-center items-center h-96">
       <Spin  />
    </div>
  }

  if (!currentUser) return null;

  if (!currentUser.isAdmin && pathname.includes("/admin")) {
    return (
      <div>
        <Header />
        <div className="p-5 text-sm">
          You are not authorized to view this page
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="p-5">{children}</div>
    </div>
  );
}

export default PrivateLayout;
