import React, { useState, useEffect } from 'react';

const bottleOptions = ['Red', 'White', 'Bubbles', 'Rosé', 'Non-Alcoholic'];
const dietOptions = ['None','Vegan','Halal','Gluten-Free','Nut-Free','Dairy-Free'];

function formatDateForICS(date, time) {
  const [year, month, day] = date.split('-');
  const [hour, minute] = time.split(':');
  return year + month + day + 'T' + hour + minute + '00';
}

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
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'event.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function RsvpForm({ event, guests, capacity, addGuest }) {
  const [name, setName] = useState('');
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [bottle, setBottle] = useState(bottleOptions[0]);

  const toggleDiet = (diet) => {
    setSelectedDiets((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
    setName('');
    setSelectedDiets([]);
    setBottle(bottleOptions[0]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
          <p className="text-gray-700"><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
          <p className="text-gray-700"><strong>Time:</strong> {event.time}</p>
          <p className="text-gray-700"><strong>Location:</strong> {event.station}</p>
          {event.dressCode && <p className="text-gray-700"><strong>Dress code/theme:</strong> {event.dressCode}</p>}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">RSVP</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                    className={`border rounded px-2 py-1 ${
                      selectedDiets.includes(diet) ? 'bg-green-500 text-white' : 'bg-gray-200'
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
                value={bottle}
                onChange={(e) => setBottle(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                {bottleOptions.map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded">
              RSVP
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function App() {
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
    anonymous: false,
  });
  const [guests, setGuests] = useState([]);
  const [hostLink, setHostLink] = useState('');
  const [rsvpLink, setRsvpLink] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event');
    if (eventId) {
      const stored = localStorage.getItem('apertif_event_' + eventId);
      if (stored) {
        const data = JSON.parse(stored);
        setForm(data.event);
        setGuests(data.guests || []);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const setSpice = (level) => {
    setForm((prev) => ({ ...prev, spiceLevel: level }));
  };

  const createEvent = () => {
    if (!form.title || !form.date || !form.time || !form.station) {
      alert('Please fill all required fields');
      return;
    }
    const eventId = Math.random().toString(36).substring(2, 10);
    localStorage.setItem('apertif_event_' + eventId, JSON.stringify({ event: form, guests: [] }));
    const base = window.location.origin + window.location.pathname;
    const hostUrl = `${base}?event=${eventId}`;
    const rsvpUrl = `${base}?event=${eventId}&rsvp=1`;
    setHostLink(hostUrl);
    setRsvpLink(rsvpUrl);
  };

  const addGuest = (guest) => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event');
    setGuests((prev) => {
      const updated = [...prev, guest];
      if (eventId) {
        localStorage.setItem('apertif_event_' + eventId, JSON.stringify({ event: form, guests: updated }));
      }
      return updated;
    });
  };

  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('event');
  const isRsvp = params.get('rsvp') === '1';

  if (eventId && isRsvp) {
    return <RsvpForm event={form} guests={guests} capacity={form.capacity} addGuest={addGuest} />;
  }

  if (eventId) {
    const guestCount = guests.length;
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8">
        <div className="w-full max-w-2xl space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
            <p className="text-gray-700"><strong>Date:</strong> {form.date}</p>
            <p className="text-gray-700"><strong>Time:</strong> {form.time}</p>
            <p className="text-gray-700"><strong>Location:</strong> {form.station}</p>
            {form.cuisine && <p className="text-gray-700"><strong>Cuisine:</strong> {form.cuisine}</p>}
            {form.protein && <p className="text-gray-700"><strong>Protein:</strong> {form.protein}</p>}
            <p className="text-gray-700"><strong>Spice level:</strong> {form.spiceLevel === 0 ? 'Mild' : '🌶'.repeat(form.spiceLevel)}</p>
            {form.bufferTime && <p className="text-gray-700"><strong>Additional buffer time:</strong> {form.bufferTime} minutes</p>}
            {form.dressCode && <p className="text-gray-700"><strong>Dress code/theme:</strong> {form.dressCode}</p>}
            {form.capacity && <p className="text-gray-700"><strong>Capacity:</strong> {form.capacity}</p>}
            <button
              onClick={() => downloadIcs(form)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Add to calendar
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">
              Guest List ({guestCount}{form.capacity ? '/' + form.capacity : ''})
            </h2>
            {guestCount > 0 ? (
              <ul className="space-y-2">
                {guests.map((g, i) => (
                  <li
                    key={i}
                    className="border rounded p-2 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-semibold">
                      {form.anonymous ? `Guest ${i + 1}` : g.name}
                    </span>
                    <span className="text-gray-600">
                      {g.diet.length > 0 ? g.diet.join(', ') + ' · ' : ''}
                      {g.bottle}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No guests yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-4">Create Your Dinner Party</h1>
          <div className="space-y-4">
            <div>
              <label className="block font-medium">Party name</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                placeholder="Dinner party name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium">Time</label>
                <input
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium">Nearest tube station</label>
              <input
                type="text"
                name="station"
                value={form.station}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g. Angel"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium">Cuisine</label>
                <input
                  type="text"
                  name="cuisine"
                  value={form.cuisine}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Italian, Mexican, etc."
                />
              </div>
              <div>
                <label className="block font-medium">Protein</label>
                <input
                  type="text"
                  name="protein"
                  value={form.protein}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Chicken, Beef, etc."
                />
              </div>
            </div>
            <div>
              <label className="block font-medium">Spice level</label>
              <div className="flex gap-2 mt-1">
                {[0, 1, 2, 3].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSpice(level)}
                    className={`flex-1 py-1 rounded border ${
                      form.spiceLevel === level ? 'bg-red-500 text-white' : 'bg-gray-200'
                    }`}
                  >
                    {level === 0 ? 'Mild' : '🌶'.repeat(level)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium">Additional buffer time (minutes)</label>
                <input
                  type="number"
                  name="bufferTime"
                  value={form.bufferTime}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                />
              </div>
              <div>
                <label className="block font-medium">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  min="1"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium">Dress code / theme</label>
              <input
                type="text"
                name="dressCode"
                value={form.dressCode}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                placeholder="e.g. Smart casual"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="anonymous"
                checked={form.anonymous}
                onChange={handleChange}
                id="anon"
                className="mr-2"
              />
              <label htmlFor="anon" className="font-medium">
                Anonymous (hide guest names)
              </label>
            </div>
            <button
              type="button"
              onClick={createEvent}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded"
            >
              Create event
            </button>
            {hostLink && (
              <div className="mt-4">
                <p className="font-medium">Host link</p>
                <input
                  type="text"
                  readOnly
                  value={hostLink}
                  className="w-full border rounded px-3 py-2 mb-2"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(hostLink);
                    alert('Host link copied!');
                  }}
                  className="bg-gray-700 text-white px-2 py-1 rounded"
                >
                  Copy host link
                </button>
              </div>
            )}
            {rsvpLink && (
              <div className="mt-4">
                <p className="font-medium">RSVP link</p>
                <input
                  type="text"
                  readOnly
                  value={rsvpLink}
                  className="w-full border rounded px-3 py-2 mb-2"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(rsvpLink);
                    alert('RSVP link copied!');
                  }}
                  className="bg-gray-700 text-white px-2 py-1 rounded"
                >
                  Copy RSVP link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
