import { Button, Image, message, Spin, Card, Progress, Row, Col, Statistic, Tag, Avatar, Space, Tabs, Timeline, Empty, Tooltip, Share } from "antd";
import PageTitle from "../../../components/page-title";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { CampaignTypeProps, DonationTypeProps } from "../../../interfaces";
import axios from "axios";
import DonationsCard from "./donations-card";
import { 
  ArrowLeftOutlined, 
  CalendarOutlined, 
  UserOutlined, 
  DollarCircleOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  ShareAltOutlined,
  HeartOutlined,
  EyeOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  GiftOutlined,
  CommentOutlined,
  EnvironmentOutlined,
  TagOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const { TabPane } = Tabs;

interface CampaignStats {
  progressPercentage: number;
  daysLeft: number;
  backersCount: number;
  donationsCount: number;
  averageDonation: number;
  lastDonationDate: string;
}

function CampaignInfoPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [campaignData, setCampaignData] = useState<CampaignTypeProps | null>(null);
  const [donations, setDonations] = useState<DonationTypeProps[]>([]);
  const [stats, setStats] = useState<CampaignStats>({
    progressPercentage: 0,
    daysLeft: 0,
    backersCount: 0,
    donationsCount: 0,
    averageDonation: 0,
    lastDonationDate: ""
  });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const params = useParams();

  const getData = async () => {
    try {
      setLoading(true);
      const [campaignResponse, donationsResponse] = await Promise.all([
        axios.get(`/api/campaigns/get/${params.id}`),
        axios.get(`/api/donations/get-all`)
      ]);
      
      const campaign = campaignResponse.data;
      const allDonations = donationsResponse.data || [];
      
      setCampaignData(campaign);
      
      // Filter donations for this campaign
      const campaignDonations = allDonations.filter(
        (donation: DonationTypeProps) => donation.campaign?._id === campaign._id
      );
      
      setDonations(campaignDonations);
      calculateStats(campaign, campaignDonations);
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (campaign: CampaignTypeProps, donationsData: DonationTypeProps[]) => {
    const progressPercentage = campaign.targetAmount > 0 
      ? Math.min(Math.round((campaign.collectedAmount / campaign.targetAmount) * 100), 100)
      : 0;
    
    const daysLeft = campaign.endDate 
      ? Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
    
    const uniqueBackers = new Set(donationsData.map(d => d.user?._id).filter(id => id));
    const backersCount = uniqueBackers.size;
    const donationsCount = donationsData.length;
    
    const averageDonation = donationsCount > 0 
      ? donationsData.reduce((sum, d) => sum + d.amount, 0) / donationsCount
      : 0;
    
    const lastDonationDate = donationsData.length > 0
      ? donationsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
      : "";

    setStats({
      progressPercentage,
      daysLeft,
      backersCount,
      donationsCount,
      averageDonation,
      lastDonationDate
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusColor = () => {
    if (stats.daysLeft === 0) return '#ef4444';
    if (stats.progressPercentage >= 100) return '#10b981';
    if (stats.progressPercentage >= 75) return '#f59e0b';
    return '#2563eb';
  };

  const getStatusText = () => {
    if (stats.progressPercentage >= 100) return 'Funded';
    if (stats.daysLeft === 0) return 'Ended';
    return 'Active';
  };

  const shareUrl = () => {
    if (navigator.share) {
      navigator.share({
        title: campaignData?.name,
        text: campaignData?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      message.success('Campaign link copied to clipboard!');
    }
  };

  useEffect(() => {
    getData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!campaignData) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Empty description="Campaign not found" />
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
        color: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/")}
              style={{ color: 'white', borderColor: 'white' }}
              ghost
            >
              Back to Campaigns
            </Button>
            <Space>
              <Button 
                icon={<ShareAltOutlined />}
                onClick={shareUrl}
                style={{ color: 'white', borderColor: 'white' }}
                ghost
              >
                Share
              </Button>
              <Tag color={getStatusColor()} style={{ fontSize: '14px', padding: '4px 12px' }}>
                {getStatusText()}
              </Tag>
            </Space>
          </div>
          <h1 style={{ 
            color: 'white', 
            margin: 0, 
            fontSize: '2.5rem', 
            fontWeight: 'bold' 
          }}>
            {campaignData.name}
          </h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.8)', 
            margin: '8px 0 0 0',
            fontSize: '1.125rem'
          }}>
            by {campaignData.organizer}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ 
        background: 'white', 
        padding: '24px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                {formatCurrency(campaignData.collectedAmount)} raised
              </span>
              <span style={{ fontSize: '1rem', color: '#6b7280' }}>
                {stats.progressPercentage}% of {formatCurrency(campaignData.targetAmount)} goal
              </span>
            </div>
            <Progress 
              percent={stats.progressPercentage}
              strokeColor={{
                '0%': '#667eea',
                '100%': '#764ba2',
              }}
              strokeWidth={8}
              showInfo={false}
            />
          </div>
          
          <Row gutter={[24, 16]}>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#2563eb' }}>
                  {stats.backersCount}
                </div>
                <div style={{ color: '#6b7280' }}>Backers</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981' }}>
                  {stats.daysLeft}
                </div>
                <div style={{ color: '#6b7280' }}>Days Left</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {formatCurrency(stats.averageDonation)}
                </div>
                <div style={{ color: '#6b7280' }}>Avg Donation</div>
              </div>
            </Col>
            <Col xs={12} sm={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                  {stats.donationsCount}
                </div>
                <div style={{ color: '#6b7280' }}>Donations</div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '32px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Row gutter={[32, 32]}>
            {/* Left Column - Images and Details */}
            <Col xs={24} lg={16}>
              {/* Main Image */}
              <Card style={{ marginBottom: '24px' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={campaignData.images[activeImageIndex]}
                    alt={campaignData.name}
                    style={{ 
                      width: '100%', 
                      height: '400px', 
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    fontSize: '0.875rem'
                  }}>
                    <EyeOutlined style={{ marginRight: '4px' }} />
                    {activeImageIndex + 1} of {campaignData.images.length}
                  </div>
                </div>
              </Card>

              {/* Image Gallery */}
              {campaignData.images.length > 1 && (
                <Card style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                    {campaignData.images.map((image, index) => (
                      <div 
                        key={index}
                        style={{
                          minWidth: '100px',
                          height: '80px',
                          cursor: 'pointer',
                          border: activeImageIndex === index ? '3px solid #2563eb' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}
                        onClick={() => setActiveImageIndex(index)}
                      >
                        <img
                          src={image}
                          alt={`${campaignData.name} ${index + 1}`}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover' 
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Campaign Details Tabs */}
              <Card>
                <Tabs defaultActiveKey="1" size="large">
                  <TabPane tab="Story" key="1">
                    <div style={{ 
                      fontSize: '1.125rem', 
                      lineHeight: '1.8',
                      color: '#374151',
                      padding: '16px 0'
                    }}>
                      {campaignData.description}
                    </div>
                  </TabPane>
                  
                  <TabPane tab={`Updates (${donations.length > 0 ? '3' : '0'})`} key="2">
                    <Timeline style={{ padding: '16px 0' }}>
                      <Timeline.Item 
                        dot={<TrophyOutlined style={{ color: '#2563eb' }} />}
                        color="blue"
                      >
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Campaign Launched</strong>
                          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                            {dayjs(campaignData.createdAt).format('MMMM DD, YYYY')}
                          </div>
                        </div>
                        <p style={{ color: '#6b7280' }}>
                          We're excited to share our vision with the world and start this journey together.
                        </p>
                      </Timeline.Item>
                      
                      {stats.lastDonationDate && (
                        <Timeline.Item 
                          dot={<HeartOutlined style={{ color: '#10b981' }} />}
                          color="green"
                        >
                          <div style={{ marginBottom: '8px' }}>
                            <strong>Latest Donation Received</strong>
                            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                              {dayjs(stats.lastDonationDate).format('MMMM DD, YYYY')}
                            </div>
                          </div>
                          <p style={{ color: '#6b7280' }}>
                            Thank you to all our amazing backers for your continued support!
                          </p>
                        </Timeline.Item>
                      )}
                      
                      {stats.progressPercentage >= 50 && (
                        <Timeline.Item 
                          dot={<StarOutlined style={{ color: '#f59e0b' }} />}
                          color="orange"
                        >
                          <div style={{ marginBottom: '8px' }}>
                            <strong>Milestone Reached</strong>
                            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                              50% of goal achieved
                            </div>
                          </div>
                          <p style={{ color: '#6b7280' }}>
                            We're halfway there! Thank you for believing in our mission.
                          </p>
                        </Timeline.Item>
                      )}
                    </Timeline>
                  </TabPane>
                  
                  <TabPane tab={`Backers (${stats.backersCount})`} key="3">
                    <div style={{ padding: '16px 0' }}>
                      {donations.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {donations.slice(0, 10).map((donation, index) => (
                            <Card key={index} size="small">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar 
                                    size={40} 
                                    style={{ backgroundColor: '#2563eb', marginRight: '12px' }}
                                    icon={<UserOutlined />}
                                  />
                                  <div>
                                    <div style={{ fontWeight: 'bold' }}>
                                      {donation.user?.name || 'Anonymous'}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                      {dayjs(donation.createdAt).format('MMM DD, YYYY')}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontWeight: 'bold', color: '#10b981' }}>
                                    {formatCurrency(donation.amount)}
                                  </div>
                                  {donation.message && (
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                                      "{donation.message}"
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Empty description="No backers yet" />
                      )}
                    </div>
                  </TabPane>
                </Tabs>
              </Card>
            </Col>

            {/* Right Column - Donation Card */}
            <Col xs={24} lg={8}>
              <div style={{ position: 'sticky', top: '24px' }}>
                <DonationsCard
                  campaignData={campaignData}
                  reloadCampaignData={getData}
                />
                
                {/* Campaign Info Card */}
                <Card style={{ marginTop: '24px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: '#1f2937' }}>Campaign Details</h3>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <UserOutlined style={{ marginRight: '8px', color: '#6b7280' }} />
                      <span style={{ color: '#6b7280' }}>Organizer:</span>
                      <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                        {campaignData.organizer}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarOutlined style={{ marginRight: '8px', color: '#6b7280' }} />
                      <span style={{ color: '#6b7280' }}>Created:</span>
                      <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                        {dayjs(campaignData.createdAt).format('MMM DD, YYYY')}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <ClockCircleOutlined style={{ marginRight: '8px', color: '#6b7280' }} />
                      <span style={{ color: '#6b7280' }}>Ends:</span>
                      <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                        {dayjs(campaignData.endDate).format('MMM DD, YYYY')}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <SafetyCertificateOutlined style={{ marginRight: '8px', color: '#6b7280' }} />
                      <span style={{ color: '#6b7280' }}>Status:</span>
                      <Tag 
                        color={getStatusColor()} 
                        style={{ marginLeft: '8px' }}
                      >
                        {getStatusText()}
                      </Tag>
                    </div>
                  </div>
                </Card>

                {/* Trust & Safety Card */}
                <Card style={{ marginTop: '24px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: '#1f2937' }}>Trust & Safety</h3>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <SafetyCertificateOutlined style={{ marginRight: '8px', color: '#10b981' }} />
                      <span style={{ color: '#374151' }}>Verified Campaign</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <StarOutlined style={{ marginRight: '8px', color: '#f59e0b' }} />
                      <span style={{ color: '#374151' }}>Featured Project</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <GiftOutlined style={{ marginRight: '8px', color: '#8b5cf6' }} />
                      <span style={{ color: '#374151' }}>Rewards Available</span>
                    </div>
                  </div>
                </Card>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
}

export default CampaignInfoPage;