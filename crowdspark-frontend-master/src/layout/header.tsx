import { MenuProps, Dropdown, Button, message, Badge, Avatar, Space, Tooltip } from "antd";
import { Link } from "react-router-dom";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import usersStore, { UsersStoreProps } from "../store/users-store";
import { 
  CircleUserRound, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  DollarSign, 
  BarChart3, 
  Users, 
  Megaphone,
  Home,
  Plus
} from "lucide-react";

function Header() {
  const { currentUser, clearUser } = usersStore() as UsersStoreProps;
  const navigate = useNavigate();
  
  const onLogout = () => {
    Cookies.remove("token");
    clearUser();
    message.success("Logged out successfully");
    navigate("/login");
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      label: (
        <Link to="/user/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} />
          Profile
        </Link>
      ),
    },
    {
      key: "donations",
      label: (
        <Link to="/user/donations" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={16} />
          My Donations
        </Link>
      ),
    },
    {
      key: "reports",
      label: (
        <Link to="/user/reports" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={16} />
          Reports
        </Link>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: "logout",
      label: (
        <span 
          onClick={onLogout} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#ef4444'
          }}
        >
          <LogOut size={16} />
          Logout
        </span>
      ),
    },
  ];

  const adminMenuItems: MenuProps["items"] = [
    {
      key: "donations",
      label: (
        <Link to="/admin/donations" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={16} />
          Donations
        </Link>
      ),
    },
    {
      key: "campaigns",
      label: (
        <Link to="/admin/campaigns" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Megaphone size={16} />
          Campaigns
        </Link>
      ),
    },
    {
      key: "users",
      label: (
        <Link to="/admin/users" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={16} />
          Users
        </Link>
      ),
    },
    {
      key: "reports",
      label: (
        <Link to="/admin/reports" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart3 size={16} />
          Reports
        </Link>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: "logout",
      label: (
        <span 
          onClick={onLogout} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#ef4444'
          }}
        >
          <LogOut size={16} />
          Logout
        </span>
      ),
    },
  ];

  const menuItemsToUse: any[] = currentUser?.isAdmin
    ? adminMenuItems
    : userMenuItems;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Logo Section */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer'
          }}
          onClick={() => navigate("/")}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
          }}>
            <span style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              color: 'white'
            }}>
              ⚡
            </span>
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            letterSpacing: '-0.5px'
          }}>
            CrowdSpark
          </h1>
        </div>

        {/* Navigation Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Home Button */}
          <Tooltip title="Home">
            <Button
              type="text"
              icon={<Home size={18} />}
              onClick={() => navigate("/")}
              style={{
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                height: '40px',
                width: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                background: 'rgba(255, 255, 255, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            />
          </Tooltip>

          {/* Create Campaign Button - Only for admins */}
          {currentUser?.isAdmin && (
            <Tooltip title="Create Campaign">
              <Button
                type="primary"
                icon={<Plus size={18} />}
                onClick={() => navigate("/admin/campaigns/create")}
                style={{
                  borderRadius: '8px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.3)';
                }}
              >
                Create
              </Button>
            </Tooltip>
          )}

          {/* Notifications */}
          <Tooltip title="Notifications">
            <Badge count={0} size="small">
              <Button
                type="text"
                icon={<Bell size={18} />}
                style={{
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  height: '40px',
                  width: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  background: 'rgba(255, 255, 255, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              />
            </Badge>
          </Tooltip>

          {/* User Profile Dropdown */}
          <Dropdown 
            menu={{ items: menuItemsToUse }} 
            placement="bottomRight"
            trigger={['click']}
            dropdownRender={(menu) => (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                overflow: 'hidden'
              }}>
                {/* User Info Header */}
                <div style={{
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar 
                      size={40}
                      style={{
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                    <div>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: '#1f2937',
                        fontSize: '14px'
                      }}>
                        {currentUser?.name || 'User'}
                      </div>
                      <div style={{ 
                        color: '#6b7280', 
                        fontSize: '12px',
                        marginTop: '2px'
                      }}>
                        {currentUser?.isAdmin ? 'Administrator' : 'User'}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Menu Items */}
                <div style={{ padding: '8px 0' }}>
                  {menu}
                </div>
              </div>
            )}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <Avatar 
                size={32}
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <div style={{ 
                color: 'white', 
                fontWeight: '500',
                fontSize: '14px'
              }}>
                {currentUser?.name || 'User'}
              </div>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: currentUser?.isAdmin ? '#10b981' : '#f59e0b',
                marginLeft: '4px'
              }} />
            </div>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}

export default Header;