const API = "http://localhost:5000";
let selectedCategory = '';

// ─── ROLE SELECT ───
function selectRole(role) {
  localStorage.setItem("role", role);
  window.location = "auth.html";
}

// ─── SIGNUP ───
async function signup() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirmPassword").value;
  const phone = document.getElementById("phone").value;
  const role = localStorage.getItem("role");

  if (!name || !email || !password || !confirm || !phone) { alert("Please fill all fields ❗"); return; }
  if (password !== confirm) { alert("Passwords do not match ❌"); return; }

  const res = await fetch("http://localhost:5000/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, phone, role })
  });
  const msg = await res.text();
  if (res.ok) {
    alert("Account Created Successfully ✅");
    localStorage.setItem("user", JSON.stringify({ name, email, phone, role }));
    showLogin();
  } else { alert(msg); }
}

// ─── LOGIN ───
async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const role = localStorage.getItem("role");

  const res = await fetch("http://localhost:5000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role })
  });

  if (res.ok) {
    const data = await res.json();
    // Save full user data from server
    localStorage.setItem("user", JSON.stringify({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role
    }));
    if (role === "Admin") window.location.href = "admin.html";
    else if (role === "Provider") window.location.href = "providers.html";
    else window.location.href = "dashboard.html";
  } else {
    const msg = await res.text();
    const errEl = document.getElementById('loginError');
    if (errEl) { errEl.style.display = 'block'; errEl.innerText = msg; }
    else alert(msg);
  }
}

// ─── FORM SWITCH ───
function showSignup() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("signupBox").style.display = "block";
}
function showLogin() {
  document.getElementById("signupBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
}

// ─── FETCH SERVICES FROM MONGODB ───
function getServices() {
  return JSON.parse(localStorage.getItem('services') || '[]');
}

async function fetchAndStoreServices() {
  try {
    const res = await fetch("http://localhost:5000/services");
    const services = await res.json();
    localStorage.setItem('services', JSON.stringify(services));
    return services;
  } catch (err) {
    console.log("Error fetching services:", err);
    return [];
  }
}

// ─── ADD SERVICE PROVIDER (saves to MongoDB) ───
async function addServiceProvider({ category, serviceName, providerName, price, location, contact, description, services, rating, status, image }) {
  if (!category || !serviceName || !providerName || !price) {
    alert('Fill: category, service name, provider name, price');
    return;
  }

  const res = await fetch("http://localhost:5000/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, serviceName, providerName, price, location, contact, description, services, rating, status, image })
  });

  if (res.ok) {
    alert('Service provider added ✅');
    if (typeof loadFullAdminList === 'function') {
      await loadFullAdminList();
    } else {
      await renderSimpleAdminList();
    }
    const f = document.getElementById('providerForm'); if (f) f.style.display = 'none';
    const a = document.getElementById('addServiceAction'); if (a) a.style.display = 'flex';
  } else {
    alert('Failed to add provider ❌');
  }
}

// ─── REMOVE SERVICE PROVIDER (deletes from MongoDB) ───
async function removeServiceProvider(id) {
  const res = await fetch(`http://localhost:5000/services/${id}`, {
    method: "DELETE"
  });
  if (res.ok) {
    alert('Provider removed ✅');
    if (typeof loadFullAdminList === 'function') {
      await loadFullAdminList();
    } else {
      await renderSimpleAdminList();
    }
  } else {
    alert('Failed to remove provider ❌');
  }
}

