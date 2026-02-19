-- ============================================
-- CONECCIÓN APP - DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Tabla de Niños
CREATE TABLE ninos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  foto_url TEXT,
  diagnostico TEXT,
  notas_adicionales TEXT,
  padre_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Equipo Terapéutico (relación many-to-many entre usuarios y niños)
CREATE TABLE equipo_terapeutico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nino_id UUID REFERENCES ninos(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('padre', 'maestra_sombra', 'terapeuta')),
  permisos TEXT NOT NULL DEFAULT 'lectura' CHECK (permisos IN ('lectura', 'edicion')),
  invitado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nino_id, usuario_id)
);

-- Tabla de Registros Diarios
CREATE TABLE registros_diarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nino_id UUID REFERENCES ninos(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado_animo TEXT CHECK (estado_animo IN ('muy_bien', 'bien', 'regular', 'dificil', 'muy_dificil')),
  actividades TEXT[] DEFAULT '{}',
  logros TEXT,
  desafios TEXT,
  notas TEXT,
  creado_por UUID REFERENCES auth.users(id) NOT NULL,
  tipo_registro TEXT DEFAULT 'escuela' CHECK (tipo_registro IN ('escuela', 'casa', 'terapia')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Perfiles de Usuario (extiende auth.users)
CREATE TABLE perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo TEXT,
  telefono TEXT,
  rol_principal TEXT CHECK (rol_principal IN ('padre', 'maestra_sombra', 'terapeuta')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES para mejor performance
-- ============================================

CREATE INDEX idx_ninos_padre ON ninos(padre_id);
CREATE INDEX idx_equipo_nino ON equipo_terapeutico(nino_id);
CREATE INDEX idx_equipo_usuario ON equipo_terapeutico(usuario_id);
CREATE INDEX idx_registros_nino ON registros_diarios(nino_id);
CREATE INDEX idx_registros_fecha ON registros_diarios(fecha DESC);
CREATE INDEX idx_registros_creado_por ON registros_diarios(creado_por);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE ninos ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipo_terapeutico ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_diarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: Niños
-- ============================================

-- Los padres pueden ver y editar sus propios niños
CREATE POLICY "Padres pueden ver sus niños"
  ON ninos FOR SELECT
  USING (padre_id = auth.uid());

CREATE POLICY "Padres pueden insertar sus niños"
  ON ninos FOR INSERT
  WITH CHECK (padre_id = auth.uid());

CREATE POLICY "Padres pueden actualizar sus niños"
  ON ninos FOR UPDATE
  USING (padre_id = auth.uid());

-- El equipo terapéutico puede ver los niños asignados
CREATE POLICY "Equipo puede ver niños asignados"
  ON ninos FOR SELECT
  USING (
    id IN (
      SELECT nino_id FROM equipo_terapeutico 
      WHERE usuario_id = auth.uid()
    )
  );

-- ============================================
-- POLICIES: Equipo Terapéutico
-- ============================================

-- Los padres pueden gestionar el equipo de sus niños
CREATE POLICY "Padres pueden gestionar equipo de sus niños"
  ON equipo_terapeutico FOR ALL
  USING (
    nino_id IN (
      SELECT id FROM ninos WHERE padre_id = auth.uid()
    )
  );

-- Los miembros del equipo pueden ver el equipo completo del niño
CREATE POLICY "Equipo puede ver otros miembros"
  ON equipo_terapeutico FOR SELECT
  USING (
    nino_id IN (
      SELECT nino_id FROM equipo_terapeutico 
      WHERE usuario_id = auth.uid()
    )
  );

-- ============================================
-- POLICIES: Registros Diarios
-- ============================================

-- El equipo puede ver registros de sus niños asignados
CREATE POLICY "Equipo puede ver registros"
  ON registros_diarios FOR SELECT
  USING (
    nino_id IN (
      SELECT nino_id FROM equipo_terapeutico 
      WHERE usuario_id = auth.uid()
    )
  );

-- Solo miembros con permiso de edición pueden crear registros
CREATE POLICY "Equipo con edición puede crear registros"
  ON registros_diarios FOR INSERT
  WITH CHECK (
    nino_id IN (
      SELECT nino_id FROM equipo_terapeutico 
      WHERE usuario_id = auth.uid() 
      AND permisos = 'edicion'
    )
  );

-- Solo el creador puede actualizar sus propios registros
CREATE POLICY "Creadores pueden actualizar sus registros"
  ON registros_diarios FOR UPDATE
  USING (creado_por = auth.uid());

-- ============================================
-- POLICIES: Perfiles
-- ============================================

-- Los usuarios pueden ver y actualizar su propio perfil
CREATE POLICY "Usuarios pueden ver su perfil"
  ON perfiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar su perfil"
  ON perfiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Usuarios pueden insertar su perfil"
  ON perfiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Los miembros del equipo pueden ver perfiles de otros miembros
CREATE POLICY "Equipo puede ver perfiles de compañeros"
  ON perfiles FOR SELECT
  USING (
    id IN (
      SELECT usuario_id FROM equipo_terapeutico 
      WHERE nino_id IN (
        SELECT nino_id FROM equipo_terapeutico 
        WHERE usuario_id = auth.uid()
      )
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_ninos_updated_at
  BEFORE UPDATE ON ninos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registros_updated_at
  BEFORE UPDATE ON registros_diarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_perfiles_updated_at
  BEFORE UPDATE ON perfiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCIÓN: Agregar padre automáticamente al equipo
-- ============================================

CREATE OR REPLACE FUNCTION add_padre_to_equipo()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO equipo_terapeutico (nino_id, usuario_id, rol, permisos)
  VALUES (NEW.id, NEW.padre_id, 'padre', 'edicion');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_add_padre_to_equipo
  AFTER INSERT ON ninos
  FOR EACH ROW
  EXECUTE FUNCTION add_padre_to_equipo();

-- ============================================
-- FUNCIÓN: Crear perfil automáticamente al registrarse
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfiles (id, nombre_completo, rol_principal)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', ''),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'padre')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- VIEWS útiles
-- ============================================

-- Vista: Resumen de registros por niño
CREATE OR REPLACE VIEW vista_resumen_registros AS
SELECT 
  n.id as nino_id,
  n.nombre,
  n.apellido,
  COUNT(r.id) as total_registros,
  COUNT(CASE WHEN r.fecha >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as registros_semana,
  MAX(r.fecha) as ultimo_registro,
  AVG(
    CASE r.estado_animo
      WHEN 'muy_bien' THEN 5
      WHEN 'bien' THEN 4
      WHEN 'regular' THEN 3
      WHEN 'dificil' THEN 2
      WHEN 'muy_dificil' THEN 1
    END
  ) as promedio_animo
FROM ninos n
LEFT JOIN registros_diarios r ON n.id = r.nino_id
GROUP BY n.id, n.nombre, n.apellido;

-- ============================================
-- Comentarios de documentación
-- ============================================

COMMENT ON TABLE ninos IS 'Información de los niños registrados en la plataforma';
COMMENT ON TABLE equipo_terapeutico IS 'Relación entre niños y su equipo de apoyo (padres, maestras, terapeutas)';
COMMENT ON TABLE registros_diarios IS 'Registros diarios de actividades, logros y desafíos';
COMMENT ON TABLE perfiles IS 'Perfiles extendidos de usuarios más allá de auth.users';

-- ============================================
-- DONE!
-- ============================================
