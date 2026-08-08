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

    async getAllServices() {
        const { data, error } = await _client.from('services').select('*').order('created_at', { ascending: false });
        if (error) { console.error('getAllServices error:', error); return []; }
        return data;
    },

    async createService(service) {
        const { data, error } = await _client.from('services').insert(service).select().single();
        if (error) { console.error('createService error:', error); return null; }
        return data;
    },

    async updateService(id, updates) {
        const { data, error } = await _client.from('services').update(updates).eq('id', id).select().single();
        if (error) { console.error('updateService error:', error); return null; }
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
    },

    // ============================================
    // DASHBOARD STATS
    // ============================================
    async getDashboardStats() {
        const profile = await this.getCurrentProfile();
        if (!profile) return { revenue: 0, carsWashed: 0, pending: 0, employees: 0, avgIncome: 0 };

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // All jobs for this business
        const { data: jobs, error: jobsError } = await _client
            .from('jobs')
            .select('id, status, created_at')
            .eq('business_id', profile.business_id);

        if (jobsError) { console.error('getDashboardStats jobs error:', jobsError); }
        const allJobs = jobs || [];

        const doneStatuses = ['completed', 'delivered'];

        const carsWashedToday = allJobs.filter(j =>
            doneStatuses.includes(j.status) && new Date(j.created_at) >= startOfToday
        ).length;

        const pending = allJobs.filter(j => !doneStatuses.includes(j.status)).length;

        // Today's paid payments for this business's jobs
        const jobIds = allJobs.map(j => j.id);
        let revenue = 0;
        if (jobIds.length > 0) {
            const { data: payments, error: paymentsError } = await _client
                .from('payments')
                .select('amount, paid, paid_at, job_id')
                .in('job_id', jobIds)
                .eq('paid', true);

            if (paymentsError) { console.error('getDashboardStats payments error:', paymentsError); }
            const todaysPayments = (payments || []).filter(p =>
                p.paid_at && new Date(p.paid_at) >= startOfToday
            );
            revenue = todaysPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        }

        const avgIncome = carsWashedToday > 0 ? revenue / carsWashedToday : 0;

        // Employee count (owner only — RLS enforces this automatically)
        const { data: employees, error: empError } = await _client
            .from('employees')
            .select('id')
            .eq('business_id', profile.business_id);

        if (empError) { console.error('getDashboardStats employees error:', empError); }

        return {
            revenue,
            carsWashed: carsWashedToday,
            pending,
            employees: (employees || []).length,
            avgIncome
        };
    }
};
