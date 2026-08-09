document.addEventListener('DOMContentLoaded', async () => {
    const content = document.getElementById('settingsContent');
    const signOutBtn = document.getElementById('signOutBtn');
    if (!content) return;

    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    signOutBtn.addEventListener('click', async () => {
        await window.db.signOut();
        window.location.href = 'login.html';
    });

    const profile = await window.db.getCurrentProfile();
    if (!profile) {
        content.innerHTML = '<p style="color: #9ca3af; text-align: center; font-size: 14px;">Could not verify your session. Please log in again.</p>';
        return;
    }

    if (profile.role !== 'owner') {
        content.innerHTML = `
            <div class="input-group">
                <label class="input-label">Name</label>
                <p style="color: #ffffff; font-size: 14px;">${escapeHTML(profile.name)}</p>
            </div>
            <div class="input-group">
                <label class="input-label">Role</label>
                <p style="color: #ffffff; font-size: 14px;">${escapeHTML(profile.role)}</p>
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 8px;">Business settings can only be changed by the owner.</p>
        `;
        return;
    }

    const business = await window.db.getBusiness(profile.business_id);
    if (!business) {
        content.innerHTML = '<p style="color: #9ca3af; text-align: center; font-size: 14px;">Could not load business settings.</p>';
        return;
    }

    content.innerHTML = `
        <div class="input-group">
            <label class="input-label">Business Name</label>
            <input type="text" id="setBizName" class="input-field" value="${escapeHTML(business.name)}">
        </div>

        <div class="input-group">
            <label class="input-label">Currency</label>
            <input type="text" id="setCurrency" class="input-field" value="${escapeHTML(business.currency)}">
        </div>

        <div class="input-group">
            <label class="input-label">Language</label>
            <select id="setLanguage" class="input-field">
                <option value="en" ${business.language === 'en' ? 'selected' : ''}>English</option>
                <option value="ar" ${business.language === 'ar' ? 'selected' : ''}>Arabic</option>
            </select>
        </div>

        <div class="input-group">
            <label class="input-label">Workflow Mode</label>
            <select id="setWorkflowMode" class="input-field">
                <option value="standard" ${business.workflow_mode === 'standard' ? 'selected' : ''}>Standard (2-stage)</option>
                <option value="detailed" ${business.workflow_mode === 'detailed' ? 'selected' : ''}>Detailed (5-stage)</option>
            </select>
        </div>

        <button id="saveSettingsBtn" class="primary-btn">
            <i class="fa-solid fa-check"></i> Save Settings
        </button>
    `;

    document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
        const btn = document.getElementById('saveSettingsBtn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.textContent = 'Saving...';

        const updates = {
            name: document.getElementById('setBizName').value.trim(),
            currency: document.getElementById('setCurrency').value.trim(),
            language: document.getElementById('setLanguage').value,
            workflow_mode: document.getElementById('setWorkflowMode').value
        };

        const result = await window.db.updateBusiness(profile.business_id, updates);

        btn.disabled = false;
        btn.innerHTML = originalText;

        if (!result) {
            alert('Something went wrong saving settings. Please try again.');
            return;
        }

        alert('Settings saved!');
    });
});
