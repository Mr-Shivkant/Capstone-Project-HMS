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

    const filtered = rooms.filter(room => {
        const matchesType = !type || room.type === type;
        const matchesSeater = !seater || room.seater === Number(seater);
        const matchesStatus = !status || room.status === status;
        return matchesType && matchesSeater && matchesStatus;
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
                <button class="submit-btn" onclick="openBookingModal()" ${room.status !== "available" ? "disabled" : ""}>Book Room</button>
                <button class="submit-btn secondary" onclick="toggleCleaningStatus()">${room.cleaningStatus === "Clean" ? "Mark Needs Cleaning" : "Mark Clean"}</button>
                <button class="submit-btn danger" onclick="removeSelectedRoom()">Remove Room</button>
            </div>
        </div>
    `;
}

function openRoomModal() {
    resetRoomForm();
    document.getElementById("roomModal").style.display = "flex";
}

function closeRoomModal() {
    document.getElementById("roomModal").style.display = "none";
}

function resetRoomForm() {
    document.getElementById("newRoomNumber").value = "";
    document.getElementById("newRoomType").value = "AC";
    document.getElementById("newRoomSeater").value = "";
    document.getElementById("newRoomCleaning").value = "Clean";
}

async function saveRoom() {
    const number = Number(document.getElementById("newRoomNumber").value);
    const type = document.getElementById("newRoomType").value;
    const seater = Number(document.getElementById("newRoomSeater").value);
    const cleaningStatus = document.getElementById("newRoomCleaning").value;

    if (!number || !type || !seater) {
        alert("Please fill in all room details.");
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

        alert("Room added successfully.");
        closeRoomModal();
        await loadRooms();
    } catch (error) {
        console.error("Add room failed:", error);
        alert(error.message || "Unable to add room.");
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

async function loadBookings() {
    const bookings = await fetchJson("/bookings");
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

let reportBookings = [];
let filteredReportBookings = [];

async function loadReportBookings() {
    reportBookings = await fetchJson("/bookings");
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
                <td><a class="submit-btn secondary" href="report-view.html?id=${booking._id}">View</a></td>
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
                <h3>Room ${booking.roomNumber} Details</h3>
                <p><strong>Status:</strong> ${booking.status || "N/A"}</p>
                <p><strong>Booked On:</strong> ${createdLabel}</p>
                <p><strong>Check-In Time:</strong> ${checkInLabel}</p>
                <p><strong>Check-Out Time:</strong> ${checkOutLabel}</p>
                <p><strong>Total Guests:</strong> ${customers.length}</p>
            </div>
            <div class="detail-section">
                <h3>Customer Details</h3>
                ${customersHtml}
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
    window.print();
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

async function loadStaff() {
    staffRecords = await fetchJson("/staff");
    renderStaffTable(staffRecords);
}

function renderStaffTable(staffList) {
    const body = document.getElementById("staffTableBody");
    if (!body) return;

    if (!staffList.length) {
        body.innerHTML = `<tr><td colspan="7">No staff members found.</td></tr>`;
        return;
    }

    body.innerHTML = staffList.map(member => `
        <tr>
            <td>${member.name}</td>
            <td>${member.fatherName || "-"}</td>
            <td>${member.dob ? new Date(member.dob).toLocaleDateString() : "-"}</td>
            <td>${member.gender}</td>
            <td>${member.staffType}</td>
            <td>${member.idType || "-"} / ${member.idNumber || "-"}</td>
            <td><button class="submit-btn danger" onclick="removeStaff('${member._id}')">Remove</button></td>
        </tr>
    `).join("");
}

function filterStaff() {
    const query = document.getElementById("staffSearch")?.value.toLowerCase() || "";
    const filtered = staffRecords.filter(member =>
        member.name.toLowerCase().includes(query) ||
        (member.staffType || "").toLowerCase().includes(query) ||
        (member.idNumber || "").toLowerCase().includes(query)
    );
    renderStaffTable(filtered);
}

function openStaffModal() {
    document.getElementById("staffName").value = "";
    document.getElementById("staffFather").value = "";
    document.getElementById("staffDob").value = "";
    document.getElementById("staffGender").value = "Male";
    document.getElementById("staffType").value = "Receptionist";
    document.getElementById("staffIdType").value = "";
    document.getElementById("staffIdNumber").value = "";
    document.getElementById("staffModal").style.display = "flex";
}

function closeStaffModal() {
    document.getElementById("staffModal").style.display = "none";
}

async function saveStaff() {
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
        closeStaffModal();
        await loadStaff();
        alert("Staff member added successfully.");
    } catch (error) {
        console.error("Add staff failed:", error);
        alert(error.message || "Unable to add staff.");
    }
}

async function removeStaff(id) {
    if (!confirm("Remove this staff member?")) return;
    await fetchJson(`/staff/${id}`, { method: "DELETE" });
    await loadStaff();
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

function exportStaffPDF() {
    if (!staffRecords.length) {
        alert("No staff records to export.");
        return;
    }
    const printWindow = document.createElement("div");
    printWindow.style.padding = "20px";
    printWindow.innerHTML = `
        <h2>Staff Directory</h2>
        <table border="1" cellspacing="0" cellpadding="8" style="width:100%; border-collapse: collapse; font-size: 12px;">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Father Name</th>
                    <th>DOB</th>
                    <th>Gender</th>
                    <th>Staff Type</th>
                    <th>ID Type</th>
                    <th>ID Number</th>
                </tr>
            </thead>
            <tbody>
                ${staffRecords.map(member => `
                    <tr>
                        <td>${member.name}</td>
                        <td>${member.fatherName || ""}</td>
                        <td>${member.dob ? new Date(member.dob).toLocaleDateString() : ""}</td>
                        <td>${member.gender}</td>
                        <td>${member.staffType}</td>
                        <td>${member.idType || ""}</td>
                        <td>${member.idNumber || ""}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
    html2pdf().set({ margin: 10, filename: `staff-list-${new Date().toISOString().slice(0,10)}.pdf`, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } }).from(printWindow).save();
}

let bookingStep = 0;
let bookingCustomerCount = 1;
let bookingCustomers = [];

function openBookingModal() {
    if (!selectedRoom || selectedRoom.status !== "available") {
        alert("Please select an available room first.");
        return;
    }

    bookingStep = 0;
    bookingCustomerCount = 1;
    bookingCustomers = [];
    document.getElementById("bookingModalTitle").innerText = `Book Room ${selectedRoom.number}`;
    renderBookingStep();
    document.getElementById("bookingModal").style.display = "flex";
}

function closeBookingModal() {
    document.getElementById("bookingModal").style.display = "none";
}

function renderBookingStep() {
    const container = document.getElementById("bookingStepContent");
    const actions = document.getElementById("bookingActions");
    if (!container || !actions) return;

    if (bookingStep === 0) {
        container.innerHTML = `
            <div class="input-group">
                <label>Number of customers</label>
                <select id="customerCount">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                </select>
            </div>
            <p>Select how many guest details you want to enter.</p>
        `;

        actions.innerHTML = `
            <button class="submit-btn secondary" onclick="closeBookingModal()" type="button">Cancel</button>
            <button class="submit-btn" onclick="bookingNext()" type="button">Next</button>
        `;
        return;
    }

    const current = bookingCustomers[bookingStep - 1] || {};
    const stepLabel = `Guest ${bookingStep} of ${bookingCustomerCount}`;
    container.innerHTML = `
        <div class="input-group">
            <label>${stepLabel} Name</label>
            <input id="customerName" type="text" value="${current.name || ""}" placeholder="Full Name">
        </div>
        <div class="input-group">
            <label>Age</label>
            <input id="customerAge" type="number" value="${current.age || ""}" placeholder="Age">
        </div>
        <div class="input-group">
            <label>Gender</label>
            <select id="customerGender">
                <option value="Male" ${current.gender === "Male" ? "selected" : ""}>Male</option>
                <option value="Female" ${current.gender === "Female" ? "selected" : ""}>Female</option>
                <option value="Other" ${current.gender === "Other" ? "selected" : ""}>Other</option>
            </select>
        </div>
        <div class="input-group">
            <label>Address</label>
            <input id="customerAddress" type="text" value="${current.address || ""}" placeholder="Address">
        </div>
        <div class="input-group">
            <label>ID Proof Type</label>
            <input id="customerIdType" type="text" value="${current.idType || ""}" placeholder="Aadhar / Passport">
        </div>
        <div class="input-group">
            <label>ID Number</label>
            <input id="customerIdNumber" type="text" value="${current.idNumber || ""}" placeholder="ID Number">
        </div>
    `;

    const prevButton = bookingStep === 1 ? `<button class="submit-btn secondary" onclick="bookingPrev()" type="button">Back</button>` : `<button class="submit-btn secondary" onclick="bookingPrev()" type="button">Back</button>`;
    const nextLabel = bookingStep === bookingCustomerCount ? "Confirm Booking" : "Next";

    actions.innerHTML = `
        ${prevButton}
        <button class="submit-btn" onclick="bookingNext()" type="button">${nextLabel}</button>
    `;
}

function bookingPrev() {
    if (bookingStep === 0) {
        closeBookingModal();
        return;
    }
    bookingStep = Math.max(0, bookingStep - 1);
    renderBookingStep();
}

function bookingNext() {
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
        renderBookingStep();
        return;
    }

    const name = document.getElementById("customerName").value.trim();
    const age = Number(document.getElementById("customerAge").value);
    const gender = document.getElementById("customerGender").value;
    const address = document.getElementById("customerAddress").value.trim();
    const idType = document.getElementById("customerIdType").value.trim();
    const idNumber = document.getElementById("customerIdNumber").value.trim();

    if (!name || !age || !gender || !address || !idType || !idNumber) {
        alert("Please complete all customer details.");
        return;
    }

    bookingCustomers[bookingStep - 1] = { name, age, gender, address, idType, idNumber };

    if (bookingStep < bookingCustomerCount) {
        bookingStep += 1;
        renderBookingStep();
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

        closeBookingModal();
        await loadRooms();
        if (window.location.pathname.includes("dashboard.html")) {
            loadDashboard();
        }
        alert("Room booked successfully. Status updated.");
    } catch (error) {
        console.error("Booking failed:", error);
        alert(error.message || "Unable to complete booking.");
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
