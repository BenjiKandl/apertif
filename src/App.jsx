import React, { useState, useEffect } from 'react';

// Bottle and dietary options available to guests
const bottleOptions = ['Red','White','Bubbles','Rosé','Non‑Alcoholic'];
const dietOptions = ['None','Vegan','Halal','Gluten‑Free','Nut‑Free','Dairy‑Free'];

// Only two themes are available: white and black. Each theme defines a
// gradient background and a set of accent colours used for progress bars
// and buttons. Should you wish to add more themes, provide a gradient
// string and primary/light colour values.
const themes = {
  white: {
    gradient: 'from-white via-gray-50 to-gray-100',
    primary: '#1E1E1E', // dark text on light backgrounds
    light: '#E5E7EB'    // gray‑200 for light accent backgrounds
  },
  black: {
    gradient: 'from-gray-900 via-gray-800 to-black',
    primary: '#F3F4F6', // light text on dark backgrounds
    light: '#374151'    // gray‑700 for dark accent backgrounds
  }
};

// Convert a date and time to an iCal timestamp. The event is assumed
// to start and end on the same day.
function formatDateForICS(date, time) {
  const [year, month, day] = date.split('-');
  const [hour, minute] = time.split(':');
  return year + month + day + 'T' + hour + minute + '00';
}