// ─── ADMIN LIST ───
async function renderSimpleAdminList() {
  const list = document.getElementById('serviceList');
  if (!list) return;

  const services = await fetchAndStoreServices();

  if (services.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:48px 20px;color:#718096;"><div style="font-size:40px;margin-bottom:12px;">📭</div><p>No service providers added yet.</p></div>`;
    return;
  }
  list.innerHTML = `<div style="font-size:13px;font-weight:700;color:#718096;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">${services.length} Provider(s)</div>`
    + services.map(s => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid #EDF2F7;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:42px;height:42px;background:#FFF5F5;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;">${getCategoryIcon(s.category)}</div>
        <div>
          <div style="font-weight:700;font-size:14px;color:#1A202C;">${s.providerName}</div>
          <div style="font-size:12px;color:#718096;">${s.category} · ${s.serviceName} · ₹${s.price}</div>
          <div style="font-size:12px;color:#718096;">📍 ${s.location||'No location'} · ⭐ ${s.rating||4.8}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button onclick="showServiceDetail('${s._id}')" style="background:#EDF2F7;color:#2D3748;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">View</button>
        <button onclick="removeServiceProvider('${s._id}')" style="background:#FFF5F5;color:#E53E3E;border:1px solid #FEB2B2;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Remove</button>
      </div>
    </div>`).join('');
}

// ─── DASHBOARD (fetches from MongoDB) ───
async function renderDashboard() {
  const role = localStorage.getItem('role');
  if (role !== 'Customer') { window.location.href = 'auth.html'; return; }
  await fetchAndStoreServices();
  renderCategoryOverview(selectedCategory);
  const grid = document.getElementById('serviceGrid'); if (grid) grid.style.display = 'none';
  const empty = document.getElementById('emptyState'); if (empty) empty.style.display = 'none';
}

function getCategories() { return ['Electrician','Plumber','AC Repair','Painting','Cleaning','Carpentry']; }

function renderCategoryOverview(preferredCategory = '') {
  const services = getServices();
  const el = document.getElementById('categoryOverview');
  if (!el) return;
  const icons = { Electrician:'⚡', Plumber:'🔧', 'AC Repair':'❄️', Painting:'🎨', Cleaning:'🧹', Carpentry:'🔨' };
  el.innerHTML = getCategories().map(cat => {
    const count = services.filter(s => s.category === cat).length;
    return `<div class="cat-card ${cat===preferredCategory?'active':''}" onclick="selectCategory('${cat}')" data-category="${cat}">
      <div class="cat-icon">${icons[cat]||'🛠️'}</div>
      <div class="cat-label">${cat}</div>
      <div style="font-size:11px;color:#A0AEC0;margin-top:3px;">${count} provider${count!==1?'s':''}</div>
    </div>`;
  }).join('');
  if (preferredCategory) selectedCategory = preferredCategory;
  applyCategoryHighlight();
}

function applyCategoryHighlight() {
  document.querySelectorAll('#categoryOverview .cat-card').forEach(c => c.classList.toggle('active', c.dataset.category === selectedCategory));
}

function setActiveCategory(category) {
  selectedCategory = category;
  applyCategoryHighlight();
  renderProviderGrid(category);
  const t = document.getElementById('providerTitle'); if (t) t.innerText = category ? `${category} Providers` : 'All Providers';
  const s = document.getElementById('providerSub'); if (s) s.innerText = category ? `Top-rated ${category.toLowerCase()} professionals near you` : 'Top-rated professionals in your area';
}

function selectCategory(category) {
  if (window.location.pathname.endsWith('dashboard.html') || window.location.pathname.endsWith('/')) {
    window.location.href = `category.html?category=${encodeURIComponent(category)}`; return;
  }
  setActiveCategory(category);
}

// ─── PROVIDER GRID ───
function renderProviderGrid(category = '') {
  const filtered = getServices().filter(s => !category || s.category === category);
  const grid = document.getElementById('serviceGrid');
  const empty = document.getElementById('emptyState');
  if (!grid || !empty) return;
  if (filtered.length === 0) { grid.innerHTML=''; grid.style.display='none'; empty.style.display='block'; return; }
  empty.style.display = 'none'; grid.style.display = 'grid';
  grid.innerHTML = filtered.map(s => {
    const avail = s.status !== 'Busy';
    const avatarUrl = s.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.providerName)}&background=E53E3E&color=fff&size=80&bold=true`;
    const sid = s._id || s.id;
    return `<div class="service-card">
      <div class="card-header">
        <div class="card-profile">
          <img src="${avatarUrl}" alt="${s.providerName}" class="card-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(s.providerName)}&background=E53E3E&color=fff&size=80'">
          <div>
            <div class="card-name" style="display:flex;align-items:center;">
              ${s.providerName}
              ${s.discountApplicable ? `<span style="background:#FED7D7;color:#9B2C2C;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;margin-left:8px;line-height:1;">50% OFF</span>` : ''}
            </div>
            <div class="card-category">${s.category} · ${s.serviceName}</div>
          </div>
        </div>
        <span class="${avail?'badge-avail':'badge-busy'}">${s.status||'Available'}</span>
      </div>
      <p class="card-desc">${s.description||'Professional service provider with years of experience.'}</p>
      <div class="card-meta">
        <div class="card-rating">⭐ ${s.rating||4.8} <span style="color:#A0AEC0;font-weight:400;">(${Math.floor(Math.random()*150)+50} reviews)</span></div>
        <div class="card-price">
          ${s.discountApplicable ? `<del style="color:#A0AEC0;font-size:14px;margin-right:6px;">₹${s.price}</del>₹${Math.floor(s.price/2)}` : `₹${s.price}`}
          <small> /service</small>
        </div>
      </div>
      <div class="card-location">📍 ${s.location||'Location not set'}</div>
      <div class="card-actions">
        <button class="btn btn-outline btn-sm" onclick="window.location.href='provider-profile.html?id=${sid}'">View Profile</button>
        <button class="btn btn-primary btn-sm" onclick="openBookingPanel('${sid}')">Book Now</button>
      </div>
    </div>`;
  }).join('');
}

