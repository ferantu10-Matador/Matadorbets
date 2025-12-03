import { createClient } from '@supabase/supabase-js';

// @ts-ignore process is a node global
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// @ts-ignore process is a node global
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Solo creamos el cliente si las variables existen y no son strings vacíos
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Helper para saber si Supabase está activo
export const isSupabaseConfigured = () => !!supabase;
