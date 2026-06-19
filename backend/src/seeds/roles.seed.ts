import { db } from '@/db/index.js'
import { roles, features, roleFeaturePermissions } from '@/db/schema/index.js'
import type { RoleKey, FeatureKey } from '@/db/schema/rbac.js'

const ROLES: Array<{ roleKey: RoleKey; displayName: string; description: string }> = [
  { roleKey: 'owner',    displayName: 'Vehicle Owner',   description: 'Primary owner of a vehicle' },
  { roleKey: 'co_owner', displayName: 'Co-Owner',        description: 'Shared access to a vehicle' },
  { roleKey: 'buyer',    displayName: 'Buyer',           description: 'Scoped, temporary read access via share link' },
  { roleKey: 'garage',   displayName: 'Garage',          description: 'Verified garage partner' },
  { roleKey: 'insurer',  displayName: 'Insurer',         description: 'Insurance company partner' },
  { roleKey: 'admin',    displayName: 'System Admin',    description: 'Full system access, feature flag management' },
]

const FEATURES: Array<{ featureKey: FeatureKey; displayName: string; description: string }> = [
  { featureKey: 'document_vault',    displayName: 'Document Vault',      description: 'Upload and manage vehicle documents' },
  { featureKey: 'service_records',   displayName: 'Service Records',     description: 'Log vehicle service history' },
  { featureKey: 'insurance_records', displayName: 'Insurance Records',   description: 'Manage insurance policies' },
  { featureKey: 'revenue_licenses',  displayName: 'Revenue Licenses',    description: 'Track revenue license renewals' },
  { featureKey: 'emission_tests',    displayName: 'Emission Tests',      description: 'Log emission test results' },
  { featureKey: 'timeline',          displayName: 'Timeline Feed',       description: 'View vehicle lifecycle timeline' },
  { featureKey: 'qr_sharing',        displayName: 'QR Sharing',          description: 'Generate and share QR codes' },
  { featureKey: 'notifications',     displayName: 'Notifications',       description: 'Renewal reminders and alerts' },
  { featureKey: 'admin_panel',       displayName: 'Admin Panel',         description: 'System administration tools' },
  { featureKey: 'share_links',       displayName: 'Share Links',         description: 'Create scoped, expiring share links for buyers' },
  { featureKey: 'co_owners',         displayName: 'Co-Owners',           description: 'Add shared access to a vehicle for family/co-owners' },
  { featureKey: 'ownership_transfer',displayName: 'Ownership Transfer',  description: 'Initiate and claim vehicle ownership transfers' },
  { featureKey: 'vehicle_insights',  displayName: 'Vehicle Insights',    description: 'Health score, valuation, and predictive maintenance' },
  { featureKey: 'partner_portal',    displayName: 'Partner Portal',      description: 'Garage and insurer partner record submission' },
]

