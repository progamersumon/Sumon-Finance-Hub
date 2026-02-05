
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nwpbjpuhypysgdujoknz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53cGJqcHVoeXB5c2dkdWpva256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNzg3MTcsImV4cCI6MjA4NTg1NDcxN30.f8bD_NQbk78bDWDRAealervAL3FILIwf_jBz9eqWdak';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
