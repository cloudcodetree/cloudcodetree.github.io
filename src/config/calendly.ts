// Calendly Configuration
// Update these URLs after setting up your Calendly account

export const CALENDLY_CONFIG = {
  // Your main Calendly username
  username: 'cloudcodetree',
  
  // General scheduling page (for the iframe)
  generalUrl: 'https://calendly.com/cloudcodetree',
  
  // Specific event type URLs - create these in your Calendly dashboard
  eventTypes: {
    technicalConsultation: 'https://calendly.com/cloudcodetree/30-minute-zoom-call',
    projectInterview: 'https://calendly.com/cloudcodetree/30-minute-zoom-call', 
    codeReview: 'https://calendly.com/cloudcodetree/30-minute-zoom-call',
  },
  
  // Embed configuration
  embedOptions: {
    domain: 'cloudcodetree.com',
    type: 'Inline',
    hideEventTypeDetails: true,
    hideLandingPageDetails: true,
    primaryColor: '3b82f6',
  },
  
  // UTM tracking for analytics
  utmParams: {
    source: 'cloudcodetree-website',
    medium: 'website', 
    campaign: 'schedule-page',
  },
  
  // Auto-fill options
  prefill: {
    name: '',
    email: '',
    customAnswers: {
      // Map these to your actual Calendly custom questions
      referralSource: 'CloudCodeTree.com Website'
    }
  }
};

// Helper function to build URLs with tracking
export const buildCalendlyUrl = (eventUrl: string, options?: { 
  embed?: boolean;
  utm?: boolean; 
}): string => {
  const url = new URL(eventUrl);
  
  if (options?.embed) {
    url.searchParams.set('embed_domain', CALENDLY_CONFIG.embedOptions.domain);
    url.searchParams.set('embed_type', CALENDLY_CONFIG.embedOptions.type);
    url.searchParams.set('primary_color', CALENDLY_CONFIG.embedOptions.primaryColor);
    url.searchParams.set('hide_event_type_details', CALENDLY_CONFIG.embedOptions.hideEventTypeDetails.toString());
    url.searchParams.set('hide_landing_page_details', CALENDLY_CONFIG.embedOptions.hideLandingPageDetails.toString());
    url.searchParams.set('hide_gdpr_banner', 'true'); // Hide cookie banner
  }
  
  if (options?.utm) {
    url.searchParams.set('utm_source', CALENDLY_CONFIG.utmParams.source);
    url.searchParams.set('utm_medium', CALENDLY_CONFIG.utmParams.medium);
    url.searchParams.set('utm_campaign', CALENDLY_CONFIG.utmParams.campaign);
  }
  
  return url.toString();
};

export default CALENDLY_CONFIG;