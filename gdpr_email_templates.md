# GDPR Email Templates

## 1. Data Export Confirmation

**Subject:** Your Data Export Request - Village

```
Hi {{firstName}},

We've received your request to export your data from Village.

Your export is being prepared and will include:
✓ Your profile information
✓ All uploaded documents (metadata)
✓ Task progress and completion history
✓ Privacy settings and consent history
✓ Access logs and activity history

**Request Details:**
- Request ID: {{requestId}}
- Requested on: {{requestDate}}
- Expected completion: {{expectedCompletion}}
- Download expires: {{expiryDate}}

You'll receive another email when your export is ready for download.

If you didn't request this export, please contact our support team immediately.

Best regards,
The Village Team

---
Privacy Team: privacy@village.ch
Support: support@village.ch
```

## 2. Data Export Ready

**Subject:** Your Data Export is Ready - Village

```
Hi {{firstName}},

Your data export is ready for download!

**Download Information:**
- Request ID: {{requestId}}
- File size: {{fileSize}}
- Format: {{fileFormat}}
- Expires: {{expiryDate}}

[Download Your Data]({{downloadLink}})

**Important Notes:**
- This link will expire in 30 days
- You can download the file up to 3 times
- Keep this email secure as it contains your personal data
- The file is encrypted and password protected

If you have any questions or need assistance, please contact our support team.

Best regards,
The Village Team

---
Privacy Team: privacy@village.ch
Support: support@village.ch
```

## 3. Account Deletion Verification

**Subject:** Verify Your Account Deletion Request - Village

```
Hi {{firstName}},

We've received a request to delete your Village account.

**Request Details:**
- Request ID: {{requestId}}
- Deletion Type: {{deletionType}}
- Requested on: {{requestDate}}

**⚠️ IMPORTANT: This action cannot be undone!**

Your account and all associated data will be permanently deleted, including:
- Your profile and personal information
- All uploaded documents and files
- Task progress and history
- All privacy settings and consents

**To confirm this deletion, please click the link below:**

[Confirm Account Deletion]({{verificationLink}})

**If you didn't request this deletion:**
- Ignore this email
- Your account will remain active
- Consider changing your password if you suspect unauthorized access

This verification link will expire in 24 hours.

Best regards,
The Village Team

---
Privacy Team: privacy@village.ch
Support: support@village.ch
```

## 4. Account Deletion Confirmed

**Subject:** Account Deletion Confirmed - Village

```
Hi {{firstName}},

Your account deletion request has been confirmed and is being processed.

**Deletion Details:**
- Request ID: {{requestId}}
- Deletion Type: {{deletionType}}
- Confirmed on: {{confirmationDate}}
- Processing time: 24-72 hours

**What happens next:**
1. Your account will be deactivated immediately
2. All personal data will be deleted within 72 hours
3. You'll receive a final confirmation email when complete
4. Some data may be retained for legal compliance (anonymized)

**Important Notes:**
- You cannot log in to your account anymore
- All your data will be permanently removed
- This action cannot be undone
- You can create a new account anytime

If you have any questions, please contact our support team.

Best regards,
The Village Team

---
Privacy Team: privacy@village.ch
Support: support@village.ch
```

## 5. Account Deletion Cancelled

**Subject:** Account Deletion Cancelled - Village

```
Hi {{firstName}},

Your account deletion request has been cancelled.

**Request Details:**
- Request ID: {{requestId}}
- Cancelled on: {{cancellationDate}}

Your account remains active and all your data is safe.

**Your account is fully restored:**
- You can continue using all features
- All your data remains intact
- No action is required on your part

If you have any questions or need assistance, please contact our support team.

Best regards,
The Village Team

---
Privacy Team: privacy@village.ch
Support: support@village.ch
```

## 6. Final Deletion Notice

**Subject:** Account Successfully Deleted - Village

```
Hi {{firstName}},

Your account has been successfully deleted from Village.

**Deletion Summary:**
- Request ID: {{requestId}}
- Completed on: {{completionDate}}
- Deletion Type: {{deletionType}}

**What was deleted:**
✓ Your profile and personal information
✓ All uploaded documents and files
✓ Task progress and history
✓ All privacy settings and consents
✓ Your account and login credentials

**Legal Retention:**
Some anonymized data may be retained for legal compliance purposes (e.g., financial records for 7 years). This data cannot be linked back to you.

**Your Rights:**
- You can create a new account anytime
- You can contact us with any questions
- You have the right to request information about any retained data

Thank you for using Village. We wish you all the best!

Best regards,
The Village Team

---
Privacy Team: privacy@village.ch
Support: support@village.ch
```

