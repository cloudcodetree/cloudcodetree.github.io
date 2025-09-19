export const CALENDLY_CONFIG = {
  url: 'https://calendly.com/cloudcodetree',
  text: 'Schedule time with me',
  color: '#00a2ff',
  textColor: '#ffffff',
  branding: true,
  eventTypes: {
    codeReview: 'https://calendly.com/cloudcodetree/30min',
    technicalConsultation: 'https://calendly.com/cloudcodetree/30min',
    projectInterview: 'https://calendly.com/cloudcodetree/30min',
  }
};

export const buildCalendlyUrl = (eventType?: string) => {
  const baseUrl = CALENDLY_CONFIG.url;
  return eventType ? `${baseUrl}/${eventType}` : baseUrl;
};