import React, { useState, useEffect } from "react";
import {
  ArrowUpCircleIcon,
  CheckIcon,
  StarIcon,
  TvIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useNotification } from "../components/NotificationProvider";
import logger from "../utils/logger";

export default function UpgradePlan() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const { success, error: showError } = useNotification();

  useEffect(() => {
    fetchPackages();
    fetchCurrentPackage();
  }, []);

  const fetchPackages = async () => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/packages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (err) {
      logger.logApiError("/api/packages", err);
    }
  };

  const fetchCurrentPackage = async () => {
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/packages/current`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data);
      }
    } catch (err) {
      logger.logApiError("/api/packages/current", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    setUpgrading(true);
    try {
      const token =
        localStorage.getItem("admin_token") ||
        sessionStorage.getItem("admin_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/packages/upgrade`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            package_id: selectedPlan,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        success(
          `Upgrade request created! Please complete payment of ${formatPrice(
            data.package.price
          )} to activate your new plan.`
        );
        // Redirect to payment page or show payment instructions
      } else {
        showError(`Failed to upgrade: ${data.message}`);
      }
    } catch (err) {
      showError("Network error occurred");
    } finally {
      setUpgrading(false);
    }
  };

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 199000,
      originalPrice: 299000,
      devices: 2,
      storage: "5 GB",
      support: "Email",
      features: [
        "2 Device TV",
        "5 GB Storage",
        "Basic Analytics",
        "Email Support",
        "Standard Templates",
      ],
      color: "from-blue-500 to-blue-600",
      popular: false,
    },
    {
      id: "premium",
      name: "Premium",
      price: 399000,
      originalPrice: 599000,
      devices: 6,
      storage: "25 GB",
      support: "Priority Chat",
      features: [
        "6 Device TV",
        "25 GB Storage",
        "Advanced Analytics",
        "Priority Chat Support",
        "Premium Templates",
        "Scheduled Content",
      ],
      color: "from-green-500 to-green-600",
      popular: true,
    },
    {
      id: "business",
      name: "Business",
      price: 699000,
      originalPrice: 999000,
      devices: 15,
      storage: "100 GB",
      support: "Phone & Chat",
      features: [
        "15 Device TV",
        "100 GB Storage",
        "Real-time Analytics",
        "Phone & Chat Support",
        "Custom Branding",
        "API Access",
        "Multi-User Management",
      ],
      color: "from-purple-500 to-purple-600",
      popular: false,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 1299000,
      originalPrice: 1799000,
      devices: "Unlimited",
      storage: "500 GB",
      support: "Dedicated Manager",
      features: [
        "Unlimited Devices",
        "500 GB Storage",
        "Custom Analytics",
        "Dedicated Account Manager",
        "White-label Solution",
        "Custom Integration",
        "Priority Support",
        "SLA Guarantee",
      ],
      color: "from-indigo-500 to-indigo-600",
      popular: false,
    },
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-lg">
            <ArrowUpCircleIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Upgrade Your Plan
            </h1>
          </div>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Pilih paket yang sesuai dengan kebutuhan bisnis Anda dan nikmati
          fitur-fitur canggih untuk digital signage yang lebih powerful
        </p>
      </div>

      {/* Current Plan Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-bold text-blue-800">Paket Saat Ini</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-700 font-semibold">
              {plans.find((p) => p.id === currentPlan)?.name} Plan
            </p>
            <p className="text-blue-600 text-sm">
              {formatPrice(plans.find((p) => p.id === currentPlan)?.price)}
              /bulan
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-600 text-sm">Aktif hingga</p>
            <p className="text-blue-800 font-semibold">15 Feb 2024</p>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl border-2 transition-all duration-200 ${
              selectedPlan === plan.id
                ? "border-indigo-500 shadow-xl scale-105"
                : plan.popular
                ? "border-green-200 shadow-lg"
                : "border-gray-200 hover:border-gray-300 hover:shadow-lg"
            } ${plan.id === currentPlan ? "opacity-60" : ""}`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <StarIcon className="h-4 w-4" />
                  <span>Most Popular</span>
                </div>
              </div>
            )}

            {/* Current Plan Badge */}
            {plan.id === currentPlan && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Current Plan
                </div>
              </div>
            )}

            <div className="p-6">
              {/* Plan Header */}
              <div className="text-center mb-6">
                <div
                  className={`w-16 h-16 bg-gradient-to-r ${plan.color} rounded-xl flex items-center justify-center mx-auto mb-4`}
                >
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {plan.name}
                </h3>

                {/* Pricing */}
                <div className="mb-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-bold text-gray-800">
                      {formatPrice(plan.price)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(plan.originalPrice)}
                    </span>
                    <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                      Save{" "}
                      {Math.round(
                        ((plan.originalPrice - plan.price) /
                          plan.originalPrice) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">/bulan</p>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <TvIcon className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-sm font-medium text-gray-800">
                      {plan.devices}
                    </p>
                    <p className="text-xs text-gray-500">Devices</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <CloudArrowUpIcon className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <p className="text-sm font-medium text-gray-800">
                      {plan.storage}
                    </p>
                    <p className="text-xs text-gray-500">Storage</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              {plan.id === currentPlan ? (
                <button
                  disabled
                  className="w-full py-3 bg-gray-100 text-gray-400 rounded-xl font-semibold cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                    selectedPlan === plan.id
                      ? "bg-indigo-600 text-white"
                      : plan.popular
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {selectedPlan === plan.id ? "Selected" : "Select Plan"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade Button */}
      {selectedPlan && selectedPlan !== currentPlan && (
        <div className="text-center">
          <button
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            <div className="flex items-center gap-3">
              <CreditCardIcon className="h-6 w-6" />
              <span>
                Upgrade to {plans.find((p) => p.id === selectedPlan)?.name}
              </span>
              <span>•</span>
              <span>
                {formatPrice(plans.find((p) => p.id === selectedPlan)?.price)}
                /month
              </span>
            </div>
          </button>
          <p className="text-gray-500 text-sm mt-3">
            Upgrade akan berlaku segera. Tidak ada biaya tersembunyi.
          </p>
        </div>
      )}

      {/* Features Comparison */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Kenapa Upgrade?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <TvIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Lebih Banyak Device
            </h3>
            <p className="text-gray-600 text-sm">
              Kelola lebih banyak TV dan display dengan satu akun untuk
              jangkauan yang lebih luas
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Analytics Canggih
            </h3>
            <p className="text-gray-600 text-sm">
              Dapatkan insight mendalam tentang performa konten dan engagement
              audience
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheckIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Priority Support
            </h3>
            <p className="text-gray-600 text-sm">
              Dukungan prioritas dan response time yang lebih cepat untuk bisnis
              Anda
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
