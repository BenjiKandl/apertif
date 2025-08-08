import React, { useState, useEffect } from 'react';

const dietOptions = ['Vegetarian', 'Vegan', 'Halal', 'No nuts', 'No gluten'];
const bottleOptions = ['Red wine', 'White wine', 'Rosé', 'Bubbles', 'Non-alcoholic'];

function getWineSuggestion(spiceLevel, protein) {
  if (!protein) return '';
  const suggestions = {
    Chicken: ['Chardonnay', 'Sauvignon Blanc', 'Riesling', 'Pinot Noir'],
    Beef: ['Cabernet Sauvignon', 'Merlot', 'Syrah', 'Malbec'],
    Fish: ['Sauvignon Blanc', 'Pinot Gris', 'Champagne', 'Rosé'],
    Vegetable: ['Pinot Grigio', 'Chenin Blanc', 'Rosé', 'Sparkling'],
    Pork: ['Pinot Noir', 'Grenache', 'Rosé', 'Cava'],
    Lamb: ['Syrah', 'Malbec', 'Cabernet Franc', 'Pinot Noir']
  };
  const wines = suggestions[protein] || [];
  return wines[spiceLevel % wines.length] || '';
}

function formatDateForICS(date) {
  const dt = new Date(date);
  return dt.toISOString().replace(/-|:|\.\d+/g, '');
}

