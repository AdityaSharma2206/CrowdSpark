import { Button, Form, Input, message, Card, Divider, Checkbox, Row, Col, Typography, Space } from "antd";
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  LoginOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  SafetyOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  RocketOutlined
} from "@ant-design/icons";
import WelcomeContent from "../common/welcome-content";
import { Link } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

const { Title, Text, Paragraph } = Typography;

interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  const onFinish = async (values: LoginForm) => {
    try {
      setLoading(true);
      const response = await axios.post("/api/users/login", values);
      message.success("Welcome back! Login successful");
      
      // Set token with expiration based on remember me
      const tokenOptions = values.remember 
        ? { expires: 30 } // 30 days
        : { expires: 1 }; // 1 day
      
      Cookies.set("token", response.data.token, tokenOptions);
      navigate("/");
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      // You can implement demo login logic here
      form.setFieldsValue({
        email: "demo@crowdspark.com",
        password: "demo123"
      });
      message.info("Demo credentials loaded. Click login to continue.");
    } catch (error) {
      message.error("Demo login not available");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)' }}>
      <Row style={{ minHeight: '100vh' }}>
        {/* Left Side - Welcome Content */}
        <Col xs={0} md={12} lg={12} xl={12}>
          <div style={{ 
            height: '100vh', 
            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 40px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background decoration */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              animation: 'pulse 4s ease-in-out infinite'
            }} />
            
            <div style={{ 
              textAlign: 'center', 
              color: 'white',
              position: 'relative',
              zIndex: 2
            }}>
              <div style={{ marginBottom: '32px' }}>
                <RocketOutlined style={{ fontSize: '4rem', marginBottom: '16px' }} />
                <Title level={1} style={{ color: 'white', marginBottom: '16px', fontSize: '2.5rem' }}>
                  Welcome Back to CrowdSpark
                </Title>
                <Paragraph style={{ color: '#bfdbfe', fontSize: '1.25rem', marginBottom: '32px' }}>
                  Continue your journey of bringing innovative ideas to life
                </Paragraph>
              </div>
              
              <Row gutter={[24, 24]} style={{ textAlign: 'center' }}>
                <Col span={8}>
                  <ThunderboltOutlined style={{ fontSize: '2rem', marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.875rem', color: '#bfdbfe' }}>Fast & Secure</div>
                </Col>
                <Col span={8}>
                  <HeartOutlined style={{ fontSize: '2rem', marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.875rem', color: '#bfdbfe' }}>Trusted Platform</div>
                </Col>
                <Col span={8}>
                  <SafetyOutlined style={{ fontSize: '2rem', marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.875rem', color: '#bfdbfe' }}>Protected Data</div>
                </Col>
              </Row>
            </div>
          </div>
        </Col>

        {/* Right Side - Login Form */}
        <Col xs={24} md={12} lg={12} xl={12}>
          <div style={{ 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '40px 20px'
          }}>
            <Card style={{ 
              width: '100%', 
              maxWidth: '480px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              borderRadius: '16px',
              border: 'none'
            }}>
              <div style={{ padding: '24px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <LoginOutlined style={{ fontSize: '2rem', color: 'white' }} />
                  </div>
                  <Title level={2} style={{ color: '#1f2937', marginBottom: '8px' }}>
                    Sign In
                  </Title>
                  <Text style={{ color: '#6b7280', fontSize: '1rem' }}>
                    Welcome back! Please enter your credentials
                  </Text>
                </div>

                {/* Demo Login Button */}
                <Button
                  block
                  size="large"
                  onClick={handleDemoLogin}
                  style={{
                    marginBottom: '24px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                  icon={<ThunderboltOutlined />}
                >
                  Try Demo Login
                </Button>

                <Divider style={{ margin: '24px 0' }}>
                  <Text style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    Or continue with your account
                  </Text>
                </Divider>

                {/* Login Form */}
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  size="large"
                  style={{ marginBottom: '24px' }}
                >
                  <Form.Item
                    label={<Text strong style={{ color: '#374151' }}>Email Address</Text>}
                    name="email"
                    rules={[
                      { required: true, message: "Please enter your email address" },
                      { type: 'email', message: 'Please enter a valid email address' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
                      placeholder="Enter your email"
                      style={{ 
                        height: '48px', 
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<Text strong style={{ color: '#374151' }}>Password</Text>}
                    name="password"
                    rules={[
                      { required: true, message: "Please enter your password" },
                      { min: 6, message: 'Password must be at least 6 characters' }
                    ]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                      placeholder="Enter your password"
                      iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                      style={{ 
                        height: '48px', 
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </Form.Item>

                  <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
                    <Form.Item name="remember" valuePropName="checked" style={{ margin: 0 }}>
                      <Checkbox style={{ color: '#374151' }}>
                        Remember me
                      </Checkbox>
                    </Form.Item>
                    <Link 
                      to="/forgot-password" 
                      style={{ 
                        color: '#2563eb', 
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 500
                      }}
                    >
                      Forgot password?
                    </Link>
                  </Row>

                  <Form.Item style={{ marginBottom: '24px' }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading}
                      block
                      size="large"
                      style={{
                        height: '48px',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}
                      icon={<LoginOutlined />}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </Form.Item>
                </Form>

                {/* Footer */}
                <div style={{ textAlign: 'center' }}>
                  <Text style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Don't have an account? {' '}
                    <Link 
                      to="/register" 
                      style={{ 
                        color: '#2563eb', 
                        textDecoration: 'none',
                        fontWeight: 600
                      }}
                    >
                      Create one now
                    </Link>
                  </Text>
                </div>

                {/* Additional Features */}
                <div style={{ 
                  marginTop: '32px', 
                  padding: '16px', 
                  background: '#f8fafc',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <Text style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', marginBottom: '8px' }}>
                    🔒 Your data is protected with enterprise-grade security
                  </Text>
                  <Space>
                    <Text style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      ✨ Fast login
                    </Text>
                    <Text style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      🚀 Instant access
                    </Text>
                    <Text style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      💡 Start creating
                    </Text>
                  </Space>
                </div>
              </div>
            </Card>
          </div>
        </Col>
      </Row>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
          
          .ant-input:focus,
          .ant-input-password:focus {
            border-color: #2563eb !important;
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1) !important;
          }
          
          .ant-checkbox-checked .ant-checkbox-inner {
            background-color: #2563eb !important;
            border-color: #2563eb !important;
          }
          
          .ant-btn:hover {
            transform: translateY(-2px);
            transition: all 0.3s ease;
          }
        `}
      </style>
    </div>
  );
}

export default LoginPage;