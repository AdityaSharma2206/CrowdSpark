import { useNavigate, useParams } from "react-router-dom";
import PageTitle from "../../../../../components/page-title";
import { 
  Button, 
  Form, 
  Input, 
  message, 
  Select, 
  Upload, 
  Card, 
  Row, 
  Col, 
  Progress,
  Statistic,
  Tag,
  Divider,
  Space,
  Tooltip,
  Alert,
  DatePicker
} from "antd";
import { useEffect, useState } from "react";
import { uploadFilesToFirebaseAndReturnUrls } from "../../../../../helpers/uploads";
import axios from "axios";
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  UserOutlined,
  FileImageOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TagOutlined,
  EditOutlined,
  GlobalOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;

function CampaignForm() {
  const params = useParams();
  const [selectedImageFiles, setSelectedImageFiles] = useState<any[]>([]);
  const [campaignData, setCampaignData] = useState<any | null>(null);
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Form validation states
  const [formProgress, setFormProgress] = useState(0);
  const [isFormValid, setIsFormValid] = useState(false);

  const categories = [
    { value: "education", label: "Education", icon: "📚", color: "#2563eb" },
    { value: "health", label: "Health", icon: "🏥", color: "#dc2626" },
    { value: "environment", label: "Environment", icon: "🌱", color: "#16a34a" },
    { value: "animals", label: "Animals", icon: "🐾", color: "#ea580c" },
    { value: "humanRights", label: "Human Rights", icon: "✊", color: "#7c3aed" },
    { value: "sports", label: "Sports", icon: "⚽", color: "#0891b2" },
    { value: "technology", label: "Technology", icon: "💻", color: "#4f46e5" },
    { value: "arts", label: "Arts & Culture", icon: "🎨", color: "#e11d48" },
    { value: "community", label: "Community", icon: "🏘️", color: "#059669" },
    { value: "emergency", label: "Emergency", icon: "🚨", color: "#dc2626" }
  ];

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      
      // Format dates
      if (values.startDate && dayjs.isDayjs(values.startDate)) {
        values.startDate = values.startDate.format('YYYY-MM-DD');
      }
      if (values.endDate && dayjs.isDayjs(values.endDate)) {
        values.endDate = values.endDate.format('YYYY-MM-DD');
      }

      // Upload new images
      const newImages = selectedImageFiles.length > 0 
        ? await uploadFilesToFirebaseAndReturnUrls(selectedImageFiles)
        : [];
      
      values.images = [...uploadedImages, ...newImages];
      values.targetAmount = parseFloat(values.targetAmount);

      if (!params.id) {
        await axios.post("/api/campaigns/create", values);
        message.success("🎉 Campaign created successfully!");
      } else {
        await axios.put(`/api/campaigns/update/${params.id}`, values);
        message.success("✅ Campaign updated successfully!");
      }

      navigate("/user/campaigns");
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCampaignData = async () => {
    try {
      const response = await axios.get(`/api/campaigns/get/${params.id}`);
      const data = response.data;
      setCampaignData(data);
      setUploadedImages(data.images || []);
      
      // Format dates for form
      if (data.startDate) {
        data.startDate = dayjs(data.startDate);
      }
      if (data.endDate) {
        data.endDate = dayjs(data.endDate);
      }
      
      form.setFieldsValue(data);
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message);
    }
  };

  const calculateFormProgress = () => {
    const values = form.getFieldsValue();
    const requiredFields = ['name', 'description', 'organizer', 'targetAmount', 'category', 'startDate', 'endDate'];
    const filledFields = requiredFields.filter(field => values[field]).length;
    const imagesValid = (uploadedImages.length + selectedImageFiles.length) > 0;
    
    let progress = (filledFields / requiredFields.length) * 80;
    if (imagesValid) progress += 20;
    
    setFormProgress(Math.round(progress));
    setIsFormValid(progress >= 100);
  };

  const onValuesChange = () => {
    setTimeout(calculateFormProgress, 100);
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const getProgressColor = () => {
    if (formProgress >= 100) return '#52c41a';
    if (formProgress >= 60) return '#faad14';
    return '#ff4d4f';
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
    if (params.id) {
      getCampaignData();
    }
  }, []);

  useEffect(() => {
    calculateFormProgress();
  }, [uploadedImages, selectedImageFiles]);

  let showForm = false;

  if (!params.id) {
    showForm = true;
  }

  if (params.id && campaignData) {
    showForm = true;
  }

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate("/user/campaigns")}
            style={{ marginBottom: '16px' }}
          >
            Back to Campaigns
          </Button>
          <PageTitle title={params.id ? "Edit Campaign" : "Create New Campaign"} />
          <p style={{ color: '#6b7280', marginTop: '8px' }}>
            {params.id 
              ? "Update your campaign details and settings" 
              : "Fill out the form below to create a new crowdfunding campaign"
            }
          </p>
        </div>

        {/* Progress Card */}
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={12}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#1f2937' }}>Form Completion</span>
                    <span style={{ color: getProgressColor(), fontWeight: 'bold' }}>{formProgress}%</span>
                  </div>
                  <Progress 
                    percent={formProgress} 
                    strokeColor={getProgressColor()}
                    showInfo={false}
                  />
                </div>
                {isFormValid && (
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} />
                )}
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Tag color={isFormValid ? 'success' : 'warning'}>
                    {isFormValid ? 'Ready to Submit' : 'Complete All Fields'}
                  </Tag>
                  {params.id && (
                    <Button 
                      icon={<EyeOutlined />} 
                      onClick={() => navigate(`/campaign/${params.id}`)}
                    >
                      Preview
                    </Button>
                  )}
                </Space>
              </div>
            </Col>
          </Row>
        </Card>

        {showForm && (
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onValuesChange={onValuesChange}
            initialValues={campaignData}
          >
            <Row gutter={[24, 24]}>
              {/* Basic Information */}
              <Col xs={24} lg={16}>
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <EditOutlined style={{ color: '#2563eb' }} />
                      <span>Basic Information</span>
                    </div>
                  }
                  style={{ marginBottom: '24px' }}
                >
                  <Form.Item 
                    name="name" 
                    label="Campaign Name" 
                    rules={[{ required: true, message: 'Please enter campaign name' }]}
                  >
                    <Input 
                      placeholder="Enter a compelling campaign name"
                      prefix={<TagOutlined style={{ color: '#6b7280' }} />}
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item 
                    name="description" 
                    label="Description" 
                    rules={[{ required: true, message: 'Please enter campaign description' }]}
                  >
                    <TextArea 
                      rows={4}
                      placeholder="Tell your story. What is your campaign about? Why should people support it?"
                      showCount
                      maxLength={1000}
                    />
                  </Form.Item>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        name="organizer" 
                        label="Organizer Name" 
                        rules={[{ required: true, message: 'Please enter organizer name' }]}
                      >
                        <Input 
                          placeholder="Your name or organization"
                          prefix={<UserOutlined style={{ color: '#6b7280' }} />}
                          size="large"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        name="targetAmount" 
                        label="Target Amount ($)" 
                        rules={[
                          { required: true, message: 'Please enter target amount' },
                          { pattern: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid amount' }
                        ]}
                      >
                        <Input 
                          placeholder="10000"
                          prefix={<DollarCircleOutlined style={{ color: '#6b7280' }} />}
                          size="large"
                          addonBefore="$"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item 
                    name="category" 
                    label="Campaign Category" 
                    rules={[{ required: true, message: 'Please select a category' }]}
                  >
                    <Select 
                      placeholder="Choose the category that best fits your campaign"
                      size="large"
                      optionLabelProp="label"
                    >
                      {categories.map(category => (
                        <Option 
                          key={category.value} 
                          value={category.value}
                          label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{category.icon}</span>
                              <span>{category.label}</span>
                            </div>
                          }
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>{category.icon}</span>
                            <span>{category.label}</span>
                            <Tag color={category.color} style={{ marginLeft: 'auto' }}>
                              {category.value}
                            </Tag>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Card>

                {/* Timeline */}
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarOutlined style={{ color: '#2563eb' }} />
                      <span>Campaign Timeline</span>
                    </div>
                  }
                  style={{ marginBottom: '24px' }}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        name="startDate" 
                        label="Start Date" 
                        rules={[{ required: true, message: 'Please select start date' }]}
                      >
                        <DatePicker 
                          style={{ width: '100%' }}
                          size="large"
                          format="YYYY-MM-DD"
                          disabledDate={(current) => current && current < dayjs().startOf('day')}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item 
                        name="endDate" 
                        label="End Date" 
                        rules={[{ required: true, message: 'Please select end date' }]}
                      >
                        <DatePicker 
                          style={{ width: '100%' }}
                          size="large"
                          format="YYYY-MM-DD"
                          disabledDate={(current) => {
                            const startDate = form.getFieldValue('startDate');
                            return current && startDate && current <= startDate;
                          }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Alert
                    message="Campaign Duration"
                    description="Choose your campaign duration wisely. Most successful campaigns run for 30-60 days."
                    type="info"
                    icon={<InfoCircleOutlined />}
                    style={{ marginTop: '16px' }}
                  />
                </Card>

                {/* Images */}
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileImageOutlined style={{ color: '#2563eb' }} />
                      <span>Campaign Images</span>
                    </div>
                  }
                >
                  <Row gutter={[16, 16]}>
                    {/* Uploaded Images */}
                    {uploadedImages.map((image: string, index: number) => (
                      <Col xs={12} sm={8} md={6} key={index}>
                        <div style={{ 
                          position: 'relative', 
                          border: '2px solid #e5e7eb', 
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}>
                          <img
                            src={image}
                            alt={`Campaign image ${index + 1}`}
                            style={{ 
                              width: '100%', 
                              height: '120px', 
                              objectFit: 'cover',
                              display: 'block'
                            }}
                          />
                          <div style={{ 
                            position: 'absolute', 
                            top: '8px', 
                            right: '8px',
                            display: 'flex',
                            gap: '4px'
                          }}>
                            <Button
                              size="small"
                              type="primary"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => removeUploadedImage(index)}
                            />
                          </div>
                          <div style={{ 
                            position: 'absolute', 
                            bottom: '0', 
                            left: '0', 
                            right: '0',
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            textAlign: 'center',
                            padding: '4px',
                            fontSize: '12px'
                          }}>
                            Uploaded
                          </div>
                        </div>
                      </Col>
                    ))}
                    
                    {/* Upload New Images */}
                    <Col xs={12} sm={8} md={6}>
                      <Upload
                        listType="picture-card"
                        beforeUpload={(file: any) => {
                          setSelectedImageFiles(prev => [...prev, file]);
                          return false;
                        }}
                        fileList={selectedImageFiles.map((file: any) => ({
                          ...file,
                          url: URL.createObjectURL(file),
                        }))}
                        onRemove={(file: any) => {
                          setSelectedImageFiles(prev =>
                            prev.filter(item => item.uid !== file.uid)
                          );
                        }}
                        multiple
                        accept="image/*"
                        style={{ width: '100%' }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <PlusOutlined style={{ fontSize: '24px', color: '#6b7280' }} />
                          <div style={{ marginTop: '8px', color: '#6b7280' }}>
                            Add Images
                          </div>
                        </div>
                      </Upload>
                    </Col>
                  </Row>
                  
                  <Alert
                    message="Image Guidelines"
                    description="Upload high-quality images that showcase your campaign. First image will be used as the main campaign image."
                    type="info"
                    icon={<InfoCircleOutlined />}
                    style={{ marginTop: '16px' }}
                  />
                </Card>
              </Col>

              {/* Sidebar */}
              <Col xs={24} lg={8}>
                {/* Campaign Status */}
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GlobalOutlined style={{ color: '#2563eb' }} />
                      <span>Campaign Status</span>
                    </div>
                  }
                  style={{ marginBottom: '24px' }}
                >
                  <Form.Item 
                    name="isActive" 
                    label="Campaign Status" 
                    rules={[{ required: true, message: 'Please select campaign status' }]}
                  >
                    <Select size="large">
                      <Option value={true}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          <span>Active</span>
                        </div>
                      </Option>
                      <Option value={false}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                          <span>Inactive</span>
                        </div>
                      </Option>
                    </Select>
                  </Form.Item>
                  
                  <Divider />
                  
                  <div style={{ textAlign: 'center' }}>
                    <Statistic
                      title="Target Amount"
                      value={form.getFieldValue('targetAmount') || 0}
                      formatter={(value) => formatCurrency(Number(value))}
                      valueStyle={{ color: '#2563eb' }}
                    />
                  </div>
                </Card>

                {/* Tips */}
                <Card 
                  title="💡 Campaign Tips"
                  style={{ marginBottom: '24px' }}
                >
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <strong>✨ Compelling Story:</strong> Share your personal connection to the cause
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <strong>🎯 Clear Goal:</strong> Be specific about how funds will be used
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <strong>📸 Great Images:</strong> Use high-quality, relevant photos
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <strong>⏰ Timeline:</strong> Set a realistic but urgent deadline
                    </div>
                    <div>
                      <strong>🔄 Updates:</strong> Plan to post regular updates
                    </div>
                  </div>
                </Card>

                {/* Action Buttons */}
                <Card>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Button 
                      type="primary" 
                      size="large"
                      htmlType="submit" 
                      loading={loading}
                      disabled={!isFormValid}
                      icon={<SaveOutlined />}
                      style={{ width: '100%' }}
                    >
                      {params.id ? "Update Campaign" : "Create Campaign"}
                    </Button>
                    
                    <Button 
                      size="large"
                      onClick={() => navigate("/user/campaigns")}
                      disabled={loading}
                      style={{ width: '100%' }}
                    >
                      Cancel
                    </Button>
                    
                    {params.id && (
                      <Button 
                        type="dashed"
                        size="large"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/campaign/${params.id}`)}
                        style={{ width: '100%' }}
                      >
                        Preview Campaign
                      </Button>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>
          </Form>
        )}
      </div>
    </div>
  );
}

export default CampaignForm;