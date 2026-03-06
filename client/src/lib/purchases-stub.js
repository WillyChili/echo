// No-op stub for web builds — real RevenueCat runs only on Android via Capacitor
export const Purchases = {
  configure: () => {},
  getOfferings: async () => ({ current: { availablePackages: [] } }),
  purchasePackage: async () => ({}),
  getCustomerInfo: async () => ({
    customerInfo: { entitlements: { active: {} } },
  }),
};
