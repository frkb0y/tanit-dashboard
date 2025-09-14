function insertJobFilterBar() {
    // Insert bar above job list
    let mainCol = document.querySelector('.search-results.my-account-listings.col-md-9.col-xs-12');
    if (!mainCol) return;

    // Remove old bar if exists
    let oldBar = document.getElementById("job-filter-bar");
    if (oldBar) oldBar.remove();

    // Build filter bar
    let bar = document.createElement("div");
    bar.id = "job-filter-bar";
    bar.style.display = "flex";
    bar.style.flexWrap = "wrap";
    bar.style.gap = "10px";
    bar.style.alignItems = "center";
    bar.style.padding = "12px 0";
    bar.style.marginBottom = "16px";
    bar.style.borderBottom = "1px solid #e0e0e0";
    bar.style.background = "#f3f6fa";

    // Search input
    let searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.placeholder = "Rechercher (titre, lieu, société)";
    searchInput.style.padding = "7px 10px";
    searchInput.style.borderRadius = "6px";
    searchInput.style.border = "1px solid #ccc";
    searchInput.style.flex = "2 1 200px";
    bar.appendChild(searchInput);

    // Status filter
    let statusSelect = document.createElement("select");
    statusSelect.innerHTML = `
        <option value="">Tous les statuts</option>
        <option value="En attente">En attente</option>
        <option value="Offre cloturé">Offre cloturé</option>
        <option value="Disqualifié">Disqualifié</option>
        <option value="Accepted">Accepted</option>
    `;
    statusSelect.style.padding = "7px 10px";
    statusSelect.style.borderRadius = "6px";
    statusSelect.style.border = "1px solid #ccc";
    bar.appendChild(statusSelect);

    // Sort select
    let sortSelect = document.createElement("select");
    sortSelect.innerHTML = `
        <option value="">Trier par...</option>
        <option value="date">Date postulation</option>
        <option value="place">Lieu</option>
        <option value="title">Titre</option>
        <option value="poste">Nombre de postes</option>
        <option value="vu">Vu par</option>
        <option value="candidats">Candidats ont participé</option>
    `;
    sortSelect.style.padding = "7px 10px";
    sortSelect.style.borderRadius = "6px";
    sortSelect.style.border = "1px solid #ccc";
    bar.appendChild(sortSelect);

    // Attach bar before the job list
    mainCol.prepend(bar);

    // --- Filtering and sorting logic ---
    function filterAndSortJobs() {
        let search = searchInput.value.trim().toLowerCase();
        let status = statusSelect.value;
        let sort = sortSelect.value;

        let jobs = Array.from(mainCol.querySelectorAll("article.joblist-for-resume-profile"));

        jobs.forEach(job => job.style.display = ""); // reset

        let filtered = jobs.filter(job => {
            // Title/company/place
            let title = job.querySelector('.job-title a')?.textContent?.toLowerCase() || '';
            let company = job.querySelector('.name-c')?.textContent?.toLowerCase() || '';
            let place = job.querySelector('.job-location')?.textContent?.toLowerCase() || '';

            let matchesSearch = !search || title.includes(search) || company.includes(search) || place.includes(search);

            // Status
            let stat = null;
            let etatSpan = job.querySelector('.etat span');
            if (etatSpan) stat = etatSpan.textContent.trim();
            let redSpans = job.querySelectorAll('span.red');
            for (let s of redSpans) {
                if (s.textContent.trim() === "Offre cloturé") stat = "Offre cloturé";
                if (s.textContent.trim() === "Disqualifié") stat = "Disqualifié";
            }

            let matchesStatus = !status || stat === status;

            return matchesSearch && matchesStatus;
        });

        // Sorting
        if (sort) {
            filtered.sort((a, b) => {
                function getNumber(selector, el) {
                    let txt = el.querySelector(selector)?.textContent || "";
                    let num = txt.match(/\d+/);
                    return num ? parseInt(num[0], 10) : 0;
                }
                if (sort === "date") {
                    // Find "Postulé le: ..." date
                    let da = a.querySelector('.listing-item__date:not(.visible-xs-480)')?.textContent || "";
                    let db = b.querySelector('.listing-item__date:not(.visible-xs-480)')?.textContent || "";
                    let fa = da.match(/\d{2}\/\d{2}\/\d{4}/); let fb = db.match(/\d{2}\/\d{2}\/\d{4}/);
                    if (fa && fb) return new Date(fb[0].split('/').reverse().join('-')) - new Date(fa[0].split('/').reverse().join('-'));
                    return 0;
                }
                if (sort === "place") {
                    let pa = a.querySelector('.job-location')?.textContent.trim() || "";
                    let pb = b.querySelector('.job-location')?.textContent.trim() || "";
                    return pa.localeCompare(pb);
                }
                if (sort === "title") {
                    let ta = a.querySelector('.job-title a')?.textContent.trim() || "";
                    let tb = b.querySelector('.job-title a')?.textContent.trim() || "";
                    return ta.localeCompare(tb);
                }
                if (sort === "poste") {
                    let na = getNumber('span.red', a);
                    let nb = getNumber('span.red', b);
                    return nb - na;
                }
                if (sort === "vu") {
                    let va = getNumber('.listing-item__views .orange', a);
                    let vb = getNumber('.listing-item__views .orange', b);
                    return vb - va;
                }
                if (sort === "candidats") {
                    let ca = getNumber('.listing-item__applies .orange', a);
                    let cb = getNumber('.listing-item__applies .orange', b);
                    return cb - ca;
                }
                return 0;
            });
        }

        // Hide all jobs, show only filtered/sorted
        jobs.forEach(job => job.style.display = "none");
        filtered.forEach(job => job.style.display = "");
        // Reorder in DOM
        filtered.forEach(job => mainCol.appendChild(job));
    }

    searchInput.addEventListener("input", filterAndSortJobs);
    statusSelect.addEventListener("change", filterAndSortJobs);
    sortSelect.addEventListener("change", filterAndSortJobs);
}

