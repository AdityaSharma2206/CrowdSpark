import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/page-title";
import { DonationTypeProps } from "../../../../interfaces";
import usersStore, { UsersStoreProps } from "../../../../store/users-store";
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
  Progress,
  Timeline,
  Divider
} from "antd";
import { 
  DollarCircleOutlined, 
  HeartOutlined, 
  CalendarOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  TrophyOutlined,
  GiftOutlined,
  CreditCardOutlined,
  StarFilled,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { ColumnsType } from 'antd/es/table';

// Add the relativeTime plugin
dayjs.extend(relativeTime);

const { RangePicker } = DatePicker;
const { Option } = Select;

interface DonationStats {
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
  favoriteCampaign: string;
  recentDonations: number;
  firstDonationDate: string;
}

interface DonationWithProgress extends DonationTypeProps {
  campaignProgress?: number;
  isRecentDonation?: boolean;
}

function DonationsPage() {
  const [donations, setDonations] = useState<DonationWithProgress[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<DonationWithProgress[]>([]);
  const { currentUser } = usersStore() as UsersStoreProps;
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [stats, setStats] = useState<DonationStats>({
    totalAmount: 0,
    totalCount: 0,
    averageAmount: 0,
    favoriteCampaign: "",
    recentDonations: 0,
    firstDonationDate: ""
  });
  const navigate = useNavigate();

  const getData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/donations/get-donations-by-user/${currentUser?._id}`
      );
      
      const donationsData: DonationTypeProps[] = response.data || [];
      
      // Enhance donations with additional data
      const enhancedDonations: DonationWithProgress[] = donationsData.map(donation => {
        const campaignProgress = donation.campaign?.targetAmount 
          ? Math.min(((donation.campaign.collectedAmount || 0) / donation.campaign.targetAmount) * 100, 100)
          : 0;
        
        const isRecentDonation = dayjs().diff(dayjs(donation.createdAt), 'day') <= 7;
        
        return {
          ...donation,
          campaignProgress,
          isRecentDonation
        };
      });
      
      setDonations(enhancedDonations);
      setFilteredDonations(enhancedDonations);
      calculateStats(enhancedDonations);
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (donationsData: DonationWithProgress[]) => {
    if (!donationsData || donationsData.length === 0) {
      return;
    }

    const totalAmount = donationsData.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    const totalCount = donationsData.length;
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;

    // Find favorite campaign (most donated to)
    const campaignCounts = donationsData.reduce((acc: { [key: string]: number }, donation) => {
      if (donation.campaign?.name) {
        acc[donation.campaign.name] = (acc[donation.campaign.name] || 0) + 1;
      }
      return acc;
    }, {});

    const favoriteCampaign = Object.keys(campaignCounts).reduce((a, b) => 
      campaignCounts[a] > campaignCounts[b] ? a : b, ""
    );

    // Count recent donations (last 7 days)
    const recentDonations = donationsData.filter(donation => donation.isRecentDonation).length;

    // First donation date
    const firstDonationDate = donationsData.length > 0 
      ? donationsData.sort((a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix())[0].createdAt
      : "";

    setStats({
      totalAmount,
      totalCount,
      averageAmount,
      favoriteCampaign,
      recentDonations,
      firstDonationDate
    });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    applyFilters(value, selectedCampaign, dateRange);
  };

  const handleCampaignFilter = (value: string) => {
    setSelectedCampaign(value);
    applyFilters(searchTerm, value, dateRange);
  };

  const handleDateFilter = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    setDateRange(dates);
    applyFilters(searchTerm, selectedCampaign, dates);
  };

  const applyFilters = (search: string, campaign: string, dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    let filtered = [...donations];

    if (search) {
      filtered = filtered.filter(donation => 
        donation.campaign?.name?.toLowerCase().includes(search.toLowerCase()) ||
        donation.paymentId?.toLowerCase().includes(search.toLowerCase()) ||
        donation.message?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (campaign) {
      filtered = filtered.filter(donation => donation.campaign?._id === campaign);
    }

    if (dates && dates[0] && dates[1]) {
      filtered = filtered.filter(donation => {
        const donationDate = dayjs(donation.createdAt);
        return donationDate.isAfter(dates[0]) && donationDate.isBefore(dates[1]);
      });
    }

    setFilteredDonations(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCampaign("");
    setDateRange(null);
    setFilteredDonations(donations);
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

  const getUniqueCampaigns = () => {
    const campaigns = donations
      .filter(d => d.campaign && d.campaign.name)
      .map(d => ({ id: d.campaign._id, name: d.campaign.name }));
    
    return Array.from(new Map(campaigns.map(c => [c.id, c])).values());
  };

  const getRecentDonationsTimeline = () => {
    return donations
      .filter(d => d.isRecentDonation)
      .sort((a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix())
      .slice(0, 5)
      .map(donation => ({
        children: (
          <div>
            <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
              {formatCurrency(donation.amount)} to {donation.campaign?.name}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {dayjs(donation.createdAt).fromNow()}
            </div>
          </div>
        ),
        dot: <CheckCircleOutlined style={{ color: '#10b981' }} />,
      }));
  };

  useEffect(() => {
    getData();
  }, []);

  const columns: ColumnsType<DonationWithProgress> = [
    {
      title: "Campaign",
      dataIndex: "campaign",
      key: "campaign",
      render: (_text: string, record: DonationWithProgress) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="small" 
            style={{ backgroundColor: '#2563eb', marginRight: '12px' }}
            icon={<TrophyOutlined />}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
              {record.campaign?.name || "Campaign Unavailable"}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '4px' }}>
              Target: {formatCurrency(record.campaign?.targetAmount || 0)}
            </div>
            <Progress 
              percent={record.campaignProgress || 0} 
              showInfo={false} 
              strokeColor="#10b981"
              trailColor="#f3f4f6"
              size="small"
            />
          </div>
        </div>
      ),
    },
    {
      title: "My Contribution",
      dataIndex: "amount",
      key: "amount",
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
      render: (_text: string, record: DonationWithProgress) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold', 
            color: '#059669',
            marginBottom: '4px'
          }}>
            {formatCurrency(record.amount)}
          </div>
          <Tag 
            color={record.amount >= 100 ? 'gold' : record.amount >= 50 ? 'blue' : 'green'}
            icon={record.amount >= 100 ? <StarFilled /> : <HeartOutlined />}
          >
            {record.amount >= 100 ? 'Major Donor' : record.amount >= 50 ? 'Supporter' : 'Contributor'}
          </Tag>
          {record.isRecentDonation && (
            <Tag color="volcano" icon={<ThunderboltOutlined />} style={{ marginTop: '4px' }}>
              Recent
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Payment Info",
      dataIndex: "paymentId",
      key: "paymentId",
      render: (paymentId: string) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CreditCardOutlined style={{ marginRight: '8px', color: '#6b7280' }} />
          <code style={{ 
            backgroundColor: '#f3f4f6', 
            padding: '6px 10px', 
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontFamily: 'monospace'
          }}>
            {paymentId}
          </code>
        </div>
      ),
    },
    {
      title: "Date & Time",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (_text: string, record: DonationWithProgress) => (
        <div>
          <div style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
            {dayjs(record.createdAt).format("MMM DD, YYYY")}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '4px' }}>
            {dayjs(record.createdAt).format("h:mm A")}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            {dayjs(record.createdAt).fromNow()}
          </div>
        </div>
      ),
    },
    {
      title: "My Message",
      dataIndex: "message",
      key: "message",
      width: 200,
      render: (message: string) => (
        <Tooltip title={message}>
          <div style={{ 
            maxWidth: '200px', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#6b7280',
            fontStyle: message ? 'normal' : 'italic'
          }}>
            {message || "No message provided"}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_text: string, record: DonationWithProgress) => (
        <Space>
          <Tooltip title="View Campaign">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              onClick={() => navigate(`/campaign/${record.campaign._id}`)}
              style={{ color: '#2563eb' }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <PageTitle title="My Donations" />
      
      {/* Welcome Message */}
      <Card style={{ 
        marginBottom: '32px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none'
      }}>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <h2 style={{ color: 'white', marginBottom: '8px' }}>
            💖 Thank you for making a difference!
          </h2>
          <p style={{ fontSize: '1.125rem', margin: 0, opacity: 0.9 }}>
            Your generosity has helped bring amazing projects to life
          </p>
        </div>
      </Card>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Contributed"
              value={stats.totalAmount}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarCircleOutlined style={{ color: '#059669' }} />}
              valueStyle={{ color: '#059669' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Donations Made"
              value={stats.totalCount}
              prefix={<GiftOutlined style={{ color: '#2563eb' }} />}
              valueStyle={{ color: '#2563eb' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Average Donation"
              value={stats.averageAmount}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<HeartOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Recent Donations"
              value={stats.recentDonations}
              prefix={<ClockCircleOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Favorite Campaign & Recent Activity */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} md={12}>
          {stats.favoriteCampaign && (
            <Card>
              <div style={{ textAlign: 'center' }}>
                <TrophyOutlined style={{ fontSize: '2rem', color: '#f59e0b', marginBottom: '16px' }} />
                <h3 style={{ margin: 0, marginBottom: '8px' }}>Most Supported Campaign</h3>
                <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>
                  {stats.favoriteCampaign}
                </p>
              </div>
            </Card>
          )}
        </Col>
        <Col xs={24} md={12}>
          <Card title="Recent Activity" style={{ height: '100%' }}>
            {getRecentDonationsTimeline().length > 0 ? (
              <Timeline items={getRecentDonationsTimeline()} />
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280' }}>
                <ClockCircleOutlined style={{ fontSize: '2rem', marginBottom: '8px' }} />
                <p>No recent donations</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>

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
              placeholder="Filter by campaign"
              style={{ width: '100%' }}
              value={selectedCampaign}
              onChange={handleCampaignFilter}
              allowClear
            >
              {getUniqueCampaigns().map(campaign => (
                <Option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={handleDateFilter}
              format="MMM DD, YYYY"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button
                icon={<FilterOutlined />}
                onClick={clearFilters}
              >
                Clear Filters
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

      {/* Member Since */}
      {stats.firstDonationDate && (
        <Card style={{ marginBottom: '24px', background: '#f8fafc', borderColor: '#e2e8f0' }}>
          <div style={{ textAlign: 'center' }}>
            <CalendarOutlined style={{ fontSize: '1.5rem', color: '#6b7280', marginRight: '8px' }} />
            <span style={{ color: '#6b7280' }}>
              Supporting projects since {dayjs(stats.firstDonationDate).format("MMMM YYYY")}
            </span>
          </div>
        </Card>
      )}

      {/* Donations Table */}
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px' 
        }}>
          <h3 style={{ margin: 0 }}>
            My Donation History ({filteredDonations.length})
          </h3>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={filteredDonations} 
          loading={loading}
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
                description={
                  <div>
                    <p>No donations found</p>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                      Start supporting amazing projects today!
                    </p>
                  </div>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}

export default DonationsPage;