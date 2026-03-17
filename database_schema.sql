-- MASTER SCHEMA: Lumini Studio Dental System

-- 0. Soporte para Auth y Perfiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    preferred_name TEXT,
    email TEXT,
    document_id TEXT,
    birth_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Sedes / Consultorios
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Pacientes
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES auth.users DEFAULT auth.uid(), -- AISLAMIENTO
    full_name TEXT NOT NULL,
    document_id TEXT, -- Quitando UNIQUE para permitir mismo doc en distintos doctores si fuera necesario, o dejarlo si es global
    profession TEXT,
    phone TEXT,
    birth_date DATE,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.1 Anamnesis / Historia Clínica
CREATE TABLE IF NOT EXISTS clinical_histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES auth.users DEFAULT auth.uid(), -- AISLAMIENTO
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    medical_conditions TEXT,
    allergies TEXT,
    medications TEXT,
    previous_surgeries TEXT,
    family_history TEXT,
    habits TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id) -- Un paciente solo tiene una historia clinica
);

-- 3. Agenda / Citas
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES auth.users DEFAULT auth.uid(), -- AISLAMIENTO
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    type TEXT CHECK (type IN ('clinic', 'delivery')),
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Evolución Clínica
CREATE TABLE IF NOT EXISTS evolution_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES auth.users DEFAULT auth.uid(), -- AISLAMIENTO
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    session_date TIMESTAMPTZ DEFAULT NOW(),
    procedure_notes TEXT,
    amount_paid NUMERIC DEFAULT 0,
    pa_max INTEGER DEFAULT 120,
    pa_min INTEGER DEFAULT 80,
    anesthesia_sensitivity TEXT DEFAULT 'Ninguna',
    antibiotic_sensitivity TEXT DEFAULT 'Ninguna',
    next_appointment_date DATE,
    budget_id UUID, -- Referencia flexible
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Galería de Imágenes
CREATE TABLE IF NOT EXISTS patient_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES auth.users DEFAULT auth.uid(), -- AISLAMIENTO
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    category TEXT CHECK (category IN ('photos', 'xrays')),
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Odontograma
CREATE TABLE IF NOT EXISTS odontograms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES auth.users DEFAULT auth.uid(), -- AISLAMIENTO
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id)
);

CREATE TABLE IF NOT EXISTS odontogram_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES auth.users DEFAULT auth.uid(), -- AISLAMIENTO
    odontogram_id UUID REFERENCES odontograms(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Laboratorio
CREATE TABLE IF NOT EXISTS lab_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES auth.users DEFAULT auth.uid(), -- AISLAMIENTO
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    item_description TEXT NOT NULL,
    status TEXT DEFAULT 'Enviado',
    price NUMERIC DEFAULT 0,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Finanzas y Transacciones
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES auth.users DEFAULT auth.uid(), -- AISLAMIENTO
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    description TEXT,
    amount_pyg NUMERIC NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')),
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Bioseguridad / Esterilización
CREATE TABLE IF NOT EXISTS sterilization_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES auth.users DEFAULT auth.uid(), -- AISLAMIENTO (O compartido si prefieres)
    machine_name TEXT DEFAULT 'Autoclave Premium',
    cycle_number TEXT,
    temperature INTEGER DEFAULT 134,
    pressure NUMERIC DEFAULT 2.2,
    duration_minutes INTEGER DEFAULT 25,
    status TEXT DEFAULT 'EXITOSO',
    performed_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Presupuestos 
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES auth.users DEFAULT auth.uid(), -- AISLAMIENTO
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    description TEXT,
    items JSONB DEFAULT '[]',
    total_cost NUMERIC DEFAULT 0,
    num_sessions INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE odontograms ENABLE ROW LEVEL SECURITY;
ALTER TABLE odontogram_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sterilization_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PRIVADAS (DOCTOR SOLO VE LO SUYO)
DROP POLICY IF EXISTS "Private Access" ON patients;
CREATE POLICY "Private Access" ON patients FOR ALL USING (doctor_id = auth.uid());

DROP POLICY IF EXISTS "Private Access" ON clinical_histories;
CREATE POLICY "Private Access" ON clinical_histories FOR ALL USING (doctor_id = auth.uid());

DROP POLICY IF EXISTS "Private Access" ON appointments;
CREATE POLICY "Private Access" ON appointments FOR ALL USING (doctor_id = auth.uid());

DROP POLICY IF EXISTS "Private Access" ON evolution_notes;
CREATE POLICY "Private Access" ON evolution_notes FOR ALL USING (doctor_id = auth.uid());

DROP POLICY IF EXISTS "Private Access" ON patient_images;
CREATE POLICY "Private Access" ON patient_images FOR ALL USING (doctor_id = auth.uid());

DROP POLICY IF EXISTS "Private Access" ON budgets;
CREATE POLICY "Private Access" ON budgets FOR ALL USING (doctor_id = auth.uid());

DROP POLICY IF EXISTS "Private Access" ON odontograms;
CREATE POLICY "Private Access" ON odontograms FOR ALL USING (doctor_id = auth.uid());

DROP POLICY IF EXISTS "Private Access" ON odontogram_history;
CREATE POLICY "Private Access" ON odontogram_history FOR ALL USING (doctor_id = auth.uid());

DROP POLICY IF EXISTS "Private Access" ON lab_orders;
CREATE POLICY "Private Access" ON lab_orders FOR ALL USING (doctor_id = auth.uid());

DROP POLICY IF EXISTS "Private Access" ON transactions;
CREATE POLICY "Private Access" ON transactions FOR ALL USING (doctor_id = auth.uid());

DROP POLICY IF EXISTS "Private Access" ON sterilization_logs;
CREATE POLICY "Private Access" ON sterilization_logs FOR ALL USING (doctor_id = auth.uid());

-- Clínicas y Settings siguen siendo públicos o compartidos según elección
DROP POLICY IF EXISTS "Public View Clinics" ON clinics;
CREATE POLICY "Public View Clinics" ON clinics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin Manage Clinics" ON clinics;
CREATE POLICY "Admin Manage Clinics" ON clinics FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Public View Settings" ON settings;
CREATE POLICY "Public View Settings" ON settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles Self Manage" ON profiles;
CREATE POLICY "Profiles Self Manage" ON profiles FOR ALL USING (id = auth.uid());
DROP POLICY IF EXISTS "Profiles Public Read" ON profiles;
CREATE POLICY "Profiles Public Read" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins Manage All Profiles" ON profiles;
CREATE POLICY "Admins Manage All Profiles" ON profiles FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 11. Trigger para Perfiles Automáticos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, preferred_name, document_id, birth_date, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'preferred_name',
    NEW.raw_user_meta_data->>'document_id',
    (NEW.raw_user_meta_data->>'birth_date')::date,
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
