// frontend/src/pages/private/admin/users/index.tsx
import { useEffect, useState } from "react";
import PageTitle from "../../../../components/page-title";
import { UserTypeProps } from "../../../../interfaces";
import { 
  message, 
  Table, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Input, 
  Select, 
  DatePicker, 
  Button,
  Tag,
  Avatar,
  Space,
  Tooltip,
  Empty,
  Badge,
  Switch,
  Modal,
  Descriptions,
  Divider,
  Popconfirm,
  Form,
  Drawer
} from "antd";
import { 
  UserOutlined, 
  TeamOutlined, 
  CalendarOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserAddOutlined,
  UsergroupAddOutlined,
  StarOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  SettingOutlined,
  PhoneOutlined,
  GlobalOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  recentUsers: number;
  averageJoinTime: number;
}

interface EnhancedUserProps extends UserTypeProps {
  donationCount?: number;
  totalDonated?: number;
  lastActivity?: string;
  donations?: any[];
}

interface UserDetailsModalProps {
  visible: boolean;
  user: EnhancedUserProps | null;
  onClose: () => void;
  onUserUpdate: (updatedUser: EnhancedUserProps) => void;
}

// User Details Modal Component
const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ 
  visible, 
  user, 
  onClose, 
  onUserUpdate 
}) => {
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user && visible) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      });
    }
  }, [user, visible, form]);

  const handleUpdateUser = async (values: any) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await axios.put(`/api/users/update/${user._id}`, values);
      message.success("User updated successfully");
      onUserUpdate({ ...user, ...values });
      setEditMode(false);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const newStatus = !user.isActive;
      await axios.put(`/api/users/update/${user._id}`, { isActive: newStatus });
      message.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      onUserUpdate({ ...user, isActive: newStatus });
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to update user status");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      await axios.delete(`/api/users/delete/${user._id}`);
      message.success("User deleted successfully");
      onClose();
      // You might want to refresh the user list here
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar size="large" style={{ backgroundColor: user.isActive ? '#10b981' : '#6b7280' }}>
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <div>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
              {user.name || 'Unknown User'}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {user.isActive ? 'Active User' : 'Inactive User'}
            </div>
          </div>
        </div>
      }
      placement="right"
      width={600}
      open={visible}
      onClose={onClose}
      extra={
        <Space>
          <Button 
            icon={<EditOutlined />}
            onClick={() => setEditMode(!editMode)}
            type={editMode ? "default" : "primary"}
          >
            {editMode ? 'Cancel' : 'Edit'}
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            description="This action cannot be undone."
            onConfirm={handleDeleteUser}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button 
              icon={<DeleteOutlined />}
              danger
              loading={loading}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      <div style={{ padding: '0 0 24px 0' }}>
        {!editMode ? (
          <>
            {/* User Status Card */}
            <Card style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    Account Status
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {user.isActive ? (
                      <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>
                    ) : (
                      <Tag color="error" icon={<CloseCircleOutlined />}>Inactive</Tag>
                    )}
                    <Badge 
                      status={dayjs().diff(dayjs(user.createdAt), 'day') <= 30 ? 'processing' : 'default'} 
                      text={dayjs().diff(dayjs(user.createdAt), 'day') <= 30 ? 'New User' : 'Existing User'} 
                    />
                  </div>
                </div>
                <Switch 
                  checked={user.isActive}
                  onChange={handleToggleStatus}
                  loading={loading}
                  checkedChildren="Active"
                  unCheckedChildren="Inactive"
                />
              </div>
            </Card>

            {/* User Information */}
            <Card title="User Information" style={{ marginBottom: '16px' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Full Name">
                  {user.name || 'Not provided'}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  <Space>
                    <MailOutlined />
                    {user.email || 'Not provided'}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="User ID">
                  <code style={{ 
                    backgroundColor: '#f3f4f6', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontSize: '0.875rem'
                  }}>
                    {user._id}
                  </code>
                </Descriptions.Item>
                <Descriptions.Item label="Join Date">
                  <Space>
                    <CalendarOutlined />
                    {dayjs(user.createdAt).format('MMMM DD, YYYY [at] HH:mm')}
                    <span style={{ color: '#6b7280' }}>
                      ({dayjs().diff(dayjs(user.createdAt), 'day')} days ago)
                    </span>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated">
                  {dayjs(user.updatedAt).format('MMMM DD, YYYY [at] HH:mm')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Donation Statistics */}
            <Card title="Donation Statistics" style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Total Donations"
                    value={user.donationCount || 0}
                    prefix={<DollarOutlined style={{ color: '#059669' }} />}
                    suffix="donations"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Total Amount"
                    value={user.totalDonated || 0}
                    prefix="$"
                    precision={2}
                    valueStyle={{ color: '#059669' }}
                  />
                </Col>
              </Row>
              
              <Divider />
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '8px' }}>User Category</div>
                {(() => {
                  const donationCount = user.donationCount || 0;
                  const totalDonated = user.totalDonated || 0;
                  
                  if (totalDonated >= 500) return <Tag color="gold" icon={<StarOutlined />} style={{ fontSize: '1rem', padding: '8px 16px' }}>VIP Donor</Tag>;
                  if (donationCount >= 10) return <Tag color="blue" icon={<TeamOutlined />} style={{ fontSize: '1rem', padding: '8px 16px' }}>Frequent Donor</Tag>;
                  if (donationCount >= 5) return <Tag color="green" icon={<UserOutlined />} style={{ fontSize: '1rem', padding: '8px 16px' }}>Active Donor</Tag>;
                  if (donationCount >= 1) return <Tag color="cyan" icon={<UserOutlined />} style={{ fontSize: '1rem', padding: '8px 16px' }}>Donor</Tag>;
                  return <Tag color="default" icon={<UserOutlined />} style={{ fontSize: '1rem', padding: '8px 16px' }}>Member</Tag>;
                })()}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card title="Recent Activity" style={{ marginBottom: '16px' }}>
              <div style={{ textAlign: 'center', color: '#6b7280' }}>
                <InfoCircleOutlined style={{ fontSize: '2rem', marginBottom: '8px' }} />
                <div>Activity tracking coming soon</div>
                <div style={{ fontSize: '0.875rem' }}>
                  Last known activity: {dayjs(user.createdAt).format('MMMM DD, YYYY')}
                </div>
              </div>
            </Card>
          </>
        ) : (
          /* Edit Mode */
          <Card title="Edit User Information">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateUser}
            >
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: 'Please enter user name' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
              
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
              
              <Form.Item
                label="Account Status"
                name="isActive"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="Active"
                  unCheckedChildren="Inactive"
                />
              </Form.Item>
              
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Update User
                  </Button>
                  <Button onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        )}
      </div>
    </Drawer>
  );
};

