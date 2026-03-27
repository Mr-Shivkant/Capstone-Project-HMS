function login(event) {
    event.preventDefault(); // STOP page reload

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    // Simple demo validation
    if (username === "admin" && password === "1234") {
        alert("Login successful!");
        window.location.href = "dashboard.html"; // redirect
    } else {
        alert("Invalid username or password");
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

function filterRooms() {
    let type = document.getElementById("type").value;
    let seater = document.getElementById("seater").value;

    let roomList = document.getElementById("roomList");

    // Example dummy data
    let rooms = [
        { number: 101, type: "AC", seater: "1", status: "available" },
        { number: 102, type: "Non-AC", seater: "2", status: "booked" },
        { number: 103, type: "AC", seater: "2", status: "available" },
        { number: 104, type: "Non-AC", seater: "4", status: "available" }
    ];

    let filtered = rooms.filter(room => {
        return (type === "" || room.type === type) &&
               (seater === "" || room.seater === seater);
    });

    if (filtered.length === 0) {
        roomList.innerHTML = "<p>No rooms found.</p>";
        return;
    }

    roomList.innerHTML = "";

    filtered.forEach(room => {
        let div = document.createElement("div");
        div.className = `room-card ${room.status}`;
        div.innerHTML = `
            Room ${room.number}<br>
            ${room.type} | ${room.seater} Seater
        `;
        roomList.appendChild(div);
    });
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