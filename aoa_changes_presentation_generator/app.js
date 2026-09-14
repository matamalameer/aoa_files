// Quill Rich Text Editor Setup
const toolbarOptions = [
    ['bold', 'italic', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
];

const oldQuill = new Quill('#oldTextEditor', { theme: 'snow', modules: { toolbar: toolbarOptions } });
const newQuill = new Quill('#newTextEditor', { theme: 'snow', modules: { toolbar: toolbarOptions } });
const reasonQuill = new Quill('#reasonTextEditor', { theme: 'snow', modules: { toolbar: toolbarOptions } });

// State Management
let editingIndex = null;
let currentView = 'presentation';
let logoDataUrl = '';

let slidesData = [
    {
        type: "modify",
        title: "المادة (12): اشتراكات الأعضاء",
        oldText: "<p>يُسدد العضو الاشتراك السنوي في مقر الجمعية نقداً في موعد أقصاه <s style='color: red;'>نهاية شهر ديسمبر</s> من كل عام.</p>",
        newText: "<p>يُسدد العضو الاشتراك السنوي <strong style='background-color: #c6f6d5;'>عبر القنوات الإلكترونية المعتمدة</strong> في موعد أقصاه <strong style='background-color: #c6f6d5;'>نهاية شهر مارس</strong> من كل عام.</p>",
        reason: "<ul><li>تسهيل عملية الدفع إلكترونياً للحضور.</li><li>توافق المواعيد مع السنة المالية الجديدة.</li></ul>"
    },
    {
        type: "add",
        title: "المادة (18 مكرر): لجنة الحوكمة والرقابة",
        oldText: "<p class='text-muted'><em>(مادة جديدة - لا يوجد نص سابق)</em></p>",
        newText: "<p>تشكّل الجمعية العمومية لجنة مستقلة للحوكمة والرقابة تتولى مراجعة التقارير المالية والإدارية بشكل دوري.</p>",
        reason: "<ul><li>تعزيز الشفافية والحوكمة المؤسسية في أعمال الجمعية.</li></ul>"
    },
    {
        type: "delete",
        title: "المادة (25): تحصيل الرسوم النقدي",
        oldText: "<p><s>يُسمح للمنسق المالي بتحصيل الاشتراكات اليومية نقداً وإصدار إيصالات ورقية.</s></p>",
        newText: "<p class='text-muted'><em>(تم إلغاء المادة بالكامل)</em></p>",
        reason: "<ul><li>إلغاء المعاملات النقدية والاعتماد الكلي على التحويلات الإلكترونية.</li></ul>"
    }
];

// Event Listeners
document.getElementById('addBtn').addEventListener('click', saveSlide);
document.getElementById('cancelBtn').addEventListener('click', cancelEditing);
document.getElementById('exportHtmlBtn').addEventListener('click', exportPresentationHTML);
document.getElementById('downloadPdfBtn').addEventListener('click', generatePDF);
document.getElementById('exportJsonBtn').addEventListener('click', exportJSON);
document.getElementById('importJsonInput').addEventListener('change', importJSON);
document.getElementById('logoInput').addEventListener('change', handleLogoUpload);

// View Switchers
const btnViewPresentation = document.getElementById('btnViewPresentation');
const btnViewPdf = document.getElementById('btnViewPdf');

btnViewPresentation.addEventListener('click', () => {
    currentView = 'presentation';
    btnViewPresentation.classList.add('active');
    btnViewPdf.classList.remove('active');
    updatePreview();
});

btnViewPdf.addEventListener('click', () => {
    currentView = 'pdf';
    btnViewPdf.classList.add('active');
    btnViewPresentation.classList.remove('active');
    updatePreview();
});

function handleActionTypeChange() {
    const actionType = document.getElementById('actionType').value;

    if (actionType === 'add') {
        oldQuill.enable(false);
        oldQuill.root.innerHTML = "<p class='text-muted'><em>(مادة جديدة - لا يوجد نص سابق)</em></p>";
        newQuill.enable(true);
        if (newQuill.getText().trim() === '(مادة جديدة - لا يوجد نص سابق)') newQuill.setText('');
    } else if (actionType === 'delete') {
        newQuill.enable(false);
        newQuill.root.innerHTML = "<p class='text-muted'><em>(تم إلغاء المادة بالكامل)</em></p>";
        oldQuill.enable(true);
        if (oldQuill.getText().trim() === '(تم إلغاء المادة بالكامل)') oldQuill.setText('');
    } else {
        oldQuill.enable(true);
        newQuill.enable(true);
    }
}

function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            logoDataUrl = e.target.result;
            updatePreview();
        };
        reader.readAsDataURL(file);
    }
}

