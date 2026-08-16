export const getBusinessDateStr = (date?: Date): string => {
  const target = date || new Date();
  // Subtract 1 hour from the UTC time. 
  // Since Turkey is UTC+3, 04:00 AM local time is 01:00 AM UTC.
  // Shifting UTC down by 1 hour aligns the UTC midnight boundary 
  // exactly with 04:00 AM Turkey Time.
  const businessTime = new Date(target.getTime() - 1 * 60 * 60 * 1000);
  return businessTime.toISOString().split('T')[0];
};

export const getBusinessTimeStr = (date?: Date): string => {
  const target = date || new Date();
  // We keep the time string as is (local time) so they see "03:30" etc.
  return target.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};
