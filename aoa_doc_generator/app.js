/**
 * Articles of Association / Bylaws Generator for Husseiniya / Ma'tam
 * Fully Fixed & Dynamic JS with Guarded Null Checks
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Vibrant Emblem Placeholder for Husseiniya / Ma'tam
    const DEFAULT_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNDAiIGhlaWdodD0iMTQwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzgwMDAyMCIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIGQ9Ik0xMiAyTDQgN3Y2YzAgNS41NSAzLzg0IDEwLjc0IDggMTIgNC4xNi0xLjI2IDgtNS40NSA4LTEyVjdsLTgtNXoiLz48cGF0aCBkPSJNMTIgNnY2TDE1IDE1IiBzdHJva2U9IiNjNTliMjciIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==";

    let docState = {
        metadata: {
            title: "النظام الأساسي واللوائح التنظيمية",
            orgName: "حسينية الإمام علي (ع)",
            version: "الإصدار الأول 1.0",
            date: new Date().toISOString().split('T')[0],
            logoUri: DEFAULT_LOGO
        },
        sections: [
            {
                id: "sec-1",
                title: "الباب الأول: الأحكام العامة والأهداف",
                articles: [
                    {
                        id: "art-1",
                        title: "المادة (1): التعريف والاسم",
                        content: "المأتم / الحسينية هي مؤسسة دينية اجتماعية أهلية تُعنى بإحياء المناسبات الدينية وإقامة الشعائر، وتسمى رسمياً 'حسينية الإمام علي (ع)'."
                    },
                    {
                        id: "art-2",
                        title: "المادة (2): الأهداف والغايات",
                        content: "تهدف الحسينية إلى تعزيز القيم الإسلامية الإنسانية، نشر التوعية الثقافية والدينية، وترسيخ التكافل الاجتماعي والتطوع في خدمة المجتمع."
                    }
                ]
            },
            {
                id: "sec-2",
                title: "الباب الثاني: الهيكل التنظيمي وإدارة المأتم",
                articles: [
                    {
                        id: "art-3",
                        title: "المادة (3): مجلس الإدارة",
                        content: "يتولى إدارة الحسينية مجلس إدارة منتخب أو متوافق عليه يعنى بالإشراف على كافة الشؤون التنفيذية والمالية والإدارية."
                    }
                ]
            }
        ]
    };

    let compiledHtmlCache = "";

    const elements = {
        sidebar: document.getElementById('sidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        themeToggle: document.getElementById('themeToggle'),
        printBtn: document.getElementById('printBtn'),
        globalSearch: document.getElementById('globalSearch'),
        
        tabBtns: document.querySelectorAll('.tab-btn'),
        tabPanes: document.querySelectorAll('.tab-pane'),
        
        inputDocTitle: document.getElementById('inputDocTitle'),
        inputOrgName: document.getElementById('inputOrgName'),
        inputDocVersion: document.getElementById('inputDocVersion'),
        inputDocDate: document.getElementById('inputDocDate'),
        logoUploader: document.getElementById('logoUploader'),
        removeLogoBtn: document.getElementById('removeLogoBtn'),
        
        editorAccordion: document.getElementById('editorAccordion'),
        addSectionBtn: document.getElementById('addSectionBtn'),
        documentOutline: document.getElementById('documentOutline'),
        
        exportJsonBtn: document.getElementById('exportJsonBtn'),
        exportHtmlBtn: document.getElementById('exportHtmlBtn'),
        importJsonInput: document.getElementById('importJsonInput'),
        
        renderOrgName: document.getElementById('renderOrgName'),
        renderDocTitle: document.getElementById('renderDocTitle'),
        renderDocVersion: document.getElementById('renderDocVersion'),
        renderDocDate: document.getElementById('renderDocDate'),
        coverLogo: document.getElementById('coverLogo'),
        renderToc: document.getElementById('renderToc'),
        renderSectionsContainer: document.getElementById('renderSectionsContainer'),

        previewModal: document.getElementById('previewModal'),
        previewIframe: document.getElementById('previewIframe'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        cancelModalBtn: document.getElementById('cancelModalBtn'),
        confirmDownloadHtmlBtn: document.getElementById('confirmDownloadHtmlBtn')
    };

    function init() {
        bindEvents();
        bindEditorDelegation();
        syncFormWithState();
        renderDocumentView();
        renderOutlineTree();
        buildEditorAccordion();
    }

    function syncFormWithState() {
        if (elements.inputDocTitle) elements.inputDocTitle.value = docState.metadata.title;
        if (elements.inputOrgName) elements.inputOrgName.value = docState.metadata.orgName;
        if (elements.inputDocVersion) elements.inputDocVersion.value = docState.metadata.version;
        if (elements.inputDocDate) elements.inputDocDate.value = docState.metadata.date;
    }

    function renderDocumentView() {
        if (elements.renderOrgName) elements.renderOrgName.textContent = docState.metadata.orgName;
        if (elements.renderDocTitle) elements.renderDocTitle.textContent = docState.metadata.title;
        if (elements.renderDocVersion) elements.renderDocVersion.textContent = docState.metadata.version;
        if (elements.renderDocDate) elements.renderDocDate.textContent = docState.metadata.date || '—';

        const coverPage = document.querySelector('.page-cover');
        if (coverPage) {
            coverPage.setAttribute('data-org', docState.metadata.orgName);
            coverPage.setAttribute('data-version', docState.metadata.version);
        }

        if (elements.coverLogo) {
            if (docState.metadata.logoUri) {
                elements.coverLogo.src = docState.metadata.logoUri;
                elements.coverLogo.classList.remove('hidden');
                if (elements.removeLogoBtn) elements.removeLogoBtn.classList.remove('hidden');
            } else {
                elements.coverLogo.src = '';
                elements.coverLogo.classList.add('hidden');
                if (elements.removeLogoBtn) elements.removeLogoBtn.classList.add('hidden');
            }
        }

        renderTableOfContents();
        renderSectionsAndArticles();
    }

    function renderTableOfContents() {
        if (!elements.renderToc) return;
        elements.renderToc.innerHTML = '';
        docState.sections.forEach((sec, idx) => {
            const tocItem = document.createElement('a');
            tocItem.className = 'toc-item';
            tocItem.href = `#${sec.id}`;
            tocItem.innerHTML = `
                <span class="toc-item-title">${sec.title}</span>
                <span class="toc-dots"></span>
                <span class="toc-page-ref">باب ${idx + 1}</span>
            `;
            elements.renderToc.appendChild(tocItem);

            sec.articles.forEach(art => {
                const subTocItem = document.createElement('a');
                subTocItem.className = 'toc-item';
                subTocItem.style.paddingRight = '1.5rem';
                subTocItem.style.fontSize = '0.9rem';
                subTocItem.href = `#${art.id}`;
                subTocItem.innerHTML = `
                    <span class="toc-item-title">${art.title}</span>
                    <span class="toc-dots"></span>
                `;
                elements.renderToc.appendChild(subTocItem);
            });
        });
    }

    function renderSectionsAndArticles() {
        if (!elements.renderSectionsContainer) return;
        elements.renderSectionsContainer.innerHTML = '';

        docState.sections.forEach(sec => {
            // Vibrant Section Cover Page
            const coverNode = document.createElement('section');
            coverNode.className = 'section-cover-page';
            coverNode.id = sec.id;
            coverNode.innerHTML = `
                <div class="vibrant-section-card">
                    <h2>${sec.title}</h2>
                    <div class="section-card-line"></div>
                </div>
            `;
            elements.renderSectionsContainer.appendChild(coverNode);

            // Articles Flow
            const contentNode = document.createElement('div');
            contentNode.className = 'section-content-wrapper';

            sec.articles.forEach(art => {
                const articleNode = document.createElement('article');
                articleNode.className = 'article-node';
                articleNode.id = art.id;
                articleNode.innerHTML = `
                    <h3 class="article-title-vibrant">${art.title}</h3>
                    <p class="article-content">${art.content.replace(/
/g, '<br>')}</p>
                `;
                contentNode.appendChild(articleNode);
            });

            elements.renderSectionsContainer.appendChild(contentNode);
        });
    }

    function renderOutlineTree() {
        if (!elements.documentOutline) return;
        elements.documentOutline.innerHTML = '';
        docState.sections.forEach(sec => {
            const secLink = document.createElement('a');
            secLink.className = 'outline-item depth-1';
            secLink.href = `#${sec.id}`;
            secLink.textContent = sec.title;
            elements.documentOutline.appendChild(secLink);

            sec.articles.forEach(art => {
                const artLink = document.createElement('a');
                artLink.className = 'outline-item depth-2';
                artLink.href = `#${art.id}`;
                artLink.textContent = art.title;
                elements.documentOutline.appendChild(artLink);
            });
        });
    }

    function buildEditorAccordion() {
        if (!elements.editorAccordion) return;
        elements.editorAccordion.innerHTML = '';

        docState.sections.forEach((sec, secIdx) => {
            const accItem = document.createElement('div');
            accItem.className = 'accordion-item';

            let articlesFormHtml = sec.articles.map((art, artIdx) => `
                <div class="form-group" style="border-top: 1px dashed var(--border-sidebar); padding-top: 0.5rem; margin-top: 0.5rem;">
                    <label>عنوان المادة</label>
                    <input type="text" data-sec="${secIdx}" data-art="${artIdx}" class="art-title-input" value="${art.title}">
                    <label style="margin-top: 0.35rem;">محتوى المادة</label>
                    <textarea data-sec="${secIdx}" data-art="${artIdx}" class="art-content-input" rows="3">${art.content}</textarea>
                    <button data-sec="${secIdx}" data-art="${artIdx}" class="btn-danger-sm delete-art-btn">حذف المادة</button>
                </div>
            `).join('');

            accItem.innerHTML = `
                <div class="accordion-header">
                    <span>${sec.title}</span>
                    <button data-sec="${secIdx}" class="btn-danger-sm delete-sec-btn">حذف الباب</button>
                </div>
                <div class="accordion-body">
                    <div class="form-group">
                        <label>عنوان الباب</label>
                        <input type="text" data-sec="${secIdx}" class="sec-title-input" value="${sec.title}">
                    </div>
                    ${articlesFormHtml}
                    <button data-sec="${secIdx}" class="btn-sm add-art-btn" style="margin-top:0.5rem;">+ إضافة مادة</button>
                </div>
            `;
            elements.editorAccordion.appendChild(accItem);
        });
    }

    function bindEditorDelegation() {
        if (!elements.editorAccordion) return;
        elements.editorAccordion.addEventListener('input', (e) => {
            const target = e.target;
            if (target.classList.contains('sec-title-input')) {
                docState.sections[target.dataset.sec].title = target.value;
                renderDocumentView();
                renderOutlineTree();
            } else if (target.classList.contains('art-title-input')) {
                docState.sections[target.dataset.sec].articles[target.dataset.art].title = target.value;
                renderDocumentView();
                renderOutlineTree();
            } else if (target.classList.contains('art-content-input')) {
                docState.sections[target.dataset.sec].articles[target.dataset.art].content = target.value;
                renderDocumentView();
            }
        });

        elements.editorAccordion.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('delete-sec-btn')) {
                docState.sections.splice(target.dataset.sec, 1);
                refreshEditorAndPreview();
            } else if (target.classList.contains('delete-art-btn')) {
                docState.sections[target.dataset.sec].articles.splice(target.dataset.art, 1);
                refreshEditorAndPreview();
            } else if (target.classList.contains('add-art-btn')) {
                docState.sections[target.dataset.sec].articles.push({
                    id: `art-${Date.now()}`,
                    title: `المادة (${docState.sections[target.dataset.sec].articles.length + 1}): مادة جديدة`,
                    content: "أدخل نص المادة هنا..."
                });
                refreshEditorAndPreview();
            }
        });
    }

    function refreshEditorAndPreview() {
        buildEditorAccordion();
        renderDocumentView();
        renderOutlineTree();
    }

    function generateStandaloneHtml() {
        const sectionsHtml = docState.sections.map(sec => `
            <section class="section-cover-page" id="${sec.id}">
                <div class="vibrant-section-card">
                    <h2>${sec.title}</h2>
                    <div class="section-card-line"></div>
                </div>
            </section>
            <div class="section-content-wrapper">
                ${sec.articles.map(art => `
                    <article class="article-node" id="${art.id}">
                        <h3 class="article-title-vibrant">${art.title}</h3>
                        <p class="article-content">${art.content.replace(/
/g, '<br>')}</p>
                    </article>
                `).join('')}
            </div>
        `).join('');

        const tocHtml = docState.sections.map((sec, idx) => `
            <a class="toc-item" href="#${sec.id}">
                <span class="toc-item-title">${sec.title}</span>
                <span class="toc-dots"></span>
                <span class="toc-page-ref">باب ${idx + 1}</span>
            </a>
            ${sec.articles.map(art => `
                <a class="toc-item" style="padding-right: 1.5rem; font-size: 0.9rem;" href="#${art.id}">
                    <span class="toc-item-title">${art.title}</span>
                    <span class="toc-dots"></span>
                </a>
            `).join('')}
        `).join('');

        const logoHtml = docState.metadata.logoUri 
            ? `<img src="${docState.metadata.logoUri}" alt="Logo" class="brand-logo">`
            : '';

        return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${docState.metadata.title} - ${docState.metadata.orgName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Tajawal', sans-serif; background-color: #f1f5f9; color: #0f172a; direction: rtl; text-align: right; line-height: 1.6; }
        .reader-container { max-width: 210mm; margin: 0 auto; background: #ffffff; padding: 20mm 15mm; }
        
        /* Cover Page */
        .page-cover { page: cover-page; break-after: page; min-height: 250mm; display: flex; flex-direction: column; justify-content: space-between; align-items: center; text-align: center; }
        .cover-center-content { margin: auto 0; width: 100%; display: flex; flex-direction: column; align-items: center; }
        .brand-logo { max-width: 220px; max-height: 220px; object-fit: contain; margin-bottom: 2rem; }
        .cover-org-name { font-size: 2.3rem; font-weight: 800; color: #800020; margin-bottom: 1.25rem; }
        .cover-accent-badge { display: inline-block; padding: 0.75rem 2rem; background: linear-gradient(135deg, rgba(128,0,32,0.06) 0%, rgba(197,155,39,0.12) 100%); border-right: 4px solid #800020; border-left: 4px solid #c59b27; border-radius: 6px; }
        .cover-accent-badge span { font-size: 1.4rem; font-weight: 700; color: #800020; }
        
        .cover-footer-card { width: 85%; display: flex; align-items: center; justify-content: space-around; background-color: #fdfbf7; border: 1px solid rgba(197, 155, 39, 0.3); border-radius: 10px; padding: 1rem 1.5rem; }
        .card-item { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
        .card-label { font-size: 0.8rem; color: #888888; font-weight: 600; }
        .card-value { font-size: 0.95rem; font-weight: 700; color: #800020; }
        .card-divider { width: 1px; height: 32px; background-color: rgba(197, 155, 39, 0.3); }

        /* Header Bar */
        .header-bar-centered { display: flex; align-items: center; justify-content: center; gap: 0.75rem; border-bottom: 1.5px solid #c59b27; padding-bottom: 6px; width: 100%; }
        .header-logo-mini { height: 22px; width: auto; object-fit: contain; }
        .header-title-text { font-size: 9.5pt; font-weight: 700; color: #800020; }

        /* TOC & Sections */
        .page-toc { page: content-page; break-before: page; break-after: page; margin-bottom: 3rem; }
        .section-toc-title { font-size: 1.6rem; color: #800020; border-bottom: 3px solid #c59b27; padding-bottom: 0.5rem; margin-bottom: 1.75rem; text-align: center; }
        .toc-list { display: flex; flex-direction: column; gap: 0.85rem; }
        .toc-item { display: flex; justify-content: space-between; align-items: baseline; font-size: 1rem; text-decoration: none; color: #0f172a; }
        .toc-dots { flex: 1; border-bottom: 1px dotted #94a3b8; margin: 0 0.75rem; }
        
        .section-cover-page { page: section-cover; break-before: page; break-after: page; min-height: 230mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
        .vibrant-section-card { width: 90%; padding: 3.5rem 2rem; background: linear-gradient(135deg, rgba(128, 0, 32, 0.04) 0%, rgba(197, 155, 39, 0.08) 100%); border: 2px solid #c59b27; border-radius: 16px; }
        .vibrant-section-card h2 { font-size: 2.2rem; font-weight: 800; color: #800020; margin: 0; }
        .section-card-line { width: 60px; height: 4px; background: #c59b27; margin: 1.25rem auto 0 auto; border-radius: 2px; }

        .article-node { margin-top: 1.5rem; margin-bottom: 1.75rem; break-inside: avoid; }
        .article-title-vibrant { font-size: 1.2rem; font-weight: 800; color: #800020; background-color: #fdfbf7; border-right: 5px solid #c59b27; padding: 0.5rem 1rem; border-radius: 0 6px 6px 0; margin-bottom: 0.75rem; }
        .article-content { font-size: 1rem; line-height: 1.8; color: #1e293b; text-align: justify; }

        @page {
            size: A4 portrait;
            margin: 28mm 15mm 22mm 15mm;
            @bottom-left { content: "صفحة " counter(page) " من " counter(pages); font-family: 'Tajawal'; font-size: 8.5pt; font-weight: 600; color: #64748b; }
            @bottom-right { content: "${docState.metadata.version} — ${docState.metadata.orgName}"; font-family: 'Tajawal'; font-size: 8.5pt; font-weight: 600; color: #800020; }
        }
        @page cover-page { margin: 15mm; @top-center { content: none; } @bottom-left { content: none; } @bottom-right { content: none; } }
        @page section-cover { margin: 15mm; @top-center { content: none; } @bottom-left { content: none; } @bottom-right { content: none; } }
    </style>
</head>
<body>
    <div class="reader-container">
        <header class="page-cover">
            <div class="cover-center-content">
                ${logoHtml}
                <h1 class="cover-org-name">${docState.metadata.orgName}</h1>
                <div class="cover-accent-badge">
                    <span>${docState.metadata.title}</span>
                </div>
            </div>
            <div class="cover-footer-card">
                <div class="card-item">
                    <span class="card-label">الاصدار</span>
                    <span class="card-value">${docState.metadata.version}</span>
                </div>
                <div class="card-divider"></div>
                <div class="card-item">
                    <span class="card-label">تاريخ الاعتماد</span>
                    <span class="card-value">${docState.metadata.date || '—'}</span>
                </div>
            </div>
        </header>

        <nav class="page-toc">
            <h2 class="section-toc-title">فهرس الأبواب والمواد</h2>
            <div class="toc-list">${tocHtml}</div>
        </nav>

        <main>${sectionsHtml}</main>
    </div>
</body>
</html>`;
    }

    function triggerHtmlDownload(htmlContent) {
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `${docState.metadata.orgName.replace(/\s+/g, '_')}_النظام_الأساسي.html`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
    }

    function bindEvents() {
        elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.tabBtns.forEach(b => b.classList.remove('active'));
                elements.tabPanes.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const targetPane = document.getElementById(`tab-${btn.dataset.tab}`);
                if (targetPane) targetPane.classList.add('active');
            });
        });

        elements.sidebarToggle?.addEventListener('click', () => elements.sidebar?.classList.toggle('collapsed'));

        elements.themeToggle?.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
            document.body.classList.remove('theme-auto');
        });

        elements.printBtn?.addEventListener('click', () => window.print());

        elements.inputDocTitle?.addEventListener('input', (e) => { docState.metadata.title = e.target.value; renderDocumentView(); });
        elements.inputOrgName?.addEventListener('input', (e) => { docState.metadata.orgName = e.target.value; renderDocumentView(); });
        elements.inputDocVersion?.addEventListener('input', (e) => { docState.metadata.version = e.target.value; renderDocumentView(); });
        elements.inputDocDate?.addEventListener('change', (e) => { docState.metadata.date = e.target.value; renderDocumentView(); });

        elements.logoUploader?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    docState.metadata.logoUri = evt.target.result;
                    renderDocumentView();
                };
                reader.readAsDataURL(file);
            }
        });

        elements.removeLogoBtn?.addEventListener('click', () => {
            docState.metadata.logoUri = '';
            if (elements.logoUploader) elements.logoUploader.value = '';
            renderDocumentView();
        });

        elements.addSectionBtn?.addEventListener('click', () => {
            docState.sections.push({
                id: `sec-${Date.now()}`,
                title: `الباب الجديد ${docState.sections.length + 1}`,
                articles: []
            });
            refreshEditorAndPreview();
        });

        elements.exportJsonBtn?.addEventListener('click', () => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(docState, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `bylaws_${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        });

        elements.exportHtmlBtn?.addEventListener('click', () => {
            compiledHtmlCache = generateStandaloneHtml();
            if (elements.previewIframe) elements.previewIframe.srcdoc = compiledHtmlCache;
            if (elements.previewModal) elements.previewModal.classList.remove('hidden');
        });

        elements.closeModalBtn?.addEventListener('click', () => elements.previewModal?.classList.add('hidden'));
        elements.cancelModalBtn?.addEventListener('click', () => elements.previewModal?.classList.add('hidden'));

        elements.confirmDownloadHtmlBtn?.addEventListener('click', () => {
            triggerHtmlDownload(compiledHtmlCache);
            elements.previewModal?.classList.add('hidden');
        });

        elements.importJsonInput?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const importedData = JSON.parse(evt.target.result);
                        if (importedData.metadata && importedData.sections) {
                            docState = importedData;
                            syncFormWithState();
                            refreshEditorAndPreview();
                        } else {
                            alert("الملف غير صالح.");
                        }
                    } catch (err) {
                        alert("حدث خطأ أثناء قراءة ملف JSON.");
                    }
                };
                reader.readAsText(file);
            }
        });
    }

    init();
});