// Initial insertion
insertJobFilterBar();




function buildDashboard() {
    // Remove old dashboard if exists
    let oldDashboard = document.getElementById("tanit-dashboard");
    if (oldDashboard) oldDashboard.remove();

    // Get all job applications
    let jobs = document.querySelectorAll("article.joblist-for-resume-profile");
    let total = jobs.length;

    // Status categories
    let statusLabels = [
        { key: "En attente", label: "En attente", color: "#f59e42" },
        { key: "Offre cloturé", label: "Offre cloturé", color: "#e11d48" },
        { key: "Disqualifié", label: "Disqualifié", color: "#64748b" },
        { key: "Accepted", label: "NaN", color: "#22c55e" } // Update label if needed
    ];

    // Count statuses
    let statusCounts = {
        "En attente": 0,
        "Offre cloturé": 0,
        "Disqualifié": 0,
        "Accepted": 0
    };

    jobs.forEach(job => {
        let status = null;

        // Check for "Offre cloturé" or "Disqualifié" as a span.red anywhere inside the job
        let redSpans = job.querySelectorAll("span.red");
        let found = false;
        for (let s of redSpans) {
            if (s.textContent.trim() === "Offre cloturé") {
                status = "Offre cloturé";
                found = true;
                break;
            }
            if (s.textContent.trim() === "Disqualifié") {
                status = "Disqualifié";
                found = true;
                break;
            }
        }
    if (!found) {
    // Etat is usually in .etat span
    let etatSpan = job.querySelector(".etat span");
    if (etatSpan) {
        let etatText = etatSpan.textContent.trim();
        if (etatText === "En attente") {
            status = "En attente";
        } else if (etatText === "Disqualifié") {
            status = "Disqualifié";
        } else {
            status = "Accepted"; // Any other value goes to Accepted
        }
    } else {
        status = "En attente";
    }
}

        if (statusCounts.hasOwnProperty(status)) statusCounts[status]++;
        else statusCounts["En attente"]++;
    });

    // --- Create dashboard ---
    let dashboard = document.createElement("div");
    dashboard.id = "tanit-dashboard";
    dashboard.style.width = "100%";
    dashboard.style.background = "#fff";
    dashboard.style.border = "1px solid #d1d5db";
    dashboard.style.padding = "12px";
    dashboard.style.fontFamily = "Segoe UI, Arial, sans-serif";
    dashboard.style.margin = "18px 0";
    dashboard.style.borderRadius = "12px";
    dashboard.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
    dashboard.style.display = "flex";
    dashboard.style.flexDirection = "column";
    dashboard.style.alignItems = "center";

    // --- Dashboard title ---
    let title = document.createElement("div");
    title.innerText = "Mes Candidatures";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "10px";
    title.style.fontSize = "1.07em";
    dashboard.appendChild(title);

    // --- Donut Chart ---
    let canvas = document.createElement("canvas");
    canvas.width = 130;
    canvas.height = 130;
    dashboard.appendChild(canvas);

    let ctx = canvas.getContext("2d");
    let startAngle = -0.5 * Math.PI;
    statusLabels.forEach(({key, color}, idx) => {
        let count = statusCounts[key];
        let angle = total ? (count / total) * 2 * Math.PI : 0;
        ctx.beginPath();
        ctx.arc(65, 65, 54, startAngle, startAngle + angle, false);
        ctx.arc(65, 65, 34, startAngle + angle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        startAngle += angle;
    });
    // Inner circle for donut hole
    ctx.beginPath();
    ctx.arc(65, 65, 34, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();

    // --- Legend ---
    let legend = document.createElement("div");
    legend.style.display = "flex";
    legend.style.flexDirection = "column";
    legend.style.gap = "4px";
    legend.style.marginTop = "8px";
    legend.style.fontSize = "0.97em";
    legend.style.width = "100%";

    statusLabels.forEach(({key, label, color}) => {
        let count = statusCounts[key];
        let percent = total ? Math.round((count / total) * 100) : 0;
        let row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.justifyContent = "space-between";
        row.innerHTML = `
          <span style="width:14px;height:14px;display:inline-block;background:${color};border-radius:50%;margin-right:6px;"></span>
          <span style="flex:1;">${label}</span>
          <span style="color:#444;">${count}</span>
          <span style="margin-left:5px;color:#999;">${percent}%</span>
        `;
        legend.appendChild(row);
    });

    dashboard.appendChild(legend);

    // --- Insert dashboard INSIDE sidebar column, under nav ---
    let sidebarCol = document.querySelector('.col-xs-12.col-md-3.mt-30');
    if (sidebarCol) {
        let nav = sidebarCol.querySelector('nav.sidebar');
        if (nav) {
            nav.insertAdjacentElement('afterend', dashboard);
        } else {
            sidebarCol.appendChild(dashboard);
        }
    } else {
        document.body.prepend(dashboard);
    }
}

// Initial build
buildDashboard();
// Auto-refresh every 10 seconds
setInterval(buildDashboard, 10000);