// Permission matrix: which roles can access which features
const PERMISSIONS: Array<{ roleKey: RoleKey; featureKey: FeatureKey; canAccess: boolean }> = [
  // owner — full access to vehicle features
  { roleKey: 'owner', featureKey: 'document_vault',    canAccess: true },
  { roleKey: 'owner', featureKey: 'service_records',   canAccess: true },
  { roleKey: 'owner', featureKey: 'insurance_records', canAccess: true },
  { roleKey: 'owner', featureKey: 'revenue_licenses',  canAccess: true },
  { roleKey: 'owner', featureKey: 'emission_tests',    canAccess: true },
  { roleKey: 'owner', featureKey: 'timeline',          canAccess: true },
  { roleKey: 'owner', featureKey: 'qr_sharing',        canAccess: true },
  { roleKey: 'owner', featureKey: 'notifications',     canAccess: true },
  { roleKey: 'owner', featureKey: 'admin_panel',       canAccess: false },

  // co_owner — same as owner minus admin
  { roleKey: 'co_owner', featureKey: 'document_vault',    canAccess: true },
  { roleKey: 'co_owner', featureKey: 'service_records',   canAccess: true },
  { roleKey: 'co_owner', featureKey: 'insurance_records', canAccess: true },
  { roleKey: 'co_owner', featureKey: 'revenue_licenses',  canAccess: true },
  { roleKey: 'co_owner', featureKey: 'emission_tests',    canAccess: true },
  { roleKey: 'co_owner', featureKey: 'timeline',          canAccess: true },
  { roleKey: 'co_owner', featureKey: 'qr_sharing',        canAccess: false },
  { roleKey: 'co_owner', featureKey: 'notifications',     canAccess: true },
  { roleKey: 'co_owner', featureKey: 'admin_panel',       canAccess: false },

  // buyer — read-only via share link
  { roleKey: 'buyer', featureKey: 'document_vault',    canAccess: false },
  { roleKey: 'buyer', featureKey: 'service_records',   canAccess: false },
  { roleKey: 'buyer', featureKey: 'insurance_records', canAccess: false },
  { roleKey: 'buyer', featureKey: 'revenue_licenses',  canAccess: false },
  { roleKey: 'buyer', featureKey: 'emission_tests',    canAccess: false },
  { roleKey: 'buyer', featureKey: 'timeline',          canAccess: true },
  { roleKey: 'buyer', featureKey: 'qr_sharing',        canAccess: false },
  { roleKey: 'buyer', featureKey: 'notifications',     canAccess: false },
  { roleKey: 'buyer', featureKey: 'admin_panel',       canAccess: false },

  // garage — can add service records
  { roleKey: 'garage', featureKey: 'document_vault',    canAccess: false },
  { roleKey: 'garage', featureKey: 'service_records',   canAccess: true },
  { roleKey: 'garage', featureKey: 'insurance_records', canAccess: false },
  { roleKey: 'garage', featureKey: 'revenue_licenses',  canAccess: false },
  { roleKey: 'garage', featureKey: 'emission_tests',    canAccess: false },
  { roleKey: 'garage', featureKey: 'timeline',          canAccess: false },
  { roleKey: 'garage', featureKey: 'qr_sharing',        canAccess: false },
  { roleKey: 'garage', featureKey: 'notifications',     canAccess: false },
  { roleKey: 'garage', featureKey: 'admin_panel',       canAccess: false },

  // insurer — can add insurance records
  { roleKey: 'insurer', featureKey: 'document_vault',    canAccess: false },
  { roleKey: 'insurer', featureKey: 'service_records',   canAccess: false },
  { roleKey: 'insurer', featureKey: 'insurance_records', canAccess: true },
  { roleKey: 'insurer', featureKey: 'revenue_licenses',  canAccess: false },
  { roleKey: 'insurer', featureKey: 'emission_tests',    canAccess: false },
  { roleKey: 'insurer', featureKey: 'timeline',          canAccess: false },
  { roleKey: 'insurer', featureKey: 'qr_sharing',        canAccess: false },
  { roleKey: 'insurer', featureKey: 'notifications',     canAccess: false },
  { roleKey: 'insurer', featureKey: 'admin_panel',       canAccess: false },

  // owner — phase 3/4/5 features
  { roleKey: 'owner', featureKey: 'share_links',        canAccess: true },
  { roleKey: 'owner', featureKey: 'co_owners',          canAccess: true },
  { roleKey: 'owner', featureKey: 'ownership_transfer', canAccess: true },
  { roleKey: 'owner', featureKey: 'vehicle_insights',   canAccess: true },
  { roleKey: 'owner', featureKey: 'partner_portal',     canAccess: false },

  // co_owner — can view insights but cannot share or transfer
  { roleKey: 'co_owner', featureKey: 'share_links',        canAccess: false },
  { roleKey: 'co_owner', featureKey: 'co_owners',          canAccess: false },
  { roleKey: 'co_owner', featureKey: 'ownership_transfer', canAccess: false },
  { roleKey: 'co_owner', featureKey: 'vehicle_insights',   canAccess: true },
  { roleKey: 'co_owner', featureKey: 'partner_portal',     canAccess: false },

  // buyer — no direct feature access
  { roleKey: 'buyer', featureKey: 'share_links',        canAccess: false },
  { roleKey: 'buyer', featureKey: 'co_owners',          canAccess: false },
  { roleKey: 'buyer', featureKey: 'ownership_transfer', canAccess: false },
  { roleKey: 'buyer', featureKey: 'vehicle_insights',   canAccess: false },
  { roleKey: 'buyer', featureKey: 'partner_portal',     canAccess: false },

  // garage — partner portal for submitting records
  { roleKey: 'garage', featureKey: 'share_links',        canAccess: false },
  { roleKey: 'garage', featureKey: 'co_owners',          canAccess: false },
  { roleKey: 'garage', featureKey: 'ownership_transfer', canAccess: false },
  { roleKey: 'garage', featureKey: 'vehicle_insights',   canAccess: false },
  { roleKey: 'garage', featureKey: 'partner_portal',     canAccess: true },

  // insurer — partner portal for insurance submissions
  { roleKey: 'insurer', featureKey: 'share_links',        canAccess: false },
  { roleKey: 'insurer', featureKey: 'co_owners',          canAccess: false },
  { roleKey: 'insurer', featureKey: 'ownership_transfer', canAccess: false },
  { roleKey: 'insurer', featureKey: 'vehicle_insights',   canAccess: false },
  { roleKey: 'insurer', featureKey: 'partner_portal',     canAccess: true },

  // admin — bypasses RBAC checks in code, but seed it fully for completeness
  { roleKey: 'admin', featureKey: 'document_vault',     canAccess: true },
  { roleKey: 'admin', featureKey: 'service_records',    canAccess: true },
  { roleKey: 'admin', featureKey: 'insurance_records',  canAccess: true },
  { roleKey: 'admin', featureKey: 'revenue_licenses',   canAccess: true },
  { roleKey: 'admin', featureKey: 'emission_tests',     canAccess: true },
  { roleKey: 'admin', featureKey: 'timeline',           canAccess: true },
  { roleKey: 'admin', featureKey: 'qr_sharing',         canAccess: true },
  { roleKey: 'admin', featureKey: 'notifications',      canAccess: true },
  { roleKey: 'admin', featureKey: 'admin_panel',        canAccess: true },
  { roleKey: 'admin', featureKey: 'share_links',        canAccess: true },
  { roleKey: 'admin', featureKey: 'co_owners',          canAccess: true },
  { roleKey: 'admin', featureKey: 'ownership_transfer', canAccess: true },
  { roleKey: 'admin', featureKey: 'vehicle_insights',   canAccess: true },
  { roleKey: 'admin', featureKey: 'partner_portal',     canAccess: true },
]

export async function seedRoles() {
  console.log('Seeding roles...')
  await db.insert(roles).values(ROLES).onConflictDoNothing()

  console.log('Seeding features...')
  await db.insert(features).values(FEATURES).onConflictDoNothing()

  console.log('Seeding role_feature_permissions...')
  await db.insert(roleFeaturePermissions).values(PERMISSIONS).onConflictDoNothing()

  console.log('Roles/features/permissions seeded.')
}
