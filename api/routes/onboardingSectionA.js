const express = require('express');
const db = require('../config/database');
const { validateSchema } = require('../validators/onboarding');
const { SectionASchema } = require('../validators/onboarding');
const { 
  requireAuth, 
  requireEmailVerified, 
  requireOrgOwnership,
  requireOrgStatus,
  getUserOrganization,
  auditLog 
} = require('../middleware/onboarding');
const { sendOnboardingCompletedEmail } = require('../services/emailService');

const router = express.Router();

// Get Section A data (final organization profile)
router.get('/section-a',
  requireAuth,
  requireEmailVerified,
  getUserOrganization,
  requireOrgStatus('final_info_pending'),
  async (req, res) => {
    try {
      // Get existing organization profile
      const profileResult = await db.pool.query(
        `SELECT legal_name, trading_name, registration_number, registration_type, registration_type_other,
                date_of_registration, country_of_registration, tax_identification_number,
                physical_address, postal_address, website,
                primary_contact_person, primary_contact_title, primary_contact_email, primary_contact_phone,
                finance_contact_person, finance_contact_email, finance_contact_phone,
                submitted_at
         FROM org_profile_section_a
         WHERE organization_id = $1`,
        [req.userOrganization.id]
      );

      let profile = null;
      if (profileResult.rows.length > 0) {
        const row = profileResult.rows[0];
        profile = {
          legalName: row.legal_name,
          tradingName: row.trading_name,
          registrationNumber: row.registration_number,
          registrationType: row.registration_type,
          registrationTypeOther: row.registration_type_other,
          dateOfRegistration: row.date_of_registration,
          countryOfRegistration: row.country_of_registration,
          taxIdentificationNumber: row.tax_identification_number,
          physicalAddress: row.physical_address,
          postalAddress: row.postal_address,
          website: row.website,
          primaryContactPerson: row.primary_contact_person,
          primaryContactTitle: row.primary_contact_title,
          primaryContactEmail: row.primary_contact_email,
          primaryContactPhone: row.primary_contact_phone,
          financeContactPerson: row.finance_contact_person,
          financeContactEmail: row.finance_contact_email,
          financeContactPhone: row.finance_contact_phone,
          submittedAt: row.submitted_at
        };
      }

      res.json({
        organizationStatus: req.userOrganization.status,
        profile
      });

    } catch (error) {
      console.error('Get Section A error:', error);
      res.status(500).json({ error: 'Failed to load organization profile' });
    }
  }
);

// Save Section A draft
router.post('/section-a/save',
  requireAuth,
  requireEmailVerified,
  getUserOrganization,
  requireOrgStatus('final_info_pending'),
  validateSchema(SectionASchema),
  auditLog('section_a_save'),
  async (req, res) => {
    try {
      const {
        legalName, tradingName, registrationNumber, registrationType, registrationTypeOther,
        dateOfRegistration, countryOfRegistration, taxIdentificationNumber,
        physicalAddress, postalAddress, website,
        primaryContactPerson, primaryContactTitle, primaryContactEmail, primaryContactPhone,
        financeContactPerson, financeContactEmail, financeContactPhone
      } = req.validatedData;

      await db.pool.query(
        `INSERT INTO org_profile_section_a (
           organization_id, legal_name, trading_name, registration_number, registration_type, registration_type_other,
           date_of_registration, country_of_registration, tax_identification_number,
           physical_address, postal_address, website,
           primary_contact_person, primary_contact_title, primary_contact_email, primary_contact_phone,
           finance_contact_person, finance_contact_email, finance_contact_phone
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (organization_id)
         DO UPDATE SET
           legal_name = EXCLUDED.legal_name,
           trading_name = EXCLUDED.trading_name,
           registration_number = EXCLUDED.registration_number,
           registration_type = EXCLUDED.registration_type,
           registration_type_other = EXCLUDED.registration_type_other,
           date_of_registration = EXCLUDED.date_of_registration,
           country_of_registration = EXCLUDED.country_of_registration,
           tax_identification_number = EXCLUDED.tax_identification_number,
           physical_address = EXCLUDED.physical_address,
           postal_address = EXCLUDED.postal_address,
           website = EXCLUDED.website,
           primary_contact_person = EXCLUDED.primary_contact_person,
           primary_contact_title = EXCLUDED.primary_contact_title,
           primary_contact_email = EXCLUDED.primary_contact_email,
           primary_contact_phone = EXCLUDED.primary_contact_phone,
           finance_contact_person = EXCLUDED.finance_contact_person,
           finance_contact_email = EXCLUDED.finance_contact_email,
           finance_contact_phone = EXCLUDED.finance_contact_phone,
           updated_at = CURRENT_TIMESTAMP`,
        [
          req.userOrganization.id, legalName, tradingName, registrationNumber, registrationType, registrationTypeOther,
          dateOfRegistration, countryOfRegistration, taxIdentificationNumber,
          physicalAddress, postalAddress, website,
          primaryContactPerson, primaryContactTitle, primaryContactEmail, primaryContactPhone,
          financeContactPerson, financeContactEmail, financeContactPhone
        ]
      );

      res.json({ message: 'Draft saved successfully' });

    } catch (error) {
      console.error('Save Section A error:', error);
      res.status(500).json({ error: 'Failed to save draft' });
    }
  }
);

