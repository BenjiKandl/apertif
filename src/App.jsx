import React, { useState, useEffect } from 'react';

// Bottle and dietary options available to guests
const bottleOptions = ['Red','White','Bubbles','Rosé','Non‑Alcoholic'];
const dietOptions = ['None','Vegan','Halal','Gluten‑Free','Nut‑Free','Dairy‑Free'];

// Theme definitions for the app. Each theme defines a gradient background and
// a set of accent colours used for progress bars and buttons. Should you add
// more themes in the future, be sure to provide both a gradient class
// (without the "bg-gradient-to-br" prefix) and a primary colour hex code.
const themes = {
  blush: {
    gradient: 'from-pink-50 via-purple-50 to-pink-100',
    primary: '#f87171',      // rose-400
    light: '#fecaca'         // rose-200
  },
  mint: {
    gradient: 'from-green-50 via-blue-50 to-green-100',
    primary: '#34d399',      // green-400
    light: '#bbf7d0'         // green-200
  },
  sunset: {
    gradient: 'from-orange-50 via-red-50 to-yellow-100',
    primary: '#f59e0b',      // amber-500
    light: '#fde68a'         // amber-200
  }
};

// Format a date and time into an iCal timestamp (UTC). The event is assumed
// to occur within a single day so DTSTART and DTEND are identical.
function formatDateForICS(date, time) {
  const [year, month, day] = date.split('-');
  const [hour, minute] = time.split(':');
  return year + month + day + 'T' + hour + minute + '00';
}

// Download an iCal file for the given event. The event parameter is expected
// to include title, date, time, station and optional dressCode fields.
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
  const link = document.createElement('a');
  link.href = url;
  link.download = 'event.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate a pastel colour for an avatar based on the guest name. This helps
// differentiate guests in the list. Colours are chosen deterministically.
function getAvatarClass(name) {
  const pastelClasses = [
    'bg-pink-300','bg-purple-300','bg-green-300','bg-yellow-300','bg-blue-300'
  ];
  const index = name ? name.charCodeAt(0) % pastelClasses.length : 0;
  return pastelClasses[index];
}

// A small toast component that slides in at the bottom of the screen. It
// accepts a message and a flag indicating whether it should be visible.
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

