import React, { useState, useEffect } from 'react';

const dietOptions = ['None', 'Vegan', 'Halal', 'Gluten-Free', 'Nut-Free', 'Dairy-Free'];
const bottleOptions = ['Red', 'White', 'Bubbles', 'Rosé', 'Non-Alcoholic'];

function formatDateForICS(date, time) {
  const [month, day, year] = date.split('/');
  let [timePart, ampm] = time.split(' ');
  let [hourStr, minuteStr] = timePart.split(':');
  let hour = parseInt(hourStr, 10);
  if (ampm === 'PM' && hour !== 12) {
    hour += 12;
  }
  if (ampm === 'AM' && hour === 12) {
    hour = 0;
  }
  const hh = hour.toString().padStart(2, '0');
  const mm = minuteStr.padStart(2, '0');
  return year + month.padStart(2,'0') + day.padStart(2,'0') + 'T' + hh + mm + '00';
}

function downloadIcs(form) {
  const dtStart = formatDateForICS(form.date, form.time);
  const dtEnd = dtStart;
  const icsContent =
    'BEGIN:VCALENDAR\n' +
    'VERSION:2.0\n' +
    'BEGIN:VEVENT\n' +
    'DTSTART:' + dtStart + '\n' +
    'DTEND:' + dtEnd + '\n' +
    'SUMMARY:' + form.title + '\n' +
    'LOCATION:' + form.station + '\n' +
    'END:VEVENT\n' +
    'END:VCALENDAR';
  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'event.ics';
  a.click();
}

function addMinutesToTime(time, minutesToAdd) {
  let [timePart, ampm] = time.split(' ');
  let [hourStr, minuteStr] = timePart.split(':');
  let hour = parseInt(hourStr, 10);
  let minute = parseInt(minuteStr, 10);
  if (ampm === 'PM' && hour !== 12) {
    hour += 12;
  }
  if (ampm === 'AM' && hour === 12) {
    hour = 0;
  }
  let totalMinutes = hour * 60 + minute + minutesToAdd;
  totalMinutes = totalMinutes % (24 * 60);
  let newHour = Math.floor(totalMinutes / 60);
  let newMinute = totalMinutes % 60;
  const newAmpm = newHour >= 12 ? 'PM' : 'AM';
  newHour = newHour % 12;
  if (newHour === 0) newHour = 12;
  return newHour.toString().padStart(2, '0') + ':' + newMinute.toString().padStart(2, '0') + ' ' + newAmpm;
}

