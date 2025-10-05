-- Create documents table for user document vault
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_data BYTEA NOT NULL, -- Store the actual file content
    document_type VARCHAR(100) NOT NULL, -- AI-detected type (passport, driver_license, etc.)
    tags TEXT[], -- Array of tags
    confidence DECIMAL(3,2), -- AI confidence score (0.00 to 1.00)
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint (assuming users table exists)
    CONSTRAINT fk_documents_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_updated_at();

-- Add some sample data (optional - for testing)
-- INSERT INTO documents (user_id, file_name, original_name, file_type, file_size, file_data, document_type, tags, confidence, description)
-- VALUES (1, 'passport_scan.jpg', 'My Passport.jpg', 'image/jpeg', 1024000, '\x89504E470D0A1A0A...', 'passport', ARRAY['official', 'government', 'identity', 'travel'], 0.95, 'Swiss passport scan');