function getCategoryIcon(c) {
  return {Electrician:'⚡',Plumber:'🔧','AC Repair':'❄️',Painting:'🎨',Cleaning:'🧹',Carpentry:'🔨'}[c]||'🛠️';
}

// ─── SERVICE DETAIL MODAL ───
function showServiceDetail(id) {
  const s = getServices().find(x => (x._id || x.id) == id);
  if (!s) return;
  const modal = document.getElementById('serviceModal');
  const content = document.getElementById('serviceModalContent');
  if (!modal||!content) return;
  const fakeR = Math.floor(Math.random()*200)+50;
  const avatar = s.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.providerName)}&background=E53E3E&color=fff&size=120&bold=true`;
  const sid = s._id || s.id;
  content.innerHTML = `
    <a style="color:#E53E3E;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;margin-bottom:16px;" onclick="closeServiceModal()">← Back</a>
    <div style="display:flex;gap:16px;margin-bottom:20px;">
      <img src="${avatar}" style="width:96px;height:96px;border-radius:14px;object-fit:cover;" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(s.providerName)}&background=E53E3E&color=fff&size=96'">
      <div style="flex:1;">
        <div style="font-size:19px;font-weight:800;color:#1A202C;">${s.providerName} <span style="color:#2563eb;font-size:14px;">✓</span></div>
        <div style="font-size:13px;color:#718096;">${s.category}</div>
        <div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <span style="background:${s.status==='Busy'?'#FED7D7':'#C6F6D5'};color:${s.status==='Busy'?'#9B2C2C':'#276749'};font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;">${s.status||'Available'}</span>
          <span style="font-size:13px;font-weight:600;">⭐ ${s.rating||4.8} <span style="color:#A0AEC0;font-weight:400;">(${fakeR} reviews)</span></span>
        </div>
        <div style="font-size:12px;color:#718096;margin-top:5px;">📍 ${s.location||'N/A'} &nbsp;·&nbsp; ⏱️ Responds in 1hr</div>
      </div>
      <div style="text-align:right;">
        ${s.discountApplicable 
          ? `<div style="font-size:16px;color:#A0AEC0;text-decoration:line-through;">₹${s.price}</div>
             <div style="font-size:26px;font-weight:800;color:#E53E3E;">₹${Math.floor(s.price/2)}</div>
             <div style="font-size:11px;color:#E53E3E;font-weight:700;">50% OFF (New Provider)</div>`
          : `<div style="font-size:26px;font-weight:800;color:#1A202C;">₹${s.price}</div>`
        }
        <div style="font-size:12px;color:#718096;">/service</div>
      </div>
    </div>
    <button onclick="openBookingPanel('${sid}')" style="width:100%;background:#E53E3E;color:white;border:none;border-radius:10px;padding:13px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px;">📅 Book Now</button>
    <div style="display:flex;gap:8px;margin-bottom:18px;">
      <button style="flex:1;background:white;color:#E53E3E;border:1.5px solid #E53E3E;border-radius:8px;padding:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">📞 Call</button>
      <button style="flex:1;background:white;color:#E53E3E;border:1.5px solid #E53E3E;border-radius:8px;padding:9px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">💬 Message</button>
    </div>
    <div style="background:#F7FAFC;border-radius:10px;padding:12px 14px;margin-bottom:16px;display:flex;align-items:center;gap:10px;">
      <span style="font-size:20px;">🛡️</span>
      <div><strong style="font-size:13px;">Verified Professional</strong><br><small style="color:#718096;">Background checked & identity verified</small></div>
    </div>
    <div style="margin-bottom:16px;">
      <div style="font-size:14px;font-weight:700;margin-bottom:6px;">About</div>
      <p style="font-size:13px;color:#4A5568;line-height:1.6;margin:0;">${s.description||'Professional service provider with years of experience.'}</p>
    </div>
    <div>
      <div style="font-size:14px;font-weight:700;margin-bottom:8px;">Services Offered</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${(s.services ? s.services.split(',') : [s.serviceName]).map(t=>`<span style="background:#F7FAFC;border:1px solid #EDF2F7;padding:5px 12px;border-radius:999px;font-size:12px;font-weight:600;color:#4A5568;">${t.trim()}</span>`).join('')}
      </div>
    </div>`;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeServiceModal() {
  const m = document.getElementById('serviceModal');
  if (m) { m.style.display='none'; document.body.style.overflow=''; }
}

document.addEventListener('click', e => { const m = document.getElementById('serviceModal'); if (e.target===m) closeServiceModal(); });

// ─── BOOKING PANEL WITH DATE/TIME SLOTS ───
function generateTimeSlots() {
  const slots = ['09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM'];
  return slots;
}

function getMinDate() {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  return today.toISOString().split('T')[0];
}

function renderTimeSlots(bookedSlots = []) {
  const allSlots = generateTimeSlots();
  const container = document.getElementById('timeSlotsContainer');
  if (!container) return;
  container.innerHTML = allSlots.map(slot => {
    const isBooked = bookedSlots.includes(slot);
    return `<button onclick="selectSlot(this, '${slot}')" ${isBooked ? 'disabled' : ''}
      style="padding:8px 14px;border-radius:8px;font-size:13px;font-weight:600;font-family:inherit;cursor:${isBooked?'not-allowed':'pointer'};
      background:${isBooked?'#EDF2F7':'white'};color:${isBooked?'#A0AEC0':'#1A202C'};
      border:1.5px solid ${isBooked?'#EDF2F7':'#E2E8F0'};transition:all 0.2s;">
      ${slot}${isBooked ? ' ✗' : ''}
    </button>`;
  }).join('');
}

function selectSlot(btn, slot) {
  document.querySelectorAll('#timeSlotsContainer button').forEach(b => {
    b.style.background = 'white';
    b.style.borderColor = '#E2E8F0';
    b.style.color = '#1A202C';
  });
  btn.style.background = '#E53E3E';
  btn.style.borderColor = '#E53E3E';
  btn.style.color = 'white';
  document.getElementById('selectedSlot').value = slot;
}

async function openBookingPanel(id) {
  const s = getServices().find(x => (x._id || x.id) == id);
  if (!s) return;
  closeServiceModal();
  const old = document.getElementById('bookingPanel'); if (old) old.remove();

  const panel = document.createElement('div');
  panel.id = 'bookingPanel';
  panel.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,20,30,0.55);backdrop-filter:blur(4px);display:flex;justify-content:center;align-items:center;z-index:1001;';
  const sid = s._id || s.id;
  const minDate = getMinDate();

  panel.innerHTML = `
    <div style="background:white;border-radius:18px;padding:28px;width:min(480px,95%);box-shadow:0 10px 40px rgba(0,0,0,0.2);max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <h3 style="font-size:19px;font-weight:800;margin:0;">Book Service</h3>
        <button onclick="closeBookingPanel()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#718096;">✕</button>
      </div>
      <p style="color:#718096;font-size:13px;margin-bottom:20px;">Select a date and time slot</p>

      <!-- Provider Info -->
      <div style="background:#FFF5F5;border-radius:10px;padding:14px;margin-bottom:20px;border:1px solid #FEB2B2;">
        <div style="font-weight:700;font-size:15px;color:#1A202C;margin-bottom:6px;">${s.providerName}</div>
        <div style="font-size:13px;color:#718096;display:flex;flex-direction:column;gap:3px;">
          <div>🏷️ ${s.category} · ${s.serviceName}</div>
          <div>💰 ${s.discountApplicable ? `<del>₹${s.price}</del> <span style="color:#E53E3E;font-weight:bold">₹${Math.floor(s.price/2)} (50% OFF)</span>` : `₹${s.price}`} &nbsp;·&nbsp; 📍 ${s.location||'N/A'} &nbsp;·&nbsp; ⭐ ${s.rating||4.8}</div>
        </div>
      </div>

      <!-- Date Picker -->
      <div style="margin-bottom:20px;">
        <label style="font-size:13px;font-weight:700;color:#2D3748;display:block;margin-bottom:8px;">📅 Select Date</label>
        <input type="date" id="bookingDate" min="${minDate}"
          onchange="handleDateChange('${sid}')"
          style="width:100%;padding:11px 14px;border:1.5px solid #EDF2F7;border-radius:8px;font-size:14px;font-family:inherit;color:#1A202C;background:#F7FAFC;outline:none;">
      </div>

      <!-- Time Slots -->
      <div style="margin-bottom:20px;" id="timeSlotsSection" style="display:none;">
        <label style="font-size:13px;font-weight:700;color:#2D3748;display:block;margin-bottom:8px;">🕐 Select Time Slot</label>
        <div id="timeSlotsContainer" style="display:flex;flex-wrap:wrap;gap:8px;">
          <p style="font-size:13px;color:#718096;">Please select a date first</p>
        </div>
        <input type="hidden" id="selectedSlot" value="">
      </div>

      <!-- Error -->
      <div id="bookingError" style="background:#FFF5F5;border:1px solid #FEB2B2;color:#C53030;border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:12px;display:none;"></div>

      <!-- Buttons -->
      <div style="display:flex;gap:10px;">
        <button onclick="confirmBooking('${sid}')"
          style="flex:1;background:#E53E3E;color:white;border:none;border-radius:9px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
          ✅ Confirm Booking
        </button>
        <button onclick="closeBookingPanel()"
          style="flex:1;background:#EDF2F7;color:#718096;border:none;border-radius:9px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
          Cancel
        </button>
      </div>
    </div>`;

  document.body.appendChild(panel);
  document.body.style.overflow = 'hidden';
}

async function handleDateChange(serviceId) {
  const date = document.getElementById('bookingDate').value;
  if (!date) return;

  // Fetch already booked slots for this provider+date
  try {
    const res = await fetch(`http://localhost:5000/bookings/slots/${serviceId}/${date}`);
    const bookedSlots = await res.json();
    renderTimeSlots(bookedSlots);
  } catch (err) {
    renderTimeSlots([]);
  }
}

