/**
 * Articles of Association Generator
 * Paged.js Integrated Script & Dynamic Document Renderer (Robust / Null-Guarded)
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Default SVG Placeholder Logo encoded via Base64
    const DEFAULT_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFlM2E4YSIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiLz48cGF0aCBkPSJNOSA4aDZNOSAxMmg2TTkgMTZoNCIvPjwvc3ZnPg==";

    let docState = {
        metadata: {
            title: "عقد تأسيس الشركة والنظام الأساسي",
            orgName: "شركة التقنية المتقدمة ذ.م.م",
            version: "v1.0.0",
            date: new Date().toISOString().split('T')[0],
            logoUri: DEFAULT_LOGO
        },
        sections: [
            {
                id: "sec-1",
                title: "الباب الأول: تأسيس الشركة واسمها وغرضها",
                articles: [
                    {
                        id: "art-1",
                        title: "المادة (1): التأسيس والاسم",
                        content: "تأسست طبقاً لأحكام القوانين النافذة شركة ذات مسؤولية محدودة تسمى 'شركة التقنية المتقدمة ذ.م.م'، وتخضع لكافة الأنظمة واللوائح القانونية المعتمدة."
                    },
                    {
                        id: "art-2",
                        title: "المادة (2): أغراض الشركة",
                        content: "الغرض من تأسيس الشركة هو تقديم خدمات تكنولوجيا المعلومات، وتطوير البرمجيات، وتقديم الاستشارات التقنية، وإدارة المشاريع الرقمية."
                    }
                ]
            },
            {
                id: "sec-2",
                title: "الباب الثاني: رأس المال والحصص",
                articles: [
                    {
                        id: "art-3",
                        title: "المادة (3): رأس المال",
                        content: "حدد رأس مال الشركة بمبلغ وقدره 100,000 دينار مقسم إلى حصص متساوية قيمة كل منها مدفوعة بالكامل من قبل الشركاء."
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
                <span class="toc-page-ref">قسم ${idx + 1}</span>
            `;
            elements.renderToc.appendChild(tocItem);

            sec.articles.forEach(art => {
                const subTocItem = document.createElement('a');
                subTocItem.className = 'toc-item';
                subTocItem.style.paddingRight = '1.5rem';
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
            const coverNode = document.createElement('section');
            coverNode.className = 'section-cover-page';
            coverNode.id = sec.id;
            coverNode.innerHTML = `<h2>${sec.title}</h2>`;
            elements.renderSectionsContainer.appendChild(coverNode);

            const contentNode = document.createElement('div');
            contentNode.className = 'section-content-wrapper';

            sec.articles.forEach(art => {
                const articleNode = document.createElement('article');
                articleNode.className = 'article-node';
                articleNode.id = art.id;
                articleNode.innerHTML = `
                    <h3 class="article-title">${art.title}</h3>
                    <p class="article-content">${art.content.replace(/\n/g, '<br>')}</p>
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
                <h2>${sec.title}</h2>
            </section>
            <div class="section-content-wrapper">
                ${sec.articles.map(art => `
                    <article class="article-node" id="${art.id}">
                        <h3 class="article-title">${art.title}</h3>
                        <p class="article-content">${art.content.replace(/\n/g, '<br>')}</p>
                    </article>
                `).join('')}
            </div>
        `).join('');

        const tocHtml = docState.sections.map((sec, idx) => `
            <a class="toc-item" href="#${sec.id}">
                <span class="toc-item-title">${sec.title}</span>
                <span class="toc-dots"></span>
                <span class="toc-page-ref">قسم ${idx + 1}</span>
            </a>
            ${sec.articles.map(art => `
                <a class="toc-item" style="padding-right: 1.5rem;" href="#${art.id}">
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
        body { font-family: 'Tajawal', sans-serif; background-color: #f4f5f7; color: #0f172a; direction: rtl; text-align: right; line-height: 1.6; }
        .reader-container { max-width: 210mm; margin: 0 auto; background: #ffffff; padding: 20mm 15mm; }
        .page-cover { page: cover-page; break-after: page; min-height: 220mm; display: flex; flex-direction: column; justify-content: space-between; text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 2rem; margin-bottom: 2rem; }
        .brand-logo { max-width: 140px; max-height: 140px; margin: 0 auto; object-fit: contain; }
        .cover-org-name { font-size: 1.75rem; color: #475569; margin-bottom: 1rem; }
        .cover-divider { width: 80px; height: 4px; background-color: #1e3a8a; margin: 0 auto 1.5rem auto; }
        .cover-title { font-size: 2.25rem; font-weight: 800; color: #1e3a8a; line-height: 1.3; }
        .cover-footer { display: flex; justify-content: space-between; font-size: 0.9rem; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 1rem; }
        .page-toc { page: content-page; break-before: page; break-after: page; margin-bottom: 3rem; padding-bottom: 2rem; }
        .section-toc-title { font-size: 1.5rem; color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
        .toc-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .toc-item { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.95rem; text-decoration: none; color: #0f172a; }
        .toc-dots { flex: 1; border-bottom: 1px dotted #64748b; margin: 0 0.5rem; }
        .section-cover-page { page: section-cover; break-before: page; break-after: page; margin: 3rem 0 1.5rem 0; text-align: center; border-bottom: 2px solid #d97706; padding-bottom: 0.5rem; }
        .section-cover-page h2 { font-size: 1.75rem; color: #1e3a8a; }
        .section-content-wrapper { page: content-page; break-before: page; margin-bottom: 2rem; }
        .article-node { margin-bottom: 1.5rem; padding: 1rem; background: #f8fafc; border-right: 4px solid #1e3a8a; border-radius: 4px; break-inside: avoid; }
        .article-title { font-size: 1.15rem; color: #1e3a8a; margin-bottom: 0.5rem; font-weight: 700; }
        .article-content { font-size: 1rem; color: #0f172a; text-align: justify; }

        @page {
            size: A4 portrait;
            margin: 20mm 15mm 20mm 15mm;
            @bottom-left { content: "صفحة " counter(page) " من " counter(pages); font-family: 'Tajawal'; font-size: 8pt; color: #64748b; }
            @bottom-right { content: "${docState.metadata.orgName}"; font-family: 'Tajawal'; font-size: 8pt; color: #64748b; }
            @top-right { content: "${docState.metadata.title}"; font-family: 'Tajawal'; font-size: 8pt; color: #94a3b8; border-bottom: 1px solid #e2e8f0; }
        }
        @page cover-page { @top-right { content: none; } @bottom-left { content: none; } @bottom-right { content: none; } }
        @page section-cover { @top-right { content: none; } @bottom-left { content: none; } @bottom-right { content: none; } }
    </style>
</head>
<body>
    <div class="reader-container">
        <header class="page-cover">
            <div>${logoHtml}</div>
            <div>
                <h2 class="cover-org-name">${docState.metadata.orgName}</h2>
                <div class="cover-divider"></div>
                <h1 class="cover-title">${docState.metadata.title}</h1>
            </div>
            <div class="cover-footer">
                <span>الإصدار: ${docState.metadata.version}</span>
                <span>التاريخ: ${docState.metadata.date || '—'}</span>
            </div>
        </header>
        <nav class="page-toc">
            <h2 class="section-toc-title">جدول المحتويات</h2>
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
        downloadLink.download = `${docState.metadata.title.replace(/\s+/g, '_')}_paged_reader.html`;
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
            downloadAnchor.setAttribute("download", `articles_of_association_${Date.now()}.json`);
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
