document.addEventListener('DOMContentLoaded', () => {
    const supabaseUrl = 'https://lholzspyazziknxqopmi.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxob2x6c3B5YXp6aWtueHFvcG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjc0MTAsImV4cCI6MjA1NzYwMzQxMH0.uku06OF-WapBhuV-A_rJBXu3x24CKKkSTM0SnmPIOOE';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // DOM Elements
    const addSubjectBtn = document.getElementById('add-subject-btn');
    const modal = document.getElementById('subject-modal');
    const modalTitle = document.getElementById('modal-title');
    const cancelBtn = document.getElementById('cancel-btn');
    const subjectForm = document.getElementById('subject-form');
    const subjectIdInput = document.getElementById('subject-id');
    const subjectNameInput = document.getElementById('subject-name');
    const subjectsTableBody = document.querySelector('#subjects-table tbody');
    const loadingMessage = document.getElementById('loading-message');

    // Check user role
    async function checkAdminRole() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (error || profile.role !== 'admin') {
            alert('شما دسترسی لازم برای مشاهده این صفحه را ندارید.');
            window.location.href = '/home.html';
        }
    }

    // Fetch and display subjects
    async function fetchSubjects() {
        loadingMessage.textContent = 'در حال بارگذاری درس‌ها...';
        subjectsTableBody.innerHTML = '';

        const { data: subjects, error } = await supabase
            .from('subjects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            loadingMessage.textContent = 'خطا در بارگذاری درس‌ها.';
            console.error('Error fetching subjects:', error);
            return;
        }

        if (subjects.length === 0) {
            loadingMessage.textContent = 'هیچ درسی یافت نشد.';
        } else {
            loadingMessage.style.display = 'none';
            subjects.forEach(subject => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${subject.name}</td>
                    <td>${new Date(subject.created_at).toLocaleDateString('fa-IR')}</td>
                    <td class="actions-cell">
                        <button class="btn-icon btn-edit" data-id="${subject.id}" data-name="${subject.name}" title="ویرایش"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon btn-delete" data-id="${subject.id}" title="حذف"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                subjectsTableBody.appendChild(row);
            });
        }
    }

    // Show modal for adding or editing
    function showModal(subject = null) {
        if (subject) {
            modalTitle.textContent = 'ویرایش درس';
            subjectIdInput.value = subject.id;
            subjectNameInput.value = subject.name;
        } else {
            modalTitle.textContent = 'افزودن درس جدید';
            subjectForm.reset();
            subjectIdInput.value = '';
        }
        modal.classList.add('is-open');
    }

    // Hide modal
    function hideModal() {
        modal.classList.remove('is-open');
    }

    // Handle form submission
    subjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = subjectNameInput.value.trim();
        const id = subjectIdInput.value;

        if (!name) {
            alert('لطفاً نام درس را وارد کنید.');
            return;
        }

        let error;
        if (id) {
            // Update existing subject
            const { error: updateError } = await supabase
                .from('subjects')
                .update({ name: name })
                .eq('id', id);
            error = updateError;
        } else {
            // Insert new subject
            const { error: insertError } = await supabase
                .from('subjects')
                .insert([{ name: name }]);
            error = insertError;
        }

        if (error) {
            console.error('Error saving subject:', error);
            alert('خطا در ذخیره درس.');
        } else {
            hideModal();
            fetchSubjects();
        }
    });

    // Handle clicks on edit and delete buttons
    subjectsTableBody.addEventListener('click', async (e) => {
        const editButton = e.target.closest('.btn-edit');
        const deleteButton = e.target.closest('.btn-delete');

        if (editButton) {
            const subject = {
                id: editButton.dataset.id,
                name: editButton.dataset.name
            };
            showModal(subject);
        }

        if (deleteButton) {
            const id = deleteButton.dataset.id;
            if (confirm('آیا از حذف این درس مطمئن هستید؟')) {
                const { error } = await supabase
                    .from('subjects')
                    .delete()
                    .eq('id', id);

                if (error) {
                    console.error('Error deleting subject:', error);
                    alert('خطا در حذف درس.');
                } else {
                    fetchSubjects();
                }
            }
        }
    });

    // Event Listeners
    addSubjectBtn.addEventListener('click', () => showModal());
    cancelBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // Initial Load
    checkAdminRole().then(() => {
        fetchSubjects();
    });
});
