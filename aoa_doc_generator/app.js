document.addEventListener('DOMContentLoaded', () => {

    const DEFAULT_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNDAiIGhlaWdodD0iMTQwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzgwMDAyMCIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIGQ9Ik0xMiAyTDQgN3Y2YzAgNS41NSAzLzg0IDEwLjc0IDggMTIgNC4xNi0xLjI2IDgtNS40NSA4LTEyVjdsLTgtNXoiLz48cGF0aCBkPSJNMTIgNnY2TDE1IDE1IiBzdHJva2U9IiNjNTliMjciIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==";

    let docState = {
        metadata: {
            title: "النظام الأساسي واللوائح التنظيمية",
            orgName: "حسينية الإمام علي (ع)",
            version: "v1.0.0",
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
                        title: "المادة (2): الأهداف وغايات المؤسسة",
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
    let searchTerm = "";

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

    function formatTextWithBreaks(text) {
        if (!text) return '';
        // Safe string splitting to avoid regex SyntaxError in string templates
        return text.split('\n').join('<br>');
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
        docState.sections.forEach((sec) => {
            if (!sec.title) return;
            const tocItem = document.createElement('a');
            tocItem.className = 'toc-item';
            tocItem.href = `#${sec.id}`;
            tocItem.innerHTML = `
                <span class="toc-item-title" style="font-weight: bold;">${sec.title}</span>
                <span class="toc-dots"></span>
            `;
            elements.renderToc.appendChild(tocItem);

            sec.articles.forEach(art => {
                if (!art.title) return;
                const subTocItem = document.createElement('a');
                subTocItem.className = 'toc-item';
                subTocItem.style.paddingRight = '1.25rem';
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

        const term = searchTerm.trim().toLowerCase();

        docState.sections.forEach(sec => {
            const matchesSec = sec.title.toLowerCase().includes(term);
            
            const matchingArticles = sec.articles.filter(art => 
                art.title.toLowerCase().includes(term) || art.content.toLowerCase().includes(term)
            );

            if (term && !matchesSec && matchingArticles.length === 0) return;

            const secBlock = document.createElement('div');
            secBlock.className = 'section-block';
            secBlock.id = sec.id;
            
            let html = `<h2>${sec.title}</h2>`;

            const articlesToDisplay = term && !matchesSec ? matchingArticles : sec.articles;

            articlesToDisplay.forEach(art => {
                const formattedContent = formatTextWithBreaks(art.content);
                html += `
                    <div class="article-node" id="${art.id}">
                        <div class="article-title-vibrant">${art.title}</div>
                        <div class="article-content">${formattedContent}</div>
                    </div>
                `;
            });

            secBlock.innerHTML = html;
            elements.renderSectionsContainer.appendChild(secBlock);
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
        const sectionsHtml = docState.sections.map(sec => {
            const articlesArr = sec.articles.map(art => {
                const formattedContent = formatTextWithBreaks(art.content);
                return `
                    <div class="article-title">${art.title}</div>
                    <div class="article-content">${formattedContent}</div>
                `;
            }).join('');
            return `<h2>${sec.title}</h2>${articlesArr}`;
        }).join('');

        const tocHtml = docState.sections.map((sec) => `
            <tr><td class="toc-chapter">${sec.title}</td></tr>
            ${sec.articles.map(art => `
                <tr><td class="toc-article">${art.title}</td></tr>
            `).join('')}
        `).join('');

        const logoHtml = docState.metadata.logoUri 
            ? `<img src="${docState.metadata.logoUri}" alt="Logo" class="logo">`
            : '';

        return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>${docState.metadata.orgName} - ${docState.metadata.title}</title>
    <script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
    <style>
        @page {
            size: A4;
            margin: 20mm 15mm 20mm 15mm;
            @bottom-left {
                content: "صفحة " counter(page) " من " counter(pages);
                font-family: 'Tajawal', sans-serif;
                font-size: 9pt;
                color: #666;
            }
        }
        body { font-family: 'Tajawal', system-ui, -apple-system, sans-serif; color: #2b2b2b; line-height: 1.6; margin: 0; padding: 0; }
        .header-container { border-bottom: 2px solid #800020; padding-bottom: 12px; margin-top: 15pt; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
        .header-title h1 { color: #800020; font-size: 16pt; margin: 0 0 4px 0; }
        .header-title .subtitle { font-size: 11pt; color: #555555; }
        .logo { max-height: 60px; width: auto; object-fit: contain; }
        .meta-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; background-color: #f8f9fa; }
        .meta-table td { padding: 8px 12px; border: 1px solid #e0e0e0; font-size: 9.5pt; }
        h2 { color: #800020; font-size: 12pt; border-bottom: 1px solid #800020; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px; }
        .article-title { font-weight: bold; color: #000000; margin-top: 10px; margin-bottom: 4px; }
        .article-content { font-size: 10.5pt; text-align: justify; margin-bottom: 12px; }
        .toc-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .toc-table td { text-align: right; padding: 4px 8px; font-size: 10pt; border-bottom: 1px dashed #ccc; }
        .toc-chapter { font-weight: bold; color: #800020; padding-top: 6px !important; }
        .toc-article { padding-right: 20px !important; color: #333; }
    </style>
</head>
<body>
    <div class="header-container">
        <div class="header-title">
            <h1>${docState.metadata.orgName}</h1>
            <div class="subtitle">${docState.metadata.title}</div>
        </div>
        ${logoHtml}
    </div>
    <table class="meta-table">
        <tr>
            <td><strong>الإصدار:</strong> ${docState.metadata.version}</td>
            <td><strong>تاريخ الاعتماد:</strong> ${docState.metadata.date || '—'}</td>
        </tr>
    </table>
    <h2>فهرس الأبواب والمواد</h2>
    <table class="toc-table">
        ${tocHtml}
    </table>
    ${sectionsHtml}
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

        elements.globalSearch?.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            renderDocumentView();
        });

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