function UsersList() {
  const [users, setUsers] = useState<EnhancedUserProps[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<EnhancedUserProps[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedUser, setSelectedUser] = useState<EnhancedUserProps | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    recentUsers: 0,
    averageJoinTime: 0
  });

  const getData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/users/all-users");
      const usersData = response.data.users || [];
      
      // Try to get donation data to enhance user info
      let donationsData = [];
      try {
        const donationsResponse = await axios.get("/api/donations/get-all");
        donationsData = donationsResponse.data || [];
      } catch (error) {
        console.warn("Could not fetch donations data:", error);
      }
      
      // Enhance users with donation stats
      const enhancedUsers = usersData.map((user: UserTypeProps) => {
        const userDonations = donationsData.filter((d: any) => d.user?._id === user._id);
        const totalDonated = userDonations.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
        
        return {
          ...user,
          donationCount: userDonations.length,
          totalDonated,
          donations: userDonations,
          lastActivity: user.createdAt
        };
      });
      
      setUsers(enhancedUsers);
      setFilteredUsers(enhancedUsers);
      calculateStats(enhancedUsers);
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersData: EnhancedUserProps[]) => {
    if (!usersData || usersData.length === 0) {
      return;
    }

    const totalUsers = usersData.length;
    const activeUsers = usersData.filter(user => user.isActive).length;
    const inactiveUsers = totalUsers - activeUsers;
    
    const thirtyDaysAgo = dayjs().subtract(30, 'day');
    const recentUsers = usersData.filter(user => 
      dayjs(user.createdAt).isAfter(thirtyDaysAgo)
    ).length;
    
    const totalDays = usersData.reduce((sum, user) => {
      return sum + dayjs().diff(dayjs(user.createdAt), 'day');
    }, 0);
    const averageJoinTime = totalUsers > 0 ? Math.round(totalDays / totalUsers) : 0;

    setStats({
      totalUsers,
      activeUsers,
      inactiveUsers,
      recentUsers,
      averageJoinTime
    });
  };

  const handleUserUpdate = (updatedUser: EnhancedUserProps) => {
    const updatedUsers = users.map(user => 
      user._id === updatedUser._id ? updatedUser : user
    );
    setUsers(updatedUsers);
    setFilteredUsers(updatedUsers);
    calculateStats(updatedUsers);
    setSelectedUser(updatedUser);
  };

  const handleViewDetails = (user: EnhancedUserProps) => {
    setSelectedUser(user);
    setDetailsModalVisible(true);
  };

  const handleQuickToggleStatus = async (user: EnhancedUserProps) => {
    try {
      const newStatus = !user.isActive;
      await axios.put(`/api/users/update/${user._id}`, { isActive: newStatus });
      message.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      handleUserUpdate({ ...user, isActive: newStatus });
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to update user status");
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    applyFilters(value, statusFilter, dateRange);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    applyFilters(searchTerm, value, dateRange);
  };

  const handleDateFilter = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    setDateRange(dates);
    applyFilters(searchTerm, statusFilter, dates);
  };

  const applyFilters = (search: string, status: string, dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    let filtered = [...users];

    if (search) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status) {
      if (status === "active") {
        filtered = filtered.filter(user => user.isActive);
      } else if (status === "inactive") {
        filtered = filtered.filter(user => !user.isActive);
      }
    }

    if (dates && dates[0] && dates[1]) {
      filtered = filtered.filter(user => {
        const userDate = dayjs(user.createdAt);
        return userDate.isAfter(dates[0]) && userDate.isBefore(dates[1]);
      });
    }

    setFilteredUsers(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDateRange(null);
    setFilteredUsers(users);
  };

  const exportData = () => {
    const csvContent = [
      ['Name', 'Email', 'Status', 'Joined Date', 'Donations Count', 'Total Donated', 'ID'],
      ...filteredUsers.map(user => [
        user.name || 'N/A',
        user.email || 'N/A',
        user.isActive ? 'Active' : 'Inactive',
        dayjs(user.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        user.donationCount || 0,
        user.totalDonated || 0,
        user._id
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getUserTypeTag = (user: EnhancedUserProps) => {
    const donationCount = user.donationCount || 0;
    const totalDonated = user.totalDonated || 0;
    
    if (totalDonated >= 500) return <Tag color="gold" icon={<StarOutlined />}>VIP Donor</Tag>;
    if (donationCount >= 10) return <Tag color="blue" icon={<TeamOutlined />}>Frequent Donor</Tag>;
    if (donationCount >= 5) return <Tag color="green" icon={<UserOutlined />}>Active Donor</Tag>;
    if (donationCount >= 1) return <Tag color="cyan" icon={<UserOutlined />}>Donor</Tag>;
    return <Tag color="default" icon={<UserOutlined />}>Member</Tag>;
  };

  const getActivityStatus = (user: EnhancedUserProps) => {
    const daysSinceJoining = dayjs().diff(dayjs(user.createdAt), 'day');
    
    if (daysSinceJoining <= 7) return <Badge status="processing" text="New" />;
    if (daysSinceJoining <= 30) return <Badge status="success" text="Recent" />;
    if (user.isActive) return <Badge status="success" text="Active" />;
    return <Badge status="default" text="Inactive" />;
  };

  useEffect(() => {
    getData();
  }, []);

  const columns: ColumnsType<EnhancedUserProps> = [
    {
      title: "User",
      dataIndex: "name",
      key: "name",
      render: (_text: string, record: EnhancedUserProps) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="large" 
            style={{ 
              backgroundColor: record.isActive ? '#10b981' : '#6b7280', 
              marginRight: '12px' 
            }}
            icon={<UserOutlined />}
          >
            {record.name ? record.name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <div>
            <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '1rem' }}>
              {record.name || "Unknown User"}
            </div>
            <div style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <MailOutlined style={{ fontSize: '0.75rem' }} />
              {record.email || "Email not available"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Status & Activity",
      dataIndex: "isActive",
      key: "status",
      render: (_text: string, record: EnhancedUserProps) => (
        <div>
          <div style={{ marginBottom: '8px' }}>
            {getActivityStatus(record)}
          </div>
          <div>
            {getUserTypeTag(record)}
          </div>
        </div>
      ),
    },
    {
      title: "Donation Stats",
      key: "donations",
      render: (_text: string, record: EnhancedUserProps) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '1.125rem', 
            fontWeight: 'bold', 
            color: '#059669',
            marginBottom: '4px'
          }}>
            {formatCurrency(record.totalDonated || 0)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {record.donationCount || 0} donation{(record.donationCount || 0) !== 1 ? 's' : ''}
          </div>
        </div>
      ),
      sorter: (a, b) => (a.totalDonated || 0) - (b.totalDonated || 0),
    },
    {
      title: "Joined",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (_text: string, record: EnhancedUserProps) => {
        const daysSince = dayjs().diff(dayjs(record.createdAt), 'day');
        return (
          <div>
            <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
              {dayjs(record.createdAt).format("MMM DD, YYYY")}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              <ClockCircleOutlined style={{ marginRight: '4px' }} />
              {daysSince === 0 ? 'Today' : `${daysSince} days ago`}
            </div>
          </div>
        );
      },
    },
    {
      title: "Account Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean, record: EnhancedUserProps) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Switch 
            size="small"
            checked={isActive}
            onChange={() => handleQuickToggleStatus(record)}
          />
          {isActive ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Active
            </Tag>
          ) : (
            <Tag color="error" icon={<CloseCircleOutlined />}>
              Inactive
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "User ID",
      dataIndex: "_id",
      key: "_id",
      render: (id: string) => (
        <code style={{ 
          backgroundColor: '#f3f4f6', 
          padding: '4px 8px', 
          borderRadius: '4px',
          fontSize: '0.75rem',
          color: '#374151'
        }}>
          {id.substring(0, 8)}...
        </code>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_text: string, record: EnhancedUserProps) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              style={{ color: '#2563eb' }}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Edit User">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              style={{ color: '#059669' }}
              onClick={() => {
                setSelectedUser(record);
                setDetailsModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Settings">
            <Button 
              type="text" 
              icon={<SettingOutlined />}
              style={{ color: '#8b5cf6' }}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <PageTitle title="Users Management" />
      
      {/* Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<TeamOutlined style={{ color: '#2563eb' }} />}
              valueStyle={{ color: '#2563eb' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats.activeUsers}
              prefix={<CheckCircleOutlined style={{ color: '#059669' }} />}
              valueStyle={{ color: '#059669' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="New Users (30d)"
              value={stats.recentUsers}
              prefix={<UserAddOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg. Member Age"
              value={stats.averageJoinTime}
              suffix="days"
              prefix={<CalendarOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Activity Overview */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} md={12}>
          <Card style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <div style={{ color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                {Math.round((stats.activeUsers / stats.totalUsers) * 100) || 0}%
              </div>
              <div style={{ fontSize: '1.125rem' }}>User Activity Rate</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
            <div style={{ color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                {Math.round((stats.recentUsers / stats.totalUsers) * 100) || 0}%
              </div>
              <div style={{ fontSize: '1.125rem' }}>Growth Rate (30d)</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search users by name or email..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by status"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={handleStatusFilter}
              allowClear
            >
              <Option value="active">Active Users</Option>
              <Option value="inactive">Inactive Users</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={handleDateFilter}
              format="MMM DD, YYYY"
              placeholder={['Join date from', 'Join date to']}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button
                icon={<FilterOutlined />}
                onClick={clearFilters}
              >
                Clear
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={exportData}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px' 
        }}>
          <h3 style={{ margin: 0 }}>
            All Users ({filteredUsers.length})
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Badge status="success" text="Active" />
            <Badge status="error" text="Inactive" />
            <Badge status="processing" text="New" />
          </div>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={filteredUsers} 
          loading={loading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} users`,
          }}
          locale={{
            emptyText: (
              <Empty 
                description="No users found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
          scroll={{ x: 1000 }}
          rowClassName={(record) => record.isActive ? '' : 'inactive-row'}
        />
      </Card>

      {/* User Details Modal */}
      <UserDetailsModal
        visible={detailsModalVisible}
        user={selectedUser}
        onClose={() => {
          setDetailsModalVisible(false);
          setSelectedUser(null);
        }}
        onUserUpdate={handleUserUpdate}
      />

      <style jsx>{`
        .inactive-row {
          background-color: #f9fafb;
          opacity: 0.8;
        }
        .inactive-row:hover {
          background-color: #f3f4f6 !important;
        }
      `}</style>
    </div>
  );
}

export default UsersList;