// ============================================================
// portfolio.js — Loads all portfolio data from data.json and
// renders it dynamically into the Portfolio window UI.
// Edit data.json to update your portfolio — no HTML changes needed.
// ============================================================

const PORTFOLIO_DATA_URL = 'data.json';

// Escape HTML to keep rendered content safe
function esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function skillItemHTML(skill) {
    const color = skill.color ? ` style="color: ${esc(skill.color)}"` : '';
    return `
        <div class="skill-item">
            <i class="${esc(skill.icon)}"${color}></i>
            <span>${esc(skill.name)}</span>
        </div>
    `;
}

// ---------- Section renderers ----------

function renderAbout(data) {
    const p = data.profile || {};
    const aboutSkills = (data.aboutSkills || []).map(skillItemHTML).join('');
    const stats = (data.stats || []).map(s => `
        <div class="stat-card">
            <div class="stat-value">${esc(s.value)}</div>
            <div class="stat-label">${esc(s.label)}</div>
        </div>
    `).join('');
    return `
        <h2>About Me</h2>
        <div class="profile-card">
            <div class="profile-avatar">
                <img src="${esc(p.photo)}" alt="${esc(p.name)}" class="profile-photo" />
            </div>
            <div class="profile-info">
                <h3>${esc(p.name)}</h3>
                <p class="title">${esc(p.title)}</p>
                <p>${esc(p.summary || p.bio)}</p>
            </div>
        </div>
        ${stats ? `<div class="stats-row">${stats}</div>` : ''}
        <div class="about-skills" style="margin-top: 10px">
            <div class="skills-grid">${aboutSkills}</div>
        </div>
    `;
}

function renderSkills(data) {
    const categories = (data.skillCategories || []).map(cat => `
        <div class="skill-category">
            <div class="skill-category-header">
                <i class="${esc(cat.icon || 'fas fa-tag')}"></i>
                <h3>${esc(cat.name)}</h3>
            </div>
            <div class="skill-chips">
                ${(cat.skills || []).map(s => `<span class="skill-chip">${esc(s)}</span>`).join('')}
            </div>
        </div>
    `).join('');
    return `
        <h2>Technical Skills</h2>
        <div class="skill-categories">${categories}</div>
    `;
}

function renderQualifications(data) {
    const cards = (data.qualifications || []).map(q => `
        <div class="qualification-card">
            <div class="qualification-icon">
                <i class="${esc(q.icon)}"></i>
            </div>
            <div class="qualification-info">
                <h3>${esc(q.degree)}</h3>
                <h4>${esc(q.institution)}</h4>
                ${q.year ? `<p class="qualification-year">${esc(q.year)}</p>` : ''}
                ${q.details ? `<p class="qualification-details">${esc(q.details)}</p>` : ''}
            </div>
        </div>
    `).join('');
    return `
        <h2>Education</h2>
        <div class="qualification-grid">${cards}</div>
    `;
}

function renderExperience(data) {
    const cards = (data.experience || []).map(exp => {
        const months = computeExperienceMonths(exp.startDate);
        const highlights = (exp.highlights || []).map(h => `<li>${esc(h)}</li>`).join('');
        return `
        <div class="experience-card">
            <div class="experience-header">
                <img src="${esc(exp.logo)}" alt="${esc(exp.company)}" class="company-logo" />
                <div class="experience-info">
                    <h3>${esc(exp.role)}${months ? ` <span class="exp-duration-inline">(${months})</span>` : ''}</h3>
                    <h4>${esc(exp.company)}</h4>
                    <p class="experience-duration">${esc(exp.durationLabel || '')}</p>
                </div>
            </div>
            <div class="experience-description">
                ${exp.description ? `<p>${esc(exp.description)}</p>` : ''}
                ${highlights ? `<ul class="experience-highlights">${highlights}</ul>` : ''}
                <div class="experience-tech">
                    ${(exp.tech || []).map(t => `<span>${esc(t)}</span>`).join('')}
                </div>
            </div>
        </div>
    `;}).join('');
    return `
        <h2>Experience</h2>
        <div class="experience-grid">${cards}</div>
    `;
}

