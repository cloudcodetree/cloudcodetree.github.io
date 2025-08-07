# Calendly Setup Guide

This guide will help you set up functional Calendly integration for your CloudCodeTree website.

## Step 1: Create Calendly Account

1. **Sign up at [calendly.com](https://calendly.com)**
2. **Choose a username** (currently set to `cloudcodetree` in the config)
3. **Complete your profile** with your photo, bio, and contact info

## Step 2: Create Event Types

Create these specific event types in your Calendly dashboard to match the website:

### Technical Consultation (30 min)
- **Name**: Technical Consultation
- **Duration**: 30 minutes
- **URL slug**: `technical-consultation`
- **Description**: Quick discussion about your technical challenges, architecture questions, or project requirements.

### Full Project Interview (60 min)
- **Name**: Full Project Interview  
- **Duration**: 60 minutes
- **URL slug**: `project-interview`
- **Description**: Comprehensive discussion about your project, including requirements, timeline, and detailed technical planning.

### Code Review Session (45 min)
- **Name**: Code Review Session
- **Duration**: 45 minutes
- **URL slug**: `code-review`
- **Description**: Review your existing codebase, identify improvements, and discuss best practices and optimization strategies.

## Step 3: Update Configuration

After creating your Calendly account and event types, update the configuration file:

**File**: `src/config/calendly.ts`

```typescript
export const CALENDLY_CONFIG = {
  // Replace 'cloudcodetree' with your actual Calendly username
  username: 'your-actual-username',
  
  // Update with your general scheduling page
  generalUrl: 'https://calendly.com/your-actual-username',
  
  // Update these with your actual event URLs
  eventTypes: {
    technicalConsultation: 'https://calendly.com/your-actual-username/technical-consultation',
    projectInterview: 'https://calendly.com/your-actual-username/project-interview', 
    codeReview: 'https://calendly.com/your-actual-username/code-review',
  },
  
  // Update embed domain if different
  embedOptions: {
    domain: 'cloudcodetree.com', // or your actual domain
    // ... other options
  }
};
```

## Step 4: Configure Event Type Settings

For each event type, configure:

### Basic Settings
- **Event name**: Match the names above
- **Location**: Set to Google Meet, Zoom, or your preferred video conferencing
- **Description**: Use the descriptions provided above
- **Event color**: Choose colors that match your brand

### Availability
- **Date range**: Set how far in advance people can book
- **Duration**: Set the correct duration for each event type
- **Buffer time**: Add buffer between meetings if needed

### Questions
Add these custom questions to gather context:

1. **What's your primary technical challenge?** (Text area)
2. **What's your current tech stack?** (Text area)
3. **Company/Project name** (Text field)
4. **How did you find us?** (Multiple choice: Website, Referral, LinkedIn, Other)

### Notifications
- **Email confirmations**: Enable for both you and invitees
- **Calendar invites**: Enable to automatically add to calendars
- **Reminder emails**: Set 1 day and 1 hour before meeting

## Step 5: Test the Integration

1. **Deploy your updated code**
2. **Visit your schedule page**
3. **Test each meeting type button**
4. **Verify the iframe loads correctly**
5. **Book a test appointment**

## Step 6: Advanced Configuration (Optional)

### Custom Branding
- **Upload your logo** in Calendly account settings
- **Set brand colors** to match your website
- **Customize confirmation pages** with your messaging

### Analytics & Tracking
- **Connect Google Analytics** in Calendly settings
- **UTM parameters** are automatically added by the website code
- **Track conversions** from website visits to booked meetings

### Webhooks (for advanced users)
Set up webhooks to:
- **Add leads to your CRM**
- **Send Slack notifications**
- **Update your project management tools**

## Troubleshooting

### Common Issues

**Calendly widget not loading:**
- Check your internet connection
- Verify your Calendly URLs are correct
- Check browser console for errors

**Buttons not working:**
- Ensure you've updated the configuration file
- Check that your event type URLs are public
- Verify your Calendly account is active

**Iframe shows error:**
- Confirm your main Calendly URL is correct
- Check that embed permissions are enabled
- Verify your domain is allowed for embedding

### Support
- **Calendly Help**: [help.calendly.com](https://help.calendly.com)
- **Website Issues**: Check browser console and network tab for errors

## Security Notes

- **Never embed private event links**
- **Use strong passwords for your Calendly account**
- **Enable two-factor authentication**
- **Regularly review your account activity**

## Next Steps

After setup:
1. **Test thoroughly** before going live
2. **Monitor booking patterns** and adjust availability
3. **Collect feedback** from clients about the booking process
4. **Consider upgrading** to Calendly paid plans for more features