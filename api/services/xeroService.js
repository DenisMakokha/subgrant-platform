const axios = require('axios');
const crypto = require('crypto');

class XeroService {
  constructor() {
    this.baseUrl = 'https://api.xero.com/api.xro/2.0';
    this.accessToken = process.env.XERO_ACCESS_TOKEN;
    this.clientId = process.env.XERO_CLIENT_ID;
    this.clientSecret = process.env.XERO_CLIENT_SECRET;
    this.webhookKey = process.env.XERO_WEBHOOK_KEY;
  }

  // Helper method to make authenticated requests to Xero API
  async makeRequest(method, url, data = null, params = null) {
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${url}`,
        headers,
        data,
        params
      });
      return response.data;
    } catch (error) {
      console.error('Xero API request failed:', error.response?.data || error.message);
      throw new Error(`Xero API request failed: ${error.response?.data?.Message || error.message}`);
    }
  }

  // Validate Xero webhook signature
  validateWebhookSignature(req) {
    const signature = req.headers['xero-signature'];
    if (!signature) {
      throw new Error('Missing Xero signature header');
    }

    const payload = JSON.stringify(req.body);
    const hash = crypto
      .createHmac('sha256', this.webhookKey)
      .update(payload)
      .digest('base64');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(signature)
    );

    if (!isValid) {
      throw new Error('Invalid Xero webhook signature');
    }

    return true;
  }

  // Synchronize partner organization as a contact in Xero
  async syncPartnerContact(organization) {
    const xeroContact = {
      Name: organization.legal_name || organization.name,
      FirstName: organization.primary_contact_first_name,
      LastName: organization.primary_contact_last_name,
      EmailAddress: organization.email,
      Addresses: [
        {
          AddressType: "POBOX",
          AddressLine1: organization.address,
          City: organization.city,
          PostalCode: organization.postal_code,
          Country: organization.country
        }
      ]
    };

    try {
      // Check if contact already exists
      const existingContact = await this.searchContacts(`Name="${xeroContact.Name}"`);
      
      if (existingContact && existingContact.Contacts && existingContact.Contacts.length > 0) {
        // Update existing contact
        const contactId = existingContact.Contacts[0].ContactID;
        const updatedContact = await this.makeRequest('POST', `/Contacts/${contactId}`, xeroContact);
        return updatedContact;
      } else {
        // Create new contact
        const newContact = await this.makeRequest('POST', '/Contacts', xeroContact);
        return newContact;
      }
    } catch (error) {
      console.error('Failed to sync partner contact:', error);
      throw error;
    }
  }

  // Search for contacts in Xero
  async searchContacts(whereClause) {
    try {
      const params = whereClause ? { where: whereClause } : {};
      const response = await this.makeRequest('GET', '/Contacts', null, params);
      return response;
    } catch (error) {
      console.error('Failed to search contacts:', error);
      throw error;
    }
  }

  // Create an invoice/bill for a disbursement
  async createDisbursementInvoice(disbursement, organization) {
    const invoice = {
      Type: "ACCPAY", // Accounts payable
      Contact: {
        // We need to get the Xero contact ID for the organization
        // This would typically be stored in the organization record
        ContactID: organization.xero_contact_id
      },
      Date: disbursement.planned_date,
      DueDate: disbursement.planned_date,
      LineItems: [
        {
          Description: `Subgrant disbursement - ${disbursement.title}`,
          Quantity: 1,
          UnitAmount: disbursement.amount,
          AccountCode: disbursement.project.account_code, // This would come from project settings
          Tracking: [
            {
              Name: "Project",
              Option: disbursement.project.name
            }
          ]
        }
      ],
      Reference: `DISB-${disbursement.id.substring(0, 8)}`,
      Status: "AUTHORISED"
    };

    try {
      const response = await this.makeRequest('POST', '/Invoices', invoice);
      
      // Update disbursement with Xero reference
      disbursement.invoice_id = response.InvoiceID;
      // In a real implementation, you would save this to the database
      
      return response;
    } catch (error) {
      console.error('Failed to create disbursement invoice:', error);
      throw error;
    }
  }

  // Reconcile payment for an invoice
  async reconcilePayment(invoiceId) {
    try {
      const invoice = await this.makeRequest('GET', `/Invoices/${invoiceId}`);
      
      if (invoice.AmountPaid >= invoice.AmountDue) {
        // Payment is complete, update disbursement status
        // In a real implementation, you would find the disbursement by invoiceId
        // and update its status to 'paid' or 'reconciled'
        
        return {
          status: 'reconciled',
          paid_at: new Date(),
          invoice
        };
      }
      
      return {
        status: 'partially_paid',
        invoice
      };
    } catch (error) {
      console.error('Failed to reconcile payment:', error);
      throw error;
    }
  }

  // Process Xero webhook events
  async processWebhookEvent(event) {
    try {
      switch (event.eventType) {
        case 'INVOICE_PAID':
          return await this.reconcilePayment(event.resourceId);
        case 'CONTACT_UPDATED':
          // Handle contact update if needed
          return { message: 'Contact updated' };
        default:
          console.warn(`Unhandled event type: ${event.eventType}`);
          return { message: 'Event not handled' };
      }
    } catch (error) {
      console.error('Failed to process webhook event:', error);
      throw error;
    }
  }
}

module.exports = new XeroService();