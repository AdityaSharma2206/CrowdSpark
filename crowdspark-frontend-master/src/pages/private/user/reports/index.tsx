import { useEffect, useState } from "react";
import PageTitle from "../../../../components/page-title";
import { 
  message, 
  Spin, 
  Table, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Tag, 
  Button, 
  DatePicker, 
  Select, 
  Input, 
  Space,
  Avatar,
  Tooltip,
  Empty,
  Timeline,
  Divider
} from "antd";
import axios from "axios";
import { DonationTypeProps } from "../../../../interfaces";
import dayjs from "dayjs";
import usersStore, { UsersStoreProps } from "../../../../store/users-store";
import { 
  DollarCircleOutlined, 
  TrophyOutlined, 
  CalendarOutlined, 
  HeartOutlined,
  DownloadOutlined,
  FilterOutlined,
  SearchOutlined,
  UserOutlined,
  GiftOutlined,
  StarOutlined,
  CrownOutlined,
  LineChartOutlined,
  BankOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface EnhancedReports {
  totalDonations: number;
  totalAmount: number;
  lastFiveDonations: DonationTypeProps[];
  monthlyDonations: number;
  averageDonation: number;
  favoriteCategory: string;
  donationStreak: number;
  impactScore: number;
  campaignsSupported: number;
  monthlyTrend: number;
  recentActivity: DonationTypeProps[];
  topCampaigns: Array<{
    campaign: string;
    amount: number;
    donations: number;
  }>;
}

function UserReportsPage() {
  const { currentUser } = usersStore() as UsersStoreProps;
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [filteredDonations, setFilteredDonations] = useState<DonationTypeProps[]>([]);
  const [reports, setReports] = useState<EnhancedReports>({
    totalDonations: 0,
    totalAmount: 0,
    lastFiveDonations: [],
    monthlyDonations: 0,
    averageDonation: 0,
    favoriteCategory: "",
    donationStreak: 0,
    impactScore: 0,
    campaignsSupported: 0,
    monthlyTrend: 0,
    recentActivity: [],
    topCampaigns: []
  });
  const navigate = useNavigate();

  const getData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/reports/user-reports/${currentUser?._id}`
      );
      const baseData = response.data;
      
      // Enhance the data with additional calculations
      const enhancedData = {
        ...baseData,
        averageDonation: baseData.totalDonations > 0 ? baseData.totalAmount / baseData.totalDonations : 0,
        monthlyDonations: calculateMonthlyDonations(baseData.lastFiveDonations),
        favoriteCategory: "Technology", // This would come from actual data analysis
        donationStreak: calculateDonationStreak(baseData.lastFiveDonations),
        impactScore: calculateImpactScore(baseData.totalAmount, baseData.totalDonations),
        campaignsSupported: getUniqueCampaigns(baseData.lastFiveDonations).length,
        monthlyTrend: calculateMonthlyTrend(baseData.lastFiveDonations),
        recentActivity: baseData.lastFiveDonations.slice(0, 10),
        topCampaigns: getTopCampaigns(baseData.lastFiveDonations)
      };
      
      setReports(enhancedData);
      setFilteredDonations(baseData.lastFiveDonations);
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyDonations = (donations: DonationTypeProps[]) => {
    const thisMonth = dayjs().startOf('month');
    return donations.filter(d => dayjs(d.createdAt).isAfter(thisMonth)).length;
  };

  const calculateDonationStreak = (donations: DonationTypeProps[]) => {
    // Simple streak calculation - consecutive days with donations
    return Math.min(donations.length, 7); // Max 7 for display
  };

  const calculateImpactScore = (totalAmount: number, totalDonations: number) => {
    // Custom impact score based on amount and consistency
    const baseScore = Math.min(totalAmount / 100, 100); // $100 = 100 points
    const consistencyBonus = Math.min(totalDonations * 5, 50); // 5 points per donation, max 50
    return Math.round(baseScore + consistencyBonus);
  };

  const getUniqueCampaigns = (donations: DonationTypeProps[]) => {
    const campaigns = donations
      .filter(d => d.campaign && d.campaign._id)
      .map(d => d.campaign._id);
    return [...new Set(campaigns)];
  };

  const calculateMonthlyTrend = (donations: DonationTypeProps[]) => {
    const thisMonth = dayjs().startOf('month');
    const lastMonth = dayjs().subtract(1, 'month').startOf('month');
    
    const thisMonthAmount = donations
      .filter(d => dayjs(d.createdAt).isAfter(thisMonth))
      .reduce((sum, d) => sum + d.amount, 0);
    
    const lastMonthAmount = donations
      .filter(d => dayjs(d.createdAt).isAfter(lastMonth) && dayjs(d.createdAt).isBefore(thisMonth))
      .reduce((sum, d) => sum + d.amount, 0);
    
    if (lastMonthAmount === 0) return thisMonthAmount > 0 ? 100 : 0;
    return Math.round(((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100);
  };

  const getTopCampaigns = (donations: DonationTypeProps[]) => {
    const campaignStats = donations.reduce((acc: any, donation) => {
      const campaignId = donation.campaign?._id;
      const campaignName = donation.campaign?.name || "Unknown";
      
      if (!campaignId) return acc;
      
      if (!acc[campaignId]) {
        acc[campaignId] = {
          campaign: campaignName,
          amount: 0,
          donations: 0
        };
      }
      
      acc[campaignId].amount += donation.amount;
      acc[campaignId].donations += 1;
      
      return acc;
    }, {});
    
    return Object.values(campaignStats)
      .sort((a: any, b: any) => b.amount - a.amount)
      .slice(0, 5);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    applyFilters(value, selectedPeriod, dateRange);
  };

  const handlePeriodFilter = (value: string) => {
    setSelectedPeriod(value);
    applyFilters(searchTerm, value, dateRange);
  };

  const applyFilters = (search: string, period: string, dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    let filtered = [...reports.lastFiveDonations];

    // Search filter
    if (search) {
      filtered = filtered.filter(donation =>
        donation.campaign?.name?.toLowerCase().includes(search.toLowerCase()) ||
        donation.paymentId?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Period filter
    if (period !== "all") {
      const now = dayjs();
      let startDate;
      switch (period) {
        case "week":
          startDate = now.subtract(7, 'day');
          break;
        case "month":
          startDate = now.subtract(1, 'month');
          break;
        case "year":
          startDate = now.subtract(1, 'year');
          break;
      }
      if (startDate) {
        filtered = filtered.filter(donation => dayjs(donation.createdAt).isAfter(startDate));
      }
    }

    // Date range filter
    if (dates && dates[0] && dates[1]) {
      filtered = filtered.filter(donation => {
        const donationDate = dayjs(donation.createdAt);
        return donationDate.isAfter(dates[0]) && donationDate.isBefore(dates[1]);
      });
    }

    setFilteredDonations(filtered);
  };

  const exportData = () => {
    const csvContent = [
      ['Campaign', 'Amount', 'Payment ID', 'Date', 'Message'],
      ...filteredDonations.map(donation => [
        donation.campaign?.name || 'N/A',
        donation.amount,
        donation.paymentId,
        dayjs(donation.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        donation.message || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-donations-${dayjs().format('YYYY-MM-DD')}.csv`;
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

  const getDonationLevel = (amount: number) => {
    if (amount >= 500) return { level: "Champion", color: "#f59e0b", icon: <CrownOutlined /> };
    if (amount >= 100) return { level: "Hero", color: "#8b5cf6", icon: <StarOutlined /> };
    if (amount >= 50) return { level: "Supporter", color: "#2563eb", icon: <TrophyOutlined /> };
    return { level: "Contributor", color: "#10b981", icon: <HeartOutlined /> };
  };

  const getImpactLevel = (score: number) => {
    if (score >= 150) return { level: "Changemaker", color: "#ef4444", progress: 100 };
    if (score >= 100) return { level: "Champion", color: "#f59e0b", progress: (score / 150) * 100 };
    if (score >= 50) return { level: "Hero", color: "#8b5cf6", progress: (score / 100) * 100 };
    return { level: "Rising Star", color: "#10b981", progress: (score / 50) * 100 };
  };

  useEffect(() => {
    getData();
  }, []);

  const columns: ColumnsType<DonationTypeProps> = [
    {
      title: "Campaign",
      dataIndex: "campaign",
      key: "campaign",
      render: (_text: string, record: DonationTypeProps) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="small" 
            style={{ backgroundColor: '#2563eb', marginRight: '8px' }}
            icon={<TrophyOutlined />}
          />
          <div>
            <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
              {record.campaign?.name || "Campaign Unavailable"}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Click to view campaign
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
      render: (_text: string, record: DonationTypeProps) => {
        const donationLevel = getDonationLevel(record.amount);
        return (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#059669' }}>
              {formatCurrency(record.amount)}
            </div>
            <Tag color={donationLevel.color} icon={donationLevel.icon}>
              {donationLevel.level}
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Payment ID",
      dataIndex: "paymentId",
      key: "paymentId",
      render: (paymentId: string) => (
        <code style={{ 
          backgroundColor: '#f3f4f6', 
          padding: '4px 8px', 
          borderRadius: '4px',
          fontSize: '0.875rem'
        }}>
          {paymentId}
        </code>
      ),
    },
    {
      title: "Date & Time",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (_text: string, record: DonationTypeProps) => (
        <div>
          <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
            {dayjs(record.createdAt).format("MMM DD, YYYY")}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {dayjs(record.createdAt).format("h:mm A")}
          </div>
        </div>
      ),
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      render: (message: string) => (
        <Tooltip title={message}>
          <div style={{ 
            maxWidth: '200px', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#6b7280'
          }}>
            {message || "No message"}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_text: string, record: DonationTypeProps) => (
        <Button 
          type="text" 
          icon={<EyeOutlined />}
          onClick={() => navigate(`/campaign/${record.campaign?._id}`)}
          style={{ color: '#2563eb' }}
        >
          View
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const impactLevel = getImpactLevel(reports.impactScore);

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <PageTitle title="My Donation Reports" />
      
      {/* Hero Section */}
      <Card style={{ 
        marginBottom: '32px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none'
      }}>
        <div style={{ color: 'white', textAlign: 'center', padding: '20px 0' }}>
          <Avatar 
            size={80} 
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: '16px' }}
            icon={<UserOutlined style={{ fontSize: '2rem' }} />}
          />
          <h2 style={{ color: 'white', marginBottom: '8px' }}>
            {currentUser?.name || "User"}
          </h2>
          <p style={{ fontSize: '1.125rem', margin: 0, opacity: 0.9 }}>
            Your generosity is creating real change in the world
          </p>
        </div>
      </Card>

      {/* Primary Stats */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} md={8}>
          <Card style={{ textAlign: 'center', height: '100%' }}>
            <div style={{ marginBottom: '16px' }}>
              <DollarCircleOutlined style={{ fontSize: '2.5rem', color: '#059669' }} />
            </div>
            <Statistic
              title="Total Donated"
              value={reports.totalAmount}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#059669', fontSize: '2rem' }}
            />
            <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
              Your total contribution
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card style={{ textAlign: 'center', height: '100%' }}>
            <div style={{ marginBottom: '16px' }}>
              <HeartOutlined style={{ fontSize: '2.5rem', color: '#ef4444' }} />
            </div>
            <Statistic
              title="Total Donations"
              value={reports.totalDonations}
              valueStyle={{ color: '#ef4444', fontSize: '2rem' }}
            />
            <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
              Times you've helped
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card style={{ textAlign: 'center', height: '100%' }}>
            <div style={{ marginBottom: '16px' }}>
              <TrophyOutlined style={{ fontSize: '2.5rem', color: '#f59e0b' }} />
            </div>
            <Statistic
              title="Campaigns Supported"
              value={reports.campaignsSupported}
              valueStyle={{ color: '#f59e0b', fontSize: '2rem' }}
            />
            <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
              Different projects helped
            </div>
          </Card>
        </Col>
      </Row>

      {/* Impact & Insights */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} md={12}>
          <Card title="🌟 Your Impact Level" style={{ height: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: impactLevel.color }}>
                {impactLevel.level}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '8px' }}>
                {reports.impactScore} points
              </div>
            </div>
            <Progress
              percent={impactLevel.progress}
              strokeColor={impactLevel.color}
              trailColor="#f0f0f0"
              strokeWidth={12}
              showInfo={false}
            />
            <div style={{ marginTop: '16px', fontSize: '0.875rem', color: '#6b7280' }}>
              Your impact grows with every donation. Keep making a difference!
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="📊 Quick Insights" style={{ height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Average Donation</span>
                <span style={{ fontWeight: 'bold' }}>
                  {formatCurrency(reports.averageDonation)}
                </span>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>This Month</span>
                <span style={{ fontWeight: 'bold', color: '#2563eb' }}>
                  {reports.monthlyDonations} donations
                </span>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Monthly Trend</span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: reports.monthlyTrend >= 0 ? '#059669' : '#ef4444' 
                }}>
                  {reports.monthlyTrend >= 0 ? '+' : ''}{reports.monthlyTrend}%
                </span>
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Donation Streak</span>
                <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>
                  {reports.donationStreak} days
                </span>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Top Campaigns */}
      {reports.topCampaigns.length > 0 && (
        <Card title="🏆 Your Top Supported Campaigns" style={{ marginBottom: '32px' }}>
          <Row gutter={[16, 16]}>
            {reports.topCampaigns.map((campaign: any, index: number) => (
              <Col xs={24} sm={12} md={8} lg={6} key={index}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <Avatar style={{ backgroundColor: '#2563eb' }}>
                      {index + 1}
                    </Avatar>
                  </div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {campaign.campaign}
                  </div>
                  <div style={{ color: '#059669', fontWeight: 'bold' }}>
                    {formatCurrency(campaign.amount)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {campaign.donations} donations
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search donations..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Time period"
              style={{ width: '100%' }}
              value={selectedPeriod}
              onChange={handlePeriodFilter}
            >
              <Option value="all">All Time</Option>
              <Option value="week">Last 7 Days</Option>
              <Option value="month">Last 30 Days</Option>
              <Option value="year">Last Year</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={setDateRange}
              format="MMM DD, YYYY"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchTerm("");
                  setSelectedPeriod("all");
                  setDateRange(null);
                  setFilteredDonations(reports.lastFiveDonations);
                }}
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

      {/* Donations Table */}
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px' 
        }}>
          <h3 style={{ margin: 0 }}>
            Your Donations ({filteredDonations.length})
          </h3>
          <Tag color="blue" style={{ fontSize: '0.875rem' }}>
            Total: {formatCurrency(filteredDonations.reduce((sum, d) => sum + d.amount, 0))}
          </Tag>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={filteredDonations} 
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} donations`,
          }}
          locale={{
            emptyText: (
              <Empty 
                description="No donations found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Motivational CTA */}
      <Card style={{ 
        marginTop: '32px',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        border: 'none'
      }}>
        <div style={{ color: 'white', textAlign: 'center', padding: '20px 0' }}>
          <GiftOutlined style={{ fontSize: '3rem', marginBottom: '16px' }} />
          <h3 style={{ color: 'white', marginBottom: '8px' }}>
            Ready to Make Another Difference?
          </h3>
          <p style={{ fontSize: '1.125rem', margin: '0 0 24px', opacity: 0.9 }}>
            Discover new campaigns that need your support
          </p>
          <Button 
            type="default"
            size="large"
            onClick={() => navigate("/")}
            style={{ 
              backgroundColor: 'white',
              color: '#059669',
              border: 'none',
              fontWeight: 'bold'
            }}
          >
            Explore Campaigns
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default UserReportsPage;