// RSVP form component. It is displayed when a guest follows the RSVP link.
// Guests can enter their name, select dietary restrictions and choose a bottle
// to bring. When submitted, the new guest is added to the guest list.
function RsvpForm({ event, guests, capacity, addGuest, showToast, theme }) {
  const [name, setName] = useState('');
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [bottle, setBottle] = useState(bottleOptions[0]);

  // Track whether the guest has decided to attend. Values: 'undecided', 'yes', 'no'
  const [decision, setDecision] = useState('undecided');

  const toggleDiet = (diet) => {
    setSelectedDiets((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Only allow submission if the guest has agreed to attend
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
    // Reset form and decision state after submission
    setName('');
    setSelectedDiets([]);
    setBottle(bottleOptions[0]);
    setDecision('undecided');
    showToast('RSVP submitted! 🥂');
  };

  // Determine background gradient classes from theme
  const bgGradient = themes[theme]?.gradient || themes.blush.gradient;

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
          {/* Only reveal cuisine, protein and spice level once the guest has chosen to attend */}
          {decision === 'yes' && event.cuisine && (
            <p className="text-gray-700"><strong>Cuisine:</strong> {event.cuisine}</p>
          )}
          {decision === 'yes' && event.protein && (
            <p className="text-gray-700"><strong>Protein:</strong> {event.protein}</p>
          )}
          {decision === 'yes' && event.spiceLevel !== undefined && (
            <p className="text-gray-700"><strong>Spice level:</strong> {event.spiceLevel === 0 ? 'Mild' : '🌶'.repeat(event.spiceLevel)}</p>
          )}
          {/* Politely describe the allowed lateness if a buffer is set */}
          {decision === 'yes' && event.bufferTime && (
            <p className="text-gray-700"><strong>You can arrive up to:</strong> {event.bufferTime} minutes late</p>
          )}
          {decision === 'yes' && event.dressCode && (
            <p className="text-gray-700"><strong>Dress code:</strong> {event.dressCode}</p>
          )}
        </div>
        {/* Attendance prompt, decline message, or RSVP form depending on guest decision */}
        {decision === 'undecided' && (
          <div className="space-y-3">
            <p className="text-lg font-medium">Will you attend this dinner?</p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setDecision('yes')}
                className="flex-1 py-2 rounded-md text-white transition-colors duration-200"
                style={{ backgroundColor: themes[theme]?.primary || themes.blush.primary }}
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
        {decision === 'no' && (
          <div className="space-y-2">
            <p className="text-gray-700">No worries, thanks for letting us know. Maybe next time!</p>
          </div>
        )}
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
              style={{ backgroundColor: themes[theme]?.primary || themes.blush.primary }}
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
// between host and RSVP pages. All data is stored locally in the browser
// using localStorage under a unique event ID.
function App() {
  // Form state for creating or displaying an event
  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    station: '',
    cuisine: '',
    protein: '',
    spiceLevel: 0,
    bufferTime: '',
    dressCode: '',
    capacity: '',
    isAnonymous: false,
    theme: 'blush',
    imageUrl: ''
  });
  const [guests, setGuests] = useState([]);
  const [eventId, setEventId] = useState(null);
  const [isRsvp, setIsRsvp] = useState(false);
  const [toast, setToast] = useState({ message: '', show: false });

  // Read URL parameters on initial load to determine host vs RSVP view
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
  }, []);

  // Generic change handler for form fields
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Set spice level (0‑3) when user clicks a chilli
  const setSpice = (level) => {
    setForm((prev) => ({ ...prev, spiceLevel: level }));
  };

  // Set theme when user selects a new option
  const setTheme = (theme) => {
    setForm((prev) => ({ ...prev, theme }));
  };

  // Create a new event and save it to localStorage. Generates a unique ID
  // based on the current timestamp. After saving, updates the URL with the
  // event ID and clears any RSVP flag.
  const createEvent = () => {
    if (!form.title || !form.date || !form.time || !form.station) {
      alert('Please fill in at least the party name, date, time and location');
      return;
    }
    const id = Date.now().toString();
    const data = { event: form, guests };
    localStorage.setItem('apertif_event_' + id, JSON.stringify(data));
    setEventId(id);
    // update URL to include event id and remove rsvp param
    const url = new URL(window.location.href);
    url.searchParams.set('event', id);
    url.searchParams.delete('rsvp');
    window.history.pushState({}, '', url.toString());
    showToast('Event created! 🎉');
  };

  // Add a guest to the list and persist to localStorage
  const addGuest = (guest) => {
    setGuests((prev) => {
      const updated = [...prev, guest];
      // persist
      if (eventId) {
        localStorage.setItem('apertif_event_' + eventId, JSON.stringify({ event: form, guests: updated }));
      }
      return updated;
    });
  };

  // Show a toast notification with the provided message
  const showToast = (message) => {
    setToast({ message, show: true });
    setTimeout(() => {
      setToast({ message: '', show: false });
    }, 3000);
  };

  // Copy a link to the clipboard and notify the user
  const copyLink = (link) => {
    navigator.clipboard.writeText(link).then(() => {
      showToast('Link copied!');
    });
  };

  // Determine gradient classes and accent colours based on selected theme
  const themeBg = themes[form.theme]?.gradient || themes.blush.gradient;
  const accentColor = themes[form.theme]?.primary || themes.blush.primary;
  const accentLight = themes[form.theme]?.light || themes.blush.light;

  // If in RSVP mode and eventId exists, show the RSVP form
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
        />
        <Toast message={toast.message} show={toast.show} />
      </>
    );
  }

  // Host view: display event details, guest list and share tools
  if (eventId) {
    const guestCount = guests.length;
    const capacityNum = parseInt(form.capacity || '0', 10);
    // Build host and RSVP links
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
            {form.cuisine && <p className="text-gray-700"><strong>Cuisine:</strong> {form.cuisine}</p>}
            {form.protein && <p className="text-gray-700"><strong>Protein:</strong> {form.protein}</p>}
            <p className="text-gray-700"><strong>Spice level:</strong> {form.spiceLevel === 0 ? 'Mild' : '🌶'.repeat(form.spiceLevel)}</p>
            {form.bufferTime && <p className="text-gray-700"><strong>You can arrive up to:</strong> {form.bufferTime} minutes late</p>}
            {form.dressCode && <p className="text-gray-700"><strong>Dress code:</strong> {form.dressCode}</p>}
            {form.capacity && <p className="text-gray-700"><strong>Capacity:</strong> {form.capacity}</p>}
          </div>
          {/* Progress bar showing guest count vs capacity */}
          {form.capacity && (
            <div>
              <div className="mb-1 text-sm text-gray-700">Guest count: {guestCount} / {form.capacity}</div>
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
                        {form.isAnonymous ? ( 'Guest ' + (index + 1) ) : guest.name}
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
          </div>
        </div>
        <Toast message={toast.message} show={toast.show} />
      </div>
    );
  }

  // Event creation form for host before saving. Allows theme and image URL selection.
  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeBg} bg-fixed flex flex-col items-center`}> 
      <div className="mt-8 p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg w-full max-w-2xl space-y-6">
        {/* Use Apertif branding instead of a generic title */}
        <h1 className="text-4xl font-bold text-center" style={{ color: themes[form.theme || 'blush']?.primary || themes.blush.primary }}>Apertif</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Party name</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Dinner party name" />
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
                  {level === 0 ? 'Mild' : '🌶'.repeat(level)}
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
            <label className="block font-medium">Capacity</label>
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
            <select name="theme" value={form.theme} onChange={(e) => setTheme(e.target.value)} className="w-full border rounded px-3 py-2">
              {Object.keys(themes).map((key) => (
                <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
              ))}
            </select>
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
          Create and get links
        </button>
        <Toast message={toast.message} show={toast.show} />
      </div>
    </div>
  );
}

export default App;
