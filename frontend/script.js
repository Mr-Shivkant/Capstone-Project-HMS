// Protect pages
const protectedPages = [
    "dashboard.html",
    "availability.html",
    "rooms.html",
    "checkinout.html",
    "staff.html",
    "reports.html",
    "report-view.html"
];
const currentPage = window.location.pathname.split("/").pop();
if (protectedPages.includes(currentPage)) {
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin !== "true") {
        window.location.replace("login.html");
    }
}

const API_BASE = window.API_BASE || "http://localhost:5000/api";
let rooms = [];
let selectedRoom = null;
let pageMessageTimeout = null;

function showPageMessage(message, type = "success") {
    const el = document.getElementById("pageMessage");
    if (!el) return;

    el.textContent = message;
    el.className = `page-message message-${type}`;
    el.style.display = "block";

    window.clearTimeout(pageMessageTimeout);
    pageMessageTimeout = window.setTimeout(() => {
        el.style.display = "none";
    }, 5000);
}

async function login(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        console.log("Logging in with API_BASE:", API_BASE);
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        console.log("Response status:", res.status);
        const data = await res.json();
        console.log("Response data:", data);

        if (data.success) {
            localStorage.setItem("isAdmin", "true");
            window.location.href = "dashboard.html";
        } else {
            alert(data.message || "Login failed");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Login error: " + error.message + "\n\nAPI_BASE: " + API_BASE + "\n\nCheck the browser console (F12) for details.");
    }
}

function togglePassword() {
    const passwordField = document.getElementById("password");
    if (!passwordField) return;

    passwordField.type = passwordField.type === "password" ? "text" : "password";
}

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const closeBtn = document.getElementById("closeBtn");

if (menuToggle && sidebar) {
    menuToggle.onclick = () => sidebar.classList.add("active");
}

if (closeBtn && sidebar) {
    closeBtn.onclick = () => sidebar.classList.remove("active");
}

function go(page) {
    window.location.href = page;
}

function logout() {
    localStorage.removeItem("isAdmin");
    window.location.href = "login.html";
}

async function fetchJson(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        mode: "cors",
        cache: "no-store",
        ...options
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json.message || `Request failed: ${res.status}`);
    }
    return json;
}

async function checkBackend() {
    try {
        await fetch(`${API_BASE}/rooms`, { method: "GET", mode: "cors", cache: "no-store" });
        return true;
    } catch (error) {
        console.error("Backend unreachable:", error);
        const roomList = document.getElementById("roomList");
        if (roomList) {
            roomList.innerHTML = `<div class="empty-state"><h3>Backend unavailable</h3><p>Please start the backend server at http://localhost:5000 and refresh the page.</p></div>`;
        }
        alert("Cannot reach backend. Start the backend server on port 5000 and reload the page.");
        return false;
    }
}

async function loadRooms() {
    rooms = await fetchJson("/rooms");
    const type = document.getElementById("filterType")?.value || document.getElementById("type")?.value || "";
    const seater = document.getElementById("filterSeater")?.value || document.getElementById("seater")?.value || "";
    const status = document.getElementById("filterStatus")?.value || document.getElementById("status")?.value || "";
    const roomNo = document.getElementById("filterRoomNo")?.value || "";

    const filtered = rooms.filter(room => {
        const matchesType = !type || room.type === type;
        const matchesSeater = !seater || room.seater === Number(seater);
        
        // On availability page, only show available rooms
        const isAvailabilityPage = window.location.pathname.includes("availability.html");
        const matchesStatus = isAvailabilityPage 
            ? room.status === "available"
            : !status || room.status === status;
        
        const matchesRoomNo = !roomNo || room.number.toString().includes(roomNo);
        return matchesType && matchesSeater && matchesStatus && matchesRoomNo;
    });

    renderRoomCards(filtered);

    if (selectedRoom) {
        selectedRoom = rooms.find(room => room._id === selectedRoom._id) || null;
    }
    showRoomDetail(selectedRoom);
}

function filterRooms() {
    loadRooms();
}

function renderRoomCards(currentRooms) {
    const roomList = document.getElementById("roomList");
    if (!roomList) return;

    if (!currentRooms.length) {
        roomList.innerHTML = `<div class="empty-state"><p>No rooms found.</p></div>`;
        return;
    }

    roomList.innerHTML = currentRooms.map(room => {
        const active = selectedRoom && selectedRoom._id === room._id ? "selected" : "";
        const availability = room.status === "available" ? "Available" : "Booked";
        return `
            <div class="room-card ${room.status} ${active}" onclick="selectRoom('${room._id}')">
                <h4>Room ${room.number}</h4>
                <p>${room.type} | ${room.seater} Seater</p>
                <span class="status-pill ${room.status}">${availability}</span>
            </div>
        `;
    }).join("");
}

function selectRoom(id) {
    selectedRoom = rooms.find(room => room._id === id);
    showRoomDetail(selectedRoom);
    renderRoomCards(rooms);
}

