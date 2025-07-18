document.addEventListener('DOMContentLoaded', () => {
    const supabaseUrl = 'https://lholzspyazziknxqopmi.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxob2x6c3B5YXp6aWtueHFvcG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjc0MTAsImV4cCI6MjA1NzYwMzQxMH0.uku06OF-WapBhuV-A_rJBXu3x24CKKkSTM0SnmPIOOE';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // DOM Elements
    const modal = document.getElementById('user-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const userForm = document.getElementById('user-form');
    const userIdInput = document.getElementById('user-id');
    const userNameInput = document.getElementById('user-name');
    const userEmailInput = document.getElementById('user-email');
    const userRoleSelect = document.getElementById('user-role');
    const usersTableBody = document.querySelector('#users-table tbody');
    const loadingMessage = document.getElementById('loading-message');

    let currentUserId = null;

    // Check if the logged-in user is an admin
    async function checkAdminRole() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }
        currentUserId = user.id; // Store current user's ID

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

    // Fetch and display all users
    async function fetchUsers() {
        loadingMessage.textContent = 'در حال بارگذاری کاربران...';
        usersTableBody.innerHTML = '';

        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            loadingMessage.textContent = 'خطا در بارگذاری کاربران.';
            console.error('Error fetching users:', error);
            return;
        }

        if (users.length === 0) {
            loadingMessage.textContent = 'هیچ کاربری یافت نشد.';
        } else {
            loadingMessage.style.display = 'none';
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.name || 'نامشخص'}</td>
                    <td>${user.username || 'نامشخص'}</td>
                    <td>${user.email}</td>
                    <td>${user.role || 'تعیین نشده'}</td>
                    <td class="actions-cell">
                        <button class="btn-icon btn-edit" data-user='${JSON.stringify(user)}' title="ویرایش"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon btn-delete" data-id="${user.id}" title="حذف"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                usersTableBody.appendChild(row);
            });
        }
    }

    // Show modal for editing a user
    function showModal(user) {
        userIdInput.value = user.id;
        userNameInput.value = user.name;
        userEmailInput.value = user.email;
        userRoleSelect.value = user.role || 'student'; // Default to student if no role
        modal.classList.add('is-open');
    }

    // Hide modal
    function hideModal() {
        modal.classList.remove('is-open');
    }

    // Handle form submission for updating a user
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = userIdInput.value;
        const name = userNameInput.value.trim();
        const role = userRoleSelect.value;

        if (!id || !name) {
            alert('لطفاً نام کاربر را وارد کنید.');
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ name, role })
            .eq('id', id);

        if (error) {
            console.error('Error updating user:', error);
            alert('خطا در به‌روزرسانی کاربر.');
        } else {
            hideModal();
            fetchUsers(); // Refresh the user list
        }
    });

    // Handle clicks on edit and delete buttons
    usersTableBody.addEventListener('click', async (e) => {
        const editButton = e.target.closest('.btn-edit');
        const deleteButton = e.target.closest('.btn-delete');

        if (editButton) {
            const user = JSON.parse(editButton.dataset.user);
            showModal(user);
        }

        if (deleteButton) {
            const id = deleteButton.dataset.id;
            
            if (id === currentUserId) {
                alert('شما نمی‌توانید حساب کاربری خودتان را حذف کنید.');
                return;
            }

            if (confirm('آیا از حذف این کاربر مطمئن هستید؟ این عمل غیرقابل بازگشت است.')) {
                // This only deletes the profile, not the auth user, for security reasons.
                const { error } = await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', id);

                if (error) {
                    console.error('Error deleting user profile:', error);
                    alert('خطا در حذف پروفایل کاربر.');
                } else {
                    alert('پروفایل کاربر با موفقیت حذف شد.');
                    fetchUsers();
                }
            }
        }
    });

    // Event Listeners for modal
    cancelBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // Initial Load
    checkAdminRole().then(() => {
        fetchUsers();
    });
});
