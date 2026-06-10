// frontend/src/pages/private/admin/reports/index.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/page-title";
import { 
  message, 
  Spin, 
  Table, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Select, 
  DatePicker, 
  Button,
  Tag,
  Avatar,
  Space,
  Progress,
  Tooltip,
  Empty,
  Tabs,
  Alert
} from "antd";
import { 
  DollarCircleOutlined, 
  UserOutlined, 
  TrophyOutlined,
  CalendarOutlined,
  DownloadOutlined,
  EyeOutlined,
  RiseOutlined,
  FallOutlined,
  TeamOutlined,
  ProjectOutlined,
  CreditCardOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  FireOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import axios from "axios";
import ReportCard from "./report-card";
import { DonationTypeProps, CampaignTypeProps } from "../../../../interfaces";
import dayjs from "dayjs";
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

interface ExtendedReports {
  totalUsers: number;
  totalCampaigns: number;
  totalDonations: number;
  totalAmount: number;
  lastFiveDonations: DonationTypeProps[];
  // Additional calculated metrics
  averageDonation: number;
  successfulCampaigns: number;
  activeCampaigns: number;
  recentGrowth: number;
  topCampaigns: Array<{
    name: string;
    amount: number;
    donationsCount: number;
    progress: number;
  }>;
  monthlyData: Array<{
    month: string;
    donations: number;
    amount: number;
  }>;
  donationsByRange: {
    small: number; // < $50
    medium: number; // $50-$200
    large: number; // > $200
  };
}

function AdminReportsPage() {
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignTypeProps[]>([]);
  const [donations, setDonations] = useState<DonationTypeProps[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [reports, setReports] = useState<ExtendedReports>({
    totalUsers: 0,
    totalCampaigns: 0,
    totalDonations: 0,
    totalAmount: 0,
    lastFiveDonations: [],
    averageDonation: 0,
    successfulCampaigns: 0,
    activeCampaigns: 0,
    recentGrowth: 0,
    topCampaigns: [],
    monthlyData: [],
    donationsByRange: { small: 0, medium: 0, large: 0 }
  });
  const navigate = useNavigate();

  const getData = async () => {
    try {
      setLoading(true);
      
      // Get basic reports
      const reportsResponse = await axios.get("/api/reports/admin-reports");
      const basicReports = reportsResponse.data;
      
      // Get campaigns and donations for enhanced analytics
      const [campaignsResponse, donationsResponse] = await Promise.all([
        axios.get("/api/campaigns/get-all"),
        axios.get("/api/donations/get-all")
      ]);
      
      const campaignsData = campaignsResponse.data || [];
      const donationsData = donationsResponse.data || [];
      
      setCampaigns(campaignsData);
      setDonations(donationsData);
      
      // Calculate enhanced metrics
      const enhancedReports = calculateEnhancedMetrics(basicReports, campaignsData, donationsData);
      setReports(enhancedReports);
      
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateEnhancedMetrics = (
    basicReports: any, 
    campaignsData: CampaignTypeProps[], 
    donationsData: DonationTypeProps[]
  ): ExtendedReports => {
    // Filter donations based on selected period
    let filteredDonations = donationsData;
    
    if (selectedPeriod !== 'all') {
      const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
      const days = daysMap[selectedPeriod as keyof typeof daysMap];
      const cutoffDate = dayjs().subtract(days, 'day');
      filteredDonations = donationsData.filter(d => dayjs(d.createdAt).isAfter(cutoffDate));
    }
    
    if (dateRange && dateRange[0] && dateRange[1]) {
      filteredDonations = donationsData.filter(d => {
        const donationDate = dayjs(d.createdAt);
        return donationDate.isAfter(dateRange[0]) && donationDate.isBefore(dateRange[1]);
      });
    }

    // Calculate metrics
    const totalAmount = filteredDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const averageDonation = filteredDonations.length > 0 ? totalAmount / filteredDonations.length : 0;
    
    const successfulCampaigns = campaignsData.filter(c => 
      (c.collectedAmount || 0) >= (c.targetAmount || 0)
    ).length;
    
    const activeCampaigns = campaignsData.filter(c => {
      const endDate = dayjs(c.endDate);
      return endDate.isAfter(dayjs()) && c.isActive;
    }).length;

    // Calculate growth (compare last 30 days vs previous 30 days)
    const last30Days = dayjs().subtract(30, 'day');
    const previous30Days = dayjs().subtract(60, 'day');
    
    const recentDonations = donationsData.filter(d => 
      dayjs(d.createdAt).isAfter(last30Days)
    ).reduce((sum, d) => sum + (d.amount || 0), 0);
    
    const previousDonations = donationsData.filter(d => 
      dayjs(d.createdAt).isAfter(previous30Days) && dayjs(d.createdAt).isBefore(last30Days)
    ).reduce((sum, d) => sum + (d.amount || 0), 0);
    
    const recentGrowth = previousDonations > 0 
      ? ((recentDonations - previousDonations) / previousDonations) * 100 
      : 0;

    // Top campaigns
    const campaignDonations = campaignsData.map(campaign => {
      const campaignDons = filteredDonations.filter(d => d.campaign?._id === campaign._id);
      const campaignAmount = campaignDons.reduce((sum, d) => sum + (d.amount || 0), 0);
      return {
        name: campaign.name || 'Untitled',
        amount: campaignAmount,
        donationsCount: campaignDons.length,
        progress: campaign.targetAmount ? (campaignAmount / campaign.targetAmount) * 100 : 0
      };
    }).sort((a, b) => b.amount - a.amount).slice(0, 5);

    // Monthly data for the last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const month = dayjs().subtract(i, 'month');
      const monthStart = month.startOf('month');
      const monthEnd = month.endOf('month');
      
      const monthDonations = donationsData.filter(d => {
        const donationDate = dayjs(d.createdAt);
        return donationDate.isAfter(monthStart) && donationDate.isBefore(monthEnd);
      });
      
      monthlyData.push({
        month: month.format('MMM'),
        donations: monthDonations.length,
        amount: monthDonations.reduce((sum, d) => sum + (d.amount || 0), 0)
      });
    }

    // Donations by range
    const donationsByRange = filteredDonations.reduce((acc, d) => {
      if (d.amount < 50) acc.small++;
      else if (d.amount <= 200) acc.medium++;
      else acc.large++;
      return acc;
    }, { small: 0, medium: 0, large: 0 });

    return {
      ...basicReports,
      totalDonations: filteredDonations.length,
      totalAmount,
      averageDonation,
      successfulCampaigns,
      activeCampaigns,
      recentGrowth,
      topCampaigns: campaignDonations,
      monthlyData,
      donationsByRange
    };
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setDateRange(null);
  };

  const handleDateRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    setDateRange(dates);
    setSelectedPeriod('custom');
  };

  const exportReport = () => {
    const reportData = [
      ['Metric', 'Value'],
      ['Total Users', reports.totalUsers],
      ['Total Campaigns', reports.totalCampaigns],
      ['Total Donations', reports.totalDonations],
      ['Total Amount', reports.totalAmount],
      ['Average Donation', reports.averageDonation.toFixed(2)],
      ['Successful Campaigns', reports.successfulCampaigns],
      ['Active Campaigns', reports.activeCampaigns],
      ['Recent Growth (%)', reports.recentGrowth.toFixed(1)],
      [''],
      ['Top Campaigns', ''],
      ...reports.topCampaigns.map(c => [c.name, c.amount]),
      [''],
      ['Monthly Data', ''],
      ...reports.monthlyData.map(m => [m.month, m.amount])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([reportData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-report-${dayjs().format('YYYY-MM-DD')}.csv`;
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

  useEffect(() => {
    getData();
  }, [selectedPeriod, dateRange]);

  const donationsColumns: ColumnsType<DonationTypeProps> = [
    {
      title: "Campaign",
      dataIndex: "campaign",
      render: (_text: string, record: DonationTypeProps) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="small" 
            style={{ backgroundColor: '#2563eb', marginRight: '8px' }}
            icon={<TrophyOutlined />}
          />
          <span style={{ fontWeight: 'bold' }}>
            {record.campaign?.name || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      title: "Donor",
      dataIndex: "user",
      render: (_text: string, record: DonationTypeProps) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="small" 
            style={{ backgroundColor: '#10b981', marginRight: '8px' }}
            icon={<UserOutlined />}
          />
          <span>{record.user?.name || 'N/A'}</span>
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (_text: string, record: DonationTypeProps) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#059669' }}>
            {formatCurrency(record.amount)}
          </div>
          <Tag color={record.amount >= 100 ? 'gold' : record.amount >= 50 ? 'blue' : 'green'}>
            {record.amount >= 100 ? 'Major' : record.amount >= 50 ? 'Medium' : 'Standard'}
          </Tag>
        </div>
      ),
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
      render: (_text: string, record: DonationTypeProps) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {dayjs(record.createdAt).format("MMM DD, YYYY")}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {dayjs(record.createdAt).format("h:mm A")}
          </div>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_text: string, record: DonationTypeProps) => (
        <Button 
          type="text" 
          icon={<EyeOutlined />}
          onClick={() => navigate(`/campaign/${record.campaign._id}`)}
          style={{ color: '#2563eb' }}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <PageTitle title="Analytics & Reports" />
        <Space>
          <Select
            value={selectedPeriod}
            onChange={handlePeriodChange}
            style={{ width: 150 }}
          >
            <Option value="all">All Time</Option>
            <Option value="7d">Last 7 Days</Option>
            <Option value="30d">Last 30 Days</Option>
            <Option value="90d">Last 90 Days</Option>
            <Option value="custom">Custom Range</Option>
          </Select>
          {selectedPeriod === 'custom' && (
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              format="MMM DD, YYYY"
            />
          )}
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportReport}
          >
            Export Report
          </Button>
        </Space>
      </div>

      {/* Growth Alert */}
      {reports.recentGrowth !== 0 && (
        <Alert
          message={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {reports.recentGrowth > 0 ? (
                <>
                  <RiseOutlined style={{ color: '#10b981', marginRight: '8px' }} />
                  <span>Great news! Donations are up {reports.recentGrowth.toFixed(1)}% this month</span>
                </>
              ) : (
                <>
                  <FallOutlined style={{ color: '#ef4444', marginRight: '8px' }} />
                  <span>Donations are down {Math.abs(reports.recentGrowth).toFixed(1)}% this month</span>
                </>
              )}
            </div>
          }
          type={reports.recentGrowth > 0 ? 'success' : 'warning'}
          style={{ marginBottom: '24px' }}
          showIcon
        />
      )}

      {/* Main Stats */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={reports.totalUsers}
              prefix={<TeamOutlined style={{ color: '#2563eb' }} />}
              valueStyle={{ color: '#2563eb' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Campaigns"
              value={reports.totalCampaigns}
              prefix={<ProjectOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Donations"
              value={reports.totalDonations}
              prefix={<CreditCardOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={reports.totalAmount}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarCircleOutlined style={{ color: '#059669' }} />}
              valueStyle={{ color: '#059669' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Secondary Stats */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Average Donation"
              value={reports.averageDonation}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<LineChartOutlined style={{ color: '#06b6d4' }} />}
              valueStyle={{ color: '#06b6d4' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Successful Campaigns"
              value={reports.successfulCampaigns}
              suffix={`/ ${reports.totalCampaigns}`}
              prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Campaigns"
              value={reports.activeCampaigns}
              prefix={<FireOutlined style={{ color: '#ef4444' }} />}
              valueStyle={{ color: '#ef4444' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={reports.totalCampaigns > 0 ? (reports.successfulCampaigns / reports.totalCampaigns * 100).toFixed(1) : 0}
              suffix="%"
              prefix={<TrophyOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Analytics */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {/* Top Campaigns */}
        <Col xs={24} lg={12}>
          <Card title="🏆 Top Performing Campaigns" style={{ height: '400px' }}>
            {reports.topCampaigns.length === 0 ? (
              <Empty description="No campaign data available" />
            ) : (
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {reports.topCampaigns.map((campaign, index) => (
                  <div key={index} style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
                          #{index + 1} {campaign.name}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {campaign.donationsCount} donations
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: '#059669' }}>
                          {formatCurrency(campaign.amount)}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {campaign.progress.toFixed(1)}% of goal
                        </div>
                      </div>
                    </div>
                    <Progress 
                      percent={Math.min(campaign.progress, 100)} 
                      showInfo={false}
                      strokeColor={campaign.progress >= 100 ? '#10b981' : '#2563eb'}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* Donation Distribution */}
        <Col xs={24} lg={12}>
          <Card title="💰 Donation Distribution" style={{ height: '400px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '320px', justifyContent: 'center' }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span>Small Donations (&lt; $50)</span>
                  <span style={{ fontWeight: 'bold', color: '#10b981' }}>{reports.donationsByRange.small}</span>
                </div>
                <Progress 
                  percent={reports.totalDonations > 0 ? (reports.donationsByRange.small / reports.totalDonations) * 100 : 0}
                  strokeColor="#10b981"
                />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span>Medium Donations ($50-$200)</span>
                  <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{reports.donationsByRange.medium}</span>
                </div>
                <Progress 
                  percent={reports.totalDonations > 0 ? (reports.donationsByRange.medium / reports.totalDonations) * 100 : 0}
                  strokeColor="#2563eb"
                />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span>Large Donations (&gt; $200)</span>
                  <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{reports.donationsByRange.large}</span>
                </div>
                <Progress 
                  percent={reports.totalDonations > 0 ? (reports.donationsByRange.large / reports.totalDonations) * 100 : 0}
                  strokeColor="#f59e0b"
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Monthly Trends */}
      <Card title="📈 Monthly Trends (Last 6 Months)" style={{ marginBottom: '32px' }}>
        <Row gutter={[16, 16]}>
          {reports.monthlyData.map((month, index) => (
            <Col xs={12} sm={8} md={4} key={index}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>
                    {month.month}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px' }}>
                    {month.donations} donations
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669' }}>
                    {formatCurrency(month.amount)}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Recent Donations */}
      <Card title="🕐 Recent Donations" style={{ marginBottom: '32px' }}>
        <Table 
          columns={donationsColumns} 
          dataSource={reports.lastFiveDonations}
          loading={loading}
          rowKey="_id"
          pagination={false}
          locale={{
            emptyText: (
              <Empty 
                description="No recent donations"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />
      </Card>
    </div>
  );
}

export default AdminReportsPage;