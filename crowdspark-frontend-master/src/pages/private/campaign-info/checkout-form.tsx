import { Button, Modal, message as antdMessage } from "antd";
import { CampaignTypeProps } from "../../../interfaces";
import {
  PaymentElement,
  AddressElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";
import usersStore, { UsersStoreProps } from "../../../store/users-store";
import { useState } from "react";

function CheckoutForm({
  open = false,
  onClose = () => {},
  campaignData,
  message,
  amount,
  reloadCampaignData,
}: {
  open: boolean;
  onClose: () => void;
  campaignData: CampaignTypeProps;
  message: string;
  amount: number;
  reloadCampaignData: () => void;
}) {
  const { currentUser } = usersStore() as UsersStoreProps;
  const [loading, setLoading] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const handleSubmit = async (event: any) => {
    try {
      setLoading(true);
      event.preventDefault();

      if (!stripe || !elements) {
        return;
      }

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: "https://example.com/order/123/complete",
        },
        redirect: "if_required",
      });

      if (result.error) {
        antdMessage.error(result.error.message);
      } else {
        antdMessage.success("Donation successful");
        await axios.post("/api/donations/create", {
          user: currentUser?._id,
          campaign: campaignData._id,
          amount,
          message,
          paymentId: result.paymentIntent.id,
        });
        onClose();
        reloadCampaignData();
      }
    } catch (error: any) {
      antdMessage.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal
      onCancel={onClose}
      open={open}
      onClose={onClose}
      title="COMPLETE YOUR DONATION PAYMENT"
      footer={null}
    >
      <form onSubmit={handleSubmit}>
        <PaymentElement />
        <AddressElement
          options={{
            mode: "billing",
            allowedCountries: ["US"],
          }}
        />
        <div className="flex justify-end gap-5 mt-5">
          <Button disabled={loading}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Donate
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CheckoutForm;