// Download an .ics file for the given event. Includes title, date, time,
// station and optional dress code.
function downloadIcs(event) {
  const dt = formatDateForICS(event.date, event.time);
  let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\n';
  ics += 'DTSTART:' + dt + '\r\n';
  ics += 'DTEND:' + dt + '\r\n';
  ics += 'SUMMARY:' + event.title + '\r\n';
  ics += 'LOCATION:' + event.station + '\r\n';
  if (event.dressCode) {
    ics += 'DESCRIPTION:Dress code/theme: ' + event.dressCode + '\r\n';
  }
  ics += 'END:VEVENT\r\nEND:VCALENDAR';
  const blob = new Blob([ics], { type:'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = event.title.replace(/\s+/g, '_') + '.ics';
  a.click();
  URL.revokeObjectURL(url);
}

// Generate a pastel avatar colour for a guest based on their name. This
// helps distinguish guests in the list.
function getAvatarClass(name) {
  const pastelClasses = [
    'bg-pink-300','bg-purple-300','bg-green-300','bg-yellow-300','bg-blue-300'
  ];
  const index = name ? name.charCodeAt(0) % pastelClasses.length : 0;
  return pastelClasses[index];
}

// Toast component for transient notifications. It fades in and out.
function Toast({ message, show }) {
  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-xl shadow-lg transition-opacity duration-500 pointer-events-none ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', color: '#fff' }}
    >
      {message}
    </div>
  );
}

// RSVP form. Guests can choose whether they will attend. Only after
// selecting "Yes" will full event details and the RSVP form be shown.
function RsvpForm({ event, guests, capacity, addGuest, showToast, theme, hasRsvp, eventId }) {
  const [name, setName] = useState('');
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [bottle, setBottle] = useState(bottleOptions[0]);
  const [decision, setDecision] = useState('undecided');

  const toggleDiet = (diet) => {
    setSelectedDiets((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (decision !== 'yes') return;
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (capacity && guests.length >= capacity) {
      alert('Sorry, this dinner is full.');
      return;
    }
    const newGuest = { name, diet: selectedDiets, bottle };
    addGuest(newGuest);
    // mark this RSVP so the same guest can't RSVP again
    if (eventId) {
      localStorage.setItem('apertif_rsvp_' + eventId, '1');
    }
    setName('');
    setSelectedDiets([]);
    setBottle(bottleOptions[0]);
    setDecision('undecided');
    showToast('RSVP submitted! 🥂');
  };

  // Determine gradient for RSVP background
  const bgGradient = themes[theme]?.gradient || themes.white.gradient;
  const accentColor = themes[theme]?.primary || themes.white.primary;

  // If guest has already RSVPed, show a simple message
  if (hasRsvp) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${bgGradient} bg-fixed flex flex-col items-center`}> 
        <div className="mt-8 p-6 bg-white/80 backdrop-blur-md rounded-xl shadow-lg w-full max-w-md space-y-4">
          <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          <p className="text-gray-700"><strong>Date:</strong> {event.date}</p>
          <p className="text-gray-700"><strong>Time:</strong> {event.time}</p>
          <p className="text-gray-700"><strong>Location:</strong> {event.station}</p>
          <p className="text-gray-700">You have already RSVPed for this dinner. Thank you!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} bg-fixed flex flex-col items-center`}> 
      <div className="mt-8 p-6 bg-white/80 backdrop-blur-md rounded-xl shadow-lg w-full max-w-md space-y-4">
        {/* Event summary */}
        {event.imageUrl && (
          <img src={event.imageUrl} alt="Event" className="w-full h-40 object-cover rounded-xl mb-4" />
        )}
        <div>
          <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          <p className="text-gray-700"><strong>Date:</strong> {event.date}</p>
          <p className="text-gray-700"><strong>Time:</strong> {event.time}</p>
          <p className="text-gray-700"><strong>Location:</strong> {event.station}</p>
          {/* Reveal cuisine, protein, spice, buffer, dress and address only after accepting */}
          {decision === 'yes' && event.cuisine && (
            <p className="text-gray-700"><strong>Cuisine:</strong> {event.cuisine}</p>
          )}
          {decision === 'yes' && event.protein && (
            <p className="text-gray-700"><strong>Protein:</strong> {event.protein}</p>
          )}
          {decision === 'yes' && event.spiceLevel !== undefined && (
            <p className="text-gray-700"><strong>Spice level:</strong> {event.spiceLevel === 0 ? 'Karen' : '🌶'.repeat(event.spiceLevel)}</p>
          )}
          {decision === 'yes' && event.bufferTime && (
            <p className="text-gray-700"><strong>You can arrive up to:</strong> {event.bufferTime} minutes late</p>
          )}
          {decision === 'yes' && event.dressCode && (
            <p className="text-gray-700"><strong>Dress code:</strong> {event.dressCode}</p>
          )}
          {decision === 'yes' && event.address && (
            <p className="text-gray-700"><strong>Address:</strong> <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`} target="_blank" rel="noreferrer" className="underline text-blue-600">{event.address}</a></p>
          )}
        </div>
        {/* Undecided prompt */}
        {decision === 'undecided' && (
          <div className="space-y-3">
            <p className="text-lg font-medium">Will you attend this dinner?</p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setDecision('yes')}
                className="flex-1 py-2 rounded-md text-white transition-colors duration-200"
                style={{ backgroundColor: accentColor }}
              >
                Yes, I’m in!
              </button>
              <button
                type="button"
                onClick={() => setDecision('no')}
                className="flex-1 py-2 rounded-md text-white transition-colors duration-200"
                style={{ backgroundColor: '#6b7280' }}
              >
                No, can’t make it
              </button>
            </div>
          </div>
        )}
        {/* Decline message */}
        {decision === 'no' && (
          <div className="space-y-2">
            <p className="text-gray-700">No worries, thanks for letting us know. Maybe next time!</p>
          </div>
        )}
        {/* RSVP form */}
        {decision === 'yes' && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block font-medium">Your Name</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-medium">Dietary restrictions</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {dietOptions.map((diet) => (
                  <button
                    type="button"
                    key={diet}
                    onClick={() => toggleDiet(diet)}
                    className={`px-3 py-1 rounded-full border transition-colors duration-200 ${
                      selectedDiets.includes(diet) ? 'bg-rose-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-medium">Bottle you’ll bring</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={bottle}
                onChange={(e) => setBottle(e.target.value)}
              >
                {bottleOptions.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-xl text-white font-medium transition-colors duration-200"
              style={{ backgroundColor: accentColor }}
            >
              RSVP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Main application component. Handles event creation, host view and routing
// between host and RSVP pages. Uses localStorage to persist events and
// guests by event ID. Also prevents duplicate RSVPs by storing a flag per event.
function App() {
  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    station: '',
    address: '',
    cuisine: '',
    protein: '',
    spiceLevel: 0,
    bufferTime: '',
    dressCode: '',
    capacity: '',
    isAnonymous: false,
    theme: 'white',
    imageUrl: ''
  });
  const [guests, setGuests] = useState([]);
  const [eventId, setEventId] = useState(null);
  const [isRsvp, setIsRsvp] = useState(false);
  const [hasRsvp, setHasRsvp] = useState(false);
  const [toast, setToast] = useState({ message: '', show: false });

  // Logged in user information. Persist to localStorage so the user
  // remains signed in across page reloads. If no user is present the
  // login overlay will prompt for name and contact.
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('apertif_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loginName, setLoginName] = useState('');
  const [loginContact, setLoginContact] = useState('');

  // Handle user login. Generates a simple ID and stores contact info.
  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginName.trim() || !loginContact.trim()) {
      alert('Please enter your name and email or phone');
      return;
    }
    const newUser = {
      id: Date.now().toString(),
      name: loginName.trim(),
      contact: loginContact.trim(),
      attendanceScore: 0
    };
    localStorage.setItem('apertif_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  // Determine view based on URL parameters. Load event data from localStorage.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventParam = params.get('event');
    const rsvpParam = params.get('rsvp');
    if (eventParam) {
      const stored = localStorage.getItem('apertif_event_' + eventParam);
      if (stored) {
        const parsed = JSON.parse(stored);
        setForm(parsed.event);
        setGuests(parsed.guests || []);
        setEventId(eventParam);
      }
    }
    if (rsvpParam === '1') {
      setIsRsvp(true);
    }
    if (eventParam) {
      const key = 'apertif_rsvp_' + eventParam;
      if (localStorage.getItem(key)) {
        setHasRsvp(true);
      }
    }
  }, []);

  // Generic change handler for input fields
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Set the spice level (0–3). Level 0 is "Karen".
  const setSpice = (level) => {
    setForm((prev) => ({ ...prev, spiceLevel: level }));
  };

  // Select the current theme
  const setTheme = (theme) => {
    setForm((prev) => ({ ...prev, theme }));
  };

  // Show toast notifications
  const showToast = (message) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  // Create a new event. Requires title, date, time and station.
  const createEvent = () => {
    if (!form.title || !form.date || !form.time || !form.station) {
      alert('Please fill in the dinner name, date, time and station');
      return;
    }
    const id = Date.now().toString();
    // Include hostId in the stored event so the host can be identified later.
    const eventData = { ...form, hostId: user?.id };
    localStorage.setItem('apertif_event_' + id, JSON.stringify({ event: eventData, guests }));
    setEventId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('event', id);
    url.searchParams.delete('rsvp');
    window.history.pushState({}, '', url.toString());
    showToast('Dinner created! 🎉');
  };

  // Add a guest and persist to localStorage. Also mark RSVP for this event.
  const addGuest = (guest) => {
    setGuests((prev) => {
      // Attach guest id and contact information. Use user.id and user.contact so
      // multiple RSVPs from the same user can be detected across sessions.
      const fullGuest = { ...guest, id: user?.id, contact: user?.contact };
      // Prevent duplicate RSVPs by checking existing guest IDs.
      if (user && prev.some((g) => g.id === user.id)) {
        showToast('You have already RSVPed for this dinner.');
        return prev;
      }
      const updated = [...prev, fullGuest];
      if (eventId) {
        localStorage.setItem(
          'apertif_event_' + eventId,
          JSON.stringify({ event: form, guests: updated })
        );
        localStorage.setItem('apertif_rsvp_' + eventId, '1');
        setHasRsvp(true);
      }
      return updated;
    });
  };

  // Copy a link to the clipboard
  const copyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => {
      showToast('Link copied!');
    });
  };

  // Send reminders to guests. This is a placeholder implementation: it
  // simply shows a toast. In a real application you would integrate
  // messaging via email/SMS services.
  const handleRemind = () => {
    showToast('Reminders sent to all guests!');
  };

  // Determine the gradient and accent colours based on theme. These are
  // computed once per render and used throughout the component, including
  // the login overlay. If form.theme is not set, default to the white theme.
  const themeBg = themes[form.theme]?.gradient || themes.white.gradient;
  const accentColor = themes[form.theme]?.primary || themes.white.primary;

  // If the user is not signed in, show a login overlay. The overlay
  // collects the user's name and contact information (email or phone)
  // before any event functionality becomes available.
  if (!user) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeBg} bg-fixed flex flex-col items-center justify-center`}>
        <div className="p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg w-full max-w-md space-y-4">
          <h1 className="text-3xl font-bold text-center" style={{ color: accentColor }}>Apertif</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-medium">Your Name</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-medium">Email or Phone</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={loginContact}
                onChange={(e) => setLoginContact(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-xl text-white font-medium transition-colors duration-200"
              style={{ backgroundColor: accentColor }}
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  // RSVP view
  if (eventId && isRsvp) {
    return (
      <>
        <RsvpForm
          event={form}
          guests={guests}
          capacity={form.capacity}
          addGuest={addGuest}
          showToast={showToast}
          theme={form.theme}
          hasRsvp={hasRsvp}
          eventId={eventId}
        />
        <Toast message={toast.message} show={toast.show} />
      </>
    );
  }

  // Host view: show dinner details, guests and share tools once the event is created
  if (eventId) {
    const guestCount = guests.length;
    const capacityNum = parseInt(form.capacity || '0', 10);
    const hostLink = window.location.origin + window.location.pathname + '?event=' + eventId;
    const rsvpLink = hostLink + '&rsvp=1';
    return (
      <div className={`min-h-screen bg-gradient-to-br ${themeBg} bg-fixed flex flex-col items-center`}> 
        <div className="mt-8 p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg w-full max-w-2xl space-y-6">
          {form.imageUrl && (
            <img src={form.imageUrl} alt="Event" className="w-full h-56 object-cover rounded-2xl" />
          )}
          <div className="space-y-1">
            <h1 className="text-4xl font-bold">{form.title}</h1>
            <p className="text-gray-700"><strong>Date:</strong> {form.date}</p>
            <p className="text-gray-700"><strong>Time:</strong> {form.time}</p>
            <p className="text-gray-700"><strong>Location:</strong> {form.station}</p>
            {form.address && <p className="text-gray-700"><strong>Address:</strong> {form.address}</p>}
            {form.cuisine && <p className="text-gray-700"><strong>Cuisine:</strong> {form.cuisine}</p>}
            {form.protein && <p className="text-gray-700"><strong>Protein:</strong> {form.protein}</p>}
            <p className="text-gray-700"><strong>Spice level:</strong> {form.spiceLevel === 0 ? 'Karen' : '🌶'.repeat(form.spiceLevel)}</p>
            {form.bufferTime && <p className="text-gray-700"><strong>You can arrive up to:</strong> {form.bufferTime} minutes late</p>}
            {form.dressCode && <p className="text-gray-700"><strong>Dress code:</strong> {form.dressCode}</p>}
            {form.capacity && <p className="text-gray-700"><strong>Chairs:</strong> {form.capacity}</p>}
          </div>
          {/* Progress bar */}
          {form.capacity && (
            <div>
              <div className="mb-1 text-sm text-gray-700">Guests: {guestCount} / {form.capacity}</div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${capacityNum ? Math.min(guestCount / capacityNum, 1) * 100 : 0}%`, backgroundColor: accentColor }}
                />
              </div>
            </div>
          )}
          {/* Guest list */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Guest list</h2>
            {guests.length === 0 ? (
              <p className="text-gray-600 italic">No guests yet.</p>
            ) : (
              guests.map((guest, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-white/70 rounded-xl backdrop-blur-sm">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getAvatarClass(guest.name)}`}> 
                    {form.isAnonymous ? 'G' + (index + 1) : guest.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {form.isAnonymous ? ('Guest ' + (index + 1)) : guest.name}
                    </div>
                    <div className="text-sm text-gray-600 flex flex-wrap gap-2">
                      {guest.diet.map((d) => (
                        <span key={d} className="px-2 py-0.5 bg-gray-200 rounded-full text-xs">{d}</span>
                      ))}
                      <span className="px-2 py-0.5 bg-gray-200 rounded-full text-xs">{guest.bottle}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Sharing buttons */}
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold">Share</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => copyLink(rsvpLink)}
                className="flex-1 py-2 rounded-xl text-white font-medium transition-colors duration-200"
                style={{ backgroundColor: accentColor }}
              >
                Copy RSVP link
              </button>
              <button
                onClick={() => copyLink(hostLink)}
                className="flex-1 py-2 rounded-xl text-white font-medium transition-colors duration-200"
                style={{ backgroundColor: accentColor }}
              >
                Copy host link
              </button>
            </div>
            <button
              onClick={() => downloadIcs(form)}
              className="w-full py-2 rounded-xl text-white font-medium transition-colors duration-200"
              style={{ backgroundColor: accentColor }}
            >
              Add to calendar
            </button>

            <button
              onClick={handleRemind}
              className="w-full py-2 rounded-xl text-white font-medium transition-colors duration-200"
              style={{ backgroundColor: accentColor }}
            >
              Send reminders
            </button>
          </div>
        </div>
        <Toast message={toast.message} show={toast.show} />
      </div>
    );
  }

  // Event creation view for hosts. Allows input of all details before saving.
  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeBg} bg-fixed flex flex-col items-center`}> 
      <div className="mt-8 p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg w-full max-w-2xl space-y-6">
        {/* Branding */}
        <h1 className="text-4xl font-bold text-center" style={{ color: accentColor }}>APERTIF beta by Benji</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Dinner Name</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Dinner name" />
          </div>
          <div>
            <label className="block font-medium">Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-medium">Time</label>
            <input type="time" name="time" value={form.time} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-medium">Nearest tube station</label>
            <input type="text" name="station" value={form.station} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="e.g. Angel" />
          </div>
          <div>
            <label className="block font-medium">Address / Postcode</label>
            <input type="text" name="address" value={form.address} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="e.g. N1 1AA or 123 Main St" />
          </div>
          <div>
            <label className="block font-medium">Cuisine</label>
            <input type="text" name="cuisine" value={form.cuisine} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Italian, Mexican, etc." />
          </div>
          <div>
            <label className="block font-medium">Protein</label>
            <input type="text" name="protein" value={form.protein} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Chicken, Beef, etc." />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-medium">Spice level</label>
            <div className="flex items-center gap-2 mt-1">
              {[0,1,2,3].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSpice(level)}
                  className={`flex items-center justify-center px-4 py-2 rounded-full border transition-colors duration-200 ${
                    form.spiceLevel === level ? 'bg-rose-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {level === 0 ? 'Karen' : '🌶'.repeat(level)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-medium">Guests may arrive up to (minutes) late</label>
            <input type="number" name="bufferTime" value={form.bufferTime} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-medium">Dress code / theme</label>
            <input type="text" name="dressCode" value={form.dressCode} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="e.g. Smart casual" />
          </div>
          <div>
            <label className="block font-medium">Chairs</label>
            <input type="number" name="capacity" value={form.capacity} onChange={handleChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-medium">Anonymous mode</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="checkbox" name="isAnonymous" checked={form.isAnonymous} onChange={handleChange} />
              <span>Hide guest names</span>
            </div>
          </div>
          <div>
            <label className="block font-medium">Theme</label>
            <div className="flex items-center gap-2 mt-1">
              {['white','black'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key)}
                  className={`px-4 py-2 rounded-full border transition-colors duration-200 ${
                    form.theme === key ? 'bg-rose-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block font-medium">Hero image URL (optional)</label>
            <input type="url" name="imageUrl" value={form.imageUrl} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="https://example.com/image.jpg" />
          </div>
        </div>
        <button
          onClick={createEvent}
          className="w-full py-3 rounded-xl text-white font-medium transition-colors duration-200"
          style={{ backgroundColor: accentColor }}
        >
          Create and Send Invites
        </button>
        <Toast message={toast.message} show={toast.show} />
      </div>
    </div>
  );
}

export default App;