function downloadIcs(title, description, startDateTime, location) {
  const dtStart = formatDateForICS(startDateTime);
  const dtEnd = dtStart;
  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    location ? `LOCATION:${location}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function RsvpPage({ event, onSubmit }) {
  const [name, setName] = useState('');
  const [selectedDiet, setSelectedDiet] = useState([]);
  const [bottle, setBottle] = useState('');

  const toggleDiet = (option) => {
    setSelectedDiet(prev =>
      prev.includes(option) ? prev.filter(d => d !== option) : [...prev, option]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: name.trim() || 'Anonymous',
      dietaries: selectedDiet,
      bottle
    });
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4">RSVP for {event.title}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Name (optional)</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full border px-2 py-1 rounded"/>
        </div>
        <div>
          <label className="block mb-1 font-medium">Dietary restrictions</label>
          <div className="flex flex-wrap gap-2">
            {dietOptions.map(opt => (
              <button key={opt} type="button" onClick={() => toggleDiet(opt)}
                className={selectedDiet.includes(opt)
                  ? 'px-3 py-1 rounded-full bg-blue-500 text-white'
                  : 'px-3 py-1 rounded-full bg-gray-200'}>
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block mb-1 font-medium">Bottle you'll bring</label>
          <select value={bottle} onChange={e => setBottle(e.target.value)}
            className="w-full border px-2 py-1 rounded">
            <option value="">Select a bottle...</option>
            {bottleOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded w-full">Submit RSVP</button>
      </form>
    </div>
  );
}

function App() {
  const initialState = {
    title: '',
    date: '',
    borough: '',
    postcode: '',
    cuisine: '',
    protein: '',
    spiceLevel: 0,
    capacity: 10,
    arrivalSlots: false,
    anonymous: false
  };
  const [event, setEvent] = useState(() => {
    const stored = localStorage.getItem('event');
    return stored ? JSON.parse(stored) : initialState;
  });
  const [guests, setGuests] = useState(() => {
    const stored = localStorage.getItem('guests');
    return stored ? JSON.parse(stored) : [];
  });
  const [showRsvp, setShowRsvp] = useState(() => {
    return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('rsvp') !== null;
  });
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem('event', JSON.stringify(event));
  }, [event]);
  useEffect(() => {
    localStorage.setItem('guests', JSON.stringify(guests));
  }, [guests]);

  const handleEventChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEvent(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRsvpSubmit = (guest) => {
    if (guests.length >= event.capacity) return;
    const arrivalIndex = event.arrivalSlots ? guests.length : null;
    setGuests(prev => [...prev, { ...guest, arrivalIndex }]);
    setShowRsvp(false);
  };

  const copyRsvpLink = () => {
    const url = window.location.origin + window.location.pathname + '?rsvp=1';
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleAddCalendarEvent = () => {
    const desc = `Dinner party at ${event.borough} ${event.postcode}\nCuisine: ${event.cuisine}\nProtein: ${event.protein}`;
    const loc = `${event.borough} ${event.postcode}`;
    downloadIcs(event.title || 'Dinner Party', desc, event.date, loc);
  };

  const handleAddArrivalSlot = (guest) => {
    if (!guest || guest.arrivalIndex === null) return;
    const minutes = guest.arrivalIndex * 10;
    const slotTime = new Date(new Date(event.date).getTime() + minutes * 60000);
    const title = `${event.title} arrival slot`;
    const desc = `Your arrival time for ${event.title}`;
    const loc = `${event.borough} ${event.postcode}`;
    downloadIcs(title, desc, slotTime.toISOString(), loc);
  };

  if (showRsvp) {
    return <RsvpPage event={event} onSubmit={handleRsvpSubmit} />;
  }

  const spiceIcons = () => {
    return [0,1,2,3].map(i => (
      <span key={i} onClick={() => setEvent(prev => ({ ...prev, spiceLevel: i }))}
        className={i <= event.spiceLevel ? 'text-red-600 cursor-pointer text-2xl' : 'text-gray-400 cursor-pointer text-2xl'}>
        🌶️
      </span>
    ));
  };

  const wineSuggestion = getWineSuggestion(event.spiceLevel, event.protein);

  const tubeTips = (borough) => {
    if (!borough) return '';
    const lower = borough.toLowerCase();
    if (lower.includes('camden')) return 'Nearest tube: Camden Town (Northern line)';
    if (lower.includes('westminster')) return 'Nearest tube: Westminster (District / Circle / Jubilee)';
    if (lower.includes('hackney')) return 'Overground stations: Hackney Central, Dalston Junction';
    return '';
  };

  const sunDescriptor = (() => {
    if (!event.date) return '';
    const dt = new Date(event.date);
    const hour = dt.getHours();
    if (hour < 6 || hour >= 20) return 'It will be dark at this time.';
    if (hour < 8 || hour >= 18) return 'Golden hour light!';
    return 'Expect daylight.';
  })();

  const dietaryCounts = dietOptions.reduce((acc, opt) => {
    acc[opt] = guests.filter(g => g.dietaries.includes(opt)).length;
    return acc;
  }, {});

  const bottleCounts = bottleOptions.reduce((acc, opt) => {
    acc[opt] = guests.filter(g => g.bottle === opt).length;
    return acc;
  }, {});

  return (
    <div className="p-4 max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Host your Dinner Party</h1>
      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Event title</label>
          <input name="title" value={event.title} onChange={handleEventChange}
            className="w-full border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="block font-medium mb-1">Date & Time</label>
          <input type="datetime-local" name="date" value={event.date} onChange={handleEventChange}
            className="w-full border px-2 py-1 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-medium mb-1">Borough</label>
            <input name="borough" value={event.borough} onChange={handleEventChange}
              className="w-full border px-2 py-1 rounded" />
          </div>
          <div>
            <label className="block font-medium mb-1">Postcode</label>
            <input name="postcode" value={event.postcode} onChange={handleEventChange}
              className="w-full border px-2 py-1 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-medium mb-1">Cuisine</label>
            <input name="cuisine" value={event.cuisine} onChange={handleEventChange}
              className="w-full border px-2 py-1 rounded" />
          </div>
          <div>
            <label className="block font-medium mb-1">Protein</label>
            <select name="protein" value={event.protein} onChange={handleEventChange}
              className="w-full border px-2 py-1 rounded">
              <option value="">Select protein...</option>
              {['Chicken','Beef','Fish','Vegetable','Pork','Lamb'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Spice level</label>
          <div className="flex gap-1">
            {spiceIcons()}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-medium mb-1">Capacity</label>
            <input type="number" name="capacity" value={event.capacity} onChange={handleEventChange}
              className="w-full border px-2 py-1 rounded" />
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input type="checkbox" id="arrivalSlots" name="arrivalSlots"
              checked={event.arrivalSlots} onChange={handleEventChange} />
            <label htmlFor="arrivalSlots" className="font-medium">Stagger arrivals</label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="anonymous" name="anonymous"
            checked={event.anonymous} onChange={handleEventChange} />
          <label htmlFor="anonymous" className="font-medium">Guests anonymous</label>
        </div>
        <div>
          <button onClick={copyRsvpLink} className="px-4 py-2 bg-blue-600 text-white rounded mr-2">Copy RSVP link</button>
          {copySuccess && <span className="text-sm text-green-600">Copied!</span>}
          <button onClick={handleAddCalendarEvent} className="px-4 py-2 bg-purple-600 text-white rounded">Add to calendar</button>
        </div>
      </div>

      {wineSuggestion && (
        <div className="bg-yellow-100 p-3 rounded">
          <strong>Wine tip:</strong> {wineSuggestion}
        </div>
      )}
      {tubeTips(event.borough) && (
        <div className="bg-blue-100 p-3 rounded">
          <strong>Transport tip:</strong> {tubeTips(event.borough)}
        </div>
      )}
      {sunDescriptor && (
        <div className="bg-orange-100 p-3 rounded">
          <strong>Sun check:</strong> {sunDescriptor}
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-2">Guest list ({guests.length}/{event.capacity})</h2>
        {guests.length === 0 && <p>No guests yet.</p>}
        {guests.length > 0 && (
          <ul className="space-y-2">
            {guests.map((g, idx) => (
              <li key={idx} className="border p-2 rounded">
                <div className="flex justify-between">
                  <span>{event.anonymous ? 'Guest #' + (idx+1) : g.name}</span>
                  {event.arrivalSlots && <button onClick={() => handleAddArrivalSlot(g)} className="text-sm text-blue-700 underline">Add arrival slot to calendar</button>}
                </div>
                {g.dietaries.length > 0 && (
                  <div className="text-sm text-gray-700">Diet: {g.dietaries.join(', ')}</div>
                )}
                {g.bottle && (
                  <div className="text-sm text-gray-700">Bottle: {g.bottle}</div>
                )}
                {event.arrivalSlots && g.arrivalIndex !== null && (
                  <div className="text-sm text-gray-700">Arrival at {new Date(new Date(event.date).getTime() + g.arrivalIndex*10*60000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                )}
              </li>
            ))}
          </ul>
        )}
        {event.arrivalSlots && guests.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">Arrival slots are 10 minutes apart.</p>
        )}
      </div>

      <div className="mt-4">
        <h3 className="font-semibold mb-1">Dietary summary</h3>
        <ul>
          {Object.keys(dietaryCounts).map(key => (
            <li key={key} className="text-sm">{key}: {dietaryCounts[key]}</li>
          ))}
        </ul>
      </div>
      <div className="mt-2">
        <h3 className="font-semibold mb-1">Bottle summary</h3>
        <ul>
          {Object.keys(bottleCounts).map(key => (
            <li key={key} className="text-sm">{key}: {bottleCounts[key]}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
