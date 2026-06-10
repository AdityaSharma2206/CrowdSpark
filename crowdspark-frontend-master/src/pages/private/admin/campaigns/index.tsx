// frontend/src/pages/private/admin/campaigns/index.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../../../components/page-title";
import { CampaignTypeProps } from "../../../../interfaces";
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
  Modal,
  Progress,
  Popconfirm
} from "antd";
import { 
  DollarCircleOutlined, 
  CalendarOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  EyeOutlined,
  TrophyOutlined,
  TeamOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  FireOutlined,
  BarChartOutlined
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import type { ColumnsType } from 'antd/es/table';
import CampaignDonations from "./campaign-donations";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalTarget: number;
  totalCollected: number;
  avgProgress: number;
  completedCampaigns: number;
}

function CampaignsPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignTypeProps[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<CampaignTypeProps[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignTypeProps | null>(null);
  const [showCampaignDonations, setShowCampaignDonations] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [stats, setStats] = useState<CampaignStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalTarget: 0,
    totalCollected: 0,
    avgProgress: 0,
    completedCampaigns: 0
  });

  const getData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/campaigns/get-all");
      const campaignsData = response.data || [];
      setCampaigns(campaignsData);
      setFilteredCampaigns(campaignsData);
      calculateStats(campaignsData);
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (campaignsData: CampaignTypeProps[]) => {
    if (!campaignsData || campaignsData.length === 0) {
      return;
    }

    const totalCampaigns = campaignsData.length;
    const activeCampaigns = campaignsData.filter(c => c.isActive).length;
    const totalTarget = campaignsData.reduce((sum, c) => sum + (c.targetAmount || 0), 0);
    const totalCollected = campaignsData.reduce((sum, c) => sum + (c.collectedAmount || 0), 0);
    const completedCampaigns = campaignsData.filter(c => 
      (c.collectedAmount || 0) >= (c.targetAmount || 0)
    ).length;
    
    // Calculate average progress
    const avgProgress = campaignsData.length > 0 
      ? campaignsData.reduce((sum, c) => {
          const progress = c.targetAmount ? (c.collectedAmount || 0) / c.targetAmount * 100 : 0;
          return sum + Math.min(progress, 100);
        }, 0) / campaignsData.length
      : 0;

    setStats({
      totalCampaigns,
      activeCampaigns,
      totalTarget,
      totalCollected,
      avgProgress,
      completedCampaigns
    });
  };

  const onDelete = async (id: string) => {
    try {
      setLoading(true);
      await axios.delete(`/api/campaigns/delete/${id}`);
      message.success("Campaign deleted successfully");
      getData();
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
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
    let filtered = [...campaigns];

    // Search filter
    if (search) {
      filtered = filtered.filter(campaign => 
        campaign.name?.toLowerCase().includes(search.toLowerCase()) ||
        campaign.organizer?.toLowerCase().includes(search.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (status) {
      if (status === 'active') {
        filtered = filtered.filter(campaign => campaign.isActive);
      } else if (status === 'inactive') {
        filtered = filtered.filter(campaign => !campaign.isActive);
      } else if (status === 'completed') {
        filtered = filtered.filter(campaign => 
          (campaign.collectedAmount || 0) >= (campaign.targetAmount || 0)
        );
      } else if (status === 'ongoing') {
        filtered = filtered.filter(campaign => 
          campaign.isActive && (campaign.collectedAmount || 0) < (campaign.targetAmount || 0)
        );
      }
    }

    // Date filter
    if (dates && dates[0] && dates[1]) {
      filtered = filtered.filter(campaign => {
        const campaignDate = dayjs(campaign.createdAt);
        return campaignDate.isAfter(dates[0]) && campaignDate.isBefore(dates[1]);
      });
    }

    setFilteredCampaigns(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDateRange(null);
    setFilteredCampaigns(campaigns);
  };

  const exportData = () => {
    const csvContent = [
      ['Name', 'Organizer', 'Target Amount', 'Collected Amount', 'Progress %', 'Status', 'Created Date'],
      ...filteredCampaigns.map(campaign => [
        campaign.name || 'N/A',
        campaign.organizer || 'N/A',
        campaign.targetAmount || 0,
        campaign.collectedAmount || 0,
        campaign.targetAmount ? Math.round((campaign.collectedAmount || 0) / campaign.targetAmount * 100) : 0,
        campaign.isActive ? 'Active' : 'Inactive',
        dayjs(campaign.createdAt).format('YYYY-MM-DD HH:mm:ss')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaigns-${dayjs().format('YYYY-MM-DD')}.csv`;
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

  const getProgressPercentage = (collected: number, target: number) => {
    if (!target || target === 0) return 0;
    return Math.min(Math.round((collected / target) * 100), 100);
  };

  const getDaysLeft = (endDate: string) => {
    if (!endDate) return 0;
    const end = dayjs(endDate);
    const now = dayjs();
    const diff = end.diff(now, 'day');
    return diff > 0 ? diff : 0;
  };

  const getCampaignStatus = (campaign: CampaignTypeProps) => {
    const progress = getProgressPercentage(campaign.collectedAmount || 0, campaign.targetAmount || 0);
    const isCompleted = progress >= 100;
    const isActive = campaign.isActive;
    
    if (isCompleted) return { status: 'Completed', color: 'success' };
    if (isActive) return { status: 'Active', color: 'processing' };
    return { status: 'Inactive', color: 'default' };
  };

  useEffect(() => {
    getData();
  }, []);

  const columns: ColumnsType<CampaignTypeProps> = [
    {
      title: "Campaign",
      dataIndex: "name",
      key: "name",
      render: (_text: string, record: CampaignTypeProps) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="large" 
            style={{ backgroundColor: '#2563eb', marginRight: '12px' }}
            icon={<TrophyOutlined />}
          />
          <div>
            <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '1rem' }}>
              {record.name || "Untitled Campaign"}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              by {record.organizer || "Unknown"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Target vs Collected",
      key: "amounts",
      render: (_text: string, record: CampaignTypeProps) => {
        const progress = getProgressPercentage(record.collectedAmount || 0, record.targetAmount || 0);
        return (
          <div style={{ minWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                {formatCurrency(record.collectedAmount || 0)}
              </span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {progress}%
              </span>
            </div>
            <Progress 
              percent={progress}
              showInfo={false}
              strokeColor={progress >= 100 ? '#10b981' : progress >= 75 ? '#f59e0b' : '#2563eb'}
            />
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
              of {formatCurrency(record.targetAmount || 0)} goal
            </div>
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_text: string, record: CampaignTypeProps) => {
        const { status, color } = getCampaignStatus(record);
        return (
          <div>
            <Tag color={color} style={{ marginBottom: '4px' }}>
              {status}
            </Tag>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              <ClockCircleOutlined style={{ marginRight: '4px' }} />
              {getDaysLeft(record.endDate)} days left
            </div>
          </div>
        );
      },
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (_text: string, record: CampaignTypeProps) => (
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
      title: "Actions",
      key: "actions",
      render: (_text: string, record: CampaignTypeProps) => (
        <Space>
          <Tooltip title="View Campaign">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              onClick={() => navigate(`/campaign/${record._id}`)}
              style={{ color: '#2563eb' }}
            />
          </Tooltip>
          <Tooltip title="View Donations">
            <Button
              type="text"
              icon={<BarChartOutlined />}
              onClick={() => {
                setSelectedCampaign(record);
                setShowCampaignDonations(true);
              }}
              style={{ color: '#10b981' }}
            />
          </Tooltip>
          <Tooltip title="Edit Campaign">
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => navigate(`/admin/campaigns/edit/${record._id}`)}
              style={{ color: '#f59e0b' }}
            />
          </Tooltip>
          <Tooltip title="Delete Campaign">
            <Popconfirm
              title="Are you sure you want to delete this campaign?"
              description="This action cannot be undone."
              onConfirm={() => onDelete(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                type="text" 
                icon={<DeleteOutlined />}
                style={{ color: '#ef4444' }}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <PageTitle title="Campaigns Management" />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate("/admin/campaigns/create")}
          size="large"
        >
          Create Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total Campaigns"
              value={stats.totalCampaigns}
              prefix={<TrophyOutlined style={{ color: '#2563eb' }} />}
              valueStyle={{ color: '#2563eb' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Active Campaigns"
              value={stats.activeCampaigns}
              prefix={<FireOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total Target"
              value={stats.totalTarget}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarCircleOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total Raised"
              value={stats.totalCollected}
              formatter={(value) => formatCurrency(Number(value))}
              prefix={<DollarCircleOutlined style={{ color: '#059669' }} />}
              valueStyle={{ color: '#059669' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Avg Progress"
              value={stats.avgProgress}
              formatter={(value) => `${Number(value).toFixed(1)}%`}
              prefix={<BarChartOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completedCampaigns}
              prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search campaigns..."
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
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="completed">Completed</Option>
              <Option value="ongoing">Ongoing</Option>
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

      {/* Success Rate Card */}
      <Card style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <h3 style={{ color: 'white', marginBottom: '8px' }}>
            📊 Platform Performance
          </h3>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {stats.totalCampaigns > 0 ? Math.round((stats.completedCampaigns / stats.totalCampaigns) * 100) : 0}%
              </div>
              <div>Success Rate</div>
            </Col>
            <Col span={8}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {formatCurrency(stats.totalCollected)}
              </div>
              <div>Total Raised</div>
            </Col>
            <Col span={8}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {stats.totalCampaigns > 0 ? formatCurrency(stats.totalCollected / stats.totalCampaigns) : '$0'}
              </div>
              <div>Avg per Campaign</div>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px' 
        }}>
          <h3 style={{ margin: 0 }}>
            All Campaigns ({filteredCampaigns.length})
          </h3>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={filteredCampaigns} 
          loading={loading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} campaigns`,
          }}
          locale={{
            emptyText: (
              <Empty 
                description="No campaigns found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {showCampaignDonations && (
        <CampaignDonations
          open={showCampaignDonations}
          setOpen={setShowCampaignDonations}
          selectedCampaign={selectedCampaign as CampaignTypeProps}
        />
      )}
    </div>
  );
}

export default CampaignsPage;