// Submit Section A (finalize onboarding)
router.post('/section-a/submit',
  requireAuth,
  requireEmailVerified,
  getUserOrganization,
  requireOrgStatus('final_info_pending'),
  validateSchema(SectionASchema),
  auditLog('section_a_submit'),
  async (req, res) => {
    try {
      const {
        legalName, tradingName, registrationNumber, registrationType, registrationTypeOther,
        dateOfRegistration, countryOfRegistration, taxIdentificationNumber,
        physicalAddress, postalAddress, website,
        primaryContactPerson, primaryContactTitle, primaryContactEmail, primaryContactPhone,
        financeContactPerson, financeContactEmail, financeContactPhone
      } = req.validatedData;

      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        // Save organization profile with submission timestamp
        await client.query(
          `INSERT INTO org_profile_section_a (
             organization_id, legal_name, trading_name, registration_number, registration_type, registration_type_other,
             date_of_registration, country_of_registration, tax_identification_number,
             physical_address, postal_address, website,
             primary_contact_person, primary_contact_title, primary_contact_email, primary_contact_phone,
             finance_contact_person, finance_contact_email, finance_contact_phone,
             submitted_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP)
           ON CONFLICT (organization_id)
           DO UPDATE SET
             legal_name = EXCLUDED.legal_name,
             trading_name = EXCLUDED.trading_name,
             registration_number = EXCLUDED.registration_number,
             registration_type = EXCLUDED.registration_type,
             registration_type_other = EXCLUDED.registration_type_other,
             date_of_registration = EXCLUDED.date_of_registration,
             country_of_registration = EXCLUDED.country_of_registration,
             tax_identification_number = EXCLUDED.tax_identification_number,
             physical_address = EXCLUDED.physical_address,
             postal_address = EXCLUDED.postal_address,
             website = EXCLUDED.website,
             primary_contact_person = EXCLUDED.primary_contact_person,
             primary_contact_title = EXCLUDED.primary_contact_title,
             primary_contact_email = EXCLUDED.primary_contact_email,
             primary_contact_phone = EXCLUDED.primary_contact_phone,
             finance_contact_person = EXCLUDED.finance_contact_person,
             finance_contact_email = EXCLUDED.finance_contact_email,
             finance_contact_phone = EXCLUDED.finance_contact_phone,
             submitted_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP`,
          [
            req.userOrganization.id, legalName, tradingName, registrationNumber, registrationType, registrationTypeOther,
            dateOfRegistration, countryOfRegistration, taxIdentificationNumber,
            physicalAddress, postalAddress, website,
            primaryContactPerson, primaryContactTitle, primaryContactEmail, primaryContactPhone,
            financeContactPerson, financeContactEmail, financeContactPhone
          ]
        );

        // Update organization status to finalized
        await client.query(
          'UPDATE organizations SET status = $1, finalized_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['finalized', req.userOrganization.id]
        );

        await client.query('COMMIT');

        // Send completion email
        await sendOnboardingCompletedEmail(
          req.user.email,
          req.user.first_name,
          legalName
        );

        res.json({ 
          message: 'Onboarding completed successfully! Welcome to the Sub-Grant Platform.',
          nextStep: 'dashboard'
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Submit Section A error:', error);
      res.status(500).json({ error: 'Failed to complete onboarding' });
    }
  }
);

module.exports = router;