function renderList() {
    const listDiv = document.getElementById('slidesList');
    listDiv.innerHTML = '';
    
    slidesData.forEach((slide, index) => {
        let badgeTag = '';
        if (slide.type === 'add') badgeTag = '<span class="badge badge-add">إضافة</span>';
        else if (slide.type === 'delete') badgeTag = '<span class="badge badge-delete">إلغاء</span>';
        else badgeTag = '<span class="badge badge-modify">تعديل</span>';

        listDiv.innerHTML += `
            <div class="slide-item">
                <div>
                    ${badgeTag}
                    <strong>${slide.title}</strong>
                </div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="editSlide(${index})">تعديل</button>
                    <button class="remove-btn" onclick="removeSlide(${index})">حذف</button>
                </div>
            </div>
        `;
    });
    updatePreview();
}

function saveSlide() {
    const type = document.getElementById('actionType').value;
    const title = document.getElementById('articleTitle').value.trim();
    const oldText = oldQuill.root.innerHTML;
    const newText = newQuill.root.innerHTML;
    const reason = reasonQuill.root.innerHTML;

    if (!title) {
        alert('يرجى كتابة عنوان المادة');
        return;
    }

    const slideObj = { type, title, oldText, newText, reason };

    if (editingIndex !== null) {
        slidesData[editingIndex] = slideObj;
    } else {
        slidesData.push(slideObj);
    }

    resetForm();
    renderList();
}

function editSlide(index) {
    editingIndex = index;
    const slide = slidesData[index];

    document.getElementById('actionType').value = slide.type || 'modify';
    handleActionTypeChange();

    document.getElementById('articleTitle').value = slide.title;
    oldQuill.root.innerHTML = slide.oldText;
    newQuill.root.innerHTML = slide.newText;
    reasonQuill.root.innerHTML = slide.reason;

    document.getElementById('formTitle').innerText = 'تعديل المادة الحالية';
    document.getElementById('addBtn').innerText = 'حفظ التعديلات';
    document.getElementById('cancelBtn').style.display = 'block';
}

function cancelEditing() {
    resetForm();
}

function resetForm() {
    editingIndex = null;
    document.getElementById('actionType').value = 'modify';
    document.getElementById('articleTitle').value = '';
    oldQuill.enable(true);
    newQuill.enable(true);
    oldQuill.setText('');
    newQuill.setText('');
    reasonQuill.setText('');

    document.getElementById('formTitle').innerText = 'إضافة مادة جديدة / تعديل';
    document.getElementById('addBtn').innerText = '+ إضافة المادة';
    document.getElementById('cancelBtn').style.display = 'none';
}

function removeSlide(index) {
    if (editingIndex === index) cancelEditing();
    slidesData.splice(index, 1);
    renderList();
}

function updatePreview() {
    const iframe = document.getElementById('previewFrame');
    if (currentView === 'presentation') {
        iframe.srcdoc = generatePresentationHTML();
    } else {
        iframe.srcdoc = generatePdfDocHTML();
    }
}

function getTypeBadgeHTML(type) {
    if (type === 'add') return '<span class="badge badge-add">إضافة مادة جديدة</span>';
    if (type === 'delete') return '<span class="badge badge-delete">إلغاء مادة</span>';
    return '<span class="badge badge-modify">تعديل مادة</span>';
}

