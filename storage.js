// ============================================
// AutoSense — Supabase-backed storage layer
// Replaces the old localStorage-only StorageManager
// ============================================

const SUPABASE_URL = 'https://exwpxatmmnyrncuhdwmy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yiHtgW9AW857nnbt4MIURQ_wPf2rxFD';

const _client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.db = {
    supabase: _client,

    // ============================================
    // AUTH
    // ============================================
    async signIn(email, password) {
        const { data, error } = await _client.auth.signInWithPassword({ email, password });
        if (error) {
            return { success: false, error: error.message };
        }

        const { data: profile, error: profileError } = await _client
            .from('app_users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            return { success: false, error: 'No profile found for this login. Ask the owner to add your account.' };
        }

        return { success: true, user: data.user, profile };
    },

    async signOut() {
        await _client.auth.signOut();
    },

    async getCurrentProfile() {
        const { data: { user } } = await _client.auth.getUser();
        if (!user) return null;

        const { data: profile } = await _client
            .from('app_users')
            .select('*')
            .eq('id', user.id)
            .single();

        return profile || null;
    },

    // ============================================
    // JOBS (replaces the old flat "vehicles" list)
    // ============================================
    async getJobs() {
        const { data, error } = await _client
            .from('jobs')
            .select('*, job_services(*, services(*)), payments(*)')
            .order('created_at', { ascending: false });

        if (error) { console.error('getJobs error:', error); return []; }
        return data;
    },

    async createJob(job) {
        const { data, error } = await _client.from('jobs').insert(job).select().single();
        if (error) { console.error('createJob error:', error); return null; }
        return data;
    },

    async updateJob(id, updates) {
        const { data, error } = await _client.from('jobs').update(updates).eq('id', id).select().single();
        if (error) { console.error('updateJob error:', error); return null; }
        return data;
    },

    // ============================================
    // SERVICES
    // ============================================
    async getServices() {
        const { data, error } = await _client.from('services').select('*').eq('enabled', true);
        if (error) { console.error('getServices error:', error); return []; }
        return data;
    },

    // ============================================
    // EMPLOYEES (owner-only, enforced by RLS)
    // ============================================
    async getEmployees() {
        const { data, error } = await _client.from('employees').select('*');
        if (error) { console.error('getEmployees error:', error); return []; }
        return data;
    },

    async createEmployee(employee) {
        const { data, error } = await _client.from('employees').insert(employee).select().single();
        if (error) { console.error('createEmployee error:', error); return null; }
        return data;
    },

    // ============================================
    // EXPENSES (owner-only, enforced by RLS)
    // ============================================
    async getExpenses() {
        const { data, error } = await _client.from('expenses').select('*').order('expense_date', { ascending: false });
        if (error) { console.error('getExpenses error:', error); return []; }
        return data;
    },

    async addExpense(expense) {
        const { data, error } = await _client.from('expenses').insert(expense).select().single();
        if (error) { console.error('addExpense error:', error); return null; }
        return data;
    },

    // ============================================
    // PAYMENTS
    // ============================================
    async addPayment(payment) {
        const { data, error } = await _client.from('payments').insert(payment).select().single();
        if (error) { console.error('addPayment error:', error); return null; }
        return data;
    }
};