function RSVPForm({ eventUri, form, isAnonymous, onSubmitted }) {
  const [name, setName] = useState('');
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [bottle, setBottle] = useState('');

  const toggleDiet = (diet) => {
    if (selectedDiets.includes(diet)) {
      setSelectedDiets(selectedDiets.filter(d => d !== diet));
    } else {
      setSelectedDiets([...selectedDiets, diet]);
    }
  };

  const handleSubmit = () => {
    const guest = {
      name: isAnonymous ? '' : name.trim(),
      diets: selectedDiets,
      bottle: bottle,
      slot: form.arrivalSlotsEnabled ? '' : ''
    };
    fetch(eventUri)
      .then(res => res.json())
      .then(data => {
        let guests = data.guests || [];
        let slot = '';
        if (form.arrivalSlotsEnabled) {
          slot = addMinutesToTime(form.time, guests.length * 10);
        }
        const newGuest = { ...guest, slot: slot };
        const updatedGuests = [...guests, newGuest];
        const payload = { event: data.event, guests: updatedGuests };
        return fetch(eventUri, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      })
      .then(() => {
        onSubmitted();
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mt-4">
      {!isAnonymous && (
        <div className="mb-4">
          <label className="block font-semibold mb-1">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded p-2 w-full"
            placeholder="Name"
          />
        </div>
      )}
      <div className="mb-4">
        <label className="block font-semibold mb-1">Dietary restrictions</label>
        <div className="flex flex-wrap gap-2">
          {dietOptions.map((diet) => (
            <button
              key={diet}
              type="button"
              onClick={() => toggleDiet(diet)}
              className={
                (selectedDiets.includes(diet) ? 'bg-green-200' : 'bg-gray-200') +
                ' px-2 py-1 rounded'
              }
            >
              {diet}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Bottle preference</label>
        <div className="flex flex-wrap gap-2">
          {bottleOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setBottle(opt)}
              className={
                (bottle === opt ? 'bg-purple-200' : 'bg-gray-200') +
                ' px-2 py-1 rounded'
              }
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        RSVP
      </button>
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
    capacity: 10,
    arrivalSlotsEnabled: false,
    isAnonymous: false
  });
  const [eventUri, setEventUri] = useState('');
  const [guests, setGuests] = useState([]);
  const [hostLink, setHostLink] = useState('');
  const [rsvpLink, setRsvpLink] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const eventParam = params.get('event');
  const isHost = params.get('host') === '1';
  const isRsvp = params.get('rsvp') === '1';

  useEffect(() => {
    if (eventParam) {
      const decoded = decodeURIComponent(eventParam);
      setEventUri(decoded);
      fetch(decoded)
        .then((res) => res.json())
        .then((data) => {
          if (data.event) setForm(data.event);
          if (data.guests) setGuests(data.guests);
        });
    }
  }, [eventParam]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const setSpice = (level) => {
    setForm((prev) => ({ ...prev, spiceLevel: level }));
  };

  const createEvent = () => {
    const payload = { event: form, guests: [] };
    fetch('https://api.jsonstorage.net/v1/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        const uri = data.uri;
        setEventUri(uri);
        const encoded = encodeURIComponent(uri);
        const base = window.location.origin + window.location.pathname;
        setHostLink(base + '?event=' + encoded + '&host=1');
        setRsvpLink(base + '?event=' + encoded + '&rsvp=1');
        alert('Event created! Copy your links below.');
      });
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link);
    alert('Copied link!');
  };

  if (eventParam && isRsvp) {
    if (submitted) {
      return (
        <div className="max-w-md mx-auto p-4">
          <h2 className="text-xl font-semibold mb-2">Thanks for RSVPing!</h2>
          <p>See you at {form.title}!</p>
        </div>
      );
    }
    return (
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">{form.title}</h1>
        <p className="mb-1">
          <strong>Date:</strong> {form.date}
        </p>
        <p className="mb-1">
          <strong>Time:</strong> {form.time}
        </p>
        <p className="mb-1">
          <strong>Location:</strong> {form.station}
        </p>
        <p className="mb-1">
          <strong>Spice level:</strong>{' '}
          {form.spiceLevel === 0 ? 'Mild' : '🌶'.repeat(form.spiceLevel)}
        </p>
        <RSVPForm
          eventUri={eventUri}
          form={form}
          isAnonymous={form.isAnonymous}
          onSubmitted={() => setSubmitted(true)}
        />
      </div>
    );
  }

  if (eventParam && isHost) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Host Dashboard</h1>
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">{form.title}</h2>
          <p>
            <strong>Date:</strong> {form.date}
          </p>
          <p>
            <strong>Time:</strong> {form.time}
          </p>
          <p>
            <strong>Location:</strong> {form.station}
          </p>
          <p>
            <strong>Cuisine:</strong> {form.cuisine}
          </p>
          <p>
            <strong>Protein:</strong> {form.protein}
          </p>
          <p>
            <strong>Spice level:</strong>{' '}
            {form.spiceLevel === 0 ? 'Mild' : '🌶'.repeat(form.spiceLevel)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">
            Guest List ({guests.length}/{form.capacity})
          </h2>
          <ul className="list-disc pl-5">
            {guests.map((g, index) => (
              <li key={index} className="mb-1">
                {form.isAnonymous
                  ? 'Guest ' + (index + 1)
                  : g.name && g.name !== ''
                  ? g.name
                  : 'Guest ' + (index + 1)}
                {' – '}
                {g.diets && g.diets.length
                  ? g.diets.join(', ')
                  : 'No restrictions'}
                {g.bottle ? ', ' + g.bottle : ''}
                {form.arrivalSlotsEnabled && g.slot
                  ? ', Arrival: ' + g.slot
                  : ''}
              </li>
            ))}
            {guests.length === 0 && <li>No guests yet.</li>}
          </ul>
        </div>
        {rsvpLink && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h2 className="text-lg font-semibold mb-2">Your Links</h2>
            <div className="mb-2">
              <p className="font-semibold">RSVP Link:</p>
              <div className="flex">
                <input
                  className="border rounded-l p-2 flex-grow"
                  readOnly
                  value={rsvpLink}
                />
                <button
                  onClick={() => copyLink(rsvpLink)}
                  className="bg-blue-600 text-white px-2 rounded-r"
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <p className="font-semibold">Host Link:</p>
              <div className="flex">
                <input
                  className="border rounded-l p-2 flex-grow"
                  readOnly
                  value={hostLink}
                />
                <button
                  onClick={() => copyLink(hostLink)}
                  className="bg-blue-600 text-white px-2 rounded-r"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => downloadIcs(form)}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          Add to Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Plan your dinner party</h1>
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="mb-3">
          <label className="block font-semibold mb-1">Event name</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="border rounded p-2 w-full"
            placeholder="Dinner at mine"
          />
        </div>
        <div className="mb-3 flex gap-2">
          <div className="flex-1">
            <label className="block font-semibold mb-1">Date</label>
            <input
              type="text"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="border rounded p-2 w-full"
              placeholder="MM/DD/YYYY"
            />
          </div>
          <div className="flex-1">
            <label className="block font-semibold mb-1">Time</label>
            <input
              type="text"
              name="time"
              value={form.time}
              onChange={handleChange}
              className="border rounded p-2 w-full"
              placeholder="HH:MM AM/PM"
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">
            Nearest tube station
          </label>
          <input
            type="text"
            name="station"
            value={form.station}
            onChange={handleChange}
            className="border rounded p-2 w-full"
            placeholder="e.g. Angel"
          />
        </div>
        <div className="mb-3 flex gap-2">
          <div className="flex-1">
            <label className="block font-semibold mb-1">Cuisine</label>
            <input
              type="text"
              name="cuisine"
              value={form.cuisine}
              onChange={handleChange}
              className="border rounded p-2 w-full"
              placeholder="Italian"
            />
          </div>
          <div className="flex-1">
            <label className="block font-semibold mb-1">Protein</label>
            <input
              type="text"
              name="protein"
              value={form.protein}
              onChange={handleChange}
              className="border rounded p-2 w-full"
              placeholder="Beef"
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Spice level</label>
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSpice(level)}
                className={
                  (form.spiceLevel === level
                    ? 'bg-red-400 text-white'
                    : 'bg-gray-200') + ' px-3 py-1 rounded'
                }
              >
                {level === 0 ? 'Mild' : '🌶'.repeat(level)}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Capacity</label>
          <input
            type="number"
            name="capacity"
            value={form.capacity}
            onChange={handleChange}
            className="border rounded p-2 w-full"
            min="1"
          />
        </div>
        <div className="mb-3">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="arrivalSlotsEnabled"
              checked={form.arrivalSlotsEnabled}
              onChange={handleChange}
              className="mr-2"
            />
            Enable arrival slots
          </label>
        </div>
        <div className="mb-3">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              name="isAnonymous"
              checked={form.isAnonymous}
              onChange={handleChange}
              className="mr-2"
            />
            Anonymous mode
          </label>
        </div>
        <button
          onClick={createEvent}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Create and get links
        </button>
        {hostLink && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Your Links</h2>
            <div className="mb-2">
              <p className="font-semibold">RSVP Link:</p>
              <div className="flex">
                <input
                  className="border rounded-l p-2 flex-grow"
                  readOnly
                  value={rsvpLink}
                />
                <button
                  onClick={() => copyLink(rsvpLink)}
                  className="bg-blue-600 text-white px-2 rounded-r"
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <p className="font-semibold">Host Link:</p>
              <div className="flex">
                <input
                  className="border rounded-l p-2 flex-grow"
                  readOnly
                  value={hostLink}
                />
                <button
                  onClick={() => copyLink(hostLink)}
                  className="bg-blue-600 text-white px-2 rounded-r"
                >
                  Copy
                </button>
              </div>
            </div>
            <button
              onClick={() => downloadIcs(form)}
              className="bg-purple-600 text-white px-4 py-2 rounded mt-4 w-full"
            >
              Add to Calendar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
