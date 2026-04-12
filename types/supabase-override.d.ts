// Declaraciones de tipos para resolver problemas de inferencia de Supabase
declare module '@supabase/supabase-js' {
  interface PostgrestFilterBuilder<
    Schema extends GenericSchema,
    Row extends Record<string, unknown>,
    Result,
    RelationName,
    Relationships = unknown,
  > {
    update(values: any): this;
    insert(values: any): this;
  }
}

// Tipos globales para el proyecto
declare global {
  interface Window {
    // Agregar propiedades globales si es necesario
  }
}

export {};
