import { message, Modal, Table } from "antd";
import { CampaignTypeProps, DonationTypeProps } from "../../../../interfaces";
import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

function CampaignDonations({
  open,
  setOpen,
  selectedCampaign,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedCampaign: CampaignTypeProps;
}) {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const getData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/donations/get-donations-by-campaign/${selectedCampaign._id}`
      );
      setDonations(response.data);
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCampaign) {
      getData();
    }
  }, [selectedCampaign]);

  const columns = [
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      render: (_text: string, record: DonationTypeProps) => record.user.name,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (_text: string, record: DonationTypeProps) => `$${record.amount}`,
    },
    {
      title: "Payment Id",
      dataIndex: "paymentId",
      key: "paymentId",
    },
    {
      title: "Date & Time",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (_text: string, record: DonationTypeProps) =>
        dayjs(record.createdAt).format("MMMM DD, YYYY h:mm A"),
    },
  ];
  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      onClose={() => setOpen(false)}
      title={`Donations for ${selectedCampaign.name}`}
      centered
      width={800}
      footer={null}
    >
      <Table columns={columns} dataSource={donations} loading={loading} />
    </Modal>
  );
}

export default CampaignDonations;