## 7. Privacy Policy Update

**Subject:** Important: Privacy Policy Update - Village

```
Hi {{firstName}},

We've updated our Privacy Policy to better protect your data and comply with new regulations.

**What's New:**
- Enhanced data protection measures
- Clearer explanation of your rights
- Updated third-party service information
- Improved consent management

**Your Options:**
1. **Accept the new policy** - Continue using Village normally
2. **Review the changes** - Read the full policy at [Privacy Policy]({{privacyPolicyLink}})
3. **Update your preferences** - Adjust your privacy settings at [Privacy Dashboard]({{privacyDashboardLink}})

**Important:**
- The new policy takes effect on {{effectiveDate}}
- Your current privacy settings remain unchanged
- You can update your preferences anytime

If you have any questions about these changes, please contact our privacy team.

Best regards,
The Village Team

---
Privacy Team: privacy@village.ch
Support: support@village.ch
```

## 8. Data Breach Notification

**Subject:** Important Security Notice - Village

```
Hi {{firstName}},

We're writing to inform you about a security incident that may have affected your personal data.

**Incident Details:**
- Date of incident: {{incidentDate}}
- Type of incident: {{incidentType}}
- Data potentially affected: {{affectedData}}
- Our response: {{responseActions}}

**What we're doing:**
✓ Investigating the incident thoroughly
✓ Implementing additional security measures
✓ Notifying relevant authorities
✓ Monitoring for any misuse of data

**What you can do:**
- Monitor your accounts for suspicious activity
- Consider changing your password
- Review your privacy settings
- Contact us if you notice anything unusual

**Your Rights:**
- You can request information about the incident
- You can update your privacy preferences
- You can request data export or deletion
- You can file a complaint with the data protection authority

We sincerely apologize for this incident and are committed to protecting your data.

For more information, please contact our privacy team.

Best regards,
The Village Team

---
Privacy Team: privacy@village.ch
Support: support@village.ch
Emergency Contact: security@village.ch
```

## 9. Consent Withdrawal Confirmation

**Subject:** Consent Withdrawal Confirmed - Village

```
Hi {{firstName}},

We've received your request to withdraw consent for {{consentType}}.

**Withdrawal Details:**
- Consent Type: {{consentType}}
- Withdrawn on: {{withdrawalDate}}
- Effective immediately

**What this means:**
- We will stop processing your data for this purpose
- Some services may be limited or unavailable
- Your account remains active
- You can re-consent anytime

**Next Steps:**
- Your preferences have been updated
- You can review all consents in your [Privacy Dashboard]({{privacyDashboardLink}})
- Contact us if you have any questions

Thank you for using Village.

Best regards,
The Village Team

---
Privacy Team: privacy@village.ch
Support: support@village.ch
```

## Template Variables

All templates support the following variables:

### User Data
- `{{firstName}}` - User's first name
- `{{lastName}}` - User's last name
- `{{email}}` - User's email address
- `{{userId}}` - User's unique identifier

### Request Data
- `{{requestId}}` - Unique request identifier
- `{{requestDate}}` - Date when request was made
- `{{expectedCompletion}}` - Expected completion date
- `{{expiryDate}}` - When the request/link expires
- `{{fileSize}}` - Size of exported data
- `{{fileFormat}}` - Format of exported data (JSON, CSV, ZIP)

### Links
- `{{downloadLink}}` - Secure download link
- `{{verificationLink}}` - Account deletion verification link
- `{{privacyPolicyLink}}` - Link to privacy policy
- `{{privacyDashboardLink}}` - Link to privacy dashboard

### Dates
- `{{confirmationDate}}` - When request was confirmed
- `{{cancellationDate}}` - When request was cancelled
- `{{completionDate}}` - When deletion was completed
- `{{effectiveDate}}` - When new policy takes effect
- `{{incidentDate}}` - Date of security incident

### Other
- `{{deletionType}}` - Type of deletion (full_deletion, anonymization)
- `{{consentType}}` - Type of consent being withdrawn
- `{{incidentType}}` - Type of security incident
- `{{affectedData}}` - Description of affected data
- `{{responseActions}}` - Actions taken in response

