// frontend/src/pages/private/admin/donations/index.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/page-title";
import { DonationTypeProps } from "../../../../interfaces";
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
  Empty
} from "antd";
import { 
  DollarCircleOutlined, 
  UserOutlined, 
  CalendarOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  TrophyOutlined,
  TeamOutlined,
  CreditCardOutlined
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface DonationStats {
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
  topCampaign: string;
  recentDonations: number;
}

function AdminDonationsPage() {
  const [donations, setDonations] = useState<DonationTypeProps[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<DonationTypeProps[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [stats, setStats] = useState<DonationStats>({
    totalAmount: 0,
    totalCount: 0,
    averageAmount: 0,
    topCampaign: "",
    recentDonations: 0
  });
  const navigate = useNavigate();

  const getData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/donations/get-all`);
      const donationsData = response.data || [];
      setDonations(donationsData);
      setFilteredDonations(donationsData);
      calculateStats(donationsData);
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (donationsData: DonationTypeProps[]) => {
    if (!donationsData || donationsData.length === 0) {
      return;
    }

    const totalAmount = donationsData.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    const totalCount = donationsData.length;
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;

    // Find top campaign by total donations
    const campaignTotals = donationsData.reduce((acc: { [key: string]: number }, donation) => {
      if (donation.campaign?.name) {
        acc[donation.campaign.name] = (acc[donation.campaign.name] || 0) + donation.amount;
      }
      return acc;
    }, {});

    const topCampaign = Object.keys(campaignTotals).reduce((a, b) => 
      campaignTotals[a] > campaignTotals[b] ? a : b, ""
    );

    // Count recent donations (last 7 days)
    const sevenDaysAgo = dayjs().subtract(7, 'day');
    const recentDonations = donationsData.filter(donation => 
      dayjs(donation.createdAt).isAfter(sevenDaysAgo)
    ).length;

    setStats({
      totalAmount,
      totalCount,
      averageAmount,
      topCampaign,
      recentDonations
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

    // Search filter
    if (search) {
      filtered = filtered.filter(donation => 
        donation.campaign?.name?.toLowerCase().includes(search.toLowerCase()) ||
        donation.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        donation.paymentId?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Campaign filter
    if (campaign) {
      filtered = filtered.filter(donation => donation.campaign?._id === campaign);
    }

    // Date filter
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
      ['Campaign', 'Donor', 'Amount', 'Payment ID', 'Date', 'Message'],
      ...filteredDonations.map(donation => [
        donation.campaign?.name || 'N/A',
        donation.user?.name || 'N/A',
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
    a.download = `donations-${dayjs().format('YYYY-MM-DD')}.csv`;
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
              Target: {formatCurrency(record.campaign?.targetAmount || 0)}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Donor",
      dataIndex: "user",
      key: "user",
      render: (_text: string, record: DonationTypeProps) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="small" 
            style={{ backgroundColor: '#10b981', marginRight: '8px' }}
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
              {record.user?.name || "User Unavailable"}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {record.user?.email || "Email not available"}
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CreditCardOutlined style={{ marginRight: '8px', color: '#6b7280' }} />
          <code style={{ 
            backgroundColor: '#f3f4f6', 
            padding: '4px 8px', 
            borderRadius: '4px',
            fontSize: '0.875rem'
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
      width: 200,
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
      <PageTitle title="Donations Management" />
      
      {/* Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Donations"
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
              title="Number of Donations"
              value={stats.totalCount}
              prefix={<TeamOutlined style={{ color: '#2563eb' }} />}
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
              prefix={<TrophyOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Recent (7 days)"
              value={stats.recentDonations}
              prefix={<CalendarOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#8b5cf6' }}
            />
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
                Export CSV
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Top Campaign Info */}
      {stats.topCampaign && (
        <Card style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div style={{ color: 'white', textAlign: 'center' }}>
            <h3 style={{ color: 'white', marginBottom: '8px' }}>🏆 Top Performing Campaign</h3>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
              {stats.topCampaign}
            </p>
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
            All Donations ({filteredDonations.length})
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
                description="No donations found"
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

export default AdminDonationsPage;