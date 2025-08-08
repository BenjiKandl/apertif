import React, { useState, useEffect } from 'react';

function formatDateForICS(dateStr) {
  const date = new Date(dateStr);
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function generateIcs(event) {
  const dtStart = formatDateForICS(event.datetime);
  const dtEnd = formatDateForICS(new Date(new Date(event.datetime).getTime() + (event.leaveAfter || 180) * 60000).toISOString());
  return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.title}
DTSTART:${dtStart}
DTEND:${dtEnd}
LOCATION:${event.borough} ${event.postcode}
DESCRIPTION:Dinner party hosted via Apertif
END:VEVENT
END:VCALENDAR`;
}

function downloadIcs(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

const DIET_OPTIONS = ['Vegetarian','Vegan','Halal','No nuts'];
const BOTTLE_OPTIONS = ['Red','White','Bubbles','Rosé','Non alcoholic'];

export default function App() {
  const [isRsvpPage, setIsRsvpPage] = useState(window.location.search.includes('rsvp=1'));
  const [event, setEvent] = useState({
    title: '',
    datetime: '',
    borough: '',
    postcode: '',
    cuisine: '',
    protein: '',
    spice: '',
    capacity: 10,
    arrivalSlotsEnabled: false,
    arrivalDuration: 10,
    leaveAfter: 180,
    anonymous: false,
  });
  const [guests, setGuests] = useState([]);
  const [guestForm, setGuestForm] = useState({
    name: '',
    dietaries: [],
    bottle: '',
  });

  // compute counts
  const dietCounts = DIET_OPTIONS.reduce((acc,opt) => ({...acc,[opt]: guests.filter(g=>g.dietaries.includes(opt)).length}),{});
  const bottleCounts = BOTTLE_OPTIONS.reduce((acc,opt) => ({...acc,[opt]: guests.filter(g=>g.bottle===opt).length}),{});
  const arrivalsUsed = guests.length;
  // assign arrival slot for new guest (minutes from start)
  const nextArrivalSlot = event.arrivalSlotsEnabled ? arrivalsUsed * event.arrivalDuration : null;

  const handleEventChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEvent(prev => ({ ...prev, [name]: type==='checkbox' ? checked : value }));
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?rsvp=1`;
    navigator.clipboard.writeText(url);
    alert('RSVP link copied to clipboard!');
  };

  const handleAddCalendar = () => {
    const ics = generateIcs(event);
    downloadIcs('apertif-event.ics', ics);
  };

  const handleGuestFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'dietaries') {
      const opt = value;
      setGuestForm(prev => {
        const current = prev.dietaries;
        return {
          ...prev,
          dietaries: checked ? [...current,opt] : current.filter(d=>d!==opt)
        };
      });
    } else {
      setGuestForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRsvpSubmit = (e) => {
    e.preventDefault();
    const arrival = event.arrivalSlotsEnabled ? nextArrivalSlot : null;
    setGuests(prev => [...prev, { ...guestForm, arrival } ]);
    setGuestForm({ name:'', dietaries: [], bottle: '' });
    alert('RSVP submitted!');
  };

  const renderGuest = (guest,index) => (
    <li key={index} className="border p-2 my-1 rounded">
      <div><strong>Name:</strong> {event.anonymous ? 'Anonymous' : guest.name || 'Anonymous'}</div>
      <div><strong>Dietaries:</strong> {guest.dietaries.join(', ') || 'None'}</div>
      <div><strong>Bottle:</strong> {guest.bottle || 'None'}</div>
      {event.arrivalSlotsEnabled && (
        <div><strong>Arrival:</strong> {guest.arrival !== null ? `${guest.arrival}-${guest.arrival + event.arrivalDuration} mins` : 'N/A'}</div>
      )}
    </li>
  );

  const sunMessage = () => {
    if (!event.datetime) return '';
    const hours = new Date(event.datetime).getHours();
    if (hours < 6) return 'It will be dark at this time.';
    if (hours < 12) return 'Expect a bright morning.';
    if (hours < 18) return 'Golden hour vibes.';
    return 'It will likely be dusk or dark.';
  };

  if (isRsvpPage) {
    return (
      <div className="p-4 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">RSVP for {event.title || 'Dinner Party'}</h1>
        <form onSubmit={handleRsvpSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Your name (optional)</label>
            <input type="text" name="name" value={guestForm.name} onChange={handleGuestFormChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <div className="mb-1">Dietary restrictions</div>
            {DIET_OPTIONS.map(opt => (
              <label key={opt} className="inline-flex items-center mr-3">
                <input type="checkbox" name="dietaries" value={opt} checked={guestForm.dietaries.includes(opt)} onChange={handleGuestFormChange} className="mr-1" />
                {opt}
              </label>
            ))}
          </div>
          <div>
            <label className="block mb-1">Bottle you'll bring</label>
            <select name="bottle" value={guestForm.bottle} onChange={handleGuestFormChange} className="w-full border p-2 rounded">
              <option value="">--Select--</option>
              {BOTTLE_OPTIONS.map(opt=>(
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          {event.arrivalSlotsEnabled && (
            <div className="p-2 bg-gray-100 rounded">
              Your arrival slot: {nextArrivalSlot}-{nextArrivalSlot + event.arrivalDuration} mins
            </div>
          )}
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Submit RSVP</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Apertif Dinner Party</h1>
      <form className="space-y-4">
        <div>
          <label className="block mb-1">Event title</label>
          <input type="text" name="title" value={event.title} onChange={handleEventChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block mb-1">Date & time</label>
          <input type="datetime-local" name="datetime" value={event.datetime} onChange={handleEventChange} className="w-full border p-2 rounded" />
        </div>
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className="block mb-1">Borough</label>
            <input type="text" name="borough" value={event.borough} onChange={handleEventChange} className="w-full border p-2 rounded" />
          </div>
          <div className="flex-1">
            <label className="block mb-1">Postcode</label>
            <input type="text" name="postcode" value={event.postcode} onChange={handleEventChange} className="w-full border p-2 rounded" />
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className="block mb-1">Cuisine</label>
            <input type="text" name="cuisine" value={event.cuisine} onChange={handleEventChange} className="w-full border p-2 rounded" />
          </div>
          <div className="flex-1">
            <label className="block mb-1">Protein</label>
            <input type="text" name="protein" value={event.protein} onChange={handleEventChange} className="w-full border p-2 rounded" />
          </div>
          <div className="flex-1">
            <label className="block mb-1">Spice level</label>
            <input type="text" name="spice" value={event.spice} onChange={handleEventChange} className="w-full border p-2 rounded" />
          </div>
        </div>
        <div>
          <label className="block mb-1">Capacity</label>
          <input type="number" name="capacity" value={event.capacity} onChange={handleEventChange} className="w-full border p-2 rounded" />
        </div>
        <div className="flex items-center">
          <input type="checkbox" id="arrivalSlotsEnabled" name="arrivalSlotsEnabled" checked={event.arrivalSlotsEnabled} onChange={handleEventChange} className="mr-2" />
          <label htmlFor="arrivalSlotsEnabled">Enable arrival slots</label>
        </div>
        {event.arrivalSlotsEnabled && (
          <div>
            <label className="block mb-1">Slot duration (minutes)</label>
            <input type="number" name="arrivalDuration" value={event.arrivalDuration} onChange={handleEventChange} className="w-full border p-2 rounded" />
          </div>
        )}
        <div className="flex items-center">
          <input type="checkbox" id="anonymous" name="anonymous" checked={event.anonymous} onChange={handleEventChange} className="mr-2" />
          <label htmlFor="anonymous">Hide guest names</label>
        </div>
        <div>
          <label className="block mb-1">Leave after (minutes)</label>
          <input type="number" name="leaveAfter" value={event.leaveAfter} onChange={handleEventChange} className="w-full border p-2 rounded" />
        </div>
        <div className="text-sm italic">{sunMessage()}</div>
      </form>
      <div className="my-4 space-y-2">
        <button onClick={handleCopyLink} className="bg-green-600 text-white px-4 py-2 rounded">Copy RSVP link</button>
        <button onClick={handleAddCalendar} className="bg-purple-600 text-white px-4 py-2 rounded ml-2">Add to calendar</button>
      </div>
      <div>
        <h2 className="text-xl font-bold mt-4 mb-2">Guest list ({guests.length}/{event.capacity})</h2>
        <ul>
          {guests.map((g,i) => renderGuest(g,i))}
        </ul>
        <div className="mt-4 text-sm">
          <strong>Dietary counts:</strong> {DIET_OPTIONS.map(opt=>`${opt}:${dietCounts[opt]}`).join(' | ')}
        </div>
        <div className="mt-1 text-sm">
          <strong>Bottle counts:</strong> {BOTTLE_OPTIONS.map(opt=>`${opt}:${bottleCounts[opt]}`).join(' | ')}
        </div>
        {event.arrivalSlotsEnabled && (
          <div className="mt-1 text-sm"><strong>Next arrival slot:</strong> {nextArrivalSlot}-{nextArrivalSlot + event.arrivalDuration} mins</div>
        )}
        {event.borough && (
          <div className="mt-2">
            <a href={`https://citymapper.com/directions?endcoord=&endlocation=${encodeURIComponent(event.borough + ' ' + event.postcode)}`} className="text-blue-600 underline" target="_blank">Open in Citymapper</a> |
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.borough + ' ' + event.postcode)}`} className="text-blue-600 underline ml-1" target="_blank">Open in Google Maps</a>
          </div>
        )}
      </div>
    </div>
  );
}