function renderProjects(data) {
    const cards = (data.projects || []).map(prj => `
        <div class="project-card${prj.featured ? ' featured' : ''}">
            <div class="project-header">
                <i class="${esc(prj.icon)}"></i>
                <h3>${esc(prj.title)}</h3>
            </div>
            ${prj.badge ? `<span class="project-badge">${esc(prj.badge)}</span>` : ''}
            <p>${esc(prj.description)}</p>
            <div class="project-tech">
                ${(prj.tech || []).map(t => `<span>${esc(t)}</span>`).join('')}
            </div>
            ${(prj.status && prj.status.length) || prj.role ? `
            <div class="project-status">
                ${prj.role ? `<span class="project-role"><i class="fas fa-user-briefcase"></i> ${esc(prj.role)}</span>` : ''}
                ${(prj.status || []).map(s => `<span class="status-working">${esc(s)}</span>`).join('')}
            </div>` : ''}
        </div>
    `).join('');
    return `
        <h2>Key Projects</h2>
        <div class="projects-grid">${cards}</div>
    `;
}

function renderContact(data) {
    const c = data.contact || {};
    const items = [
        { icon: 'fas fa-envelope', text: c.email, href: `mailto:${c.email}` },
        { icon: 'fas fa-globe', text: c.websiteLabel || c.website, href: c.website },
        { icon: 'fab fa-github', text: c.githubLabel || c.github, href: c.github },
        { icon: 'fas fa-phone', text: c.phone, href: `tel:${String(c.phone || '').replace(/\s+/g, '')}` },
        { icon: 'fas fa-map-marker-alt', text: c.location, href: '' }
    ].filter(i => i.text);

    const socials = (data.socials || []).map(s => `
        <a class="social-btn" href="${esc(s.url)}" target="_blank" rel="noopener">
            <i class="${esc(s.icon)}"></i>
            <span>${esc(s.name)}</span>
        </a>
    `).join('');

    const availability = (data.availability || []).map(a => `
        <span class="availability-chip"><i class="fas fa-circle-check"></i> ${esc(a)}</span>
    `).join('');

    return `
        <h2>Contact Me</h2>
        <div class="contact-info">
            ${items.map(i => i.href
                ? `<a class="contact-item" href="${esc(i.href)}" ${i.href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}><i class="${esc(i.icon)}"></i><span>${esc(i.text)}</span></a>`
                : `<div class="contact-item"><i class="${esc(i.icon)}"></i><span>${esc(i.text)}</span></div>`
            ).join('')}
        </div>
        ${availability ? `<div class="availability-row">${availability}</div>` : ''}
        <div class="socials-row">${socials}</div>
    `;
}

// ---------- Experience duration helper ----------

function computeExperienceMonths(startDate) {
    if (!startDate) return '';
    const start = new Date(startDate);
    const now = new Date();
    let totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) totalMonths--;
    if (totalMonths < 1) totalMonths = 1;
    return totalMonths === 1 ? '1 month' : `${totalMonths} months`;
}

// ---------- Loader ----------

async function loadPortfolioData() {
    const sections = document.querySelectorAll('.portfolio-sections .section');
    try {
        const res = await fetch(PORTFOLIO_DATA_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        window.PORTFOLIO_DATA = data;

        const html = {
            about: renderAbout(data),
            skills: renderSkills(data),
            qualification: renderQualifications(data),
            experience: renderExperience(data),
            projects: renderProjects(data),
            contact: renderContact(data)
        };

        sections.forEach(section => {
            const key = section.id;
            if (html[key]) section.innerHTML = html[key];
        });

        // Keep legacy helper in sync (e.g. other scripts referencing #experience-months)
        const legacyEl = document.getElementById('experience-months');
        if (legacyEl) legacyEl.textContent = computeExperienceMonths(data.experience?.[0]?.startDate);
    } catch (err) {
        console.error('Failed to load portfolio data:', err);
        const message = `
            <div class="loading-state error">
                <i class="fas fa-exclamation-triangle"></i>
                <p><strong>Could not load portfolio data (data.json).</strong></p>
                <p>Run the site over HTTP, e.g. <code>npx serve</code> or <code>python -m http.server</code>, then open it in your browser. Opening index.html directly via file:// blocks fetch requests.</p>
            </div>`;
        sections.forEach(section => section.innerHTML = message);
    }
}

document.addEventListener('DOMContentLoaded', loadPortfolioData);
