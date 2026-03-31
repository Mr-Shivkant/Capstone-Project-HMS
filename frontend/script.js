// Protect pages
if (window.location.pathname.includes("dashboard.html") ||
    window.location.pathname.includes("availability.html") ||
    window.location.pathname.includes("rooms.html") ||
    window.location.pathname.includes("checkinout.html")) {

    let isAdmin = localStorage.getItem("isAdmin");

    if (!isAdmin) {
        alert("Access Denied! Please login first ❌");
        window.location.href = "login.html";
    }
}

async function login(event) {
    event.preventDefault();

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    let res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });

    let data = await res.json();

    if (data.success) {
        // save login session
        localStorage.setItem("isAdmin", "true");

        alert("Login Successful ✅");
        window.location.href = "dashboard.html";
    } else {
        alert(data.message);
    }
}

// Show/Hide Password
function togglePassword() {
    let passwordField = document.getElementById("password");

    if (passwordField.type === "password") {
        passwordField.type = "text";
    } else {
        passwordField.type = "password";
    }
}


const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const closeBtn = document.getElementById("closeBtn");

menuToggle.onclick = () => {
    sidebar.classList.add("active");
};

closeBtn.onclick = () => {
    sidebar.classList.remove("active");
};


// sample room data
const rooms = [
    { number: 101, type: "AC", seater: 2, available: true },
    { number: 102, type: "Non-AC", seater: 3, available: true },
    { number: 103, type: "AC", seater: 1, available: false },
    { number: 104, type: "Non-AC", seater: 4, available: true }
];

// navigation
function go(page) {
    window.location.href = page;
}

async function filterRooms() {
    let type = document.getElementById("type").value;
    let seater = document.getElementById("seater").value;

    let res = await fetch("http://localhost:5000/api/rooms");
    let rooms = await res.json();

    let filtered = rooms.filter(room => {
        return (type === "" || room.type === type) &&
               (seater === "" || room.seater == seater);
    });

    let roomList = document.getElementById("roomList");
    roomList.innerHTML = "";

    filtered.forEach(room => {
        let div = document.createElement("div");
        div.className = `room-card ${room.status}`;

        div.innerHTML = `
            <h4>Room ${room.number}</h4>
            <p>${room.type} | ${room.seater} Seater</p>
            ${
                room.status === "available"
                ? `<button class="book-btn" onclick="openBooking(${room.number})">Book Now</button>`
                : `<span class="booked-label">Booked</span>`
            }
        `;

        roomList.appendChild(div);
    });
}
let currentStep = -1; // -1 means first screen (customer count)
let totalCustomers = 1;
let bookingData = [];
let selectedRoom = null;

function openBooking(roomNumber) {
    selectedRoom = roomNumber;
    currentStep = -1;
    bookingData = [];

    document.getElementById("bookingModal").style.display = "flex";
    renderStep();
}

function closeBooking() {
    document.getElementById("bookingModal").style.display = "none";
}

function renderStep() {
    const container = document.getElementById("stepContainer");

    // STEP 1 → Ask number of customers
    if (currentStep === -1) {
        container.innerHTML = `
            <h3>Select Number of Customers</h3>

            <input type="number" id="customerCount" min="1" max="10" placeholder="Enter number of customers">

        `;

        document.getElementById("prevBtn").style.display = "none";
        document.getElementById("nextBtn").innerText = "Next ➡";
        return;
    }

    // STEP 2 → Customer form
    container.innerHTML = `
        <h3>Customer ${currentStep + 1} Details</h3>

        <input type="text" id="name" placeholder="Full Name" required>
        <input type="number" id="age" placeholder="Age" required>

        <select id="gender">
            <option>Male</option>
            <option>Female</option>
        </select>

        <input type="text" id="address" placeholder="Address">

        <select id="idType">
            <option>Aadhar</option>
            <option>Passport</option>
            <option>Driving License</option>
        </select>

        <input type="text" id="idNumber" placeholder="ID Number">
    `;

    document.getElementById("prevBtn").style.display = currentStep === 0 ? "none" : "inline-block";

    if (currentStep === totalCustomers - 1) {
        document.getElementById("nextBtn").innerText = "Submit";
    } else {
        document.getElementById("nextBtn").innerText = "Next ➡";
    }
}

function nextStep() {

    // STEP 1 → Save number of customers
    if (currentStep === -1) {
        totalCustomers = document.getElementById("customerCount").value;

        if (!totalCustomers || totalCustomers <= 0) {
            alert("Please enter valid number of customers");
            return;
        }

        currentStep = 0;
        renderStep();
        return;
    }

    // Save customer data
    let customer = {
        name: document.getElementById("name").value,
        age: document.getElementById("age").value,
        gender: document.getElementById("gender").value,
        address: document.getElementById("address").value,
        idType: document.getElementById("idType").value,
        idNumber: document.getElementById("idNumber").value
    };

    bookingData[currentStep] = customer;

    // Next or Submit
    if (currentStep < totalCustomers - 1) {
        currentStep++;
        renderStep();
    } else {
        submitBooking();
    }
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        renderStep();
    } else {
        currentStep = -1;
        renderStep();
    }
}

async function submitBooking() {
    await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            roomNumber: selectedRoom,
            customers: bookingData
        })
    });

    alert("Booking Successful ✅");
    closeBooking();
    filterRooms(); // refresh
}


let bookings = [
    { name: "Rahul", room: 101, status: "Booked" },
    { name: "Amit", room: 102, status: "Checked-In" }
];

function loadBookings() {
    const container = document.getElementById("bookingList");
    if (!container) return;

    container.innerHTML = "";

    bookings.forEach((b, index) => {

        let statusClass = "";
        if (b.status === "Booked") statusClass = "booked";
        if (b.status === "Checked-In") statusClass = "checked-in";
        if (b.status === "Checked-Out") statusClass = "checked-out";

        let button = "";

        if (b.status === "Booked") {
            button = `<button class="action-btn checkin-btn" onclick="checkIn(${index})">Check In</button>`;
        } else if (b.status === "Checked-In") {
            button = `<button class="action-btn checkout-btn" onclick="checkOut(${index})">Check Out</button>`;
        } else {
            button = `<span>Completed</span>`;
        }

        container.innerHTML += `
            <div class="booking-card">
                <h3>${b.name}</h3>
                <p>Room: <strong>${b.room}</strong></p>
                <p class="status ${statusClass}">${b.status}</p>
                ${button}
            </div>
        `;
    });
}

function checkIn(index) {
    bookings[index].status = "Checked-In";
    loadBookings();
}

function checkOut(index) {
    bookings[index].status = "Checked-Out";
    loadBookings();
}

window.onload = loadBookings;

async function loadDashboard() {
    let res = await fetch("http://localhost:5000/api/dashboard");
    let data = await res.json();

    document.getElementById("totalRooms").innerText = "Total Rooms: " + data.totalRooms;
    document.getElementById("availableRooms").innerText = "Available Rooms: " + data.availableRooms;
    document.getElementById("bookedRooms").innerText = "Booked Rooms: " + data.bookedRooms;
    document.getElementById("totalBookings").innerText = "Total Bookings: " + data.totalBookings;
}

// run only on dashboard page
if (window.location.pathname.includes("dashboard.html")) {
    loadDashboard();
}
function logout() {
    localStorage.removeItem("isAdmin");
    window.location.href = "login.html";
}
