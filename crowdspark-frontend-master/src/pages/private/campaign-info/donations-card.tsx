import {
  Button,
  Input,
  InputNumber,
  Progress,
  message as antdMessage,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Avatar,
  Tooltip,
  Tag,
  Divider,
  Badge,
} from "antd";
import { CampaignTypeProps } from "../../../interfaces";
import { useState, useEffect } from "react";
import axios from "axios";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./checkout-form";
import {
  HeartOutlined,
  FireOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  DollarCircleOutlined,
  ThunderboltOutlined,
  GiftOutlined,
  StarOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function DonationsCard({
  campaignData,
  reloadCampaignData,
}: {
  campaignData: CampaignTypeProps;
  reloadCampaignData: () => void;
}) {
  const [amount, setAmount] = useState(25);
  const [message, setMessage] = useState("");
  const [clientSecretToken, setClientSecretToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [selectedQuickAmount, setSelectedQuickAmount] = useState(25);
  const [recentDonations, setRecentDonations] = useState(0);

  const quickAmounts = [10, 25, 50, 100, 250, 500];
  const progressPercent = Number(
    ((campaignData.collectedAmount / campaignData.targetAmount) * 100).toFixed(2)
  );

  const daysLeft = () => {
    if (!campaignData.endDate) return 0;
    const end = new Date(campaignData.endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressColor = () => {
    if (progressPercent >= 100) return "#52c41a";
    if (progressPercent >= 75) return "#faad14";
    if (progressPercent >= 50) return "#1890ff";
    return "#722ed1";
  };

  const getImpactMessage = (amount: number) => {
    if (amount >= 500) return "🚀 Superstar Supporter!";
    if (amount >= 250) return "⭐ Major Contributor!";
    if (amount >= 100) return "💎 Premium Backer!";
    if (amount >= 50) return "🔥 Power Supporter!";
    if (amount >= 25) return "💪 Great Supporter!";
    return "❤️ Every dollar counts!";
  };

  const getClientSecretToken = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/payments/create-payment-intent", {
        amount,
      });
      setClientSecretToken(response.data.clientSecret);
      setShowCheckoutForm(true);
    } catch (error: any) {
      antdMessage.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmountSelect = (value: number) => {
    setAmount(value);
    setSelectedQuickAmount(value);
  };

  const handleCustomAmountChange = (value: number) => {
    setAmount(value);
    setSelectedQuickAmount(0); // Reset quick selection when custom amount is entered
  };

  useEffect(() => {
    // Simulate recent donations count for engagement
    setRecentDonations(Math.floor(Math.random() * 15) + 5);
  }, []);

  const options = {
    clientSecret: clientSecretToken,
  };

  return (
    <Card
      className="donation-card"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        border: "none",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      }}
    >
      {/* Campaign Stats Header */}
      <div style={{ 
        background: "rgba(255,255,255,0.95)", 
        margin: "-24px -24px 24px -24px",
        padding: "20px 24px",
        backdropFilter: "blur(10px)"
      }}>
        <Row gutter={[16, 8]} align="middle">
          <Col span={12}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Avatar size="small" style={{ backgroundColor: "#52c41a" }} icon={<DollarCircleOutlined />} />
              <div>
                <Text strong style={{ fontSize: "18px", color: "#1f2937" }}>
                  {formatCurrency(campaignData.collectedAmount)}
                </Text>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  raised of {formatCurrency(campaignData.targetAmount)}
                </div>
              </div>
            </div>
          </Col>
          <Col span={12} style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
              <Avatar size="small" style={{ backgroundColor: "#722ed1" }} icon={<ClockCircleOutlined />} />
              <div>
                <Text strong style={{ fontSize: "18px", color: "#1f2937" }}>
                  {daysLeft()}
                </Text>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  days left
                </div>
              </div>
            </div>
          </Col>
        </Row>
        
        <div style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <Text style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
              {progressPercent}% funded
            </Text>
            <Badge count={recentDonations} size="small" style={{ backgroundColor: "#f59e0b" }}>
              <TeamOutlined style={{ color: "#6b7280" }} />
            </Badge>
          </div>
          <Progress
            percent={progressPercent}
            showInfo={false}
            strokeColor={getProgressColor()}
            trailColor="#e5e7eb"
            strokeWidth={8}
            style={{ marginBottom: "8px" }}
          />
          <Text style={{ fontSize: "12px", color: "#6b7280" }}>
            {recentDonations} people donated recently
          </Text>
        </div>
      </div>

      {/* Quick Amount Selection */}
      <div style={{ marginBottom: "24px" }}>
        <Text strong style={{ color: "white", fontSize: "16px", marginBottom: "12px", display: "block" }}>
          <GiftOutlined style={{ marginRight: "8px" }} />
          Choose Your Impact
        </Text>
        <Row gutter={[8, 8]}>
          {quickAmounts.map((quickAmount) => (
            <Col span={8} key={quickAmount}>
              <Button
                type={selectedQuickAmount === quickAmount ? "primary" : "default"}
                block
                onClick={() => handleQuickAmountSelect(quickAmount)}
                style={{
                  height: "40px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  border: selectedQuickAmount === quickAmount ? "2px solid #1890ff" : "1px solid rgba(255,255,255,0.3)",
                  backgroundColor: selectedQuickAmount === quickAmount ? "#1890ff" : "rgba(255,255,255,0.1)",
                  color: selectedQuickAmount === quickAmount ? "white" : "rgba(255,255,255,0.9)",
                }}
              >
                ${quickAmount}
              </Button>
            </Col>
          ))}
        </Row>
      </div>

      {/* Custom Amount */}
      <div style={{ marginBottom: "20px" }}>
        <Text strong style={{ color: "white", fontSize: "14px", marginBottom: "8px", display: "block" }}>
          Or enter custom amount
        </Text>
        <InputNumber
          size="large"
          value={amount}
          onChange={handleCustomAmountChange}
          min={1}
          max={10000}
          formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
          style={{
            width: "100%",
            borderRadius: "8px",
            backgroundColor: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.3)",
          }}
          placeholder="Enter amount"
        />
      </div>

      {/* Impact Message */}
      <div style={{ 
        background: "rgba(255,255,255,0.1)", 
        padding: "12px", 
        borderRadius: "8px", 
        marginBottom: "20px",
        textAlign: "center"
      }}>
        <Text style={{ color: "white", fontSize: "14px", fontWeight: "500" }}>
          {getImpactMessage(amount)}
        </Text>
      </div>

      {/* Message Input */}
      <div style={{ marginBottom: "20px" }}>
        <Text strong style={{ color: "white", fontSize: "14px", marginBottom: "8px", display: "block" }}>
          <HeartOutlined style={{ marginRight: "8px" }} />
          Leave a message (optional)
        </Text>
        <Input.TextArea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your thoughts or encouragement..."
          rows={3}
          maxLength={200}
          showCount
          style={{
            borderRadius: "8px",
            backgroundColor: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "white",
          }}
        />
      </div>

      {/* Donate Button */}
      <Button
        type="primary"
        size="large"
        block
        loading={loading}
        onClick={getClientSecretToken}
        style={{
          height: "50px",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: "600",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
        icon={<ThunderboltOutlined />}
      >
        Donate {formatCurrency(amount)} Now
      </Button>

      {/* Security Badge */}
      <div style={{ textAlign: "center", marginTop: "16px" }}>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
          🔒 Secure payment powered by Stripe
        </Text>
      </div>

      {/* Stripe Elements */}
      {clientSecretToken && (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm
            open={showCheckoutForm}
            onClose={() => {
              setClientSecretToken("");
              setShowCheckoutForm(false);
            }}
            campaignData={campaignData}
            message={message}
            amount={amount}
            reloadCampaignData={() => {
              reloadCampaignData();
              setMessage("");
              setAmount(25);
              setSelectedQuickAmount(25);
            }}
          />
        </Elements>
      )}
    </Card>
  );
}

export default DonationsCard;