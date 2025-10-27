-- Patient table composite indexes for optimal multi-tenant performance
-- All indexes use organizationId as the leading column for proper data isolation

-- Primary filtering indexes (organizationId + filter field)
CREATE INDEX IF NOT EXISTS idx_patients_org_first_name ON patients(organizationId, firstName);
CREATE INDEX IF NOT EXISTS idx_patients_org_last_name ON patients(organizationId, lastName);
CREATE INDEX IF NOT EXISTS idx_patients_org_email ON patients(organizationId, email);
CREATE INDEX IF NOT EXISTS idx_patients_org_phone ON patients(organizationId, phone);
CREATE INDEX IF NOT EXISTS idx_patients_org_status ON patients(organizationId, status);
CREATE INDEX IF NOT EXISTS idx_patients_org_created_at ON patients(organizationId, createdAt);
CREATE INDEX IF NOT EXISTS idx_patients_org_insurance_provider ON patients(organizationId, insuranceProvider);

-- Multi-field composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_patients_org_name_search ON patients(organizationId, lastName, firstName);
CREATE INDEX IF NOT EXISTS idx_patients_org_status_created ON patients(organizationId, status, createdAt);
CREATE INDEX IF NOT EXISTS idx_patients_org_insurance_status ON patients(organizationId, insuranceProvider, status);

-- Soft delete support with organization isolation
CREATE INDEX IF NOT EXISTS idx_patients_org_deleted_at ON patients(organizationId, deletedAt);
CREATE INDEX IF NOT EXISTS idx_patients_org_active ON patients(organizationId, status, deletedAt);

-- Patient Documents table composite indexes
-- All document queries must include organizationId for multi-tenant isolation

-- Primary document access indexes
CREATE INDEX IF NOT EXISTS idx_patient_documents_org_patient ON patient_documents(organizationId, patientId);
CREATE INDEX IF NOT EXISTS idx_patient_documents_org_category ON patient_documents(organizationId, category);
CREATE INDEX IF NOT EXISTS idx_patient_documents_org_uploaded_at ON patient_documents(organizationId, createdAt);
CREATE INDEX IF NOT EXISTS idx_patient_documents_org_uploaded_by ON patient_documents(organizationId, uploadedBy);

-- Multi-field composite indexes for document queries
CREATE INDEX IF NOT EXISTS idx_patient_documents_org_patient_category ON patient_documents(organizationId, patientId, category);
CREATE INDEX IF NOT EXISTS idx_patient_documents_org_category_uploaded ON patient_documents(organizationId, category, createdAt);

-- Soft delete support with organization isolation
CREATE INDEX IF NOT EXISTS idx_patient_documents_org_deleted_at ON patient_documents(organizationId, deletedAt);
CREATE INDEX IF NOT EXISTS idx_patient_documents_org_active ON patient_documents(organizationId, patientId, deletedAt);