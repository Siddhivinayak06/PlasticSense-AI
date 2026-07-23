import { mockReports } from '@/mock';

export const getReports = async () => {
  // Simulate API call
  return new Promise((resolve) => setTimeout(() => resolve(mockReports), 500));
};
