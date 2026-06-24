// KONFIGURASI SUPABASE
const supabaseUrl = 'https://ihrwikdgehlcgpaoobex.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlocndpa2RnZWhsY2dwYW9vYmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzg0NjgsImV4cCI6MjA5Nzg1NDQ2OH0.ZUiEZGVScYssOZzkEqPnleES9ifG9Ie5QcsUJWOqSGs';

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
