import { sellerProfileService } from '@/src/services/seller/sellerProfileService';

// product-service (microservice) takes sellerId as a plain @NotNull field on
// ProductDetailsDto instead of deriving it from the JWT like the old monolith
// did, so every create/update payload must carry it.
export const getCurrentSellerId = async (): Promise<string> => {
  const profile = await sellerProfileService.getCurrentSellerProfile();
  return profile.sellerId;
};

export const withSellerId = async <T extends object>(
  payload: T
): Promise<T & { sellerId: string }> => ({
  ...payload,
  sellerId: await getCurrentSellerId(),
});
