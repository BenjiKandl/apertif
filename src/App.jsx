import React, { useState, useEffect } from 'react';
const bottleOptions = ['Red','White','Bubbles','Rosé','Non-Alcoholic'];
const dietOptions = ['None','Vegan','Halal','Gluten-Free','Nut-Free','Dairy-Free'];


function formatDateForICS(date, time) {
  const parts = date.split('-');
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  const [hour, minute] = time.split(':');
  return year + month + day + 'T' + hour + minute + '00';
}

function downloadIcs(event) {
  const dt = formatDateForICS(event.date, event.time);
  let icsContent = 'BEGIN:VCALENDAR\n' +
    'VERSION:2.0\n' +
    'BEGIN:VEVENT\n' +
    'DTSTART:' + dt + '\n' +
    'DTEND:' + dt + '\n' +
    'SUMMARY:' + event.title + '\n' +
    'LOCATION:' + event.station + '\n';
  if (event.dressCode) {
    icsContent += 'DESCRIPTION:Dress code / theme: ' + event.dressCode + '\n';
  }
  icsContent += 'END:VEVENT\nEND:VCALENDAR';
  const blob = new Blob([icsContent], {type:'text/calendar'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'dinner_party.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function RsvpForm({ event, uri, onNewGuest }) {
  const [name, setName] = useState('');
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [bottle, setBottle] = useState(bottleOptions[0]);

  const toggleDiet = (diet) => {
    setSelectedDiets(prev => prev.includes(diet) ? prev.filter(d => d !== diet) : [...prev, diet]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    const guest = { name: name.trim(), diet: selectedDiets, bottle };
    try {
      const res = await fetch(uri);
      const data = await res.json();
      const updatedGuests = data.guests ? [...data.guests, guest] : [guest];
      await fetch(uri, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: data.event, guests: updatedGuests })
      });
      onNewGuest(updatedGuests);
      setName('');
      setSelectedDiets([]);
      setBottle(bottleOptions[0]);
      alert('RSVP submitted!');
    } catch (err) {
      console.error(err);
      alert('Could not submit RSVP');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-2">{event.title}</h2>
      <p className="mb-2">{event.date} at {event.time}</p>
      <p className="mb-2">Location: {event.station}</p>
      <p className="mb-2">Cuisine: {event.cuisine}</p>
      <p className="mb-2">Protein: {event.protein}</p>
      <p className="mb-2">Spice: {event.spiceLevel === 0 ? 'Mild' : '🌶'.repeat(event.spiceLevel)}</p>
      {event.dressCode && <p className="mb-2">Dress code / theme: {event.dressCode}</p>}
      {event.bufferTime && <p className="mb-2">Additional buffer time: {event.bufferTime} minutes</p>}
      <h3 className="text-lg font-semibold mt-4">RSVP</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full border rounded px-2 py-1"
        />
        <div>
          <p className="font-medium">Dietary preferences:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {dietOptions.map((diet) => (
              <button
                type="button"
                key={diet}
                onClick={() => toggleDiet(diet)}
                className={`px-2 py-1 rounded border ${selectedDiets.includes(diet) ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                {diet}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="font-medium">Bottle you'll bring:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {bottleOptions.map((b) => (
              <button
                type="button"
                key={b}
                onClick={() => setBottle(b)}
                className={`px-2 py-1 rounded border ${bottle === b ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Submit RSVP</button>
      </form>
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
    capacity: '',
    bufferTime: '',
    dressCode: '',
    anonymous: false
  });
  const [eventUri, setEventUri] = useState('');
  const [eventData, setEventData] = useState(null);
  const [guestList, setGuestList] = useState([]);
  const [view, setView] = useState('create');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventParam = params.get('event');
    const isHost = params.get('host');
    const isRsvp = params.get('rsvp');
    if (eventParam) {
      const decoded = decodeURIComponent(eventParam);
      fetch(decoded)
        .then(res => res.json())
        .then(data => {
          setEventData(data.event);
          setGuestList(data.guests || []);
          setEventUri(decoded);
          if (isHost) {
            setView('host');
          } else {
            setView('rsvp');
          }
        })
        .catch(err => console.error(err));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const setSpice = (level) => {
    setForm(prev => ({ ...prev, spiceLevel: level }));
  };

  const createEvent = async () => {
    if (!form.title || !form.date || !form.time || !form.station || !form.capacity) {
      alert('Please fill out required fields');
      return;
    }
    try {
      const response = await fetch('https://api.jsonstorage.net/v1/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: form, guests: [] })
      });
      const data = await response.json();
      const uri = data.uri || data.url || data.link;
      if (!uri) {
        alert('Failed to create event');
        return;
      }
      setEventUri(uri);
      setEventData(form);
      setGuestList([]);
      setView('host');
      const encoded = encodeURIComponent(uri);
      const hostLink = window.location.origin + '?event=' + encoded + '&host=1';
      const rsvpLink = window.location.origin + '?event=' + encoded + '&rsvp=1';
      navigator.clipboard.writeText(rsvpLink).catch(() => {});
      alert('Event created! RSVP link copied to clipboard: ' + rsvpLink);
    } catch (err) {
      console.error(err);
      alert('Error creating event');
    }
  };

  const handleNewGuests = (list) => {
    setGuestList(list);
  };

  if (view === 'rsvp' && eventData) {
    return <RsvpForm event={eventData} uri={eventUri} onNewGuest={handleNewGuests} />;
  }

  if (view === 'host' && eventData) {
    const encoded = encodeURIComponent(eventUri);
    const hostLink = window.location.origin + '?event=' + encoded + '&host=1';
    const rsvpLink = window.location.origin + '?event=' + encoded + '&rsvp=1';
    const spiceText = eventData.spiceLevel === 0 ? 'Mild' : '🌶'.repeat(eventData.spiceLevel);
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">{eventData.title}</h1>
        <p className="mb-1">Date: {eventData.date}</p>
        <p className="mb-1">Time: {eventData.time}</p>
        <p className="mb-1">Location: {eventData.station}</p>
        <p className="mb-1">Cuisine: {eventData.cuisine}</p>
        <p className="mb-1">Protein: {eventData.protein}</p>
        <p className="mb-1">Spice level: {spiceText}</p>
        {eventData.dressCode && <p className="mb-1">Dress code / theme: {eventData.dressCode}</p>}
        {eventData.bufferTime && <p className="mb-1">Additional buffer time: {eventData.bufferTime} minutes</p>}
        <p className="mb-4">Capacity: {eventData.capacity}</p>
        <div className="mb-4">
          <button onClick={() => navigator.clipboard.writeText(hostLink)} className="mr-2 px-3 py-1 bg-blue-500 text-white rounded">Copy host link</button>
          <button onClick={() => navigator.clipboard.writeText(rsvpLink)} className="px-3 py-1 bg-green-500 text-white rounded">Copy RSVP link</button>
        </div>
        <button onClick={() => downloadIcs(eventData)} className="px-3 py-1 bg-purple-500 text-white rounded mb-4">Add to calendar</button>
        <h2 className="text-xl font-semibold mt-4">Guest list</h2>
        <ul className="mt-2">
          {guestList.length === 0 && <li>No guests yet</li>}
          {guestList.map((guest, idx) => (
            <li key={idx} className="border-b py-2">
              {eventData.anonymous ? `Guest ${idx + 1}` : guest.name} – Bottle: {guest.bottle}{guest.diet && guest.diet.length > 0 ? ' – Diet: ' + guest.diet.join(', ') : ''}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Plan your dinner party</h1>
      <div className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block font-medium">Event name</label>
          <input type="text" name="title" value={form.title} onChange={handleChange} className="w-full border rounded px-2 py-1" />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-medium">Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div className="flex-1">
            <label className="block font-medium">Time</label>
            <input type="time" name="time" value={form.time} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
        </div>
        <div>
          <label className="block font-medium">Nearest tube station</label>
          <input type="text" name="station" value={form.station} onChange={handleChange} className="w-full border rounded px-2 py-1" placeholder="e.g. Angel" />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-medium">Cuisine</label>
            <input type="text" name="cuisine" value={form.cuisine} onChange={handleChange} className="w-full border rounded px-2 py-1" placeholder="e.g. Italian" />
          </div>
          <div className="flex-1">
            <label className="block font-medium">Protein</label>
            <input type="text" name="protein" value={form.protein} onChange={handleChange} className="w-full border rounded px-2 py-1" placeholder="e.g. Chicken" />
          </div>
        </div>
        <div>
          <label className="block font-medium">Spice level</label>
          <div className="flex space-x-2 mt-1">
            {[0,1,2,3].map(level => (
              <button
                type="button"
                key={level}
                onClick={() => setSpice(level)}
                className={`flex-1 py-1 rounded border ${form.spiceLevel === level ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
              >
                {level === 0 ? 'Mild' : '🌶'.repeat(level)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block font-medium">Capacity</label>
          <input type="number" name="capacity" value={form.capacity} onChange={handleChange} className="w-full border rounded px-2 py-1" min="1" />
        </div>
        <div>
          <label className="block font-medium">Additional buffer time (minutes)</label>
          <input type="number" name="bufferTime" value={form.bufferTime} onChange={handleChange} className="w-full border rounded px-2 py-1" placeholder="e.g. 15" />
        </div>
        <div>
          <label className="block font-medium">Dress code / theme (optional)</label>
          <input type="text" name="dressCode" value={form.dressCode} onChange={handleChange} className="w-full border rounded px-2 py-1" placeholder="e.g. Smart casual or Garden party" />
        </div>
        <div className="flex items-center">
          <input type="checkbox" name="anonymous" checked={form.anonymous} onChange={handleChange} id="anon" className="mr-2" />
          <label htmlFor="anon">Anonymous mode (hide guest names)</label>
        </div>
        <button onClick={createEvent} className="w-full bg-blue-600 text-white py-2 rounded">Create and get links</button>
      </div>
    </div>
  );
}

export default App;
