// Task Notes Manager
document.addEventListener('DOMContentLoaded', function() {
    // Check for notes toggle buttons
    const noteToggles = document.querySelectorAll('.notes-toggle');
    if (noteToggles.length === 0) return;
    
    // Add event listeners to all note toggle buttons
    noteToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const taskId = this.dataset.id;
            const notesContainer = document.getElementById(`notes-${taskId}`);
            
            // Toggle visibility
            if (notesContainer.classList.contains('hidden')) {
                // Close any other open notes first
                document.querySelectorAll('.notes-content:not(.hidden)').forEach(el => {
                    el.classList.add('hidden');
                    const toggleBtn = document.querySelector(`.notes-toggle[data-id="${el.dataset.taskId}"]`);
                    if (toggleBtn) {
                        toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
                    }
                });
                
                // Open this note
                notesContainer.classList.remove('hidden');
                this.innerHTML = '<i class="fas fa-chevron-up"></i>';
                
                // Add animation
                notesContainer.classList.add('animate-fade-in');
                setTimeout(() => {
                    notesContainer.classList.remove('animate-fade-in');
                }, 300);
            } else {
                // Close this note
                notesContainer.classList.add('hidden');
                this.innerHTML = '<i class="fas fa-chevron-down"></i>';
            }
        });
    });
    
    // Format notes with markdown-like syntax
    const formatNotes = (text) => {
        if (!text) return '';
        
        // Replace URLs with clickable links
        text = text.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<a href="$1" target="_blank" class="text-primary-500 hover:underline">$1</a>'
        );
        
        // Bold text
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic text
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Lists
        text = text.replace(/^- (.*?)$/gm, '<li>$1</li>');
        text = text.replace(/(<li>.*?<\/li>)+/g, '<ul class="list-disc pl-5 my-2">$&</ul>');
        
        // Line breaks
        text = text.replace(/\n/g, '<br>');
        
        return text;
    };
    
    // Format all notes on page load
    document.querySelectorAll('.notes-content').forEach(container => {
        const rawText = container.dataset.notes;
        if (rawText) {
            container.innerHTML = formatNotes(rawText);
        }
    });
});