


document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const imageUpload = document.getElementById('image-upload');
    const fileInfo = document.querySelector('.file-info');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const pagesContainer = document.getElementById('pages-container');
    const generatePdfBtn = document.getElementById('generate-pdf');
    const addPageBtn = document.getElementById('add-page');
    const pageSizeSelect = document.getElementById('page-size');
    const themeSwitch = document.getElementById('theme-switch');
    
    // Store page data
    const pages = [];
    let currentPageId = 0;
    
    // Theme toggle functionality
    themeSwitch.addEventListener('change', function(e) {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });
    
    // Check for saved theme preference or respect OS preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeSwitch.checked = true;
    }
    
    // Handle file selection
    imageUpload.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        
        if (files.length === 0) {
            fileInfo.textContent = 'No files selected';
            return;
        }
        
        fileInfo.textContent = `${files.length} file(s) selected`;
        imagePreviewContainer.classList.remove('hidden');
        
        // Clear existing pages
        pagesContainer.innerHTML = '';
        pages.length = 0;
        
        // Process each file
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    addImagePage(event.target.result, file.name);
                };
                
                reader.readAsDataURL(file);
            }
        });
    });
    
    // Add a blank page
    addPageBtn.addEventListener('click', function() {
        addBlankPage();
    });
    
    // Generate PDF
    generatePdfBtn.addEventListener('click', function() {
        if (pages.length === 0) {
            showNotification('Please add at least one page to generate a PDF.', 'warning');
            return;
        }
        
        // Show loading state
        generatePdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        generatePdfBtn.disabled = true;
        
        // Use setTimeout to allow the UI to update before the potentially heavy PDF generation
        setTimeout(() => {
            generatePDF();
            // Reset button state
            generatePdfBtn.innerHTML = '<i class="fas fa-file-download"></i> Generate PDF';
            generatePdfBtn.disabled = false;
        }, 100);
    });
    
    // Add image as a page
    function addImagePage(imageData, filename) {
        const pageId = currentPageId++;
        
        // Create page data object
        const pageData = {
            id: pageId,
            type: 'image',
            content: imageData,
            rotation: 0,
            filename: filename
        };
        
        pages.push(pageData);
        renderPage(pageData);
    }
    
    // Add a blank page
    function addBlankPage() {
        const pageId = currentPageId++;
        
        // Create page data object
        const pageData = {
            id: pageId,
            type: 'blank',
            content: null,
            rotation: 0,
            filename: 'Blank Page'
        };
        
        pages.push(pageData);
        renderPage(pageData);
        showNotification('Blank page added', 'success');
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Add icon based on type
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        if (type === 'error') icon = 'times-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <p>${message}</p>
        `;
        
        // Add to the DOM
        document.body.appendChild(notification);
        
        // Show with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Render a page in the UI
    function renderPage(pageData) {
        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'page-wrapper';
        pageWrapper.dataset.pageId = pageData.id;
        
        const pageContainer = document.createElement('div');
        pageContainer.className = 'page-container';
        
        // Add content based on page type
        if (pageData.type === 'image') {
            const img = document.createElement('img');
            img.src = pageData.content;
            img.style.transform = `rotate(${pageData.rotation}deg)`;
            pageContainer.appendChild(img);
        } else {
            pageContainer.style.backgroundColor = '#f8f8f8';
            const blankText = document.createElement('p');
            blankText.textContent = 'Blank Page';
            blankText.style.color = '#aaa';
            pageContainer.appendChild(blankText);
        }
        
        // Page controls
        const pageControls = document.createElement('div');
        pageControls.className = 'page-controls';
        
        const pageNumber = document.createElement('div');
        pageNumber.className = 'page-number';
        pageNumber.textContent = `Page ${pages.indexOf(pageData) + 1}`;
        
        const pageActions = document.createElement('div');
        pageActions.className = 'page-actions';
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = "Delete page";
        deleteBtn.addEventListener('click', function() {
            deletePage(pageData.id);
        });
        
        // Rotate button (only for images)
        const rotateBtn = document.createElement('button');
        rotateBtn.className = 'rotate-btn';
        rotateBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        rotateBtn.title = "Rotate page";
        rotateBtn.addEventListener('click', function() {
            rotatePage(pageData.id);
        });
        
        // Edit button (replace with new image)
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '<i class="fas fa-exchange-alt"></i>';
        editBtn.title = "Replace page";
        editBtn.addEventListener('click', function() {
            replacePage(pageData.id);
        });
        
        pageActions.appendChild(editBtn);
        pageActions.appendChild(rotateBtn);
        pageActions.appendChild(deleteBtn);
        
        pageControls.appendChild(pageNumber);
        pageControls.appendChild(pageActions);
        
        pageWrapper.appendChild(pageContainer);
        pageWrapper.appendChild(pageControls);
        
        pagesContainer.appendChild(pageWrapper);
        
        // Make pages draggable for reordering
        makePagesDraggable();
    }
    
    // Make pages draggable for reordering
    function makePagesDraggable() {
        const pageElements = document.querySelectorAll('.page-wrapper');
        
        pageElements.forEach(page => {
            page.draggable = true;
            
            page.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/plain', page.dataset.pageId);
                page.classList.add('dragging');
            });
            
            page.addEventListener('dragend', function() {
                page.classList.remove('dragging');
            });
            
            page.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('drag-over');
            });
            
            page.addEventListener('dragleave', function() {
                this.classList.remove('drag-over');
            });
            
            page.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('drag-over');
                const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
                const targetId = parseInt(page.dataset.pageId);
                
                if (draggedId !== targetId) {
                    reorderPages(draggedId, targetId);
                    showNotification('Page order updated', 'success');
                }
            });
        });
    }
    
    // Reorder pages
    function reorderPages(draggedId, targetId) {
        const draggedIndex = pages.findIndex(page => page.id === draggedId);
        const targetIndex = pages.findIndex(page => page.id === targetId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            // Reorder the pages array
            const [draggedPage] = pages.splice(draggedIndex, 1);
            pages.splice(targetIndex, 0, draggedPage);
            
            // Re-render all pages
            refreshPageDisplay();
        }
    }
    
    // Delete a page
    function deletePage(pageId) {
        const pageIndex = pages.findIndex(page => page.id === pageId);
        
        if (pageIndex !== -1) {
            // Get page info for notification
            const pageType = pages[pageIndex].type;
            const pageNum = pageIndex + 1;
            
            // Remove the page
            pages.splice(pageIndex, 1);
            refreshPageDisplay();
            
            showNotification(`${pageType === 'blank' ? 'Blank page' : 'Image'} (page ${pageNum}) deleted`, 'success');
        }
    }
    
    // Rotate a page
    function rotatePage(pageId) {
        const page = pages.find(page => page.id === pageId);
        
        if (page) {
            page.rotation = (page.rotation + 90) % 360;
            
            // Update rotation in the UI
            const pageElement = document.querySelector(`.page-wrapper[data-page-id="${pageId}"] img`);
            if (pageElement) {
                pageElement.style.transform = `rotate(${page.rotation}deg)`;
                showNotification(`Page rotated to ${page.rotation}°`, 'success');
            }
        }
    }
    
    // Replace page content
    function replacePage(pageId) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    
                    reader.onload = function(event) {
                        const page = pages.find(page => page.id === pageId);
                        
                        if (page) {
                            const previousType = page.type;
                            
                            page.type = 'image';
                            page.content = event.target.result;
                            page.filename = file.name;
                            page.rotation = 0;
                            
                            // Update the page in the UI
                            const pageWrapper = document.querySelector(`.page-wrapper[data-page-id="${pageId}"]`);
                            if (pageWrapper) {
                                const pageContainer = pageWrapper.querySelector('.page-container');
                                pageContainer.innerHTML = '';
                                
                                const img = document.createElement('img');
                                img.src = page.content;
                                pageContainer.appendChild(img);
                                
                                showNotification(`${previousType === 'blank' ? 'Blank page' : 'Image'} replaced with ${file.name}`, 'success');
                            }
                        }
                    };
                    
                    reader.readAsDataURL(file);
                }
            }
        });
        
        fileInput.click();
    }
    
    // Refresh the display of all pages
    function refreshPageDisplay() {
        pagesContainer.innerHTML = '';
        
        pages.forEach(page => {
            renderPage(page);
        });
    }
    
    // Generate PDF
    function generatePDF() {
        const { jsPDF } = window.jspdf;
        const pageSize = pageSizeSelect.value;
        let pageWidth, pageHeight;
        
        // Set page dimensions based on selected size
        if (pageSize === 'a4') {
            pageWidth = 210;
            pageHeight = 297;
        }  else if (pageSize === 'letter') {
            pageWidth = 216;
            pageHeight = 279;
        } else if (pageSize === 'legal') {
            pageWidth = 216;
            pageHeight = 356;
        }

        // Create new PDF document
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: pageSize
        });
        
        let currentPage = 0;
        
        // Process each page
        const processNextPage = function() {
            if (currentPage < pages.length) {
                const page = pages[currentPage];
                
                if (page.type === 'image') {
                    // Add a new page if not the first page
                    if (currentPage > 0) {
                        pdf.addPage();
                    }
                    
                    // Load the image
                    const img = new Image();
                    img.src = page.content;
                    
                    img.onload = function() {
                        // Calculate aspect ratio and dimensions
                        const imgWidth = img.width;
                        const imgHeight = img.height;
                        const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
                        
                        // Calculate centered position
                        const x = (pageWidth - imgWidth * ratio) / 2;
                        const y = (pageHeight - imgHeight * ratio) / 2;
                        
                        // Handle rotation
                        if (page.rotation !== 0) {
                            // Save the current state
                            pdf.saveGraphicsState();
                            
                            // Translate to the center of the page
                            pdf.translate(pageWidth / 2, pageHeight / 2);
                            
                            // Rotate
                            pdf.rotate(page.rotation);
                            
                            // Add the image (centered at origin after translation)
                            pdf.addImage(
                                page.content,
                                'JPEG',
                                -imgWidth * ratio / 2,
                                -imgHeight * ratio / 2,
                                imgWidth * ratio,
                                imgHeight * ratio
                            );
                            
                            // Restore the saved state
                            pdf.restoreGraphicsState();
                        } else {
                            // Add the image without rotation
                            pdf.addImage(
                                page.content,
                                'JPEG',
                                x,
                                y,
                                imgWidth * ratio,
                                imgHeight * ratio
                            );
                        }
                        
                        currentPage++;
                        processNextPage();
                    };
                } else if (page.type === 'blank') {
                    // Add a blank page
                    if (currentPage > 0) {
                        pdf.addPage();
                    }
                    
                    currentPage++;
                    processNextPage();
                }
            } else {
                // All pages processed, save the PDF
                pdf.save('combined_document.pdf');
                showNotification('PDF generated successfully!', 'success');
            }
        };
        
        // Start processing pages
        processNextPage();
    }
});