function showRoomDetail(room) {
    const detail = document.getElementById("roomDetail");
    if (!detail) return;

    if (!room) {
        detail.innerHTML = `
            <div class="empty-state">
                <h3>Select a room to view details</h3>
                <p>The selected room will display cleaning status, availability, and actions.</p>
            </div>
        `;
        return;
    }

    detail.innerHTML = `
        <div class="detail-card">
            <h3>Room ${room.number}</h3>
            <p><strong>Type:</strong> ${room.type}</p>
            <p><strong>Seater:</strong> ${room.seater}</p>
            <div class="detail-row"><span>Status</span><span class="status-pill ${room.status}">${room.status === "available" ? "Available" : "Booked"}</span></div>
            <div class="detail-row"><span>Cleaning</span><span class="status-pill ${room.cleaningStatus === "Clean" ? "clean" : "dirty"}">${room.cleaningStatus}</span></div>
            <div class="detail-actions">
                <button class="submit-btn" onclick="openBookingForm()" ${room.status !== "available" ? "disabled" : ""}>📖 Book Room</button>
                <button class="submit-btn secondary" onclick="toggleCleaningStatus()">${room.cleaningStatus === "Clean" ? "Mark Needs Cleaning" : "Mark Clean"}</button>
                <button class="submit-btn danger" onclick="removeSelectedRoom()">Remove Room</button>
            </div>
        </div>
    `;
}

function openRoomModal() {
    resetRoomForm();
    document.getElementById("bookingFormPanel").style.display = "none";
    document.getElementById("addRoomPanel").style.display = "block";
}

function closeRoomModal() {
    document.getElementById("addRoomPanel").style.display = "none";
}

function resetRoomForm() {
    document.getElementById("newRoomNumber").value = "";
    document.getElementById("newRoomType").value = "AC";
    document.getElementById("newRoomSeater").value = "";
    document.getElementById("newRoomCleaning").value = "Clean";
}

function resetRoomFilters() {
    document.getElementById("filterType").value = "";
    document.getElementById("filterSeater").value = "";
    document.getElementById("filterStatus").value = "";
    document.getElementById("filterRoomNo").value = "";
    loadRooms();
}

async function saveRoom() {
    const number = Number(document.getElementById("newRoomNumber").value);
    const type = document.getElementById("newRoomType").value;
    const seater = Number(document.getElementById("newRoomSeater").value);
    const cleaningStatus = document.getElementById("newRoomCleaning").value;

    if (!number || !type || !seater) {
        showPageMessage("Please fill in all room details.", "error");
        return;
    }

    try {
        const backendAvailable = await checkBackend();
        if (!backendAvailable) return;

        await fetchJson("/rooms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ number, type, seater, cleaningStatus, status: "available" })
        });

        closeRoomModal();
        await loadRooms();
        showPageMessage("Room added successfully.");
    } catch (error) {
        console.error("Add room failed:", error);
        showPageMessage(error.message || "Unable to add room.", "error");
    }
}

async function removeSelectedRoom() {
    if (!selectedRoom) return;
    if (!confirm(`Remove Room ${selectedRoom.number}?`)) return;

    await fetchJson(`/rooms/${selectedRoom._id}`, { method: "DELETE" });
    selectedRoom = null;
    loadRooms();
}

