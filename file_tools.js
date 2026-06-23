// --- Advanced File & Image Tools (30+ Tools) ---

const ADV_FILE_TOOLS = [
    // 1. PDF Merge
    {
        id: 'adv-pdf-merge',
        name: 'PDF Merge',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-object-group"></i>',
        description: 'Combine multiple PDF documents into a single PDF file locally.',
        tags: ['pdf', 'merge', 'combine', 'join', 'concat'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Upload PDF Files</label>
                            <div class="uploader-box" id="pdfmerge-dropzone" style="height:120px;">
                                <i class="fa-solid fa-file-pdf uploader-icon" style="color:var(--accent-primary);"></i>
                                <div class="uploader-text">Select or drop PDFs here</div>
                                <input type="file" id="pdfmerge-input" multiple accept="application/pdf" style="display:none;">
                            </div>
                        </div>
                        <div class="input-group">
                            <label>Merge Order</label>
                            <div id="pdfmerge-list" style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:10px; max-height:180px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
                                <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">No PDFs uploaded</div>
                            </div>
                        </div>
                        <button class="app-btn primary" id="pdfmerge-btn" style="width:100%; margin-top:15px; border-radius:20px; gap:8px;">
                            <i class="fa-solid fa-object-group"></i>Merge PDFs
                        </button>
                    </div>
                    <div>
                        <div class="input-group">
                            <label>Merge Status & Console</label>
                            <div class="output-container" style="margin-top:0;">
                                <pre class="output-pre" id="pdfmerge-log" style="min-height:220px; font-size:11px;">[Ready] Waiting for files to merge...</pre>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('pdfmerge-dropzone');
            const fileInput = document.getElementById('pdfmerge-input');
            const mergeList = document.getElementById('pdfmerge-list');
            const mergeBtn = document.getElementById('pdfmerge-btn');
            const logBox = document.getElementById('pdfmerge-log');
            let files = [];

            const updateLog = (msg, clear = false) => {
                const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
                if (clear) logBox.textContent = `[${time}] ${msg}`;
                else logBox.textContent += `\n[${time}] ${msg}`;
                logBox.scrollTop = logBox.scrollHeight;
            };

            const renderList = () => {
                mergeList.innerHTML = '';
                if (files.length === 0) {
                    mergeList.innerHTML = `<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">No PDFs uploaded</div>`;
                    return;
                }
                files.forEach((f, idx) => {
                    const row = document.createElement('div');
                    row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:rgba(255,255,255,0.03); border-radius:4px; font-size:12px;";
                    row.innerHTML = `
                        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:180px;">
                            ${idx+1}. ${f.name} (${utils.formatBytes(f.size)})
                        </span>
                        <div style="display:flex; gap:8px;">
                            <i class="fa-solid fa-arrow-up" style="cursor:pointer; color:var(--accent-secondary);" onclick="window.movePdfMerge(${idx}, -1)"></i>
                            <i class="fa-solid fa-arrow-down" style="cursor:pointer; color:var(--accent-secondary);" onclick="window.movePdfMerge(${idx}, 1)"></i>
                            <i class="fa-solid fa-trash-can" style="cursor:pointer; color:#ef4444;" onclick="window.removePdfMerge(${idx})"></i>
                        </div>
                    `;
                    mergeList.appendChild(row);
                });
            };

            window.movePdfMerge = (idx, dir) => {
                const target = idx + dir;
                if (target >= 0 && target < files.length) {
                    const temp = files[idx];
                    files[idx] = files[target];
                    files[target] = temp;
                    renderList();
                }
            };

            window.removePdfMerge = (idx) => {
                files.splice(idx, 1);
                renderList();
                updateLog(`Removed PDF at index ${idx+1}`);
            };

            const addFiles = (newFiles) => {
                for (let f of newFiles) {
                    if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) {
                        files.push(f);
                        updateLog(`Loaded: ${f.name}`);
                    } else {
                        utils.showToast(`Skipped non-PDF file: ${f.name}`, 'error');
                    }
                }
                renderList();
            };

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => addFiles(e.target.files);
            dropzone.ondragover = (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--accent-secondary)'; };
            dropzone.ondragleave = () => { dropzone.style.borderColor = ''; };
            dropzone.ondrop = (e) => { e.preventDefault(); dropzone.style.borderColor = ''; addFiles(e.dataTransfer.files); };

            mergeBtn.onclick = async () => {
                if (files.length < 2) {
                    utils.showToast('Please add at least 2 PDF files to merge!', 'error');
                    return;
                }
                if (!window.PDFLib) {
                    utils.showToast('PDF-Lib CDN is not loaded yet!', 'error');
                    return;
                }

                mergeBtn.disabled = true;
                updateLog('Starting PDF merge process...', true);

                try {
                    const mergedDoc = await PDFLib.PDFDocument.create();
                    for (let i = 0; i < files.length; i++) {
                        updateLog(`Processing PDF [${i+1}/${files.length}]: ${files[i].name}`);
                        const bytes = await files[i].arrayBuffer();
                        const srcDoc = await PDFLib.PDFDocument.load(bytes);
                        const pageIndices = srcDoc.getPageIndices();
                        const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);
                        copiedPages.forEach(page => mergedDoc.addPage(page));
                        updateLog(`Copied ${copiedPages.length} pages from ${files[i].name}`);
                    }

                    updateLog('Finalizing and saving merged PDF...');
                    const mergedPdfBytes = await mergedDoc.save();
                    utils.downloadFile(mergedPdfBytes, 'merged_document.pdf', 'application/pdf');
                    updateLog('PDF merge completed successfully!');
                    window.incrementStatsRun();
                } catch (err) {
                    updateLog(`Merge failed: ${err.message}`);
                    utils.showToast('Merge failed. See status console.', 'error');
                } finally {
                    mergeBtn.disabled = false;
                }
            };
        }
    },

    // 2. PDF Split
    {
        id: 'adv-pdf-split',
        name: 'PDF Split',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-scissors"></i>',
        description: 'Extract specific page ranges or split each page into a separate PDF.',
        tags: ['pdf', 'split', 'scissors', 'extract', 'pages'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Upload PDF File</label>
                            <div class="uploader-box" id="pdfsplit-dropzone" style="height:100px;">
                                <i class="fa-solid fa-file-pdf uploader-icon" style="color:var(--accent-secondary);"></i>
                                <div class="uploader-text" id="pdfsplit-text">Choose PDF file</div>
                                <input type="file" id="pdfsplit-input" accept="application/pdf" style="display:none;">
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:10px;">
                            <label>Split Mode</label>
                            <select id="pdfsplit-mode" class="form-select">
                                <option value="range">Extract Page Range</option>
                                <option value="all">Split into Single Pages (ZIP)</option>
                            </select>
                        </div>
                        <div class="input-group" id="pdfsplit-range-group" style="margin-top:10px;">
                            <label>Page Range (e.g. 1-3, 5, 7-10)</label>
                            <input type="text" class="form-input" id="pdfsplit-range" value="1" placeholder="Page indices">
                        </div>
                        <button class="app-btn primary" id="pdfsplit-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-scissors" style="margin-right:6px;"></i>Split PDF
                        </button>
                    </div>
                    <div>
                        <div class="input-group">
                            <label>Split Status & Log</label>
                            <div class="output-container" style="margin-top:0;">
                                <pre class="output-pre" id="pdfsplit-log" style="min-height:220px; font-size:11px;">[Ready] Upload a PDF file to begin...</pre>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('pdfsplit-dropzone');
            const fileInput = document.getElementById('pdfsplit-input');
            const splitText = document.getElementById('pdfsplit-text');
            const splitMode = document.getElementById('pdfsplit-mode');
            const rangeGroup = document.getElementById('pdfsplit-range-group');
            const rangeInput = document.getElementById('pdfsplit-range');
            const splitBtn = document.getElementById('pdfsplit-btn');
            const logBox = document.getElementById('pdfsplit-log');
            let pdfFile = null;

            const updateLog = (msg, clear = false) => {
                const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
                if (clear) logBox.textContent = `[${time}] ${msg}`;
                else logBox.textContent += `\n[${time}] ${msg}`;
                logBox.scrollTop = logBox.scrollHeight;
            };

            splitMode.onchange = () => {
                rangeGroup.style.display = splitMode.value === 'range' ? 'block' : 'none';
            };

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                pdfFile = e.target.files[0];
                if (pdfFile) {
                    splitText.textContent = `${pdfFile.name} (${utils.formatBytes(pdfFile.size)})`;
                    updateLog(`Loaded file: ${pdfFile.name}`, true);
                }
            };

            splitBtn.onclick = async () => {
                if (!pdfFile) {
                    utils.showToast('Please upload a PDF file first!', 'error');
                    return;
                }
                splitBtn.disabled = true;
                updateLog('Loading PDF document...');

                try {
                    const bytes = await pdfFile.arrayBuffer();
                    const srcDoc = await PDFLib.PDFDocument.load(bytes);
                    const totalPages = srcDoc.getPageCount();
                    updateLog(`Total pages in document: ${totalPages}`);

                    if (splitMode.value === 'range') {
                        // Extract specific range
                        const rangeStr = rangeInput.value.trim();
                        if (!rangeStr) throw new Error('Range specification is empty');
                        
                        // Parse range like "1-3, 5, 7-10"
                        const pageIndices = [];
                        const parts = rangeStr.split(',');
                        for (let part of parts) {
                            part = part.trim();
                            if (part.includes('-')) {
                                const bounds = part.split('-');
                                const start = parseInt(bounds[0]) - 1;
                                const end = parseInt(bounds[1]) - 1;
                                for (let p = start; p <= end; p++) {
                                    if (p >= 0 && p < totalPages) pageIndices.push(p);
                                }
                            } else {
                                const pageIdx = parseInt(part) - 1;
                                if (pageIdx >= 0 && pageIdx < totalPages) pageIndices.push(pageIdx);
                            }
                        }

                        if (pageIndices.length === 0) throw new Error('No valid pages found in range.');

                        updateLog(`Extracting pages: ${pageIndices.map(p => p + 1).join(', ')}`);
                        const splitDoc = await PDFLib.PDFDocument.create();
                        const copiedPages = await splitDoc.copyPages(srcDoc, pageIndices);
                        copiedPages.forEach(p => splitDoc.addPage(p));

                        updateLog('Saving output PDF...');
                        const splitBytes = await splitDoc.save();
                        utils.downloadFile(splitBytes, `extracted_pages_${rangeStr.replace(/\s+/g, '')}.pdf`, 'application/pdf');
                        updateLog('Page range extracted successfully!');
                    } else {
                        // Split into single pages ZIP
                        if (!window.JSZip) throw new Error('JSZip library is missing!');
                        updateLog('Splitting into individual pages... Packaging into ZIP...');
                        const zip = new JSZip();

                        for (let i = 0; i < totalPages; i++) {
                            updateLog(`Extracting page ${i+1}/${totalPages}...`);
                            const singleDoc = await PDFLib.PDFDocument.create();
                            const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
                            singleDoc.addPage(copiedPage);
                            const singleBytes = await singleDoc.save();
                            zip.file(`page_${i+1}.pdf`, singleBytes);
                        }

                        updateLog('Generating zip archive...');
                        const zipBlob = await zip.generateAsync({ type: 'blob' });
                        utils.downloadFile(zipBlob, `${pdfFile.name.replace('.pdf', '')}_split_pages.zip`, 'application/zip');
                        updateLog('All pages split and downloaded inside ZIP archive!');
                    }
                    window.incrementStatsRun();
                } catch (err) {
                    updateLog(`Split failed: ${err.message}`);
                    utils.showToast(err.message, 'error');
                } finally {
                    splitBtn.disabled = false;
                }
            };
        }
    },

    // 3. PDF Rotate
    {
        id: 'adv-pdf-rotate',
        name: 'PDF Rotate',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-rotate"></i>',
        description: 'Rotate all pages or specific page indices by 90, 180, or 270 degrees.',
        tags: ['pdf', 'rotate', 'spin', 'orientation'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Upload PDF</label>
                            <div class="uploader-box" id="pdfrot-dropzone" style="height:90px;">
                                <i class="fa-solid fa-file-pdf uploader-icon" style="color:var(--accent-secondary);"></i>
                                <div class="uploader-text" id="pdfrot-text">Upload PDF</div>
                                <input type="file" id="pdfrot-input" accept="application/pdf" style="display:none;">
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:10px;">
                            <label>Pages to Rotate</label>
                            <select id="pdfrot-pages" class="form-select">
                                <option value="all">All Pages</option>
                                <option value="specific">Specific Pages</option>
                            </select>
                        </div>
                        <div class="input-group" id="pdfrot-spec-group" style="margin-top:10px; display:none;">
                            <label>Page numbers (e.g. 1, 3, 5)</label>
                            <input type="text" class="form-input" id="pdfrot-spec-pages" value="1">
                        </div>
                        <div class="input-group" style="margin-top:10px;">
                            <label>Rotation Angle</label>
                            <select id="pdfrot-angle" class="form-select">
                                <option value="90">90° Clockwise</option>
                                <option value="180">180° Flip</option>
                                <option value="270">270° Counter-Clockwise</option>
                            </select>
                        </div>
                        <button class="app-btn primary" id="pdfrot-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-rotate" style="margin-right:6px;"></i>Rotate & Save
                        </button>
                    </div>
                    <div>
                        <div class="input-group">
                            <label>Rotation Logs</label>
                            <div class="output-container" style="margin-top:0;">
                                <pre class="output-pre" id="pdfrot-log" style="min-height:220px; font-size:11px;">[Ready] Select PDF...</pre>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('pdfrot-dropzone');
            const fileInput = document.getElementById('pdfrot-input');
            const rotText = document.getElementById('pdfrot-text');
            const rotPages = document.getElementById('pdfrot-pages');
            const specGroup = document.getElementById('pdfrot-spec-group');
            const specInput = document.getElementById('pdfrot-spec-pages');
            const rotAngle = document.getElementById('pdfrot-angle');
            const rotBtn = document.getElementById('pdfrot-btn');
            const logBox = document.getElementById('pdfrot-log');
            let pdfFile = null;

            const updateLog = (msg, clear = false) => {
                const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
                if (clear) logBox.textContent = `[${time}] ${msg}`;
                else logBox.textContent += `\n[${time}] ${msg}`;
            };

            rotPages.onchange = () => {
                specGroup.style.display = rotPages.value === 'specific' ? 'block' : 'none';
            };

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                pdfFile = e.target.files[0];
                if (pdfFile) {
                    rotText.textContent = pdfFile.name;
                    updateLog(`Loaded file: ${pdfFile.name}`, true);
                }
            };

            rotBtn.onclick = async () => {
                if (!pdfFile) {
                    utils.showToast('Please upload a PDF file!', 'error');
                    return;
                }
                rotBtn.disabled = true;
                updateLog('Loading PDF...');

                try {
                    const bytes = await pdfFile.arrayBuffer();
                    const pdfDoc = await PDFLib.PDFDocument.load(bytes);
                    const pages = pdfDoc.getPages();
                    const angle = parseInt(rotAngle.value);

                    updateLog(`PDF loaded. Total Pages: ${pages.length}`);

                    let targets = [];
                    if (rotPages.value === 'all') {
                        targets = pages.map((_, i) => i);
                    } else {
                        const spec = specInput.value.split(',').map(s => parseInt(s.trim()) - 1);
                        spec.forEach(idx => {
                            if (idx >= 0 && idx < pages.length) targets.push(idx);
                        });
                    }

                    targets.forEach(idx => {
                        const page = pages[idx];
                        const currRot = page.getRotation().angle || 0;
                        const newRot = (currRot + angle) % 360;
                        page.setRotation(PDFLib.degrees(newRot));
                        updateLog(`Page ${idx+1} rotated from ${currRot}° to ${newRot}°`);
                    });

                    updateLog('Writing PDF data...');
                    const outputBytes = await pdfDoc.save();
                    utils.downloadFile(outputBytes, `rotated_${pdfFile.name}`, 'application/pdf');
                    updateLog('PDF pages rotated successfully!');
                    window.incrementStatsRun();
                } catch (err) {
                    updateLog(`Rotation failed: ${err.message}`);
                } finally {
                    rotBtn.disabled = false;
                }
            };
        }
    },

    // 4. PDF Page Reorder
    {
        id: 'adv-pdf-reorder',
        name: 'PDF Page Reorder',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-arrows-up-down-left-right"></i>',
        description: 'Rearrange the pages of a PDF document in any custom order.',
        tags: ['pdf', 'reorder', 'rearrange', 'sort', 'pages'],
        render() {
            return `
                <div class="uploader-box" id="pdfreorder-dropzone" style="height:100px;">
                    <i class="fa-solid fa-file-pdf uploader-icon" style="color:var(--accent-secondary);"></i>
                    <div class="uploader-text" id="pdfreorder-text">Upload PDF to Reorder Pages</div>
                    <input type="file" id="pdfreorder-input" accept="application/pdf" style="display:none;">
                </div>
                <div class="input-group" style="margin-top:15px;">
                    <label>New Page Sequence (1-based comma separated list, e.g. 3, 1, 2, 4)</label>
                    <input type="text" class="form-input" id="pdfreorder-seq" value="" placeholder="1, 2, 3...">
                </div>
                <button class="app-btn primary" id="pdfreorder-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                    <i class="fa-solid fa-arrows-rotate" style="margin-right:6px;"></i>Reorder & Download
                </button>
            `;
        },
        init() {
            const dropzone = document.getElementById('pdfreorder-dropzone');
            const fileInput = document.getElementById('pdfreorder-input');
            const seqInput = document.getElementById('pdfreorder-seq');
            const reorderText = document.getElementById('pdfreorder-text');
            const reorderBtn = document.getElementById('pdfreorder-btn');
            let pdfFile = null;

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = async (e) => {
                pdfFile = e.target.files[0];
                if (pdfFile) {
                    reorderText.textContent = pdfFile.name;
                    try {
                        const bytes = await pdfFile.arrayBuffer();
                        const pdfDoc = await PDFLib.PDFDocument.load(bytes);
                        const count = pdfDoc.getPageCount();
                        const defaultSeq = Array.from({length: count}, (_, i) => i + 1).join(', ');
                        seqInput.value = defaultSeq;
                        utils.showToast(`PDF loaded. Total Pages: ${count}`);
                    } catch (err) {
                        utils.showToast('Error reading PDF structure', 'error');
                    }
                }
            };

            reorderBtn.onclick = async () => {
                if (!pdfFile) {
                    utils.showToast('Please upload a PDF first!', 'error');
                    return;
                }
                const seqStr = seqInput.value.trim();
                if (!seqStr) return;

                reorderBtn.disabled = true;
                try {
                    const bytes = await pdfFile.arrayBuffer();
                    const srcDoc = await PDFLib.PDFDocument.load(bytes);
                    const totalPages = srcDoc.getPageCount();

                    // Parse indices
                    const order = seqStr.split(',').map(s => parseInt(s.trim()) - 1);
                    const invalid = order.find(idx => isNaN(idx) || idx < 0 || idx >= totalPages);
                    if (invalid !== undefined) {
                        throw new Error(`Invalid page index found: ${invalid + 1}`);
                    }

                    const reorderedDoc = await PDFLib.PDFDocument.create();
                    const copiedPages = await reorderedDoc.copyPages(srcDoc, order);
                    copiedPages.forEach(p => reorderedDoc.addPage(p));

                    const outBytes = await reorderedDoc.save();
                    utils.downloadFile(outBytes, `reordered_${pdfFile.name}`, 'application/pdf');
                    utils.showToast('PDF pages successfully reordered!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast(err.message, 'error');
                } finally {
                    reorderBtn.disabled = false;
                }
            };
        }
    },

    // 5. PDF Page Deleter
    {
        id: 'adv-pdf-deleter',
        name: 'PDF Page Deleter',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-trash-can"></i>',
        description: 'Remove unwanted pages from a PDF document instantly.',
        tags: ['pdf', 'delete', 'remove', 'strip', 'pages'],
        render() {
            return `
                <div class="uploader-box" id="pdfdel-dropzone" style="height:100px;">
                    <i class="fa-solid fa-file-pdf uploader-icon" style="color:var(--accent-primary);"></i>
                    <div class="uploader-text" id="pdfdel-text">Upload PDF to Remove Pages</div>
                    <input type="file" id="pdfdel-input" accept="application/pdf" style="display:none;">
                </div>
                <div class="input-group" style="margin-top:15px;">
                    <label>Pages to Delete (1-based comma separated list or range, e.g. 2, 4-6)</label>
                    <input type="text" class="form-input" id="pdfdel-seq" value="" placeholder="2, 4, 5">
                </div>
                <button class="app-btn primary" id="pdfdel-btn" style="width:100%; margin-top:15px; border-radius:20px; background:#ef4444; border-color:#ef4444;">
                    <i class="fa-solid fa-trash-can" style="margin-right:6px;"></i>Delete Pages & Download
                </button>
            `;
        },
        init() {
            const dropzone = document.getElementById('pdfdel-dropzone');
            const fileInput = document.getElementById('pdfdel-input');
            const seqInput = document.getElementById('pdfdel-seq');
            const delText = document.getElementById('pdfdel-text');
            const delBtn = document.getElementById('pdfdel-btn');
            let pdfFile = null;

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = async (e) => {
                pdfFile = e.target.files[0];
                if (pdfFile) {
                    delText.textContent = pdfFile.name;
                    utils.showToast(`PDF file loaded successfully.`);
                }
            };

            delBtn.onclick = async () => {
                if (!pdfFile) {
                    utils.showToast('Please upload a PDF first!', 'error');
                    return;
                }
                const input = seqInput.value.trim();
                if (!input) return;

                delBtn.disabled = true;
                try {
                    const bytes = await pdfFile.arrayBuffer();
                    const pdfDoc = await PDFLib.PDFDocument.load(bytes);
                    const totalPages = pdfDoc.getPageCount();

                    // Parse indices to delete
                    const toDelete = new Set();
                    const parts = input.split(',');
                    for (let part of parts) {
                        part = part.trim();
                        if (part.includes('-')) {
                            const bounds = part.split('-');
                            const start = parseInt(bounds[0]);
                            const end = parseInt(bounds[1]);
                            for (let p = start; p <= end; p++) {
                                toDelete.add(p - 1);
                            }
                        } else {
                            toDelete.add(parseInt(part) - 1);
                        }
                    }

                    // Delete pages starting from back
                    const deleteArray = Array.from(toDelete).sort((a,b) => b - a);
                    for (let idx of deleteArray) {
                        if (idx >= 0 && idx < totalPages) {
                            pdfDoc.removePage(idx);
                        }
                    }

                    if (pdfDoc.getPageCount() === 0) {
                        throw new Error('You cannot delete all pages of a PDF document!');
                    }

                    const outBytes = await pdfDoc.save();
                    utils.downloadFile(outBytes, `deleted_pages_${pdfFile.name}`, 'application/pdf');
                    utils.showToast('Pages deleted successfully!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast(err.message, 'error');
                } finally {
                    delBtn.disabled = false;
                }
            };
        }
    },

    // 6. PDF Metadata Viewer
    {
        id: 'adv-pdf-metadata',
        name: 'PDF Metadata Tool',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-circle-info"></i>',
        description: 'View and edit title, author, subject, and keywords metadata tags locally.',
        tags: ['pdf', 'metadata', 'tags', 'properties', 'edit'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Upload PDF</label>
                            <div class="uploader-box" id="pdfmeta-dropzone" style="height:90px;">
                                <i class="fa-solid fa-file-pdf uploader-icon" style="color:var(--accent-secondary);"></i>
                                <div class="uploader-text" id="pdfmeta-text">Choose PDF File</div>
                                <input type="file" id="pdfmeta-input" accept="application/pdf" style="display:none;">
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:10px;">
                            <label>Title</label>
                            <input type="text" class="form-input" id="pdfmeta-title" value="">
                        </div>
                        <div class="input-group" style="margin-top:10px;">
                            <label>Author</label>
                            <input type="text" class="form-input" id="pdfmeta-author" value="">
                        </div>
                        <div class="input-group" style="margin-top:10px;">
                            <label>Subject</label>
                            <input type="text" class="form-input" id="pdfmeta-subject" value="">
                        </div>
                        <div class="input-group" style="margin-top:10px;">
                            <label>Keywords</label>
                            <input type="text" class="form-input" id="pdfmeta-keywords" value="">
                        </div>
                        <button class="app-btn primary" id="pdfmeta-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-floppy-disk" style="margin-right:6px;"></i>Save & Download PDF
                        </button>
                    </div>
                    <div>
                        <h3 style="font-size:13px; font-weight:700; color:var(--accent-secondary); margin-bottom:10px;"><i class="fa-solid fa-circle-info" style="margin-right:6px;"></i>Current Properties</h3>
                        <div id="pdfmeta-props" class="output-container" style="margin-top:0; font-size:12px; padding:15px; line-height:1.6; display:flex; flex-direction:column; gap:6px;">
                            <span style="color:var(--text-muted);">No file loaded</span>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('pdfmeta-dropzone');
            const fileInput = document.getElementById('pdfmeta-input');
            const metaText = document.getElementById('pdfmeta-text');
            const titleIn = document.getElementById('pdfmeta-title');
            const authorIn = document.getElementById('pdfmeta-author');
            const subjectIn = document.getElementById('pdfmeta-subject');
            const keywordsIn = document.getElementById('pdfmeta-keywords');
            const btn = document.getElementById('pdfmeta-btn');
            const propsBox = document.getElementById('pdfmeta-props');
            let pdfFile = null;

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = async (e) => {
                pdfFile = e.target.files[0];
                if (pdfFile) {
                    metaText.textContent = pdfFile.name;
                    try {
                        const bytes = await pdfFile.arrayBuffer();
                        const pdfDoc = await PDFLib.PDFDocument.load(bytes);
                        
                        const title = pdfDoc.getTitle() || '';
                        const author = pdfDoc.getAuthor() || '';
                        const subject = pdfDoc.getSubject() || '';
                        const keywords = pdfDoc.getKeywords() || '';
                        
                        titleIn.value = title;
                        authorIn.value = author;
                        subjectIn.value = subject;
                        keywordsIn.value = keywords;

                        propsBox.innerHTML = `
                            <div><strong>Filename:</strong> ${pdfFile.name}</div>
                            <div><strong>Page Count:</strong> ${pdfDoc.getPageCount()}</div>
                            <div><strong>Title:</strong> ${title || 'N/A'}</div>
                            <div><strong>Author:</strong> ${author || 'N/A'}</div>
                            <div><strong>Subject:</strong> ${subject || 'N/A'}</div>
                            <div><strong>Keywords:</strong> ${keywords || 'N/A'}</div>
                            <div><strong>Creator:</strong> ${pdfDoc.getCreator() || 'N/A'}</div>
                            <div><strong>Producer:</strong> ${pdfDoc.getProducer() || 'N/A'}</div>
                        `;
                    } catch (err) {
                        utils.showToast('Failed to parse metadata: ' + err.message, 'error');
                    }
                }
            };

            btn.onclick = async () => {
                if (!pdfFile) {
                    utils.showToast('Please upload a PDF first!', 'error');
                    return;
                }
                btn.disabled = true;
                try {
                    const bytes = await pdfFile.arrayBuffer();
                    const pdfDoc = await PDFLib.PDFDocument.load(bytes);
                    
                    pdfDoc.setTitle(titleIn.value);
                    pdfDoc.setAuthor(authorIn.value);
                    pdfDoc.setSubject(subjectIn.value);
                    pdfDoc.setKeywords(keywordsIn.value.split(',').map(s => s.trim()));

                    const outBytes = await pdfDoc.save();
                    utils.downloadFile(outBytes, `meta_${pdfFile.name}`, 'application/pdf');
                    utils.showToast('Metadata updated!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast(err.message, 'error');
                } finally {
                    btn.disabled = false;
                }
            };
        }
    },

    // 7. PDF Watermark
    {
        id: 'adv-pdf-watermark',
        name: 'PDF Watermark',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-stamp"></i>',
        description: 'Overlay custom watermark text onto pages of a PDF document.',
        tags: ['pdf', 'watermark', 'stamp', 'sign', 'overlay'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>PDF File</label>
                            <div class="uploader-box" id="pdfwm-dropzone" style="height:90px;">
                                <i class="fa-solid fa-file-pdf uploader-icon" style="color:var(--accent-primary);"></i>
                                <div class="uploader-text" id="pdfwm-text">Choose PDF File</div>
                                <input type="file" id="pdfwm-input" accept="application/pdf" style="display:none;">
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:10px;">
                            <label>Watermark Text</label>
                            <input type="text" class="form-input" id="pdfwm-string" value="CONFIDENTIAL">
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
                            <div class="input-group">
                                <label>Opacity (0.1 - 1.0)</label>
                                <input type="number" class="form-input" id="pdfwm-opacity" value="0.3" min="0.1" max="1" step="0.1">
                            </div>
                            <div class="input-group">
                                <label>Font Size</label>
                                <input type="number" class="form-input" id="pdfwm-size" value="48">
                            </div>
                        </div>
                        <button class="app-btn primary" id="pdfwm-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-stamp" style="margin-right:6px;"></i>Add Watermark & Save
                        </button>
                    </div>
                    <div>
                        <div class="input-group">
                            <label>Watermark Status & Progress</label>
                            <div class="output-container" style="margin-top:0;">
                                <pre class="output-pre" id="pdfwm-log" style="min-height:220px; font-size:11px;">[Ready] Select PDF file...</pre>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('pdfwm-dropzone');
            const fileInput = document.getElementById('pdfwm-input');
            const wmText = document.getElementById('pdfwm-text');
            const wmString = document.getElementById('pdfwm-string');
            const wmOpacity = document.getElementById('pdfwm-opacity');
            const wmSize = document.getElementById('pdfwm-size');
            const wmBtn = document.getElementById('pdfwm-btn');
            const logBox = document.getElementById('pdfwm-log');
            let pdfFile = null;

            const updateLog = (msg, clear = false) => {
                const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
                if (clear) logBox.textContent = `[${time}] ${msg}`;
                else logBox.textContent += `\n[${time}] ${msg}`;
            };

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                pdfFile = e.target.files[0];
                if (pdfFile) {
                    wmText.textContent = pdfFile.name;
                    updateLog(`Loaded file: ${pdfFile.name}`, true);
                }
            };

            wmBtn.onclick = async () => {
                if (!pdfFile) {
                    utils.showToast('Please upload a PDF first!', 'error');
                    return;
                }
                wmBtn.disabled = true;
                updateLog('Loading PDF...');

                try {
                    const bytes = await pdfFile.arrayBuffer();
                    const pdfDoc = await PDFLib.PDFDocument.load(bytes);
                    const pages = pdfDoc.getPages();
                    const text = wmString.value || 'CONFIDENTIAL';
                    const size = parseInt(wmSize.value) || 40;
                    const opacity = parseFloat(wmOpacity.value) || 0.3;

                    updateLog(`Processing watermark on ${pages.length} pages...`);

                    const standardFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

                    pages.forEach((page, idx) => {
                        const { width, height } = page.getSize();
                        
                        // Render rotated text in the center
                        page.drawText(text, {
                            x: width / 2 - (text.length * size * 0.25),
                            y: height / 2,
                            size: size,
                            font: standardFont,
                            color: PDFLib.rgb(0.7, 0, 0), // Dark Red
                            opacity: opacity,
                            rotate: PDFLib.degrees(45),
                        });
                        updateLog(`Stamped page ${idx+1}`);
                    });

                    updateLog('Saving watermarked PDF...');
                    const outputBytes = await pdfDoc.save();
                    utils.downloadFile(outputBytes, `watermarked_${pdfFile.name}`, 'application/pdf');
                    updateLog('PDF Watermark applied successfully!');
                    window.incrementStatsRun();
                } catch(err) {
                    updateLog(`Failed: ${err.message}`);
                } finally {
                    wmBtn.disabled = false;
                }
            };
        }
    },

    // 8. PDF Password Unlocker
    {
        id: 'adv-pdf-unlock',
        name: 'PDF Password Unlock',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-lock-open"></i>',
        description: 'Remove password protection/encryption from PDF files locally.',
        tags: ['pdf', 'unlock', 'decrypt', 'password', 'security'],
        render() {
            return `
                <div class="uploader-box" id="pdfun-dropzone" style="height:100px;">
                    <i class="fa-solid fa-file-shield uploader-icon" style="color:var(--accent-secondary);"></i>
                    <div class="uploader-text" id="pdfun-text">Upload Locked PDF</div>
                    <input type="file" id="pdfun-input" accept="application/pdf" style="display:none;">
                </div>
                <div class="input-group" style="margin-top:15px;">
                    <label>PDF Password</label>
                    <input type="password" class="form-input" id="pdfun-pass" placeholder="Type password here...">
                </div>
                <button class="app-btn primary" id="pdfun-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                    <i class="fa-solid fa-lock-open" style="margin-right:6px;"></i>Decrypt & Download PDF
                </button>
            `;
        },
        init() {
            const dropzone = document.getElementById('pdfun-dropzone');
            const fileInput = document.getElementById('pdfun-input');
            const textEl = document.getElementById('pdfun-text');
            const passEl = document.getElementById('pdfun-pass');
            const btn = document.getElementById('pdfun-btn');
            let pdfFile = null;

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                pdfFile = e.target.files[0];
                if (pdfFile) {
                    textEl.textContent = pdfFile.name;
                }
            };

            btn.onclick = async () => {
                if (!pdfFile) {
                    utils.showToast('Please upload a PDF first!', 'error');
                    return;
                }
                const password = passEl.value;
                if (!password) {
                    utils.showToast('Please enter the PDF password!', 'error');
                    return;
                }

                btn.disabled = true;
                try {
                    const bytes = await pdfFile.arrayBuffer();
                    // Load encrypted PDF with user password
                    const pdfDoc = await PDFLib.PDFDocument.load(bytes, { password });
                    
                    // Saving creates a decrypted/unencrypted copy
                    const outBytes = await pdfDoc.save();
                    utils.downloadFile(outBytes, `unlocked_${pdfFile.name}`, 'application/pdf');
                    utils.showToast('PDF unlocked and saved successfully!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast('Unlock failed! Double check password.', 'error');
                } finally {
                    btn.disabled = false;
                }
            };
        }
    },

    // 9. PDF to Image Extractor
    {
        id: 'adv-pdf-to-img',
        name: 'PDF to Image Extractor',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-images"></i>',
        description: 'Extract and download all pages of a PDF document as images in a ZIP.',
        tags: ['pdf', 'images', 'jpg', 'png', 'pages', 'unpack'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>PDF Document</label>
                            <div class="uploader-box" id="pdfimg-dropzone" style="height:90px;">
                                <i class="fa-solid fa-file-pdf uploader-icon" style="color:var(--accent-primary);"></i>
                                <div class="uploader-text" id="pdfimg-text">Choose PDF File</div>
                                <input type="file" id="pdfimg-input" accept="application/pdf" style="display:none;">
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
                            <div class="input-group">
                                <label>Image Format</label>
                                <select id="pdfimg-format" class="form-select">
                                    <option value="image/png">PNG</option>
                                    <option value="image/jpeg">JPEG</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Render Quality (DPI Scale)</label>
                                <select id="pdfimg-scale" class="form-select">
                                    <option value="1.0">Standard (1.0x)</option>
                                    <option value="1.5">Medium (1.5x)</option>
                                    <option value="2.0">High (2.0x)</option>
                                </select>
                            </div>
                        </div>
                        <button class="app-btn primary" id="pdfimg-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-images" style="margin-right:6px;"></i>Extract Images (ZIP)
                        </button>
                    </div>
                    <div>
                        <div class="input-group">
                            <label>Extraction Logs</label>
                            <div class="output-container" style="margin-top:0;">
                                <pre class="output-pre" id="pdfimg-log" style="min-height:220px; font-size:11px;">[Ready] Select PDF file...</pre>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('pdfimg-dropzone');
            const fileInput = document.getElementById('pdfimg-input');
            const labelText = document.getElementById('pdfimg-text');
            const formatEl = document.getElementById('pdfimg-format');
            const scaleEl = document.getElementById('pdfimg-scale');
            const btn = document.getElementById('pdfimg-btn');
            const logBox = document.getElementById('pdfimg-log');
            let pdfFile = null;

            const updateLog = (msg, clear = false) => {
                const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
                if (clear) logBox.textContent = `[${time}] ${msg}`;
                else logBox.textContent += `\n[${time}] ${msg}`;
                logBox.scrollTop = logBox.scrollHeight;
            };

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                pdfFile = e.target.files[0];
                if (pdfFile) {
                    labelText.textContent = pdfFile.name;
                    updateLog(`Loaded file: ${pdfFile.name}`, true);
                }
            };

            btn.onclick = async () => {
                if (!pdfFile) {
                    utils.showToast('Please upload a PDF first!', 'error');
                    return;
                }
                const pdfjsLib = window.pdfjsLib;
                if (!pdfjsLib) {
                    utils.showToast('PDF.js not loaded. Check internet connection.', 'error');
                    return;
                }
                if (!window.JSZip) {
                    utils.showToast('JSZip not loaded. Check internet connection.', 'error');
                    return;
                }

                btn.disabled = true;
                updateLog('Extracting PDF pages... Initializing renderer.');

                try {
                    const bytes = new Uint8Array(await pdfFile.arrayBuffer());
                    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
                    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
                    const zip = new JSZip();
                    const fmt = formatEl.value;
                    const ext = fmt === 'image/png' ? 'png' : 'jpg';
                    const scaleVal = parseFloat(scaleEl.value);

                    updateLog(`Total pages: ${pdf.numPages}. Starting render loop.`);

                    for (let i = 1; i <= pdf.numPages; i++) {
                        updateLog(`Rendering page ${i}/${pdf.numPages}...`);
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: scaleVal });

                        const canvas = document.createElement('canvas');
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        const context = canvas.getContext('2d');

                        await page.render({ canvasContext: context, viewport: viewport }).promise;
                        
                        // Extract base64
                        const dataUrl = canvas.toDataURL(fmt);
                        const b64Data = dataUrl.split(',')[1];
                        zip.file(`page_${i}.${ext}`, b64Data, { base64: true });
                    }

                    updateLog('Creating ZIP file...');
                    const zipBlob = await zip.generateAsync({ type: 'blob' });
                    utils.downloadFile(zipBlob, `${pdfFile.name.replace('.pdf', '')}_images.zip`, 'application/zip');
                    updateLog('All pages extracted successfully.');
                    window.incrementStatsRun();
                } catch(err) {
                    updateLog(`Extraction failed: ${err.message}`);
                    utils.showToast('Extraction failed.', 'error');
                } finally {
                    btn.disabled = false;
                }
            };
        }
    },

    // 10. Text to PDF
    {
        id: 'adv-txt-pdf',
        name: 'Text to PDF',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-file-pdf"></i>',
        description: 'Convert plain text articles or scripts into neatly paginated PDF reports.',
        tags: ['txt', 'pdf', 'converter', 'convert'],
        render() {
            return `
                <div class="input-group">
                    <label>Input Text Content</label>
                    <textarea class="form-textarea" id="txtpdf-input" style="min-height:180px;" placeholder="Type or paste text here..."></textarea>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
                    <div class="input-group">
                        <label>Font Family</label>
                        <select id="txtpdf-font" class="form-select">
                            <option value="helvetica">Helvetica (Sans-Serif)</option>
                            <option value="times">Times New Roman (Serif)</option>
                            <option value="courier">Courier (Monospace)</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Filename</label>
                        <input type="text" class="form-input" id="txtpdf-name" value="text_document.pdf">
                    </div>
                </div>
                <button class="app-btn primary" id="txtpdf-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                    <i class="fa-solid fa-file-arrow-down" style="margin-right:6px;"></i>Generate PDF
                </button>
            `;
        },
        init() {
            const btn = document.getElementById('txtpdf-btn');
            btn.onclick = () => {
                const text = document.getElementById('txtpdf-input').value;
                if (!text.trim()) {
                    utils.showToast('Please type some text first!', 'error');
                    return;
                }
                if (!window.jspdf) {
                    utils.showToast('jsPDF library not loaded.', 'error');
                    return;
                }

                btn.disabled = true;
                try {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
                    const font = document.getElementById('txtpdf-font').value;
                    const filename = document.getElementById('txtpdf-name').value || 'document.pdf';

                    doc.setFont(font, 'normal');
                    doc.setFontSize(11);
                    
                    const lines = doc.splitTextToSize(text, 180);
                    let y = 15;
                    lines.forEach(line => {
                        if (y > 280) {
                            doc.addPage();
                            y = 15;
                        }
                        doc.text(line, 15, y);
                        y += 6;
                    });

                    doc.save(filename.endsWith('.pdf') ? filename : filename + '.pdf');
                    utils.showToast('PDF compiled successfully!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast(err.message, 'error');
                } finally {
                    btn.disabled = false;
                }
            };
        }
    },

    // 11. JSON to PDF
    {
        id: 'adv-json-pdf',
        name: 'JSON to PDF',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-code"></i>',
        description: 'Format raw JSON payloads into structured, syntax-highlighted PDF documents.',
        tags: ['json', 'pdf', 'code', 'format', 'convert'],
        render() {
            return `
                <div class="input-group">
                    <label>JSON Content</label>
                    <textarea class="form-textarea" id="jsonpdf-input" style="min-height:180px; font-family:monospace;" placeholder='{"name": "MeyTool", "status": "Ready"}'></textarea>
                </div>
                <button class="app-btn primary" id="jsonpdf-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                    <i class="fa-solid fa-code" style="margin-right:6px;"></i>Format JSON to PDF
                </button>
            `;
        },
        init() {
            const btn = document.getElementById('jsonpdf-btn');
            btn.onclick = () => {
                const jsonText = document.getElementById('jsonpdf-input').value;
                if (!jsonText.trim()) return;
                try {
                    const parsed = JSON.parse(jsonText);
                    const formatted = JSON.stringify(parsed, null, 2);
                    
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
                    doc.setFont('courier', 'normal');
                    doc.setFontSize(10);
                    
                    const lines = doc.splitTextToSize(formatted, 180);
                    let y = 15;
                    lines.forEach(line => {
                        if (y > 280) {
                            doc.addPage();
                            y = 15;
                        }
                        doc.text(line, 15, y);
                        y += 5;
                    });
                    
                    doc.save('formatted_json.pdf');
                    utils.showToast('JSON PDF downloaded!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast('Invalid JSON structure: ' + err.message, 'error');
                }
            };
        }
    },

    // 12. CSV to PDF
    {
        id: 'adv-csv-pdf',
        name: 'CSV to PDF Table',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-table"></i>',
        description: 'Convert comma-separated tables (CSV) into clean tabular PDF grid reports.',
        tags: ['csv', 'pdf', 'table', 'sheet', 'converter'],
        render() {
            return `
                <div class="input-group">
                    <label>CSV Table Content (First line is header)</label>
                    <textarea class="form-textarea" id="csvpdf-input" style="min-height:150px;" placeholder="Name, Age, Role\nJohn, 30, Developer\nSarah, 28, Designer"></textarea>
                </div>
                <button class="app-btn primary" id="csvpdf-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                    <i class="fa-solid fa-table-list" style="margin-right:6px;"></i>Generate PDF Grid Table
                </button>
            `;
        },
        init() {
            const btn = document.getElementById('csvpdf-btn');
            btn.onclick = () => {
                const csv = document.getElementById('csvpdf-input').value;
                if (!csv.trim()) return;

                try {
                    const rows = csv.split('\n')
                        .map(line => line.split(','))
                        .filter(row => row.length > 0 && row[0].trim() !== '');

                    if (rows.length === 0) throw new Error('CSV is empty');
                    const headers = rows[0];
                    const bodyRows = rows.slice(1);

                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();

                    if (typeof doc.autoTable === 'function') {
                        doc.autoTable({
                            head: [headers],
                            body: bodyRows,
                            startY: 15
                        });
                    } else {
                        // fallback plain text rendering
                        let y = 15;
                        rows.forEach(r => {
                            doc.text(r.join(' | '), 15, y);
                            y += 8;
                        });
                    }

                    doc.save('csv_table_report.pdf');
                    utils.showToast('CSV PDF report downloaded!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast(err.message, 'error');
                }
            };
        }
    },

    // 13. HTML to PDF
    {
        id: 'adv-html-pdf',
        name: 'HTML to PDF Converter',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-file-code"></i>',
        description: 'Render custom HTML code blocks offline and download as PDF reports.',
        tags: ['html', 'pdf', 'markup', 'render'],
        render() {
            return `
                <div class="input-group">
                    <label>HTML Code block</label>
                    <textarea class="form-textarea" id="htmlpdf-input" style="min-height:180px; font-family:monospace;" placeholder="<h1>Hello World</h1><p>MeyTool PDF Engine rendering locally.</p>"></textarea>
                </div>
                <button class="app-btn primary" id="htmlpdf-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                    <i class="fa-solid fa-file-pdf" style="margin-right:6px;"></i>Render HTML to PDF
                </button>
            `;
        },
        init() {
            const btn = document.getElementById('htmlpdf-btn');
            btn.onclick = async () => {
                const html = document.getElementById('htmlpdf-input').value;
                if (!html.trim()) return;

                btn.disabled = true;
                const tempDiv = document.createElement('div');
                tempDiv.style.cssText = 'position:absolute; left:-9999px; width:180mm; padding:15px; font-family:sans-serif; background:#fff; color:#000;';
                tempDiv.innerHTML = html;
                document.body.appendChild(tempDiv);

                try {
                    const canvas = await html2canvas(tempDiv);
                    const imgData = canvas.toDataURL('image/png');
                    
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
                    
                    const w = 180;
                    const h = (canvas.height / canvas.width) * w;
                    doc.addImage(imgData, 'PNG', 15, 15, w, h);
                    doc.save('rendered_html.pdf');
                    utils.showToast('HTML PDF report downloaded!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast(err.message, 'error');
                } finally {
                    document.body.removeChild(tempDiv);
                    btn.disabled = false;
                }
            };
        }
    },

    // 14. Image to PDF
    {
        id: 'adv-img-pdf',
        name: 'Image to PDF Creator',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-file-image"></i>',
        description: 'Pack standard photos (JPG/PNG/WEBP) into a single PDF document page list.',
        tags: ['image', 'pdf', 'images to pdf', 'photo', 'album'],
        render() {
            return `
                <div class="uploader-box" id="imgpdf-dropzone" style="height:100px;">
                    <i class="fa-solid fa-images uploader-icon" style="color:var(--accent-secondary);"></i>
                    <div class="uploader-text" id="imgpdf-text">Upload Photos</div>
                    <input type="file" id="imgpdf-input" multiple accept="image/*" style="display:none;">
                </div>
                <div id="imgpdf-preview" style="display:flex; flex-wrap:wrap; gap:10px; margin-top:15px;"></div>
                <button class="app-btn primary" id="imgpdf-btn" style="width:100%; margin-top:15px; border-radius:20px; display:none;">
                    <i class="fa-solid fa-file-pdf" style="margin-right:6px;"></i>Create PDF Document
                </button>
            `;
        },
        init() {
            const dropzone = document.getElementById('imgpdf-dropzone');
            const fileInput = document.getElementById('imgpdf-input');
            const preview = document.getElementById('imgpdf-preview');
            const convertBtn = document.getElementById('imgpdf-btn');
            let imgList = [];

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => handleImages(e.target.files);

            const handleImages = (files) => {
                for (let file of files) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        imgList.push({ name: file.name, data: evt.target.result });
                        renderPreviews();
                    };
                    reader.readAsDataURL(file);
                }
            };

            const renderPreviews = () => {
                preview.innerHTML = '';
                imgList.forEach((img, idx) => {
                    const wrap = document.createElement('div');
                    wrap.style.cssText = "position:relative; width:80px; height:80px; border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.1);";
                    wrap.innerHTML = `
                        <img src="${img.data}" style="width:100%; height:100%; object-fit:cover;">
                        <i class="fa-solid fa-circle-xmark" style="position:absolute; top:4px; right:4px; color:#ef4444; cursor:pointer;" onclick="window.removeImgPdf(${idx})"></i>
                    `;
                    preview.appendChild(wrap);
                });
                convertBtn.style.display = imgList.length > 0 ? 'block' : 'none';
            };

            window.removeImgPdf = (idx) => {
                imgList.splice(idx, 1);
                renderPreviews();
            };

            convertBtn.onclick = () => {
                if (imgList.length === 0) return;
                convertBtn.disabled = true;

                try {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
                    
                    imgList.forEach((img, idx) => {
                        if (idx > 0) doc.addPage();
                        doc.addImage(img.data, 'JPEG', 15, 15, 180, 260);
                    });

                    doc.save('image_document.pdf');
                    utils.showToast('Images successfully packed to PDF!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast(err.message, 'error');
                } finally {
                    convertBtn.disabled = false;
                }
            };
        }
    },

    // 15. Markdown to PDF/HTML
    {
        id: 'adv-md-pdf',
        name: 'Markdown to PDF',
        category: 'adv-file',
        icon: '<i class="fa-brands fa-markdown"></i>',
        description: 'Write or load raw Markdown formatting and export clean PDF documents.',
        tags: ['markdown', 'md', 'pdf', 'compiler', 'writer'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Markdown Editor</label>
                            <textarea class="form-textarea" id="mdpdf-input" style="min-height:180px; font-family:monospace;" placeholder="# Document Title\n\n**Bold Text** or *italicized text*.\n\n- Bullet points\n- Second point"></textarea>
                        </div>
                        <button class="app-btn primary" id="mdpdf-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-file-pdf" style="margin-right:6px;"></i>Compile Markdown to PDF
                        </button>
                    </div>
                    <div>
                        <h3 style="font-size:13px; font-weight:700; color:var(--accent-secondary); margin-bottom:10px;">HTML Visual Preview</h3>
                        <div class="output-container" id="mdpdf-preview" style="margin-top:0; min-height:220px; font-size:12px; padding:15px; background:rgba(0,0,0,0.25); overflow-y:auto; line-height:1.5;">
                            <span style="color:var(--text-muted);">Visual live preview...</span>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const editor = document.getElementById('mdpdf-input');
            const preview = document.getElementById('mdpdf-preview');
            const btn = document.getElementById('mdpdf-btn');

            const parseMD = (mdText) => {
                let html = mdText
                    .replace(/^#\s+(.*$)/gim, '<h1>$1</h1>')
                    .replace(/^##\s+(.*$)/gim, '<h2>$1</h2>')
                    .replace(/^###\s+(.*$)/gim, '<h3>$1</h3>')
                    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                    .replace(/\*(.*)\*/gim, '<em>$1</em>')
                    .replace(/^\-\s+(.*$)/gim, '<li>$1</li>')
                    .replace(/\n$/gim, '<br>');
                return html;
            };

            editor.oninput = () => {
                const text = editor.value;
                preview.innerHTML = text.trim() ? parseMD(text) : '<span style="color:var(--text-muted);">Visual live preview...</span>';
            };

            btn.onclick = async () => {
                const text = editor.value;
                if (!text.trim()) return;

                btn.disabled = true;
                const tempDiv = document.createElement('div');
                tempDiv.style.cssText = 'position:absolute; left:-9999px; width:180mm; padding:15px; font-family:sans-serif; background:#fff; color:#000;';
                tempDiv.innerHTML = parseMD(text);
                document.body.appendChild(tempDiv);

                try {
                    const canvas = await html2canvas(tempDiv);
                    const imgData = canvas.toDataURL('image/png');
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF();
                    const w = 180;
                    const h = (canvas.height / canvas.width) * w;
                    doc.addImage(imgData, 'PNG', 15, 15, w, h);
                    doc.save('markdown_document.pdf');
                    utils.showToast('Markdown compiled to PDF!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast(err.message, 'error');
                } finally {
                    document.body.removeChild(tempDiv);
                    btn.disabled = false;
                }
            };
        }
    },

    // 16. JSON to CSV
    {
        id: 'adv-json-csv',
        name: 'JSON to CSV',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-right-left"></i>',
        description: 'Parse raw array lists of JSON objects into formatted CSV table formats.',
        tags: ['json', 'csv', 'converter', 'tabular'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Input JSON Payload (Array of Objects)</label>
                            <textarea class="form-textarea" id="jcsv-input" style="min-height:180px; font-family:monospace;" placeholder='[{"name":"John", "age":30}, {"name":"Alice", "age":25}]'></textarea>
                        </div>
                        <button class="app-btn primary" id="jcsv-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-arrow-right-long" style="margin-right:6px;"></i>Convert to CSV
                        </button>
                    </div>
                    <div>
                        <div class="input-group">
                            <label>Output CSV Content</label>
                            <div class="output-container" style="margin-top:0;">
                                <button class="copy-badge-btn" id="jcsv-copy">Copy CSV</button>
                                <textarea class="form-textarea" id="jcsv-output" style="min-height:180px; font-family:monospace; background:transparent; border:none; color:#10b981;" readonly></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const input = document.getElementById('jcsv-input');
            const output = document.getElementById('jcsv-output');
            const btn = document.getElementById('jcsv-btn');
            const copy = document.getElementById('jcsv-copy');

            btn.onclick = () => {
                try {
                    const parsed = JSON.parse(input.value);
                    const arr = Array.isArray(parsed) ? parsed : [parsed];
                    if (arr.length === 0) throw new Error('Array is empty');
                    
                    const headers = Object.keys(arr[0]);
                    const csvRows = [headers.join(',')];
                    
                    for (let row of arr) {
                        const values = headers.map(header => {
                            const val = row[header];
                            return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
                        });
                        csvRows.push(values.join(','));
                    }

                    output.value = csvRows.join('\n');
                    utils.showToast('JSON converted to CSV!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast(err.message, 'error');
                }
            };
            copy.onclick = () => utils.copyText(output.value);
        }
    },

    // 17. CSV to JSON
    {
        id: 'adv-csv-json',
        name: 'CSV to JSON',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-right-left"></i>',
        description: 'Read delimited CSV tables and serialize them into standard array JSON format.',
        tags: ['csv', 'json', 'converter', 'serialize'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Input CSV text</label>
                            <textarea class="form-textarea" id="csvj-input" style="min-height:180px;" placeholder="name,age\nJohn,30\nAlice,25"></textarea>
                        </div>
                        <button class="app-btn primary" id="csvj-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-arrow-right-long" style="margin-right:6px;"></i>Convert to JSON
                        </button>
                    </div>
                    <div>
                        <div class="input-group">
                            <label>Output JSON List</label>
                            <div class="output-container" style="margin-top:0;">
                                <button class="copy-badge-btn" id="csvj-copy">Copy JSON</button>
                                <textarea class="form-textarea" id="csvj-output" style="min-height:180px; font-family:monospace; background:transparent; border:none; color:#38bdf8;" readonly></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const input = document.getElementById('csvj-input');
            const output = document.getElementById('csvj-output');
            const btn = document.getElementById('csvj-btn');
            const copy = document.getElementById('csvj-copy');

            btn.onclick = () => {
                const lines = input.value.trim().split('\n');
                if (lines.length < 2) {
                    utils.showToast('CSV requires headers and at least one data row!', 'error');
                    return;
                }
                try {
                    const headers = lines[0].split(',').map(h => h.trim());
                    const list = [];
                    for (let i = 1; i < lines.length; i++) {
                        const cols = lines[i].split(',').map(c => c.trim());
                        if (cols.length === headers.length) {
                            const obj = {};
                            headers.forEach((h, idx) => {
                                const val = cols[idx];
                                obj[h] = isNaN(val) ? val : parseFloat(val);
                            });
                            list.push(obj);
                        }
                    }
                    output.value = JSON.stringify(list, null, 2);
                    utils.showToast('CSV converted to JSON!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast(err.message, 'error');
                }
            };
            copy.onclick = () => utils.copyText(output.value);
        }
    },

    // 18. Image Cropper
    {
        id: 'adv-img-crop',
        name: 'Image Cropper',
        category: 'image',
        icon: '<i class="fa-solid fa-crop"></i>',
        description: 'Crop images client-side with aspect ratio presets using Canvas API.',
        tags: ['image', 'crop', 'trim', 'editor', 'photo'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Source Image</label>
                            <div class="uploader-box" id="imgcrop-dropzone" style="height:90px;">
                                <i class="fa-solid fa-image uploader-icon" style="color:var(--accent-secondary);"></i>
                                <div class="uploader-text" id="imgcrop-text">Upload Image</div>
                                <input type="file" id="imgcrop-input" accept="image/*" style="display:none;">
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
                            <div class="input-group">
                                <label>Aspect Ratio</label>
                                <select id="imgcrop-ratio" class="form-select">
                                    <option value="free">Free Form</option>
                                    <option value="1:1">Square (1:1)</option>
                                    <option value="16:9">Widescreen (16:9)</option>
                                    <option value="4:3">Standard (4:3)</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Crop Coordinates</label>
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                                    <input type="number" class="form-input" id="imgcrop-x" placeholder="X" value="10">
                                    <input type="number" class="form-input" id="imgcrop-y" placeholder="Y" value="10">
                                </div>
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
                            <div class="input-group">
                                <label>Crop Width (px)</label>
                                <input type="number" class="form-input" id="imgcrop-w" placeholder="Width" value="200">
                            </div>
                            <div class="input-group">
                                <label>Crop Height (px)</label>
                                <input type="number" class="form-input" id="imgcrop-h" placeholder="Height" value="200">
                            </div>
                        </div>
                        <button class="app-btn primary" id="imgcrop-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-crop" style="margin-right:6px;"></i>Crop & Download Image
                        </button>
                    </div>
                    <div>
                        <h3 style="font-size:13px; font-weight:700; color:var(--accent-secondary); margin-bottom:10px;">Cropping Preview Frame</h3>
                        <div class="output-container" style="margin-top:0; min-height:220px; display:flex; justify-content:center; align-items:center; background:rgba(0,0,0,0.25);">
                            <canvas id="imgcrop-canvas" style="max-width:100%; max-height:300px; border:1px dashed rgba(255,255,255,0.1);"></canvas>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('imgcrop-dropzone');
            const fileInput = document.getElementById('imgcrop-input');
            const labelText = document.getElementById('imgcrop-text');
            const ratioSelect = document.getElementById('imgcrop-ratio');
            const cx = document.getElementById('imgcrop-x');
            const cy = document.getElementById('imgcrop-y');
            const cw = document.getElementById('imgcrop-w');
            const ch = document.getElementById('imgcrop-h');
            const btn = document.getElementById('imgcrop-btn');
            const canvas = document.getElementById('imgcrop-canvas');
            const ctx = canvas.getContext('2d');
            let img = new Image();

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    labelText.textContent = file.name;
                    const r = new FileReader();
                    r.onload = (evt) => {
                        img.src = evt.target.result;
                    };
                    r.readAsDataURL(file);
                }
            };

            img.onload = () => {
                // scale canvas to fit image
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Set defaults based on dimensions
                cx.value = 0;
                cy.value = 0;
                cw.value = Math.floor(img.width * 0.8);
                ch.value = Math.floor(img.height * 0.8);
                drawOverlay();
            };

            const drawOverlay = () => {
                ctx.clearRect(0,0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                // Draw crop rectangle overlay
                const x = parseInt(cx.value) || 0;
                const y = parseInt(cy.value) || 0;
                const w = parseInt(cw.value) || 100;
                const h = parseInt(ch.value) || 100;

                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, w, h);
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                // cover outside crop
                ctx.fillRect(0,0, canvas.width, y); // top
                ctx.fillRect(0, y+h, canvas.width, canvas.height-y-h); // bottom
                ctx.fillRect(0, y, x, h); // left
                ctx.fillRect(x+w, y, canvas.width-x-w, h); // right
            };

            ratioSelect.onchange = () => {
                const val = ratioSelect.value;
                const w = parseInt(cw.value) || 200;
                if (val === '1:1') ch.value = w;
                else if (val === '16:9') ch.value = Math.floor(w * (9/16));
                else if (val === '4:3') ch.value = Math.floor(w * (3/4));
                drawOverlay();
            };

            [cx, cy, cw, ch].forEach(el => {
                el.oninput = drawOverlay;
            });

            btn.onclick = () => {
                if (!img.src) return;
                const x = parseInt(cx.value) || 0;
                const y = parseInt(cy.value) || 0;
                const w = parseInt(cw.value) || 100;
                const h = parseInt(ch.value) || 100;

                const outCanvas = document.createElement('canvas');
                outCanvas.width = w;
                outCanvas.height = h;
                const outCtx = outCanvas.getContext('2d');
                outCtx.drawImage(img, x, y, w, h, 0, 0, w, h);

                const dataUrl = outCanvas.toDataURL('image/png');
                utils.downloadFile(dataUrl.split(',')[1], 'cropped_image.png', 'image/png');
                utils.showToast('Image cropped and saved!');
                window.incrementStatsRun();
            };
        }
    },

    // 19. Image Resizer
    {
        id: 'adv-img-resize',
        name: 'Image Resizer',
        category: 'image',
        icon: '<i class="fa-solid fa-expand"></i>',
        description: 'Resize image dimensions to custom pixel dimensions client-side.',
        tags: ['image', 'resize', 'scale', 'dimensions', 'resolution'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Select Image</label>
                            <div class="uploader-box" id="imgsz-dropzone" style="height:90px;">
                                <i class="fa-solid fa-image uploader-icon" style="color:var(--accent-primary);"></i>
                                <div class="uploader-text" id="imgsz-text">Upload Image</div>
                                <input type="file" id="imgsz-input" accept="image/*" style="display:none;">
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
                            <div class="input-group">
                                <label>Width (px)</label>
                                <input type="number" class="form-input" id="imgsz-w" value="800">
                            </div>
                            <div class="input-group">
                                <label>Height (px)</label>
                                <input type="number" class="form-input" id="imgsz-h" value="600">
                            </div>
                        </div>
                        <button class="app-btn primary" id="imgsz-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-expand" style="margin-right:6px;"></i>Resize & Download
                        </button>
                    </div>
                    <div>
                        <h3 style="font-size:13px; font-weight:700; color:var(--accent-secondary); margin-bottom:10px;">Target Dimensions</h3>
                        <div class="output-container" id="imgsz-info" style="margin-top:0; min-height:180px; padding:15px; font-size:12px; line-height:1.6;">
                            <span style="color:var(--text-muted);">No image loaded. Upload to resize.</span>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('imgsz-dropzone');
            const fileInput = document.getElementById('imgsz-input');
            const textEl = document.getElementById('imgsz-text');
            const wInput = document.getElementById('imgsz-w');
            const hInput = document.getElementById('imgsz-h');
            const btn = document.getElementById('imgsz-btn');
            const info = document.getElementById('imgsz-info');
            let img = new Image();
            let aspect = 1;

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    textEl.textContent = file.name;
                    const r = new FileReader();
                    r.onload = (evt) => { img.src = evt.target.result; };
                    r.readAsDataURL(file);
                }
            };

            img.onload = () => {
                wInput.value = img.width;
                hInput.value = img.height;
                aspect = img.width / img.height;
                info.innerHTML = `
                    <div><strong>Original Resolution:</strong> ${img.width} x ${img.height} px</div>
                    <div><strong>File Size:</strong> ${utils.formatBytes(img.src.length * 0.75)}</div>
                `;
            };

            wInput.oninput = () => {
                hInput.value = Math.round(wInput.value / aspect);
            };

            btn.onclick = () => {
                if (!img.src) return;
                const w = parseInt(wInput.value);
                const h = parseInt(hInput.value);

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                utils.downloadFile(dataUrl.split(',')[1], `resized_${w}x${h}.jpg`, 'image/jpeg');
                utils.showToast('Image successfully resized!');
                window.incrementStatsRun();
            };
        }
    },

    // 20. Image Format Converter
    {
        id: 'adv-img-convert',
        name: 'Image Converter',
        category: 'image',
        icon: '<i class="fa-solid fa-image"></i>',
        description: 'Convert between PNG, JPEG, WEBP, and BMP formats instantly.',
        tags: ['image', 'convert', 'png', 'jpg', 'webp', 'bmp', 'format'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Select Photo</label>
                            <div class="uploader-box" id="imgconv-dropzone" style="height:90px;">
                                <i class="fa-solid fa-images uploader-icon" style="color:var(--accent-secondary);"></i>
                                <div class="uploader-text" id="imgconv-text">Upload Image</div>
                                <input type="file" id="imgconv-input" accept="image/*" style="display:none;">
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:10px;">
                            <label>Convert To</label>
                            <select id="imgconv-target" class="form-select">
                                <option value="image/png">PNG Format</option>
                                <option value="image/jpeg">JPEG Format</option>
                                <option value="image/webp">WEBP Format</option>
                            </select>
                        </div>
                        <button class="app-btn primary" id="imgconv-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-shuffle" style="margin-right:6px;"></i>Convert Format
                        </button>
                    </div>
                    <div>
                        <h3 style="font-size:13px; font-weight:700; color:var(--accent-secondary); margin-bottom:10px;">Visual Preview</h3>
                        <div class="output-container" style="margin-top:0; min-height:180px; display:flex; justify-content:center; align-items:center;">
                            <img id="imgconv-preview" style="max-width:100%; max-height:150px; border-radius:8px; display:none;">
                            <span id="imgconv-hint" style="color:var(--text-muted);">No image uploaded</span>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('imgconv-dropzone');
            const fileInput = document.getElementById('imgconv-input');
            const textEl = document.getElementById('imgconv-text');
            const targetEl = document.getElementById('imgconv-target');
            const btn = document.getElementById('imgconv-btn');
            const preview = document.getElementById('imgconv-preview');
            const hint = document.getElementById('imgconv-hint');
            let img = new Image();

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    textEl.textContent = file.name;
                    const r = new FileReader();
                    r.onload = (evt) => {
                        img.src = evt.target.result;
                        preview.src = evt.target.result;
                        preview.style.display = 'block';
                        hint.style.display = 'none';
                    };
                    r.readAsDataURL(file);
                }
            };

            btn.onclick = () => {
                if (!img.src) return;
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                const format = targetEl.value;
                const ext = format.split('/')[1];
                const dataUrl = canvas.toDataURL(format);
                
                utils.downloadFile(dataUrl.split(',')[1], `converted_image.${ext}`, format);
                utils.showToast(`Converted successfully to ${ext.toUpperCase()}`);
                window.incrementStatsRun();
            };
        }
    },

    // 21. Image Compressor
    {
        id: 'adv-img-compress',
        name: 'Image Compressor',
        category: 'image',
        icon: '<i class="fa-solid fa-compress"></i>',
        description: 'Compress image file sizes client-side by configuring output quality.',
        tags: ['image', 'compress', 'minify', 'jpeg', 'optimizier'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Upload Image</label>
                            <div class="uploader-box" id="imgcomp-dropzone" style="height:90px;">
                                <i class="fa-solid fa-image uploader-icon" style="color:var(--accent-primary);"></i>
                                <div class="uploader-text" id="imgcomp-text">Choose Image</div>
                                <input type="file" id="imgcomp-input" accept="image/jpeg,image/png,image/webp" style="display:none;">
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:10px;">
                            <label>Compression Quality: <strong id="imgcomp-val">70%</strong></label>
                            <input type="range" class="form-range" id="imgcomp-quality" min="10" max="95" value="70" style="width:100%;">
                        </div>
                        <button class="app-btn primary" id="imgcomp-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-compress" style="margin-right:6px;"></i>Compress & Download
                        </button>
                    </div>
                    <div>
                        <h3 style="font-size:13px; font-weight:700; color:var(--accent-secondary); margin-bottom:10px;">File Savings Report</h3>
                        <div class="output-container" id="imgcomp-report" style="margin-top:0; min-height:180px; padding:15px; font-size:12px; line-height:1.6;">
                            <span style="color:var(--text-muted);">No image loaded. Upload to compare file savings.</span>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('imgcomp-dropzone');
            const fileInput = document.getElementById('imgcomp-input');
            const textEl = document.getElementById('imgcomp-text');
            const qSlider = document.getElementById('imgcomp-quality');
            const qVal = document.getElementById('imgcomp-val');
            const btn = document.getElementById('imgcomp-btn');
            const report = document.getElementById('imgcomp-report');
            let img = new Image();
            let originalSize = 0;

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    originalSize = file.size;
                    textEl.textContent = file.name;
                    const r = new FileReader();
                    r.onload = (evt) => { img.src = evt.target.result; };
                    r.readAsDataURL(file);
                }
            };

            qSlider.oninput = () => { qVal.textContent = qSlider.value + '%'; if (img.src) updateReport(); };
            img.onload = () => updateReport();

            const updateReport = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                const q = parseInt(qSlider.value) / 100;
                const dataUrl = canvas.toDataURL('image/jpeg', q);
                const compressedSize = Math.round(dataUrl.length * 0.75);
                const savings = Math.round(((originalSize - compressedSize) / originalSize) * 100);

                report.innerHTML = `
                    <div><strong>Original Size:</strong> ${utils.formatBytes(originalSize)}</div>
                    <div><strong>Compressed Size:</strong> ${utils.formatBytes(compressedSize)}</div>
                    <div><strong>Total Space Saved:</strong> ${savings > 0 ? savings + '%' : '0%'}</div>
                    <div style="margin-top:10px; color:${savings > 0 ? '#10b981' : '#ef4444'}; font-weight:700;">
                        ${savings > 0 ? '✓ Ready for optimization download' : 'Image is already fully optimized!'}
                    </div>
                `;
            };

            btn.onclick = () => {
                if (!img.src) return;
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                const q = parseInt(qSlider.value) / 100;
                const dataUrl = canvas.toDataURL('image/jpeg', q);
                utils.downloadFile(dataUrl.split(',')[1], 'compressed_photo.jpg', 'image/jpeg');
                utils.showToast('Compressed image saved!');
                window.incrementStatsRun();
            };
        }
    },

    // 22. OCR Image to Text (Tesseract.js)
    {
        id: 'adv-img-ocr',
        name: 'OCR Image to Text',
        category: 'image',
        icon: '<i class="fa-solid fa-eye"></i>',
        description: 'Scan and extract textual strings from images offline using Tesseract OCR.',
        tags: ['ocr', 'scan', 'text extraction', 'read image', 'tesseract'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Choose Image</label>
                            <div class="uploader-box" id="ocr-dropzone" style="height:90px;">
                                <i class="fa-solid fa-camera uploader-icon" style="color:var(--accent-secondary);"></i>
                                <div class="uploader-text" id="ocr-text">Select Image</div>
                                <input type="file" id="ocr-input" accept="image/*" style="display:none;">
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:10px;">
                            <label>Language Engine</label>
                            <select id="ocr-lang" class="form-select">
                                <option value="eng">English (Latin)</option>
                                <option value="khm">Khmer (ខ្មែរ)</option>
                                <option value="eng+khm">English + Khmer</option>
                            </select>
                        </div>
                        <button class="app-btn primary" id="ocr-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-eye" style="margin-right:6px;"></i>Perform OCR Scan
                        </button>
                    </div>
                    <div>
                        <div class="input-group">
                            <label>Extracted Text Output</label>
                            <div class="output-container" style="margin-top:0;">
                                <button class="copy-badge-btn" id="ocr-copy">Copy Text</button>
                                <textarea class="form-textarea" id="ocr-output" style="min-height:180px; background:transparent; border:none; color:#e2e8f0; font-size:12px;"></textarea>
                            </div>
                        </div>
                        <div class="progress-bar-container" id="ocr-progress" style="margin-top:10px;">
                            <div class="progress-bar-fill" id="ocr-fill"></div>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('ocr-dropzone');
            const fileInput = document.getElementById('ocr-input');
            const labelText = document.getElementById('ocr-text');
            const langSelect = document.getElementById('ocr-lang');
            const btn = document.getElementById('ocr-btn');
            const output = document.getElementById('ocr-output');
            const copy = document.getElementById('ocr-copy');
            const progressBar = document.getElementById('ocr-progress');
            const progressFill = document.getElementById('ocr-fill');
            let imgData = null;

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    labelText.textContent = file.name;
                    const r = new FileReader();
                    r.onload = (evt) => { imgData = evt.target.result; };
                    r.readAsDataURL(file);
                }
            };

            btn.onclick = async () => {
                if (!imgData) {
                    utils.showToast('Please upload an image first!', 'error');
                    return;
                }
                const Tesseract = window.Tesseract;
                if (!Tesseract) {
                    utils.showToast('OCR engine not loaded. Check internet.', 'error');
                    return;
                }

                btn.disabled = true;
                output.value = 'Running Tesseract OCR engine client-side...\nLoading language trained data files...';
                progressBar.style.display = 'block';
                progressFill.style.width = '10%';

                try {
                    const lang = langSelect.value;
                    const result = await Tesseract.recognize(
                        imgData,
                        lang,
                        {
                            logger: m => {
                                if (m.status === 'recognizing text') {
                                    const pct = Math.round(m.progress * 100);
                                    progressFill.style.width = `${pct}%`;
                                    output.value = `Recognizing text elements: ${pct}%...`;
                                }
                            }
                        }
                    );
                    progressBar.style.display = 'none';
                    output.value = result.data.text || 'No text elements detected in image.';
                    utils.showToast('OCR scanning finished!');
                    window.incrementStatsRun();
                } catch(err) {
                    output.value = `OCR Error: ${err.message}`;
                    progressBar.style.display = 'none';
                } finally {
                    btn.disabled = false;
                }
            };

            copy.onclick = () => utils.copyText(output.value);
        }
    },

    // 23. Color Palette Extractor
    {
        id: 'adv-img-palette',
        name: 'Color Palette Extractor',
        category: 'image',
        icon: '<i class="fa-solid fa-palette"></i>',
        description: 'Extract dominant color palette swatches from uploaded images.',
        tags: ['image', 'palette', 'colors', 'swatches', 'hex'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Source Image</label>
                            <div class="uploader-box" id="palette-dropzone" style="height:120px;">
                                <i class="fa-solid fa-image uploader-icon" style="color:var(--accent-secondary);"></i>
                                <div class="uploader-text" id="palette-text">Choose Image</div>
                                <input type="file" id="palette-input" accept="image/*" style="display:none;">
                            </div>
                        </div>
                        <button class="app-btn primary" id="palette-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-palette" style="margin-right:6px;"></i>Extract Color Palette
                        </button>
                    </div>
                    <div>
                        <h3 style="font-size:13px; font-weight:700; color:var(--accent-secondary); margin-bottom:10px;">Extracted Swatches</h3>
                        <div id="palette-swatches" style="display:flex; flex-direction:column; gap:8px;">
                            <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:20px;">No image loaded</div>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('palette-dropzone');
            const fileInput = document.getElementById('palette-input');
            const labelText = document.getElementById('palette-text');
            const btn = document.getElementById('palette-btn');
            const swatches = document.getElementById('palette-swatches');
            let img = new Image();

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    labelText.textContent = file.name;
                    const r = new FileReader();
                    r.onload = (evt) => { img.src = evt.target.result; };
                    r.readAsDataURL(file);
                }
            };

            btn.onclick = () => {
                if (!img.src) return;
                const canvas = document.createElement('canvas');
                canvas.width = 100;
                canvas.height = 100;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 100, 100);

                const data = ctx.getImageData(0,0, 100, 100).data;
                const colors = [];
                // Sample pixel colors (step of 10 pixels to avoid lag)
                for (let i = 0; i < data.length; i += 40) {
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];
                    const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                    colors.push(hex);
                }

                // Simple clustering: get unique colors
                const uniq = Array.from(new Set(colors)).slice(0, 5);

                swatches.innerHTML = '';
                uniq.forEach(color => {
                    const row = document.createElement('div');
                    row.style.cssText = "display:flex; align-items:center; gap:12px; padding:8px; background:rgba(255,255,255,0.03); border-radius:6px;";
                    row.innerHTML = `
                        <div style="width:30px; height:30px; border-radius:4px; background:${color}; border:1px solid rgba(255,255,255,0.15);"></div>
                        <span style="font-family:monospace; font-size:13px; color:var(--text-primary); font-weight:600;">${color.toUpperCase()}</span>
                        <button class="app-btn secondary" style="margin-left:auto; padding:4px 8px; font-size:10px; border-radius:4px;" onclick="utils.copyText('${color}')">Copy</button>
                    `;
                    swatches.appendChild(row);
                });
                utils.showToast('Color palette swatches extracted!');
                window.incrementStatsRun();
            };
        }
    },

    // 24. ZIP Creator
    {
        id: 'adv-zip-create',
        name: 'ZIP Creator',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-file-zipper"></i>',
        description: 'Compress multiple files into a standard ZIP archive client-side.',
        tags: ['zip', 'compress', 'archive', 'pack', 'folder'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Upload Files</label>
                            <div class="uploader-box" id="zipc-dropzone" style="height:90px;">
                                <i class="fa-solid fa-file-zipper uploader-icon" style="color:var(--accent-secondary);"></i>
                                <div class="uploader-text">Drop files to ZIP</div>
                                <input type="file" id="zipc-input" multiple style="display:none;">
                            </div>
                        </div>
                        <div class="input-group">
                            <label>ZIP Filename</label>
                            <input type="text" class="form-input" id="zipc-name" value="archive.zip">
                        </div>
                        <button class="app-btn primary" id="zipc-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-file-zipper" style="margin-right:6px;"></i>Create ZIP Archive
                        </button>
                    </div>
                    <div>
                        <h3 style="font-size:13px; font-weight:700; color:var(--accent-secondary); margin-bottom:10px;">Queue Files</h3>
                        <div id="zipc-list" style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:10px; max-height:180px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
                            <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">No files selected</div>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('zipc-dropzone');
            const fileInput = document.getElementById('zipc-input');
            const nameEl = document.getElementById('zipc-name');
            const list = document.getElementById('zipc-list');
            const btn = document.getElementById('zipc-btn');
            let queue = [];

            const renderQueue = () => {
                list.innerHTML = '';
                if (queue.length === 0) {
                    list.innerHTML = `<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">No files selected</div>`;
                    return;
                }
                queue.forEach((f, idx) => {
                    const row = document.createElement('div');
                    row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:rgba(255,255,255,0.03); border-radius:4px; font-size:12px;";
                    row.innerHTML = `
                        <span>${f.name} (${utils.formatBytes(f.size)})</span>
                        <i class="fa-solid fa-trash-can" style="color:#ef4444; cursor:pointer;" onclick="window.removeZipQueue(${idx})"></i>
                    `;
                    list.appendChild(row);
                });
            };

            window.removeZipQueue = (idx) => {
                queue.splice(idx, 1);
                renderQueue();
            };

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                for (let f of e.target.files) queue.push(f);
                renderQueue();
            };

            btn.onclick = async () => {
                if (queue.length === 0) {
                    utils.showToast('Please add files first!', 'error');
                    return;
                }
                if (!window.JSZip) {
                    utils.showToast('JSZip not loaded!', 'error');
                    return;
                }

                btn.disabled = true;
                try {
                    const zip = new JSZip();
                    queue.forEach(f => zip.file(f.name, f));
                    const blob = await zip.generateAsync({ type: 'blob' });
                    
                    let outName = nameEl.value.trim();
                    if (!outName.endsWith('.zip')) outName += '.zip';
                    utils.downloadFile(blob, outName, 'application/zip');
                    utils.showToast('ZIP archive created!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast(err.message, 'error');
                } finally {
                    btn.disabled = false;
                }
            };
        }
    },

    // 25. ZIP Extractor
    {
        id: 'adv-zip-extract',
        name: 'ZIP Extractor',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-folder-open"></i>',
        description: 'Unpack zipped files and download individual documents locally.',
        tags: ['zip', 'unzip', 'extract', 'unpack', 'archive'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Zipped Archive (.zip)</label>
                            <div class="uploader-box" id="zipe-dropzone" style="height:120px;">
                                <i class="fa-solid fa-folder-open uploader-icon" style="color:var(--accent-primary);"></i>
                                <div class="uploader-text" id="zipe-text">Upload ZIP file</div>
                                <input type="file" id="zipe-input" accept=".zip,application/zip" style="display:none;">
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 style="font-size:13px; font-weight:700; color:var(--accent-secondary); margin-bottom:10px;">Unpacked Contents</h3>
                        <div id="zipe-list" style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:10px; max-height:220px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
                            <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">No archive loaded</div>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('zipe-dropzone');
            const fileInput = document.getElementById('zipe-input');
            const labelText = document.getElementById('zipe-text');
            const list = document.getElementById('zipe-list');

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                labelText.textContent = file.name;

                if (!window.JSZip) {
                    utils.showToast('JSZip not loaded!', 'error');
                    return;
                }

                try {
                    const zip = await JSZip.loadAsync(file);
                    list.innerHTML = '';
                    
                    const files = Object.keys(zip.files);
                    if (files.length === 0) {
                        list.innerHTML = `<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">ZIP is empty</div>`;
                        return;
                    }

                    files.forEach(filename => {
                        const fileObj = zip.files[filename];
                        if (fileObj.dir) return; // skip dirs

                        const row = document.createElement('div');
                        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:rgba(255,255,255,0.03); border-radius:4px; font-size:12px;";
                        row.innerHTML = `
                            <span>${filename}</span>
                            <button class="app-btn secondary" style="padding:4px 8px; font-size:10px; border-radius:4px;">Download</button>
                        `;

                        row.querySelector('button').onclick = async () => {
                            const blob = await fileObj.async('blob');
                            utils.downloadFile(blob, filename, blob.type || 'application/octet-stream');
                        };

                        list.appendChild(row);
                    });

                    utils.showToast('ZIP archive successfully unpacked!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast('Extract failed: ' + err.message, 'error');
                }
            };
        }
    },

    // 26. Bulk Rename Files
    {
        id: 'adv-bulk-rename',
        name: 'Bulk Rename Files',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-pen-nib"></i>',
        description: 'Rename multiple files at once with custom prefixes, suffixes, or numbering patterns.',
        tags: ['rename', 'bulk', 'batch', 'files', 'naming'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Add Files</label>
                            <div class="uploader-box" id="rename-dropzone" style="height:90px;">
                                <i class="fa-solid fa-file uploader-icon" style="color:var(--accent-secondary);"></i>
                                <div class="uploader-text">Upload files</div>
                                <input type="file" id="rename-input" multiple style="display:none;">
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
                            <div class="input-group">
                                <label>Prefix</label>
                                <input type="text" class="form-input" id="rename-prefix" value="document_">
                            </div>
                            <div class="input-group">
                                <label>Suffix</label>
                                <input type="text" class="form-input" id="rename-suffix" value="">
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
                            <div class="input-group">
                                <label>Starting Index</label>
                                <input type="number" class="form-input" id="rename-index" value="1">
                            </div>
                            <div class="input-group">
                                <label>Format Output</label>
                                <select id="rename-case" class="form-select">
                                    <option value="none">Keep Original Case</option>
                                    <option value="lower">lowercase</option>
                                    <option value="upper">UPPERCASE</option>
                                </select>
                            </div>
                        </div>
                        <button class="app-btn primary" id="rename-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-check" style="margin-right:6px;"></i>Apply Rename & Download (ZIP)
                        </button>
                    </div>
                    <div>
                        <h3 style="font-size:13px; font-weight:700; color:var(--accent-secondary); margin-bottom:10px;">Rename Previews</h3>
                        <div id="rename-list" style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:10px; max-height:220px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
                            <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">No files selected</div>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('rename-dropzone');
            const fileInput = document.getElementById('rename-input');
            const prefix = document.getElementById('rename-prefix');
            const suffix = document.getElementById('rename-suffix');
            const startIdx = document.getElementById('rename-index');
            const caseSelect = document.getElementById('rename-case');
            const list = document.getElementById('rename-list');
            const btn = document.getElementById('rename-btn');
            let queue = [];

            const renderPreviews = () => {
                list.innerHTML = '';
                if (queue.length === 0) {
                    list.innerHTML = `<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">No files selected</div>`;
                    return;
                }

                const pref = prefix.value;
                const suff = suffix.value;
                let idx = parseInt(startIdx.value) || 1;
                const caseVal = caseSelect.value;

                queue.forEach(f => {
                    const ext = f.name.includes('.') ? f.name.split('.').pop() : '';
                    let base = f.name.includes('.') ? f.name.substring(0, f.name.lastIndexOf('.')) : f.name;

                    if (caseVal === 'lower') base = base.toLowerCase();
                    if (caseVal === 'upper') base = base.toUpperCase();

                    const newName = `${pref}${base}${idx}${suff}.${ext}`;
                    idx++;

                    const row = document.createElement('div');
                    row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:rgba(255,255,255,0.03); border-radius:4px; font-size:11px;";
                    row.innerHTML = `
                        <span style="color:var(--text-muted); text-decoration:line-through; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">${f.name}</span>
                        <span style="color:var(--accent-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">${newName}</span>
                    `;
                    list.appendChild(row);
                });
            };

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                for (let f of e.target.files) queue.push(f);
                renderPreviews();
            };

            [prefix, suffix, startIdx, caseSelect].forEach(el => {
                el.oninput = renderPreviews;
                el.onchange = renderPreviews;
            });

            btn.onclick = async () => {
                if (queue.length === 0) return;
                btn.disabled = true;

                try {
                    const zip = new JSZip();
                    const pref = prefix.value;
                    const suff = suffix.value;
                    let idx = parseInt(startIdx.value) || 1;
                    const caseVal = caseSelect.value;

                    queue.forEach(f => {
                        const ext = f.name.includes('.') ? f.name.split('.').pop() : '';
                        let base = f.name.includes('.') ? f.name.substring(0, f.name.lastIndexOf('.')) : f.name;

                        if (caseVal === 'lower') base = base.toLowerCase();
                        if (caseVal === 'upper') base = base.toUpperCase();

                        const newName = `${pref}${base}${idx}${suff}.${ext}`;
                        idx++;
                        zip.file(newName, f);
                    });

                    const blob = await zip.generateAsync({ type: 'blob' });
                    utils.downloadFile(blob, 'renamed_files.zip', 'application/zip');
                    utils.showToast('Files renamed and packed inside ZIP!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast(err.message, 'error');
                } finally {
                    btn.disabled = false;
                }
            };
        }
    },

    // 27. Bulk Convert to PDF
    {
        id: 'adv-bulk-pdf',
        name: 'Bulk Convert to PDF',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-file-pdf"></i>',
        description: 'Batch convert images and documents to individual PDF files in a ZIP.',
        tags: ['pdf', 'convert', 'batch', 'bulk', 'multiple'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Add Files</label>
                            <div class="uploader-box" id="bulkpdf-dropzone" style="height:100px;">
                                <i class="fa-solid fa-cloud-arrow-up uploader-icon" style="color:var(--accent-primary);"></i>
                                <div class="uploader-text">Drop multiple documents</div>
                                <input type="file" id="bulkpdf-input" multiple style="display:none;">
                            </div>
                        </div>
                        <button class="app-btn primary" id="bulkpdf-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-file-pdf" style="margin-right:6px;"></i>Batch Convert (ZIP)
                        </button>
                    </div>
                    <div>
                        <h3 style="font-size:13px; font-weight:700; color:var(--accent-secondary); margin-bottom:10px;">Uploaded Queue</h3>
                        <div id="bulkpdf-list" style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:10px; max-height:200px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
                            <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">No files queued</div>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('bulkpdf-dropzone');
            const fileInput = document.getElementById('bulkpdf-input');
            const list = document.getElementById('bulkpdf-list');
            const btn = document.getElementById('bulkpdf-btn');
            let queue = [];

            const renderQueue = () => {
                list.innerHTML = '';
                if (queue.length === 0) {
                    list.innerHTML = `<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">No files queued</div>`;
                    return;
                }
                queue.forEach((f, idx) => {
                    const row = document.createElement('div');
                    row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:rgba(255,255,255,0.03); border-radius:4px; font-size:12px;";
                    row.innerHTML = `
                        <span>${f.name}</span>
                        <i class="fa-solid fa-circle-xmark" style="color:#ef4444; cursor:pointer;" onclick="window.removeBulkPdf(${idx})"></i>
                    `;
                    list.appendChild(row);
                });
            };

            window.removeBulkPdf = (idx) => { queue.splice(idx, 1); renderQueue(); };

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                for (let f of e.target.files) queue.push(f);
                renderQueue();
            };

            btn.onclick = async () => {
                if (queue.length === 0) return;
                btn.disabled = true;
                
                try {
                    const zip = new JSZip();
                    const { jsPDF } = window.jspdf;

                    for (let file of queue) {
                        const doc = new jsPDF();
                        const isImg = file.type.startsWith('image/');
                        const textContent = await new Promise(resolve => {
                            const r = new FileReader();
                            if (isImg) r.readAsDataURL(file);
                            else r.readAsText(file);
                            r.onload = (evt) => resolve(evt.target.result);
                        });

                        if (isImg) {
                            doc.addImage(textContent, 'JPEG', 10, 10, 190, 270);
                        } else {
                            const lines = doc.splitTextToSize(textContent, 180);
                            let y = 15;
                            lines.forEach(line => {
                                if (y > 280) { doc.addPage(); y = 15; }
                                doc.text(line, 15, y);
                                y += 6;
                            });
                        }

                        const outBytes = doc.output('arraybuffer');
                        const pdfName = file.name.substring(0, file.name.lastIndexOf('.')) + '.pdf';
                        zip.file(pdfName, outBytes);
                    }

                    const blob = await zip.generateAsync({ type: 'blob' });
                    utils.downloadFile(blob, 'batch_converted_pdfs.zip', 'application/zip');
                    utils.showToast('Batch PDF compilation success!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast(err.message, 'error');
                } finally {
                    btn.disabled = false;
                }
            };
        }
    },

    // 28. File Hash Generator
    {
        id: 'adv-file-hash',
        name: 'File Hash Generator',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-fingerprint"></i>',
        description: 'Verify document integrity by generating MD5, SHA-256, or SHA-512 hashes.',
        tags: ['hash', 'sha256', 'md5', 'fingerprint', 'integrity', 'crypto'],
        render() {
            return `
                <div class="uploader-box" id="fhash-dropzone" style="height:100px;">
                    <i class="fa-solid fa-fingerprint uploader-icon" style="color:var(--accent-secondary);"></i>
                    <div class="uploader-text" id="fhash-text">Choose File for Hashing</div>
                    <input type="file" id="fhash-input" style="display:none;">
                </div>
                <div class="input-group" style="margin-top:10px;">
                    <label>Hashing Algorithm</label>
                    <select id="fhash-algo" class="form-select">
                        <option value="SHA256">SHA-256</option>
                        <option value="MD5">MD5</option>
                        <option value="SHA1">SHA-1</option>
                        <option value="SHA512">SHA-512</option>
                    </select>
                </div>
                <div class="output-container" id="fhash-result-box" style="display:none; margin-top:15px;">
                    <button class="copy-badge-btn" id="fhash-copy">Copy Hash</button>
                    <pre class="output-pre" id="fhash-output" style="word-break:break-all; font-family:monospace; font-size:12px; font-weight:700; color:var(--accent-secondary);"></pre>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('fhash-dropzone');
            const fileInput = document.getElementById('fhash-input');
            const textEl = document.getElementById('fhash-text');
            const algoSelect = document.getElementById('fhash-algo');
            const resultBox = document.getElementById('fhash-result-box');
            const output = document.getElementById('fhash-output');
            const copy = document.getElementById('fhash-copy');
            let arrayBuffer = null;

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    textEl.textContent = file.name;
                    const r = new FileReader();
                    r.onload = (evt) => {
                        arrayBuffer = evt.target.result;
                        generateHash();
                    };
                    r.readAsArrayBuffer(file);
                }
            };

            algoSelect.onchange = () => { if (arrayBuffer) generateHash(); };

            const generateHash = () => {
                if (!arrayBuffer) return;
                const CryptoJS = window.CryptoJS;
                if (!CryptoJS) {
                    utils.showToast('CryptoJS library not loaded!', 'error');
                    return;
                }

                const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
                const algo = algoSelect.value;
                let hash = '';

                if (algo === 'SHA256') hash = CryptoJS.SHA256(wordArray).toString();
                else if (algo === 'MD5') hash = CryptoJS.MD5(wordArray).toString();
                else if (algo === 'SHA1') hash = CryptoJS.SHA1(wordArray).toString();
                else if (algo === 'SHA512') hash = CryptoJS.SHA512(wordArray).toString();

                output.textContent = hash;
                resultBox.style.display = 'block';
                utils.showToast(`Hash calculated successfully!`);
                window.incrementStatsRun();
            };

            copy.onclick = () => utils.copyText(output.textContent);
        }
    },

    // 29. File Splitter
    {
        id: 'adv-file-splitter',
        name: 'Large File Splitter',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-arrows-split-up-and-left"></i>',
        description: 'Slice extremely large files into smaller partitioned chunks in a ZIP.',
        tags: ['split', 'slice', 'large file', 'divide', 'zip'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>File to Split</label>
                            <div class="uploader-box" id="fsplit-dropzone" style="height:90px;">
                                <i class="fa-solid fa-file uploader-icon" style="color:var(--accent-primary);"></i>
                                <div class="uploader-text" id="fsplit-text">Choose File</div>
                                <input type="file" id="fsplit-input" style="display:none;">
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:10px;">
                            <label>Chunk Size (MB)</label>
                            <input type="number" class="form-input" id="fsplit-size" value="5" min="1">
                        </div>
                        <button class="app-btn primary" id="fsplit-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-circle-nodes" style="margin-right:6px;"></i>Split & Download ZIP
                        </button>
                    </div>
                    <div>
                        <h3 style="font-size:13px; font-weight:700; color:var(--accent-secondary); margin-bottom:10px;">Split Status Report</h3>
                        <div class="output-container" id="fsplit-report" style="margin-top:0; min-height:180px; padding:15px; font-size:12px; line-height:1.6;">
                            <span style="color:var(--text-muted);">No file loaded</span>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('fsplit-dropzone');
            const fileInput = document.getElementById('fsplit-input');
            const textEl = document.getElementById('fsplit-text');
            const sizeInput = document.getElementById('fsplit-size');
            const btn = document.getElementById('fsplit-btn');
            const report = document.getElementById('fsplit-report');
            let file = null;

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                file = e.target.files[0];
                if (file) {
                    textEl.textContent = file.name;
                    updateReport();
                }
            };

            sizeInput.oninput = updateReport;

            function updateReport() {
                if (!file) return;
                const chunkSize = (parseInt(sizeInput.value) || 5) * 1024 * 1024;
                const count = Math.ceil(file.size / chunkSize);
                report.innerHTML = `
                    <div><strong>File Name:</strong> ${file.name}</div>
                    <div><strong>Total Size:</strong> ${utils.formatBytes(file.size)}</div>
                    <div><strong>Target Chunk Size:</strong> ${sizeInput.value} MB</div>
                    <div><strong>Estimated Chunks:</strong> ${count} partition files</div>
                `;
            }

            btn.onclick = async () => {
                if (!file) return;
                btn.disabled = true;

                try {
                    const chunkSize = (parseInt(sizeInput.value) || 5) * 1024 * 1024;
                    const zip = new JSZip();
                    let offset = 0;
                    let index = 1;

                    while (offset < file.size) {
                        const slice = file.slice(offset, offset + chunkSize);
                        zip.file(`${file.name}.part${index}`, slice);
                        offset += chunkSize;
                        index++;
                    }

                    const zipBlob = await zip.generateAsync({ type: 'blob' });
                    utils.downloadFile(zipBlob, `${file.name}_split.zip`, 'application/zip');
                    utils.showToast('Large file successfully split into ZIP archive!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast(err.message, 'error');
                } finally {
                    btn.disabled = false;
                }
            };
        }
    },

    // 30. Large File Joiner
    {
        id: 'adv-file-joiner',
        name: 'File Joiner',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-arrows-spin"></i>',
        description: 'Reassemble split partition files back into the original intact file.',
        tags: ['join', 'merge', 'chunks', 'parts', 'reassemble'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>Add Chunk Files (.part1, .part2...)</label>
                            <div class="uploader-box" id="fjoin-dropzone" style="height:90px;">
                                <i class="fa-solid fa-plus uploader-icon" style="color:var(--accent-secondary);"></i>
                                <div class="uploader-text">Upload Chunks</div>
                                <input type="file" id="fjoin-input" multiple style="display:none;">
                            </div>
                        </div>
                        <div class="input-group">
                            <label>Merged Output Name</label>
                            <input type="text" class="form-input" id="fjoin-name" value="reconstructed_file.bin">
                        </div>
                        <button class="app-btn primary" id="fjoin-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-compress" style="margin-right:6px;"></i>Join Files
                        </button>
                    </div>
                    <div>
                        <h3 style="font-size:13px; font-weight:700; color:var(--accent-secondary); margin-bottom:10px;">Chunks Registry List</h3>
                        <div id="fjoin-list" style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:10px; max-height:200px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
                            <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">No chunks loaded</div>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('fjoin-dropzone');
            const fileInput = document.getElementById('fjoin-input');
            const nameInput = document.getElementById('fjoin-name');
            const list = document.getElementById('fjoin-list');
            const btn = document.getElementById('fjoin-btn');
            let chunks = [];

            const renderChunks = () => {
                list.innerHTML = '';
                if (chunks.length === 0) {
                    list.innerHTML = `<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px;">No chunks loaded</div>`;
                    return;
                }

                // Sort chunks by name suffix
                chunks.sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));

                chunks.forEach(c => {
                    const row = document.createElement('div');
                    row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:rgba(255,255,255,0.03); border-radius:4px; font-size:12px;";
                    row.innerHTML = `<span>${c.name}</span><span>${utils.formatBytes(c.size)}</span>`;
                    list.appendChild(row);
                });

                // Guess original name
                if (chunks.length > 0) {
                    let first = chunks[0].name;
                    if (first.includes('.part')) {
                        nameInput.value = first.substring(0, first.lastIndexOf('.part'));
                    }
                }
            };

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                for (let f of e.target.files) chunks.push(f);
                renderChunks();
            };

            btn.onclick = async () => {
                if (chunks.length === 0) return;
                btn.disabled = true;

                try {
                    // re-sort
                    chunks.sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
                    
                    const blobs = [];
                    for (let chunk of chunks) {
                        blobs.push(chunk);
                    }

                    const joinedBlob = new Blob(blobs);
                    utils.downloadFile(joinedBlob, nameInput.value || 'joined_file.bin', joinedBlob.type);
                    utils.showToast('Files successfully joined!');
                    window.incrementStatsRun();
                } catch(err) {
                    utils.showToast(err.message, 'error');
                } finally {
                    btn.disabled = false;
                }
            };
        }
    },

    // 31. PDF Bates/Page Numberer
    {
        id: 'adv-pdf-bates',
        name: 'PDF Page Numberer',
        category: 'adv-file',
        icon: '<i class="fa-solid fa-list-ol"></i>',
        description: 'Stamp custom page numbering ranges (e.g. Bates stamps) onto PDF pages.',
        tags: ['pdf', 'bates', 'page number', 'stamp', 'paginate'],
        render() {
            return `
                <div class="tool-grid-2col">
                    <div>
                        <div class="input-group">
                            <label>PDF File</label>
                            <div class="uploader-box" id="pdfb-dropzone" style="height:90px;">
                                <i class="fa-solid fa-file-pdf uploader-icon" style="color:var(--accent-primary);"></i>
                                <div class="uploader-text" id="pdfb-text">Choose PDF File</div>
                                <input type="file" id="pdfb-input" accept="application/pdf" style="display:none;">
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
                            <div class="input-group">
                                <label>Stamping Format</label>
                                <input type="text" class="form-input" id="pdfb-format" value="Page {num} of {total}">
                            </div>
                            <div class="input-group">
                                <label>Starting Page</label>
                                <input type="number" class="form-input" id="pdfb-start" value="1">
                            </div>
                        </div>
                        <div class="input-group" style="margin-top:10px;">
                            <label>Number Placement</label>
                            <select id="pdfb-placement" class="form-select">
                                <option value="bottom-right">Bottom Right</option>
                                <option value="bottom-center">Bottom Center</option>
                                <option value="top-right">Top Right</option>
                            </select>
                        </div>
                        <button class="app-btn primary" id="pdfb-btn" style="width:100%; margin-top:15px; border-radius:20px;">
                            <i class="fa-solid fa-list-ol" style="margin-right:6px;"></i>Stamp Numbers & Save
                        </button>
                    </div>
                    <div>
                        <div class="input-group">
                            <label>Stamping Status logs</label>
                            <div class="output-container" style="margin-top:0;">
                                <pre class="output-pre" id="pdfb-log" style="min-height:220px; font-size:11px;">[Ready] Select PDF...</pre>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },
        init() {
            const dropzone = document.getElementById('pdfb-dropzone');
            const fileInput = document.getElementById('pdfb-input');
            const labelText = document.getElementById('pdfb-text');
            const formatInput = document.getElementById('pdfb-format');
            const startInput = document.getElementById('pdfb-start');
            const placeSelect = document.getElementById('pdfb-placement');
            const btn = document.getElementById('pdfb-btn');
            const logBox = document.getElementById('pdfb-log');
            let pdfFile = null;

            const updateLog = (msg, clear = false) => {
                const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
                if (clear) logBox.textContent = `[${time}] ${msg}`;
                else logBox.textContent += `\n[${time}] ${msg}`;
            };

            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                pdfFile = e.target.files[0];
                if (pdfFile) {
                    labelText.textContent = pdfFile.name;
                    updateLog(`Loaded file: ${pdfFile.name}`, true);
                }
            };

            btn.onclick = async () => {
                if (!pdfFile) {
                    utils.showToast('Please upload a PDF first!', 'error');
                    return;
                }
                btn.disabled = true;
                updateLog('Stamping page numbering...');

                try {
                    const bytes = await pdfFile.arrayBuffer();
                    const pdfDoc = await PDFLib.PDFDocument.load(bytes);
                    const pages = pdfDoc.getPages();
                    const total = pages.length;
                    const format = formatInput.value || 'Page {num}';
                    const startNum = parseInt(startInput.value) || 1;
                    const placement = placeSelect.value;

                    const standardFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

                    pages.forEach((page, idx) => {
                        const { width, height } = page.getSize();
                        const pageNum = startNum + idx;
                        const label = format.replace('{num}', pageNum).replace('{total}', total);

                        let x = width - 80;
                        let y = 30;

                        if (placement === 'bottom-center') {
                            x = width / 2 - (label.length * 3);
                            y = 30;
                        } else if (placement === 'top-right') {
                            x = width - 80;
                            y = height - 30;
                        }

                        page.drawText(label, {
                            x: x,
                            y: y,
                            size: 10,
                            font: standardFont,
                            color: PDFLib.rgb(0.4, 0.4, 0.4)
                        });
                        updateLog(`Stamped: ${label}`);
                    });

                    const outBytes = await pdfDoc.save();
                    utils.downloadFile(outBytes, `numbered_${pdfFile.name}`, 'application/pdf');
                    updateLog('PDF successfully page numbered!');
                    window.incrementStatsRun();
                } catch(err) {
                    updateLog(`Failed: ${err.message}`);
                } finally {
                    btn.disabled = false;
                }
            };
        }
    }
];

// Append to global registry
if (typeof TOOLS !== 'undefined') {
    TOOLS.push(...ADV_FILE_TOOLS);
}
