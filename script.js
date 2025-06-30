document.addEventListener('DOMContentLoaded', () => {

    // --- STATE & KONFIGURASI ---
    const API_URL = 'https://simpera-new.onrender.com/api/inventory'; // Ganti ini saat deploy!
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    let inventory = []; // Data akan diisi dari API
    let currentFilter = ''; // Untuk menyimpan teks pencarian

    // --- SELEKSI ELEMEN DOM ---
    const welcomeMessage = document.getElementById('welcome-message');
    const btnLogout = document.getElementById('btn-logout');
    const btnTambah = document.getElementById('btn-tambah');
    const btnUnduhExcel = document.getElementById('btn-unduh-excel');
    const tableBody = document.getElementById('inventory-table-body');
    const searchInput = document.getElementById('search-input');
    
    // Elemen Modal & Form
    const itemModal = document.getElementById('item-modal');
    const closeModalButton = document.querySelector('.close-button');
    const itemForm = document.getElementById('item-form');
    const modalTitle = document.getElementById('modal-title');
    const hiddenItemId = document.getElementById('item-id');
    
    // Elemen Dashboard
    const totalItemsEl = document.getElementById('total-items');
    const statusBaikEl = document.getElementById('status-baik');
    const statusPerbaikanEl = document.getElementById('status-perbaikan');
    const statusRusakEl = document.getElementById('status-rusak');


    // --- PENGECEKAN LOGIN & INISIALISASI ---
    if (!token || !user) {
        // Jika tidak ada token atau data user, paksa kembali ke halaman login
        window.location.href = 'login.html';
        return; // Hentikan eksekusi skrip selanjutnya
    }

    // Tampilkan pesan selamat datang dan tombol sesuai role
    welcomeMessage.textContent = `Selamat datang, ${user.username} (${user.role})`;
    if (user.role === 'admin') {
        btnTambah.style.display = 'inline-block';
    }

    // --- FUNGSI-FUNGSI UTAMA ---

    // Fungsi pembantu untuk berkomunikasi dengan API
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

        try {
            const response = await fetch(`${API_URL}/${endpoint}`, options);
            if (response.status === 401) { // Jika token tidak valid/expired
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.msg || 'Terjadi kesalahan pada server');
            }
            return data;
        } catch (error) {
            alert(error.message);
        }
    };

    // Fungsi untuk mengambil data dari backend dan merender tabel
    const fetchAndRenderInventory = async () => {
        try {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Memuat data...</td></tr>';
            inventory = await fetchAPI();
            renderTable();
        } catch (error) {
            console.error(error);
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Gagal memuat data.</td></tr>`;
        }
    };

    // Fungsi untuk merender data ke dalam tabel
    const renderTable = () => {
        const filteredData = inventory.filter(item => 
            item.nama.toLowerCase().includes(currentFilter) ||
            item.kode.toLowerCase().includes(currentFilter) ||
            item.lokasi.toLowerCase().includes(currentFilter)
        );

        tableBody.innerHTML = '';
        if (filteredData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Data tidak ditemukan.</td></tr>';
        } else {
            filteredData.forEach((item, index) => {
                const aksiButtons = user.role === 'admin' ? `
                    <button class="btn-aksi btn-edit" data-id="${item.id}">Ubah</button>
                    <button class="btn-aksi btn-hapus" data-id="${item.id}">Hapus</button>
                ` : 'Tidak ada akses';

                const row = `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.nama}</td>
                        <td>${item.kategori}</td>
                        <td>${item.kode}</td>
                        <td>${new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                        <td>${item.lokasi}</td>
                        <td><span class="status status-${item.status.replace(/\s+/g, '')}">${item.status}</span></td>
                        <td>${aksiButtons}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        }
        updateDashboard();
    };

    // Fungsi untuk memperbarui kartu dashboard
    const updateDashboard = () => {
        totalItemsEl.textContent = inventory.length;
        statusBaikEl.textContent = inventory.filter(item => item.status === 'Baik').length;
        statusPerbaikanEl.textContent = inventory.filter(item => item.status === 'Perbaikan').length;
        statusRusakEl.textContent = inventory.filter(item => item.status === 'Rusak').length;
    };
    
    // --- FUNGSI MODAL & FORM ---
    const openModal = () => itemModal.style.display = 'flex';
    const closeModal = () => itemModal.style.display = 'none';

    const resetForm = () => {
        itemForm.reset();
        hiddenItemId.value = '';
        modalTitle.textContent = 'Tambah Peralatan Baru';
    };

    const populateForm = (item) => {
        hiddenItemId.value = item.id;
        document.getElementById('nama').value = item.nama;
        document.getElementById('kategori').value = item.kategori;
        document.getElementById('kode').value = item.kode;
        // Format tanggal untuk input type="date" adalah YYYY-MM-DD
        document.getElementById('tanggal').value = new Date(item.tanggal).toISOString().split('T')[0];
        document.getElementById('lokasi').value = item.lokasi;
        document.getElementById('status').value = item.status;
        document.getElementById('catatan').value = item.catatan;
        modalTitle.textContent = 'Ubah Data Peralatan';
    };

    // --- EVENT LISTENERS ---

    // Tombol Logout
    btnLogout.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // Tombol Tambah Peralatan
    btnTambah.addEventListener('click', () => {
        resetForm();
        openModal();
    });

    // Tombol Close di Modal
    closeModalButton.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === itemModal) closeModal();
    });

    // Submit Form (untuk Tambah atau Edit)
    itemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = hiddenItemId.value;
        const itemData = {
            nama: document.getElementById('nama').value,
            kategori: document.getElementById('kategori').value,
            kode: document.getElementById('kode').value,
            tanggal: document.getElementById('tanggal').value,
            lokasi: document.getElementById('lokasi').value,
            status: document.getElementById('status').value,
            catatan: document.getElementById('catatan').value,
        };

        try {
            if (id) { // Mode Edit
                await fetchAPI(id, 'PUT', itemData);
            } else { // Mode Tambah
                await fetchAPI('', 'POST', itemData);
            }
            closeModal();
            fetchAndRenderInventory(); // Muat ulang data dari server
        } catch (error) {
            console.error('Gagal menyimpan data:', error);
        }
    });

    // Klik pada tombol Ubah atau Hapus di tabel
    tableBody.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.getAttribute('data-id');

        if (!id) return;

        if (target.classList.contains('btn-edit')) {
            const itemToEdit = inventory.find(item => item.id == id);
            if (itemToEdit) {
                populateForm(itemToEdit);
                openModal();
            }
        }

        if (target.classList.contains('btn-hapus')) {
            if (confirm('Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.')) {
                fetchAPI(id, 'DELETE').then(() => {
                    fetchAndRenderInventory();
                });
            }
        }
    });
    
    // Pencarian
    searchInput.addEventListener('input', () => {
        currentFilter = searchInput.value.toLowerCase();
        renderTable();
    });

    // Unduh Excel
    btnUnduhExcel.addEventListener('click', () => {
        if (typeof XLSX === 'undefined') {
            alert('Gagal memuat library unduh Excel. Coba refresh halaman.');
            return;
        }
        const dataToExport = inventory.map(item => ({
            "Nama Peralatan": item.nama,
            "Kategori": item.kategori,
            "Kode Inventaris": item.kode,
            "Tanggal Pengadaan": new Date(item.tanggal).toLocaleDateString('id-ID'),
            "Lokasi": item.lokasi,
            "Status": item.status,
            "Catatan": item.catatan
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data Inventaris");
        worksheet["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 40 }];
        XLSX.writeFile(workbook, "Laporan_Inventaris_Diskominfo.xlsx");
    });


    // --- PANGGILAN AWAL ---
    fetchAndRenderInventory();

});