async function toggleCleaningStatus() {
    if (!selectedRoom) return;
    const nextStatus = selectedRoom.cleaningStatus === "Clean" ? "Needs Cleaning" : "Clean";
    selectedRoom = await fetchJson(`/rooms/${selectedRoom._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cleaningStatus: nextStatus })
    });
    loadRooms();
}

function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    return date.toLocaleString();
}

let checkInOutBookings = [];

async function loadBookings() {
    checkInOutBookings = await fetchJson("/bookings");
    const query = document.getElementById("bookingSearch")?.value.toLowerCase() || "";
    if (query) {
        const filtered = checkInOutBookings.filter(booking =>
            String(booking.roomNumber).includes(query)
        );
        renderCheckInOutBookings(filtered);
    } else {
        renderCheckInOutBookings(checkInOutBookings);
    }
}

function renderCheckInOutBookings(bookings) {
    const bookingList = document.getElementById("bookingList");
    if (!bookingList) return;

    if (!bookings.length) {
        bookingList.innerHTML = `<div class="empty-state"><h3>No bookings found</h3><p>Create a booking first and return here to check guests in or out.</p></div>`;
        return;
    }

    bookingList.innerHTML = bookings.map(booking => {
        const customerName = booking.customers?.[0]?.name || "Guest";
        const checkInTime = formatDateTime(booking.checkInTime);
        const checkOutTime = formatDateTime(booking.checkOutTime);
        const statusClass = booking.status === "Booked" ? "booked" : booking.status === "Checked-In" ? "checked-in" : "checked-out";
        const actionButton = booking.status === "Booked"
            ? `<button class="submit-btn" onclick="checkInBooking('${booking._id}')">Check In</button>`
            : booking.status === "Checked-In"
                ? `<button class="submit-btn danger" onclick="checkOutBooking('${booking._id}')">Check Out</button>`
                : `<span class="status ${statusClass}">${booking.status}</span>`;

        return `
            <div class="booking-card">
                <h3>Room ${booking.roomNumber}</h3>
                <p><strong>Guest:</strong> ${customerName}</p>
                <p><strong>Booking Status:</strong> <span class="status ${statusClass}">${booking.status}</span></p>
                <p><strong>Check-In:</strong> ${checkInTime}</p>
                <p><strong>Check-Out:</strong> ${checkOutTime}</p>
                <div class="detail-actions">${actionButton}</div>
            </div>
        `;
    }).join("");
}

function filterBookings() {
    const query = document.getElementById("bookingSearch")?.value.toLowerCase() || "";
    const filtered = checkInOutBookings.filter(booking =>
        String(booking.roomNumber).includes(query)
    );
    renderCheckInOutBookings(filtered);
}

function printBookings() {
    if (!checkInOutBookings.length) {
        alert("No bookings to print.");
        return;
    }

    const printWindow = document.createElement("div");
    printWindow.style.padding = "20px";
    printWindow.innerHTML = `
        <h2 style="text-align: center;">Check-In / Check-Out Report</h2>
        <p style="text-align: center;">Generated on ${new Date().toLocaleString()}</p>
        <table border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse: collapse; font-size: 12px; margin-top: 20px;">
            <thead>
                <tr style="background: #f0f0f0;">
                    <th>Room Number</th>
                    <th>Guest Name</th>
                    <th>Status</th>
                    <th>Check-In Time</th>
                    <th>Check-Out Time</th>
                </tr>
            </thead>
            <tbody>
                ${checkInOutBookings.map(booking => `
                    <tr>
                        <td>${booking.roomNumber}</td>
                        <td>${booking.customers?.[0]?.name || "Guest"}</td>
                        <td>${booking.status}</td>
                        <td>${formatDateTime(booking.checkInTime)}</td>
                        <td>${formatDateTime(booking.checkOutTime)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

    html2pdf().set({ margin: 10, filename: `checkin-checkout-report-${new Date().toISOString().slice(0,10)}.pdf`, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } }).from(printWindow).save();
}

let reportBookings = [];
let filteredReportBookings = [];

async function loadReportBookings() {
    reportBookings = await fetchJson("/bookings");
    reportBookings.sort((a, b) => {
        const aDate = new Date(a.createdAt || a.checkInTime || a.updatedAt).getTime();
        const bDate = new Date(b.createdAt || b.checkInTime || b.updatedAt).getTime();
        return bDate - aDate;
    });
    filteredReportBookings = [...reportBookings];
    renderReportTable(filteredReportBookings);
}

function renderReportTable(bookings) {
    const body = document.getElementById("reportTableBody");
    if (!body) return;

    if (!bookings.length) {
        body.innerHTML = `<tr><td colspan="6">No booked rooms available.</td></tr>`;
        return;
    }

    body.innerHTML = bookings.map(booking => {
        const guest = booking.customers?.[0]?.name || "Guest";
        const checkIn = formatDateTime(booking.checkInTime);
        const checkOut = formatDateTime(booking.checkOutTime);
        return `
            <tr>
                <td>${booking.roomNumber}</td>
                <td>${guest}</td>
                <td>${booking.status}</td>
                <td>${checkIn}</td>
                <td>${checkOut}</td>
                <td><a class="submit-btn view-btn" href="report-view.html?id=${booking._id}"><i class="fas fa-receipt"></i> View</a></td>
            </tr>
        `;
    }).join("");
}

function filterReports() {
    const query = document.getElementById("reportSearch")?.value.toLowerCase() || "";
    filteredReportBookings = reportBookings.filter(booking => {
        const guest = booking.customers?.[0]?.name?.toLowerCase() || "";
        return guest.includes(query) || String(booking.roomNumber).includes(query) || booking.status.toLowerCase().includes(query);
    });
    renderReportTable(filteredReportBookings);
}

function exportReportExcel() {
    if (!filteredReportBookings.length) {
        alert("No report records to export.");
        return;
    }
    const headers = ["Room", "Guest", "Status", "Check-In", "Check-Out"];
    const rows = filteredReportBookings.map(booking => [
        booking.roomNumber,
        booking.customers?.[0]?.name || "Guest",
        booking.status,
        formatDateTime(booking.checkInTime),
        formatDateTime(booking.checkOutTime)
    ]);
    let tsv = headers.join("\t") + "\n";
    rows.forEach(row => {
        tsv += row.map(value => `"${String(value).replace(/"/g, '""')}"`).join("\t") + "\n";
    });
    const blob = new Blob([tsv], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `booking-reports-${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportReportPDF() {
    if (!filteredReportBookings.length) {
        alert("No report records to export.");
        return;
    }
    const printWindow = document.createElement("div");
    printWindow.style.padding = "20px";
    printWindow.innerHTML = `
        <h2>Booking Reports</h2>
        <table border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse: collapse; font-size: 12px;">
            <thead>
                <tr>
                    <th>Room</th>
                    <th>Guest</th>
                    <th>Status</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                </tr>
            </thead>
            <tbody>
                ${filteredReportBookings.map(booking => `
                    <tr>
                        <td>${booking.roomNumber}</td>
                        <td>${booking.customers?.[0]?.name || "Guest"}</td>
                        <td>${booking.status}</td>
                        <td>${formatDateTime(booking.checkInTime)}</td>
                        <td>${formatDateTime(booking.checkOutTime)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
    html2pdf().set({ margin: 10, filename: `booking-reports-${new Date().toISOString().slice(0,10)}.pdf`, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } }).from(printWindow).save();
}

async function loadReportDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const container = document.getElementById("bookingDetail");
    if (!container) return;

    if (!id) {
        container.innerHTML = `
            <div class="detail-section">
                <h3>Booking details unavailable</h3>
                <p>No booking ID was provided in the URL.</p>
            </div>
        `;
        return;
    }

    try {
        const booking = await fetchJson(`/bookings/${id}`);
        const customers = Array.isArray(booking.customers) ? booking.customers : [];
        const customersHtml = customers.length ? customers.map((customer, index) => `
            <div class="customer-block">
                <h4>Customer ${index + 1}</h4>
                <p><strong>Name:</strong> ${customer.name || "-"}</p>
                <p><strong>Age:</strong> ${customer.age || "-"}</p>
                <p><strong>Gender:</strong> ${customer.gender || "-"}</p>
                <p><strong>Address:</strong> ${customer.address || "-"}</p>
                <p><strong>ID:</strong> ${customer.idType || "-"} / ${customer.idNumber || "-"}</p>
            </div>
        `).join("") : `<p>No customer details available.</p>`;

        const checkInLabel = booking.checkInTime ? formatDateTime(booking.checkInTime) : "Not checked in yet";
        const checkOutLabel = booking.checkOutTime ? formatDateTime(booking.checkOutTime) : "Not checked out yet";
        const createdLabel = booking.createdAt ? formatDateTime(booking.createdAt) : "-";

        container.innerHTML = `
            <div class="detail-section">
                <div class="receipt-grid">
                    <div class="receipt-card">
                        <h3>Booking Summary</h3>
                        <div class="receipt-row"><span>Booking ID</span><strong>${booking._id ? booking._id.slice(-8).toUpperCase() : "N/A"}</strong></div>
                        <div class="receipt-row"><span>Room Number</span><strong>${booking.roomNumber || "N/A"}</strong></div>
                        <div class="receipt-row"><span>Status</span><strong>${booking.status || "N/A"}</strong></div>
                        <div class="receipt-row"><span>Total Guests</span><strong>${customers.length}</strong></div>
                    </div>
                    <div class="receipt-card">
                        <h3>Booking Dates</h3>
                        <div class="receipt-row"><span>Booked On</span><strong>${createdLabel}</strong></div>
                        <div class="receipt-row"><span>Check-In</span><strong>${checkInLabel}</strong></div>
                        <div class="receipt-row"><span>Check-Out</span><strong>${checkOutLabel}</strong></div>
                        <div class="receipt-row"><span>Reference</span><strong>${booking.reference || "N/A"}</strong></div>
                    </div>
                </div>
            </div>
            <div class="detail-section">
                <h3>Guest Details</h3>
                <div class="customers-grid">${customersHtml}</div>
            </div>
            <div class="detail-section receipt-notes">
                <p><strong>Important:</strong> Please bring a valid photo ID at check-in and contact the front desk for any reservation changes. This booking detail is formatted as a guest receipt.</p>
            </div>
        `;
    } catch (error) {
        console.error("Failed to load booking detail:", error);
        container.innerHTML = `
            <div class="detail-section">
                <h3>Error loading booking details</h3>
                <p>${error.message || "Unable to fetch booking information."}</p>
            </div>
        `;
    }
}

function printReportDetail() {
    const content = document.getElementById("reportDetailContent");
    if (!content) {
        alert("Booking details are not available to print.");
        return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Unable to open print window. Please allow popups for this site.');
        return;
    }

    printWindow.document.write(`
        <html>
        <head>
            <title>Booking Detail Print</title>
            <style>
                *, *::before, *::after { box-sizing: border-box; }
                body { margin: 0; font-family: 'Segoe UI', sans-serif; background: #f8fafc; color: #111827; font-size: 12px; }
                .print-area { width: 100%; max-width: 76mm; min-height: 100vh; margin: 0 auto; background: #ffffff; padding: 12px 10px; }
                .print-header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 14px; }
                .print-header h1 { margin: 0; font-size: 18px; }
                .print-header p { margin: 4px 0 0; color: #4b5563; font-size: 10px; }
                .receipt-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
                .receipt-card { background: transparent; border: none; border-bottom: 1px dashed #d1d5db; padding-bottom: 10px; }
                .receipt-card h3 { margin: 0 0 8px; font-size: 14px; }
                .receipt-row { display: flex; justify-content: space-between; gap: 6px; margin-bottom: 8px; font-size: 11px; color: #374151; }
                .receipt-row strong { color: #111827; font-size: 12px; }
                .customers-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
                .customer-card { background: transparent; border: none; padding: 0; }
                .customer-card h4 { margin: 0 0 6px; font-size: 13px; color: #111827; }
                .customer-card p { margin: 4px 0; font-size: 11px; color: #374151; }
                .receipt-notes { background: transparent; border: none; padding: 0; font-size: 10px; color: #374151; margin-top: 12px; }
                .signature-block { display: block; margin-top: 18px; }
                .signature-line { width: 100%; height: 1px; background: #9ca3af; margin-top: 12px; }
                @page { size: 80mm auto; margin: 4mm; }
                @media print {
                    body { background: #fff; }
                    .print-area { box-shadow: none; border-radius: 0; padding: 4mm 3mm; }
                    .receipt-card, .customer-card, .receipt-notes { page-break-inside: avoid; }
                    .receipt-row { font-size: 11px; }
                    .receipt-card h3 { font-size: 12px; }
                }
            </style>
        </head>
        <body>
            <div class="print-area">${content.innerHTML}</div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

async function loadStaffDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const container = document.getElementById("staffDetail");
    if (!container) return;

    if (!id) {
        container.innerHTML = `
            <div class="error-state">
                <h3>Staff details unavailable</h3>
                <p>No staff ID was provided in the URL.</p>
            </div>
        `;
        return;
    }

    try {
        const staff = await fetchJson(`/staff/${id}`);
        const createdDate = staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : "N/A";
        
        container.innerHTML = `
            <div class="staff-detail-header">
                <div class="staff-basic-info">
                    <h3>${staff.name}</h3>
                    <p class="staff-role">${staff.staffType}</p>
                    <p class="staff-id">Employee ID: ${staff._id.slice(-6).toUpperCase()}</p>
                </div>
            </div>

            <div class="staff-detail-grid">
                <div class="detail-section">
                    <h4>Personal Information</h4>
                    <div class="detail-row">
                        <span>Full Name</span>
                        <span>${staff.name}</span>
                    </div>
                    <div class="detail-row">
                        <span>Father Name</span>
                        <span>${staff.fatherName || "Not provided"}</span>
                    </div>
                    <div class="detail-row">
                        <span>Date of Birth</span>
                        <span>${staff.dob ? new Date(staff.dob).toLocaleDateString() : "Not provided"}</span>
                    </div>
                    <div class="detail-row">
                        <span>Gender</span>
                        <span>${staff.gender}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Employment Details</h4>
                    <div class="detail-row">
                        <span>Staff Type</span>
                        <span>${staff.staffType}</span>
                    </div>
                    <div class="detail-row">
                        <span>Employee ID</span>
                        <span>${staff._id.slice(-6).toUpperCase()}</span>
                    </div>
                    <div class="detail-row">
                        <span>Date Joined</span>
                        <span>${createdDate}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Identification</h4>
                    <div class="detail-row">
                        <span>ID Type</span>
                        <span>${staff.idType || "Not provided"}</span>
                    </div>
                    <div class="detail-row">
                        <span>ID Number</span>
                        <span>${staff.idNumber || "Not provided"}</span>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Failed to load staff detail:", error);
        container.innerHTML = `
            <div class="error-state">
                <h3>Error loading staff details</h3>
                <p>${error.message || "Unable to fetch staff information."}</p>
            </div>
        `;
    }
}

function printStaffDetail() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return;

    // Get the staff data from the page
    const staffName = document.querySelector('.staff-basic-info h3')?.textContent || 'Staff Member';
    const staffRole = document.querySelector('.staff-role')?.textContent || '';
    const staffId = document.querySelector('.staff-id')?.textContent || '';

    const printWindow = document.createElement("div");
    printWindow.style.padding = "20px";
    printWindow.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid #4e73df; padding-bottom: 15px;">
            <h1 style="margin: 8px 0; color: #1a2c79; font-size: 24px;">The Pristine Hotel</h1>
            <p style="margin: 3px 0; color: #666; font-size: 12px;">Employee Details Report</p>
            <p style="margin: 3px 0; color: #999; font-size: 10px;">Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div style="margin-bottom: 15px;">
            <div style="background: #e3f2fd; padding: 12px; border-left: 4px solid #4e73df;">
                <h2 style="margin: 0 0 5px 0; color: #1a2c79; font-size: 18px;">${staffName}</h2>
                <p style="margin: 2px 0; color: #4e73df; font-weight: bold; font-size: 13px;">${staffRole}</p>
                <p style="margin: 2px 0; color: #666; font-size: 11px;">${staffId}</p>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="background: #f8f9fa; padding: 12px; border: 1px solid #ddd;">
                <h3 style="margin: 0 0 10px 0; color: #1a2c79; font-size: 12px; border-bottom: 2px solid #4e73df; padding-bottom: 5px;">Personal Information</h3>
                ${Array.from(document.querySelectorAll('.detail-section')[0]?.querySelectorAll('.detail-row') || []).map(row => {
                    const spans = row.querySelectorAll('span');
                    return `<p style="margin: 5px 0; font-size: 10px;"><strong>${spans[0]?.textContent}:</strong> ${spans[1]?.textContent}</p>`;
                }).join('')}
            </div>

            <div style="background: #f8f9fa; padding: 12px; border: 1px solid #ddd;">
                <h3 style="margin: 0 0 10px 0; color: #1a2c79; font-size: 12px; border-bottom: 2px solid #4e73df; padding-bottom: 5px;">Employment Details</h3>
                ${Array.from(document.querySelectorAll('.detail-section')[1]?.querySelectorAll('.detail-row') || []).map(row => {
                    const spans = row.querySelectorAll('span');
                    return `<p style="margin: 5px 0; font-size: 10px;"><strong>${spans[0]?.textContent}:</strong> ${spans[1]?.textContent}</p>`;
                }).join('')}
            </div>
        </div>

        <div style="background: #f8f9fa; padding: 12px; border: 1px solid #ddd; margin-top: 12px;">
            <h3 style="margin: 0 0 10px 0; color: #1a2c79; font-size: 12px; border-bottom: 2px solid #4e73df; padding-bottom: 5px;">Identification Details</h3>
            ${Array.from(document.querySelectorAll('.detail-section')[2]?.querySelectorAll('.detail-row') || []).map(row => {
                const spans = row.querySelectorAll('span');
                return `<p style="margin: 5px 0; font-size: 10px;"><strong>${spans[0]?.textContent}:</strong> ${spans[1]?.textContent}</p>`;
            }).join('')}
        </div>

        <div style="margin-top: 15px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #ddd; padding-top: 10px;">
            <p style="margin: 0;">This is an official employee record from The Pristine Hotel Management System.</p>
            <p style="margin: 0;">For inquiries, please contact the management office.</p>
        </div>
    `;

    html2pdf().set({ 
        margin: 8, 
        filename: `employee-detail-${staffName.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0,10)}.pdf`, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        html2canvas: { scale: 2, useCORS: true }
    }).from(printWindow).save();
}

async function checkInBooking(id) {
    try {
        await fetchJson(`/bookings/${id}/checkin`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });
        await loadBookings();
        if (window.location.pathname.includes("dashboard.html")) loadDashboard();
        alert("Check-in recorded successfully.");
    } catch (error) {
        console.error("Check-in failed:", error);
        alert(error.message || "Unable to record check-in.");
    }
}

async function checkOutBooking(id) {
    try {
        await fetchJson(`/bookings/${id}/checkout`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });
        await loadBookings();
        if (window.location.pathname.includes("dashboard.html")) loadDashboard();
        alert("Check-out recorded successfully.");
    } catch (error) {
        console.error("Check-out failed:", error);
        alert(error.message || "Unable to record check-out.");
    }
}

let staffRecords = [];
let filteredStaffRecords = [];

async function loadStaff() {
    staffRecords = await fetchJson("/staff");
    filteredStaffRecords = [...staffRecords];
    renderStaffTable(staffRecords);
}

function renderStaffTable(staffList) {
    const body = document.getElementById("staffTableBody");
    if (!body) return;

    if (!staffList.length) {
        body.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;">No staff members found.</td></tr>`;
        return;
    }

    body.innerHTML = staffList.map(member => `
        <tr>
            <td><strong>${member.name}</strong></td>
            <td>${member.fatherName || "-"}</td>
            <td>${member.dob ? new Date(member.dob).toLocaleDateString() : "-"}</td>
            <td>${member.gender}</td>
            <td><span class="badge">${member.staffType}</span></td>
            <td>${member.idType || "-"} / ${member.idNumber || "-"}</td>
            <td>
                <button class="submit-btn" style="padding: 6px 12px; font-size: 12px;" onclick="viewStaffDetails('${member._id}')">View</button>
                <button class="submit-btn danger" style="padding: 6px 12px; font-size: 12px;" onclick="removeStaff('${member._id}')">Delete</button>
            </td>
        </tr>
    `).join("");
}

function filterStaff() {
    const query = document.getElementById("staffSearch")?.value.toLowerCase() || "";
    filteredStaffRecords = staffRecords.filter(member =>
        member.name.toLowerCase().includes(query) ||
        (member.staffType || "").toLowerCase().includes(query) ||
        (member.idNumber || "").toLowerCase().includes(query)
    );
    renderStaffTable(filteredStaffRecords);
}

function toggleStaffForm() {
    const formContainer = document.getElementById("staffFormContainer");
    if (formContainer.style.display === "none") {
        formContainer.style.display = "block";
        resetStaffForm();
        document.getElementById("staffName").focus();
    } else {
        formContainer.style.display = "none";
    }
}

function resetStaffForm() {
    document.getElementById("staffName").value = "";
    document.getElementById("staffFather").value = "";
    document.getElementById("staffDob").value = "";
    document.getElementById("staffGender").value = "Male";
    document.getElementById("staffType").value = "";
    document.getElementById("staffIdType").value = "";
    document.getElementById("staffIdNumber").value = "";
}

async function saveStaff(event) {
    event.preventDefault();
    
    const name = document.getElementById("staffName").value.trim();
    const fatherName = document.getElementById("staffFather").value.trim();
    const dob = document.getElementById("staffDob").value;
    const gender = document.getElementById("staffGender").value;
    const staffType = document.getElementById("staffType").value;
    const idType = document.getElementById("staffIdType").value.trim();
    const idNumber = document.getElementById("staffIdNumber").value.trim();

    if (!name || !staffType) {
        alert("Please enter staff name and type.");
        return;
    }

    try {
        await fetchJson("/staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, fatherName, dob, gender, staffType, idType, idNumber })
        });
        toggleStaffForm();
        await loadStaff();
        alert("Staff member added successfully.");
    } catch (error) {
        console.error("Add staff failed:", error);
        alert(error.message || "Unable to add staff.");
    }
}

async function removeStaff(id) {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
        await fetchJson(`/staff/${id}`, { method: "DELETE" });
        await loadStaff();
        alert("Staff member removed successfully.");
    } catch (error) {
        console.error("Remove staff failed:", error);
        alert(error.message || "Unable to remove staff.");
    }
}

function viewStaffDetails(id) {
    window.location.href = `staff-view.html?id=${id}`;
}

function printStaffDetails() {
    if (!staffRecords.length) {
        alert("No staff records to print.");
        return;
    }

    const printWindow = document.createElement("div");
    printWindow.style.padding = "15px";
    printWindow.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
            <h2 style="margin: 0 0 5px 0; color: #1a2c79;">Staff Directory</h2>
            <p style="margin: 0; color: #666; font-size: 12px;">Generated on ${new Date().toLocaleString()}</p>
        </div>
        <table border="1" cellspacing="0" cellpadding="5" style="width:100%; border-collapse: collapse; font-size: 10px;">
            <thead>
                <tr style="background: #4e73df; color: white;">
                    <th style="padding: 8px;">Name</th>
                    <th style="padding: 8px;">Father Name</th>
                    <th style="padding: 8px;">DOB</th>
                    <th style="padding: 8px;">Gender</th>
                    <th style="padding: 8px;">Role</th>
                    <th style="padding: 8px;">ID Type</th>
                    <th style="padding: 8px;">ID Number</th>
                </tr>
            </thead>
            <tbody>
                ${staffRecords.map(member => `
                    <tr>
                        <td style="padding: 6px;">${member.name}</td>
                        <td style="padding: 6px;">${member.fatherName || "-"}</td>
                        <td style="padding: 6px;">${member.dob ? new Date(member.dob).toLocaleDateString() : "-"}</td>
                        <td style="padding: 6px;">${member.gender}</td>
                        <td style="padding: 6px;">${member.staffType}</td>
                        <td style="padding: 6px;">${member.idType || "-"}</td>
                        <td style="padding: 6px;">${member.idNumber || "-"}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

    html2pdf().set({ 
        margin: 8, 
        filename: `staff-directory-${new Date().toISOString().slice(0,10)}.pdf`, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } 
    }).from(printWindow).save();
}

function exportStaffExcel() {
    if (!staffRecords.length) {
        alert("No staff records to export.");
        return;
    }
    const headers = ["Name", "Father Name", "DOB", "Gender", "Staff Type", "ID Type", "ID Number"];
    const rows = staffRecords.map(member => [
        member.name,
        member.fatherName || "",
        member.dob ? new Date(member.dob).toLocaleDateString() : "",
        member.gender,
        member.staffType,
        member.idType || "",
        member.idNumber || ""
    ]);
    let csvContent = headers.join("\t") + "\n";
    rows.forEach(row => {
        csvContent += row.map(value => `"${String(value).replace(/"/g, '""')}"`).join("\t") + "\n";
    });

    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `staff-list-${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

let bookingStep = 0;
let bookingCustomerCount = 1;
let bookingCustomers = [];

function openBookingForm() {
    if (!selectedRoom || selectedRoom.status !== "available") {
        alert("Please select an available room first.");
        return;
    }

    bookingStep = 0;
    bookingCustomerCount = 1;
    bookingCustomers = [];
    
    document.getElementById("bookingFormTitle").innerText = `Book Room ${selectedRoom.number}`;
    renderBookingFormStep();
    document.getElementById("addRoomPanel").style.display = "none";
    document.getElementById("bookingFormPanel").style.display = "block";
    document.getElementById("roomDetail").style.display = "none";
}

function closeBookingForm() {
    document.getElementById("bookingFormPanel").style.display = "none";
    document.getElementById("roomDetail").style.display = "block";
}

function renderBookingFormStep() {
    const contentContainer = document.getElementById("bookingFormContent");
    const detailsContainer = document.getElementById("roomDetailsDisplay");
    const actions = document.getElementById("bookingFormActions");
    if (!contentContainer || !detailsContainer || !actions) return;

    // Display room details at the top
    if (selectedRoom) {
        detailsContainer.innerHTML = `
            <div class="room-info-box">
                <div class="room-info-grid">
                    <div class="info-item">
                        <span class="label">Room Number</span>
                        <span class="value">#${selectedRoom.number}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Type</span>
                        <span class="value">${selectedRoom.type}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Capacity</span>
                        <span class="value">${selectedRoom.seater} Seater</span>
                    </div>
                </div>
            </div>
        `;
    }

    if (bookingStep === 0) {
        contentContainer.innerHTML = `
            <div class="form-section">
                <label class="form-label">Number of Guests</label>
                <select id="customerCount" class="form-input">
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4 Guests</option>
                </select>
                <p class="form-hint">How many guest details would you like to enter?</p>
            </div>
        `;

        actions.innerHTML = `
            <button class="submit-btn secondary" onclick="closeBookingForm()" type="button">✕ Cancel</button>
            <button class="submit-btn primary" onclick="bookingFormNext()" type="button">Next →</button>
        `;
        return;
    }

    const current = bookingCustomers[bookingStep - 1] || {};
    const stepLabel = `Guest ${bookingStep} of ${bookingCustomerCount}`;
    contentContainer.innerHTML = `
        <div class="form-section">
            <div class="step-indicator">Step ${bookingStep} of ${bookingCustomerCount}</div>
            <h4 class="form-subtitle">${stepLabel} Information</h4>
            
            <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input id="customerName" class="form-input" type="text" value="${current.name || ""}" placeholder="Enter full name">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Age *</label>
                    <input id="customerAge" class="form-input" type="number" value="${current.age || ""}" placeholder="Age">
                </div>
                <div class="form-group">
                    <label class="form-label">Gender *</label>
                    <select id="customerGender" class="form-input">
                        <option value="Male" ${current.gender === "Male" ? "selected" : ""}>Male</option>
                        <option value="Female" ${current.gender === "Female" ? "selected" : ""}>Female</option>
                        <option value="Other" ${current.gender === "Other" ? "selected" : ""}>Other</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Address *</label>
                <input id="customerAddress" class="form-input" type="text" value="${current.address || ""}" placeholder="Enter address">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">ID Proof Type *</label>
                    <input id="customerIdType" class="form-input" type="text" value="${current.idType || ""}" placeholder="e.g., Aadhar / Passport">
                </div>
                <div class="form-group">
                    <label class="form-label">ID Number *</label>
                    <input id="customerIdNumber" class="form-input" type="text" value="${current.idNumber || ""}" placeholder="ID Number">
                </div>
            </div>
        </div>
    `;

    const nextLabel = bookingStep === bookingCustomerCount ? "✓ Confirm Booking" : "Next →";

    actions.innerHTML = `
        <button class="submit-btn secondary" onclick="bookingFormPrev()" type="button">← Back</button>
        <button class="submit-btn primary" onclick="bookingFormNext()" type="button">${nextLabel}</button>
    `;
}

function renderBookingStep() {
    // Keep this for backward compatibility
    renderBookingFormStep();
}

function bookingFormPrev() {
    if (bookingStep === 0) {
        closeBookingForm();
        return;
    }
    bookingStep = Math.max(0, bookingStep - 1);
    renderBookingFormStep();
}

function bookingFormNext() {
    if (bookingStep === 0) {
        bookingCustomerCount = Number(document.getElementById("customerCount").value) || 1;
        bookingCustomers = Array.from({ length: bookingCustomerCount }, (_, index) => bookingCustomers[index] || {
            name: "",
            age: "",
            gender: "Male",
            address: "",
            idType: "",
            idNumber: ""
        });
        bookingStep = 1;
        renderBookingFormStep();
        return;
    }

    const name = document.getElementById("customerName").value.trim();
    const age = Number(document.getElementById("customerAge").value);
    const gender = document.getElementById("customerGender").value;
    const address = document.getElementById("customerAddress").value.trim();
    const idType = document.getElementById("customerIdType").value.trim();
    const idNumber = document.getElementById("customerIdNumber").value.trim();

    if (!name || !age || !gender || !address || !idType || !idNumber) {
        alert("Please complete all guest details.");
        return;
    }

    bookingCustomers[bookingStep - 1] = { name, age, gender, address, idType, idNumber };

    if (bookingStep < bookingCustomerCount) {
        bookingStep += 1;
        renderBookingFormStep();
        return;
    }

    submitRoomBooking();
}

async function submitRoomBooking() {
    if (!selectedRoom) return;

    try {
        const backendAvailable = await checkBackend();
        if (!backendAvailable) return;

        await fetchJson("/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                roomNumber: selectedRoom.number,
                customers: bookingCustomers
            })
        });

        closeBookingForm();
        await loadRooms();
        if (window.location.pathname.includes("dashboard.html")) {
            loadDashboard();
        }
        showPageMessage("Room booked successfully. Status updated.");
    } catch (error) {
        console.error("Booking failed:", error);
        showPageMessage(error.message || "Unable to complete booking.", "error");
    }
}

async function loadDashboard() {
    const data = await fetchJson("/dashboard");

    document.getElementById("totalRooms").innerText = `Total Rooms: ${data.totalRooms}`;
    document.getElementById("availableRooms").innerText = `Available Rooms: ${data.availableRooms}`;
    document.getElementById("bookedRooms").innerText = `Booked Rooms: ${data.bookedRooms}`;
    document.getElementById("totalBookings").innerText = `Total Bookings: ${data.totalBookings}`;

    const tbody = document.getElementById("recentBookingsBody");
    if (!tbody) return;

    if (!data.recentBookings.length) {
        tbody.innerHTML = `<tr><td colspan="5">No recent bookings yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.recentBookings.map((booking, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${booking.roomNumber}</td>
            <td>${booking.customers?.[0]?.name || "Guest"}</td>
            <td>${booking.status}</td>
            <td>${booking.cleaningStatus || "N/A"}</td>
        </tr>
    `).join("");
}

window.onload = async () => {
    if (window.location.pathname.includes("rooms.html") || window.location.pathname.includes("availability.html")) {
        const backendAvailable = await checkBackend();
        if (backendAvailable) {
            loadRooms();
        }
    }
    if (window.location.pathname.includes("dashboard.html")) {
        loadDashboard();
    }
    if (window.location.pathname.includes("checkinout.html")) {
        const backendAvailable = await checkBackend();
        if (backendAvailable) {
            loadBookings();
        }
    }
    if (window.location.pathname.includes("staff.html")) {
        const backendAvailable = await checkBackend();
        if (backendAvailable) {
            loadStaff();
        }
    }
    if (window.location.pathname.includes("reports.html")) {
        const backendAvailable = await checkBackend();
        if (backendAvailable) {
            loadReportBookings();
        }
    }
    if (window.location.pathname.includes("report-view.html")) {
        const backendAvailable = await checkBackend();
        if (backendAvailable) {
            loadReportDetail();
        }
    }
};
