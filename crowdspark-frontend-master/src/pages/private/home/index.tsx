// src/pages/private/home/index.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { message, Progress, Spin, Card, Button, Row, Col, Statistic } from "antd";
import { CampaignTypeProps, DonationTypeProps } from "../../../interfaces";
import { 
  ClockCircleOutlined, 
  UserOutlined, 
  DollarCircleOutlined,
  ProjectOutlined,
  TeamOutlined,
  TrophyOutlined
} from "@ant-design/icons";

const { Meta } = Card;

interface PlatformStats {
  totalRaised: number;
  projectsFunded: number;
  activeBackers: number;
  successRate: number;
}

interface CampaignWithBackers extends CampaignTypeProps {
  backersCount: number;
  donationsCount: number;
}

function Homepage() {
  const [campaigns, setCampaigns] = useState<CampaignWithBackers[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PlatformStats>({
    totalRaised: 0,
    projectsFunded: 0,
    activeBackers: 0,
    successRate: 0
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  // Get current user info
  const getCurrentUser = async () => {
    try {
      const response = await axios.get("/api/users/get-current-user");
      setCurrentUser(response.data);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  // Determine the correct route based on user role
  const getCampaignCreateRoute = () => {
    if (currentUser?.role === 'admin') {
      return "/admin/campaigns/create";
    } else {
      return "/user/campaigns/create";
    }
  };

  // Handle navigation to campaign creation
  const handleStartCampaign = () => {
    navigate(getCampaignCreateRoute());
  };

  const getData = async () => {
    try {
      setLoading(true);
      
      // First get campaigns
      const campaignsResponse = await axios.get("/api/campaigns/get-all");
      const campaignsData: CampaignTypeProps[] = campaignsResponse.data;
      
      // Then get donations with error handling
      let donationsData: DonationTypeProps[] = [];
      try {
        const donationsResponse = await axios.get("/api/donations/get-all");
        donationsData = donationsResponse.data || [];
      } catch (donationError) {
        console.warn("Could not fetch donations:", donationError);
        // Continue with empty donations array
      }
      
      // Filter out donations with null/undefined campaign or user references
      const validDonations = donationsData.filter(donation => 
        donation && 
        donation.campaign && 
        donation.campaign._id && 
        donation.user && 
        donation.user._id
      );
      
      // Add backer counts to campaigns
      const campaignsWithBackers: CampaignWithBackers[] = campaignsData.map((campaign: CampaignTypeProps) => {
        if (!campaign || !campaign._id) {
          return {
            ...campaign,
            backersCount: 0,
            donationsCount: 0
          };
        }
        
        const campaignDonations = validDonations.filter(d => 
          d.campaign._id === campaign._id
        );
        
        const uniqueBackers = new Set(
          campaignDonations.map(d => d.user._id).filter(id => id)
        );
        
        return {
          ...campaign,
          backersCount: uniqueBackers.size,
          donationsCount: campaignDonations.length
        };
      });
      
      setCampaigns(campaignsWithBackers);
      calculateStats(campaignsWithBackers, validDonations);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      message.error("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (campaignData: CampaignWithBackers[], donationsData: DonationTypeProps[]) => {
    if (!campaignData || campaignData.length === 0) {
      setStats({
        totalRaised: 0,
        projectsFunded: 0,
        activeBackers: 0,
        successRate: 0
      });
      return;
    }

    // Calculate total funds raised
    const totalRaised = campaignData.reduce((sum, campaign) => {
      return sum + (campaign.collectedAmount || 0);
    }, 0);

    // Calculate projects funded (campaigns that reached their goal)
    const projectsFunded = campaignData.filter(
      campaign => (campaign.collectedAmount || 0) >= (campaign.targetAmount || 0)
    ).length;

    // Calculate total unique backers across all campaigns
    const allUniqueBackers = new Set(
      donationsData
        .filter(d => d && d.user && d.user._id)
        .map(d => d.user._id)
    );
    const totalUniqueBackers = allUniqueBackers.size;

    // Calculate success rate
    const successRate = campaignData.length > 0 
      ? Math.round((projectsFunded / campaignData.length) * 100)
      : 0;

    setStats({
      totalRaised,
      projectsFunded,
      activeBackers: totalUniqueBackers,
      successRate
    });
  };

  useEffect(() => {
    getCurrentUser();
    getData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const calculateDaysLeft = (endDate: string) => {
    if (!endDate) return 0;
    
    const end = new Date(endDate);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(end.getTime())) return 0;
    
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getBackersCount = (campaign: CampaignWithBackers) => {
    return campaign.backersCount || 0;
  };

  const getProgressPercentage = (collected: number, target: number) => {
    if (!target || target === 0) return 0;
    return Math.min(Math.round((collected / target) * 100), 100);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)' }}>
      {/* Hero Section */}
      <div style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          color: '#1f2937', 
          marginBottom: '24px',
          lineHeight: '1.2'
        }}>
          Igniting Ideas, <span style={{ color: '#2563eb' }}>Fueling Innovation</span>
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          color: '#6b7280', 
          marginBottom: '16px',
          maxWidth: '800px',
          margin: '0 auto 16px'
        }}>
          Connect with a global network of backers to bring your creative projects, 
          innovative products, and social causes to life.
        </p>
        <p style={{ 
          fontSize: '1.125rem', 
          color: '#2563eb', 
          fontStyle: 'italic',
          marginBottom: '32px',
          maxWidth: '600px',
          margin: '0 auto 32px'
        }}>
          "The spark of change begins when we give others the power to create."
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            type="primary" 
            size="large"
            onClick={handleStartCampaign}
            style={{ 
              height: '48px', 
              fontSize: '1.125rem',
              paddingLeft: '32px',
              paddingRight: '32px'
            }}
          >
            Start Your Campaign
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div style={{ padding: '64px 20px', backgroundColor: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Row gutter={[32, 32]}>
            <Col xs={24} sm={12} md={6}>
              <Statistic 
                title="Funds Raised" 
                value={stats.totalRaised} 
                formatter={(value) => `$${Number(value || 0).toLocaleString()}`}
                valueStyle={{ color: '#2563eb', fontSize: '2rem' }}
                prefix={<DollarCircleOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic 
                title="Total Projects" 
                value={campaigns.length} 
                valueStyle={{ color: '#2563eb', fontSize: '2rem' }}
                prefix={<ProjectOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic 
                title="Active Backers" 
                value={stats.activeBackers} 
                valueStyle={{ color: '#2563eb', fontSize: '2rem' }}
                prefix={<TeamOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic 
                title="Success Rate" 
                value={stats.successRate} 
                suffix="%"
                valueStyle={{ color: '#2563eb', fontSize: '2rem' }}
                prefix={<TrophyOutlined />}
              />
            </Col>
          </Row>
        </div>
      </div>

      {/* All Projects Section */}
      <div style={{ padding: '64px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '32px' 
          }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              All Projects
            </h2>
            <span style={{ color: '#6b7280' }}>
              {campaigns.length} projects available
            </span>
          </div>
          
          {campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
                No campaigns available at the moment.
              </p>
              <Button 
                type="primary" 
                size="large"
                onClick={handleStartCampaign}
                style={{ marginTop: '16px' }}
              >
                Create Your First Campaign
              </Button>
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {campaigns.map((campaign) => (
                <Col xs={24} md={12} lg={8} key={campaign._id}>
                  <Card
                    hoverable
                    cover={
                      campaign.images && campaign.images.length > 0 ? (
                        <img
                          alt={campaign.name || 'Campaign'}
                          src={campaign.images[0]}
                          style={{ height: '200px', objectFit: 'cover' }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div style={{ 
                          height: '200px', 
                          backgroundColor: '#f0f0f0', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: '#999'
                        }}>
                          No Image Available
                        </div>
                      )
                    }
                    onClick={() => navigate(`/campaign/${campaign._id}`)}
                    style={{ height: '100%' }}
                  >
                    <Meta
                      title={campaign.name || 'Untitled Campaign'}
                      description={
                        <div>
                          <p style={{ marginBottom: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
                            {campaign.description || 'No description available'}
                          </p>
                          <p style={{ marginBottom: '16px', fontSize: '0.875rem', color: '#9ca3af' }}>
                            by {campaign.organizer || 'Unknown'}
                          </p>
                          
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              marginBottom: '8px',
                              fontSize: '0.875rem'
                            }}>
                              <span style={{ fontWeight: 'bold' }}>
                                {formatCurrency(campaign.collectedAmount || 0)} raised
                              </span>
                              <span style={{ color: '#6b7280' }}>
                                {getProgressPercentage(campaign.collectedAmount || 0, campaign.targetAmount || 0)}%
                              </span>
                            </div>
                            <Progress 
                              percent={getProgressPercentage(campaign.collectedAmount || 0, campaign.targetAmount || 0)}
                              showInfo={false}
                              strokeColor="#2563eb"
                            />
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
                              of {formatCurrency(campaign.targetAmount || 0)} goal
                            </div>
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            fontSize: '0.875rem',
                            color: '#6b7280'
                          }}>
                            <span>
                              <UserOutlined style={{ marginRight: '4px' }} />
                              {getBackersCount(campaign)} backers
                            </span>
                            <span>
                              <ClockCircleOutlined style={{ marginRight: '4px' }} />
                              {calculateDaysLeft(campaign.endDate)} days left
                            </span>
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ 
        padding: '80px 20px', 
        backgroundColor: '#2563eb',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '24px' 
          }}>
            Ready to Bring Your Idea to Life?
          </h2>
          <p style={{ 
            fontSize: '1.25rem', 
            color: '#bfdbfe', 
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px'
          }}>
            Join thousands of creators who have successfully funded their projects on CrowdSpark.
          </p>
          <Button 
            type="default"
            size="large"
            onClick={handleStartCampaign}
            style={{ 
              height: '48px', 
              fontSize: '1.125rem',
              paddingLeft: '32px',
              paddingRight: '32px',
              backgroundColor: 'white',
              color: '#2563eb',
              border: 'none'
            }}
          >
            Start Your Campaign Today
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Homepage;