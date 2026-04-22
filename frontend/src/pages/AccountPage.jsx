import { useEffect, useState } from "react";

import AddressBook from "../components/account/AddressBook";
import OrdersPanel from "../components/account/OrdersPanel";
import ProfilePanel from "../components/account/ProfilePanel";
import LoadingState from "../components/common/LoadingState";
import { useAuth } from "../hooks/useAuth";

const emptyAddressForm = {
  title: "Home",
  address_type: "shipping",
  full_name: "",
  phone_number: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "Lebanon",
  is_default: true,
};

export default function AccountPage() {
  const { request, updateStoredUser, user } = useAuth();
  const [profileForm, setProfileForm] = useState(user || {});
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAccount() {
      try {
        const [profileResponse, addressesResponse, ordersResponse] = await Promise.all([
          request("/profile/"),
          request("/addresses/"),
          request("/orders/"),
        ]);
        setProfileForm(profileResponse);
        setAddresses(addressesResponse.results || addressesResponse);
        setOrders(ordersResponse.results || ordersResponse);
        updateStoredUser(profileResponse);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, []);

  function handleProfileChange(event) {
    setProfileForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function handleAddressChange(event) {
    const { name, type, checked, value } = event.target;
    setAddressForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setSavingProfile(true);
    setError("");
    try {
      const updated = await request("/profile/", {
        method: "PATCH",
        body: {
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          username: profileForm.username,
          phone: profileForm.phone,
        },
      });
      setProfileForm(updated);
      updateStoredUser(updated);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAddressCreate(event) {
    event.preventDefault();
    setSavingAddress(true);
    setError("");
    try {
      await request("/addresses/", {
        method: "POST",
        body: addressForm,
      });
      const response = await request("/addresses/");
      setAddresses(response.results || response);
      setAddressForm(emptyAddressForm);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleAddressDelete(addressId) {
    try {
      await request(`/addresses/${addressId}/`, { method: "DELETE" });
      const response = await request("/addresses/");
      setAddresses(response.results || response);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function handleSetDefault(address) {
    try {
      await request(`/addresses/${address.id}/`, {
        method: "PATCH",
        body: {
          ...address,
          is_default: true,
        },
      });
      const response = await request("/addresses/");
      setAddresses(response.results || response);
    } catch (defaultError) {
      setError(defaultError.message);
    }
  }

  if (loading) {
    return (
      <div className="container page-section">
        <LoadingState label="Loading account dashboard..." />
      </div>
    );
  }

  return (
    <div className="container page-section account-page">
      <div className="section-heading">
        <div>
          <span className="section-heading__eyebrow">My Account</span>
          <h1>Account Dashboard</h1>
          <p>Manage your profile, saved addresses, and order history from one place.</p>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="account-stack">
        <ProfilePanel form={profileForm} onChange={handleProfileChange} onSubmit={handleProfileSubmit} saving={savingProfile} />
        <AddressBook
          addresses={addresses}
          form={addressForm}
          onChange={handleAddressChange}
          onCreate={handleAddressCreate}
          onDelete={handleAddressDelete}
          onSetDefault={handleSetDefault}
          saving={savingAddress}
        />
        <OrdersPanel orders={orders} />
      </div>
    </div>
  );
}

