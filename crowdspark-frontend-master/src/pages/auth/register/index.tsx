import { Button, Form, Input, message, Card, Divider, Checkbox, Row, Col, Typography, Space, Progress } from "antd";
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  UserAddOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  SafetyOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const { Title, Text, Paragraph } = Typography;

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
}

function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const calculatePasswordStrength = (password: string) => {
    const criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    setPasswordCriteria(criteria);
    const strength = Object.values(criteria).filter(Boolean).length;
    setPasswordStrength((strength / 5) * 100);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return '#ff4d4f';
    if (passwordStrength < 80) return '#faad14';
    return '#52c41a';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 80) return 'Medium';
    return 'Strong';
  };

  const onFinish = async (values: RegisterForm) => {
    try {
      setLoading(true);
      
      // First, register the user
      await axios.post("/api/users/register", {
        name: values.name,
        email: values.email,
        password: values.password
      });

      // Then, automatically log them in
      const loginResponse = await axios.post("/api/users/login", {
        email: values.email,
        password: values.password
      });

      // Set the authentication token
      Cookies.set("token", loginResponse.data.token, { expires: 30 }); // 30 days

      // Show success message and redirect
      message.success("Welcome to CrowdSpark! Your account has been created and you're now logged in.");
      navigate("/");
      
    } catch (error: any) {
      console.error("Registration/Login error:", error);
      
      // Check if registration succeeded but login failed
      if (error?.response?.status === 400 && error?.response?.data?.message?.includes("already exists")) {
        message.error("An account with this email already exists. Please try logging in instead.");
        navigate("/login");
      } else if (error?.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    calculatePasswordStrength(password);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)' }}>
      <Row style={{ minHeight: '100vh' }}>
        {/* Left Side - Welcome Content */}
        <Col xs={0} md={12} lg={12} xl={12}>
          <div style={{ 
            height: '100vh', 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
                <UserAddOutlined style={{ fontSize: '4rem', marginBottom: '16px' }} />
                <Title level={1} style={{ color: 'white', marginBottom: '16px', fontSize: '2.5rem' }}>
                  Join CrowdSpark Today
                </Title>
                <Paragraph style={{ color: '#a7f3d0', fontSize: '1.25rem', marginBottom: '32px' }}>
                  Start your journey of innovation and bring your ideas to life
                </Paragraph>
              </div>
              
              <Row gutter={[24, 24]} style={{ textAlign: 'center' }}>
                <Col span={8}>
                  <ThunderboltOutlined style={{ fontSize: '2rem', marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.875rem', color: '#a7f3d0' }}>Instant Access</div>
                </Col>
                <Col span={8}>
                  <HeartOutlined style={{ fontSize: '2rem', marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.875rem', color: '#a7f3d0' }}>Join Community</div>
                </Col>
                <Col span={8}>
                  <RocketOutlined style={{ fontSize: '2rem', marginBottom: '8px' }} />
                  <div style={{ fontSize: '0.875rem', color: '#a7f3d0' }}>Launch Ideas</div>
                </Col>
              </Row>
            </div>
          </div>
        </Col>

        {/* Right Side - Registration Form */}
        <Col xs={24} md={12} lg={12} xl={12}>
          <div style={{ 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '40px 20px',
            overflowY: 'auto'
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
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <UserAddOutlined style={{ fontSize: '2rem', color: 'white' }} />
                  </div>
                  <Title level={2} style={{ color: '#1f2937', marginBottom: '8px' }}>
                    Create Account
                  </Title>
                  <Text style={{ color: '#6b7280', fontSize: '1rem' }}>
                    Join thousands of innovators on CrowdSpark
                  </Text>
                </div>

                {/* Registration Form */}
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  size="large"
                  style={{ marginBottom: '24px' }}
                >
                  <Form.Item
                    label={<Text strong style={{ color: '#374151' }}>Full Name</Text>}
                    name="name"
                    rules={[
                      { required: true, message: "Please enter your full name" },
                      { min: 2, message: 'Name must be at least 2 characters' },
                      { max: 50, message: 'Name must be less than 50 characters' }
                    ]}
                  >
                    <Input 
                      prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                      placeholder="Enter your full name"
                      style={{ 
                        height: '48px', 
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#10b981'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </Form.Item>

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
                      onFocus={(e) => e.target.style.borderColor = '#10b981'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<Text strong style={{ color: '#374151' }}>Password</Text>}
                    name="password"
                    rules={[
                      { required: true, message: "Please enter your password" },
                      { min: 8, message: 'Password must be at least 8 characters' }
                    ]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                      placeholder="Create a strong password"
                      iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                      onChange={handlePasswordChange}
                      style={{ 
                        height: '48px', 
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#10b981'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </Form.Item>

                  {/* Password Strength Indicator */}
                  {passwordStrength > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <Text style={{ fontSize: '0.875rem', color: '#6b7280' }}>Password Strength</Text>
                        <Text style={{ fontSize: '0.875rem', color: getPasswordStrengthColor(), fontWeight: 'bold' }}>
                          {getPasswordStrengthText()}
                        </Text>
                      </div>
                      <Progress
                        percent={passwordStrength}
                        strokeColor={getPasswordStrengthColor()}
                        showInfo={false}
                        size="small"
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                        {Object.entries(passwordCriteria).map(([key, met]) => (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {met ? (
                              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
                            ) : (
                              <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '12px' }} />
                            )}
                            <Text style={{ fontSize: '0.75rem', color: met ? '#52c41a' : '#ff4d4f' }}>
                              {key === 'length' ? '8+ chars' : 
                               key === 'uppercase' ? 'A-Z' :
                               key === 'lowercase' ? 'a-z' :
                               key === 'number' ? '0-9' : 'Special'}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Form.Item
                    label={<Text strong style={{ color: '#374151' }}>Confirm Password</Text>}
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: "Please confirm your password" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Passwords do not match'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password 
                      prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                      placeholder="Confirm your password"
                      iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                      style={{ 
                        height: '48px', 
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#10b981'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </Form.Item>

                  <Form.Item
                    name="agree"
                    valuePropName="checked"
                    rules={[
                      { required: true, message: "Please accept the terms and conditions" }
                    ]}
                    style={{ marginBottom: '24px' }}
                  >
                    <Checkbox style={{ color: '#374151' }}>
                      I agree to the{' '}
                      <Link to="/terms" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 500 }}>
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link to="/privacy" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 500 }}>
                        Privacy Policy
                      </Link>
                    </Checkbox>
                  </Form.Item>

                  <Form.Item style={{ marginBottom: '24px' }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading}
                      block
                      size="large"
                      style={{
                        height: '48px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}
                      icon={<UserAddOutlined />}
                    >
                      {loading ? 'Creating Account...' : 'Create Account & Sign In'}
                    </Button>
                  </Form.Item>
                </Form>

                <Divider style={{ margin: '24px 0' }}>
                  <Text style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    Already have an account?
                  </Text>
                </Divider>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <Link to="/login">
                    <Button 
                      size="large" 
                      block
                      style={{
                        height: '48px',
                        borderRadius: '8px',
                        border: '2px solid #10b981',
                        color: '#10b981',
                        fontWeight: 'bold',
                        background: 'transparent'
                      }}
                    >
                      Sign In Instead
                    </Button>
                  </Link>
                </div>

                {/* Additional Features */}
                <div style={{ 
                  padding: '16px', 
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <Text style={{ color: '#059669', fontSize: '0.75rem', display: 'block', marginBottom: '8px' }}>
                    🚀 Join 10,000+ innovators already on CrowdSpark
                  </Text>
                  <Space>
                    <Text style={{ color: '#059669', fontSize: '0.75rem' }}>
                      ✨ Instant access
                    </Text>
                    <Text style={{ color: '#059669', fontSize: '0.75rem' }}>
                      🤝 Active community
                    </Text>
                    <Text style={{ color: '#059669', fontSize: '0.75rem' }}>
                      💡 Endless possibilities
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
            border-color: #10b981 !important;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1) !important;
          }
          
          .ant-checkbox-checked .ant-checkbox-inner {
            background-color: #10b981 !important;
            border-color: #10b981 !important;
          }
          
          .ant-btn:hover {
            transform: translateY(-2px);
            transition: all 0.3s ease;
          }
          
          .ant-progress-bg {
            transition: all 0.3s ease;
          }
        `}
      </style>
    </div>
  );
}

export default RegisterPage;