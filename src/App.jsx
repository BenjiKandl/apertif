import { useState, useEffect } from 'react';

function App() {
  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    station: '',
    cuisine: '',
    protein: '',
    spiceLevel: 0,
    capacity: 10,
    arrivalSlotsEnabled: false,
    isAnonymous: false,
  });
  const [eventUri, setEventUri] = useState('');
  const [guests, setGuests] = useState([]);
  const [hostLink, setHostLink] = useState('');
  const [rsvpLink, setRsvpLink] = useState('');

  const params = new URLSearchParams(window.location.search);
  const eventParam = params.get('event');
  const isHost = params.get('host') === '1';
  const isRsvp = params.get('rsvp') === '1';

  useEffect(() => {
    if (eventParam) {
      const uri = decodeURIComponent(eventParam);
      setEventUri(uri);
      fetch(uri)
        .then(res => res.json())
        .then(data => {
          if (data.event) setForm(data.event);
          if (data.guests) setGuests(data.guests);
        });
    }
  }, [eventParam]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const setSpice = (level) => setForm(prev => ({ ...prev, spiceLevel: level }));

  const createEvent = () => {
    const payload = { event: form, guests: [] };
    fetch('https://api.jsonstorage.net/v1/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(data => {
        const uri = data.uri;
        setEventUri(uri);
        const encoded = encodeURIComponent(uri);
        const base = window.location.origin + window.location.pathname;
        setHostLink(`${base}?event=${encoded}&host=1`);
        setRsvpLink(`${base}?event=${encoded}&rsvp=1`);
        alert('Event created! Copy your links below.');
      });
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard.');
  };

  if (eventParam && isRsvp) {
    return <RsvpForm event={form} eventUri={eventUri} guests={guests} setGuests={setGuests} />;
  }

  if (eventParam && isHost) {
    return (
      <div className="p-4 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
        <p className="mb-1"><strong>Date:</strong> {form.date}</p>
        <p className="mb-1"><strong>Time:</strong> {form.time}</p>
        <p className="mb-1"><strong>Nearest station:</strong> {form.station}</p>
        <p className="mb-1"><strong>Cuisine:</strong> {form.cuisine}</p>
        <p className="mb-4"><strong>Protein:</strong> {form.protein}</p>
        <h2 className="text-xl font-semibold mb-2">Guests ({guests.length}/{form.capacity})</h2>
        <ul className="mb-4">
          {guests.map((g, i) => (
            <li key={g.id} className="border-b py-1">
              <span className="font-medium">{form.isAnonymous ? `Guest ${i + 1}` : g.name || `Guest ${i + 1}`}</span>
              {g.dietary && <span className="ml-2 italic text-sm">({g.dietary})</span>}
            </li>
          ))}
        </ul>
        <div className="space-y-2">
          <button onClick={() => copyLink(hostLink)} className="w-full bg-green-600 text-white py-2 rounded">Copy Host Link</button>
          <button onClick={() => copyLink(rsvpLink)} className="w-full bg-purple-600 text-white py-2 rounded">Copy RSVP Link</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Plan your dinner party</h1>
      <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
        <div>
          <label className="block mb-1 font-medium">Event name</label>
          <input name="title" value={form.title} onChange={handleChange} className="w-full border rounded px-2 py-1" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Time</label>
            <input type="time" name="time" value={form.time} onChange={handleChange} className="w-full border rounded px-2 py-1" />
          </div>
        </div>
        <div>
          <label className="block mb-1 font-medium">Nearest tube station</label>
          <input name="station" value={form.station} onChange={handleChange} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Cuisine</label>
          <input name="cuisine" value={form.cuisine} onChange={handleChange} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Protein</label>
          <input name="protein" value={form.protein} onChange={handleChange} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Spice level</label>
          <div className="flex space-x-2">
            {[0,1,2,3].map(level => (
              <button key={level} type="button" onClick={() => setSpice(level)}
                className={`flex-1 py-1 border rounded ${form.spiceLevel===level ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                {level===0 ? 'Mild' : '🌶'.repeat(level)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block mb-1 font-medium">Capacity</label>
          <input type="number" name="capacity" value={form.capacity} onChange={handleChange} className="w-full border rounded px-2 py-1" />
        </div>
        <div className="flex items-center">
          <input type="checkbox" name="arrivalSlotsEnabled" checked={form.arrivalSlotsEnabled} onChange={handleChange} className="mr-2" />
          <label className="font-medium">Enable arrival slots</label>
        </div>
        <div className="flex items-center">
          <input type="checkbox" name="isAnonymous" checked={form.isAnonymous} onChange={handleChange} className="mr-2" />
          <label className="font-medium">Anonymous mode</label>
        </div>
        <button onClick={createEvent} className="w-full bg-blue-600 text-white py-2 rounded">Create and get links</button>
      </div>
      {hostLink && (
        <div className="mt-4 space-y-2">
          <button onClick={() => copyLink(hostLink)} className="w-full bg-green-600 text-white py-2 rounded">Copy Host Link</button>
          <button onClick={() => copyLink(rsvpLink)} className="w-full bg-purple-600 text-white py-2 rounded">Copy RSVP Link</button>
        </div>
      )}
    </div>
  );
}

function RsvpForm({ event, eventUri, guests, setGuests }) {
  const [name, setName] = useState('');
  const [dietary, setDietary] = useState('');
  const [bottle, setBottle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const newGuest = {
      id: Date.now(),
      name: name.trim(),
      dietary,
      bottle,
    };
    const updatedGuests = [...guests, newGuest];
    // Update remote
    fetch(eventUri)
      .then(res => res.json())
      .then(data => {
        data.guests = updatedGuests;
        fetch(eventUri, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        .then(() => {
          setGuests(updatedGuests);
          setSubmitting(false);
          alert('Thanks for RSVPing!');
        });
      });
  };
  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">RSVP for {event.title}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md space-y-4">
        <div>
          <label className="block mb-1 font-medium">Your name (optional)</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Dietary preference</label>
          <input value={dietary} onChange={e => setDietary(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Bottle you’ll bring</label>
          <input value={bottle} onChange={e => setBottle(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-2 rounded">
          {submitting ? 'Submitting...' : 'Submit RSVP'}
        </button>
      </form>
    </div>
  );
}

export default App;
