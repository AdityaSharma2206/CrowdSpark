// frontend/src/pages/private/user/profile/index.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import axios from "axios";
import {
  Card,
  Button,
  Input,
  Form,
  message,
  Row,
  Col,
  Statistic,
  Avatar,
  Tabs,
  Timeline,
  Badge,
  Space,
  Tooltip,
  Modal,
  Progress,
  Tag,
  Divider,
  Alert
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  CalendarOutlined,
  TrophyOutlined,
  DollarCircleOutlined,
  HeartOutlined,
  CrownOutlined,
  SafetyOutlined,
  MailOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  GiftOutlined,
  SettingOutlined,
  BellOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from "@ant-design/icons";
import PageTitle from "../../../../components/page-title";
import usersStore, { UsersStoreProps } from "../../../../store/users-store";
import { DonationTypeProps } from "../../../../interfaces";

const { TabPane } = Tabs;

interface UserStats {
  totalDonations: number;
  donationCount: number;
  averageDonation: number;
  recentDonations: number;
  favoriteCategory: string;
}

interface ProfileFormData {
  name: string;
  email: string;
}

function ProfilePage() {
  const { currentUser } = usersStore() as UsersStoreProps;
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [donations, setDonations] = useState<DonationTypeProps[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalDonations: 0,
    donationCount: 0,
    averageDonation: 0,
    recentDonations: 0,
    favoriteCategory: ""
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const navigate = useNavigate();

  const getUserDonations = async () => {
    try {
      const response = await axios.get(`/api/donations/get-all`);
      const allDonations = response.data || [];
      const userDonations = allDonations.filter(
        (donation: DonationTypeProps) => donation.user._id === currentUser?._id
      );
      setDonations(userDonations);
      calculateStats(userDonations);
    } catch (error) {
      console.error("Error fetching donations:", error);
    }
  };

  const calculateStats = (donationsData: DonationTypeProps[]) => {
    if (!donationsData || donationsData.length === 0) return;

    const totalAmount = donationsData.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    const totalCount = donationsData.length;
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;

    const sevenDaysAgo = dayjs().subtract(7, 'day');
    const recentDonations = donationsData.filter(donation => 
      dayjs(donation.createdAt).isAfter(sevenDaysAgo)
    ).length;

    setStats({
      totalDonations: totalAmount,
      donationCount: totalCount,
      averageDonation: averageAmount,
      recentDonations,
      favoriteCategory: "Technology" // You can calculate this based on campaign categories
    });
  };

  const handleUpdateProfile = async (values: ProfileFormData) => {
    try {
      setLoading(true);
      await axios.put(`/api/users/update-profile`, values);
      message.success("Profile updated successfully!");
      setEditMode(false);
      // You might want to refresh the user data here
    } catch (error: any) {
      message.error("Failed to update profile: " + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      setPasswordLoading(true);
      await axios.put(`/api/users/change-password`, {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      });
      message.success("Password changed successfully!");
      passwordForm.resetFields();
    } catch (error: any) {
      message.error("Failed to change password: " + error.response?.data?.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getMembershipLevel = () => {
    if (stats.totalDonations >= 1000) return { level: "Platinum", color: "#8b5cf6", icon: <CrownOutlined /> };
    if (stats.totalDonations >= 500) return { level: "Gold", color: "#f59e0b", icon: <TrophyOutlined /> };
    if (stats.totalDonations >= 100) return { level: "Silver", color: "#6b7280", icon: <GiftOutlined /> };
    return { level: "Bronze", color: "#a78bfa", icon: <HeartOutlined /> };
  };

  const membership = getMembershipLevel();

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        name: currentUser.name,
        email: currentUser.email
      });
      getUserDonations();
    }
  }, [currentUser, form]);

  if (!currentUser) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Alert message="Please log in to view your profile" type="warning" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <PageTitle title="My Profile" />

      {/* Profile Header */}
      <Card style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Row align="middle" gutter={[24, 24]}>
          <Col>
            <Avatar 
              size={120} 
              style={{ 
                backgroundColor: '#fff', 
                color: '#667eea',
                border: '4px solid rgba(255,255,255,0.3)'
              }}
              icon={<UserOutlined style={{ fontSize: '48px' }} />}
            />
          </Col>
          <Col flex="auto">
            <div style={{ color: 'white' }}>
              <h2 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '2rem' }}>
                {currentUser.name}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.125rem', margin: '0 0 16px 0' }}>
                {currentUser.email}
              </p>
              <Space size="large">
                <Badge 
                  count={membership.level}
                  style={{ 
                    backgroundColor: membership.color,
                    color: 'white',
                    fontSize: '0.875rem',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: 'none'
                  }}
                >
                  {membership.icon}
                </Badge>
                <Tag color={currentUser.isAdmin ? 'gold' : 'blue'} style={{ fontSize: '0.875rem' }}>
                  {currentUser.isAdmin ? 'Administrator' : 'Member'}
                </Tag>
              </Space>
            </div>
          </Col>
          <Col>
            <Button 
              type="default" 
              icon={<EditOutlined />}
              onClick={() => setEditMode(true)}
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
            >
              Edit Profile
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Donated"
              value={stats.totalDonations}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarCircleOutlined style={{ color: '#059669' }} />}
              valueStyle={{ color: '#059669' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Projects Backed"
              value={stats.donationCount}
              prefix={<HeartOutlined style={{ color: '#e11d48' }} />}
              valueStyle={{ color: '#e11d48' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Average Donation"
              value={stats.averageDonation}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<TrophyOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Recent Activity"
              value={stats.recentDonations}
              suffix="this week"
              prefix={<CalendarOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="large"
          style={{ minHeight: '400px' }}
        >
          <TabPane tab={<span><UserOutlined />Overview</span>} key="overview">
            <Row gutter={[24, 24]}>
              {/* Account Information */}
              <Col xs={24} md={12}>
                <Card title="Account Information" size="small">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <MailOutlined style={{ color: '#6b7280' }} />
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Email</div>
                        <div style={{ fontWeight: 'bold' }}>{currentUser.email}</div>
                      </div>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <UserOutlined style={{ color: '#6b7280' }} />
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Full Name</div>
                        <div style={{ fontWeight: 'bold' }}>{currentUser.name}</div>
                      </div>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <SafetyOutlined style={{ color: '#6b7280' }} />
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Account Type</div>
                        <div style={{ fontWeight: 'bold' }}>
                          {currentUser.isAdmin ? 'Administrator' : 'Standard User'}
                        </div>
                      </div>
                    </div>
                    <Divider style={{ margin: '8px 0' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CalendarOutlined style={{ color: '#6b7280' }} />
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Member Since</div>
                        <div style={{ fontWeight: 'bold' }}>
                          {dayjs(currentUser.createdAt).format("MMMM YYYY")}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Membership Progress */}
              <Col xs={24} md={12}>
                <Card title="Membership Level" size="small">
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
                      {membership.icon}
                    </div>
                    <h3 style={{ color: membership.color, margin: '0 0 8px 0' }}>
                      {membership.level} Member
                    </h3>
                    <p style={{ color: '#6b7280', margin: 0 }}>
                      Total Contributed: {formatCurrency(stats.totalDonations)}
                    </p>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Progress to Next Level</span>
                      <span>{Math.min(100, Math.round((stats.totalDonations / 1000) * 100))}%</span>
                    </div>
                    <Progress 
                      percent={Math.min(100, Math.round((stats.totalDonations / 1000) * 100))}
                      strokeColor={membership.color}
                      trailColor="#f0f0f0"
                    />
                  </div>

                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    <p>🥉 Bronze: $0+ | 🥈 Silver: $100+ | 🥇 Gold: $500+ | 👑 Platinum: $1000+</p>
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab={<span><HeartOutlined />Donation History</span>} key="donations">
            <div style={{ marginBottom: '24px' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card size="small">
                    <Statistic
                      title="Total Impact"
                      value={stats.totalDonations}
                      formatter={(value) => formatCurrency(Number(value))}
                      prefix={<DollarCircleOutlined style={{ color: '#059669' }} />}
                      valueStyle={{ color: '#059669' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small">
                    <Statistic
                      title="Projects Supported"
                      value={stats.donationCount}
                      prefix={<TrophyOutlined style={{ color: '#2563eb' }} />}
                      valueStyle={{ color: '#2563eb' }}
                    />
                  </Card>
                </Col>
              </Row>
            </div>

            {donations.length > 0 ? (
              <Timeline style={{ marginTop: '24px' }}>
                {donations.slice(0, 10).map((donation, index) => (
                  <Timeline.Item
                    key={donation._id}
                    dot={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                    color="green"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
                          {donation.campaign?.name || 'Campaign'}
                        </h4>
                        <p style={{ margin: '0 0 4px 0', color: '#6b7280', fontSize: '0.875rem' }}>
                          {donation.message || 'No message'}
                        </p>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.75rem' }}>
                          {dayjs(donation.createdAt).format("MMM DD, YYYY at h:mm A")}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: '#059669', fontSize: '1.125rem' }}>
                          {formatCurrency(donation.amount)}
                        </div>
                        <Button 
                          type="text" 
                          size="small"
                          onClick={() => navigate(`/campaign/${donation.campaign._id}`)}
                          style={{ color: '#2563eb' }}
                        >
                          View Campaign
                        </Button>
                      </div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <HeartOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <p>No donations yet. Start supporting projects today!</p>
                <Button type="primary" onClick={() => navigate('/home')}>
                  Explore Projects
                </Button>
              </div>
            )}
          </TabPane>

          <TabPane tab={<span><LockOutlined />Security</span>} key="security">
            <Row gutter={[24, 24]}>
              <Col xs={24} md={16}>
                <Card title="Change Password" size="small">
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                    style={{ maxWidth: '400px' }}
                  >
                    <Form.Item
                      label="Current Password"
                      name="oldPassword"
                      rules={[{ required: true, message: 'Please enter your current password!' }]}
                    >
                      <Input.Password
                        placeholder="Enter current password"
                        iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                        style={{ height: '40px' }}
                      />
                    </Form.Item>

                    <Form.Item
                      label="New Password"
                      name="newPassword"
                      rules={[
                        { required: true, message: 'Please enter your new password!' },
                        { min: 6, message: 'Password must be at least 6 characters!' }
                      ]}
                    >
                      <Input.Password
                        placeholder="Enter new password"
                        iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                        style={{ height: '40px' }}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Confirm New Password"
                      name="confirmPassword"
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: 'Please confirm your new password!' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject('The two passwords do not match!');
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        placeholder="Confirm new password"
                        iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                        style={{ height: '40px' }}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={passwordLoading} size="large">
                        Update Password
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card title="Security Tips" size="small">
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <SafetyOutlined style={{ color: '#10b981', marginRight: '8px' }} />
                      Use a strong, unique password
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <LockOutlined style={{ color: '#10b981', marginRight: '8px' }} />
                      Include uppercase, lowercase, and numbers
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <BellOutlined style={{ color: '#10b981', marginRight: '8px' }} />
                      Keep your account information updated
                    </div>
                    <div>
                      <CheckCircleOutlined style={{ color: '#10b981', marginRight: '8px' }} />
                      Never share your password with others
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Profile"
        open={editMode}
        onCancel={() => setEditMode(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
          style={{ marginTop: '24px' }}
        >
          <Form.Item
            label="Full Name"
            name="name"
            rules={[{ required: true, message: 'Please enter your name!' }]}
          >
            <Input 
              placeholder="Enter your full name" 
              prefix={<UserOutlined />}
              style={{ height: '40px' }}
            />
          </Form.Item>

          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input 
              placeholder="Enter your email address" 
              prefix={<MailOutlined />}
              style={{ height: '40px' }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Save Changes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ProfilePage;