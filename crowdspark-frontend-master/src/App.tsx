import "./App.css";
import PrivateLayout from "./layout/private-layout";
import PublicLayout from "./layout/public-layout";
import LoginPage from "./pages/auth/login";
import RegisterPage from "./pages/auth/register";
import CampaignsPage from "./pages/private/admin/campaigns";
import CampaignForm from "./pages/private/admin/campaigns/campaign-form";
import AdminDonationsPage from "./pages/private/admin/donations";
import AdminReportsPage from "./pages/private/admin/reports";
import UsersList from "./pages/private/admin/users";
import CampaignInfoPage from "./pages/private/campaign-info";
import Homepage from "./pages/private/home";
import DonationsPage from "./pages/private/user/donations";
import ProfilePage from "./pages/private/user/profile";
import ReportsPage from "./pages/private/user/reports";
import UserCampaignsPage from "./pages/private/user/campaigns";
import UserCampaignForm from "./pages/private/user/campaigns/campaign-form";

import ThemeProvider from "./providers/theme-provider";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicLayout>
                <LoginPage />
              </PublicLayout>
            }
          />
          <Route
            path="/register"
            element={
              <PublicLayout>
                <RegisterPage />
              </PublicLayout>
            }
          />
          <Route
            path="/"
            element={
              <PrivateLayout>
                <Homepage />
              </PrivateLayout>
            }
          />

          <Route
            path="/campaign/:id"
            element={
              <PrivateLayout>
                <CampaignInfoPage />
              </PrivateLayout>
            }
          />

          <Route
            path="/admin/campaigns"
            element={
              <PrivateLayout>
                <CampaignsPage />
              </PrivateLayout>
            }
          />

          <Route
            path="/admin/campaigns/create"
            element={
              <PrivateLayout>
                <CampaignForm />
              </PrivateLayout>
            }
          />

          <Route
            path="/admin/campaigns/edit/:id"
            element={
              <PrivateLayout>
                <CampaignForm />
              </PrivateLayout>
            }
          />

          <Route
            path="/user/donations"
            element={
              <PrivateLayout>
                <DonationsPage />
              </PrivateLayout>
            }
          />

          <Route
            path="/user/profile"
            element={
              <PrivateLayout>
                <ProfilePage />
              </PrivateLayout>
            }
          />

          <Route
            path="/user/reports"
            element={
              <PrivateLayout>
                <ReportsPage />
              </PrivateLayout>
            }
          />

          <Route
            path="/admin/donations"
            element={
              <PrivateLayout>
                <AdminDonationsPage />
              </PrivateLayout>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <PrivateLayout>
                <AdminReportsPage />
              </PrivateLayout>
            }
          />
          <Route
            path="/user/campaigns"
            element={
              <PrivateLayout>
                <UserCampaignsPage />
              </PrivateLayout>
            }
          />

          <Route
            path="/user/campaigns/create"
            element={
              <PrivateLayout>
                <UserCampaignForm />
              </PrivateLayout>
            }
          />

          <Route
            path="/user/campaigns/edit/:id"
            element={
              <PrivateLayout>
                <UserCampaignForm />
              </PrivateLayout>
            }
          />

          <Route
            path="/admin/users"
            element={
              <PrivateLayout>
                <UsersList />
              </PrivateLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
