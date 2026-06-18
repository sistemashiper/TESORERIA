import { createClient } from '@supabase/supabase-js';

// Supabase URL and anon key must be set in environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export a helper for authentication (optional)
export const getUserByEmail = async (email: string) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
    if (error) throw error;
    return data;
};

