-- Razorpay Invoice + GST Database Schema
-- This schema supports both business and non-business clients with proper GST compliance

-- Create invoices table for Razorpay Invoice API
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    razorpay_invoice_id TEXT UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL,
    plan_id TEXT NOT NULL,
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'one-time')),
    
    -- Customer Information
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_type TEXT DEFAULT 'individual' CHECK (customer_type IN ('individual', 'business')),
    
    -- Business Information (for GST compliance)
    business_name TEXT,
    gst_number TEXT,
    business_address JSONB,
    billing_address JSONB,
    
    -- Invoice Details
    base_amount INTEGER NOT NULL, -- Amount in cents (before tax)
    tax_amount INTEGER DEFAULT 0, -- Tax amount in cents
    total_amount INTEGER NOT NULL, -- Total amount in cents (base + tax)
    currency TEXT NOT NULL DEFAULT 'INR',
    
    -- GST Details
    gst_rate DECIMAL(5,2) DEFAULT 18.00, -- GST rate percentage
    cgst_amount INTEGER DEFAULT 0, -- CGST amount in cents
    sgst_amount INTEGER DEFAULT 0, -- SGST amount in cents
    igst_amount INTEGER DEFAULT 0, -- IGST amount in cents
    is_export BOOLEAN DEFAULT FALSE, -- For international clients
    
    -- Invoice Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled', 'expired')),
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Razorpay Integration
    razorpay_payment_id TEXT,
    razorpay_order_id TEXT,
    
    -- Metadata
    invoice_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice_items table for detailed line items
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    item_description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price INTEGER NOT NULL, -- Price per unit in cents
    total_price INTEGER NOT NULL, -- Total price in cents
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    tax_amount INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gst_registrations table for business clients
CREATE TABLE IF NOT EXISTS gst_registrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    gst_number TEXT UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    business_type TEXT CHECK (business_type IN ('proprietorship', 'partnership', 'llp', 'private_limited', 'public_limited', 'other')),
    business_address JSONB NOT NULL,
    contact_person TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tax_settings table for configurable tax rates
CREATE TABLE IF NOT EXISTS tax_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tax_type TEXT NOT NULL CHECK (tax_type IN ('cgst', 'sgst', 'igst', 'gst')),
    tax_rate DECIMAL(5,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table for invoice-related information
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Customer type for GST determination
    customer_type TEXT DEFAULT 'individual' CHECK (customer_type IN ('individual', 'business')),
    
    -- Business information
    business_name TEXT,
    gst_number TEXT,
    business_address JSONB,
    billing_address JSONB,
    
    -- Invoice preferences
    invoice_email TEXT,
    auto_invoice BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_customer_type ON user_profiles(customer_type);

-- Enable RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_razorpay_invoice_id ON invoices(razorpay_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_type ON invoices(customer_type);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_gst_registrations_user_id ON gst_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_gst_registrations_gst_number ON gst_registrations(gst_number);
CREATE INDEX IF NOT EXISTS idx_tax_settings_tax_type ON tax_settings(tax_type);
CREATE INDEX IF NOT EXISTS idx_tax_settings_is_active ON tax_settings(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices table
CREATE POLICY "Users can view their own invoices" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" ON invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" ON invoices
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for invoice_items table
CREATE POLICY "Users can view their own invoice items" ON invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own invoice items" ON invoice_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own invoice items" ON invoice_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM invoices 
            WHERE invoices.id = invoice_items.invoice_id 
            AND invoices.user_id = auth.uid()
        )
    );

-- Create RLS policies for gst_registrations table
CREATE POLICY "Users can view their own GST registrations" ON gst_registrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own GST registrations" ON gst_registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own GST registrations" ON gst_registrations
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for tax_settings table (admin only)
CREATE POLICY "Only admins can manage tax settings" ON tax_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gst_registrations_updated_at BEFORE UPDATE ON gst_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default tax settings
INSERT INTO tax_settings (tax_type, tax_rate, description) VALUES
('gst', 18.00, 'Standard GST rate for most services'),
('cgst', 9.00, 'Central GST (half of GST rate)'),
('sgst', 9.00, 'State GST (half of GST rate)'),
('igst', 18.00, 'Integrated GST for inter-state transactions')
ON CONFLICT DO NOTHING;

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    invoice_number TEXT;
    year_part TEXT;
    month_part TEXT;
    sequence_part TEXT;
    current_sequence INTEGER;
BEGIN
    -- Get current year and month
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    month_part := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
    
    -- Get next sequence number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-' || year_part || month_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO current_sequence
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || year_part || month_part || '-%';
    
    -- Format sequence part
    sequence_part := LPAD(current_sequence::TEXT, 4, '0');
    
    -- Generate final invoice number
    invoice_number := 'INV-' || year_part || month_part || '-' || sequence_part;
    
    RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate GST
CREATE OR REPLACE FUNCTION calculate_gst(
    base_amount INTEGER,
    gst_rate DECIMAL DEFAULT 18.00,
    is_interstate BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    cgst_amount INTEGER,
    sgst_amount INTEGER,
    igst_amount INTEGER,
    total_tax_amount INTEGER
) AS $$
DECLARE
    half_rate DECIMAL;
    cgst INTEGER;
    sgst INTEGER;
    igst INTEGER;
    total_tax INTEGER;
BEGIN
    half_rate := gst_rate / 2;
    
    IF is_interstate THEN
        -- Inter-state transaction: IGST
        igst := ROUND(base_amount * gst_rate / 100);
        cgst := 0;
        sgst := 0;
    ELSE
        -- Intra-state transaction: CGST + SGST
        cgst := ROUND(base_amount * half_rate / 100);
        sgst := ROUND(base_amount * half_rate / 100);
        igst := 0;
    END IF;
    
    total_tax := cgst + sgst + igst;
    
    RETURN QUERY SELECT cgst, sgst, igst, total_tax;
END;
$$ LANGUAGE plpgsql;
