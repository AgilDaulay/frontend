document.addEventListener('DOMContentLoaded', () => {
    // --- State & Konfigurasi ---
    const API_URL = 'http://localhost:5000/api/inventory';
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    let inventory = [];

    // --- Cek Autentikasi ---
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // --- Seleksi Elemen DOM ---
    const welcomeMessage = document.getElementById('welcome-message');
    const btnLogout = document.getElementById('btn-logout');
    const btnTambah = document.getElementById('btn-tambah');
    const tableBody = document.getElementById('inventory-table-body');
    // ... (Seleksi elemen lain seperti modal, form, search, dll)

    // --- Inisialisasi Halaman ---
    welcomeMessage.textContent = `Selamat datang, ${user.username} (${user.role})`;
    if (user.role === 'admin') {
        btnTambah.style.display = 'inline-block';
    }
    
    // --- Fungsi API ---
    const fetchAPI = async (endpoint = '', method = 'GET', body = null) => {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(`${API_URL}/${endpoint}`, options);
        if (response.status === 401) { // Token expired atau tidak valid
             localStorage.clear();
             window.location.href = 'login.html';
        }
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Terjadi kesalahan pada server');
        }
        return response.json();
    };

    const fetchAndRenderInventory = async () => {
        try {
            inventory = await fetchAPI();
            renderTable(inventory);
        } catch (error) {
            console.error(error);
            tableBody.innerHTML = `<tr><td colspan="8" class="error-message">${error.message}</td></tr>`;
        }
    };
    
    // --- Fungsi Render & DOM ---
    const renderTable = (data) => {
        tableBody.innerHTML = '';
        // ... (Logika render tabel sama seperti sebelumnya) ...
        // Perbedaannya: Tampilkan tombol Aksi berdasarkan role
        data.forEach((item, index) => {
            const aksiButtons = user.role === 'admin' ? `
                <button class="btn-aksi btn-edit" data-id="${item.id}">Ubah</button>
                <button class="btn-aksi btn-hapus" data-id="${item.id}">Hapus</button>
            ` : 'Tidak ada akses';

            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.nama}</td>
                    <td>${aksiButtons}</td>
                </tr>`;
            tableBody.innerHTML += row;
        });
        // ... updateDashboard() ...
    };
    
    // --- Event Listeners ---
    btnLogout.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // Event listener untuk form submit (tambah/edit)
    // Harus diubah untuk memanggil fetchAPI dengan method POST atau PUT
    // ... (Contoh untuk tambah)
    // await fetchAPI('', 'POST', newItemData);
    // fetchAndRenderInventory();
    
    // Event listener untuk hapus
    // await fetchAPI(id, 'DELETE');
    // fetchAndRenderInventory();

    // ... (Semua event listener lain diadaptasi untuk memanggil fungsi API) ...

    // --- Panggilan Awal ---
    fetchAndRenderInventory();
});