function closeBookingPanel() {
  const p = document.getElementById('bookingPanel'); if (p) { p.remove(); document.body.style.overflow=''; }
}



async function confirmBooking(id) {
  const s = getServices().find(x => (x._id || x.id) == id);
  if (!s) return;

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const date = document.getElementById('bookingDate') ? document.getElementById('bookingDate').value : '';
  const slot = document.getElementById('selectedSlot') ? document.getElementById('selectedSlot').value : '';
  const errEl = document.getElementById('bookingError');

  // Validate date and time
  if (!date) {
    if (errEl) { errEl.innerText = 'Please select a date ❗'; errEl.style.display = 'block'; }
    return;
  }
  if (!slot) {
    if (errEl) { errEl.innerText = 'Please select a time slot ❗'; errEl.style.display = 'block'; }
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerName: s.providerName,
        category: s.category,
        serviceName: s.serviceName,
        price: s.price,
        location: s.location || 'N/A',
        rating: s.rating || 4.8,
        customerName: user ? user.name : 'Guest',
        customerEmail: user ? user.email : 'guest',
        serviceId: s._id || s.id,
        bookingDate: date,
        timeSlot: slot
      })
    });

    if (res.ok) {
      closeBookingPanel();
      // Show confirmation
      const conf = document.createElement('div');
      conf.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,20,30,0.55);backdrop-filter:blur(4px);display:flex;justify-content:center;align-items:center;z-index:1002;';
      conf.innerHTML = `
        <div style="background:white;border-radius:18px;padding:36px;width:min(400px,92%);box-shadow:0 10px 40px rgba(0,0,0,0.2);text-align:center;">
          <div style="font-size:56px;margin-bottom:16px;">✅</div>
          <h3 style="font-size:20px;font-weight:800;color:#1A202C;margin-bottom:8px;">Booking Confirmed!</h3>
          <p style="color:#718096;font-size:14px;margin-bottom:20px;">Your booking request has been sent to <strong>${s.providerName}</strong></p>
          <div style="background:#F7FAFC;border-radius:10px;padding:16px;margin-bottom:20px;text-align:left;">
            <div style="font-size:13px;color:#718096;display:flex;flex-direction:column;gap:6px;">
              <div>📅 <strong>Date:</strong> ${new Date(date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
              <div>🕐 <strong>Time:</strong> ${slot}</div>
              <div>💰 <strong>Price:</strong> ${s.discountApplicable ? `₹${Math.floor(s.price/2)} (50% Discount Applied)` : `₹${s.price}`}</div>
              <div>📍 <strong>Location:</strong> ${s.location||'N/A'}</div>
            </div>
          </div>
          <p style="font-size:12px;color:#A0AEC0;margin-bottom:20px;">Status will update once provider accepts your request</p>
          <button onclick="window.location.href='bookings.html'" style="width:100%;background:#E53E3E;color:white;border:none;border-radius:9px;padding:13px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">View My Bookings</button>
        </div>`;
      document.body.appendChild(conf);
    } else {
      const msg = await res.text();
      if (errEl) { errEl.innerText = msg; errEl.style.display = 'block'; }
      else alert(msg);
    }
  } catch (err) {
    if (errEl) { errEl.innerText = 'Server error. Make sure server is running.'; errEl.style.display = 'block'; }
  }
}