// 1. Reveal.js Presentation Engine
function generatePresentationHTML() {
    const logoImgTag = logoDataUrl ? `<img src="${logoDataUrl}" class="slide-logo" alt="Logo">` : '';
    const headerLogoTag = logoDataUrl ? `<div id="presHeader" class="presentation-header" style="display: none;"><img src="${logoDataUrl}" alt="Header Logo"></div>` : '';

    const slidesHTML = slidesData.map(slide => `
        <section>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                <h3>${slide.title}</h3>
                ${getTypeBadgeHTML(slide.type)}
            </div>
            <div class="comparison-grid">
                <div class="card old-text">
                    <div class="card-header">قبل التعديل</div>
                    <div class="card-body">${slide.oldText}</div>
                </div>
                <div class="card new-text">
                    <div class="card-header">بعد التعديل</div>
                    <div class="card-body">${slide.newText}</div>
                </div>
                <div class="card reason">
                    <div class="card-header">المبرر والأثر</div>
                    <div class="card-body">${slide.reason}</div>
                </div>
            </div>
        </section>
    `).join('');

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/reveal.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/theme/white.min.css">
    <style>
        * { font-family: 'Tajawal', sans-serif !important; }
        body, .reveal { background-color: #f8f9fa; }
        .presentation-header { position: absolute; top: 20px; right: 30px; z-index: 10; }
        .presentation-header img { max-height: 93px !important; max-width: 266px !important; object-fit: contain; }
        .reveal .slides section .slide-logo { max-height: 480px !important; max-width: 1000px !important; margin: 0 auto 20px auto !important; display: block !important; object-fit: contain !important; }
        .reveal h2, .reveal h3 { color: #1a365d; font-weight: 800; margin: 0; }
        .reveal .slides section { text-align: right; }
        .comparison-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 25px; font-size: 0.55em; }
        .card { background: #ffffff; border-radius: 8px; padding: 15px; border: 1px solid #e2e8f0; }
        .card-header { font-weight: 700; padding-bottom: 8px; margin-bottom: 10px; border-bottom: 2px solid; }
        .old-text .card-header { color: #e53e3e; border-color: #e53e3e; }
        .new-text .card-header { color: #38a169; border-color: #38a169; }
        .reason .card-header { color: #3182ce; border-color: #3182ce; }
        .text-muted { color: #a0aec0; font-style: italic; }
        
        .badge { padding: 4px 10px; border-radius: 4px; font-size: 0.6em; font-weight: 700; display: inline-block; }
        .badge-modify { background-color: #ebf8ff; color: #2b6cb0; border: 1px solid #bee3f8; }
        .badge-add { background-color: #f0fff4; color: #276749; border: 1px solid #c6f6d5; }
        .badge-delete { background-color: #fff5f5; color: #9b2c2c; border: 1px solid #fed7d7; }
    </style>
</head>
<body>
    <div class="reveal">
        ${headerLogoTag}
        <div class="slides">
            <section style="text-align: center;">
                ${logoImgTag}
                <h2>عرض تعديلات وإضافات وإلغاء المواد</h2>
                <p>اجتماع الجمعية العمومية</p>
            </section>
            ${slidesHTML}
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/reveal.min.js"><\/script>
    <script>
        Reveal.initialize({ rtl: true, controls: true, progress: true, center: true, hash: true });
        function toggleHeader(e) {
            var h = document.getElementById('presHeader');
            if(h) h.style.display = (e.indexh === 0) ? 'none' : 'block';
        }
        Reveal.on('ready', toggleHeader);
        Reveal.on('slidechanged', toggleHeader);
    <\/script>
</body>
</html>`;
}

// 2. Printable Document Engine (A4 PDF Export)
function generatePdfDocHTML() {
    const logoImgTag = logoDataUrl ? `<img src="${logoDataUrl}" alt="Logo">` : '';
    const dateStr = new Date().toLocaleDateString('ar-BH', { year: 'numeric', month: 'long', day: 'numeric' });

    const itemsHTML = slidesData.map(item => `
        <div class="item-card">
            <div class="item-card-header">
                <span>${item.title}</span>
                ${getTypeBadgeHTML(item.type)}
            </div>
            <div class="comparison-grid">
                <div class="col-box col-old">
                    <div class="col-title">قبل التعديل</div>
                    <div>${item.oldText}</div>
                </div>
                <div class="col-box col-new">
                    <div class="col-title">بعد التعديل</div>
                    <div>${item.newText}</div>
                </div>
                <div class="col-box col-reason">
                    <div class="col-title">المبرر والأثر</div>
                    <div>${item.reason}</div>
                </div>
            </div>
        </div>
    `).join('');

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
    <style>
        * { 
            box-sizing: border-box; 
            font-family: 'Tajawal', sans-serif !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
        }
        
        @page {
            size: A4 portrait;
            margin: 8mm 12mm 15mm 12mm;
            @bottom-left {
                content: "صفحة " counter(page) " من " counter(pages);
                font-family: 'Tajawal', sans-serif;
                font-size: 8.5pt;
                color: #718096;
            }
            @bottom-right {
                content: "تاريخ الطباعة: ${dateStr}";
                font-family: 'Tajawal', sans-serif;
                font-size: 8.5pt;
                color: #718096;
            }
        }

        body { 
            margin: 0; 
            padding: 0; 
            background: #ffffff !important; 
            color: #2d3748; 
            direction: rtl;
        }

        table.print-container {
            width: 100%;
            border-collapse: collapse;
        }

        thead.print-header {
            display: table-header-group;
        }

        .doc-header { 
            text-align: center; 
            border-bottom: 2px solid #1a365d; 
            padding-bottom: 8px; 
            margin-bottom: 12px; 
        }

        .logo-container img { 
            max-height: 75px; 
            max-width: 200px; 
            object-fit: contain; 
            margin-bottom: 4px; 
        }

        .doc-title { 
            margin: 0 0 2px 0; 
            color: #1a365d !important; 
            font-size: 1.3rem; 
            font-weight: 800; 
        }

        .doc-subtitle { 
            margin: 0; 
            color: #718096 !important; 
            font-size: 0.85rem; 
        }

        .item-card { 
            border: 1px solid #cbd5e0; 
            border-radius: 6px; 
            margin-bottom: 12px; 
            page-break-inside: avoid; 
            break-inside: avoid;
            background-color: #ffffff !important;
        }

        .item-card-header { 
            background-color: #edf2f7 !important; 
            padding: 6px 12px; 
            font-weight: 700; 
            color: #1a365d !important; 
            border-bottom: 1px solid #cbd5e0; 
            font-size: 0.9rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .comparison-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr; 
            border-top: 1px solid #e2e8f0; 
            direction: rtl;
        }

        .col-box { 
            padding: 8px 10px; 
            font-size: 0.82rem; 
            line-height: 1.45; 
            text-align: right;
        }

        .col-box:not(:last-child) { 
            border-left: 1px solid #e2e8f0; 
        }

        .col-title { 
            font-weight: 700; 
            margin-bottom: 4px; 
        }

        .col-old .col-title { color: #e53e3e !important; }
        .col-new .col-title { color: #38a169 !important; }
        .col-reason .col-title { color: #3182ce !important; }

        .text-muted { color: #a0aec0; font-style: italic; }

        .badge { 
            padding: 2px 8px; 
            border-radius: 4px; 
            font-size: 0.75rem; 
            font-weight: 700; 
            display: inline-block; 
        }
        .badge-modify { background-color: #ebf8ff !important; color: #2b6cb0 !important; border: 1px solid #bee3f8; }
        .badge-add { background-color: #f0fff4 !important; color: #276749 !important; border: 1px solid #c6f6d5; }
        .badge-delete { background-color: #fff5f5 !important; color: #9b2c2c !important; border: 1px solid #fed7d7; }
    </style>
</head>
<body>
    <table class="print-container">
        <thead class="print-header">
            <tr>
                <td>
                    <header class="doc-header">
                        <div class="logo-container">${logoImgTag}</div>
                        <h1 class="doc-title">جدول مقارنة تعديلات وإضافات وإلغاء النظام الأساسي</h1>
                        <p class="doc-subtitle">مسودة للتوزيع قبل اجتماع الجمعية العمومية</p>
                    </header>
                </td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <main>${itemsHTML}</main>
                </td>
            </tr>
        </tbody>
    </table>
</body>
</html>`;
}

function generatePDF() {
    const printWindow = window.open('', '_blank');
    const docContent = generatePdfDocHTML();

    printWindow.document.open();
    printWindow.document.write(docContent);
    printWindow.document.close();

    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 300);
    };
}

function exportPresentationHTML() {
    const htmlContent = generatePresentationHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'assembly_presentation.html';
    a.click();
}

function exportJSON() {
    const payload = { logo: logoDataUrl, slides: slidesData };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "assembly_data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                slidesData = importedData;
            } else if (importedData.slides) {
                slidesData = importedData.slides;
                logoDataUrl = importedData.logo || '';
            } else {
                alert('صيغة ملف JSON غير صحيحة');
                return;
            }
            cancelEditing();
            renderList();
        } catch (err) {
            alert('حدث خطأ أثناء قراءة ملف JSON');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// Initial Run
renderList();
